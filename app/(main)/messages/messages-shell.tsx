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
import { formatDayMonth } from '@/lib/time'
import { useLanguage } from '@/lib/i18n/language-context'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/types'
import { renderSystemPost } from '@/lib/stored-text'

export type SidebarChannel = {
  id: string
  type: ChannelType
  title: string
  avatar: string
  archived: boolean
  memberRole: ChannelMemberRole
  handle: string
  /** Sport as entered for the tournament/team (user content). */
  sport: string
  /** Team groups only. */
  memberCount: number | null
  lastMessage: string | null
  lastAuthor: string | null
  /** The last post is a site-generated SYSTEM line (translated on render). */
  lastSystem: boolean
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

const SECTIONS: { key: Section; label: 'organizations' | 'tournaments' | 'teams' | 'support'; icon: typeof Building2 }[] = [
  { key: 'ORGANIZATION', label: 'organizations', icon: Building2 },
  { key: 'TOURNAMENT', label: 'tournaments', icon: Trophy },
  { key: 'TEAM', label: 'teams', icon: Shirt },
  { key: 'SUPPORT', label: 'support', icon: LifeBuoy },
]

export function relativeTime(iso: string | null, dict: Dictionary, locale: Locale) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return dict.relative.now
  if (minutes < 60) return dict.relative.minutes(minutes)
  const hours = Math.round(minutes / 60)
  if (hours < 24) return dict.relative.hours(hours)
  const days = Math.round(hours / 24)
  if (days < 7) return dict.relative.days(days)
  return formatDayMonth(iso, locale)
}

function channelSubtitle(c: SidebarChannel, dict: Dictionary) {
  if (c.type === 'TOURNAMENT') return c.sport
  if (c.type === 'TEAM') return `${c.sport} · ${dict.chat.shell.members(c.memberCount ?? 0)}`
  return `@${c.handle}`
}

