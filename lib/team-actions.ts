'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from './db'
import { getCurrentUser } from './session'
import {
  fieldErrors,
  inviteMemberSchema,
  respondInviteSchema,
  setTeamRoleSchema,
  teamFieldsSchema,
  teamMemberSchema,
  updateTeamSchema,
} from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { guard, minutes } from './rate-limit'
import { notify } from './notifications'
import { slugify, syncTeamChannel, syncTournamentChannel } from './channels'
import {
  activeRegistrations,
  getTeamAbility,
  INVITE_TTL_DAYS,
  lockedRosterUserIds,
  MAX_OWNED_TEAMS,
  MAX_TEAM_MEMBERS,
} from './teams'

/**
 * Team management. Every rule is checked here, on the server: the UI only
 * hides buttons. Membership changes and the team's message group are updated
 * in one transaction (`syncTeamChannel`), so chat access always matches the
 * roster.
 */

function revalidateTeam(teamId?: string) {
  revalidatePath('/teams')
  revalidatePath('/messages')
  if (teamId) revalidatePath(`/teams/${teamId}`)
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

const NAME_TAKEN = { name: 'Sizda shu nomli jamoa allaqachon bor' }

export async function createTeam(input: unknown): Promise<ActionResult<{ teamId: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')
  if (user.role !== 'USER') return fail('Jamoalarni faqat o‘yinchi akkauntlari yaratadi')

  const limited = guard(`create-team:${user.id}`, 10, minutes(60))
  if (limited) return limited

  const parsed = teamFieldsSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))
  const data = parsed.data

  try {
    const owned = await db.team.count({ where: { ownerId: user.id, disbandedAt: null } })
    if (owned >= MAX_OWNED_TEAMS) return fail(`Ko‘pi bilan ${MAX_OWNED_TEAMS} ta faol jamoaga egalik qilish mumkin`)

    const team = await db.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: data.name,
          slug: `${slugify(data.name).slice(0, 40) || 'team'}-${randomBytes(3).toString('hex')}`,
          sport: data.sport,
          category: data.category,
          description: data.description || null,
          logoMediaId: data.logoMediaId || null,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
        select: { id: true },
      })
      await syncTeamChannel(created.id, tx)
      return created
    })

    revalidateTeam(team.id)
    return succeedWith({ teamId: team.id })
  } catch (error) {
    if (isUniqueViolation(error)) return fail('Bu nom band', NAME_TAKEN)
    console.error('createTeam failed', error)
    return fail('Jamoa yaratishda xatolik')
  }
}

export async function updateTeam(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = updateTeamSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))
  const { teamId, ...data } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canEdit) return fail('Jamoani tahrirlash huquqingiz yo‘q')

  try {
    const team = await db.team.findUniqueOrThrow({ where: { id: teamId }, select: { sport: true } })
    // A team registered somewhere keeps its game until those tournaments end.
    if (team.sport !== data.sport && (await activeRegistrations(teamId)).length > 0) {
      return fail('Jamoa faol turnirda — o‘yin turini o‘zgartirib bo‘lmaydi', { sport: 'Faol ro‘yxat bor' })
    }

    await db.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: {
          name: data.name,
          sport: data.sport,
          category: data.category,
          description: data.description || null,
          ...(data.logoMediaId ? { logoMediaId: data.logoMediaId } : {}),
        },
      })
      await syncTeamChannel(teamId, tx)
    })

    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    if (isUniqueViolation(error)) return fail('Bu nom band', NAME_TAKEN)
    console.error('updateTeam failed', error)
    return fail('Saqlashda xatolik')
  }
}

