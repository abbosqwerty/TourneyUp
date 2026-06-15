import { db } from '@/lib/db'
import ParticipantsClient from './participants-client'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function ParticipantsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'org1'

  // Fetch all tournaments organized by active user
  const tournaments = await db.tournament.findMany({
    where: { organizerId: userId },
    orderBy: { date: 'asc' },
  })

  // Fetch all participants across active user's tournaments
  const participants = await db.participant.findMany({
    where: {
      tournament: { organizerId: userId }
    },
    include: { tournament: true },
    orderBy: { registeredAt: 'desc' }
  })

  const formattedTournaments = tournaments.map(t => ({
    id: t.id,
    title: t.title,
    sport: t.sport,
    date: t.date,
    maxParticipants: t.maxParticipants,
    status: t.status,
  }))

  const formattedParticipants = participants.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    avatar: p.avatar,
    registeredAt: p.registeredAt,
    status: p.status as 'pending' | 'approved' | 'rejected',
    teamName: p.teamName ?? undefined,
    paymentStatus: p.paymentStatus as 'paid' | 'pending' | 'waived',
    tournamentId: p.tournamentId,
    tournamentName: p.tournament.title,
  }))

  return (
    <ParticipantsClient
      tournaments={formattedTournaments}
      allParticipants={formattedParticipants}
    />
  )
}
