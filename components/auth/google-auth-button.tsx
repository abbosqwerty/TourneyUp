'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'

export function GoogleAuthButton({ nextPath }: { nextPath?: string }) {
  const { dict } = useLanguage()
  const href = nextPath
    ? `/api/auth/google?next=${encodeURIComponent(nextPath)}`
    : '/api/auth/google'

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" className="w-full bg-background">
        <Link href={href}>
          <GoogleIcon />
          {dict.auth.continue_google}
        </Link>
      </Button>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{dict.auth.or}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.7h3.5c2-1.9 3.2-4.6 3.2-7.7Z" />
      <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.5-2.7c-1 .7-2.2 1-3.4 1a6.1 6.1 0 0 1-5.7-4.2H2.7v2.8A10.4 10.4 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.6a6.2 6.2 0 0 1 0-3.9V6.9H2.7a10.4 10.4 0 0 0 0 9.5l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.5c1.5 0 3 .5 4 1.6l3-3A10 10 0 0 0 2.7 6.9l3.6 2.8A6.1 6.1 0 0 1 12 5.5Z" />
    </svg>
  )
}
