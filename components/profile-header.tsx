import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MapPin, 
  Calendar, 
  Trophy, 
  Medal,
  Star,
  Edit,
  Share2,
  MoreHorizontal,
  GraduationCap
} from 'lucide-react'
import type { User } from '@/lib/mock-data'

interface ProfileHeaderProps {
  user: User
  isOwnProfile?: boolean
  onEdit?: () => void
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

export function ProfileHeader({ user, isOwnProfile = false, onEdit }: ProfileHeaderProps) {
  const winRate = user.wins + user.losses > 0 
    ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
    : 0

  return (
    <Card className="overflow-hidden">
      {/* Banner */}
      <div className="h-32 md:h-40 bg-gradient-to-br from-primary/30 via-secondary to-accent/30 relative">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
      </div>
      
      <CardContent className="relative px-4 md:px-6 pb-6">
        {/* Avatar */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-12">
          <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background shadow-xl ring-4 ring-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 md:pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              <Badge variant="outline" className="text-primary border-primary">
                #{user.globalRank}
              </Badge>
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>

          <div className="flex gap-2 md:pb-2">
            {isOwnProfile ? (
              <Button variant="outline" className="gap-2" onClick={onEdit}>
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Challenge
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="mt-4 text-muted-foreground">{user.bio}</p>

        {/* Info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          {user.university && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {user.university}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {user.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-2xl font-bold text-primary">{user.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-2xl font-bold">{user.joinedTournaments}</p>
            <p className="text-xs text-muted-foreground">Tournaments</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-2xl font-bold text-success">{user.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.achievements.map((achievement) => (
              <Badge 
                key={achievement.id}
                variant="outline"
                className={cn("gap-1.5", rarityColors[achievement.rarity])}
              >
                {achievement.rarity === 'legendary' && <Trophy className="h-3 w-3" />}
                {achievement.rarity === 'epic' && <Medal className="h-3 w-3" />}
                {achievement.rarity === 'rare' && <Star className="h-3 w-3" />}
                {achievement.title}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sport Rankings */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Sport Rankings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {user.sportRanks.map((sportRank) => (
              <div 
                key={sportRank.sport}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{sportRank.sport}</span>
                  <Badge 
                    className={cn(
                      "text-[10px] px-1.5 bg-gradient-to-r border-0",
                      tierColors[sportRank.tier]
                    )}
                  >
                    {sportRank.tier.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-lg font-bold">#{sportRank.rank}</p>
                <p className="text-xs text-muted-foreground">{sportRank.points} pts</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
