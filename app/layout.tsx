import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // One brand spelling everywhere: "TourneyUp".
  title: { default: 'TourneyUp — turnirlaringizni bir joyda boshqaring', template: '%s | TourneyUp' },
  description:
    'Universitet va shahar turnirlarini kashf qiling, ro‘yxatdan o‘ting, tashkilot kanallariga obuna bo‘ling.',
  keywords: ['turnir', 'tournaments', 'esports', 'sport', 'reyting', 'Uzbekistan'],
  authors: [{ name: 'TourneyUp' }],
  applicationName: 'TourneyUp',
  openGraph: {
    type: 'website',
    siteName: 'TourneyUp',
    locale: 'uz_UZ',
    url: siteUrl,
    title: 'TourneyUp — turnirlaringizni bir joyda boshqaring',
    description: 'Turnirlarni kashf qiling, ro‘yxatdan o‘ting va kanallar orqali kuzatib boring.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TourneyUp',
    description: 'Turnirlarni kashf qiling, ro‘yxatdan o‘ting va kanallar orqali kuzatib boring.',
  },
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
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

  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={inter.variable + ' ' + geistMono.variable + ' font-sans antialiased'}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
