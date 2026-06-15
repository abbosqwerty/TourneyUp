import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  variant?: 'default' | 'primary' | 'accent' | 'gradient'
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
    ? TrendingDown 
    : Minus

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  }

  const variants = {
    default: 'bg-card',
    primary: 'bg-primary/10 border-primary/30',
    accent: 'bg-accent/10 border-accent/30',
    gradient: 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30',
  }

  return (
    <Card className={cn(variants[variant], className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 mt-2", trendColors[trend.direction])}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">
                  {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              variant === 'default' ? 'bg-secondary' : 'bg-background/50'
            )}>
              <Icon className={cn(
                "h-5 w-5",
                variant === 'primary' && 'text-primary',
                variant === 'accent' && 'text-accent',
                variant === 'gradient' && 'text-primary'
              )} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  stats: StatsCardProps[]
  columns?: 2 | 3 | 4
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  )
}
