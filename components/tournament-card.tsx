'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy,
  Bookmark,
  CheckCircle,
  Gamepad2,
  GraduationCap,
  Dribbble,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { Tournament } from '@/lib/types'
import { TOURNAMENT_STATUS_CLASSES, TOURNAMENT_STATUS_LABELS } from '@/lib/constants'
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

export function TournamentCard({ 
  tournament, 
  variant = 'default',
  onSave,
  isSaved = false
}: TournamentCardProps) {
  const { currentUser, openLoginModal } = useAuthModal()
  const [posterIndex, setPosterIndex] = useState(0)
  const posterUrls = [tournament.posterUrl, ...(tournament.galleryUrls ?? [])].filter(Boolean)
  const activePoster = posterUrls[posterIndex] ?? ''

  const CategoryIcon = categoryIcons[tournament.category]
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
      <Card className="shadow-sm hover:shadow-md transition-shadow group p-3">
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
      <Card className="shadow-sm hover:shadow-md transition-shadow p-3 flex flex-col justify-between">
        {/* Tournament Image Banner — padded with rounded corners */}
        <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 via-secondary to-accent/30">
          {/* Uploaded poster when there is one; the gradient stays as fallback. */}
          {activePoster ? (
            <img
              src={activePoster}
              alt={`${tournament.title} afishasi`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-primary/50" />
            </div>
          )}
          {posterUrls.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Oldingi poster"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white backdrop-blur hover:bg-black/55"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPosterIndex((current) => (current - 1 + posterUrls.length) % posterUrls.length)
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Keyingi poster"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white backdrop-blur hover:bg-black/55"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPosterIndex((current) => (current + 1) % posterUrls.length)
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {posterUrls.map((url, index) => (
                  <span key={url} className={cn('h-1.5 w-1.5 rounded-full', index === posterIndex ? 'bg-white' : 'bg-white/45')} />
                ))}
              </div>
            </>
          ) : null}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn(TOURNAMENT_STATUS_CLASSES[tournament.status])}>
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
          </div>
          {onSave && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-background/60 backdrop-blur hover:bg-background/90 rounded-full"
              onClick={handleSaveClick}
              aria-label={isSaved ? 'Saqlanganlardan olib tashlash' : 'Turnirni saqlash'}
              aria-pressed={isSaved}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} aria-hidden />
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
                <AvatarImage src={tournament.organizer.avatar} alt={`${tournament.organizer.name} logotipi`} />
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

            {/* Capacity is shown once, inside the slot visual. */}
            <div className="mt-4">
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

          <div className="mt-5">
            <Button asChild className="w-full">
              <Link href={`/tournament/${tournament.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow group p-3 flex flex-col justify-between">
      {/* Tournament Image Banner — padded with rounded corners */}
      <div className="relative h-56 sm:h-60 rounded-xl overflow-hidden bg-gradient-to-br from-secondary via-card to-secondary">
        {activePoster ? (
          <img
            src={activePoster}
            alt={`${tournament.title} afishasi`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CategoryIcon className="h-12 w-12 text-primary/30" />
          </div>
        )}
        {posterUrls.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Oldingi poster"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white backdrop-blur hover:bg-black/55"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPosterIndex((current) => (current - 1 + posterUrls.length) % posterUrls.length)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Keyingi poster"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white backdrop-blur hover:bg-black/55"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPosterIndex((current) => (current + 1) % posterUrls.length)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {posterUrls.map((url, index) => (
                <span key={url} className={cn('h-1.5 w-1.5 rounded-full', index === posterIndex ? 'bg-white' : 'bg-white/45')} />
              ))}
            </div>
          </>
        ) : null}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn(TOURNAMENT_STATUS_CLASSES[tournament.status])}>
            {TOURNAMENT_STATUS_LABELS[tournament.status]}
          </Badge>
        </div>
        {onSave && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/60 backdrop-blur hover:bg-background/90 rounded-full"
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Saqlanganlardan olib tashlash' : 'Turnirni saqlash'}
            aria-pressed={isSaved}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} aria-hidden />
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
              <AvatarImage src={tournament.organizer.avatar} alt={`${tournament.organizer.name} logotipi`} />
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
              <Clock className="h-3.5 w-3.5 text-primary" />
              {tournament.time}
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
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
