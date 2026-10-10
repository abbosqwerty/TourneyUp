'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import { assignStaffSchema, fieldErrors, revokeStaffSchema } from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { notify } from './notifications'
import { STAFF_ROLE_LABELS } from './staff-labels'
import { syncTournamentChannel } from './channels'

/**
 * Grant a temporary, tournament-scoped role to an existing platform user.
 * The target is looked up by username or email — organizations do not get
 * to browse the whole user table.
 */
export async function assignTournamentStaff(
  input: unknown
): Promise<ActionResult<{ userName: string; role: string }>> {
  const actor = await getCurrentUser()
  if (!actor) return fail('Avval tizimga kiring')

  const parsed = assignStaffSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { tournamentId, userQuery, role } = parsed.data

  const ability = await getTournamentAbility(actor.id, tournamentId)
  if (!ability.canManageStaff) return fail('Xodim tayinlash huquqingiz yo‘q')

  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true, organizerId: true, title: true },
    })
    if (!tournament) return fail('Turnir topilmadi')
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return fail('Yopilgan turnirga xodim tayinlab bo‘lmaydi')
    }

    const lookup = userQuery.trim().toLowerCase()
    const target = await db.user.findFirst({
      where: { OR: [{ username: lookup }, { email: lookup }] },
      select: { id: true, name: true, username: true, role: true },
    })
    if (!target) {
      return fail('Bunday foydalanuvchi topilmadi', { userQuery: 'Username yoki email topilmadi' })
    }
    if (target.role !== 'USER') {
      return fail('Faqat oddiy foydalanuvchiga vaqtinchalik rol berish mumkin', {
        userQuery: 'Bu akkaunt tashkilot yoki admin',
      })
    }
    if (target.id === tournament.organizerId) {
      return fail('Tashkilot egasiga alohida rol kerak emas', { userQuery: 'Bu turnir egasi' })
    }

    await db.tournamentStaff.upsert({
      where: { tournamentId_userId: { tournamentId, userId: target.id } },
      update: { role, revokedAt: null, revokeReason: null, grantedById: actor.id, grantedAt: new Date() },
      create: { tournamentId, userId: target.id, role, grantedById: actor.id },
    })

    // Staff join the tournament group with write access.
    await syncTournamentChannel(tournamentId)

    await notify({
      userId: target.id,
      type: 'STAFF_ASSIGNED',
      title: 'Sizga turnir roli berildi',
      body: `“${tournament.title}” turnirida ${STAFF_ROLE_LABELS[role]} rolini oldingiz.`,
      link: '/staff',
    })

    revalidatePath(`/dashboard/tournaments/${tournamentId}/staff`)
    revalidatePath('/staff')
    revalidatePath('/messages')
    return succeedWith({ userName: target.name, role })
  } catch (error) {
    console.error('assignTournamentStaff failed', error)
    return fail('Xodim tayinlashda xatolik')
  }
}

/** Take the grant away before the tournament ends. */
export async function revokeTournamentStaff(input: unknown): Promise<ActionResult> {
  const actor = await getCurrentUser()
  if (!actor) return fail('Avval tizimga kiring')

  const parsed = revokeStaffSchema.safeParse(input)
  if (!parsed.success) return fail('Ma‘lumot noto‘g‘ri')

  try {
    const grant = await db.tournamentStaff.findUnique({
      where: { id: parsed.data.staffId },
      select: { id: true, tournamentId: true, userId: true, revokedAt: true },
    })
    if (!grant) return fail('Tayinlov topilmadi')
    if (grant.revokedAt) return fail('Bu ruxsat allaqachon olib tashlangan')

    const ability = await getTournamentAbility(actor.id, grant.tournamentId)
    if (!ability.canManageStaff) return fail('Huquqingiz yo‘q')

    await db.tournamentStaff.update({
      where: { id: grant.id },
      data: {
        revokedAt: new Date(),
        revokeReason: parsed.data.reason || 'Tashkilot tomonidan olib tashlandi',
      },
    })

    // Out of the group too, unless they also play in this tournament.
    await syncTournamentChannel(grant.tournamentId)

    revalidatePath(`/dashboard/tournaments/${grant.tournamentId}/staff`)
    revalidatePath('/staff')
    revalidatePath('/messages')
    return { ok: true }
  } catch (error) {
    console.error('revokeTournamentStaff failed', error)
    return fail('Ruxsatni olib tashlashda xatolik')
  }
}

/** Typeahead for the assign form — only reachable by staff managers. */
export async function searchAssignableUsers(
  tournamentId: string,
  query: string
): Promise<ActionResult<{ id: string; name: string; username: string; email: string | null; avatar: string }[]>> {
  const actor = await getCurrentUser()
  if (!actor) return fail('Avval tizimga kiring')

  const ability = await getTournamentAbility(actor.id, tournamentId)
  if (!ability.canManageStaff) return fail('Huquqingiz yo‘q')

  const q = query.trim()
  if (q.length < 2) return succeedWith([])

  try {
    const users = await db.user.findMany({
      where: {
        role: 'USER',
        OR: [{ username: { contains: q } }, { name: { contains: q } }, { email: { contains: q } }],
      },
      select: { id: true, name: true, username: true, email: true, avatar: true },
      take: 8,
      orderBy: { username: 'asc' },
    })
    return succeedWith(users)
  } catch (error) {
    console.error('searchAssignableUsers failed', error)
    return fail('Qidiruvda xatolik')
  }
}
