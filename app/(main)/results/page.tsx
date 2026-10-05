import { db } from '@/lib/db'
import ResultsClient from './results-client'
import { cookies } from 'next/headers'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Match Results & Live Center | TourneyUp',
  description: 'Live scores, real-time match statistics, and tournament results ledger',
}

export default async function ResultsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'user1'

  let currentUserName = 'Abbos Qurbonov'
  let currentUserAvatar = '/avatars/alex.jpg'
  let isOrganizer = false

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, globalRank: true },
    })
    if (user) {
      currentUserName = user.name
      currentUserAvatar = user.avatar
      isOrganizer = user.id.startsWith('org') || user.globalRank === 0
    }
  } catch {
    // Fallback if DB unavailable
  }

  return (
    <ResultsClient
      currentUserId={userId}
      currentUserName={currentUserName}
      currentUserAvatar={currentUserAvatar}
      isOrganizer={isOrganizer}
    />
  )
}
