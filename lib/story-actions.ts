'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser, getTournamentAbility } from './session'
import { STORY_TTL_MS } from './stories'
import { createStorySchema, fieldErrors } from './schemas'
import { getI18n } from './i18n/server'
import { fail, type ActionResult } from './action-result'
import { minutes, rateLimit } from './rate-limit'

/**
 * Publish a 24-hour story. Organizations post for themselves; tournament
 * staff may post a story attached to the tournament they are assigned to.
 */
export async function createStory(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  const parsed = createStorySchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { mediaId, caption, tournamentId } = parsed.data

  const limit = rateLimit(`story:${user.id}`, 10, minutes(60))
  if (!limit.ok) return fail(e.story_rate_limit)

  try {
    const media = await db.mediaAsset.findUnique({
      where: { id: mediaId },
      select: { id: true, uploadedById: true },
    })
    if (!media) return fail(e.media_not_found)
    if (media.uploadedById !== user.id && user.role !== 'SUPER_ADMIN') {
      return fail(e.media_not_yours)
    }

    let organizationId: string | null = null

    if (tournamentId) {
      const ability = await getTournamentAbility(user.id, tournamentId)
      if (!ability.canPostToChannel) return fail(e.no_story_right)

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
      if (!organization) return fail(e.story_orgs_only)
      if (organization.status === 'SUSPENDED') return fail(e.org_suspended)
      organizationId = organization.id
    }

    if (!organizationId) return fail(e.story_no_org)

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
    return fail(e.story_failed)
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
  const { dict } = await getI18n()
  const e = dict.tournament.errors
  if (!user) return fail(dict.errors.login_required)

  try {
    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { id: true, authorId: true, organization: { select: { ownerId: true } } },
    })
    if (!story) return fail(e.story_not_found)

    const allowed =
      story.authorId === user.id || story.organization?.ownerId === user.id || user.role === 'SUPER_ADMIN'
    if (!allowed) return fail(e.no_permission)

    await db.story.delete({ where: { id: storyId } })
    revalidatePath('/feed')
    return { ok: true }
  } catch (error) {
    console.error('deleteStory failed', error)
    return fail(e.delete_failed)
  }
}
