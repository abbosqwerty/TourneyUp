import type { Prisma } from '@prisma/client'
import { ALL_LOCATIONS, locationOptions, sportCategories } from './constants'
import type { Dictionary } from './i18n/dictionaries'
import { tournamentStatuses } from './schemas'

export const FEED_PAGE_SIZE = 24

export const dateRanges = ['all', 'today', 'this_week', 'this_month', 'next_month'] as const
export type DateRange = (typeof dateRanges)[number]

export type TournamentFilters = {
  q: string
  sport: string
  location: string
  status: string
  dateRange: DateRange
  page: number
}

export const EMPTY_FILTERS: TournamentFilters = {
  q: '',
  sport: 'all',
  location: ALL_LOCATIONS,
  status: 'all',
  dateRange: 'all',
  page: 1,
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

/**
 * Filters live in the URL so a filtered feed can be shared, bookmarked and
 * restored by the back button — and so the query can run in SQL instead of
 * shipping the whole table to the browser.
 */
export function parseTournamentFilters(
  params: Record<string, string | string[] | undefined>
): TournamentFilters {
  const sport = first(params.sport)
  const status = first(params.status)
  const dateRange = first(params.date)
  const page = Number.parseInt(first(params.page), 10)

  return {
    q: first(params.q).slice(0, 80),
    sport: sportCategories.some((c) => c.id === sport) ? sport : 'all',
    location: first(params.location) || ALL_LOCATIONS,
    status: (tournamentStatuses as readonly string[]).includes(status) ? status : 'all',
    dateRange: (dateRanges as readonly string[]).includes(dateRange) ? (dateRange as DateRange) : 'all',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  }
}

/** Serialise back to a query string, dropping anything left at its default. */
export function filtersToQuery(filters: Partial<TournamentFilters>): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.sport && filters.sport !== 'all') params.set('sport', filters.sport)
  if (filters.location && filters.location !== ALL_LOCATIONS) params.set('location', filters.location)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.dateRange && filters.dateRange !== 'all') params.set('date', filters.dateRange)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  const query = params.toString()
  return query ? `?${query}` : ''
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

/**
 * `Tournament.date` is an ISO `YYYY-MM-DD` string, so string comparison is
 * also chronological. Swap these for real date ranges when the column
 * becomes `DateTime`.
 */
function dateWindow(range: DateRange): { gte?: string; lte?: string } | null {
  if (range === 'all') return null

  const now = new Date()
  const today = isoDay(now)

  if (range === 'today') return { gte: today, lte: today }

  if (range === 'this_week') {
    const end = new Date(now)
    end.setDate(end.getDate() + (7 - ((now.getDay() + 6) % 7)) - 1)
    return { gte: today, lte: isoDay(end) }
  }

  if (range === 'this_month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { gte: today, lte: isoDay(end) }
  }

  // next_month
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return { gte: isoDay(start), lte: isoDay(end) }
}

export function buildTournamentWhere(filters: TournamentFilters): Prisma.TournamentWhereInput {
  const where: Prisma.TournamentWhereInput = {}
  const and: Prisma.TournamentWhereInput[] = []

  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q } },
        { sport: { contains: filters.q } },
        { location: { contains: filters.q } },
        { organizer: { name: { contains: filters.q } } },
        { organization: { name: { contains: filters.q } } },
      ],
    })
  }

  const sport = sportCategories.find((c) => c.id === filters.sport)
  if (sport?.match) and.push({ sport: { contains: sport.match } })

  if (filters.location && filters.location !== ALL_LOCATIONS) {
    and.push({ location: { contains: filters.location } })
  }

  if (filters.status !== 'all') {
    where.status = filters.status as Prisma.TournamentWhereInput['status']
  }

  const window = dateWindow(filters.dateRange)
  if (window) and.push({ date: window })

  if (and.length) where.AND = and
  return where
}

export function hasActiveFilters(filters: TournamentFilters): boolean {
  return (
    Boolean(filters.q) ||
    filters.sport !== 'all' ||
    filters.location !== ALL_LOCATIONS ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all'
  )
}

type FilterLabels = Dictionary['tournament']['filters']

/** On-screen name of a sport filter id ("rocket-league" → "Rocket League"). */
export function sportFilterLabel(dict: Dictionary, id: string): string {
  const key = id.replace(/-/g, '_') as keyof FilterLabels['sports']
  return dict.tournament.filters.sports[key] ?? sportCategories.find((c) => c.id === id)?.name ?? id
}

/** On-screen name of a location filter value ("Tashkent" → "Ташкент"). */
export function locationFilterLabel(dict: Dictionary, value: string): string {
  const key = value.toLowerCase() as keyof FilterLabels['locations']
  return dict.tournament.filters.locations[key] ?? locationOptions.find((o) => o.value === value)?.label ?? value
}
