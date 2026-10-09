'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MatchView } from '@/lib/matches'
import { createMatch, deleteMatch, recordMatchResult, setMatchStatus } from '@/lib/match-actions'

type Participant = { id: string; label: string }

const STATUS_LABELS: Record<MatchView['status'], string> = {
  scheduled: 'Rejada',
  live: 'Jonli',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
}

const STATUS_CLASSES: Record<MatchView['status'], string> = {
  scheduled: 'bg-secondary text-secondary-foreground',
  live: 'bg-destructive text-destructive-foreground',
  completed: 'bg-success text-success-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

export function MatchesClient({
  tournamentId,
  matches,
  participants,
  isClosed,
}: {
  tournamentId: string
  matches: MatchView[]
  participants: Participant[]
  isClosed: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')

  const addMatch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setErrors({})

    startTransition(async () => {
      const result = await createMatch({
        tournamentId,
        stage: String(data.get('stage') ?? ''),
        scheduledAt: String(data.get('scheduledAt') ?? ''),
        homeParticipantId: home,
        awayParticipantId: away,
      })

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success('O‘yin qo‘shildi')
      form.reset()
      setHome('')
      setAway('')
      router.refresh()
    })
  }

  const run = (label: string, action: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        toast.error(result.error ?? 'Xatolik')
        return
      }
      toast.success(label)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {isClosed ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            Turnir yopilgan — yangi o‘yin qo‘shib bo‘lmaydi, lekin kiritilgan natijalar saqlanadi.
          </CardContent>
        </Card>
      ) : participants.length < 2 ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            O‘yin qo‘shish uchun kamida ikki ishtirokchi tasdiqlangan bo‘lishi kerak.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yangi o‘yin</CardTitle>
            <CardDescription>Faqat tasdiqlangan ishtirokchilar tanlanadi</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMatch} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="home">Birinchi tomon</Label>
                  <Select value={home} onValueChange={setHome}>
                    <SelectTrigger id="home">
                      <SelectValue placeholder="Tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.homeParticipantId ? (
                    <p className="text-xs text-destructive">{errors.homeParticipantId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="away">Ikkinchi tomon</Label>
                  <Select value={away} onValueChange={setAway}>
                    <SelectTrigger id="away">
                      <SelectValue placeholder="Tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants
                        .filter((participant) => participant.id !== home)
                        .map((participant) => (
                          <SelectItem key={participant.id} value={participant.id}>
                            {participant.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.awayParticipantId ? (
                    <p className="text-xs text-destructive">{errors.awayParticipantId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Bosqich</Label>
                  <Input id="stage" name="stage" placeholder="Masalan: Chorak final" disabled={isPending} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Vaqti</Label>
                  <Input id="scheduledAt" name="scheduledAt" type="datetime-local" disabled={isPending} />
                </div>
              </div>

              <Button type="submit" className="gap-2" disabled={isPending || !home || !away}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
                O‘yin qo‘shish
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O‘yinlar ({matches.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Hali o‘yin qo‘shilmagan.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {matches.map((match) => (
                <li key={match.id} className="space-y-3 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {match.home.label} <span className="text-muted-foreground">vs</span>{' '}
                        {match.away.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          match.stage,
                          match.scheduledAt
                            ? new Date(match.scheduledAt).toLocaleString('uz-UZ', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'vaqti belgilanmagan',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Badge className={STATUS_CLASSES[match.status]}>
                      {STATUS_LABELS[match.status]}
                    </Badge>
                  </div>

                  <ScoreForm
                    match={match}
                    disabled={isPending}
                    onSaved={() => router.refresh()}
                  />

                  <div className="flex flex-wrap gap-2">
                    {match.status !== 'live' && match.status !== 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run('O‘yin jonli', () => setMatchStatus({ matchId: match.id, status: 'live' }))
                        }
                      >
                        Jonli deb belgilash
                      </Button>
                    ) : null}
                    {match.status !== 'cancelled' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run('O‘yin bekor qilindi', () =>
                            setMatchStatus({ matchId: match.id, status: 'cancelled' })
                          )
                        }
                      >
                        Bekor qilish
                      </Button>
                    ) : null}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive"
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          O‘chirish
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>O‘yinni o‘chirish</AlertDialogTitle>
                          <AlertDialogDescription>
                            {match.home.label} — {match.away.label}. Kiritilgan natija ham o‘chadi
                            va reyting qayta hisoblanadi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => run('O‘yin o‘chirildi', () => deleteMatch(match.id))}
                          >
                            O‘chirish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ScoreForm({
  match,
  disabled,
  onSaved,
}: {
  match: MatchView
  disabled: boolean
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await recordMatchResult({
        matchId: match.id,
        homeScore: String(data.get('homeScore') ?? ''),
        awayScore: String(data.get('awayScore') ?? ''),
        notes: String(data.get('notes') ?? ''),
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success('Natija saqlandi')
      onSaved()
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor={`home-${match.id}`} className="text-xs">
          {match.home.label}
        </Label>
        <Input
          id={`home-${match.id}`}
          name="homeScore"
          type="number"
          min={0}
          max={999}
          className="w-20"
          defaultValue={match.home.score ?? ''}
          disabled={disabled || isPending}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`away-${match.id}`} className="text-xs">
          {match.away.label}
        </Label>
        <Input
          id={`away-${match.id}`}
          name="awayScore"
          type="number"
          min={0}
          max={999}
          className="w-20"
          defaultValue={match.away.score ?? ''}
          disabled={disabled || isPending}
          required
        />
      </div>
      <div className="min-w-40 flex-1 space-y-1">
        <Label htmlFor={`notes-${match.id}`} className="text-xs">
          Izoh
        </Label>
        <Input
          id={`notes-${match.id}`}
          name="notes"
          maxLength={500}
          defaultValue={match.notes ?? ''}
          disabled={disabled || isPending}
        />
      </div>
      <Button type="submit" size="sm" className="gap-2" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Natijani saqlash
      </Button>
    </form>
  )
}
