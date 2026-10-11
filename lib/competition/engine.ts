import {
  defaultGroupCount,
  defaultSwissRounds,
  type FormatConfig,
  type TournamentFormat,
} from './config'
import {
  doubleEliminationLevels,
  eliminationUpdates,
  isEliminationBracket,
  placementsFromLevels,
  planDoubleElimination,
  planSingleElimination,
  resolveElimination,
  singleEliminationLevels,
} from './elimination'
import { groupName, snakeGroups } from './seeding'
import { computeStandings, roundRobinPairings, type StandingRow } from './standings'
import { pairKey, swissFirstRound, swissPairing, type SwissPairing } from './swiss'
import { matchKey, type EngineMatch, type Plan, type PlannedMatch, type Progress, type SlotUpdate } from './types'

/**
 * Format engine entry points. Pure: given the entrants (in seed order) and
 * the stored matches, decide what should exist and who goes where.
 *
 *   planInitial  → the draw, written once when the tournament starts
 *   progress     → slot fills, automatic byes and newly unlocked rounds
 *   placements   → final positions, once the competition is complete
 */

const GROUP_POSITION_STRIDE = 1000

// ------------------------------------------------------------
// Draw
// ------------------------------------------------------------

export function planInitial(format: TournamentFormat, config: FormatConfig, entrants: string[]): Plan {
  switch (format) {
    case 'SINGLE_ELIMINATION':
      return { groups: [], matches: planSingleElimination(entrants, { thirdPlaceMatch: config.thirdPlaceMatch }) }
    case 'DOUBLE_ELIMINATION':
      return { groups: [], matches: planDoubleElimination(entrants, { grandFinalReset: config.grandFinalReset }) }
    case 'ROUND_ROBIN':
      return { groups: [], matches: roundRobinMatches(entrants, null) }
    case 'GROUPS_KNOCKOUT': {
      const count = config.groupCount ?? defaultGroupCount(entrants.length)
      const groups = snakeGroups(entrants, count)
      return {
        groups: groups.map((_, index) => ({ index, name: groupName(index) })),
        matches: groups.flatMap((members, index) => roundRobinMatches(members, index)),
      }
    }
    case 'SWISS':
      return { groups: [], matches: swissMatches(swissFirstRound(entrants), 1) }
    case 'LEADERBOARD':
      // No games: results live in LeaderboardEntry rows (see leaderboard.ts).
      return { groups: [], matches: [] }
  }
}

function roundRobinMatches(entrants: string[], group: number | null): PlannedMatch[] {
  const offset = group === null ? 0 : group * GROUP_POSITION_STRIDE
  return roundRobinPairings(entrants).flatMap((pairs, r) =>
    pairs.map(([home, away], i) => ({
      key: matchKey('GROUP', r + 1, offset + i),
      bracket: 'GROUP' as const,
      round: r + 1,
      position: offset + i,
      group,
      stage: group === null ? `${r + 1}-tur` : `${groupName(group)}, ${r + 1}-tur`,
      home,
      away,
      next: null,
      loserNext: null,
    }))
  )
}

function swissMatches(pairing: SwissPairing, round: number): PlannedMatch[] {
  const base = { bracket: 'SWISS' as const, round, group: null, stage: `${round}-tur`, next: null, loserNext: null }
  const matches: PlannedMatch[] = pairing.pairs.map(([home, away], position) => ({
    ...base,
    key: matchKey('SWISS', round, position),
    position,
    home,
    away,
  }))
  if (pairing.bye) {
    const position = pairing.pairs.length
    matches.push({ ...base, key: matchKey('SWISS', round, position), position, home: pairing.bye, away: null })
  }
  return matches
}

// ------------------------------------------------------------
// Progression
// ------------------------------------------------------------

/** Settled = nothing more will happen to it. */
function settledOutsideBrackets(m: EngineMatch) {
  return m.finalized || m.cancelled || ((m.home === null) !== (m.away === null))
}

export function progress(
  format: TournamentFormat,
  config: FormatConfig,
  entrants: string[],
  matches: EngineMatch[]
): Progress {
  const elimination = matches.filter((m) => isEliminationBracket(m.bracket))
  const others = matches.filter((m) => !isEliminationBracket(m.bracket))

  const resolved = resolveElimination(elimination)
  const updates: SlotUpdate[] = eliminationUpdates(elimination, resolved)

  // A lone side outside a bracket (Swiss bye) advances automatically.
  for (const m of others) {
    const lone = (m.home === null) !== (m.away === null)
    if (lone && !(m.finalized && m.resultType === 'BYE')) {
      updates.push({ key: m.key, home: m.home, away: m.away, auto: 'BYE', winner: m.home ?? m.away })
    }
  }

  const othersSettled = others.every(settledOutsideBrackets)
  const bracketSettled = elimination.every((m) => resolved.get(m.key)?.done)

  let create: Plan | null = null
  let stageRemaining = false

  if (format === 'GROUPS_KNOCKOUT') {
    const hasKnockout = elimination.length > 0
    if (!hasKnockout) {
      stageRemaining = true
      if (othersSettled) create = { groups: [], matches: knockoutFromGroups(config, entrants, others) }
    }
  }

  if (format === 'SWISS') {
    const totalRounds = config.swissRounds ?? defaultSwissRounds(entrants.length)
    const current = Math.max(0, ...others.map((m) => m.round))
    if (current < totalRounds) {
      stageRemaining = true
      if (othersSettled) create = { groups: [], matches: nextSwissRound(config, entrants, others, current + 1) }
    }
  }

  return { updates, create, complete: othersSettled && bracketSettled && !stageRemaining }
}

