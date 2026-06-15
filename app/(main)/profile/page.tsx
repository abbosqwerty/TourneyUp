import { db } from '@/lib/db'
import { ProfileHeader } from '@/components/profile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TournamentCard } from '@/components/tournament-card'
import { NoUpcomingMatches } from '@/components/empty-state'
import { cookies } from 'next/headers'
import { 
  Trophy, 
  Swords, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const resultColors: Record<string, string> = {
  win: 'bg-success/20 text-success border-success/30',
  loss: 'bg-destructive/20 text-destructive border-destructive/30',
  draw: 'bg-warning/20 text-warning border-warning/30',
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'user1'

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      achievements: true,
      sportRanks: true,
      matchHistory: true
    }
  })

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        User profile not found in database.
      </div>
    )
  }

  // Fetch tournaments user has joined (based on Participant registrations)
  const registrations = await db.participant.findMany({
    where: { userId: userId },
    include: {
      tournament: {
        include: {
          organizer: true
        }
      }
    }
  })

  const joinedTournaments = await Promise.all(
    registrations.map(async (reg) => {
      const count = await db.participant.count({ where: { tournamentId: reg.tournamentId } })
      return {
        id: reg.tournament.id,
        title: reg.tournament.title,
        sport: reg.tournament.sport,
        category: reg.tournament.category as 'sports' | 'esports' | 'academic',
        location: reg.tournament.location,
        date: reg.tournament.date,
        time: reg.tournament.time,
        participants: count,
        maxParticipants: reg.tournament.maxParticipants,
        posterUrl: reg.tournament.posterUrl,
        organizer: {
          id: reg.tournament.organizer.id,
          name: reg.tournament.organizer.name,
          avatar: reg.tournament.organizer.avatar,
          verified: reg.tournament.organizer.globalRank === 0
        },
        status: reg.tournament.status as 'upcoming' | 'ongoing' | 'completed' | 'registration_open',
        featured: reg.tournament.featured,
        description: reg.tournament.description,
        rules: JSON.parse(reg.tournament.rulesJson) as string[],
        requirements: JSON.parse(reg.tournament.requirementsJson) as string[],
        prizePool: reg.tournament.prizePool || undefined,
        entryFee: reg.tournament.entryFee || undefined,
      }
    })
  )

  const formattedUser = {
    ...user,
    bio: user.bio || '',
    university: user.university || undefined,
    wins: user.matchHistory.filter(m => m.result === 'win').length,
    losses: user.matchHistory.filter(m => m.result === 'loss').length,
    sportRanks: user.sportRanks.map(sr => ({
      ...sr,
      tier: sr.tier as any
    })),
    achievements: user.achievements.map(ach => ({
      ...ach,
      rarity: ach.rarity as any
    })),
    matchHistory: user.matchHistory.map(m => ({
      ...m,
      result: m.result as 'win' | 'loss' | 'draw'
    })),
    joinedTournaments: joinedTournaments.length
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <ProfileHeader user={formattedUser} isOwnProfile={true} />

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="history" className="gap-2">
            <Swords className="h-4 w-4" />
            Match History
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="gap-2">
            <Trophy className="h-4 w-4" />
            Tournaments
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
        </TabsList>

        {/* Match History */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formattedUser.matchHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No matches played yet.</p>
                ) : (
                  formattedUser.matchHistory.map((match) => (
                    <div 
                      key={match.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="outline"
                          className={resultColors[match.result] || ''}
                        >
                          {match.result === 'win' && <TrendingUp className="h-3 w-3 mr-1" />}
                          {match.result === 'loss' && <TrendingDown className="h-3 w-3 mr-1" />}
                          {match.result.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{match.tournamentName}</p>
                          <p className="text-sm text-muted-foreground">
                            vs {match.opponent}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{match.score}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Tournaments */}
        <TabsContent value="tournaments" className="mt-6">
          {joinedTournaments.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No registered tournaments yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {joinedTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upcoming Matches */}
        <TabsContent value="upcoming" className="mt-6">
          <NoUpcomingMatches />
        </TabsContent>
      </Tabs>
    </div>
  )
}
