import type { TournamentStatus } from '@prisma/client'

/** Tabs of the competition list and the statuses each one shows (labels: `dict.competition.tabs`). */
export const COMPETITION_TABS = {
  all: { statuses: ['ongoing', 'registration_open', 'upcoming', 'completed'] },
  ongoing: { statuses: ['ongoing'] },
  registration: { statuses: ['registration_open', 'upcoming'] },
  completed: { statuses: ['completed'] },
} as const satisfies Record<string, { statuses: readonly TournamentStatus[] }>

export type CompetitionTab = keyof typeof COMPETITION_TABS

/** Tabs inside one tournament's competition page (labels: `dict.competition.detail`). */
export const TOURNAMENT_TABS = {
  overview: true,
  history: true,
  schedule: true,
} as const

export type TournamentTab = keyof typeof TOURNAMENT_TABS
