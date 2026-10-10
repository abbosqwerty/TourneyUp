import type { TournamentStatus } from '@prisma/client'

/** Tabs of the competition list and the statuses each one shows. */
export const COMPETITION_TABS = {
  all: { label: 'Barchasi', statuses: ['ongoing', 'registration_open', 'upcoming', 'completed'] },
  ongoing: { label: 'Davom etmoqda', statuses: ['ongoing'] },
  registration: { label: 'Ro‘yxat', statuses: ['registration_open', 'upcoming'] },
  completed: { label: 'Yakunlangan', statuses: ['completed'] },
} as const satisfies Record<string, { label: string; statuses: readonly TournamentStatus[] }>

export type CompetitionTab = keyof typeof COMPETITION_TABS

/** Tabs inside one tournament's competition page. */
export const TOURNAMENT_TABS = {
  overview: 'Umumiy',
  history: 'O‘yinlar tarixi',
  schedule: 'Jadval',
} as const

export type TournamentTab = keyof typeof TOURNAMENT_TABS
