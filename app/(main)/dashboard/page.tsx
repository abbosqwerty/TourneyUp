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
import { STAFF_ROLE_LABELS } from '@/lib/staff-labels'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsGrid } from '@/components/stats-card'
import { StoryComposer } from '@/components/stories/story-composer'
import { TournamentStatusSelect } from './tournament-status-select'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Tashkilot paneli', robots: { index: false } }

const STATUS_LABELS = {
  upcoming: 'Kutilmoqda',
  registration_open: 'Ro‘yxat ochiq',
  ongoing: 'Davom etmoqda',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
} as const

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fdashboard')
  if (user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN') redirect('/feed')

  let data: Awaited<ReturnType<typeof load>>
  try {
    data = await load(user.id, user.role)
  } catch (error) {
    console.error('dashboard failed', error)
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Panelni yuklab bo‘lmadi</CardTitle>
            <CardDescription>Baza bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.</CardDescription>
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
    { title: 'Jami turnirlar', value: tournaments.length, icon: Trophy },
    { title: 'Faol turnirlar', value: activeTournaments, icon: Calendar },
    { title: 'Ishtirokchilar', value: totalParticipants.toLocaleString('uz-UZ'), icon: Users },
    { title: 'Faol xodimlar', value: activeStaff.length, icon: ShieldCheck },
  ]

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={user.avatar} alt={`${user.name} logotipi`} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{organization?.name ?? user.name}</h1>
              {user.verified ? <CheckCircle className="h-5 w-5 text-primary" aria-label="Tasdiqlangan" /> : null}
            </div>
            <p className="text-muted-foreground">
              Tashkilot paneli
              {organization?.status === 'SUSPENDED' ? ' · akkaunt to‘xtatilgan' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" aria-hidden />
              Sozlamalar
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/create">
              <Plus className="h-4 w-4" aria-hidden />
              Turnir yaratish
            </Link>
          </Button>
        </div>
      </div>

      {organization?.status === 'SUSPENDED' ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            Akkauntingiz super admin tomonidan to‘xtatilgan. Yangi turnir yaratish va e‘lon qilish
            vaqtincha mumkin emas.
          </CardContent>
        </Card>
      ) : null}

      <StatsGrid stats={stats} />

      {organization ? <StoryComposer organizationName={organization.name} /> : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mening turnirlarim</CardTitle>
              <CardDescription>Statusni o‘zgartiring, xodim tayinlang yoki kanalga o‘ting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" aria-hidden />
                  <p>Hali turnir yo‘q</p>
                  <Button asChild className="mt-4">
                    <Link href="/create">Birinchi turnirni yaratish</Link>
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
                            {tournament.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" aria-hidden />
                            {tournament.participants}/{tournament.maxParticipants}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" aria-hidden />
                            {tournament.staffCount} xodim
                          </span>
                        </div>
                      </div>
                      <Badge variant={tournament.status === 'registration_open' ? 'default' : 'secondary'}>
                        {STATUS_LABELS[tournament.status]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <TournamentStatusSelect tournamentId={tournament.id} status={tournament.status} />
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/tournaments/${tournament.id}/matches`}>O‘yinlar</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/tournaments/${tournament.id}/staff`}>Xodimlar</Link>
                      </Button>
                      {tournament.channelId ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/messages/${tournament.channelId}`}>Kanal</Link>
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/tournament/${tournament.id}`}>Ko‘rish</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oxirgi harakatlar</CardTitle>
              <CardDescription>Turnirlaringizdagi so‘nggi ro‘yxatdan o‘tishlar</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Hali harakat yo‘q</p>
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
                          <span className="text-muted-foreground">{item.label}</span>
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
              <CardTitle>Tezkor amallar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2" asChild>
                <Link href="/create">
                  <Plus className="h-4 w-4" aria-hidden />
                  Turnir yaratish
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard/participants">
                  <Users className="h-4 w-4" aria-hidden />
                  Ishtirokchilar
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/messages">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  Kanallar
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vaqtinchalik xodimlar</CardTitle>
              <CardDescription>Turnir yopilganda ruxsat avtomatik olib tashlanadi</CardDescription>
            </CardHeader>
            <CardContent>
              {activeStaff.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Hali xodim tayinlanmagan
                </p>
              ) : (
                <div className="space-y-4">
                  {activeStaff.map((grant) => (
                    <div key={grant.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={grant.user.avatar} alt={`${grant.user.name} avatari`} />
                        <AvatarFallback>{grant.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{grant.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {STAFF_ROLE_LABELS[grant.role]} · {grant.tournament.title}
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
              <CardTitle>Ro‘yxatlar holati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kutilmoqda</span>
                <Badge variant="outline">{pendingCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasdiqlangan</span>
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  {approvedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rad etilgan</span>
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
    })),
    pendingCount: byStatus('pending'),
    approvedCount: byStatus('approved'),
    rejectedCount: byStatus('rejected'),
    activeStaff: staffRows,
    activity: activityRows.map((participant) => ({
      id: participant.id,
      name: participant.name,
      label:
        participant.status === 'approved'
          ? 'tasdiqlandi'
          : participant.status === 'rejected'
            ? 'rad etildi'
            : 'ro‘yxatdan o‘tdi',
      tournamentTitle: participant.tournament.title,
    })),
  }
}
