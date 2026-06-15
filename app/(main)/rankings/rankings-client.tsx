'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RankingTable, TopThreePodium } from '@/components/ranking-table'
import { Search, Trophy, Medal, Award } from 'lucide-react'
import type { RankingEntry } from '@/lib/mock-data'

const sportCategories = [
  { id: 'all', name: 'All Sports' },
  { id: 'football', name: 'Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'chess', name: 'Chess' },
  { id: 'valorant', name: 'Valorant' },
  { id: 'pubg', name: 'PUBG Mobile' },
  { id: 'rocket-league', name: 'Rocket League' },
  { id: 'swimming', name: 'Swimming' },
  { id: 'running', name: 'Running' },
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
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select sport" />
          </SelectTrigger>
          <SelectContent>
            {sportCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="global" className="w-full">
        <TabsList>
          <TabsTrigger value="global" className="gap-2">
            <Trophy className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <Medal className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <Award className="h-4 w-4" />
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6 space-y-6">
          {!searchQuery && (
            <Card className="bg-gradient-to-b from-secondary/50 to-transparent border-border/50">
              <CardContent className="pt-6">
                <TopThreePodium rankings={displayRankings} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSport !== 'all'
                  ? `${sportCategories.find(c => c.id === selectedSport)?.name} Rankings`
                  : 'Global Leaderboard'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RankingTable
                rankings={displayRankings}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RankingTable
                rankings={displayRankings.map((r, i) => ({
                  ...r,
                  rank: i + 1,
                  points: Math.floor(r.points * 0.08),
                  change: (['up', 'down', 'same'] as const)[i % 3],
                  changeAmount: i % 3 === 2 ? 0 : (i % 7) + 1
                }))}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Leaders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RankingTable
                rankings={displayRankings.map((r, i) => ({
                  ...r,
                  rank: i + 1,
                  points: Math.floor(r.points * 0.28),
                  change: (['up', 'down', 'same'] as const)[i % 3],
                  changeAmount: i % 3 === 2 ? 0 : (i % 12) + 1
                }))}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
