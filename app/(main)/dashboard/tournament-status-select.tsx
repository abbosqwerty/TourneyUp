'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { setTournamentStatus } from '@/lib/actions'
import { useLanguage } from '@/lib/i18n/language-context'

type Status = 'upcoming' | 'registration_open' | 'ongoing' | 'completed' | 'cancelled'

const OPTIONS: Status[] = ['upcoming', 'registration_open', 'ongoing', 'completed', 'cancelled']

const CLOSING: Status[] = ['completed', 'cancelled']
const CONFIRM: Status[] = ['ongoing', ...CLOSING]

/**
 * Which statuses the organizer may pick from here. The server enforces the
 * same rules; this only hides the choices that would be refused. Once the
 * draw exists, `completed` is set automatically by the last result.
 */
function allowedOptions(current: Status, drawn: boolean) {
  return OPTIONS.filter((option) => {
    if (option === current) return true
    if (current === 'cancelled') return false
    if (current === 'completed') return option === 'cancelled'
    if (drawn) return option === 'cancelled'
    return option !== 'completed'
  })
}

/**
 * Status control with a confirmation step on the transitions that cannot be
 * undone: starting (writes the draw) and closing (revokes staff grants).
 */
export function TournamentStatusSelect({
  tournamentId,
  status,
  drawn = false,
}: {
  tournamentId: string
  status: Status
  drawn?: boolean
}) {
  const router = useRouter()
  const { dict } = useLanguage()
  const t = dict.dashboard.status_select
  const [isPending, startTransition] = useTransition()
  const [current, setCurrent] = useState<Status>(status)
  const [confirming, setConfirming] = useState<Status | null>(null)

  const apply = (next: Status) => {
    const previous = current
    setCurrent(next)

    startTransition(async () => {
      const result = await setTournamentStatus({ tournamentId, status: next })
      if (!result.ok) {
        setCurrent(previous)
        toast.error(result.error)
        return
      }
      toast.success(
        next === 'ongoing'
          ? t.toast_started
          : CLOSING.includes(next)
            ? t.toast_closed
            : t.toast_updated
      )
      router.refresh()
    })
  }

  return (
    <>
      <Select
        value={current}
        disabled={isPending}
        onValueChange={(value) => {
          const next = value as Status
          if (next === current) return
          if (CONFIRM.includes(next)) {
            setConfirming(next)
            return
          }
          apply(next)
        }}
      >
        <SelectTrigger size="sm" className="w-[170px]" aria-label={t.aria}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedOptions(current, drawn).map((option) => (
            <SelectItem key={option} value={option}>
              {dict.status[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming === 'ongoing'
                ? t.title_start
                : confirming === 'cancelled'
                  ? t.title_cancel
                  : t.title_complete}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming === 'ongoing'
                ? t.desc_start
                : confirming === 'cancelled'
                  ? t.desc_cancel
                  : t.desc_complete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const next = confirming
                setConfirming(null)
                if (next) apply(next)
              }}
            >
              {t.continue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
