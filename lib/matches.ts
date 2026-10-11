import type { BracketType, MatchResultType, MatchStatus, Prisma } from '@prisma/client'
import { db } from './db'

export type MatchSideView = {
  label: string
  score: number | null
  userId: string | null
  participantId: string | null
  avatar: string | null
}

export type MatchView = {
  id: string
  tournamentId: string
  tournamentTitle: string
  sport: string
  stage: string
  status: MatchStatus
  scheduledAt: string | null
  bracket: BracketType
  round: number
  position: number
  groupName: string | null
  isBye: boolean
  resultType: MatchResultType
  finalizedAt: string | null
  home: MatchSideView
  away: MatchSideView
  winnerParticipantId: string | null
  winnerUserId: string | null
  notes: string | null
}

/** Byes and voided slots are bookkeeping, not games people play. */
export const PLAYED_OR_PLAYABLE: Prisma.MatchWhereInput = { isBye: false }

/** One row of a user's personal match history. */
export type UserMatchView = {
  id: string
  tournamentId: string
  tournamentTitle: string
  sport: string
  stage: string
  opponent: string
  result: 'win' | 'loss' | 'draw' | 'pending'
  score: string
  scheduledAt: string | null
}

const matchInclude = {
  tournament: { select: { id: true, title: true, sport: true } },
  homeParticipant: { select: { id: true, avatar: true } },
  awayParticipant: { select: { id: true, avatar: true } },
  group: { select: { name: true } },
} as const

type MatchRow = {
  id: string
  tournamentId: string
  stage: string
  status: MatchStatus
  scheduledAt: Date | null
  bracket: BracketType
  round: number
  position: number
  isBye: boolean
  resultType: MatchResultType
  finalizedAt: Date | null
  winnerParticipantId: string | null
  group: { name: string } | null
  homeLabel: string
  awayLabel: string
  homeScore: number | null
  awayScore: number | null
  homeUserId: string | null
  awayUserId: string | null
  winnerUserId: string | null
  notes: string | null
  tournament: { id: string; title: string; sport: string }
  homeParticipant: { id: string; avatar: string } | null
  awayParticipant: { id: string; avatar: string } | null
}

function toView(row: MatchRow): MatchView {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    tournamentTitle: row.tournament.title,
    sport: row.tournament.sport,
    stage: row.stage,
    status: row.status,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    bracket: row.bracket,
    round: row.round,
    position: row.position,
    groupName: row.group?.name ?? null,
    isBye: row.isBye,
    resultType: row.resultType,
    finalizedAt: row.finalizedAt?.toISOString() ?? null,
    home: {
      label: row.homeLabel,
      score: row.homeScore,
      userId: row.homeUserId,
      participantId: row.homeParticipant?.id ?? null,
      avatar: row.homeParticipant?.avatar ?? null,
    },
    away: {
      label: row.awayLabel,
      score: row.awayScore,
      userId: row.awayUserId,
      participantId: row.awayParticipant?.id ?? null,
      avatar: row.awayParticipant?.avatar ?? null,
    },
    winnerParticipantId: row.winnerParticipantId,
    winnerUserId: row.winnerUserId,
    notes: row.notes,
  }
}

