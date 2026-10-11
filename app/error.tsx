'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useLanguage()
  const t = dict.chrome.error

  useEffect(() => {
    console.error('route error', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
          </span>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t.retry}
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden />
              {t.home}
            </Link>
          </Button>
          {error.digest ? (
            <p className="pt-2 text-center text-xs text-muted-foreground">{t.code(error.digest)}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
