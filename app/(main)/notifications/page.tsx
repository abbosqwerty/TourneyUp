import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getCurrentUser } from '@/lib/session'
import { NOTIFICATION_PAGE_SIZE, listNotifications } from '@/lib/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { DbErrorCard } from '@/components/db-error-card'
import type { NotificationView } from '@/lib/notifications'
import { MarkAllReadButton } from './mark-all-read'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Bildirishnomalar', robots: { index: false } }

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fnotifications')

  let items: NotificationView[] | null = null
  try {
    items = await listNotifications(user.id, NOTIFICATION_PAGE_SIZE * 4)
  } catch (error) {
    console.error('notifications page failed', error)
  }

  if (!items) return <DbErrorCard message="Bildirishnomalarni yuklab bo‘lmadi." />

  const unread = items.filter((item) => !item.read).length

  return (
    <div className="container mx-auto max-w-2xl space-y-4 px-4 py-6 theme-notif bg-background text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Bildirishnomalar</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} ta o‘qilmagan` : 'Hammasi o‘qilgan'}
          </p>
        </div>
        {unread > 0 ? <MarkAllReadButton /> : null}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Hozircha bildirishnoma yo‘q. Turnirga yozilganingizda yoki arizangiz ko‘rib
              chiqilganda shu yerda ko‘rinadi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const body = (
              <Card className={item.read ? undefined : 'border-primary/40 bg-primary/5'}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    className={
                      item.read
                        ? 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted'
                        : 'mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary'
                    }
                    aria-label={item.read ? 'O‘qilgan' : 'O‘qilmagan'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                    <time
                      dateTime={item.createdAt}
                      className="mt-1 block text-xs text-muted-foreground"
                    >
                      {new Date(item.createdAt).toLocaleString('uz-UZ', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            )

            return (
              <li key={item.id}>
                {item.link ? (
                  <Link href={item.link} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

