'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { RankingEntry } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/language-context'

interface RankingTableProps {
  rankings: RankingEntry[]
  showUniversity?: boolean
  currentUserId?: string
}

// ----------------------------------------------------
// Top 3 Podium matching template (2nd, 1st, 3rd)
// ----------------------------------------------------
export function TopThreePodium({ 
  rankings, 
  timeframe = 'monthly',
  sportName 
}: { 
  rankings: RankingEntry[]
  timeframe?: 'weekly' | 'monthly' | 'global'
  sportName?: string 
}) {
  const { dict } = useLanguage()
  const top3 = rankings.slice(0, 3)
  const [first, second, third] = [top3[0], top3[1], top3[2]]

  if (!first) return null

  const periodLabel = 
    timeframe === 'weekly' 
      ? dict.rankings.weekly 
      : timeframe === 'monthly' 
        ? dict.rankings.monthly 
        : dict.rankings.all_time

  const sportLabel = sportName && sportName !== 'all' ? ` · ${sportName}` : ''

  return (
    <div className="flex flex-col items-center w-full">
      {/* 3-Pillar Podium */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4 pb-2 w-full">
        {/* 2nd Place (Left) */}
        {second ? (
          <div className="flex flex-col items-center">
            <Link href={`/profile/${second.user.id}`} className="group flex flex-col items-center mb-2.5">
              <Avatar
                className="h-16 w-16 sm:h-20 sm:w-20 border-2 shadow-md transition-transform group-hover:scale-105"
                style={{ borderColor: 'var(--lb-silver)' }}
              >
                <AvatarImage src={second.user.avatar} alt={second.user.name} />
                <AvatarFallback
                  className="font-bold text-sm"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--lb-silver) 20%, transparent)',
                    color: 'var(--lb-silver)',
                  }}
                >
                  {second.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center max-w-[84px] sm:max-w-[120px] truncate">
                {second.user.name.split(' ')[0]}
              </span>
            </Link>
            <div
              className="w-24 sm:w-32 h-36 sm:h-44 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center p-3 shadow-xs"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--lb-silver) 12%, var(--card))',
                borderColor: 'color-mix(in srgb, var(--lb-silver) 40%, transparent)',
              }}
            >
              <span
                className="text-base sm:text-lg font-black"
                style={{ color: 'var(--lb-silver)' }}
              >
                2nd
              </span>
              <span className="mt-2 inline-flex items-center rounded-full bg-background/90 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-foreground/90 shadow-xs border border-border/40">
                {second.points.toLocaleString()} Pts
              </span>
            </div>
          </div>
        ) : (
          <div className="w-24 sm:w-32" />
        )}

        {/* 1st Place (Center - Tallest) */}
        {first && (
          <div className="flex flex-col items-center -mt-6 sm:-mt-8">
            <Link href={`/profile/${first.user.id}`} className="group flex flex-col items-center mb-2.5">
              <Avatar
                className="h-20 w-20 sm:h-24 sm:w-24 border-3 shadow-lg transition-transform group-hover:scale-105"
                style={{
                  borderColor: 'var(--lb-gold)',
                  boxShadow: '0 0 16px -2px color-mix(in srgb, var(--lb-gold) 45%, transparent)',
                }}
              >
                <AvatarImage src={first.user.avatar} alt={first.user.name} />
                <AvatarFallback
                  className="font-bold text-base"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--lb-gold) 20%, transparent)',
                    color: 'var(--lb-gold)',
                  }}
                >
                  {first.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="mt-2 text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors text-center max-w-[100px] sm:max-w-[140px] truncate">
                {first.user.name.split(' ')[0]}
              </span>
            </Link>
            <div
              className="w-28 sm:w-36 h-48 sm:h-56 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center p-3 shadow-md"
              style={{
                background: `linear-gradient(to bottom, color-mix(in srgb, var(--lb-gold) 25%, transparent), color-mix(in srgb, var(--lb-gold) 12%, transparent), color-mix(in srgb, var(--card) 85%, transparent))`,
                borderColor: 'color-mix(in srgb, var(--lb-gold) 55%, transparent)',
              }}
            >
              <span
                className="text-lg sm:text-2xl font-black"
                style={{ color: 'var(--lb-gold)' }}
              >
                1st
              </span>
              <span
                className="mt-2.5 inline-flex items-center rounded-full bg-background/95 px-3 py-1 text-xs sm:text-sm font-bold text-foreground shadow-xs border"
                style={{ borderColor: 'color-mix(in srgb, var(--lb-gold) 40%, transparent)' }}
              >
                {first.points.toLocaleString()} Pts
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Right) */}
        {third ? (
          <div className="flex flex-col items-center">
            <Link href={`/profile/${third.user.id}`} className="group flex flex-col items-center mb-2.5">
              <Avatar
                className="h-14 w-14 sm:h-18 sm:w-18 border-2 shadow-md transition-transform group-hover:scale-105"
                style={{ borderColor: 'var(--lb-bronze)' }}
              >
                <AvatarImage src={third.user.avatar} alt={third.user.name} />
                <AvatarFallback
                  className="font-bold text-sm"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--lb-bronze) 20%, transparent)',
                    color: 'var(--lb-bronze)',
                  }}
                >
                  {third.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center max-w-[84px] sm:max-w-[120px] truncate">
                {third.user.name.split(' ')[0]}
              </span>
            </Link>
            <div
              className="w-24 sm:w-32 h-28 sm:h-36 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-center p-3 shadow-xs"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--lb-bronze) 14%, var(--card))',
                borderColor: 'color-mix(in srgb, var(--lb-bronze) 40%, transparent)',
              }}
            >
              <span
                className="text-sm sm:text-base font-bold"
                style={{ color: 'var(--lb-bronze)' }}
              >
                3rd
              </span>
              <span className="mt-2 inline-flex items-center rounded-full bg-background/90 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-foreground/90 shadow-xs border border-border/40">
                {third.points.toLocaleString()} Pts
              </span>
            </div>
          </div>
        ) : (
          <div className="w-24 sm:w-32" />
        )}

      </div>

      {/* Leaderboard Highlight Banner */}
      <div className="text-center mt-6 mb-4">
        <p className="text-sm sm:text-base font-medium text-foreground">
          <span className="font-extrabold text-foreground">{first.user.name}</span> — {periodLabel}{sportLabel} {dict.rankings.leader_suffix}
        </p>
      </div>
    </div>
  )
}

