import { db } from '@/lib/db'
import RankingsClient from './rankings-client'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function RankingsPage() {
  const cookieStore = await cookies()
  const activeUserId = cookieStore.get('userId')?.value || ''

  // Fetch all ranked users (non-organizers, globalRank > 0) sorted by rank
  const users = await db.user.findMany({
    where: { globalRank: { gt: 0 } },
    orderBy: { globalRank: 'asc' },
    include: {
      sportRanks: true,
      matchHistory: true,
    }
  })

  // Build rankings entries with win counts from match history
  const rankings = users.map((u, index) => {
    const wins = u.matchHistory.filter(m => m.result === 'win').length
    // Simple change simulation based on rank position (in real app this would come from historical data)
    const changeOptions: Array<'up' | 'down' | 'same'> = ['up', 'down', 'same']
    const change = changeOptions[index % 3]
    const changeAmount = index % 3 === 2 ? 0 : (index % 5) + 1

    return {
      rank: index + 1,
      user: {
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
        university: u.university ?? undefined,
      },
      points: u.totalPoints,
      wins,
      change,
      changeAmount,
    }
  })

  // Current active user stats
  const currentUser = users.find(u => u.id === activeUserId)

  return (
    <RankingsClient
      initialRankings={rankings}
      currentUserRank={currentUser?.globalRank ?? 0}
      currentUserPoints={currentUser?.totalPoints ?? 0}
      currentUserId={activeUserId}
    />
  )
}
