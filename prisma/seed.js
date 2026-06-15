const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Clear database...')
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.savedTournament.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.match.deleteMany()
  await prisma.sportRank.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creating users (Uzbek participants)...')

  const users = [
    {
      id: 'user1',
      name: 'Abbos Qurbonov',
      username: 'abbosq',
      avatar: '/avatars/alex.jpg',
      bio: 'Competitive gamer and table tennis champion. TUIT computer science student pursuing my passion for sports and esports.',
      university: 'Tashkent University of Information Technologies',
      location: 'Tashkent, Uzbekistan',
      globalRank: 42,
      totalPoints: 8750,
      joinedDate: '2024-06-15'
    },
    {
      id: 'user10',
      name: 'Nigora Rustamova',
      username: 'nigorar',
      avatar: '/avatars/sarah.jpg',
      bio: 'Chess Candidate Master and competitive Valorant player. National chess tournament winner.',
      university: 'Tashkent State University of Economics',
      location: 'Samarkand, Uzbekistan',
      globalRank: 1,
      totalPoints: 15200,
      joinedDate: '2023-09-01'
    },
    {
      id: 'user11',
      name: 'Sardor Rahimov',
      username: 'sardorr',
      avatar: '/avatars/marcus.jpg',
      bio: 'WIUT basketball team point guard. Intramural league MVP and streamer on the side.',
      university: 'Westminster International University in Tashkent',
      location: 'Tashkent, Uzbekistan',
      globalRank: 2,
      totalPoints: 14100,
      joinedDate: '2024-02-15'
    },
    {
      id: 'user12',
      name: 'Madina Abdullayeva',
      username: 'madinaa',
      avatar: '/avatars/emma.jpg',
      bio: 'National table tennis record holder. Sports analytics student building training apps.',
      university: 'National University of Uzbekistan',
      location: 'Tashkent, Uzbekistan',
      globalRank: 3,
      totalPoints: 13600,
      joinedDate: '2024-05-10'
    },
    {
      id: 'user13',
      name: 'Dilshod Karimov',
      username: 'dilshodk',
      avatar: '/avatars/james.jpg',
      bio: 'Inha CS major, Valorant Radiant tier player. Fighting game community veteran.',
      university: 'Inha University in Tashkent',
      location: 'Tashkent, Uzbekistan',
      globalRank: 4,
      totalPoints: 12900,
      joinedDate: '2023-11-20'
    },
    {
      id: 'user14',
      name: 'Shahzodbek Olimov',
      username: 'shahzodo',
      avatar: '/avatars/olivia.jpg',
      bio: 'Competitive swimmer, academic quizbowl captain, and fitness enthusiast.',
      university: 'Tashkent State Technical University',
      location: 'Fergana, Uzbekistan',
      globalRank: 5,
      totalPoints: 12400,
      joinedDate: '2024-08-01'
    },
    {
      id: 'user15',
      name: 'Jasur Aliyev',
      username: 'jasura',
      avatar: '/avatars/david.jpg',
      bio: 'Amity student, Rocket League Grand Champion. Mobile gaming coordinator.',
      university: 'Amity University in Tashkent',
      location: 'Tashkent, Uzbekistan',
      globalRank: 6,
      totalPoints: 11800,
      joinedDate: '2024-10-12'
    }
  ]

  for (const u of users) {
    await prisma.user.create({ data: u })
  }

  console.log('Creating organizers...')

  const organizers = [
    { id: 'org1', name: 'Tashkent Sports Association', username: 'tashkent_sports', avatar: '/avatars/stanford.jpg', bio: 'Official Tashkent Intramural Athletics Association. Hosting competitive sports events since 2018.', location: 'Tashkent, Uzbekistan', globalRank: 0, totalPoints: 0, joinedDate: '2022-01-01' },
    { id: 'org2', name: 'Uzbekistan Esports Federation', username: 'uz_esports', avatar: '/avatars/esports-arena.jpg', bio: 'National governing body for esports in Uzbekistan. Hosting official tournaments.', location: 'Online', globalRank: 0, totalPoints: 0, joinedDate: '2023-01-01' },
    { id: 'org3', name: 'Uzbek Chess Federation', username: 'uzchess', avatar: '/avatars/us-chess.jpg', bio: 'The national governing body for chess in Uzbekistan. Promoting rated tournaments.', location: 'Tashkent, Uzbekistan', globalRank: 0, totalPoints: 0, joinedDate: '2021-01-01' },
    { id: 'org4', name: 'TUIT Athletics Club', username: 'tuit_athletics', avatar: '/avatars/ucla.jpg', bio: 'Student-run sports association at TUIT. Organizing intramural events for students.', location: 'Tashkent, Uzbekistan', globalRank: 0, totalPoints: 0, joinedDate: '2024-01-01' },
    { id: 'org5', name: 'Riot Games Tashkent Community', username: 'riot_tashkent', avatar: '/avatars/riot.jpg', bio: 'Official community program for Valorant & League of Legends players in Uzbekistan.', location: 'Online', globalRank: 0, totalPoints: 0, joinedDate: '2023-06-01' },
    { id: 'org6', name: 'Uzbekistan Swim Union', username: 'uz_swim', avatar: '/avatars/psl.jpg', bio: 'National swimming federation sanctioning competitive aquatic meets.', location: 'Tashkent, Uzbekistan', globalRank: 0, totalPoints: 0, joinedDate: '2023-09-01' },
    { id: 'org7', name: 'Tashkent Rocket League Community', username: 'tashkent_rl', avatar: '/avatars/psyonix.jpg', bio: 'Community operations for Rocket League car soccer players in Uzbekistan.', location: 'Online', globalRank: 0, totalPoints: 0, joinedDate: '2024-01-01' },
    { id: 'org8', name: 'Samarkand Runners Club', username: 'sam_runners', avatar: '/avatars/sf-run.jpg', bio: 'Samarkand\'s largest running community. Hosting local marathons and runs.', location: 'Samarkand, Uzbekistan', globalRank: 0, totalPoints: 0, joinedDate: '2023-02-15' },
  ]

  for (const o of organizers) {
    await prisma.user.create({ data: o })
  }

  console.log('Creating achievements...')

  await prisma.achievement.createMany({
    data: [
      { title: 'Tournament Champion', description: 'Won first place in a major tournament', icon: 'trophy', date: '2026-02-15', rarity: 'legendary', userId: 'user1' },
      { title: 'Rising Star', description: 'Reached top 50 global ranking', icon: 'star', date: '2026-01-20', rarity: 'epic', userId: 'user1' },
      { title: 'Consistent Competitor', description: 'Participated in 10+ tournaments', icon: 'medal', date: '2025-12-01', rarity: 'rare', userId: 'user1' },
      { title: 'Team Player', description: 'Won a team tournament with 4+ members', icon: 'users', date: '2025-11-15', rarity: 'rare', userId: 'user1' },
      { title: 'Sharp Shooter', description: 'Achieved 80%+ accuracy in an FPS tournament', icon: 'target', date: '2026-03-01', rarity: 'epic', userId: 'user1' },
      { title: 'Grandmaster', description: 'Achieved Chess FIDE rating of 2400+', icon: 'crown', date: '2025-09-15', rarity: 'legendary', userId: 'user10' },
      { title: '#1 Leaderboard', description: 'Reached the top of the global leaderboard', icon: 'trophy', date: '2026-04-01', rarity: 'legendary', userId: 'user10' },
      { title: 'Unbeatable Streak', description: 'Won 15 consecutive matches', icon: 'zap', date: '2026-02-20', rarity: 'epic', userId: 'user10' },
      { title: 'Double Threat', description: 'Top 10 in both sports and esports', icon: 'swords', date: '2026-03-10', rarity: 'legendary', userId: 'user11' },
      { title: 'MVP Award', description: 'Named Most Valuable Player in a tournament', icon: 'star', date: '2026-01-15', rarity: 'epic', userId: 'user11' },
      { title: 'Speed Demon', description: 'Set a new personal best in running event', icon: 'timer', date: '2026-02-28', rarity: 'rare', userId: 'user12' },
      { title: 'Iron Will', description: 'Completed 5 marathons in one year', icon: 'flame', date: '2025-12-20', rarity: 'epic', userId: 'user12' },
      { title: 'Perfect Game', description: 'Won a match without losing a single point', icon: 'check-circle', date: '2025-11-30', rarity: 'legendary', userId: 'user13' },
      { title: 'Rookie of the Year', description: 'Outstanding performance in first season', icon: 'award', date: '2026-01-05', rarity: 'rare', userId: 'user14' },
      { title: 'Community Leader', description: 'Organized 5+ successful community events', icon: 'heart', date: '2026-03-05', rarity: 'rare', userId: 'user15' },
    ]
  })

  console.log('Creating sport ranks...')

  await prisma.sportRank.createMany({
    data: [
      { sport: 'Valorant', rank: 23, points: 3200, tier: 'diamond', userId: 'user1' },
      { sport: 'Basketball', rank: 45, points: 2800, tier: 'platinum', userId: 'user1' },
      { sport: 'Chess', rank: 120, points: 1650, tier: 'gold', userId: 'user1' },
      { sport: 'Table Tennis', rank: 4, points: 4200, tier: 'diamond', userId: 'user1' },
      { sport: 'Chess', rank: 1, points: 6500, tier: 'champion', userId: 'user10' },
      { sport: 'Valorant', rank: 12, points: 4800, tier: 'champion', userId: 'user10' },
      { sport: 'Basketball', rank: 1, points: 7200, tier: 'champion', userId: 'user11' },
      { sport: 'Valorant', rank: 35, points: 2900, tier: 'diamond', userId: 'user11' },
      { sport: 'Table Tennis', rank: 2, points: 6100, tier: 'champion', userId: 'user12' },
      { sport: 'Swimming', rank: 15, points: 3400, tier: 'platinum', userId: 'user12' },
      { sport: 'Valorant', rank: 5, points: 5500, tier: 'champion', userId: 'user13' },
      { sport: 'Swimming', rank: 3, points: 5800, tier: 'champion', userId: 'user14' },
      { sport: 'Rocket League', rank: 2, points: 6200, tier: 'champion', userId: 'user15' },
    ]
  })

  console.log('Creating match history...')

  await prisma.match.createMany({
    data: [
      { tournamentId: '5', tournamentName: 'Valorant Uzbekistan Cup', sport: 'Valorant', opponent: 'Team Phoenix', result: 'win', score: '13-9', date: '2026-03-20', userId: 'user1' },
      { tournamentId: '4', tournamentName: 'TUIT Basketball 3v3 Arena', sport: 'Basketball', opponent: 'WIUT Wolves', result: 'win', score: '21-18', date: '2026-03-15', userId: 'user1' },
      { tournamentId: '3', tournamentName: 'Uzbekistan National Chess Championship', sport: 'Chess', opponent: 'Dilshod Karimov', result: 'loss', score: '0-1', date: '2026-03-10', userId: 'user1' },
      { tournamentId: '2', tournamentName: 'PUBG Mobile Tashkent Masters', sport: 'PUBG Mobile', opponent: 'Squad Alpha', result: 'win', score: '#2 finish', date: '2026-03-05', userId: 'user1' },
      { tournamentId: '1', tournamentName: 'Tashkent Inter-University Football Cup', sport: 'Football', opponent: 'WIUT Wolves', result: 'win', score: '3-1', date: '2026-04-16', userId: 'user1' },
      { tournamentId: '3', tournamentName: 'Uzbekistan National Chess Championship', sport: 'Chess', opponent: 'Dilshod Karimov', result: 'win', score: '1-0', date: '2026-05-02', userId: 'user10' },
      { tournamentId: '3', tournamentName: 'Uzbekistan National Chess Championship', sport: 'Chess', opponent: 'Abbos Qurbonov', result: 'win', score: '1-0', date: '2026-05-03', userId: 'user10' },
      { tournamentId: '4', tournamentName: 'TUIT Basketball 3v3 Arena', sport: 'Basketball', opponent: 'TUIT Lions', result: 'win', score: '21-14', date: '2026-04-08', userId: 'user11' },
      { tournamentId: '1', tournamentName: 'Tashkent Inter-University Football Cup', sport: 'Football', opponent: 'TUIT Lions', result: 'loss', score: '1-3', date: '2026-04-16', userId: 'user11' },
      { tournamentId: '8', tournamentName: 'Samarkand Marathon 2026', sport: 'Running', opponent: 'Field of 1000', result: 'win', score: '2:48:15', date: '2026-05-10', userId: 'user12' },
      { tournamentId: '6', tournamentName: 'Tashkent Swimming Championship', sport: 'Swimming', opponent: '100m Freestyle field', result: 'win', score: '52.3s', date: '2026-04-25', userId: 'user14' },
    ]
  })

  console.log('Creating tournaments...')

  const tournaments = [
    {
      id: '1',
      title: 'Tashkent Inter-University Football Cup 2026',
      sport: 'Football',
      category: 'sports',
      location: 'Tashkent Pakhtakor Stadium',
      date: '2026-04-15',
      endDate: '2026-04-20',
      time: '10:00 AM',
      maxParticipants: 16,
      posterUrl: '/tournaments/football-championship.jpg',
      organizerId: 'org1',
      description: 'The premier university football cup in Tashkent. Teams from top universities compete for glory and a prize pool of 50,000,000 UZS. Broadcasted live on Sport TV.',
      rulesJson: JSON.stringify(['Standard FIFA rules apply', '11 players per team', '90-minute matches', 'Ref decisions are final', 'Yellow card resets after group stage']),
      requirementsJson: JSON.stringify(['Must be a registered university student', 'Valid student ID card required', 'Team registration with minimum 15 players', 'Medical certificate']),
      prizePool: '50M UZS',
      entryFee: '500,000 UZS',
      status: 'registration_open',
      featured: true
    },
    {
      id: '2',
      title: 'PUBG Mobile Tashkent Masters',
      sport: 'PUBG Mobile',
      category: 'esports',
      location: 'Online',
      date: '2026-04-10',
      endDate: '2026-04-12',
      time: '6:00 PM',
      maxParticipants: 64,
      posterUrl: '/tournaments/pubg-masters.jpg',
      organizerId: 'org2',
      description: 'Battle royale in Uzbekistan. 64 squad teams battle for the master tier cup. Streamed live on YouTube and Twitch with professional casting.',
      rulesJson: JSON.stringify(['Squad mode (4 players)', 'Erangel, Miramar, and Sanhok maps', 'Anti-cheat software is required', 'No third-party emulators']),
      requirementsJson: JSON.stringify(['Account level 40+', 'Must join official discord', 'Must use mobile device', 'Uzbekistan region accounts only']),
      prizePool: '15M UZS',
      entryFee: 'Free',
      status: 'registration_open',
      featured: true
    },
    {
      id: '3',
      title: 'Uzbekistan National Chess Championship',
      sport: 'Chess',
      category: 'academic',
      location: 'Tashkent International Chess Academy',
      date: '2026-05-01',
      endDate: '2026-05-05',
      time: '9:00 AM',
      maxParticipants: 100,
      posterUrl: '/tournaments/chess-championship.jpg',
      organizerId: 'org3',
      description: 'The highest chess tournament in the republic. FIDE-rated event featuring grandmasters and junior talents, broadcasted with analysis.',
      rulesJson: JSON.stringify(['FIDE rules apply', 'Time control: 90 min + 30 sec increment', 'Strict anti-cheat check', 'Touch-move rule strictly enforced']),
      requirementsJson: JSON.stringify(['National rating 1800+ or chess category', 'Uzbek Chess Federation membership card', 'Valid government-issued ID']),
      prizePool: '30M UZS',
      entryFee: '100,000 UZS',
      status: 'upcoming',
      featured: true
    },
    {
      id: '4',
      title: 'TUIT Basketball 3v3 Arena',
      sport: 'Basketball',
      category: 'sports',
      location: 'TUIT Indoor Sports Arena',
      date: '2026-04-08',
      time: '2:00 PM',
      maxParticipants: 16,
      posterUrl: '/tournaments/basketball-3v3.jpg',
      organizerId: 'org4',
      description: 'Fast 3x3 basketball action in the heart of TUIT campus. Open to student clubs and sports societies. DJ and food court on site.',
      rulesJson: JSON.stringify(['FIBA 3x3 official rules', '10-minute game or first to 21 points', 'Single elimination bracket', '1 timeout per team']),
      requirementsJson: JSON.stringify(['Valid student ID', 'Team of 3-4 players', 'Athletic uniform and indoor shoes']),
      prizePool: '5M UZS',
      entryFee: '50,000 UZS',
      status: 'registration_open',
      featured: false
    },
    {
      id: '5',
      title: 'Valorant Uzbekistan Cup',
      sport: 'Valorant',
      category: 'esports',
      location: 'Online',
      date: '2026-04-18',
      endDate: '2026-04-19',
      time: '5:00 PM',
      maxParticipants: 32,
      posterUrl: '/tournaments/valorant-cup.jpg',
      organizerId: 'org5',
      description: 'Fight for tactical supremacy in this community Valorant cup. Streamed with live casters and analysis from local esports veterans.',
      rulesJson: JSON.stringify(['VCT Competitive settings', '5 players per team + 1 sub', 'Map veto pick/ban system', 'Vanguard anti-cheat active']),
      requirementsJson: JSON.stringify(['Rank Diamond 1+ required', 'Discord is required', 'UZ ping below 60 ms', 'Age 16+']),
      prizePool: '10M UZS',
      entryFee: 'Free',
      status: 'registration_open',
      featured: false
    },
    {
      id: '6',
      title: 'Tashkent Swimming Championship',
      sport: 'Swimming',
      category: 'sports',
      location: 'Tashkent Aquatic Palace',
      date: '2026-04-25',
      time: '8:00 AM',
      maxParticipants: 80,
      posterUrl: '/tournaments/swimming-meet.jpg',
      organizerId: 'org6',
      description: 'Multi-event sanctioned swim competition featuring freestyle, breaststroke, backstroke, and individual medley. Timekeeping by Omega.',
      rulesJson: JSON.stringify(['FINA competition rules apply', 'Maximum 3 individual events per swimmer', 'Swimwear must comply with FINA regulations']),
      requirementsJson: JSON.stringify(['Active Swim Union license', 'Medical clearance document', 'Certified qualifying time']),
      prizePool: '12M UZS',
      entryFee: '80,000 UZS',
      status: 'upcoming',
      featured: false
    },
    {
      id: '7',
      title: 'Rocket League Tashkent Showdown',
      sport: 'Rocket League',
      category: 'esports',
      location: 'Online',
      date: '2026-04-05',
      time: '7:00 PM',
      maxParticipants: 16,
      posterUrl: '/tournaments/rocket-league.jpg',
      organizerId: 'org7',
      description: 'High-flying Rocket League 3v3 action. Compete for the community cup and points. Livestreamed on local Twitch channels.',
      rulesJson: JSON.stringify(['Standard 3v3 settings', '5-minute match time', 'Best of 5 in playoff stage']),
      requirementsJson: JSON.stringify(['Rank Champion I+ in 3v3', 'Team of 3 players', 'Stable connection to Middle East or EU servers']),
      prizePool: '4M UZS',
      entryFee: 'Free',
      status: 'registration_open',
      featured: false
    },
    {
      id: '8',
      title: 'Samarkand Marathon 2026',
      sport: 'Running',
      category: 'sports',
      location: 'Samarkand Registan Square',
      date: '2026-05-10',
      time: '6:00 AM',
      maxParticipants: 1000,
      posterUrl: '/tournaments/marathon.jpg',
      organizerId: 'org8',
      description: 'The historic Samarkand Marathon. Choose 10K, half-marathon, or full marathon course passing through magnificent historical sights.',
      rulesJson: JSON.stringify(['USATF guidelines apply', 'Bib must be visible on the chest', 'Drink stations every 3 km', 'Time limit of 6 hours for full marathon']),
      requirementsJson: JSON.stringify(['Medical insurance and clearance', '18 years of age or older', 'Completed race registration online']),
      prizePool: '20M UZS',
      entryFee: '150,000 UZS',
      status: 'registration_open',
      featured: true
    }
  ]

  for (const t of tournaments) {
    await prisma.tournament.create({ data: t })
  }

  console.log('Creating participants...')

  const participants = [
    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-03-20T14:30:00', status: 'approved', teamName: 'TUIT Lions', paymentStatus: 'paid', tournamentId: '1', userId: 'user1' },
    { name: 'Sardor Rahimov', email: 'sardor.r@wiut.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-03-21T09:15:00', status: 'approved', teamName: 'WIUT Wolves', paymentStatus: 'paid', tournamentId: '1', userId: 'user11' },
    { name: 'Madina Abdullayeva', email: 'madina.a@nuu.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-03-22T16:45:00', status: 'pending', teamName: 'NUU Eagles', paymentStatus: 'pending', tournamentId: '1', userId: 'user12' },
    { name: 'Dilshod Karimov', email: 'dilshod.k@inha.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-03-22T18:00:00', status: 'approved', teamName: 'Inha Falcons', paymentStatus: 'paid', tournamentId: '1', userId: 'user13' },
    { name: 'Shahzodbek Olimov', email: 'shahzod.o@tstu.uz', avatar: '/avatars/olivia.jpg', registeredAt: '2026-03-23T10:30:00', status: 'rejected', teamName: 'TSTU Giants', paymentStatus: 'pending', tournamentId: '1', userId: 'user14' },
    { name: 'Jasur Aliyev', email: 'jasur.a@amity.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-03-24T08:45:00', status: 'approved', teamName: 'Amity Stars', paymentStatus: 'paid', tournamentId: '1', userId: 'user15' },
    { name: 'Nigora Rustamova', email: 'nigora.r@tsue.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-03-25T11:20:00', status: 'pending', teamName: 'TSUE Kings', paymentStatus: 'paid', tournamentId: '1', userId: 'user10' },

    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-03-18T19:30:00', status: 'approved', teamName: 'TUIT Snipers', paymentStatus: 'paid', tournamentId: '2', userId: 'user1' },
    { name: 'Dilshod Karimov', email: 'dilshod.k@inha.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-03-19T21:00:00', status: 'approved', teamName: 'Inha Predators', paymentStatus: 'paid', tournamentId: '2', userId: 'user13' },
    { name: 'Jasur Aliyev', email: 'jasur.a@amity.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-03-20T15:45:00', status: 'approved', teamName: 'Amity Squad', paymentStatus: 'paid', tournamentId: '2', userId: 'user15' },

    { name: 'Nigora Rustamova', email: 'nigora.r@tsue.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-04-01T10:00:00', status: 'approved', paymentStatus: 'paid', tournamentId: '3', userId: 'user10' },
    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-04-03T09:15:00', status: 'approved', paymentStatus: 'paid', tournamentId: '3', userId: 'user1' },
    { name: 'Madina Abdullayeva', email: 'madina.a@nuu.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-04-04T16:00:00', status: 'pending', paymentStatus: 'pending', tournamentId: '3', userId: 'user12' },

    { name: 'Sardor Rahimov', email: 'sardor.r@wiut.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-03-28T14:00:00', status: 'approved', teamName: 'WIUT Ballers', paymentStatus: 'paid', tournamentId: '4', userId: 'user11' },
    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-03-29T10:30:00', status: 'approved', teamName: 'TUIT Shooters', paymentStatus: 'paid', tournamentId: '4', userId: 'user1' },

    { name: 'Dilshod Karimov', email: 'dilshod.k@inha.uz', avatar: '/avatars/james.jpg', registeredAt: '2026-04-05T18:00:00', status: 'approved', teamName: 'Inha Sentinels', paymentStatus: 'paid', tournamentId: '5', userId: 'user13' },
    { name: 'Nigora Rustamova', email: 'nigora.r@tsue.uz', avatar: '/avatars/sarah.jpg', registeredAt: '2026-04-06T19:30:00', status: 'approved', teamName: 'TSUE Duelists', paymentStatus: 'paid', tournamentId: '5', userId: 'user10' },
    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-04-07T20:00:00', status: 'approved', teamName: 'TUIT Clutchers', paymentStatus: 'paid', tournamentId: '5', userId: 'user1' },
    { name: 'Jasur Aliyev', email: 'jasur.a@amity.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-04-07T21:15:00', status: 'approved', teamName: 'Amity Valor', paymentStatus: 'paid', tournamentId: '5', userId: 'user15' },

    { name: 'Shahzodbek Olimov', email: 'shahzod.o@tstu.uz', avatar: '/avatars/olivia.jpg', registeredAt: '2026-04-10T08:30:00', status: 'approved', paymentStatus: 'paid', tournamentId: '6', userId: 'user14' },
    { name: 'Madina Abdullayeva', email: 'madina.a@nuu.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-04-12T11:15:00', status: 'pending', paymentStatus: 'pending', tournamentId: '6', userId: 'user12' },

    { name: 'Jasur Aliyev', email: 'jasur.a@amity.uz', avatar: '/avatars/david.jpg', registeredAt: '2026-03-25T19:00:00', status: 'approved', teamName: 'Amity Rocketeers', paymentStatus: 'paid', tournamentId: '7', userId: 'user15' },
    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-03-27T18:45:00', status: 'pending', teamName: 'TUIT Drivers', paymentStatus: 'paid', tournamentId: '7', userId: 'user1' },

    { name: 'Sardor Rahimov', email: 'sardor.r@wiut.uz', avatar: '/avatars/marcus.jpg', registeredAt: '2026-04-15T06:00:00', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user11' },
    { name: 'Madina Abdullayeva', email: 'madina.a@nuu.uz', avatar: '/avatars/emma.jpg', registeredAt: '2026-04-15T07:30:00', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user12' },
    { name: 'Abbos Qurbonov', email: 'abbos.q@tuit.uz', avatar: '/avatars/alex.jpg', registeredAt: '2026-04-18T08:00:00', status: 'approved', paymentStatus: 'paid', tournamentId: '8', userId: 'user1' },
  ]

  for (const p of participants) {
    await prisma.participant.create({ data: p })
  }

  console.log('Creating saved tournaments...')

  await prisma.savedTournament.createMany({
    data: [
      { userId: 'user1', tournamentId: '3' },
      { userId: 'user1', tournamentId: '6' },
      { userId: 'user1', tournamentId: '7' },
    ]
  })

  console.log('Creating conversations and messages...')

  await prisma.conversation.create({
    data: {
      id: 'conv1',
      lastMessage: 'Sizning jamoangiz chempionatga tasdiqlandi! Barcha o\'yinchilar 10-aprelga qadar tekshiruvdan o\'tganligiga ishonch hosil qiling.',
      lastMessageTime: '2026-03-24T10:30:00',
      unreadCount: 1,
      tournamentContextId: '1',
      tournamentContextName: 'Tashkent Inter-University Football Cup 2026'
    }
  })
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: 'conv1', userId: 'user1' },
      { conversationId: 'conv1', userId: 'org1' }
    ]
  })
  await prisma.message.createMany({
    data: [
      { conversationId: 'conv1', senderId: 'org1', senderName: 'Tashkent Sports Association', senderAvatar: '/avatars/stanford.jpg', content: 'Salom Abbos! Biz sizning Tashkent Inter-University Football Cup turniriga bergan arizangizni ko\'rib chiqdik.', timestamp: '2026-03-24T10:25:00', read: true },
      { conversationId: 'conv1', senderId: 'org1', senderName: 'Tashkent Sports Association', senderAvatar: '/avatars/stanford.jpg', content: 'Sizning jamoangiz chempionatga tasdiqlandi! Barcha o\'yinchilar 10-aprelga qadar tekshiruvdan o\'tganligiga ishonch hosil qiling.', timestamp: '2026-03-24T10:30:00', read: false },
      { conversationId: 'conv1', senderId: 'user1', senderName: 'Abbos Qurbonov', senderAvatar: '/avatars/alex.jpg', content: 'Ajoyib yangilik! Katta rahmat. Hamma o\'yinchilarni o\'z vaqtida ro\'yxatdan o\'tkazamiz. Kutib qolamiz!', timestamp: '2026-03-24T10:35:00', read: true },
      { conversationId: 'conv1', senderId: 'org1', senderName: 'Tashkent Sports Association', senderAvatar: '/avatars/stanford.jpg', content: 'Juda yaxshi! O\'yinlar jadvali: Guruh bosqichi 15-16 aprel, chorak final 17 aprel, yarim final 18 aprel va final 20 aprel kunlari bo\'ladi. Omad! 🏆', timestamp: '2026-03-24T10:40:00', read: false },
    ]
  })

  await prisma.conversation.create({
    data: {
      id: 'conv2',
      lastMessage: 'Men ham ro\'yxatdan o\'tdim! Bugun soat 20:00 da mashg\'ulot o\'tkazamiz, men xona ochib qo\'yaman.',
      lastMessageTime: '2026-03-23T18:55:00',
      unreadCount: 2,
    }
  })
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: 'conv2', userId: 'user1' },
      { conversationId: 'conv2', userId: 'user11' }
    ]
  })
  await prisma.message.createMany({
    data: [
      { conversationId: 'conv2', senderId: 'user11', senderName: 'Sardor Rahimov', senderAvatar: '/avatars/marcus.jpg', content: 'Hey Abbos! Valorant turniri uchun jamoa bo\'lamizmi? Bizga yaxshi Duelist kerak edi.', timestamp: '2026-03-23T18:30:00', read: true },
      { conversationId: 'conv2', senderId: 'user1', senderName: 'Abbos Qurbonov', senderAvatar: '/avatars/alex.jpg', content: 'Albatta! Men oxirgi paytlarda ko\'p o\'ynab Diamond 2 ga chiqdim. Jamoada yana kimlar bor?', timestamp: '2026-03-23T18:40:00', read: true },
      { conversationId: 'conv2', senderId: 'user11', senderName: 'Sardor Rahimov', senderAvatar: '/avatars/marcus.jpg', content: 'Yaxshi! NYUdan David Sentinel, Inhadan Dilshodni ise Controller sifatida taklif qilmoqchiman. Bizga yana Initiator kerak.', timestamp: '2026-03-23T18:45:00', read: false },
      { conversationId: 'conv2', senderId: 'user11', senderName: 'Sardor Rahimov', senderAvatar: '/avatars/marcus.jpg', content: 'Men ham ro\'yxatdan o\'tdim! Bugun soat 20:00 da mashg\'ulot o\'tkazamiz, men xona ochib qo\'yaman.', timestamp: '2026-03-23T18:55:00', read: false },
    ]
  })

  await prisma.conversation.create({
    data: {
      id: 'conv3',
      lastMessage: 'Eslatma: O\'yiningiz 2 soatdan keyin boshlanadi. Iltimos, turnir Discord serverida tasdiqlang.',
      lastMessageTime: '2026-03-22T14:00:00',
      unreadCount: 0,
      tournamentContextId: '5',
      tournamentContextName: 'Valorant Uzbekistan Cup'
    }
  })
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: 'conv3', userId: 'user1' },
      { conversationId: 'conv3', userId: 'org5' }
    ]
  })
  await prisma.message.createMany({
    data: [
      { conversationId: 'conv3', senderId: 'org5', senderName: 'Riot Games Tashkent Community', senderAvatar: '/avatars/riot.jpg', content: 'Valorant Uzbekistan Cup turniriga xush kelibsiz! Jamoangiz B guruhiga joylashtirildi. Birinchi o\'yin 22-mart kuni soat 17:00 da boshlanadi.', timestamp: '2026-03-20T10:00:00', read: true },
      { conversationId: 'conv3', senderId: 'user1', senderName: 'Abbos Qurbonov', senderAvatar: '/avatars/alex.jpg', content: 'Rahmat! Biz tayyormiz. Ro\'yxatdan o\'tish qayerda bo\'ladi?', timestamp: '2026-03-20T10:15:00', read: true },
      { conversationId: 'conv3', senderId: 'org5', senderName: 'Riot Games Tashkent Community', senderAvatar: '/avatars/riot.jpg', content: 'O\'yindan 30 daqiqa oldin Discord serverida tasdiqlashingiz kerak. Havola tasdiqlash xatida yuborilgan. Omad!', timestamp: '2026-03-20T10:20:00', read: true },
      { conversationId: 'conv3', senderId: 'org5', senderName: 'Riot Games Tashkent Community', senderAvatar: '/avatars/riot.jpg', content: 'Eslatma: O\'yiningiz 2 soatdan keyin boshlanadi. Iltimos, turnir Discord serverida tasdiqlang.', timestamp: '2026-03-22T14:00:00', read: true },
    ]
  })

  await prisma.conversation.create({
    data: {
      id: 'conv4',
      lastMessage: 'GG! Ascent xaritasidagi o\'yin dahshat bo\'ldi. Ertaga ranked o\'ynaymizmi? 🎮',
      lastMessageTime: '2026-03-21T20:30:00',
      unreadCount: 0,
    }
  })
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: 'conv4', userId: 'user1' },
      { conversationId: 'conv4', userId: 'user12' }
    ]
  })
  await prisma.message.createMany({
    data: [
      { conversationId: 'conv4', senderId: 'user12', senderName: 'Madina Abdullayeva', senderAvatar: '/avatars/emma.jpg', content: 'Salom Abbos, ajoyib o\'yin bo\'ldi! Jamoangiz stol tennisi turnirida juda yaxshi o\'ynadi.', timestamp: '2026-03-21T20:10:00', read: true },
      { conversationId: 'conv4', senderId: 'user1', senderName: 'Abbos Qurbonov', senderAvatar: '/avatars/alex.jpg', content: 'Rahmat Madina! Siz ham oxirgi zarbani zo\'r amalga oshirdingiz. Siz ham Valorant turnirida ishtirok etasizmi?', timestamp: '2026-03-21T20:20:00', read: true },
      { conversationId: 'conv4', senderId: 'user12', senderName: 'Madina Abdullayeva', senderAvatar: '/avatars/emma.jpg', content: 'GG! Ascent xaritasidagi o\'yin dahshat bo\'ldi. Ertaga ranked o\'ynaymizmi? 🎮', timestamp: '2026-03-21T20:30:00', read: true },
    ]
  })

  await prisma.conversation.create({
    data: {
      id: 'conv5',
      lastMessage: 'Ro\'yxatdan o\'tish tasdiqlandi. FIDE ID raqamingiz tekshirildi. Toshkentda ko\'rishguncha! ♟️',
      lastMessageTime: '2026-04-05T09:00:00',
      unreadCount: 1,
      tournamentContextId: '3',
      tournamentContextName: 'Uzbekistan National Chess Championship'
    }
  })
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: 'conv5', userId: 'user1' },
      { conversationId: 'conv5', userId: 'org3' }
    ]
  })
  await prisma.message.createMany({
    data: [
      { conversationId: 'conv5', senderId: 'org3', senderName: 'Uzbek Chess Federation', senderAvatar: '/avatars/us-chess.jpg', content: 'Milliy shaxmat chempionatiga ro\'yxatdan o\'tganingiz uchun rahmat! Hozir reytingingizni tekshiryapmiz.', timestamp: '2026-04-04T14:00:00', read: true },
      { conversationId: 'conv5', senderId: 'org3', senderName: 'Uzbek Chess Federation', senderAvatar: '/avatars/us-chess.jpg', content: 'Ro\'yxatdan o\'tish tasdiqlandi. FIDE ID raqamingiz tekshirildi. Toshkentda ko\'rishguncha! ♟️', timestamp: '2026-04-05T09:00:00', read: false },
    ]
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
