'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Crown, Loader2, Lock, LogOut, MessageSquare, MoreVertical, Send, Shield, Trophy, UserMinus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import type { TeamRole } from '@prisma/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamForm } from '@/components/teams/team-form'
import { TeamLogo } from '../teams-client'
import {
  disbandTeam,
  inviteMember,
  leaveTeam,
  removeMember,
  revokeInvite,
  setMemberRole,
  transferOwnership,
  updateTeam,
} from '@/lib/team-actions'
import { TOURNAMENT_STATUS_CLASSES, TOURNAMENT_STATUS_LABELS } from '@/lib/constants'
import { useLanguage } from '@/lib/i18n/language-context'
import type { TeamAbility } from '@/lib/teams'
import { sportLabel } from '@/lib/sports'
/** Any server action result — only `ok` and `error` are read here. */
type Outcome = { ok: true } | { ok: false; error: string }

export type TeamDetail = {
  id: string
  name: string
  sport: string
  category: string
  description: string | null
  logo: string | null
  disbanded: boolean
  createdAt: string
  channelId: string | null
  members: { id: string; name: string; username: string; avatar: string; role: TeamRole; joinedAt: string; locked: boolean }[]
  invites: { id: string; createdAt: string; name: string; username: string; avatar: string }[]
  registrations: {
    id: string
    status: string
    paymentStatus: string
    tournament: { id: string; title: string; status: keyof typeof TOURNAMENT_STATUS_LABELS; date: string; started: boolean }
    roster: { id: string; name: string }[]
    placement: number | null
  }[]
}

type Confirm = { title: string; description: string; action: () => Promise<Outcome>; success: string; after?: () => void }

