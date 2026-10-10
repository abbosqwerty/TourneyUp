import type { BracketType } from '@prisma/client'
import type { MatchView } from '@/lib/matches'
import { MatchCard } from './match-card'

const BRACKET_TITLES: Partial<Record<BracketType, string>> = {
  MAIN: 'Pley-off',
  WINNERS: 'Yuqori to‘r',
  LOSERS: 'Quyi to‘r',
  GRAND_FINAL: 'Grand final',
  THIRD_PLACE: '3-o‘rin uchun',
}

/**
 * Rounds side by side, left to right. Scrolls horizontally on narrow
 * screens instead of squeezing the cards.
 */
export function BracketView({ matches, bracket, title }: { matches: MatchView[]; bracket: BracketType; title?: string }) {
  const own = matches.filter((m) => m.bracket === bracket && !(m.isBye && m.status === 'cancelled'))
  if (own.length === 0) return null

  const rounds = [...new Set(own.map((m) => m.round))].sort((a, b) => a - b)

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title ?? BRACKET_TITLES[bracket]}
      </h3>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-max gap-4">
          {rounds.map((round) => {
            const column = own.filter((m) => m.round === round).sort((a, b) => a.position - b.position)
            return (
              <div key={round} className="flex w-56 flex-col">
                <p className="mb-2 truncate text-xs font-medium text-muted-foreground">
                  {column[0]?.stage.replace(/^.*?: /, '')}
                </p>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {column.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
