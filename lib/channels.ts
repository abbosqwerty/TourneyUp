import { db } from './db'
import type { ChannelMemberRole, Prisma, TeamRole } from '@prisma/client'
import { mediaUrl } from './media'
import { encodeSystemPost, type SystemPostKey } from './stored-text'

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

type Client = Prisma.TransactionClient | typeof db

const TEAM_CHANNEL_ROLE: Record<TeamRole, ChannelMemberRole> = {
  OWNER: 'OWNER',
  CAPTAIN: 'STAFF',
  MEMBER: 'SUBSCRIBER',
}

/**
 * Create the team's private group if it does not exist yet. The group has no
 * membership list of its own: `syncTeamChannel` mirrors TeamMember into it.
 */
export async function ensureTeamChannel(teamId: string, client: Client = db) {
  const existing = await client.channel.findUnique({ where: { teamId }, select: { id: true } })
  if (existing) return existing.id

  const team = await client.team.findUnique({
    where: { id: teamId },
    select: { name: true, slug: true, sport: true, description: true, logoMediaId: true },
  })
  if (!team) return null

  const channel = await client.channel.create({
    data: {
      type: 'TEAM',
      title: team.name,
      handle: await uniqueHandle(`team-${team.slug}`),
      description: (team.description ?? `${team.sport} jamoasi`).slice(0, 500),
      avatar: mediaUrl(team.logoMediaId) || '/placeholder-user.jpg',
      teamId,
    },
    select: { id: true },
  })
  return channel.id
}

/**
 * Make the team group's members exactly the team's current members. Run in
 * the same transaction as every membership change, so someone who leaves or
 * is removed loses access to the private conversation at once.
 */
export async function syncTeamChannel(teamId: string, client: Client = db) {
  const channelId = await ensureTeamChannel(teamId, client)
  if (!channelId) return

  const [team, members, current] = await Promise.all([
    client.team.findUniqueOrThrow({ where: { id: teamId }, select: { name: true, logoMediaId: true, disbandedAt: true } }),
    client.teamMember.findMany({ where: { teamId, leftAt: null }, select: { userId: true, role: true } }),
    client.channelMember.findMany({ where: { channelId }, select: { userId: true, role: true } }),
  ])

  const desired = new Map(members.map((m) => [m.userId, TEAM_CHANNEL_ROLE[m.role]]))
  const stale = current.filter((m) => !desired.has(m.userId)).map((m) => m.userId)
  if (stale.length > 0) await client.channelMember.deleteMany({ where: { channelId, userId: { in: stale } } })

  for (const [userId, role] of desired) {
    const existing = current.find((m) => m.userId === userId)
    if (existing?.role === role) continue
    await client.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: { role },
      create: { channelId, userId, role },
    })
  }

  await client.channel.update({
    where: { id: channelId },
    data: {
      title: team.name,
      avatar: mediaUrl(team.logoMediaId) || '/placeholder-user.jpg',
      archived: team.disbandedAt !== null,
    },
  })
}

export type ChannelAccess = {
  canRead: boolean
  canPost: boolean
  /** May publish official announcements and pin. */
  canAnnounce: boolean
  /** May delete other people's messages. */
  canModerate: boolean
  memberRole: ChannelMemberRole | null
  isSubscribed: boolean
}

const NO_ACCESS: ChannelAccess = {
  canRead: false,
  canPost: false,
  canAnnounce: false,
  canModerate: false,
  memberRole: null,
  isSubscribed: false,
}

/**
 * Who may read and write a channel — the only place this is decided, and
 * always on the server.
 *
 *   ORGANIZATION  everyone signed in reads (and may follow); only the
 *                 organization owner publishes.
 *   TOURNAMENT    private group: organizer, organization owner and live staff
 *                 (ADMIN/ORGANIZER/SUPPORT) plus confirmed participants. All of
 *                 them may write; only the organizer side announces.
 *   TEAM          private group of the team's current members.
 *
 * An archived channel stays readable for its members but nobody writes.
 * A super admin can read and moderate everything.
 */
export async function getChannelAccess(channelId: string, userId?: string | null): Promise<ChannelAccess> {
  if (!userId) return NO_ACCESS

  const [channel, membership, user] = await Promise.all([
    db.channel.findUnique({
      where: { id: channelId },
      select: {
        type: true,
        archived: true,
        organization: { select: { ownerId: true } },
        tournament: { select: { id: true, organizerId: true, organization: { select: { ownerId: true } } } },
        teamId: true,
      },
    }),
    db.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { role: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])
  if (!channel || !user) return NO_ACCESS

  const memberRole = membership?.role ?? null
  const isSubscribed = Boolean(membership)
  const open = !channel.archived

  if (user.role === 'SUPER_ADMIN') {
    return { canRead: true, canPost: open, canAnnounce: open, canModerate: true, memberRole, isSubscribed }
  }

  if (channel.type === 'ORGANIZATION') {
    const owner = channel.organization?.ownerId === userId
    return { canRead: true, canPost: owner && open, canAnnounce: owner && open, canModerate: owner, memberRole, isSubscribed }
  }

  if (channel.type === 'TOURNAMENT' && channel.tournament) {
    const owner =
      channel.tournament.organizerId === userId || channel.tournament.organization?.ownerId === userId
    if (owner) return { canRead: true, canPost: open, canAnnounce: open, canModerate: true, memberRole: memberRole ?? 'OWNER', isSubscribed }

    const grant = await db.tournamentStaff.findUnique({
      where: { tournamentId_userId: { tournamentId: channel.tournament.id, userId } },
      select: { role: true, revokedAt: true },
    })
    if (grant && !grant.revokedAt) {
      const lead = grant.role === 'ADMIN' || grant.role === 'ORGANIZER'
      return { canRead: true, canPost: open, canAnnounce: lead && open, canModerate: lead, memberRole: memberRole ?? 'STAFF', isSubscribed }
    }
    if (!membership) return NO_ACCESS
    return { canRead: true, canPost: open, canAnnounce: false, canModerate: false, memberRole, isSubscribed }
  }

  if (channel.type === 'TEAM' && channel.teamId) {
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId: channel.teamId, userId } },
      select: { role: true, leftAt: true },
    })
    if (!member || member.leftAt) return NO_ACCESS
    const lead = member.role === 'OWNER' || member.role === 'CAPTAIN'
    return { canRead: true, canPost: open, canAnnounce: lead && open, canModerate: lead, memberRole, isSubscribed }
  }

  return NO_ACCESS
}

