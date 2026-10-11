import { db } from '@/lib/db'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrganizationsClient } from './organizations-client'
import { getI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.admin.organizations.meta_title, robots: { index: false } }
}

async function load() {
  const rows = await db.organization.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      website: true,
      location: true,
      status: true,
      createdAt: true,
      owner: { select: { id: true, username: true, email: true, lastLoginAt: true, mustChangePassword: true } },
      _count: { select: { tournaments: true } },
    },
  })

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    owner: { ...row.owner, lastLoginAt: row.owner.lastLoginAt?.toISOString() ?? null },
  }))
}

export default async function AdminOrganizationsPage() {
  let organizations: Awaited<ReturnType<typeof load>> | null = null
  try {
    organizations = await load()
  } catch (error) {
    console.error('admin organizations failed', error)
  }

  if (!organizations) {
    const { dict } = await getI18n()
    return (
      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.organizations.load_failed}</CardTitle>
          <CardDescription>{dict.admin.db_unavailable}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <OrganizationsClient organizations={organizations} />
}
