/**
 * Demo competitions: gives every seeded tournament the format that fits its
 * sport, fills it with entrants, makes the draw and plays part of it through
 * the real engine — so brackets, tables and leaderboards have something to
 * show. Safe to re-run: it resets only the tournaments it touches.
 *
 *   npx vite-node --config vitest.config.ts scripts/demo-competitions.ts
 *
 * Never run it against a database with real tournament results.
 */
/* eslint-disable no-console -- CLI progress output */
import { db } from '../lib/db'
import type { FormatConfig, TournamentFormat } from '../lib/competition/config'
import { recordLeaderboardRound, recordResult, startCompetition } from '../lib/competition/lifecycle'
import { awardTournamentPoints, refreshPointCaches } from '../lib/points/award'

const DEMO_EMAIL = '@demo.tourneyup.uz'

/** Deterministic randomness, so every run produces the same demo. */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type MatchPlan = {
  kind: 'matches'
  /** Waves of "play everything currently playable". */
  waves: number
  /** Only play matches up to this round (round robin). */
  maxRound?: number
  score: (r: () => number) => [number, number]
}
type BoardPlan = { kind: 'board'; rounds: number; value: (r: () => number, strength: number) => number | 'DNF' }

type Demo = {
  sport: string
  format: TournamentFormat
  config: Partial<FormatConfig>
  entrants: string[]
  play: MatchPlan | BoardPlan
  /** Award Tourney Points if the demo completes the tournament. */
  award?: boolean
}

const int = (r: () => number, min: number, max: number) => min + Math.floor(r() * (max - min + 1))

const DEMOS: Demo[] = [
  {
    sport: 'Football',
    format: 'GROUPS_KNOCKOUT',
    config: { groupCount: 2, advancePerGroup: 2, thirdPlaceMatch: true },
    entrants: ['TATU FC', 'O‘zMU United', 'TDTU Lions', 'Inha Tigers', 'WIUT Wolves', 'Westminster Eagles', 'TDIU Falcons', 'Amity Stars'],
    play: { kind: 'matches', waves: 2, score: (r) => [int(r, 0, 4), int(r, 0, 3)] },
  },
  {
    sport: 'PUBG Mobile',
    format: 'LEADERBOARD',
    config: { scoreKind: 'points', leaderboardRounds: 4 },
    entrants: ['Team Spirit UZ', 'Nomad Squad', 'Samarkand Snipers', 'Bukhara Ghosts', 'Tashkent Titans', 'Khiva Hawks', 'Fergana Force', 'Navoi Ninjas', 'Andijan Aces', 'Termez Raiders', 'Nukus Phantoms', 'Qarshi Kings'],
    // Placement points + kills; stronger squads tend to score more.
    play: { kind: 'board', rounds: 3, value: (r, s) => int(r, 0, 6) + Math.round(s * int(r, 4, 16)) },
  },
  {
    sport: 'Chess',
    format: 'SWISS',
    config: { swissRounds: 5 },
    entrants: ['Nodirbek Abdusattorov', 'Javokhir Sindarov', 'Nodirbek Yakubboev', 'Shamsiddin Vokhidov', 'Jakhongir Vakhidov', 'Ortiq Nigmatov', 'Marat Djumaev', 'Saidakbar Saydaliev', 'Bibisara Assaubayeva', 'Afruza Khamdamova'],
    play: {
      kind: 'matches',
      waves: 3,
      // 1-0, 0-1 or a draw.
      score: (r) => {
        const x = r()
        return x < 0.4 ? [1, 0] : x < 0.75 ? [0, 1] : [1, 1]
      },
    },
  },
  {
    sport: 'Basketball',
    format: 'SINGLE_ELIMINATION',
    config: { thirdPlaceMatch: true },
    entrants: ['Hoops TATU', 'Dunk Masters', 'Street Kings', 'Chilonzor Ballers', 'Yunusobod 3x3', 'Sergeli Shooters', 'Mirzo Ulug‘bek MVP', 'Olmazor Jets'],
    play: { kind: 'matches', waves: 1, score: (r) => [int(r, 12, 21), int(r, 10, 21)] },
  },
  {
    sport: 'Valorant',
    format: 'DOUBLE_ELIMINATION',
    config: { grandFinalReset: true },
    entrants: ['Phantom UZ', 'Vandal Five', 'Radiant Rush', 'Spike Planters', 'Ace Hunters', 'Clutch Kings', 'Ultimate Orbs', 'Headshot Heroes'],
    play: { kind: 'matches', waves: 2, score: (r) => [13, int(r, 4, 11)].sort(() => r() - 0.5) as [number, number] },
  },
  {
    sport: 'Swimming',
    format: 'LEADERBOARD',
    config: { scoreKind: 'time', leaderboardRounds: 2 },
    entrants: ['Diyora Rakhmatova', 'Bekzod Tursunov', 'Malika Ergasheva', 'Sherzod Nazarov', 'Kamila Yusupova', 'Ulugbek Karimov', 'Sevara Mirzaeva', 'Timur Abdullaev'],
    // 100 m freestyle: ~52–62 s.
    play: { kind: 'board', rounds: 1, value: (r, s) => Math.round(52_000 + (1 - s) * 7_000 + r() * 3_000) },
  },
  {
    sport: 'Rocket League',
    format: 'ROUND_ROBIN',
    config: {},
    entrants: ['Boost Brothers', 'Aerial Aces', 'Kickoff Kings', 'Demo Squad', 'Flip Reset', 'Turbo Tashkent'],
    play: { kind: 'matches', waves: 1, maxRound: 3, score: (r) => [int(r, 0, 5), int(r, 0, 4)] },
  },
  {
    sport: 'Running',
    format: 'LEADERBOARD',
    config: { scoreKind: 'time', leaderboardRounds: 1 },
    entrants: ['Rustam Bobojonov', 'Aziza Normatova', 'Javlon Xolmatov', 'Nilufar Saidova', 'Otabek Qodirov', 'Gulnora Ismoilova', 'Sanjar Rahmonov', 'Dilnoza Tosheva', 'Farrux Ergashev', 'Zarina Aliyeva'],
    // Marathon: ~2:20–3:10, one runner does not finish.
    play: {
      kind: 'board',
      rounds: 1,
      value: (r, s) => (s < 0.12 ? 'DNF' : Math.round(8_400_000 + (1 - s) * 2_400_000 + r() * 600_000)),
    },
    award: true,
  },
]

