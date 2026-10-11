import { randomInt } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { db } from '../db'
import {
  drawsAllowed,
  parseFormatConfig,
  validateForEntrants,
  type FormatConfig,
  type TournamentFormat,
} from './config'
import { participatedEntrants, placements, planInitial, progress } from './engine'
import {
  leaderboardComplete,
  leaderboardParticipants,
  leaderboardPlacements,
  type EntryStatus,
  type LeaderboardEntryData,
} from './leaderboard'
import { drawOrder } from './seeding'
import { matchKey, type Bracket, type EngineMatch, type Plan, type Rng, type Slot } from './types'

/**
 * Database side of the format engine. Not a server action module: these
 * helpers are only called from guarded actions in `lib/actions.ts` and
 * `lib/match-actions.ts` after the permission check.
 *
 * Every write runs in one transaction that first locks the tournament row
 * (`SELECT … FOR UPDATE`), so concurrent requests for the same tournament
 * queue up instead of racing. Together with the unique
 * (tournamentId, bracket, round, position) key this makes the draw and every
 * progression step idempotent.
 */

type Tx = Prisma.TransactionClient

/** A rule violation with a message safe to show the organizer. */
export class CompetitionError extends Error {}

const TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 }

/** Registrations that may play: approved, and paid unless the fee was waived. */
export const ELIGIBLE_PARTICIPANT: Prisma.ParticipantWhereInput = {
  status: 'approved',
  paymentStatus: { in: ['paid', 'waived'] },
}

async function lockTournament(tx: Tx, tournamentId: string) {
  await tx.$queryRaw`SELECT id FROM Tournament WHERE id = ${tournamentId} FOR UPDATE`
  const tournament = await tx.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      status: true,
      format: true,
      formatConfigJson: true,
      drawGeneratedAt: true,
      resultsFinalizedAt: true,
      participantType: true,
      teamSize: true,
    },
  })
  if (!tournament) throw new CompetitionError('Turnir topilmadi')
  return tournament
}

type ParticipantRow = { id: string; name: string; teamName: string | null; userId: string | null; seed: number | null }

const sideLabel = (p: ParticipantRow | undefined) => (p ? p.teamName || p.name : '')

/** Stable entrant order for tiebreaks: seed, then registration order. */
function orderParticipants(rows: (ParticipantRow & { registeredAt: string })[]) {
  return [...rows].sort(
    (a, b) =>
      (a.seed ?? Number.MAX_SAFE_INTEGER) - (b.seed ?? Number.MAX_SAFE_INTEGER) ||
      a.registeredAt.localeCompare(b.registeredAt) ||
      a.id.localeCompare(b.id)
  )
}

export type EngineState = {
  format: TournamentFormat
  config: FormatConfig
  entrants: string[]
  participants: Map<string, ParticipantRow>
  matches: EngineMatch[]
  /** LEADERBOARD format only: one row per entrant per round. */
  leaderboard: LeaderboardEntryData[]
  idByKey: Map<string, string>
  keyById: Map<string, string>
  groupIdByIndex: Map<number, string>
}

