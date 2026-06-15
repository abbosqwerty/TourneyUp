import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { LandingNavbar } from '@/components/landing-navbar'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { 
  Trophy, 
  Search, 
  BarChart3, 
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
  Gamepad2,
  Dribbble,
  GraduationCap
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Discover Tournaments',
    description: 'Browse thousands of tournaments across sports, esports, and academic competitions. Filter by location, sport, and skill level.',
  },
  {
    icon: Trophy,
    title: 'Compete & Win',
    description: 'Join tournaments that match your skill level. Track your progress, earn achievements, and climb the rankings.',
  },
  {
    icon: BarChart3,
    title: 'Track Rankings',
    description: 'Real-time leaderboards and detailed statistics. See how you stack up against competitors globally and locally.',
  },
 ]

const stats = [
  { value: '50K+', label: 'Active Players' },
  { value: '2,500+', label: 'Tournaments' },
  { value: '100+', label: 'Sports & Games' },
  { value: '$1M+', label: 'Prize Pools' },
]

const categories = [
  { icon: Dribbble, name: 'Sports', count: '1,200+ tournaments', color: 'from-emerald-500 to-teal-600' },
  { icon: Gamepad2, name: 'Esports', count: '800+ tournaments', color: 'from-blue-500 to-indigo-600' },
  { icon: GraduationCap, name: 'Academic', count: '500+ tournaments', color: 'from-amber-500 to-orange-600' },
]

export default async function LandingPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar currentUser={user} />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-36">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/8 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 py-1.5 px-4 border-primary/50 text-primary">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                The #1 Tournament Platform
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
                Discover. Compete.
                <span className="text-primary"> Conquer.</span>
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                Join thousands of competitors on the ultimate tournament platform. Find events, track your rankings, and rise to the top.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-base px-8 gap-2 h-12" asChild>
                  <Link href="/feed">
                    Browse Tournaments
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-base px-8 h-12" asChild>
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Secure & Verified
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Global Community
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Free to Join
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-y border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">Find Your Competition</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                From traditional sports to esports and academic competitions, we have tournaments for everyone.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.name} className="group overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <category.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                    <p className="text-muted-foreground">{category.count}</p>
                    <Button variant="link" className="px-0 mt-4 gap-1 group-hover:gap-2 transition-all text-primary" asChild>
                      <Link href={`/feed?category=${category.name.toLowerCase()}`}>
                        Explore {category.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">Everything You Need to Compete</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Powerful tools for discovering tournaments and tracking your competitive journey.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
                Ready to Start Competing?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Join TourneyUp today and discover tournaments that match your skills. Create your profile, track your rankings, and start your journey to the top.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                  <Link href="/feed">Browse Tournaments</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
