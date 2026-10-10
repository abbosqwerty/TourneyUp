import Link from 'next/link'
import { redirect } from 'next/navigation'
import { KeyRound, ShieldAlert, UserPen } from 'lucide-react'
import { getCurrentUser } from '@/lib/session'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/logout-button'
import { DeleteAccountDialog } from './delete-account'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Sozlamalar', robots: { index: false } }

const ROLE_LABELS = {
  USER: 'Foydalanuvchi',
  ORGANIZATION: 'Tashkilot',
  SUPER_ADMIN: 'Super admin',
} as const

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsettings')

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6 theme-settings bg-background text-foreground">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground">Akkaunt va ko‘rinish sozlamalari</p>
      </div>

      {user.mustChangePassword ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-warning" aria-hidden />
              Sizga berilgan vaqtinchalik parolni almashtirishingiz kerak.
            </p>
            <Button size="sm" asChild>
              <Link href="/settings/password">Parolni almashtirish</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akkaunt</CardTitle>
          <CardDescription>Profil ma‘lumotlari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Ism</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono">@{user.username}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate font-mono">{user.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Rol</span>
            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
          </div>
          <Button variant="outline" className="mt-2 w-full gap-2" asChild>
            <Link href="/settings/profile">
              <UserPen className="h-4 w-4" aria-hidden />
              Profilni tahrirlash
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Xavfsizlik</CardTitle>
          <CardDescription>Parolni almashtirish barcha qurilmalardagi seansni yopadi</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/settings/password">
              <KeyRound className="h-4 w-4" aria-hidden />
              Parolni almashtirish
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ko‘rinish</CardTitle>
          <CardDescription>Yorug‘ va tungi rejim o‘rtasida almashish</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">Mavzuni almashtirish</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seans</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton variant="destructive" />
        </CardContent>
      </Card>

      {user.role === 'USER' ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Akkauntni o‘chirish</CardTitle>
            <CardDescription>
              Ma‘lumotlaringiz butunlay o‘chadi va qaytarilmaydi. Shartlar:{' '}
              <Link href="/privacy" className="underline">
                maxfiylik siyosati
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

