'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
          <CardTitle>Nimadir ishdan chiqdi</CardTitle>
          <CardDescription>
            Sahifani yuklab bo‘lmadi. Bu vaqtincha muammo bo‘lishi mumkin — qayta urinib ko‘ring.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden />
            Qayta urinish
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden />
              Bosh sahifa
            </Link>
          </Button>
          {error.digest ? (
            <p className="pt-2 text-center text-xs text-muted-foreground">Kod: {error.digest}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
