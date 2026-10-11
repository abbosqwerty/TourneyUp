import { dictionaries } from './i18n/dictionaries'
import { DEFAULT_LOCALE, type Locale } from './i18n/types'

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

// Month names come from the dictionaries rather than Intl: browsers ship
// uneven ICU data for `uz-UZ` (Chromium renders "M10" instead of "okt"),
// which also makes server and client output disagree during hydration.
// Every formatter takes the visitor's locale (default Uzbek).

type DateInput = string | Date | null | undefined

function parts(value: string | Date, locale: Locale) {
  const local = toLocal(new Date(value))
  const month = local.getUTCMonth()
  return {
    day: local.getUTCDate(),
    short: dictionaries[locale].months_short[month],
    long: dictionaries[locale].months_long[month],
    year: local.getUTCFullYear(),
    time: `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`,
  }
}

/** Day + month: uz "12-okt", ru "12 окт", en "Oct 12". */
function dayMonth(d: ReturnType<typeof parts>, locale: Locale, long = false) {
  const month = long ? d.long : d.short
  if (locale === 'uz') return `${d.day}-${month}`
  if (locale === 'ru') return `${d.day} ${month}`
  return `${month} ${d.day}`
}

/** "12-okt, 18:30" */
export function formatDateTime(value: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  if (!value) return ''
  const d = parts(value, locale)
  return `${dayMonth(d, locale)}, ${d.time}`
}

/** "12-okt, 2026" */
export function formatDate(value: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  if (!value) return ''
  const d = parts(value, locale)
  return `${dayMonth(d, locale)}, ${d.year}`
}

/** "12-okt" */
export function formatDayMonth(value: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  if (!value) return ''
  return dayMonth(parts(value, locale), locale)
}

/** "12-oktabr, 2026" */
export function formatDateLong(value: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  if (!value) return ''
  const d = parts(value, locale)
  return `${dayMonth(d, locale, true)}, ${d.year}`
}

/** "okt 2026" */
export function formatMonthYear(value: DateInput, locale: Locale = DEFAULT_LOCALE): string {
  if (!value) return ''
  const d = parts(value, locale)
  return `${d.short} ${d.year}`
}

/** "18:30" */
export function formatTime(value: DateInput): string {
  if (!value) return ''
  return parts(value, DEFAULT_LOCALE).time
}

/**
 * A tournament's start time as typed — "18:30" from the form, or "6:30 PM"
 * from older rows — in the visitor's clock: uz/ru "18:30", en "6:30 PM".
 * Anything that doesn't parse is shown as stored.
 */
export function formatClock(value: string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  if (!value) return ''
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/)
  if (!match) return value
  let hours = Number(match[1])
  const minutes = match[2]
  const meridiem = match[3]?.toUpperCase()
  if (hours > 23 || Number(minutes) > 59 || (meridiem && (hours < 1 || hours > 12))) return value
  if (meridiem) hours = (hours % 12) + (meridiem === 'PM' ? 12 : 0)
  if (locale === 'en') return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

/** Today's calendar day in Tashkent as "YYYY-MM-DD" (tournament dates are stored this way). */
export function todayIso(now: Date = new Date()): string {
  return toLocal(now).toISOString().slice(0, 10)
}
