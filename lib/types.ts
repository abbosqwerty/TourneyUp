/**
 * View-model types shared between server pages and client components.
 * These mirror what the pages actually pass down, not the Prisma rows.
 */

export type TournamentCategory = 'sports' | 'esports' | 'academic'
export type TournamentStatusValue =
  | 'upcoming'
  | 'registration_open'
  | 'ongoing'
  | 'completed'
  | 'cancelled'

/**
 * What a tournament card renders. Lists only select these columns, so the
 * long-form fields (`description`, `rules`, `requirements`) stay optional.
 */
export type Tournament = {
  id: string
  title: string
  sport: string
  category: TournamentCategory
  location: string
  date: string
  endDate?: string
  time: string
  participants: number
  maxParticipants: number
  posterUrl: string
  organizer: {
    id: string
    name: string
    avatar: string
    verified: boolean
  }
  description?: string
  rules?: string[]
  requirements?: string[]
  prizePool?: string
  entryFee?: string
  status: TournamentStatusValue
  featured?: boolean
}

/**
 * Detail page view-model: full long-form copy, but the live participant count
 * is passed separately so it can be updated optimistically after a signup.
 */
export type TournamentDetail = Omit<Tournament, 'participants' | 'category'> & {
  category: string
  description: string
  rules: string[]
  requirements: string[]
}

export type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  date: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export type SportRank = {
  sport: string
  rank: number
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'champion'
}

export type User = {
  id: string
  name: string
  username: string
  avatar: string
  bio: string
  university?: string
  location: string
  globalRank: number
  totalPoints: number
  achievements: Achievement[]
  joinedTournaments: number
  wins: number
  losses: number
  sportRanks: SportRank[]
  joinedDate: string
}

/**
 * One leaderboard row. There is deliberately no `change`/`changeAmount`:
 * the app does not store rank history, so a trend arrow would be invented.
 */
export type RankingEntry = {
  rank: number
  user: {
    id: string
    name: string
    username: string
    avatar: string
    university?: string
  }
  points: number
  wins: number
}
