import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, FileCheck2, LayoutDashboard, Shield, Trophy, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { getI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', key: 'overview', icon: LayoutDashboard },
  { href: '/admin/applications', key: 'applications', icon: FileCheck2 },
  { href: '/admin/organizations', key: 'organizations', icon: Building2 },
  { href: '/admin/users', key: 'users', icon: Users },
  { href: '/admin/tournaments', key: 'tournaments', icon: Trophy },
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const { dict } = await getI18n()

  if (!user) redirect('/login?next=%2Fadmin')
  if (user.role !== 'SUPER_ADMIN') redirect('/feed')

  let pendingCount = 0
  try {
    pendingCount = await db.organizationApplication.count({ where: { status: 'PENDING' } })
  } catch {
    // The badge is decoration — a database hiccup must not blank the panel.
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold">TourneyUp</span>
              <span className="text-xs text-muted-foreground">{dict.admin.brand_subtitle}</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.name}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        <nav className="container mx-auto flex gap-1 overflow-x-auto px-4 pb-2" aria-label={dict.admin.sections_label}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {dict.admin.nav[item.key]}
              {item.href === '/admin/applications' && pendingCount > 0 ? (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 justify-center px-1 text-xs">
                  {pendingCount}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
