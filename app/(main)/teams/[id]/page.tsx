import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getTeamAbility, lockedRosterUserIds } from '@/lib/teams'
import { mediaUrl } from '@/lib/media'
import { DbErrorCard } from '@/components/db-error-card'
import { TeamDetailClient, type TeamDetail } from './team-detail-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Jamoa', robots: { index: false } }

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/teams/${id}`)}`)

  const ability = await getTeamAbility(user.id, id)
  // Teams are private to their members.
  if (!ability.isMember && user.role !== 'SUPER_ADMIN') notFound()

  let detail: TeamDetail | null = null
  try {
    detail = await load(id, ability.canInvite)
  } catch (error) {
    console.error('team page failed', error)
  }
  if (!detail) return <DbErrorCard message="Jamoani yuklab bo‘lmadi." />

  return <TeamDetailClient team={detail} ability={ability} currentUserId={user.id} />
}

async function load(teamId: string, withInvites: boolean): Promise<TeamDetail | null> {
  const [team, locked] = await Promise.all([
    db.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        sport: true,
        category: true,
        description: true,
        logoMediaId: true,
        disbandedAt: true,
        createdAt: true,
        channel: { select: { id: true } },
        members: {
          where: { leftAt: null },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
          select: {
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
        // Only leads see who has been invited.
        invites: {
          where: withInvites ? { status: 'PENDING', expiresAt: { gt: new Date() } } : { id: '' },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true, invitedUser: { select: { name: true, username: true, avatar: true } } },
        },
        registrations: {
          orderBy: { registeredAt: 'desc' },
          take: 30,
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            tournament: { select: { id: true, title: true, status: true, date: true, drawGeneratedAt: true } },
            roster: { select: { user: { select: { id: true, name: true } } } },
            pointAwards: { select: { placement: true, points: true }, take: 1, orderBy: { points: 'desc' } },
          },
        },
      },
    }),
    lockedRosterUserIds(teamId),
  ])
  if (!team) return null

  return {
    id: team.id,
    name: team.name,
    sport: team.sport,
    category: team.category,
    description: team.description,
    logo: mediaUrl(team.logoMediaId),
    disbanded: team.disbandedAt !== null,
    createdAt: team.createdAt.toISOString(),
    channelId: team.channel?.id ?? null,
    members: team.members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      locked: locked.has(m.user.id),
    })),
    invites: team.invites.map((i) => ({
      id: i.id,
      createdAt: i.createdAt.toISOString(),
      name: i.invitedUser.name,
      username: i.invitedUser.username,
      avatar: i.invitedUser.avatar,
    })),
    registrations: team.registrations.map((r) => ({
      id: r.id,
      status: r.status,
      paymentStatus: r.paymentStatus,
      tournament: {
        id: r.tournament.id,
        title: r.tournament.title,
        status: r.tournament.status,
        date: r.tournament.date,
        started: r.tournament.drawGeneratedAt !== null,
      },
      roster: r.roster.map((x) => x.user),
      placement: r.pointAwards[0]?.placement ?? null,
    })),
  }
}