// ----------------------------------------------------
// Leaderboard Table matching template (Name, Place, Points)
// ----------------------------------------------------
export function RankingTable({ rankings, showUniversity = true, currentUserId }: RankingTableProps) {
  const { dict } = useLanguage()

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-card border border-border overflow-hidden shadow-sm">
      {/* Header Row */}
      <div className="grid grid-cols-12 px-6 py-4 bg-secondary/50 text-xs sm:text-sm font-semibold text-muted-foreground border-b border-border/40">
        <span className="col-span-7">{dict.rankings.name}</span>
        <span className="col-span-2 text-center">{dict.rankings.place}</span>
        <span className="col-span-3 text-right">{dict.rankings.points}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {rankings.map((entry) => {
          const isCurrentUser = entry.user.id === currentUserId
          return (
            <div
              key={entry.user.id}
              className={cn(
                "grid grid-cols-12 items-center px-6 py-3.5 hover:bg-secondary/25 transition-colors",
                isCurrentUser && "bg-primary/10 border-l-4 border-l-primary"
              )}
            >
              {/* Name & Avatar */}
              <Link 
                href={`/profile/${entry.user.id}`}
                className="col-span-7 flex items-center gap-3.5 min-w-0 group"
              >
                <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                  <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                  <AvatarFallback className="font-bold text-xs bg-secondary text-foreground">
                    {entry.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {entry.user.name}
                  </p>
                  {showUniversity && entry.user.university && (
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.user.university}
                    </p>
                  )}
                </div>
              </Link>

              {/* Place */}
              <span className="col-span-2 text-center text-sm font-bold text-foreground/80">
                {entry.rank}
              </span>

              {/* Points */}
              <span className="col-span-3 text-right text-sm font-extrabold text-foreground">
                {entry.points.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
