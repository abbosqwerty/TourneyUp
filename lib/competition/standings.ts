import type { FormatConfig } from './config'
import type { EngineMatch } from './types'

export type StandingRow = {
  entrant: string
  played: number
  wins: number
  draws: number
  losses: number
  byes: number
  scored: number
  conceded: number
  diff: number
  points: number
  /** Sum of opponents' points (Swiss tiebreak). */
  buchholz: number
  rank: number
}

type PointRules = Pick<FormatConfig, 'winPoints' | 'drawPoints' | 'lossPoints'>

/**
 * Standings from finalized matches. A bye scores as a win but is not a
 * played game; a forfeit is a win/loss without goals.
 *
 * Tiebreak order (documented in TASK.md, decision #3):
 *   points → [buchholz, swiss only] → head-to-head points among the tied
 *   → goal difference → goals scored → entrant order (seed / registration).
 */
export function computeStandings(
  entrants: string[],
  matches: EngineMatch[],
  rules: PointRules,
  options: { buchholz?: boolean } = {}
): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    entrants.map((entrant) => [
      entrant,
      { entrant, played: 0, wins: 0, draws: 0, losses: 0, byes: 0, scored: 0, conceded: 0, diff: 0, points: 0, buchholz: 0, rank: 0 },
    ])
  )
  const opponents = new Map<string, string[]>(entrants.map((e) => [e, []]))
  const finalized = matches.filter((m) => m.finalized && !m.cancelled)

  for (const m of finalized) {
    if (m.resultType === 'BYE' || m.home === null || m.away === null) {
      const lone = m.home ?? m.away
      const row = lone ? rows.get(lone) : undefined
      if (row) {
        row.byes += 1
        row.points += rules.winPoints
      }
      continue
    }

    const home = rows.get(m.home)
    const away = rows.get(m.away)
    if (!home || !away) continue

    home.played += 1
    away.played += 1
    opponents.get(m.home)!.push(m.away)
    opponents.get(m.away)!.push(m.home)

    if (m.resultType === 'NORMAL' && m.homeScore !== null && m.awayScore !== null) {
      home.scored += m.homeScore
      home.conceded += m.awayScore
      away.scored += m.awayScore
      away.conceded += m.homeScore
    }

    if (m.winner === m.home) {
      home.wins += 1
      home.points += rules.winPoints
      away.losses += 1
      away.points += rules.lossPoints
    } else if (m.winner === m.away) {
      away.wins += 1
      away.points += rules.winPoints
      home.losses += 1
      home.points += rules.lossPoints
    } else {
      home.draws += 1
      away.draws += 1
      home.points += rules.drawPoints
      away.points += rules.drawPoints
    }
  }

  for (const row of rows.values()) {
    row.diff = row.scored - row.conceded
    row.buchholz = (opponents.get(row.entrant) ?? []).reduce((sum, o) => sum + (rows.get(o)?.points ?? 0), 0)
  }

  const orderIndex = new Map(entrants.map((e, i) => [e, i]))
  const headToHead = (group: StandingRow[]) => {
    const ids = new Set(group.map((r) => r.entrant))
    const pts = new Map<string, number>(group.map((r) => [r.entrant, 0]))
    for (const m of finalized) {
      if (!m.home || !m.away || !ids.has(m.home) || !ids.has(m.away)) continue
      if (m.winner === m.home) pts.set(m.home, pts.get(m.home)! + rules.winPoints)
      else if (m.winner === m.away) pts.set(m.away, pts.get(m.away)! + rules.winPoints)
      else {
        pts.set(m.home, pts.get(m.home)! + rules.drawPoints)
        pts.set(m.away, pts.get(m.away)! + rules.drawPoints)
      }
    }
    return pts
  }

  // Sort by the primary keys, then break remaining ties inside each block.
  const primary = (a: StandingRow, b: StandingRow) =>
    b.points - a.points || (options.buchholz ? b.buchholz - a.buchholz : 0)

  const sorted = [...rows.values()].sort(primary)
  const result: StandingRow[] = []
  for (let i = 0; i < sorted.length; ) {
    let j = i + 1
    while (j < sorted.length && primary(sorted[i], sorted[j]) === 0) j++
    const block = sorted.slice(i, j)
    if (block.length > 1) {
      const h2h = headToHead(block)
      block.sort(
        (a, b) =>
          h2h.get(b.entrant)! - h2h.get(a.entrant)! ||
          b.diff - a.diff ||
          b.scored - a.scored ||
          orderIndex.get(a.entrant)! - orderIndex.get(b.entrant)!
      )
    }
    result.push(...block)
    i = j
  }

  result.forEach((row, index) => (row.rank = index + 1))
  return result
}

/** Circle-method round robin: every entrant meets every other exactly once. */
export function roundRobinPairings(entrants: string[]): [string, string][][] {
  const list: (string | null)[] = [...entrants]
  if (list.length % 2 === 1) list.push(null)
  const n = list.length
  const rounds: [string, string][][] = []

  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]
      const b = list[n - 1 - i]
      if (a === null || b === null) continue
      // Alternate home/away so nobody is always "home".
      pairs.push(r % 2 === 1 && i === 0 ? [b, a] : [a, b])
    }
    rounds.push(pairs)
    // Keep the first entrant fixed, rotate everyone else one step.
    list.splice(1, 0, list.pop()!)
  }

  return rounds
}
