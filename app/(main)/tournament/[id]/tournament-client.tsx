'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { TournamentCard } from '@/components/tournament-card'
import {
  LifeBuoy,
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Trophy,
  CheckCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  AlertCircle,
  Gamepad2,
  Dribbble,
  GraduationCap,
  ShieldCheck,
  Lock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import type { Tournament, TournamentDetail, TournamentStatusValue } from '@/lib/types'
import { TOURNAMENT_STATUS_CLASSES } from '@/lib/constants'
import { toast } from 'sonner'
import { ShareButton } from '@/components/share-button'
import { registerParticipant, toggleSaveTournament, unregisterParticipant } from '@/lib/actions'
import { useAuthModal } from '@/components/auth-modal'
import { ParticipantSlots, isTournamentFull } from '@/components/participant-slots'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatClock, formatDate, formatDateLong } from '@/lib/time'
import { displayFee } from '@/components/tournament-card'
import { TeamRegistrationPicker, type RegistrableTeam, type TeamSelection } from '@/components/teams/team-registration'

const categoryIcons = {
  sports: Dribbble,
  esports: Gamepad2,
  academic: GraduationCap,
}

export type TournamentAbilityProps = {
  canEditTournament: boolean
  canManageParticipants: boolean
  canManageStaff: boolean
  staffRole: 'ADMIN' | 'ORGANIZER' | 'SUPPORT' | null
  isOwner: boolean
}

