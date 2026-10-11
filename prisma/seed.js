const { PrismaClient } = require('@prisma/client')
const { randomBytes, scryptSync } = require('crypto')

const prisma = new PrismaClient()

// Same format as lib/password.ts — `scrypt$N$r$p$saltHex$keyHex`
function hashPassword(password) {
  const salt = randomBytes(16)
  const key = scryptSync(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
  return ['scrypt', 16384, 8, 1, salt.toString('hex'), key.toString('hex')].join('$')
}

const DEMO_PASSWORD = 'TourneyUp2026!'
const DEMO_HASH = hashPassword(DEMO_PASSWORD)

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed production muhitida ishlamaydi — u butun bazani o\'chiradi.')
  }

  console.log('1/7: Tozalash...')
  await prisma.storyView.deleteMany()
  await prisma.story.deleteMany()
  await prisma.channelPost.deleteMany()
  await prisma.channelMember.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.supportMessage.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.pointAuditLog.deleteMany()
  await prisma.pointAward.deleteMany()
  await prisma.matchResultRevision.deleteMany()
  await prisma.match.deleteMany()
  await prisma.competitionGroup.deleteMany()
  await prisma.participantRosterMember.deleteMany()
  await prisma.tournamentStaff.deleteMany()
  await prisma.savedTournament.deleteMany()
  await prisma.leaderboardEntry.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.teamInvite.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.organizationApplication.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.sportRank.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.session.deleteMany()
  await prisma.mediaAsset.deleteMany()
  await prisma.user.deleteMany()

  console.log('2/7: Ko‘proq foydalanuvchilar (25 ta o‘yinchi) yaratilmoqda...')

  const users = [
    {
      id: 'user1',
      name: 'Abbos Qurbonov',
      username: 'abbosq',
      avatar: '/avatars/alex.jpg',
      bio: 'TATU talabasi, kibersport va stol tennisi bo‘yicha universitet chempioni.',
      university: 'Toshkent axborot texnologiyalari universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-01-15'
    },
    {
      id: 'demo_user1',
      name: 'Demo O‘yinchi 1',
      username: 'demouser1',
      avatar: '/avatars/marcus.jpg',
      bio: 'Professional kibersportchi va 3x3 basketbol ustasi. TourneyUp faol o‘yinchisi.',
      university: 'Vestminster xalqaro universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-02-10'
    },
    {
      id: 'demo_user2',
      name: 'Demo O‘yinchi 2',
      username: 'demouser2',
      avatar: '/avatars/sarah.jpg',
      bio: 'Strategik o‘yinlar va futbol musobaqalari sovrindori.',
      university: 'Inha universiteti',
      location: 'Samarqand, O‘zbekiston',
      joinedDate: '2024-03-01'
    },
    {
      id: 'demo_user3',
      name: 'Demo O‘yinchi 3',
      username: 'demouser3',
      avatar: '/avatars/james.jpg',
      bio: 'Shaxmat sport ustasiga nomzod va Valorant yetakchisi.',
      university: 'Toshkent davlat iqtisodiyot universiteti',
      location: 'Buxoro, O‘zbekiston',
      joinedDate: '2024-03-15'
    },
    {
      id: 'user10',
      name: 'Nigora Rustamova',
      username: 'nigorar',
      avatar: '/avatars/emma.jpg',
      bio: 'FIDE shaxmatchisi va TDIU futbol jamoasi sardori.',
      university: 'Toshkent davlat iqtisodiyot universiteti',
      location: 'Samarqand, O‘zbekiston',
      joinedDate: '2023-09-01'
    },
    {
      id: 'user11',
      name: 'Sardor Rahimov',
      username: 'sardorr',
      avatar: '/avatars/marcus.jpg',
      bio: 'WIUT basketbol jamoasi pleymeykeri va O‘zMU futbol ligasi faxriysi.',
      university: 'Vestminster xalqaro universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-02-15'
    },
    {
      id: 'user12',
      name: 'Madina Abdullayeva',
      username: 'madinaa',
      avatar: '/avatars/olivia.jpg',
      bio: 'Stol tennisi va yugurish bo‘yicha O‘zbekiston chempionati sovrindori.',
      university: 'O‘zbekiston Milliy universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-05-10'
    },
    {
      id: 'user13',
      name: 'Dilshod Karimov',
      username: 'dilshodk',
      avatar: '/avatars/david.jpg',
      bio: 'Inha CS talabasi, Valorant Radiant darajadagi snayper.',
      university: 'Inha universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2023-11-20'
    },
    {
      id: 'user14',
      name: 'Shahzodbek Olimov',
      username: 'shahzodo',
      avatar: '/avatars/alex.jpg',
      bio: 'Suzish va mini-futbol bo‘yicha TDTU terma jamoasi a’zosi.',
      university: 'Toshkent davlat texnika universiteti',
      location: 'Farg‘ona, O‘zbekiston',
      joinedDate: '2024-08-01'
    },
    {
      id: 'user15',
      name: 'Jasur Aliyev',
      username: 'jasura',
      avatar: '/avatars/james.jpg',
      bio: 'Amity talabasi, Rocket League va kiberfutbol faxriysi.',
      university: 'Amity universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-10-12'
    },
    {
      id: 'user16',
      name: 'Aziz Tursunov',
      username: 'azizt',
      avatar: '/avatars/marcus.jpg',
      bio: 'PUBG Mobile va CS2 turnirlarida bir necha bor chempion.',
      university: 'TATU Farg‘ona filiali',
      location: 'Farg‘ona, O‘zbekiston',
      joinedDate: '2024-04-10'
    },
    {
      id: 'user17',
      name: 'Kamola Karimova',
      username: 'kamolak',
      avatar: '/avatars/emma.jpg',
      bio: 'Shaxmat bo‘yicha respublika ochiq kubogi g‘olibi.',
      university: 'Jahon iqtisodiyoti va diplomatiya universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-03-22'
    },
    {
      id: 'user18',
      name: 'Bekzod Mirzayev',
      username: 'bekzodm',
      avatar: '/avatars/david.jpg',
      bio: 'Samarqand yarim marafoni ishtirokchisi va street workout havaskori.',
      university: 'Samarqand davlat universiteti',
      location: 'Samarqand, O‘zbekiston',
      joinedDate: '2024-06-05'
    },
    {
      id: 'user19',
      name: 'Sevara Saidova',
      username: 'sevaras',
      avatar: '/avatars/olivia.jpg',
      bio: 'Milliy suzish federatsiyasi a’zosi, erkin usulda suzuvchi.',
      university: 'O‘zbekiston davlat jismoniy tarbiya universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-07-11'
    },
    {
      id: 'user20',
      name: 'Jamshid Normatov',
      username: 'jamshidn',
      avatar: '/avatars/alex.jpg',
      bio: 'Dota 2 va Valorant jamoaviy koordinatori.',
      university: 'Toshkent axborot texnologiyalari universiteti',
      location: 'Andijon, O‘zbekiston',
      joinedDate: '2024-08-19'
    },
    {
      id: 'user21',
      name: 'Diyorbek Rahmonov',
      username: 'diyorr',
      avatar: '/avatars/marcus.jpg',
      bio: 'Talabalar ligasi 3x3 basketbol to‘purari.',
      university: 'Vestminster xalqaro universiteti',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-09-02'
    },
    {
      id: 'user22',
      name: 'Malika Umarova',
      username: 'malikau',
      avatar: '/avatars/sarah.jpg',
      bio: 'Intellektual zakovat va shaxmat musobaqalari ishtirokchisi.',
      university: 'O‘zMU',
      location: 'Toshkent, O‘zbekiston',
      joinedDate: '2024-09-14'
    },
    {
      id: 'user23',
      name: 'Farrux Boboyev',
      username: 'farruxb',
      avatar: '/avatars/james.jpg',
      bio: 'Futbol yarim himoyachisi, TATU terma jamoasi a’zosi.',
      university: 'Toshkent axborot texnologiyalari universiteti',
      location: 'Buxoro, O‘zbekiston',
      joinedDate: '2024-10-01'
    },
    {
      id: 'user24',
      name: 'Ziyoda Toirova',
      username: 'ziyodat',
      avatar: '/avatars/emma.jpg',
      bio: 'Yugurish bo‘yicha Samarkand Marathon sovrindori.',
      university: 'Samarqand davlat universiteti',
      location: 'Samarqand, O‘zbekiston',
      joinedDate: '2024-10-18'
    },
    {
      id: 'user25',
      name: 'Biloliddin Sultonov',
      username: 'bilols',
      avatar: '/avatars/david.jpg',
      bio: 'Rocket League va e-sport ligalari faol qatnashchisi.',
      university: 'Inha universiteti',
      location: 'Namangan, O‘zbekiston',
      joinedDate: '2024-11-05'
    }
  ]

  for (const u of users) {
    await prisma.user.create({
      data: {
        ...u,
        role: 'USER',
        email: u.id === 'user1' ? 'abbosazizmurodovich@gmail.com' : `${u.username}@tuit.uz`,
        passwordHash: DEMO_HASH,
        globalRank: 0,
        totalPoints: 0,
      },
    })
  }

  console.log('3/7: Super Admin va Tashkilotlar yaratilmoqda...')

  await prisma.user.create({
    data: {
      id: 'admin1',
      name: 'TourneyUp Super Admin',
      username: 'superadmin',
      email: 'admin@tourneyup.uz',
      passwordHash: DEMO_HASH,
      role: 'SUPER_ADMIN',
      verified: true,
      avatar: '/placeholder-user.jpg',
      bio: 'Platforma bosh administratori.',
      location: 'Toshkent, O‘zbekiston',
      globalRank: 0,
      totalPoints: 0,
      joinedDate: '2022-01-01',
    },
  })

  const organizers = [
    { id: 'org1', name: 'Tashkent Sports Association', username: 'tashkent_sports', avatar: '/avatars/tashkent-sports.svg', bio: 'Toshkent shahar sport assotsiatsiyasi. Universitet va shahar turnirlari tashkilotchisi.', location: 'Toshkent, O‘zbekiston' },
    { id: 'org2', name: 'Uzbekistan Esports Federation', username: 'uz_esports', avatar: '/avatars/esports-arena.jpg', bio: 'O‘zbekiston kibersport federatsiyasi rasmiy akkounti.', location: 'Online' },
    { id: 'org3', name: 'Uzbek Chess Federation', username: 'uzchess', avatar: '/avatars/uz-chess.svg', bio: 'O‘zbekiston Shaxmat Federatsiyasi. FIDE reytingli musobaqalar.', location: 'Toshkent, O‘zbekiston' },
    { id: 'org4', name: 'TUIT Athletics Club', username: 'tuit_athletics', avatar: '/avatars/tuit-athletics.svg', bio: 'TATU talabalar sport klubi va ichki chempionatlar boshqaruvi.', location: 'Toshkent, O‘zbekiston' },
    { id: 'org5', name: 'Riot Games Tashkent Community', username: 'riot_tashkent', avatar: '/avatars/riot.jpg', bio: 'Toshkent Valorant va League of Legends o‘yinchilari hamjamiyati.', location: 'Online' },
    { id: 'org6', name: 'Uzbekistan Swim Union', username: 'uz_swim', avatar: '/avatars/psl.jpg', bio: 'Suzish sporti bo‘yicha rasmiy chempionatlar uyushtiruvchi tashkilot.', location: 'Toshkent, O‘zbekiston' },
    { id: 'org7', name: 'Tashkent Rocket League Community', username: 'tashkent_rl', avatar: '/avatars/psyonix.jpg', bio: 'Rocket League avto-futbol ligasi boshqaruvi.', location: 'Online' },
    { id: 'org8', name: 'Samarkand Runners Club', username: 'sam_runners', avatar: '/avatars/sam-runners.svg', bio: 'Samarqand marafoni va yugurish ixlosmandlari klubi.', location: 'Samarqand, O‘zbekiston' },
  ]

  const orgByOwner = {}

  for (const o of organizers) {
    await prisma.user.create({
      data: {
        id: o.id,
        name: o.name,
        username: o.username,
        email: `${o.username}@tourneyup.uz`,
        passwordHash: DEMO_HASH,
        role: 'ORGANIZATION',
        verified: true,
        avatar: o.avatar,
        bio: o.bio,
        location: o.location,
        globalRank: 0,
        totalPoints: 0,
        joinedDate: '2023-01-01',
      },
    })

    const organization = await prisma.organization.create({
      data: {
        name: o.name,
        slug: slugify(o.username),
        description: o.bio,
        email: `${o.username}@tourneyup.uz`,
        location: o.location,
        status: 'ACTIVE',
        ownerId: o.id,
      },
    })
    orgByOwner[o.id] = organization.id

    const channel = await prisma.channel.create({
      data: {
        type: 'ORGANIZATION',
        title: o.name,
        handle: slugify(o.username),
        description: o.bio,
        avatar: o.avatar,
        organizationId: organization.id,
      },
    })
    await prisma.channelMember.create({
      data: { channelId: channel.id, userId: o.id, role: 'OWNER' },
    })
  }

  console.log('4/7: Turnirlar yaratilmoqda (3 tasi tugagan, qolganlari ro‘yxatdan o‘tish ochiq)...')

  // Bugungi sana: 2026-10-11
  // Tugagan turnirlar: 2026-10-01 dan 2026-10-06 gacha
  // Ochiq turnirlar: 2026-10-25 va undan keyingi kelajakdagi sanalar!
  const tournaments = [
    {
      id: '1',
      title: 'Tashkent Inter-University Football Cup 2026',
      sport: 'Football',
      category: 'sports',
      location: 'Toshkent Paxtakor Stadioni',
      date: '2026-10-01',
      endDate: '2026-10-06',
      time: '10:00 AM',
      maxParticipants: 8,
      posterUrl: '/tournaments/football-championship.jpg',
      organizerId: 'org1',
      description: 'Toshkent oliy o‘quv yurtlari o‘rtasidagi bosh futbol chempionati. 8 ta universitet jamoasi, guruh va pley-off bosqichi.',
      rulesJson: JSON.stringify(['FIFA qoidalari', 'Guruhdan 2 ta jamoa yarim finalga chiqadi', 'Pley-offda durang bo‘lsa penaltilar']),
      requirementsJson: JSON.stringify(['Universitet talabalik guvohnomasi', 'Jamoada kamida 11 o‘yinchi']),
      prizePool: '50M UZS',
      entryFee: '500,000 UZS',
      format: 'GROUPS_KNOCKOUT',
      formatConfigJson: JSON.stringify({ groupCount: 2, advancePerGroup: 2, thirdPlaceMatch: true, winPoints: 3, drawPoints: 1, lossPoints: 0 }),
      status: 'completed', // 1-TUGAGAN TURNIR
      drawGeneratedAt: new Date('2026-10-01T09:00:00Z'),
      resultsFinalizedAt: new Date('2026-10-06T18:00:00Z'),
      closedAt: new Date('2026-10-06T18:00:00Z'),
      featured: true
    },
    {
      id: '2',
      title: 'PUBG Mobile Tashkent Masters',
      sport: 'PUBG Mobile',
      category: 'esports',
      location: 'Online',
      date: '2026-10-25',
      endDate: '2026-10-28',
      time: '6:00 PM',
      maxParticipants: 32,
      posterUrl: '/tournaments/pubg-masters.jpg',
      organizerId: 'org2',
      description: 'Battle Royale formati. 32 ta squad jamoasi uchun ro‘yxatdan o‘tish ochiq. Hozircha joylar mavjud.',
      rulesJson: JSON.stringify(['Squad (4 kishi)', 'Erangel va Miramar']),
      requirementsJson: JSON.stringify(['Level 40+', 'Rasmiy Discord']),
      prizePool: '15M UZS',
      entryFee: 'Bepul',
      format: 'LEADERBOARD',
      formatConfigJson: JSON.stringify({ scoreKind: 'points', leaderboardRounds: 4 }),
      status: 'registration_open', // RO‘YXATDAN O‘TISH OCHIQ, HALI BOSHLANMAGAN!
      drawGeneratedAt: null,
      resultsFinalizedAt: null,
      closedAt: null,
      featured: true
    },
    {
      id: '3',
      title: 'Uzbekistan National Chess Championship',
      sport: 'Chess',
      category: 'academic',
      location: 'Toshkent Xalqaro Shaxmat Akademiyasi',
      date: '2026-11-05',
      endDate: '2026-11-10',
      time: '9:00 AM',
      maxParticipants: 64,
      posterUrl: '/tournaments/chess-championship.jpg',
      organizerId: 'org3',
      description: 'FIDE shveysarcha tizimidagi 5 turdan iborat milliy shaxmat chempionati. Ro‘yxatdan o‘tish ochiq.',
      rulesJson: JSON.stringify(['FIDE qoidalari', '90 min + 30 soniya']),
      requirementsJson: JSON.stringify(['Reyting 1800+']),
      prizePool: '30M UZS',
      entryFee: '100,000 UZS',
      format: 'SWISS',
      formatConfigJson: JSON.stringify({ swissRounds: 5, winPoints: 1, drawPoints: 0.5, lossPoints: 0 }),
      status: 'registration_open', // RO‘YXATDAN O‘TISH OCHIQ, HALI BOSHLANMAGAN!
      drawGeneratedAt: null,
      resultsFinalizedAt: null,
      closedAt: null,
      featured: true
    },
    {
      id: '4',
      title: 'TUIT Basketball 3v3 Arena',
      sport: 'Basketball',
      category: 'sports',
      location: 'TATU Yopiq Sport Majmuasi',
      date: '2026-10-02',
      time: '2:00 PM',
      maxParticipants: 8,
      posterUrl: '/tournaments/basketball-3v3.jpg',
      organizerId: 'org4',
      description: 'TATU talabalar shaharchasida 3x3 tezkor basketbol kubogi. Single elimination.',
      rulesJson: JSON.stringify(['FIBA 3x3 qoidalari', '10 daqiqa yoki 21 ochko']),
      requirementsJson: JSON.stringify(['Talabalik guvohnomasi']),
      prizePool: '5M UZS',
      entryFee: '50,000 UZS',
      format: 'SINGLE_ELIMINATION',
      formatConfigJson: JSON.stringify({ thirdPlaceMatch: true }),
      status: 'completed', // 2-TUGAGAN TURNIR
      drawGeneratedAt: new Date('2026-10-02T10:00:00Z'),
      resultsFinalizedAt: new Date('2026-10-02T18:00:00Z'),
      closedAt: new Date('2026-10-02T18:00:00Z'),
      featured: false
    },
    {
      id: '5',
      title: 'Valorant Uzbekistan Cup',
      sport: 'Valorant',
      category: 'esports',
      location: 'Online',
      date: '2026-11-15',
      endDate: '2026-11-16',
      time: '5:00 PM',
      maxParticipants: 16,
      posterUrl: '/tournaments/valorant-cup.jpg',
      organizerId: 'org5',
      description: 'Taktik Valorant kubogi. Double elimination.',
      rulesJson: JSON.stringify(['VCT qoidalari', '5 kishi + 1 zaxira']),
      requirementsJson: JSON.stringify(['Diamond 1+']),
      prizePool: '10M UZS',
      entryFee: 'Bepul',
      format: 'DOUBLE_ELIMINATION',
      formatConfigJson: JSON.stringify({ grandFinalReset: true }),
      status: 'registration_open',
      drawGeneratedAt: null,
      resultsFinalizedAt: null,
      closedAt: null,
      featured: false
    },
    {
      id: '6',
      title: 'Tashkent Swimming Championship',
      sport: 'Swimming',
      category: 'sports',
      location: 'Suv sporti saroyi',
      date: '2026-11-20',
      time: '8:00 AM',
      maxParticipants: 30,
      posterUrl: '/tournaments/swimming-meet.jpg',
      organizerId: 'org6',
      description: '100 metrga erkin suzish bo‘yicha shahar birinchiligi.',
      rulesJson: JSON.stringify(['FINA qoidalari']),
      requirementsJson: JSON.stringify(['Tibbiy ma’lumotnoma']),
      prizePool: '12M UZS',
      entryFee: '80,000 UZS',
      format: 'LEADERBOARD',
      formatConfigJson: JSON.stringify({ scoreKind: 'time', leaderboardRounds: 2 }),
      status: 'upcoming',
      drawGeneratedAt: null,
      resultsFinalizedAt: null,
      closedAt: null,
      featured: false
    },
    {
      id: '7',
      title: 'Rocket League Tashkent Showdown',
      sport: 'Rocket League',
      category: 'esports',
      location: 'Online',
      date: '2026-11-25',
      time: '7:00 PM',
      maxParticipants: 16,
      posterUrl: '/tournaments/rocket-league.jpg',
      organizerId: 'org7',
      description: 'Avto-futbol 3v3 ligasi. Aylanma tizim.',
      rulesJson: JSON.stringify(['3v3 standart', '5 daqiqa']),
      requirementsJson: JSON.stringify(['Champion 1+']),
      prizePool: '4M UZS',
      entryFee: 'Bepul',
      format: 'ROUND_ROBIN',
      formatConfigJson: JSON.stringify({ winPoints: 3, drawPoints: 0, lossPoints: 0 }),
      status: 'registration_open',
      drawGeneratedAt: null,
      resultsFinalizedAt: null,
      closedAt: null,
      featured: false
    },
    {
      id: '8',
      title: 'Samarkand Marathon 2026',
      sport: 'Running',
      category: 'sports',
      location: 'Samarqand Registon Maydoni',
      date: '2026-10-05',
      time: '6:00 AM',
      maxParticipants: 10,
      posterUrl: '/tournaments/marathon.jpg',
      organizerId: 'org8',
      description: 'Registon maydonidan start oluvchi 42 km masofaga marafon yugurishi.',
      rulesJson: JSON.stringify(['USATF qoidalari', '6 soat limit']),
      requirementsJson: JSON.stringify(['Tibbiy ruxsatnoma']),
      prizePool: '20M UZS',
      entryFee: '150,000 UZS',
      format: 'LEADERBOARD',
      formatConfigJson: JSON.stringify({ scoreKind: 'time', leaderboardRounds: 1 }),
      status: 'completed', // 3-TUGAGAN TURNIR
      drawGeneratedAt: new Date('2026-10-05T06:00:00Z'),
      resultsFinalizedAt: new Date('2026-10-05T14:00:00Z'),
      closedAt: new Date('2026-10-05T14:00:00Z'),
      featured: true
    }
  ]

  for (const t of tournaments) {
    const created = await prisma.tournament.create({
      data: { ...t, organizationId: orgByOwner[t.organizerId] ?? null },
    })

    const channel = await prisma.channel.create({
      data: {
        type: 'TOURNAMENT',
        title: t.title,
        handle: `t-${created.id}-${slugify(t.sport)}`.slice(0, 60),
        description: t.description.slice(0, 500),
        avatar: t.posterUrl,
        tournamentId: created.id,
      },
    })
    await prisma.channelMember.create({
      data: { channelId: channel.id, userId: t.organizerId, role: 'OWNER' },
    })
  }

  console.log('5/7: Ishtirokchilar va Matchlar kiritilmoqda...')

  // ==========================================
  // TURNIR 1: FOOTBALL CUP (COMPLETED)
  // ==========================================
  const fbParticipants = [
    { id: 'p1_1', tournamentId: '1', name: 'Abbos Qurbonov', teamName: 'TATU FC', email: 'abbosazizmurodovich@gmail.com', avatar: '/avatars/alex.jpg', registeredAt: '2026-09-25T09:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user1', seed: 1 },
    { id: 'p1_2', tournamentId: '1', name: 'Sardor Rahimov', teamName: 'O‘zMU United', email: 'sardorr@tuit.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-09-25T09:30:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user11', seed: 2 },
    { id: 'p1_3', tournamentId: '1', name: 'Madina Abdullayeva', teamName: 'TDTU Lions', email: 'madinaa@tuit.uz', avatar: '/avatars/olivia.jpg', registeredAt: '2026-09-25T10:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user12', seed: 3 },
    { id: 'p1_4', tournamentId: '1', name: 'Dilshod Karimov', teamName: 'Inha Tigers', email: 'dilshodk@tuit.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-09-25T10:30:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user13', seed: 4 },
    { id: 'p1_5', tournamentId: '1', name: 'Shahzodbek Olimov', teamName: 'WIUT Wolves', email: 'shahzodo@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-09-25T11:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user14', seed: 5 },
    { id: 'p1_6', tournamentId: '1', name: 'Jasur Aliyev', teamName: 'Westminster Eagles', email: 'jasura@tuit.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-09-25T11:30:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user15', seed: 6 },
    { id: 'p1_7', tournamentId: '1', name: 'Nigora Rustamova', teamName: 'TDIU Falcons', email: 'nigorar@tuit.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-09-25T12:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user10', seed: 7 },
    { id: 'p1_8', tournamentId: '1', name: 'Demo O‘yinchi 2', teamName: 'Amity Stars', email: 'demouser2@tuit.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-09-25T12:30:00Z', status: 'approved', paymentStatus: 'paid', userId: 'demo_user2', seed: 8 },
  ]
  for (const p of fbParticipants) {
    await prisma.participant.create({ data: p })
  }

  const groupA = await prisma.competitionGroup.create({
    data: { tournamentId: '1', name: 'A guruhi', order: 1 }
  })
  const groupB = await prisma.competitionGroup.create({
    data: { tournamentId: '1', name: 'B guruhi', order: 2 }
  })

  // Guruh matchlari (A guruhi: p1_1, p1_2, p1_3, p1_4)
  const groupAMatches = [
    { tournamentId: '1', bracket: 'GROUP', groupId: groupA.id, round: 1, position: 0, status: 'completed', homeParticipantId: 'p1_1', awayParticipantId: 'p1_2', homeLabel: 'TATU FC', awayLabel: 'O‘zMU United', homeUserId: 'user1', awayUserId: 'user11', homeScore: 2, awayScore: 1, winnerParticipantId: 'p1_1', winnerUserId: 'user1', finalizedAt: new Date('2026-10-01T10:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupA.id, round: 1, position: 1, status: 'completed', homeParticipantId: 'p1_3', awayParticipantId: 'p1_4', homeLabel: 'TDTU Lions', awayLabel: 'Inha Tigers', homeUserId: 'user12', awayUserId: 'user13', homeScore: 1, awayScore: 1, winnerParticipantId: null, winnerUserId: null, finalizedAt: new Date('2026-10-01T12:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupA.id, round: 2, position: 0, status: 'completed', homeParticipantId: 'p1_1', awayParticipantId: 'p1_3', homeLabel: 'TATU FC', awayLabel: 'TDTU Lions', homeUserId: 'user1', awayUserId: 'user12', homeScore: 3, awayScore: 1, winnerParticipantId: 'p1_1', winnerUserId: 'user1', finalizedAt: new Date('2026-10-02T10:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupA.id, round: 2, position: 1, status: 'completed', homeParticipantId: 'p1_2', awayParticipantId: 'p1_4', homeLabel: 'O‘zMU United', awayLabel: 'Inha Tigers', homeUserId: 'user11', awayUserId: 'user13', homeScore: 2, awayScore: 1, winnerParticipantId: 'p1_2', winnerUserId: 'user11', finalizedAt: new Date('2026-10-02T12:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupA.id, round: 3, position: 0, status: 'completed', homeParticipantId: 'p1_1', awayParticipantId: 'p1_4', homeLabel: 'TATU FC', awayLabel: 'Inha Tigers', homeUserId: 'user1', awayUserId: 'user13', homeScore: 2, awayScore: 0, winnerParticipantId: 'p1_1', winnerUserId: 'user1', finalizedAt: new Date('2026-10-03T10:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupA.id, round: 3, position: 1, status: 'completed', homeParticipantId: 'p1_2', awayParticipantId: 'p1_3', homeLabel: 'O‘zMU United', awayLabel: 'TDTU Lions', homeUserId: 'user11', awayUserId: 'user12', homeScore: 2, awayScore: 0, winnerParticipantId: 'p1_2', winnerUserId: 'user11', finalizedAt: new Date('2026-10-03T12:00:00Z') },
  ]
  // Guruh matchlari (B guruhi: p1_5, p1_6, p1_7, p1_8)
  const groupBMatches = [
    { tournamentId: '1', bracket: 'GROUP', groupId: groupB.id, round: 1, position: 2, status: 'completed', homeParticipantId: 'p1_5', awayParticipantId: 'p1_6', homeLabel: 'WIUT Wolves', awayLabel: 'Westminster Eagles', homeUserId: 'user14', awayUserId: 'user15', homeScore: 2, awayScore: 0, winnerParticipantId: 'p1_5', winnerUserId: 'user14', finalizedAt: new Date('2026-10-01T14:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupB.id, round: 1, position: 3, status: 'completed', homeParticipantId: 'p1_7', awayParticipantId: 'p1_8', homeLabel: 'TDIU Falcons', awayLabel: 'Amity Stars', homeUserId: 'user10', awayUserId: 'demo_user2', homeScore: 1, awayScore: 1, winnerParticipantId: null, winnerUserId: null, finalizedAt: new Date('2026-10-01T16:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupB.id, round: 2, position: 2, status: 'completed', homeParticipantId: 'p1_5', awayParticipantId: 'p1_7', homeLabel: 'WIUT Wolves', awayLabel: 'TDIU Falcons', homeUserId: 'user14', awayUserId: 'user10', homeScore: 3, awayScore: 1, winnerParticipantId: 'p1_5', winnerUserId: 'user14', finalizedAt: new Date('2026-10-02T14:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupB.id, round: 2, position: 3, status: 'completed', homeParticipantId: 'p1_6', awayParticipantId: 'p1_8', homeLabel: 'Westminster Eagles', awayLabel: 'Amity Stars', homeUserId: 'user15', awayUserId: 'demo_user2', homeScore: 2, awayScore: 1, winnerParticipantId: 'p1_6', winnerUserId: 'user15', finalizedAt: new Date('2026-10-02T16:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupB.id, round: 3, position: 2, status: 'completed', homeParticipantId: 'p1_5', awayParticipantId: 'p1_8', homeLabel: 'WIUT Wolves', awayLabel: 'Amity Stars', homeUserId: 'user14', awayUserId: 'demo_user2', homeScore: 1, awayScore: 1, winnerParticipantId: null, winnerUserId: null, finalizedAt: new Date('2026-10-03T14:00:00Z') },
    { tournamentId: '1', bracket: 'GROUP', groupId: groupB.id, round: 3, position: 3, status: 'completed', homeParticipantId: 'p1_7', awayParticipantId: 'p1_6', homeLabel: 'TDIU Falcons', awayLabel: 'Westminster Eagles', homeUserId: 'user10', awayUserId: 'user15', homeScore: 2, awayScore: 1, winnerParticipantId: 'p1_7', winnerUserId: 'user10', finalizedAt: new Date('2026-10-03T16:00:00Z') },
  ]

  for (const m of [...groupAMatches, ...groupBMatches]) {
    await prisma.match.create({ data: m })
  }

  // Pley-off Yarim finallari va Finali
  const playoffMatches = [
    { id: 'm1_sf_0', tournamentId: '1', bracket: 'MAIN', round: 1, position: 0, status: 'completed', homeParticipantId: 'p1_1', awayParticipantId: 'p1_7', homeLabel: 'TATU FC', awayLabel: 'TDIU Falcons', homeUserId: 'user1', awayUserId: 'user10', homeScore: 3, awayScore: 1, winnerParticipantId: 'p1_1', winnerUserId: 'user1', finalizedAt: new Date('2026-10-05T14:00:00Z') },
    { id: 'm1_sf_1', tournamentId: '1', bracket: 'MAIN', round: 1, position: 1, status: 'completed', homeParticipantId: 'p1_5', awayParticipantId: 'p1_2', homeLabel: 'WIUT Wolves', awayLabel: 'O‘zMU United', homeUserId: 'user14', awayUserId: 'user11', homeScore: 2, awayScore: 1, winnerParticipantId: 'p1_5', winnerUserId: 'user14', finalizedAt: new Date('2026-10-05T16:00:00Z') },
    { id: 'm1_third', tournamentId: '1', bracket: 'THIRD_PLACE', round: 2, position: 0, status: 'completed', homeParticipantId: 'p1_7', awayParticipantId: 'p1_2', homeLabel: 'TDIU Falcons', awayLabel: 'O‘zMU United', homeUserId: 'user10', awayUserId: 'user11', homeScore: 1, awayScore: 2, winnerParticipantId: 'p1_2', winnerUserId: 'user11', finalizedAt: new Date('2026-10-06T14:00:00Z') },
    { id: 'm1_final', tournamentId: '1', bracket: 'MAIN', round: 2, position: 0, status: 'completed', homeParticipantId: 'p1_1', awayParticipantId: 'p1_5', homeLabel: 'TATU FC', awayLabel: 'WIUT Wolves', homeUserId: 'user1', awayUserId: 'user14', homeScore: 2, awayScore: 1, winnerParticipantId: 'p1_1', winnerUserId: 'user1', finalizedAt: new Date('2026-10-06T17:30:00Z') },
  ]
  for (const m of playoffMatches) {
    await prisma.match.create({ data: m })
  }

  // ==========================================
  // TURNIR 4: BASKETBALL 3v3 (COMPLETED)
  // ==========================================
  const bbParticipants = [
    { id: 'p4_1', name: 'Demo O‘yinchi 1', email: 'demouser1@tuit.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-09-27T10:00:00Z', status: 'approved', teamName: 'TUIT Shooters', paymentStatus: 'paid', tournamentId: '4', userId: 'demo_user1', seed: 1 },
    { id: 'p4_2', name: 'Sardor Rahimov', email: 'sardorr@tuit.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-09-28T14:00:00Z', status: 'approved', teamName: 'WIUT Ballers', paymentStatus: 'paid', tournamentId: '4', userId: 'user11', seed: 2 },
    { id: 'p4_3', name: 'Abbos Qurbonov', email: 'abbosazizmurodovich@gmail.com', avatar: '/avatars/alex.jpg', registeredAt: '2026-09-29T10:30:00Z', status: 'approved', teamName: 'Chilonzor 3x3', paymentStatus: 'paid', tournamentId: '4', userId: 'user1', seed: 3 },
    { id: 'p4_4', name: 'Demo O‘yinchi 2', email: 'demouser2@tuit.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-09-29T11:00:00Z', status: 'approved', teamName: 'Yunusobod 3x3', paymentStatus: 'paid', tournamentId: '4', userId: 'demo_user2', seed: 4 },
    { id: 'p4_5', name: 'Jasur Aliyev', email: 'jasura@tuit.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-09-29T12:00:00Z', status: 'approved', teamName: 'Sergeli Shooters', paymentStatus: 'paid', tournamentId: '4', userId: 'user15', seed: 5 },
    { id: 'p4_6', name: 'Dilshod Karimov', email: 'dilshodk@tuit.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-09-29T13:00:00Z', status: 'approved', teamName: 'Dunk Masters', paymentStatus: 'paid', tournamentId: '4', userId: 'user13', seed: 6 },
    { id: 'p4_7', name: 'Shahzodbek Olimov', email: 'shahzodo@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-09-29T14:00:00Z', status: 'approved', teamName: 'Street Kings', paymentStatus: 'paid', tournamentId: '4', userId: 'user14', seed: 7 },
    { id: 'p4_8', name: 'Demo O‘yinchi 3', email: 'demouser3@tuit.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-09-29T15:00:00Z', status: 'approved', teamName: 'Olmazor Jets', paymentStatus: 'paid', tournamentId: '4', userId: 'demo_user3', seed: 8 },
  ]
  for (const p of bbParticipants) {
    await prisma.participant.create({ data: p })
  }

  const bBallMatches = [
    { id: 'm4_qf_0', tournamentId: '4', bracket: 'MAIN', round: 1, position: 0, status: 'completed', homeParticipantId: 'p4_1', awayParticipantId: 'p4_8', homeLabel: 'TUIT Shooters', awayLabel: 'Olmazor Jets', homeUserId: 'demo_user1', awayUserId: 'demo_user3', homeScore: 21, awayScore: 14, winnerParticipantId: 'p4_1', winnerUserId: 'demo_user1', finalizedAt: new Date('2026-10-02T14:30:00Z') },
    { id: 'm4_qf_1', tournamentId: '4', bracket: 'MAIN', round: 1, position: 1, status: 'completed', homeParticipantId: 'p4_4', awayParticipantId: 'p4_5', homeLabel: 'Yunusobod 3x3', awayLabel: 'Sergeli Shooters', homeUserId: 'demo_user2', awayUserId: 'user15', homeScore: 21, awayScore: 17, winnerParticipantId: 'p4_4', winnerUserId: 'demo_user2', finalizedAt: new Date('2026-10-02T15:00:00Z') },
    { id: 'm4_qf_2', tournamentId: '4', bracket: 'MAIN', round: 1, position: 2, status: 'completed', homeParticipantId: 'p4_2', awayParticipantId: 'p4_7', homeLabel: 'WIUT Ballers', awayLabel: 'Street Kings', homeUserId: 'user11', awayUserId: 'user14', homeScore: 21, awayScore: 16, winnerParticipantId: 'p4_2', winnerUserId: 'user11', finalizedAt: new Date('2026-10-02T15:30:00Z') },
    { id: 'm4_qf_3', tournamentId: '4', bracket: 'MAIN', round: 1, position: 3, status: 'completed', homeParticipantId: 'p4_3', awayParticipantId: 'p4_6', homeLabel: 'Chilonzor 3x3', awayLabel: 'Dunk Masters', homeUserId: 'user1', awayUserId: 'user13', homeScore: 21, awayScore: 19, winnerParticipantId: 'p4_3', winnerUserId: 'user1', finalizedAt: new Date('2026-10-02T16:00:00Z') },
    { id: 'm4_sf_0', tournamentId: '4', bracket: 'MAIN', round: 2, position: 0, status: 'completed', homeParticipantId: 'p4_1', awayParticipantId: 'p4_4', homeLabel: 'TUIT Shooters', awayLabel: 'Yunusobod 3x3', homeUserId: 'demo_user1', awayUserId: 'demo_user2', homeScore: 21, awayScore: 18, winnerParticipantId: 'p4_1', winnerUserId: 'demo_user1', finalizedAt: new Date('2026-10-02T16:30:00Z') },
    { id: 'm4_sf_1', tournamentId: '4', bracket: 'MAIN', round: 2, position: 1, status: 'completed', homeParticipantId: 'p4_2', awayParticipantId: 'p4_3', homeLabel: 'WIUT Ballers', awayLabel: 'Chilonzor 3x3', homeUserId: 'user11', awayUserId: 'user1', homeScore: 21, awayScore: 19, winnerParticipantId: 'p4_2', winnerUserId: 'user11', finalizedAt: new Date('2026-10-02T17:00:00Z') },
    { id: 'm4_third', tournamentId: '4', bracket: 'THIRD_PLACE', round: 3, position: 0, status: 'completed', homeParticipantId: 'p4_4', awayParticipantId: 'p4_3', homeLabel: 'Yunusobod 3x3', awayLabel: 'Chilonzor 3x3', homeUserId: 'demo_user2', awayUserId: 'user1', homeScore: 17, awayScore: 21, winnerParticipantId: 'p4_3', winnerUserId: 'user1', finalizedAt: new Date('2026-10-02T17:30:00Z') },
    { id: 'm4_final', tournamentId: '4', bracket: 'MAIN', round: 3, position: 0, status: 'completed', homeParticipantId: 'p4_1', awayParticipantId: 'p4_2', homeLabel: 'TUIT Shooters', awayLabel: 'WIUT Ballers', homeUserId: 'demo_user1', awayUserId: 'user11', homeScore: 21, awayScore: 19, winnerParticipantId: 'p4_1', winnerUserId: 'demo_user1', finalizedAt: new Date('2026-10-02T18:00:00Z') },
  ]
  for (const m of bBallMatches) {
    await prisma.match.create({ data: m })
  }

  // ==========================================
  // TURNIR 8: SAMARKAND MARATHON (COMPLETED)
  // ==========================================
  const marathonParticipants = [
    { id: 'p8_1', name: 'Bekzod Mirzayev', email: 'bekzodm@tuit.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-09-30T06:00:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user18' },
    { id: 'p8_2', name: 'Ziyoda Toirova', email: 'ziyodat@tuit.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-09-30T06:30:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user24' },
    { id: 'p8_3', name: 'Madina Abdullayeva', email: 'madinaa@tuit.uz', avatar: '/avatars/olivia.jpg', registeredAt: '2026-09-30T07:00:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user12' },
    { id: 'p8_4', name: 'Abbos Qurbonov', email: 'abbosazizmurodovich@gmail.com', avatar: '/avatars/alex.jpg', registeredAt: '2026-09-30T07:30:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user1' },
    { id: 'p8_5', name: 'Sardor Rahimov', email: 'sardorr@tuit.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-09-30T08:00:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user11' },
    { id: 'p8_6', name: 'Demo O‘yinchi 1', email: 'demouser1@tuit.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-09-30T08:30:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'demo_user1' },
    { id: 'p8_7', name: 'Demo O‘yinchi 2', email: 'demouser2@tuit.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-09-30T09:00:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'demo_user2' },
    { id: 'p8_8', name: 'Farrux Boboyev', email: 'farruxb@tuit.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-09-30T09:30:00Z', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user23' },
  ]
  for (const p of marathonParticipants) {
    await prisma.participant.create({ data: p })
  }

  const marathonEntries = [
    { tournamentId: '8', participantId: 'p8_1', round: 1, value: 7800000, status: 'done' }, // 2h 10m - Bekzod (1st)
    { tournamentId: '8', participantId: 'p8_2', round: 1, value: 7950000, status: 'done' }, // 2h 12m - Ziyoda (2nd)
    { tournamentId: '8', participantId: 'p8_3', round: 1, value: 8100000, status: 'done' }, // 2h 15m - Madina (3rd)
    { tournamentId: '8', participantId: 'p8_4', round: 1, value: 8300000, status: 'done' }, // 2h 18m - Abbos (4th)
    { tournamentId: '8', participantId: 'p8_5', round: 1, value: 8500000, status: 'done' }, // 2h 21m - Sardor (5th)
    { tournamentId: '8', participantId: 'p8_6', round: 1, value: 8650000, status: 'done' },
    { tournamentId: '8', participantId: 'p8_7', round: 1, value: 8800000, status: 'done' },
    { tournamentId: '8', participantId: 'p8_8', round: 1, value: 9100000, status: 'done' },
  ]
  for (const entry of marathonEntries) {
    await prisma.leaderboardEntry.create({ data: entry })
  }

  // ==========================================
  // OCHIQ TURNIRLARGA YOZILGAN AYRIM ISHTIROKCHILAR (turnirlar hali to‘lmagan)
  // ==========================================
  const openTourneyParticipants = [
    // PUBG (Turnir 2 - 32 tadan 4 ta joy band, 28 ta bo‘sh!)
    { tournamentId: '2', name: 'Aziz Tursunov', teamName: 'Tashkent Titans', email: 'azizt@tuit.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-10-09T10:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user16' },
    { tournamentId: '2', name: 'Dilshod Karimov', teamName: 'Inha Predators', email: 'dilshodk@tuit.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-10-09T12:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user13' },
    { tournamentId: '2', name: 'Jasur Aliyev', teamName: 'Amity Squad', email: 'jasura@tuit.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-10-09T13:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user15' },

    // Shaxmat (Turnir 3 - 64 tadan 3 ta joy band, 61 ta bo‘sh!)
    { tournamentId: '3', name: 'Kamola Karimova', email: 'kamolak@tuit.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-10-09T10:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user17' },
    { tournamentId: '3', name: 'Nigora Rustamova', email: 'nigorar@tuit.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-10-09T11:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user10' },
    { tournamentId: '3', name: 'Malika Umarova', email: 'malikau@tuit.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-10-09T12:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user22' },

    // Valorant (Turnir 5 - 16 tadan 2 ta joy band)
    { tournamentId: '5', name: 'Dilshod Karimov', teamName: 'Inha Sentinels', email: 'dilshodk@tuit.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-10-10T10:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user13' },
    { tournamentId: '5', name: 'Jamshid Normatov', teamName: 'Andijan Aces', email: 'jamshidn@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-10-10T11:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user20' },

    // Suzish (Turnir 6 - 30 tadan 2 ta joy band)
    { tournamentId: '6', name: 'Sevara Saidova', email: 'sevaras@tuit.uz', avatar: '/avatars/olivia.jpg', registeredAt: '2026-10-10T10:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user19' },
    { tournamentId: '6', name: 'Shahzodbek Olimov', email: 'shahzodo@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-10-10T11:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user14' },

    // Rocket League (Turnir 7 - 16 tadan 2 ta joy band)
    { tournamentId: '7', name: 'Biloliddin Sultonov', teamName: 'Turbo Tashkent', email: 'bilols@tuit.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-10-10T10:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user25' },
    { tournamentId: '7', name: 'Jasur Aliyev', teamName: 'Amity Rocketeers', email: 'jasura@tuit.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-10-10T11:00:00Z', status: 'approved', paymentStatus: 'paid', userId: 'user15' },
  ]
  for (const p of openTourneyParticipants) {
    await prisma.participant.create({ data: p })
  }

  console.log('6/7: Tourney Points, Reytinglar va sovrinlar kiritilmoqda...')

  // 1. Football Cup Ochkolari (Turnir 1)
  await prisma.pointAward.createMany({
    data: [
      { userId: 'user1', tournamentId: '1', participantId: 'p1_1', sport: 'Football', category: 'sports', earnedAt: new Date('2026-10-06T18:00:00Z'), configVersion: 1, placement: 1, basePoints: 1000, fieldSize: 8, points: 1000 },
      { userId: 'user14', tournamentId: '1', participantId: 'p1_5', sport: 'Football', category: 'sports', earnedAt: new Date('2026-10-06T18:00:00Z'), configVersion: 1, placement: 2, basePoints: 700, fieldSize: 8, points: 700 },
      { userId: 'user11', tournamentId: '1', participantId: 'p1_2', sport: 'Football', category: 'sports', earnedAt: new Date('2026-10-06T18:00:00Z'), configVersion: 1, placement: 3, basePoints: 500, fieldSize: 8, points: 500 },
      { userId: 'user10', tournamentId: '1', participantId: 'p1_7', sport: 'Football', category: 'sports', earnedAt: new Date('2026-10-06T18:00:00Z'), configVersion: 1, placement: 4, basePoints: 350, fieldSize: 8, points: 350 },
    ]
  })

  // 2. Basketball 3v3 Ochkolari (Turnir 4)
  await prisma.pointAward.createMany({
    data: [
      { userId: 'demo_user1', tournamentId: '4', participantId: 'p4_1', sport: 'Basketball', category: 'sports', earnedAt: new Date('2026-10-02T18:00:00Z'), configVersion: 1, placement: 1, basePoints: 1000, fieldSize: 8, points: 1000 },
      { userId: 'user11', tournamentId: '4', participantId: 'p4_2', sport: 'Basketball', category: 'sports', earnedAt: new Date('2026-10-02T18:00:00Z'), configVersion: 1, placement: 2, basePoints: 700, fieldSize: 8, points: 700 },
      { userId: 'user1', tournamentId: '4', participantId: 'p4_3', sport: 'Basketball', category: 'sports', earnedAt: new Date('2026-10-02T18:00:00Z'), configVersion: 1, placement: 3, basePoints: 500, fieldSize: 8, points: 500 },
      { userId: 'demo_user2', tournamentId: '4', participantId: 'p4_4', sport: 'Basketball', category: 'sports', earnedAt: new Date('2026-10-02T18:00:00Z'), configVersion: 1, placement: 4, basePoints: 350, fieldSize: 8, points: 350 },
    ]
  })

  // 3. Marathon Ochkolari (Turnir 8)
  await prisma.pointAward.createMany({
    data: [
      { userId: 'user18', tournamentId: '8', participantId: 'p8_1', sport: 'Running', category: 'sports', earnedAt: new Date('2026-10-05T14:00:00Z'), configVersion: 1, placement: 1, basePoints: 1000, fieldSize: 8, points: 1000 },
      { userId: 'user24', tournamentId: '8', participantId: 'p8_2', sport: 'Running', category: 'sports', earnedAt: new Date('2026-10-05T14:00:00Z'), configVersion: 1, placement: 2, basePoints: 700, fieldSize: 8, points: 700 },
      { userId: 'user12', tournamentId: '8', participantId: 'p8_3', sport: 'Running', category: 'sports', earnedAt: new Date('2026-10-05T14:00:00Z'), configVersion: 1, placement: 3, basePoints: 500, fieldSize: 8, points: 500 },
      { userId: 'user1', tournamentId: '8', participantId: 'p8_4', sport: 'Running', category: 'sports', earnedAt: new Date('2026-10-05T14:00:00Z'), configVersion: 1, placement: 4, basePoints: 350, fieldSize: 8, points: 350 },
      { userId: 'user11', tournamentId: '8', participantId: 'p8_5', sport: 'Running', category: 'sports', earnedAt: new Date('2026-10-05T14:00:00Z'), configVersion: 1, placement: 5, basePoints: 200, fieldSize: 8, points: 200 },
    ]
  })

  // Sport turlari bo'yicha reytinglar (SportRank)
  await prisma.sportRank.createMany({
    data: [
      { userId: 'user1', sport: 'Football', rank: 1, points: 1000, tier: 'champion' },
      { userId: 'user1', sport: 'Basketball', rank: 3, points: 500, tier: 'platinum' },
      { userId: 'user1', sport: 'Running', rank: 4, points: 350, tier: 'gold' },

      { userId: 'user11', sport: 'Basketball', rank: 2, points: 700, tier: 'diamond' },
      { userId: 'user11', sport: 'Football', rank: 3, points: 500, tier: 'platinum' },
      { userId: 'user11', sport: 'Running', rank: 5, points: 200, tier: 'silver' },

      { userId: 'demo_user1', sport: 'Basketball', rank: 1, points: 1000, tier: 'champion' },

      { userId: 'user18', sport: 'Running', rank: 1, points: 1000, tier: 'champion' },
      { userId: 'user24', sport: 'Running', rank: 2, points: 700, tier: 'diamond' },
      { userId: 'user12', sport: 'Running', rank: 3, points: 500, tier: 'platinum' },

      { userId: 'user14', sport: 'Football', rank: 2, points: 700, tier: 'diamond' },
      { userId: 'user10', sport: 'Football', rank: 4, points: 350, tier: 'gold' },
      { userId: 'demo_user2', sport: 'Basketball', rank: 4, points: 350, tier: 'gold' },
    ]
  })

  // Foydalanuvchilarning umumiy ochkolari va global o'rinlari (Leaderboard)
  await prisma.user.update({ where: { id: 'user1' }, data: { totalPoints: 1850, globalRank: 1 } })
  await prisma.user.update({ where: { id: 'user11' }, data: { totalPoints: 1400, globalRank: 2 } })
  await prisma.user.update({ where: { id: 'demo_user1' }, data: { totalPoints: 1000, globalRank: 3 } })
  await prisma.user.update({ where: { id: 'user18' }, data: { totalPoints: 1000, globalRank: 4 } })
  await prisma.user.update({ where: { id: 'user14' }, data: { totalPoints: 700, globalRank: 5 } })
  await prisma.user.update({ where: { id: 'user24' }, data: { totalPoints: 700, globalRank: 6 } })
  await prisma.user.update({ where: { id: 'user12' }, data: { totalPoints: 500, globalRank: 7 } })
  await prisma.user.update({ where: { id: 'user10' }, data: { totalPoints: 350, globalRank: 8 } })
  await prisma.user.update({ where: { id: 'demo_user2' }, data: { totalPoints: 350, globalRank: 9 } })

  console.log('7/7: Yutuqlar, Jamoalar, Kanallar va Saqlanganlar yaratilmoqda...')

  await prisma.achievement.createMany({
    data: [
      { title: 'Toshkent Chempioni', description: 'Universitetlararo futbol kubogida 1-o‘rin', icon: 'trophy', date: '2026-10-06', rarity: 'legendary', userId: 'user1' },
      { title: 'Basketbol Bronzasi', description: '3x3 basketbol arenada 3-o‘rin', icon: 'medal', date: '2026-10-02', rarity: 'epic', userId: 'user1' },
      { title: 'Top 1 Reyting', description: 'Platforma umumiy reytingida 1-o‘ringa chiqdi', icon: 'crown', date: '2026-10-06', rarity: 'legendary', userId: 'user1' },
      { title: 'Ko‘p qirrali sportchi', description: '3 xil sport turi bo‘yicha ochko to‘plagan', icon: 'star', date: '2026-10-06', rarity: 'legendary', userId: 'user1' },
      { title: '3x3 Basketbol Chempioni', description: 'TUIT 3v3 Basketbol turniri g‘olibi', icon: 'trophy', date: '2026-10-02', rarity: 'legendary', userId: 'demo_user1' },
      { title: 'Registon Marafoni G‘olibi', description: 'Samarqand marafonida 1-o‘rin', icon: 'timer', date: '2026-10-05', rarity: 'legendary', userId: 'user18' },
    ]
  })

  // Jamoalar (Teams)
  const team1 = await prisma.team.create({
    data: {
      name: 'TATU Lions',
      slug: 'tatu-lions',
      sport: 'Football',
      category: 'sports',
      description: 'TATU rasmiy talabalar futbol jamoasi.',
      ownerId: 'user1',
    }
  })
  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: 'user1', role: 'OWNER' },
      { teamId: team1.id, userId: 'user20', role: 'MEMBER' },
      { teamId: team1.id, userId: 'user23', role: 'MEMBER' },
    ]
  })
  const team1Channel = await prisma.channel.create({
    data: {
      type: 'TEAM',
      title: team1.name,
      handle: `team-${team1.slug}`,
      description: team1.description,
      avatar: '/placeholder-user.jpg',
      teamId: team1.id,
    }
  })
  await prisma.channelMember.createMany({
    data: [
      { channelId: team1Channel.id, userId: 'user1', role: 'OWNER' },
      { channelId: team1Channel.id, userId: 'user20', role: 'SUBSCRIBER' },
      { channelId: team1Channel.id, userId: 'user23', role: 'SUBSCRIBER' },
    ]
  })

  const team2 = await prisma.team.create({
    data: {
      name: 'WIUT Wolves',
      slug: 'wiut-wolves',
      sport: 'Basketball',
      category: 'sports',
      description: 'Vestminster universiteti basketbol klubi.',
      ownerId: 'user11',
    }
  })
  await prisma.teamMember.createMany({
    data: [
      { teamId: team2.id, userId: 'user11', role: 'OWNER' },
      { teamId: team2.id, userId: 'user21', role: 'MEMBER' },
    ]
  })
  const team2Channel = await prisma.channel.create({
    data: {
      type: 'TEAM',
      title: team2.name,
      handle: `team-${team2.slug}`,
      description: team2.description,
      avatar: '/placeholder-user.jpg',
      teamId: team2.id,
    }
  })
  await prisma.channelMember.createMany({
    data: [
      { channelId: team2Channel.id, userId: 'user11', role: 'OWNER' },
      { channelId: team2Channel.id, userId: 'user21', role: 'SUBSCRIBER' },
    ]
  })

  // Saqlangan turnirlar
  await prisma.savedTournament.createMany({
    data: [
      { userId: 'user1', tournamentId: '1' },
      { userId: 'user1', tournamentId: '2' },
      { userId: 'user1', tournamentId: '4' },
    ]
  })

  // Kanal postlari (E'lonlar)
  const channels = await prisma.channel.findMany()
  for (const c of channels) {
    if (c.type === 'ORGANIZATION') {
      await prisma.channelPost.create({
        data: {
          channelId: c.id,
          authorId: c.organizationId ? (await prisma.organization.findUnique({ where: { id: c.organizationId } })).ownerId : 'admin1',
          content: `${c.title} rasmiy kanaliga xush kelibsiz! Barcha yangi turnirlar va hisobotlar shu yerda e’lon qilinadi.`,
          pinned: true,
        }
      })
    } else if (c.type === 'TOURNAMENT') {
      const tourney = await prisma.tournament.findUnique({ where: { id: c.tournamentId } })
      await prisma.channelPost.create({
        data: {
          channelId: c.id,
          authorId: tourney.organizerId,
          content: `${tourney.title} bahslari rasmiy e’loni: musobaqa tafsilotlari platformada e’lon qilindi.`,
          pinned: true,
        }
      })
    }
  }

  // Pending arizalar
  await prisma.organizationApplication.createMany({
    data: [
      {
        orgName: 'Buxoro Davlat Universiteti Sport Klubi',
        contactName: 'Ulug‘bek Nazarov',
        email: 'sports@buxdu.uz',
        phone: '+998 90 123 45 67',
        location: 'Buxoro, O‘zbekiston',
        description: 'Buxoro viloyatidagi talabalar o‘rtasida musobaqalar o‘tkazamiz.',
        status: 'PENDING',
      },
      {
        orgName: 'Namangan Esports Ligasi',
        contactName: 'Aziz Tursunov',
        email: 'hello@namanganesports.uz',
        phone: '+998 91 777 11 22',
        location: 'Namangan, O‘zbekiston',
        description: 'Vodiy bo‘ylab kompyuter o‘yinlari chempionatlari tashkilotchisi.',
        status: 'PENDING',
      }
    ]
  })

  console.log('Muvaffaqiyatli yakunlandi! 3 ta turnir tugatildi, qolganlari ro‘yxatdan o‘tish uchun ochiq.')
}

main()
  .catch((e) => {
    console.error('Seeding xatoligi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
