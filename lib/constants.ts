import type { TournamentStatusValue } from './types'

/**
 * Filter vocabulary shown in the UI. `name` is the label; `match` is the
 * substring compared against `Tournament.sport` in SQL — the two differ
 * because the interface is Uzbek while the data is stored in English.
 */
export const sportCategories = [
  { id: 'all', name: 'Barchasi', match: '', icon: 'layout-grid' },
  { id: 'football', name: 'Futbol', match: 'Football', icon: 'circle' },
  { id: 'basketball', name: 'Basketbol', match: 'Basketball', icon: 'circle' },
  { id: 'chess', name: 'Shaxmat', match: 'Chess', icon: 'crown' },
  { id: 'valorant', name: 'Valorant', match: 'Valorant', icon: 'crosshair' },
  { id: 'pubg', name: 'PUBG', match: 'PUBG', icon: 'target' },
  { id: 'rocket-league', name: 'Rocket League', match: 'Rocket League', icon: 'car' },
  { id: 'swimming', name: 'Suzish', match: 'Swimming', icon: 'waves' },
  { id: 'running', name: 'Yugurish', match: 'Running', icon: 'footprints' },
]

export const ALL_LOCATIONS = 'all'

/** `value` goes in the URL, `label` on screen. */
export const locationOptions = [
  { value: ALL_LOCATIONS, label: 'Barcha joylar' },
  { value: 'Tashkent', label: 'Toshkent' },
  { value: 'Samarkand', label: 'Samarqand' },
  { value: 'Fergana', label: 'Farg‘ona' },
  { value: 'Bukhara', label: 'Buxoro' },
  { value: 'Online', label: 'Online' },
]

/**
 * Single source of truth for status badges — previously copied into
 * `tournament-card.tsx` and `tournament-client.tsx` and missing `cancelled`.
 */
export const TOURNAMENT_STATUS_CLASSES: Record<TournamentStatusValue, string> = {
  upcoming: 'bg-secondary text-secondary-foreground',
  registration_open: 'bg-primary text-primary-foreground',
  ongoing: 'bg-success text-success-foreground',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
}

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatusValue, string> = {
  upcoming: 'Kutilmoqda',
  registration_open: 'Ro‘yxat ochiq',
  ongoing: 'Jonli',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
}
