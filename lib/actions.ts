'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import {
  createTournamentSchema,
  fieldErrors,
  participantStatusSchema,
  registerParticipantSchema,
  setTournamentStatusSchema,
  updateTournamentSchema,
} from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { TOURNAMENT_STATUS_LABELS } from './constants'
import { guard, minutes } from './rate-limit'
import { closeTournamentAccess } from './staff'
import { ensureTournamentChannel } from './channels'
import { notify, notifyMany } from './notifications'

const CLOSED_STATUSES = ['completed', 'cancelled'] as const

function linesToJson(value?: string) {
  return JSON.stringify(
    value
      ? value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : []
  )
}

function withCurrency(value: string | undefined, fallback = 'Free') {
  const raw = value?.trim()
  if (!raw) return fallback
  if (/^(free|0)$/i.test(raw)) return 'Free'
  return raw
}

function revalidateTournamentViews(tournamentId?: string) {
  revalidatePath('/feed')
  revalidatePath('/saved')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/participants')
  revalidatePath('/')
  if (tournamentId) revalidatePath(`/tournament/${tournamentId}`)
}

// ------------------------------------------------------------
// Create / update
// ------------------------------------------------------------

/**
 * Only an ORGANIZATION account (or a super admin) can open a tournament.
 * Per-tournament staff roles are scoped to one event and therefore never
 * grant creation rights.
 */
export async function createTournament(input: unknown): Promise<ActionResult<{ tournamentId: string }>> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')
  if (user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN') {
    return fail('Turnir yaratish faqat tashkilot akkauntlari uchun')
  }

  // Without this one account could fill the table with thousands of events.
  const limited = guard(`create-tournament:${user.id}`, 10, minutes(60))
  if (limited) return limited

  const parsed = createTournamentSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const data = parsed.data
  if (data.endDate && data.endDate < data.date) {
    return fail('Tugash sanasi boshlanish sanasidan oldin bo‘lishi mumkin emas', {
      endDate: 'Sana noto‘g‘ri',
    })
  }

  try {
    const organization = await db.organization.findUnique({
      where: { ownerId: user.id },
      select: { id: true, status: true },
    })
    if (organization?.status === 'SUSPENDED') {
      return fail('Tashkilot akkaunti to‘xtatilgan — turnir yaratib bo‘lmaydi')
    }
    if (!organization && user.role !== 'SUPER_ADMIN') {
      return fail('Sizning akkauntingizga tashkilot bog‘lanmagan')
    }

    const tournament = await db.tournament.create({
      data: {
        title: data.title,
        sport: data.sport,
        category: data.category,
        location: data.location,
        date: data.date,
        endDate: data.endDate || null,
        time: data.time,
        maxParticipants: data.maxParticipants,
        posterMediaId: data.posterMediaId || null,
        galleryMediaIdsJson: JSON.stringify(data.galleryMediaIds ?? []),
        posterUrl: '',
        organizerId: user.id,
        organizationId: organization?.id ?? null,
        description: data.description,
        rulesJson: linesToJson(data.rules),
        requirementsJson: linesToJson(data.requirements),
        prizePool: withCurrency(data.prizePool),
        entryFee: withCurrency(data.entryFee),
        status: 'registration_open',
        featured: false,
      },
      select: { id: true, title: true, sport: true, description: true },
    })

    await ensureTournamentChannel(tournament.id)

    revalidateTournamentViews(tournament.id)
    revalidatePath('/messages')
    return succeedWith({ tournamentId: tournament.id })
  } catch (error) {
    console.error('createTournament failed', error)
    return fail('Turnir yaratishda xatolik yuz berdi')
  }
}

