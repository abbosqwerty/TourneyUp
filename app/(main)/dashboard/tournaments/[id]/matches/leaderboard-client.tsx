'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatScore, parseTime, type ScoreKind } from '@/lib/competition/leaderboard'
import { recordLeaderboardResults } from '@/lib/match-actions'

export type LeaderboardEditorRow = {
  participantId: string
  label: string
  /** Per round: the stored value, 'DNF', or null while pending. */
  rounds: (number | 'DNF' | null)[]
}

type Draft = { text: string; dnf: boolean }

/**
 * Result entry for LEADERBOARD tournaments: pick a round, type every
 * entrant's points or time, save the whole round at once.
 */
export function LeaderboardClient({
  tournamentId,
  rows,
  rounds,
  kind,
  finalized,
  isClosed,
}: {
  tournamentId: string
  rows: LeaderboardEditorRow[]
  rounds: number
  kind: ScoreKind
  finalized: boolean
  isClosed: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const firstOpen = Array.from({ length: rounds }, (_, i) => i).find((i) => rows.some((r) => r.rounds[i] === null))
  const [round, setRound] = useState((firstOpen ?? rounds - 1) + 1)
  const [reason, setReason] = useState('')

  const initial = useMemo(
    () =>
      new Map<string, Draft>(
        rows.map((r) => {
          const cell = r.rounds[round - 1]
          return [
            r.participantId,
            cell === 'DNF' ? { text: '', dnf: true } : { text: cell === null ? '' : formatScore(kind, cell), dnf: false },
          ]
        })
      ),
    [rows, round, kind]
  )
  const [drafts, setDrafts] = useState(initial)
  const [draftRound, setDraftRound] = useState(round)
  if (draftRound !== round) {
    // Switching rounds loads that round's stored values.
    setDraftRound(round)
    setDrafts(initial)
  }

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => new Map(prev).set(id, { ...prev.get(id)!, ...patch }))

  const parse = (draft: Draft): number | null | 'invalid' => {
    if (draft.dnf || draft.text.trim() === '') return null
    if (kind === 'time') return parseTime(draft.text) ?? 'invalid'
    const n = Number(draft.text.trim())
    return Number.isInteger(n) && n >= 0 && n <= 1_000_000 ? n : 'invalid'
  }

  const invalid = rows.filter((r) => parse(drafts.get(r.participantId)!) === 'invalid')
  const filled = rows.filter((r) => {
    const d = drafts.get(r.participantId)!
    return d.dnf || d.text.trim() !== ''
  }).length

  const save = () => {
    if (invalid.length > 0) {
      toast.error(`Noto‘g‘ri qiymat: ${invalid.map((r) => r.label).join(', ')}`)
      return
    }
    startTransition(async () => {
      const result = await recordLeaderboardResults({
        tournamentId,
        round,
        results: rows.map((r) => {
          const d = drafts.get(r.participantId)!
          const value = parse(d)
          return { participantId: r.participantId, value: value === 'invalid' ? null : value, dnf: d.dnf }
        }),
        reason: finalized ? reason : '',
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`${round}-bosqich saqlandi — reyting yangilandi`)
      setReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-1" aria-label="Bosqichlar">
        {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => {
          const done = rows.every((row) => row.rounds[r - 1] !== null)
          return (
            <Button
              key={r}
              size="sm"
              variant={r === round ? 'default' : 'ghost'}
              className="flex-1 whitespace-nowrap"
              onClick={() => setRound(r)}
              aria-pressed={r === round}
            >
              {r}-bosqich
              {done ? <span className="ml-1 text-xs opacity-70">✓</span> : null}
            </Button>
          )
        })}
      </nav>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            {kind === 'time'
              ? 'Vaqtni “soat:daqiqa:soniya.yuzdan” ko‘rinishida kiriting, masalan 2:31:07.50 yoki 58.32.'
              : 'Har bir ishtirokchi shu bosqichda olgan ochkoni kiriting.'}{' '}
            Masofani yakunlamagan / kelmaganlarga <b>DNF</b> belgilang. Bo‘sh qoldirilganlar keyin kiritiladi.
          </p>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((r) => {
              const d = drafts.get(r.participantId)!
              const bad = parse(d) === 'invalid'
              return (
                <li key={r.participantId} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{r.label}</span>
                  <Input
                    value={d.dnf ? '' : d.text}
                    onChange={(e) => update(r.participantId, { text: e.target.value })}
                    disabled={d.dnf || isClosed || isPending}
                    inputMode={kind === 'time' ? 'text' : 'numeric'}
                    placeholder={kind === 'time' ? '0:00.00' : '0'}
                    aria-label={`${r.label} — ${kind === 'time' ? 'vaqt' : 'ochko'}`}
                    aria-invalid={bad}
                    className={cn('w-32 text-right tabular-nums', bad && 'border-destructive')}
                  />
                  <Label className="flex shrink-0 items-center gap-1.5 text-xs">
                    <Checkbox
                      checked={d.dnf}
                      onCheckedChange={(v) => update(r.participantId, { dnf: v === true })}
                      disabled={isClosed || isPending}
                    />
                    DNF
                  </Label>
                </li>
              )
            })}
          </ul>

          {finalized ? (
            <div className="space-y-1">
              <Label htmlFor="lb-reason">Tuzatish sababi</Label>
              <Input
                id="lb-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Turnir yakunlangan — o‘zgartirish sababini yozing"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {filled}/{rows.length} kiritildi
            </span>
            <Button onClick={save} disabled={isClosed || isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {round}-bosqichni saqlash
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
