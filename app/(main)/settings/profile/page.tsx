import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DbErrorCard } from '@/components/db-error-card'
import { ProfileForm, type ProfileFormValues } from './profile-form'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Profilni tahrirlash', robots: { index: false } }

export default async function EditProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsettings%2Fprofile')

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

  if (!initial) return <DbErrorCard message="Profil ma‘lumotlarini yuklab bo‘lmadi." />

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Sozlamalarga qaytish">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Profilni tahrirlash</h1>
          <p className="text-sm text-muted-foreground">Ism, username, bio va avatar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ma‘lumotlar</CardTitle>
          <CardDescription>
            Rol, reyting va tasdiqlash belgisi platforma tomonidan boshqariladi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initial={initial} />
        </CardContent>
      </Card>
    </div>
  )
}
