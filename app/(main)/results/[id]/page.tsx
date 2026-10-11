import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Clock, Medal, Settings2, Trophy, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { getCompetitionView, type CompetitionView } from '@/lib/competition/view'
import { TOURNAMENT_TABS, type TournamentTab } from '@/lib/competition/list'
import { groupLabel } from '@/lib/competition/labels'
import { TOURNAMENT_STATUS_CLASSES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n/server'
import { formatDateTime } from '@/lib/time'
import type { MatchView } from '@/lib/matches'
import type { Locale } from '@/lib/i18n/types'
import { DbErrorCard } from '@/components/db-error-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BracketView } from '@/components/competition/bracket-view'
import { MatchCard, MatchListRow } from '@/components/competition/match-card'
import { StandingsTable } from '@/components/competition/standings-table'
import { LeaderboardTable } from '@/components/competition/leaderboard-table'
import { formatScore } from '@/lib/competition/leaderboard'
import { cn } from '@/lib/utils'
import { ScheduleControl } from './schedule-control'
import { sportLabel } from '@/lib/sports'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const { dict } = await getI18n()
  const tournament = await db.tournament.findUnique({ where: { id }, select: { title: true } }).catch(() => null)
  return { title: tournament ? dict.competition.detail.meta_title(tournament.title) : dict.competition.list.title }
}

