'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RankingTable, TopThreePodium } from '@/components/ranking-table'
import { Search, Trophy } from 'lucide-react'
import type { RankingEntry } from '@/lib/types'

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

  const filteredRankings = initialRankings.filter(entry => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      entry.user.name.toLowerCase().includes(query) ||
      entry.user.username.toLowerCase().includes(query) ||
      entry.user.university?.toLowerCase().includes(query)
    )
  })

  const displayRankings = searchQuery ? filteredRankings : initialRankings

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rankings</h1>
          <p className="text-muted-foreground">
            See how you stack up against competitors worldwide
          </p>
        </div>

        {/* Your Rank Card */}
        {currentUserRank > 0 ? (
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">
                  #{currentUserRank}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Global Rank</p>
                <p className="font-bold">{currentUserPoints.toLocaleString()} points</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-secondary/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Join the Leaderboard</p>
                <p className="text-xs text-muted-foreground">Compete in tournaments to earn points and rank up</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Global leaderboard — the only ranking the app actually stores.
          Weekly/monthly views need rank history, which does not exist yet. */}
      <div className="space-y-6">
        {!searchQuery ? (
          <Card className="border-border/50 bg-gradient-to-b from-secondary/50 to-transparent">
            <CardContent className="pt-6">
              <TopThreePodium rankings={displayRankings} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Global reyting</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {displayRankings.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Qidiruv bo‘yicha o‘yinchi topilmadi.
              </p>
            ) : (
              <RankingTable rankings={displayRankings} currentUserId={currentUserId} />
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
