'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import { createStory } from '@/lib/story-actions'
import { useLanguage } from '@/lib/i18n/language-context'

/**
 * Organizations publish 24-hour stories that surface at the top of the feed.
 * The image goes through /api/upload, so it lands in the database like every
 * other asset — no object storage involved.
 */
export function StoryComposer({
  organizationName,
  tournaments,
}: {
  organizationName: string
  tournaments: { id: string; title: string }[]
}) {
  const router = useRouter()
  const { dict } = useLanguage()
  const c = dict.tournament.composer
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState<UploadedImage | null>(null)
  const [caption, setCaption] = useState('')
  const [tournamentId, setTournamentId] = useState('')
  const [isPending, startTransition] = useTransition()

  if (!isOpen) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{c.add_story}</p>
              <p className="text-xs text-muted-foreground">
                {c.visibility(organizationName)}
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {c.new_story}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const publish = () => {
    if (!image) {
      toast.error(c.upload_first)
      return
    }
    if (!tournamentId) {
      toast.error(c.pick_tournament)
      return
    }

    startTransition(async () => {
      const result = await createStory({ mediaId: image.id, caption, tournamentId })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(c.published)
      setImage(null)
      setCaption('')
      setTournamentId('')
      setIsOpen(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{c.new_story}</CardTitle>
        <CardDescription>{c.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUploader
          value={image}
          onChange={setImage}
          label={c.upload_label}
          hint={c.upload_hint}
          aspectClassName="aspect-[9/16] max-h-80 mx-auto"
          allowVideo
        />

        <div className="space-y-2">
          <Label htmlFor="story-tournament">{c.link_tournament}</Label>
          <select
            id="story-tournament"
            value={tournamentId}
            onChange={(event) => setTournamentId(event.target.value)}
            disabled={isPending}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="" disabled>{c.choose_tournament}</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{c.link_hint}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="story-caption">{c.caption}</Label>
          <Input
            id="story-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={200}
            placeholder={c.caption_placeholder}
            disabled={isPending}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setImage(null)
              setCaption('')
              setTournamentId('')
            }}
            disabled={isPending}
          >
            {dict.common.cancel}
          </Button>
          <Button className="gap-2" onClick={publish} disabled={isPending || !image || !tournamentId}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {c.publish}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
