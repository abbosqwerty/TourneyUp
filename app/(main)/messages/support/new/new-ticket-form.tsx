'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, LifeBuoy, Loader2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTicket } from '@/lib/support-actions'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'TECHNICAL', label: 'Texnik muammo' },
  { value: 'TOURNAMENT_ISSUE', label: 'Turnir bo‘yicha savol' },
  { value: 'REPORT_BEHAVIOR', label: 'Nojo‘ya xatti-harakat haqida xabar' },
  { value: 'ACCOUNT', label: 'Akkaunt' },
  { value: 'OTHER', label: 'Boshqa' },
]

export function NewTicketForm({
  tournaments,
  preselected,
}: {
  tournaments: { id: string; title: string }[]
  preselected: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scope, setScope] = useState<'PLATFORM' | 'TOURNAMENT'>(preselected ? 'TOURNAMENT' : 'PLATFORM')
  const [tournamentId, setTournamentId] = useState(preselected ?? '')
  const [category, setCategory] = useState(preselected ? 'TOURNAMENT_ISSUE' : 'TECHNICAL')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setErrors({})
    startTransition(async () => {
      const result = await createTicket({
        scope,
        tournamentId: scope === 'TOURNAMENT' ? tournamentId : '',
        category,
        subject: String(data.get('subject') ?? ''),
        content: String(data.get('content') ?? ''),
      })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }
      toast.success('Murojaat yuborildi')
      router.push(`/messages/support/${result.data.ticketId}`)
    })
  }

  const scopeCard = (value: 'PLATFORM' | 'TOURNAMENT', Icon: typeof LifeBuoy, title: string, text: string) => (
    <button
      type="button"
      onClick={() => setScope(value)}
      aria-pressed={scope === value}
      className={cn(
        'flex flex-1 items-start gap-3 rounded-xl border p-3 text-left transition-colors',
        scope === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', scope === value ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex items-center gap-2 border-b border-border p-3 md:p-4">
        <Button variant="ghost" size="icon" asChild className="md:hidden">
          <Link href="/messages" aria-label="Orqaga">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="font-bold">Yangi murojaat</h2>
      </header>

      <form onSubmit={submit} className="mx-auto w-full max-w-xl space-y-5 p-4" noValidate>
        <div className="flex flex-col gap-2 sm:flex-row">
          {scopeCard('PLATFORM', LifeBuoy, 'TourneyUp yordami', 'Akkaunt, texnik xato, shikoyat — platforma jamoasi javob beradi.')}
          {scopeCard('TOURNAMENT', Trophy, 'Turnir bo‘yicha', 'Qoidalar, jadval, natija — shu turnirning support xodimlari javob beradi.')}
        </div>

        {scope === 'TOURNAMENT' ? (
          <div className="space-y-2">
            <Label htmlFor="ticket-tournament">Turnir</Label>
            {tournaments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                Sizda faol turnir yo‘q. Boshqa turnir haqida savol bo‘lsa, o‘sha turnir sahifasidagi “Savol berish” tugmasidan
                foydalaning.
              </p>
            ) : (
              <Select value={tournamentId} onValueChange={setTournamentId} disabled={isPending}>
                <SelectTrigger id="ticket-tournament" aria-invalid={Boolean(errors.tournamentId)}>
                  <SelectValue placeholder="Turnirni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.tournamentId ? <p className="text-xs text-destructive">{errors.tournamentId}</p> : null}
            <p className="text-xs text-muted-foreground">Turnir supporti faqat turnir davom etayotgan paytda ishlaydi.</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="ticket-category">Mavzu turi</Label>
          <Select value={category} onValueChange={setCategory} disabled={isPending}>
            <SelectTrigger id="ticket-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-subject">Qisqa mavzu</Label>
          <Input id="ticket-subject" name="subject" maxLength={140} disabled={isPending} aria-invalid={Boolean(errors.subject)} placeholder="Masalan: o‘yin vaqti noto‘g‘ri ko‘rsatilgan" />
          {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-content">Batafsil</Label>
          <Textarea id="ticket-content" name="content" rows={6} maxLength={4000} disabled={isPending} aria-invalid={Boolean(errors.content)} />
          {errors.content ? <p className="text-xs text-destructive">{errors.content}</p> : null}
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={isPending || (scope === 'TOURNAMENT' && !tournamentId)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Yuborish
          </Button>
        </div>
      </form>
    </div>
  )
}
