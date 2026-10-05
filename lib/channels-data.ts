export interface ChannelPost {
  id: string
  channelId: string
  title: string
  content: string
  type: 'announcement' | 'timeline_event'
  badge?: string // e.g. "📌 Rules", "📢 Registration Open", "🏆 Bracket Released", "📅 Round 1 Starts"
  pinned?: boolean
  timestamp: string
  views: number
  authorName: string
  authorRole: string
  authorAvatar?: string
}

export interface ChannelStats {
  followers: number
  growth30Days: number
  avgPostViews: number
  registrationsFromChannel: number
}

export interface Channel {
  id: string
  name: string
  handle: string
  type: 'organizer' | 'tournament'
  avatar: string
  verified?: boolean
  description: string
  subscribers: number
  isFollowed?: boolean
  sport?: string
  status?: 'active' | 'upcoming' | 'completed'
  tournamentId?: string
  stats?: ChannelStats
  lastPostTime: string
  lastPostSnippet: string
  unreadCount: number
}

export interface SupportTicketMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  senderRole: 'player' | 'official'
  content: string
  timestamp: string
}

export interface SupportTicket {
  id: string
  ticketNumber: string
  organizerId: string
  organizerName: string
  tournamentTitle?: string
  category: 'payment' | 'dispute' | 'schedule' | 'technical' | 'general'
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_review' | 'resolved'
  subject: string
  description: string
  createdAt: string
  updatedAt: string
  messages: SupportTicketMessage[]
}

export const initialChannels: Channel[] = [
  // 🏢 ORGANIZER CHANNELS
  {
    id: 'org-chess',
    name: 'Uzbek Chess Federation',
    handle: '@uzchess',
    type: 'organizer',
    avatar: '/avatars/us-chess.jpg',
    verified: true,
    description: 'Official National Governing Body for Chess in the Republic of Uzbekistan. FIDE member federation.',
    subscribers: 4820,
    isFollowed: true,
    stats: {
      followers: 4820,
      growth30Days: 310,
      avgPostViews: 1420,
      registrationsFromChannel: 145,
    },
    lastPostTime: 'Today, 4:06 PM',
    lastPostSnippet: '📢 Scholarship opportunity for top 5 collegiate division finalists.',
    unreadCount: 1,
  },
  {
    id: 'org-riot',
    name: 'Riot Games Uzbekistan',
    handle: '@riotuzb',
    type: 'organizer',
    avatar: '/avatars/riot.jpg',
    verified: true,
    description: 'Official collegiate esports community and tournament organizer for Valorant and League of Legends in Central Asia.',
    subscribers: 3450,
    isFollowed: true,
    stats: {
      followers: 3450,
      growth30Days: 280,
      avgPostViews: 980,
      registrationsFromChannel: 87,
    },
    lastPostTime: 'Today, 2:15 PM',
    lastPostSnippet: '🏆 Bracket Released for Valorant Uzbekistan Cup Group Stages.',
    unreadCount: 2,
  },
  {
    id: 'org-sports',
    name: 'Tashkent Sports Association',
    handle: '@tsasports',
    type: 'organizer',
    avatar: '/avatars/stanford.jpg',
    verified: true,
    description: 'Regional athletics federation coordinating inter-university championships, football leagues, and youth cups.',
    subscribers: 2413,
    isFollowed: false,
    stats: {
      followers: 2413,
      growth30Days: 243,
      avgPostViews: 1124,
      registrationsFromChannel: 87,
    },
    lastPostTime: 'Yesterday',
    lastPostSnippet: '📢 Registration Open: Inter-University Football Cup 2026.',
    unreadCount: 0,
  },

  // 🏆 TOURNAMENT CHANNELS
  {
    id: 'tourn-chess',
    name: 'National Chess Championship',
    handle: '@chesschamp2026',
    type: 'tournament',
    avatar: '/avatars/us-chess.jpg',
    sport: 'Chess',
    status: 'active',
    tournamentId: '3',
    description: 'Official timeline and bulletins for the Uzbekistan National Chess Championship 2026.',
    subscribers: 1850,
    isFollowed: true,
    lastPostTime: '2 hours ago',
    lastPostSnippet: '📅 Round 1 Starts Tomorrow at 10:00 AM at International Chess Academy.',
    unreadCount: 1,
  },
  {
    id: 'tourn-valorant',
    name: 'Valorant Uzbekistan Cup',
    handle: '@valouzcup',
    type: 'tournament',
    avatar: '/avatars/riot.jpg',
    sport: 'Valorant',
    status: 'active',
    tournamentId: '5',
    description: 'Live match schedule, referee directives, anti-cheat regulations, and brackets.',
    subscribers: 2190,
    isFollowed: true,
    lastPostTime: 'Yesterday',
    lastPostSnippet: '📌 Rules & Anti-Cheat Protocols updated for Stage 2 qualifiers.',
    unreadCount: 0,
  },
  {
    id: 'tourn-football',
    name: 'Inter-University Football Cup',
    handle: '@unifootball2026',
    type: 'tournament',
    avatar: '/avatars/stanford.jpg',
    sport: 'Football',
    status: 'active',
    tournamentId: '1',
    description: 'Tournament operations desk, matchday venues, referee roster, and disciplinary notices.',
    subscribers: 3100,
    isFollowed: false,
    lastPostTime: '3 days ago',
    lastPostSnippet: '📌 Schedule and pitch allocations released for group games.',
    unreadCount: 0,
  },
]

