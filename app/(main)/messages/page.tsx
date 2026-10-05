import { db } from '@/lib/db'
import MessagesClient from './messages-client'
import { cookies } from 'next/headers'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Channels & Support | TourneyUp',
  description: 'Organizer channels, tournament chronicles, and support desk',
}

export default async function MessagesPage() {
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
    <MessagesClient
      currentUserId={userId}
      currentUserName={currentUserName}
      currentUserAvatar={currentUserAvatar}
      isOrganizer={isOrganizer}
    />
  )
}
