/**
 * Plain data the format engine works on. No Prisma, no I/O — the engine is a
 * set of pure functions so every rule can be unit-tested, and the database
 * layer (`lifecycle.ts`) only stores what the engine decides.
 *
 * Entrants are identified by their `Participant.id`.
 */

export type Bracket = 'MAIN' | 'WINNERS' | 'LOSERS' | 'GRAND_FINAL' | 'THIRD_PLACE' | 'GROUP' | 'SWISS'
export type Slot = 'HOME' | 'AWAY'
export type ResultType = 'NORMAL' | 'FORFEIT' | 'BYE'

export type SlotLink = { key: string; slot: Slot }

/** A match the engine wants to exist. `key` is unique per tournament. */
export type PlannedMatch = {
  key: string
  bracket: Bracket
  round: number
  position: number
  /** Index into the plan's groups (groups stage only). */
  group: number | null
  stage: string
  home: string | null
  away: string | null
  next: SlotLink | null
  loserNext: SlotLink | null
}

/** A stored match plus its result, as the engine reads it back. */
export type EngineMatch = PlannedMatch & {
  /** Official result confirmed by staff (byes are finalized by the engine). */
  finalized: boolean
  /** Voided by the engine (both sides absent) or cancelled. */
  cancelled: boolean
  resultType: ResultType
  homeScore: number | null
  awayScore: number | null
  /** Winning entrant; null on a draw. */
  winner: string | null
}

export type Plan = {
  groups: { index: number; name: string }[]
  matches: PlannedMatch[]
}

/** What the engine wants changed on an existing match. */
export type SlotUpdate = {
  key: string
  home: string | null
  away: string | null
  /** BYE = one side advances automatically, VOID = nobody plays, null = a real match. */
  auto: 'BYE' | 'VOID' | null
  winner: string | null
}

export type Progress = {
  updates: SlotUpdate[]
  create: Plan | null
  complete: boolean
}

export const matchKey = (bracket: Bracket, round: number, position: number) =>
  `${bracket}:${round}:${position}`

/** Deterministic in tests, `crypto.randomInt` in production. */
export type Rng = (maxExclusive: number) => number
