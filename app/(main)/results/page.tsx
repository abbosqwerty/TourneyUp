import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { RESULTS_PAGE_SIZE, RESULTS_TABS, type ResultsTab } from '@/lib/results'
import { countMatches, listMatches } from '@/lib/matches'
import { DbErrorCard } from '@/components/db-error-card'
import ResultsClient from './results-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // The root layout appends "| TourneyUp" via its title template.
  title: 'Natijalar',
  description: 'Jonli hisoblar, o‘yin jadvali va turnir natijalari.',
}


type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export default async function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const user = await getCurrentUser()

  const rawTab = readParam(params.tab)
  const tab: ResultsTab = rawTab in RESULTS_TABS ? (rawTab as ResultsTab) : 'live'
  const tournamentId = readParam(params.tournament) || undefined
  const parsedPage = Number.parseInt(readParam(params.page), 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load({ tab, tournamentId, page, userId: user?.id ?? null })
  } catch (error) {
    console.error('results page failed', error)
  }

  if (!data) return <DbErrorCard message="Natijalarni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />

  return (
    <ResultsClient
      tab={tab}
      tournamentId={tournamentId ?? null}
      page={page}
      pageSize={RESULTS_PAGE_SIZE}
      matches={data.matches}
      totalCount={data.totalCount}
      counts={data.counts}
      tournaments={data.tournaments}
      scorableTournamentIds={data.scorableTournamentIds}
      currentUserId={user?.id ?? null}
    />
  )
}

async function load({
  tab,
  tournamentId,
  page,
  userId,
}: {
  tab: ResultsTab
  tournamentId?: string
  page: number
  userId: string | null
}) {
  const status = [...RESULTS_TABS[tab]]

  const [matches, totalCount, live, scheduled, completed, tournaments] = await Promise.all([
    listMatches({ tournamentId, status, take: RESULTS_PAGE_SIZE, skip: (page - 1) * RESULTS_PAGE_SIZE }),
    countMatches({ tournamentId, status }),
    countMatches({ tournamentId, status: ['live'] }),
    countMatches({ tournamentId, status: ['scheduled'] }),
    countMatches({ tournamentId, status: ['completed'] }),
    // Only tournaments that actually have fixtures are worth filtering by.
    db.tournament.findMany({
      where: { matches: { some: {} } },
      select: { id: true, title: true, sport: true },
      orderBy: { date: 'desc' },
      take: 50,
    }),
  ])

  // Which of those tournaments may this user score? Read once, here, so the
  // client never decides permissions for itself.
  let scorableTournamentIds: string[] = []
  if (userId) {
    const [owned, staffed] = await Promise.all([
      db.tournament.findMany({
        where: { organizerId: userId, matches: { some: {} } },
        select: { id: true },
      }),
      db.tournamentStaff.findMany({
        where: { userId, revokedAt: null, role: { in: ['ADMIN', 'ORGANIZER'] } },
        select: { tournamentId: true },
      }),
    ])
    scorableTournamentIds = [
      ...new Set([...owned.map((t) => t.id), ...staffed.map((s) => s.tournamentId)]),
    ]
  }

  return {
    matches,
    totalCount,
    counts: { live, scheduled, completed },
    tournaments,
    scorableTournamentIds,
  }
}
