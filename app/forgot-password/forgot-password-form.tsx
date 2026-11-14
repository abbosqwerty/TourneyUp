'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { completePasswordReset, requestPasswordReset } from '@/lib/auth-actions'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const { dict } = useLanguage()
  const t = dict.account.forgot_password
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const requestCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('email') ?? '').trim().toLowerCase()
    setErrors({}); setFormError(null)
    startTransition(async () => {
      const result = await requestPasswordReset({ email: value })
      if (!result.ok) {
        setFormError(result.error); setErrors(result.fieldErrors ?? {}); toast.error(result.error); return
      }
      setEmail(result.data.email)
      toast.success(t.generic_sent)
    })
  }

  const resetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email) return
    const form = new FormData(event.currentTarget)
    setErrors({}); setFormError(null)
    startTransition(async () => {
      const result = await completePasswordReset({
        email,
        code: String(form.get('code') ?? ''),
        newPassword: String(form.get('newPassword') ?? ''),
        confirmPassword: String(form.get('confirmPassword') ?? ''),
      })
      if (!result.ok) {
        setFormError(result.error); setErrors(result.fieldErrors ?? {}); toast.error(result.error); return
      }
      sessionStorage.setItem('tourneyup_password_reset', t.changed)
      window.location.href = result.data.redirectTo
    })
  }

  return (
    <Card className="border-border bg-card/80 shadow-lg backdrop-blur-md">
      <CardContent className="pt-6">
        {!email ? (
          <form onSubmit={requestCode} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t.email}</Label>
              <Input id="reset-email" name="email" type="email" autoComplete="email" placeholder="email@example.com" disabled={isPending} required />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
            {formError ? <ErrorBox text={formError} /> : null}
            <Button type="submit" className="w-full gap-2" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {isPending ? t.sending : t.send_code}
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4" noValidate>
            <div className="text-center"><h2 className="font-semibold">{t.code_title}</h2><p className="mt-1 text-sm text-muted-foreground">{t.code_description(email)}</p></div>
            <Field label={t.code} name="code" error={errors.code} inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, placeholder: '000000' }} disabled={isPending} />
            <Field label={t.new_password} name="newPassword" error={errors.newPassword} inputProps={{ type: 'password', autoComplete: 'new-password', placeholder: '••••••••' }} disabled={isPending} />
            <Field label={t.confirm_password} name="confirmPassword" error={errors.confirmPassword} inputProps={{ type: 'password', autoComplete: 'new-password', placeholder: '••••••••' }} disabled={isPending} />
            {formError ? <ErrorBox text={formError} /> : null}
            <Button type="submit" className="w-full gap-2" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isPending ? t.resetting : t.reset}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ErrorBox({ text }: { text: string }) {
  return <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{text}</div>
}

function Field({ label, name, error, inputProps, disabled }: { label: string; name: string; error?: string; inputProps: React.ComponentProps<typeof Input>; disabled: boolean }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} disabled={disabled} required {...inputProps} />{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>
}
