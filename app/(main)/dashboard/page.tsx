import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StatsGrid } from '@/components/stats-card'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { 
  Plus, 
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const teamMembers = [
  { id: '1', name: 'Sarah Chen', role: 'Admin', avatar: '/avatars/sarah.jpg' },
  { id: '2', name: 'Marcus Williams', role: 'Moderator', avatar: '/avatars/marcus.jpg' },
  { id: '3', name: 'Emma Rodriguez', role: 'Support', avatar: '/avatars/emma.jpg' },
]

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value || 'org1'

  // Load Organizer profile
  const organizer = await db.user.findUnique({
    where: { id: userId }
  })

  if (!organizer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Organizer profile not found in database.
      </div>
    )
  }

  // Load organized tournaments
  const tournamentsRaw = await db.tournament.findMany({
    where: { organizerId: userId }
  })

  // Format and count participants for each tournament
  const myTournaments = await Promise.all(
    tournamentsRaw.map(async (t) => {
      const participantCount = await db.participant.count({
        where: { tournamentId: t.id }
      })
      return {
        ...t,
        participants: participantCount
      }
    })
  )

  // Calculate stats
  const totalTournaments = myTournaments.length
  const activeTournaments = myTournaments.filter(t => t.status === 'registration_open' || t.status === 'ongoing').length
  const totalParticipants = myTournaments.reduce((acc, t) => acc + t.participants, 0)
  
  // Calculate registration status counts
  const allMyTournamentIds = myTournaments.map(t => t.id)
  const pendingCount = await db.participant.count({
    where: { tournamentId: { in: allMyTournamentIds }, status: 'pending' }
  })
  const approvedCount = await db.participant.count({
    where: { tournamentId: { in: allMyTournamentIds }, status: 'approved' }
  })
  const rejectedCount = await db.participant.count({
    where: { tournamentId: { in: allMyTournamentIds }, status: 'rejected' }
  })

  const stats = [
    { 
      title: 'Total Tournaments', 
      value: totalTournaments,
      icon: Trophy,
      variant: 'primary' as const
    },
    { 
      title: 'Active Tournaments', 
      value: activeTournaments,
      icon: Calendar,
      variant: 'accent' as const
    },
    { 
      title: 'Total Participants', 
      value: totalParticipants.toLocaleString(),
      icon: Users,
      trend: { value: 8, direction: 'up' as const }
    },
    { 
      title: 'Success Rate', 
      value: '92%',
      icon: BarChart3,
      trend: { value: 1, direction: 'up' as const }
    },
  ]

  const recentActivity = [
    { id: '1', action: 'New registration', tournament: 'Inter-University Football Championship', time: '2 hours ago' },
    { id: '2', action: 'Payment confirmed', tournament: 'Inter-University Football Championship', time: '5 hours ago' },
    { id: '3', action: 'Team approved', tournament: 'Inter-University Football Championship', time: '1 day ago' },
    { id: '4', action: 'New message', tournament: 'Chess Masters Open', time: '2 days ago' },
  ]

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={organizer.avatar} alt={organizer.name} />
            <AvatarFallback>{organizer.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{organizer.name}</h1>
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-muted-foreground">Organizer Dashboard</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button asChild className="gap-2">
            <Link href="/create">
              <Plus className="h-4 w-4" />
              Create Tournament
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Tournaments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Tournaments</CardTitle>
                <CardDescription>Manage your active and upcoming tournaments</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myTournaments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tournaments yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/create">Create your first tournament</Link>
                    </Button>
                  </div>
                ) : (
                  myTournaments.map((tournament) => (
                    <div 
                      key={tournament.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{tournament.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(tournament.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            <span className="mx-1">•</span>
                            <Users className="h-3 w-3" />
                            {tournament.participants}/{tournament.maxParticipants}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={tournament.status === 'registration_open' ? 'default' : 'secondary'}
                        >
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/tournament/${tournament.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        {' for '}
                        <span className="text-muted-foreground">{activity.tournament}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" asChild>
                <Link href="/create">
                  <Plus className="h-4 w-4" />
                  Create Tournament
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/participants">
                  <Users className="h-4 w-4" />
                  Manage Participants
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/messages">
                  <ExternalLink className="h-4 w-4" />
                  View Messages
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Registration Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <Badge variant="outline">{pendingCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">{approvedCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejected</span>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">{rejectedCount}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
