// Mock data for TourneyUp

export type Tournament = {
  id: string
  title: string
  sport: string
  category: 'sports' | 'esports' | 'academic'
  location: string
  date: string
  endDate?: string
  time: string
  participants: number
  maxParticipants: number
  posterUrl: string
  organizer: {
    id: string
    name: string
    avatar: string
    verified: boolean
  }
  description: string
  rules: string[]
  requirements: string[]
  prizePool?: string
  entryFee?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'registration_open'
  featured?: boolean
}

export type User = {
  id: string
  name: string
  username: string
  avatar: string
  bio: string
  university?: string
  location: string
  globalRank: number
  totalPoints: number
  achievements: Achievement[]
  joinedTournaments: number
  wins: number
  losses: number
  sportRanks: SportRank[]
  matchHistory: Match[]
  joinedDate: string
}

export type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  date: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export type SportRank = {
  sport: string
  rank: number
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'champion'
}

export type Match = {
  id: string
  tournamentId: string
  tournamentName: string
  sport: string
  opponent: string
  result: 'win' | 'loss' | 'draw'
  score: string
  date: string
}

export type RankingEntry = {
  rank: number
  user: {
    id: string
    name: string
    username: string
    avatar: string
    university?: string
  }
  points: number
  wins: number
  change: 'up' | 'down' | 'same'
  changeAmount: number
}

export type Message = {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  read: boolean
}