/**
 * Make a tournament group's membership match who is actually in the
 * tournament: organizer side (OWNER), live staff (STAFF) and confirmed
 * players — approved registrations before the draw, the drawn entrants
 * after it; for team events every rostered player. Anyone else is removed.
 *
 * Runs while the tournament is open; once it closes, `closeTournamentAccess`
 * archives the group and everyone left keeps read access.
 */
export async function syncTournamentChannel(tournamentId: string, client: Client = db) {
  const tournament = await client.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      status: true,
      organizerId: true,
      drawGeneratedAt: true,
      organization: { select: { ownerId: true } },
      channel: { select: { id: true } },
    },
  })
  if (!tournament?.channel) return
  if (tournament.status === 'completed' || tournament.status === 'cancelled') return
  const channelId = tournament.channel.id

  const [staff, participants, drawn, current] = await Promise.all([
    client.tournamentStaff.findMany({ where: { tournamentId, revokedAt: null }, select: { userId: true } }),
    client.participant.findMany({
      where: { tournamentId, status: 'approved' },
      select: { id: true, userId: true, roster: { select: { userId: true } } },
    }),
    tournament.drawGeneratedAt
      ? client.match.findMany({
          where: { tournamentId, bracket: { not: 'MANUAL' } },
          select: { homeParticipantId: true, awayParticipantId: true },
        })
      : Promise.resolve(null),
    client.channelMember.findMany({ where: { channelId }, select: { userId: true, role: true } }),
  ])

  const inDraw = drawn ? new Set(drawn.flatMap((m) => [m.homeParticipantId, m.awayParticipantId])) : null
  const desired = new Map<string, ChannelMemberRole>()
  for (const p of participants) {
    if (inDraw && !inDraw.has(p.id)) continue
    if (p.userId) desired.set(p.userId, 'SUBSCRIBER')
    for (const r of p.roster) desired.set(r.userId, 'SUBSCRIBER')
  }
  for (const s of staff) desired.set(s.userId, 'STAFF')
  desired.set(tournament.organizerId, 'OWNER')
  if (tournament.organization) desired.set(tournament.organization.ownerId, 'OWNER')

  const stale = current.filter((m) => !desired.has(m.userId)).map((m) => m.userId)
  if (stale.length > 0) await client.channelMember.deleteMany({ where: { channelId, userId: { in: stale } } })

  for (const [userId, role] of desired) {
    const existing = current.find((m) => m.userId === userId)
    if (existing?.role === role) continue
    await client.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: { role },
      create: { channelId, userId, role },
    })
  }
}

/** A line written by the system (draw made, tournament finished …). */
export async function postSystemMessage(channelId: string | null | undefined, authorId: string, content: string) {
  if (!channelId) return
  await db.channelPost.create({ data: { channelId, authorId, content, kind: 'SYSTEM' } })
}

/**
 * Preferred form of `postSystemMessage`: stores a key so each reader sees the
 * line in their own language (`renderSystemPost` in `lib/stored-text`).
 */
export async function postSystemNotice(channelId: string | null | undefined, authorId: string, key: SystemPostKey) {
  await postSystemMessage(channelId, authorId, encodeSystemPost(key))
}

export type ChannelListEntry = Awaited<ReturnType<typeof listChannelsForUser>>[number]

/** Channels the user belongs to, newest activity first. */
export async function listChannelsForUser(userId: string) {
  try {
    const activeTeams = await db.teamMember.findMany({
      where: { userId, leftAt: null, team: { disbandedAt: null } },
      select: { teamId: true, team: { select: { channel: { select: { id: true } } } } },
    })
    for (const t of activeTeams) {
      if (!t.team?.channel) {
        await syncTeamChannel(t.teamId)
      }
    }
  } catch (err) {
    console.error('Error auto-syncing team channels:', err)
  }

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
          team: { select: { id: true, name: true, sport: true, _count: { select: { members: { where: { leftAt: null } } } } } },
          posts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, kind: true, createdAt: true, author: { select: { name: true } } },
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
          authorId: { not: userId },
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
        team: m.channel.team
          ? { id: m.channel.team.id, name: m.channel.team.name, sport: m.channel.team.sport, memberCount: m.channel.team._count.members }
          : null,
        lastMessage: last?.content ?? null,
        lastMessageKind: last?.kind ?? null,
        lastMessageAt: last?.createdAt ?? null,
        lastAuthor: last?.author.name ?? null,
        unreadCount: unread,
      }
    })
  )

  return withUnread.sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0))
}
