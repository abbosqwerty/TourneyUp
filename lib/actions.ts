'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import {
  createTournamentSchema,
  fieldErrors,
  participantSeedSchema,
  participantStatusSchema,
  registerParticipantSchema,
  setTournamentStatusSchema,
  updateTournamentSchema,
} from './schemas'
import { getI18n } from './i18n/server'
import type { Dictionary } from './i18n/dictionaries'
import { fail, succeedWith, type ActionResult } from './action-result'
import { guard, minutes } from './rate-limit'
import { closeTournamentAccess } from './staff'
import { ensureTournamentChannel, postSystemNotice, syncTournamentChannel } from './channels'
import { notifyKey, notifyManyKey } from './notifications'
import { CompetitionError, startCompetition } from './competition/lifecycle'
import { onTournamentCancelled } from './competition/hooks'
import { formatConfigSchema } from './competition/config'
import { getTeamAbility } from './teams'
import { mediaUrl } from './media'

const CLOSED_STATUSES = ['completed', 'cancelled'] as const

function linesToJson(value?: string) {
  return JSON.stringify(
    value
      ? value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : []
  )
}

function withCurrency(value: string | undefined, fallback = 'Free') {
  const raw = value?.trim()
  if (!raw) return fallback
  if (/^(free|0)$/i.test(raw)) return 'Free'
  return raw
}

/** Format-related columns from validated form data. */
function formatColumns(data: {
  format: Prisma.TournamentCreateInput['format']
  participantType: 'INDIVIDUAL' | 'TEAM'
  teamSize?: number
  teamSizeMax?: number
  formatConfig?: Record<string, unknown>
}) {
  const team = data.participantType === 'TEAM'
  return {
    format: data.format,
    participantType: data.participantType,
    teamSize: team ? (data.teamSize ?? null) : null,
    teamSizeMax: team ? (data.teamSizeMax ?? data.teamSize ?? null) : null,
    formatConfigJson: JSON.stringify(formatConfigSchema.parse(data.formatConfig ?? {})),
  }
}

/** Once the draw exists, the line-up is final. */
async function drawExists(tournamentId: string) {
  const row = await db.tournament.findUnique({ where: { id: tournamentId }, select: { drawGeneratedAt: true } })
  return Boolean(row?.drawGeneratedAt)
}

function revalidateTournamentViews(tournamentId?: string) {
  revalidatePath('/feed')
  revalidatePath('/saved')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/participants')
  revalidatePath('/')
  revalidatePath('/results')
  if (tournamentId) {
    revalidatePath(`/tournament/${tournamentId}`)
    revalidatePath(`/results/${tournamentId}`)
  }
}

// ------------------------------------------------------------
// Create / update
// ------------------------------------------------------------

/**
 * Only an ORGANIZATION account (or a super admin) can open a tournament.
 * Per-tournament staff roles are scoped to one event and therefore never
 * grant creation rights.
 */
export async function createTournament(input: unknown): Promise<ActionResult<{ tournamentId: string }>> {
  const user = await getCurrentUser()
  const { dict, locale } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)
  if (user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN') {
    return fail(e.org_only_create)
  }

  // Without this one account could fill the table with thousands of events.
  const limited = guard(`create-tournament:${user.id}`, 10, minutes(60), locale)
  if (limited) return limited

  const parsed = createTournamentSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const data = parsed.data
  if (data.endDate && data.endDate < data.date) {
    return fail(e.end_before_start, {
      endDate: e.invalid_date,
    })
  }

  try {
    const organization = await db.organization.findUnique({
      where: { ownerId: user.id },
      select: { id: true, status: true },
    })
    if (organization?.status === 'SUSPENDED') {
      return fail(e.org_suspended_create)
    }
    if (!organization && user.role !== 'SUPER_ADMIN') {
      return fail(e.no_org_linked)
    }

    const tournament = await db.tournament.create({
      data: {
        title: data.title,
        sport: data.sport,
        category: data.category,
        location: data.location,
        date: data.date,
        endDate: data.endDate || null,
        time: data.time,
        maxParticipants: data.maxParticipants,
        posterMediaId: data.posterMediaId || null,
        galleryMediaIdsJson: JSON.stringify(data.galleryMediaIds ?? []),
        posterUrl: '',
        organizerId: user.id,
        organizationId: organization?.id ?? null,
        description: data.description,
        rulesJson: linesToJson(data.rules),
        requirementsJson: linesToJson(data.requirements),
        prizePool: withCurrency(data.prizePool),
        entryFee: withCurrency(data.entryFee),
        status: 'registration_open',
        featured: false,
        ...formatColumns(data),
      },
      select: { id: true, title: true, sport: true, description: true },
    })

    await ensureTournamentChannel(tournament.id)

    revalidateTournamentViews(tournament.id)
    revalidatePath('/messages')
    return succeedWith({ tournamentId: tournament.id })
  } catch (error) {
    console.error('createTournament failed', error)
    return fail(e.create_failed)
  }
}

