'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'

/**
 * Page links for a server-paginated list. Each page is a real URL, so it can
 * be shared and the back button works.
 */
export function Pager({
  page,
  pageCount,
  hrefFor,
  className,
}: {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
  className?: string
}) {
  const { dict } = useLanguage()
  if (pageCount <= 1) return null
  const t = dict.chrome.pager

  const pages = windowAround(page, pageCount)

  return (
    <nav aria-label={t.nav} className={cn('flex items-center justify-center gap-1', className)}>
      <Button variant="ghost" size="icon" asChild={page > 1} disabled={page === 1} aria-label={t.prev}>
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} scroll>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <ChevronLeft className="h-4 w-4" aria-hidden />
        )}
      </Button>

      {pages.map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} className="px-2 text-sm text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Button
            key={entry}
            variant={entry === page ? 'outline' : 'ghost'}
            size="icon"
            asChild
            aria-current={entry === page ? 'page' : undefined}
          >
            <Link href={hrefFor(entry)} scroll aria-label={t.page(entry)}>
              {entry}
            </Link>
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="icon"
        asChild={page < pageCount}
        disabled={page === pageCount}
        aria-label={t.next}
      >
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} scroll>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </nav>
  )
}

/** First, last, and a short run around the current page; `null` is an ellipsis. */
function windowAround(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)

  const out: (number | null)[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)

  if (start > 2) out.push(null)
  for (let i = start; i <= end; i++) out.push(i)
  if (end < pageCount - 1) out.push(null)
  out.push(pageCount)

  return out
}
