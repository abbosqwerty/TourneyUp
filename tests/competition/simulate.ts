import { parseFormatConfig, type FormatConfig, type TournamentFormat } from '@/lib/competition/config'
import { planInitial, progress } from '@/lib/competition/engine'
import type { EngineMatch, PlannedMatch } from '@/lib/competition/types'

export const entrantsOf = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)

export function toEngine(planned: PlannedMatch): EngineMatch {
  return {
    ...planned,
    finalized: false,
    cancelled: false,
    resultType: 'NORMAL',
    homeScore: null,
    awayScore: null,
    winner: null,
  }
}

/** Apply the engine's updates/creations the way lifecycle.ts does. */
export function applyProgress(
  format: TournamentFormat,
  config: FormatConfig,
  entrants: string[],
  matches: EngineMatch[]
) {
  for (let guard = 0; guard < 50; guard++) {
    const p = progress(format, config, entrants, matches)
    if (p.updates.length === 0 && !p.create) return p
    for (const u of p.updates) {
      const m = matches.find((x) => x.key === u.key)!
      m.home = u.home
      m.away = u.away
      if (u.auto === 'BYE') {
        Object.assign(m, { finalized: true, cancelled: false, resultType: 'BYE', winner: u.winner, homeScore: null, awayScore: null })
      } else if (u.auto === 'VOID') {
        Object.assign(m, { finalized: false, cancelled: true, resultType: 'NORMAL', winner: null })
      } else if (m.resultType === 'BYE' || m.cancelled) {
        Object.assign(m, { finalized: false, cancelled: false, resultType: 'NORMAL', winner: null })
      }
    }
    if (p.create) matches.push(...p.create.matches.map(toEngine))
  }
  throw new Error('progress did not converge')
}

/** Decide a real match. Default: the entrant with the lower number wins. */
export type Decider = (m: EngineMatch) => { winner: string | null; homeScore: number; awayScore: number; forfeit?: boolean }

export const lowerSeedWins: Decider = (m) => {
  const h = Number(m.home!.slice(1))
  const a = Number(m.away!.slice(1))
  return h < a ? { winner: m.home, homeScore: 2, awayScore: 0 } : { winner: m.away, homeScore: 0, awayScore: 2 }
}

export function simulate(
  format: TournamentFormat,
  n: number,
  configInput: Partial<FormatConfig> = {},
  decide: Decider = lowerSeedWins
) {
  const config = { ...parseFormatConfig(null), ...configInput }
  const entrants = entrantsOf(n)
  const matches = planInitial(format, config, entrants).matches.map(toEngine)

  for (let step = 0; step < 10_000; step++) {
    const p = applyProgress(format, config, entrants, matches)
    if (p.complete) return { config, entrants, matches }
    const playable = matches.filter((m) => !m.finalized && !m.cancelled && m.home && m.away)
    if (playable.length === 0) throw new Error('stuck: nothing playable and not complete')
    for (const m of playable) {
      const r = decide(m)
      Object.assign(m, {
        finalized: true,
        winner: r.winner,
        homeScore: r.homeScore,
        awayScore: r.awayScore,
        resultType: r.forfeit ? 'FORFEIT' : 'NORMAL',
      })
    }
  }
  throw new Error('simulation did not finish')
}
