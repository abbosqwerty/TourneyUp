'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/i18n/language-context'
import { loginWithPassword } from '@/lib/auth-actions'

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

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
        toast.info('Xavfsizlik uchun parolni almashtiring')
      } else {
        toast.success('Xush kelibsiz!')
      }

      // `next` only ever carries a same-site path from the middleware.
      const safeNext = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null
      const target = result.data.mustChangePassword ? result.data.redirectTo : (safeNext ?? result.data.redirectTo)
      window.location.href = target
    })
  }

  const { dict } = useLanguage()

  return (
    <Card className="border-border bg-card/80 shadow-lg backdrop-blur-md">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="identifier">{dict.auth.identifier_label}</Label>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="username"
              placeholder="abbosq yoki abbosazizmurodovich@gmail.com"
              aria-invalid={Boolean(errors.identifier)}
              disabled={isPending}
              required
            />
            {errors.identifier ? <p className="text-xs text-destructive">{errors.identifier}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{dict.auth.password_label}</Label>
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
                aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
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

        <div className="mt-6 space-y-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{dict.auth.quick_demo}</p>
            <span className="text-[11px] text-muted-foreground font-mono">{dict.auth.demo_password} TourneyUp2026!</span>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setErrors({})
                setFormError(null)
                startTransition(async () => {
                  const res = await loginWithPassword({ identifier: 'demouser1', password: 'TourneyUp2026!' })
                  if (!res.ok) {
                    setFormError(res.error)
                    toast.error(res.error)
                    return
                  }
                  toast.success('Xush kelibsiz!')
                  window.location.href = res.data.redirectTo
                })
              }}
              className="justify-start text-xs font-medium"
            >
              🎮 Demo O‘yinchi (demouser1)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setErrors({})
                setFormError(null)
                startTransition(async () => {
                  const res = await loginWithPassword({ identifier: 'abbosq', password: 'TourneyUp2026!' })
                  if (!res.ok) {
                    setFormError(res.error)
                    toast.error(res.error)
                    return
                  }
                  toast.success('Xush kelibsiz!')
                  window.location.href = res.data.redirectTo
                })
              }}
              className="justify-start text-xs font-medium"
            >
              👤 Abbos (O‘yinchi — abbosq)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setErrors({})
                setFormError(null)
                startTransition(async () => {
                  const res = await loginWithPassword({ identifier: 'tashkent_sports', password: 'TourneyUp2026!' })
                  if (!res.ok) {
                    setFormError(res.error)
                    toast.error(res.error)
                    return
                  }
                  toast.success('Xush kelibsiz!')
                  window.location.href = res.data.redirectTo
                })
              }}
              className="justify-start text-xs font-medium"
            >
              🏢 Tashkent Sports (Tashkilotchi)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
