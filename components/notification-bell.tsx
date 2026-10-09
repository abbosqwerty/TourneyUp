'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notification-actions'
import type { NotificationView } from '@/lib/notifications'

/**
 * The bell used to be a decorative icon with no handler. It now opens a real
 * list, loaded on first open so the layout does not pay for it on every page.
 */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationView[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const load = async () => {
    setIsLoading(true)
    const result = await fetchNotifications()
    setIsLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      setItems([])
      return
    }
    setItems(result.data)
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && items === null) void load()
  }

  const openItem = (item: NotificationView) => {
    setOpen(false)
    if (!item.read) {
      setItems((prev) => prev?.map((row) => (row.id === item.id ? { ...row, read: true } : row)) ?? prev)
      startTransition(async () => {
        await markNotificationRead(item.id)
        router.refresh()
      })
    }
    if (item.link) router.push(item.link)
  }

  const markAll = () => {
    setItems((prev) => prev?.map((row) => ({ ...row, read: true })) ?? prev)
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (!result.ok) {
        toast.error(result.error)
        void load()
        return
      }
      router.refresh()
    })
  }

  const unread = items ? items.filter((item) => !item.read).length : unreadCount

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Bildirishnomalar (${unread} o‘qilmagan)` : 'Bildirishnomalar'}
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unread > 0 ? (
            <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]">
              {unread > 99 ? '99+' : unread}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Bildirishnomalar</DropdownMenuLabel>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={markAll}
              disabled={isPending}
            >
              <Check className="h-3 w-3" aria-hidden />
              Hammasini o‘qildi
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Yuklanmoqda...
            </div>
          ) : items && items.length > 0 ? (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      'w-full px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                      !item.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!item.read ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-label="O‘qilmagan"
                        />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                        <time
                          dateTime={item.createdAt}
                          className="mt-1 block text-[11px] text-muted-foreground"
                        >
                          {formatWhen(item.createdAt)}
                        </time>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Hozircha bildirishnoma yo‘q
            </p>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              Barchasini ko‘rish
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatWhen(iso: string) {
  const date = new Date(iso)
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60_000)

  if (diffMinutes < 1) return 'hozir'
  if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`

  const hours = Math.round(diffMinutes / 60)
  if (hours < 24) return `${hours} soat oldin`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days} kun oldin`

  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
}
