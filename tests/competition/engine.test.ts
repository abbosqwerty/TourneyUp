import { describe, expect, it } from 'vitest'
import { TOURNAMENT_FORMATS, parseFormatConfig, validateForEntrants } from '@/lib/competition/config'
import { participatedEntrants, placements, planInitial, progress } from '@/lib/competition/engine'
import { bracketOrder, drawOrder, snakeGroups } from '@/lib/competition/seeding'
import { roundRobinPairings } from '@/lib/competition/standings'
import { pairKey } from '@/lib/competition/swiss'
import { applyProgress, entrantsOf, simulate, toEngine } from './simulate'

const SIZES = [2, 3, 5, 8, 13, 16]

describe('seeding', () => {
  it('keeps the top two seeds apart until the final', () => {
    expect(bracketOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
    expect(bracketOrder(4)).toEqual([1, 4, 2, 3])
  })

  it('distributes groups in a snake', () => {
    expect(snakeGroups([1, 2, 3, 4, 5, 6, 7, 8], 4)).toEqual([[1, 8], [2, 7], [3, 6], [4, 5]])
  })

  it('puts seeded entrants first in seed order', () => {
    const order = drawOrder(
      [
        { id: 'a', seed: null },
        { id: 'b', seed: 2 },
        { id: 'c', seed: 1 },
      ],
      'seeded',
      () => 0
    )
    expect(order.slice(0, 2)).toEqual(['c', 'b'])
  })
})

describe('every format runs to completion', () => {
  for (const format of TOURNAMENT_FORMATS) {
    for (const n of SIZES) {
      const config = format === 'GROUPS_KNOCKOUT' && n < 4 ? { groupCount: 1, advancePerGroup: 2 } : {}
      it(`${format} with ${n} entrants`, () => {
        const { config: cfg, entrants, matches } = simulate(format, n, config)
        const result = placements(format, cfg, entrants, matches)!
        expect(result).not.toBeNull()
        expect(result.size).toBe(n)
        // With "lower number wins", the best entrant always wins outright.
        expect([...result.entries()].filter(([, place]) => place === 1).map(([id]) => id)).toEqual(['p1'])
        // No duplicate keys.
        expect(new Set(matches.map((m) => m.key)).size).toBe(matches.length)
      })
    }
  }
})

describe('single elimination', () => {
  it('gives byes to the top seeds and never pairs two byes', () => {
    const plan = planInitial('SINGLE_ELIMINATION', parseFormatConfig(null), entrantsOf(5))
    const first = plan.matches.filter((m) => m.round === 1)
    expect(first).toHaveLength(4)
    expect(first.filter((m) => m.away === null).map((m) => m.home)).toEqual(['p1', 'p2', 'p3'])
    expect(first.every((m) => m.home !== null)).toBe(true)
  })

  it('shares 3rd place between semi-final losers without a third-place match', () => {
    const { config, entrants, matches } = simulate('SINGLE_ELIMINATION', 8)
    const result = placements('SINGLE_ELIMINATION', config, entrants, matches)!
    expect(result.get('p1')).toBe(1)
    expect(result.get('p2')).toBe(2)
    expect(result.get('p3')).toBe(3)
    expect(result.get('p4')).toBe(3)
    expect([5, 6, 7, 8].map((i) => result.get(`p${i}`))).toEqual([5, 5, 5, 5])
  })

  it('splits 3rd and 4th with a third-place match', () => {
    const { config, entrants, matches } = simulate('SINGLE_ELIMINATION', 8, { thirdPlaceMatch: true })
    const result = placements('SINGLE_ELIMINATION', config, entrants, matches)!
    expect(result.get('p3')).toBe(3)
    expect(result.get('p4')).toBe(4)
    expect(result.get('p5')).toBe(5)
  })

  it('is idempotent: progress on a settled state changes nothing', () => {
    const { config, entrants, matches } = simulate('SINGLE_ELIMINATION', 13)
    const again = progress('SINGLE_ELIMINATION', config, entrants, matches)
    expect(again.updates).toEqual([])
    expect(again.create).toBeNull()
    expect(again.complete).toBe(true)
  })

  it('a bye is not participation; a forfeit loser did not participate', () => {
    const { matches } = simulate('SINGLE_ELIMINATION', 3, {}, (m) =>
      m.away === 'p3'
        ? { winner: m.home, homeScore: 0, awayScore: 0, forfeit: true }
        : { winner: m.home, homeScore: 1, awayScore: 0 }
    )
    const played = participatedEntrants(matches)
    expect(played.has('p3')).toBe(false)
    expect(played.has('p2')).toBe(true)
    expect(played.has('p1')).toBe(true)
  })
})

describe('double elimination', () => {
  it('places by elimination stage', () => {
    const { config, entrants, matches } = simulate('DOUBLE_ELIMINATION', 8)
    const result = placements('DOUBLE_ELIMINATION', config, entrants, matches)!
    expect(result.get('p1')).toBe(1)
    expect(result.get('p2')).toBe(2)
    expect(result.get('p3')).toBe(3)
    expect(result.get('p4')).toBe(4)
    expect(result.get('p5')).toBe(5)
    expect(result.get('p6')).toBe(5)
    expect(result.get('p7')).toBe(7)
    expect(result.get('p8')).toBe(7)
  })

  it('plays the reset final only when the losers-bracket side wins game one', () => {
    // p2 loses the WB final to p1, comes back through the LB and wins GF1.
    const { config, entrants, matches } = simulate('DOUBLE_ELIMINATION', 4, {}, (m) => {
      if (m.bracket === 'GRAND_FINAL' && m.round === 1) return { winner: m.away, homeScore: 0, awayScore: 1 }
      const h = Number(m.home!.slice(1))
      const a = Number(m.away!.slice(1))
      return h < a ? { winner: m.home, homeScore: 1, awayScore: 0 } : { winner: m.away, homeScore: 0, awayScore: 1 }
    })
    const reset = matches.find((m) => m.bracket === 'GRAND_FINAL' && m.round === 2)!
    expect(reset.cancelled).toBe(false)
    expect(reset.finalized).toBe(true)
    const result = placements('DOUBLE_ELIMINATION', config, entrants, matches)!
    expect(result.get('p1')).toBe(1)
    expect(result.get('p2')).toBe(2)
  })

  it('voids the reset final when the winners-bracket side wins', () => {
    const { matches } = simulate('DOUBLE_ELIMINATION', 4)
    expect(matches.find((m) => m.bracket === 'GRAND_FINAL' && m.round === 2)!.cancelled).toBe(true)
  })
})

describe('round robin', () => {
  it('pairs everyone with everyone exactly once', () => {
    for (const n of [2, 3, 4, 7, 10]) {
      const pairs = roundRobinPairings(entrantsOf(n)).flat()
      expect(pairs).toHaveLength((n * (n - 1)) / 2)
      expect(new Set(pairs.map(([a, b]) => pairKey(a, b))).size).toBe(pairs.length)
    }
  })

  it('breaks a points tie on head-to-head before goal difference', () => {
    const config = parseFormatConfig(null)
    const entrants = entrantsOf(3)
    const matches = planInitial('ROUND_ROBIN', config, entrants).matches.map(toEngine)
    // p1 beats p2 1-0, p2 beats p3 9-0, p3 beats p1 1-0 → all 3 pts.
    const results: Record<string, [string, number, number]> = {
      [pairKey('p1', 'p2')]: ['p1', 1, 0],
      [pairKey('p2', 'p3')]: ['p2', 9, 0],
      [pairKey('p1', 'p3')]: ['p3', 1, 0],
    }
    for (const m of matches) {
      const [winner, w, l] = results[pairKey(m.home!, m.away!)]
      Object.assign(m, {
        finalized: true,
        winner,
        homeScore: m.home === winner ? w : l,
        awayScore: m.away === winner ? w : l,
      })
    }
    const result = placements('ROUND_ROBIN', config, entrants, matches)!
    // Head-to-head is level (each won once) → goal difference decides.
    expect(result.get('p2')).toBe(1)
    expect(result.get('p1')).toBe(2)
    expect(result.get('p3')).toBe(3)
  })
})

describe('groups + knockout', () => {
  it('creates the knockout only after every group match is final', () => {
    const config = { ...parseFormatConfig(null), groupCount: 2, advancePerGroup: 2 }
    const entrants = entrantsOf(8)
    const matches = planInitial('GROUPS_KNOCKOUT', config, entrants).matches.map(toEngine)
    const first = progress('GROUPS_KNOCKOUT', config, entrants, matches)
    expect(first.create).toBeNull()
    expect(first.complete).toBe(false)

    for (const m of matches) Object.assign(m, { finalized: true, winner: m.home, homeScore: 1, awayScore: 0 })
    const next = progress('GROUPS_KNOCKOUT', config, entrants, matches)
    expect(next.create?.matches.filter((m) => m.round === 1)).toHaveLength(2)
  })

  it('keeps group mates apart in the first knockout round', () => {
    const { matches } = simulate('GROUPS_KNOCKOUT', 16, { groupCount: 4, advancePerGroup: 2 })
    const groupOf = new Map<string, number>()
    for (const m of matches.filter((x) => x.bracket === 'GROUP')) {
      groupOf.set(m.home!, m.group!)
      groupOf.set(m.away!, m.group!)
    }
    const firstKo = matches.filter((m) => m.bracket === 'MAIN' && m.round === 1)
    for (const m of firstKo) expect(groupOf.get(m.home!)).not.toBe(groupOf.get(m.away!))
  })
})

describe('swiss', () => {
  it('avoids rematches and gives each bye to a different entrant', () => {
    const { matches } = simulate('SWISS', 7, { swissRounds: 4 })
    const pairs = matches.filter((m) => m.home && m.away).map((m) => pairKey(m.home!, m.away!))
    expect(new Set(pairs).size).toBe(pairs.length)
    const byes = matches.filter((m) => m.resultType === 'BYE').map((m) => m.home ?? m.away)
    expect(new Set(byes).size).toBe(byes.length)
    expect(Math.max(...matches.map((m) => m.round))).toBe(4)
  })

  it('does not create round two until round one is final', () => {
    const config = parseFormatConfig(null)
    const entrants = entrantsOf(8)
    const matches = planInitial('SWISS', config, entrants).matches.map(toEngine)
    matches[0].finalized = true
    matches[0].winner = matches[0].home
    expect(progress('SWISS', config, entrants, matches).create).toBeNull()
  })

  it('re-running progression on the same state never reshuffles', () => {
    const config = parseFormatConfig(null)
    const entrants = entrantsOf(8)
    const matches = planInitial('SWISS', config, entrants).matches.map(toEngine)
    for (const m of matches) Object.assign(m, { finalized: true, winner: m.home, homeScore: 1, awayScore: 0 })
    const a = progress('SWISS', config, entrants, matches).create
    const b = progress('SWISS', config, entrants, matches).create
    expect(a).toEqual(b)
    applyProgress('SWISS', config, entrants, matches)
    expect(progress('SWISS', config, entrants, matches).create).toBeNull()
  })
})

describe('config validation', () => {
  it('rejects too few entrants and impossible groups', () => {
    const config = parseFormatConfig(null)
    expect(validateForEntrants('SINGLE_ELIMINATION', config, 1)).toMatch(/kamida 2/)
    expect(validateForEntrants('GROUPS_KNOCKOUT', { ...config, groupCount: 4 }, 6)).toMatch(/guruh/)
    expect(validateForEntrants('ROUND_ROBIN', config, 2)).toBeNull()
  })
})
