'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'

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
  const { dict } = useLanguage()
  const t = dict.chrome.share

  const share = async () => {
    const url = `${window.location.origin}${path}`

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t.copied)
    } catch (error) {
      // AbortError just means the user dismissed the native sheet.
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error(t.failed)
    }
  }

  return (
    <Button variant={variant} size="icon" onClick={share} className={className} aria-label={t.aria}>
      <Share2 className="h-4 w-4" aria-hidden />
    </Button>
  )
}
