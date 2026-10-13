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
  Download,
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
import { useLanguage } from '@/lib/i18n/language-context'
import { renderSystemPost } from '@/lib/stored-text'
import { formatBytes } from '@/lib/media'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/time'
import { sportLabel } from '@/lib/sports'

export type ThreadPost = {
  id: string
  content: string
  pinned: boolean
  kind: PostKind
  createdAt: string
  mediaUrl: string | null
  media: { byteSize: number; width: number | null; height: number | null } | null
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

const TYPE_META: Record<ChannelType, { label: 'type_organization' | 'type_tournament' | 'type_team'; icon: typeof Building2 }> = {
  ORGANIZATION: { label: 'type_organization', icon: Building2 },
  TOURNAMENT: { label: 'type_tournament', icon: Trophy },
  TEAM: { label: 'type_team', icon: Shirt },
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
  const { dict, locale } = useLanguage()
  const t = dict.chat.thread
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
      if (!result.ok) return void toast.error(result.error ?? t.error)
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
          <Link href="/messages" aria-label={t.back}>
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
                {dict.status[channel.tournament.status]}
              </Badge>
            ) : null}
            {channel.archived ? (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Archive className="h-2.5 w-2.5" aria-hidden /> {t.archive}
              </Badge>
            ) : null}
          </div>
          <p className="flex flex-wrap items-center gap-x-2 truncate text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" aria-hidden />
              {t[meta.label]}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden />
              {t.members(channel.memberCount)}
            </span>
            {channel.tournament ? (
              <span>
                {sportLabel(dict, channel.tournament.sport)} · {formatDate(channel.tournament.date, locale)}
                {channel.tournament.endDate ? ` – ${formatDate(channel.tournament.endDate, locale)}` : ''} · {t.participants(channel.tournament.participants)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {channel.tournament ? (
            <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex">
              <Link href={channel.tournament.drawn ? `/results/${channel.tournament.id}` : `/tournament/${channel.tournament.id}`}>
                {channel.tournament.drawn ? t.competition : t.tournament}
              </Link>
            </Button>
          ) : null}
          {channel.team ? (
            <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex">
              <Link href={`/teams/${channel.team.id}`}>{t.team}</Link>
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
              {access.isSubscribed ? t.unfollow : t.follow}
            </Button>
          ) : null}
        </div>
      </header>

      {pinned.length > 0 ? (
        <div className="space-y-1 border-b border-primary/20 bg-primary/5 px-4 py-2">
          {pinned.map((post) => (
            <p key={post.id} className="flex items-start gap-2 text-xs">
              <Pin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
              <span className="line-clamp-2">{post.kind === 'SYSTEM' ? renderSystemPost(post.content, dict) : post.content}</span>
            </p>
          ))}
        </div>
      ) : null}

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:p-4" aria-live="polite">
        {channel.description && posts.length < 3 ? (
          <p className="mx-auto max-w-md text-center text-xs text-muted-foreground">
            {channel.team && channel.description === `${channel.team.sport} jamoasi` ? t.team_description(sportLabel(dict, channel.team.sport)) : channel.description}
          </p>
        ) : null}
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t.no_posts}</p>
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
              onDelete={() => run(() => deleteChannelPost(post.id), () => toast.success(t.post_deleted))}
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
              <Switch checked={announce} onCheckedChange={setAnnounce} aria-label={t.announce_label} />
              <Megaphone className="h-3.5 w-3.5" aria-hidden />
              {t.announce_hint}
            </label>
          ) : null}
          <div className="flex items-end gap-2">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={channel.type === 'ORGANIZATION' ? t.placeholder_announcement : t.placeholder_message}
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
              aria-label={t.message_label}
            />
            <Button
              size="icon"
              variant="outline"
              aria-label={t.add_image}
              disabled={isPending}
              onClick={() => setShowUploader((value) => !value)}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" aria-label={t.send} disabled={isPending || !content.trim()} onClick={publish}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
          {channel.archived ? t.archived_notice : t.announce_only_notice}
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
  const { dict, locale } = useLanguage()
  const t = dict.chat.thread
  const time = (iso: string) => formatDateTime(iso, locale)

  if (post.kind === 'SYSTEM') {
    return (
      <p className="mx-auto w-fit max-w-md rounded-full bg-secondary px-3 py-1 text-center text-xs text-muted-foreground">
        {renderSystemPost(post.content, dict)} · {time(post.createdAt)}
      </p>
    )
  }

  const tools =
    canPin || canDelete ? (
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100">
        {canPin ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={post.pinned ? t.unpin : t.pin} disabled={disabled} onClick={onPin}>
            {post.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
        ) : null}
        {canDelete ? (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label={t.delete} disabled={disabled} onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    ) : null

  const image = post.mediaUrl ? <ChatImage src={post.mediaUrl} media={post.media} /> : null

  if (post.kind === 'ANNOUNCEMENT') {
    return (
      <article className="group rounded-xl border border-primary/40 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{t.official_announcement}</span>
          {post.pinned ? <Pin className="h-3 w-3 text-primary" aria-label={t.pinned} /> : null}
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

/**
 * Telegram-style attachment: a blurred tiny preview until the viewer taps it,
 * then the full image downloads and fades in. Images always start closed.
 */
function ChatImage({ src, media }: { src: string; media: ThreadPost['media'] }) {
  const { dict } = useLanguage()
  const t = dict.chat.thread
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const ratio = media?.width && media?.height ? `${media.width} / ${media.height}` : '4 / 3'

  return (
    <div
      className="relative mt-2 max-h-80 w-full min-w-48 overflow-hidden rounded-lg border border-border bg-muted"
      style={{ aspectRatio: ratio }}
    >
      <img src={`${src}?thumb=1`} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl" />
      {open ? (
        <img
          src={src}
          alt={t.image_alt}
          onLoad={() => setLoaded(true)}
          className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : null}
      {!open || !loaded ? (
        <button
          type="button"
          disabled={open}
          aria-label={t.image_open}
          onClick={() => {
            setOpen(true)
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {open ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {media ? formatBytes(media.byteSize) : null}
          </span>
        </button>
      ) : null}
    </div>
  )
}
