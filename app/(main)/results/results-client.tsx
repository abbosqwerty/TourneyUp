'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  ResultMatch,
  MatchEvent,
  initialResultMatches,
} from '@/lib/results-data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Search,
  Trophy,
  Activity,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Plus,
  Minus,
  Star,
  MapPin,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ==========================================================================
 * 🎨 THEME & COLOR CONFIGURATION (Easily customize colors here!)
 * ==========================================================================
 * You can customize the look and feel of the Results & Live Center right here.
 * All classes use TourneyUp's Tailwind design tokens (defined in `app/globals.css`).
 *
 * HOW TO CHANGE COLORS:
 * 1. To change page colors globally across the whole site:
 *    👉 Open `app/globals.css` and adjust `--primary`, `--background`, `--card`, etc.
 * 2. To change colors specifically for this Results section:
 *    👉 Simply modify any value inside this `RESULTS_THEME` object below!
 * ========================================================================== */
export const RESULTS_THEME = {
  // ── Layout & Surfaces ──
  pageBg: 'bg-background text-foreground',
  sidebarBg: 'bg-card/70 border-border/50',
  topStripBg: 'bg-card/90 border-border/60',
  subBarBg: 'bg-card/50 border-border/40',
  filterPillContainer: 'bg-secondary/40 border-border/30',
  leagueHeaderBg: 'bg-secondary/30 border-border/40',

  // ── Match List Rows ──
  rowHover: 'hover:bg-secondary/40',
  rowSelected: 'bg-primary/10 border-l-2 border-l-primary',
  rowBorder: 'border-border/30',

  // ── Active vs Inactive Buttons ──
  activeSportPill: 'bg-primary text-primary-foreground shadow-sm',
  inactiveSportPill: 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
  activeTab: 'bg-primary text-primary-foreground font-bold shadow-xs',
  inactiveTab: 'text-muted-foreground hover:text-foreground hover:bg-secondary/30',

  // ── Live Match Indicators ──
  liveBadge: 'bg-destructive/15 text-destructive border border-destructive/30',
  liveDot: 'bg-destructive',
  liveClockText: 'text-destructive font-extrabold',

  // ── Match Center Drawer ──
  drawerBg: 'bg-card border-border/50',
  scoreboardGradient: 'from-secondary/30 to-card/60 border-border/40',
  drawerActiveTab: 'border-primary text-primary bg-primary/5',
  drawerInactiveTab: 'border-transparent text-muted-foreground hover:text-foreground',
  incidentTimelineLine: 'before:bg-border/60',
  incidentCardBg: 'bg-secondary/30 border-border/40',

  // ── Comparison Statistics Bars ──
  statBarTeam1: 'bg-primary',
  statBarTeam2: 'bg-muted-foreground/40',

  // ── SofaScore Performance Ratings (Lineups) ──
  ratingBadges: {
    elite: 'bg-primary text-primary-foreground',    // 8.5+ rating (e.g. #88bdf2 in dark mode)
    great: 'bg-emerald-600 text-white',             // 7.5 - 8.4 rating
    average: 'bg-amber-600 text-white',             // 6.5 - 7.4 rating
    below: 'bg-destructive text-destructive-foreground', // < 6.5 rating
  },
}

// ── Sports list with SofaScore icons ──────────────────────────────────────────
const SPORTS_NAV: Array<{
  id: string
  label: string
  icon: string
  badge?: string
}> = [
  { id: 'all', label: 'All Sports', icon: '🏆' },
  { id: 'football', label: 'Football', icon: '⚽', badge: '3' },
  { id: 'valorant', label: 'Valorant', icon: '🎮', badge: '2' },
  { id: 'chess', label: 'Chess', icon: '♟️', badge: '1' },
  { id: 'basketball', label: 'Basketball', icon: '🏀', badge: '1' },
]

// ── Rating badge with customizable color scale ───────────────────────────────
function SofaScoreRating({ rating }: { rating: number }) {
  const { ratingBadges } = RESULTS_THEME
  const badgeClass =
    rating >= 8.5
      ? ratingBadges.elite
      : rating >= 7.5
      ? ratingBadges.great
      : rating >= 6.5
      ? ratingBadges.average
      : ratingBadges.below

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-bold text-[11px] px-1.5 py-0.5 rounded shadow-xs min-w-[28px]',
        badgeClass
      )}
    >
      {rating.toFixed(1)}
    </span>
  )
}

// ── Event emoji helper ────────────────────────────────────────────────────────
function getIncidentIcon(type: MatchEvent['type']) {
  switch (type) {
    case 'goal':
      return '⚽'
    case 'card':
      return '🟨'
    case 'kill':
      return '💀'
    case 'round':
      return '🎯'
    case 'checkmate':
      return '♟️'
    case 'substitution':
      return '🔄'
    case 'foul':
      return '🚩'
    default:
      return '⚡'
  }
}

