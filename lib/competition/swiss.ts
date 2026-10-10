import type { StandingRow } from './standings'

/** Upper bound on backtracking steps before accepting a rematch. */
const MAX_STEPS = 200_000

export type SwissPairing = { pairs: [string, string][]; bye: string | null }

/**
 * Next Swiss round from the current standings (best first).
 *
 * - Bye: the lowest-ranked entrant who has not had one yet.
 * - Pairs: neighbours in the standings, backtracking to avoid rematches.
 *   Only if no rematch-free pairing exists are rematches accepted.
 */
export function swissPairing(
  standings: StandingRow[],
  played: Set<string>,
  hadBye: Set<string>
): SwissPairing {
  let order = standings.map((row) => row.entrant)
  let bye: string | null = null

  if (order.length % 2 === 1) {
    const candidate = [...order].reverse().find((e) => !hadBye.has(e)) ?? order[order.length - 1]
    bye = candidate
    order = order.filter((e) => e !== candidate)
  }

  const met = (a: string, b: string) => played.has(pairKey(a, b))
  let steps = 0

  const solve = (rest: string[]): [string, string][] | null => {
    if (rest.length === 0) return []
    if (++steps > MAX_STEPS) return null
    const [first, ...others] = rest
    for (let i = 0; i < others.length; i++) {
      if (met(first, others[i])) continue
      const tail = solve([...others.slice(0, i), ...others.slice(i + 1)])
      if (tail) return [[first, others[i]], ...tail]
    }
    return null
  }

  const pairs = solve(order) ?? chunk(order)
  return { pairs, bye }
}

export function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function chunk(order: string[]): [string, string][] {
  const out: [string, string][] = []
  for (let i = 0; i + 1 < order.length; i += 2) out.push([order[i], order[i + 1]])
  return out
}

/** Round one: top half against bottom half (1 v N/2+1, 2 v N/2+2 …). */
export function swissFirstRound(entrants: string[]): SwissPairing {
  const list = [...entrants]
  const bye = list.length % 2 === 1 ? list.pop()! : null
  const half = list.length / 2
  const pairs: [string, string][] = []
  for (let i = 0; i < half; i++) pairs.push([list[i], list[i + half]])
  return { pairs, bye }
}
