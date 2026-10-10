import { db } from './db'

/** Plain helpers — not server actions. */

export const STORY_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours, Instagram-style

export type StoryGroup = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  avatar: string | null
  hasUnseen: boolean
  stories: {
    id: string
    mediaUrl: string
    mediaType: string
    caption: string | null
    createdAt: Date
    seen: boolean
    tournament: { id: string; title: string } | null
  }[]
}

/**
 * Live stories grouped per organization, newest group first, with the
 * organizations the viewer has not watched yet promoted to the front.
 */
export async function listActiveStories(viewerId?: string | null): Promise<StoryGroup[]> {
  const stories = await db.story.findMany({
    where: { expiresAt: { gt: new Date() }, organizationId: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      mediaId: true,
      media: { select: { mimeType: true } },
      caption: true,
      createdAt: true,
      organization: { select: { id: true, name: true, slug: true, logoMediaId: true } },
      tournament: { select: { id: true, title: true } },
      views: viewerId ? { where: { userId: viewerId }, select: { id: true }, take: 1 } : false,
    },
  })

  const groups = new Map<string, StoryGroup>()

  for (const story of stories) {
    const org = story.organization
    if (!org) continue

    if (!groups.has(org.id)) {
      groups.set(org.id, {
        organizationId: org.id,
        organizationName: org.name,
        organizationSlug: org.slug,
        avatar: org.logoMediaId ? `/api/media/${org.logoMediaId}` : null,
        hasUnseen: false,
        stories: [],
      })
    }

    const seen = Array.isArray(story.views) ? story.views.length > 0 : false
    const group = groups.get(org.id)!
    group.stories.push({
      id: story.id,
      mediaUrl: `/api/media/${story.mediaId}`,
      mediaType: story.media.mimeType,
      caption: story.caption,
      createdAt: story.createdAt,
      seen,
      tournament: story.tournament,
    })
    if (!seen) group.hasUnseen = true
  }

  return [...groups.values()].sort((a, b) => {
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1
    const aLatest = a.stories.at(-1)?.createdAt.getTime() ?? 0
    const bLatest = b.stories.at(-1)?.createdAt.getTime() ?? 0
    return bLatest - aLatest
  })
}

/** Housekeeping: drop expired stories (and their media) on demand. */
export async function pruneExpiredStories() {
  const expired = await db.story.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { id: true, mediaId: true },
  })
  if (expired.length === 0) return 0

  await db.story.deleteMany({ where: { id: { in: expired.map((s) => s.id) } } })
  await db.mediaAsset.deleteMany({ where: { id: { in: expired.map((s) => s.mediaId) } } })
  return expired.length
}
