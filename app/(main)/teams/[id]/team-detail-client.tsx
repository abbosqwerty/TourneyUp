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
import { CATEGORY_LABELS, TOURNAMENT_STATUS_CLASSES, TOURNAMENT_STATUS_LABELS } from '@/lib/constants'
import type { TeamAbility } from '@/lib/teams'
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

const ROLE_LABELS: Record<TeamRole, string> = { OWNER: 'Egasi', CAPTAIN: 'Kapitan', MEMBER: 'A’zo' }
const REG_STATUS: Record<string, string> = { pending: 'Ko‘rib chiqilmoqda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan' }

type Confirm = { title: string; description: string; action: () => Promise<Outcome>; success: string; after?: () => void }

export function TeamDetailClient({ team, ability, currentUserId }: { team: TeamDetail; ability: TeamAbility; currentUserId: string }) {
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
          Jamoalarim
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <TeamLogo name={team.name} logo={team.logo} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{team.name}</h1>
            {team.disbanded ? <Badge variant="outline">Tarqatilgan</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {team.sport} · {CATEGORY_LABELS[team.category] ?? team.category} · {team.members.length} a’zo
          </p>
          {team.description ? <p className="mt-1 text-sm">{team.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {team.channelId && ability.isMember ? (
            <Button variant="outline" asChild className="gap-2">
              <Link href={`/messages/${team.channelId}`}>
                <MessageSquare className="h-4 w-4" aria-hidden />
                Jamoa chati
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
                  title: 'Jamoadan chiqish',
                  description: `“${team.name}” jamoasidan chiqasiz va jamoa chatiga kirish yopiladi.`,
                  action: () => leaveTeam(team.id),
                  success: 'Jamoadan chiqdingiz',
                  after: () => router.push('/teams'),
                })
              }
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Chiqish
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="members">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="members">Tarkib</TabsTrigger>
          <TabsTrigger value="tournaments">Turnirlar</TabsTrigger>
          {ability.canEdit || ability.canDisband ? <TabsTrigger value="settings">Sozlamalar</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {ability.canInvite ? <InviteForm teamId={team.id} /> : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" aria-hidden />
                A’zolar
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
                          {member.name} {isSelf ? <span className="text-muted-foreground">(siz)</span> : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
                      </div>
                      {member.locked ? (
                        <span title="Davom etayotgan turnir tarkibida" className="text-muted-foreground">
                          <Lock className="h-4 w-4" aria-label="Tarkib qulflangan" />
                        </span>
                      ) : null}
                      <Badge variant={member.role === 'MEMBER' ? 'secondary' : 'default'} className="gap-1">
                        {member.role === 'OWNER' ? <Crown className="h-3 w-3" aria-hidden /> : null}
                        {member.role === 'CAPTAIN' ? <Shield className="h-3 w-3" aria-hidden /> : null}
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      {showMenu ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`${member.name} uchun amallar`} disabled={isPending}>
                              <MoreVertical className="h-4 w-4" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ability.canManageRoles && member.role === 'MEMBER' ? (
                              <DropdownMenuItem onClick={() => run(() => setMemberRole({ teamId: team.id, userId: member.id, role: 'CAPTAIN' }), 'Kapitan tayinlandi')}>
                                Kapitan qilish
                              </DropdownMenuItem>
                            ) : null}
                            {ability.canManageRoles && member.role === 'CAPTAIN' ? (
                              <DropdownMenuItem onClick={() => run(() => setMemberRole({ teamId: team.id, userId: member.id, role: 'MEMBER' }), 'Rol o‘zgartirildi')}>
                                Oddiy a’zo qilish
                              </DropdownMenuItem>
                            ) : null}
                            {ability.canTransfer ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirm({
                                    title: 'Egalikni o‘tkazish',
                                    description: `${member.name} jamoa egasi bo‘ladi, siz kapitan bo‘lasiz. Bu amalni faqat yangi ega qaytara oladi.`,
                                    action: () => transferOwnership({ teamId: team.id, userId: member.id }),
                                    success: 'Egalik o‘tkazildi',
                                  })
                                }
                              >
                                Egalikni o‘tkazish
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
                                      title: 'A’zoni chiqarish',
                                      description: `${member.name} jamoadan va jamoa chatidan chiqariladi.`,
                                      action: () => removeMember({ teamId: team.id, userId: member.id }),
                                      success: 'A’zo chiqarildi',
                                    })
                                  }
                                >
                                  <UserMinus className="h-4 w-4" aria-hidden />
                                  Jamoadan chiqarish
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
                <CardTitle className="text-base">Javob kutilayotgan takliflar</CardTitle>
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
                        onClick={() => run(() => revokeInvite(invite.id), 'Taklif bekor qilindi')}
                      >
                        <X className="h-4 w-4" aria-hidden />
                        Bekor qilish
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
                  Jamoa hali turnirga yozilmagan. Jamoaviy turnir sahifasida “Ro‘yxatdan o‘tish”ni bosib, shu jamoani va tarkibni tanlang.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/feed">Turnirlarni ko‘rish</Link>
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
                          {TOURNAMENT_STATUS_LABELS[reg.tournament.status]}
                        </Badge>
                        <Badge variant="outline">{REG_STATUS[reg.status] ?? reg.status}</Badge>
                        {reg.paymentStatus === 'pending' ? <Badge variant="outline">To‘lov kutilmoqda</Badge> : null}
                        {reg.placement ? <Badge className="bg-primary text-primary-foreground">{reg.placement}-o‘rin</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tarkib{reg.tournament.started ? ' (qulflangan)' : ''}: {reg.roster.map((p) => p.name).join(', ') || '—'}
                      </p>
                      {reg.tournament.started ? (
                        <Button variant="link" size="sm" asChild className="h-auto p-0">
                          <Link href={`/results/${reg.tournament.id}`}>Musobaqa sahifasi</Link>
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
                  <CardTitle className="text-base">Jamoa ma’lumotlari</CardTitle>
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
                    submitLabel="Saqlash"
                    onSubmit={(values) => updateTeam({ ...values, teamId: team.id })}
                    onDone={() => {
                      toast.success('Saqlandi')
                      router.refresh()
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {ability.canDisband ? (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Jamoani tarqatish</CardTitle>
                  <CardDescription>
                    Jamoa yopiladi, chat arxivlanadi, takliflar bekor bo‘ladi. O‘tgan turnir natijalari va ballar saqlanib qoladi.
                    Faol turnirda bo‘lgan jamoani tarqatib bo‘lmaydi.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                      setConfirm({
                        title: `“${team.name}”ni tarqatish`,
                        description: 'Bu amalni qaytarib bo‘lmaydi. Davom etasizmi?',
                        action: () => disbandTeam(team.id),
                        success: 'Jamoa tarqatildi',
                        after: () => router.push('/teams'),
                      })
                    }
                  >
                    Jamoani tarqatish
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
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const current = confirm
                setConfirm(null)
                if (current) run(current.action, current.success, current.after)
              }}
            >
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InviteForm({ teamId }: { teamId: string }) {
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
      toast.success(`${result.data.name} taklif qilindi`)
      form.reset()
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" noValidate>
          <div className="flex-1 space-y-1">
            <Input name="userQuery" placeholder="Username yoki email orqali taklif qilish" aria-label="Taklif qilinadigan foydalanuvchi" aria-invalid={Boolean(error)} disabled={isPending} />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <Button type="submit" className="gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Taklif yuborish
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
