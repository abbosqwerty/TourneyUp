import { redirect } from 'next/navigation'
import { Calendar, Swords, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import type { Achievement, SportRank, Tournament, User } from '@/lib/types'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { tournamentPoster } from '@/lib/media'
import { listUserMatches, userRecord, type UserMatchView } from '@/lib/matches'
import { ProfileHeader } from '@/components/profile-header'
import { DbErrorCard } from '@/components/db-error-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TournamentCard } from '@/components/tournament-card'
import { NoUpcomingMatches } from '@/components/empty-state'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Profil', robots: { index: false } }

const resultStyles: Record<UserMatchView['result'], string> = {
  win: 'bg-success/20 text-success border-success/30',
  loss: 'bg-destructive/20 text-destructive border-destructive/30',
  draw: 'bg-warning/20 text-warning border-warning/30',
  pending: 'bg-muted text-muted-foreground border-border',
}

const resultLabels: Record<UserMatchView['result'], string> = {
  win: 'G‘ALABA',
  loss: 'MAG‘LUBIYAT',
  draw: 'DURANG',
  pending: 'KUTILMOQDA',
}

export default async function ProfilePage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login?next=%2Fprofile')

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load(session.id)
  } catch (error) {
    console.error('profile page failed', error)
  }

  if (!data) return <DbErrorCard message="Profilni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />

  const { profile, joinedTournaments, upcomingTournaments, matches } = data

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6 theme-profile bg-background text-foreground">
      <ProfileHeader user={profile} isOwnProfile />

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="history" className="gap-2">
            <Swords className="h-4 w-4" aria-hidden />
            O‘yin tarixi
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="gap-2">
            <Trophy className="h-4 w-4" aria-hidden />
            Turnirlar
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" aria-hidden />
            Kutilayotgan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Oxirgi o‘yinlar</CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Hali o‘yin natijasi kiritilmagan.
                </p>
              ) : (
                <ul className="space-y-4">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <Badge variant="outline" className={resultStyles[match.result]}>
                          {match.result === 'win' ? (
                            <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
                          ) : null}
                          {match.result === 'loss' ? (
                            <TrendingDown className="mr-1 h-3 w-3" aria-hidden />
                          ) : null}
                          {resultLabels[match.result]}
                        </Badge>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{match.tournamentTitle}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {match.stage ? `${match.stage} · ` : ''}
                            {match.opponent} bilan
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold">{match.score}</p>
                        <p className="text-xs text-muted-foreground">
                          {match.scheduledAt
                            ? new Date(match.scheduledAt).toLocaleDateString('uz-UZ', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-6">
          {joinedTournaments.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Hali hech qanday turnirga yozilmagansiz.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {joinedTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingTournaments.length === 0 ? (
            <NoUpcomingMatches />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function load(userId: string) {
  const [user, registrations, matches, record] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { achievements: true, sportRanks: true },
    }),
    db.participant.findMany({
      where: { userId },
      include: {
        tournament: {
          include: {
            organizer: { select: { id: true, name: true, avatar: true, verified: true } },
            organization: { select: { name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
    }),
    listUserMatches(userId),
    // Win/loss comes from completed fixtures, counted in SQL.
    userRecord(userId),
  ])

  if (!user) return null

  const joinedTournaments: Tournament[] = registrations.map((reg) => ({
    id: reg.tournament.id,
    title: reg.tournament.title,
    sport: reg.tournament.sport,
    category: reg.tournament.category as Tournament['category'],
    location: reg.tournament.location,
    date: reg.tournament.date,
    endDate: reg.tournament.endDate || undefined,
    time: reg.tournament.time,
    participants: reg.tournament._count.participants,
    maxParticipants: reg.tournament.maxParticipants,
    posterUrl: tournamentPoster(reg.tournament) ?? '',
    organizer: {
      id: reg.tournament.organizer.id,
      name: reg.tournament.organization?.name ?? reg.tournament.organizer.name,
      avatar: reg.tournament.organizer.avatar,
      verified: reg.tournament.organizer.verified,
    },
    status: reg.tournament.status as Tournament['status'],
    featured: reg.tournament.featured,
    prizePool: reg.tournament.prizePool || undefined,
    entryFee: reg.tournament.entryFee || undefined,
  }))

  const today = new Date().toISOString().slice(0, 10)

  const profile: User = {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio || '',
    university: user.university || undefined,
    location: user.location,
    globalRank: user.globalRank,
    totalPoints: user.totalPoints,
    joinedDate: user.joinedDate,
    joinedTournaments: joinedTournaments.length,
    wins: record.wins,
    losses: record.losses,
    achievements: user.achievements.map((ach) => ({
      ...ach,
      rarity: ach.rarity as Achievement['rarity'],
    })),
    sportRanks: user.sportRanks.map((sr) => ({
      ...sr,
      tier: sr.tier as SportRank['tier'],
    })),
  }

  return {
    profile,
    joinedTournaments,
    upcomingTournaments: joinedTournaments.filter(
      (tournament) => tournament.date >= today && tournament.status !== 'completed'
    ),
    matches,
  }
}

