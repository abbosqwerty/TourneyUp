import { db } from '../db'
import { listMatches, type MatchView } from '../matches'
import { participatedEntrants, placements, standingsFor, groupStandings } from './engine'
import type { FormatConfig, TournamentFormat } from './config'
import { loadEngineState } from './lifecycle'
import type { StandingRow } from './standings'

/**
 * Everything the competition page shows for ONE tournament. Every query is
 * filtered by `tournamentId`, so two tournaments can never mix.
 */

export type StandingView = StandingRow & { label: string; avatar: string }

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
}

export async function getCompetitionView(tournamentId: string): Promise<CompetitionView> {
  const [tournament, state, allMatches] = await Promise.all([
    db.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      select: { drawGeneratedAt: true, resultsFinalizedAt: true },
    }),
    loadEngineState(db, tournamentId),
    listMatches({ tournamentId, take: 2000, includeByes: true }),
  ])

  const label = (id: string) => {
    const p = state.participants.get(id)
    return p ? p.teamName || p.name : '—'
  }
  const avatars = new Map<string, string>()
  for (const m of allMatches) {
    if (m.home.participantId && m.home.avatar) avatars.set(m.home.participantId, m.home.avatar)
    if (m.away.participantId && m.away.avatar) avatars.set(m.away.participantId, m.away.avatar)
  }
  const decorate = (row: StandingRow): StandingView => ({
    ...row,
    label: label(row.entrant),
    avatar: avatars.get(row.entrant) ?? '',
  })

  const groupMatches = state.matches.filter((m) => m.bracket === 'GROUP' && m.group !== null)
  const groups =
    state.format === 'GROUPS_KNOCKOUT'
      ? groupStandings(state.config, state.entrants, groupMatches).map((g) => ({
          name: g.name,
          rows: g.rows.map(decorate),
        }))
      : []

  const table = standingsFor(state.format, state.config, state.entrants, state.matches)
  const final = state.matches.length > 0 ? placements(state.format, state.config, state.entrants, state.matches) : null
  const played = participatedEntrants(state.matches)

  return {
    format: state.format,
    config: state.config,
    drawn: tournament.drawGeneratedAt !== null,
    finalizedAt: tournament.resultsFinalizedAt?.toISOString() ?? null,
    matches: allMatches.filter((m) => m.bracket !== 'MANUAL'),
    legacyMatches: allMatches.filter((m) => m.bracket === 'MANUAL'),
    groups,
    standings: table ? table.map(decorate) : null,
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
  }
}
