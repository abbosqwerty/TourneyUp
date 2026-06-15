'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Trophy, Radio, Calendar, Sparkles } from 'lucide-react'

interface FeaturedStoryProps {
  story: {
    id: string
    title: string
    image: string
    tournamentId: string
    type: 'live' | 'upcoming' | 'featured' | 'registration'
  }
}

const typeConfig = {
  live: {
    icon: Radio,
    label: 'LIVE',
    className: 'border-destructive ring-2 ring-destructive/30',
    badgeClassName: 'bg-destructive animate-pulse',
  },
  upcoming: {
    icon: Calendar,
    label: 'Soon',
    className: 'border-warning ring-2 ring-warning/30',
    badgeClassName: 'bg-warning',
  },
  featured: {
    icon: Sparkles,
    label: 'Hot',
    className: 'border-primary ring-2 ring-primary/30',
    badgeClassName: 'bg-primary',
  },
  registration: {
    icon: Trophy,
    label: 'Open',
    className: 'border-success ring-2 ring-success/30',
    badgeClassName: 'bg-success',
  },
}

export function FeaturedStory({ story }: FeaturedStoryProps) {
  const config = typeConfig[story.type]
  const Icon = config.icon

  return (
    <Link 
      href={`/tournament/${story.tournamentId}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div 
        className={cn(
          "relative h-20 w-20 rounded-full border-2 bg-gradient-to-br from-secondary to-card overflow-hidden transition-transform group-hover:scale-105",
          config.className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-primary/50" />
        </div>
        <Badge 
          className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5",
            config.badgeClassName
          )}
        >
          <Icon className="h-2.5 w-2.5 mr-1" />
          {config.label}
        </Badge>
      </div>
      <span className="text-xs text-muted-foreground text-center line-clamp-1 max-w-[80px] group-hover:text-foreground transition-colors">
        {story.title}
      </span>
    </Link>
  )
}

export function FeaturedStoriesRow({ stories }: { stories: FeaturedStoryProps['story'][] }) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4 -mx-4">
        {stories.map((story) => (
          <FeaturedStory key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}
