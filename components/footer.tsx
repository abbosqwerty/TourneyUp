'use client'

import Link from 'next/link'
import { LogoIcon } from '@/components/logo-icon'
import { useLanguage } from '@/lib/i18n/language-context'

export function Footer() {
  const { dict } = useLanguage()
  const t = dict.chrome.footer

  const columns = [
    {
      title: t.platform,
      links: [
        { label: dict.nav.tournaments, href: '/feed' },
        { label: dict.nav.rankings, href: '/rankings' },
        { label: dict.nav.matches, href: '/results' },
      ],
    },
    {
      title: t.account,
      links: [
        { label: dict.nav.login, href: '/login' },
        { label: dict.nav.register, href: '/register' },
        { label: dict.nav.profile, href: '/profile' },
      ],
    },
    {
      title: t.organizers,
      links: [
        { label: dict.auth.apply_link, href: '/organizations/apply' },
        { label: dict.nav.dashboard, href: '/dashboard' },
        { label: dict.nav.messages, href: '/messages' },
      ],
    },
    {
      title: t.legal,
      links: [
        { label: t.privacy, href: '/privacy' },
        { label: t.terms, href: '/terms' },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-10 w-10 text-foreground" />
              <span className="text-xl font-bold tracking-tight">
                Tourney<span className="text-primary">Up</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t.brand_desc}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <h4 className="mb-4 font-semibold">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm break-words text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TourneyUp. {t.copyright}
          </p>
          <p className="text-sm text-muted-foreground">{t.location}</p>
        </div>
      </div>
    </footer>
  )
}