/** Read everything the engine needs. MANUAL (pre-engine) fixtures are ignored. */
export async function loadEngineState(client: Tx | typeof db, tournamentId: string): Promise<EngineState> {
  const [tournament, groups, rows, participantRows, entryRows] = await Promise.all([
    client.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      select: { format: true, formatConfigJson: true },
    }),
    client.competitionGroup.findMany({ where: { tournamentId }, select: { id: true, order: true } }),
    client.match.findMany({
      where: { tournamentId, bracket: { not: 'MANUAL' } },
      select: {
        id: true,
        bracket: true,
        round: true,
        position: true,
        groupId: true,
        stage: true,
        status: true,
        homeParticipantId: true,
        awayParticipantId: true,
        nextMatchId: true,
        nextSlot: true,
        loserNextMatchId: true,
        loserNextSlot: true,
        finalizedAt: true,
        resultType: true,
        homeScore: true,
        awayScore: true,
        winnerParticipantId: true,
      },
    }),
    client.participant.findMany({
      where: { tournamentId },
      select: { id: true, name: true, teamName: true, userId: true, seed: true, registeredAt: true },
    }),
    client.leaderboardEntry.findMany({
      where: { tournamentId },
      select: { participantId: true, round: true, value: true, status: true },
    }),
  ])

  const groupIndexById = new Map(groups.map((g) => [g.id, g.order]))
  const keyById = new Map(rows.map((r) => [r.id, matchKey(r.bracket as Bracket, r.round, r.position)]))
  const idByKey = new Map([...keyById].map(([id, key]) => [key, id]))

  const matches: EngineMatch[] = rows.map((r) => ({
    key: keyById.get(r.id)!,
    bracket: r.bracket as Bracket,
    round: r.round,
    position: r.position,
    group: r.groupId ? (groupIndexById.get(r.groupId) ?? null) : null,
    stage: r.stage,
    home: r.homeParticipantId,
    away: r.awayParticipantId,
    next: r.nextMatchId && r.nextSlot ? { key: keyById.get(r.nextMatchId)!, slot: r.nextSlot as Slot } : null,
    loserNext:
      r.loserNextMatchId && r.loserNextSlot
        ? { key: keyById.get(r.loserNextMatchId)!, slot: r.loserNextSlot as Slot }
        : null,
    finalized: r.finalizedAt !== null,
    cancelled: r.status === 'cancelled',
    resultType: r.resultType,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    winner: r.winnerParticipantId,
  }))

  // Entrants = everyone placed in the draw (round one / groups / swiss r1).
  const inDraw = new Set<string>()
  for (const m of matches) {
    if (m.home) inDraw.add(m.home)
    if (m.away) inDraw.add(m.away)
  }
  for (const e of entryRows) inDraw.add(e.participantId)

  const ordered = orderParticipants(participantRows.filter((p) => inDraw.has(p.id)))

  return {
    format: tournament.format,
    config: parseFormatConfig(tournament.formatConfigJson),
    entrants: ordered.map((p) => p.id),
    participants: new Map(participantRows.map((p) => [p.id, p])),
    matches,
    leaderboard: entryRows.map((e) => ({
      entrant: e.participantId,
      round: e.round,
      value: e.value,
      status: e.status as EntryStatus,
    })),
    idByKey,
    keyById,
    groupIdByIndex: new Map(groups.map((g) => [g.order, g.id])),
  }
}

/** Insert a plan's groups and matches, then wire next/loserNext links. */
async function writePlan(tx: Tx, tournamentId: string, plan: Plan, participants: Map<string, ParticipantRow>) {
  const groupIds = new Map<number, string>()
  for (const group of plan.groups) {
    const row = await tx.competitionGroup.create({
      data: { tournamentId, name: group.name, order: group.index },
      select: { id: true },
    })
    groupIds.set(group.index, row.id)
  }
  if (plan.groups.length === 0) {
    const existing = await tx.competitionGroup.findMany({ where: { tournamentId }, select: { id: true, order: true } })
    for (const g of existing) groupIds.set(g.order, g.id)
  }

  await tx.match.createMany({
    data: plan.matches.map((m) => {
      const home = m.home ? participants.get(m.home) : undefined
      const away = m.away ? participants.get(m.away) : undefined
      return {
        tournamentId,
        bracket: m.bracket,
        round: m.round,
        position: m.position,
        groupId: m.group !== null ? (groupIds.get(m.group) ?? null) : null,
        stage: m.stage,
        homeParticipantId: m.home,
        awayParticipantId: m.away,
        homeLabel: sideLabel(home),
        awayLabel: sideLabel(away),
        homeUserId: home?.userId ?? null,
        awayUserId: away?.userId ?? null,
      }
    }),
  })

  const created = await tx.match.findMany({
    where: { tournamentId, bracket: { not: 'MANUAL' } },
    select: { id: true, bracket: true, round: true, position: true },
  })
  const idByKey = new Map(created.map((r) => [matchKey(r.bracket as Bracket, r.round, r.position), r.id]))

  for (const m of plan.matches) {
    if (!m.next && !m.loserNext) continue
    await tx.match.update({
      where: { id: idByKey.get(m.key)! },
      data: {
        nextMatchId: m.next ? idByKey.get(m.next.key) : null,
        nextSlot: m.next?.slot ?? null,
        loserNextMatchId: m.loserNext ? idByKey.get(m.loserNext.key) : null,
        loserNextSlot: m.loserNext?.slot ?? null,
      },
    })
  }
}

