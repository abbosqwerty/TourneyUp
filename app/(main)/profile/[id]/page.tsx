import { notFound } from 'next/navigation'
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
import { cn } from '@/lib/utils';
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await db.user.findFirst({
    where: { OR: [{ id }, { username: id }] },
    select: { name: true },
  })
  if (!user) return { title: 'Profil topilmadi' }
  return { title: `${user.name} — Profil` }
}

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

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getCurrentUser()

  let data: Awaited<ReturnType<typeof load>> | null = null
  try {
    data = await load(id)
  } catch (error) {
    console.error('user profile page failed', error)
  }

  if (data === null) {
    const exists = await db.user.findFirst({ where: { OR: [{ id }, { username: id }] }, select: { id: true } })
    if (!exists) notFound()
    return <DbErrorCard message="Profilni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />
  }

  const { profile, joinedTournaments, upcomingTournaments, matches } = data
  const isOwnProfile = session?.id === profile.id

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-3.5 sm:px-4 py-4 sm:py-6 theme-profile bg-background text-foreground overflow-x-hidden min-w-0">
      <ProfileHeader user={profile} isOwnProfile={isOwnProfile} />

      <Tabs defaultValue="history" className="w-full min-w-0">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-none flex-nowrap max-w-full">
          <TabsTrigger value="history" className="gap-2 shrink-0 text-xs sm:text-sm">
            <Swords className="h-4 w-4" aria-hidden />
            O‘yin tarixi
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="gap-2 shrink-0 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" aria-hidden />
            Turnirlar
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2 shrink-0 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" aria-hidden />
            Kutilayotgan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 sm:mt-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Oxirgi o‘yinlar</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {matches.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Hali o‘yin natijasi kiritilmagan.
                </p>
              ) : (
                <ul className="space-y-3 sm:space-y-4">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 rounded-xl border border-border p-3 sm:p-4 transition-colors hover:border-primary/50 min-w-0"
                    >
                      <div className="flex min-w-0 items-start sm:items-center gap-3">
                        <Badge variant="outline" className={cn("shrink-0 text-[11px] sm:text-xs", resultStyles[match.result])}>
                          {match.result === 'win' ? (
                            <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
                          ) : null}
                          {match.result === 'loss' ? (
                            <TrendingDown className="mr-1 h-3 w-3" aria-hidden />
                          ) : null}
                          {resultLabels[match.result]}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-sm sm:text-base">{match.tournamentTitle}</p>
                          <p className="truncate text-xs sm:text-sm text-muted-foreground">
                            {match.stage ? `${match.stage} · ` : ''}
                            {match.opponent} bilan
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-border/40 shrink-0">
                        <p className="text-base sm:text-lg font-bold">{match.score}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
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
              {isOwnProfile ? 'Hali hech qanday turnirga yozilmagansiz.' : 'Hali hech qanday turnirda qatnashmagan.'}
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

async function load(userIdOrUsername: string) {
  const user = await db.user.findFirst({
    where: { OR: [{ id: userIdOrUsername }, { username: userIdOrUsername }] },
    include: { achievements: true, sportRanks: true },
  })

  if (!user) return null
  const userId = user.id

  const [registrations, matches, record] = await Promise.all([
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
    userRecord(userId),
  ])

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
