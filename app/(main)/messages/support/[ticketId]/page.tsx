import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getTicketAccess } from '@/lib/support'
import { getI18n } from '@/lib/i18n/server'
import { TicketThread } from './ticket-thread'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.chat.meta.ticket, robots: { index: false } }
}

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/messages/support/${ticketId}`)}`)

  // Private to the requester and the support staff — anyone else gets a 404.
  const access = await getTicketAccess(ticketId, user.id)
  if (!access.canRead) notFound()

  const ticket = await db.supportTicket.findUniqueOrThrow({
    where: { id: ticketId },
    select: {
      id: true,
      scope: true,
      subject: true,
      category: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      tournament: { select: { id: true, title: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: { id: true, content: true, isStaff: true, createdAt: true, author: { select: { id: true, name: true, avatar: true } } },
      },
    },
  })

  return (
    <TicketThread
      ticket={{
        id: ticket.id,
        scope: ticket.scope,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        requester: ticket.user,
        tournament: ticket.tournament,
      }}
      messages={ticket.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      access={access}
      currentUserId={user.id}
    />
  )
}
