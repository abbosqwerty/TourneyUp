'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MapPin, 
  Calendar, 
  Trophy, 
  Medal,
  Star,
  Edit,
  GraduationCap,
  Settings,
  Sun,
  Moon,
  LogOut,
  MoreVertical,
  Globe
} from 'lucide-react'
import type { User } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/language-context'
import { logout } from '@/lib/auth-actions'
import { LOCALES } from '@/lib/i18n/types'

interface ProfileHeaderProps {
  user: User
  isOwnProfile?: boolean
}

const tierColors = {
  bronze: 'from-amber-700 to-amber-900 text-amber-200',
  silver: 'from-gray-400 to-gray-600 text-white',
  gold: 'from-yellow-400 to-yellow-600 text-yellow-900',
  platinum: 'from-cyan-400 to-cyan-600 text-cyan-900',
  diamond: 'from-blue-400 to-purple-500 text-white',
  champion: 'from-purple-500 to-pink-500 text-white',
}

const rarityColors = {
  common: 'bg-secondary text-secondary-foreground',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30',
}

export function ProfileHeader({ user, isOwnProfile = false }: ProfileHeaderProps) {
  const { dict, locale, setLocale } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const [isLoggingOut, startLogout] = useTransition()
  const router = useRouter()

  const winRate = user.wins + user.losses > 0 
    ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
    : 0

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const handleLogout = () =>
    startLogout(async () => {
      const result = await logout()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      window.location.href = '/'
    })

  return (
    <Card className="overflow-hidden border-border bg-card w-full max-w-full">
      {/* Banner */}
      <div className="relative h-28 sm:h-36 md:h-40 bg-gradient-to-br from-primary/30 via-secondary to-accent/30">
        {/* Settings button on top right of banner for mobile & desktop */}
        {isOwnProfile && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full bg-background/80 backdrop-blur shadow-xs border border-border/60 text-xs px-2.5 hover:bg-background"
                  aria-label={dict.profile.settings_dropdown}
                >
                  <Settings className="h-3.5 w-3.5 text-foreground" />
                  <span className="hidden sm:inline font-medium">{dict.nav.settings}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {dict.profile.settings_dropdown}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="cursor-pointer gap-2 text-xs">
                    <Edit className="h-4 w-4" />
                    {dict.profile.edit_profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer gap-2 text-xs">
                    <Settings className="h-4 w-4" />
                    {dict.nav.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2 text-xs">
                  {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {resolvedTheme === 'dark' ? dict.nav.theme_light : dict.nav.theme_dark}
                </DropdownMenuItem>

                {/* Sub-menu or direct language toggles */}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{dict.nav.language}:</span>
                </div>
                <div className="flex px-2 py-1 gap-1">
                  {LOCALES.map((l) => (
                    <Button
                      key={l.code}
                      type="button"
                      variant={locale === l.code ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocale(l.code)}
                      className="h-7 text-xs flex-1 px-1"
                    >
                      {l.flag} {l.shortLabel}
                    </Button>
                  ))}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {dict.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      <CardContent className="relative px-3.5 sm:px-6 pb-6 min-w-0">
        {/* Avatar and basic info */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-14 sm:-mt-16 md:-mt-12 min-w-0">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 border-background shadow-xl ring-4 ring-primary/20 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xl sm:text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 sm:pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate max-w-full">{user.name}</h1>
              <Badge variant="outline" className="text-primary border-primary shrink-0 text-xs">
                #{user.globalRank}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          </div>

          {isOwnProfile && (
            <div className="flex items-center gap-2 shrink-0 sm:pb-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <Link href="/settings/profile">
                  <Edit className="h-3.5 w-3.5" aria-hidden />
                  {dict.profile.edit_profile}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground break-words max-w-full">
            {user.bio}
          </p>
        ) : null}

        {/* Info badges */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
          {user.university && (
            <div className="flex items-center gap-1.5 min-w-0">
              <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
              <span className="break-words">{user.university}</span>
            </div>
          )}
          {user.location && (
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="break-words">{user.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {new Date(user.joinedDate).toLocaleDateString(locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'uz-UZ', { month: 'short', year: 'numeric' })} {dict.profile.since_prefix}
            </span>
          </div>
        </div>

        {/* Stats - 2 cols on phone, 4 on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-6">
          <div className="text-center p-2.5 sm:p-3 rounded-xl bg-secondary/50 min-w-0 border border-border/30">
            <p className="text-lg sm:text-2xl font-black text-primary truncate">{user.totalPoints.toLocaleString()}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{dict.profile.total_points}</p>
          </div>
          <div className="text-center p-2.5 sm:p-3 rounded-xl bg-secondary/50 min-w-0 border border-border/30">
            <p className="text-lg sm:text-2xl font-black truncate">{user.joinedTournaments}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{dict.profile.tournaments_count}</p>
          </div>
          <div className="text-center p-2.5 sm:p-3 rounded-xl bg-secondary/50 min-w-0 border border-border/30">
            <p className="text-lg sm:text-2xl font-black text-success truncate">{user.wins}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{dict.profile.wins}</p>
          </div>
          <div className="text-center p-2.5 sm:p-3 rounded-xl bg-secondary/50 min-w-0 border border-border/30">
            <p className="text-lg sm:text-2xl font-black truncate">{winRate}%</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{dict.profile.win_rate}</p>
          </div>
        </div>

        {/* Achievements */}
        {user.achievements.length > 0 && (
          <div className="mt-5 sm:mt-6">
            <h3 className="font-semibold text-xs sm:text-sm mb-2.5 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-primary shrink-0" />
              {dict.profile.achievements}
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {user.achievements.map((achievement) => (
                <Badge 
                  key={achievement.id}
                  variant="outline"
                  className={cn("gap-1.5 text-xs py-1", rarityColors[achievement.rarity])}
                >
                  {achievement.rarity === 'legendary' && <Trophy className="h-3 w-3 shrink-0" />}
                  {achievement.rarity === 'epic' && <Medal className="h-3 w-3 shrink-0" />}
                  {achievement.rarity === 'rare' && <Star className="h-3 w-3 shrink-0" />}
                  <span className="truncate max-w-[200px]">{achievement.title}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sport Rankings - single col on narrow mobile, 2 on sm, 4 on lg */}
        {user.sportRanks.length > 0 && (
          <div className="mt-5 sm:mt-6">
            <h3 className="font-semibold text-xs sm:text-sm mb-2.5">{dict.profile.sport_rankings}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {user.sportRanks.map((sportRank) => (
                <div 
                  key={sportRank.sport}
                  className="p-3 rounded-xl border border-border bg-card/60 hover:border-primary/50 transition-colors min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs sm:text-sm font-semibold truncate">{sportRank.sport}</span>
                    <Badge 
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 shrink-0 bg-gradient-to-r border-0",
                        tierColors[sportRank.tier]
                      )}
                    >
                      {sportRank.tier.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-base sm:text-lg font-bold">#{sportRank.rank}</p>
                  <p className="text-xs text-muted-foreground">{sportRank.points} {dict.profile.points_suffix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
