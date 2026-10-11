import type { BracketType } from '@prisma/client'
import type { MatchView } from '@/lib/matches'
import { cn } from '@/lib/utils'
import { MatchCard } from './match-card'

const BRACKET_TITLES: Partial<Record<BracketType, string>> = {
  MAIN: 'Pley-off',
  WINNERS: 'Yuqori to‘r',
  LOSERS: 'Quyi to‘r',
  GRAND_FINAL: 'Grand final',
  THIRD_PLACE: '3-o‘rin uchun',
}

/** How a round feeds the next one, which decides the connector shape. */
type Link = 'pair' | 'straight' | null

function linkBetween(count: number, nextCount: number | undefined): Link {
  if (!nextCount) return null
  if (nextCount * 2 === count) return 'pair'
  if (nextCount === count) return 'straight'
  return null
}

const LINE = 'pointer-events-none absolute border-muted-foreground/40'

/**
 * Rounds side by side, left to right, joined by bracket lines. Every round
 * is a grid over the same rows, and a match spans the rows of the matches
 * that feed it, so each card sits exactly between its two sources. Scrolls
 * horizontally on narrow screens instead of squeezing the cards.
 */
export function BracketView({ matches, bracket, title }: { matches: MatchView[]; bracket: BracketType; title?: string }) {
  const own = matches.filter((m) => m.bracket === bracket)
  if (own.every((m) => m.isBye && m.status === 'cancelled')) return null

  const rounds = [...new Set(own.map((m) => m.round))].sort((a, b) => a - b)
  const columns = rounds.map((round) => own.filter((m) => m.round === round).sort((a, b) => a.position - b.position))
  const rows = Math.max(...columns.map((c) => c.length))
  const aligned = columns.every((c) => rows % c.length === 0)

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title ?? BRACKET_TITLES[bracket]}
      </h3>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="min-w-max">
          <div className="mb-2 flex gap-8">
            {columns.map((column, c) => (
              <p key={rounds[c]} className="w-56 truncate text-xs font-medium text-muted-foreground">
                {column[0]?.stage.replace(/^.*?: /, '')}
              </p>
            ))}
          </div>
          <div className="flex items-stretch gap-8">
            {columns.map((column, c) => {
              const outgoing = aligned ? linkBetween(column.length, columns[c + 1]?.length) : null
              const incoming = aligned && c > 0 ? linkBetween(columns[c - 1].length, column.length) : null
              return (
                <div
                  key={rounds[c]}
                  className={cn('w-56', aligned ? 'grid' : 'flex flex-col justify-around gap-3')}
                  style={aligned ? { gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` } : undefined}
                >
                  {column.map((match, i) => {
                    const voided = match.isBye && match.status === 'cancelled'
                    return (
                      <div
                        key={match.id}
                        className="relative flex items-center py-1.5"
                        style={aligned ? { gridRow: `span ${rows / column.length}` } : undefined}
                      >
                        {voided ? <div className="h-px w-full" aria-hidden /> : <MatchCard match={match} className="w-full" />}

                        {incoming && !voided ? <span className={cn(LINE, '-left-4 top-1/2 w-4 border-t')} aria-hidden /> : null}
                        {outgoing && !voided ? <span className={cn(LINE, '-right-4 top-1/2 w-4 border-t')} aria-hidden /> : null}
                        {outgoing === 'pair' && !voided ? (
                          <span
                            className={cn(LINE, '-right-4 h-1/2 border-r', i % 2 === 0 ? 'top-1/2' : 'top-0')}
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
