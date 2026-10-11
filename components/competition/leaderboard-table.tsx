import { Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatScore, formatTime, type ScoreKind } from '@/lib/competition/leaderboard'
import type { LeaderboardView } from '@/lib/competition/view'
import { Movement } from './standings-table'

const MEDAL = ['', 'text-yellow-500', 'text-slate-400', 'text-amber-700']

/**
 * Running table of a LEADERBOARD tournament: one column per round, the
 * total, and how many places each entrant moved since the previous round.
 */
export function LeaderboardTable({
  rows,
  rounds,
  kind,
  caption,
}: {
  rows: LeaderboardView[]
  rounds: number
  kind: ScoreKind
  caption?: string
}) {
  const leaderTotal = rows[0] && rows[0].recorded > rows[0].dnf ? rows[0].total : null
  // Gap to the leader only makes sense for times over the same rounds.
  const showGap = kind === 'time' && leaderTotal !== null

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {caption ? <p className="border-b border-border bg-secondary/40 px-3 py-2 text-sm font-semibold">{caption}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Ishtirokchi</TableHead>
              {rounds > 1
                ? Array.from({ length: rounds }, (_, i) => (
                    <TableHead key={i} className="hidden text-center md:table-cell" title={`${i + 1}-bosqich`}>
                      B{i + 1}
                    </TableHead>
                  ))
                : null}
              <TableHead className="text-right">{kind === 'time' ? 'Vaqt' : 'Ochko'}</TableHead>
              {showGap ? <TableHead className="hidden text-right sm:table-cell">Farq</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const finished = row.recorded > row.dnf
              const sameRounds = row.recorded === rows[0]?.recorded && row.dnf === 0 && rows[0]?.dnf === 0
              return (
                <TableRow key={row.entrant} className={cn(row.rank <= 3 && finished && 'bg-primary/5')}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1">
                      {row.rank <= 3 && finished ? (
                        <Medal className={cn('h-4 w-4', MEDAL[row.rank])} aria-label={`${row.rank}-o‘rin`} />
                      ) : (
                        <span className="w-5 tabular-nums">{row.rank}</span>
                      )}
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
                  {rounds > 1
                    ? row.rounds.map((cell, i) => (
                        <TableCell key={i} className="hidden text-center text-sm tabular-nums text-muted-foreground md:table-cell">
                          {cell === null ? '·' : cell === 'DNF' ? <span className="text-destructive">DNF</span> : formatScore(kind, cell)}
                        </TableCell>
                      ))
                    : null}
                  <TableCell className="text-right font-semibold tabular-nums">
                    {row.recorded === 0 ? (
                      <span className="font-normal text-muted-foreground">—</span>
                    ) : !finished || (kind === 'time' && row.dnf > 0) ? (
                      <span className="text-destructive">DNF</span>
                    ) : (
                      formatScore(kind, row.total)
                    )}
                  </TableCell>
                  {showGap ? (
                    <TableCell className="hidden text-right text-sm tabular-nums text-muted-foreground sm:table-cell">
                      {row.rank === 1 || !sameRounds || leaderTotal === null ? '' : `+${formatTime(row.total - leaderTotal)}`}
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
