'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ChannelType, PostKind } from '@prisma/client'
import {
  Archive,
  BellOff,
  Building2,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Pin,
  PinOff,
  Send,
  Shirt,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import { AutoRefresh } from '@/components/auto-refresh'
import {
  deleteChannelPost,
  markChannelRead,
  postToChannel,
  subscribeToChannel,
  togglePinPost,
  unsubscribeFromChannel,
} from '@/lib/channel-actions'
import type { ChannelAccess } from '@/lib/channels'
import { TOURNAMENT_STATUS_CLASSES, TOURNAMENT_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export type ThreadPost = {
  id: string
  content: string
  pinned: boolean
  kind: PostKind
  createdAt: string
  mediaUrl: string | null
  author: { id: string; name: string; avatar: string }
  /** "Tashkilotchi", "Kapitan", "Qo‘llab-quvvatlash" … or null for players. */
  authorRole: string | null
}

type ThreadChannel = {
  id: string
  type: ChannelType
  title: string
  handle: string
  description: string
  avatar: string
  archived: boolean
  memberCount: number
  tournament: {
    id: string
    status: keyof typeof TOURNAMENT_STATUS_LABELS
    sport: string
    date: string
    endDate: string | null
    participants: number
    drawn: boolean
  } | null
  team: { id: string; name: string; sport: string } | null
}

const TYPE_META: Record<ChannelType, { label: string; icon: typeof Building2 }> = {
  ORGANIZATION: { label: 'Tashkilot kanali', icon: Building2 },
  TOURNAMENT: { label: 'Turnir guruhi', icon: Trophy },
  TEAM: { label: 'Jamoa chati', icon: Shirt },
}

function time(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ChannelThread({
  channel,
  access,
  posts,
  currentUserId,
}: {
  channel: ThreadChannel
  access: ChannelAccess
  posts: ThreadPost[]
  currentUserId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<UploadedImage | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [announce, setAnnounce] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastPostId = posts[posts.length - 1]?.id

  // Opening (and every new post while open) marks the channel read.
  useEffect(() => {
    void markChannelRead(channel.id)
  }, [channel.id, lastPostId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lastPostId])

  const pinned = posts.filter((post) => post.pinned)
  const meta = TYPE_META[channel.type]
  const TypeIcon = meta.icon

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) =>
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return void toast.error(result.error ?? 'Xatolik')
      onOk?.()
      router.refresh()
    })

  const publish = () => {
    const text = content.trim()
    if (!text) return
    run(
      () => postToChannel({ channelId: channel.id, content: text, mediaId: media?.id ?? '', announce }),
      () => {
        setContent('')
        setMedia(null)
        setShowUploader(false)
        setAnnounce(false)
      }
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AutoRefresh />

      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border p-3 md:p-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 md:hidden">
          <Link href="/messages" aria-label="Orqaga">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={channel.avatar} alt="" />
          <AvatarFallback>{channel.title.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-bold">{channel.title}</h2>
            {channel.tournament ? (
              <Badge className={cn('text-[10px]', TOURNAMENT_STATUS_CLASSES[channel.tournament.status])}>
                {TOURNAMENT_STATUS_LABELS[channel.tournament.status]}
              </Badge>
            ) : null}
            {channel.archived ? (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Archive className="h-2.5 w-2.5" aria-hidden /> Arxiv
              </Badge>
            ) : null}
          </div>
          <p className="flex flex-wrap items-center gap-x-2 truncate text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" aria-hidden />
              {meta.label}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden />
              {channel.memberCount} a’zo
            </span>
            {channel.tournament ? (
              <span>
                {channel.tournament.sport} · {channel.tournament.date}
                {channel.tournament.endDate ? ` – ${channel.tournament.endDate}` : ''} · {channel.tournament.participants} ishtirokchi
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {channel.tournament ? (
            <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex">
              <Link href={channel.tournament.drawn ? `/results/${channel.tournament.id}` : `/tournament/${channel.tournament.id}`}>
                {channel.tournament.drawn ? 'Musobaqa' : 'Turnir'}
              </Link>
            </Button>
          ) : null}
          {channel.team ? (
            <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex">
              <Link href={`/teams/${channel.team.id}`}>Jamoa</Link>
            </Button>
          ) : null}
          {channel.type === 'ORGANIZATION' && access.memberRole !== 'OWNER' ? (
            <Button
              size="sm"
              variant={access.isSubscribed ? 'ghost' : 'default'}
              className="gap-1"
              disabled={isPending}
              onClick={() =>
                run(() => (access.isSubscribed ? unsubscribeFromChannel(channel.id) : subscribeToChannel(channel.id)))
              }
            >
              {access.isSubscribed ? <BellOff className="h-4 w-4" aria-hidden /> : null}
              {access.isSubscribed ? 'Kuzatishni to‘xtatish' : 'Kuzatish'}
            </Button>
          ) : null}
        </div>
      </header>

      {pinned.length > 0 ? (
        <div className="space-y-1 border-b border-primary/20 bg-primary/5 px-4 py-2">
          {pinned.map((post) => (
            <p key={post.id} className="flex items-start gap-2 text-xs">
              <Pin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
              <span className="line-clamp-2">{post.content}</span>
            </p>
          ))}
        </div>
      ) : null}

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:p-4" aria-live="polite">
        {channel.description && posts.length < 3 ? (
          <p className="mx-auto max-w-md text-center text-xs text-muted-foreground">{channel.description}</p>
        ) : null}
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Hali xabar yo‘q.</p>
        ) : (
          posts.map((post) => (
            <PostView
              key={post.id}
              post={post}
              mine={post.author.id === currentUserId}
              canPin={access.canAnnounce}
              canDelete={post.author.id === currentUserId || access.canModerate}
              disabled={isPending}
              onPin={() => run(() => togglePinPost(post.id))}
              onDelete={() => run(() => deleteChannelPost(post.id), () => toast.success('Xabar o‘chirildi'))}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {access.canPost ? (
        <div className="space-y-2 border-t border-border p-3">
          {showUploader ? <ImageUploader value={media} onChange={setMedia} /> : null}
          {access.canAnnounce && channel.type !== 'ORGANIZATION' ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={announce} onCheckedChange={setAnnounce} aria-label="Rasmiy e’lon sifatida yuborish" />
              <Megaphone className="h-3.5 w-3.5" aria-hidden />
              Rasmiy e’lon sifatida (barcha a’zolarga bildirishnoma)
            </label>
          ) : null}
          <div className="flex items-end gap-2">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={channel.type === 'ORGANIZATION' ? 'E’lon yozing…' : 'Xabar yozing…'}
              rows={1}
              maxLength={4000}
              disabled={isPending}
              className="max-h-40 min-h-[44px] resize-none"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  publish()
                }
              }}
              aria-label="Xabar matni"
            />
            <Button
              size="icon"
              variant="outline"
              aria-label="Rasm qo‘shish"
              disabled={isPending}
              onClick={() => setShowUploader((value) => !value)}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" aria-label="Yuborish" disabled={isPending || !content.trim()} onClick={publish}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
          {channel.archived
            ? 'Guruh arxivlangan — xabarlarni o‘qish mumkin, yangi xabar yozilmaydi.'
            : 'Bu kanalda faqat tashkilot rasmiy e’lon beradi.'}
        </p>
      )}
    </div>
  )
}

function PostView({
  post,
  mine,
  canPin,
  canDelete,
  disabled,
  onPin,
  onDelete,
}: {
  post: ThreadPost
  mine: boolean
  canPin: boolean
  canDelete: boolean
  disabled: boolean
  onPin: () => void
  onDelete: () => void
}) {
  if (post.kind === 'SYSTEM') {
    return (
      <p className="mx-auto w-fit max-w-md rounded-full bg-secondary px-3 py-1 text-center text-xs text-muted-foreground">
        {post.content} · {time(post.createdAt)}
      </p>
    )
  }

  const tools =
    canPin || canDelete ? (
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {canPin ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={post.pinned ? 'Qadashni olib tashlash' : 'Qadab qo‘yish'} disabled={disabled} onClick={onPin}>
            {post.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
        ) : null}
        {canDelete ? (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Xabarni o‘chirish" disabled={disabled} onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    ) : null

  const image = post.mediaUrl ? (
    <img src={post.mediaUrl} alt="Xabarga ilova qilingan rasm" loading="lazy" className="mt-2 max-h-80 w-full rounded-lg border border-border object-cover" />
  ) : null

  if (post.kind === 'ANNOUNCEMENT') {
    return (
      <article className="group rounded-xl border border-primary/40 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Rasmiy e’lon</span>
          {post.pinned ? <Pin className="h-3 w-3 text-primary" aria-label="Qadalgan" /> : null}
          <span className="ml-auto text-[11px] text-muted-foreground">{time(post.createdAt)}</span>
          {tools}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
        {image}
        <p className="mt-2 text-xs text-muted-foreground">
          — {post.author.name}
          {post.authorRole ? `, ${post.authorRole}` : ''}
        </p>
      </article>
    )
  }

  return (
    <div className={cn('group flex items-end gap-2', mine && 'flex-row-reverse')}>
      {!mine ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={post.author.avatar} alt="" />
          <AvatarFallback className="text-[10px]">{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2',
          mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-secondary',
          !mine && post.authorRole && 'ring-1 ring-primary/30'
        )}
      >
        {!mine ? (
          <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold">
            {post.author.name}
            {post.authorRole ? (
              <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-medium text-primary">{post.authorRole}</span>
            ) : null}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words text-sm">{post.content}</p>
        {image}
        <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {post.pinned ? '📌 ' : ''}
          {time(post.createdAt)}
        </p>
      </div>
      {tools}
    </div>
  )
}
