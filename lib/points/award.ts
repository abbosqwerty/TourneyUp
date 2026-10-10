import type { PointChangeReason, Prisma } from '@prisma/client'
import { db } from '../db'
import { computeFinalPlacements } from '../competition/lifecycle'
import { participatedEntrants } from '../competition/engine'
import { basePoints, finalPoints, POINTS_CONFIG } from './score'

/**
 * Writes the points ledger for one tournament. Not a server action — called
 * by the competition hooks and the admin recalculation only.
 *
 * The function computes the full set of awards the tournament *should* have
 * right now and reconciles the ledger to it (create / update / delete), so
 * calling it again changes nothing, a corrected result moves exactly the
 * difference, and a cancelled or unfinished tournament ends up with no
 * awards at all. Every change is written to PointAuditLog.
 */

type Tx = Prisma.TransactionClient

type DesiredAward = {
  userId: string
  participantId: string
  placement: number | null
  basePoints: number
  fieldSize: number
  points: number
}

/** The players a registration's points go to. */
async function playersOf(
  tx: Tx,
  participants: { id: string; userId: string | null }[]
): Promise<Map<string, string[]>> {
  const roster = await tx.participantRosterMember.findMany({
    where: { participantId: { in: participants.map((p) => p.id) } },
    select: { participantId: true, userId: true },
  })
  const out = new Map<string, string[]>()
  for (const p of participants) {
    // Team registrations score every rostered player; individual ones the account itself.
    const members = roster.filter((r) => r.participantId === p.id).map((r) => r.userId)
    out.set(p.id, members.length > 0 ? members : p.userId ? [p.userId] : [])
  }
  return out
}

async function desiredAwards(tx: Tx, tournamentId: string): Promise<DesiredAward[]> {
  const tournament = await tx.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { status: true, resultsFinalizedAt: true },
  })
  // Points exist only for officially completed tournaments.
  if (tournament.status !== 'completed' || !tournament.resultsFinalizedAt) return []

  const final = await computeFinalPlacements(tx, tournamentId)
  if (!final) return []

  const played = participatedEntrants(final.state.matches)
  const fieldSize = Math.max(1, played.size)
  const entrants = final.state.entrants.map((id) => ({ id, userId: final.state.participants.get(id)?.userId ?? null }))
  const players = await playersOf(tx, entrants)

  const byUser = new Map<string, DesiredAward>()
  for (const entrant of entrants) {
    const placement = final.placements.get(entrant.id) ?? null
    const participated = played.has(entrant.id)
    const base = basePoints(placement, participated)
    const points = finalPoints(base, fieldSize)
    if (points <= 0) continue

    for (const userId of players.get(entrant.id) ?? []) {
      // One award per player per tournament, even if listed twice.
      const existing = byUser.get(userId)
      if (existing && existing.points >= points) continue
      byUser.set(userId, {
        userId,
        participantId: entrant.id,
        placement: participated ? placement : null,
        basePoints: base,
        fieldSize,
        points,
      })
    }
  }
  return [...byUser.values()]
}

export type AwardSummary = { created: number; updated: number; removed: number; affectedUsers: string[] }

