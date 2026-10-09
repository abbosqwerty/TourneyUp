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

/**
 * Organizations publish 24-hour stories that surface at the top of the feed.
 * The image goes through /api/upload, so it lands in the database like every
 * other asset — no object storage involved.
 */
export function StoryComposer({ organizationName }: { organizationName: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState<UploadedImage | null>(null)
  const [caption, setCaption] = useState('')
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
              <p className="text-sm font-semibold">Story qo‘shish</p>
              <p className="text-xs text-muted-foreground">
                24 soat ko‘rinadi · {organizationName} nomidan chiqadi
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Yangi story
          </Button>
        </CardContent>
      </Card>
    )
  }

  const publish = () => {
    if (!image) {
      toast.error('Avval rasm yuklang')
      return
    }

    startTransition(async () => {
      const result = await createStory({ mediaId: image.id, caption, tournamentId: '' })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Story e‘lon qilindi')
      setImage(null)
      setCaption('')
      setIsOpen(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yangi story</CardTitle>
        <CardDescription>Rasm yuklang va qisqa izoh yozing. Story 24 soatdan keyin o‘chadi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUploader
          value={image}
          onChange={setImage}
          label="Story rasmini yuklash"
          aspectClassName="aspect-[9/16] max-h-80 mx-auto"
        />

        <div className="space-y-2">
          <Label htmlFor="story-caption">Izoh (ixtiyoriy)</Label>
          <Input
            id="story-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={200}
            placeholder="Final o‘yin bugun soat 18:00 da!"
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
            }}
            disabled={isPending}
          >
            Bekor qilish
          </Button>
          <Button className="gap-2" onClick={publish} disabled={isPending || !image}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            E‘lon qilish
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