export async function updateTournament(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict, locale } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const limited = guard(`update-tournament:${user.id}`, 60, minutes(10), locale)
  if (limited) return limited

  const parsed = updateTournamentSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { tournamentId, ...data } = parsed.data
  const ability = await getTournamentAbility(user.id, tournamentId)
  if (!ability.canEditTournament) return fail(e.no_edit_right)

  try {
    const current = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { drawGeneratedAt: true, format: true, participantType: true, formatConfigJson: true, teamSize: true, teamSizeMax: true },
    })
    if (!current) return fail(e.not_found)

    // The format belongs to the draw: after it is made, it cannot change.
    const format = formatColumns(data)
    if (current.drawGeneratedAt) {
      const changed =
        current.format !== format.format ||
        current.participantType !== format.participantType ||
        current.teamSize !== format.teamSize ||
        current.teamSizeMax !== format.teamSizeMax ||
        current.formatConfigJson !== format.formatConfigJson
      if (changed) return fail(e.format_locked)
    }

    await db.tournament.update({
      where: { id: tournamentId },
      data: {
        ...format,
        title: data.title,
        sport: data.sport,
        category: data.category,
        location: data.location,
        date: data.date,
        endDate: data.endDate || null,
        time: data.time,
        maxParticipants: data.maxParticipants,
        description: data.description,
        rulesJson: linesToJson(data.rules),
        requirementsJson: linesToJson(data.requirements),
        prizePool: withCurrency(data.prizePool),
        entryFee: withCurrency(data.entryFee),
        ...(data.posterMediaId ? { posterMediaId: data.posterMediaId } : {}),
      },
    })

    revalidateTournamentViews(tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('updateTournament failed', error)
    return fail(e.update_failed)
  }
}

/**
 * Tournament lifecycle, enforced on the server:
 *
 *   upcoming ⇄ registration_open → ongoing → (completed, automatically)
 *   any state → cancelled
 *
 * Moving to `ongoing` writes the draw (lib/competition) in the same request —
 * there is no separate "generate bracket" step. Once the draw exists the
 * tournament cannot go back to registration, and `completed` is set by the
 * engine when the last result is confirmed, never by hand. Closing a
 * tournament expires every temporary staff grant (`closeTournamentAccess`);
 * cancelling also takes back its Tourney Points.
 */
