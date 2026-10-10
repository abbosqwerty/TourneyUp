import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ParticipantsClient from './participants-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Ishtirokchilar', robots: { index: false } }

export default async function ParticipantsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fdashboard%2Fparticipants')

  let data: Awaited<ReturnType<typeof load>>
  try {
    data = await load(user.id, user.role)
  } catch (error) {
    console.error('participants page failed', error)
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Ma‘lumotni olib bo‘lmadi</CardTitle>
            <CardDescription>Baza bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Organizations see their own events; staff see only what they were
  // assigned to. Nobody with zero access lands here.
  if (data.tournaments.length === 0) redirect('/feed')

  return (
    <ParticipantsClient
      tournaments={data.tournaments}
      allParticipants={data.participants}
      manageableTournamentIds={data.manageableIds}
    />
  )
}

async function load(userId: string, role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN') {
  const organization =
    role === 'ORGANIZATION'
      ? await db.organization.findUnique({ where: { ownerId: userId }, select: { id: true } })
      : null

  const staffGrants = await db.tournamentStaff.findMany({
    where: { userId, revokedAt: null },
    select: { tournamentId: true, role: true },
  })

  const ownedWhere =
    role === 'SUPER_ADMIN'
      ? {}
      : {
          OR: [
            { organizerId: userId },
            ...(organization ? [{ organizationId: organization.id }] : []),
            { id: { in: staffGrants.map((grant) => grant.tournamentId) } },
          ],
        }

  const tournaments = await db.tournament.findMany({
    where: ownedWhere,
    orderBy: { date: 'asc' },
    select: {
      id: true,
      title: true,
      sport: true,
      date: true,
      maxParticipants: true,
      status: true,
      organizerId: true,
      organization: { select: { ownerId: true } },
    },
  })

  const participants = await db.participant.findMany({
    where: { tournamentId: { in: tournaments.map((tournament) => tournament.id) } },
    include: {
      tournament: { select: { title: true, drawGeneratedAt: true } },
      roster: { select: { user: { select: { name: true } } } },
    },
    orderBy: { registeredAt: 'desc' },
  })

  // SUPPORT may read registrations but not approve or reject them.
  const staffRoleById = new Map(staffGrants.map((grant) => [grant.tournamentId, grant.role]))
  const manageableIds = tournaments
    .filter((tournament) => {
      if (role === 'SUPER_ADMIN') return true
      if (tournament.organizerId === userId) return true
      if (organization && tournament.organization?.ownerId === userId) return true
      const staffRole = staffRoleById.get(tournament.id)
      return staffRole === 'ADMIN' || staffRole === 'ORGANIZER'
    })
    .map((tournament) => tournament.id)

  return {
    manageableIds,
    tournaments: tournaments.map((tournament) => ({
      id: tournament.id,
      title: tournament.title,
      sport: tournament.sport,
      date: tournament.date,
      maxParticipants: tournament.maxParticipants,
      status: tournament.status,
    })),
    participants: participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      email: participant.email,
      avatar: participant.avatar,
      registeredAt: participant.registeredAt,
      status: participant.status as 'pending' | 'approved' | 'rejected',
      teamName: participant.teamName ?? undefined,
      paymentStatus: participant.paymentStatus as 'paid' | 'pending' | 'waived',
      tournamentId: participant.tournamentId,
      tournamentName: participant.tournament.title,
      roster: participant.roster.map((r) => r.user.name),
      seed: participant.seed,
      drawn: participant.tournament.drawGeneratedAt !== null,
    })),
  }
}
