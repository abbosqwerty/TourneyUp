import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private areas: nothing here is useful in a search index.
        disallow: ['/admin', '/dashboard', '/profile', '/saved', '/messages', '/settings', '/staff', '/api'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
