import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import TournamentClient from './tournament-client'
import { cookies } from 'next/headers'
import { isOrganizer } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function TournamentDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'user1'
  
  const tournamentRaw = await db.tournament.findUnique({
    where: { id },
    include: {
      organizer: true
    }
  })

  if (!tournamentRaw) {
    notFound()
  }

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
    posterUrl: tournamentRaw.posterUrl,
    organizer: {
      id: tournamentRaw.organizer.id,
      name: tournamentRaw.organizer.name,
      avatar: tournamentRaw.organizer.avatar,
      verified: tournamentRaw.organizer.globalRank === 0
    },
    description: tournamentRaw.description,
    rules: JSON.parse(tournamentRaw.rulesJson),
    requirements: JSON.parse(tournamentRaw.requirementsJson),
    prizePool: tournamentRaw.prizePool || undefined,
    entryFee: tournamentRaw.entryFee || undefined,
    status: tournamentRaw.status,
    featured: tournamentRaw.featured
  }

  // Check registration
  const userRegistration = await db.participant.findFirst({
    where: {
      tournamentId: id,
      userId: userId
    }
  })

  // Get current participant count
  const participantsCount = await db.participant.count({
    where: { tournamentId: id }
  })

  // Check saved status
  const saved = await db.savedTournament.findUnique({
    where: {
      userId_tournamentId: {
        userId: userId,
        tournamentId: id
      }
    }
  })

  // Find related tournaments (same category, excluding current)
  const relatedRaw = await db.tournament.findMany({
    where: {
      category: tournamentRaw.category,
      id: { not: id }
    },
    take: 3,
    include: {
      organizer: true
    }
  })

  const related = await Promise.all(
    relatedRaw.map(async (t) => {
      const count = await db.participant.count({ where: { tournamentId: t.id } })
      return {
        id: t.id,
        title: t.title,
        sport: t.sport,
        category: t.category as 'sports' | 'esports' | 'academic',
        location: t.location,
        date: t.date,
        time: t.time,
        participants: count,
        maxParticipants: t.maxParticipants,
        posterUrl: t.posterUrl,
        organizer: {
          id: t.organizer.id,
          name: t.organizer.name,
          avatar: t.organizer.avatar,
          verified: t.organizer.globalRank === 0
        },
        status: t.status as 'upcoming' | 'ongoing' | 'completed' | 'registration_open',
        featured: t.featured
      }
    })
  )

  const isOrgUser = await isOrganizer(userId)

  return (
    <TournamentClient
      tournament={tournament}
      isSaved={!!saved}
      isUserRegistered={!!userRegistration}
      relatedTournaments={related}
      participantsCount={participantsCount}
      isOrganizer={isOrgUser}
    />
  )
}
