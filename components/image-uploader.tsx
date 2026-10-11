'use client'

import { useCallback, useRef, useState } from 'react'
import { ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_STORY_VIDEO_BYTES,
  MAX_UPLOAD_BYTES,
  formatBytes,
  isAllowedImageType,
  isAllowedVideoType,
} from '@/lib/media'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'

export type UploadedImage = {
  id: string
  url: string
  mimeType: string
  width: number | null
  height: number | null
  byteSize: number
}

type Props = {
  value?: UploadedImage | null
  onChange: (value: UploadedImage | null) => void
  label?: string
  hint?: string
  className?: string
  /** Aspect ratio of the preview box, e.g. `aspect-[1200/630]`. */
  aspectClassName?: string
  /** Enables MP4 and WebM uploads alongside images for vertical stories. */
  allowVideo?: boolean
}

/**
 * Drag-and-drop image picker. Uploads straight to `/api/upload`, which
 * stores the bytes in the database — no S3, no signed URLs.
 */
export function ImageUploader({
  value,
  onChange,
  label,
  hint,
  className,
  aspectClassName = 'aspect-[1200/630]',
  allowVideo = false,
}: Props) {
  const { dict } = useLanguage()
  const t = dict.chrome.uploader
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setError(null)

      const isImage = isAllowedImageType(file.type)
      const isVideo = allowVideo && isAllowedVideoType(file.type)
      if (!isImage && !isVideo) {
        setError(allowVideo ? t.only_media : t.only_images)
        return
      }
      const maxBytes = isVideo ? MAX_STORY_VIDEO_BYTES : MAX_UPLOAD_BYTES
      if (file.size > maxBytes) {
        setError(t.too_large(formatBytes(file.size), formatBytes(maxBytes)))
        return
      }

      setIsUploading(true)
      try {
        const body = new FormData()
        body.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body })
        const payload = await response.json()

        if (!response.ok || !payload.ok) {
          setError(payload?.error ?? t.upload_error)
          return
        }
        onChange(payload.data as UploadedImage)
      } catch {
        setError(t.network_error)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange, allowVideo, t]
  )

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={(allowVideo ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] : ALLOWED_IMAGE_TYPES).join(',')}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ''
        }}
      />

      {value ? (
        <div className={cn('relative overflow-hidden rounded-lg border border-border bg-muted', aspectClassName)}>
          { }
          {value.mimeType.startsWith('video/') ? (
            <video src={value.url} className="h-full w-full object-cover" controls muted playsInline />
          ) : (
            <img src={value.url} alt={t.uploaded_alt} className="h-full w-full object-cover" />
          )}
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {t.replace}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              aria-label={t.remove}
              onClick={() => onChange(null)}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {value.width && value.height ? (
            <span className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
              {value.width}×{value.height} · {formatBytes(value.byteSize)}
            </span>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            const file = event.dataTransfer.files?.[0]
            if (file) void upload(file)
          }}
          disabled={isUploading}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            isUploading && 'opacity-60'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : isDragging ? (
            <ImageIcon className="h-10 w-10 text-primary" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{isUploading ? t.uploading : (label ?? t.label)}</span>
          <span className="text-xs text-muted-foreground">{hint ?? t.hint(formatBytes(MAX_UPLOAD_BYTES))}</span>
        </button>
      )}

      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
