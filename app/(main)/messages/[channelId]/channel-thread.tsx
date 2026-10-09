'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Archive,
  BellOff,
  Building2,
  Image as ImageIcon,
  Loader2,
  Pin,
  PinOff,
  Send,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import {
  deleteChannelPost,
  markChannelRead,
  postToChannel,
  subscribeToChannel,
  togglePinPost,
  unsubscribeFromChannel,
} from '@/lib/channel-actions'

type Post = {
  id: string
  content: string
  pinned: boolean
  createdAt: string
  mediaUrl: string | null
  author: { id: string; name: string; avatar: string }
}

type Channel = {
  id: string
  type: 'ORGANIZATION' | 'TOURNAMENT'
  title: string
  handle: string
  description: string
  avatar: string
  archived: boolean
  memberCount: number
  organization: { id: string; name: string; slug: string } | null
  tournament: { id: string; title: string; status: string; sport: string; date: string } | null
}

type Access = {
  canPost: boolean
  memberRole: 'OWNER' | 'STAFF' | 'SUBSCRIBER' | null
  isSubscribed: boolean
}

export function ChannelThread({
  channel,
  access,
  posts,
  currentUserId,
}: {
  channel: Channel
  access: Access
  posts: Post[]
  currentUserId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<UploadedImage | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mark read once on open, then keep the view pinned to the newest post.
  useEffect(() => {
    void markChannelRead(channel.id)
  }, [channel.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [posts.length])

  const pinned = posts.filter((post) => post.pinned)

  const publish = () => {
    const text = content.trim()
    if (!text) {
      toast.error('Xabar bo‘sh bo‘lmasin')
      return
    }

    startTransition(async () => {
      const result = await postToChannel({ channelId: channel.id, content: text, mediaId: media?.id ?? '' })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setContent('')
      setMedia(null)
      setShowUploader(false)
      router.refresh()
    })
  }

  const remove = (postId: string) => {
    startTransition(async () => {
      const result = await deleteChannelPost(postId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Xabar o‘chirildi')
      router.refresh()
    })
  }

  const pin = (postId: string) => {
    startTransition(async () => {
      const result = await togglePinPost(postId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  const toggleSubscription = () => {
    startTransition(async () => {
      const result = access.isSubscribed
        ? await unsubscribeFromChannel(channel.id)
        : await subscribeToChannel(channel.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(access.isSubscribed ? 'Obuna bekor qilindi' : 'Obuna bo‘ldingiz')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Channel header */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={channel.avatar} alt={`${channel.title} avatari`} />
            <AvatarFallback>{channel.title.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold">{channel.title}</h1>
              <Badge variant="outline" className="gap-1 text-[10px]">
                {channel.type === 'ORGANIZATION' ? (
                  <>
                    <Building2 className="h-2.5 w-2.5" aria-hidden /> Tashkilot
                  </>
                ) : (
                  <>
                    <Trophy className="h-2.5 w-2.5" aria-hidden /> Turnir
                  </>
                )}
              </Badge>
              {channel.archived ? (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Archive className="h-2.5 w-2.5" aria-hidden /> Arxiv
                </Badge>
              ) : null}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" aria-hidden />
              {channel.memberCount} a‘zo · @{channel.handle}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            {channel.tournament ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/tournament/${channel.tournament.id}`}>Turnir</Link>
              </Button>
            ) : null}
            {access.memberRole !== 'OWNER' ? (
              <Button
                size="sm"
                variant={access.isSubscribed ? 'ghost' : 'default'}
                className="gap-2"
                disabled={isPending}
                onClick={toggleSubscription}
              >
                {access.isSubscribed ? <BellOff className="h-4 w-4" aria-hidden /> : null}
                {access.isSubscribed ? 'Obunani bekor qilish' : 'Obuna bo‘lish'}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {channel.description ? (
        <p className="px-1 text-sm text-muted-foreground">{channel.description}</p>
      ) : null}

      {pinned.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-2 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Pin className="h-3 w-3" aria-hidden />
              Qadab qo‘yilgan
            </p>
            {pinned.map((post) => (
              <p key={post.id} className="text-sm">
                {post.content}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Bu kanalda hali e‘lon yo‘q.
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className={post.pinned ? 'border-primary/30' : undefined}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={post.author.avatar} alt={`${post.author.name} avatari`} />
                    <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold">{post.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString('uz-UZ', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {post.pinned ? <Pin className="h-3 w-3 text-primary" aria-label="Qadalgan" /> : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                  </div>

                  {access.canPost || post.author.id === currentUserId ? (
                    <div className="flex shrink-0 gap-1">
                      {access.canPost ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={post.pinned ? 'Qadashni olib tashlash' : 'Qadab qo‘yish'}
                          disabled={isPending}
                          onClick={() => pin(post.id)}
                        >
                          {post.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        aria-label="Xabarni o‘chirish"
                        disabled={isPending}
                        onClick={() => remove(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                {post.mediaUrl ? (
                   
                  <img
                    src={post.mediaUrl}
                    alt="E‘longa ilova qilingan rasm"
                    loading="lazy"
                    className="max-h-96 w-full rounded-lg border border-border object-cover"
                  />
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer — broadcast only */}
      {access.canPost ? (
        <Card className="sticky bottom-20 md:bottom-4">
          <CardContent className="space-y-3 p-4">
            {showUploader ? <ImageUploader value={media} onChange={setMedia} /> : null}

            <div className="flex items-end gap-2">
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="E‘lon yozing…"
                rows={2}
                maxLength={4000}
                disabled={isPending}
                className="min-h-[52px] resize-none"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    publish()
                  }
                }}
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
              <Button size="icon" aria-label="Yuborish" disabled={isPending} onClick={publish}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter bilan yuboriladi</p>
          </CardContent>
        </Card>
      ) : channel.archived ? (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
          Turnir yopilgan — kanal arxivlandi, yangi e‘lon yozilmaydi.
        </p>
      ) : (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
          Bu kanalda faqat tashkilot va tayinlangan xodimlar yozadi.
        </p>
      )}
    </div>
  )
}
