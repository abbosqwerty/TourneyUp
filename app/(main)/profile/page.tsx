import { redirect } from 'next/navigation';
import { Calendar, Swords, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { Achievement, SportRank, Tournament, User } from '@/lib/types';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { tournamentPoster } from '@/lib/media';
import { listUserMatches, userRecord, type UserMatchView } from '@/lib/matches';
import { ProfileHeader } from '@/components/profile-header';
import { DbErrorCard } from '@/components/db-error-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentCard } from '@/components/tournament-card';
import { NoUpcomingMatches } from '@/components/empty-state';
import ProfileContent from './ProfileContent';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Profil', robots: { index: false } };

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login?next=%2Fprofile');

  let data: Awaited<ReturnType<typeof load>> | null = null;
  try {
    data = await load(session.id);
  } catch (error) {
    console.error('profile page failed', error);
  }

  if (!data) return <DbErrorCard message="Profilni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring." />;

  return <ProfileContent data={data} />;
}

async function load(userId: string) {
  const [user, registrations, matches, record] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { achievements: true, sportRanks: true },
    }),
    db.participant.findMany({
      where: { userId },
      include: {
        tournament: {
          include: {
            organizer: { select: { id: true, name: true, avatar: true, verified: true } },
            organization: { select: { name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
    }),
    listUserMatches(userId),
    userRecord(userId),
  ]);

  if (!user) return null;

  const joinedTournaments: Tournament[] = registrations.map((reg) => ({
    id: reg.tournament.id,
    title: reg.tournament.title,
    sport: reg.tournament.sport,
    category: reg.tournament.category as Tournament['category'],
    location: reg.tournament.location,
    date: reg.tournament.date,
    endDate: reg.tournament.endDate || undefined,
    time: reg.tournament.time,
    participants: reg.tournament._count.participants,
    maxParticipants: reg.tournament.maxParticipants,
    posterUrl: tournamentPoster(reg.tournament) ?? '',
    organizer: {
      id: reg.tournament.organizer.id,
      name: reg.tournament.organization?.name ?? reg.tournament.organizer.name,
      avatar: reg.tournament.organizer.avatar,
      verified: reg.tournament.organizer.verified,
    },
    status: reg.tournament.status as Tournament['status'],
    featured: reg.tournament.featured,
    prizePool: reg.tournament.prizePool || undefined,
    entryFee: reg.tournament.entryFee || undefined,
  }));

  const today = new Date().toISOString().slice(0, 10);

  const profile: User = {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio || '',
    university: user.university || undefined,
    location: user.location,
    globalRank: user.globalRank,
    totalPoints: user.totalPoints,
    joinedDate: user.joinedDate,
    joinedTournaments: joinedTournaments.length,
    wins: record.wins,
    losses: record.losses,
    achievements: user.achievements.map((ach) => ({ ...ach, rarity: ach.rarity as Achievement['rarity'] })),
    sportRanks: user.sportRanks.map((sr) => ({ ...sr, tier: sr.tier as SportRank['tier'] })),
  };

  return {
    profile,
    joinedTournaments,
    upcomingTournaments: joinedTournaments.filter(
      (tournament) => tournament.date >= today && tournament.status !== 'completed'
    ),
    matches,
  };
}
