import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.admin.tournaments.meta_title, robots: { index: false } }
}

export default async function AdminTournamentsPage() {
  const { dict } = await getI18n()
  const t = dict.admin.tournaments
  let tournaments: Awaited<ReturnType<typeof load>> = []
  let failed = false

  try {
    tournaments = await load()
  } catch (error) {
    console.error('admin tournaments failed', error)
    failed = true
  }

  if (failed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.load_failed}</CardTitle>
          <CardDescription>{dict.admin.db_unavailable_short}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t.empty}
            </CardContent>
          </Card>
        ) : (
          tournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">{tournament.title}</CardTitle>
                  <CardDescription className="truncate">
                    {tournament.organization?.name ?? tournament.organizer.name} · {tournament.sport}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    tournament.status === 'registration_open'
                      ? 'default'
                      : tournament.status === 'cancelled'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="shrink-0"
                >
                  {dict.status[tournament.status]}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    {tournament.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {tournament.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {tournament._count.participants} / {tournament.maxParticipants}
                  </span>
                  <span>
                    {t.active_staff} <strong className="text-foreground">{tournament.activeStaff}</strong>
                  </span>
                </div>

                <Button asChild size="sm" variant="outline">
                  <Link href={`/tournament/${tournament.id}`}>{t.view}</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

async function load() {
  const rows = await db.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      sport: true,
      date: true,
      location: true,
      status: true,
      maxParticipants: true,
      organizer: { select: { name: true } },
      organization: { select: { name: true } },
      _count: { select: { participants: true } },
      staff: { where: { revokedAt: null }, select: { id: true } },
    },
  })

  return rows.map(({ staff, ...row }) => ({ ...row, activeStaff: staff.length }))
}
