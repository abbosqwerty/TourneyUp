'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/i18n/language-context'
import { loginWithPassword } from '@/lib/auth-actions'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'

export function LoginForm({ nextPath, oauthError }: { nextPath?: string; oauthError?: string }) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const { dict } = useLanguage()
  const t = dict.account.login

  useEffect(() => {
    const message = sessionStorage.getItem('tourneyup_password_reset')
    if (message) {
      sessionStorage.removeItem('tourneyup_password_reset')
      toast.success(message)
    }
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      identifier: String(form.get('identifier') ?? ''),
      password: String(form.get('password') ?? ''),
    }

    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await loginWithPassword(payload)

      if (!result.ok) {
        setFormError(result.error)
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      if (result.data.mustChangePassword) {
        toast.info(t.change_password_notice)
      } else {
        toast.success(t.welcome)
      }

      // `next` only ever carries a same-site path from the middleware.
      const safeNext = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null
      const target = result.data.mustChangePassword ? result.data.redirectTo : (safeNext ?? result.data.redirectTo)
      window.location.href = target
    })
  }

  return (
    <Card className="border-border bg-card/80 shadow-lg backdrop-blur-md">
      <CardContent className="pt-6">
        <GoogleAuthButton nextPath={nextPath} />
        {oauthError ? (
          <div role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {oauthError === 'google_not_configured' ? dict.auth.google_not_configured : dict.auth.google_login_error}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="identifier">{dict.auth.identifier_label}</Label>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="username"
              placeholder={t.identifier_placeholder}
              aria-invalid={Boolean(errors.identifier)}
              disabled={isPending}
              required
            />
            {errors.identifier ? <p className="text-xs text-destructive">{errors.identifier}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">{dict.auth.password_label}</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                {dict.account.forgot_password.title}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                aria-invalid={Boolean(errors.password)}
                disabled={isPending}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={showPassword ? t.hide_password : t.show_password}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
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
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {isPending ? dict.auth.logging_in : dict.auth.login_button}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
