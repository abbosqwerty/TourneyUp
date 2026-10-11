import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const session = vi.hoisted(() => ({ user: null as null | Record<string, unknown> }))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('@/lib/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/session')>()),
  getCurrentUser: async () => session.user,
}))

import { db } from '@/lib/db'
import { registerParticipant, setTournamentStatus, updateParticipantStatus } from '@/lib/actions'
import { postToChannel, subscribeToChannel } from '@/lib/channel-actions'
import { ensureTournamentChannel, getChannelAccess } from '@/lib/channels'
import { createTicket, replyToTicket } from '@/lib/support-actions'
import { getTicketAccess, listStaffQueue } from '@/lib/support'
import { createTournament, createUser, hasTestDb } from './fixtures'

type User = Awaited<ReturnType<typeof createUser>>
const actAs = (user: User) => {
  session.user = { ...user }
}

async function openTournament() {
  const setup = await createTournament({})
  await ensureTournamentChannel(setup.tournament.id)
  const channel = await db.channel.findUniqueOrThrow({ where: { tournamentId: setup.tournament.id } })
  return { ...setup, channelId: channel.id }
}

describe.skipIf(!hasTestDb)('messages (MySQL)', () => {
  beforeEach(() => {
    session.user = null
  })
  afterAll(() => db.$disconnect())

  it('adds players to the tournament group on approval, not on registration', async () => {
    const { tournament, owner, channelId } = await openTournament()
    const player = await createUser()

    actAs(player)
    expect((await registerParticipant({ tournamentId: tournament.id })).ok).toBe(true)
    expect((await getChannelAccess(channelId, player.id)).canRead).toBe(false)

    const participant = await db.participant.findFirstOrThrow({ where: { tournamentId: tournament.id, userId: player.id } })
    actAs(owner)
    expect((await updateParticipantStatus({ participantId: participant.id, status: 'approved' })).ok).toBe(true)

    const access = await getChannelAccess(channelId, player.id)
    expect(access.canRead).toBe(true)
    expect(access.canPost).toBe(true)
    expect(access.canAnnounce).toBe(false)

    actAs(owner)
    expect((await updateParticipantStatus({ participantId: participant.id, status: 'rejected' })).ok).toBe(true)
    expect((await getChannelAccess(channelId, player.id)).canRead).toBe(false)
  })

  it('keeps private groups private: no self-join, no posting from outside', async () => {
    const { channelId } = await openTournament()
    const stranger = await createUser()
    actAs(stranger)
    expect((await subscribeToChannel(channelId)).ok).toBe(false)
    expect((await postToChannel({ channelId, content: 'salom' })).ok).toBe(false)
    expect(await db.channelMember.count({ where: { channelId, userId: stranger.id } })).toBe(0)
  })

  it('lets only the organizer side publish announcements', async () => {
    const { tournament, owner, channelId, players } = await (async () => {
      const setup = await createTournament({ participants: 2 })
      await ensureTournamentChannel(setup.tournament.id)
      const channel = await db.channel.findUniqueOrThrow({ where: { tournamentId: setup.tournament.id } })
      return { ...setup, channelId: channel.id }
    })()
    actAs(owner)
    // Starting the tournament syncs the group with the drawn line-up.
    expect((await setTournamentStatus({ tournamentId: tournament.id, status: 'ongoing' })).ok).toBe(true)

    actAs(players[0].user)
    expect((await postToChannel({ channelId, content: 'Biz tayyormiz', announce: true })).ok).toBe(true)
    actAs(owner)
    expect((await postToChannel({ channelId, content: 'Final soat 18:00 da', announce: true })).ok).toBe(true)

    const posts = await db.channelPost.findMany({ where: { channelId }, orderBy: { createdAt: 'asc' } })
    const kinds = posts.map((p) => [p.content, p.kind])
    expect(kinds).toContainEqual(['Biz tayyormiz', 'MESSAGE'])
    expect(kinds).toContainEqual(['Final soat 18:00 da', 'ANNOUNCEMENT'])
    expect(posts.some((p) => p.kind === 'SYSTEM')).toBe(true)
  })

  it('routes tournament support to that tournament’s staff only, and platform support to admins', async () => {
    const { tournament, owner } = await openTournament()
    const [player, supportStaff, otherUser, admin] = [
      await createUser(),
      await createUser(),
      await createUser(),
      await createUser({ role: 'SUPER_ADMIN' }),
    ]
    await db.tournamentStaff.create({ data: { tournamentId: tournament.id, userId: supportStaff.id, role: 'SUPPORT' } })

    actAs(player)
    const t = await createTicket({
      scope: 'TOURNAMENT',
      tournamentId: tournament.id,
      category: 'TOURNAMENT_ISSUE',
      subject: 'Jadval savoli',
      content: 'Chorak final qachon bo‘ladi?',
    })
    expect(t.ok).toBe(true)
    const ticketId = t.ok ? t.data.ticketId : ''

    expect((await getTicketAccess(ticketId, supportStaff.id)).isStaff).toBe(true)
    expect((await getTicketAccess(ticketId, owner.id)).isStaff).toBe(true)
    expect((await getTicketAccess(ticketId, otherUser.id)).canRead).toBe(false)
    expect((await listStaffQueue(supportStaff.id, 'USER')).some((x) => x.id === ticketId)).toBe(true)

    actAs(supportStaff)
    expect((await replyToTicket({ ticketId, content: 'Ertaga 15:00 da' })).ok).toBe(true)
    const reply = await db.supportMessage.findFirstOrThrow({ where: { ticketId, authorId: supportStaff.id } })
    expect(reply.isStaff).toBe(true)

    // Once the support grant is gone, the desk is gone too.
    await db.tournamentStaff.updateMany({ where: { tournamentId: tournament.id }, data: { revokedAt: new Date() } })
    expect((await getTicketAccess(ticketId, supportStaff.id)).canRead).toBe(false)

    actAs(player)
    const p = await createTicket({ scope: 'PLATFORM', category: 'ACCOUNT', subject: 'Parol', content: 'Parolni tiklay olmayapman' })
    const platformId = p.ok ? p.data.ticketId : ''
    expect((await getTicketAccess(platformId, admin.id)).isStaff).toBe(true)
    expect((await getTicketAccess(platformId, owner.id)).canRead).toBe(false)
  })

  it('closes tournament support when the tournament is cancelled', async () => {
    const { tournament, owner } = await openTournament()
    const player = await createUser()
    actAs(player)
    const t = await createTicket({
      scope: 'TOURNAMENT',
      tournamentId: tournament.id,
      category: 'OTHER',
      subject: 'Savol bor',
      content: 'Turnir qayerda o‘tadi?',
    })
    actAs(owner)
    await setTournamentStatus({ tournamentId: tournament.id, status: 'cancelled' })
    const ticket = await db.supportTicket.findUniqueOrThrow({ where: { id: t.ok ? t.data.ticketId : '' } })
    expect(ticket.status).toBe('CLOSED')

    actAs(player)
    const late = await createTicket({
      scope: 'TOURNAMENT',
      tournamentId: tournament.id,
      category: 'OTHER',
      subject: 'Yana savol',
      content: 'Bekor qilingan turnirga savol',
    })
    expect(late.ok).toBe(false)
  })
})
