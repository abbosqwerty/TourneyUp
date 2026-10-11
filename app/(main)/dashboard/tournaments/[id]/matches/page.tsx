import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { listMatches } from '@/lib/matches'
import { FORMAT_LABELS } from '@/lib/competition/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchesClient } from './matches-client'
import { LeaderboardClient } from './leaderboard-client'
import { getCompetitionView } from '@/lib/competition/view'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Turnir o‘yinlari', robots: { index: false } }

export default async function TournamentMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/tournaments/${id}/matches`)}`)

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      sport: true,
      status: true,
      format: true,
      drawGeneratedAt: true,
      resultsFinalizedAt: true,
    },
  })
  if (!tournament) notFound()

  // Owner, ADMIN and ORGANIZER confirm results.
  const ability = await getTournamentAbility(user.id, id)
  if (!ability.canRecordResults) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Ruxsat yo‘q</CardTitle>
            <CardDescription>
              Natijalarni tashkilot egasi yoki ADMIN/ORGANIZER roliga ega xodim kiritadi.
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

  const isLeaderboard = tournament.format === 'LEADERBOARD'
  const matches =
    tournament.drawGeneratedAt && !isLeaderboard
      ? (await listMatches({ tournamentId: id, take: 2000 })).filter((m) => m.bracket !== 'MANUAL')
      : []
  const board = tournament.drawGeneratedAt && isLeaderboard ? await getCompetitionView(id) : null

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/dashboard" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Panelga qaytish
        </Link>
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{tournament.title}</h1>
          <p className="text-sm text-muted-foreground">
            {tournament.sport} · {FORMAT_LABELS[tournament.format]} · natijalarni kiritish
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/results/${id}`}>Musobaqa sahifasi</Link>
        </Button>
      </div>

      {!tournament.drawGeneratedAt ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            O‘yinlar turnir boshlanganda avtomatik yaratiladi. Panelda turnir statusini <b>“Davom etmoqda”</b>ga
            o‘tkazing — tasdiqlangan ishtirokchilar bilan qur’a tashlanadi.
          </CardContent>
        </Card>
      ) : board?.leaderboard ? (
        <LeaderboardClient
          tournamentId={id}
          // Alphabetical rows stay put while results re-rank the public table.
          rows={[...board.leaderboard.rows]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((row) => ({ participantId: row.entrant, label: row.label, rounds: row.rounds }))}
          rounds={board.leaderboard.rounds}
          kind={board.config.scoreKind}
          finalized={tournament.resultsFinalizedAt !== null}
          isClosed={tournament.status === 'cancelled'}
        />
      ) : (
        <MatchesClient matches={matches} isClosed={tournament.status === 'cancelled'} />
      )}
    </div>
  )
}
