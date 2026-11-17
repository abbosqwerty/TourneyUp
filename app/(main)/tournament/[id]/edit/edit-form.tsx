'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/language-context'
import { saveTournamentDetails } from '@/lib/actions'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const labels = {
  title: 'tournament_title', description: 'description', location: 'location', date: 'start_date',
  time: 'start_time', rules: 'rules', requirements: 'requirements', prizePool: 'prize_pool', entryFee: 'entry_fee',
} as const

type Field = keyof typeof labels

export default function EditForm({ id, values, posterUrl }: {
  id: string
  values: Record<Field, string>
  posterUrl: string | null
}) {
  const { dict } = useLanguage()
  const router = useRouter()
  const [poster, setPoster] = useState<UploadedImage | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const d = dict.tournament.detail
  return (
    <form className="mx-auto max-w-2xl space-y-5 px-4 py-8" onSubmit={async event => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      setSaving(true)
      try {
        const result = await saveTournamentDetails(id, { ...data, posterMediaId: poster?.id })
        if (!result.ok) {
          setErrors(result.fieldErrors ?? {})
          toast.error(result.error)
          return
        }
        router.push(`/tournament/${id}`)
        router.refresh()
      } catch {
        toast.error(dict.tournament.errors.update_failed)
      } finally {
        setSaving(false)
      }
    }}>
      <h1 className="text-2xl font-bold">{d.edit_tournament}</h1>
      {posterUrl && !poster && <img src={posterUrl} alt={dict.create.poster} className="max-h-56 rounded-lg object-contain" />}
      <ImageUploader label={dict.create.poster} value={poster} onChange={setPoster} onUploadingChange={setUploading} />
      {(Object.keys(labels) as Field[]).map(field => (
        <label key={field} className="block space-y-1">
          <span>{dict.create[labels[field]]}</span>
          {['description', 'requirements', 'rules'].includes(field)
            ? <Textarea name={field} defaultValue={values[field]} rows={4} />
            : <Input name={field} type={field === 'date' ? 'date' : 'text'} defaultValue={values[field]} />}
          {errors[field] && <span className="text-sm text-destructive">{errors[field]}</span>}
        </label>
      ))}
      <Button disabled={saving || uploading} type="submit">{d.save_changes}</Button>
    </form>
  )
}
