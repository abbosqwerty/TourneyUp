'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Archive, Building2, LifeBuoy, Loader2, Plus, Search, Shirt, Trophy, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { ChannelMemberRole, ChannelType } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeToChannel } from '@/lib/channel-actions'
import type { TicketListItem } from '@/lib/support'
import { cn } from '@/lib/utils'

export type SidebarChannel = {
  id: string
  type: ChannelType
  title: string
  avatar: string
  archived: boolean
  memberRole: ChannelMemberRole
  subtitle: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export type SidebarData = {
  channels: SidebarChannel[]
  discover: { id: string; title: string; handle: string; avatar: string; memberCount: number }[]
  myTickets: TicketListItem[]
  staffQueue: TicketListItem[]
}

type Section = 'ORGANIZATION' | 'TOURNAMENT' | 'TEAM' | 'SUPPORT'

const SECTIONS: { key: Section; label: string; icon: typeof Building2 }[] = [
  { key: 'ORGANIZATION', label: 'Tashkilotlar', icon: Building2 },
  { key: 'TOURNAMENT', label: 'Turnirlar', icon: Trophy },
  { key: 'TEAM', label: 'Jamoalarim', icon: Shirt },
  { key: 'SUPPORT', label: 'Yordam', icon: LifeBuoy },
]

export function relativeTime(iso: string | null) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'hozir'
  if (minutes < 60) return `${minutes} daq`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} soat`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} kun`
  return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
}

function UnreadDot({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
      {count > 99 ? '99+' : count}
    </span>
  )
}

/**
 * Two panes on desktop (list | conversation); on a phone the list and the
 * conversation take turns, driven by the URL.
 */