export async function awardTournamentPoints(
  tournamentId: string,
  reason: PointChangeReason,
  actorId: string | null,
  note?: string
): Promise<AwardSummary> {
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM Tournament WHERE id = ${tournamentId} FOR UPDATE`
      const tournament = await tx.tournament.findUniqueOrThrow({
        where: { id: tournamentId },
        select: { sport: true, category: true, resultsFinalizedAt: true },
      })

      const desired = await desiredAwards(tx, tournamentId)
      const existing = await tx.pointAward.findMany({ where: { tournamentId } })
      const existingByUser = new Map(existing.map((a) => [a.userId, a]))
      const desiredByUser = new Map(desired.map((a) => [a.userId, a]))
      const summary: AwardSummary = { created: 0, updated: 0, removed: 0, affectedUsers: [] }

      const audit = (userId: string, previous: number, next: number) =>
        tx.pointAuditLog.create({
          data: {
            tournamentId,
            userId,
            previousPoints: previous,
            newPoints: next,
            delta: next - previous,
            reason,
            note: note ?? null,
            actorId,
          },
        })

      for (const award of desired) {
        const current = existingByUser.get(award.userId)
        const data = {
          participantId: award.participantId,
          placement: award.placement,
          basePoints: award.basePoints,
          fieldSize: award.fieldSize,
          points: award.points,
          sport: tournament.sport,
          category: tournament.category,
          earnedAt: tournament.resultsFinalizedAt!,
          configVersion: POINTS_CONFIG.version,
        }

        if (!current) {
          await tx.pointAward.create({ data: { ...data, userId: award.userId, tournamentId } })
          await audit(award.userId, 0, award.points)
          summary.created += 1
          summary.affectedUsers.push(award.userId)
          continue
        }

        const changed =
          current.points !== data.points ||
          current.placement !== data.placement ||
          current.fieldSize !== data.fieldSize ||
          current.earnedAt.getTime() !== data.earnedAt.getTime() ||
          current.sport !== data.sport ||
          current.configVersion !== data.configVersion
        if (!changed) continue

        await tx.pointAward.update({ where: { id: current.id }, data })
        if (current.points !== data.points) await audit(award.userId, current.points, data.points)
        summary.updated += 1
        summary.affectedUsers.push(award.userId)
      }

      for (const current of existing) {
        if (desiredByUser.has(current.userId)) continue
        await tx.pointAward.delete({ where: { id: current.id } })
        await audit(current.userId, current.points, 0)
        summary.removed += 1
        summary.affectedUsers.push(current.userId)
      }

      if (summary.affectedUsers.length > 0) await refreshPointCaches(tx, [tournament.sport])
      return summary
    },
    { timeout: 30_000, maxWait: 10_000 }
  )
}

const TIERS: [number, string][] = [
  [2000, 'champion'],
  [1000, 'diamond'],
  [500, 'platinum'],
  [250, 'gold'],
  [100, 'silver'],
  [0, 'bronze'],
]

export function tierFor(points: number) {
  return TIERS.find(([min]) => points >= min)![1]
}

/**
 * Rebuild the cached totals the profile reads (`User.totalPoints`,
 * `User.globalRank`, `SportRank`) from the ledger. `sports` limits the
 * per-sport rebuild; omit it to rebuild everything.
 */
export async function refreshPointCaches(tx: Tx, sports?: string[]) {
  await tx.$executeRaw`
    UPDATE User u
    LEFT JOIN (SELECT userId, SUM(points) AS total FROM PointAward GROUP BY userId) p ON p.userId = u.id
    SET u.totalPoints = COALESCE(p.total, 0)`
  await tx.$executeRaw`UPDATE User SET globalRank = 0`
  await tx.$executeRaw`
    UPDATE User u
    JOIN (
      SELECT id, RANK() OVER (ORDER BY totalPoints DESC) AS r
      FROM User WHERE totalPoints > 0 AND role = 'USER'
    ) x ON x.id = u.id
    SET u.globalRank = x.r`

  const targetSports =
    sports ?? (await tx.pointAward.findMany({ distinct: ['sport'], select: { sport: true } })).map((s) => s.sport)

  for (const sport of new Set(targetSports)) {
    const totals = await tx.pointAward.groupBy({
      by: ['userId'],
      where: { sport },
      _sum: { points: true },
    })
    const sorted = totals
      .map((t) => ({ userId: t.userId, points: t._sum.points ?? 0 }))
      .sort((a, b) => b.points - a.points)

    await tx.sportRank.deleteMany({ where: { sport } })
    if (sorted.length === 0) continue
    await tx.sportRank.createMany({
      data: sorted.map((row) => ({
        sport,
        userId: row.userId,
        points: row.points,
        rank: 1 + sorted.filter((other) => other.points > row.points).length,
        tier: tierFor(row.points),
      })),
    })
  }
}

/** Full rebuild — the admin "recalculate" button and the seed use this. */
export async function recalculateAllPoints(actorId: string | null) {
  const tournaments = await db.tournament.findMany({
    where: { OR: [{ resultsFinalizedAt: { not: null } }, { pointAwards: { some: {} } }] },
    select: { id: true },
  })
  let changed = 0
  for (const t of tournaments) {
    const summary = await awardTournamentPoints(t.id, 'RECALCULATED', actorId)
    changed += summary.created + summary.updated + summary.removed
  }
  await db.$transaction(async (tx) => {
    // Sports with no awards left still need their stale cache rows removed.
    const live = (await tx.pointAward.findMany({ distinct: ['sport'], select: { sport: true } })).map((s) => s.sport)
    await tx.sportRank.deleteMany({ where: { sport: { notIn: live } } })
    await refreshPointCaches(tx)
  })
  return { tournaments: tournaments.length, changed }
}