export default function TournamentClient({
  tournament,
  isSaved,
  isUserRegistered,
  relatedTournaments,
  participantsCount,
  ability,
  channelId,
  currentUser,
  registration,
  teamEvent,
  drawn,
}: {
  tournament: TournamentDetail
  isSaved: boolean
  isUserRegistered: boolean
  registration: { status: string; teamName: string | null; canWithdraw: boolean } | null
  teamEvent: { teamSize: number | null; teamSizeMax: number | null; teams: RegistrableTeam[] } | null
  drawn: boolean
  relatedTournaments: Tournament[]
  participantsCount: number
  ability: TournamentAbilityProps
  channelId: string | null
  currentUser: { id: string; name: string; username: string; avatar: string; role: string } | null
}) {
  const { openLoginModal } = useAuthModal()
  const router = useRouter()
  const { dict, locale } = useLanguage()
  const d = dict.tournament.detail
  const free = dict.tournament.card.free
  const registrationStatus = registration?.status ?? 'pending'
  const registrationStatusLabel =
    registrationStatus in d.registration_status
      ? d.registration_status[registrationStatus as keyof typeof d.registration_status]
      : d.registration_status.reviewing
  const currentUserId = currentUser?.id
  const canRegister = currentUser?.role === 'USER'
  const [saved, setSaved] = useState(isSaved)
  const [posterIndex, setPosterIndex] = useState(0)
  const posterUrls = [tournament.posterUrl, ...(tournament.galleryUrls ?? [])].filter(Boolean)
  const activePoster = posterUrls[posterIndex] ?? ''
  const [registered, setRegistered] = useState(isUserRegistered)
  const [registering, setRegistering] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamSelection, setTeamSelection] = useState<TeamSelection>({ teamId: '', rosterUserIds: [] })
  const [currentParticipants, setCurrentParticipants] = useState(participantsCount)

  const CategoryIcon = categoryIcons[tournament.category as keyof typeof categoryIcons] || Trophy

  const handleSave = async () => {
    if (!currentUserId) {
      openLoginModal({
        title: dict.tournament.save_login.title,
        description: dict.tournament.save_login.description_named(tournament.title),
      })
      return
    }

    const previous = saved
    setSaved(!saved)

    const result = await toggleSaveTournament(tournament.id)
    if (!result.ok) {
      setSaved(previous)
      toast.error(result.error)
    }
  }

  const handleRegister = async () => {
    if (!currentUserId) {
      openLoginModal({
        title: d.join_login_title,
        description: d.join_login_description(tournament.title),
      })
      return
    }

    if (!canRegister) {
      toast.error(dict.tournament.errors.accounts_cannot_register)
      return
    }

    setRegistering(true)
    const result = await registerParticipant(
      teamEvent
        ? { tournamentId: tournament.id, teamId: teamSelection.teamId, rosterUserIds: teamSelection.rosterUserIds }
        : { tournamentId: tournament.id, teamName: teamName.trim() || undefined }
    )
    setRegistering(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setRegistered(true)
    setCurrentParticipants(prev => prev + 1)
    toast.success(d.applied)
    router.refresh()
  }

  const handleCancelRegistration = async () => {
    setRegistering(true)
    const result = await unregisterParticipant(tournament.id)
    setRegistering(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setRegistered(false)
    setCurrentParticipants((current) => Math.max(0, current - 1))
    toast.success(d.unregistered)
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-6 theme-detail bg-background text-foreground">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4 -ml-2">
        <Link href="/feed" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          {d.back}
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="min-w-0 lg:col-span-2 space-y-6">
          {/* Hero Banner */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-primary/30 via-secondary to-accent/30 group">
                {activePoster ? (
                  <img
                    src={activePoster}
                    alt={tournament.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CategoryIcon className="h-24 w-24 text-primary/30" />
                  </div>
                )}
                
                {/* Carousel Controls */}
                {posterUrls.length > 1 && (
                  <>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-2 sm:p-4 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100 transition-opacity z-20 [&>*]:pointer-events-auto">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 hover:bg-background/90"
                        aria-label={dict.tournament.card.prev_poster}
                        onClick={(e) => {
                          e.preventDefault()
                          setPosterIndex((current) => (current - 1 + posterUrls.length) % posterUrls.length)
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 hover:bg-background/90"
                        aria-label={dict.tournament.card.next_poster}
                        onClick={(e) => {
                          e.preventDefault()
                          setPosterIndex((current) => (current + 1) % posterUrls.length)
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
                      {posterUrls.map((url, index) => (
                        <span key={url} className={cn('h-2 w-2 rounded-full transition-all', index === posterIndex ? 'bg-white scale-125' : 'bg-white/50')} />
                      ))}
                    </div>
                  </>
                )}
              <div className="absolute left-4 right-28 top-4 flex flex-wrap gap-2">
                <Badge className={TOURNAMENT_STATUS_CLASSES[tournament.status as TournamentStatusValue]}>
                  {dict.status[tournament.status as TournamentStatusValue]}
                </Badge>
                {isTournamentFull(currentParticipants, tournament.maxParticipants) &&
                tournament.status !== 'completed' &&
                tournament.status !== 'cancelled' ? (
                  <Badge className="gap-1 bg-destructive text-white shadow-md ring-2 ring-white/80">
                    <Lock className="h-3 w-3" aria-hidden />
                    {dict.feed.full}
                  </Badge>
                ) : null}
                {tournament.featured && (
                  <Badge variant="outline" className="border-primary text-primary bg-background/50">
                    {d.featured}
                  </Badge>
                )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <ShareButton title={tournament.title} path={`/tournament/${tournament.id}`} />
                <Button
                  variant={saved ? 'default' : 'secondary'}
                  size="icon"
                  onClick={handleSave}
                  aria-label={saved ? dict.tournament.card.unsave : dict.tournament.card.save}
                  aria-pressed={saved}
                >
                  <Bookmark className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <Badge variant="secondary" className="absolute bottom-4 left-4 text-sm">
                {tournament.sport}
              </Badge>
            </div>
            <CardContent className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{tournament.title}</h1>
              
              {/* Organizer */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={tournament.organizer.avatar} alt={dict.tournament.card.logo_alt(tournament.organizer.name)} />
                  <AvatarFallback>{tournament.organizer.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tournament.organizer.name}</span>
                    {tournament.organizer.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{d.organizer}</span>
                </div>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div className="text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">
                    {formatDate(tournament.date, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.start_date}</p>
                </div>
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{formatClock(tournament.time, locale)}</p>
                  <p className="text-xs text-muted-foreground">{d.start_time}</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium line-clamp-1">{tournament.location}</p>
                  <p className="text-xs text-muted-foreground">{d.location}</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{currentParticipants}/{tournament.maxParticipants}</p>
                  <p className="text-xs text-muted-foreground">{d.participants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {d.about}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {tournament.description}
              </p>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                {d.rules}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tournament.rules.map((rule: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                {d.requirements}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tournament.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Related Tournaments */}
          {relatedTournaments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">{d.related}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTournaments.map((t) => (
                  <TournamentCard key={t.id} tournament={t} variant="compact" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar — sticky as a whole unit */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          {/* Registration Card */}
          <Card id="register">
            <CardContent className="p-6">
              {/* Prize & Entry */}
              <div className="flex justify-between items-center gap-3 mb-6">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{d.prize_pool}</p>
                  <p className="text-2xl font-bold text-primary break-words">{tournament.prizePool ? displayFee(tournament.prizePool, free) : d.tba}</p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-sm text-muted-foreground">{d.entry_fee}</p>
                  <p className="text-lg font-semibold break-words">{tournament.entryFee ? displayFee(tournament.entryFee, free) : free}</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Spots — Organized Circles */}
              <div className="mb-6">
                <ParticipantSlots
                  current={currentParticipants}
                  max={tournament.maxParticipants}
                />
              </div>

              {/* Management shortcuts for the organization and its staff */}
              {ability.canManageParticipants || ability.canManageStaff ? (
                <div className="mb-4 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                    {ability.isOwner
                      ? d.owner_note
                      : d.temp_role(d.staff_roles[ability.staffRole ?? 'SUPPORT'])}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ability.canManageParticipants ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/dashboard/participants">{d.participants_link}</Link>
                      </Button>
                    ) : null}
                    {ability.canManageStaff ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/tournaments/${tournament.id}/staff`}>{d.staff_link}</Link>
                      </Button>
                    ) : null}
                    {channelId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/messages/${channelId}`}>{d.channel_link}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Registration CTA */}
              {currentUser && !canRegister ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-medium">
                        {currentUser.role === 'ORGANIZATION' ? d.org_account : d.admin_account}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {d.cannot_register_note}
                    </p>
                  </div>
                  <Button variant={saved ? 'default' : 'outline'} className="w-full gap-2" onClick={handleSave}>
                    <Bookmark className="h-4 w-4" />
                    {saved ? d.saved : d.save_for_later}
                  </Button>
                </div>
              ) : registered ? (
                <div className="space-y-3">
                  <Button className="w-full gap-2 bg-success hover:bg-success/90 cursor-default" size="lg">
                    <CheckCircle className="h-5 w-5" />
                    <span className="truncate">{registration?.teamName && teamEvent ? d.team_registered(registration.teamName) : d.you_registered}</span>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {d.application_status(registrationStatusLabel)}
                  </p>
                  {drawn ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/results/${tournament.id}`}>{d.match_page}</Link>
                    </Button>
                  ) : registration?.canWithdraw !== false ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCancelRegistration}
                      disabled={registering}
                    >
                      {registering ? d.cancelling : d.cancel_registration}
                    </Button>
                  ) : null}
                </div>
              ) : tournament.status === 'registration_open' ? (
                <div className="space-y-3">
                  {teamEvent ? (
                    <TeamRegistrationPicker
                      teams={teamEvent.teams}
                      sport={tournament.sport}
                      teamSize={teamEvent.teamSize}
                      teamSizeMax={teamEvent.teamSizeMax}
                      value={teamSelection}
                      onChange={setTeamSelection}
                      disabled={registering}
                    />
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {d.team_name_optional}
                      </label>
                      <Input
                        placeholder={d.team_name_placeholder}
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        disabled={registering}
                        className="text-sm"
                      />
                    </div>
                  )}

                  {/* Approved participants join the tournament group automatically. */}
                  <p className="rounded-lg border border-border/50 bg-secondary/40 p-2.5 text-xs text-muted-foreground">
                    {d.group_note}
                  </p>

                  <Button 
                    className="w-full gap-2" 
                    size="lg" 
                    onClick={handleRegister}
                    disabled={registering || (teamEvent !== null && !teamSelection.teamId)}
                  >
                    <Trophy className="h-5 w-5" />
                    <span className="truncate">
                      {registering
                        ? d.registering
                        : teamEvent
                          ? d.register_team
                          : currentUser?.name
                            ? d.register_as(currentUser.name)
                            : d.register_now}
                    </span>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {d.registration_closes(formatDate(tournament.date, locale))}
                  </p>
                </div>
              ) : tournament.status === 'upcoming' ? (
                <div className="space-y-3">
                  <Button className="w-full" size="lg" disabled>
                    {d.registration_closed}
                  </Button>
                  <Button 
                    variant={saved ? "default" : "outline"} 
                    className="w-full gap-2"
                    onClick={handleSave}
                  >
                    <Bookmark className="h-4 w-4" />
                    {saved ? d.saved : d.save_for_later}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full" size="lg" variant="secondary" disabled>
                    {tournament.status === 'ongoing' ? d.in_progress : tournament.status === 'cancelled' ? dict.status.cancelled : d.ended}
                  </Button>
                  {drawn ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/results/${tournament.id}`}>{d.bracket_results}</Link>
                    </Button>
                  ) : null}
                </div>
              )}

              {currentUser && tournament.status !== 'completed' && tournament.status !== 'cancelled' ? (
                <Button variant="ghost" size="sm" className="mt-3 w-full gap-2 text-muted-foreground" asChild>
                  <Link href={`/messages/support/new?tournament=${tournament.id}`}>
                    <LifeBuoy className="h-4 w-4" aria-hidden />
                    <span className="truncate">{d.ask_support}</span>
                  </Link>
                </Button>
              ) : null}

              <Separator className="my-6" />

              {/* Quick Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatDateLong(tournament.date, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatClock(tournament.time, locale)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{tournament.location}</span>
                </div>
                {tournament.prizePool && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{d.prize_pool_line(displayFee(tournament.prizePool, free))}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">{d.about_organizer}</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={tournament.organizer.avatar} alt={dict.tournament.card.logo_alt(tournament.organizer.name)} />
                  <AvatarFallback>{tournament.organizer.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tournament.organizer.name}</span>
                    {tournament.organizer.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{d.tournament_organizer}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/messages">{d.contact_organizer}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

