import { db } from '../db'
import { notificationText, notifyMany } from '../notifications'
import { closeTournamentAccess } from '../staff'
import { postSystemNotice } from '../channels'
import { closeTournamentSupport } from '../support'
import { awardTournamentPoints } from '../points/award'

/**
 * What happens around a tournament's results, in one place. Called after
 * the result transaction has committed. Points are reconciled idempotently,
 * so if anything here fails the admin "recalculate" (or the next result)
 * brings the ledger back in line.
 */

export async function onTournamentResultsChanged(
  tournamentId: string,
  change: { justCompleted: boolean; corrected: boolean; actorId: string }
) {
  if (change.justCompleted) {
    const channel = await db.channel.findUnique({ where: { tournamentId }, select: { id: true } })
    await postSystemNotice(channel?.id, change.actorId, 'tournament_finished')
    await closeTournamentAccess(tournamentId, change.actorId)
    await closeTournamentSupport(tournamentId)
    await awardAndAnnounce(tournamentId, 'FINALIZED', change.actorId)
    return
  }
  if (change.corrected) {
    await awardAndAnnounce(tournamentId, 'RESULT_CORRECTED', change.actorId, 'Yakunlangan turnir natijasi tuzatildi')
  }
}

/** Cancelling takes back every point the tournament had awarded. */
export async function onTournamentCancelled(tournamentId: string, actorId: string) {
  await closeTournamentSupport(tournamentId)
  try {
    await awardTournamentPoints(tournamentId, 'TOURNAMENT_CANCELLED', actorId, 'Turnir bekor qilindi')
  } catch (error) {
    console.error('points reversal failed', tournamentId, error)
  }
}

async function awardAndAnnounce(
  tournamentId: string,
  reason: 'FINALIZED' | 'RESULT_CORRECTED',
  actorId: string,
  note?: string
) {
  try {
    const summary = await awardTournamentPoints(tournamentId, reason, actorId, note)
    if (summary.affectedUsers.length === 0) return

    const [tournament, awards] = await Promise.all([
      db.tournament.findUnique({ where: { id: tournamentId }, select: { title: true } }),
      db.pointAward.findMany({
        where: { tournamentId, userId: { in: summary.affectedUsers } },
        select: { userId: true, points: true, placement: true },
      }),
    ])

    // One notification per distinct points value keeps this to a few writes.
    const byPoints = new Map<number, string[]>()
    for (const award of awards) byPoints.set(award.points, [...(byPoints.get(award.points) ?? []), award.userId])
    for (const [points, userIds] of byPoints) {
      await notifyMany(userIds, {
        type: 'POINTS_AWARDED',
        ...notificationText(reason === 'FINALIZED' ? 'points_awarded' : 'points_updated', {
          points,
          tournament: tournament?.title ?? '',
        }),
        link: '/rankings',
      })
    }
  } catch (error) {
    console.error('awarding points failed', tournamentId, error)
  }
}
