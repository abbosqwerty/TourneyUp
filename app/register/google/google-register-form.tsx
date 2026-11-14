'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { completeGoogleRegistration } from '@/lib/auth-actions'
import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function GoogleRegisterForm({
  email,
  defaultName,
  defaultUsername,
}: {
  email: string
  defaultName: string
  defaultUsername: string
}) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const { dict } = useLanguage()
  const t = dict.account.register

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await completeGoogleRegistration({
        name: String(form.get('name') ?? ''),
        username: String(form.get('username') ?? '').toLowerCase(),
        password: String(form.get('password') ?? ''),
        confirmPassword: String(form.get('confirmPassword') ?? ''),
        university: String(form.get('university') ?? ''),
        location: String(form.get('location') ?? ''),
        acceptTerms: form.get('acceptTerms') === 'on',
        acceptPrivacy: form.get('acceptPrivacy') === 'on',
      })
      if (!result.ok) {
        setFormError(result.error)
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success(t.created_toast)
      window.location.href = result.data.redirectTo
    })
  }

  return (
    <Card className="border-border bg-card/80 shadow-lg backdrop-blur-md">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="google-email">{t.google_email}</Label>
            <Input id="google-email" value={email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t.full_name}</Label>
            <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" disabled={isPending} required />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t.username}</Label>
            <Input
              id="username"
              name="username"
              defaultValue={defaultUsername}
              autoComplete="username"
              pattern="[a-z0-9_]+"
              disabled={isPending}
              required
            />
            {errors.username ? <p className="text-xs text-destructive">{errors.username}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={t.password_placeholder}
                disabled={isPending}
                required
              />
              {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirm_password}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t.password_placeholder}
                disabled={isPending}
                required
              />
              {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="university">{t.university_optional}</Label>
              <Input id="university" name="university" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t.city_optional}</Label>
              <Input id="location" name="location" placeholder={t.location_placeholder} disabled={isPending} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox name="acceptTerms" disabled={isPending} className="mt-0.5" />
              <span>{t.accept_terms_prefix} <Link href="/terms" target="_blank" className="font-medium text-primary underline">{t.terms_link}</Link>{t.accept_suffix}</span>
            </label>
            {errors.acceptTerms ? <p className="text-xs text-destructive">{errors.acceptTerms}</p> : null}
            <label className="flex items-start gap-2 text-sm">
              <Checkbox name="acceptPrivacy" disabled={isPending} className="mt-0.5" />
              <span>{t.accept_privacy_prefix} <Link href="/privacy" target="_blank" className="font-medium text-primary underline">{t.privacy_link}</Link>{t.accept_privacy_suffix}</span>
            </label>
            {errors.acceptPrivacy ? <p className="text-xs text-destructive">{errors.acceptPrivacy}</p> : null}
          </div>

          {formError ? (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {formError}
            </div>
          ) : null}

          <Button type="submit" className="w-full gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {isPending ? t.creating : t.create_account}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