interface ResultsClientProps {
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string
  isOrganizer?: boolean
}

export default function ResultsClient({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isOrganizer = false,
}: ResultsClientProps) {
  const [matches, setMatches] = useState<ResultMatch[]>(initialResultMatches)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'finished' | 'upcoming'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'tomorrow'>('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null)

  // Default to first live match or first match for authentic SofaScore desktop view
  const [selectedMatch, setSelectedMatch] = useState<ResultMatch | null>(
    () => initialResultMatches.find((m) => m.status === 'live') || initialResultMatches[0]
  )
  const [matchCenterTab, setMatchCenterTab] = useState<'summary' | 'stats' | 'lineups'>('summary')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Pinned favorites
  const [pinnedTournaments, setPinnedTournaments] = useState<string[]>([
    'tourn-football',
    'tourn-valorant',
  ])

  // Organizer Live Update Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<ResultMatch | null>(null)
  const [newEventPlayer, setNewEventPlayer] = useState('')
  const [newEventDetail, setNewEventDetail] = useState('')
  const [newEventType, setNewEventType] = useState<MatchEvent['type']>('goal')
  const [newEventTeam, setNewEventTeam] = useState<1 | 2>(1)
  const [newEventMinute, setNewEventMinute] = useState('')

  // Live matches count
  const liveCount = useMemo(() => matches.filter((m) => m.status === 'live').length, [matches])

  // Ticker animation simulation for live clock
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Sport
      if (selectedSport !== 'all' && m.sport !== selectedSport) return false

      // Status Filter
      if (statusFilter === 'live' && m.status !== 'live') return false
      if (statusFilter === 'finished' && m.status !== 'finished') return false
      if (statusFilter === 'upcoming' && m.status !== 'upcoming') return false

      // Date Filter (live matches always visible on "today")
      if (statusFilter !== 'live') {
        if (m.status !== 'live' && m.date !== dateFilter) return false
      }

      // Tournament Filter
      if (selectedTournament && m.tournamentId !== selectedTournament) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const text = `${m.team1.name} ${m.team2.name} ${m.tournamentName} ${m.venue}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [matches, selectedSport, statusFilter, dateFilter, selectedTournament, searchQuery])

  // Group Matches by Tournament
  const groupedTournaments = useMemo(() => {
    const groups: {
      [id: string]: {
        tournamentId: string
        tournamentName: string
        tournamentLogo: string
        sportLabel: string
        sport: string
        matches: ResultMatch[]
      }
    } = {}

    filteredMatches.forEach((m) => {
      if (!groups[m.tournamentId]) {
        groups[m.tournamentId] = {
          tournamentId: m.tournamentId,
          tournamentName: m.tournamentName,
          tournamentLogo: m.tournamentLogo,
          sportLabel: m.sportLabel,
          sport: m.sport,
          matches: [],
        }
      }
      groups[m.tournamentId].matches.push(m)
    })

    return Object.values(groups)
  }, [filteredMatches])

  // List of all unique tournaments for the left sidebar
  const allTournamentsList = useMemo(() => {
    const seen = new Set<string>()
    return matches
      .filter((m) => {
        if (seen.has(m.tournamentId)) return false
        seen.add(m.tournamentId)
        return true
      })
      .map((m) => ({
        id: m.tournamentId,
        name: m.tournamentName,
        logo: m.tournamentLogo,
        sportLabel: m.sportLabel,
        sport: m.sport,
        matchCount: matches.filter((x) => x.tournamentId === m.tournamentId).length,
        hasLive: matches.some((x) => x.tournamentId === m.tournamentId && x.status === 'live'),
      }))
  }, [matches])

  // Toggle favorite tournament
  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPinnedTournaments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Handle open editor
  const handleOpenEdit = (m: ResultMatch, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingMatch({ ...m })
    setEditModalOpen(true)
  }

  // Save organizer edit
  const handleSaveScoreUpdate = () => {
    if (!editingMatch) return
    const updated = {
      ...editingMatch,
      updatedAt: 'Just now (Organizer Verified)',
    }
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    if (selectedMatch?.id === updated.id) {
      setSelectedMatch(updated)
    }
    setEditModalOpen(false)
  }

  // Add Incident in Organizer Modal
  const handleAddEvent = () => {
    if (!editingMatch || !newEventPlayer.trim()) return

    const event: MatchEvent = {
      id: `ev-${Date.now()}`,
      minute: newEventMinute.trim() || editingMatch.liveTime || '75\'',
      type: newEventType,
      team: newEventTeam,
      player: newEventPlayer.trim(),
      detail: newEventDetail.trim() || 'Official match chronicle',
    }

    const updated: ResultMatch = {
      ...editingMatch,
      events: [event, ...editingMatch.events],
    }

    if (newEventType === 'goal' || newEventType === 'round') {
      if (newEventTeam === 1) {
        updated.team1 = { ...updated.team1, score: updated.team1.score + 1 }
      } else {
        updated.team2 = { ...updated.team2, score: updated.team2.score + 1 }
      }
    }

    setEditingMatch(updated)
    setNewEventPlayer('')
    setNewEventDetail('')
    setNewEventMinute('')
  }

  return (
    <div className={cn('w-full h-[calc(100dvh-4rem)] flex flex-col overflow-hidden select-none', RESULTS_THEME.pageBg)}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP SPORT BAR (Styled with TourneyUp theme)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className={cn('shrink-0 px-3 md:px-5 flex items-center justify-between z-30 border-b', RESULTS_THEME.topStripBg)}>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2">
          {SPORTS_NAV.map((sport) => {
            const isActive = selectedSport === sport.id
            return (
              <button
                key={sport.id}
                onClick={() => {
                  setSelectedSport(sport.id)
                  setSelectedTournament(null)
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? RESULTS_THEME.activeSportPill
                    : RESULTS_THEME.inactiveSportPill
                )}
              >
                <span>{sport.icon}</span>
                <span>{sport.label}</span>
                {sport.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {sport.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Global Live Ticker Pill */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 pl-3 border-l border-border/40 my-2">
          <button
            onClick={() => setStatusFilter(statusFilter === 'live' ? 'all' : 'live')}
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all',
              statusFilter === 'live'
                ? 'bg-destructive text-destructive-foreground shadow-xs'
                : RESULTS_THEME.liveBadge + ' hover:opacity-80'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                statusFilter === 'live' ? 'bg-destructive-foreground' : RESULTS_THEME.liveDot,
                pulse ? 'opacity-100 scale-125' : 'opacity-60 scale-100',
                'transition-all duration-300'
              )}
            />
            <span>LIVE ({liveCount})</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. SUB-BAR: DATE CONTROLLER & STATUS TABS                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={cn('shrink-0 px-3 md:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 border-b', RESULTS_THEME.subBarBg)}>
        {/* Date Tabs (Yesterday / Today / Tomorrow) */}
        <div className={cn('flex items-center gap-1 p-1 rounded-lg border', RESULTS_THEME.filterPillContainer)}>
          {(['yesterday', 'today', 'tomorrow'] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDateFilter(d)
                if (statusFilter === 'live' && d !== 'today') {
                  setStatusFilter('all')
                }
              }}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors',
                dateFilter === d
                  ? RESULTS_THEME.activeTab
                  : RESULTS_THEME.inactiveTab
              )}
            >
              {d}
              {d === 'today' && liveCount > 0 && (
                <span className={cn('ml-1.5 inline-block h-1.5 w-1.5 rounded-full', RESULTS_THEME.liveDot)} />
              )}
            </button>
          ))}
        </div>

        {/* Status Filters: ALL / LIVE / FINISHED / UPCOMING */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'live', label: `Live (${liveCount})`, isLive: true },
            { id: 'finished', label: 'Finished' },
            { id: 'upcoming', label: 'Scheduled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                'px-2.5 py-1 rounded-md font-semibold transition-all',
                statusFilter === tab.id
                  ? tab.isLive
                    ? 'bg-destructive text-destructive-foreground font-bold shadow-xs'
                    : 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search match or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary/30 border-border/50 text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. THREE-COLUMN SOFASCORE WORKSPACE                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── COLUMN A: LEAGUES & TOURNAMENTS SIDEBAR (Desktop) ─────────── */}
        <aside className={cn('hidden lg:flex flex-col w-[260px] shrink-0 border-r overflow-y-auto select-none', RESULTS_THEME.sidebarBg)}>
          {/* Pinned Leagues Header */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              Pinned Tournaments
            </span>
          </div>

          <div className="px-2 space-y-0.5 pb-2">
            {allTournamentsList
              .filter((t) => pinnedTournaments.includes(t.id))
              .map((t) => {
                const isSelected = selectedTournament === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      setSelectedTournament(selectedTournament === t.id ? null : t.id)
                    }
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left group',
                      isSelected
                        ? RESULTS_THEME.rowSelected
                        : 'text-foreground hover:bg-secondary/40'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar className="h-4 w-4 rounded-sm border border-border/40 shrink-0">
                        <AvatarImage src={t.logo} />
                        <AvatarFallback className="text-[8px]">{t.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{t.name}</span>
                    </div>
                    {t.hasLive && (
                      <span className={cn('h-1.5 w-1.5 rounded-full animate-ping shrink-0', RESULTS_THEME.liveDot)} />
                    )}
                  </button>
                )
              })}
          </div>

          {/* All Leagues Section */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-t border-border/30">
            <span>All Competitions</span>
            {selectedTournament && (
              <button
                onClick={() => setSelectedTournament(null)}
                className="text-[10px] text-primary hover:underline capitalize"
              >
                Clear
              </button>
            )}
          </div>

          <div className="px-2 space-y-0.5 flex-1 pb-4">
            {allTournamentsList.map((t) => {
              const isSelected = selectedTournament === t.id
              const isPinned = pinnedTournaments.includes(t.id)

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTournament(selectedTournament === t.id ? null : t.id)}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all group',
                    isSelected
                      ? RESULTS_THEME.rowSelected
                      : 'text-foreground hover:bg-secondary/40'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-4 w-4 rounded-sm border border-border/40 shrink-0">
                      <AvatarImage src={t.logo} />
                      <AvatarFallback className="text-[8px]">{t.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="truncate leading-none font-medium">{t.name}</p>
                      <span className="text-[10px] text-muted-foreground leading-none">{t.sportLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.hasLive && (
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', RESULTS_THEME.liveDot)} />
                    )}
                    <button
                      onClick={(e) => togglePin(t.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-opacity p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-3 w-3',
                          isPinned ? 'text-amber-500 fill-amber-500 opacity-100' : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── COLUMN B: CENTER MATCH FEED ──────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-y-auto border-r border-border/40 bg-background/50">
          {groupedTournaments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
              <Trophy className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <p className="font-bold text-foreground">No matches found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try changing your sport, date, or status filter.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSport('all')
                  setStatusFilter('all')
                  setDateFilter('today')
                  setSelectedTournament(null)
                  setSearchQuery('')
                }}
                className="text-xs h-8"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/25">
              {groupedTournaments.map((group) => (
                <div key={group.tournamentId}>
                  {/* Tournament Group Header Strip */}
                  <div className={cn('px-4 py-2 border-y flex items-center justify-between sticky top-0 z-10 backdrop-blur-md', RESULTS_THEME.leagueHeaderBg)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-5 w-5 rounded-sm border border-border/40 shrink-0">
                        <AvatarImage src={group.tournamentLogo} />
                        <AvatarFallback className="text-[8px] font-bold">
                          {group.tournamentName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-foreground truncate leading-tight">
                          {group.tournamentName}
                        </h3>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {group.sportLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {group.matches.length} {group.matches.length === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                  </div>

                  {/* Match Rows */}
                  <div className="divide-y divide-border/20">
                    {group.matches.map((m) => {
                      const isLive = m.status === 'live'
                      const isFinished = m.status === 'finished'
                      const isSelected = selectedMatch?.id === m.id

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMatch(m)
                            setMobileDrawerOpen(true)
                          }}
                          className={cn(
                            'flex items-center px-3 sm:px-4 py-2.5 cursor-pointer transition-all group relative',
                            RESULTS_THEME.rowHover,
                            isSelected && RESULTS_THEME.rowSelected
                          )}
                        >
                          {/* 1. Left Time / Status Column */}
                          <div className="w-[58px] shrink-0 flex flex-col items-center justify-center text-center pr-2">
                            {isLive ? (
                              <div className="flex flex-col items-center">
                                <span className={cn('text-[11px] leading-tight', RESULTS_THEME.liveClockText)}>
                                  {m.liveTime}
                                </span>
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full mt-1',
                                    RESULTS_THEME.liveDot,
                                    pulse ? 'opacity-100 scale-125' : 'opacity-40 scale-100',
                                    'transition-all duration-300'
                                  )}
                                />
                              </div>
                            ) : isFinished ? (
                              <span className="text-[11px] font-bold text-muted-foreground">FT</span>
                            ) : (
                              <span className="text-[11px] font-semibold text-primary">
                                {m.startTime.split(', ')[1] || m.startTime}
                              </span>
                            )}
                          </div>

                          {/* 2. Middle Teams & Score Columns */}
                          <div className="flex-1 min-w-0 pr-3">
                            {/* Team 1 */}
                            <div className="flex items-center justify-between gap-2 py-0.5">
                              <div className="flex items-center gap-2 truncate">
                                <Avatar className="h-4 w-4 rounded-full border border-border/40 shrink-0">
                                  <AvatarImage src={m.team1.avatar} />
                                  <AvatarFallback className="text-[8px]">
                                    {m.team1.name.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className={cn(
                                    'text-xs truncate leading-none',
                                    m.team1.winner
                                      ? 'font-bold text-foreground'
                                      : isFinished && !m.team1.winner
                                      ? 'text-muted-foreground font-normal'
                                      : 'text-foreground font-medium'
                                  )}
                                >
                                  {m.team1.name}
                                </span>
                              </div>

                              <span
                                className={cn(
                                  'text-xs font-mono font-bold w-6 text-right shrink-0',
                                  isLive
                                    ? RESULTS_THEME.liveClockText
                                    : m.team1.winner
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {m.status === 'upcoming' ? '-' : m.team1.score}
                              </span>
                            </div>

                            {/* Team 2 */}
                            <div className="flex items-center justify-between gap-2 py-0.5">
                              <div className="flex items-center gap-2 truncate">
                                <Avatar className="h-4 w-4 rounded-full border border-border/40 shrink-0">
                                  <AvatarImage src={m.team2.avatar} />
                                  <AvatarFallback className="text-[8px]">
                                    {m.team2.name.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className={cn(
                                    'text-xs truncate leading-none',
                                    m.team2.winner
                                      ? 'font-bold text-foreground'
                                      : isFinished && !m.team2.winner
                                      ? 'text-muted-foreground font-normal'
                                      : 'text-foreground font-medium'
                                  )}
                                >
                                  {m.team2.name}
                                </span>
                              </div>

                              <span
                                className={cn(
                                  'text-xs font-mono font-bold w-6 text-right shrink-0',
                                  isLive
                                    ? RESULTS_THEME.liveClockText
                                    : m.team2.winner
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {m.status === 'upcoming' ? '-' : m.team2.score}
                              </span>
                            </div>
                          </div>

                          {/* 3. Right Status / Period Score Pill */}
                          <div className="shrink-0 flex items-center gap-2">
                            {m.team1.periodScores && m.team1.periodScores.length > 0 && (
                              <div className="hidden sm:flex flex-col items-end text-[10px] text-muted-foreground font-mono leading-tight">
                                <span>{m.team1.periodScores.join(' ')}</span>
                                <span>{m.team2.periodScores?.join(' ')}</span>
                              </div>
                            )}

                            {/* Organizer Direct Edit Button */}
                            {isOrganizer && (
                              <button
                                onClick={(e) => handleOpenEdit(m, e)}
                                className="text-[10px] text-primary hover:underline px-2 py-1 rounded bg-primary/10 border border-primary/20 font-bold shrink-0 transition-colors"
                              >
                                Update
                              </button>
                            )}

                            <ChevronRight
                              className={cn(
                                'h-3.5 w-3.5 text-muted-foreground/40 transition-colors',
                                isSelected && 'text-primary'
                              )}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── COLUMN C: RIGHT MATCH CENTER DRAWER (Always visible on Desktop) ── */}
        <aside
          className={cn(
            'w-full lg:w-[420px] shrink-0 flex flex-col overflow-hidden border-l',
            RESULTS_THEME.drawerBg,
            // Mobile toggle behavior
            mobileDrawerOpen
              ? 'fixed inset-0 z-50 lg:static'
              : 'hidden lg:flex'
          )}
        >
          {selectedMatch ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Banner (Competition + Close button on mobile) */}
              <div className={cn('shrink-0 border-b px-4 py-2.5 flex items-center justify-between', RESULTS_THEME.leagueHeaderBg)}>
                <div className="flex items-center gap-2 min-w-0">
                  {mobileDrawerOpen && (
                    <button
                      onClick={() => setMobileDrawerOpen(false)}
                      className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-secondary/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  <Avatar className="h-5 w-5 rounded-sm border border-border/40 shrink-0">
                    <AvatarImage src={selectedMatch.tournamentLogo} />
                    <AvatarFallback className="text-[8px]">
                      {selectedMatch.tournamentName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {selectedMatch.tournamentName}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {selectedMatch.stage}
                    </p>
                  </div>
                </div>

                {isOrganizer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(selectedMatch)}
                    className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                  >
                    Edit Match
                  </Button>
                )}
              </div>

              {/* Match Header Scoreboard Card */}
              <div className={cn('shrink-0 bg-gradient-to-b p-5 border-b', RESULTS_THEME.scoreboardGradient)}>
                <div className="flex items-center justify-between gap-4">
                  {/* Team 1 */}
                  <div className="flex-1 flex flex-col items-center text-center min-w-0">
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-border/60 shadow-md mb-2">
                      <AvatarImage src={selectedMatch.team1.avatar} />
                      <AvatarFallback className="font-bold text-sm">
                        {selectedMatch.team1.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="text-xs font-bold text-foreground truncate w-full">
                      {selectedMatch.team1.name}
                    </h4>
                  </div>

                  {/* Center Score & Time */}
                  <div className="flex flex-col items-center justify-center shrink-0 px-2">
                    {selectedMatch.status === 'live' ? (
                      <Badge className={cn('text-[10px] font-bold px-2 py-0.5 mb-1 animate-pulse', RESULTS_THEME.liveBadge)}>
                        🔴 {selectedMatch.liveTime}
                      </Badge>
                    ) : selectedMatch.status === 'finished' ? (
                      <span className="text-[11px] font-bold text-muted-foreground mb-1">FINAL SCORE</span>
                    ) : (
                      <span className="text-[11px] font-bold text-primary mb-1">
                        {selectedMatch.startTime}
                      </span>
                    )}

                    {selectedMatch.status === 'upcoming' ? (
                      <div className="text-2xl font-bold text-muted-foreground py-1">VS</div>
                    ) : (
                      <div className="flex items-center gap-3 text-3xl font-extrabold font-mono text-foreground py-1">
                        <span
                          className={cn(
                            selectedMatch.team1.winner
                              ? 'text-foreground'
                              : selectedMatch.status === 'live'
                              ? RESULTS_THEME.liveClockText
                              : 'text-muted-foreground'
                          )}
                        >
                          {selectedMatch.team1.score}
                        </span>
                        <span className="text-muted-foreground/40 text-xl font-light">:</span>
                        <span
                          className={cn(
                            selectedMatch.team2.winner
                              ? 'text-foreground'
                              : selectedMatch.status === 'live'
                              ? RESULTS_THEME.liveClockText
                              : 'text-muted-foreground'
                          )}
                        >
                          {selectedMatch.team2.score}
                        </span>
                      </div>
                    )}

                    {/* Period breakdown */}
                    {selectedMatch.team1.periodScores && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-mono">
                        {selectedMatch.team1.periodScores.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-secondary/50 border border-border/30">
                            {s}-{selectedMatch.team2.periodScores?.[i] ?? 0}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="flex-1 flex flex-col items-center text-center min-w-0">
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-border/60 shadow-md mb-2">
                      <AvatarImage src={selectedMatch.team2.avatar} />
                      <AvatarFallback className="font-bold text-sm">
                        {selectedMatch.team2.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="text-xs font-bold text-foreground truncate w-full">
                      {selectedMatch.team2.name}
                    </h4>
                  </div>
                </div>

                {/* Venue & Spectators */}
                <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/30">
                  <span className="flex items-center gap-1 truncate max-w-[190px]">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{selectedMatch.venue}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Eye className="h-3 w-3" />
                    <span>{selectedMatch.spectators.toLocaleString()} fans</span>
                  </span>
                </div>
              </div>

              {/* Match Navigation Tabs */}
              <div className="shrink-0 flex border-b border-border/40 bg-card/70">
                {[
                  { id: 'summary', label: 'Incidents' },
                  { id: 'stats', label: 'Statistics' },
                  { id: 'lineups', label: 'Lineups & Ratings' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMatchCenterTab(tab.id as any)}
                    className={cn(
                      'flex-1 py-2.5 text-xs font-bold transition-all border-b-2 capitalize text-center',
                      matchCenterTab === tab.id
                        ? RESULTS_THEME.drawerActiveTab
                        : RESULTS_THEME.drawerInactiveTab
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* ── 1. INCIDENTS / TIMELINE ── */}
                {matchCenterTab === 'summary' && (
                  <div className="space-y-4">
                    {selectedMatch.events.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs">
                        {selectedMatch.status === 'upcoming'
                          ? 'Match has not started yet. Pre-match coverage active.'
                          : 'No incidents recorded for this event.'}
                      </div>
                    ) : (
                      <div className={cn('relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5', RESULTS_THEME.incidentTimelineLine)}>
                        {selectedMatch.events.map((ev) => {
                          const isTeam1 = ev.team === 1
                          return (
                            <div key={ev.id} className="relative flex items-start gap-3">
                              {/* Timeline Node Icon */}
                              <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center text-xs shadow-xs">
                                {getIncidentIcon(ev.type)}
                              </div>

                              <div className={cn('flex-1 rounded-lg p-2.5 border', RESULTS_THEME.incidentCardBg)}>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-foreground">{ev.player}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {ev.minute}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{ev.detail}</p>
                                <span
                                  className={cn(
                                    'inline-block mt-1 text-[10px] font-semibold',
                                    isTeam1 ? 'text-primary' : 'text-amber-500'
                                  )}
                                >
                                  {isTeam1
                                    ? selectedMatch.team1.name
                                    : selectedMatch.team2.name}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 2. STATISTICS BARS ── */}
                {matchCenterTab === 'stats' && (
                  <div className="space-y-4">
                    {Object.keys(selectedMatch.stats).length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs">
                        No match statistics available.
                      </div>
                    ) : (
                      Object.entries(selectedMatch.stats).map(([metric, vals]) => {
                        if (!vals) return null
                        const [val1, val2] = vals as [number, number]
                        const total = val1 + val2 || 1

                        const labelMap: Record<string, string> = {
                          possession: 'Ball Possession %',
                          shotsOnTarget: 'Shots on Target',
                          totalShots: 'Total Shots',
                          corners: 'Corner Kicks',
                          fouls: 'Fouls',
                          roundWins: 'Round Wins',
                          kills: 'Total Kills',
                          headshots: 'Headshot Kills',
                          acesClutches: 'Aces / Clutches',
                        }

                        return (
                          <div key={metric} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span
                                className={cn(
                                  val1 > val2 ? 'text-primary font-bold' : 'text-foreground'
                                )}
                              >
                                {val1}
                                {metric === 'possession' && '%'}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                {labelMap[metric] || metric}
                              </span>
                              <span
                                className={cn(
                                  val2 > val1 ? 'text-primary font-bold' : 'text-foreground'
                                )}
                              >
                                {val2}
                                {metric === 'possession' && '%'}
                              </span>
                            </div>

                            {/* Dual-colored Comparative Bar using Theme Tokens */}
                            <div className="flex h-2 rounded-full overflow-hidden bg-secondary/50 border border-border/30">
                              <div
                                className={cn('rounded-l-full transition-all', RESULTS_THEME.statBarTeam1)}
                                style={{ width: `${(val1 / total) * 100}%` }}
                              />
                              <div
                                className={cn('rounded-r-full transition-all', RESULTS_THEME.statBarTeam2)}
                                style={{ width: `${(val2 / total) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* ── 3. LINEUPS & RATINGS ── */}
                {matchCenterTab === 'lineups' && (
                  <div className="space-y-6">
                    {/* Team 1 Roster */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-border/40">
                        <span className="text-xs font-bold text-foreground">
                          {selectedMatch.team1.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">Rating</span>
                      </div>
                      <div className="space-y-1">
                        {selectedMatch.team1Roster.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-secondary/25 hover:bg-secondary/40 transition-colors border border-border/20"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {player.number && (
                                <span className="text-[10px] font-mono text-muted-foreground w-4 text-center">
                                  {player.number}
                                </span>
                              )}
                              <Avatar className="h-6 w-6 rounded-full border border-border/40 shrink-0">
                                <AvatarImage src={player.avatar} />
                                <AvatarFallback className="text-[9px]">
                                  {player.name.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="truncate">
                                <p className="text-xs font-semibold text-foreground truncate leading-none">
                                  {player.name}
                                </p>
                                <span className="text-[10px] text-muted-foreground leading-none">
                                  {player.role}
                                </span>
                              </div>
                            </div>
                            <SofaScoreRating rating={player.rating} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team 2 Roster */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-border/40">
                        <span className="text-xs font-bold text-foreground">
                          {selectedMatch.team2.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">Rating</span>
                      </div>
                      <div className="space-y-1">
                        {selectedMatch.team2Roster.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-secondary/25 hover:bg-secondary/40 transition-colors border border-border/20"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {player.number && (
                                <span className="text-[10px] font-mono text-muted-foreground w-4 text-center">
                                  {player.number}
                                </span>
                              )}
                              <Avatar className="h-6 w-6 rounded-full border border-border/40 shrink-0">
                                <AvatarImage src={player.avatar} />
                                <AvatarFallback className="text-[9px]">
                                  {player.name.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="truncate">
                                <p className="text-xs font-semibold text-foreground truncate leading-none">
                                  {player.name}
                                </p>
                                <span className="text-[10px] text-muted-foreground leading-none">
                                  {player.role}
                                </span>
                              </div>
                            </div>
                            <SofaScoreRating rating={player.rating} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
              <Activity className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs">Select any match to inspect SofaScore Match Center</p>
            </div>
          )}
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. ARBITER / ORGANIZER LIVE CONTROLLER MODAL                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isOrganizer && editingMatch && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-md bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Arbiter Live Controller
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingMatch.tournamentName} • {editingMatch.team1.name} vs{' '}
                {editingMatch.team2.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Match Status */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Match State
                </label>
                <div className="flex gap-2">
                  {(['live', 'finished', 'upcoming'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() =>
                        setEditingMatch((prev) => (prev ? { ...prev, status: st } : prev))
                      }
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors',
                        editingMatch.status === st
                          ? st === 'live'
                            ? 'bg-destructive text-destructive-foreground'
                            : st === 'finished'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Minute */}
              {editingMatch.status === 'live' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Clock / Round Ticker
                  </label>
                  <Input
                    placeholder="e.g. 78' or Map 2 • 12-10"
                    value={editingMatch.liveTime || ''}
                    onChange={(e) =>
                      setEditingMatch((prev) =>
                        prev ? { ...prev, liveTime: e.target.value } : prev
                      )
                    }
                    className="h-8 text-xs bg-secondary/30 border-border/50"
                  />
                </div>
              )}

              {/* Score Increments */}
              <div className="bg-secondary/25 p-3 rounded-lg border border-border/40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Live Score
                </label>
                <div className="flex items-center justify-between gap-3">
                  {/* Team 1 Score */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate max-w-[90px]">
                      {editingMatch.team1.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-xs border-border/60"
                        onClick={() =>
                          setEditingMatch((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  team1: {
                                    ...prev.team1,
                                    score: Math.max(0, prev.team1.score - 1),
                                  },
                                }
                              : prev
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-base font-bold font-mono w-6 text-center">
                        {editingMatch.team1.score}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-xs border-border/60"
                        onClick={() =>
                          setEditingMatch((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  team1: { ...prev.team1, score: prev.team1.score + 1 },
                                }
                              : prev
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <span className="text-muted-foreground font-bold">:</span>

                  {/* Team 2 Score */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-xs border-border/60"
                        onClick={() =>
                          setEditingMatch((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  team2: {
                                    ...prev.team2,
                                    score: Math.max(0, prev.team2.score - 1),
                                  },
                                }
                              : prev
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-base font-bold font-mono w-6 text-center">
                        {editingMatch.team2.score}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-xs border-border/60"
                        onClick={() =>
                          setEditingMatch((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  team2: { ...prev.team2, score: prev.team2.score + 1 },
                                }
                              : prev
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs font-semibold truncate max-w-[90px]">
                      {editingMatch.team2.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Match Incident */}
              <div className="space-y-2 border border-border/40 p-3 rounded-lg bg-secondary/20">
                <span className="text-xs font-bold text-foreground block">
                  Add Match Incident
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(['goal', 'round', 'card', 'substitution'] as MatchEvent['type'][]).map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setNewEventType(t)}
                        className={cn(
                          'py-1 rounded-md text-[10px] font-bold capitalize border transition-all',
                          newEventType === t
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'border-border/40 text-muted-foreground bg-secondary/30'
                        )}
                      >
                        {getIncidentIcon(t)} {t}
                      </button>
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setNewEventTeam(1)}
                    className={cn(
                      'flex-1 py-1 rounded-md text-[10px] font-semibold border truncate transition-colors',
                      newEventTeam === 1
                        ? 'bg-primary/15 text-primary border-primary/40 font-bold'
                        : 'border-border/40 text-muted-foreground'
                    )}
                  >
                    {editingMatch.team1.name}
                  </button>
                  <button
                    onClick={() => setNewEventTeam(2)}
                    className={cn(
                      'flex-1 py-1 rounded-md text-[10px] font-semibold border truncate transition-colors',
                      newEventTeam === 2
                        ? 'bg-primary/15 text-primary border-primary/40 font-bold'
                        : 'border-border/40 text-muted-foreground'
                    )}
                  >
                    {editingMatch.team2.name}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Minute (e.g. 74')"
                    value={newEventMinute}
                    onChange={(e) => setNewEventMinute(e.target.value)}
                    className="h-8 text-xs bg-secondary/30 border-border/50 col-span-1"
                  />
                  <Input
                    placeholder="Player Name"
                    value={newEventPlayer}
                    onChange={(e) => setNewEventPlayer(e.target.value)}
                    className="h-8 text-xs bg-secondary/30 border-border/50 col-span-2"
                  />
                </div>

                <Input
                  placeholder="Detail (e.g. Top corner header assist)"
                  value={newEventDetail}
                  onChange={(e) => setNewEventDetail(e.target.value)}
                  className="h-8 text-xs bg-secondary/30 border-border/50"
                />

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddEvent}
                  className="w-full h-8 text-xs font-semibold"
                >
                  + Record Incident
                </Button>
              </div>

              <Button
                onClick={handleSaveScoreUpdate}
                className="w-full font-bold text-xs h-9"
              >
                Broadcast to Live Center
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
