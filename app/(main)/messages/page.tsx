import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { listChannelsForUser } from '@/lib/channels'
import { DbErrorCard } from '@/components/db-error-card'
import { ChannelsClient } from './channels-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kanallar',
  robots: { index: false },
}

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fmessages')

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load(user.id)
  } catch (error) {
    console.error('messages page failed', error)
  }

  if (!data) return <DbErrorCard message="Kanallarni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />

  return <ChannelsClient channels={data.channels} discover={data.discover} />
}

async function load(userId: string) {
  const [channels, discover] = await Promise.all([
    listChannelsForUser(userId),
    // Organization channels the user has not joined yet.
    db.channel.findMany({
      where: {
        type: 'ORGANIZATION',
        archived: false,
        members: { none: { userId } },
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        handle: true,
        avatar: true,
        description: true,
        _count: { select: { members: true } },
      },
    }),
  ])

  return {
    channels: channels.map((channel) => ({
      ...channel,
      lastMessageAt: channel.lastMessageAt?.toISOString() ?? null,
    })),
    discover: discover.map((channel) => ({
      id: channel.id,
      title: channel.title,
      handle: channel.handle,
      avatar: channel.avatar,
      description: channel.description,
      memberCount: channel._count.members,
    })),
  }
}
