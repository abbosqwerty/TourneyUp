import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { listChannelsForUser } from '@/lib/channels'
import { listStaffQueue, listTicketsForRequester } from '@/lib/support'
import { DbErrorCard } from '@/components/db-error-card'
import { getI18n } from '@/lib/i18n/server'
import { MessagesShell, type SidebarData } from './messages-shell'

export const dynamic = 'force-dynamic'

/**
 * Messages = four sections in one place: organization announcement
 * channels, tournament groups, team groups and support. The sidebar lives
 * in the layout so it stays put while a conversation is open.
 */
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fmessages')

  let data: SidebarData | null = null
  try {
    data = await load(user.id, user.role)
  } catch (error) {
    console.error('messages sidebar failed', error)
  }
  if (!data) {
    const { dict } = await getI18n()
    return <DbErrorCard message={dict.chat.load_failed} />
  }

  return <MessagesShell data={data} isPlayer={user.role === 'USER'}>{children}</MessagesShell>
}

async function load(userId: string, role: string): Promise<SidebarData> {
  const [channels, discover, myTickets, staffQueue] = await Promise.all([
    listChannelsForUser(userId),
    // Organization channels the user does not follow yet.
    db.channel.findMany({
      where: { type: 'ORGANIZATION', archived: false, members: { none: { userId } } },
      take: 12,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, handle: true, avatar: true, _count: { select: { members: true } } },
    }),
    listTicketsForRequester(userId),
    listStaffQueue(userId, role),
  ])

  return {
    channels: channels.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      avatar: c.avatar,
      archived: c.archived,
      memberRole: c.memberRole,
      handle: c.handle,
      sport: c.tournament?.sport ?? c.team?.sport ?? '',
      memberCount: c.type === 'TEAM' ? (c.team?.memberCount ?? 0) : null,
      lastMessage: c.lastMessage,
      lastAuthor: c.lastAuthor,
      lastSystem: c.lastMessageKind === 'SYSTEM',
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      unreadCount: c.unreadCount,
    })),
    discover: discover.map((c) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      avatar: c.avatar,
      memberCount: c._count.members,
    })),
    myTickets,
    staffQueue,
  }
}
