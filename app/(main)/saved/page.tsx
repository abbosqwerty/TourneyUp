import { db } from '@/lib/db'
import SavedClient from './saved-client'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function SavedPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'user1'

  const saved = await db.savedTournament.findMany({
    where: { userId: userId },
    include: {
      tournament: {
        include: {
          organizer: true
        }
      }
    }
  })

  const tournaments = await Promise.all(
    saved.map(async (s) => {
      const participantCount = await db.participant.count({
        where: { tournamentId: s.tournamentId }
      })

      return {
        id: s.tournament.id,
        title: s.tournament.title,
        sport: s.tournament.sport,
        category: s.tournament.category as 'sports' | 'esports' | 'academic',
        location: s.tournament.location,
        date: s.tournament.date,
        endDate: s.tournament.endDate || undefined,
        time: s.tournament.time,
        participants: participantCount,
        maxParticipants: s.tournament.maxParticipants,
        posterUrl: s.tournament.posterUrl,
        organizer: {
          id: s.tournament.organizer.id,
          name: s.tournament.organizer.name,
          avatar: s.tournament.organizer.avatar,
          verified: s.tournament.organizer.globalRank === 0
        },
        description: s.tournament.description,
        rules: JSON.parse(s.tournament.rulesJson),
        requirements: JSON.parse(s.tournament.requirementsJson),
        prizePool: s.tournament.prizePool || undefined,
        entryFee: s.tournament.entryFee || undefined,
        status: s.tournament.status as 'upcoming' | 'ongoing' | 'completed' | 'registration_open',
        featured: s.tournament.featured
      }
    })
  )

  return <SavedClient initialTournaments={tournaments} />
}
