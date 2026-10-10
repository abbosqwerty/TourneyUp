'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import { STORY_TTL_MS } from './stories'
import { createStorySchema, fieldErrors } from './schemas'
import { fail, type ActionResult } from './action-result'
import { minutes, rateLimit } from './rate-limit'

/**
 * Publish a 24-hour story. Organizations post for themselves; tournament
 * staff may post a story attached to the tournament they are assigned to.
 */
export async function createStory(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = createStorySchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { mediaId, caption, tournamentId } = parsed.data

  const limit = rateLimit(`story:${user.id}`, 10, minutes(60))
  if (!limit.ok) return fail('Bir soatda 10 tadan ko‘p story qo‘shib bo‘lmaydi')

  try {
    const media = await db.mediaAsset.findUnique({
      where: { id: mediaId },
      select: { id: true, uploadedById: true },
    })
    if (!media) return fail('Media fayli topilmadi')
    if (media.uploadedById !== user.id && user.role !== 'SUPER_ADMIN') {
      return fail('Bu media fayli sizga tegishli emas')
    }

    let organizationId: string | null = null

    if (tournamentId) {
      const ability = await getTournamentAbility(user.id, tournamentId)
      if (!ability.canPostToChannel) return fail('Bu turnir uchun story qo‘shish huquqingiz yo‘q')

      const tournament = await db.tournament.findUnique({
        where: { id: tournamentId },
        select: { organizationId: true },
      })
      organizationId = tournament?.organizationId ?? null
    } else {
      const organization = await db.organization.findUnique({
        where: { ownerId: user.id },
        select: { id: true, status: true },
      })
      if (!organization) return fail('Story qo‘shish faqat tashkilotlar uchun')
      if (organization.status === 'SUSPENDED') return fail('Tashkilot akkaunti to‘xtatilgan')
      organizationId = organization.id
    }

    if (!organizationId) return fail('Story uchun tashkilot aniqlanmadi')

    await db.story.create({
      data: {
        organizationId,
        tournamentId: tournamentId || null,
        authorId: user.id,
        mediaId,
        caption: caption || null,
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      },
    })

    revalidatePath('/feed')
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (error) {
    console.error('createStory failed', error)
    return fail('Story qo‘shishda xatolik')
  }
}

export async function markStorySeen(storyId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: true }

  try {
    await db.storyView.upsert({
      where: { storyId_userId: { storyId, userId: user.id } },
      update: {},
      create: { storyId, userId: user.id },
    })
    return { ok: true }
  } catch {
    // A missed view marker is cosmetic — never surface it.
    return { ok: true }
  }
}

export async function deleteStory(storyId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { id: true, authorId: true, organization: { select: { ownerId: true } } },
    })
    if (!story) return fail('Story topilmadi')

    const allowed =
      story.authorId === user.id || story.organization?.ownerId === user.id || user.role === 'SUPER_ADMIN'
    if (!allowed) return fail('Huquqingiz yo‘q')

    await db.story.delete({ where: { id: storyId } })
    revalidatePath('/feed')
    return { ok: true }
  } catch (error) {
    console.error('deleteStory failed', error)
    return fail('O‘chirishda xatolik')
  }
}
