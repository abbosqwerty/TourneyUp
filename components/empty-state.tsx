'use client'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'
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
  const { dict } = useLanguage()
  const t = dict.chrome.empty
  return (
    <EmptyState
      icon={Bookmark}
      title={t.saved_title}
      description={t.saved_desc}
      action={{ label: t.saved_action, href: "/feed" }}
      variant="card"
    />
  )
}

export function NoTournamentsFound() {
  const { dict } = useLanguage()
  const t = dict.chrome.empty
  return (
    <EmptyState
      icon={Search}
      title={t.no_tournaments_title}
      description={t.no_tournaments_desc}
    />
  )
}

export function NoMessages() {
  const { dict } = useLanguage()
  const t = dict.chrome.empty
  return (
    <EmptyState
      icon={MessageSquare}
      title={t.no_messages_title}
      description={t.no_messages_desc}
      variant="card"
    />
  )
}

export function NoParticipants() {
  const { dict } = useLanguage()
  const t = dict.chrome.empty
  return (
    <EmptyState
      icon={Users}
      title={t.no_participants_title}
      description={t.no_participants_desc}
      variant="card"
    />
  )
}

export function NoUpcomingMatches() {
  const { dict } = useLanguage()
  const t = dict.chrome.empty
  return (
    <EmptyState
      icon={Calendar}
      title={t.no_upcoming_title}
      description={t.no_upcoming_desc}
      action={{ label: t.no_upcoming_action, href: "/feed" }}
      variant="card"
    />
  )
}
