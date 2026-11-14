'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteTournament } from '@/lib/actions'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
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

export function DeleteTournamentButton({
  tournamentId,
  tournamentTitle,
}: {
  tournamentId: string
  tournamentTitle: string
}) {
  const router = useRouter()
  const { dict } = useLanguage()
  const t = dict.dashboard.delete_tournament
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      const result = await deleteTournament(tournamentId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      toast.success(t.success)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {t.button}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>{t.description(tournamentTitle)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{dict.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              remove()
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {t.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
