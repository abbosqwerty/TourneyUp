import { z } from 'zod'

export const TOURNAMENT_FORMATS = [
  'SINGLE_ELIMINATION',
  'DOUBLE_ELIMINATION',
  'ROUND_ROBIN',
  'GROUPS_KNOCKOUT',
  'SWISS',
] as const

export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number]

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  SINGLE_ELIMINATION: 'Olimpiya tizimi (Single Elimination)',
  DOUBLE_ELIMINATION: 'Ikki mag‘lubiyatgacha (Double Elimination)',
  ROUND_ROBIN: 'Doiraviy (Round Robin)',
  GROUPS_KNOCKOUT: 'Guruh + Pley-off',
  SWISS: 'Shveytsariya tizimi (Swiss)',
}

export const FORMAT_SHORT_LABELS: Record<TournamentFormat, string> = {
  SINGLE_ELIMINATION: 'Single Elim',
  DOUBLE_ELIMINATION: 'Double Elim',
  ROUND_ROBIN: 'Round Robin',
  GROUPS_KNOCKOUT: 'Guruh + Pley-off',
  SWISS: 'Swiss',
}

/** Formats in which a match must have a winner. */
export function drawsAllowed(format: TournamentFormat, bracket: string) {
  if (format === 'ROUND_ROBIN' || format === 'SWISS') return true
  return format === 'GROUPS_KNOCKOUT' && bracket === 'GROUP'
}

/**
 * Every option a format can take. Stored as JSON on the tournament; anything
 * missing falls back to these defaults, so old rows keep working when a new
 * option is added.
 */
export const formatConfigSchema = z.object({
  /** `random` ignores manual seeds; `seeded` honours them and draws the rest. */
  seeding: z.enum(['random', 'seeded']).default('random'),
  /** Single elimination / knockout: play a third-place match. */
  thirdPlaceMatch: z.boolean().default(false),
  /** Double elimination: a second grand final if the losers-bracket side wins. */
  grandFinalReset: z.boolean().default(true),
  /** Groups + knockout. */
  groupCount: z.coerce.number().int().min(1).max(64).optional(),
  advancePerGroup: z.coerce.number().int().min(1).max(16).default(2),
  /** Swiss: number of rounds; defaults to ceil(log2(N)). */
  swissRounds: z.coerce.number().int().min(1).max(30).optional(),
  /** Standings points for round robin, groups and swiss. */
  winPoints: z.coerce.number().min(0).max(10).default(3),
  drawPoints: z.coerce.number().min(0).max(10).default(1),
  lossPoints: z.coerce.number().min(0).max(10).default(0),
})

export type FormatConfig = z.infer<typeof formatConfigSchema>

export function parseFormatConfig(json: string | null | undefined): FormatConfig {
  let raw: unknown = {}
  if (json) {
    try {
      raw = JSON.parse(json)
    } catch {
      raw = {}
    }
  }
  const parsed = formatConfigSchema.safeParse(raw)
  return parsed.success ? parsed.data : formatConfigSchema.parse({})
}

export function defaultGroupCount(entrants: number) {
  return Math.max(1, Math.ceil(entrants / 4))
}

export function defaultSwissRounds(entrants: number) {
  return Math.max(1, Math.min(entrants - 1, Math.ceil(Math.log2(Math.max(2, entrants)))))
}

/**
 * Check a configuration against the actual number of entrants, just before
 * the draw. Returns an Uzbek error message or null.
 */
export function validateForEntrants(
  format: TournamentFormat,
  config: FormatConfig,
  entrants: number
): string | null {
  if (entrants < 2) return 'Turnirni boshlash uchun kamida 2 ta tasdiqlangan ishtirokchi kerak'

  if (format === 'GROUPS_KNOCKOUT') {
    const groups = config.groupCount ?? defaultGroupCount(entrants)
    if (groups > Math.floor(entrants / 2)) {
      return `${entrants} ishtirokchi uchun ${groups} ta guruh juda ko‘p — har guruhda kamida 2 kishi bo‘lsin`
    }
    const smallest = Math.floor(entrants / groups)
    if (config.advancePerGroup > smallest) {
      return `Har guruhdan ${config.advancePerGroup} kishi chiqishi uchun guruhlar juda kichik`
    }
    if (groups * config.advancePerGroup < 2) {
      return 'Pley-off uchun kamida 2 ta ishtirokchi chiqishi kerak'
    }
  }

  if (format === 'SWISS' && config.swissRounds && config.swissRounds > entrants - 1) {
    return `${entrants} ishtirokchi uchun ko‘pi bilan ${entrants - 1} tur o‘tkazish mumkin`
  }

  return null
}