export type AdvanceResult = { justCompleted: boolean; complete: boolean }

/**
 * Bring the stored competition in line with its results: fill slots, settle
 * byes, open the next stage. Repeats until nothing changes. Refuses to touch
 * a match that has already been played — a result correction that would
 * change a later, played match is rejected and the transaction rolls back.
 */
async function markComplete(tx: Tx, tournamentId: string, complete: boolean): Promise<AdvanceResult> {
  if (!complete) return { justCompleted: false, complete: false }
  const tournament = await tx.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { resultsFinalizedAt: true },
  })
  if (tournament.resultsFinalizedAt) return { justCompleted: false, complete: true }

  const now = new Date()
  await tx.tournament.update({
    where: { id: tournamentId },
    data: { resultsFinalizedAt: now, status: 'completed', closedAt: now },
  })
  return { justCompleted: true, complete: true }
}

async function advance(tx: Tx, tournamentId: string): Promise<AdvanceResult> {
  for (let pass = 0; pass < 64; pass++) {
    const state = await loadEngineState(tx, tournamentId)
    if (state.format === 'LEADERBOARD') {
      return markComplete(tx, tournamentId, leaderboardComplete(state.leaderboard))
    }
    const step = progress(state.format, state.config, state.entrants, state.matches)

    if (step.updates.length === 0 && !step.create) {
      return markComplete(tx, tournamentId, step.complete)
    }

    const now = new Date()
    for (const update of step.updates) {
      const match = state.matches.find((m) => m.key === update.key)!
      const playedByPeople = match.finalized && match.resultType !== 'BYE'
      if (playedByPeople && (match.home !== update.home || match.away !== update.away || update.auto)) {
        throw new CompetitionError(
          `Bu o‘zgarish allaqachon o‘ynalgan o‘yinga ta’sir qiladi (${match.stage}). Avval o‘sha o‘yin natijasini tuzating.`
        )
      }

      const home = update.home ? state.participants.get(update.home) : undefined
      const away = update.away ? state.participants.get(update.away) : undefined
      const winner = update.winner ? state.participants.get(update.winner) : undefined

      const sides = {
        homeParticipantId: update.home,
        awayParticipantId: update.away,
        homeLabel: sideLabel(home),
        awayLabel: sideLabel(away),
        homeUserId: home?.userId ?? null,
        awayUserId: away?.userId ?? null,
      }

      let result: Prisma.MatchUpdateInput
      if (update.auto === 'BYE') {
        result = {
          isBye: true,
          resultType: 'BYE',
          status: 'completed',
          finalizedAt: now,
          winnerParticipant: winner ? { connect: { id: winner.id } } : { disconnect: true },
          winnerUser: winner?.userId ? { connect: { id: winner.userId } } : { disconnect: true },
          homeScore: null,
          awayScore: null,
        }
      } else if (update.auto === 'VOID') {
        result = {
          isBye: true,
          resultType: 'NORMAL',
          status: 'cancelled',
          finalizedAt: null,
          winnerParticipant: { disconnect: true },
          winnerUser: { disconnect: true },
          homeScore: null,
          awayScore: null,
        }
      } else if (match.resultType === 'BYE' || match.cancelled) {
        result = {
          isBye: false,
          resultType: 'NORMAL',
          status: 'scheduled',
          finalizedAt: null,
          winnerParticipant: { disconnect: true },
          winnerUser: { disconnect: true },
        }
      } else {
        result = {}
      }

      await tx.match.update({
        where: { id: state.idByKey.get(update.key)! },
        data: {
          homeParticipant: sides.homeParticipantId ? { connect: { id: sides.homeParticipantId } } : { disconnect: true },
          awayParticipant: sides.awayParticipantId ? { connect: { id: sides.awayParticipantId } } : { disconnect: true },
          homeUser: sides.homeUserId ? { connect: { id: sides.homeUserId } } : { disconnect: true },
          awayUser: sides.awayUserId ? { connect: { id: sides.awayUserId } } : { disconnect: true },
          homeLabel: sides.homeLabel,
          awayLabel: sides.awayLabel,
          ...result,
        },
      })
    }

    if (step.create) await writePlan(tx, tournamentId, step.create, state.participants)
  }

  throw new Error(`advance(${tournamentId}) did not converge`)
}

