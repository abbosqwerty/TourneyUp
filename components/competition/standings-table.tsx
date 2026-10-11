'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { StandingView } from '@/lib/competition/view'
import { useLanguage } from '@/lib/i18n/language-context'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Places gained or lost since the previous round. */
export function Movement({ move }: { move: number | null }) {
  const t = useLanguage().dict.competition.standings
  if (move === null) return null
  if (move === 0) {
    return (
      <span className="inline-block w-6 text-center text-xs text-muted-foreground" title={t.unchanged}>
        –
      </span>
    )
  }
  const up = move > 0
  return (
    <span
      className={cn(
        'inline-flex w-6 items-center justify-center text-[11px] font-semibold tabular-nums',
        up ? 'text-success' : 'text-destructive'
      )}
      title={up ? t.moved_up(move) : t.moved_down(-move)}
    >
      {up ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
      {Math.abs(move)}
    </span>
  )
}

/**
 * Standings for round robin, a group, or Swiss. `qualify` highlights the
 * rows that advance (groups + knockout).
 */
export function StandingsTable({
  rows,
  qualify = 0,
  buchholz = false,
  caption,
}: {
  rows: StandingView[]
  qualify?: number
  buchholz?: boolean
  caption?: string
}) {
  const t = useLanguage().dict.competition.standings
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {caption ? <p className="border-b border-border bg-secondary/40 px-3 py-2 text-sm font-semibold">{caption}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>{t.entrant}</TableHead>
              <TableHead className="text-center" title={t.played}>{t.played_short}</TableHead>
              <TableHead className="text-center" title={t.wins}>{t.wins_short}</TableHead>
              <TableHead className="text-center" title={t.draws}>{t.draws_short}</TableHead>
              <TableHead className="text-center" title={t.losses}>{t.losses_short}</TableHead>
              <TableHead className="hidden text-center sm:table-cell" title={t.diff}>+/−</TableHead>
              {buchholz ? <TableHead className="hidden text-center sm:table-cell" title={t.buchholz}>{t.buchholz_short}</TableHead> : null}
              <TableHead className="text-center">{t.points}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.entrant} className={cn(row.rank <= qualify && 'bg-primary/5')}>
                <TableCell className={cn('font-medium', row.rank <= qualify && 'text-primary')}>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-5 tabular-nums">{row.rank}</span>
                    <Movement move={row.move} />
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {row.avatar ? <AvatarImage src={row.avatar} alt="" /> : null}
                      <AvatarFallback className="text-[10px]">{row.label.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{row.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.played}</TableCell>
                <TableCell className="text-center tabular-nums">{row.wins + row.byes}</TableCell>
                <TableCell className="text-center tabular-nums">{row.draws}</TableCell>
                <TableCell className="text-center tabular-nums">{row.losses}</TableCell>
                <TableCell className="hidden text-center tabular-nums sm:table-cell">
                  {row.diff > 0 ? `+${row.diff}` : row.diff}
                </TableCell>
                {buchholz ? (
                  <TableCell className="hidden text-center tabular-nums sm:table-cell">{fmt(row.buchholz)}</TableCell>
                ) : null}
                <TableCell className="text-center font-semibold tabular-nums">{fmt(row.points)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
