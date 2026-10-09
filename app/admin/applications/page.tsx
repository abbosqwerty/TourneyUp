import { db } from '@/lib/db'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplicationsClient } from './applications-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Tashkilot arizalari', robots: { index: false } }

export default async function ApplicationsPage() {
  let applications: Awaited<ReturnType<typeof load>> = []
  let failed = false

  try {
    applications = await load()
  } catch (error) {
    console.error('applications page failed', error)
    failed = true
  }

  if (failed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Arizalarni olib bo‘lmadi</CardTitle>
          <CardDescription>Baza bilan aloqa yo‘q. Keyinroq qayta urinib ko‘ring.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <ApplicationsClient applications={applications} />
}

async function load() {
  const rows = await db.organizationApplication.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      orgName: true,
      contactName: true,
      email: true,
      phone: true,
      website: true,
      location: true,
      description: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      reviewedBy: { select: { name: true } },
      organization: { select: { id: true, slug: true, owner: { select: { username: true } } } },
    },
  })

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }))
}
