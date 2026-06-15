import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LucideIcon, Bookmark, Trophy, MessageSquare, Users, Search, Calendar } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  variant?: 'default' | 'card'
  className?: string
}

export function EmptyState({
  icon: Icon = Trophy,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        variant === 'card' && "bg-card rounded-lg border border-border",
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  )
}

// Pre-configured empty states
export function NoSavedTournaments() {
  return (
    <EmptyState
      icon={Bookmark}
      title="No saved tournaments"
      description="Save tournaments you're interested in to easily find them later."
      action={{ label: "Explore Tournaments", href: "/feed" }}
      variant="card"
    />
  )
}

export function NoTournamentsFound() {
  return (
    <EmptyState
      icon={Search}
      title="No tournaments found"
      description="Try adjusting your search filters or check back later for new tournaments."
    />
  )
}

export function NoMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages yet"
      description="Start a conversation with tournament organizers or other players."
      variant="card"
    />
  )
}

export function NoParticipants() {
  return (
    <EmptyState
      icon={Users}
      title="No participants yet"
      description="Share your tournament to attract participants."
      variant="card"
    />
  )
}

export function NoUpcomingMatches() {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming matches"
      description="Join a tournament to compete and track your matches here."
      action={{ label: "Find Tournaments", href: "/feed" }}
      variant="card"
    />
  )
}
