import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, MessageSquare, ShieldCheck, Trophy, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { STAFF_ROLE_DESCRIPTIONS, STAFF_ROLE_LABELS } from '@/lib/staff-labels'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mening rollarim', robots: { index: false } }

const STATUS_LABELS = {
  upcoming: 'Kutilmoqda',
  registration_open: 'Ro‘yxat ochiq',
  ongoing: 'Davom etmoqda',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
} as const

/**
 * Panel for users holding a temporary tournament role. What they can open
 * here mirrors exactly what the grant allows — and the grant disappears
 * when the tournament closes.
 */
export default async function StaffPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fstaff')

  let grants: Awaited<ReturnType<typeof load>> = { active: [], past: [] }
  try {
    grants = await load(user.id)
  } catch (error) {
    console.error('staff page failed', error)
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Ma‘lumotni olib bo‘lmadi</CardTitle>
            <CardDescription>Baza bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Mening rollarim</h1>
        <p className="text-sm text-muted-foreground">
          Tashkilotlar sizga bergan vaqtinchalik ruxsatlar. Turnir yakunlanganda ruxsat avtomatik
          tugaydi.
        </p>
      </div>

      {grants.active.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">Faol rol yo‘q</p>
            <p className="text-sm text-muted-foreground">
              Tashkilot sizni turnirga admin, organizer yoki support sifatida tayinlasa, bu yerda
              ko‘rinadi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grants.active.map((grant) => {
            const canManageParticipants = grant.role === 'ADMIN' || grant.role === 'ORGANIZER'
            const canManageStaff = grant.role === 'ADMIN'

            return (
              <Card key={grant.id}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">{grant.tournament.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" aria-hidden />
                        {grant.tournament.sport}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        {grant.tournament.date}
                      </span>
                      <span>{STATUS_LABELS[grant.tournament.status]}</span>
                    </CardDescription>
                  </div>
                  <Badge className="shrink-0 gap-1">
                    <ShieldCheck className="h-3 w-3" aria-hidden />
                    {STAFF_ROLE_LABELS[grant.role]}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    {STAFF_ROLE_DESCRIPTIONS[grant.role]}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/tournament/${grant.tournament.id}`}>Turnir sahifasi</Link>
                    </Button>
                    {canManageParticipants ? (
                      <Button size="sm" variant="outline" className="gap-2" asChild>
                        <Link href="/dashboard/participants">
                          <Users className="h-4 w-4" aria-hidden />
                          Ishtirokchilar
                        </Link>
                      </Button>
                    ) : null}
                    {canManageStaff ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/tournaments/${grant.tournament.id}/staff`}>Xodimlar</Link>
                      </Button>
                    ) : null}
                    {grant.tournament.channelId ? (
                      <Button size="sm" variant="outline" className="gap-2" asChild>
                        <Link href={`/messages/${grant.tournament.channelId}`}>
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          Kanal
                        </Link>
                      </Button>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {new Date(grant.grantedAt).toLocaleDateString('uz-UZ')} dan beri
                    {grant.grantedByName ? ` · ${grant.grantedByName} tayinlagan` : ''}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {grants.past.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tugagan rollar</CardTitle>
            <CardDescription>Bu turnirlar uchun ruxsatingiz endi yo‘q</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {grants.past.map((grant) => (
              <div
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{grant.tournament.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {STAFF_ROLE_LABELS[grant.role]}
                    {grant.revokedAt ? ` · ${new Date(grant.revokedAt).toLocaleDateString('uz-UZ')}` : ''}
                    {grant.revokeReason ? ` · ${grant.revokeReason}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/tournament/${grant.tournament.id}`}>Ko‘rish</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

async function load(userId: string) {
  const rows = await db.tournamentStaff.findMany({
    where: { userId },
    orderBy: [{ revokedAt: 'asc' }, { grantedAt: 'desc' }],
    select: {
      id: true,
      role: true,
      grantedAt: true,
      revokedAt: true,
      revokeReason: true,
      grantedBy: { select: { name: true } },
      tournament: {
        select: {
          id: true,
          title: true,
          sport: true,
          date: true,
          status: true,
          channel: { select: { id: true } },
        },
      },
    },
  })

  const mapped = rows.map((row) => ({
    id: row.id,
    role: row.role,
    grantedAt: row.grantedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokeReason: row.revokeReason,
    grantedByName: row.grantedBy?.name ?? null,
    tournament: {
      id: row.tournament.id,
      title: row.tournament.title,
      sport: row.tournament.sport,
      date: row.tournament.date,
      status: row.tournament.status,
      channelId: row.tournament.channel?.id ?? null,
    },
  }))

  return {
    active: mapped.filter((grant) => !grant.revokedAt),
    past: mapped.filter((grant) => grant.revokedAt),
  }
}
