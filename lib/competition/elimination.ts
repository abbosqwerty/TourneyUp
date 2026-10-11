import { bracketOrder, nextPowerOfTwo } from './seeding'
import {
  matchKey,
  type Bracket,
  type EngineMatch,
  type PlannedMatch,
  type Slot,
  type SlotUpdate,
} from './types'

// ------------------------------------------------------------
// Planning
// ------------------------------------------------------------

/** "Final", "Yarim final", "Chorak final", "1/8 final" … */
export function knockoutRoundName(round: number, totalRounds: number) {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Yarim final'
  if (fromEnd === 2) return 'Chorak final'
  return `1/${2 ** fromEnd} final`
}

const slotOf = (position: number): Slot => (position % 2 === 0 ? 'HOME' : 'AWAY')

/**
 * Single-elimination bracket for `entrants` given in seed order. Missing
 * entrants in round one are byes — standard seeding puts them against the
 * top seeds, so no match ever has two byes.
 */
export function planSingleElimination(
  entrants: string[],
  options: { bracket?: Bracket; thirdPlaceMatch?: boolean; stagePrefix?: string } = {}
): PlannedMatch[] {
  const bracket = options.bracket ?? 'MAIN'
  const prefix = options.stagePrefix ? `${options.stagePrefix}: ` : ''
  const size = Math.max(2, nextPowerOfTwo(entrants.length))
  const rounds = Math.log2(size)
  const order = bracketOrder(size)
  const matches: PlannedMatch[] = []

  for (let round = 1; round <= rounds; round++) {
    const count = size / 2 ** round
    for (let position = 0; position < count; position++) {
      const isFinal = round === rounds
      matches.push({
        key: matchKey(bracket, round, position),
        bracket,
        round,
        position,
        group: null,
        stage: prefix + knockoutRoundName(round, rounds),
        home: round === 1 ? (entrants[order[position * 2] - 1] ?? null) : null,
        away: round === 1 ? (entrants[order[position * 2 + 1] - 1] ?? null) : null,
        next: isFinal
          ? null
          : { key: matchKey(bracket, round + 1, Math.floor(position / 2)), slot: slotOf(position) },
        loserNext: null,
      })
    }
  }

  if (options.thirdPlaceMatch && rounds >= 2) {
    const thirdKey = matchKey('THIRD_PLACE', 1, 0)
    for (const match of matches) {
      if (match.round === rounds - 1) match.loserNext = { key: thirdKey, slot: slotOf(match.position) }
    }
    matches.push({
      key: thirdKey,
      bracket: 'THIRD_PLACE',
      round: 1,
      position: 0,
      group: null,
      stage: `${prefix}3-o‘rin uchun`,
      home: null,
      away: null,
      next: null,
      loserNext: null,
    })
  }

  return matches
}

/**
 * Double elimination for a bracket of size 2^k:
 *
 *   WB rounds 1..k, LB rounds 1..2(k-1), grand final (+ optional reset).
 *   LB odd round  2i-1: survivors of the previous LB round play each other
 *                        (round 1: the WB round-1 losers pair up).
 *   LB even round 2i  : LB survivors meet the losers dropping from WB round i+1,
 *                        mirrored every other round to avoid quick rematches.
 */
