import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getChannelAccess } from '@/lib/channels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChannelThread } from './channel-thread'

export const dynamic = 'force-dynamic'

export const metadata = { robots: { index: false } }

const POST_PAGE_SIZE = 60

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/messages/${channelId}`)}`)

  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      type: true,
      title: true,
      handle: true,
      description: true,
      avatar: true,
      archived: true,
      organization: { select: { id: true, name: true, slug: true } },
      tournament: { select: { id: true, title: true, status: true, sport: true, date: true } },
      _count: { select: { members: true } },
    },
  })

  if (!channel) notFound()

  const access = await getChannelAccess(channelId, user.id)

  // Tournament channels are for participants and staff; organization
  // channels are open to anyone signed in, so they can subscribe.
  if (!access.isSubscribed && channel.type === 'TOURNAMENT' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="space-y-3 py-12 text-center">
            <p className="font-medium">Bu kanal yopiq</p>
            <p className="text-sm text-muted-foreground">
              Turnir kanaliga faqat ishtirokchilar va tayinlangan xodimlar kira oladi.
            </p>
            <Button variant="outline" asChild>
              <Link href={`/tournament/${channel.tournament?.id ?? ''}`}>Turnirni ko‘rish</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const posts = await db.channelPost.findMany({
    where: { channelId },
    orderBy: { createdAt: 'asc' },
    take: POST_PAGE_SIZE,
    select: {
      id: true,
      content: true,
      pinned: true,
      createdAt: true,
      mediaId: true,
      author: { select: { id: true, name: true, avatar: true } },
    },
  })

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4">
      <Button variant="ghost" asChild className="mb-2 -ml-2">
        <Link href="/messages" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kanallar
        </Link>
      </Button>

      <ChannelThread
        channel={{
          id: channel.id,
          type: channel.type,
          title: channel.title,
          handle: channel.handle,
          description: channel.description,
          avatar: channel.avatar,
          archived: channel.archived,
          memberCount: channel._count.members,
          organization: channel.organization,
          tournament: channel.tournament,
        }}
        access={{
          canPost: access.canPost,
          memberRole: access.memberRole,
          isSubscribed: access.isSubscribed,
        }}
        currentUserId={user.id}
        posts={posts.map((post) => ({
          id: post.id,
          content: post.content,
          pinned: post.pinned,
          createdAt: post.createdAt.toISOString(),
          mediaUrl: post.mediaId ? `/api/media/${post.mediaId}` : null,
          author: post.author,
        }))}
      />
    </div>
  )
}
