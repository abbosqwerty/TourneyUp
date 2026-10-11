'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Shown when a server component's data load throws (usually the database being
 * unreachable). Pages catch the error, keep the JSX outside the `try`, and
 * render this instead of taking the whole route down.
 */
export function DbErrorCard({
  message,
  bare = false,
}: {
  /** Defaults to a generic "could not load" line in the visitor's language. */
  message?: string
  /** Skip the page container — for pages that already sit inside one. */
  bare?: boolean
}) {
  const { dict } = useLanguage()
  const card = (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message ?? dict.chrome.db_error}</CardContent>
    </Card>
  )

  if (bare) return card
  return <div className="container mx-auto px-4 py-6">{card}</div>
}