export function planDoubleElimination(entrants: string[], options: { grandFinalReset?: boolean } = {}): PlannedMatch[] {
  const size = Math.max(2, nextPowerOfTwo(entrants.length))
  const k = Math.log2(size)
  const lbRounds = 2 * (k - 1)
  const gf1 = matchKey('GRAND_FINAL', 1, 0)

  const winners = planSingleElimination(entrants, { bracket: 'WINNERS', stagePrefix: 'Yuqori to‘r' })
  const wbFinal = winners.find((m) => m.round === k)!
  wbFinal.next = { key: gf1, slot: 'HOME' }

  const losers: PlannedMatch[] = []
  for (let j = 1; j <= lbRounds; j++) {
    const i = Math.ceil(j / 2)
    const count = size / 2 ** (i + 1)
    for (let position = 0; position < count; position++) {
      const isLast = j === lbRounds
      let next: PlannedMatch['next']
      if (isLast) next = { key: gf1, slot: 'AWAY' }
      else if (j % 2 === 1) next = { key: matchKey('LOSERS', j + 1, position), slot: 'HOME' }
      else next = { key: matchKey('LOSERS', j + 1, Math.floor(position / 2)), slot: slotOf(position) }

      losers.push({
        key: matchKey('LOSERS', j, position),
        bracket: 'LOSERS',
        round: j,
        position,
        group: null,
        stage: isLast ? 'Quyi to‘r finali' : `Quyi to‘r: ${j}-raund`,
        home: null,
        away: null,
        next,
        loserNext: null,
      })
    }
  }

  // Where each WB loser drops.
  for (const match of winners) {
    if (k === 1) {
      match.loserNext = { key: gf1, slot: 'AWAY' }
    } else if (match.round === 1) {
      match.loserNext = { key: matchKey('LOSERS', 1, Math.floor(match.position / 2)), slot: slotOf(match.position) }
    } else {
      const i = match.round - 1
      const count = size / 2 ** (i + 1)
      const target = i % 2 === 1 ? count - 1 - match.position : match.position
      match.loserNext = { key: matchKey('LOSERS', 2 * i, target), slot: 'AWAY' }
    }
  }

  const grandFinal: PlannedMatch[] = [
    {
      key: gf1,
      bracket: 'GRAND_FINAL',
      round: 1,
      position: 0,
      group: null,
      stage: 'Grand final',
      home: null,
      away: null,
      next: null,
      loserNext: null,
    },
  ]
  if (options.grandFinalReset ?? true) {
    grandFinal.push({
      key: matchKey('GRAND_FINAL', 2, 0),
      bracket: 'GRAND_FINAL',
      round: 2,
      position: 0,
      group: null,
      stage: 'Grand final (qayta)',
      home: null,
      away: null,
      next: null,
      loserNext: null,
    })
  }

  return [...winners, ...losers, ...grandFinal]
}

// ------------------------------------------------------------
// Resolution — every slot re-derived from finalized results
// ------------------------------------------------------------

/** A side that will never be filled (a bye, or the loser of a bye). */
export const NONE = '__none__'
/** A side that depends on a match not decided yet. */
export const PENDING = '__pending__'

type SideValue = string // entrant id | NONE | PENDING

export type Resolved = {
  home: SideValue
  away: SideValue
  done: boolean
  auto: 'BYE' | 'VOID' | null
  winner: SideValue | null
  loser: SideValue | null
}

const ELIMINATION_BRACKETS: Bracket[] = ['MAIN', 'WINNERS', 'LOSERS', 'GRAND_FINAL', 'THIRD_PLACE']

export function isEliminationBracket(bracket: Bracket) {
  return ELIMINATION_BRACKETS.includes(bracket)
}

const isEntrant = (value: SideValue | null): value is string =>
  value !== null && value !== NONE && value !== PENDING

/**
 * Walk the bracket graph and decide, for every match, who should be in it
 * and whether it is decided. Stored sides of later-round matches are ignored
 * — they are always re-derived from feeders — which is what makes running
 * this twice harmless.
 */
export function resolveElimination(matches: EngineMatch[]): Map<string, Resolved> {
  const byKey = new Map(matches.map((m) => [m.key, m]))
  const feeders = new Map<string, { from: string; kind: 'winner' | 'loser' }>()
  for (const m of matches) {
    if (m.next) feeders.set(`${m.next.key}|${m.next.slot}`, { from: m.key, kind: 'winner' })
    if (m.loserNext) feeders.set(`${m.loserNext.key}|${m.loserNext.slot}`, { from: m.key, kind: 'loser' })
  }

  const memo = new Map<string, Resolved>()
  const visiting = new Set<string>()

  const side = (m: EngineMatch, slot: Slot): SideValue => {
    // Grand-final reset: only played if the losers-bracket side won game one.
    if (m.bracket === 'GRAND_FINAL' && m.round === 2) {
      const first = byKey.get(matchKey('GRAND_FINAL', 1, 0))
      if (!first) return NONE
      const r = resolve(first)
      if (!r.done) return PENDING
      if (!isEntrant(r.winner) || r.winner === r.home) return NONE
      return slot === 'HOME' ? r.home : r.away
    }

    const feeder = feeders.get(`${m.key}|${slot}`)
    if (feeder) {
      const source = byKey.get(feeder.from)
      if (!source) return NONE
      const r = resolve(source)
      if (!r.done) return PENDING
      return (feeder.kind === 'winner' ? r.winner : r.loser) ?? NONE
    }

    const stored = slot === 'HOME' ? m.home : m.away
    return stored ?? NONE
  }

  const resolve = (m: EngineMatch): Resolved => {
    const cached = memo.get(m.key)
    if (cached) return cached
    if (visiting.has(m.key)) throw new Error(`Bracket cycle at ${m.key}`)
    visiting.add(m.key)

    const home = side(m, 'HOME')
    const away = side(m, 'AWAY')
    let result: Resolved

    if (home === PENDING || away === PENDING) {
      result = { home, away, done: false, auto: null, winner: null, loser: null }
    } else if (home === NONE && away === NONE) {
      result = { home, away, done: true, auto: 'VOID', winner: NONE, loser: NONE }
    } else if (home === NONE || away === NONE) {
      const present = home === NONE ? away : home
      result = { home, away, done: true, auto: 'BYE', winner: present, loser: NONE }
    } else {
      const decided =
        m.finalized &&
        !m.cancelled &&
        m.home === home &&
        m.away === away &&
        (m.winner === home || m.winner === away)
      result = decided
        ? { home, away, done: true, auto: null, winner: m.winner, loser: m.winner === home ? away : home }
        : { home, away, done: false, auto: null, winner: null, loser: null }
    }

    visiting.delete(m.key)
    memo.set(m.key, result)
    return result
  }

  for (const m of matches) resolve(m)
  return memo
}