export async function updateTournament(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const limited = guard(`update-tournament:${user.id}`, 60, minutes(10))
  if (limited) return limited

  const parsed = updateTournamentSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { tournamentId, ...data } = parsed.data
  const ability = await getTournamentAbility(user.id, tournamentId)
  if (!ability.canEditTournament) return fail('Bu turnirni tahrirlash huquqingiz yo‘q')

  try {
    await db.tournament.update({
      where: { id: tournamentId },
      data: {
        title: data.title,
        sport: data.sport,
        category: data.category,
        location: data.location,
        date: data.date,
        endDate: data.endDate || null,
        time: data.time,
        maxParticipants: data.maxParticipants,
        description: data.description,
        rulesJson: linesToJson(data.rules),
        requirementsJson: linesToJson(data.requirements),
        prizePool: withCurrency(data.prizePool),
        entryFee: withCurrency(data.entryFee),
        ...(data.posterMediaId ? { posterMediaId: data.posterMediaId } : {}),
      },
    })

    revalidateTournamentViews(tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('updateTournament failed', error)
    return fail('Turnirni saqlashda xatolik')
  }
}

/**
 * Moving a tournament to `completed`/`cancelled` is what expires every
 * temporary staff grant — see `closeTournamentAccess`.
 */
export async function setTournamentStatus(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = setTournamentStatusSchema.safeParse(input)
  if (!parsed.success) return fail('Status noto‘g‘ri')

  const { tournamentId, status } = parsed.data
  const ability = await getTournamentAbility(user.id, tournamentId)
  if (!ability.canEditTournament) return fail('Bu turnir statusini o‘zgartirish huquqingiz yo‘q')

  try {
    const closing = (CLOSED_STATUSES as readonly string[]).includes(status)

    await db.tournament.update({
      where: { id: tournamentId },
      data: { status, closedAt: closing ? new Date() : null },
    })

    if (closing) {
      await closeTournamentAccess(tournamentId, user.id)
    }

    const [tournament, audience] = await Promise.all([
      db.tournament.findUnique({ where: { id: tournamentId }, select: { title: true } }),
      db.participant.findMany({
        where: { tournamentId, userId: { not: null } },
        select: { userId: true },
      }),
    ])

    await notifyMany(
      audience.map((row) => row.userId).filter((id): id is string => Boolean(id)),
      {
        type: 'TOURNAMENT_STATUS',
        title: `${tournament?.title ?? 'Turnir'} statusi o‘zgardi`,
        body: `Yangi status: ${TOURNAMENT_STATUS_LABELS[status]}.`,
        link: `/tournament/${tournamentId}`,
      }
    )

    revalidateTournamentViews(tournamentId)
    revalidatePath('/staff')
    revalidatePath('/messages')
    return { ok: true }
  } catch (error) {
    console.error('setTournamentStatus failed', error)
    return fail('Statusni o‘zgartirishda xatolik')
  }
}

export async function deleteTournament(tournamentId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const ability = await getTournamentAbility(user.id, tournamentId)
  if (!ability.isOwner) return fail('Turnirni o‘chirish faqat tashkilot egasi uchun')

  try {
    await db.tournament.delete({ where: { id: tournamentId } })
    revalidateTournamentViews(tournamentId)
    revalidatePath('/messages')
    return { ok: true }
  } catch (error) {
    console.error('deleteTournament failed', error)
    return fail('Turnirni o‘chirishda xatolik')
  }
}

// ------------------------------------------------------------
// Saving / bookmarking
// ------------------------------------------------------------

export async function toggleSaveTournament(tournamentId: string): Promise<ActionResult<{ saved: boolean }>> {
  const user = await getCurrentUser()
  if (!user) return fail('Saqlash uchun tizimga kiring')

  const limited = guard(`save:${user.id}`, 120, minutes(10))
  if (limited) return limited

  try {
    const key = { userId_tournamentId: { userId: user.id, tournamentId } }
    const existing = await db.savedTournament.findUnique({ where: key })

    if (existing) {
      await db.savedTournament.delete({ where: key })
    } else {
      await db.savedTournament.create({ data: { userId: user.id, tournamentId } })
    }

    revalidatePath('/feed')
    revalidatePath('/saved')
    revalidatePath(`/tournament/${tournamentId}`)
    return succeedWith({ saved: !existing })
  } catch (error) {
    console.error('toggleSaveTournament failed', error)
    return fail('Saqlashda xatolik')
  }
}

// ------------------------------------------------------------
// Participation
// ------------------------------------------------------------

export async function registerParticipant(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Ro‘yxatdan o‘tish uchun tizimga kiring')
  if (user.role !== 'USER') return fail('Tashkilot va admin akkauntlari turnirga yozilmaydi')

  // Caps the signup race that the capacity check alone cannot close.
  const limited = guard(`register:${user.id}`, 20, minutes(10))
  if (limited) return limited

  const parsed = registerParticipantSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { tournamentId, teamName } = parsed.data

  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        date: true,
        status: true,
        entryFee: true,
        maxParticipants: true,
        _count: { select: { participants: true } },
      },
    })
    if (!tournament) return fail('Turnir topilmadi')

    if (tournament.status !== 'registration_open') {
      return fail('Bu turnirga ro‘yxatdan o‘tish yopilgan')
    }
    if (tournament.date < new Date().toISOString().slice(0, 10)) {
      return fail('Turnir sanasi o‘tib ketgan')
    }
    if (tournament._count.participants >= tournament.maxParticipants) {
      return fail('Turnir to‘lgan — bo‘sh o‘rin qolmadi')
    }

    const already = await db.participant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: user.id } },
      select: { id: true },
    })
    if (already) return fail('Siz bu turnirga allaqachon yozilgansiz')

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, username: true, avatar: true },
    })
    if (!profile) return fail('Profil topilmadi')

    await db.participant.create({
      data: {
        name: profile.name,
        email: profile.email ?? `${profile.username}@tourneyup.uz`,
        avatar: profile.avatar,
        registeredAt: new Date().toISOString(),
        status: 'pending',
        teamName: teamName || null,
        paymentStatus: tournament.entryFee && tournament.entryFee !== 'Free' ? 'pending' : 'paid',
        tournamentId,
        userId: user.id,
      },
    })

    // Joining a tournament subscribes you to its announcement channel.
    const channel = await db.channel.findUnique({ where: { tournamentId }, select: { id: true } })
    if (channel) {
      await db.channelMember.upsert({
        where: { channelId_userId: { channelId: channel.id, userId: user.id } },
        update: {},
        create: { channelId: channel.id, userId: user.id, role: 'SUBSCRIBER' },
      })
    }

    const owner = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { title: true, organizerId: true },
    })
    if (owner) {
      await notify({
        userId: owner.organizerId,
        type: 'PARTICIPANT_REGISTERED',
        title: 'Yangi ro‘yxatdan o‘tish',
        body: `${profile.name} “${owner.title}” turniriga yozildi.`,
        link: '/dashboard/participants',
      })
    }

    revalidateTournamentViews(tournamentId)
    revalidatePath('/messages')
    return { ok: true }
  } catch (error) {
    console.error('registerParticipant failed', error)
    return fail('Ro‘yxatdan o‘tishda xatolik')
  }
}

