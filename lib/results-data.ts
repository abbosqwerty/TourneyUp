export interface MatchEvent {
  id: string
  minute: string
  type: 'goal' | 'card' | 'kill' | 'round' | 'checkmate' | 'foul' | 'substitution'
  team: 1 | 2
  player: string
  detail: string
}

export interface MatchStats {
  possession?: [number, number] // e.g. [58, 42]
  shotsOnTarget?: [number, number]
  totalShots?: [number, number]
  fouls?: [number, number]
  corners?: [number, number]
  kills?: [number, number] // for esports
  headshots?: [number, number]
  roundWins?: [number, number]
  acesClutches?: [number, number]
}

export interface MatchRosterPlayer {
  id: string
  name: string
  number?: number
  role: string
  rating: number // SofaScore style rating e.g. 7.6
  avatar: string
}

export interface ResultMatch {
  id: string
  tournamentId: string
  tournamentName: string
  tournamentLogo: string
  sport: 'football' | 'valorant' | 'chess' | 'basketball'
  sportLabel: string
  stage: string // e.g. "Grand Finals", "Playoffs - Map 3", "Round 5", "Group Stage"
  status: 'live' | 'finished' | 'upcoming'
  liveTime?: string // e.g. "72'", "Map 2 (11-9)", "Move 38"
  startTime: string
  date: string // "today", "yesterday", "tomorrow"
  team1: {
    id: string
    name: string
    avatar: string
    score: number
    winner?: boolean
    periodScores?: number[] // e.g. [1, 2] or [13, 11]
  }
  team2: {
    id: string
    name: string
    avatar: string
    score: number
    winner?: boolean
    periodScores?: number[]
  }
  organizerName: string
  organizerAvatar: string
  updatedAt: string
  venue: string
  spectators: number
  events: MatchEvent[]
  stats: MatchStats
  team1Roster: MatchRosterPlayer[]
  team2Roster: MatchRosterPlayer[]
}