export type StartResult = { created: boolean; matchCount: number }

/**
 * Write the draw. Called when a tournament moves from registration to
 * `ongoing`; a second call — retry, double click, concurrent request — finds
 * `drawGeneratedAt` set and does nothing.
 */
export async function startCompetition(tournamentId: string, rng: Rng = randomInt): Promise<StartResult> {
  return db.$transaction(async (tx) => {
    const tournament = await lockTournament(tx, tournamentId)
    if (tournament.drawGeneratedAt) {
      const matchCount = await tx.match.count({ where: { tournamentId, bracket: { not: 'MANUAL' } } })
      return { created: false, matchCount }
    }

    const config = parseFormatConfig(tournament.formatConfigJson)
    const approved = await tx.participant.findMany({
      where: { tournamentId, ...ELIGIBLE_PARTICIPANT },
      select: {
        id: true,
        name: true,
        teamName: true,
        userId: true,
        seed: true,
        registeredAt: true,
        _count: { select: { roster: true } },
      },
    })
    // A team plays only with a full roster (players may have left since registering).
    const eligible =
      tournament.participantType === 'TEAM'
        ? approved.filter((p) => p._count.roster >= (tournament.teamSize ?? 1))
        : approved

    const problem = validateForEntrants(tournament.format, config, eligible.length)
    if (problem) throw new CompetitionError(problem)

    const ordered = orderParticipants(eligible)
    const entrants = drawOrder(ordered, config.seeding, rng)
    const plan = planInitial(tournament.format, config, entrants)

    await writePlan(tx, tournamentId, plan, new Map(eligible.map((p) => [p.id, p])))
    if (tournament.format === 'LEADERBOARD') {
      await tx.leaderboardEntry.createMany({
        data: entrants.flatMap((participantId) =>
          Array.from({ length: config.leaderboardRounds }, (_, i) => ({ tournamentId, participantId, round: i + 1 }))
        ),
      })
    }
    await tx.tournament.update({ where: { id: tournamentId }, data: { drawGeneratedAt: new Date() } })
    await advance(tx, tournamentId)

    return {
      created: true,
      matchCount: tournament.format === 'LEADERBOARD' ? entrants.length * config.leaderboardRounds : plan.matches.length,
    }
  }, TX_OPTIONS)
}

export type ResultInput = {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  /** The side that did not show up. */
  forfeit: Slot | null
  notes?: string | null
  /** Required when changing an already-finalized result. */
  reason?: string | null
}

export type RecordResult = AdvanceResult & {
  tournamentId: string
  changed: boolean
  corrected: boolean
  homeUserId: string | null
  awayUserId: string | null
}

/**
 * Record (or correct) the official result of an engine match and run the
 * progression. Re-submitting the same result is a no-op.
 */
