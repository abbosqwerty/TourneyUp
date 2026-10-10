import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Clock, Medal, Settings2, Trophy, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { getCompetitionView, type CompetitionView } from '@/lib/competition/view'
import { FORMAT_LABELS } from '@/lib/competition/config'
import { TOURNAMENT_TABS, type TournamentTab } from '@/lib/competition/list'
import { TOURNAMENT_STATUS_CLASSES, TOURNAMENT_STATUS_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/time'
import type { MatchView } from '@/lib/matches'
import { DbErrorCard } from '@/components/db-error-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BracketView } from '@/components/competition/bracket-view'
import { MatchCard, MatchListRow } from '@/components/competition/match-card'
import { StandingsTable } from '@/components/competition/standings-table'
import { cn } from '@/lib/utils'
import { ScheduleControl } from './schedule-control'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const tournament = await db.tournament.findUnique({ where: { id }, select: { title: true } }).catch(() => null)
  return { title: tournament ? `${tournament.title} — Musobaqa` : 'Musobaqa' }
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
  if (!view) return <DbErrorCard message="Musobaqa ma’lumotlarini yuklab bo‘lmadi." />

  const unit = tournament.participantType === 'TEAM' ? 'jamoa' : 'ishtirokchi'
  const isOpen = tournament.status !== 'completed' && tournament.status !== 'cancelled'

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/results" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Barcha musobaqalar
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{tournament.title}</h1>
            <Badge className={TOURNAMENT_STATUS_CLASSES[tournament.status]}>
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[tournament.sport, FORMAT_LABELS[view.format], tournament.organization?.name ?? tournament.organizer.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {view.drawn ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {view.entrantCount} {unit}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tournament/${id}`}>Turnir sahifasi</Link>
          </Button>
          {canScore && view.drawn ? (
            <Button size="sm" asChild className="gap-2">
              <Link href={`/dashboard/tournaments/${id}/matches`}>
                <Settings2 className="h-4 w-4" aria-hidden />
                Natijalarni boshqarish
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {!view.drawn ? (
        <NotStarted status={tournament.status} legacy={view.legacyMatches} />
      ) : (
        <>
          <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-1" aria-label="Musobaqa bo‘limlari">
            {(Object.keys(TOURNAMENT_TABS) as TournamentTab[]).map((key) => (
              <Button key={key} asChild size="sm" variant={key === tab ? 'default' : 'ghost'} className="flex-1 whitespace-nowrap">
                <Link
                  href={key === 'overview' ? `/results/${id}` : `/results/${id}?tab=${key}`}
                  aria-current={key === tab ? 'page' : undefined}
                  scroll={false}
                >
                  {TOURNAMENT_TABS[key]}
                </Link>
              </Button>
            ))}
          </nav>

          {tab === 'overview' ? <Overview view={view} /> : null}
          {tab === 'history' ? <History matches={view.matches} /> : null}
          {tab === 'schedule' ? <Schedule matches={view.matches} canScore={canScore && isOpen} /> : null}
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

function NotStarted({ status, legacy }: { status: string; legacy: MatchView[] }) {
  const message: Record<string, string> = {
    upcoming: 'Turnir hali e’lon qilinmoqda. Ro‘yxatdan o‘tish ochilgach, qatnashchilar shu yerda ko‘rinadi.',
    registration_open:
      'Ro‘yxatdan o‘tish davom etmoqda. Tashkilotchi turnirni boshlaganda qur’a avtomatik tashlanadi va o‘yinlar shu yerda paydo bo‘ladi.',
    ongoing: 'Turnir boshlangan, lekin to‘r hali tuzilmagan.',
    completed: 'Bu turnir musobaqa tizimidan oldin o‘tkazilgan — to‘r saqlanmagan.',
    cancelled: 'Turnir bekor qilingan.',
  }

  return (
    <div className="space-y-4">
      <Empty icon={Clock}>{message[status] ?? message.registration_open}</Empty>
      {legacy.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kiritilgan o‘yinlar</h2>
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

function Podium({ podium }: { podium: NonNullable<CompetitionView['podium']> }) {
  const top = podium.filter((p) => p.placement <= 3 && p.participated)
  if (top.length === 0) return null
  const medal = ['', 'text-yellow-500', 'text-slate-400', 'text-amber-700']
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Medal className="h-4 w-4 text-primary" aria-hidden />
          Yakuniy natijalar
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

function Overview({ view }: { view: CompetitionView }) {
  const { format, matches } = view
  return (
    <div className="space-y-8">
      {view.podium ? <Podium podium={view.podium} /> : null}

      {format === 'SINGLE_ELIMINATION' ? (
        <>
          <BracketView matches={matches} bracket="MAIN" title="To‘r" />
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

      {format === 'ROUND_ROBIN' && view.standings ? <StandingsTable rows={view.standings} caption="Turnir jadvali" /> : null}

      {format === 'GROUPS_KNOCKOUT' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {view.groups.map((group) => (
              <StandingsTable key={group.name} rows={group.rows} caption={group.name} qualify={view.config.advancePerGroup} />
            ))}
          </div>
          {matches.some((m) => m.bracket === 'MAIN') ? (
            <>
              <BracketView matches={matches} bracket="MAIN" />
              <BracketView matches={matches} bracket="THIRD_PLACE" />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pley-off to‘ri barcha guruh o‘yinlari yakunlanganda avtomatik tuziladi.
            </p>
          )}
        </>
      ) : null}

      {format === 'SWISS' ? (
        <>
          {view.standings ? <StandingsTable rows={view.standings} caption="Turnir jadvali" buchholz /> : null}
          <SwissRounds matches={matches} />
        </>
      ) : null}
    </div>
  )
}

function SwissRounds({ matches }: { matches: MatchView[] }) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => b - a)
  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <section key={round} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{round}-tur</h3>
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

function History({ matches }: { matches: MatchView[] }) {
  const played = matches
    .filter((m) => m.finalizedAt && !m.isBye)
    .sort((a, b) => (b.finalizedAt ?? '').localeCompare(a.finalizedAt ?? ''))

  if (played.length === 0) return <Empty>Hali yakunlangan o‘yin yo‘q.</Empty>

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

function Schedule({ matches, canScore }: { matches: MatchView[]; canScore: boolean }) {
  const upcoming = matches.filter((m) => !m.finalizedAt && !m.isBye && m.status !== 'cancelled')
  const timed = upcoming
    .filter((m) => m.scheduledAt)
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
  const untimed = upcoming.filter((m) => !m.scheduledAt)

  if (upcoming.length === 0) return <Empty>Kutilayotgan o‘yin yo‘q.</Empty>

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
            Rejalashtirilgan · keyingisi {formatDateTime(timed[0].scheduledAt)}
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border">{timed.map(row)}</ul>
        </section>
      ) : null}
      {untimed.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vaqti belgilanmagan</h2>
          <ul className="divide-y divide-border rounded-lg border border-dashed border-border">{untimed.map(row)}</ul>
        </section>
      ) : null}
    </div>
  )
}
