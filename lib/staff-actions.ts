'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import { assignStaffSchema, fieldErrors, revokeStaffSchema } from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { notifyKey } from './notifications'
import { REVOKE_REASON_BY_ORG } from './staff-labels'
import { getI18n } from './i18n/server'
import { syncTournamentChannel } from './channels'

/**
 * Grant a temporary, tournament-scoped role to an existing platform user.
 * The target is looked up by username or email — organizations do not get
 * to browse the whole user table.
 */
export async function assignTournamentStaff(
  input: unknown
): Promise<ActionResult<{ userName: string; role: string }>> {
  const { dict } = await getI18n()
  const t = dict.dashboard.staff_actions
  const actor = await getCurrentUser()
  if (!actor) return fail(dict.errors.login_required)

  const parsed = assignStaffSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { tournamentId, userQuery, role } = parsed.data

  const ability = await getTournamentAbility(actor.id, tournamentId)
  if (!ability.canManageStaff) return fail(t.no_assign_right)

  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true, organizerId: true, title: true },
    })
    if (!tournament) return fail(t.tournament_not_found)
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return fail(t.tournament_closed)
    }

    const lookup = userQuery.trim().toLowerCase()
    const target = await db.user.findFirst({
      where: { OR: [{ username: lookup }, { email: lookup }] },
      select: { id: true, name: true, username: true, role: true },
    })
    if (!target) {
      return fail(t.user_not_found, { userQuery: t.user_not_found_field })
    }
    if (target.role !== 'USER') {
      return fail(t.only_regular_user, { userQuery: t.account_is_org })
    }
    if (target.id === tournament.organizerId) {
      return fail(t.owner_needs_no_role, { userQuery: t.is_owner })
    }

    await db.tournamentStaff.upsert({
      where: { tournamentId_userId: { tournamentId, userId: target.id } },
      update: { role, revokedAt: null, revokeReason: null, grantedById: actor.id, grantedAt: new Date() },
      create: { tournamentId, userId: target.id, role, grantedById: actor.id },
    })

    // Staff join the tournament group with write access.
    await syncTournamentChannel(tournamentId)

    await notifyKey({
      userId: target.id,
      type: 'STAFF_ASSIGNED',
      key: 'staff_assigned',
      params: { tournament: tournament.title, role },
      link: '/staff',
    })

    revalidatePath(`/dashboard/tournaments/${tournamentId}/staff`)
    revalidatePath('/staff')
    revalidatePath('/messages')
    return succeedWith({ userName: target.name, role })
  } catch (error) {
    console.error('assignTournamentStaff failed', error)
    return fail(t.assign_failed)
  }
}

/** Take the grant away before the tournament ends. */
export async function revokeTournamentStaff(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.dashboard.staff_actions
  const actor = await getCurrentUser()
  if (!actor) return fail(dict.errors.login_required)

  const parsed = revokeStaffSchema.safeParse(input)
  if (!parsed.success) return fail(t.invalid_data)

  try {
    const grant = await db.tournamentStaff.findUnique({
      where: { id: parsed.data.staffId },
      select: { id: true, tournamentId: true, userId: true, revokedAt: true },
    })
    if (!grant) return fail(t.grant_not_found)
    if (grant.revokedAt) return fail(t.already_revoked)

    const ability = await getTournamentAbility(actor.id, grant.tournamentId)
    if (!ability.canManageStaff) return fail(t.no_right)

    await db.tournamentStaff.update({
      where: { id: grant.id },
      data: {
        revokedAt: new Date(),
        revokeReason: parsed.data.reason || REVOKE_REASON_BY_ORG,
      },
    })

    // Out of the group too, unless they also play in this tournament.
    await syncTournamentChannel(grant.tournamentId)

    revalidatePath(`/dashboard/tournaments/${grant.tournamentId}/staff`)
    revalidatePath('/staff')
    revalidatePath('/messages')
    return { ok: true }
  } catch (error) {
    console.error('revokeTournamentStaff failed', error)
    return fail(t.revoke_failed)
  }
}

/** Typeahead for the assign form — only reachable by staff managers. */
export async function searchAssignableUsers(
  tournamentId: string,
  query: string
): Promise<ActionResult<{ id: string; name: string; username: string; email: string | null; avatar: string }[]>> {
  const { dict } = await getI18n()
  const t = dict.dashboard.staff_actions
  const actor = await getCurrentUser()
  if (!actor) return fail(dict.errors.login_required)

  const ability = await getTournamentAbility(actor.id, tournamentId)
  if (!ability.canManageStaff) return fail(t.no_right)

  const q = query.trim()
  if (q.length < 2) return succeedWith([])

  try {
    const users = await db.user.findMany({
      where: {
        role: 'USER',
        OR: [{ username: { contains: q } }, { name: { contains: q } }, { email: { contains: q } }],
      },
      select: { id: true, name: true, username: true, email: true, avatar: true },
      take: 8,
      orderBy: { username: 'asc' },
    })
    return succeedWith(users)
  } catch (error) {
    console.error('searchAssignableUsers failed', error)
    return fail(t.search_failed)
  }
}
