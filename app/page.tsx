import Link from 'next/link'
import { ArrowRight, Check, Trophy } from 'lucide-react'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { LandingNavbar } from '@/components/landing-navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'

const stats = [
  { value: '12.8K', label: 'active players' },
  { value: '486', label: 'live events' },
  { value: '24/7', label: 'bracket energy' },
]

function PixelMark() {
  return <span aria-hidden className="grid h-7 w-7 grid-cols-3 gap-[2px]">
    {[0, 1, 2, 3, 4, 5, 7].map((square) => <i key={square} className="bg-current" />)}
  </span>
}

export default async function LandingPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null
  const exploreHref = user ? '/feed' : '/login?next=/feed'

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar currentUser={user} />
      <main>
        <section className="border-b border-border">
          <div className="container mx-auto grid min-h-[650px] max-w-6xl items-center gap-16 px-5 py-20 md:grid-cols-2 md:px-8">
            <div>
              <p className="mb-7 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">Play · compete · win</p>
              <h1 className="max-w-xl text-5xl font-bold leading-[0.88] tracking-[-0.07em] md:text-7xl">
                <span className="pixel-word block text-primary">Play in your</span>
                <span className="mt-4 block">next bracket.</span>
              </h1>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
                A simple place to discover tournaments, follow every match, and bring your people together.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild className="h-12 rounded-full px-6 text-sm font-semibold">
                  <Link href={exploreHref}>Explore events <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="ghost" className="h-12 rounded-full px-5 text-sm font-semibold">
                  <Link href="/create">Create a tourney</Link>
                </Button>
              </div>
            </div>

            <div className="border border-border p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider">
                  <span className="h-2.5 w-2.5 bg-primary" /> One place to run it all
                </div>
                <span className="font-mono text-xs text-muted-foreground">TOURNEY UP</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  ['01', 'Create in minutes', 'Set the game, schedule, capacity and rules.'],
                  ['02', 'Keep players moving', 'Share registrations and updates without the mess.'],
                  ['03', 'Follow every round', 'Make the bracket clear for every player and fan.'],
                ].map(([number, title, detail]) => <div key={number} className="flex gap-5 py-6">
                  <span className="font-mono text-xs text-primary">{number}</span>
                  <div><h2 className="font-bold tracking-[-0.04em]">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p></div>
                </div>)}
              </div>
              <Link href={exploreHref} className="mt-2 flex items-center justify-between border-t border-border pt-5 text-sm font-bold">
                Explore tournaments <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container mx-auto grid max-w-6xl grid-cols-1 divide-y divide-border px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
            {stats.map((stat) => <div key={stat.label} className="py-8 md:px-8 md:first:pl-0">
              <p className="text-3xl font-bold tracking-[-0.06em]">{stat.value}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </div>)}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-5 py-24 md:px-8">
          <div className="max-w-xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">Made for the competitive</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.06em] md:text-5xl">The essential tournament toolkit.</h2>
          </div>
          <div className="mt-14 grid gap-0 border border-border md:grid-cols-3">
            {[
              ['Discover', 'Find events that match your game, schedule and skill.'],
              ['Join', 'Register quickly, then keep every tournament detail in one place.'],
              ['Follow', 'Watch the bracket move and know exactly what happens next.'],
            ].map(([title, description], index) => <div key={title} className="border-b border-border p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <span className="font-mono text-xs text-primary">0{index + 1}</span>
              <h3 className="mt-10 text-xl font-bold tracking-[-0.04em]">{title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
            </div>)}
          </div>
        </section>

        <section className="border-t border-border bg-accent/35">
          <div className="container mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-end md:px-8">
            <div>
              <div className="text-primary"><PixelMark /></div>
              <h2 className="mt-6 text-4xl font-bold tracking-[-0.06em] md:text-5xl">Your next game is waiting.</h2>
            </div>
            <Button asChild className="h-12 rounded-full px-6"><Link href="/signup">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
