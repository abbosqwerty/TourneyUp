'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Activity,
  BarChart3,
  Bookmark,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  Shirt,
  Shield,
  Sun,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/lib/auth-actions'
import { NotificationBell } from '@/components/notification-bell'
import { LogoIcon } from '@/components/logo-icon'

// import { LanguageToggle } from '@/components/language-toggle' // removed as language toggle is only in Settings
import { useLanguage } from '@/lib/i18n/language-context'

export type NavbarUser = {
  id: string
  name: string
  username: string
  avatar: string
  role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN'
}

interface NavbarProps {
  currentUser: NavbarUser | null
  /** Live staff grants — controls whether the Staff panel link is shown. */
  staffAssignmentCount?: number
  /** Real unread channel posts; no placeholder number. */
  unreadCount?: number
  /** Real unread in-app notifications. */
  notificationCount?: number
}

export function Navbar({
  currentUser,
  staffAssignmentCount = 0,
  unreadCount = 0,
  notificationCount = 0,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { dict } = useLanguage()
  const [isLoggingOut, startLogout] = useTransition()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const isOrganization = currentUser?.role === 'ORGANIZATION'
  const isAdmin = currentUser?.role === 'SUPER_ADMIN'

  const navLinks = [
    { href: '/feed', label: dict.nav.tournaments, icon: Home, show: true },
    { href: '/rankings', label: dict.nav.rankings, icon: BarChart3, show: true },
    { href: '/results', label: dict.nav.matches, icon: Activity, show: true, isLive: true },
    { href: '/teams', label: dict.nav.teams, icon: Shirt, show: currentUser?.role === 'USER' },
    {
      href: '/messages',
      label: dict.nav.messages,
      icon: MessageSquare,
      show: Boolean(currentUser),
      badge: unreadCount,
    },
    { href: '/staff', label: dict.nav.my_role, icon: Users, show: staffAssignmentCount > 0 },
    { href: '/dashboard', label: dict.nav.dashboard, icon: LayoutDashboard, show: isOrganization },
    { href: '/admin', label: dict.nav.admin, icon: Shield, show: isAdmin },
  ].filter((link) => link.show)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () =>
    startLogout(async () => {
      const result = await logout()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      window.location.href = '/'
    })

  return (
    <header className="sticky top-0 z-50 w-full border-b theme-header border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <LogoIcon className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight">
            Tourney<span className="text-primary">Up</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-0.5 md:flex lg:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              aria-label={link.label}
              className={cn(
                'relative flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3',
                isActive(link.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden />
              <span className="hidden lg:inline">{link.label}</span>
              {'isLive' in link && link.isLive ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive lg:hidden" aria-hidden />
              ) : null}
              {'isLive' in link && link.isLive ? (
                <span className="hidden h-4 items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-1.5 text-[10px] font-extrabold text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  {dict.chrome.navbar.live}
                </span>
              ) : null}
              {'badge' in link && link.badge ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground lg:static">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1 md:flex lg:gap-2">


          {currentUser ? <NotificationBell unreadCount={notificationCount} /> : null}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dict.nav.theme}>
            {mounted ? (
              resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
            ) : (
              <span className="h-5 w-5" />
            )}
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/feed">
              <Search className="h-5 w-5" />
              <span className="sr-only">{dict.common.search}</span>
            </Link>
          </Button>

          {isOrganization ? (
            <Button size="sm" className="gap-2" asChild>
              <Link href="/create" aria-label={dict.nav.create}>
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">{dict.nav.create}</span>
              </Link>
            </Button>
          ) : null}

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-border">
                    <AvatarImage src={currentUser.avatar} alt={dict.chrome.navbar.avatar_alt(currentUser.name)} />
                    <AvatarFallback>{currentUser.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">{dict.chrome.navbar.account_menu}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {dict.nav.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved" className="cursor-pointer">
                    <Bookmark className="mr-2 h-4 w-4" />
                    {dict.nav.saved}
                  </Link>
                </DropdownMenuItem>
                {staffAssignmentCount > 0 ? (
                  <DropdownMenuItem asChild>
                    <Link href="/staff" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      {dict.nav.my_role}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isOrganization ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {dict.nav.dashboard}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      {dict.nav.admin}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {dict.nav.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {dict.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link href="/register">{dict.nav.register}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">{dict.nav.login}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile top right: Language toggle and notification bell only. Navigation is handled by bottom bar */}
                {/* Mobile top right: Notification bell only */}
        <div className="flex items-center gap-1.5 md:hidden">
          {currentUser ? <NotificationBell unreadCount={notificationCount} /> : null}
        </div>
      </div>
    </header>
  )
}

