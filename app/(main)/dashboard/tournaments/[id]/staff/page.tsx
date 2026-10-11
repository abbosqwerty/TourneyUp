import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { listTournamentStaff } from '@/lib/staff'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getI18n } from '@/lib/i18n/server'
import { formatDate } from '@/lib/time'
import { StaffClient } from './staff-client'
import { sportLabel } from '@/lib/sports'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.dashboard.staff.meta_title, robots: { index: false } }
}

export default async function TournamentStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/tournaments/${id}/staff`)}`)

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, title: true, sport: true, date: true, status: true },
  })
  if (!tournament) notFound()
  const { dict, locale } = await getI18n()
  const d = dict.dashboard

  const ability = await getTournamentAbility(user.id, id)
  if (!ability.canManageStaff) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{d.no_access}</CardTitle>
            <CardDescription>
              {d.staff.no_access_desc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/tournament/${id}`}>{d.back_to_tournament}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const staff = await listTournamentStaff(id)
  const isClosed = tournament.status === 'completed' || tournament.status === 'cancelled'

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/dashboard" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {d.back_to_panel}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{tournament.title}</h1>
        <p className="text-sm text-muted-foreground">
          {sportLabel(dict, tournament.sport)} · {formatDate(tournament.date, locale)} · {d.staff.manage_subtitle}
        </p>
      </div>

      <StaffClient
        tournamentId={id}
        isClosed={isClosed}
        staff={staff.map((grant) => ({
          id: grant.id,
          role: grant.role,
          grantedAt: grant.grantedAt.toISOString(),
          revokedAt: grant.revokedAt?.toISOString() ?? null,
          revokeReason: grant.revokeReason,
          user: grant.user,
          grantedByName: grant.grantedBy?.name ?? null,
        }))}
      />
    </div>
  )
}
