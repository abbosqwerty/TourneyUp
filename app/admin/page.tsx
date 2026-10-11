import Link from 'next/link'
import { Building2, FileClock, Trophy, UserCheck, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { RecalculatePointsButton } from './recalculate-points'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/time'
import { getI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.admin.overview.meta_title, robots: { index: false } }
}

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
  const { dict, locale } = await getI18n()
  const t = dict.admin.overview
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
          <CardTitle>{t.load_failed}</CardTitle>
          <CardDescription>{dict.admin.db_unavailable}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const stats = [
    { label: t.stat_pending, value: data.pendingApplications, icon: FileClock, href: '/admin/applications' },
    { label: t.stat_organizations, value: data.organizations, icon: Building2, href: '/admin/organizations' },
    { label: t.stat_users, value: data.users, icon: Users, href: '/admin/users' },
    { label: t.stat_tournaments, value: data.tournaments, icon: Trophy, href: '/admin/tournaments' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.subtitle}
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
              <strong>{data.suspended}</strong> {t.suspended_notice(data.suspended)}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/organizations">{t.view}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{t.new_applications}</CardTitle>
              <CardDescription>{t.new_applications_desc}</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/applications">{dict.admin.all}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentApplications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.no_new_applications}</p>
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
                    {formatDate(application.createdAt, locale)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{t.recent_organizations}</CardTitle>
              <CardDescription>{t.recent_organizations_desc}</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/organizations">{dict.admin.all}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrganizations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.no_organizations}</p>
            ) : (
              data.recentOrganizations.map((organization) => (
                <div
                  key={organization.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{organization.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{organization.owner.username} · {dict.admin.tournaments_count(organization._count.tournaments)}
                    </p>
                  </div>
                  <Badge variant={organization.status === 'ACTIVE' ? 'secondary' : 'destructive'} className="shrink-0">
                    {organization.status === 'ACTIVE' ? (
                      <>
                        <UserCheck className="mr-1 h-3 w-3" aria-hidden /> {dict.admin.active}
                      </>
                    ) : (
                      dict.admin.suspended
                    )}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.points_title}</CardTitle>
          <CardDescription>
            {t.points_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecalculatePointsButton />
        </CardContent>
      </Card>
    </div>
  )
}
