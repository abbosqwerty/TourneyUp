import type { Metadata } from 'next'
import { MessagesSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Xabarlar',
  robots: { index: false },
}

/** Desktop placeholder; on a phone the layout shows the list instead. */
export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <MessagesSquare className="h-12 w-12 text-muted-foreground/60" aria-hidden />
      <p className="font-medium">Suhbatni tanlang</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tashkilot e’lonlari, turnir guruhlari, jamoa chatlari va support — chapdagi bo‘limlardan birini oching.
      </p>
    </div>
  )
}