export async function setTournamentStatus(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const parsed = setTournamentStatusSchema.safeParse(input)
  if (!parsed.success) return fail(e.invalid_status)

  const { tournamentId, status } = parsed.data
  const ability = await getTournamentAbility(user.id, tournamentId)
  if (!ability.canEditTournament) return fail(e.no_status_right)

  try {
    const current = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true, drawGeneratedAt: true, title: true },
    })
    if (!current) return fail(e.not_found)
    if (current.status === status) return { ok: true }
    if (current.status === 'cancelled') return fail(e.cancelled_no_reopen)

    if (current.drawGeneratedAt && (status === 'upcoming' || status === 'registration_open')) {
      return fail(e.draw_no_reopen)
    }
    if (status === 'completed' && current.drawGeneratedAt) {
      return fail(e.completes_automatically)
    }
    if (current.status === 'completed' && status !== 'cancelled') {
      return fail(e.completed_only_cancel)
    }

    if (status === 'ongoing') {
      try {
        await startCompetition(tournamentId)
      } catch (error) {
        if (error instanceof CompetitionError) return fail(error.translated(dict))
        throw error
      }
    }

    const closing = (CLOSED_STATUSES as readonly string[]).includes(status)
    await db.tournament.update({
      where: { id: tournamentId },
      data: { status, closedAt: closing ? new Date() : null },
    })

    const channel = await db.channel.findUnique({ where: { tournamentId }, select: { id: true } })
    if (status === 'ongoing') {
      // The drawn line-up becomes the tournament group.
      await syncTournamentChannel(tournamentId)
      await postSystemNotice(channel?.id, user.id, 'tournament_started')
    }
    if (status === 'cancelled') {
      await postSystemNotice(channel?.id, user.id, 'tournament_cancelled')
    }

    if (closing) {
      await closeTournamentAccess(tournamentId, user.id)
    }
    if (status === 'cancelled') {
      await onTournamentCancelled(tournamentId, user.id)
    }

    const audience = await db.participant.findMany({
      where: { tournamentId, userId: { not: null } },
      select: { userId: true },
    })

    const recipients = audience.map((row) => row.userId).filter((id): id is string => Boolean(id))
    if (status === 'ongoing') {
      await notifyManyKey(recipients, {
        type: 'TOURNAMENT_STATUS',
        key: 'tournament_started',
        params: { tournament: current.title },
        link: `/results/${tournamentId}`,
      })
    } else {
      await notifyManyKey(recipients, {
        type: 'TOURNAMENT_STATUS',
        key: 'tournament_status',
        params: { tournament: current.title, status },
        link: `/tournament/${tournamentId}`,
      })
    }

    revalidateTournamentViews(tournamentId)
    revalidatePath('/staff')
    revalidatePath('/messages')
    revalidatePath('/rankings')
    return { ok: true }
  } catch (error) {
    console.error('setTournamentStatus failed', error)
    return fail(e.status_failed)
  }
}

export async function deleteTournament(tournamentId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const ability = await getTournamentAbility(user.id, tournamentId)
  if (!ability.isOwner) return fail(e.delete_owner_only)

  try {
    await db.tournament.delete({ where: { id: tournamentId } })
    revalidateTournamentViews(tournamentId)
    revalidatePath('/messages')
    return { ok: true }
  } catch (error) {
    console.error('deleteTournament failed', error)
    return fail(e.delete_tournament_failed)
  }
}

// ------------------------------------------------------------
// Saving / bookmarking
// ------------------------------------------------------------

export async function toggleSaveTournament(tournamentId: string): Promise<ActionResult<{ saved: boolean }>> {
  const user = await getCurrentUser()
  const { dict, locale } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(e.save_login)

  const limited = guard(`save:${user.id}`, 120, minutes(10), locale)
  if (limited) return limited

  try {
    const key = { userId_tournamentId: { userId: user.id, tournamentId } }
    const existing = await db.savedTournament.findUnique({ where: key })

    if (existing) {
      await db.savedTournament.delete({ where: key })
    } else {
      await db.savedTournament.create({ data: { userId: user.id, tournamentId } })
    }

    revalidatePath('/feed')
    revalidatePath('/saved')
    revalidatePath(`/tournament/${tournamentId}`)
    return succeedWith({ saved: !existing })
  } catch (error) {
    console.error('toggleSaveTournament failed', error)
    return fail(e.save_failed)
  }
}

// ------------------------------------------------------------
// Participation
// ------------------------------------------------------------

