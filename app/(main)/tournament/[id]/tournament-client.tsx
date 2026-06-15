'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { TournamentCard } from '@/components/tournament-card'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Trophy,
  CheckCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  DollarSign,
  FileText,
  AlertCircle,
  Gamepad2,
  Dribbble,
  GraduationCap
} from 'lucide-react'
import { registerParticipant, toggleSaveTournament } from '@/lib/actions'

const categoryIcons = {
  sports: Dribbble,
  esports: Gamepad2,
  academic: GraduationCap,
}

const statusColors = {
  upcoming: 'bg-secondary text-secondary-foreground',
  ongoing: 'bg-success text-white',
  completed: 'bg-muted text-muted-foreground',
  registration_open: 'bg-primary text-primary-foreground',
}

const statusLabels = {
  upcoming: 'Upcoming',
  ongoing: 'Live Now',
  completed: 'Completed',
  registration_open: 'Registration Open',
}

export default function TournamentClient({
  tournament,
  isSaved,
  isUserRegistered,
  relatedTournaments,
  participantsCount,
  isOrganizer = false
}: {
  tournament: any
  isSaved: boolean
  isUserRegistered: boolean
  relatedTournaments: any[]
  participantsCount: number
  isOrganizer?: boolean
}) {
  const [saved, setSaved] = useState(isSaved)
  const [registered, setRegistered] = useState(isUserRegistered)
  const [registering, setRegistering] = useState(false)
  const [currentParticipants, setCurrentParticipants] = useState(participantsCount)

  const CategoryIcon = categoryIcons[tournament.category as keyof typeof categoryIcons] || Trophy
  const participantPercentage = (currentParticipants / tournament.maxParticipants) * 100
  const spotsLeft = tournament.maxParticipants - currentParticipants

  const handleSave = async () => {
    setSaved(!saved)
    await toggleSaveTournament(tournament.id, 'user1')
  }

  const handleRegister = async () => {
    setRegistering(true)
    try {
      await registerParticipant(tournament.id, 'user1', {
        name: 'Alex Thompson',
        email: 'alex.t@stanford.edu',
        teamName: 'Stanford Strikers'
      })
      setRegistered(true)
      setCurrentParticipants(prev => prev + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4 -ml-2">
        <Link href="/feed" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Tournaments
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Banner */}
          <Card className="overflow-hidden">
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/30 via-secondary to-accent/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <CategoryIcon className="h-24 w-24 text-primary/30" />
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={statusColors[tournament.status as keyof typeof statusColors]}>
                  {statusLabels[tournament.status as keyof typeof statusLabels]}
                </Badge>
                {tournament.featured && (
                  <Badge variant="outline" className="border-primary text-primary bg-background/50">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="secondary" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={saved ? "default" : "secondary"} 
                  size="icon"
                  onClick={handleSave}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="secondary" className="absolute bottom-4 left-4 text-sm">
                {tournament.sport}
              </Badge>
            </div>
            <CardContent className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{tournament.title}</h1>
              
              {/* Organizer */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={tournament.organizer.avatar} />
                  <AvatarFallback>{tournament.organizer.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tournament.organizer.name}</span>
                    {tournament.organizer.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Organizer</span>
                </div>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {new Date(tournament.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                </div>
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{tournament.time}</p>
                  <p className="text-xs text-muted-foreground">Start Time</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium line-clamp-1">{tournament.location}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{currentParticipants}/{tournament.maxParticipants}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                About this Tournament
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {tournament.description}
              </p>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tournament.rules.map((rule: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tournament.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Related Tournaments */}
          {relatedTournaments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Related Tournaments</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTournaments.map((t) => (
                  <TournamentCard key={t.id} tournament={t} variant="compact" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card className="sticky top-24" id="register">
            <CardContent className="p-6">
              {/* Prize & Entry */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="text-2xl font-bold text-primary">{tournament.prizePool || 'TBA'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="text-lg font-semibold">{tournament.entryFee || 'Free'}</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Spots Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Available spots</span>
                  <span className="font-medium">{spotsLeft} left</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${participantPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentParticipants} of {tournament.maxParticipants} spots filled
                </p>
              </div>

              {/* Registration CTA */}
              {isOrganizer ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-sm">Organizer Account</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Organizers cannot register as participants. Switch to a player account to join tournaments.
                    </p>
                  </div>
                  <Button 
                    variant={saved ? "default" : "outline"} 
                    className="w-full gap-2"
                    onClick={handleSave}
                  >
                    <Bookmark className="h-4 w-4" />
                    {saved ? 'Saved' : 'Save for Later'}
                  </Button>
                </div>
              ) : registered ? (
                <div className="space-y-3">
                  <Button className="w-full gap-2 bg-success hover:bg-success/90 cursor-default" size="lg">
                    <CheckCircle className="h-5 w-5" />
                    You are Registered
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Your registration status is: Pending Approval
                  </p>
                </div>
              ) : tournament.status === 'registration_open' ? (
                <div className="space-y-3">
                  <Button 
                    className="w-full gap-2" 
                    size="lg" 
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    <Trophy className="h-5 w-5" />
                    {registering ? 'Registering...' : 'Register Now'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Registration closes on {new Date(tournament.date).toLocaleDateString()}
                  </p>
                </div>
              ) : tournament.status === 'upcoming' ? (
                <div className="space-y-3">
                  <Button className="w-full" size="lg" disabled>
                    Registration Closed
                  </Button>
                  <Button 
                    variant={saved ? "default" : "outline"} 
                    className="w-full gap-2"
                    onClick={handleSave}
                  >
                    <Bookmark className="h-4 w-4" />
                    {saved ? 'Saved' : 'Save for Later'}
                  </Button>
                </div>
              ) : (
                <Button className="w-full" size="lg" variant="secondary" disabled>
                  {tournament.status === 'ongoing' ? 'In Progress' : 'Tournament Ended'}
                </Button>
              )}

              <Separator className="my-6" />

              {/* Quick Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(tournament.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{tournament.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{tournament.location}</span>
                </div>
                {tournament.prizePool && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.prizePool} prize pool</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">About the Organizer</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={tournament.organizer.avatar} />
                  <AvatarFallback>{tournament.organizer.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tournament.organizer.name}</span>
                    {tournament.organizer.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Tournament Organizer</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/messages">Contact Organizer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