export const initialPosts: ChannelPost[] = [
  // Uzbek Chess Federation Posts
  {
    id: 'post-chess-4',
    channelId: 'org-chess',
    title: 'Scholarship Opportunity for Top 5 Collegiate Finalists',
    content: `The Uzbek Chess Federation, in cooperation with the Ministry of Higher Education, is proud to announce full academic scholarship grants for the top 5 collegiate division finalists in this season's championship.\n\nRecipients will receive:\n• 100% university tuition coverage for the 2026–2027 academic cycle\n• Monthly athletic stipend\n• Direct qualification to the National Master training camp\n\nApply via your verified university sports coordinator before April 15.`,
    type: 'announcement',
    badge: '🎓 Scholarship Opportunity',
    pinned: true,
    timestamp: 'Today, 4:06 PM',
    views: 1420,
    authorName: 'Elena Vlasova',
    authorRole: 'National Federation Secretary',
  },
  {
    id: 'post-chess-3',
    channelId: 'org-chess',
    title: 'National Team Selection Event Announced',
    content: `Selection trials for the Uzbekistan Student Olympiad Squad will be hosted next month at the Tashkent Chess Academy.\n\nAll Candidate Masters and players with FIDE rating 2000+ are invited to register. Format: 9 rounds Swiss, Classical 90+30 time control.`,
    type: 'announcement',
    badge: '📢 National Team Selection',
    pinned: false,
    timestamp: 'Yesterday, 11:30 AM',
    views: 1890,
    authorName: 'Elena Vlasova',
    authorRole: 'Chief Arbiter',
  },
  {
    id: 'post-chess-2',
    channelId: 'org-chess',
    title: 'Registration Opens Next Week for Spring Circuit',
    content: `Official registration for the Spring Collegiate Circuit opens on Monday, March 23 at 09:00 UZT.\n\nTeams must submit their certified university enrollment rosters prior to roster lock. Verified players will receive automatic ranking seeds.`,
    type: 'announcement',
    badge: '📢 Registration Opens Next Week',
    pinned: false,
    timestamp: 'March 18, 2026',
    views: 2150,
    authorName: 'Uzbek Chess Operations',
    authorRole: 'Official Bulletin',
  },
  {
    id: 'post-chess-1',
    channelId: 'org-chess',
    title: 'New FIDE-Rated Tournament Announced',
    content: `Sanctioned tournament notice: The 2026 International Spring Open has been officially added to the FIDE calendar.\n\nTime controls and norm opportunities have been approved by the FIDE Qualification Commission.`,
    type: 'announcement',
    badge: '📢 New FIDE Tournament',
    pinned: false,
    timestamp: 'March 14, 2026',
    views: 3100,
    authorName: 'Uzbek Chess Operations',
    authorRole: 'Official Bulletin',
  },

  // National Chess Championship (Tournament Timeline Posts)
  {
    id: 'post-tchess-6',
    channelId: 'tourn-chess',
    title: 'Round 1 Starts Tomorrow at 10:00 AM',
    content: `All boards have been prepared at the Central Chess Hall. Clocks start precisely at 10:00 AM.\n\nPlayers arriving more than 15 minutes late forfeit the round per FIDE Zero-Tolerance Article 6.7. Please have your Student ID and competitor badge ready at security check-in.`,
    type: 'timeline_event',
    badge: '📅 Round 1 Starts Tomorrow',
    pinned: true,
    timestamp: '2 hours ago',
    views: 1124,
    authorName: 'Chief Arbiter Desk',
    authorRole: 'Tournament Arbiter',
  },
  {
    id: 'post-tchess-5',
    channelId: 'tourn-chess',
    title: 'Bracket & Pairings Released: Round 1',
    content: `Swiss-Sys pairings for Round 1 have been calculated and verified by the arbitration committee.\n\nTop board matchups:\n• Board 1: Nigora Rustamova (2240) vs. Javokhir Alimov (1980)\n• Board 2: Abbos Qurbonov (2115) vs. Timur Khasanov (1945)\n• Board 3: Sardor Rahimov (2080) vs. Dilshodbek Ergashov (1920)`,
    type: 'timeline_event',
    badge: '🏆 Bracket Released',
    pinned: false,
    timestamp: 'Today, 1:00 PM',
    views: 1650,
    authorName: 'Chief Arbiter Desk',
    authorRole: 'Tournament Arbiter',
  },
  {
    id: 'post-tchess-4',
    channelId: 'tourn-chess',
    title: 'Registration Closed: 128 Confirmed Entrants',
    content: `Official registration for the National Chess Championship is now closed. 128 qualified competitors have completed eligibility clearance.\n\nLate additions or substitutions are no longer permitted.`,
    type: 'timeline_event',
    badge: '📢 Registration Closed',
    pinned: false,
    timestamp: 'Yesterday, 6:00 PM',
    views: 1420,
    authorName: 'Organizing Committee',
    authorRole: 'Operations',
  },
  {
    id: 'post-tchess-3',
    channelId: 'tourn-chess',
    title: 'Registration Open: Early-Bird Verification',
    content: `Player registration is now open on TourneyUp. Ensure your profile has linked your certified FIDE ID and university student email to avoid delays.`,
    type: 'timeline_event',
    badge: '📢 Registration Open',
    pinned: false,
    timestamp: 'March 15, 2026',
    views: 2300,
    authorName: 'Organizing Committee',
    authorRole: 'Operations',
  },
  {
    id: 'post-tchess-2',
    channelId: 'tourn-chess',
    title: 'Prize Pool Structure: 50,000,000 UZS Guaranteed',
    content: `The prize fund has been escrowed and guaranteed:\n• 🥇 1st Place: 20,000,000 UZS + Gold Trophy\n• 🥈 2nd Place: 12,000,000 UZS + Silver Medal\n• 🥉 3rd Place: 8,000,000 UZS + Bronze Medal\n• 4th–8th Places: 2,000,000 UZS each\n\nAll cash payouts will be disbursed to verified player bank accounts within 48 hours of closing ceremonies.`,
    type: 'timeline_event',
    badge: '📌 Prize Pool',
    pinned: false,
    timestamp: 'March 10, 2026',
    views: 2980,
    authorName: 'Finance Desk',
    authorRole: 'Tournament Finance',
  },
  {
    id: 'post-tchess-1',
    channelId: 'tourn-chess',
    title: 'Official Tournament Rules & Code of Conduct',
    content: `The complete rulebook for the 2026 Championship is published:\n1. FIDE Laws of Chess apply with 90 min + 30 sec increment\n2. Electronic devices strictly prohibited in the playing hall\n3. Anti-cheating screenings performed at random before each round\n4. Appeals must be filed within 30 minutes of round conclusion accompanied by referee fee`,
    type: 'timeline_event',
    badge: '📌 Rules',
    pinned: false,
    timestamp: 'March 8, 2026',
    views: 3410,
    authorName: 'Arbitration Board',
    authorRole: 'Rules Committee',
  },

  // Riot Games Uzbekistan Posts
  {
    id: 'post-riot-2',
    channelId: 'org-riot',
    title: 'Bracket Released for Valorant Uzbekistan Cup',
    content: `The 16-team double elimination bracket for the Valorant Uzbekistan Cup is live!\n\nUpper Bracket Quarterfinals begin tomorrow at 18:00 UZT streamed live on Twitch and YouTube. All team captains must check in on Discord 45 minutes before lobby creation.`,
    type: 'timeline_event',
    badge: '🏆 Bracket Released',
    pinned: true,
    timestamp: 'Today, 2:15 PM',
    views: 980,
    authorName: 'Malika Karimova',
    authorRole: 'Head of League Operations',
  },
  {
    id: 'post-riot-1',
    channelId: 'org-riot',
    title: 'Spring 2026 Collegiate Esports Circuit Schedule',
    content: `Mark your calendars: Valorant, LoL, and TFT university qualifiers run from April 5 to May 2. Grand Finals will be hosted live at the Tashkent Youth Esports Arena.`,
    type: 'announcement',
    badge: '📌 Schedule',
    pinned: false,
    timestamp: 'March 16, 2026',
    views: 1840,
    authorName: 'Malika Karimova',
    authorRole: 'Head of League Operations',
  },

  // Valorant Uzbekistan Cup (Tournament Channel)
  {
    id: 'post-tval-2',
    channelId: 'tourn-valorant',
    title: 'Rules & Anti-Cheat Protocols for Stage 2',
    content: `Riot Vanguard version 14.8+ mandatory. Players found running unauthorized scripts, overlay tools, or secondary VPN tunnels will face immediate disqualification and a 12-month competitive ban across all regional leagues.`,
    type: 'timeline_event',
    badge: '📌 Rules',
    pinned: true,
    timestamp: 'Yesterday, 4:00 PM',
    views: 890,
    authorName: 'Esports Arbiter',
    authorRole: 'Anti-Cheat Desk',
  },
  {
    id: 'post-tval-1',
    channelId: 'tourn-valorant',
    title: 'Registration Closed: 16 Qualified Rosters Locked',
    content: `Rosters are finalized. Any emergency substitutions must be reported to the tournament desk at least 4 hours prior to game start with signed student eligibility verification.`,
    type: 'timeline_event',
    badge: '📢 Registration Closed',
    pinned: false,
    timestamp: 'March 17, 2026',
    views: 1240,
    authorName: 'Esports Arbiter',
    authorRole: 'Tournament Desk',
  },

  // Tashkent Sports Association & Inter-University Football
  {
    id: 'post-tsa-1',
    channelId: 'org-sports',
    title: 'Registration Open: Inter-University Football Cup 2026',
    content: `University sports departments may now submit team registrations for the 2026 Inter-University Football Cup. 22-man rosters must be confirmed by dean of sports offices by April 10.`,
    type: 'timeline_event',
    badge: '📢 Registration Open',
    pinned: true,
    timestamp: 'Yesterday, 10:00 AM',
    views: 1124,
    authorName: 'Tashkent Sports Committee',
    authorRole: 'League Office',
  },
  {
    id: 'post-tfoot-1',
    channelId: 'tourn-football',
    title: 'Pitch Allocations & Match Schedule Published',
    content: `Group A matches will be hosted at TUIT Olympic Stadium; Group B matches will be hosted at WIUT Sports Complex. Official kickoffs begin April 15 at 16:00 UZT.`,
    type: 'timeline_event',
    badge: '📌 Schedule',
    pinned: true,
    timestamp: '3 days ago',
    views: 1850,
    authorName: 'Match Director',
    authorRole: 'Football Committee',
  },
]

