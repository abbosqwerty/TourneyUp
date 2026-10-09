import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { listTournamentStaff } from '@/lib/staff'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffClient } from './staff-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Turnir xodimlari', robots: { index: false } }

export default async function TournamentStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/tournaments/${id}/staff`)}`)

  const tournament = await db.tournament.findUnique({
    where: { id },
    select: { id: true, title: true, sport: true, date: true, status: true },
  })
  if (!tournament) notFound()

  const ability = await getTournamentAbility(user.id, id)
  if (!ability.canManageStaff) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Ruxsat yo‘q</CardTitle>
            <CardDescription>
              Xodimlarni faqat tashkilot egasi yoki ADMIN roliga ega xodim boshqaradi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/tournament/${id}`}>Turnirga qaytish</Link>
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
          Panelga qaytish
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{tournament.title}</h1>
        <p className="text-sm text-muted-foreground">
          {tournament.sport} · {tournament.date} · vaqtinchalik rollarni boshqarish
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
