'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { LoadingAnimation } from '@/components/loading-animation'

export default function RootLoading() {
  const { dict } = useLanguage()
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <LoadingAnimation size={180} />
      <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
        {dict.chrome.loading_app}
      </p>
    </div>
  )
}
