'use client';

import { Calendar, Swords, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { Achievement, SportRank, Tournament, User, UserMatchView } from '@/lib/types';
import { ProfileHeader } from '@/components/profile-header';
import { DbErrorCard } from '@/components/db-error-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentCard } from '@/components/tournament-card';
import { NoUpcomingMatches } from '@/components/empty-state';
import { useLanguage } from '@/lib/i18n/language-context';
import { cn } from '@/lib/utils';
import { formatDayMonth } from '@/lib/time'
import { stageLabel } from '@/lib/competition/labels'

interface ProfileContentProps {
  data: {
    profile: User;
    joinedTournaments: Tournament[];
    upcomingTournaments: Tournament[];
    matches: UserMatchView[];
  };
}

export default function ProfileContent({ data }: ProfileContentProps) {
  const { dict, locale } = useLanguage(); // locale forces re‑render on language change

  const resultStyles: Record<UserMatchView['result'], string> = {
    win: 'bg-success/20 text-success border-success/30',
    loss: 'bg-destructive/20 text-destructive border-destructive/30',
    draw: 'bg-warning/20 text-warning border-warning/30',
    pending: 'bg-muted text-muted-foreground border-border',
  };

  const resultLabels: Record<UserMatchView['result'], string> = {
    win: dict.profile.win,
    loss: dict.profile.loss,
    draw: dict.profile.draw,
    pending: dict.profile.pending,
  };

  const { profile, joinedTournaments, upcomingTournaments, matches } = data;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-3.5 sm:px-4 py-4 sm:py-6 theme-profile bg-background text-foreground overflow-x-clip min-w-0">
      <ProfileHeader user={profile} isOwnProfile />

      <Tabs defaultValue="history" className="w-full min-w-0">
        <TabsList className="sticky top-[4.0625rem] z-30 h-11 w-full max-w-full flex-nowrap justify-start overflow-x-auto shadow-sm scrollbar-none">
          <TabsTrigger value="history" className="gap-2 shrink-0 text-xs sm:text-sm">
            <Swords className="h-4 w-4" aria-hidden />
            {dict.profile.match_history}
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="gap-2 shrink-0 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" aria-hidden />
            {dict.profile.tournaments}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2 shrink-0 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" aria-hidden />
            {dict.profile.upcoming}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 sm:mt-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{dict.profile.recent_matches}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {matches.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{dict.profile.no_matches}</p>
              ) : (
                <ul className="space-y-3 sm:space-y-4">
                  {matches.map((match) => (
                    <li
                      key={match.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 rounded-xl border border-border p-3 sm:p-4 transition-colors hover:border-primary/50 min-w-0"
                    >
                      <div className="flex min-w-0 items-start sm:items-center gap-3">
                        <Badge variant="outline" className={cn('shrink-0 text-[11px] sm:text-xs', resultStyles[match.result])}>
                          {match.result === 'win' && <TrendingUp className="mr-1 h-3 w-3" aria-hidden />}
                          {match.result === 'loss' && <TrendingDown className="mr-1 h-3 w-3" aria-hidden />}
                          {resultLabels[match.result]}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-sm sm:text-base">{match.tournamentTitle}</p>
                          <p className="truncate text-xs sm:text-sm text-muted-foreground">
                            {match.stage ? `${stageLabel(dict, match.stage)} · ` : ''}{dict.account.profile.vs(match.opponent)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-1.5 sm:pt-0 border-border/40 shrink-0">
                        <p className="text-base sm:text-lg font-bold">{match.score}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          {match.scheduledAt
                            ? formatDayMonth(match.scheduledAt, locale)
                            : '—'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-6">
          {joinedTournaments.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">{dict.profile.no_tournaments_own}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {joinedTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingTournaments.length === 0 ? (
            <NoUpcomingMatches />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
