'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Headset, LifeBuoy, Loader2, Send, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import type { SupportCategory, TicketStatus } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AutoRefresh } from '@/components/auto-refresh'
import { markTicketRead, replyToTicket, setTicketStatus } from '@/lib/support-actions'
import type { TicketAccess } from '@/lib/support'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/time'
import { useLanguage } from '@/lib/i18n/language-context'

const STATUS: Record<TicketStatus, { className: string }> = {
  OPEN: { className: 'bg-primary text-primary-foreground' },
  IN_PROGRESS: { className: 'bg-warning text-warning-foreground' },
  RESOLVED: { className: 'bg-success text-success-foreground' },
  CLOSED: { className: 'bg-muted text-muted-foreground' },
}

type Message = {
  id: string
  content: string
  isStaff: boolean
  createdAt: string
  author: { id: string; name: string; avatar: string }
}

export function TicketThread({
  ticket,
  messages,
  access,
  currentUserId,
}: {
  ticket: {
    id: string
    scope: 'PLATFORM' | 'TOURNAMENT'
    subject: string
    category: SupportCategory
    status: TicketStatus
    createdAt: string
    requester: { id: string; name: string }
    tournament: { id: string; title: string } | null
  }
  messages: Message[]
  access: TicketAccess
  currentUserId: string
}) {
  const { dict, locale } = useLanguage()
  const t = dict.chat.ticket
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastId = messages[messages.length - 1]?.id

  useEffect(() => {
    void markTicketRead(ticket.id)
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [ticket.id, lastId])

  const send = () => {
    const text = content.trim()
    if (!text) return
    startTransition(async () => {
      const result = await replyToTicket({ ticketId: ticket.id, content: text })
      if (!result.ok) return void toast.error(result.error)
      setContent('')
      router.refresh()
    })
  }

  const changeStatus = (status: TicketStatus) =>
    startTransition(async () => {
      const result = await setTicketStatus({ ticketId: ticket.id, status })
      if (!result.ok) return void toast.error(result.error)
      toast.success(t.status_updated)
      router.refresh()
    })

  const ScopeIcon = ticket.scope === 'TOURNAMENT' ? Trophy : LifeBuoy

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AutoRefresh />
      <header className="flex items-center gap-3 border-b border-border p-3 md:p-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 md:hidden">
          <Link href="/messages" aria-label={t.back}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-bold">{ticket.subject}</h2>
            <Badge className={cn('text-[10px]', STATUS[ticket.status].className)}>{dict.chat.ticket_status[ticket.status]}</Badge>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ScopeIcon className="h-3 w-3" aria-hidden />
              {ticket.scope === 'TOURNAMENT' ? t.tournament_support(ticket.tournament?.title ?? '') : t.platform}
            </span>
            <span>{dict.chat.ticket_category[ticket.category]}</span>
            {access.isStaff && !access.isRequester ? <span>{t.requester(ticket.requester.name)}</span> : null}
          </p>
        </div>
        {access.isStaff && !access.isRequester ? (
          <Select value={ticket.status} onValueChange={(v) => changeStatus(v as TicketStatus)} disabled={isPending}>
            <SelectTrigger size="sm" className="w-40" aria-label={t.status_label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS) as TicketStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {dict.chat.ticket_status[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : access.isRequester && ticket.status !== 'CLOSED' ? (
          <Button size="sm" variant="ghost" disabled={isPending} onClick={() => changeStatus('CLOSED')}>
            {t.close}
          </Button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:p-4">
        {messages.map((m) => {
          const mine = m.author.id === currentUserId
          return (
            <div key={m.id} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
              {!mine ? (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={m.author.avatar} alt="" />
                  <AvatarFallback className="text-[10px]">{m.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : null}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2',
                  mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-secondary',
                  !mine && m.isStaff && 'ring-1 ring-primary/40'
                )}
              >
                {!mine ? (
                  <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold">
                    {m.author.name}
                    {m.isStaff ? (
                      <span className="flex items-center gap-1 rounded bg-primary/15 px-1.5 py-px text-[10px] font-medium text-primary">
                        <Headset className="h-2.5 w-2.5" aria-hidden />
                        {t.support_badge}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {formatDateTime(m.createdAt, locale)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {access.canReply ? (
        <div className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={access.isStaff && !access.isRequester ? t.placeholder_staff : t.placeholder_user}
            rows={1}
            maxLength={4000}
            disabled={isPending}
            className="max-h-40 min-h-[44px] resize-none"
            aria-label={t.message_label}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
          />
          <Button size="icon" aria-label={t.send} disabled={isPending || !content.trim()} onClick={send}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
          {t.closed}{' '}
          {access.isRequester ? (
            <Link href="/messages/support/new" className="font-medium text-primary hover:underline">
              {t.open_new}
            </Link>
          ) : null}
        </p>
      )}
    </div>
  )
}
