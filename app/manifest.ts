import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TourneyUp',
    short_name: 'TourneyUp',
    description: 'Turnirlarni kashf qiling, ro‘yxatdan o‘ting va kanallar orqali kuzatib boring.',
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
