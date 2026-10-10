import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Server actions read the session cookie and revalidate Next's cache —
// neither exists outside a request, so both are stubbed.
const session = vi.hoisted(() => ({ user: null as null | Record<string, unknown> }))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('@/lib/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/session')>()),
  getCurrentUser: async () => session.user,
}))

import { db } from '@/lib/db'
import { registerParticipant } from '@/lib/actions'
import { createTeam, disbandTeam, inviteMember, leaveTeam, removeMember, respondToInvite, setMemberRole } from '@/lib/team-actions'
import { startCompetition, recordResult } from '@/lib/competition/lifecycle'
import { awardTournamentPoints } from '@/lib/points/award'
import { finalPoints } from '@/lib/points/score'
import { createTournament, createUser, hasTestDb } from './fixtures'

type User = Awaited<ReturnType<typeof createUser>>
const actAs = (user: User) => {
  session.user = { ...user }
}

async function teamWith(owner: User, members: User[], sport = 'Valorant') {
  actAs(owner)
  const created = await createTeam({ name: `Team ${Math.random().toString(36).slice(2, 8)}`, sport, category: 'esports' })
  if (!created.ok) throw new Error(created.error)
  const teamId = created.data.teamId
  for (const member of members) {
    actAs(owner)
    const invited = await inviteMember({ teamId, userQuery: member.username })
    if (!invited.ok) throw new Error(invited.error)
    const invite = await db.teamInvite.findFirstOrThrow({ where: { teamId, invitedUserId: member.id, status: 'PENDING' } })
    actAs(member)
    const accepted = await respondToInvite({ inviteId: invite.id, accept: true })
    if (!accepted.ok) throw new Error(accepted.error)
  }
  return teamId
}

const channelMembers = async (teamId: string) =>
  (await db.channelMember.findMany({ where: { channel: { teamId } }, select: { userId: true } })).map((m) => m.userId).sort()

