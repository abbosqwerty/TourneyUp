'use client'

import React from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'

interface ParticipantSlotsProps {
  current: number
  max: number
  className?: string
}

/** "1250" → "1 250" */
export function formatCount(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function isTournamentFull(current: number, max: number) {
  return max > 0 && current >= max
}

/** Capacity as one large, readable "12/40" — no per-slot dots or bars. */
export function ParticipantSlots({ current, max, className }: ParticipantSlotsProps) {
  const { dict } = useLanguage()
  const safeMax = Math.max(1, max || 16)
  const safeCurrent = Math.max(0, Math.min(current || 0, safeMax))
  const spotsLeft = safeMax - safeCurrent
  const isFull = spotsLeft === 0
  const isAlmostFull = !isFull && spotsLeft <= Math.max(2, Math.floor(safeMax * 0.2))

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5',
        isFull ? 'border-destructive/40 bg-destructive/5' : 'border-border/60 bg-secondary/30',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Users className={cn('h-5 w-5 shrink-0', isFull ? 'text-destructive' : 'text-primary')} aria-hidden />
        <span className="text-xl font-bold leading-none tabular-nums tracking-tight">
          {formatCount(safeCurrent)}
          <span className="text-muted-foreground">/{formatCount(safeMax)}</span>
        </span>
        <span className="truncate text-xs text-muted-foreground">{dict.feed.participants}</span>
      </div>
      {isFull ? (
        <span className="shrink-0 text-sm font-semibold text-destructive">{dict.feed.full}</span>
      ) : (
        <span className={cn('shrink-0 text-xs tabular-nums', isAlmostFull ? 'font-semibold text-warning' : 'text-muted-foreground')}>
          {dict.feed.spots_left.replace('{n}', formatCount(spotsLeft))}
        </span>
      )}
    </div>
  )
}