async function resetTournament(id: string, demo: Demo) {
  await db.pointAward.deleteMany({ where: { tournamentId: id } })
  await db.matchResultRevision.deleteMany({ where: { tournamentId: id } })
  await db.match.deleteMany({ where: { tournamentId: id } })
  await db.competitionGroup.deleteMany({ where: { tournamentId: id } })
  await db.leaderboardEntry.deleteMany({ where: { tournamentId: id } })
  await db.participant.deleteMany({ where: { tournamentId: id, email: { endsWith: DEMO_EMAIL } } })
  await db.tournament.update({
    where: { id },
    data: {
      format: demo.format,
      formatConfigJson: JSON.stringify(demo.config),
      participantType: 'INDIVIDUAL',
      drawGeneratedAt: null,
      resultsFinalizedAt: null,
      closedAt: null,
      status: 'registration_open',
    },
  })
}

async function addEntrants(id: string, demo: Demo) {
  // Seeded users already registered keep their place; demo entrants fill the field.
  const existing = await db.participant.findMany({ where: { tournamentId: id }, select: { id: true, name: true, teamName: true } })
  await db.participant.updateMany({
    where: { tournamentId: id },
    data: { status: 'approved', paymentStatus: 'paid', seed: null },
  })
  const taken = new Set(existing.map((p) => (p.teamName || p.name).toLowerCase()))
  const names = demo.entrants.filter((name) => !taken.has(name.toLowerCase()))
  const needed = Math.max(0, demo.entrants.length - existing.length)
  for (let i = 0; i < needed; i++) {
    const name = names[i]
    await db.participant.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}${DEMO_EMAIL}`,
        avatar: '',
        registeredAt: new Date(Date.UTC(2026, 8, 1, 9, i)).toISOString(),
        status: 'approved',
        paymentStatus: 'paid',
        tournamentId: id,
      },
    })
  }
}

async function playMatches(id: string, actorId: string, plan: MatchPlan, r: () => number) {
  for (let wave = 0; wave < plan.waves; wave++) {
    const playable = await db.match.findMany({
      where: {
        tournamentId: id,
        finalizedAt: null,
        status: { not: 'cancelled' },
        homeParticipantId: { not: null },
        awayParticipantId: { not: null },
        ...(plan.maxRound ? { round: { lte: plan.maxRound } } : {}),
      },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
      select: { id: true, bracket: true },
    })
    if (playable.length === 0) return
    for (const m of playable) {
      let [home, away] = plan.score(r)
      // Knockout games need a winner (extra time / overtime).
      if (home === away && m.bracket !== 'GROUP' && m.bracket !== 'SWISS') {
        if (r() < 0.5) home += 1
        else away += 1
      }
      await recordResult({ matchId: m.id, homeScore: home, awayScore: away, forfeit: null }, actorId)
    }
  }
}

async function playBoard(id: string, actorId: string, plan: BoardPlan, r: () => number) {
  const entrants = await db.participant.findMany({
    where: { tournamentId: id },
    orderBy: { registeredAt: 'asc' },
    select: { id: true },
  })
  // A fixed "strength" per entrant keeps the table believable across rounds.
  const strength = new Map(entrants.map((e) => [e.id, r()]))
  for (let round = 1; round <= plan.rounds; round++) {
    await recordLeaderboardRound(
      {
        tournamentId: id,
        round,
        results: entrants.map((e) => {
          const value = plan.value(r, strength.get(e.id)!)
          return { participantId: e.id, value: value === 'DNF' ? null : value, dnf: value === 'DNF' }
        }),
      },
      actorId
    )
  }
}

/** Upcoming matches get kick-off times so the schedule tab is not empty. */
async function scheduleRemaining(id: string) {
  const pending = await db.match.findMany({
    where: { tournamentId: id, finalizedAt: null, status: 'scheduled', isBye: false },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
    select: { id: true, round: true, bracket: true },
  })
  // The third-place game and the grand final are played on the last day.
  const lastRound = Math.max(0, ...pending.map((m) => m.round))
  const dayOf = (m: (typeof pending)[number]) =>
    m.bracket === 'THIRD_PLACE' || m.bracket === 'GRAND_FINAL' ? lastRound : m.round
  pending.sort((a, b) => dayOf(a) - dayOf(b))
  const base = new Date()
  base.setUTCHours(13, 0, 0, 0) // 18:00 in Tashkent
  for (const [i, m] of pending.entries()) {
    const at = new Date(base.getTime() + (dayOf(m) * 2 + 1) * 86_400_000 + (i % 3) * 5_400_000)
    await db.match.update({ where: { id: m.id }, data: { scheduledAt: at } })
  }
}

async function main() {
  for (const [index, demo] of DEMOS.entries()) {
    const tournament = await db.tournament.findFirst({
      where: { sport: demo.sport },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, organizerId: true },
    })
    if (!tournament) {
      console.log(`- ${demo.sport}: turnir topilmadi, o‘tkazib yuborildi`)
      continue
    }
    const r = rng(index + 2026)

    await resetTournament(tournament.id, demo)
    await addEntrants(tournament.id, demo)
    await db.tournament.update({ where: { id: tournament.id }, data: { status: 'ongoing' } })
    await startCompetition(tournament.id, (max) => Math.floor(r() * max))

    if (demo.play.kind === 'matches') await playMatches(tournament.id, tournament.organizerId, demo.play, r)
    else await playBoard(tournament.id, tournament.organizerId, demo.play, r)
    await scheduleRemaining(tournament.id)

    const after = await db.tournament.findUniqueOrThrow({ where: { id: tournament.id }, select: { status: true } })
    if (demo.award && after.status === 'completed') {
      await awardTournamentPoints(tournament.id, 'FINALIZED', tournament.organizerId)
    }
    console.log(`✓ ${tournament.title} — ${demo.format} (${after.status})`)
  }
  await db.$transaction((tx) => refreshPointCaches(tx))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
