import Link from 'next/link'
import { Building2, FileClock, Trophy, UserCheck, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Super admin', robots: { index: false } }

async function loadOverview() {
  const [pendingApplications, organizations, suspended, users, tournaments, openTournaments, recentApplications, recentOrganizations] =
    await Promise.all([
      db.organizationApplication.count({ where: { status: 'PENDING' } }),
      db.organization.count(),
      db.organization.count({ where: { status: 'SUSPENDED' } }),
      db.user.count({ where: { role: 'USER' } }),
      db.tournament.count(),
      db.tournament.count({ where: { status: 'registration_open' } }),
      db.organizationApplication.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orgName: true, contactName: true, email: true, createdAt: true },
      }),
      db.organization.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          owner: { select: { username: true } },
          _count: { select: { tournaments: true } },
        },
      }),
    ])

  return {
    pendingApplications,
    organizations,
    suspended,
    users,
    tournaments,
    openTournaments,
    recentApplications,
    recentOrganizations,
  }
}

export default async function AdminOverviewPage() {
  let data: Awaited<ReturnType<typeof loadOverview>> | null = null
  try {
    data = await loadOverview()
  } catch (error) {
    console.error('admin overview failed', error)
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ma‘lumotni olib bo‘lmadi</CardTitle>
          <CardDescription>Baza bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const stats = [
    { label: 'Kutilayotgan arizalar', value: data.pendingApplications, icon: FileClock, href: '/admin/applications' },
    { label: 'Tashkilotlar', value: data.organizations, icon: Building2, href: '/admin/organizations' },
    { label: 'Foydalanuvchilar', value: data.users, icon: Users, href: '/admin/users' },
    { label: 'Turnirlar', value: data.tournaments, icon: Trophy, href: '/admin/tournaments' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Platforma boshqaruvi</h1>
        <p className="text-sm text-muted-foreground">
          Tashkilot arizalarini ko‘rib chiqing, akkauntlarni boshqaring va turnirlarni kuzatib boring.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl font-bold leading-tight">{stat.value}</span>
                  <span className="block truncate text-xs text-muted-foreground">{stat.label}</span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data.suspended > 0 ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              <strong>{data.suspended}</strong> ta tashkilot to‘xtatilgan holatda.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/organizations">Ko‘rish</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Yangi arizalar</CardTitle>
              <CardDescription>Ko‘rib chiqilishi kutilayotgan tashkilotlar</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/applications">Hammasi</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentApplications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Yangi ariza yo‘q</p>
            ) : (
              data.recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{application.orgName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {application.contactName} · {application.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {application.createdAt.toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Oxirgi tashkilotlar</CardTitle>
              <CardDescription>Platformadagi faol akkauntlar</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/organizations">Hammasi</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrganizations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Hali tashkilot yo‘q</p>
            ) : (
              data.recentOrganizations.map((organization) => (
                <div
                  key={organization.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{organization.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{organization.owner.username} · {organization._count.tournaments} turnir
                    </p>
                  </div>
                  <Badge variant={organization.status === 'ACTIVE' ? 'secondary' : 'destructive'} className="shrink-0">
                    {organization.status === 'ACTIVE' ? (
                      <>
                        <UserCheck className="mr-1 h-3 w-3" aria-hidden /> Faol
                      </>
                    ) : (
                      'To‘xtatilgan'
                    )}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
