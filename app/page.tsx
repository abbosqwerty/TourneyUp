import Link from 'next/link'
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react'
import type { Tournament } from '@/lib/types'
import { tournamentPoster } from '@/lib/media'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getI18n } from '@/lib/i18n/server'
import { formatClock, formatDate } from '@/lib/time'

function PixelMark() {
  return (
    <span aria-hidden className="grid h-7 w-7 grid-cols-3 gap-[2px]">
      {[0, 1, 2, 3, 4, 5, 7].map((square) => (
        <i key={square} className="bg-current" />
      ))}
    </span>
  )
}

export default async function LandingPage() {
  const { dict, locale } = await getI18n()
  const t = dict.home
  const sessionUser = await getCurrentUser()
  const user = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        username: sessionUser.username,
        avatar: sessionUser.avatar,
        role: sessionUser.role,
      }
    : null

  // Fetch live stats and featured tournaments directly from database
  let playerCount = 0
  let tournamentCount = 0
  let registrationCount = 0
  let featuredTournaments: Tournament[] = []

  try {
    const [players, tourneys, registrations, topTourneys] = await Promise.all([
      db.user.count({ where: { globalRank: { gt: 0 } } }),
      db.tournament.count(),
      db.participant.count(),
      db.tournament.findMany({
        take: 3,
        include: {
          organizer: { select: { id: true, name: true, avatar: true, verified: true } },
          organization: { select: { name: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { date: 'asc' },
      })
    ])

    playerCount = players
    tournamentCount = tourneys
    registrationCount = registrations
    featuredTournaments = topTourneys.map((row) => ({
      id: row.id,
      title: row.title,
      sport: row.sport,
      category: row.category as Tournament['category'],
      location: row.location,
      date: row.date,
      time: row.time,
      participants: row._count.participants,
      maxParticipants: row.maxParticipants,
      posterUrl: tournamentPoster(row) ?? '',
      organizer: {
        id: row.organizer.id,
        name: row.organization?.name ?? row.organizer.name,
        avatar: row.organizer.avatar,
        verified: row.organizer.verified,
      },
      status: row.status as Tournament['status'],
      featured: row.featured,
    }))
  } catch {
    playerCount = 0
    tournamentCount = 0
    registrationCount = 0
  }

  // Only real counts — no decorative placeholder numbers.
  const liveStats = [
    { key: 'players', value: `${playerCount}`, label: t.stats.players(playerCount) },
    { key: 'tournaments', value: `${tournamentCount}`, label: t.stats.tournaments(tournamentCount) },
    { key: 'entries', value: `${registrationCount}`, label: t.stats.entries(registrationCount) },
  ]

  const exploreHref = '/feed'

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentUser={user} />
      <main>
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto grid min-h-[650px] max-w-6xl items-center gap-16 px-5 py-20 md:grid-cols-2 md:px-8">
            <div>
              <p className="mb-7 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.hero.eyebrow}</p>
              <h1 className="max-w-xl text-5xl font-bold leading-[0.88] tracking-[-0.07em] md:text-7xl">
                <span className="pixel-word block text-primary">{t.hero.title_top}</span>
                <span className="mt-4 block">{t.hero.title_bottom}</span>
              </h1>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
                {t.hero.subtitle}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild className="h-12 rounded-full px-6 text-sm font-semibold">
                  <Link href={exploreHref}>{t.hero.explore} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="ghost" className="h-12 rounded-full px-5 text-sm font-semibold">
                  <Link href="/create">{t.hero.create}</Link>
                </Button>
              </div>
            </div>

            <div className="border border-border p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider">
                  <span className="h-2.5 w-2.5 bg-primary" /> {t.panel.label}
                </div>
                <span className="font-mono text-xs text-muted-foreground">TOURNEY UP</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  ['01', t.panel.step1_title, t.panel.step1_detail],
                  ['02', t.panel.step2_title, t.panel.step2_detail],
                  ['03', t.panel.step3_title, t.panel.step3_detail],
                ].map(([number, title, detail]) => (
                  <div key={number} className="flex gap-5 py-6">
                    <span className="font-mono text-xs text-primary">{number}</span>
                    <div>
                      <h2 className="font-bold tracking-[-0.04em]">{title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={exploreHref} className="mt-2 flex items-center justify-between border-t border-border pt-5 text-sm font-bold">
                {t.panel.link} <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </div>
          </div>
        </section>

        {/* Live Database Stats */}
        <section className="border-b border-border">
          <div className="container mx-auto grid max-w-6xl grid-cols-1 divide-y divide-border px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
            {liveStats.map((stat) => (
              <div key={stat.key} className="py-8 md:px-8 md:first:pl-0">
                <p className="text-3xl font-bold tracking-[-0.06em] text-foreground">{stat.value}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Live Tournaments Showcase */}
        {featuredTournaments.length > 0 && (
          <section className="border-b border-border py-16">
            <div className="container mx-auto max-w-6xl px-5 md:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.featured.eyebrow}</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] md:text-4xl">{t.featured.title}</h2>
                </div>
                <Button asChild variant="outline" className="self-start md:self-auto">
                  <Link href={exploreHref}>{t.featured.view_all} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {featuredTournaments.map((tour) => (
                  <Card key={tour.id} className="border-border hover:border-primary/50 transition-colors flex flex-col justify-between">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="secondary" className="min-w-0 truncate text-xs uppercase">
                          {tour.sport}
                        </Badge>
                        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-primary">
                          {tour.prizePool || t.featured.prize_pool}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1 mb-2">
                        {tour.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {tour.description}
                      </p>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="line-clamp-1">{tour.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{formatDate(tour.date, locale)} · {formatClock(tour.time, locale)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span>{t.featured.players(tour.participants, tour.maxParticipants)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="border-t border-border p-4 bg-muted/20">
                      <Button asChild variant="ghost" className="w-full text-xs font-semibold">
                        <Link href={`/tournament/${tour.id}`}>
                          {t.featured.view_details} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Toolkit Section */}
        <section className="container mx-auto max-w-6xl px-5 py-24 md:px-8">
          <div className="max-w-xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.toolkit.eyebrow}</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.06em] md:text-5xl">{t.toolkit.title}</h2>
          </div>
          <div className="mt-14 grid gap-0 border border-border md:grid-cols-3">
            {[
              [t.toolkit.discover_title, t.toolkit.discover_desc],
              [t.toolkit.join_title, t.toolkit.join_desc],
              [t.toolkit.follow_title, t.toolkit.follow_desc],
            ].map(([title, description], index) => (
              <div key={title} className="border-b border-border p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                <span className="font-mono text-xs text-primary">0{index + 1}</span>
                <h3 className="mt-10 text-xl font-bold tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-accent/35">
          <div className="container mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-end md:px-8">
            <div>
              <div className="text-primary"><PixelMark /></div>
              <h2 className="mt-6 text-4xl font-bold tracking-[-0.06em] md:text-5xl">{t.cta.title}</h2>
            </div>
            <Button asChild className="h-12 rounded-full px-6">
              <Link href="/login">{t.cta.button} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
