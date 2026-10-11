import { afterAll, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { recordResult, startCompetition } from '@/lib/competition/lifecycle'
import { awardTournamentPoints } from '@/lib/points/award'
import { getLeaderboard } from '@/lib/points/leaderboard'
import { finalPoints } from '@/lib/points/score'
import { createTournament, createUser, hasTestDb } from './fixtures'

type Setup = Awaited<ReturnType<typeof createTournament>>

/** Run a tournament to the end; the lower seed always wins. */
async function playOut(setup: Setup) {
  const { tournament, owner, players } = setup
  const seedOf = new Map(players.map((p) => [p.participant.id, p.participant.seed!]))
  await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
  await startCompetition(tournament.id, () => 0)
  for (;;) {
    const playable = await db.match.findMany({
      where: { tournamentId: tournament.id, finalizedAt: null, status: { not: 'cancelled' }, homeParticipantId: { not: null }, awayParticipantId: { not: null } },
    })
    if (playable.length === 0) break
    for (const m of playable) {
      const homeWins = seedOf.get(m.homeParticipantId!)! < seedOf.get(m.awayParticipantId!)!
      await recordResult({ matchId: m.id, homeScore: homeWins ? 1 : 0, awayScore: homeWins ? 0 : 1, forfeit: null }, owner.id)
    }
  }
  await awardTournamentPoints(tournament.id, 'FINALIZED', owner.id)
}

const pointsOf = async (tournamentId: string, userId: string) =>
  (await db.pointAward.findUnique({ where: { tournamentId_userId: { tournamentId, userId } } }))?.points ?? 0

describe.skipIf(!hasTestDb)('tourney points (MySQL)', () => {
  afterAll(() => db.$disconnect())

  it('awards every placement its base points with the size bonus', async () => {
    const setup = await createTournament({ participants: 8, config: { seeding: 'seeded' } })
    await playOut(setup)
    const [p1, p2, p3, p4, p5] = setup.players
    const t = setup.tournament.id

    expect(await pointsOf(t, p1.user.id)).toBe(finalPoints(100, 8))
    expect(await pointsOf(t, p2.user.id)).toBe(finalPoints(70, 8))
    // No third-place match → both semi-final losers are 3rd.
    expect(await pointsOf(t, p3.user.id)).toBe(finalPoints(50, 8))
    expect(await pointsOf(t, p4.user.id)).toBe(finalPoints(50, 8))
    expect(await pointsOf(t, p5.user.id)).toBe(finalPoints(25, 8))
  })

  it('gives 10 T outside the top 8 and nothing for a registration alone', async () => {
    const setup = await createTournament({ participants: 10, format: 'ROUND_ROBIN', config: { seeding: 'seeded' } })
    // Registered and approved, but never paid → never in the draw.
    const ghost = await createUser()
    await db.participant.create({
      data: {
        name: ghost.name, email: ghost.email!, avatar: '', registeredAt: new Date().toISOString(),
        status: 'approved', paymentStatus: 'pending', tournamentId: setup.tournament.id, userId: ghost.id,
      },
    })
    await playOut(setup)
    const t = setup.tournament.id

    expect(await pointsOf(t, setup.players[9].user.id)).toBe(finalPoints(10, 10))
    expect(await pointsOf(t, ghost.id)).toBe(0)
  })

  it('does not count a no-show as participation', async () => {
    const setup = await createTournament({ participants: 2, config: { seeding: 'seeded' } })
    const { tournament, owner, players } = setup
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id, () => 0)
    const final = await db.match.findFirstOrThrow({ where: { tournamentId: tournament.id } })
    const absent = final.homeParticipantId === players[1].participant.id ? 'HOME' : 'AWAY'
    await recordResult({ matchId: final.id, homeScore: null, awayScore: null, forfeit: absent }, owner.id)
    await awardTournamentPoints(tournament.id, 'FINALIZED', owner.id)

    // N counts only the side that showed up.
    expect(await pointsOf(tournament.id, players[0].user.id)).toBe(finalPoints(100, 1))
    expect(await pointsOf(tournament.id, players[1].user.id)).toBe(0)
  })

  it('never awards twice for the same tournament', async () => {
    const setup = await createTournament({ participants: 4, config: { seeding: 'seeded' } })
    await playOut(setup)
    const second = await awardTournamentPoints(setup.tournament.id, 'FINALIZED', setup.owner.id)
    const third = await awardTournamentPoints(setup.tournament.id, 'FINALIZED', setup.owner.id)
    expect(second.created + second.updated + second.removed).toBe(0)
    expect(third.affectedUsers).toEqual([])
    expect(await db.pointAward.count({ where: { tournamentId: setup.tournament.id } })).toBe(4)
    const winner = setup.players[0].user
    expect((await db.user.findUniqueOrThrow({ where: { id: winner.id } })).totalPoints).toBe(finalPoints(100, 4))
  })

  it('moves points when a finalized result is corrected, with an audit trail', async () => {
    const setup = await createTournament({ participants: 2, config: { seeding: 'seeded' } })
    await playOut(setup)
    const t = setup.tournament.id
    const [p1, p2] = setup.players
    const final = await db.match.findFirstOrThrow({ where: { tournamentId: t } })

    const p1Home = final.homeParticipantId === p1.participant.id
    await recordResult(
      { matchId: final.id, homeScore: p1Home ? 0 : 1, awayScore: p1Home ? 1 : 0, forfeit: null, reason: 'Hakam xatosi tuzatildi' },
      setup.owner.id
    )
    await awardTournamentPoints(t, 'RESULT_CORRECTED', setup.owner.id)

    expect(await pointsOf(t, p2.user.id)).toBe(finalPoints(100, 2))
    expect(await pointsOf(t, p1.user.id)).toBe(finalPoints(70, 2))
    const audit = await db.pointAuditLog.findMany({ where: { tournamentId: t, reason: 'RESULT_CORRECTED' } })
    expect(audit).toHaveLength(2)
    expect(audit.every((a) => a.actorId === setup.owner.id)).toBe(true)
  })

  it('reverses every point when the tournament is cancelled', async () => {
    const setup = await createTournament({ participants: 4 })
    await playOut(setup)
    const t = setup.tournament.id
    expect(await db.pointAward.count({ where: { tournamentId: t } })).toBe(4)

    await db.tournament.update({ where: { id: t }, data: { status: 'cancelled' } })
    await awardTournamentPoints(t, 'TOURNAMENT_CANCELLED', setup.owner.id)

    expect(await db.pointAward.count({ where: { tournamentId: t } })).toBe(0)
    const reversal = await db.pointAuditLog.findMany({ where: { tournamentId: t, reason: 'TOURNAMENT_CANCELLED' } })
    expect(reversal).toHaveLength(4)
    expect(reversal.every((r) => r.newPoints === 0 && r.delta < 0)).toBe(true)
  })

  it('splits weekly, monthly, all-time and per-game totals without resetting anything', async () => {
    const chess = await createTournament({ participants: 2, sport: 'LB-Chess', config: { seeding: 'seeded' } })
    const valorant = await createTournament({ participants: 2, sport: 'LB-Valorant', config: { seeding: 'seeded' } })
    await playOut(chess)
    await playOut(valorant)

    // Same player wins both; move the Valorant win to last month.
    const player = chess.players[0].user
    await db.participant.update({ where: { id: valorant.players[0].participant.id }, data: { userId: player.id } })
    await awardTournamentPoints(valorant.tournament.id, 'RECALCULATED', null)

    const now = new Date('2026-10-14T12:00:00Z') // Wednesday
    const thisWeek = new Date('2026-10-13T08:00:00Z')
    const lastMonth = new Date('2026-09-20T08:00:00Z')
    await db.pointAward.updateMany({ where: { tournamentId: chess.tournament.id }, data: { earnedAt: thisWeek } })
    await db.pointAward.updateMany({ where: { tournamentId: valorant.tournament.id }, data: { earnedAt: lastMonth } })

    const win = finalPoints(100, 2)
    const find = (rows: Awaited<ReturnType<typeof getLeaderboard>>) => rows.find((r) => r.userId === player.id)?.points ?? 0

    expect(find(await getLeaderboard({ period: 'weekly', now }))).toBe(win)
    expect(find(await getLeaderboard({ period: 'monthly', now }))).toBe(win)
    expect(find(await getLeaderboard({ period: 'all', now }))).toBe(win * 2)
    expect(find(await getLeaderboard({ period: 'all', sport: 'LB-Valorant', now }))).toBe(win)
    expect(find(await getLeaderboard({ period: 'weekly', sport: 'LB-Valorant', now }))).toBe(0)
  })
})
