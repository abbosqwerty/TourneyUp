'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Trophy, BarChart3, User, Plus } from 'lucide-react'

const navItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/rankings', label: 'Rankings', icon: BarChart3 },
  { href: '/create', label: 'Create', icon: Plus, isAction: true },
  { href: '/dashboard', label: 'Organize', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
]

interface MobileNavProps {
  isOrganizer?: boolean
}

export function MobileNav({ isOrganizer = false }: MobileNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems
          .filter(item => {
            if (item.href === '/create' || item.href === '/dashboard') return isOrganizer
            return true
          })
          .map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg glow-primary">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className={cn("text-xs font-medium", active && "text-primary")}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  )
}
