import type { Dictionary } from './i18n/dictionaries'

type SportKey = keyof Dictionary['sport_names']

/** Stored sport name (always English, see `SPORT_NAMES`) → dictionary key. */
const SPORT_KEYS: Record<string, SportKey> = {
  football: 'football',
  basketball: 'basketball',
  volleyball: 'volleyball',
  tennis: 'tennis',
  'table tennis': 'table_tennis',
  badminton: 'badminton',
  swimming: 'swimming',
  running: 'running',
  chess: 'chess',
  other: 'other',
}

/**
 * A sport name in the visitor's language. E-sport titles (Valorant,
 * PUBG Mobile …) and anything unknown are shown as stored.
 */
export function sportLabel(dict: Dictionary, sport: string | null | undefined): string {
  if (!sport) return ''
  const key = SPORT_KEYS[sport.trim().toLowerCase()]
  return key ? dict.sport_names[key] : sport
}
