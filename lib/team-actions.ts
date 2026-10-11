'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from './db'
import { getI18n } from './i18n/server'
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
import { notifyKey } from './notifications'
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

export async function createTeam(input: unknown): Promise<ActionResult<{ teamId: string }>> {
  const { dict, locale } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)
  if (user.role !== 'USER') return fail(t.players_only)

  const limited = guard(`create-team:${user.id}`, 10, minutes(60), locale)
  if (limited) return limited

  const parsed = teamFieldsSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  const data = parsed.data

  try {
    const owned = await db.team.count({ where: { ownerId: user.id, disbandedAt: null } })
    if (owned >= MAX_OWNED_TEAMS) return fail(t.max_owned(MAX_OWNED_TEAMS))

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
    if (isUniqueViolation(error)) return fail(t.name_taken, { name: t.name_taken_field })
    console.error('createTeam failed', error)
    return fail(t.create_failed)
  }
}

export async function updateTeam(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = updateTeamSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  const { teamId, ...data } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canEdit) return fail(t.no_edit_right)

  try {
    const team = await db.team.findUniqueOrThrow({ where: { id: teamId }, select: { sport: true } })
    // A team registered somewhere keeps its game until those tournaments end.
    if (team.sport !== data.sport && (await activeRegistrations(teamId)).length > 0) {
      return fail(t.sport_locked, { sport: t.sport_locked_field })
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
    if (isUniqueViolation(error)) return fail(t.name_taken, { name: t.name_taken_field })
    console.error('updateTeam failed', error)
    return fail(t.save_failed)
  }
}

export async function inviteMember(input: unknown): Promise<ActionResult<{ name: string }>> {
  const { dict, locale } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = inviteMemberSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  const { teamId, userQuery } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canInvite) return fail(t.no_invite_right)

  const limited = guard(`team-invite:${user.id}`, 40, minutes(60), locale)
  if (limited) return limited

  try {
    const lookup = userQuery.trim().replace(/^@/, '').toLowerCase()
    const target = await db.user.findFirst({
      where: { OR: [{ username: lookup }, { email: lookup }] },
      select: { id: true, name: true, role: true },
    })
    if (!target) return fail(t.user_not_found, { userQuery: t.user_not_found_field })
    if (target.role !== 'USER') return fail(t.players_only_invite, { userQuery: t.not_a_player_field })

    const [membership, pending, team, memberCount] = await Promise.all([
      db.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: target.id } }, select: { leftAt: true } }),
      db.teamInvite.findFirst({
        where: { teamId, invitedUserId: target.id, status: 'PENDING', expiresAt: { gt: new Date() } },
        select: { id: true },
      }),
      db.team.findUniqueOrThrow({ where: { id: teamId }, select: { name: true } }),
      db.teamMember.count({ where: { teamId, leftAt: null } }),
    ])
    if (membership && !membership.leftAt) return fail(t.already_member, { userQuery: t.already_member_field })
    if (pending) return fail(t.already_invited, { userQuery: t.already_invited_field })
    if (memberCount >= MAX_TEAM_MEMBERS) return fail(t.max_members(MAX_TEAM_MEMBERS))

    await db.teamInvite.create({
      data: {
        teamId,
        invitedUserId: target.id,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    })
    await notifyKey({
      userId: target.id,
      type: 'TEAM_INVITE',
      key: 'team_invite',
      params: { user: user.name, team: team.name },
      link: '/teams',
    })

    revalidateTeam(teamId)
    return succeedWith({ name: target.name })
  } catch (error) {
    console.error('inviteMember failed', error)
    return fail(t.invite_failed)
  }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const invite = await db.teamInvite.findUnique({ where: { id: inviteId }, select: { teamId: true, status: true } })
  if (!invite) return fail(t.invite_not_found)
  const ability = await getTeamAbility(user.id, invite.teamId)
  if (!ability.canInvite) return fail(t.no_right)
  if (invite.status !== 'PENDING') return fail(t.invite_closed)

  await db.teamInvite.update({ where: { id: inviteId }, data: { status: 'REVOKED', respondedAt: new Date() } })
  revalidateTeam(invite.teamId)
  return { ok: true }
}

