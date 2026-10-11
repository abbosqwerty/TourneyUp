'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getI18n } from './i18n/server'
import { getCurrentUser, getTournamentAbility } from './session'
import {
  fieldErrors,
  recordLeaderboardSchema,
  recordMatchResultSchema,
  scheduleMatchSchema,
  setMatchStatusSchema,
} from './schemas'
import { fail, type ActionResult } from './action-result'
import { guard, minutes } from './rate-limit'
import { notifyKey, notifyManyKey } from './notifications'
import { CompetitionError, recordLeaderboardRound, recordResult } from './competition/lifecycle'
import { onTournamentResultsChanged } from './competition/hooks'

/**
 * Matches are created by the format engine (`lib/competition`), never by
 * hand. Staff with `canRecordResults` (owner, ADMIN, ORGANIZER) schedule
 * them and confirm official results; the engine does the rest.
 */
async function requireScorer(userId: string, tournamentId: string) {
  const ability = await getTournamentAbility(userId, tournamentId)
  return ability.canRecordResults
}

function revalidateMatchViews(tournamentId: string) {
  revalidatePath('/results')
  revalidatePath(`/results/${tournamentId}`)
  revalidatePath('/rankings')
  revalidatePath('/profile')
  revalidatePath(`/tournament/${tournamentId}`)
  revalidatePath(`/dashboard/tournaments/${tournamentId}/matches`)
}

/** `YYYY-MM-DDTHH:mm` typed in Tashkent time → UTC instant. */
function fromTashkentInput(value: string) {
  return new Date(`${value}:00+05:00`)
}

/**
 * Confirm (or correct) a match's official result. The engine advances the
 * bracket in the same transaction; a correction that would change a match
 * already played is refused and nothing is written.
 */
export async function recordMatchResult(input: unknown): Promise<ActionResult> {
  const { dict, locale } = await getI18n()
  const t = dict.competition.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = recordMatchResultSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { matchId, homeScore, awayScore, forfeit, notes, reason } = parsed.data

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true, homeLabel: true, awayLabel: true, tournament: { select: { title: true } } },
  })
  if (!match) return fail(t.match_not_found)

  // Permission comes from the match's own tournament, not from the input.
  if (!(await requireScorer(user.id, match.tournamentId))) {
    return fail(t.no_record_right)
  }

  const limited = guard(`record-match:${user.id}`, 200, minutes(10), locale)
  if (limited) return limited

  try {
    const result = await recordResult(
      {
        matchId,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
        forfeit: forfeit || null,
        notes: notes || null,
        reason: reason || null,
      },
      user.id
    )

    if (result.changed) {
      const recipients = [result.homeUserId, result.awayUserId].filter((id): id is string => Boolean(id))
      const teams = { home: match.homeLabel, away: match.awayLabel, tournament: match.tournament.title }
      const link = `/results/${match.tournamentId}`
      if (forfeit) {
        await notifyManyKey(recipients, {
          type: 'TOURNAMENT_STATUS',
          key: result.corrected ? 'match_forfeit_corrected' : 'match_forfeit',
          params: { ...teams, absent: forfeit === 'HOME' ? match.homeLabel : match.awayLabel },
          link,
        })
      } else {
        await notifyManyKey(recipients, {
          type: 'TOURNAMENT_STATUS',
          key: result.corrected ? 'match_result_corrected' : 'match_result',
          params: { ...teams, score: `${homeScore}–${awayScore}` },
          link,
        })
      }
      await onTournamentResultsChanged(match.tournamentId, {
        justCompleted: result.justCompleted,
        corrected: result.corrected && result.complete,
        actorId: user.id,
      })
    }

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    if (error instanceof CompetitionError) return fail(error.translated(dict))
    console.error('recordMatchResult failed', error)
    return fail(t.save_result_failed)
  }
}

/**
 * Save one round of a LEADERBOARD tournament (a race, a heat, a battle-royale
 * match). The table re-ranks itself; the last result finalizes the event.
 */
