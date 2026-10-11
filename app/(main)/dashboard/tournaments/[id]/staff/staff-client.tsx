'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Search, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { revokeReasonLabel } from '@/lib/staff-labels'
import { useLanguage } from '@/lib/i18n/language-context'
import { assignTournamentStaff, revokeTournamentStaff, searchAssignableUsers } from '@/lib/staff-actions'
import { formatDate } from '@/lib/time'

type StaffRole = 'ADMIN' | 'ORGANIZER' | 'SUPPORT'

type Grant = {
  id: string
  role: StaffRole
  grantedAt: string
  revokedAt: string | null
  revokeReason: string | null
  user: { id: string; name: string; username: string; email: string | null; avatar: string }
  grantedByName: string | null
}

type Candidate = { id: string; name: string; username: string; email: string | null; avatar: string }

export function StaffClient({
  tournamentId,
  staff,
  isClosed,
}: {
  tournamentId: string
  staff: Grant[]
  isClosed: boolean
}) {
  const router = useRouter()
  const { dict, locale } = useLanguage()
  const d = dict.dashboard
  const t = d.staff
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<StaffRole>('ORGANIZER')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Debounced typeahead over platform users. Every state write happens inside
  // the timer callback, never synchronously in the effect body.
  useEffect(() => {
    const term = query.trim()
    let cancelled = false

    const timer = setTimeout(async () => {
      if (term.length < 2 || isClosed) {
        setCandidates([])
        return
      }

      setIsSearching(true)
      const result = await searchAssignableUsers(tournamentId, term)
      if (cancelled) return
      setIsSearching(false)
      setCandidates(result.ok ? result.data : [])
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, tournamentId, isClosed])

  const assign = (userQuery: string) => {
    setErrors({})
    startTransition(async () => {
      const result = await assignTournamentStaff({ tournamentId, userQuery, role })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
        return
      }
      toast.success(t.toast_assigned(result.data.userName, d.roles[role]))
      setQuery('')
      setCandidates([])
      router.refresh()
    })
  }

  const revoke = (grant: Grant) => {
    startTransition(async () => {
      const result = await revokeTournamentStaff({ staffId: grant.id, reason: '' })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t.toast_revoked(grant.user.name))
      router.refresh()
    })
  }

  const active = staff.filter((grant) => !grant.revokedAt)
  const revoked = staff.filter((grant) => grant.revokedAt)

  return (
    <div className="space-y-6">
      {isClosed ? (
        <Card className="border-muted bg-muted/40">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t.closed_notice}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.assign_title}</CardTitle>
            <CardDescription>
              {t.assign_desc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <div className="space-y-2">
                <Label htmlFor="staff-search">{t.user_label}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="staff-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.user_placeholder}
                    className="pl-9"
                    disabled={isPending}
                    aria-invalid={Boolean(errors.userQuery)}
                  />
                  {isSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                {errors.userQuery ? <p className="text-xs text-destructive">{errors.userQuery}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-role">{t.role_label}</Label>
                <Select value={role} onValueChange={(value) => setRole(value as StaffRole)} disabled={isPending}>
                  <SelectTrigger id="staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['ADMIN', 'ORGANIZER', 'SUPPORT'] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {d.roles[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {d.role_descriptions[role]}
            </p>

            {candidates.length > 0 ? (
              <ul className="divide-y divide-border rounded-md border border-border">
                {candidates.map((candidate) => (
                  <li key={candidate.id} className="flex items-center gap-3 p-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={candidate.avatar} alt={d.avatar_alt(candidate.name)} />
                      <AvatarFallback>{candidate.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{candidate.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{candidate.username}
                        {candidate.email ? ` · ${candidate.email}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 gap-2"
                      disabled={isPending}
                      onClick={() => assign(candidate.username)}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      {t.assign}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && !isSearching ? (
              <p className="text-sm text-muted-foreground">{t.no_user_found}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.active_title(active.length)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.no_active}</p>
          ) : (
            active.map((grant) => (
              <div
                key={grant.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={grant.user.avatar} alt={d.avatar_alt(grant.user.name)} />
                  <AvatarFallback>{grant.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{grant.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{grant.user.username} · {d.since(formatDate(grant.grantedAt, locale))}
                    {grant.grantedByName ? ` · ${d.assigned_by(grant.grantedByName)}` : ''}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {d.roles[grant.role]}
                </Badge>
                {!isClosed ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-2"
                    disabled={isPending}
                    onClick={() => revoke(grant)}
                  >
                    <ShieldOff className="h-4 w-4" aria-hidden />
                    {t.revoke}
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {revoked.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.ended_title(revoked.length)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revoked.map((grant) => (
              <div key={grant.id} className="flex items-center gap-3 rounded-md border border-border/60 p-3 opacity-70">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={grant.user.avatar} alt={d.avatar_alt(grant.user.name)} />
                  <AvatarFallback>{grant.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{grant.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.roles[grant.role]} ·{' '}
                    {grant.revokedAt ? formatDate(grant.revokedAt, locale) : ''}
                    {grant.revokeReason ? ` · ${revokeReasonLabel(grant.revokeReason, dict)}` : ''}
                  </p>
                </div>
                {!isClosed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    disabled={isPending}
                    onClick={() => assign(grant.user.username)}
                  >
                    {t.reassign}
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
