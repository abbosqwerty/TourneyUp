import { db } from '../db'
import { listMatches, type MatchView } from '../matches'
import { participatedEntrants, placements, standingsFor, groupStandings } from './engine'
import { computeLeaderboard, leaderboardParticipants, leaderboardPlacements, type LeaderboardRow } from './leaderboard'
import type { EngineMatch } from './types'
import type { FormatConfig, TournamentFormat } from './config'
import { loadEngineState } from './lifecycle'
import type { StandingRow } from './standings'

/**
 * Everything the competition page shows for ONE tournament. Every query is
 * filtered by `tournamentId`, so two tournaments can never mix.
 */

/** `move`: places gained (+) or lost (−) since the previous round. */
export type StandingView = StandingRow & { label: string; avatar: string; move: number | null }

export type LeaderboardView = LeaderboardRow & { label: string; avatar: string }

export type CompetitionView = {
  format: TournamentFormat
  config: FormatConfig
  drawn: boolean
  finalizedAt: string | null
  /** Every engine match including byes (the bracket needs them). */
  matches: MatchView[]
  /** Fixtures created by hand before the engine existed. */
  legacyMatches: MatchView[]
  groups: { name: string; rows: StandingView[] }[]
  standings: StandingView[] | null
  /** Final placings once the competition is complete. */
  podium: { placement: number; label: string; avatar: string; participated: boolean }[] | null
  entrantCount: number
  /** LEADERBOARD format only. */
  leaderboard: { rows: LeaderboardView[]; rounds: number; doneRounds: number } | null
}

/** The latest round with a played result, so the table can show movement. */
function latestPlayedRound(matches: EngineMatch[]) {
  return Math.max(0, ...matches.filter((m) => m.finalized && m.resultType !== 'BYE').map((m) => m.round))
}

/** Rank before the latest played round, keyed by entrant (null on round one). */
function previousRanks(matches: EngineMatch[], table: (matches: EngineMatch[]) => StandingRow[] | null) {
  const latest = latestPlayedRound(matches)
  if (latest < 2) return null
  const before = table(matches.filter((m) => m.round < latest))
  return before ? new Map(before.map((row) => [row.entrant, row.rank])) : null
}

export async function getCompetitionView(tournamentId: string): Promise<CompetitionView> {
  const [tournament, state, allMatches, avatarRows] = await Promise.all([
    db.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      select: { drawGeneratedAt: true, resultsFinalizedAt: true },
    }),
    loadEngineState(db, tournamentId),
    listMatches({ tournamentId, take: 2000, includeByes: true }),
    db.participant.findMany({ where: { tournamentId }, select: { id: true, avatar: true } }),
  ])

  const label = (id: string) => {
    const p = state.participants.get(id)
    return p ? p.teamName || p.name : '—'
  }
  const avatars = new Map<string, string>(avatarRows.filter((p) => p.avatar).map((p) => [p.id, p.avatar]))
  for (const m of allMatches) {
    if (m.home.participantId && m.home.avatar) avatars.set(m.home.participantId, m.home.avatar)
    if (m.away.participantId && m.away.avatar) avatars.set(m.away.participantId, m.away.avatar)
  }
  const decorate = (row: StandingRow, before: Map<string, number> | null = null): StandingView => ({
    ...row,
    label: label(row.entrant),
    avatar: avatars.get(row.entrant) ?? '',
    move: before ? (before.get(row.entrant) ?? row.rank) - row.rank : null,
  })

  const groupMatches = state.matches.filter((m) => m.bracket === 'GROUP' && m.group !== null)
  const groups =
    state.format === 'GROUPS_KNOCKOUT'
      ? groupStandings(state.config, state.entrants, groupMatches).map((g) => {
          const before = previousRanks(
            groupMatches.filter((m) => m.group === g.index),
            (ms) => groupStandings(state.config, state.entrants, ms).find((x) => x.index === g.index)?.rows ?? null
          )
          return { name: g.name, rows: g.rows.map((row) => decorate(row, before)) }
        })
      : []

  const tableOf = (ms: EngineMatch[]) => standingsFor(state.format, state.config, state.entrants, ms)
  const table = tableOf(state.matches)
  const tableBefore = table ? previousRanks(state.matches, tableOf) : null

  const isLeaderboard = state.format === 'LEADERBOARD'
  const final = isLeaderboard
    ? leaderboardPlacements(state.config, state.entrants, state.leaderboard)
    : state.matches.length > 0
      ? placements(state.format, state.config, state.entrants, state.matches)
      : null
  const played = isLeaderboard ? leaderboardParticipants(state.leaderboard) : participatedEntrants(state.matches)

  const leaderboard = isLeaderboard
    ? {
        rows: computeLeaderboard(state.config, state.entrants, state.leaderboard).map((row) => ({
          ...row,
          label: label(row.entrant),
          avatar: avatars.get(row.entrant) ?? '',
        })),
        rounds: state.config.leaderboardRounds,
        doneRounds: new Set(
          [...Array(state.config.leaderboardRounds).keys()]
            .map((i) => i + 1)
            .filter((r) => {
              const inRound = state.leaderboard.filter((e) => e.round === r)
              return inRound.length > 0 && inRound.every((e) => e.status !== 'pending')
            })
        ).size,
      }
    : null

  return {
    format: state.format,
    config: state.config,
    drawn: tournament.drawGeneratedAt !== null,
    finalizedAt: tournament.resultsFinalizedAt?.toISOString() ?? null,
    matches: allMatches.filter((m) => m.bracket !== 'MANUAL'),
    legacyMatches: allMatches.filter((m) => m.bracket === 'MANUAL'),
    groups,
    standings: table ? table.map((row) => decorate(row, tableBefore)) : null,
    podium: final
      ? [...final.entries()]
          .sort((a, b) => a[1] - b[1])
          .map(([id, placement]) => ({
            placement,
            label: label(id),
            avatar: avatars.get(id) ?? '',
            participated: played.has(id),
          }))
      : null,
    entrantCount: state.entrants.length,
    leaderboard,
  }
}