export function MessagesShell({ data, isPlayer, children }: { data: SidebarData; isPlayer: boolean; children: React.ReactNode }) {
  const pathname = usePathname()
  const onIndex = pathname === '/messages'
  const activeId = pathname.split('/')[2] ?? null

  const counts = useMemo(() => {
    const unread = (type: Section) =>
      type === 'SUPPORT'
        ? [...data.myTickets, ...data.staffQueue].filter((t) => t.unread).length
        : data.channels.filter((c) => c.type === type).reduce((sum, c) => sum + c.unreadCount, 0)
    return Object.fromEntries(SECTIONS.map((s) => [s.key, unread(s.key)])) as Record<Section, number>
  }, [data])

  const sectionOfPath = (): Section | null => {
    if (pathname.startsWith('/messages/support')) return 'SUPPORT'
    const channel = data.channels.find((c) => c.id === activeId)
    return channel ? (channel.type as Section) : null
  }

  const sectionCounts = useMemo(() => {
    return {
      ORGANIZATION: data.channels.filter((c) => c.type === 'ORGANIZATION').length,
      TOURNAMENT: data.channels.filter((c) => c.type === 'TOURNAMENT').length,
      TEAM: data.channels.filter((c) => c.type === 'TEAM').length,
      SUPPORT: data.myTickets.length + data.staffQueue.length,
    }
  }, [data])

  const [chosen, setChosen] = useState<Section | null>(null)
  const fallback: Section =
    SECTIONS.find((s) => counts[s.key] > 0)?.key ??
    (data.channels.some((c) => c.type === 'TEAM')
      ? 'TEAM'
      : data.channels.some((c) => c.type === 'TOURNAMENT')
        ? 'TOURNAMENT'
        : 'ORGANIZATION')
  const section = chosen ?? sectionOfPath() ?? fallback

  return (
    <div className="theme-msg container mx-auto max-w-6xl bg-background px-0 text-foreground md:px-4 md:py-4">
      <div className="grid md:h-[calc(100dvh-7.5rem)] md:grid-cols-[340px_minmax(0,1fr)] md:overflow-hidden md:rounded-2xl md:border md:border-border">
        <aside className={cn('flex min-h-0 flex-col border-border md:border-r', !onIndex && 'hidden md:flex')}>
          <div className="space-y-3 border-b border-border p-4">
            <h1 className="text-xl font-bold">Xabarlar</h1>
            <nav className="grid grid-cols-4 gap-1 rounded-xl bg-secondary/60 p-1" aria-label="Xabar bo‘limlari">
              {SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChosen(key)}
                  aria-pressed={section === key}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors',
                    section === key ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="truncate">{label}{sectionCounts[key] > 0 ? ` (${sectionCounts[key]})` : ''}</span>
                  {counts[key] > 0 ? (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-label={`${counts[key]} o‘qilmagan`} />
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {section === 'SUPPORT' ? (
              <SupportList data={data} activeId={activeId} />
            ) : (
              <ChannelList
                section={section}
                channels={data.channels.filter((c) => c.type === section)}
                discover={section === 'ORGANIZATION' ? data.discover : []}
                activeId={activeId}
                isPlayer={isPlayer}
              />
            )}
          </div>
        </aside>

        <section className={cn('flex min-h-[70dvh] min-w-0 flex-col md:min-h-0', onIndex && 'hidden md:flex')}>{children}</section>
      </div>
    </div>
  )
}

const EMPTY: Record<Exclude<Section, 'SUPPORT'>, { title: string; text: string }> = {
  ORGANIZATION: {
    title: 'Hali hech kimni kuzatmayapsiz',
    text: 'Tashkilotlarning rasmiy e’lonlari — yangi turnirlar, sanalar, qoidalar — shu yerda chiqadi. Pastdan obuna bo‘ling.',
  },
  TOURNAMENT: {
    title: 'Turnir guruhlari yo‘q',
    text: 'Turnirga arizangiz tasdiqlangach, uning guruhiga avtomatik qo‘shilasiz: jadval, e’lonlar va tashkilotchilar bilan muloqot.',
  },
  TEAM: {
    title: 'Jamoa chatlari yo‘q',
    text: 'Har bir jamoangizning yopiq chati shu yerda paydo bo‘ladi.',
  },
}

function ChannelList({
  section,
  channels,
  discover,
  activeId,
  isPlayer,
}: {
  section: Exclude<Section, 'SUPPORT'>
  channels: SidebarChannel[]
  discover: SidebarData['discover']
  activeId: string | null
  isPlayer: boolean
}) {
  const [query, setQuery] = useState('')
  const visible = channels.filter((c) => !query || c.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-4 py-3">
      {channels.length > 5 ? (
        <div className="relative px-4">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qidirish" className="pl-9" aria-label="Suhbatlarni qidirish" />
        </div>
      ) : null}

      {channels.length === 0 ? (
        <div className="space-y-2 px-6 py-8 text-center">
          <p className="text-sm font-medium">{EMPTY[section].title}</p>
          <p className="text-xs text-muted-foreground">{EMPTY[section].text}</p>
          {section === 'TEAM' && isPlayer ? (
            <Button size="sm" variant="outline" asChild className="mt-2">
              <Link href="/teams">Jamoalarim bo‘limiga o‘tish</Link>
            </Button>
          ) : null}
          {section === 'TOURNAMENT' ? (
            <Button size="sm" variant="outline" asChild className="mt-2">
              <Link href="/feed">Turnirlarni ko‘rish</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <ul>
          {visible.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                aria-current={c.id === activeId ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                  c.id === activeId && 'bg-secondary/60'
                )}
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={c.avatar} alt="" />
                  <AvatarFallback>{c.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{c.title}</p>
                    {c.archived ? <Archive className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Arxiv" /> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.lastMessage ?? c.subtitle}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-muted-foreground">{relativeTime(c.lastMessageAt)}</span>
                  <UnreadDot count={c.unreadCount} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {discover.length > 0 ? <Discover items={discover} /> : null}
    </div>
  )
}

function Discover({ items }: { items: SidebarData['discover'] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const follow = (id: string) => {
    setPendingId(id)
    startTransition(async () => {
      const result = await subscribeToChannel(id)
      setPendingId(null)
      if (!result.ok) return void toast.error(result.error)
      toast.success('Obuna bo‘ldingiz')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2 border-t border-border px-4 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tashkilotlarni kuzatish</p>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={item.avatar} alt="" />
            <AvatarFallback>{item.title.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Users className="h-3 w-3" aria-hidden />
              {item.memberCount} obunachi
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1" disabled={pendingId === item.id} onClick={() => follow(item.id)}>
            {pendingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
            Obuna
          </Button>
        </div>
      ))}
    </div>
  )
}

const STATUS_CLASSES: Record<TicketListItem['status'], string> = {
  OPEN: 'bg-primary text-primary-foreground',
  IN_PROGRESS: 'bg-warning text-warning-foreground',
  RESOLVED: 'bg-success text-success-foreground',
  CLOSED: 'bg-muted text-muted-foreground',
}
const STATUS_LABELS: Record<TicketListItem['status'], string> = {
  OPEN: 'Ochiq',
  IN_PROGRESS: 'Jarayonda',
  RESOLVED: 'Hal qilindi',
  CLOSED: 'Yopilgan',
}

function TicketRow({ ticket, activeId, staffView }: { ticket: TicketListItem; activeId: string | null; staffView: boolean }) {
  return (
    <Link
      href={`/messages/support/${ticket.id}`}
      aria-current={ticket.id === activeId ? 'page' : undefined}
      className={cn('block space-y-1 px-4 py-3 transition-colors hover:bg-muted/50', ticket.id === activeId && 'bg-secondary/60')}
    >
      <div className="flex items-center gap-2">
        <p className={cn('min-w-0 flex-1 truncate text-sm', ticket.unread ? 'font-bold' : 'font-medium')}>{ticket.subject}</p>
        <Badge className={cn('shrink-0 text-[10px]', STATUS_CLASSES[ticket.status])}>{STATUS_LABELS[ticket.status]}</Badge>
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {ticket.scope === 'TOURNAMENT' ? `Turnir: ${ticket.tournament?.title ?? '—'}` : 'TourneyUp yordami'}
        {staffView ? ` · ${ticket.requester.name}` : ''} · {relativeTime(ticket.lastMessageAt)}
      </p>
    </Link>
  )
}

function SupportList({ data, activeId }: { data: SidebarData; activeId: string | null }) {
  return (
    <div className="space-y-4 py-3">
      <div className="px-4">
        <Button asChild className="w-full gap-2">
          <Link href="/messages/support/new">
            <Plus className="h-4 w-4" aria-hidden />
            Yangi murojaat
          </Link>
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Texnik muammo, shikoyat yoki savol — TourneyUp jamoasiga yoki aniq turnir supportiga yozing. Murojaatlaringizni faqat
          siz va support xodimlari ko‘radi.
        </p>
      </div>

      {data.staffQueue.length > 0 ? (
        <div>
          <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Javob kutayotganlar (xodim)</p>
          <ul className="divide-y divide-border">
            {data.staffQueue.map((t) => (
              <li key={t.id}>
                <TicketRow ticket={t} activeId={activeId} staffView />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mening murojaatlarim</p>
        {data.myTickets.length === 0 ? (
          <p className="px-4 py-4 text-xs text-muted-foreground">Hali murojaat yo‘q.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.myTickets.map((t) => (
              <li key={t.id}>
                <TicketRow ticket={t} activeId={activeId} staffView={false} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
