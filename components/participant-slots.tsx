'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ParticipantSlotsProps {
  current: number
  max: number
  className?: string
}

export function ParticipantSlots({ current, max, className }: ParticipantSlotsProps) {
  // Bound max between 1 and 128 for clean visual presentation
  const safeMax = Math.max(1, Math.min(max || 16, 128))
  const safeCurrent = Math.max(0, Math.min(current || 0, safeMax))
  const spotsLeft = safeMax - safeCurrent
  const isAlmostFull = spotsLeft <= Math.max(2, Math.floor(safeMax * 0.2))
  const isFull = spotsLeft === 0

  // Dot size based on total count — always readable
  const dotSize =
    safeMax <= 16
      ? 'h-3.5 w-3.5'
      : safeMax <= 32
        ? 'h-3 w-3'
        : safeMax <= 64
          ? 'h-2.5 w-2.5'
          : 'h-2 w-2'

  const gapSize = safeMax <= 32 ? 'gap-1.5' : 'gap-1'

  return (
    <div className={cn('w-full rounded-lg bg-secondary/20 border border-border/40 p-2.5', className)}>
      {/* Dots grid */}
      <div className={cn('flex flex-wrap items-center', gapSize)}>
        {Array.from({ length: safeMax }).map((_, i) => {
          const filled = i < safeCurrent
          return (
            <span
              key={i}
              title={`Slot ${i + 1}: ${filled ? 'Joined' : 'Available'}`}
              className={cn(
                dotSize,
                'rounded-full inline-block shrink-0 transition-all duration-200',
                filled
                  ? 'bg-primary shadow-[0_0_4px_0px] shadow-primary/50'
                  : 'bg-muted border border-border/60'
              )}
            />
          )
        })}
      </div>

      {/* Spots left label */}
      <div className="flex items-center justify-between mt-2 text-[10px] font-medium">
        <span className="text-muted-foreground">
          {safeCurrent}/{safeMax} joined
        </span>
        {isFull ? (
          <span className="text-destructive font-semibold">Full</span>
        ) : isAlmostFull ? (
          <span className="text-warning font-semibold">{spotsLeft} left!</span>
        ) : (
          <span className="text-muted-foreground">{spotsLeft} spots left</span>
        )}
      </div>
    </div>
  )
}
