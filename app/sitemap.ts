import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/feed`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/rankings`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${siteUrl}/organizations/apply`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    const tournaments = await db.tournament.findMany({
      where: { status: { notIn: ['cancelled'] } },
      select: { id: true, createdAt: true },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    })

    return [
      ...staticRoutes,
      ...tournaments.map((tournament) => ({
        url: `${siteUrl}/tournament/${tournament.id}`,
        lastModified: tournament.createdAt,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })),
    ]
  } catch (error) {
    // A database outage should still produce a valid sitemap.
    console.error('sitemap failed', error)
    return staticRoutes
  }
}
