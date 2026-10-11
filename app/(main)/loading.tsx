'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { LoadingAnimation } from '@/components/loading-animation'

/**
 * Group-level fallback for routes without their own `loading.tsx`.
 * Deliberately neutral — "Loading tournaments…" was wrong on half of them.
 */
export default function Loading() {
  const { dict } = useLanguage()
  return (
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center gap-4">
      <LoadingAnimation size={160} />
      <p className="animate-pulse text-sm font-medium tracking-wide text-muted-foreground">
        {dict.common.loading}
      </p>
    </div>
  )
}
