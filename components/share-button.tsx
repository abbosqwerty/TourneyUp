'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

/**
 * Real share behaviour instead of a decorative icon: the native share sheet
 * where it exists (mobile), clipboard everywhere else.
 */
export function ShareButton({
  title,
  path,
  variant = 'secondary',
  className,
}: {
  title: string
  /** Absolute path, e.g. `/tournament/abc`. */
  path: string
  variant?: 'secondary' | 'outline' | 'ghost'
  className?: string
}) {
  const share = async () => {
    const url = `${window.location.origin}${path}`

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Havola nusxalandi')
    } catch (error) {
      // AbortError just means the user dismissed the native sheet.
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('Havolani ulashib bo‘lmadi')
    }
  }

  return (
    <Button variant={variant} size="icon" onClick={share} className={className} aria-label="Havolani ulashish">
      <Share2 className="h-4 w-4" aria-hidden />
    </Button>
  )
}
