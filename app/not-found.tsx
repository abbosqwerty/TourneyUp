import Link from 'next/link'
import { Compass, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.chrome.not_found.meta_title }
}

export default async function NotFound() {
  const { dict } = await getI18n()
  const t = dict.chrome.not_found
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Compass className="h-6 w-6 text-primary" aria-hidden />
          </span>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button className="gap-2" asChild>
            <Link href="/feed">{t.browse}</Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden />
              {dict.chrome.error.home}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