export const initialSupportTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    ticketNumber: 'TICK-4821',
    organizerId: 'org-sports',
    organizerName: 'Tashkent Sports Association',
    tournamentTitle: 'Inter-University Football Cup 2026',
    category: 'payment',
    priority: 'high',
    status: 'open',
    subject: 'Payment Problem',
    description: 'My payment was deducted via Payme, but my team registration is still showing as pending.',
    createdAt: 'Today, 2:40 PM',
    updatedAt: 'Today, 2:45 PM',
    messages: [
      {
        id: 'tm-1',
        senderId: 'user1',
        senderName: 'Abbos Qurbonov',
        senderAvatar: '/avatars/alex.jpg',
        senderRole: 'player',
        content: 'My payment was deducted via Payme (Transaction #UZ-884920), but my team registration is still showing as pending. Please confirm receipt.',
        timestamp: 'Today, 2:40 PM',
      },
      {
        id: 'tm-2',
        senderId: 'staff-1',
        senderName: 'Tashkent Sports Finance',
        senderAvatar: '/avatars/stanford.jpg',
        senderRole: 'official',
        content: 'Hello Abbos! We are cross-referencing your Payme transaction with our merchant ledger right now. Once verified, your status will update automatically.',
        timestamp: 'Today, 2:45 PM',
      },
    ],
  },
  {
    id: 'ticket-2',
    ticketNumber: 'TICK-4190',
    organizerId: 'org-chess',
    organizerName: 'Uzbek Chess Federation',
    tournamentTitle: 'National Chess Championship',
    category: 'dispute',
    priority: 'medium',
    status: 'in_review',
    subject: 'FIDE ID Association Confirmation',
    description: 'Updated my FIDE ID to 14209931, awaiting profile verification before Round 1.',
    createdAt: 'Yesterday, 4:10 PM',
    updatedAt: 'Today, 9:20 AM',
    messages: [
      {
        id: 'tm-3',
        senderId: 'user1',
        senderName: 'Abbos Qurbonov',
        senderAvatar: '/avatars/alex.jpg',
        senderRole: 'player',
        content: 'Hello, I updated my FIDE ID to 14209931 on my profile. Can you please ensure the arbitration team has this for Swiss seedings?',
        timestamp: 'Yesterday, 4:10 PM',
      },
      {
        id: 'tm-4',
        senderId: 'staff-2',
        senderName: 'Chief Arbiter Desk',
        senderAvatar: '/avatars/us-chess.jpg',
        senderRole: 'official',
        content: 'FIDE ID 14209931 confirmed and verified against the March 2026 rating list. Your seed is Board 2 for Round 1.',
        timestamp: 'Today, 9:20 AM',
      },
    ],
  },
]
