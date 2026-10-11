import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { getI18n } from '@/lib/i18n/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const OG_LOCALE = { uz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' } as const

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getI18n()
  const m = dict.chrome.meta
  return {
    metadataBase: new URL(siteUrl),
    // One brand spelling everywhere: "TourneyUp".
    title: { default: m.title, template: '%s | TourneyUp' },
    description: m.description,
    keywords: ['turnir', 'tournaments', 'турниры', 'esports', 'sport', 'reyting', 'Uzbekistan'],
    authors: [{ name: 'TourneyUp' }],
    applicationName: 'TourneyUp',
    openGraph: {
      type: 'website',
      siteName: 'TourneyUp',
      locale: OG_LOCALE[locale],
      url: siteUrl,
      title: m.title,
      description: m.share_description,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'TourneyUp',
      description: m.share_description,
    },
    icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFE3' },
    { media: '(prefers-color-scheme: dark)', color: '#384959' },
  ],
  width: 'device-width',
  initialScale: 1,
  // No maximumScale — pinch-zoom must stay available (WCAG 1.4.4).
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // next-themes writes an inline script; it needs the CSP nonce set in proxy.ts.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const { locale } = await getI18n()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.variable + ' ' + geistMono.variable + ' font-sans antialiased'}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <LanguageProvider initialLocale={locale}>
            {children}
            <Toaster richColors position="top-center" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
