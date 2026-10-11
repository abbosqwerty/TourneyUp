import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { sportCategories } from '@/lib/constants'
import { getLeaderboard, leaderboardSports, LEADERBOARD_PERIODS, type LeaderboardPeriod } from '@/lib/points/leaderboard'
import { DbErrorCard } from '@/components/db-error-card'
import RankingsClient from './rankings-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reyting',
  description: 'TourneyUp reytingi — turnirlarda to‘plangan Tourney Points (T).',
}

const PAGE_SIZE = 100

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export default async function RankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const rawPeriod = readParam(params.period)
  const period: LeaderboardPeriod = (LEADERBOARD_PERIODS as readonly string[]).includes(rawPeriod)
    ? (rawPeriod as LeaderboardPeriod)
    : 'monthly'
  const sport = readParam(params.sport).slice(0, 60)
  const user = await getCurrentUser()

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load({ period, sport, userId: user?.id ?? null })
  } catch (error) {
    console.error('rankings page failed', error)
  }

  if (!data) return <DbErrorCard message="Reytingni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />

  return (
    <RankingsClient
      rankings={data.rankings}
      me={data.me}
      currentUserId={user?.id ?? ''}
      period={period}
      sport={sport}
      sports={data.sports}
    />
  )
}

async function load({ period, sport, userId }: { period: LeaderboardPeriod; sport: string; userId: string | null }) {
  const [board, sportsWithPoints] = await Promise.all([
    getLeaderboard({ period, sport: sport || null }),
    leaderboardSports(),
  ])

  const top = board.slice(0, PAGE_SIZE)
  const mine = userId ? board.find((row) => row.userId === userId) : undefined

  const [users, wins] = await Promise.all([
    db.user.findMany({
      where: { id: { in: top.map((row) => row.userId) } },
      select: { id: true, name: true, username: true, avatar: true, university: true },
    }),
    db.match.groupBy({
      by: ['winnerUserId'],
      where: { winnerUserId: { in: top.map((row) => row.userId) }, status: 'completed', isBye: false },
      _count: { _all: true },
    }),
  ])
  const userById = new Map(users.map((u) => [u.id, u]))
  const winsById = new Map(wins.map((w) => [w.winnerUserId, w._count._all]))

  // The game filter offers the standard list plus any game that has points.
  const sports = [...new Set([...sportCategories.filter((c) => c.match).map((c) => c.match), ...sportsWithPoints])].sort()

  return {
    rankings: top.flatMap((row) => {
      const u = userById.get(row.userId)
      if (!u) return []
      return [
        {
          rank: row.rank,
          user: { id: u.id, name: u.name, username: u.username, avatar: u.avatar, university: u.university ?? undefined },
          points: row.points,
          wins: winsById.get(u.id) ?? 0,
        },
      ]
    }),
    me: mine ? { rank: mine.rank, points: mine.points } : null,
    sports,
  }
}
