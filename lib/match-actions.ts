'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import {
  createMatchSchema,
  fieldErrors,
  recordMatchResultSchema,
  setMatchStatusSchema,
} from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { guard, minutes } from './rate-limit'
import { notify } from './notifications'

/**
 * Anyone who may manage participants may also run the scoreboard — that is
 * the ADMIN/ORGANIZER staff grant plus the organization owner.
 */
async function requireScorer(userId: string, tournamentId: string) {
  const ability = await getTournamentAbility(userId, tournamentId)
  return ability.canManageParticipants
}

function revalidateMatchViews(tournamentId: string) {
  revalidatePath('/results')
  revalidatePath('/rankings')
  revalidatePath('/profile')
  revalidatePath(`/tournament/${tournamentId}`)
  revalidatePath(`/dashboard/tournaments/${tournamentId}/matches`)
}

export async function createMatch(input: unknown): Promise<ActionResult<{ matchId: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = createMatchSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { tournamentId, stage, scheduledAt, homeParticipantId, awayParticipantId } = parsed.data

  if (!(await requireScorer(user.id, tournamentId))) {
    return fail('O‘yin qo‘shish huquqingiz yo‘q')
  }

  const limited = guard(`create-match:${user.id}`, 120, minutes(10))
  if (limited) return limited

  if (homeParticipantId && homeParticipantId === awayParticipantId) {
    return fail('Bir ishtirokchi o‘zi bilan o‘ynamaydi', { awayParticipantId: 'Boshqa tomonni tanlang' })
  }

  try {
    // Both sides must be approved registrations *of this tournament* — a
    // forged participant id from another event is rejected here.
    const [home, away] = await Promise.all([
      homeParticipantId
        ? db.participant.findFirst({
            where: { id: homeParticipantId, tournamentId, status: 'approved' },
            select: { id: true, name: true, teamName: true, userId: true },
          })
        : Promise.resolve(null),
      awayParticipantId
        ? db.participant.findFirst({
            where: { id: awayParticipantId, tournamentId, status: 'approved' },
            select: { id: true, name: true, teamName: true, userId: true },
          })
        : Promise.resolve(null),
    ])

    if (homeParticipantId && !home) {
      return fail('Birinchi tomon topilmadi yoki tasdiqlanmagan', {
        homeParticipantId: 'Tasdiqlangan ishtirokchini tanlang',
      })
    }
    if (awayParticipantId && !away) {
      return fail('Ikkinchi tomon topilmadi yoki tasdiqlanmagan', {
        awayParticipantId: 'Tasdiqlangan ishtirokchini tanlang',
      })
    }

    const homeLabel = home ? home.teamName || home.name : parsed.data.homeLabel?.trim()
    const awayLabel = away ? away.teamName || away.name : parsed.data.awayLabel?.trim()

    if (!homeLabel) return fail('Birinchi tomon nomini kiriting', { homeLabel: 'Majburiy' })
    if (!awayLabel) return fail('Ikkinchi tomon nomini kiriting', { awayLabel: 'Majburiy' })

    const match = await db.match.create({
      data: {
        tournamentId,
        stage: stage?.trim() || '',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        homeParticipantId: home?.id ?? null,
        awayParticipantId: away?.id ?? null,
        homeLabel,
        awayLabel,
        homeUserId: home?.userId ?? null,
        awayUserId: away?.userId ?? null,
        recordedById: user.id,
      },
      select: { id: true },
    })

    revalidateMatchViews(tournamentId)
    return succeedWith({ matchId: match.id })
  } catch (error) {
    console.error('createMatch failed', error)
    return fail('O‘yin qo‘shishda xatolik')
  }
}

/**
 * Write the final score. This is also what sets `winnerUserId`, which the
 * leaderboard counts and the profile record is derived from.
 */
export async function recordMatchResult(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = recordMatchResultSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { matchId, homeScore, awayScore, notes } = parsed.data

  try {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        tournamentId: true,
        homeUserId: true,
        awayUserId: true,
        homeLabel: true,
        awayLabel: true,
        tournament: { select: { title: true } },
      },
    })
    if (!match) return fail('O‘yin topilmadi')

    // Permission comes from the match's own tournament, not from the input.
    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail('Natija kiritish huquqingiz yo‘q')
    }

    const limited = guard(`record-match:${user.id}`, 200, minutes(10))
    if (limited) return limited

    const winnerUserId =
      homeScore > awayScore
        ? match.homeUserId
        : awayScore > homeScore
          ? match.awayUserId
          : null

    await db.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status: 'completed',
        winnerUserId,
        notes: notes?.trim() || null,
        recordedById: user.id,
      },
    })

    const score = `${homeScore}–${awayScore}`
    await Promise.all(
      [match.homeUserId, match.awayUserId]
        .filter((id): id is string => Boolean(id))
        .map((userId) =>
          notify({
            userId,
            type: 'TOURNAMENT_STATUS',
            title: 'O‘yin natijasi kiritildi',
            body: `${match.homeLabel} ${score} ${match.awayLabel} — “${match.tournament.title}”.`,
            link: '/results',
          })
        )
    )

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('recordMatchResult failed', error)
    return fail('Natijani saqlashda xatolik')
  }
}

export async function setMatchStatus(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = setMatchStatusSchema.safeParse(input)
  if (!parsed.success) return fail('Status noto‘g‘ri')

  const { matchId, status } = parsed.data

  try {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { tournamentId: true, homeScore: true, awayScore: true },
    })
    if (!match) return fail('O‘yin topilmadi')

    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail('Statusni o‘zgartirish huquqingiz yo‘q')
    }

    if (status === 'completed' && (match.homeScore === null || match.awayScore === null)) {
      return fail('Yakunlash uchun avval hisobni kiriting')
    }

    await db.match.update({
      where: { id: matchId },
      // Re-opening a finished match clears the win it had awarded.
      data: { status, ...(status === 'completed' ? {} : { winnerUserId: null }) },
    })

    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('setMatchStatus failed', error)
    return fail('Statusni o‘zgartirishda xatolik')
  }
}

export async function deleteMatch(matchId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { tournamentId: true },
    })
    if (!match) return fail('O‘yin topilmadi')

    if (!(await requireScorer(user.id, match.tournamentId))) {
      return fail('O‘yinni o‘chirish huquqingiz yo‘q')
    }

    await db.match.delete({ where: { id: matchId } })
    revalidateMatchViews(match.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('deleteMatch failed', error)
    return fail('O‘yinni o‘chirishda xatolik')
  }
}