export async function inviteMember(input: unknown): Promise<ActionResult<{ name: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = inviteMemberSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))
  const { teamId, userQuery } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canInvite) return fail('Taklif yuborish huquqingiz yo‘q')

  const limited = guard(`team-invite:${user.id}`, 40, minutes(60))
  if (limited) return limited

  try {
    const lookup = userQuery.trim().replace(/^@/, '').toLowerCase()
    const target = await db.user.findFirst({
      where: { OR: [{ username: lookup }, { email: lookup }] },
      select: { id: true, name: true, role: true },
    })
    if (!target) return fail('Foydalanuvchi topilmadi', { userQuery: 'Username yoki email topilmadi' })
    if (target.role !== 'USER') return fail('Faqat o‘yinchilarni taklif qilish mumkin', { userQuery: 'Bu akkaunt o‘yinchi emas' })

    const [membership, pending, team, memberCount] = await Promise.all([
      db.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: target.id } }, select: { leftAt: true } }),
      db.teamInvite.findFirst({
        where: { teamId, invitedUserId: target.id, status: 'PENDING', expiresAt: { gt: new Date() } },
        select: { id: true },
      }),
      db.team.findUniqueOrThrow({ where: { id: teamId }, select: { name: true } }),
      db.teamMember.count({ where: { teamId, leftAt: null } }),
    ])
    if (membership && !membership.leftAt) return fail('Bu foydalanuvchi allaqachon jamoada', { userQuery: 'Allaqachon a’zo' })
    if (pending) return fail('Taklif allaqachon yuborilgan', { userQuery: 'Javob kutilmoqda' })
    if (memberCount >= MAX_TEAM_MEMBERS) return fail(`Jamoada ko‘pi bilan ${MAX_TEAM_MEMBERS} a’zo bo‘ladi`)

    await db.teamInvite.create({
      data: {
        teamId,
        invitedUserId: target.id,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    })
    await notify({
      userId: target.id,
      type: 'TEAM_INVITE',
      title: 'Jamoaga taklif',
      body: `${user.name} sizni “${team.name}” jamoasiga taklif qildi.`,
      link: '/teams',
    })

    revalidateTeam(teamId)
    return succeedWith({ name: target.name })
  } catch (error) {
    console.error('inviteMember failed', error)
    return fail('Taklif yuborishda xatolik')
  }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const invite = await db.teamInvite.findUnique({ where: { id: inviteId }, select: { teamId: true, status: true } })
  if (!invite) return fail('Taklif topilmadi')
  const ability = await getTeamAbility(user.id, invite.teamId)
  if (!ability.canInvite) return fail('Huquqingiz yo‘q')
  if (invite.status !== 'PENDING') return fail('Bu taklif allaqachon yopilgan')

  await db.teamInvite.update({ where: { id: inviteId }, data: { status: 'REVOKED', respondedAt: new Date() } })
  revalidateTeam(invite.teamId)
  return { ok: true }
}

/** Only the invited user can answer; joining and the chat access happen together. */
export async function respondToInvite(input: unknown): Promise<ActionResult<{ teamId: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = respondInviteSchema.safeParse(input)
  if (!parsed.success) return fail('So‘rov noto‘g‘ri')
  const { inviteId, accept } = parsed.data

  try {
    const result = await db.$transaction(async (tx) => {
      const invite = await tx.teamInvite.findUnique({
        where: { id: inviteId },
        select: {
          invitedUserId: true,
          status: true,
          expiresAt: true,
          teamId: true,
          invitedById: true,
          team: { select: { name: true, disbandedAt: true } },
        },
      })
      if (!invite || invite.invitedUserId !== user.id) return fail('Taklif topilmadi')
      if (invite.status !== 'PENDING') return fail('Bu taklif allaqachon yopilgan')
      if (invite.expiresAt < new Date()) {
        await tx.teamInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } })
        return fail('Taklif muddati tugagan')
      }
      if (invite.team.disbandedAt) return fail('Jamoa tarqatilgan')

      await tx.teamInvite.update({
        where: { id: inviteId },
        data: { status: accept ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() },
      })
      if (!accept) return succeedWith({ teamId: invite.teamId })

      const count = await tx.teamMember.count({ where: { teamId: invite.teamId, leftAt: null } })
      if (count >= MAX_TEAM_MEMBERS) return fail('Jamoa to‘lgan')

      // A former member who rejoins gets their old row back as a plain member.
      await tx.teamMember.upsert({
        where: { teamId_userId: { teamId: invite.teamId, userId: user.id } },
        update: { leftAt: null, role: 'MEMBER', joinedAt: new Date() },
        create: { teamId: invite.teamId, userId: user.id, role: 'MEMBER' },
      })
      await syncTeamChannel(invite.teamId, tx)

      if (invite.invitedById) {
        await notify({
          userId: invite.invitedById,
          type: 'TEAM_MEMBERSHIP',
          title: 'Taklif qabul qilindi',
          body: `${user.name} “${invite.team.name}” jamoasiga qo‘shildi.`,
          link: `/teams/${invite.teamId}`,
        })
      }
      return succeedWith({ teamId: invite.teamId })
    })

    if (result.ok) revalidateTeam(result.data.teamId)
    return result
  } catch (error) {
    console.error('respondToInvite failed', error)
    return fail('Javob berishda xatolik')
  }
}

async function endMembership(teamId: string, userId: string) {
  const openRegistrations = await db.participant.findMany({
    where: { teamId, roster: { some: { userId } }, tournament: { drawGeneratedAt: null } },
    select: { tournamentId: true },
  })
  await db.$transaction(async (tx) => {
    await tx.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { leftAt: new Date(), role: 'MEMBER' },
    })
    // Pending (not yet drawn) rosters drop the player; started ones are frozen.
    await tx.participantRosterMember.deleteMany({
      where: { userId, participant: { teamId, tournament: { drawGeneratedAt: null } } },
    })
    await syncTeamChannel(teamId, tx)
  })
  // Dropped from a pending roster → out of that tournament's group too.
  for (const r of openRegistrations) await syncTournamentChannel(r.tournamentId)
}

