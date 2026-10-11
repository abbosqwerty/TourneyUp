import type { MetadataRoute } from 'next'
import { getI18n } from '@/lib/i18n/server'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { dict, locale } = await getI18n()
  return {
    lang: locale,
    name: 'TourneyUp',
    short_name: 'TourneyUp',
    description: dict.chrome.meta.share_description,
    start_url: '/feed',
    display: 'standalone',
    background_color: '#ffffe3',
    theme_color: '#384959',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