/** Only the invited user can answer; joining and the chat access happen together. */
export async function respondToInvite(input: unknown): Promise<ActionResult<{ teamId: string }>> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = respondInviteSchema.safeParse(input)
  if (!parsed.success) return fail(t.bad_request)
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
      if (!invite || invite.invitedUserId !== user.id) return fail(t.invite_not_found)
      if (invite.status !== 'PENDING') return fail(t.invite_closed)
      if (invite.expiresAt < new Date()) {
        await tx.teamInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } })
        return fail(t.invite_expired)
      }
      if (invite.team.disbandedAt) return fail(t.team_disbanded)

      await tx.teamInvite.update({
        where: { id: inviteId },
        data: { status: accept ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() },
      })
      if (!accept) return succeedWith({ teamId: invite.teamId })

      const count = await tx.teamMember.count({ where: { teamId: invite.teamId, leftAt: null } })
      if (count >= MAX_TEAM_MEMBERS) return fail(t.team_full)

      // A former member who rejoins gets their old row back as a plain member.
      await tx.teamMember.upsert({
        where: { teamId_userId: { teamId: invite.teamId, userId: user.id } },
        update: { leftAt: null, role: 'MEMBER', joinedAt: new Date() },
        create: { teamId: invite.teamId, userId: user.id, role: 'MEMBER' },
      })
      await syncTeamChannel(invite.teamId, tx)

      if (invite.invitedById) {
        await notifyKey({
          userId: invite.invitedById,
          type: 'TEAM_MEMBERSHIP',
          key: 'team_invite_accepted',
          params: { user: user.name, team: invite.team.name },
          link: `/teams/${invite.teamId}`,
        })
      }
      return succeedWith({ teamId: invite.teamId })
    })

    if (result.ok) revalidateTeam(result.data.teamId)
    return result
  } catch (error) {
    console.error('respondToInvite failed', error)
    return fail(t.respond_failed)
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
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = teamMemberSchema.safeParse(input)
  if (!parsed.success) return fail(t.bad_request)
  const { teamId, userId } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canRemoveMembers) return fail(t.no_remove_right)
  if (userId === user.id) return fail(t.remove_self)

  try {
    const target = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true, leftAt: true, user: { select: { name: true } } },
    })
    if (!target || target.leftAt) return fail(t.not_in_team)
    if (target.role === 'OWNER') return fail(t.cannot_remove_owner)
    if (target.role === 'CAPTAIN' && ability.role !== 'OWNER') return fail(t.captain_owner_only)
    if ((await lockedRosterUserIds(teamId)).has(userId)) {
      return fail(t.player_locked)
    }

    await endMembership(teamId, userId)
    const team = await db.team.findUniqueOrThrow({ where: { id: teamId }, select: { name: true } })
    await notifyKey({
      userId,
      type: 'TEAM_MEMBERSHIP',
      key: 'team_removed',
      params: { team: team.name },
      link: '/teams',
    })

    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('removeMember failed', error)
    return fail(t.remove_failed)
  }
}

export async function leaveTeam(teamId: string): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.isMember) return fail(t.not_member)
  if (ability.role === 'OWNER') return fail(t.owner_cannot_leave)
  if ((await lockedRosterUserIds(teamId)).has(user.id)) {
    return fail(t.self_locked)
  }

  try {
    await endMembership(teamId, user.id)
    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('leaveTeam failed', error)
    return fail(t.leave_failed)
  }
}

export async function setMemberRole(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = setTeamRoleSchema.safeParse(input)
  if (!parsed.success) return fail(t.bad_request)
  const { teamId, userId, role } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canManageRoles) return fail(t.roles_owner_only)

  try {
    const target = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true, leftAt: true },
    })
    if (!target || target.leftAt) return fail(t.not_in_team)
    if (target.role === 'OWNER') return fail(t.owner_role_locked)

    await db.$transaction(async (tx) => {
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId } }, data: { role } })
      await syncTeamChannel(teamId, tx)
    })
    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    console.error('setMemberRole failed', error)
    return fail(t.role_failed)
  }
}

export async function transferOwnership(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = teamMemberSchema.safeParse(input)
  if (!parsed.success) return fail(t.bad_request)
  const { teamId, userId } = parsed.data

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canTransfer) return fail(t.transfer_owner_only)
  if (userId === user.id) return fail(t.already_owner)

  try {
    const target = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { leftAt: true, user: { select: { name: true } } },
    })
    if (!target || target.leftAt) return fail(t.new_owner_member)

    const team = await db.$transaction(async (tx) => {
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId: user.id } }, data: { role: 'CAPTAIN' } })
      await tx.teamMember.update({ where: { teamId_userId: { teamId, userId } }, data: { role: 'OWNER' } })
      const updated = await tx.team.update({ where: { id: teamId }, data: { ownerId: userId }, select: { name: true } })
      await syncTeamChannel(teamId, tx)
      return updated
    })

    await notifyKey({
      userId,
      type: 'TEAM_MEMBERSHIP',
      key: 'team_ownership',
      params: { user: user.name, team: team.name },
      link: `/teams/${teamId}`,
    })
    revalidateTeam(teamId)
    return { ok: true }
  } catch (error) {
    if (isUniqueViolation(error)) return fail(t.new_owner_name_taken)
    console.error('transferOwnership failed', error)
    return fail(t.transfer_failed)
  }
}

/**
 * Disbanding hides the team and archives its group, but deletes nothing:
 * past registrations, results and points still point at it.
 */
export async function disbandTeam(teamId: string): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.team.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const ability = await getTeamAbility(user.id, teamId)
  if (!ability.canDisband) return fail(t.disband_owner_only)

  try {
    const active = await activeRegistrations(teamId)
    if (active.length > 0) {
      return fail(
        t.disband_active(active.length, active.map((r) => r.tournament.title).join(', '))
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
    return fail(t.disband_failed)
  }
}
