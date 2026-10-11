import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DbErrorCard } from '@/components/db-error-card'
import { getI18n } from '@/lib/i18n/server'
import { ProfileForm, type ProfileFormValues } from './profile-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.account.edit_profile.meta_title, robots: { index: false } }
}

export default async function EditProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsettings%2Fprofile')
  const { dict } = await getI18n()
  const t = dict.account.edit_profile

  let initial: ProfileFormValues | null = null
  try {
    const row = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, username: true, bio: true, university: true, location: true, avatar: true },
    })
    if (row) {
      initial = {
        name: row.name,
        username: row.username,
        bio: row.bio,
        university: row.university ?? '',
        location: row.location,
        avatar: row.avatar,
      }
    }
  } catch (error) {
    console.error('edit profile page failed', error)
  }

  if (!initial) return <DbErrorCard message={t.load_error} />

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label={t.back_aria}>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.details}</CardTitle>
          <CardDescription>
            {t.details_desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initial={initial} />
        </CardContent>
      </Card>
    </div>
  )
}
