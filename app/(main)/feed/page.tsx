import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { tournamentPoster } from '@/lib/media'
import { todayIso } from '@/lib/time'
import type { Prisma } from '@prisma/client'
import {
  FEED_PAGE_SIZE,
  buildTournamentWhere,
  parseTournamentFilters,
  type TournamentFilters,
} from '@/lib/tournament-filters'
import type { Tournament, TournamentCategory, TournamentStatusValue } from '@/lib/types'
import { getI18n } from '@/lib/i18n/server'
import { DbErrorCard } from '@/components/db-error-card'
import FeedClient from './feed-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.tournament.feed.meta_title,
    description: dict.tournament.feed.meta_description,
  }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser()
  const filters = parseTournamentFilters(await searchParams)

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load(user?.id ?? null, filters)
  } catch (error) {
    console.error('feed page failed', error)
  }

  if (!data) {
    const { dict } = await getI18n()
    return <DbErrorCard message={dict.tournament.feed.load_error} />
  }

  return (
    <div>
      <FeedClient
        filters={filters}
        tournaments={data.tournaments}
        highlights={data.highlights}
        savedTournaments={data.savedIds}
        totalCount={data.totalCount}
        pageSize={FEED_PAGE_SIZE}
        currentUserId={user?.id}
      />
    </div>
  )
}

const cardInclude = {
  organizer: { select: { id: true, name: true, avatar: true, verified: true } },
  organization: { select: { name: true } },
  _count: { select: { participants: true } },
} as const

/**
 * Finished tournaments drop out of the feed: completed/cancelled ones, and any
 * whose last day (end date, or start date for one-day events) is already past
 * in Tashkent even if the organizer never flipped the status.
 */
function notFinished(): Prisma.TournamentWhereInput {
  const today = todayIso()
  return {
    status: { notIn: ['completed', 'cancelled'] },
    OR: [
      { endDate: { gte: today } },
      { AND: [{ OR: [{ endDate: null }, { endDate: '' }] }, { date: { gte: today } }] },
    ],
  }
}

async function load(userId: string | null, filters: TournamentFilters) {
  // Asking for completed/cancelled explicitly is how people browse history.
  const showsHistory = filters.status === 'completed' || filters.status === 'cancelled'
  const filtered = buildTournamentWhere(filters)
  const where: Prisma.TournamentWhereInput = showsHistory ? filtered : { AND: [filtered, notFinished()] }

  // Filtering and paging both happen in SQL: the browser never receives more
  // than one page, and `_count` replaces a count query per tournament.
  const [rows, totalCount, highlightRows, savedRows] = await Promise.all([
    db.tournament.findMany({
      where,
      include: cardInclude,
      orderBy: { date: 'asc' },
      take: FEED_PAGE_SIZE,
      skip: (filters.page - 1) * FEED_PAGE_SIZE,
    }),
    db.tournament.count({ where }),
    db.tournament.findMany({
      where: { AND: [{ status: { in: ['ongoing', 'registration_open'] } }, notFinished()] },
      include: {
        ...cardInclude,
        stories: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { mediaId: true, media: { select: { mimeType: true } } },
        },
      },
      orderBy: [{ featured: 'desc' }, { date: 'asc' }],
      take: 10,
    }),
    userId
      ? db.savedTournament.findMany({ where: { userId }, select: { tournamentId: true } })
      : Promise.resolve([]),
  ])

  const tournaments: Tournament[] = rows.map((t) => ({
    id: t.id,
    title: t.title,
    sport: t.sport,
    category: t.category as TournamentCategory,
    location: t.location,
    date: t.date,
    endDate: t.endDate || undefined,
    time: t.time,
    participants: t._count.participants,
    maxParticipants: t.maxParticipants,
    posterUrl: tournamentPoster(t) ?? '',
    galleryUrls: parseGalleryUrls(t.galleryMediaIdsJson),
    organizer: {
      id: t.organizer.id,
      name: t.organization?.name ?? t.organizer.name,
      avatar: t.organizer.avatar,
      verified: t.organizer.verified,
    },
    prizePool: t.prizePool || undefined,
    entryFee: t.entryFee || undefined,
    status: t.status as TournamentStatusValue,
    featured: t.featured,
  }))

  const highlights = highlightRows.map((t) => {
    const promo = t.stories[0]
    const type: 'live' | 'upcoming' | 'featured' | 'registration' =
      t.status === 'ongoing' ? 'live' : t.featured ? 'featured' : 'registration'

    return {
      id: promo?.mediaId ?? t.id,
      title: t.title,
      sport: t.sport,
      category: t.category,
      location: t.location,
      date: t.date,
      time: t.time,
      prizePool: t.prizePool || undefined,
      entryFee: t.entryFee || undefined,
      status: t.status,
      participants: t._count.participants,
      maxParticipants: t.maxParticipants,
      organizerName: t.organization?.name ?? t.organizer.name,
      organizerAvatar: t.organizer.avatar,
      description: t.description,
      image: promo ? `/api/media/${promo.mediaId}` : tournamentPoster(t) ?? '',
      mediaType: promo?.media.mimeType ?? 'image/*',
      tournamentId: t.id,
      type,
    }
  })

  return {
    tournaments,
    highlights,
    totalCount,
    savedIds: savedRows.map((row) => row.tournamentId),
  }
}

function parseGalleryUrls(value: string | null) {
  try {
    const ids = JSON.parse(value ?? '[]')
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string').map((id) => `/api/media/${id}`) : []
  } catch {
    return []
  }
}
