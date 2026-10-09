import { db } from '@/lib/db'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrganizationsClient } from './organizations-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Tashkilotlar', robots: { index: false } }

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tashkilotlarni olib bo‘lmadi</CardTitle>
          <CardDescription>Baza bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <OrganizationsClient organizations={organizations} />
}
