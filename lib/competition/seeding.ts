import type { Rng } from './types'

export function nextPowerOfTwo(n: number) {
  let size = 1
  while (size < n) size *= 2
  return size
}

/**
 * Standard bracket order: which seed sits in each slot so that seed 1 and
 * seed 2 can only meet in the final. For 8 → [1, 8, 4, 5, 2, 7, 3, 6].
 */
export function bracketOrder(size: number): number[] {
  let order = [1]
  while (order.length < size) {
    const total = order.length * 2 + 1
    order = order.flatMap((seed) => [seed, total - seed])
  }
  return order
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export type SeedCandidate = { id: string; seed: number | null }

/**
 * Final draw order. With `seeded`, entrants that carry a seed come first in
 * seed order and the rest are drawn at random behind them; with `random`
 * seeds are ignored entirely.
 */
export function drawOrder(entrants: SeedCandidate[], mode: 'random' | 'seeded', rng: Rng): string[] {
  if (mode === 'random') return shuffle(entrants.map((e) => e.id), rng)

  const seeded = entrants
    .filter((e) => e.seed !== null)
    .sort((a, b) => (a.seed as number) - (b.seed as number))
    .map((e) => e.id)
  const unseeded = shuffle(
    entrants.filter((e) => e.seed === null).map((e) => e.id),
    rng
  )
  return [...seeded, ...unseeded]
}

/** Seeded-snake distribution into groups: A B C D D C B A A B … */
export function snakeGroups<T>(entrants: readonly T[], groupCount: number): T[][] {
  const groups: T[][] = Array.from({ length: groupCount }, () => [])
  entrants.forEach((entrant, index) => {
    const row = Math.floor(index / groupCount)
    const col = index % groupCount
    groups[row % 2 === 0 ? col : groupCount - 1 - col].push(entrant)
  })
  return groups
}

export function groupName(index: number) {
  return `${String.fromCharCode(65 + (index % 26))}${index >= 26 ? Math.floor(index / 26) + 1 : ''} guruh`
}
