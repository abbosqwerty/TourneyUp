import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, Lock } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getChannelAccess } from '@/lib/channels'
import { getI18n } from '@/lib/i18n/server'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { Button } from '@/components/ui/button'
import { ChannelThread, type ThreadPost } from './channel-thread'

export const dynamic = 'force-dynamic'

export const metadata = { robots: { index: false } }

const POST_PAGE_SIZE = 80

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  const { dict } = await getI18n()
  const t = dict.chat.channel_page
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
      organization: { select: { id: true, name: true, ownerId: true } },
      tournament: {
        select: {
          id: true,
          title: true,
          status: true,
          sport: true,
          date: true,
          endDate: true,
          organizerId: true,
          drawGeneratedAt: true,
          organization: { select: { ownerId: true } },
          _count: { select: { participants: { where: { status: 'approved' } } } },
        },
      },
      team: { select: { id: true, name: true, sport: true } },
      _count: { select: { members: true } },
    },
  })
  if (!channel) notFound()

  // Read access is decided on the server; private groups do not leak posts.
  const access = await getChannelAccess(channelId, user.id)
  if (!access.canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Lock className="h-10 w-10 text-muted-foreground" aria-hidden />
        <p className="font-medium">{t.closed_title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {channel.type === 'TEAM' ? t.closed_team : t.closed_tournament}
        </p>
        <Button variant="outline" asChild>
          <Link href="/messages">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t.back}
          </Link>
        </Button>
      </div>
    )
  }

  const recent = await db.channelPost.findMany({
    where: { channelId },
    orderBy: { createdAt: 'desc' },
    take: POST_PAGE_SIZE,
    select: {
      id: true,
      content: true,
      pinned: true,
      kind: true,
      createdAt: true,
      mediaId: true,
      author: { select: { id: true, name: true, avatar: true, role: true } },
    },
  })
  const posts = recent.reverse()

  const roleOf = await authorRoles(channel, dict, [...new Set(posts.map((p) => p.author.id))])

  return (
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
        tournament: channel.tournament
          ? {
              id: channel.tournament.id,
              status: channel.tournament.status,
              sport: channel.tournament.sport,
              date: channel.tournament.date,
              endDate: channel.tournament.endDate,
              participants: channel.tournament._count.participants,
              drawn: channel.tournament.drawGeneratedAt !== null,
            }
          : null,
        team: channel.team,
      }}
      access={access}
      currentUserId={user.id}
      posts={posts.map(
        (post): ThreadPost => ({
          id: post.id,
          content: post.content,
          pinned: post.pinned,
          kind: post.kind,
          createdAt: post.createdAt.toISOString(),
          mediaUrl: post.mediaId ? `/api/media/${post.mediaId}` : null,
          author: { id: post.author.id, name: post.author.name, avatar: post.author.avatar },
          authorRole: post.author.role === 'SUPER_ADMIN' ? 'TourneyUp' : (roleOf.get(post.author.id) ?? null),
        })
      )}
    />
  )
}

type ChannelForRoles = {
  type: string
  organization: { ownerId: string } | null
  tournament: { id: string; organizerId: string; organization: { ownerId: string } | null } | null
  team: { id: string } | null
}

/** Label shown next to an author: who they are in this group. */
async function authorRoles(channel: ChannelForRoles, dict: Dictionary, authorIds: string[]): Promise<Map<string, string>> {
  const r = dict.chat.roles
  const roles = new Map<string, string>()
  if (authorIds.length === 0) return roles

  if (channel.organization) roles.set(channel.organization.ownerId, r.official)

  if (channel.tournament) {
    const grants = await db.tournamentStaff.findMany({
      where: { tournamentId: channel.tournament.id, userId: { in: authorIds } },
      select: { userId: true, role: true },
    })
    for (const g of grants) roles.set(g.userId, r.staff[g.role])
    roles.set(channel.tournament.organizerId, r.organizer)
    if (channel.tournament.organization) roles.set(channel.tournament.organization.ownerId, r.organizer)
  }

  if (channel.team) {
    const members = await db.teamMember.findMany({
      where: { teamId: channel.team.id, userId: { in: authorIds }, role: { in: ['OWNER', 'CAPTAIN'] } },
      select: { userId: true, role: true },
    })
    for (const m of members) roles.set(m.userId, m.role === 'OWNER' ? r.team_owner : r.captain)
  }

  return roles
}
