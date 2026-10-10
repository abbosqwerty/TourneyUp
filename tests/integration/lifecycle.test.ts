import { afterAll, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { CompetitionError, recordResult, startCompetition } from '@/lib/competition/lifecycle'
import { createTournament, firstSeedRng, hasTestDb } from './fixtures'

/** Play every currently playable match, lower seed winning. */
async function playRound(tournamentId: string, actorId: string, seedOf: Map<string, number>) {
  const playable = await db.match.findMany({
    where: { tournamentId, finalizedAt: null, status: { not: 'cancelled' }, homeParticipantId: { not: null }, awayParticipantId: { not: null } },
    orderBy: [{ bracket: 'asc' }, { round: 'asc' }, { position: 'asc' }],
  })
  for (const m of playable) {
    const homeWins = seedOf.get(m.homeParticipantId!)! < seedOf.get(m.awayParticipantId!)!
    await recordResult({ matchId: m.id, homeScore: homeWins ? 2 : 0, awayScore: homeWins ? 0 : 2, forfeit: null }, actorId)
  }
  return playable.length
}

describe.skipIf(!hasTestDb)('competition lifecycle (MySQL)', () => {
  afterAll(() => db.$disconnect())

  it('generates the draw once, even under concurrent starts', async () => {
    const { tournament } = await createTournament({ participants: 8 })
    const results = await Promise.all(Array.from({ length: 5 }, () => startCompetition(tournament.id)))

    expect(results.filter((r) => r.created)).toHaveLength(1)
    expect(await db.match.count({ where: { tournamentId: tournament.id } })).toBe(7)

    const before = await db.match.findMany({ where: { tournamentId: tournament.id }, orderBy: { id: 'asc' } })
    await startCompetition(tournament.id)
    const after = await db.match.findMany({ where: { tournamentId: tournament.id }, orderBy: { id: 'asc' } })
    expect(after.map((m) => [m.id, m.homeParticipantId, m.awayParticipantId])).toEqual(
      before.map((m) => [m.id, m.homeParticipantId, m.awayParticipantId])
    )
  })

  it('refuses to start with fewer than two eligible entrants', async () => {
    const { tournament, players } = await createTournament({ participants: 2 })
    await db.participant.update({ where: { id: players[1].participant.id }, data: { paymentStatus: 'pending' } })
    await expect(startCompetition(tournament.id)).rejects.toBeInstanceOf(CompetitionError)
    expect(await db.match.count({ where: { tournamentId: tournament.id } })).toBe(0)
  })

  it('settles byes automatically and runs to completion', async () => {
    const { tournament, owner, players } = await createTournament({ participants: 5, config: { seeding: 'seeded' } })
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id, firstSeedRng)

    const byes = await db.match.findMany({ where: { tournamentId: tournament.id, resultType: 'BYE' } })
    expect(byes).toHaveLength(3)
    expect(byes.every((m) => m.finalizedAt && m.winnerParticipantId)).toBe(true)

    const seedOf = new Map(players.map((p) => [p.participant.id, p.participant.seed!]))
    while ((await playRound(tournament.id, owner.id, seedOf)) > 0) {
      /* keep playing */
    }

    const done = await db.tournament.findUniqueOrThrow({ where: { id: tournament.id } })
    expect(done.status).toBe('completed')
    expect(done.resultsFinalizedAt).not.toBeNull()

    const final = await db.match.findFirstOrThrow({ where: { tournamentId: tournament.id, round: 3 } })
    expect(final.winnerParticipantId).toBe(players[0].participant.id)
  })

  it('treats a re-submitted result as a no-op and rejects draws in a knockout', async () => {
    const { tournament, owner } = await createTournament({ participants: 4 })
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id)
    const match = await db.match.findFirstOrThrow({ where: { tournamentId: tournament.id, round: 1 } })

    await expect(
      recordResult({ matchId: match.id, homeScore: 1, awayScore: 1, forfeit: null }, owner.id)
    ).rejects.toThrow(/durang/)

    const first = await recordResult({ matchId: match.id, homeScore: 3, awayScore: 1, forfeit: null }, owner.id)
    const second = await recordResult({ matchId: match.id, homeScore: 3, awayScore: 1, forfeit: null }, owner.id)
    expect(first.changed).toBe(true)
    expect(second.changed).toBe(false)
    expect(await db.matchResultRevision.count({ where: { matchId: match.id } })).toBe(0)
  })

  it('allows a correction until the next match is played, with an audit row', async () => {
    const { tournament, owner } = await createTournament({ participants: 4 })
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id)
    const [semi1, semi2] = await db.match.findMany({
      where: { tournamentId: tournament.id, round: 1 },
      orderBy: { position: 'asc' },
    })

    await recordResult({ matchId: semi1.id, homeScore: 2, awayScore: 0, forfeit: null }, owner.id)
    await expect(
      recordResult({ matchId: semi1.id, homeScore: 0, awayScore: 2, forfeit: null }, owner.id)
    ).rejects.toThrow(/sabab/)

    await recordResult({ matchId: semi1.id, homeScore: 0, awayScore: 2, forfeit: null, reason: 'Hisob noto‘g‘ri yozilgan' }, owner.id)
    let final = await db.match.findFirstOrThrow({ where: { tournamentId: tournament.id, round: 2 } })
    expect(final.homeParticipantId).toBe(semi1.awayParticipantId)
    expect(await db.matchResultRevision.count({ where: { matchId: semi1.id } })).toBe(1)

    // Once the final is played the semi-final can no longer flip.
    await recordResult({ matchId: semi2.id, homeScore: 1, awayScore: 0, forfeit: null }, owner.id)
    final = await db.match.findFirstOrThrow({ where: { tournamentId: tournament.id, round: 2 } })
    await recordResult({ matchId: final.id, homeScore: 1, awayScore: 0, forfeit: null }, owner.id)
    await expect(
      recordResult({ matchId: semi1.id, homeScore: 2, awayScore: 0, forfeit: null, reason: 'Yana o‘zgartirish' }, owner.id)
    ).rejects.toThrow(/o‘ynalgan/)

    // The rejected correction rolled back completely.
    const semi = await db.match.findUniqueOrThrow({ where: { id: semi1.id } })
    expect(semi.awayScore).toBe(2)
  })

  it('creates the Swiss rounds one at a time', async () => {
    const { tournament, owner, players } = await createTournament({ participants: 6, format: 'SWISS', config: { swissRounds: 3 } })
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id)
    expect(await db.match.count({ where: { tournamentId: tournament.id } })).toBe(3)

    const seedOf = new Map(players.map((p) => [p.participant.id, p.participant.seed!]))
    await playRound(tournament.id, owner.id, seedOf)
    expect(await db.match.count({ where: { tournamentId: tournament.id, round: 2 } })).toBe(3)
    await playRound(tournament.id, owner.id, seedOf)
    await playRound(tournament.id, owner.id, seedOf)

    const done = await db.tournament.findUniqueOrThrow({ where: { id: tournament.id } })
    expect(done.status).toBe('completed')
    expect(await db.match.count({ where: { tournamentId: tournament.id, round: 4 } })).toBe(0)
  })
})
