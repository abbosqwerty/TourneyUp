import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { listMatches } from '@/lib/matches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchesClient } from './matches-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Turnir o‘yinlari', robots: { index: false } }

export default async function TournamentMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/tournaments/${id}/matches`)}`)

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, title: true, sport: true, status: true },
  })
  if (!tournament) notFound()

  // Scoring rides on the participant-management grant: owner, ADMIN, ORGANIZER.
  const ability = await getTournamentAbility(user.id, id)
  if (!ability.canManageParticipants) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Ruxsat yo‘q</CardTitle>
            <CardDescription>
              O‘yinlarni tashkilot egasi yoki ADMIN/ORGANIZER roliga ega xodim boshqaradi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/tournament/${id}`}>Turnirga qaytish</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [matches, participants] = await Promise.all([
    listMatches({ tournamentId: id, take: 200 }),
    db.participant.findMany({
      where: { tournamentId: id, status: 'approved' },
      select: { id: true, name: true, teamName: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const isClosed = tournament.status === 'completed' || tournament.status === 'cancelled'

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/dashboard" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Panelga qaytish
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{tournament.title}</h1>
        <p className="text-sm text-muted-foreground">
          {tournament.sport} · o‘yin jadvali va natijalar
        </p>
      </div>

      <MatchesClient
        tournamentId={id}
        matches={matches}
        participants={participants.map((p) => ({
          id: p.id,
          label: p.teamName || p.name,
        }))}
        isClosed={isClosed}
      />
    </div>
  )
}
