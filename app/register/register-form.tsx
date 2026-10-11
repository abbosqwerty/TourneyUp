'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerUser } from '@/lib/auth-actions'
import { useLanguage } from '@/lib/i18n/language-context'

export function RegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const { dict } = useLanguage()
  const t = dict.account.register

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') ?? ''),
      username: String(form.get('username') ?? '').toLowerCase(),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      university: String(form.get('university') ?? ''),
      location: String(form.get('location') ?? ''),
    }

    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await registerUser(payload)

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
            <Label htmlFor="name">{t.full_name}</Label>
            <Input id="name" name="name" autoComplete="name" placeholder="Abbos Qurbonov" disabled={isPending} required />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">{t.username}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="abbosq"
                pattern="[a-z0-9_]+"
                disabled={isPending}
                required
              />
              {errors.username ? <p className="text-xs text-destructive">{errors.username}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="abbos@tuit.uz"
                disabled={isPending}
                required
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={t.password_placeholder}
              minLength={8}
              disabled={isPending}
              required
            />
            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="university">{t.university_optional}</Label>
              <Input id="university" name="university" placeholder="TUIT" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t.city_optional}</Label>
              <Input id="location" name="location" placeholder={t.location_placeholder} disabled={isPending} />
            </div>
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
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {isPending ? t.creating : t.create_account}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
