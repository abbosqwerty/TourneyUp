/**
 * Calendar boundaries in the platform's timezone.
 *
 * Everything is stored in UTC; "this week" and "this month" are decided in
 * Tashkent time (UTC+5, no daylight saving), with weeks starting on Monday.
 * Leaderboard periods and any other calendar-based filter go through here so
 * a tournament finalized on Sunday 23:30 local time never lands in next week.
 */

export const APP_TIMEZONE = 'Asia/Tashkent'

/** Tashkent has had a fixed +05:00 offset since 1992. */
const OFFSET_MS = 5 * 60 * 60 * 1000

/** UTC instant → the same wall-clock reading in Tashkent, as a UTC-based Date. */
function toLocal(date: Date) {
  return new Date(date.getTime() + OFFSET_MS)
}

function fromLocal(date: Date) {
  return new Date(date.getTime() - OFFSET_MS)
}

/** Monday 00:00 Tashkent time of the week containing `now`, as a UTC instant. */
export function startOfWeek(now: Date = new Date()): Date {
  const local = toLocal(now)
  const day = local.getUTCDay() // 0 = Sunday
  const sinceMonday = (day + 6) % 7
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - sinceMonday)
  return fromLocal(new Date(monday))
}

/** The 1st of the month 00:00 Tashkent time, as a UTC instant. */
export function startOfMonth(now: Date = new Date()): Date {
  const local = toLocal(now)
  return fromLocal(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1)))
}

/** Human date-time in the platform timezone, e.g. "12-okt, 18:30". */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleString('uz-UZ', {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('uz-UZ', {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
