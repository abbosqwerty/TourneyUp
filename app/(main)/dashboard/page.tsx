import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getI18n } from '@/lib/i18n/server'
import { formatDate } from '@/lib/time'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsGrid } from '@/components/stats-card'
import { StoryComposer } from '@/components/stories/story-composer'
import { TournamentStatusSelect } from './tournament-status-select'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.dashboard.home.meta_title, robots: { index: false } }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fdashboard')
  if (user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN') redirect('/feed')
  const { dict, locale } = await getI18n()
  const d = dict.dashboard
  const h = d.home

  let data: Awaited<ReturnType<typeof load>>
  try {
    data = await load(user.id, user.role)
  } catch (error) {
    console.error('dashboard failed', error)
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{d.load_failed_title}</CardTitle>
            <CardDescription>{d.db_unavailable}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { organization, tournaments, pendingCount, approvedCount, rejectedCount, activity, activeStaff } = data

  const totalParticipants = tournaments.reduce((sum, t) => sum + t.participants, 0)
  const activeTournaments = tournaments.filter(
    (t) => t.status === 'registration_open' || t.status === 'ongoing'
  ).length

  const stats = [
    { title: h.stat_total, value: tournaments.length, icon: Trophy },
    { title: h.stat_active, value: activeTournaments, icon: Calendar },
    { title: h.stat_participants, value: totalParticipants.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'uz-UZ'), icon: Users },
    { title: h.stat_staff, value: activeStaff.length, icon: ShieldCheck },
  ]

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6 theme-dash bg-background text-foreground">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={user.avatar} alt={h.logo_alt(user.name)} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{organization?.name ?? user.name}</h1>
              {user.verified ? <CheckCircle className="h-5 w-5 text-primary" aria-label={h.verified} /> : null}
            </div>
            <p className="text-muted-foreground">
              {h.subtitle}
              {organization?.status === 'SUSPENDED' ? h.suspended_suffix : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" aria-hidden />
              {h.settings}
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/create">
              <Plus className="h-4 w-4" aria-hidden />
              {h.create_tournament}
            </Link>
          </Button>
        </div>
      </div>

      {organization?.status === 'SUSPENDED' ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            {h.suspended_notice}
          </CardContent>
        </Card>
      ) : null}

      <StatsGrid stats={stats} />

      {organization ? (
        <StoryComposer
          organizationName={organization.name}
          tournaments={tournaments.map((tournament) => ({ id: tournament.id, title: tournament.title }))}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{h.my_tournaments}</CardTitle>
              <CardDescription>{h.my_tournaments_desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" aria-hidden />
                  <p>{h.no_tournaments}</p>
                  <Button asChild className="mt-4">
                    <Link href="/create">{h.create_first}</Link>
                  </Button>
                </div>
              ) : (
                tournaments.map((tournament) => (
                  <div key={tournament.id} className="space-y-3 rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tournament.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" aria-hidden />
                            {formatDate(tournament.date, locale)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" aria-hidden />
                            {tournament.participants}/{tournament.maxParticipants}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" aria-hidden />
                            {h.staff_count(tournament.staffCount)}
                          </span>
                        </div>
                      </div>
                      <Badge variant={tournament.status === 'registration_open' ? 'default' : 'secondary'}>
                        {dict.status[tournament.status]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <TournamentStatusSelect
                        tournamentId={tournament.id}
                        status={tournament.status}
                        drawn={tournament.drawn}
                      />
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/tournaments/${tournament.id}/matches`}>{h.matches}</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/tournaments/${tournament.id}/staff`}>{h.staff}</Link>
                      </Button>
                      {tournament.channelId ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/messages/${tournament.channelId}`}>{h.channel}</Link>
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/tournament/${tournament.id}`}>{h.view}</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{h.recent_activity}</CardTitle>
              <CardDescription>{h.recent_activity_desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{h.no_activity}</p>
              ) : (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{item.name}</span>{' '}
                          <span className="text-muted-foreground">
                            {item.status === 'approved'
                              ? h.activity_approved
                              : item.status === 'rejected'
                                ? h.activity_rejected
                                : h.activity_registered}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{item.tournamentTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{h.quick_actions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" asChild>
                <Link href="/create">
                  <Plus className="h-4 w-4" aria-hidden />
                  {h.create_tournament}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/participants">
                  <Users className="h-4 w-4" aria-hidden />
                  {h.participants}
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/messages">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  {h.channels}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{h.temp_staff}</CardTitle>
              <CardDescription>{h.temp_staff_desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {activeStaff.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {h.no_staff}
                </p>
              ) : (
                <div className="space-y-4">
                  {activeStaff.map((grant) => (
                    <div key={grant.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={grant.user.avatar} alt={d.avatar_alt(grant.user.name)} />
                        <AvatarFallback>{grant.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{grant.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {d.roles[grant.role]} · {grant.tournament.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{h.registrations}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{h.pending}</span>
                <Badge variant="outline">{pendingCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{h.approved}</span>
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  {approvedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{h.rejected}</span>
                <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                  {rejectedCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function load(userId: string, role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN') {
  const organization = await db.organization.findUnique({
    where: { ownerId: userId },
    select: { id: true, name: true, status: true },
  })

  const where =
    role === 'SUPER_ADMIN' && !organization
      ? {}
      : { OR: [{ organizerId: userId }, ...(organization ? [{ organizationId: organization.id }] : [])] }

  // One query with `_count` instead of a count per tournament.
  const tournamentRows = await db.tournament.findMany({
    where,
    orderBy: { date: 'asc' },
    select: {
      id: true,
      title: true,
      date: true,
      status: true,
      maxParticipants: true,
      drawGeneratedAt: true,
      channel: { select: { id: true } },
      _count: { select: { participants: true, staff: true } },
    },
  })

  const tournamentIds = tournamentRows.map((tournament) => tournament.id)

  const [statusCounts, activityRows, staffRows] = await Promise.all([
    db.participant.groupBy({
      by: ['status'],
      where: { tournamentId: { in: tournamentIds } },
      _count: { _all: true },
    }),
    db.participant.findMany({
      where: { tournamentId: { in: tournamentIds } },
      orderBy: { registeredAt: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        registeredAt: true,
        tournament: { select: { title: true } },
      },
    }),
    db.tournamentStaff.findMany({
      where: { tournamentId: { in: tournamentIds }, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        role: true,
        user: { select: { name: true, avatar: true } },
        tournament: { select: { title: true } },
      },
    }),
  ])

  const byStatus = (status: string) =>
    statusCounts.find((row) => row.status === status)?._count._all ?? 0

  return {
    organization,
    tournaments: tournamentRows.map((tournament) => ({
      id: tournament.id,
      title: tournament.title,
      date: tournament.date,
      status: tournament.status,
      maxParticipants: tournament.maxParticipants,
      participants: tournament._count.participants,
      staffCount: tournament._count.staff,
      channelId: tournament.channel?.id ?? null,
      drawn: tournament.drawGeneratedAt !== null,
    })),
    pendingCount: byStatus('pending'),
    approvedCount: byStatus('approved'),
    rejectedCount: byStatus('rejected'),
    activeStaff: staffRows,
    activity: activityRows.map((participant) => ({
      id: participant.id,
      name: participant.name,
      status: participant.status,
      tournamentTitle: participant.tournament.title,
    })),
  }
}