export type Conversation = {
  id: string
  participants: {
    id: string
    name: string
    avatar: string
  }[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  tournamentContext?: {
    id: string
    name: string
  }
}

export type Participant = {
  id: string
  name: string
  email: string
  avatar: string
  registeredAt: string
  status: 'pending' | 'approved' | 'rejected'
  teamName?: string
  paymentStatus: 'paid' | 'pending' | 'waived'
}

// Sample tournaments
export const tournaments: Tournament[] = [
  {
    id: '1',
    title: 'Inter-University Football Championship 2026',
    sport: 'Football',
    category: 'sports',
    location: 'Stanford Stadium, CA',
    date: '2026-04-15',
    endDate: '2026-04-20',
    time: '10:00 AM',
    participants: 24,
    maxParticipants: 32,
    posterUrl: '/tournaments/football-championship.jpg',
    organizer: {
      id: 'org1',
      name: 'Stanford Athletics',
      avatar: '/avatars/stanford.jpg',
      verified: true
    },
    description: 'The biggest inter-university football championship on the West Coast. Teams from top universities compete for glory and a $50,000 prize pool.',
    rules: [
      'Standard FIFA rules apply',
      '11 players per team',
      '90-minute matches with extra time if needed',
      'VAR available for knockout stages'
    ],
    requirements: [
      'Must be a registered university student',
      'Valid student ID required',
      'Team registration with minimum 15 players'
    ],
    prizePool: '$50,000',
    entryFee: '$500 per team',
    status: 'registration_open',
    featured: true
  },
  {
    id: '2',
    title: 'PUBG Mobile Masters Series',
    sport: 'PUBG Mobile',
    category: 'esports',
    location: 'Online',
    date: '2026-04-10',
    endDate: '2026-04-12',
    time: '6:00 PM',
    participants: 78,
    maxParticipants: 100,
    posterUrl: '/tournaments/pubg-masters.jpg',
    organizer: {
      id: 'org2',
      name: 'Esports Arena',
      avatar: '/avatars/esports-arena.jpg',
      verified: true
    },
    description: 'Battle royale at its finest. 100 players, one winner. Compete against the best PUBG Mobile players in the region.',
    rules: [
      'Squad mode (4 players per team)',
      'Erangel and Miramar maps',
      'No third-party software allowed',
      'Discord required for communication'
    ],
    requirements: [
      'Account level 40+',
      'Must have Discord',
      'Stable internet connection'
    ],
    prizePool: '$10,000',
    entryFee: 'Free',
    status: 'registration_open',
    featured: true
  },
  {
    id: '3',
    title: 'National Chess Championship',
    sport: 'Chess',
    category: 'academic',
    location: 'Chicago Convention Center',
    date: '2026-05-01',
    endDate: '2026-05-05',
    time: '9:00 AM',
    participants: 156,
    maxParticipants: 256,
    posterUrl: '/tournaments/chess-championship.jpg',
    organizer: {
      id: 'org3',
      name: 'US Chess Federation',
      avatar: '/avatars/us-chess.jpg',
      verified: true
    },
    description: 'The premier chess tournament in the country. FIDE-rated event with grandmaster appearances and live commentary.',
    rules: [
      'FIDE rules apply',
      'Time control: 90 min + 30 sec increment',
      'Electronic devices prohibited',
      'Touch-move rule enforced'
    ],
    requirements: [
      'FIDE rating 1800+',
      'US Chess Federation membership',
      'Valid government ID'
    ],
    prizePool: '$25,000',
    entryFee: '$150',
    status: 'upcoming',
    featured: true
  },
  {
    id: '4',
    title: 'Campus Basketball 3v3 Tournament',
    sport: 'Basketball',
    category: 'sports',
    location: 'UCLA Recreation Center',
    date: '2026-04-08',
    time: '2:00 PM',
    participants: 16,
    maxParticipants: 24,
    posterUrl: '/tournaments/basketball-3v3.jpg',
    organizer: {
      id: 'org4',
      name: 'UCLA Sports Club',
      avatar: '/avatars/ucla.jpg',
      verified: false
    },
    description: 'Fast-paced 3v3 basketball action. Perfect for casual players looking to compete and have fun.',
    rules: [
      'FIBA 3x3 rules',
      '10-minute games or first to 21',
      'Single elimination bracket'
    ],
    requirements: [
      'UCLA student or alumni',
      'Team of 3-4 players'
    ],
    prizePool: '$500',
    entryFee: '$30 per team',
    status: 'registration_open'
  },
  {
    id: '5',
    title: 'Valorant Champions Cup',
    sport: 'Valorant',
    category: 'esports',
    location: 'Online',
    date: '2026-04-18',
    endDate: '2026-04-19',
    time: '5:00 PM',
    participants: 48,
    maxParticipants: 64,
    posterUrl: '/tournaments/valorant-cup.jpg',
    organizer: {
      id: 'org5',
      name: 'Riot Community Events',
      avatar: '/avatars/riot.jpg',
      verified: true
    },
    description: 'Prove your skills in this community Valorant tournament. Teams compete in a double elimination bracket.',
    rules: [
      'Standard Valorant competitive rules',
      '5 players per team',
      'Map pick/ban system',
      'Overtime rules: win by 2'
    ],
    requirements: [
      'Rank Diamond+ required',
      'Team of 5-6 players',
      'Discord for team communication'
    ],
    prizePool: '$5,000',
    entryFee: 'Free',
    status: 'registration_open'
  },
  {
    id: '6',
    title: 'Regional Swimming Meet',
    sport: 'Swimming',
    category: 'sports',
    location: 'Olympic Aquatic Center, LA',
    date: '2026-04-25',
    time: '8:00 AM',
    participants: 89,
    maxParticipants: 150,
    posterUrl: '/tournaments/swimming-meet.jpg',
    organizer: {
      id: 'org6',
      name: 'Pacific Swim League',
      avatar: '/avatars/psl.jpg',
      verified: true
    },
    description: 'Multi-event swimming competition featuring freestyle, backstroke, breaststroke, and butterfly events.',
    rules: [
      'USA Swimming rules',
      'Age groups: 18-24, 25-34, 35+',
      'Maximum 4 individual events per swimmer'
    ],
    requirements: [
      'USA Swimming membership',
      'Certified time in at least one event'
    ],
    prizePool: '$8,000',
    entryFee: '$75',
    status: 'upcoming'
  },
  {
    id: '7',
    title: 'Rocket League Showdown',
    sport: 'Rocket League',
    category: 'esports',
    location: 'Online',
    date: '2026-04-05',
    time: '7:00 PM',
    participants: 30,
    maxParticipants: 32,
    posterUrl: '/tournaments/rocket-league.jpg',
    organizer: {
      id: 'org7',
      name: 'Psyonix Community',
      avatar: '/avatars/psyonix.jpg',
      verified: true
    },
    description: 'High-octane car soccer action. 3v3 teams battle for supremacy in this fast-paced esports event.',
    rules: [
      'Standard competitive settings',
      '5-minute matches',
      'Best of 5 series in playoffs'
    ],
    requirements: [
      'Rank Champion+ in 3v3',
      'Team of 3-4 players'
    ],
    prizePool: '$3,000',
    entryFee: 'Free',
    status: 'registration_open'
  },
  {
    id: '8',
    title: 'Marathon City Run 2026',
    sport: 'Running',
    category: 'sports',
    location: 'San Francisco, CA',
    date: '2026-05-10',
    time: '6:00 AM',
    participants: 2500,
    maxParticipants: 5000,
    posterUrl: '/tournaments/marathon.jpg',
    organizer: {
      id: 'org8',
      name: 'SF Running Club',
      avatar: '/avatars/sf-run.jpg',
      verified: true
    },
    description: 'The annual San Francisco marathon. Choose from full marathon, half marathon, or 10K distances.',
    rules: [
      'USATF sanctioned event',
      'Bib must be visible at all times',
      'No headphones in elite category'
    ],
    requirements: [
      'Medical clearance recommended',
      '18+ years old'
    ],
    prizePool: '$20,000',
    entryFee: '$125',
    status: 'registration_open'
  }
]

// Featured stories/highlights
export const featuredStories = [
  {
    id: '1',
    title: 'Football Finals',
    image: '/stories/football-finals.jpg',
    tournamentId: '1',
    type: 'live' as const
  },
  {
    id: '2',
    title: 'PUBG Masters',
    image: '/stories/pubg-masters.jpg',
    tournamentId: '2',
    type: 'upcoming' as const
  },
  {
    id: '3',
    title: 'Chess Open',
    image: '/stories/chess-open.jpg',
    tournamentId: '3',
    type: 'featured' as const
  },
  {
    id: '4',
    title: 'Valorant Cup',
    image: '/stories/valorant-cup.jpg',
    tournamentId: '5',
    type: 'registration' as const
  },
  {
    id: '5',
    title: 'Marathon',
    image: '/stories/marathon.jpg',
    tournamentId: '8',
    type: 'featured' as const
  }
]

// Sample user profile
export const currentUser: User = {
  id: 'user1',
  name: 'Alex Thompson',
  username: 'alexthompson',
  avatar: '/avatars/alex.jpg',
  bio: 'Competitive gamer and basketball enthusiast. Always looking for the next challenge.',
  university: 'Stanford University',
  location: 'San Francisco, CA',
  globalRank: 127,
  totalPoints: 4850,
  achievements: [
    {
      id: 'ach1',
      title: 'Tournament Champion',
      description: 'Won first place in a major tournament',
      icon: 'trophy',
      date: '2026-02-15',
      rarity: 'legendary'
    },
    {
      id: 'ach2',
      title: 'Rising Star',
      description: 'Reached top 500 global ranking',
      icon: 'star',
      date: '2026-01-20',
      rarity: 'epic'
    },
    {
      id: 'ach3',
      title: 'Consistent Competitor',
      description: 'Participated in 10+ tournaments',
      icon: 'medal',
      date: '2025-12-01',
      rarity: 'rare'
    },
    {
      id: 'ach4',
      title: 'Team Player',
      description: 'Won a team tournament',
      icon: 'users',
      date: '2025-11-15',
      rarity: 'rare'
    }
  ],
  joinedTournaments: 23,
  wins: 15,
  losses: 8,
  sportRanks: [
    { sport: 'Valorant', rank: 45, points: 2100, tier: 'diamond' },
    { sport: 'Basketball', rank: 89, points: 1500, tier: 'gold' },
    { sport: 'Chess', rank: 234, points: 850, tier: 'silver' },
    { sport: 'PUBG Mobile', rank: 156, points: 400, tier: 'bronze' }
  ],
  matchHistory: [
    {
      id: 'm1',
      tournamentId: '5',
      tournamentName: 'Valorant Champions Cup',
      sport: 'Valorant',
      opponent: 'Team Phoenix',
      result: 'win',
      score: '13-9',
      date: '2026-03-20'
    },
    {
      id: 'm2',
      tournamentId: '4',
      tournamentName: 'Campus Basketball 3v3',
      sport: 'Basketball',
      opponent: 'UCLA Bruins B',
      result: 'win',
      score: '21-18',
      date: '2026-03-15'
    },
    {
      id: 'm3',
      tournamentId: '3',
      tournamentName: 'Regional Chess Open',
      sport: 'Chess',
      opponent: 'Michael Chen',
      result: 'loss',
      score: '0-1',
      date: '2026-03-10'
    },
    {
      id: 'm4',
      tournamentId: '2',
      tournamentName: 'PUBG Mobile Masters',
      sport: 'PUBG Mobile',
      opponent: 'Squad Battle',
      result: 'win',
      score: '#2',
      date: '2026-03-05'
    }
  ],
  joinedDate: '2024-06-15'
}

// Global rankings
export const globalRankings: RankingEntry[] = [
  {
    rank: 1,
    user: {
      id: 'user10',
      name: 'Sarah Chen',
      username: 'sarahchen',
      avatar: '/avatars/sarah.jpg',
      university: 'MIT'
    },
    points: 12500,
    wins: 89,
    change: 'same',
    changeAmount: 0
  },
  {
    rank: 2,
    user: {
      id: 'user11',
      name: 'Marcus Williams',
      username: 'marcusw',
      avatar: '/avatars/marcus.jpg',
      university: 'UCLA'
    },
    points: 11800,
    wins: 76,
    change: 'up',
    changeAmount: 2
  },
  {
    rank: 3,
    user: {
      id: 'user12',
      name: 'Emma Rodriguez',
      username: 'emmar',
      avatar: '/avatars/emma.jpg',
      university: 'Stanford'
    },
    points: 11200,
    wins: 71,
    change: 'down',
    changeAmount: 1
  },
  {
    rank: 4,
    user: {
      id: 'user13',
      name: 'James Kim',
      username: 'jamesk',
      avatar: '/avatars/james.jpg',
      university: 'Berkeley'
    },
    points: 10900,
    wins: 68,
    change: 'up',
    changeAmount: 3
  },
  {
    rank: 5,
    user: {
      id: 'user14',
      name: 'Olivia Taylor',
      username: 'oliviat',
      avatar: '/avatars/olivia.jpg',
      university: 'USC'
    },
    points: 10500,
    wins: 65,
    change: 'same',
    changeAmount: 0
  },
  {
    rank: 6,
    user: {
      id: 'user15',
      name: 'David Park',
      username: 'davidp',
      avatar: '/avatars/david.jpg',
      university: 'NYU'
    },
    points: 10100,
    wins: 62,
    change: 'up',
    changeAmount: 1
  },
  {
    rank: 7,
    user: {
      id: 'user16',
      name: 'Sophie Anderson',
      username: 'sophiea',
      avatar: '/avatars/sophie.jpg',
      university: 'Harvard'
    },
    points: 9800,
    wins: 59,
    change: 'down',
    changeAmount: 2
  },
  {
    rank: 8,
    user: {
      id: 'user17',
      name: 'Ryan Martinez',
      username: 'ryanm',
      avatar: '/avatars/ryan.jpg',
      university: 'Texas A&M'
    },
    points: 9500,
    wins: 57,
    change: 'up',
    changeAmount: 4
  },
  {
    rank: 9,
    user: {
      id: 'user18',
      name: 'Isabella Nguyen',
      username: 'isabellan',
      avatar: '/avatars/isabella.jpg',
      university: 'UCLA'
    },
    points: 9200,
    wins: 55,
    change: 'same',
    changeAmount: 0
  },
  {
    rank: 10,
    user: {
      id: 'user19',
      name: 'Ethan Brown',
      username: 'ethanb',
      avatar: '/avatars/ethan.jpg',
      university: 'Duke'
    },
    points: 8900,
    wins: 52,
    change: 'down',
    changeAmount: 3
  }
]

// Sample conversations
export const conversations: Conversation[] = [
  {
    id: 'conv1',
    participants: [
      { id: 'org1', name: 'Stanford Athletics', avatar: '/avatars/stanford.jpg' }
    ],
    lastMessage: 'Your team has been approved for the championship!',
    lastMessageTime: '2026-03-24T10:30:00',
    unreadCount: 1,
    tournamentContext: { id: '1', name: 'Inter-University Football Championship' }
  },
  {
    id: 'conv2',
    participants: [
      { id: 'user11', name: 'Marcus Williams', avatar: '/avatars/marcus.jpg' }
    ],
    lastMessage: 'Hey, want to team up for the Valorant tournament?',
    lastMessageTime: '2026-03-23T18:45:00',
    unreadCount: 2
  },
  {
    id: 'conv3',
    participants: [
      { id: 'org5', name: 'Riot Community Events', avatar: '/avatars/riot.jpg' }
    ],
    lastMessage: 'Reminder: Match starts in 2 hours',
    lastMessageTime: '2026-03-22T14:00:00',
    unreadCount: 0,
    tournamentContext: { id: '5', name: 'Valorant Champions Cup' }
  },
  {
    id: 'conv4',
    participants: [
      { id: 'user12', name: 'Emma Rodriguez', avatar: '/avatars/emma.jpg' }
    ],
    lastMessage: 'Good game! Let\'s practice together sometime',
    lastMessageTime: '2026-03-21T20:15:00',
    unreadCount: 0
  }
]

// Sample messages for a conversation
export const sampleMessages: Message[] = [
  {
    id: 'msg1',
    senderId: 'org1',
    senderName: 'Stanford Athletics',
    senderAvatar: '/avatars/stanford.jpg',
    content: 'Hi! We\'ve reviewed your team registration for the Inter-University Football Championship.',
    timestamp: '2026-03-24T10:25:00',
    read: true
  },
  {
    id: 'msg2',
    senderId: 'org1',
    senderName: 'Stanford Athletics',
    senderAvatar: '/avatars/stanford.jpg',
    content: 'Your team has been approved for the championship! Please ensure all players complete their verification by April 10th.',
    timestamp: '2026-03-24T10:30:00',
    read: false
  },
  {
    id: 'msg3',
    senderId: 'user1',
    senderName: 'Alex Thompson',
    senderAvatar: '/avatars/alex.jpg',
    content: 'That\'s great news! Thank you. We\'ll make sure everyone is verified on time.',
    timestamp: '2026-03-24T10:35:00',
    read: true
  }
]

// Sample participants for tournament management
export const sampleParticipants: Participant[] = [
  {
    id: 'p1',
    name: 'Alex Thompson',
    email: 'alex.t@stanford.edu',
    avatar: '/avatars/alex.jpg',
    registeredAt: '2026-03-20T14:30:00',
    status: 'approved',
    teamName: 'Stanford Strikers',
    paymentStatus: 'paid'
  },
  {
    id: 'p2',
    name: 'Marcus Williams',
    email: 'marcus.w@ucla.edu',
    avatar: '/avatars/marcus.jpg',
    registeredAt: '2026-03-21T09:15:00',
    status: 'approved',
    teamName: 'UCLA Bruins A',
    paymentStatus: 'paid'
  },
  {
    id: 'p3',
    name: 'Emma Rodriguez',
    email: 'emma.r@stanford.edu',
    avatar: '/avatars/emma.jpg',
    registeredAt: '2026-03-22T16:45:00',
    status: 'pending',
    teamName: 'Stanford Strikers',
    paymentStatus: 'pending'
  },
  {
    id: 'p4',
    name: 'James Kim',
    email: 'james.k@berkeley.edu',
    avatar: '/avatars/james.jpg',
    registeredAt: '2026-03-22T18:00:00',
    status: 'pending',
    teamName: 'Berkeley Bears',
    paymentStatus: 'paid'
  },
  {
    id: 'p5',
    name: 'Olivia Taylor',
    email: 'olivia.t@usc.edu',
    avatar: '/avatars/olivia.jpg',
    registeredAt: '2026-03-23T10:30:00',
    status: 'rejected',
    teamName: 'USC Trojans',
    paymentStatus: 'pending'
  }
]

// Sport categories
export const sportCategories = [
  { id: 'all', name: 'All', icon: 'layout-grid' },
  { id: 'football', name: 'Football', icon: 'circle' },
  { id: 'basketball', name: 'Basketball', icon: 'circle' },
  { id: 'chess', name: 'Chess', icon: 'crown' },
  { id: 'valorant', name: 'Valorant', icon: 'crosshair' },
  { id: 'pubg', name: 'PUBG', icon: 'target' },
  { id: 'rocket-league', name: 'Rocket League', icon: 'car' },
  { id: 'swimming', name: 'Swimming', icon: 'waves' },
  { id: 'running', name: 'Running', icon: 'footprints' }
]

// Locations
export const locations = [
  'All Locations',
  'San Francisco, CA',
  'Los Angeles, CA',
  'New York, NY',
  'Chicago, IL',
  'Online'
]

// Sample organizer data
export const organizerProfile = {
  id: 'org1',
  name: 'Stanford Athletics',
  avatar: '/avatars/stanford.jpg',
  verified: true,
  description: 'Official athletics department of Stanford University. Organizing competitive sports events since 1891.',
  totalTournaments: 45,
  activeTournaments: 3,
  totalParticipants: 2840,
  rating: 4.9,
  teamMembers: [
    { id: 'tm1', name: 'John Smith', role: 'Director', avatar: '/avatars/john.jpg' },
    { id: 'tm2', name: 'Lisa Chen', role: 'Event Manager', avatar: '/avatars/lisa.jpg' },
    { id: 'tm3', name: 'Mike Johnson', role: 'Coordinator', avatar: '/avatars/mike.jpg' }
  ]
}

// Landing page stats
export const platformStats = {
  totalTournaments: 15000,
  activeUsers: 250000,
  prizesAwarded: 5000000,
  countriesReached: 45
}

// Testimonials
export const testimonials = [
  {
    id: 't1',
    name: 'Sarah Chen',
    role: 'Professional Gamer',
    avatar: '/avatars/sarah.jpg',
    content: 'TourneyUp made it so easy to find and join tournaments. I\'ve won 3 championships through this platform!',
    rating: 5
  },
  {
    id: 't2',
    name: 'Marcus Williams',
    role: 'University Team Captain',
    avatar: '/avatars/marcus.jpg',
    content: 'Managing our basketball team and finding local competitions has never been easier. Great platform!',
    rating: 5
  },
  {
    id: 't3',
    name: 'Emma Rodriguez',
    role: 'Tournament Organizer',
    avatar: '/avatars/emma.jpg',
    content: 'As an organizer, TourneyUp gives me all the tools I need to run successful events. Highly recommended!',
    rating: 5
  }
]
