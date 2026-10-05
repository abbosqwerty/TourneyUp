'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Trophy,
  Bookmark,
  CheckCircle,
  Gamepad2,
  GraduationCap,
  Dribbble
} from 'lucide-react'
import type { Tournament } from '@/lib/mock-data'
import { useAuthModal } from '@/components/auth-modal'
import { ParticipantSlots } from '@/components/participant-slots'

interface TournamentCardProps {
  tournament: Tournament
  variant?: 'default' | 'compact' | 'featured'
  onSave?: () => void
  isSaved?: boolean
}

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
  ongoing: 'Live',
  completed: 'Completed',
  registration_open: 'Open',
}

export function TournamentCard({ 
  tournament, 
  variant = 'default',
  onSave,
  isSaved = false
}: TournamentCardProps) {
  const { currentUser, openLoginModal } = useAuthModal()
  const router = useRouter()

  const CategoryIcon = categoryIcons[tournament.category]
  const spotsLeft = Math.max(0, tournament.maxParticipants - tournament.participants)
  const isAlmostFull = spotsLeft <= Math.max(2, Math.floor(tournament.maxParticipants * 0.2))

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser) {
      openLoginModal({
        title: 'Sign in to Join',
        description: `Please sign in to register for "${tournament.title}".`,
        redirectTo: `/tournament/${tournament.id}#register`
      })
    } else {
      router.push(`/tournament/${tournament.id}#register`)
    }
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser) {
      openLoginModal({
        title: 'Sign in to Save',
        description: `Please sign in to save "${tournament.title}".`
      })
      return
    }
    if (onSave) {
      onSave()
    }
  }

  if (variant === 'compact') {
    return (
      <Card className="hover:border-primary/50 transition-colors group p-3">
        <Link href={`/tournament/${tournament.id}`}>
          <div className="flex gap-4 items-center">
            <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <CategoryIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {tournament.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 text-primary" />
                {new Date(tournament.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="line-clamp-1">{tournament.location}</span>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === 'featured') {
    return (
      <Card className="border-primary/30 glow-primary p-3 flex flex-col justify-between">
        {/* Tournament Image Banner — padded with rounded corners */}
        <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 via-secondary to-accent/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-16 w-16 text-primary/50" />
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn(statusColors[tournament.status])}>
              {statusLabels[tournament.status]}
            </Badge>
            {tournament.featured && (
              <Badge variant="outline" className="border-primary text-primary bg-background/50">
                Featured
              </Badge>
            )}
          </div>
          {onSave && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-background/60 backdrop-blur hover:bg-background/90 rounded-full"
              onClick={handleSaveClick}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
            </Button>
          )}
        </div>

        <CardContent className="p-0 pt-4 flex-1 flex flex-col justify-between">
          <div>
            <Link href={`/tournament/${tournament.id}`}>
              <h3 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors">
                {tournament.title}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 mt-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={tournament.organizer.avatar} />
                <AvatarFallback>{tournament.organizer.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{tournament.organizer.name}</span>
              {tournament.organizer.verified && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {new Date(tournament.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {tournament.time}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="line-clamp-1">{tournament.location}</span>
              </div>
            </div>

            {/* Organized Tiny Circles Participation Slots */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {tournament.participants}/{tournament.maxParticipants} players
                  </span>
                </div>
                <span className="text-xs font-medium">
                  {isAlmostFull ? (
                    <span className="text-warning font-semibold">Almost full! ({spotsLeft} left)</span>
                  ) : (
                    <span className="text-muted-foreground">{spotsLeft} spots left</span>
                  )}
                </span>
              </div>
              <ParticipantSlots
                current={tournament.participants}
                max={tournament.maxParticipants}
              />
            </div>

            {tournament.prizePool && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prize Pool</span>
                <span className="font-bold text-primary">{tournament.prizePool}</span>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <Button asChild className="flex-1">
              <Link href={`/tournament/${tournament.id}`}>
                View Details
              </Link>
            </Button>
            <Button variant="outline" onClick={handleJoinClick}>
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className="hover:border-primary/50 transition-all hover:shadow-lg group p-3 flex flex-col justify-between">
      {/* Tournament Image Banner — padded with rounded corners */}
      <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-secondary via-card to-secondary">
        <div className="absolute inset-0 flex items-center justify-center">
          <CategoryIcon className="h-12 w-12 text-primary/30" />
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn(statusColors[tournament.status])}>
            {statusLabels[tournament.status]}
          </Badge>
        </div>
        {onSave && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/60 backdrop-blur hover:bg-background/90 rounded-full"
            onClick={handleSaveClick}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
          </Button>
        )}
        <Badge variant="secondary" className="absolute bottom-3 left-3">
          {tournament.sport}
        </Badge>
      </div>
      
      <CardContent className="p-0 pt-3.5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/tournament/${tournament.id}`}>
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {tournament.title}
            </h3>
          </Link>

          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={tournament.organizer.avatar} />
              <AvatarFallback>{tournament.organizer.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {tournament.organizer.name}
            </span>
            {tournament.organizer.verified && (
              <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {new Date(tournament.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              {tournament.participants}/{tournament.maxParticipants}
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="line-clamp-1">{tournament.location}</span>
            </div>
          </div>

          {/* Organized Tiny Circles in Default Card */}
          <div className="mt-3">
            <ParticipantSlots
              current={tournament.participants}
              max={tournament.maxParticipants}
            />
          </div>
        </div>

        <Button asChild className="w-full mt-4" size="sm">
          <Link href={`/tournament/${tournament.id}`}>
            View Tournament
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