export default async function TournamentCompetitionPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const query = await searchParams
  const { dict, locale } = await getI18n()
  const t = dict.competition
  const rawTab = Array.isArray(query.tab) ? query.tab[0] : query.tab
  const tab: TournamentTab = rawTab && rawTab in TOURNAMENT_TABS ? (rawTab as TournamentTab) : 'overview'

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      sport: true,
      status: true,
      participantType: true,
      organization: { select: { name: true } },
      organizer: { select: { name: true } },
    },
  })
  if (!tournament) notFound()

  const user = await getCurrentUser()
  let view: CompetitionView | null = null
  let canScore = false
  try {
    ;[view, canScore] = await Promise.all([
      getCompetitionView(id),
      user ? getTournamentAbility(user.id, id).then((a) => a.canRecordResults) : Promise.resolve(false),
    ])
  } catch (error) {
    console.error('competition page failed', error)
  }
  if (!view) return <DbErrorCard message={t.detail.load_failed} />

  const isOpen = tournament.status !== 'completed' && tournament.status !== 'cancelled'

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/results" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t.detail.back}
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{tournament.title}</h1>
            <Badge className={TOURNAMENT_STATUS_CLASSES[tournament.status]}>
              {dict.status[tournament.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[sportLabel(dict, tournament.sport), t.formats[view.format], tournament.organization?.name ?? tournament.organizer.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {view.drawn ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {tournament.participantType === 'TEAM' ? t.list.teams(view.entrantCount) : t.list.players(view.entrantCount)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tournament/${id}`}>{t.detail.tournament_page}</Link>
          </Button>
          {canScore && view.drawn ? (
            <Button size="sm" asChild className="gap-2">
              <Link href={`/dashboard/tournaments/${id}/matches`}>
                <Settings2 className="h-4 w-4" aria-hidden />
                {t.detail.manage_results}
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {!view.drawn ? (
        <NotStarted status={tournament.status} legacy={view.legacyMatches} />
      ) : (
        <>
          <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-1" aria-label={t.detail.sections_aria}>
            {(Object.keys(TOURNAMENT_TABS) as TournamentTab[]).map((key) => (
              <Button key={key} asChild size="sm" variant={key === tab ? 'default' : 'ghost'} className="flex-1 whitespace-nowrap">
                <Link
                  href={key === 'overview' ? `/results/${id}` : `/results/${id}?tab=${key}`}
                  aria-current={key === tab ? 'page' : undefined}
                  scroll={false}
                >
                  {t.detail[`tab_${key}`]}
                </Link>
              </Button>
            ))}
          </nav>

          {tab === 'overview' ? <Overview view={view} /> : null}
          {tab === 'history' ? (
            view.leaderboard ? <LeaderboardRounds view={view} /> : <History matches={view.matches} />
          ) : null}
          {tab === 'schedule' ? (
            view.leaderboard ? (
              <Empty icon={Clock}>
                {view.leaderboard.doneRounds < view.leaderboard.rounds
                  ? t.detail.rounds_done(view.leaderboard.rounds, view.leaderboard.doneRounds)
                  : t.detail.all_rounds_done}
              </Empty>
            ) : (
              <Schedule matches={view.matches} canScore={canScore && isOpen} locale={locale} />
            )
          ) : null}
        </>
      )}
    </div>
  )
}

function Empty({ icon: Icon = Trophy, children }: { icon?: typeof Trophy; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
        <div className="max-w-md text-sm text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  )
}

async function NotStarted({ status, legacy }: { status: string; legacy: MatchView[] }) {
  const { dict } = await getI18n()
  const message: Record<string, string> = dict.competition.detail.not_started

  return (
    <div className="space-y-4">
      <Empty icon={Clock}>{message[status] ?? message.registration_open}</Empty>
      {legacy.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{dict.competition.detail.entered_matches}</h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {legacy.map((m) => (
              <li key={m.id}>
                <MatchListRow match={m} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

async function Podium({ podium }: { podium: NonNullable<CompetitionView['podium']> }) {
  const { dict } = await getI18n()
  const top = podium.filter((p) => p.placement <= 3 && p.participated)
  if (top.length === 0) return null
  const medal = ['', 'text-yellow-500', 'text-slate-400', 'text-amber-700']
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Medal className="h-4 w-4 text-primary" aria-hidden />
          {dict.competition.detail.final_results}
        </p>
        <ol className="grid gap-2 sm:grid-cols-3">
          {top.map((p) => (
            <li key={`${p.placement}-${p.label}`} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
              <Trophy className={cn('h-4 w-4 shrink-0', medal[p.placement])} aria-hidden />
              <span className="text-sm font-semibold">{p.placement}.</span>
              <span className="truncate text-sm">{p.label}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

async function Overview({ view }: { view: CompetitionView }) {
  const { dict } = await getI18n()
  const t = dict.competition.detail
  const { format, matches } = view
  return (
    <div className="space-y-8">
      {view.podium ? <Podium podium={view.podium} /> : null}

      {format === 'SINGLE_ELIMINATION' ? (
        <>
          <BracketView matches={matches} bracket="MAIN" title={t.bracket} />
          <BracketView matches={matches} bracket="THIRD_PLACE" />
        </>
      ) : null}

      {format === 'DOUBLE_ELIMINATION' ? (
        <>
          <BracketView matches={matches} bracket="WINNERS" />
          <BracketView matches={matches} bracket="LOSERS" />
          <BracketView matches={matches} bracket="GRAND_FINAL" />
        </>
      ) : null}

      {format === 'ROUND_ROBIN' && view.standings ? <StandingsTable rows={view.standings} caption={t.table} /> : null}

      {format === 'GROUPS_KNOCKOUT' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {view.groups.map((group) => (
              <StandingsTable key={group.name} rows={group.rows} caption={groupLabel(dict, group.name)} qualify={view.config.advancePerGroup} />
            ))}
          </div>
          {matches.some((m) => m.bracket === 'MAIN') ? (
            <>
              <BracketView matches={matches} bracket="MAIN" />
              <BracketView matches={matches} bracket="THIRD_PLACE" />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.playoff_pending}
            </p>
          )}
        </>
      ) : null}

      {format === 'SWISS' ? (
        <>
          {view.standings ? <StandingsTable rows={view.standings} caption={t.table} buchholz /> : null}
          <SwissRounds matches={matches} />
        </>
      ) : null}

      {view.leaderboard ? (
        <div className="space-y-3">
          <RoundProgress done={view.leaderboard.doneRounds} total={view.leaderboard.rounds} />
          <LeaderboardTable
            rows={view.leaderboard.rows}
            rounds={view.leaderboard.rounds}
            kind={view.config.scoreKind}
            caption={view.config.scoreKind === 'time' ? t.leaderboard_time : t.leaderboard_points}
          />
          <p className="text-xs text-muted-foreground">
            {view.config.scoreKind === 'time' ? t.note_time : t.note_points} {t.note_move}
          </p>
        </div>
      ) : null}
    </div>
  )
}

async function RoundProgress({ done, total }: { done: number; total: number }) {
  if (total <= 1) return null
  const { dict } = await getI18n()
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < done ? 'bg-primary' : 'bg-secondary')} />
        ))}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {dict.competition.detail.round_progress(done, total)}
      </span>
    </div>
  )
}

/** Per-round results of a LEADERBOARD tournament, latest round first. */
async function LeaderboardRounds({ view }: { view: CompetitionView }) {
  const { dict } = await getI18n()
  const board = view.leaderboard!
  const kind = view.config.scoreKind
  const rounds = Array.from({ length: board.rounds }, (_, i) => i + 1)
    .filter((r) => board.rows.some((row) => row.rounds[r - 1] !== null))
    .reverse()

  if (rounds.length === 0) return <Empty>{dict.competition.detail.no_results}</Empty>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rounds.map((round) => {
        const results = board.rows
          .map((row) => ({ row, cell: row.rounds[round - 1] }))
          .filter((r) => r.cell !== null)
          .sort((a, b) => {
            if (a.cell === 'DNF') return 1
            if (b.cell === 'DNF') return -1
            return kind === 'time' ? (a.cell as number) - (b.cell as number) : (b.cell as number) - (a.cell as number)
          })
        return (
          <section key={round} className="overflow-hidden rounded-lg border border-border">
            <p className="border-b border-border bg-secondary/40 px-3 py-2 text-sm font-semibold">{dict.competition.rounds.leaderboard_round(round)}</p>
            <ol className="divide-y divide-border">
              {results.map(({ row, cell }, i) => (
                <li key={row.entrant} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-5 text-muted-foreground tabular-nums">{cell === 'DNF' ? '–' : i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{row.label}</span>
                  <span className={cn('tabular-nums', cell === 'DNF' ? 'text-destructive' : 'font-medium')}>
                    {cell === 'DNF' ? 'DNF' : formatScore(kind, cell as number)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

async function SwissRounds({ matches }: { matches: MatchView[] }) {
  const { dict } = await getI18n()
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => b - a)
  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <section key={round} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{dict.competition.rounds.round(round)}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {matches
              .filter((m) => m.round === round)
              .map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

async function History({ matches }: { matches: MatchView[] }) {
  const { dict } = await getI18n()
  const played = matches
    .filter((m) => m.finalizedAt && !m.isBye)
    .sort((a, b) => (b.finalizedAt ?? '').localeCompare(a.finalizedAt ?? ''))

  if (played.length === 0) return <Empty>{dict.competition.detail.no_finished}</Empty>

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {played.map((m) => (
        <li key={m.id}>
          <MatchListRow match={m} />
        </li>
      ))}
    </ul>
  )
}

async function Schedule({ matches, canScore, locale }: { matches: MatchView[]; canScore: boolean; locale: Locale }) {
  const { dict } = await getI18n()
  const upcoming = matches.filter((m) => !m.finalizedAt && !m.isBye && m.status !== 'cancelled')
  const timed = upcoming
    .filter((m) => m.scheduledAt)
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
  const untimed = upcoming.filter((m) => !m.scheduledAt)

  if (upcoming.length === 0) return <Empty>{dict.competition.detail.no_upcoming}</Empty>

  const row = (m: MatchView) => (
    <li key={m.id}>
      <MatchListRow match={m} action={canScore ? <ScheduleControl matchId={m.id} scheduledAt={m.scheduledAt} /> : null} />
    </li>
  )

  return (
    <div className="space-y-6">
      {timed.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {dict.competition.detail.scheduled_next(formatDateTime(timed[0].scheduledAt, locale))}
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border">{timed.map(row)}</ul>
        </section>
      ) : null}
      {untimed.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{dict.competition.detail.unscheduled}</h2>
          <ul className="divide-y divide-border rounded-lg border border-dashed border-border">{untimed.map(row)}</ul>
        </section>
      ) : null}
    </div>
  )
}
