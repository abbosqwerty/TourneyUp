'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import { SPORT_NAMES } from '@/lib/constants'
import { useLanguage } from '@/lib/i18n/language-context'
type FormResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type TeamFormValues = {
  name: string
  sport: string
  category: string
  description: string
  logoUrl: string | null
}

/** Create / edit form shared by the dialog on /teams and the settings tab. */
export function TeamForm({
  initial,
  submitLabel,
  onSubmit,
  onDone,
}: {
  initial?: TeamFormValues
  submitLabel: string
  onSubmit: (values: Record<string, string>) => Promise<FormResult>
  onDone: (result: FormResult) => void
}) {
  const { dict } = useLanguage()
  const t = dict.team.form
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sport, setSport] = useState(initial?.sport ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'sports')
  const [logo, setLogo] = useState<UploadedImage | null>(null)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setErrors({})
    startTransition(async () => {
      const result = await onSubmit({
        name: String(data.get('name') ?? ''),
        description: String(data.get('description') ?? ''),
        sport,
        category,
        logoMediaId: logo?.id ?? '',
      })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }
      onDone(result)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="team-name">{t.name}</Label>
        <Input
          id="team-name"
          name="name"
          maxLength={50}
          defaultValue={initial?.name}
          placeholder={t.name_placeholder}
          aria-invalid={Boolean(errors.name)}
          disabled={isPending}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="team-sport">{t.sport}</Label>
          <Select value={sport} onValueChange={setSport} disabled={isPending}>
            <SelectTrigger id="team-sport" aria-invalid={Boolean(errors.sport)}>
              <SelectValue placeholder={t.choose} />
            </SelectTrigger>
            <SelectContent>
              {SPORT_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sport ? <p className="text-xs text-destructive">{errors.sport}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-category">{t.category}</Label>
          <Select value={category} onValueChange={setCategory} disabled={isPending}>
            <SelectTrigger id="team-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.competition.categories).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-description">{t.description}</Label>
        <Textarea id="team-description" name="description" rows={3} maxLength={500} defaultValue={initial?.description} disabled={isPending} />
      </div>

      <div className="space-y-2">
        <Label>{t.logo}</Label>
        {initial?.logoUrl && !logo ? (
          <img src={initial.logoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <ImageUploader value={logo} onChange={setLogo} aspectClassName="aspect-square max-w-40" label={t.upload_logo} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