function channelPreview(c: SidebarChannel, dict: Dictionary) {
  if (!c.lastMessage) return null
  const text = c.lastSystem ? renderSystemPost(c.lastMessage, dict) : c.lastMessage
  return `${c.lastAuthor ? `${c.lastAuthor}: ` : ''}${text}`
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
  const { dict } = useLanguage()
  const t = dict.chat.shell
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
    <div className={cn('theme-msg container mx-auto max-w-6xl bg-background px-0 text-foreground md:px-4 md:py-4', !onIndex && 'max-md:-mb-4')}>
      {/* On phones an open conversation fills exactly the space between the
          top bar and the fixed bottom nav (4rem + 1px border each, plus safe area); the -mb-4
          cancels the extra 1rem of the layout's pb-20 so the composer sits on the nav. */}
      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)] md:h-[calc(100dvh-7.5rem)] md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] md:overflow-hidden md:rounded-2xl md:border md:border-border',
          !onIndex && 'h-[calc(100dvh-8rem-2px-env(safe-area-inset-bottom))] overflow-hidden md:h-[calc(100dvh-7.5rem)]'
        )}
      >
        <aside className={cn('flex min-h-0 min-w-0 flex-col border-border md:border-r', !onIndex && 'hidden md:flex')}>
          <div className="space-y-3 border-b border-border p-4">
            <h1 className="text-xl font-bold">{t.title}</h1>
            <nav className="grid grid-cols-4 gap-1 rounded-xl bg-secondary/60 p-1" aria-label={t.sections_label}>
              {SECTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChosen(key)}
                  aria-pressed={section === key}
                  className={cn(
                    'relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors',
                    section === key ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="max-w-full truncate" title={t[label]}>{t[label]}{sectionCounts[key] > 0 ? ` (${sectionCounts[key]})` : ''}</span>
                  {counts[key] > 0 ? (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-label={t.unread(counts[key])} />
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

        <section className={cn('flex min-h-0 min-w-0 flex-col', onIndex && 'hidden md:flex')}>{children}</section>
      </div>
    </div>
  )
}

const EMPTY_KEY: Record<Exclude<Section, 'SUPPORT'>, 'organization' | 'tournament' | 'team'> = {
  ORGANIZATION: 'organization',
  TOURNAMENT: 'tournament',
  TEAM: 'team',
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
  const { dict, locale } = useLanguage()
  const t = dict.chat.shell
  const empty = EMPTY_KEY[section]
  const [query, setQuery] = useState('')
  const visible = channels.filter((c) => !query || c.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-4 py-3">
      {channels.length > 5 ? (
        <div className="relative px-4">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="pl-9" aria-label={t.search_label} />
        </div>
      ) : null}

      {channels.length === 0 ? (
        <div className="space-y-2 px-6 py-8 text-center">
          <p className="text-sm font-medium">{dict.chat.empty[`${empty}_title`]}</p>
          <p className="text-xs text-muted-foreground">{dict.chat.empty[`${empty}_text`]}</p>
          {section === 'TEAM' && isPlayer ? (
            <Button size="sm" variant="outline" asChild className="mt-2">
              <Link href="/teams">{t.go_teams}</Link>
            </Button>
          ) : null}
          {section === 'TOURNAMENT' ? (
            <Button size="sm" variant="outline" asChild className="mt-2">
              <Link href="/feed">{t.browse_tournaments}</Link>
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
                    {c.archived ? <Archive className="h-3 w-3 shrink-0 text-muted-foreground" aria-label={t.archive} /> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{channelPreview(c, dict) ?? channelSubtitle(c, dict)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-muted-foreground">{relativeTime(c.lastMessageAt, dict, locale)}</span>
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
  const { dict } = useLanguage()
  const t = dict.chat.shell
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const follow = (id: string) => {
    setPendingId(id)
    startTransition(async () => {
      const result = await subscribeToChannel(id)
      setPendingId(null)
      if (!result.ok) return void toast.error(result.error)
      toast.success(t.subscribed)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2 border-t border-border px-4 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.follow_title}</p>
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
              {t.subscribers(item.memberCount)}
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1" disabled={pendingId === item.id} onClick={() => follow(item.id)}>
            {pendingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
            {t.subscribe}
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
function TicketRow({ ticket, activeId, staffView }: { ticket: TicketListItem; activeId: string | null; staffView: boolean }) {
  const { dict, locale } = useLanguage()
  const t = dict.chat.support_list
  return (
    <Link
      href={`/messages/support/${ticket.id}`}
      aria-current={ticket.id === activeId ? 'page' : undefined}
      className={cn('block space-y-1 px-4 py-3 transition-colors hover:bg-muted/50', ticket.id === activeId && 'bg-secondary/60')}
    >
      <div className="flex items-center gap-2">
        <p className={cn('min-w-0 flex-1 truncate text-sm', ticket.unread ? 'font-bold' : 'font-medium')}>{ticket.subject}</p>
        <Badge className={cn('shrink-0 text-[10px]', STATUS_CLASSES[ticket.status])}>{dict.chat.ticket_status[ticket.status]}</Badge>
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {ticket.scope === 'TOURNAMENT' ? t.tournament(ticket.tournament?.title ?? '—') : t.platform}
        {staffView ? ` · ${ticket.requester.name}` : ''} · {relativeTime(ticket.lastMessageAt, dict, locale)}
      </p>
    </Link>
  )
}

function SupportList({ data, activeId }: { data: SidebarData; activeId: string | null }) {
  const { dict } = useLanguage()
  const t = dict.chat.support_list
  return (
    <div className="space-y-4 py-3">
      <div className="px-4">
        <Button asChild className="w-full gap-2">
          <Link href="/messages/support/new">
            <Plus className="h-4 w-4" aria-hidden />
            {t.new_ticket}
          </Link>
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">{t.intro}</p>
      </div>

      {data.staffQueue.length > 0 ? (
        <div>
          <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.staff_queue}</p>
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
        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.mine}</p>
        {data.myTickets.length === 0 ? (
          <p className="px-4 py-4 text-xs text-muted-foreground">{t.none}</p>
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
