import type { Metadata } from 'next'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { ChevronRight, Swords, Trophy, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { DbErrorCard } from '@/components/db-error-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TOURNAMENT_STATUS_CLASSES } from '@/lib/constants'
import { getI18n } from '@/lib/i18n/server'
import { COMPETITION_TABS, type CompetitionTab } from '@/lib/competition/list'
import { CompetitionFilters } from './competition-filters'
import { CompetitionPager } from './competition-pager'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  // The root layout appends "| TourneyUp" via its title template.
  return { title: dict.competition.list.title, description: dict.competition.list.meta_description }
}

const PAGE_SIZE = 20

/** Running first, then those still filling up, then finished. */
const STATUS_ORDER: Record<string, number> = {
  ongoing: 0,
  registration_open: 1,
  upcoming: 2,
  completed: 3,
  cancelled: 4,
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export default async function CompetitionListPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const { dict } = await getI18n()
  const c = dict.competition
  const categories: Record<string, string> = c.categories
  const rawTab = readParam(params.tab)
  const tab: CompetitionTab = rawTab in COMPETITION_TABS ? (rawTab as CompetitionTab) : 'all'
  const query = readParam(params.q).trim().slice(0, 80)
  const category = readParam(params.category)
  const parsedPage = Number.parseInt(readParam(params.page), 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  let rows: Awaited<ReturnType<typeof load>> | null = null
  try {
    rows = await load({ tab, query, category })
  } catch (error) {
    console.error('competition list failed', error)
  }
  if (!rows) return <DbErrorCard message={c.list.load_failed} />

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pagerQuery: Record<string, string> = {}
  if (tab !== 'all') pagerQuery.tab = tab
  if (query) pagerQuery.q = query
  if (category) pagerQuery.category = category

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{c.list.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.list.subtitle}
        </p>
      </div>

      <CompetitionFilters tab={tab} query={query} category={category} />

      {visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {query || category ? c.list.empty_filtered : c.list.empty}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((t) => (
            <li key={t.id}>
              <Link
                href={`/results/${t.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/30"
              >
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                  <Swords className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{t.title}</p>
                    <Badge className={TOURNAMENT_STATUS_CLASSES[t.status]}>{dict.status[t.status]}</Badge>
                    {t.liveCount > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" aria-hidden />
                        {c.list.live_count(t.liveCount)}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[t.sport, categories[t.category] ?? t.category, t.organizer].filter(Boolean).join(' · ')}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.formats_short[t.format]}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden />
                      {t.participantType === 'TEAM' ? c.list.teams(t.participants) : c.list.players(t.participants)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CompetitionPager page={page} pageCount={pageCount} query={pagerQuery} />
    </div>
  )
}

async function load({ tab, query, category }: { tab: CompetitionTab; query: string; category: string }) {
  const where: Prisma.TournamentWhereInput = {
    status: { in: [...COMPETITION_TABS[tab].statuses] },
    ...(query ? { title: { contains: query } } : {}),
    ...(category && ['sports', 'esports', 'academic'].includes(category) ? { category } : {}),
  }

  const tournaments = await db.tournament.findMany({
    where,
    take: 500,
    orderBy: { date: 'desc' },
    select: {
      id: true,
      title: true,
      sport: true,
      category: true,
      status: true,
      format: true,
      participantType: true,
      date: true,
      organization: { select: { name: true } },
      organizer: { select: { name: true } },
      _count: {
        select: {
          participants: { where: { status: 'approved' } },
          matches: { where: { status: 'live' } },
        },
      },
    },
  })

  return tournaments
    .map((t) => ({
      id: t.id,
      title: t.title,
      sport: t.sport,
      category: t.category,
      status: t.status,
      format: t.format,
      participantType: t.participantType,
      date: t.date,
      organizer: t.organization?.name ?? t.organizer.name,
      participants: t._count.participants,
      liveCount: t._count.matches,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.date.localeCompare(a.date))
}
