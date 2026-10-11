'use client'

import { useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RankingTable, TopThreePodium } from '@/components/ranking-table'
import { Search, Trophy, Calendar, Award, Flame, Loader2 } from 'lucide-react'
import type { RankingEntry } from '@/lib/types'
import type { LeaderboardPeriod } from '@/lib/points/leaderboard'
import { useLanguage } from '@/lib/i18n/language-context'

type Timeframe = 'weekly' | 'monthly' | 'global'

const toTimeframe = (period: LeaderboardPeriod): Timeframe => (period === 'all' ? 'global' : period)
const toPeriod = (timeframe: Timeframe): LeaderboardPeriod => (timeframe === 'global' ? 'all' : timeframe)

interface RankingsClientProps {
  /** Already computed on the server for the selected period and game. */
  rankings: RankingEntry[]
  me: { rank: number; points: number } | null
  currentUserId: string
  period: LeaderboardPeriod
  sport: string
  sports: string[]
}

/**
 * Leaderboard. Period and game live in the URL and are summed on the server
 * from the Tourney Points ledger; the browser only filters by name.
 */
export default function RankingsClient({
  rankings,
  me,
  currentUserId,
  period,
  sport,
  sports,
}: RankingsClientProps) {
  const { dict } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const timeframe = toTimeframe(period)
  const selectedSport = sport || 'all'

  const navigate = (next: { period?: LeaderboardPeriod; sport?: string }) => {
    const params = new URLSearchParams()
    const p = next.period ?? period
    const s = next.sport ?? sport
    if (p !== 'monthly') params.set('period', p)
    if (s && s !== 'all') params.set('sport', s)
    const qs = params.toString()
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false }))
  }

  const setTimeframe = (value: Timeframe) => navigate({ period: toPeriod(value) })
  const setSelectedSport = (value: string) => navigate({ sport: value === 'all' ? '' : value })

  const sportCategories = useMemo(
    () => [{ id: 'all', name: dict.rankings.all_games }, ...sports.map((name) => ({ id: name, name }))],
    [sports, dict.rankings.all_games]
  )

  const displayRankings = useMemo(() => {
    if (!searchQuery) return rankings
    const query = searchQuery.toLowerCase()
    return rankings.filter(
      (entry) =>
        entry.user.name.toLowerCase().includes(query) ||
        entry.user.username.toLowerCase().includes(query) ||
        entry.user.university?.toLowerCase().includes(query)
    )
  }, [rankings, searchQuery])

  // Current user's position in the active view (even outside the top 100).
  const myActiveEntry = me ?? undefined

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 theme-lb bg-background text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-2xl mx-auto w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {dict.rankings.title}
            {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
          </h1>
          <p className="text-muted-foreground text-sm">
            {dict.rankings.subtitle}
          </p>
        </div>

        {/* Your Rank Card */}
        {myActiveEntry ? (
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 rounded-2xl shadow-xs">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-base font-bold text-primary-foreground">
                  #{myActiveEntry.rank}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{dict.rankings.your_rank}</p>
                <p className="font-bold text-sm">{myActiveEntry.points.toLocaleString()} {dict.account.rankings.pts(myActiveEntry.points)}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-secondary/30 rounded-2xl shadow-xs">
            <CardContent className="p-3.5 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold">{dict.rankings.join_leaderboard}</p>
                <p className="text-[11px] text-muted-foreground">{dict.rankings.join_desc}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Control Bar: Timeframe Tabs & Sport Selector */}
      <div className="max-w-2xl mx-auto w-full space-y-3">
        {/* Timeframe Tabs: Weekly, Monthly, All Time */}
        <div className="flex items-center justify-center">
          <Tabs
            value={timeframe}
            onValueChange={(v) => setTimeframe(v as Timeframe)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-secondary/60 p-1">
              <TabsTrigger value="weekly" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                {dict.rankings.weekly}
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {dict.rankings.monthly}
              </TabsTrigger>
              <TabsTrigger value="global" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {dict.rankings.all_time}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters: Sport dropdown + Search */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl bg-card border-border">
              <SelectValue placeholder={dict.rankings.select_sport} />
            </SelectTrigger>
            <SelectContent>
              {sportCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={dict.rankings.search_players}
              className="pl-10 rounded-xl bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Section Template */}
      <div className="space-y-6 pt-2 pb-8">
        {!searchQuery && displayRankings.length > 0 ? (
          <TopThreePodium 
            rankings={displayRankings} 
            timeframe={timeframe}
            sportName={selectedSport}
          />
        ) : null}

        {displayRankings.length === 0 ? (
          <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-12 text-center shadow-xs">
            <p className="text-sm font-medium text-foreground">
              {dict.rankings.no_players_found}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dict.rankings.try_other_sport}
            </p>
          </div>
        ) : (
          <RankingTable 
            rankings={displayRankings} 
            currentUserId={currentUserId} 
          />
        )}
      </div>
    </div>
  )
}

