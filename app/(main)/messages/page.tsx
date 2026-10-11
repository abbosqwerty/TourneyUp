import type { Metadata } from 'next'
import { MessagesSquare } from 'lucide-react'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return { title: dict.chat.meta.title, robots: { index: false } }
}

/** Desktop placeholder; on a phone the layout shows the list instead. */
export default async function MessagesIndexPage() {
  const { dict } = await getI18n()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <MessagesSquare className="h-12 w-12 text-muted-foreground/60" aria-hidden />
      <p className="font-medium">{dict.chat.index.pick}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{dict.chat.index.hint}</p>
    </div>
  )
}
