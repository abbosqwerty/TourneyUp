/**
 * Additive demo tournaments — unlike seed.js this never wipes the database.
 * Safe to re-run: every tournament here has an `extra-` id and is recreated.
 *
 *   node prisma/seed-extra.js
 *
 * Dates are relative to today, so the feed always has fresh events: open,
 * full, almost full, a 1000-slot race, one coming soon, one live, and one that
 * ended yesterday (it must NOT show in the feed).
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DAY = 24 * 60 * 60 * 1000
/** "YYYY-MM-DD" in Tashkent (UTC+5), `offset` days from today. */
function day(offset) {
  return new Date(Date.now() + 5 * 60 * 60 * 1000 + offset * DAY).toISOString().slice(0, 10)
}

const FIRST = ['Aziz', 'Bekzod', 'Dilnoza', 'Farrux', 'Gulnora', 'Hamid', 'Iroda', 'Javohir', 'Kamola', 'Laziz', 'Malika', 'Nodir', 'Oydin', 'Rustam', 'Sevara', 'Temur', 'Ulug‘bek', 'Zarina']
const LAST = ['Toshmatov', 'Yusupova', 'Ergashev', 'Nazarova', 'Saidov', 'Qodirova', 'Rahimov', 'Mirzayeva', 'Xolmatov', 'Sobirova']

const tournaments = [
  {
    id: 'extra-cs2',
    title: 'CS2 Tashkent Open Qualifier',
    sport: 'Counter-Strike 2',
    category: 'esports',
    location: 'Online',
    date: day(5),
    endDate: day(7),
    time: '7:00 PM',
    maxParticipants: 16,
    joined: 16, // FULL
    posterUrl: '/tournaments/valorant-cup.jpg',
    organizerId: 'org2',
    description: 'Toshkentning eng kuchli CS2 jamoalari uchun saralash bosqichi. Barcha 16 o‘rin band.',
    rules: ['5v5, MR12', 'Bo1 guruhlarda, Bo3 pley-offda', 'Anti-cheat majburiy'],
    requirements: ['Faceit akkaunti', 'Kamida 5 o‘yinchi'],
    prizePool: '20M UZS',
    entryFee: 'Bepul',
    status: 'registration_open',
    featured: true,
  },
  {
    id: 'extra-marathon',
    title: 'Tashkent City Marathon 2026',
    sport: 'Running',
    category: 'sports',
    location: 'Toshkent, Amir Temur xiyoboni',
    date: day(20),
    time: '7:00 AM',
    maxParticipants: 1000,
    joined: 347, // large event → progress bar instead of dots
    posterUrl: '/tournaments/marathon.jpg',
    organizerId: 'org8',
    format: 'LEADERBOARD',
    description: '5 km, 10 km va 21 km masofalar. Shahar markazi bo‘ylab ochiq yugurish bayrami.',
    rules: ['Start 07:00 da', 'Chip orqali vaqt o‘lchanadi', 'Har 5 km da suv nuqtasi'],
    requirements: ['16 yoshdan katta', 'Tibbiy ma’lumotnoma'],
    prizePool: '30M UZS',
    entryFee: '100,000 UZS',
    status: 'registration_open',
    featured: true,
  },
  {
    id: 'extra-chess',
    title: 'Chess Rapid Autumn Cup',
    sport: 'Chess',
    category: 'academic',
    location: 'Toshkent Shaxmat Markazi',
    date: day(9),
    time: '10:00 AM',
    maxParticipants: 64,
    joined: 59, // almost full
    posterUrl: '/tournaments/chess-championship.jpg',
    organizerId: 'org3',
    description: 'Shveytsariya tizimida 9 turdan iborat rapid turnir (15+10).',
    rules: ['FIDE qoidalari', '15 daqiqa + 10 soniya', '9 tur, Shveytsariya tizimi'],
    requirements: ['FIDE ID (ixtiyoriy)'],
    prizePool: '8M UZS',
    entryFee: '50,000 UZS',
    status: 'registration_open',
    format: 'SWISS',
  },
  {
    id: 'extra-futsal',
    title: 'Universitetlararo Futzal Ligasi',
    sport: 'Football',
    category: 'sports',
    location: 'TATU Sport Zali',
    date: day(3),
    endDate: day(12),
    time: '4:00 PM',
    maxParticipants: 12,
    joined: 5,
    posterUrl: '/tournaments/football-championship.jpg',
    organizerId: 'org4',
    description: 'Toshkent universitetlari o‘rtasida futzal ligasi. Har hafta 2 tur.',
    rules: ['5v5 futzal', '2 x 20 daqiqa', 'Almashtirishlar cheksiz'],
    requirements: ['Talabalik guvohnomasi'],
    prizePool: '10M UZS',
    entryFee: '200,000 UZS',
    status: 'registration_open',
  },
  {
    id: 'extra-tennis',
    title: 'Stol Tennisi Kubogi',
    sport: 'Table Tennis',
    category: 'sports',
    location: 'Yunusobod Sport Majmuasi',
    date: day(30),
    time: '11:00 AM',
    maxParticipants: 32,
    joined: 0,
    posterUrl: '/tournaments/basketball-3v3.jpg',
    organizerId: 'org1',
    description: 'Yakkalik bahslari. Ro‘yxatdan o‘tish tez orada ochiladi.',
    rules: ['ITTF qoidalari', '5 setdan 3 tasida g‘alaba'],
    requirements: ['O‘z raketkasi'],
    prizePool: '5M UZS',
    entryFee: 'Bepul',
    status: 'upcoming',
  },
  {
    id: 'extra-pubg',
    title: 'PUBG Mobile Weekend Clash',
    sport: 'PUBG Mobile',
    category: 'esports',
    location: 'Online',
    date: day(-1),
    endDate: day(2),
    time: '8:00 PM',
    maxParticipants: 100,
    joined: 72,
    posterUrl: '/tournaments/pubg-masters.jpg',
    organizerId: 'org2',
    description: 'Hozir davom etayotgan dam olish kunlari turniri. Har kuni 4 ta match.',
    rules: ['Squad (4 kishi)', 'Erangel va Miramar', 'Kill + placement ochkolari'],
    requirements: ['PUBG Mobile ID'],
    prizePool: '15M UZS',
    entryFee: 'Bepul',
    status: 'ongoing',
    featured: true,
    format: 'LEADERBOARD',
  },
  {
    id: 'extra-swim',
    title: 'Kuzgi Suzish Musobaqasi',
    sport: 'Swimming',
    category: 'sports',
    location: 'Olimpiya Suv Sporti Markazi',
    date: day(-3),
    endDate: day(-1), // ended yesterday — must be hidden from the feed
    time: '9:00 AM',
    maxParticipants: 40,
    joined: 28,
    posterUrl: '/tournaments/swimming-meet.jpg',
    organizerId: 'org6',
    format: 'LEADERBOARD',
    description: 'Status hali "Jonli", lekin muddati kecha tugagan — feed’da chiqmasligi kerak.',
    rules: ['50 m va 100 m erkin usul'],
    requirements: ['Suzish litsenziyasi'],
    prizePool: '4M UZS',
    entryFee: '30,000 UZS',
    status: 'ongoing',
  },
]

