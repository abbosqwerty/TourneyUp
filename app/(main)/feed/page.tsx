import { db } from '@/lib/db'
import FeedClient from './feed-client'
import { featuredStories } from '@/lib/mock-data'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'user1'
  const tournamentsRaw = await db.tournament.findMany({
    include: {
      organizer: true
    }
  })

  // Map database Tournament objects to match frontend types
  const tournaments = await Promise.all(
    tournamentsRaw.map(async (t) => {
      const participantCount = await db.participant.count({
        where: { tournamentId: t.id }
      })

      return {
        id: t.id,
        title: t.title,
        sport: t.sport,
        category: t.category as 'sports' | 'esports' | 'academic',
        location: t.location,
        date: t.date,
        endDate: t.endDate || undefined,
        time: t.time,
        participants: participantCount,
        maxParticipants: t.maxParticipants,
        posterUrl: t.posterUrl,
        organizer: {
          id: t.organizer.id,
          name: t.organizer.name,
          avatar: t.organizer.avatar,
          verified: t.organizer.globalRank === 0 // mock verification state
        },
        description: t.description,
        rules: JSON.parse(t.rulesJson),
        requirements: JSON.parse(t.requirementsJson),
        prizePool: t.prizePool || undefined,
        entryFee: t.entryFee || undefined,
        status: t.status as 'upcoming' | 'ongoing' | 'completed' | 'registration_open',
        featured: t.featured
      }
    })
  )

  const saved = await db.savedTournament.findMany({
    where: { userId: userId }
  })
  
  const savedIds = saved.map(s => s.tournamentId)

  return (
    <FeedClient
      initialTournaments={tournaments}
      initialFeaturedStories={featuredStories}
      initialSavedTournaments={savedIds}
    />
  )
}