/** The stored state an elimination match should be moved to. */
export function eliminationUpdates(matches: EngineMatch[], resolved = resolveElimination(matches)): SlotUpdate[] {
  const updates: SlotUpdate[] = []
  for (const m of matches) {
    const r = resolved.get(m.key)!
    const home = isEntrant(r.home) ? r.home : null
    const away = isEntrant(r.away) ? r.away : null
    const auto = r.auto
    const winner = auto === 'BYE' && isEntrant(r.winner) ? r.winner : null

    const storedAuto = m.cancelled ? 'VOID' : m.resultType === 'BYE' && m.finalized ? 'BYE' : null
    const changed =
      m.home !== home ||
      m.away !== away ||
      storedAuto !== auto ||
      (auto === 'BYE' && m.winner !== winner)

    if (changed) updates.push({ key: m.key, home, away, auto, winner: auto === 'BYE' ? winner : null })
  }
  return updates
}

// ------------------------------------------------------------
// Placements
// ------------------------------------------------------------

/**
 * Turn "how late was each entrant knocked out" into placements. Entrants
 * knocked out at the same stage share the placement: two quarter-final
 * losers out of eight both finish 5th.
 */
export function placementsFromLevels(levels: Map<string, number>): Map<string, number> {
  const values = [...levels.values()]
  const out = new Map<string, number>()
  for (const [id, level] of levels) {
    out.set(id, 1 + values.filter((other) => other > level).length)
  }
  return out
}

/**
 * Single elimination (and the knockout part of groups + knockout).
 * Without a third-place match both semi-final losers share 3rd place.
 */
export function singleEliminationLevels(
  matches: EngineMatch[],
  resolved: Map<string, Resolved>,
  bracket: Bracket = 'MAIN'
): Map<string, number> {
  const levels = new Map<string, number>()
  const main = matches.filter((m) => m.bracket === bracket)
  const finalRound = Math.max(...main.map((m) => m.round))

  for (const m of main) {
    const r = resolved.get(m.key)
    if (!r?.done || r.auto) continue
    if (isEntrant(r.loser) && !m.loserNext) levels.set(r.loser, m.round)
    if (m.round === finalRound && isEntrant(r.winner)) levels.set(r.winner, Number.POSITIVE_INFINITY)
  }

  const third = matches.find((m) => m.bracket === 'THIRD_PLACE')
  if (third) {
    const r = resolved.get(third.key)
    if (r?.done) {
      if (isEntrant(r.winner)) levels.set(r.winner, finalRound - 0.25)
      if (isEntrant(r.loser)) levels.set(r.loser, finalRound - 0.5)
    }
  }

  return levels
}

export function doubleEliminationLevels(matches: EngineMatch[], resolved: Map<string, Resolved>): Map<string, number> {
  const levels = new Map<string, number>()
  const lbRounds = Math.max(0, ...matches.filter((m) => m.bracket === 'LOSERS').map((m) => m.round))

  for (const m of matches) {
    if (m.bracket !== 'LOSERS') continue
    const r = resolved.get(m.key)
    if (r?.done && !r.auto && isEntrant(r.loser)) levels.set(r.loser, m.round)
  }

  const reset = matches.find((m) => m.bracket === 'GRAND_FINAL' && m.round === 2)
  const resetResolved = reset ? resolved.get(reset.key) : undefined
  const decider =
    resetResolved?.done && !resetResolved.auto
      ? resetResolved
      : resolved.get(matchKey('GRAND_FINAL', 1, 0))

  if (decider?.done && !decider.auto) {
    if (isEntrant(decider.loser)) levels.set(decider.loser, lbRounds + 1)
    if (isEntrant(decider.winner)) levels.set(decider.winner, Number.POSITIVE_INFINITY)
  }

  return levels
}
