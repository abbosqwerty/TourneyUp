'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/lib/auth-actions'
import { useLanguage } from '@/lib/i18n/language-context'

const CONFIRM_WORD = 'O‘CHIRISH'

export function DeleteAccountDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()
  const { dict } = useLanguage()
  const t = dict.account.delete_account

  const submit = () => {
    startTransition(async () => {
      const result = await deleteAccount({ password, confirm })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t.deleted)
      setOpen(false)
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" aria-hidden />
          {t.button}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-password">{t.password}</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              <span>
                {t.confirm_prefix} <span className="font-mono">{CONFIRM_WORD}</span>
                {t.confirm_suffix ? ` ${t.confirm_suffix}` : ''}
              </span>
            </Label>
            <Input
              id="delete-confirm"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{dict.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              submit()
            }}
            disabled={isPending || confirm !== CONFIRM_WORD || password.length === 0}
            className="gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {t.confirm_button}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
