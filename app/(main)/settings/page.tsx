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
import { LanguageToggle } from '@/components/language-toggle'
import { getI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.account.settings.meta_title, robots: { index: false } }
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsettings')
  const { dict } = await getI18n()
  const t = dict.account.settings

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6 theme-settings bg-background text-foreground">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {user.mustChangePassword ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-warning" aria-hidden />
              {t.must_change}
            </p>
            <Button size="sm" asChild>
              <Link href="/settings/password">{t.change_password}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.account}</CardTitle>
          <CardDescription>{t.account_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t.name}</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t.username}</span>
            <span className="font-mono">@{user.username}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t.email}</span>
            <span className="truncate font-mono">{user.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t.role}</span>
            <Badge variant="outline">{t.roles[user.role]}</Badge>
          </div>
          <Button variant="outline" className="mt-2 w-full gap-2" asChild>
            <Link href="/settings/profile">
              <UserPen className="h-4 w-4" aria-hidden />
              {t.edit_profile}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.security}</CardTitle>
          <CardDescription>{t.security_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/settings/password">
              <KeyRound className="h-4 w-4" aria-hidden />
              {t.change_password}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.appearance}</CardTitle>
          <CardDescription>{t.appearance_desc}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">{t.toggle_theme}</span>
          <LanguageToggle showLabel={true} size="default" variant="default" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.session}</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton variant="destructive" />
        </CardContent>
      </Card>

      {user.role === 'USER' ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t.delete_title}</CardTitle>
            <CardDescription>
              {t.delete_desc}{' '}
              <Link href="/privacy" className="underline">
                {t.privacy_link}
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