export async function registerParticipant(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict, locale } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(e.register_login)
  if (user.role !== 'USER') return fail(e.accounts_cannot_register)

  // Caps the signup race that the capacity check alone cannot close.
  const limited = guard(`register:${user.id}`, 20, minutes(10), locale)
  if (limited) return limited

  const parsed = registerParticipantSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { tournamentId, teamName, teamId, rosterUserIds } = parsed.data

  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        title: true,
        sport: true,
        date: true,
        status: true,
        entryFee: true,
        maxParticipants: true,
        participantType: true,
        teamSize: true,
        teamSizeMax: true,
        organizerId: true,
        _count: { select: { participants: true } },
      },
    })
    if (!tournament) return fail(e.not_found)

    if (tournament.status !== 'registration_open') {
      return fail(e.registration_closed)
    }
    if (tournament.date < new Date().toISOString().slice(0, 10)) {
      return fail(e.date_passed)
    }
    if (tournament._count.participants >= tournament.maxParticipants) {
      return fail(e.full)
    }

    const already = await db.participant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: user.id } },
      select: { id: true },
    })
    if (already) return fail(e.already_registered)

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, username: true, avatar: true },
    })
    if (!profile) return fail(e.profile_not_found)

    const paymentStatus = tournament.entryFee && tournament.entryFee !== 'Free' ? 'pending' : 'paid'
    let displayName = profile.name

    if (tournament.participantType === 'TEAM') {
      const result = await registerTeam({
        tournament,
        userId: user.id,
        teamId: teamId || '',
        rosterUserIds: rosterUserIds ?? [],
        email: profile.email ?? `${profile.username}@tourneyup.uz`,
        paymentStatus,
        errors: e,
      })
      if (!result.ok) return result
      displayName = result.data.teamName
    } else {
      if (teamId) return fail(e.individual_no_team)
      await db.participant.create({
        data: {
          name: profile.name,
          email: profile.email ?? `${profile.username}@tourneyup.uz`,
          avatar: profile.avatar,
          registeredAt: new Date().toISOString(),
          status: 'pending',
          teamName: teamName || null,
          paymentStatus,
          tournamentId,
          userId: user.id,
        },
      })
    }

    await notifyKey({
      userId: tournament.organizerId,
      type: 'PARTICIPANT_REGISTERED',
      key: 'participant_registered',
      params: { name: displayName, tournament: tournament.title },
      link: '/dashboard/participants',
    })

    revalidateTournamentViews(tournamentId)
    revalidatePath('/teams')
    return { ok: true }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail(e.duplicate_registration)
    }
    console.error('registerParticipant failed', error)
    return fail(e.register_failed)
  }
}

/**
 * Register one of the caller's teams with a chosen roster. Checks: the caller
 * leads the team, the team plays this game, the roster size fits, every
 * player is a current member, and no player is already in another team's
 * roster for this tournament (also enforced by a unique key).
 */
async function registerTeam(args: {
  tournament: { id: string; title: string; sport: string; teamSize: number | null; teamSizeMax: number | null }
  userId: string
  teamId: string
  rosterUserIds: string[]
  email: string
  paymentStatus: string
  errors: Dictionary['tournament']['errors']
}): Promise<ActionResult<{ teamName: string }>> {
  const { tournament, userId, teamId, errors: e } = args
  if (!teamId) return fail(e.choose_team, { teamId: e.team_not_chosen })

  const ability = await getTeamAbility(userId, teamId)
  if (!ability.canRegister) return fail(e.team_lead_only)

  const team = await db.team.findUnique({
    where: { id: teamId },
    select: {
      name: true,
      sport: true,
      logoMediaId: true,
      disbandedAt: true,
      members: { where: { leftAt: null }, select: { userId: true } },
    },
  })
  if (!team || team.disbandedAt) return fail(e.team_not_found)
  if (tournament.sport !== 'Other' && team.sport.toLowerCase() !== tournament.sport.toLowerCase()) {
    return fail(e.sport_mismatch(tournament.sport, team.sport), { teamId: e.sport_mismatch_field })
  }

  const roster = [...new Set(args.rosterUserIds)]
  const min = tournament.teamSize ?? 1
  const max = tournament.teamSizeMax ?? tournament.teamSize ?? 50
  if (roster.length < min || roster.length > max) {
    return fail(min === max ? e.roster_exact(min) : e.roster_range(min, max), {
      rosterUserIds: e.roster_size_field,
    })
  }
  const memberIds = new Set(team.members.map((m) => m.userId))
  if (roster.some((id) => !memberIds.has(id))) return fail(e.roster_members_only)

  const taken = await db.participantRosterMember.findMany({
    where: { tournamentId: tournament.id, userId: { in: roster } },
    select: { user: { select: { name: true } } },
  })
  if (taken.length > 0) {
    return fail(e.roster_taken(taken.map((t) => t.user.name).join(', ')))
  }
  if (await db.participant.findFirst({ where: { tournamentId: tournament.id, teamId }, select: { id: true } })) {
    return fail(e.team_already)
  }

  await db.participant.create({
    data: {
      name: team.name,
      email: args.email,
      avatar: mediaUrl(team.logoMediaId) ?? '/placeholder-user.jpg',
      registeredAt: new Date().toISOString(),
      status: 'pending',
      teamName: team.name,
      paymentStatus: args.paymentStatus,
      tournamentId: tournament.id,
      userId,
      teamId,
      roster: { create: roster.map((id) => ({ userId: id, tournamentId: tournament.id })) },
    },
  })

  await notifyManyKey(
    roster.filter((id) => id !== userId),
    {
      type: 'TEAM_REGISTERED',
      key: 'team_registered',
      params: { team: team.name, tournament: tournament.title },
      link: `/tournament/${tournament.id}`,
    }
  )

  return succeedWith({ teamName: team.name })
}

