'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Trophy, 
  Radio, 
  Calendar, 
  Sparkles, 
  Gamepad2, 
  Dribbble, 
  GraduationCap, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  MapPin, 
  Users, 
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ParticipantSlots } from '@/components/participant-slots'

export interface StoryData {
  id: string
  title: string
  sport?: string
  category?: string
  location?: string
  date?: string
  time?: string
  prizePool?: string
  entryFee?: string
  status?: string
  participants?: number
  maxParticipants?: number
  organizerName?: string
  organizerAvatar?: string
  description?: string
  image?: string
  tournamentId: string
  type: 'live' | 'upcoming' | 'featured' | 'registration'
}

// Brand-coherent configuration using TourneyUp theme variables
const typeConfig = {
  live: {
    icon: Radio,
    label: 'LIVE',
    gradientRing: 'from-destructive via-accent to-primary',
    badgeClass: 'bg-destructive text-destructive-foreground',
    storyTheme: 'from-destructive/20 via-card to-background',
  },
  upcoming: {
    icon: Calendar,
    label: 'SOON',
    gradientRing: 'from-secondary via-accent to-primary',
    badgeClass: 'bg-secondary text-secondary-foreground border border-border',
    storyTheme: 'from-secondary/40 via-card to-background',
  },
  featured: {
    icon: Sparkles,
    label: 'FEATURED',
    gradientRing: 'from-accent via-primary to-foreground',
    badgeClass: 'bg-foreground text-background font-bold',
    storyTheme: 'from-accent/30 via-card to-background',
  },
  registration: {
    icon: Trophy,
    label: 'OPEN',
    gradientRing: 'from-primary via-accent to-ring',
    badgeClass: 'bg-primary text-primary-foreground font-bold',
    storyTheme: 'from-primary/20 via-card to-background',
  },
}

function getSportIcon(sportOrCategory?: string) {
  const normalized = (sportOrCategory || '').toLowerCase()
  if (
    normalized.includes('game') || 
    normalized.includes('esport') || 
    normalized.includes('pubg') || 
    normalized.includes('valorant') || 
    normalized.includes('league') || 
    normalized.includes('cs') || 
    normalized.includes('rocket')
  ) {
    return Gamepad2
  }
  if (
    normalized.includes('academic') || 
    normalized.includes('chess') || 
    normalized.includes('math') || 
    normalized.includes('hack')
  ) {
    return GraduationCap
  }
  return Dribbble
}

// ----------------------------------------------------
// Instagram Story Modal Viewer
// ----------------------------------------------------
interface StoryViewerProps {
  stories: StoryData[]
  initialIndex: number
  onClose: () => void
}

