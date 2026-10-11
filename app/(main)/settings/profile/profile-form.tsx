'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProfile } from '@/lib/auth-actions'
import { useLanguage } from '@/lib/i18n/language-context'

export type ProfileFormValues = {
  name: string
  username: string
  bio: string
  university: string
  location: string
  avatar: string
}

export function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<UploadedImage | null>(null)
  const { dict } = useLanguage()
  const t = dict.account.edit_profile

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') ?? ''),
      username: String(form.get('username') ?? ''),
      bio: String(form.get('bio') ?? ''),
      university: String(form.get('university') ?? ''),
      location: String(form.get('location') ?? ''),
      avatarMediaId: avatar?.id ?? '',
    }

    setErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await updateProfile(payload)
      if (!result.ok) {
        setFormError(result.error)
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }

      toast.success(t.saved)
      router.push('/profile')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label>{t.avatar}</Label>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={avatar?.url ?? initial.avatar} alt={t.avatar_alt(initial.name)} />
            <AvatarFallback>{initial.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <ImageUploader
            value={avatar}
            onChange={setAvatar}
            label={t.upload_avatar}
            aspectClassName="aspect-square"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t.name}</Label>
        <Input id="name" name="name" defaultValue={initial.name} disabled={isPending} required />
        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">{t.username}</Label>
        <Input
          id="username"
          name="username"
          defaultValue={initial.username}
          disabled={isPending}
          required
        />
        <p className="text-xs text-muted-foreground">{t.username_hint}</p>
        {errors.username ? <p className="text-xs text-destructive">{errors.username}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t.bio}</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={500}
          defaultValue={initial.bio}
          disabled={isPending}
          placeholder={t.bio_placeholder}
        />
        {errors.bio ? <p className="text-xs text-destructive">{errors.bio}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="university">{t.university}</Label>
          <Input
            id="university"
            name="university"
            defaultValue={initial.university}
            disabled={isPending}
          />
          {errors.university ? <p className="text-xs text-destructive">{errors.university}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">{t.city}</Label>
          <Input id="location" name="location" defaultValue={initial.location} disabled={isPending} />
          {errors.location ? <p className="text-xs text-destructive">{errors.location}</p> : null}
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

      <div className="flex gap-3">
        <Button type="submit" className="gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {dict.common.save}
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={() => router.back()}>
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  )
}
