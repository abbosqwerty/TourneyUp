"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Menu, Moon, Plus, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/feed', label: 'Tournaments' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/dashboard', label: 'Organize' },
]

interface LandingNavbarProps {
  currentUser?: { id: string; name: string; username: string; avatar: string } | null
}

function PixelMark() {
  return <span aria-hidden className="grid h-6 w-6 grid-cols-3 gap-[2px]">
    {[0, 1, 2, 3, 4, 5, 7].map((square) => <i key={square} className="bg-current" />)}
  </span>
}

export function LandingNavbar({ currentUser }: LandingNavbarProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const tournamentHref = currentUser ? '/feed' : '/login?next=/feed'
  const resolvedNavLinks = resolvedNavLinks.map((link) => link.href === '/feed' ? { ...link, href: tournamentHref } : link)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-[-0.06em]">
          <span className="text-primary"><PixelMark /></span>
          <span>tourney up</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {resolvedNavLinks.map((link) => <Link key={link.href} href={link.href} className={cn('text-sm font-medium transition-colors hover:text-primary', isActive(link.href) ? 'text-primary' : 'text-muted-foreground')}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle color theme">
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="ghost" className="rounded-full px-4 text-sm"><Link href={currentUser ? '/dashboard' : '/login'}>{currentUser ? 'Dashboard' : 'Sign in'}</Link></Button>
          <Button asChild className="rounded-full px-4 text-sm"><Link href="/create"><Plus className="mr-1 h-4 w-4" /> Create</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {mobileMenuOpen && <nav className="border-t border-border px-5 py-4 md:hidden">
        {resolvedNavLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground">{link.label}</Link>)}
        <div className="flex gap-2 pt-3">
          <Button variant="outline" size="sm" onClick={toggleTheme}>Theme</Button>
          <Button asChild size="sm"><Link href="/create">Create</Link></Button>
        </div>
      </nav>}
    </header>
  )
}
