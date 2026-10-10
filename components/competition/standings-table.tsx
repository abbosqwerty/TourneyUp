import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { StandingView } from '@/lib/competition/view'

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

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
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {caption ? <p className="border-b border-border bg-secondary/40 px-3 py-2 text-sm font-semibold">{caption}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Ishtirokchi</TableHead>
              <TableHead className="text-center" title="O‘yinlar">O‘</TableHead>
              <TableHead className="text-center" title="G‘alaba">G‘</TableHead>
              <TableHead className="text-center" title="Durang">D</TableHead>
              <TableHead className="text-center" title="Mag‘lubiyat">M</TableHead>
              <TableHead className="hidden text-center sm:table-cell" title="Hisob farqi">+/−</TableHead>
              {buchholz ? <TableHead className="hidden text-center sm:table-cell" title="Buchholz">Bh</TableHead> : null}
              <TableHead className="text-center">Ochko</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.entrant} className={cn(row.rank <= qualify && 'bg-primary/5')}>
                <TableCell className={cn('font-medium', row.rank <= qualify && 'text-primary')}>{row.rank}</TableCell>
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
