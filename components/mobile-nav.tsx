'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, Home, MessageSquare, Plus, Shirt, Trophy, User, Users, LogIn, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'

interface MobileNavProps {
  role?: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN' | null
  unreadCount?: number
  staffAssignmentCount?: number
}

export function MobileNav({ role = null, unreadCount = 0, staffAssignmentCount = 0 }: MobileNavProps) {
  const pathname = usePathname()
  const { dict } = useLanguage()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const isOrganization = role === 'ORGANIZATION'

    const navItems = [
    { href: '/feed', label: dict.nav.feed, icon: Home, show: true },
    { href: '/results', label: dict.nav.matches, icon: Activity, show: true, hasLiveDot: true },
    { href: '/create', label: dict.nav.create, icon: Plus, show: isOrganization, isAction: true },
    { href: '/rankings', label: dict.nav.rankings, icon: BarChart3, show: !isOrganization },
    { href: '/teams', label: dict.nav.teams, icon: Shirt, show: role === 'USER' },
    { href: '/messages', label: dict.nav.messages, icon: MessageSquare, show: Boolean(role), badge: unreadCount },
    { href: '/staff', label: dict.nav.my_role, icon: Users, show: staffAssignmentCount > 0 },
    { href: '/dashboard', label: dict.nav.dashboard, icon: Trophy, show: isOrganization },
    { href: '/profile', label: dict.nav.profile, icon: User, show: Boolean(role) },
    { href: '/login', label: dict.auth.login_button, icon: LogIn, show: !role },
    { href: '/register', label: dict.auth.register_button, icon: UserPlus, show: !role },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-16 items-center justify-around gap-0.5 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if ('isAction' in item && item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-6 flex shrink-0 flex-col items-center justify-center"
                aria-label={item.label}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg glow-primary">
                  <Icon className="h-6 w-6 text-primary-foreground" aria-hidden />
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden />
                {'hasLiveDot' in item && item.hasLiveDot ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-destructive" />
                ) : null}
                {'badge' in item && item.badge ? (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate text-[10px] font-medium leading-tight min-[400px]:text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
