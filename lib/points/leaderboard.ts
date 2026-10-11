import type { Prisma } from '@prisma/client'
import { db } from '../db'
import { startOfMonth, startOfWeek } from '../time'

export const LEADERBOARD_PERIODS = ['weekly', 'monthly', 'all'] as const
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number]

export type LeaderboardRow = { rank: number; userId: string; username: string; points: number }

/**
 * Sum the ledger for a period and/or game. Weekly and monthly are windows
 * over the same rows as all-time — nothing is ever reset or removed, a
 * period only filters by `earnedAt` (the tournament's finalization time, in
 * Tashkent calendar terms).
 *
 * Equal points share a rank (1, 1, 3 …); within a rank rows are ordered by
 * username so the list is stable.
 */
export async function getLeaderboard(options: {
  period: LeaderboardPeriod
  sport?: string | null
  now?: Date
}): Promise<LeaderboardRow[]> {
  const now = options.now ?? new Date()
  const where: Prisma.PointAwardWhereInput = {}
  if (options.period === 'weekly') where.earnedAt = { gte: startOfWeek(now) }
  if (options.period === 'monthly') where.earnedAt = { gte: startOfMonth(now) }
  if (options.sport) where.sport = options.sport

  const grouped = await db.pointAward.groupBy({
    by: ['userId'],
    where,
    _sum: { points: true },
  })
  if (grouped.length === 0) return []

  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, username: true },
  })
  const usernames = new Map(users.map((u) => [u.id, u.username]))

  const rows = grouped
    .map((g) => ({ userId: g.userId, username: usernames.get(g.userId) ?? '', points: g._sum.points ?? 0 }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username))

  let rank = 0
  return rows.map((row, index) => {
    if (index === 0 || rows[index - 1].points !== row.points) rank = index + 1
    return { rank, ...row }
  })
}

/** Games that have points, for the leaderboard's game filter. */
export async function leaderboardSports(): Promise<string[]> {
  const rows = await db.pointAward.findMany({ distinct: ['sport'], select: { sport: true }, orderBy: { sport: 'asc' } })
  return rows.map((r) => r.sport)
}
