'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser } from './session'
import { createTicketSchema, fieldErrors, replyTicketSchema, ticketStatusSchema } from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { guard, minutes } from './rate-limit'
import { notifyManyKey } from './notifications'
import { getI18n } from './i18n/server'
import { getTicketAccess, ticketStaffAudience } from './support'

function revalidateSupport(ticketId?: string) {
  revalidatePath('/messages', 'layout')
  if (ticketId) revalidatePath(`/messages/support/${ticketId}`)
}

/** Open a ticket with TourneyUp support or with one tournament's support desk. */
export async function createTicket(input: unknown): Promise<ActionResult<{ ticketId: string }>> {
  const { dict, locale } = await getI18n()
  const e = dict.chat.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const limited = guard(`support-ticket:${user.id}`, 10, minutes(60), locale)
  if (limited) return limited

  const parsed = createTicketSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  const { scope, tournamentId, category, subject, content } = parsed.data

  try {
    let tournament: { id: string; title: string } | null = null
    if (scope === 'TOURNAMENT') {
      tournament = await db.tournament.findFirst({
        where: { id: tournamentId, status: { notIn: ['completed', 'cancelled'] } },
        select: { id: true, title: true },
      })
      if (!tournament) {
        return fail(e.ticket_tournament_closed, {
          tournamentId: e.pick_active_tournament,
        })
      }
    }

    const now = new Date()
    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        scope,
        tournamentId: tournament?.id ?? null,
        category,
        subject,
        lastMessageAt: now,
        userLastReadAt: now,
        messages: { create: { authorId: user.id, content, isStaff: false } },
      },
      select: { id: true, scope: true, tournamentId: true },
    })

    const audience = (await ticketStaffAudience(ticket)).filter((id) => id !== user.id)
    const link = `/messages/support/${ticket.id}`
    if (tournament) {
      await notifyManyKey(audience, {
        type: 'SUPPORT_REPLY',
        key: 'support_new_ticket_tournament',
        params: { tournament: tournament.title, subject },
        link,
      })
    } else {
      await notifyManyKey(audience, { type: 'SUPPORT_REPLY', key: 'support_new_ticket', params: { subject }, link })
    }

    revalidateSupport(ticket.id)
    return succeedWith({ ticketId: ticket.id })
  } catch (error) {
    console.error('createTicket failed', error)
    return fail(e.ticket_send_failed)
  }
}

export async function replyToTicket(input: unknown): Promise<ActionResult> {
  const { dict, locale } = await getI18n()
  const e = dict.chat.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = replyTicketSchema.safeParse(input)
  if (!parsed.success) return fail(e.message_invalid, fieldErrors(parsed.error, dict))
  const { ticketId, content } = parsed.data

  const limited = guard(`support-reply:${user.id}`, 60, minutes(10), locale)
  if (limited) return limited

  const access = await getTicketAccess(ticketId, user.id)
  if (!access.canRead) return fail(e.ticket_not_found)
  if (!access.canReply) return fail(e.ticket_closed)

  try {
    // Someone replying for the desk counts as staff even on their own ticket only if they are not the requester.
    const asStaff = access.isStaff && !access.isRequester
    const now = new Date()
    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: now,
        ...(asStaff ? { staffLastReadAt: now } : { userLastReadAt: now }),
        // A staff reply moves a new ticket along; a requester reply reopens a resolved one.
        ...(asStaff ? {} : { status: 'OPEN' }),
        messages: { create: { authorId: user.id, content, isStaff: asStaff } },
      },
      select: { id: true, userId: true, subject: true, scope: true, tournamentId: true, status: true },
    })
    if (asStaff && ticket.status === 'OPEN') {
      await db.supportTicket.update({ where: { id: ticketId }, data: { status: 'IN_PROGRESS' } })
    }

    const audience = asStaff ? [ticket.userId] : await ticketStaffAudience(ticket)
    await notifyManyKey(
      audience.filter((id) => id !== user.id),
      {
        type: 'SUPPORT_REPLY',
        key: asStaff ? 'support_staff_reply' : 'support_user_reply',
        params: { subject: ticket.subject, excerpt: content.slice(0, 120) },
        link: `/messages/support/${ticket.id}`,
      }
    )

    revalidateSupport(ticketId)
    return { ok: true }
  } catch (error) {
    console.error('replyToTicket failed', error)
    return fail(e.send_failed)
  }
}

/** Staff move a ticket through its states; the requester may only close or reopen their own. */
export async function setTicketStatus(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const e = dict.chat.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = ticketStatusSchema.safeParse(input)
  if (!parsed.success) return fail(e.status_invalid)
  const { ticketId, status } = parsed.data

  const access = await getTicketAccess(ticketId, user.id)
  if (!access.canSetStatus) return fail(e.no_permission)
  if (!access.isStaff && !['CLOSED', 'OPEN'].includes(status)) return fail(e.status_staff_only)

  const current = await db.supportTicket.findUniqueOrThrow({
    where: { id: ticketId },
    select: { status: true, scope: true, tournament: { select: { status: true } } },
  })
  if (status === 'OPEN' && current.scope === 'TOURNAMENT' && ['completed', 'cancelled'].includes(current.tournament?.status ?? '')) {
    return fail(e.ticket_cannot_reopen)
  }

  await db.supportTicket.update({ where: { id: ticketId }, data: { status } })
  revalidateSupport(ticketId)
  return { ok: true }
}

export async function markTicketRead(ticketId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: true }
  const access = await getTicketAccess(ticketId, user.id)
  if (!access.canRead) return { ok: true }
  await db.supportTicket.update({
    where: { id: ticketId },
    data: access.isRequester ? { userLastReadAt: new Date() } : { staffLastReadAt: new Date() },
  })
  return { ok: true }
}
