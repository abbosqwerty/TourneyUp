'use client'

import { CalendarClock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/time'
import type { MatchSideView, MatchView } from '@/lib/matches'
import { stageLabel } from '@/lib/competition/labels'
import { dictionaries, type Dictionary } from '@/lib/i18n/dictionaries'
import { useLanguage } from '@/lib/i18n/language-context'

/** Uzbek labels, kept for older call sites; prefer `dict.competition.match.status`. */
export const MATCH_STATUS_LABELS: Record<MatchView['status'], string> = dictionaries.uz.competition.match.status

export const MATCH_STATUS_CLASSES: Record<MatchView['status'], string> = {
  scheduled: 'bg-secondary text-secondary-foreground',
  live: 'bg-destructive text-destructive-foreground',
  completed: 'bg-success text-success-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

/** Who sits in a side, or why nobody does yet. */
export function sideName(match: MatchView, side: MatchSideView, dict: Dictionary = dictionaries.uz) {
  if (side.participantId) return side.label
  if (match.isBye) return dict.competition.match.bye
  return dict.competition.match.tbd
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SideRow({ match, side }: { match: MatchView; side: MatchSideView }) {
  const { dict } = useLanguage()
  const name = sideName(match, side, dict)
  const known = Boolean(side.participantId)
  const won = known && match.winnerParticipantId === side.participantId && match.finalizedAt !== null
  const forfeited = match.resultType === 'FORFEIT' && known && !won

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5', won && 'font-semibold')}>
      <Avatar className="h-5 w-5 shrink-0">
        {side.avatar ? <AvatarImage src={side.avatar} alt="" /> : null}
        <AvatarFallback className="text-[9px]">{known ? initials(name) : '?'}</AvatarFallback>
      </Avatar>
      <span className={cn('min-w-0 flex-1 truncate text-sm', !known && 'italic text-muted-foreground')}>{name}</span>
      {forfeited ? (
        <span className="text-[10px] uppercase text-muted-foreground">{dict.competition.match.no_show}</span>
      ) : (
        <span className={cn('w-6 text-right text-sm tabular-nums', won ? 'text-primary' : 'text-muted-foreground')}>
          {side.score ?? (match.resultType === 'FORFEIT' && won ? 'W' : '')}
        </span>
      )}
    </div>
  )
}

/** Compact two-row box used in the bracket and in the match lists. */
export function MatchCard({ match, className, showStage = false }: { match: MatchView; className?: string; showStage?: boolean }) {
  const { dict, locale } = useLanguage()
  if (match.isBye && match.status === 'cancelled') return null

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card text-card-foreground', className)}>
      {showStage || match.scheduledAt || match.status === 'live' ? (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-1 text-[11px] text-muted-foreground">
          <span className="truncate">{showStage ? stageLabel(dict, match.stage) : formatDateTime(match.scheduledAt, locale)}</span>
          {match.status === 'live' ? (
            <span className="flex items-center gap-1 font-semibold text-destructive">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" aria-hidden />
              {dict.competition.match.live}
            </span>
          ) : null}
        </div>
      ) : null}
      <SideRow match={match} side={match.home} />
      <div className="h-px bg-border" />
      <SideRow match={match} side={match.away} />
      {match.isBye ? (
        <p className="border-t border-border px-3 py-1 text-[11px] text-muted-foreground">{dict.competition.match.bye_advanced}</p>
      ) : null}
    </div>
  )
}

/** Full-width row for Match History and Schedule. */
export function MatchListRow({ match, action }: { match: MatchView; action?: React.ReactNode }) {
  const { dict, locale } = useLanguage()
  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 sm:w-48">
        <p className="truncate text-sm font-medium">{stageLabel(dict, match.stage) || '—'}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3 w-3" aria-hidden />
          {match.scheduledAt ? formatDateTime(match.scheduledAt, locale) : dict.competition.match.unscheduled}
        </p>
      </div>
      <MatchCard match={match} className="min-w-0 flex-1" />
      <div className="flex shrink-0 items-center gap-2">
        <Badge className={MATCH_STATUS_CLASSES[match.status]}>{dict.competition.match.status[match.status]}</Badge>
        {action}
      </div>
    </div>
  )
}
