'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, startLogout] = useTransition()
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const isOrganization = currentUser?.role === 'ORGANIZATION'
  const isAdmin = currentUser?.role === 'SUPER_ADMIN'

  const navLinks = [
    { href: '/feed', label: 'Turnirlar', icon: Home, show: true },
    { href: '/rankings', label: 'Reyting', icon: BarChart3, show: true },
    { href: '/results', label: 'Natijalar', icon: Activity, show: true, isLive: true },
    {
      href: '/messages',
      label: 'Kanallar',
      icon: MessageSquare,
      show: Boolean(currentUser),
      badge: unreadCount,
    },
    { href: '/staff', label: 'Mening rolim', icon: Users, show: staffAssignmentCount > 0 },
    { href: '/dashboard', label: 'Boshqaruv', icon: LayoutDashboard, show: isOrganization },
    { href: '/admin', label: 'Admin', icon: Shield, show: isAdmin },
  ].filter((link) => link.show)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () =>
    startLogout(async () => {
      const result = await logout()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setMobileMenuOpen(false)
      router.replace('/')
      router.refresh()
    })

  return (
    <header className="sticky top-0 z-50 w-full border-b theme-header border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Tourney<span className="text-primary">Up</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden />
              <span>{link.label}</span>
              {'isLive' in link && link.isLive ? (
                <span className="flex h-4 items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-1.5 text-[10px] font-extrabold text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  LIVE
                </span>
              ) : null}
              {'badge' in link && link.badge ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {currentUser ? <NotificationBell unreadCount={notificationCount} /> : null}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/feed">
              <Search className="h-5 w-5" />
              <span className="sr-only">Turnir qidirish</span>
            </Link>
          </Button>

          {isOrganization ? (
            <Button size="sm" className="gap-2" asChild>
              <Link href="/create">
                <Plus className="h-4 w-4" aria-hidden />
                Turnir
              </Link>
            </Button>
          ) : null}

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-border">
                    <AvatarImage src={currentUser.avatar} alt={`${currentUser.name} avatari`} />
                    <AvatarFallback>{currentUser.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Akkaunt menyusi</span>
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
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved" className="cursor-pointer">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Saqlanganlar
                  </Link>
                </DropdownMenuItem>
                {staffAssignmentCount > 0 ? (
                  <DropdownMenuItem asChild>
                    <Link href="/staff" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Mening rollarim
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isOrganization ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Tashkilot paneli
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Super admin
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Sozlamalar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link href="/register">Ro‘yxatdan o‘tish</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">Kirish</Link>
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Menyuni ochish</span>
        </Button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto space-y-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-3">
                  <link.icon className="h-5 w-5" aria-hidden />
                  {link.label}
                </span>
                {'badge' in link && link.badge ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                ) : null}
              </Link>
            ))}

            <div className="space-y-2 border-t border-border pt-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={toggleTheme}>
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {resolvedTheme === 'dark' ? 'Yorug‘ rejim' : 'Tungi rejim'}
              </Button>

              {currentUser ? (
                <>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="h-4 w-4" />
                      Sozlamalar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Chiqish
                  </Button>
                </>
              ) : (
                <Button size="sm" className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Kirish
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

