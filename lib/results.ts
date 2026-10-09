import type { MatchStatus } from '@prisma/client'

export const RESULTS_PAGE_SIZE = 20

/** Which match states each tab shows. */
export const RESULTS_TABS = {
  live: ['live'],
  scheduled: ['scheduled'],
  completed: ['completed'],
} as const satisfies Record<string, readonly MatchStatus[]>

export type ResultsTab = keyof typeof RESULTS_TABS

export const RESULTS_TAB_LABELS: Record<ResultsTab, string> = {
  live: 'Jonli',
  scheduled: 'Jadval',
  completed: 'Yakunlangan',
}
