'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { CalendarClock, CircleDot, Loader2, Pencil, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Pager } from '@/components/pager'
import { cn } from '@/lib/utils'
import type { MatchView } from '@/lib/matches'
import { recordMatchResult, setMatchStatus } from '@/lib/match-actions'
import { RESULTS_TAB_LABELS, type ResultsTab } from '@/lib/results'

export default function ResultsClient({
  tab,
  tournamentId,
  page,
  pageSize,
  matches,
  totalCount,
  counts,
  tournaments,
  scorableTournamentIds,
  currentUserId,
}: {
  tab: ResultsTab
  tournamentId: string | null
  page: number
  pageSize: number
  matches: MatchView[]
  totalCount: number
  counts: { live: number; scheduled: number; completed: number }
  tournaments: { id: string; title: string; sport: string }[]
  /** Tournaments this account may score — computed on the server. */
  scorableTournamentIds: string[]
  currentUserId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<MatchView | null>(null)

  const scorable = useMemo(() => new Set(scorableTournamentIds), [scorableTournamentIds])
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  const hrefFor = (next: { tab?: ResultsTab; tournament?: string | null; page?: number }) => {
    const params = new URLSearchParams()
    const resolvedTab = next.tab ?? tab
    if (resolvedTab !== 'live') params.set('tab', resolvedTab)
    const resolvedTournament = next.tournament === undefined ? tournamentId : next.tournament
    if (resolvedTournament) params.set('tournament', resolvedTournament)
    const resolvedPage = next.page ?? 1
    if (resolvedPage > 1) params.set('page', String(resolvedPage))
    const query = params.toString()
    return `${pathname}${query ? `?${query}` : ''}`
  }

  const groups = useMemo(() => {
    const map = new Map<string, { title: string; sport: string; items: MatchView[] }>()
    for (const match of matches) {
      const existing = map.get(match.tournamentId)
      if (existing) {
        existing.items.push(match)
      } else {
        map.set(match.tournamentId, {
          title: match.tournamentTitle,
          sport: match.sport,
          items: [match],
        })
      }
    }
    return [...map.entries()]
  }, [matches])

  const goLive = (match: MatchView) => {
    startTransition(async () => {
      const result = await setMatchStatus({ matchId: match.id, status: 'live' })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('O‘yin jonli deb belgilandi')
      router.refresh()
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Natijalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tashkilotchilar kiritgan hisoblar — jonli, jadval va yakunlangan o‘yinlar.
          </p>
        </div>

        {tournaments.length > 0 ? (
          <Select
            value={tournamentId ?? 'all'}
            onValueChange={(value) =>
              startTransition(() =>
                router.replace(hrefFor({ tournament: value === 'all' ? null : value, page: 1 }))
              )
            }
          >
            <SelectTrigger className="w-full sm:w-64" aria-label="Turnir bo‘yicha filtr">
              <SelectValue placeholder="Barcha turnirlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha turnirlar</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <nav className="mb-6 flex gap-1 rounded-lg border border-border bg-secondary/40 p-1" aria-label="Natija turlari">
        {(Object.keys(RESULTS_TAB_LABELS) as ResultsTab[]).map((key) => (
          <Button
            key={key}
            asChild
            size="sm"
            variant={key === tab ? 'default' : 'ghost'}
            className="flex-1 gap-2"
          >
            <Link href={hrefFor({ tab: key, page: 1 })} aria-current={key === tab ? 'page' : undefined}>
              {key === 'live' && counts.live > 0 ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" aria-hidden />
              ) : null}
              {RESULTS_TAB_LABELS[key]}
              <span className="text-xs opacity-70">{counts[key]}</span>
            </Link>
          </Button>
        ))}
      </nav>

      {isPending ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Yuklanmoqda...
        </p>
      ) : null}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {tab === 'live'
                ? 'Hozir jonli o‘yin yo‘q.'
                : tab === 'scheduled'
                  ? 'Rejalashtirilgan o‘yin yo‘q.'
                  : 'Hali yakunlangan o‘yin yo‘q.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([id, group]) => (
            <section key={id}>
              <header className="mb-2 flex items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2">
                <div className="min-w-0">
                  <Link href={`/tournament/${id}`} className="truncate font-semibold hover:underline">
                    {group.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{group.sport}</p>
                </div>
                {scorable.has(id) ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/tournaments/${id}/matches`}>O‘yinlarni boshqarish</Link>
                  </Button>
                ) : null}
              </header>

              <ul className="divide-y divide-border rounded-lg border border-border">
                {group.items.map((match) => (
                  <li key={match.id}>
                    <MatchRow
                      match={match}
                      currentUserId={currentUserId}
                      canScore={scorable.has(match.tournamentId)}
                      onEdit={() => setEditing(match)}
                      onGoLive={() => goLive(match)}
                      disabled={isPending}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <Pager page={page} pageCount={pageCount} hrefFor={(next) => hrefFor({ page: next })} />
        </div>
      )}

      <ScoreDialog
        match={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          router.refresh()
        }}
      />
    </div>
  )
}

function MatchRow({
  match,
  currentUserId,
  canScore,
  onEdit,
  onGoLive,
  disabled,
}: {
  match: MatchView
  currentUserId: string | null
  canScore: boolean
  onEdit: () => void
  onGoLive: () => void
  disabled: boolean
}) {
  const decided = match.home.score !== null && match.away.score !== null
  const homeWon = decided && (match.home.score ?? 0) > (match.away.score ?? 0)
  const awayWon = decided && (match.away.score ?? 0) > (match.home.score ?? 0)

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="w-20 shrink-0 text-xs text-muted-foreground">
        {match.status === 'live' ? (
          <Badge className="gap-1 bg-destructive/15 text-destructive">
            <CircleDot className="h-3 w-3 animate-pulse" aria-hidden />
            Jonli
          </Badge>
        ) : match.scheduledAt ? (
          <time dateTime={match.scheduledAt}>
            {new Date(match.scheduledAt).toLocaleString('uz-UZ', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        ) : (
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" aria-hidden />
            Belgilanmagan
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <Side side={match.home} highlight={homeWon} isMe={match.home.userId === currentUserId} />
        <Side side={match.away} highlight={awayWon} isMe={match.away.userId === currentUserId} />
        {match.stage ? <p className="text-xs text-muted-foreground">{match.stage}</p> : null}
      </div>

      {canScore ? (
        <div className="flex shrink-0 gap-1">
          {match.status === 'scheduled' ? (
            <Button variant="ghost" size="sm" onClick={onGoLive} disabled={disabled}>
              Boshlash
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            disabled={disabled}
            aria-label="Hisobni kiritish"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function Side({
  side,
  highlight,
  isMe,
}: {
  side: MatchView['home']
  highlight: boolean
  isMe: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={side.avatar ?? undefined} alt={`${side.label} avatari`} />
        <AvatarFallback className="text-[10px]">{side.label.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className={cn('min-w-0 flex-1 truncate text-sm', highlight && 'font-semibold')}>
        {side.label}
        {isMe ? <span className="ml-1 text-xs text-primary">(siz)</span> : null}
      </span>
      <span className={cn('w-8 shrink-0 text-right text-sm tabular-nums', highlight && 'font-bold')}>
        {side.score ?? '–'}
      </span>
    </div>
  )
}

function ScoreDialog({
  match,
  onClose,
  onSaved,
}: {
  match: MatchView | null
  onClose: () => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!match) return null

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setErrors({})

    startTransition(async () => {
      const result = await recordMatchResult({
        matchId: match.id,
        homeScore: String(form.get('homeScore') ?? ''),
        awayScore: String(form.get('awayScore') ?? ''),
        notes: String(form.get('notes') ?? ''),
      })

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success('Natija saqlandi')
      onSaved()
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hisobni kiritish</DialogTitle>
          <DialogDescription>
            {match.home.label} — {match.away.label}. Saqlangach o‘yin yakunlangan deb belgilanadi va reytingga ta‘sir qiladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homeScore">{match.home.label}</Label>
              <Input
                id="homeScore"
                name="homeScore"
                type="number"
                min={0}
                max={999}
                defaultValue={match.home.score ?? 0}
                disabled={isPending}
                required
              />
              {errors.homeScore ? <p className="text-xs text-destructive">{errors.homeScore}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="awayScore">{match.away.label}</Label>
              <Input
                id="awayScore"
                name="awayScore"
                type="number"
                min={0}
                max={999}
                defaultValue={match.away.score ?? 0}
                disabled={isPending}
                required
              />
              {errors.awayScore ? <p className="text-xs text-destructive">{errors.awayScore}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              defaultValue={match.notes ?? ''}
              disabled={isPending}
              placeholder="Masalan: penaltilar seriyasida yakunlandi"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Bekor qilish
            </Button>
            <Button type="submit" className="gap-2" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