export function TeamDetailClient({ team, ability, currentUserId }: { team: TeamDetail; ability: TeamAbility; currentUserId: string }) {
  const { dict } = useLanguage()
  const t = dict.team.detail
  const categories: Record<string, string> = dict.competition.categories
  const regStatus: Record<string, string> = t.registration_status
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const run = (action: () => Promise<Outcome>, success: string, after?: () => void) =>
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return void toast.error(result.error)
      toast.success(success)
      if (after) after()
      else router.refresh()
    })

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/teams" className="gap-2">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {dict.teams.title}
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <TeamLogo name={team.name} logo={team.logo} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{team.name}</h1>
            {team.disbanded ? <Badge variant="outline">{dict.teams.disbanded}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {sportLabel(dict, team.sport)} · {categories[team.category] ?? team.category} · {dict.team.members(team.members.length)}
          </p>
          {team.description ? <p className="mt-1 text-sm">{team.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {team.channelId && ability.isMember ? (
            <Button variant="outline" asChild className="gap-2">
              <Link href={`/messages/${team.channelId}`}>
                <MessageSquare className="h-4 w-4" aria-hidden />
                {dict.teams.team_chat}
              </Link>
            </Button>
          ) : null}
          {ability.role && ability.role !== 'OWNER' && !team.disbanded ? (
            <Button
              variant="ghost"
              className="gap-2 text-destructive"
              disabled={isPending}
              onClick={() =>
                setConfirm({
                  title: t.leave_title,
                  description: t.leave_description(team.name),
                  action: () => leaveTeam(team.id),
                  success: t.left,
                  after: () => router.push('/teams'),
                })
              }
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t.leave}
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="members">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="members">{t.tab_members}</TabsTrigger>
          <TabsTrigger value="tournaments">{t.tab_tournaments}</TabsTrigger>
          {ability.canEdit || ability.canDisband ? <TabsTrigger value="settings">{t.tab_settings}</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {ability.canInvite ? <InviteForm teamId={team.id} /> : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" aria-hidden />
                {t.members_title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {team.members.map((member) => {
                  const isSelf = member.id === currentUserId
                  const canRemove =
                    ability.canRemoveMembers &&
                    !isSelf &&
                    member.role !== 'OWNER' &&
                    (member.role === 'MEMBER' || ability.role === 'OWNER')
                  const showMenu = !team.disbanded && !isSelf && (canRemove || (ability.canManageRoles && member.role !== 'OWNER') || ability.canTransfer)
                  return (
                    <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar} alt="" />
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {member.name} {isSelf ? <span className="text-muted-foreground">{t.you}</span> : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
                      </div>
                      {member.locked ? (
                        <span title={t.locked_title} className="text-muted-foreground">
                          <Lock className="h-4 w-4" aria-label={t.locked_aria} />
                        </span>
                      ) : null}
                      <Badge variant={member.role === 'MEMBER' ? 'secondary' : 'default'} className="gap-1">
                        {member.role === 'OWNER' ? <Crown className="h-3 w-3" aria-hidden /> : null}
                        {member.role === 'CAPTAIN' ? <Shield className="h-3 w-3" aria-hidden /> : null}
                        {dict.team.roles[member.role]}
                      </Badge>
                      {showMenu ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t.actions_for(member.name)} disabled={isPending}>
                              <MoreVertical className="h-4 w-4" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ability.canManageRoles && member.role === 'MEMBER' ? (
                              <DropdownMenuItem onClick={() => run(() => setMemberRole({ teamId: team.id, userId: member.id, role: 'CAPTAIN' }), t.captain_set)}>
                                {t.make_captain}
                              </DropdownMenuItem>
                            ) : null}
                            {ability.canManageRoles && member.role === 'CAPTAIN' ? (
                              <DropdownMenuItem onClick={() => run(() => setMemberRole({ teamId: team.id, userId: member.id, role: 'MEMBER' }), t.role_changed)}>
                                {t.make_member}
                              </DropdownMenuItem>
                            ) : null}
                            {ability.canTransfer ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirm({
                                    title: t.transfer,
                                    description: t.transfer_description(member.name),
                                    action: () => transferOwnership({ teamId: team.id, userId: member.id }),
                                    success: t.transferred,
                                  })
                                }
                              >
                                {t.transfer}
                              </DropdownMenuItem>
                            ) : null}
                            {canRemove ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  disabled={member.locked}
                                  onClick={() =>
                                    setConfirm({
                                      title: t.remove_title,
                                      description: t.remove_description(member.name),
                                      action: () => removeMember({ teamId: team.id, userId: member.id }),
                                      success: t.removed,
                                    })
                                  }
                                >
                                  <UserMinus className="h-4 w-4" aria-hidden />
                                  {t.remove}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {ability.canInvite && team.invites.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.pending_invites}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {team.invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={invite.avatar} alt="" />
                        <AvatarFallback>{invite.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 flex-1 truncate text-sm">
                        {invite.name} <span className="text-muted-foreground">@{invite.username}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        disabled={isPending}
                        onClick={() => run(() => revokeInvite(invite.id), t.invite_revoked)}
                      >
                        <X className="h-4 w-4" aria-hidden />
                        {dict.common.cancel}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="tournaments">
          {team.registrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="max-w-sm text-sm text-muted-foreground">
                  {t.no_tournaments}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/feed">{t.browse_tournaments}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {team.registrations.map((reg) => (
                <li key={reg.id}>
                  <Card>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/tournament/${reg.tournament.id}`} className="font-medium hover:underline">
                          {reg.tournament.title}
                        </Link>
                        <Badge className={TOURNAMENT_STATUS_CLASSES[reg.tournament.status]}>
                          {dict.status[reg.tournament.status]}
                        </Badge>
                        <Badge variant="outline">{regStatus[reg.status] ?? reg.status}</Badge>
                        {reg.paymentStatus === 'pending' ? <Badge variant="outline">{t.payment_pending}</Badge> : null}
                        {reg.placement ? <Badge className="bg-primary text-primary-foreground">{t.placement(reg.placement)}</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reg.tournament.started ? t.roster_locked : t.roster}: {reg.roster.map((p) => p.name).join(', ') || '—'}
                      </p>
                      {reg.tournament.started ? (
                        <Button variant="link" size="sm" asChild className="h-auto p-0">
                          <Link href={`/results/${reg.tournament.id}`}>{t.competition_page}</Link>
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {ability.canEdit || ability.canDisband ? (
          <TabsContent value="settings" className="space-y-4">
            {ability.canEdit ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.info_title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamForm
                    initial={{
                      name: team.name,
                      sport: team.sport,
                      category: team.category,
                      description: team.description ?? '',
                      logoUrl: team.logo,
                    }}
                    submitLabel={t.save}
                    onSubmit={(values) => updateTeam({ ...values, teamId: team.id })}
                    onDone={() => {
                      toast.success(t.saved)
                      router.refresh()
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {ability.canDisband ? (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">{t.disband}</CardTitle>
                  <CardDescription>{t.disband_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                      setConfirm({
                        title: t.disband_confirm_title(team.name),
                        description: t.disband_confirm_description,
                        action: () => disbandTeam(team.id),
                        success: t.disbanded_toast,
                        after: () => router.push('/teams'),
                      })
                    }
                  >
                    {t.disband}
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const current = confirm
                setConfirm(null)
                if (current) run(current.action, current.success, current.after)
              }}
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InviteForm({ teamId }: { teamId: string }) {
  const { dict } = useLanguage()
  const t = dict.team.invite
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const userQuery = String(new FormData(form).get('userQuery') ?? '')
    setError(null)
    startTransition(async () => {
      const result = await inviteMember({ teamId, userQuery })
      if (!result.ok) {
        setError(result.fieldErrors?.userQuery ?? result.error)
        return
      }
      toast.success(t.sent(result.data.name))
      form.reset()
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" noValidate>
          <div className="flex-1 space-y-1">
            <Input name="userQuery" placeholder={t.placeholder} aria-label={t.aria} aria-invalid={Boolean(error)} disabled={isPending} />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <Button type="submit" className="gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            {t.send}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
