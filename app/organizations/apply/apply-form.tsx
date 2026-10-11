'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitOrganizationApplication } from '@/lib/org-actions'
import { useLanguage } from '@/lib/i18n/language-context'

export function ApplyForm() {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const { dict } = useLanguage()
  const t = dict.account.apply

  if (submitted) {
    return (
      <Card className="border-border bg-card/80 shadow-lg backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="text-lg font-semibold">{t.received_title}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t.received_desc}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">{t.back_home}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      orgName: String(form.get('orgName') ?? ''),
      contactName: String(form.get('contactName') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      website: String(form.get('website') ?? ''),
      location: String(form.get('location') ?? ''),
      description: String(form.get('description') ?? ''),
    }

    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await submitOrganizationApplication(payload)

      if (!result.ok) {
        setFormError(result.error)
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success(t.sent_toast)
      setSubmitted(true)
    })
  }

  return (
    <Card className="border-border bg-card/80 shadow-lg backdrop-blur-md">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orgName">{t.org_name}</Label>
              <Input id="orgName" name="orgName" placeholder="TUIT Athletics Club" disabled={isPending} required />
              {errors.orgName ? <p className="text-xs text-destructive">{errors.orgName}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">{t.contact_name}</Label>
              <Input id="contactName" name="contactName" placeholder="Abbos Qurbonov" disabled={isPending} required />
              {errors.contactName ? <p className="text-xs text-destructive">{errors.contactName}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="sports@tuit.uz"
                disabled={isPending}
                required
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input id="phone" name="phone" placeholder="+998 90 123 45 67" disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">{t.website}</Label>
              <Input id="website" name="website" placeholder="https://tuit.uz" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t.city}</Label>
              <Input id="location" name="location" placeholder={t.location_placeholder} disabled={isPending} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.about}</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              placeholder={t.about_placeholder}
              disabled={isPending}
              required
            />
            {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
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
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isPending ? t.sending : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
