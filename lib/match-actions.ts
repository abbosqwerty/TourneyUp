'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
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
import { notify, notifyMany } from './notifications'
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
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = recordMatchResultSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { matchId, homeScore, awayScore, forfeit, notes, reason } = parsed.data

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true, homeLabel: true, awayLabel: true, tournament: { select: { title: true } } },
  })
  if (!match) return fail('O‘yin topilmadi')

  // Permission comes from the match's own tournament, not from the input.
  if (!(await requireScorer(user.id, match.tournamentId))) {
    return fail('Natija kiritish huquqingiz yo‘q')
  }

  const limited = guard(`record-match:${user.id}`, 200, minutes(10))
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
      const score = forfeit
        ? `texnik g‘alaba (${forfeit === 'HOME' ? match.homeLabel : match.awayLabel} kelmadi)`
        : `${homeScore}–${awayScore}`
      await notifyMany(
        [result.homeUserId, result.awayUserId].filter((id): id is string => Boolean(id)),
        {
          type: 'TOURNAMENT_STATUS',
          title: result.corrected ? 'O‘yin natijasi tuzatildi' : 'O‘yin natijasi kiritildi',
          body: `${match.homeLabel} — ${match.awayLabel}: ${score}. “${match.tournament.title}”.`,
          link: `/results/${match.tournamentId}`,
        }
      )
      await onTournamentResultsChanged(match.tournamentId, {
        justCompleted: result.justCompleted,
        corrected: result.corrected && result.complete,
        actorId: user.id,
      })
    }

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    if (error instanceof CompetitionError) return fail(error.message)
    console.error('recordMatchResult failed', error)
    return fail('Natijani saqlashda xatolik')
  }
}

/**
 * Save one round of a LEADERBOARD tournament (a race, a heat, a battle-royale
 * match). The table re-ranks itself; the last result finalizes the event.
 */
export async function recordLeaderboardResults(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = recordLeaderboardSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))
  const { tournamentId, round, results, reason } = parsed.data

  if (!(await requireScorer(user.id, tournamentId))) return fail('Natija kiritish huquqingiz yo‘q')

  const limited = guard(`record-match:${user.id}`, 200, minutes(10))
  if (limited) return limited

  try {
    const result = await recordLeaderboardRound({ tournamentId, round, results, reason: reason || null }, user.id)
    if (result.changed) {
      const tournament = await db.tournament.findUnique({ where: { id: tournamentId }, select: { title: true } })
      await notifyMany(result.affectedUserIds, {
        type: 'TOURNAMENT_STATUS',
        title: result.corrected ? 'Natijangiz tuzatildi' : 'Natijangiz kiritildi',
        body: `“${tournament?.title ?? 'Turnir'}”, ${round}-bosqich. Reyting jadvalida o‘rningizni ko‘ring.`,
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
    if (error instanceof CompetitionError) return fail(error.message)
    console.error('recordLeaderboardResults failed', error)
    return fail('Natijalarni saqlashda xatolik')
  }
}

/** Mark a not-yet-finalized match as live or back to scheduled. */
export async function setMatchStatus(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = setMatchStatusSchema.safeParse(input)
  if (!parsed.success) return fail('Status noto‘g‘ri')

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
    if (!match) return fail('O‘yin topilmadi')

    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail('Statusni o‘zgartirish huquqingiz yo‘q')
    }
    if (match.bracket === 'MANUAL') return fail('Eski o‘yinlar tahrirlanmaydi')
    if (match.finalizedAt || match.isBye) return fail('Yakunlangan o‘yin statusini o‘zgartirib bo‘lmaydi')
    if (status === 'live' && (!match.homeParticipantId || !match.awayParticipantId)) {
      return fail('Ikkala tomon aniqlanmaguncha o‘yin boshlanmaydi')
    }

    await db.match.update({ where: { id: matchId }, data: { status } })

    if (status === 'live') {
      await notifyMany(
        [match.homeUserId, match.awayUserId].filter((id): id is string => Boolean(id)),
        {
          type: 'TOURNAMENT_STATUS',
          title: 'O‘yiningiz boshlandi',
          body: `${match.homeLabel} — ${match.awayLabel}`,
          link: `/results/${match.tournamentId}`,
        }
      )
    }

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('setMatchStatus failed', error)
    return fail('Statusni o‘zgartirishda xatolik')
  }
}

/** Set or clear a match's date and time. */
export async function scheduleMatch(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = scheduleMatchSchema.safeParse(input)
  if (!parsed.success) return fail('Sana noto‘g‘ri', fieldErrors(parsed.error))

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
    if (!match) return fail('O‘yin topilmadi')

    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail('Jadvalni o‘zgartirish huquqingiz yo‘q')
    }
    if (match.bracket === 'MANUAL') return fail('Eski o‘yinlar tahrirlanmaydi')
    if (match.finalizedAt || match.isBye || match.status === 'cancelled') {
      return fail('Bu o‘yinning vaqtini o‘zgartirib bo‘lmaydi')
    }

    const limited = guard(`schedule-match:${user.id}`, 300, minutes(10))
    if (limited) return limited

    const when = scheduledAt ? fromTashkentInput(scheduledAt) : null
    await db.match.update({ where: { id: matchId }, data: { scheduledAt: when } })

    if (when) {
      await Promise.all(
        [match.homeUserId, match.awayUserId]
          .filter((id): id is string => Boolean(id))
          .map((userId) =>
            notify({
              userId,
              type: 'TOURNAMENT_STATUS',
              title: 'O‘yin vaqti belgilandi',
              body: `${match.homeLabel} — ${match.awayLabel}`,
              link: `/results/${match.tournamentId}?tab=schedule`,
            })
          )
      )
    }

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('scheduleMatch failed', error)
    return fail('Vaqtni saqlashda xatolik')
  }
}
