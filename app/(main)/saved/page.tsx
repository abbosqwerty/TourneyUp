import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { safeParseJsonArray } from '@/lib/json'
import { tournamentPoster } from '@/lib/media'
import { DbErrorCard } from '@/components/db-error-card'
import SavedClient from './saved-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saqlangan turnirlar',
  robots: { index: false },
}

export default async function SavedPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsaved')

  let tournaments: Awaited<ReturnType<typeof load>> | null = null
  try {
    tournaments = await load(user.id)
  } catch (error) {
    console.error('saved page failed', error)
  }

  if (!tournaments) {
    return <DbErrorCard message="Saqlangan turnirlarni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />
  }

  return <SavedClient initialTournaments={tournaments} />
}

async function load(userId: string) {
  const saved = await db.savedTournament.findMany({
    where: { userId },
    include: {
      tournament: {
        include: {
          organizer: { select: { id: true, name: true, avatar: true, verified: true } },
          organization: { select: { name: true } },
          _count: { select: { participants: true } },
        },
      },
    },
  })

  return saved.map(({ tournament }) => ({
    id: tournament.id,
    title: tournament.title,
    sport: tournament.sport,
    category: tournament.category as 'sports' | 'esports' | 'academic',
    location: tournament.location,
    date: tournament.date,
    endDate: tournament.endDate || undefined,
    time: tournament.time,
    participants: tournament._count.participants,
    maxParticipants: tournament.maxParticipants,
    posterUrl: tournamentPoster(tournament) ?? '',
    organizer: {
      id: tournament.organizer.id,
      name: tournament.organization?.name ?? tournament.organizer.name,
      avatar: tournament.organizer.avatar,
      verified: tournament.organizer.verified,
    },
    description: tournament.description,
    rules: safeParseJsonArray(tournament.rulesJson),
    requirements: safeParseJsonArray(tournament.requirementsJson),
    prizePool: tournament.prizePool || undefined,
    entryFee: tournament.entryFee || undefined,
    status: tournament.status as 'upcoming' | 'ongoing' | 'completed' | 'registration_open',
    featured: tournament.featured,
  }))
}
