import type { FormatConfig } from './config'

/**
 * LEADERBOARD format: no head-to-head games. Every entrant gets a result in
 * every round (a race, a heat, a battle-royale match) and the table is the
 * running total. Pure functions, like the rest of the engine.
 *
 *   points → sum of round points, higher is better
 *   time   → sum of round times, lower is better; a DNF in any round drops
 *            the entrant below everyone who finished every completed round
 */

export type ScoreKind = FormatConfig['scoreKind']
export type EntryStatus = 'pending' | 'done' | 'dnf'

export type LeaderboardEntryData = {
  entrant: string
  round: number
  value: number | null
  status: EntryStatus
}

export type LeaderboardRow = {
  entrant: string
  rank: number
  /** Points or milliseconds over the rounds counted. */
  total: number
  /** Rounds with a recorded result (done or dnf). */
  recorded: number
  dnf: number
  /** One cell per round: the value, 'DNF', or null while pending. */
  rounds: (number | 'DNF' | null)[]
  /** Places gained (+) or lost (−) since the previous round; null on the first. */
  move: number | null
}

/** A round counts once at least one result in it has been recorded. */
export function startedRounds(entries: LeaderboardEntryData[]) {
  return [...new Set(entries.filter((e) => e.status !== 'pending').map((e) => e.round))].sort((a, b) => a - b)
}

export function leaderboardComplete(entries: LeaderboardEntryData[]) {
  return entries.length > 0 && entries.every((e) => e.status !== 'pending')
}

function rank(
  entrants: string[],
  entries: LeaderboardEntryData[],
  kind: ScoreKind,
  rounds: number,
  upToRound: number
): Omit<LeaderboardRow, 'move'>[] {
  const order = new Map(entrants.map((e, i) => [e, i]))
  const rows = new Map(
    entrants.map((entrant) => [
      entrant,
      { entrant, rank: 0, total: 0, recorded: 0, dnf: 0, rounds: Array<number | 'DNF' | null>(rounds).fill(null) },
    ])
  )

  for (const e of entries) {
    const row = rows.get(e.entrant)
    if (!row || e.round < 1 || e.round > rounds || e.round > upToRound || e.status === 'pending') continue
    row.recorded += 1
    if (e.status === 'dnf' || e.value === null) {
      row.dnf += 1
      row.rounds[e.round - 1] = 'DNF'
    } else {
      row.total += e.value
      row.rounds[e.round - 1] = e.value
    }
  }

  const best = (r: { rounds: (number | 'DNF' | null)[] }) => {
    const values = r.rounds.filter((v): v is number => typeof v === 'number')
    if (values.length === 0) return kind === 'points' ? -Infinity : Infinity
    return kind === 'points' ? Math.max(...values) : Math.min(...values)
  }

  const sorted = [...rows.values()].sort((a, b) => {
    if (kind === 'points') {
      return b.total - a.total || best(b) - best(a) || a.dnf - b.dnf || order.get(a.entrant)! - order.get(b.entrant)!
    }
    // Time: whoever finished more rounds is ahead, then the faster total.
    const finishedA = a.recorded - a.dnf
    const finishedB = b.recorded - b.dnf
    return (
      finishedB - finishedA ||
      (finishedA === 0 ? 0 : a.total - b.total) ||
      best(a) - best(b) ||
      order.get(a.entrant)! - order.get(b.entrant)!
    )
  })

  // Equal results share a place (1, 2, 2, 4).
  sorted.forEach((row, i) => {
    const prev = sorted[i - 1]
    const tied =
      prev &&
      prev.total === row.total &&
      prev.recorded === row.recorded &&
      prev.dnf === row.dnf &&
      best(prev) === best(row) &&
      row.recorded > 0
    row.rank = tied ? prev.rank : i + 1
  })
  return sorted
}

/**
 * The table after every recorded result, with each entrant's movement
 * against the table as it stood before the latest started round.
 */
export function computeLeaderboard(
  config: Pick<FormatConfig, 'scoreKind' | 'leaderboardRounds'>,
  entrants: string[],
  entries: LeaderboardEntryData[]
): LeaderboardRow[] {
  const rounds = config.leaderboardRounds
  const started = startedRounds(entries)
  const latest = started.at(-1) ?? 0
  const current = rank(entrants, entries, config.scoreKind, rounds, rounds)

  if (started.length < 2) return current.map((row) => ({ ...row, move: null }))

  const before = new Map(
    rank(entrants, entries, config.scoreKind, rounds, latest - 1).map((row) => [row.entrant, row.rank])
  )
  return current.map((row) => ({ ...row, move: (before.get(row.entrant) ?? row.rank) - row.rank }))
}

/** Final places once every result is in (null while running). */
export function leaderboardPlacements(
  config: Pick<FormatConfig, 'scoreKind' | 'leaderboardRounds'>,
  entrants: string[],
  entries: LeaderboardEntryData[]
): Map<string, number> | null {
  if (!leaderboardComplete(entries)) return null
  return new Map(computeLeaderboard(config, entrants, entries).map((row) => [row.entrant, row.rank]))
}

/** Entrants who actually took part: at least one finished (non-DNF) round. */
export function leaderboardParticipants(entries: LeaderboardEntryData[]) {
  return new Set(entries.filter((e) => e.status === 'done').map((e) => e.entrant))
}

// ------------------------------------------------------------
// Time values: stored as integer milliseconds
// ------------------------------------------------------------

/** 3725120 → "1:02:05.12"; 65400 → "1:05.40". */
export function formatTime(ms: number) {
  const totalCs = Math.round(ms / 10)
  const cs = totalCs % 100
  const totalSeconds = Math.floor(totalCs / 100)
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60) % 60
  const h = Math.floor(totalSeconds / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  const tail = `${pad(s)}.${pad(cs)}`
  return h > 0 ? `${h}:${pad(m)}:${tail}` : `${m}:${tail}`
}

/**
 * Parse what staff type: "1:02:05.12", "2:05.4", "65.4", "65". Returns
 * milliseconds, or null when the text is not a time.
 */
export function parseTime(text: string): number | null {
  const trimmed = text.trim().replace(',', '.')
  if (!/^\d+(:\d{1,2}){0,2}(\.\d{1,3})?$/.test(trimmed)) return null
  const [clock, fraction = ''] = trimmed.split('.')
  const parts = clock.split(':').map(Number)
  if (parts.slice(1).some((p) => p >= 60)) return null
  const seconds = parts.reduce((acc, p) => acc * 60 + p, 0)
  const ms = seconds * 1000 + Number(fraction.padEnd(3, '0').slice(0, 3))
  return ms > 0 && ms < 2_000_000_000 ? ms : null
}

export function formatScore(kind: ScoreKind, value: number) {
  return kind === 'time' ? formatTime(value) : String(value)
}
