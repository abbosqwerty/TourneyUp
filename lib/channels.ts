import { db } from './db'
import type { ChannelMemberRole } from '@prisma/client'

/** Plain helpers — not server actions. See the note in `lib/staff.ts`. */

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueHandle(base: string) {
  const root = (slugify(base) || 'channel').slice(0, 50)
  let candidate = root
  for (let i = 2; i < 50; i++) {
    const clash = await db.channel.findUnique({ where: { handle: candidate }, select: { id: true } })
    if (!clash) return candidate
    candidate = `${root}-${i}`
  }
  return `${root}-${Date.now().toString(36)}`
}

/** Create the tournament's announcement channel if it does not exist yet. */
export async function ensureTournamentChannel(tournamentId: string) {
  const existing = await db.channel.findUnique({ where: { tournamentId }, select: { id: true } })
  if (existing) return existing.id

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { title: true, sport: true, description: true, organizerId: true, posterUrl: true },
  })
  if (!tournament) return null

  const channel = await db.channel.create({
    data: {
      type: 'TOURNAMENT',
      title: tournament.title,
      handle: await uniqueHandle(`t-${tournament.sport}-${tournament.title}`),
      description: tournament.description.slice(0, 500),
      avatar: tournament.posterUrl || '/placeholder.jpg',
      tournamentId,
    },
    select: { id: true },
  })

  await db.channelMember.create({
    data: { channelId: channel.id, userId: tournament.organizerId, role: 'OWNER' },
  })

  return channel.id
}

/** Create the organization's channel if it does not exist yet. */
export async function ensureOrganizationChannel(organizationId: string) {
  const existing = await db.channel.findUnique({ where: { organizationId }, select: { id: true } })
  if (existing) return existing.id

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, slug: true, description: true, ownerId: true },
  })
  if (!organization) return null

  const channel = await db.channel.create({
    data: {
      type: 'ORGANIZATION',
      title: organization.name,
      handle: await uniqueHandle(organization.slug),
      description: organization.description.slice(0, 500),
      avatar: '/placeholder-user.jpg',
      organizationId,
    },
    select: { id: true },
  })

  await db.channelMember.create({
    data: { channelId: channel.id, userId: organization.ownerId, role: 'OWNER' },
  })

  return channel.id
}

export type ChannelWriteAccess = {
  canPost: boolean
  memberRole: ChannelMemberRole | null
  isSubscribed: boolean
}

/**
 * Channels are broadcast-style: only the owner and active staff may post.
 * Subscribers read. This is the Telegram-channel behaviour the product
 * asks for — it is deliberately not a peer-to-peer chat.
 */
export async function getChannelAccess(channelId: string, userId?: string | null): Promise<ChannelWriteAccess> {
  if (!userId) return { canPost: false, memberRole: null, isSubscribed: false }

  const [channel, membership, user] = await Promise.all([
    db.channel.findUnique({
      where: { id: channelId },
      select: {
        archived: true,
        organization: { select: { ownerId: true } },
        tournament: { select: { id: true, organizerId: true, organization: { select: { ownerId: true } } } },
      },
    }),
    db.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { role: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])

  if (!channel) return { canPost: false, memberRole: null, isSubscribed: false }

  const isSubscribed = Boolean(membership)
  if (channel.archived && user?.role !== 'SUPER_ADMIN') {
    return { canPost: false, memberRole: membership?.role ?? null, isSubscribed }
  }

  const isOwner =
    user?.role === 'SUPER_ADMIN' ||
    channel.organization?.ownerId === userId ||
    channel.tournament?.organizerId === userId ||
    channel.tournament?.organization?.ownerId === userId

  if (isOwner) return { canPost: true, memberRole: membership?.role ?? 'OWNER', isSubscribed }

  // Tournament channels also accept posts from live staff grants.
  if (channel.tournament) {
    const grant = await db.tournamentStaff.findUnique({
      where: { tournamentId_userId: { tournamentId: channel.tournament.id, userId } },
      select: { revokedAt: true },
    })
    if (grant && !grant.revokedAt) {
      return { canPost: true, memberRole: membership?.role ?? 'STAFF', isSubscribed }
    }
  }

  return { canPost: false, memberRole: membership?.role ?? null, isSubscribed }
}

/** Channels the user can see in /messages, newest activity first. */
export async function listChannelsForUser(userId: string) {
  const memberships = await db.channelMember.findMany({
    where: { userId },
    select: {
      role: true,
      lastReadAt: true,
      channel: {
        select: {
          id: true,
          type: true,
          title: true,
          handle: true,
          avatar: true,
          archived: true,
          organization: { select: { id: true, name: true, slug: true } },
          tournament: { select: { id: true, title: true, status: true, sport: true } },
          posts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, author: { select: { name: true } } },
          },
        },
      },
    },
  })

  const withUnread = await Promise.all(
    memberships.map(async (m) => {
      const unread = await db.channelPost.count({
        where: {
          channelId: m.channel.id,
          ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
        },
      })
      const last = m.channel.posts[0]
      return {
        id: m.channel.id,
        type: m.channel.type,
        title: m.channel.title,
        handle: m.channel.handle,
        avatar: m.channel.avatar,
        archived: m.channel.archived,
        memberRole: m.role,
        organization: m.channel.organization,
        tournament: m.channel.tournament,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.createdAt ?? null,
        lastAuthor: last?.author.name ?? null,
        unreadCount: unread,
      }
    })
  )

  return withUnread.sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0))
}