export const initialResultMatches: ResultMatch[] = [
  // ── LIVE MATCH 1 (FOOTBALL) ──
  {
    id: 'match-fb-live-1',
    tournamentId: 'tourn-football',
    tournamentName: 'Inter-University Football Cup 2026',
    tournamentLogo: '/avatars/stanford.jpg',
    sport: 'football',
    sportLabel: 'Football',
    stage: 'Semifinal • 2nd Leg',
    status: 'live',
    liveTime: "73'",
    startTime: 'Today, 18:00',
    date: 'today',
    venue: 'Milliy Stadium, Tashkent',
    spectators: 3450,
    organizerName: 'Tashkent Sports Association',
    organizerAvatar: '/avatars/stanford.jpg',
    updatedAt: 'Just now',
    team1: {
      id: 't-nuu',
      name: 'National University FC',
      avatar: '/avatars/mit.jpg',
      score: 2,
      periodScores: [1, 1],
    },
    team2: {
      id: 't-wiut',
      name: 'Westminster Lions',
      avatar: '/avatars/cambridge.jpg',
      score: 1,
      periodScores: [0, 1],
    },
    stats: {
      possession: [54, 46],
      shotsOnTarget: [7, 4],
      totalShots: [14, 9],
      corners: [6, 3],
      fouls: [9, 12],
    },
    events: [
      { id: 'ev-1', minute: "18'", type: 'goal', team: 1, player: 'Rustam Aliev', detail: 'Header from corner kick assist' },
      { id: 'ev-2', minute: "34'", type: 'card', team: 2, player: 'Farrukh Saidov', detail: 'Tactical foul near penalty box' },
      { id: 'ev-3', minute: "52'", type: 'goal', team: 1, player: 'Abbos Qurbonov', detail: 'Curling finish bottom left corner' },
      { id: 'ev-4', minute: "68'", type: 'goal', team: 2, player: 'Eldor Shomurod', detail: 'Counter-attack low strike' },
    ],
    team1Roster: [
      { id: 'p1', name: 'Rustam Aliev', number: 9, role: 'Forward', rating: 8.2, avatar: '/avatars/alex.jpg' },
      { id: 'p2', name: 'Abbos Qurbonov', number: 10, role: 'Playmaker', rating: 8.7, avatar: '/avatars/alex.jpg' },
      { id: 'p3', name: 'Sardor Rashidov', number: 7, role: 'Winger', rating: 7.4, avatar: '/avatars/marcus.jpg' },
      { id: 'p4', name: 'Javlon Mirzo', number: 4, role: 'Center Back', rating: 7.1, avatar: '/avatars/david.jpg' },
    ],
    team2Roster: [
      { id: 'p5', name: 'Eldor Shomurod', number: 11, role: 'Striker', rating: 7.9, avatar: '/avatars/sarah.jpg' },
      { id: 'p6', name: 'Farrukh Saidov', number: 6, role: 'Midfield', rating: 6.8, avatar: '/avatars/alex.jpg' },
      { id: 'p7', name: 'Azizjon Ganiev', number: 8, role: 'Midfield', rating: 7.3, avatar: '/avatars/marcus.jpg' },
      { id: 'p8', name: 'Bobur Yuldashev', number: 1, role: 'Goalkeeper', rating: 7.0, avatar: '/avatars/david.jpg' },
    ],
  },

  // ── LIVE MATCH 2 (VALORANT ESPORTS) ──
  {
    id: 'match-val-live-2',
    tournamentId: 'tourn-valorant',
    tournamentName: 'Valorant Uzbekistan Cup',
    tournamentLogo: '/avatars/riot.jpg',
    sport: 'valorant',
    sportLabel: 'Valorant',
    stage: 'Grand Finals • Map 2 of 3 (Ascent)',
    status: 'live',
    liveTime: 'Map 2 • 11 - 9',
    startTime: 'Today, 19:30',
    date: 'today',
    venue: 'CyberArena Tashkent • Stage 1',
    spectators: 8920,
    organizerName: 'Riot Games Uzbekistan',
    organizerAvatar: '/avatars/riot.jpg',
    updatedAt: 'Live 10s ago',
    team1: {
      id: 't-falcons',
      name: 'Tashkent Falcons',
      avatar: '/avatars/berkeley.jpg',
      score: 1,
      periodScores: [13, 11],
    },
    team2: {
      id: 't-knights',
      name: 'Samarkand Knights',
      avatar: '/avatars/oxford.jpg',
      score: 0,
      periodScores: [9, 9],
    },
    stats: {
      roundWins: [24, 18],
      kills: [84, 71],
      headshots: [38, 31],
      acesClutches: [3, 1],
    },
    events: [
      { id: 'v-1', minute: 'Map 1 R12', type: 'round', team: 1, player: 'ShadowUz', detail: '1v3 Clutch defusal on Haven' },
      { id: 'v-2', minute: 'Map 1 R22', type: 'kill', team: 1, player: 'ViperKing', detail: 'Ace with Vandal on A Site' },
      { id: 'v-3', minute: 'Map 2 R6', type: 'round', team: 2, player: 'NoMercy', detail: 'Thrifty eco round win on Ascent' },
      { id: 'v-4', minute: 'Map 2 R18', type: 'round', team: 1, player: 'AbbosQ', detail: 'Operator 3K defending B Main' },
    ],
    team1Roster: [
      { id: 'vp1', name: 'ShadowUz', role: 'Duelist (Jett)', rating: 8.9, avatar: '/avatars/alex.jpg' },
      { id: 'vp2', name: 'ViperKing', role: 'Controller (Omen)', rating: 8.4, avatar: '/avatars/marcus.jpg' },
      { id: 'vp3', name: 'AbbosQ', role: 'Initiator (Sova)', rating: 8.6, avatar: '/avatars/alex.jpg' },
      { id: 'vp4', name: 'ZeroCold', role: 'Sentinel (Killjoy)', rating: 7.5, avatar: '/avatars/david.jpg' },
    ],
    team2Roster: [
      { id: 'vp5', name: 'NoMercy', role: 'Duelist (Reyna)', rating: 7.9, avatar: '/avatars/sarah.jpg' },
      { id: 'vp6', name: 'PhantomX', role: 'Initiator (Fade)', rating: 7.2, avatar: '/avatars/marcus.jpg' },
      { id: 'vp7', name: 'CyberSam', role: 'Sentinel (Cypher)', rating: 7.1, avatar: '/avatars/david.jpg' },
      { id: 'vp8', name: 'NightHawk', role: 'Controller (Brimstone)', rating: 6.9, avatar: '/avatars/alex.jpg' },
    ],
  },

  // ── LIVE MATCH 3 (CHESS) ──
  {
    id: 'match-chess-live-3',
    tournamentId: 'tourn-chess',
    tournamentName: 'National Chess Championship 2026',
    tournamentLogo: '/avatars/us-chess.jpg',
    sport: 'chess',
    sportLabel: 'Chess',
    stage: 'Round 5 • Board 1 (Classical)',
    status: 'live',
    liveTime: 'Move 41 • End Game',
    startTime: 'Today, 14:00',
    date: 'today',
    venue: 'International Chess Academy, Tashkent',
    spectators: 5120,
    organizerName: 'Uzbek Chess Federation',
    organizerAvatar: '/avatars/us-chess.jpg',
    updatedAt: 'Live 1m ago',
    team1: {
      id: 'ch-1',
      name: 'GM Nodirbek Abdusattorov (2784)',
      avatar: '/avatars/alex.jpg',
      score: 0.5,
      periodScores: [0.5],
    },
    team2: {
      id: 'ch-2',
      name: 'GM Javokhir Sindarov (2712)',
      avatar: '/avatars/marcus.jpg',
      score: 0.5,
      periodScores: [0.5],
    },
    stats: {
      possession: [51, 49], // Accuracy %
      shotsOnTarget: [41, 41], // Total Moves
    },
    events: [
      { id: 'c-1', minute: 'Move 14', type: 'round', team: 1, player: 'Abdusattorov', detail: 'Sicilian Defense: Najdorf Variation novelty' },
      { id: 'c-2', minute: 'Move 28', type: 'round', team: 2, player: 'Sindarov', detail: 'Tactical exchange sacrifice on e4' },
      { id: 'c-3', minute: 'Move 39', type: 'checkmate', team: 1, player: 'Abdusattorov', detail: 'Queen check forcing opposite colored bishop endgame' },
    ],
    team1Roster: [
      { id: 'cp1', name: 'GM Nodirbek Abdusattorov', role: 'White (Elo 2784)', rating: 9.4, avatar: '/avatars/alex.jpg' },
    ],
    team2Roster: [
      { id: 'cp2', name: 'GM Javokhir Sindarov', role: 'Black (Elo 2712)', rating: 9.2, avatar: '/avatars/marcus.jpg' },
    ],
  },

  // ── FINISHED MATCH 1 (FOOTBALL) ──
  {
    id: 'match-fb-fin-1',
    tournamentId: 'tourn-football',
    tournamentName: 'Inter-University Football Cup 2026',
    tournamentLogo: '/avatars/stanford.jpg',
    sport: 'football',
    sportLabel: 'Football',
    stage: 'Quarterfinal A',
    status: 'finished',
    startTime: 'Yesterday, 16:00',
    date: 'yesterday',
    venue: 'Bunyodkor Academy Field',
    spectators: 2800,
    organizerName: 'Tashkent Sports Association',
    organizerAvatar: '/avatars/stanford.jpg',
    updatedAt: 'Final Score Confirmed',
    team1: {
      id: 't-inha',
      name: 'Inha Tech Lions',
      avatar: '/avatars/harvard.jpg',
      score: 3,
      winner: true,
      periodScores: [1, 2],
    },
    team2: {
      id: 't-tpu',
      name: 'Turin Polytechnic FC',
      avatar: '/avatars/cambridge.jpg',
      score: 1,
      winner: false,
      periodScores: [0, 1],
    },
    stats: {
      possession: [61, 39],
      shotsOnTarget: [9, 3],
      totalShots: [16, 7],
      corners: [8, 2],
      fouls: [8, 14],
    },
    events: [
      { id: 'fin-1', minute: "22'", type: 'goal', team: 1, player: 'Timur Valiev', detail: 'Direct free kick into top corner' },
      { id: 'fin-2', minute: "55'", type: 'goal', team: 1, player: 'Sanjar Tursunov', detail: 'Rebound tap-in' },
      { id: 'fin-3', minute: "74'", type: 'goal', team: 2, player: 'Jasur Hasanov', detail: 'Penalty kick' },
      { id: 'fin-4', minute: "88'", type: 'goal', team: 1, player: 'Timur Valiev', detail: 'Fastbreak solo run' },
    ],
    team1Roster: [
      { id: 'ip1', name: 'Timur Valiev', number: 10, role: 'Captain', rating: 9.1, avatar: '/avatars/alex.jpg' },
      { id: 'ip2', name: 'Sanjar Tursunov', number: 7, role: 'Winger', rating: 7.9, avatar: '/avatars/marcus.jpg' },
    ],
    team2Roster: [
      { id: 'ip3', name: 'Jasur Hasanov', number: 8, role: 'Midfielder', rating: 7.4, avatar: '/avatars/david.jpg' },
    ],
  },

  // ── FINISHED MATCH 2 (VALORANT) ──
  {
    id: 'match-val-fin-2',
    tournamentId: 'tourn-valorant',
    tournamentName: 'Valorant Uzbekistan Cup',
    tournamentLogo: '/avatars/riot.jpg',
    sport: 'valorant',
    sportLabel: 'Valorant',
    stage: 'Upper Bracket Final',
    status: 'finished',
    startTime: 'Yesterday, 20:00',
    date: 'yesterday',
    venue: 'CyberArena Tashkent',
    spectators: 7400,
    organizerName: 'Riot Games Uzbekistan',
    organizerAvatar: '/avatars/riot.jpg',
    updatedAt: 'Match Certified',
    team1: {
      id: 't-falcons',
      name: 'Tashkent Falcons',
      avatar: '/avatars/berkeley.jpg',
      score: 2,
      winner: true,
      periodScores: [13, 13],
    },
    team2: {
      id: 't-bukhara',
      name: 'Bukhara Cyber Gladiators',
      avatar: '/avatars/oxford.jpg',
      score: 0,
      winner: false,
      periodScores: [8, 10],
    },
    stats: {
      roundWins: [26, 18],
      kills: [78, 59],
      headshots: [41, 28],
      acesClutches: [4, 1],
    },
    events: [
      { id: 'vf-1', minute: 'Map 1 R10', type: 'round', team: 1, player: 'ShadowUz', detail: 'Flawless site execute on Lotus' },
      { id: 'vf-2', minute: 'Map 2 R21', type: 'round', team: 1, player: 'ViperKing', detail: 'Viper pit lockdown 4K' },
    ],
    team1Roster: [
      { id: 'fp1', name: 'ShadowUz', role: 'Duelist', rating: 8.8, avatar: '/avatars/alex.jpg' },
      { id: 'fp2', name: 'ViperKing', role: 'Controller', rating: 8.5, avatar: '/avatars/marcus.jpg' },
    ],
    team2Roster: [
      { id: 'fp3', name: 'BukharaApex', role: 'Duelist', rating: 7.1, avatar: '/avatars/david.jpg' },
    ],
  },

  // ── FINISHED MATCH 3 (BASKETBALL) ──
  {
    id: 'match-bb-fin-3',
    tournamentId: 'tourn-bball',
    tournamentName: 'Tashkent University Basketball League',
    tournamentLogo: '/avatars/stanford.jpg',
    sport: 'basketball',
    sportLabel: 'Basketball',
    stage: 'Regular Season • Week 4',
    status: 'finished',
    startTime: 'Yesterday, 17:30',
    date: 'yesterday',
    venue: 'Jar Sports Complex Arena',
    spectators: 1950,
    organizerName: 'Tashkent Sports Association',
    organizerAvatar: '/avatars/stanford.jpg',
    updatedAt: 'Official Final Score',
    team1: {
      id: 't-titans',
      name: 'Tashkent Titans',
      avatar: '/avatars/mit.jpg',
      score: 84,
      winner: true,
      periodScores: [22, 19, 24, 19],
    },
    team2: {
      id: 't-eagles',
      name: 'Samarkand Eagles',
      avatar: '/avatars/oxford.jpg',
      score: 79,
      winner: false,
      periodScores: [20, 21, 18, 20],
    },
    stats: {
      possession: [52, 48],
      totalShots: [68, 64],
      fouls: [16, 19],
    },
    events: [
      { id: 'bb-1', minute: 'Q4 0:18', type: 'goal', team: 1, player: 'Arthur Kim', detail: 'Clutch 3-pointer from corner to seal victory' },
      { id: 'bb-2', minute: 'Q3 4:21', type: 'goal', team: 2, player: 'Sherzod Norov', detail: 'Fastbreak slam dunk' },
    ],
    team1Roster: [
      { id: 'bp1', name: 'Arthur Kim', number: 23, role: 'Shooting Guard', rating: 8.9, avatar: '/avatars/alex.jpg' },
      { id: 'bp2', name: 'Makhmud Karimov', number: 15, role: 'Center', rating: 8.1, avatar: '/avatars/marcus.jpg' },
    ],
    team2Roster: [
      { id: 'bp3', name: 'Sherzod Norov', number: 7, role: 'Small Forward', rating: 8.4, avatar: '/avatars/david.jpg' },
    ],
  },

  // ── UPCOMING MATCH 1 (FOOTBALL) ──
  {
    id: 'match-fb-up-1',
    tournamentId: 'tourn-football',
    tournamentName: 'Inter-University Football Cup 2026',
    tournamentLogo: '/avatars/stanford.jpg',
    sport: 'football',
    sportLabel: 'Football',
    stage: 'Grand Final',
    status: 'upcoming',
    startTime: 'Tomorrow, 19:00',
    date: 'tomorrow',
    venue: 'Milliy Stadium, Tashkent',
    spectators: 5000,
    organizerName: 'Tashkent Sports Association',
    organizerAvatar: '/avatars/stanford.jpg',
    updatedAt: 'Starting in 24 hours',
    team1: {
      id: 't-nuu',
      name: 'National University FC',
      avatar: '/avatars/mit.jpg',
      score: 0,
    },
    team2: {
      id: 't-inha',
      name: 'Inha Tech Lions',
      avatar: '/avatars/harvard.jpg',
      score: 0,
    },
    stats: {},
    events: [],
    team1Roster: [
      { id: 'p1', name: 'Rustam Aliev', number: 9, role: 'Forward', rating: 8.2, avatar: '/avatars/alex.jpg' },
    ],
    team2Roster: [
      { id: 'p2', name: 'Timur Valiev', number: 10, role: 'Captain', rating: 9.1, avatar: '/avatars/alex.jpg' },
    ],
  },
]
