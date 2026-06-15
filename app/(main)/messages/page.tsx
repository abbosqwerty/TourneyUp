import { db } from '@/lib/db'
import MessagesClient from './messages-client'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'user1'

  // Load all conversations user is part of
  const convParticipants = await db.conversationParticipant.findMany({
    where: { userId: userId },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { timestamp: 'asc' } },
          participants: {
            include: { user: true }
          }
        }
      }
    },
    orderBy: { conversation: { lastMessageTime: 'desc' } }
  })

  // Build typed conversations list
  const conversations = convParticipants.map(cp => {
    const conv = cp.conversation
    // Other participants
    const others = conv.participants
      .filter(p => p.userId !== userId)
      .map(p => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
      }))

    return {
      id: conv.id,
      participants: others,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount,
      tournamentContext: conv.tournamentContextId
        ? { id: conv.tournamentContextId, name: conv.tournamentContextName ?? '' }
        : undefined,
      messages: conv.messages.map(m => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar,
        content: m.content,
        timestamp: m.timestamp,
        read: m.read,
      }))
    }
  })

  return (
    <MessagesClient
      initialConversations={conversations}
      currentUserId={userId}
    />
  )
}
