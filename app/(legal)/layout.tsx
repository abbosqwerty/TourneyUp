import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { getI18n } from '@/lib/i18n/server'

/**
 * Standalone chrome for the legal pages — no app navbar, so they are
 * readable for signed-out visitors arriving from a footer link.
 */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const { dict } = await getI18n()
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" asChild aria-label={dict.chrome.legal_back}>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="font-semibold">TourneyUp</span>
        </div>
      </header>

      <main className="flex-1">
        <article className="container mx-auto max-w-3xl space-y-6 px-4 py-10 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </article>
      </main>

      <Footer />
    </div>
  )
}
