import Link from 'next/link'
import { Compass, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Sahifa topilmadi' }

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Compass className="h-6 w-6 text-primary" aria-hidden />
          </span>
          <CardTitle>404 — sahifa topilmadi</CardTitle>
          <CardDescription>Siz izlagan sahifa o‘chirilgan yoki manzil noto‘g‘ri.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button className="gap-2" asChild>
            <Link href="/feed">Turnirlarni ko‘rish</Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden />
              Bosh sahifa
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
