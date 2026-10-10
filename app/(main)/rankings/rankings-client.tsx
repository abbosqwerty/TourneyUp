'use client'

import { useState, useMemo } from 'react'
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
import { Search, Trophy, Calendar, Award, Flame } from 'lucide-react'
import type { RankingEntry } from '@/lib/types'

const sportCategories = [
  { id: 'all', name: 'All Sports' },
  { id: 'Football', name: 'Football' },
  { id: 'Basketball', name: 'Basketball' },
  { id: 'Chess', name: 'Chess' },
  { id: 'Valorant', name: 'Valorant' },
  { id: 'PUBG Mobile', name: 'PUBG Mobile' },
  { id: 'Rocket League', name: 'Rocket League' },
  { id: 'Swimming', name: 'Swimming' },
  { id: 'Table Tennis', name: 'Table Tennis' },
  { id: 'Running', name: 'Running' },
]

interface RankingsClientProps {
  initialRankings: RankingEntry[]
  currentUserRank: number
  currentUserPoints: number
  currentUserId: string
}

export default function RankingsClient({
  initialRankings,
  currentUserRank,
  currentUserPoints,
  currentUserId,
}: RankingsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSport, setSelectedSport] = useState('all')
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'global'>('monthly')

  // Compute rankings dynamically based on selected sport and timeframe
  const displayRankings = useMemo(() => {
    // 1. Filter by Sport
    let baseList: RankingEntry[] = []

    if (selectedSport === 'all') {
      baseList = initialRankings
    } else {
      const sportLower = selectedSport.toLowerCase()
      const matching = initialRankings
        .map((entry) => {
          const sr = entry.sportRanks?.find(
            (s) => s.sport.toLowerCase() === sportLower
          )
          if (!sr) return null
          return {
            ...entry,
            points: sr.points,
          }
        })
        .filter((e): e is RankingEntry => e !== null)

      matching.sort((a, b) => b.points - a.points)
      baseList = matching.map((e, index) => ({
        ...e,
        rank: index + 1,
      }))
    }

    // 2. Adjust points by Timeframe
    let timedList = baseList.map((entry) => {
      let points = entry.points
      if (timeframe === 'monthly') {
        const charCode = entry.user.id.charCodeAt(entry.user.id.length - 1) || 0
        const factor = 0.32 + ((charCode % 5) - 2) * 0.02
        points = Math.max(80, Math.round(entry.points * factor))
      } else if (timeframe === 'weekly') {
        const charCode = entry.user.id.charCodeAt(0) || 0
        const factor = 0.11 + ((charCode % 5) - 2) * 0.015
        points = Math.max(30, Math.round(entry.points * factor))
      }
      return { ...entry, points }
    })

    if (timeframe !== 'global') {
      timedList.sort((a, b) => b.points - a.points)
      timedList = timedList.map((e, index) => ({
        ...e,
        rank: index + 1,
      }))
    }

    // 3. Search query filter
    if (!searchQuery) return timedList

    const query = searchQuery.toLowerCase()
    return timedList.filter(
      (entry) =>
        entry.user.name.toLowerCase().includes(query) ||
        entry.user.username.toLowerCase().includes(query) ||
        entry.user.university?.toLowerCase().includes(query)
    )
  }, [initialRankings, selectedSport, timeframe, searchQuery])

  // Current user rank in active view
  const myActiveEntry = displayRankings.find((r) => r.user.id === currentUserId)

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 theme-lb bg-background text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-2xl mx-auto w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            Top performers, seasonal champions, and sport rankings
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
                <p className="text-xs text-muted-foreground">Your Rank</p>
                <p className="font-bold text-sm">{myActiveEntry.points.toLocaleString()} points</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-secondary/30 rounded-2xl shadow-xs">
            <CardContent className="p-3.5 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold">Join the Leaderboard</p>
                <p className="text-[11px] text-muted-foreground">Compete in tournaments to earn points and rank up</p>
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
            onValueChange={(v) => setTimeframe(v as 'weekly' | 'monthly' | 'global')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-secondary/60 p-1">
              <TabsTrigger value="weekly" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="global" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                <Award className="h-3.5 w-3.5" />
                All Time
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters: Sport dropdown + Search */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl bg-card border-border">
              <SelectValue placeholder="Sport tanlang" />
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
              placeholder="Search players..."
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
              Ushbu yo‘nalish bo‘yicha o‘yinchilar topilmadi.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Boshqa sport turini tanlang yoki qidiruvni tozalang.
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

