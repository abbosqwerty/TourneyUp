import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { safeParseJsonArray } from '@/lib/json'
import { tournamentPoster } from '@/lib/media'
import TournamentClient from './tournament-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

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

    if (!tournament) return { title: 'Turnir topilmadi' }

    const host = tournament.organization?.name ?? tournament.organizer.name
    const description = `${tournament.sport} · ${tournament.date} · ${tournament.location}. Tashkilotchi: ${host}.`
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
    return { title: 'Turnir' }
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

  const [userRegistration, saved, relatedRaw] = await Promise.all([
    user
      ? db.participant.findUnique({
          where: { tournamentId_userId: { tournamentId: id, userId: user.id } },
          select: { id: true, status: true },
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
  ])

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