function groupMembers(entrants: string[], matches: EngineMatch[]) {
  const byGroup = new Map<number, Set<string>>()
  for (const m of matches) {
    if (m.group === null) continue
    const set = byGroup.get(m.group) ?? new Set<string>()
    if (m.home) set.add(m.home)
    if (m.away) set.add(m.away)
    byGroup.set(m.group, set)
  }
  return [...byGroup.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, set]) => ({ index, members: entrants.filter((e) => set.has(e)) }))
}

export function groupStandings(config: FormatConfig, entrants: string[], matches: EngineMatch[]) {
  return groupMembers(entrants, matches).map(({ index, members }) => ({
    index,
    name: groupName(index),
    rows: computeStandings(
      members,
      matches.filter((m) => m.group === index),
      config
    ),
  }))
}

/**
 * Cross-seeded knockout: all group winners first, then all runners-up, so
 * the standard bracket order keeps teams from one group apart in round one.
 */
function knockoutFromGroups(config: FormatConfig, entrants: string[], groupMatches: EngineMatch[]): PlannedMatch[] {
  const tables = groupStandings(config, entrants, groupMatches)
  const qualifiers: string[] = []
  for (let place = 0; place < config.advancePerGroup; place++) {
    for (const table of tables) {
      const row = table.rows[place]
      if (row) qualifiers.push(row.entrant)
    }
  }
  return planSingleElimination(qualifiers, {
    bracket: 'MAIN',
    thirdPlaceMatch: config.thirdPlaceMatch,
    stagePrefix: 'Pley-off',
  })
}

function nextSwissRound(config: FormatConfig, entrants: string[], matches: EngineMatch[], round: number) {
  const standings = computeStandings(entrants, matches, config, { buchholz: true })
  const played = new Set<string>()
  const hadBye = new Set<string>()
  for (const m of matches) {
    if (m.home && m.away) played.add(pairKey(m.home, m.away))
    else if (m.home || m.away) hadBye.add((m.home ?? m.away)!)
  }
  return swissMatches(swissPairing(standings, played, hadBye), round)
}

// ------------------------------------------------------------
// Results
// ------------------------------------------------------------

/** Standings for formats that have them (null for pure brackets). */
export function standingsFor(
  format: TournamentFormat,
  config: FormatConfig,
  entrants: string[],
  matches: EngineMatch[]
): StandingRow[] | null {
  if (format === 'ROUND_ROBIN') return computeStandings(entrants, matches, config)
  if (format === 'SWISS') return computeStandings(entrants, matches, config, { buchholz: true })
  return null
}

/**
 * Final placement of every entrant (1 = winner; shared on equal stages).
 * Returns null while the competition is still running.
 */
export function placements(
  format: TournamentFormat,
  config: FormatConfig,
  entrants: string[],
  matches: EngineMatch[]
): Map<string, number> | null {
  if (!progress(format, config, entrants, matches).complete) return null

  const elimination = matches.filter((m) => isEliminationBracket(m.bracket))
  const resolved = resolveElimination(elimination)

  switch (format) {
    case 'SINGLE_ELIMINATION':
      return placementsFromLevels(singleEliminationLevels(elimination, resolved))
    case 'DOUBLE_ELIMINATION':
      return placementsFromLevels(doubleEliminationLevels(elimination, resolved))
    case 'ROUND_ROBIN':
    case 'SWISS': {
      const table = standingsFor(format, config, entrants, matches)!
      return new Map(table.map((row) => [row.entrant, row.rank]))
    }
    case 'GROUPS_KNOCKOUT': {
      const knockout = placementsFromLevels(singleEliminationLevels(elimination, resolved))
      const qualified = knockout.size
      const tables = groupStandings(
        config,
        entrants,
        matches.filter((m) => m.bracket === 'GROUP')
      )
      const orderIndex = new Map(entrants.map((e, i) => [e, i]))
      const rest = tables
        .flatMap((t) => t.rows)
        .filter((row) => !knockout.has(row.entrant))
        .sort(
          (a, b) =>
            a.rank - b.rank ||
            b.points - a.points ||
            b.diff - a.diff ||
            b.scored - a.scored ||
            orderIndex.get(a.entrant)! - orderIndex.get(b.entrant)!
        )
      const out = new Map(knockout)
      rest.forEach((row, i) => out.set(row.entrant, qualified + 1 + i))
      return out
    }
    case 'LEADERBOARD':
      // Decided from leaderboard entries, not matches — see lifecycle.ts.
      return null
  }
}

/**
 * Entrants who actually competed: a side of a finalized, played match. A bye
 * is not playing, and on a forfeit only the side that showed up counts.
 */
export function participatedEntrants(matches: EngineMatch[]): Set<string> {
  const out = new Set<string>()
  for (const m of matches) {
    if (!m.finalized || m.cancelled || m.resultType === 'BYE' || !m.home || !m.away) continue
    if (m.resultType === 'FORFEIT') {
      if (m.winner) out.add(m.winner)
      continue
    }
    out.add(m.home)
    out.add(m.away)
  }
  return out
}
