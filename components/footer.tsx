import Link from 'next/link'
import { LogoIcon } from '@/components/logo-icon'

/**
 * Only routes that actually exist. Every entry here was verified against
 * `app/` — a footer full of 404s reads as an abandoned site.
 */
const footerLinks = {
  platforma: [
    { label: 'Turnirlar', href: '/feed' },
    { label: 'Reyting', href: '/rankings' },
    { label: 'Musobaqa', href: '/results' },
  ],
  akkaunt: [
    { label: 'Kirish', href: '/login' },
    { label: 'Ro‘yxatdan o‘tish', href: '/register' },
    { label: 'Profil', href: '/profile' },
  ],
  tashkilotlar: [
    { label: 'Ariza yuborish', href: '/organizations/apply' },
    { label: 'Tashkilot paneli', href: '/dashboard' },
    { label: 'Xabarlar', href: '/messages' },
  ],
  huquqiy: [
    { label: 'Maxfiylik siyosati', href: '/privacy' },
    { label: 'Foydalanish shartlari', href: '/terms' },
  ],
}

export function Footer() {
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
              Turnirlarni kashf qiling, ro‘yxatdan o‘ting va tashkilotlar kanallari orqali kuzatib boring.
            </p>
          </div>

          {[
            { title: 'Platforma', links: footerLinks.platforma },
            { title: 'Akkaunt', links: footerLinks.akkaunt },
            { title: 'Tashkilotlar', links: footerLinks.tashkilotlar },
            { title: 'Huquqiy', links: footerLinks.huquqiy },
          ].map((column) => (
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
            &copy; {new Date().getFullYear()} TourneyUp. Barcha huquqlar himoyalangan.
          </p>
          <p className="text-sm text-muted-foreground">Tashkent, Uzbekistan</p>
        </div>
      </div>
    </footer>
  )
}



