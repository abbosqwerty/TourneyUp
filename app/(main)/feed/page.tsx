import { db } from '@/lib/db'
import FeedClient from './feed-client'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || null
  const tournamentsRaw = await db.tournament.findMany({
    include: {
      organizer: true
    },
    orderBy: {
      date: 'asc'
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
          verified: t.organizer.globalRank === 0
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

  // Generate highlights dynamically from real database tournaments
  const dynamicHighlights = await Promise.all(
    tournamentsRaw
      .filter(t => t.featured || t.status === 'ongoing' || t.status === 'registration_open')
      .slice(0, 10)
      .map(async (t) => {
        let type: 'live' | 'upcoming' | 'featured' | 'registration' = 'upcoming'
        if (t.status === 'ongoing') type = 'live'
        else if (t.status === 'registration_open') type = 'registration'
        else if (t.featured) type = 'featured'

        const pCount = await db.participant.count({
          where: { tournamentId: t.id }
        })

        return {
          id: t.id,
          title: t.title,
          sport: t.sport,
          category: t.category,
          location: t.location,
          date: t.date,
          time: t.time,
          prizePool: t.prizePool || undefined,
          entryFee: t.entryFee || undefined,
          status: t.status,
          participants: pCount,
          maxParticipants: t.maxParticipants,
          organizerName: t.organizer?.name || 'Tournament Organizer',
          organizerAvatar: t.organizer?.avatar || '',
          description: t.description,
          image: t.posterUrl,
          tournamentId: t.id,
          type
        }
      })
  )

  let savedIds: string[] = []
  if (userId) {
    const saved = await db.savedTournament.findMany({
      where: { userId: userId }
    })
    savedIds = saved.map(s => s.tournamentId)
  }

  return (
    <FeedClient
      initialTournaments={tournaments}
      initialFeaturedStories={dynamicHighlights}
      initialSavedTournaments={savedIds}
      currentUserId={userId || undefined}
    />
  )
}
