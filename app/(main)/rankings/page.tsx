import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { DbErrorCard } from '@/components/db-error-card'
import RankingsClient from './rankings-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reyting',
  description: 'TourneyUp global reytingi — eng ko‘p ball to‘plagan o‘yinchilar.',
}

const PAGE_SIZE = 100

export default async function RankingsPage() {
  const user = await getCurrentUser()

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load(user?.id ?? null)
  } catch (error) {
    console.error('rankings page failed', error)
  }

  if (!data) return <DbErrorCard message="Reytingni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />

  return (
    <RankingsClient
      initialRankings={data.rankings}
      currentUserRank={data.myRank}
      currentUserPoints={data.myPoints}
      currentUserId={user?.id ?? ''}
    />
  )
}

async function load(userId: string | null) {
  // Win counts come from the database, not from loading every match into
  // memory and filtering in JS.
  const users = await db.user.findMany({
    where: { role: 'USER', globalRank: { gt: 0 } },
    orderBy: { globalRank: 'asc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      university: true,
      globalRank: true,
      totalPoints: true,
      // Wins are completed fixtures this user won — one aggregate, no row loading.
      _count: { select: { wonMatches: true } },
    },
  })

  const me = userId ? users.find((u) => u.id === userId) : undefined

  return {
    rankings: users.map((u, index) => ({
      rank: index + 1,
      user: {
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
        university: u.university ?? undefined,
      },
      points: u.totalPoints,
      wins: u._count.wonMatches,
    })),
    myRank: me?.globalRank ?? 0,
    myPoints: me?.totalPoints ?? 0,
  }
}