export async function recordResult(input: ResultInput, actorId: string): Promise<RecordResult> {
  const head = await db.match.findUnique({ where: { id: input.matchId }, select: { tournamentId: true } })
  if (!head) throw new CompetitionError('O‘yin topilmadi')

  return db.$transaction(async (tx) => {
    const tournament = await lockTournament(tx, head.tournamentId)
    const match = await tx.match.findUniqueOrThrow({
      where: { id: input.matchId },
      select: {
        id: true,
        bracket: true,
        status: true,
        isBye: true,
        finalizedAt: true,
        resultType: true,
        homeScore: true,
        awayScore: true,
        homeParticipantId: true,
        awayParticipantId: true,
        homeUserId: true,
        awayUserId: true,
        winnerParticipantId: true,
      },
    })

    if (match.bracket === 'MANUAL') throw new CompetitionError('Bu eski (qo‘lda qo‘shilgan) o‘yin — tahrirlanmaydi')
    if (tournament.status === 'cancelled') throw new CompetitionError('Turnir bekor qilingan')
    if (tournament.status !== 'ongoing' && tournament.status !== 'completed') {
      throw new CompetitionError('Natija faqat boshlangan turnirga kiritiladi')
    }
    if (match.isBye || match.status === 'cancelled') throw new CompetitionError('Bu o‘yin o‘ynalmaydi')
    if (!match.homeParticipantId || !match.awayParticipantId) {
      throw new CompetitionError('Ikkala tomon hali aniqlanmagan')
    }

    let winner: string | null
    let homeScore = input.homeScore
    let awayScore = input.awayScore
    let resultType: 'NORMAL' | 'FORFEIT' = 'NORMAL'

    if (input.forfeit) {
      resultType = 'FORFEIT'
      winner = input.forfeit === 'HOME' ? match.awayParticipantId : match.homeParticipantId
      homeScore = null
      awayScore = null
    } else {
      if (homeScore === null || awayScore === null) throw new CompetitionError('Ikkala hisobni kiriting')
      winner =
        homeScore > awayScore ? match.homeParticipantId : awayScore > homeScore ? match.awayParticipantId : null
      if (winner === null && !drawsAllowed(tournament.format, match.bracket)) {
        throw new CompetitionError('Bu bosqichda durang bo‘lmaydi — g‘olibni aniqlang')
      }
    }

    const isCorrection = match.finalizedAt !== null
    const same =
      isCorrection &&
      match.resultType === resultType &&
      match.homeScore === homeScore &&
      match.awayScore === awayScore &&
      match.winnerParticipantId === winner

    if (same) {
      return {
        tournamentId: head.tournamentId,
        changed: false,
        corrected: false,
        justCompleted: false,
        complete: tournament.resultsFinalizedAt !== null,
        homeUserId: match.homeUserId,
        awayUserId: match.awayUserId,
      }
    }

    if (isCorrection) {
      const reason = input.reason?.trim()
      if (!reason || reason.length < 5) throw new CompetitionError('Natijani o‘zgartirish sababini yozing (kamida 5 belgi)')
      await tx.matchResultRevision.create({
        data: {
          matchId: match.id,
          tournamentId: head.tournamentId,
          actorId,
          previousHomeScore: match.homeScore,
          previousAwayScore: match.awayScore,
          previousWinnerId: match.winnerParticipantId,
          previousResultType: match.resultType,
          newHomeScore: homeScore,
          newAwayScore: awayScore,
          newWinnerId: winner,
          newResultType: resultType,
          reason,
        },
      })
    }

    const winnerUserId =
      winner === match.homeParticipantId ? match.homeUserId : winner === match.awayParticipantId ? match.awayUserId : null

    await tx.match.update({
      where: { id: match.id },
      data: {
        homeScore,
        awayScore,
        resultType,
        status: 'completed',
        finalizedAt: new Date(),
        winnerParticipantId: winner,
        winnerUserId,
        notes: input.notes?.trim() || null,
        recordedById: actorId,
      },
    })

    const advanced = await advance(tx, head.tournamentId)
    return {
      tournamentId: head.tournamentId,
      changed: true,
      corrected: isCorrection,
      ...advanced,
      homeUserId: match.homeUserId,
      awayUserId: match.awayUserId,
    }
  }, TX_OPTIONS)
}

