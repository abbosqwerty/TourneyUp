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

  const topUserIds = top.map((row) => row.userId)

  const [users, directWins, rosterLinks] = await Promise.all([
    db.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, username: true, avatar: true, university: true },
    }),
    // Individual wins + team captain wins (where winnerUserId is set)
    db.match.findMany({
      where: { winnerUserId: { in: topUserIds }, status: 'completed', isBye: false },
      select: { id: true, winnerUserId: true },
    }),
    // Roster memberships — needed to count team wins for non-captain members
    db.participantRosterMember.findMany({
      where: { userId: { in: topUserIds } },
      select: { userId: true, participantId: true },
    }),
  ])

  // Find team wins via roster: matches won by a participant the user is rostered on
  const rosterParticipantIds = [...new Set(rosterLinks.map((r) => r.participantId))]
  const teamWinMatches =
    rosterParticipantIds.length > 0
      ? await db.match.findMany({
          where: { winnerParticipantId: { in: rosterParticipantIds }, status: 'completed', isBye: false },
          select: { id: true, winnerParticipantId: true },
        })
      : []

  // Build participantId → userId[] lookup
  const pidToUsers = new Map<string, string[]>()
  for (const link of rosterLinks) {
    const arr = pidToUsers.get(link.participantId) ?? []
    arr.push(link.userId)
    pidToUsers.set(link.participantId, arr)
  }

  // Deduplicate by match ID per user to avoid double-counting captains
  const winMatchIds = new Map<string, Set<string>>() // userId → set of match IDs
  for (const m of directWins) {
    if (!m.winnerUserId) continue
    const set = winMatchIds.get(m.winnerUserId) ?? new Set()
    set.add(m.id)
    winMatchIds.set(m.winnerUserId, set)
  }
  for (const m of teamWinMatches) {
    if (!m.winnerParticipantId) continue
    for (const uid of pidToUsers.get(m.winnerParticipantId) ?? []) {
      const set = winMatchIds.get(uid) ?? new Set()
      set.add(m.id)
      winMatchIds.set(uid, set)
    }
  }

  const userById = new Map(users.map((u) => [u.id, u]))

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
          wins: winMatchIds.get(u.id)?.size ?? 0,
        },
      ]
    }),
    me: mine ? { rank: mine.rank, points: mine.points } : null,
    sports,
  }
}