describe.skipIf(!hasTestDb)('teams (MySQL)', () => {
  beforeEach(() => {
    session.user = null
  })
  afterAll(() => db.$disconnect())

  it('lets one user own several independent teams, each with its own group', async () => {
    const owner = await createUser()
    const a = await teamWith(owner, [], 'Football')
    const b = await teamWith(owner, [], 'Valorant')
    expect(a).not.toBe(b)
    expect(await channelMembers(a)).toEqual([owner.id])
    expect(await channelMembers(b)).toEqual([owner.id])
    expect(await db.channel.count({ where: { teamId: { in: [a, b] }, type: 'TEAM' } })).toBe(2)
  })

  it('keeps the team group in step with membership', async () => {
    const [owner, alice, bob] = [await createUser(), await createUser(), await createUser()]
    const teamId = await teamWith(owner, [alice, bob])
    expect(await channelMembers(teamId)).toEqual([owner.id, alice.id, bob.id].sort())

    actAs(owner)
    expect((await removeMember({ teamId, userId: bob.id })).ok).toBe(true)
    actAs(alice)
    expect((await leaveTeam(teamId)).ok).toBe(true)
    expect(await channelMembers(teamId)).toEqual([owner.id])
  })

  it('rejects duplicate invites, owner-only actions by members, and joining twice', async () => {
    const [owner, alice, carol] = [await createUser(), await createUser(), await createUser()]
    const teamId = await teamWith(owner, [alice])

    actAs(owner)
    expect((await inviteMember({ teamId, userQuery: alice.username })).ok).toBe(false)
    expect((await inviteMember({ teamId, userQuery: carol.username })).ok).toBe(true)
    expect((await inviteMember({ teamId, userQuery: carol.username })).ok).toBe(false)

    actAs(alice)
    expect((await setMemberRole({ teamId, userId: alice.id, role: 'CAPTAIN' })).ok).toBe(false)
    expect((await removeMember({ teamId, userId: owner.id })).ok).toBe(false)
    expect((await disbandTeam(teamId)).ok).toBe(false)
    expect((await inviteMember({ teamId, userQuery: carol.username })).ok).toBe(false)

    // A stranger cannot answer someone else's invite.
    const invite = await db.teamInvite.findFirstOrThrow({ where: { teamId, invitedUserId: carol.id } })
    expect((await respondToInvite({ inviteId: invite.id, accept: true })).ok).toBe(false)
  })

  it('registers a team with a roster, one team per player per tournament', async () => {
    const [owner, alice, bob] = [await createUser(), await createUser(), await createUser()]
    const teamA = await teamWith(owner, [alice])
    const teamB = await teamWith(bob, [alice])
    const { tournament } = await createTournament({ participantType: 'TEAM', sport: 'Valorant', category: 'esports' })
    await db.tournament.update({ where: { id: tournament.id }, data: { teamSize: 2, teamSizeMax: 2 } })

    actAs(owner)
    const tooSmall = await registerParticipant({ tournamentId: tournament.id, teamId: teamA, rosterUserIds: [owner.id] })
    expect(tooSmall.ok).toBe(false)
    const ok = await registerParticipant({ tournamentId: tournament.id, teamId: teamA, rosterUserIds: [owner.id, alice.id] })
    expect(ok.ok).toBe(true)

    actAs(bob)
    const clash = await registerParticipant({ tournamentId: tournament.id, teamId: teamB, rosterUserIds: [bob.id, alice.id] })
    expect(clash.ok).toBe(false)

    // Individual registration is refused for team events without a team.
    expect((await registerParticipant({ tournamentId: tournament.id })).ok).toBe(false)
  })

  it('scores every rostered player once, keeps history after disbanding, and locks the roster while playing', async () => {
    const [o1, a1, o2, a2] = [await createUser(), await createUser(), await createUser(), await createUser()]
    const t1 = await teamWith(o1, [a1])
    const t2 = await teamWith(o2, [a2])
    const { tournament, owner } = await createTournament({ participantType: 'TEAM', sport: 'Valorant', category: 'esports' })
    await db.tournament.update({ where: { id: tournament.id }, data: { teamSize: 2 } })

    actAs(o1)
    expect((await registerParticipant({ tournamentId: tournament.id, teamId: t1, rosterUserIds: [o1.id, a1.id] })).ok).toBe(true)
    actAs(o2)
    expect((await registerParticipant({ tournamentId: tournament.id, teamId: t2, rosterUserIds: [o2.id, a2.id] })).ok).toBe(true)
    await db.participant.updateMany({ where: { tournamentId: tournament.id }, data: { status: 'approved', paymentStatus: 'paid' } })
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id)

    // Mid-tournament: a rostered player can neither leave nor be removed.
    actAs(a1)
    expect((await leaveTeam(t1)).ok).toBe(false)
    actAs(o1)
    expect((await removeMember({ teamId: t1, userId: a1.id })).ok).toBe(false)
    expect((await disbandTeam(t1)).ok).toBe(false)

    const final = await db.match.findFirstOrThrow({ where: { tournamentId: tournament.id } })
    const t1Participant = await db.participant.findFirstOrThrow({ where: { tournamentId: tournament.id, teamId: t1 } })
    const t1Home = final.homeParticipantId === t1Participant.id
    await recordResult({ matchId: final.id, homeScore: t1Home ? 13 : 7, awayScore: t1Home ? 7 : 13, forfeit: null }, owner.id)
    await awardTournamentPoints(tournament.id, 'FINALIZED', owner.id)

    const awards = await db.pointAward.findMany({ where: { tournamentId: tournament.id } })
    const byUser = new Map(awards.map((a) => [a.userId, a.points]))
    expect(awards).toHaveLength(4)
    expect(byUser.get(o1.id)).toBe(finalPoints(100, 2))
    expect(byUser.get(a1.id)).toBe(finalPoints(100, 2))
    expect(byUser.get(o2.id)).toBe(finalPoints(70, 2))

    // Tournament over → the team can be disbanded; results and points stay.
    actAs(o1)
    expect((await disbandTeam(t1)).ok).toBe(true)
    expect(await db.participant.count({ where: { teamId: t1 } })).toBe(1)
    expect(await db.pointAward.count({ where: { tournamentId: tournament.id } })).toBe(4)
    expect((await db.channel.findFirstOrThrow({ where: { teamId: t1 } })).archived).toBe(true)
  })
})
