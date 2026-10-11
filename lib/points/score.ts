/**
 * Tourney Points (T) — one scoring table for every sport, esport and
 * academic competition.
 *
 *   Final = round(Base × (1 + sizeBonusFactor × log10(N)))
 *
 * N is the number of entrants that actually played (individuals, or teams in
 * team events). Change the constants here and bump `version`; stored awards
 * keep the version they were computed with, and a recalculation brings them
 * up to date.
 */
export type PointsConfig = {
  version: number
  base: {
    first: number
    second: number
    third: number
    topEight: number
    participated: number
    registeredOnly: number
  }
  sizeBonusFactor: number
}

export const POINTS_CONFIG: PointsConfig = {
  version: 1,
  base: {
    first: 100,
    second: 70,
    third: 50,
    /** 4th–8th place. */
    topEight: 25,
    /** Played but finished outside the top 8. */
    participated: 10,
    /** Registered but never played. */
    registeredOnly: 0,
  },
  sizeBonusFactor: 0.2,
}

/**
 * Base points from the final placement. Registration alone never scores:
 * without at least one played match the result is 0, whatever the placement.
 */
export function basePoints(placement: number | null, participated: boolean, config: PointsConfig = POINTS_CONFIG) {
  if (!participated || placement === null || placement < 1) return config.base.registeredOnly
  if (placement === 1) return config.base.first
  if (placement === 2) return config.base.second
  if (placement === 3) return config.base.third
  if (placement <= 8) return config.base.topEight
  return config.base.participated
}

export function sizeMultiplier(fieldSize: number, config: PointsConfig = POINTS_CONFIG) {
  const n = Math.max(1, Math.floor(fieldSize))
  return 1 + config.sizeBonusFactor * Math.log10(n)
}

export function finalPoints(base: number, fieldSize: number, config: PointsConfig = POINTS_CONFIG) {
  return Math.round(base * sizeMultiplier(fieldSize, config))
}
