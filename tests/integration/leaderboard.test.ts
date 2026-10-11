import { afterAll, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { CompetitionError, recordLeaderboardRound, startCompetition } from '@/lib/competition/lifecycle'
import { awardTournamentPoints } from '@/lib/points/award'
import { getCompetitionView } from '@/lib/competition/view'
import { finalPoints } from '@/lib/points/score'
import { createTournament, hasTestDb } from './fixtures'

describe.skipIf(!hasTestDb)('leaderboard format (MySQL)', () => {
  afterAll(() => db.$disconnect())

  it('creates one pending row per entrant per round, finalizes on the last result, awards points', async () => {
    const setup = await createTournament({
      format: 'LEADERBOARD',
      sport: 'Running',
      participants: 4,
      config: { scoreKind: 'time', leaderboardRounds: 2 },
    })
    const { tournament, owner, players } = setup
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })

    const started = await startCompetition(tournament.id)
    expect(started).toEqual({ created: true, matchCount: 8 })
    expect(await db.match.count({ where: { tournamentId: tournament.id } })).toBe(0)
    // A second start is a no-op.
    expect((await startCompetition(tournament.id)).created).toBe(false)

    const [a, b, c, d] = players.map((p) => p.participant.id)
    const round = (r: number, times: Record<string, number | 'DNF'>) =>
      recordLeaderboardRound(
        {
          tournamentId: tournament.id,
          round: r,
          results: Object.entries(times).map(([participantId, t]) => ({
            participantId,
            value: t === 'DNF' ? null : t,
            dnf: t === 'DNF',
          })),
        },
        owner.id
      )

    const first = await round(1, { [a]: 60_000, [b]: 58_000, [c]: 61_000, [d]: 'DNF' })
    expect(first).toMatchObject({ changed: true, complete: false })
    // Same values again change nothing.
    expect((await round(1, { [a]: 60_000, [b]: 58_000, [c]: 61_000, [d]: 'DNF' })).changed).toBe(false)

    const last = await round(2, { [a]: 55_000, [b]: 59_000, [c]: 60_000, [d]: 50_000 })
    expect(last).toMatchObject({ changed: true, justCompleted: true, complete: true })

    const view = await getCompetitionView(tournament.id)
    expect(view.leaderboard!.rows.map((r) => r.entrant)).toEqual([a, b, c, d])
    expect(view.leaderboard!.rows[0].move).toBe(1) // a was 2nd after round one
    expect(view.podium!.slice(0, 2).map((p) => p.placement)).toEqual([1, 2])

    const fresh = await db.tournament.findUniqueOrThrow({ where: { id: tournament.id } })
    expect(fresh.status).toBe('completed')

    await awardTournamentPoints(tournament.id, 'FINALIZED', owner.id)
    const award = await db.pointAward.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: players[0].user.id } },
    })
    expect(award?.points).toBe(finalPoints(100, 4))

    // A finalized result changes only with a reason.
    await expect(round(2, { [a]: 54_000 })).rejects.toBeInstanceOf(CompetitionError)
  })

  it('refuses results for a non-leaderboard tournament', async () => {
    const { tournament, owner, players } = await createTournament({ participants: 2 })
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id)
    await expect(
      recordLeaderboardRound(
        { tournamentId: tournament.id, round: 1, results: [{ participantId: players[0].participant.id, value: 1, dnf: false }] },
        owner.id
      )
    ).rejects.toBeInstanceOf(CompetitionError)
  })
})
