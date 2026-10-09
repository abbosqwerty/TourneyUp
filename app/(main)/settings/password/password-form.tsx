'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/lib/auth-actions'

export function PasswordForm({
  mustChange,
  role,
}: {
  mustChange: boolean
  role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      currentPassword: String(form.get('currentPassword') ?? ''),
      newPassword: String(form.get('newPassword') ?? ''),
      confirmPassword: String(form.get('confirmPassword') ?? ''),
    }

    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await changePassword(payload)
      if (!result.ok) {
        setFormError(result.error)
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success('Parol almashtirildi')
      // First-login flows land on the panel that matches the account type.
      router.replace(mustChange ? (role === 'ORGANIZATION' ? '/dashboard' : '/feed') : '/settings')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Hozirgi parol</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          disabled={isPending}
          required
        />
        {errors.currentPassword ? <p className="text-xs text-destructive">{errors.currentPassword}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Yangi parol</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Kamida 8 belgi"
          disabled={isPending}
          required
        />
        {errors.newPassword ? <p className="text-xs text-destructive">{errors.newPassword}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Yangi parolni takrorlang</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          required
        />
        {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword}</p> : null}
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Parolni saqlash
      </Button>
    </form>
  )
}