/** Final placements and the stored state they came from (null while running). */
export async function computeFinalPlacements(client: Tx | typeof db, tournamentId: string) {
  const state = await loadEngineState(client, tournamentId)
  if (state.format === 'LEADERBOARD') {
    const result = leaderboardPlacements(state.config, state.entrants, state.leaderboard)
    return result ? { state, placements: result, participated: leaderboardParticipants(state.leaderboard) } : null
  }
  if (state.matches.length === 0) return null
  const result = placements(state.format, state.config, state.entrants, state.matches)
  return result ? { state, placements: result, participated: participatedEntrants(state.matches) } : null
}

export type LeaderboardResultInput = {
  tournamentId: string
  round: number
  /** `value` null with `dnf` false clears the result back to pending. */
  results: { participantId: string; value: number | null; dnf: boolean }[]
  /** Required when the tournament is already finalized. */
  reason?: string | null
}

export type LeaderboardRecordResult = AdvanceResult & {
  changed: boolean
  corrected: boolean
  affectedUserIds: string[]
}

/**
 * Save one round of a LEADERBOARD tournament in one go (staff type the whole
 * heat, then press save). Unchanged rows are skipped, so re-submitting is a
 * no-op. Completing the last pending row finalizes the tournament.
 */
export async function recordLeaderboardRound(
  input: LeaderboardResultInput,
  actorId: string
): Promise<LeaderboardRecordResult> {
  return db.$transaction(async (tx) => {
    const tournament = await lockTournament(tx, input.tournamentId)
    if (tournament.format !== 'LEADERBOARD') throw new CompetitionError('Bu turnir reyting formatida emas')
    if (tournament.status === 'cancelled') throw new CompetitionError('Turnir bekor qilingan')
    if (tournament.status !== 'ongoing' && tournament.status !== 'completed') {
      throw new CompetitionError('Natija faqat boshlangan turnirga kiritiladi')
    }

    const existing = await tx.leaderboardEntry.findMany({
      where: { tournamentId: input.tournamentId, round: input.round },
      select: { id: true, participantId: true, value: true, status: true, participant: { select: { userId: true } } },
    })
    if (existing.length === 0) throw new CompetitionError('Bunday bosqich yo‘q')
    const byParticipant = new Map(existing.map((e) => [e.participantId, e]))

    const changes = input.results.flatMap((r) => {
      const row = byParticipant.get(r.participantId)
      if (!row) return []
      const status: EntryStatus = r.dnf ? 'dnf' : r.value === null ? 'pending' : 'done'
      const value = status === 'done' ? r.value : null
      return row.status === status && row.value === value ? [] : [{ row, status, value }]
    })

    const corrected = tournament.resultsFinalizedAt !== null
    if (changes.length === 0) {
      return { changed: false, corrected: false, justCompleted: false, complete: corrected, affectedUserIds: [] }
    }
    if (corrected) {
      const reason = input.reason?.trim()
      if (!reason || reason.length < 5) throw new CompetitionError('Natijani o‘zgartirish sababini yozing (kamida 5 belgi)')
      if (changes.some((c) => c.status === 'pending')) {
        throw new CompetitionError('Yakunlangan turnirda natijani o‘chirib bo‘lmaydi — qiymat yoki DNF kiriting')
      }
    }

    for (const change of changes) {
      await tx.leaderboardEntry.update({
        where: { id: change.row.id },
        data: { status: change.status, value: change.value, recordedById: actorId },
      })
    }

    const advanced = await advance(tx, input.tournamentId)
    return {
      changed: true,
      corrected,
      ...advanced,
      affectedUserIds: changes.map((c) => c.row.participant.userId).filter((id): id is string => Boolean(id)),
    }
  }, TX_OPTIONS)
}
