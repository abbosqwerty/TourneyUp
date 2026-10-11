'use client'

import Link from 'next/link'
import { LogoIcon } from '@/components/logo-icon'
import { useLanguage } from '@/lib/i18n/language-context'

export function Footer() {
  const { dict, locale } = useLanguage()

  const columns = [
    {
      title: locale === 'ru' ? 'Платформа' : locale === 'en' ? 'Platform' : 'Platforma',
      links: [
        { label: dict.nav.tournaments, href: '/feed' },
        { label: dict.nav.rankings, href: '/rankings' },
        { label: dict.nav.matches, href: '/results' },
      ],
    },
    {
      title: locale === 'ru' ? 'Аккаунт' : locale === 'en' ? 'Account' : 'Akkaunt',
      links: [
        { label: dict.nav.login, href: '/login' },
        { label: dict.nav.register, href: '/register' },
        { label: dict.nav.profile, href: '/profile' },
      ],
    },
    {
      title: locale === 'ru' ? 'Организаторам' : locale === 'en' ? 'Organizers' : 'Tashkilotlar',
      links: [
        { label: dict.auth.apply_link, href: '/organizations/apply' },
        { label: dict.nav.dashboard, href: '/dashboard' },
        { label: dict.nav.messages, href: '/messages' },
      ],
    },
    {
      title: locale === 'ru' ? 'Юридическое' : locale === 'en' ? 'Legal' : 'Huquqiy',
      links: [
        {
          label: locale === 'ru' ? 'Политика конфиденциальности' : locale === 'en' ? 'Privacy Policy' : 'Maxfiylik siyosati',
          href: '/privacy',
        },
        {
          label: locale === 'ru' ? 'Условия использования' : locale === 'en' ? 'Terms of Service' : 'Foydalanish shartlari',
          href: '/terms',
        },
      ],
    },
  ]

  const brandDesc =
    locale === 'ru'
      ? 'Открывайте турниры, регистрируйтесь и следите за событиями через каналы организаторов.'
      : locale === 'en'
        ? 'Discover tournaments, register and follow updates through organizer channels.'
        : 'Turnirlarni kashf qiling, ro‘yxatdan o‘ting va tashkilotlar kanallari orqali kuzatib boring.'

  const copyrightText =
    locale === 'ru'
      ? 'Все права защищены.'
      : locale === 'en'
        ? 'All rights reserved.'
        : 'Barcha huquqlar himoyalangan.'

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
              {brandDesc}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-4 font-semibold">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            &copy; {new Date().getFullYear()} TourneyUp. {copyrightText}
          </p>
          <p className="text-sm text-muted-foreground">Tashkent, Uzbekistan</p>
        </div>
      </div>
    </footer>
  )
}
