'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Archive, Building2, Hash, Loader2, Plus, Search, Trophy, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { subscribeToChannel } from '@/lib/channel-actions'
import { cn } from '@/lib/utils'

export type ChannelListItem = {
  id: string
  type: 'ORGANIZATION' | 'TOURNAMENT'
  title: string
  handle: string
  avatar: string
  archived: boolean
  memberRole: 'OWNER' | 'STAFF' | 'SUBSCRIBER'
  organization: { id: string; name: string; slug: string } | null
  tournament: { id: string; title: string; status: string; sport: string } | null
  lastMessage: string | null
  lastMessageAt: string | null
  lastAuthor: string | null
  unreadCount: number
}

type DiscoverItem = {
  id: string
  title: string
  handle: string
  avatar: string
  description: string
  memberCount: number
}

function relativeTime(iso: string | null) {
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

/**
 * Telegram-style channel list: organizations and tournaments broadcast,
 * members read. There is no user-to-user messaging here by design.
 */
export function ChannelsClient({
  channels,
  discover,
}: {
  channels: ChannelListItem[]
  discover: DiscoverItem[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ORGANIZATION' | 'TOURNAMENT'>('ALL')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return channels
      .filter((channel) => (filter === 'ALL' ? true : channel.type === filter))
      .filter((channel) => (q ? channel.title.toLowerCase().includes(q) || channel.handle.includes(q) : true))
  }, [channels, filter, query])

  const join = (channelId: string) => {
    setJoiningId(channelId)
    startTransition(async () => {
      const result = await subscribeToChannel(channelId)
      setJoiningId(null)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Kanalga obuna bo‘ldingiz')
      router.refresh()
    })
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6 theme-msg bg-background text-foreground">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Kanallar</h1>
        <p className="text-sm text-muted-foreground">
          Tashkilotlar va turnirlar e‘lonlari. Bu shaxsiy chat emas — faqat tashkilot va turnir xodimlari
          yozadi.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kanal nomi yoki @handle"
            className="pl-9"
            aria-label="Kanallarni qidirish"
          />
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
          <TabsList>
            <TabsTrigger value="ALL">Hammasi</TabsTrigger>
            <TabsTrigger value="ORGANIZATION">Tashkilotlar</TabsTrigger>
            <TabsTrigger value="TOURNAMENT">Turnirlar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-12 text-center">
            <Hash className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">Kanal topilmadi</p>
            <p className="text-sm text-muted-foreground">
              Turnirga yozilganingizda yoki tashkilotga obuna bo‘lganingizda kanallar shu yerda chiqadi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {visible.map((channel) => (
              <li key={channel.id}>
                <Link
                  href={`/messages/${channel.id}`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={channel.avatar} alt={`${channel.title} avatari`} />
                      <AvatarFallback>{channel.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background',
                        channel.type === 'ORGANIZATION' ? 'bg-primary' : 'bg-accent'
                      )}
                      aria-hidden
                    >
                      {channel.type === 'ORGANIZATION' ? (
                        <Building2 className="h-2.5 w-2.5 text-primary-foreground" />
                      ) : (
                        <Trophy className="h-2.5 w-2.5 text-accent-foreground" />
                      )}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{channel.title}</p>
                      {channel.memberRole !== 'SUBSCRIBER' ? (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {channel.memberRole === 'OWNER' ? 'Egasi' : 'Xodim'}
                        </Badge>
                      ) : null}
                      {channel.archived ? (
                        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                          <Archive className="h-2.5 w-2.5" aria-hidden />
                          Arxiv
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {channel.lastMessage
                        ? `${channel.lastAuthor ? `${channel.lastAuthor}: ` : ''}${channel.lastMessage}`
                        : 'Hali e‘lon yo‘q'}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">{relativeTime(channel.lastMessageAt)}</span>
                    {channel.unreadCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                        {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {discover.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tashkilot kanallariga obuna bo‘lish</CardTitle>
            <CardDescription>Turnir e‘lonlarini birinchi bo‘lib olish uchun obuna bo‘ling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {discover.map((channel) => (
              <div key={channel.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={channel.avatar} alt={`${channel.title} avatari`} />
                  <AvatarFallback>{channel.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{channel.title}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Users className="h-3 w-3" aria-hidden />
                    {channel.memberCount} obunachi · @{channel.handle}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-2"
                  disabled={isPending && joiningId === channel.id}
                  onClick={() => join(channel.id)}
                >
                  {isPending && joiningId === channel.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden />
                  )}
                  Obuna
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