function InstagramStoryModal({ stories, initialIndex, onClose }: StoryViewerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const STORY_DURATION = 6000 // 6 seconds per story

  const currentStory = stories[currentIndex]
  const config = typeConfig[currentStory.type] || typeConfig.registration
  const SportIcon = getSportIcon(currentStory.sport || currentStory.category)

  const goToNext = useCallback(() => {
    setProgress(0)
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onClose()
    }
  }, [currentIndex, stories.length, onClose])

  const goToPrev = useCallback(() => {
    setProgress(0)
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  // Timer loop
  useEffect(() => {
    if (isPaused) return

    const interval = 50
    const step = (interval / STORY_DURATION) * 100

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext()
          return 0
        }
        return prev + step
      })
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, goToNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToNext, goToPrev])

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200">
      {/* Desktop Prev Button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrev()
          }}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-secondary/80 hover:bg-secondary text-foreground items-center justify-center transition-all hover:scale-110 border border-border"
          aria-label="Previous story"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      {/* Desktop Next Button */}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-secondary/80 hover:bg-secondary text-foreground items-center justify-center transition-all hover:scale-110 border border-border"
          aria-label="Next story"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}

      {/* Main Story Container - Phone format matching app card palette */}
      <div
        className={cn(
          'relative w-full max-w-[430px] h-[92vh] max-h-[760px] rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-border/80 bg-gradient-to-b',
          config.storyTheme
        )}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Ambient Brand Motion Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Top Section: Progress bars & Header */}
        <div className="relative z-20 p-4 space-y-3 bg-gradient-to-b from-card/90 via-card/50 to-transparent">
          {/* Progress Bars styled with TourneyUp Primary/Secondary */}
          <div className="flex gap-1.5 w-full">
            {stories.map((story, i) => {
              let fillPercent = 0
              if (i < currentIndex) fillPercent = 100
              else if (i === currentIndex) fillPercent = progress
              return (
                <div
                  key={story.id}
                  className="flex-1 h-1 rounded-full bg-muted overflow-hidden"
                >
                  <div
                    className="h-full bg-primary transition-all duration-75 ease-linear"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              )
            })}
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 border-2 border-primary/40 shadow-sm">
                <AvatarImage src={currentStory.organizerAvatar} />
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {(currentStory.organizerName || 'T')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold leading-tight text-foreground">
                    {currentStory.organizerName || 'TourneyUp Host'}
                  </span>
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {currentStory.sport || 'Tournament Highlight'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span
                className={cn(
                  'text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1',
                  config.badgeClass
                )}
              >
                {React.createElement(config.icon, { className: 'h-3 w-3' })}
                {config.label}
              </span>

              {/* Pause Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPaused(!isPaused)
                }}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label={isPaused ? 'Play' : 'Pause'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Middle: Interactive Tap Zones for Prev / Next */}
        <div className="absolute inset-0 z-10 flex">
          {/* Left tap zone = Previous */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              goToPrev()
            }}
          />
          {/* Right tap zone = Next */}
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
          />
        </div>

        {/* Story Visual Content */}
        <div className="relative z-10 px-5 flex-1 flex flex-col justify-center items-center text-center my-auto pointer-events-none">
          {/* Big Sport Emblem matching card style */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-accent opacity-40 blur-xl scale-125 animate-pulse" />
            <div className="relative h-24 w-24 rounded-full bg-secondary/80 border-2 border-primary/30 flex items-center justify-center backdrop-blur-md shadow-xl">
              <SportIcon className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Tournament Title */}
          <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight max-w-[340px] text-foreground">
            {currentStory.title}
          </h2>

          {/* Description snippet */}
          {currentStory.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2 max-w-[300px] leading-relaxed">
              {currentStory.description}
            </p>
          )}

          {/* Highlights Info Grid (Prize, Date, Location) */}
          <div className="w-full mt-5 grid grid-cols-2 gap-2 text-left">
            {/* Prize Pool */}
            <div className="p-2.5 rounded-xl bg-secondary/50 backdrop-blur-md border border-border flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Prize</span>
                <span className="text-xs font-bold text-foreground line-clamp-1">
                  {currentStory.prizePool || 'Trophy & Glory'}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="p-2.5 rounded-xl bg-secondary/50 backdrop-blur-md border border-border flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Date</span>
                <span className="text-xs font-bold text-foreground line-clamp-1">
                  {currentStory.date ? new Date(currentStory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Soon'}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="p-2.5 rounded-xl bg-secondary/50 backdrop-blur-md border border-border flex items-center gap-2.5 col-span-2">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">Venue</span>
                <span className="text-xs font-bold text-foreground line-clamp-1">
                  {currentStory.location || 'Online Arena'}
                </span>
              </div>
            </div>
          </div>

          {/* Spots circles */}
          {currentStory.maxParticipants && (
            <div className="w-full mt-3.5 p-2 rounded-xl bg-secondary/30 border border-border backdrop-blur-md pointer-events-auto">
              <ParticipantSlots
                current={currentStory.participants || 0}
                max={currentStory.maxParticipants}
              />
            </div>
          )}
        </div>

        {/* Story Footer / Action CTA */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-card via-card/80 to-transparent">
          <Button
            asChild
            size="lg"
            className="w-full rounded-2xl h-12 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Link href={`/tournament/${currentStory.tournamentId}`}>
              <span>View Tournament & Join</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------
// Centered Story Circles Row using TourneyUp Brand Palette
// ----------------------------------------------------
export function FeaturedStoriesRow({ stories }: { stories: StoryData[] }) {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)

  if (!stories || stories.length === 0) return null

  return (
    <>
      <div className="relative w-full overflow-x-auto pb-5 pt-3 scrollbar-hide">
        <div className="w-fit mx-auto flex items-start justify-center gap-6 sm:gap-7 px-4">
          {stories.map((story, index) => {
            const config = typeConfig[story.type] || typeConfig.registration
            const SportIcon = getSportIcon(story.sport || story.category)

            return (
              <button
                key={story.id}
                onClick={() => setActiveStoryIndex(index)}
                className="flex flex-col items-center group flex-shrink-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl transition-transform active:scale-95"
              >
                {/* Brand Theme Gradient Ring Container */}
                <div className="relative">
                  <div
                    className={cn(
                      'h-24 w-24 sm:h-28 sm:w-28 rounded-full p-[3px] bg-gradient-to-tr shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md',
                      config.gradientRing
                    )}
                  >
                    {/* Inner Gap Ring matching environment background */}
                    <div className="w-full h-full rounded-full p-[2.5px] bg-background">
                      {/* Circle Media Thumbnail */}
                      <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-secondary/60 via-card to-secondary/40 border border-border/50">
                        <SportIcon className="h-9 w-9 sm:h-11 sm:w-11 text-primary/80 group-hover:text-primary transition-colors group-hover:scale-110 duration-200" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Status Pill matching environment colors */}
                  <span
                    className={cn(
                      'absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase whitespace-nowrap shadow-xs border-2 border-background',
                      config.badgeClass
                    )}
                  >
                    {React.createElement(config.icon, { className: 'h-2.5 w-2.5' })}
                    {config.label}
                  </span>
                </div>

                {/* Tournament Title below circle with comfortable gap */}
                <span className="w-24 sm:w-28 text-xs font-medium text-center text-foreground/85 line-clamp-2 leading-tight mt-4 group-hover:text-primary transition-colors">
                  {story.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Instagram Story Modal Viewer */}
      {activeStoryIndex !== null && (
        <InstagramStoryModal
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}
    </>
  )
}