export async function unregisterParticipant(tournamentId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const limited = guard(`unregister:${user.id}`, 20, minutes(10))
  if (limited) return limited

  try {
    const participant = await db.participant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: user.id } },
      select: { id: true },
    })
    if (!participant) return fail('Siz bu turnirga yozilmagansiz')

    await db.participant.delete({ where: { id: participant.id } })
    revalidateTournamentViews(tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('unregisterParticipant failed', error)
    return fail('Bekor qilishda xatolik')
  }
}

/**
 * Approve or reject a registration. The caller must hold a live grant on
 * *that* tournament — a forged `tournamentId` no longer helps, because the
 * tournament is read from the participant row itself.
 */
export async function updateParticipantStatus(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = participantStatusSchema.safeParse(input)
  if (!parsed.success) return fail('Status noto‘g‘ri')

  const { participantId, status } = parsed.data

  try {
    const participant = await db.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        tournamentId: true,
        userId: true,
        tournament: { select: { title: true } },
      },
    })
    if (!participant) return fail('Ishtirokchi topilmadi')

    const ability = await getTournamentAbility(user.id, participant.tournamentId)
    if (!ability.canManageParticipants) {
      return fail('Ishtirokchilarni boshqarish huquqingiz yo‘q')
    }

    await db.participant.update({ where: { id: participantId }, data: { status } })

    // The whole point of the approve/reject flow: the participant finds out.
    if (participant.userId && status !== 'pending') {
      const approved = status === 'approved'
      await notify({
        userId: participant.userId,
        type: approved ? 'PARTICIPANT_APPROVED' : 'PARTICIPANT_REJECTED',
        title: approved ? 'Arizangiz tasdiqlandi' : 'Arizangiz rad etildi',
        body: `“${participant.tournament.title}” turniri uchun arizangiz ${
          approved ? 'tasdiqlandi' : 'rad etildi'
        }.`,
        link: `/tournament/${participant.tournamentId}`,
      })
    }

    revalidateTournamentViews(participant.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('updateParticipantStatus failed', error)
    return fail('Statusni o‘zgartirishda xatolik')
  }
}

export async function removeParticipant(participantId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const participant = await db.participant.findUnique({
      where: { id: participantId },
      select: { tournamentId: true },
    })
    if (!participant) return fail('Ishtirokchi topilmadi')

    const ability = await getTournamentAbility(user.id, participant.tournamentId)
    if (!ability.canManageParticipants) return fail('Huquqingiz yo‘q')

    await db.participant.delete({ where: { id: participantId } })
    revalidateTournamentViews(participant.tournamentId)
    return { ok: true }
  } catch (error) {
    console.error('removeParticipant failed', error)
    return fail('O‘chirishda xatolik')
  }
}
