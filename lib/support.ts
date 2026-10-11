import type { Prisma, TicketStatus } from '@prisma/client'
import { db } from './db'

/**
 * Plain helpers for the two kinds of support (TASK.md, decision #5).
 * Not server actions — see `lib/support-actions.ts` for the guarded entry
 * points.
 *
 *   PLATFORM    TourneyUp's own support. Answered by super admins.
 *   TOURNAMENT  One tournament's support desk. Answered by that tournament's
 *               organizer side and its live staff (SUPPORT, ADMIN, ORGANIZER)
 *               — only while the tournament runs.
 *
 * A ticket is visible to the person who opened it and to the staff above,
 * nobody else.
 */

// Category and status labels live in the dictionaries (`dict.chat.ticket_category`, `dict.chat.ticket_status`).

const OPEN_TOURNAMENT = { status: { notIn: ['completed', 'cancelled'] } } satisfies Prisma.TournamentWhereInput

/** Tournaments whose support desk this user staffs right now. */
export async function supportedTournamentIds(userId: string): Promise<string[]> {
  const [owned, grants] = await Promise.all([
    db.tournament.findMany({
      where: { ...OPEN_TOURNAMENT, OR: [{ organizerId: userId }, { organization: { ownerId: userId } }] },
      select: { id: true },
    }),
    db.tournamentStaff.findMany({
      where: { userId, revokedAt: null, tournament: OPEN_TOURNAMENT },
      select: { tournamentId: true },
    }),
  ])
  return [...new Set([...owned.map((t) => t.id), ...grants.map((g) => g.tournamentId)])]
}

export type TicketAccess = {
  canRead: boolean
  canReply: boolean
  isStaff: boolean
  isRequester: boolean
  canSetStatus: boolean
}

const NONE: TicketAccess = { canRead: false, canReply: false, isStaff: false, isRequester: false, canSetStatus: false }

export async function getTicketAccess(ticketId: string, userId: string | null | undefined): Promise<TicketAccess> {
  if (!userId) return NONE
  const [ticket, user] = await Promise.all([
    db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { userId: true, scope: true, tournamentId: true, status: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])
  if (!ticket || !user) return NONE

  const isRequester = ticket.userId === userId
  let isStaff = false
  if (user.role === 'SUPER_ADMIN') isStaff = true
  else if (ticket.scope === 'TOURNAMENT' && ticket.tournamentId) {
    isStaff = (await supportedTournamentIds(userId)).includes(ticket.tournamentId)
  }

  if (!isRequester && !isStaff) return NONE
  const closed = ticket.status === 'CLOSED'
  return { canRead: true, canReply: !closed, isStaff, isRequester, canSetStatus: isStaff || isRequester }
}

/** Who should hear about a new ticket or a requester's reply. */
export async function ticketStaffAudience(ticket: { scope: string; tournamentId: string | null }): Promise<string[]> {
  if (ticket.scope === 'PLATFORM' || !ticket.tournamentId) {
    const admins = await db.user.findMany({ where: { role: 'SUPER_ADMIN' }, select: { id: true } })
    return admins.map((a) => a.id)
  }
  const [tournament, staff] = await Promise.all([
    db.tournament.findUnique({
      where: { id: ticket.tournamentId },
      select: { organizerId: true, organization: { select: { ownerId: true } } },
    }),
    db.tournamentStaff.findMany({
      where: { tournamentId: ticket.tournamentId, revokedAt: null },
      select: { userId: true, role: true },
    }),
  ])
  // Support staff first; if the tournament has none, its organizer side answers.
  const support = staff.filter((s) => s.role === 'SUPPORT').map((s) => s.userId)
  if (support.length > 0) return support
  return [
    ...staff.map((s) => s.userId),
    ...(tournament ? [tournament.organizerId, tournament.organization?.ownerId].filter((id): id is string => Boolean(id)) : []),
  ]
}

const ticketSelect = {
  id: true,
  scope: true,
  subject: true,
  category: true,
  status: true,
  lastMessageAt: true,
  userLastReadAt: true,
  staffLastReadAt: true,
  user: { select: { id: true, name: true, avatar: true } },
  tournament: { select: { id: true, title: true } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, isStaff: true } },
} satisfies Prisma.SupportTicketSelect

type TicketRow = Prisma.SupportTicketGetPayload<{ select: typeof ticketSelect }>

export type TicketListItem = {
  id: string
  scope: 'PLATFORM' | 'TOURNAMENT'
  subject: string
  status: TicketStatus
  requester: { id: string; name: string; avatar: string }
  tournament: { id: string; title: string } | null
  lastMessage: string | null
  lastMessageAt: string
  unread: boolean
}

function toItem(row: TicketRow, side: 'user' | 'staff'): TicketListItem {
  const last = row.messages[0]
  const seen = side === 'user' ? row.userLastReadAt : row.staffLastReadAt
  // Unread = the other side wrote after we last looked.
  const fromOtherSide = last ? last.isStaff === (side === 'user') : false
  return {
    id: row.id,
    scope: row.scope,
    subject: row.subject,
    status: row.status,
    requester: row.user,
    tournament: row.tournament,
    lastMessage: last?.content ?? null,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unread: fromOtherSide && (!seen || seen < row.lastMessageAt),
  }
}

export async function listTicketsForRequester(userId: string): Promise<TicketListItem[]> {
  const rows = await db.supportTicket.findMany({
    where: { userId },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
    select: ticketSelect,
  })
  return rows.map((row) => toItem(row, 'user'))
}

/** Tickets this user answers as staff (never their own). */
export async function listStaffQueue(userId: string, role: string): Promise<TicketListItem[]> {
  const tournamentIds = await supportedTournamentIds(userId)
  const or: Prisma.SupportTicketWhereInput[] = []
  if (role === 'SUPER_ADMIN') or.push({ scope: 'PLATFORM' })
  if (tournamentIds.length > 0) or.push({ scope: 'TOURNAMENT', tournamentId: { in: tournamentIds } })
  if (or.length === 0) return []

  const rows = await db.supportTicket.findMany({
    where: { OR: or, userId: { not: userId }, status: { not: 'CLOSED' } },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    select: ticketSelect,
  })
  return rows.map((row) => toItem(row, 'staff'))
}

/** Tournament support lives only as long as the tournament: close what is still open. */
export async function closeTournamentSupport(tournamentId: string) {
  await db.supportTicket.updateMany({
    where: { tournamentId, scope: 'TOURNAMENT', status: { in: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] } },
    data: { status: 'CLOSED' },
  })
}