export async function removeMember(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = teamMemberSchema.safeParse(input)
  if (!parsed.success) return fail('So‘rov noto‘g‘ri')
  const { teamId, userId } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canRemoveMembers) return fail('A’zolarni chiqarish huquqingiz yo‘q')
  if (userId === user.id) return fail('O‘zingizni chiqarish uchun “Jamoadan chiqish”ni bosing')

  try {
    const target = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true, leftAt: true, user: { select: { name: true } } },
    })
    if (!target || target.leftAt) return fail('Bu foydalanuvchi jamoada emas')
    if (target.role === 'OWNER') return fail('Jamoa egasini chiqarib bo‘lmaydi')
    if (target.role === 'CAPTAIN' && ability.role !== 'OWNER') return fail('Kapitanni faqat jamoa egasi chiqaradi')
    if ((await lockedRosterUserIds(teamId)).has(userId)) {
      return fail('Bu o‘yinchi davom etayotgan turnir tarkibida — turnir tugaguncha chiqarib bo‘lmaydi')
    }

    await endMembership(teamId, userId)
    const team = await db.team.findUniqueOrThrow({ where: { id: teamId }, select: { name: true } })
    await notify({
      userId,
      type: 'TEAM_MEMBERSHIP',
      title: 'Jamoadan chiqarildingiz',
      body: `Siz “${team.name}” jamoasidan chiqarildingiz.`,
      link: '/teams',
    })

    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('removeMember failed', error)
    return fail('Chiqarishda xatolik')
  }
}

export async function leaveTeam(teamId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.isMember) return fail('Siz bu jamoada emassiz')
  if (ability.role === 'OWNER') return fail('Egasi jamoadan chiqishdan oldin egalikni boshqaga o‘tkazishi yoki jamoani tarqatishi kerak')
  if ((await lockedRosterUserIds(teamId)).has(user.id)) {
    return fail('Siz davom etayotgan turnir tarkibidasiz — turnir tugaguncha chiqib bo‘lmaydi')
  }

  try {
    await endMembership(teamId, user.id)
    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('leaveTeam failed', error)
    return fail('Chiqishda xatolik')
  }
}

export async function setMemberRole(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = setTeamRoleSchema.safeParse(input)
  if (!parsed.success) return fail('So‘rov noto‘g‘ri')
  const { teamId, userId, role } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canManageRoles) return fail('Rollarni faqat jamoa egasi boshqaradi')

  try {
    const target = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true, leftAt: true },
    })
    if (!target || target.leftAt) return fail('Bu foydalanuvchi jamoada emas')
    if (target.role === 'OWNER') return fail('Egasining rolini bu yerda o‘zgartirib bo‘lmaydi — egalikni o‘tkazing')

    await db.$transaction(async (tx) => {
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId } }, data: { role } })
      await syncTeamChannel(teamId, tx)
    })
    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('setMemberRole failed', error)
    return fail('Rolni saqlashda xatolik')
  }
}

export async function transferOwnership(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = teamMemberSchema.safeParse(input)
  if (!parsed.success) return fail('So‘rov noto‘g‘ri')
  const { teamId, userId } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canTransfer) return fail('Egalikni faqat jamoa egasi o‘tkazadi')
  if (userId === user.id) return fail('Siz allaqachon egasiz')

  try {
    const target = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { leftAt: true, user: { select: { name: true } } },
    })
    if (!target || target.leftAt) return fail('Yangi ega jamoa a’zosi bo‘lishi kerak')

    const team = await db.$transaction(async (tx) => {
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId: user.id } }, data: { role: 'CAPTAIN' } })
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId } }, data: { role: 'OWNER' } })
      const updated = await tx.team.update({ where: { id: teamId }, data: { ownerId: userId }, select: { name: true } })
      await syncTeamChannel(teamId, tx)
      return updated
    })

    await notify({
      userId,
      type: 'TEAM_MEMBERSHIP',
      title: 'Siz jamoa egasisiz',
      body: `${user.name} “${team.name}” jamoasi egaligini sizga o‘tkazdi.`,
      link: `/teams/${teamId}`,
    })
    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    if (isUniqueViolation(error)) return fail('Yangi egada shu nomli boshqa jamoa bor')
    console.error('transferOwnership failed', error)
    return fail('Egalikni o‘tkazishda xatolik')
  }
}

/**
 * Disbanding hides the team and archives its group, but deletes nothing:
 * past registrations, results and points still point at it.
 */
export async function disbandTeam(teamId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canDisband) return fail('Jamoani faqat egasi tarqatadi')

  try {
    const active = await activeRegistrations(teamId)
    if (active.length > 0) {
      return fail(
        `Jamoa ${active.length} ta faol turnirda (${active.map((r) => r.tournament.title).join(', ')}). Avval ro‘yxatdan chiqing yoki turnir tugashini kuting.`
      )
    }

    await db.$transaction(async (tx) => {
      await tx.team.update({ where: { id: teamId }, data: { disbandedAt: new Date() } })
      await tx.teamInvite.updateMany({ where: { teamId, status: 'PENDING' }, data: { status: 'REVOKED' } })
      await syncTeamChannel(teamId, tx)
    })

    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('disbandTeam failed', error)
    return fail('Jamoani tarqatishda xatolik')
  }
}
