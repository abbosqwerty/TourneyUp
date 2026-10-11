'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { History, Loader2, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MatchCard, MATCH_STATUS_CLASSES, sideName } from '@/components/competition/match-card'
import { stageLabel } from '@/lib/competition/labels'
import { ScheduleControl } from '@/app/(main)/results/[id]/schedule-control'
import type { MatchView } from '@/lib/matches'
import { recordMatchResult, setMatchStatus } from '@/lib/match-actions'
import { useLanguage } from '@/lib/i18n/language-context'

type Filter = 'todo' | 'waiting' | 'done'

const FILTERS: Filter[] = ['todo', 'waiting', 'done']

/**
 * Result entry. Matches come from the draw; the organizer only confirms
 * scores (or a no-show), sets times, and — with a stated reason — corrects
 * a finalized result while the next round has not been played.
 */
export function MatchesClient({ matches, isClosed }: { matches: MatchView[]; isClosed: boolean }) {
  const [filter, setFilter] = useState<Filter>('todo')
  const { dict } = useLanguage()
  const t = dict.dashboard.matches

  const buckets = useMemo(() => {
    const ready = (m: MatchView) => m.home.participantId && m.away.participantId
    return {
      todo: matches.filter((m) => !m.finalizedAt && m.status !== 'cancelled' && ready(m)),
      waiting: matches.filter((m) => !m.finalizedAt && m.status !== 'cancelled' && !ready(m)),
      done: matches.filter((m) => m.finalizedAt),
    }
  }, [matches])

  const shown = buckets[filter]

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-1" aria-label={t.filter_aria}>
        {FILTERS.map((key) => (
          <Button
            key={key}
            size="sm"
            variant={key === filter ? 'default' : 'ghost'}
            className="flex-1 whitespace-nowrap"
            onClick={() => setFilter(key)}
            aria-pressed={key === filter}
          >
            {t.filters[key]}
            <span className="ml-1 text-xs opacity-70">{buckets[key].length}</span>
          </Button>
        ))}
      </nav>

      {shown.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {filter === 'todo'
              ? t.empty_todo
              : filter === 'waiting'
                ? t.empty_waiting
                : t.empty_done}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((match) => (
            <li key={match.id}>
              <MatchEditor match={match} disabled={isClosed} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MatchEditor({ match, disabled }: { match: MatchView; disabled: boolean }) {
  const router = useRouter()
  const { dict } = useLanguage()
  const t = dict.dashboard.matches
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [forfeit, setForfeit] = useState<'' | 'HOME' | 'AWAY'>('')
  const [correcting, setCorrecting] = useState(false)

  const ready = Boolean(match.home.participantId && match.away.participantId)
  const finalized = Boolean(match.finalizedAt)
  const editable = ready && !disabled && (!finalized || correcting)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setErrors({})

    startTransition(async () => {
      const result = await recordMatchResult({
        matchId: match.id,
        homeScore: forfeit ? '' : String(data.get('homeScore') ?? ''),
        awayScore: forfeit ? '' : String(data.get('awayScore') ?? ''),
        forfeit,
        notes: String(data.get('notes') ?? ''),
        reason: String(data.get('reason') ?? ''),
      })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }
      toast.success(finalized ? t.toast_corrected : t.toast_confirmed)
      setCorrecting(false)
      router.refresh()
    })
  }

  const goLive = () =>
    startTransition(async () => {
      const result = await setMatchStatus({ matchId: match.id, status: match.status === 'live' ? 'scheduled' : 'live' })
      if (!result.ok) return void toast.error(result.error)
      router.refresh()
    })

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{stageLabel(dict, match.stage)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={MATCH_STATUS_CLASSES[match.status]}>
              {match.resultType === 'FORFEIT' ? t.forfeit : dict.competition.match.status[match.status]}
            </Badge>
            {!finalized && ready && !disabled ? (
              <>
                <ScheduleControl matchId={match.id} scheduledAt={match.scheduledAt} />
                <Button variant="ghost" size="sm" className="gap-1" onClick={goLive} disabled={isPending}>
                  <Radio className="h-4 w-4" aria-hidden />
                  {match.status === 'live' ? t.not_live : t.live}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <MatchCard match={match} />

        {!ready ? (
          <p className="text-xs text-muted-foreground">{t.opponent_pending}</p>
        ) : null}

        {finalized && !correcting && !disabled ? (
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setCorrecting(true)}>
            <History className="h-4 w-4" aria-hidden />
            {t.correct_result}
          </Button>
        ) : null}

        {editable ? (
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-border p-3" noValidate>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor={`home-${match.id}`} className="text-xs">
                  {sideName(match, match.home, dict)}
                </Label>
                <Input
                  id={`home-${match.id}`}
                  name="homeScore"
                  type="number"
                  min={0}
                  max={999}
                  className="w-20"
                  defaultValue={match.home.score ?? ''}
                  disabled={isPending || Boolean(forfeit)}
                  aria-invalid={Boolean(errors.homeScore)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`away-${match.id}`} className="text-xs">
                  {sideName(match, match.away, dict)}
                </Label>
                <Input
                  id={`away-${match.id}`}
                  name="awayScore"
                  type="number"
                  min={0}
                  max={999}
                  className="w-20"
                  defaultValue={match.away.score ?? ''}
                  disabled={isPending || Boolean(forfeit)}
                  aria-invalid={Boolean(errors.awayScore)}
                />
              </div>
              <div className="min-w-44 flex-1 space-y-1">
                <Label className="text-xs">{t.absent_side}</Label>
                <Select value={forfeit || 'none'} onValueChange={(v) => setForfeit(v === 'none' ? '' : (v as 'HOME' | 'AWAY'))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.both_played}</SelectItem>
                    <SelectItem value="HOME">{t.side_absent(sideName(match, match.home, dict))}</SelectItem>
                    <SelectItem value="AWAY">{t.side_absent(sideName(match, match.away, dict))}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {forfeit ? (
              <p className="text-xs text-muted-foreground">
                {t.forfeit_hint}
              </p>
            ) : null}

            <div className="space-y-1">
              <Label htmlFor={`notes-${match.id}`} className="text-xs">
                {t.notes_optional}
              </Label>
              <Input id={`notes-${match.id}`} name="notes" maxLength={500} defaultValue={match.notes ?? ''} disabled={isPending} />
            </div>

            {finalized ? (
              <div className="space-y-1">
                <Label htmlFor={`reason-${match.id}`} className="text-xs">
                  {t.reason_required}
                </Label>
                <Input id={`reason-${match.id}`} name="reason" maxLength={500} required disabled={isPending} />
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              {correcting ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setCorrecting(false)} disabled={isPending}>
                  {t.cancel}
                </Button>
              ) : null}
              <Button type="submit" size="sm" className="gap-2" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {finalized ? t.save_correction : t.confirm_result}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
