'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from 'lucide-react'
import type { RankingEntry } from '@/lib/mock-data'

interface RankingTableProps {
  rankings: RankingEntry[]
  showUniversity?: boolean
  currentUserId?: string
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
        <Trophy className="h-4 w-4 text-yellow-900" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg">
        <Medal className="h-4 w-4 text-gray-800" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg">
        <Award className="h-4 w-4 text-amber-200" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-sm font-bold">
      {rank}
    </div>
  )
}

function TrendIndicator({ change, amount }: { change: 'up' | 'down' | 'same'; amount: number }) {
  if (change === 'same' || amount === 0) {
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }
  if (change === 'up') {
    return (
      <div className="flex items-center gap-1 text-success">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">+{amount}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-destructive">
      <TrendingDown className="h-4 w-4" />
      <span className="text-xs font-medium">-{amount}</span>
    </div>
  )
}

export function RankingTable({ rankings, showUniversity = true, currentUserId }: RankingTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            {showUniversity && <TableHead className="hidden md:table-cell">University</TableHead>}
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Wins</TableHead>
            <TableHead className="w-20 text-center">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((entry) => (
            <TableRow 
              key={entry.user.id}
              className={cn(
                "transition-colors",
                entry.rank <= 3 && "bg-primary/5",
                entry.user.id === currentUserId && "bg-accent/10 border-l-2 border-l-accent"
              )}
            >
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <RankBadge rank={entry.rank} />
                </div>
              </TableCell>
              <TableCell>
                <Link 
                  href={`/profile/${entry.user.id}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Avatar className="h-9 w-9 border-2 border-border">
                    <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                    <AvatarFallback>{entry.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{entry.user.name}</p>
                    <p className="text-xs text-muted-foreground">@{entry.user.username}</p>
                  </div>
                </Link>
              </TableCell>
              {showUniversity && (
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {entry.user.university || '-'}
                </TableCell>
              )}
              <TableCell className="text-right">
                <span className="font-bold text-primary">{entry.points.toLocaleString()}</span>
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <Badge variant="secondary">{entry.wins}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <TrendIndicator change={entry.change} amount={entry.changeAmount} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Top 3 podium display
export function TopThreePodium({ rankings }: { rankings: RankingEntry[] }) {
  const top3 = rankings.slice(0, 3)
  const [first, second, third] = [top3[0], top3[1], top3[2]]

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {/* Second Place */}
      {second && (
        <div className="flex flex-col items-center">
          <Avatar className="h-16 w-16 border-4 border-gray-400 shadow-lg">
            <AvatarImage src={second.user.avatar} alt={second.user.name} />
            <AvatarFallback>{second.user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="mt-2 text-center">
            <p className="font-semibold text-sm">{second.user.name}</p>
            <p className="text-xs text-muted-foreground">{second.points.toLocaleString()} pts</p>
          </div>
          <div className="mt-2 h-24 w-24 rounded-t-lg bg-gradient-to-b from-gray-400 to-gray-600 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">2</span>
          </div>
        </div>
      )}

      {/* First Place */}
      {first && (
        <div className="flex flex-col items-center -mt-8">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-xl ring-4 ring-yellow-500/30">
              <AvatarImage src={first.user.avatar} alt={first.user.name} />
              <AvatarFallback>{first.user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <Trophy className="absolute -top-3 -right-3 h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2 text-center">
            <p className="font-bold">{first.user.name}</p>
            <p className="text-sm text-primary font-semibold">{first.points.toLocaleString()} pts</p>
          </div>
          <div className="mt-2 h-32 w-28 rounded-t-lg bg-gradient-to-b from-yellow-400 to-yellow-600 flex items-center justify-center glow-primary">
            <span className="text-4xl font-bold text-yellow-900">1</span>
          </div>
        </div>
      )}

      {/* Third Place */}
      {third && (
        <div className="flex flex-col items-center">
          <Avatar className="h-14 w-14 border-4 border-amber-700 shadow-lg">
            <AvatarImage src={third.user.avatar} alt={third.user.name} />
            <AvatarFallback>{third.user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="mt-2 text-center">
            <p className="font-semibold text-sm">{third.user.name}</p>
            <p className="text-xs text-muted-foreground">{third.points.toLocaleString()} pts</p>
          </div>
          <div className="mt-2 h-16 w-20 rounded-t-lg bg-gradient-to-b from-amber-600 to-amber-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-amber-200">3</span>
          </div>
        </div>
      )}
    </div>
  )
}
