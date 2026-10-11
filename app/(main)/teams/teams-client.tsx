'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Crown, Loader2, Mail, Plus, Shield, Shirt, Trophy, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmptyState } from '@/components/empty-state'
import { TeamForm } from '@/components/teams/team-form'
import { createTeam, respondToInvite } from '@/lib/team-actions'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { TeamCard } from '@/lib/teams'
import { cn } from '@/lib/utils'

type Invite = {
  id: string
  expiresAt: string
  invitedBy: string | null
  team: { id: string; name: string; sport: string; logo: string | null; memberCount: number }
}

const ROLE_BADGE: Record<TeamCard['myRole'], { label: string; className: string; icon: typeof Crown }> = {
  OWNER: { label: 'Egasi', className: 'bg-primary text-primary-foreground', icon: Crown },
  CAPTAIN: { label: 'Kapitan', className: 'border border-primary/40 bg-primary/10 text-primary', icon: Shield },
  MEMBER: { label: 'A’zo', className: 'bg-secondary text-secondary-foreground', icon: Users },
}

export function TeamLogo({ name, logo, className }: { name: string; logo: string | null; className?: string }) {
  return (
    <Avatar className={cn('h-12 w-12 rounded-xl', className)}>
      {logo ? <AvatarImage src={logo} alt="" className="object-cover" /> : null}
      <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export function TeamsClient({
  teams,
  invites,
  canCreate,
  maxTeams,
}: {
  teams: TeamCard[]
  invites: Invite[]
  canCreate: boolean
  maxTeams: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const active = teams.filter((t) => !t.disbanded)
  const disbanded = teams.filter((t) => t.disbanded)

  const createButton = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={!canCreate} title={canCreate ? undefined : `Ko‘pi bilan ${maxTeams} ta jamoa`}>
          <Plus className="h-4 w-4" aria-hidden />
          Jamoa yaratish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yangi jamoa</DialogTitle>
          <DialogDescription>Siz jamoa egasi bo‘lasiz. Keyin a’zolarni taklif qilasiz.</DialogDescription>
        </DialogHeader>
        <TeamForm
          submitLabel="Yaratish"
          onSubmit={(values) => createTeam(values)}
          onDone={(result) => {
            setOpen(false)
            toast.success('Jamoa yaratildi')
            if (result.ok && result.data && typeof result.data === 'object' && 'teamId' in result.data) {
              router.push(`/teams/${(result.data as { teamId: string }).teamId}`)
            } else {
              router.refresh()
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Jamoalarim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Har bir o‘yin uchun alohida jamoa — tarkib, rollar va turnirga yozilish shu yerda.
          </p>
        </div>
        {createButton}
      </div>

      {invites.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Mail className="h-4 w-4" aria-hidden />
            Takliflar ({invites.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {invites.map((invite) => (
              <InviteCard key={invite.id} invite={invite} />
            ))}
          </div>
        </section>
      ) : null}

      {active.length === 0 ? (
        <EmptyState
          icon={Shirt}
          variant="card"
          title="Hali jamoangiz yo‘q"
          description="Futbol, Valorant yoki boshqa jamoaviy musobaqalar uchun jamoa tuzing. Do‘stlaringizni taklif qiling, kapitan tayinlang va jamoaviy turnirlarga birga yoziling. Har bir jamoaning o‘z yopiq chati bo‘ladi."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((team) => (
            <TeamCardView key={team.id} team={team} />
          ))}
        </div>
      )}

      {disbanded.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tarqatilgan jamoalar</h2>
          <div className="grid gap-4 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
            {disbanded.map((team) => (
              <TeamCardView key={team.id} team={team} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function TeamCardView({ team }: { team: TeamCard }) {
  const role = ROLE_BADGE[team.myRole]
  const RoleIcon = role.icon
  return (
    <Card className="flex flex-col transition-colors hover:border-primary/40">
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <TeamLogo name={team.name} logo={team.logo} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{team.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {team.sport} · {CATEGORY_LABELS[team.category] ?? team.category}
            </p>
          </div>
          <Badge className={cn('gap-1', role.className)}>
            <RoleIcon className="h-3 w-3" aria-hidden />
            {role.label}
          </Badge>
        </div>

        {team.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{team.description}</p> : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {team.memberCount} a’zo
          </span>
          <span className="flex items-center gap-1">
            <Crown className="h-3.5 w-3.5" aria-hidden />
            {team.owner.name}
          </span>
          {team.activeTournaments > 0 ? (
            <span className="flex items-center gap-1 text-primary">
              <Trophy className="h-3.5 w-3.5" aria-hidden />
              {team.activeTournaments} faol turnir
            </span>
          ) : null}
          {team.disbanded ? <Badge variant="outline">Tarqatilgan</Badge> : null}
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/teams/${team.id}`}>{team.myRole === 'MEMBER' ? 'Ochish' : 'Ochish va boshqarish'}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function InviteCard({ invite }: { invite: Invite }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const answer = (accept: boolean) =>
    startTransition(async () => {
      const result = await respondToInvite({ inviteId: invite.id, accept })
      if (!result.ok) return void toast.error(result.error)
      toast.success(accept ? `“${invite.team.name}” jamoasiga qo‘shildingiz` : 'Taklif rad etildi')
      if (accept) router.push(`/teams/${invite.team.id}`)
      else router.refresh()
    })

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-3 p-4">
        <TeamLogo name={invite.team.name} logo={invite.team.logo} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{invite.team.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {invite.team.sport} · {invite.team.memberCount} a’zo
            {invite.invitedBy ? ` · ${invite.invitedBy} taklif qildi` : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" aria-label="Rad etish" disabled={isPending} onClick={() => answer(false)}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
          <Button size="icon" aria-label="Qabul qilish" disabled={isPending} onClick={() => answer(true)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