/** Live first, then today's fixtures, then the rest — what a results page wants. */
export async function listMatches(options: {
  tournamentId?: string
  status?: MatchStatus[]
  take?: number
  skip?: number
  includeByes?: boolean
}): Promise<MatchView[]> {
  const rows = await db.match.findMany({
    where: {
      ...(options.tournamentId ? { tournamentId: options.tournamentId } : {}),
      ...(options.status ? { status: { in: options.status } } : {}),
      ...(options.includeByes ? {} : PLAYED_OR_PLAYABLE),
    },
    include: matchInclude,
    orderBy: [{ bracket: 'asc' }, { round: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    take: options.take ?? 50,
    skip: options.skip ?? 0,
  })

  return rows.map(toView)
}

export async function countMatches(options: {
  tournamentId?: string
  status?: MatchStatus[]
}): Promise<number> {
  return db.match.count({
    where: {
      ...(options.tournamentId ? { tournamentId: options.tournamentId } : {}),
      ...(options.status ? { status: { in: options.status } } : {}),
      ...PLAYED_OR_PLAYABLE,
    },
  })
}

/**
 * Find all participant IDs a user is part of — either directly (individual
 * tournaments) or via a team roster (team tournaments). This lets match
 * history and win/loss counts include team matches for every roster member,
 * not just the captain whose userId is denormalised on the Match row.
 */
async function participantIdsForUser(userId: string): Promise<string[]> {
  const [direct, roster] = await Promise.all([
    db.participant.findMany({ where: { userId }, select: { id: true } }),
    db.participantRosterMember.findMany({ where: { userId }, select: { participantId: true } }),
  ])
  const ids = new Set([...direct.map((p) => p.id), ...roster.map((r) => r.participantId)])
  return [...ids]
}

/**
 * A user's own match history. Checks both the denormalised userId columns
 * (individual tournaments) AND the roster table (team tournaments) so every
 * team member sees the team's matches.
 */
export async function listUserMatches(userId: string, take = 20): Promise<UserMatchView[]> {
  const participantIds = await participantIdsForUser(userId)

  const rows = await db.match.findMany({
    where: {
      OR: [
        { homeUserId: userId },
        { awayUserId: userId },
        ...(participantIds.length > 0
          ? [
              { homeParticipantId: { in: participantIds } },
              { awayParticipantId: { in: participantIds } },
            ]
          : []),
      ],
      isBye: false,
      status: { not: 'cancelled' },
    },
    include: matchInclude,
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take,
  })

  const pSet = new Set(participantIds)

  // Deduplicate (a captain may match on both userId and participantId).
  const seen = new Set<string>()
  return rows.flatMap((row) => {
    if (seen.has(row.id)) return []
    seen.add(row.id)

    const isHome =
      row.homeUserId === userId || (row.homeParticipant?.id != null && pSet.has(row.homeParticipant.id))
    const mine = isHome ? row.homeScore : row.awayScore
    const theirs = isHome ? row.awayScore : row.homeScore

    let result: UserMatchView['result'] = 'pending'
    if (row.status === 'completed' && mine !== null && theirs !== null) {
      result = mine > theirs ? 'win' : mine < theirs ? 'loss' : 'draw'
    }

    return [
      {
        id: row.id,
        tournamentId: row.tournamentId,
        tournamentTitle: row.tournament.title,
        sport: row.tournament.sport,
        stage: row.stage,
        opponent: isHome ? row.awayLabel : row.homeLabel,
        result,
        score: mine !== null && theirs !== null ? `${mine}–${theirs}` : '—',
        scheduledAt: row.scheduledAt?.toISOString() ?? null,
      },
    ]
  })
}

/**
 * Win/loss/draw tally for a profile. Includes team matches the user
 * participated in via the roster, not just those where userId is on the Match.
 */
export async function userRecord(userId: string) {
  const participantIds = await participantIdsForUser(userId)

  const participantWhere =
    participantIds.length > 0
      ? [
          { homeParticipantId: { in: participantIds } },
          { awayParticipantId: { in: participantIds } },
        ]
      : []

  const winnerParticipantWhere =
    participantIds.length > 0 ? [{ winnerParticipantId: { in: participantIds } }] : []

  const [wins, completed, draws] = await Promise.all([
    db.match.count({
      where: {
        status: 'completed',
        isBye: false,
        OR: [{ winnerUserId: userId }, ...winnerParticipantWhere],
      },
    }),
    db.match.count({
      where: {
        status: 'completed',
        isBye: false,
        OR: [{ homeUserId: userId }, { awayUserId: userId }, ...participantWhere],
      },
    }),
    db.match.count({
      where: {
        status: 'completed',
        isBye: false,
        winnerUserId: null,
        winnerParticipantId: null,
        OR: [{ homeUserId: userId }, { awayUserId: userId }, ...participantWhere],
      },
    }),
  ])

  return { wins, draws, losses: Math.max(0, completed - wins - draws), played: completed }
}