export async function recordLeaderboardResults(input: unknown): Promise<ActionResult> {
  const { dict, locale } = await getI18n()
  const t = dict.competition.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = recordLeaderboardSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  const { tournamentId, round, results, reason } = parsed.data

  if (!(await requireScorer(user.id, tournamentId))) return fail(t.no_record_right)

  const limited = guard(`record-match:${user.id}`, 200, minutes(10), locale)
  if (limited) return limited

  try {
    const result = await recordLeaderboardRound({ tournamentId, round, results, reason: reason || null }, user.id)
    if (result.changed) {
      const tournament = await db.tournament.findUnique({ where: { id: tournamentId }, select: { title: true } })
      await notifyManyKey(result.affectedUserIds, {
        type: 'TOURNAMENT_STATUS',
        key: result.corrected ? 'round_result_corrected' : 'round_result',
        params: { tournament: tournament?.title ?? '', round },
        link: `/results/${tournamentId}`,
      })
      await onTournamentResultsChanged(tournamentId, {
        justCompleted: result.justCompleted,
        corrected: result.corrected && result.complete,
        actorId: user.id,
      })
    }
    revalidateMatchViews(tournamentId)
    return { ok: true }
  } catch (error) {
    if (error instanceof CompetitionError) return fail(error.translated(dict))
    console.error('recordLeaderboardResults failed', error)
    return fail(t.save_results_failed)
  }
}

/** Mark a not-yet-finalized match as live or back to scheduled. */
export async function setMatchStatus(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.competition.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = setMatchStatusSchema.safeParse(input)
  if (!parsed.success) return fail(t.bad_status)

  const { matchId, status } = parsed.data

  try {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: {
        tournamentId: true,
        finalizedAt: true,
        isBye: true,
        bracket: true,
        homeParticipantId: true,
        awayParticipantId: true,
        homeUserId: true,
        awayUserId: true,
        homeLabel: true,
        awayLabel: true,
      },
    })
    if (!match) return fail(t.match_not_found)

    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail(t.no_status_right)
    }
    if (match.bracket === 'MANUAL') return fail(t.legacy_locked)
    if (match.finalizedAt || match.isBye) return fail(t.finalized_status_locked)
    if (status === 'live' && (!match.homeParticipantId || !match.awayParticipantId)) {
      return fail(t.sides_unknown_live)
    }

    await db.match.update({ where: { id: matchId }, data: { status } })

    if (status === 'live') {
      await notifyManyKey(
        [match.homeUserId, match.awayUserId].filter((id): id is string => Boolean(id)),
        {
          type: 'TOURNAMENT_STATUS',
          key: 'match_started',
          params: { home: match.homeLabel, away: match.awayLabel },
          link: `/results/${match.tournamentId}`,
        }
      )
    }

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('setMatchStatus failed', error)
    return fail(t.status_failed)
  }
}

/** Set or clear a match's date and time. */
export async function scheduleMatch(input: unknown): Promise<ActionResult> {
  const { dict, locale } = await getI18n()
  const t = dict.competition.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = scheduleMatchSchema.safeParse(input)
  if (!parsed.success) return fail(t.bad_date, fieldErrors(parsed.error, dict))

  const { matchId, scheduledAt } = parsed.data

  try {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: {
        tournamentId: true,
        finalizedAt: true,
        isBye: true,
        status: true,
        bracket: true,
        homeUserId: true,
        awayUserId: true,
        homeLabel: true,
        awayLabel: true,
      },
    })
    if (!match) return fail(t.match_not_found)

    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail(t.no_schedule_right)
    }
    if (match.bracket === 'MANUAL') return fail(t.legacy_locked)
    if (match.finalizedAt || match.isBye || match.status === 'cancelled') {
      return fail(t.cannot_reschedule)
    }

    const limited = guard(`schedule-match:${user.id}`, 300, minutes(10), locale)
    if (limited) return limited

    const when = scheduledAt ? fromTashkentInput(scheduledAt) : null
    await db.match.update({ where: { id: matchId }, data: { scheduledAt: when } })

    if (when) {
      await Promise.all(
        [match.homeUserId, match.awayUserId]
          .filter((id): id is string => Boolean(id))
          .map((userId) =>
            notifyKey({
              userId,
              type: 'TOURNAMENT_STATUS',
              key: 'match_scheduled',
              params: { home: match.homeLabel, away: match.awayLabel },
              link: `/results/${match.tournamentId}?tab=schedule`,
            })
          )
      )
    }

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('scheduleMatch failed', error)
    return fail(t.schedule_failed)
  }
}