function participantRows(t, players) {
  const rows = []
  for (let i = 0; i < t.joined; i++) {
    // The first few slots go to real demo players so their profiles show the event.
    const userId = i < players.length && t.joined < 200 ? players[i] : null
    const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`
    rows.push({
      id: `${t.id}-p${i + 1}`,
      tournamentId: t.id,
      name,
      email: `${t.id}-p${i + 1}@example.test`,
      avatar: '/placeholder-user.jpg',
      registeredAt: new Date(Date.now() - (t.joined - i) * 60 * 60 * 1000).toISOString(),
      status: 'approved',
      paymentStatus: 'paid',
      userId,
    })
  }
  return rows
}

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, ownerId: true } })
  const orgByOwner = Object.fromEntries(orgs.map((o) => [o.ownerId, o.id]))
  // Whatever players this database actually has (older seeds use other ids).
  const players = (await prisma.user.findMany({ where: { role: 'USER' }, select: { id: true }, orderBy: { createdAt: 'asc' }, take: 9 })).map((u) => u.id)

  // Re-runs replace the previous copies; participants and channels cascade.
  const removed = await prisma.tournament.deleteMany({ where: { id: { startsWith: 'extra-' } } })
  if (removed.count) console.log(`Eski ${removed.count} ta extra turnir o‘chirildi`)

  for (const t of tournaments) {
    const { joined, rules, requirements, ...data } = t
    await prisma.tournament.create({
      data: {
        ...data,
        organizationId: orgByOwner[t.organizerId] ?? null,
        rulesJson: JSON.stringify(rules),
        requirementsJson: JSON.stringify(requirements),
      },
    })

    const channel = await prisma.channel.create({
      data: {
        type: 'TOURNAMENT',
        title: t.title,
        handle: t.id,
        description: t.description.slice(0, 500),
        avatar: t.posterUrl,
        tournamentId: t.id,
      },
    })
    await prisma.channelMember.create({ data: { channelId: channel.id, userId: t.organizerId, role: 'OWNER' } })

    const rows = participantRows(t, players)
    if (rows.length) await prisma.participant.createMany({ data: rows })
    const members = rows.filter((r) => r.userId).map((r) => ({ channelId: channel.id, userId: r.userId, role: 'SUBSCRIBER' }))
    if (members.length) await prisma.channelMember.createMany({ data: members, skipDuplicates: true })

    console.log(`+ ${t.title} — ${joined}/${t.maxParticipants}, ${t.status}, ${t.date}${t.endDate ? ` → ${t.endDate}` : ''}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
