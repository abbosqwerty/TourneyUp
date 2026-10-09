'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, Home, MessageSquare, Plus, Trophy, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  role?: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN' | null
  unreadCount?: number
  staffAssignmentCount?: number
}

export function MobileNav({ role = null, unreadCount = 0, staffAssignmentCount = 0 }: MobileNavProps) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const isOrganization = role === 'ORGANIZATION'

  const navItems = [
    { href: '/feed', label: 'Lenta', icon: Home, show: true },
    { href: '/results', label: 'Natija', icon: Activity, show: true, hasLiveDot: true },
    { href: '/create', label: 'Yaratish', icon: Plus, show: isOrganization, isAction: true },
    { href: '/rankings', label: 'Reyting', icon: BarChart3, show: !isOrganization },
    { href: '/messages', label: 'Kanallar', icon: MessageSquare, show: Boolean(role), badge: unreadCount },
    { href: '/staff', label: 'Rolim', icon: Users, show: staffAssignmentCount > 0 },
    { href: '/dashboard', label: 'Panel', icon: Trophy, show: isOrganization },
    { href: '/profile', label: 'Profil', icon: User, show: Boolean(role) },
  ].filter((item) => item.show)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if ('isAction' in item && item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-6 flex flex-col items-center justify-center"
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
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors',
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
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