export async function unregisterParticipant(tournamentId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict, locale } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const limited = guard(`unregister:${user.id}`, 20, minutes(10), locale)
  if (limited) return limited

  try {
    // Your own registration, or a team registration of a team you lead.
    const participant = await db.participant.findFirst({
      where: {
        tournamentId,
        OR: [
          { userId: user.id },
          { team: { members: { some: { userId: user.id, leftAt: null, role: { in: ['OWNER', 'CAPTAIN'] } } } } },
        ],
      },
      select: { id: true },
    })
    if (!participant) return fail(e.not_registered)
    if (await drawExists(tournamentId)) return fail(e.started_no_withdraw)

    await db.participant.delete({ where: { id: participant.id } })
    await syncTournamentChannel(tournamentId)
    revalidateTournamentViews(tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('unregisterParticipant failed', error)
    return fail(e.cancel_failed)
  }
}

/**
 * Approve or reject a registration. The caller must hold a live grant on
 * *that* tournament — a forged `tournamentId` no longer helps, because the
 * tournament is read from the participant row itself.
 */
export async function updateParticipantStatus(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const parsed = participantStatusSchema.safeParse(input)
  if (!parsed.success) return fail(e.invalid_status)

  const { participantId, status } = parsed.data

  try {
    const participant = await db.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        tournamentId: true,
        userId: true,
        tournament: { select: { title: true } },
      },
    })
    if (!participant) return fail(e.participant_not_found)

    const ability = await getTournamentAbility(user.id, participant.tournamentId)
    if (!ability.canManageParticipants) {
      return fail(e.no_manage_right)
    }
    if (await drawExists(participant.tournamentId)) {
      return fail(e.draw_participants_locked)
    }

    await db.participant.update({ where: { id: participantId }, data: { status } })
    // Approved players (and their team's roster) join the tournament group.
    await syncTournamentChannel(participant.tournamentId)

    // The whole point of the approve/reject flow: the participant finds out.
    if (participant.userId && status !== 'pending') {
      const approved = status === 'approved'
      await notifyKey({
        userId: participant.userId,
        type: approved ? 'PARTICIPANT_APPROVED' : 'PARTICIPANT_REJECTED',
        key: approved ? 'participant_approved' : 'participant_rejected',
        params: { tournament: participant.tournament.title },
        link: `/tournament/${participant.tournamentId}`,
      })
    }

    revalidateTournamentViews(participant.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('updateParticipantStatus failed', error)
    return fail(e.status_failed)
  }
}

export async function removeParticipant(participantId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  try {
    const participant = await db.participant.findUnique({
      where: { id: participantId },
      select: { tournamentId: true },
    })
    if (!participant) return fail(e.participant_not_found)

    const ability = await getTournamentAbility(user.id, participant.tournamentId)
    if (!ability.canManageParticipants) return fail(e.no_permission)
    if (await drawExists(participant.tournamentId)) {
      return fail(e.draw_no_remove)
    }

    await db.participant.delete({ where: { id: participantId } })
    await syncTournamentChannel(participant.tournamentId)
    revalidateTournamentViews(participant.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('removeParticipant failed', error)
    return fail(e.delete_failed)
  }
}

/** Manual seed (1 = strongest) — used when the format's seeding is "seeded". */
export async function setParticipantSeed(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const parsed = participantSeedSchema.safeParse(input)
  if (!parsed.success) return fail(e.invalid_seed, fieldErrors(parsed.error, dict))

  try {
    const participant = await db.participant.findUnique({
      where: { id: parsed.data.participantId },
      select: { tournamentId: true },
    })
    if (!participant) return fail(e.participant_not_found)

    const ability = await getTournamentAbility(user.id, participant.tournamentId)
    if (!ability.canManageParticipants) return fail(e.no_permission)
    if (await drawExists(participant.tournamentId)) return fail(e.draw_seed_locked)

    await db.participant.update({
      where: { id: parsed.data.participantId },
      data: { seed: parsed.data.seed ?? null },
    })
    revalidatePath('/dashboard/participants')
    return { ok: true }
  } catch (error) {
    console.error('setParticipantSeed failed', error)
    return fail(e.seed_failed)
  }
}
