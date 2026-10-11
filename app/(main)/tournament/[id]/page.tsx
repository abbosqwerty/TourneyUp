import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { safeParseJsonArray } from '@/lib/json'
import { tournamentPoster } from '@/lib/media'
import { listRegistrableTeams } from '@/lib/teams'
import { getI18n } from '@/lib/i18n/server'
import { formatDate } from '@/lib/time'
import TournamentClient from './tournament-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { dict, locale } = await getI18n()

  try {
    const tournament = await db.tournament.findUnique({
      where: { id },
      select: {
        title: true,
        sport: true,
        date: true,
        location: true,
        description: true,
        posterMediaId: true,
        organization: { select: { name: true } },
        organizer: { select: { name: true } },
      },
    })

    if (!tournament) return { title: dict.tournament.detail.meta_not_found }

    const host = tournament.organization?.name ?? tournament.organizer.name
    const description = dict.tournament.detail.meta_description(tournament.sport, formatDate(tournament.date, locale), tournament.location, host)
    const poster = tournamentPoster(tournament)

    return {
      title: tournament.title,
      description: tournament.description.slice(0, 160) || description,
      openGraph: {
        title: tournament.title,
        description,
        type: 'website',
        ...(poster ? { images: [{ url: poster }] } : {}),
      },
      twitter: { card: 'summary_large_image', title: tournament.title, description },
    }
  } catch {
    return { title: dict.tournament.detail.meta_fallback }
  }
}

export default async function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  const tournamentRaw = await db.tournament.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, avatar: true, verified: true, role: true } },
      organization: { select: { id: true, name: true, slug: true } },
      _count: { select: { participants: true } },
      channel: { select: { id: true } },
    },
  })

  if (!tournamentRaw) notFound()

  const ability = await getTournamentAbility(user?.id, id)

  const tournament = {
    id: tournamentRaw.id,
    title: tournamentRaw.title,
    sport: tournamentRaw.sport,
    category: tournamentRaw.category,
    location: tournamentRaw.location,
    date: tournamentRaw.date,
    endDate: tournamentRaw.endDate || undefined,
    time: tournamentRaw.time,
    maxParticipants: tournamentRaw.maxParticipants,
    posterUrl: tournamentPoster(tournamentRaw) ?? '',
    organizer: {
      id: tournamentRaw.organizer.id,
      name: tournamentRaw.organization?.name ?? tournamentRaw.organizer.name,
      avatar: tournamentRaw.organizer.avatar,
      verified: tournamentRaw.organizer.verified,
    },
    description: tournamentRaw.description,
    rules: safeParseJsonArray(tournamentRaw.rulesJson),
    requirements: safeParseJsonArray(tournamentRaw.requirementsJson),
    prizePool: tournamentRaw.prizePool || undefined,
    entryFee: tournamentRaw.entryFee || undefined,
    status: tournamentRaw.status,
    featured: tournamentRaw.featured,
  }

  const isTeamEvent = tournamentRaw.participantType === 'TEAM'
  const [userRegistration, saved, relatedRaw, registrableTeams] = await Promise.all([
    // Your own registration, a team you lead, or a roster you are in.
    user
      ? db.participant.findFirst({
          where: {
            tournamentId: id,
            OR: [
              { userId: user.id },
              { roster: { some: { userId: user.id } } },
              { team: { members: { some: { userId: user.id, leftAt: null, role: { in: ['OWNER', 'CAPTAIN'] } } } } },
            ],
          },
          select: { id: true, status: true, teamName: true, userId: true, team: { select: { members: { where: { userId: user.id, leftAt: null }, select: { role: true } } } } },
        })
      : null,
    user
      ? db.savedTournament.findUnique({
          where: { userId_tournamentId: { userId: user.id, tournamentId: id } },
          select: { userId: true },
        })
      : null,
    db.tournament.findMany({
      where: { category: tournamentRaw.category, id: { not: id } },
      take: 3,
      include: {
        organizer: { select: { id: true, name: true, avatar: true, verified: true } },
        organization: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    }),
    user && isTeamEvent && user.role === 'USER' ? listRegistrableTeams(user.id) : Promise.resolve([]),
  ])

  // Only the registering account or a team lead may withdraw.
  const canWithdraw = Boolean(
    userRegistration &&
      (userRegistration.userId === user?.id ||
        userRegistration.team?.members.some((m) => m.role === 'OWNER' || m.role === 'CAPTAIN'))
  )

  const related = relatedRaw.map((t) => ({
    id: t.id,
    title: t.title,
    sport: t.sport,
    category: t.category as 'sports' | 'esports' | 'academic',
    location: t.location,
    date: t.date,
    time: t.time,
    participants: t._count.participants,
    maxParticipants: t.maxParticipants,
    posterUrl: tournamentPoster(t) ?? '',
    organizer: {
      id: t.organizer.id,
      name: t.organization?.name ?? t.organizer.name,
      avatar: t.organizer.avatar,
      verified: t.organizer.verified,
    },
    status: t.status as 'upcoming' | 'ongoing' | 'completed' | 'registration_open',
    featured: t.featured,
  }))

  return (
    <TournamentClient
      tournament={tournament}
      isSaved={Boolean(saved)}
      isUserRegistered={Boolean(userRegistration)}
      registration={
        userRegistration
          ? { status: userRegistration.status, teamName: userRegistration.teamName, canWithdraw }
          : null
      }
      teamEvent={
        isTeamEvent
          ? {
              teamSize: tournamentRaw.teamSize,
              teamSizeMax: tournamentRaw.teamSizeMax,
              teams: registrableTeams.map((t) => ({
                id: t.id,
                name: t.name,
                sport: t.sport,
                members: t.members.map((m) => ({ id: m.id, name: m.name, username: m.username, role: m.role })),
              })),
            }
          : null
      }
      drawn={tournamentRaw.drawGeneratedAt !== null}
      relatedTournaments={related}
      participantsCount={tournamentRaw._count.participants}
      ability={{
        canEditTournament: ability.canEditTournament,
        canManageParticipants: ability.canManageParticipants,
        canManageStaff: ability.canManageStaff,
        staffRole: ability.staffRole,
        isOwner: ability.isOwner,
      }}
      channelId={tournamentRaw.channel?.id ?? null}
      currentUser={user ? { id: user.id, name: user.name, username: user.username, avatar: user.avatar, role: user.role } : null}
    />
  )
}
