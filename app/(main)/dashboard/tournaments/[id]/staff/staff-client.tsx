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
import { STAFF_ROLE_DESCRIPTIONS, STAFF_ROLE_LABELS } from '@/lib/staff-labels'
import { assignTournamentStaff, revokeTournamentStaff, searchAssignableUsers } from '@/lib/staff-actions'

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
      toast.success(`${result.data.userName} — ${STAFF_ROLE_LABELS[role]} roli berildi`)
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
      toast.success(`${grant.user.name} ruxsati olib tashlandi`)
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
            Turnir yopilgan — barcha vaqtinchalik ruxsatlar avtomatik olib tashlangan va yangi xodim
            tayinlab bo‘lmaydi.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yangi xodim tayinlash</CardTitle>
            <CardDescription>
              Platformadagi oddiy foydalanuvchini username yoki email bo‘yicha toping. Ruxsat faqat shu
              turnirga tegishli va turnir yopilganda avtomatik tugaydi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <div className="space-y-2">
                <Label htmlFor="staff-search">Foydalanuvchi</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="staff-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="username yoki email"
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
                <Label htmlFor="staff-role">Rol</Label>
                <Select value={role} onValueChange={(value) => setRole(value as StaffRole)} disabled={isPending}>
                  <SelectTrigger id="staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['ADMIN', 'ORGANIZER', 'SUPPORT'] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {STAFF_ROLE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {STAFF_ROLE_DESCRIPTIONS[role]}
            </p>

            {candidates.length > 0 ? (
              <ul className="divide-y divide-border rounded-md border border-border">
                {candidates.map((candidate) => (
                  <li key={candidate.id} className="flex items-center gap-3 p-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={candidate.avatar} alt={`${candidate.name} avatari`} />
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
                      Tayinlash
                    </Button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && !isSearching ? (
              <p className="text-sm text-muted-foreground">Foydalanuvchi topilmadi.</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faol xodimlar ({active.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Faol xodim yo‘q.</p>
          ) : (
            active.map((grant) => (
              <div
                key={grant.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={grant.user.avatar} alt={`${grant.user.name} avatari`} />
                  <AvatarFallback>{grant.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{grant.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{grant.user.username} · {new Date(grant.grantedAt).toLocaleDateString('uz-UZ')} dan
                    {grant.grantedByName ? ` · ${grant.grantedByName} tayinlagan` : ''}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {STAFF_ROLE_LABELS[grant.role]}
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
                    Olib tashlash
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
            <CardTitle className="text-base">Tugagan ruxsatlar ({revoked.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revoked.map((grant) => (
              <div key={grant.id} className="flex items-center gap-3 rounded-md border border-border/60 p-3 opacity-70">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={grant.user.avatar} alt={`${grant.user.name} avatari`} />
                  <AvatarFallback>{grant.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{grant.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {STAFF_ROLE_LABELS[grant.role]} ·{' '}
                    {grant.revokedAt ? new Date(grant.revokedAt).toLocaleDateString('uz-UZ') : ''}
                    {grant.revokeReason ? ` · ${grant.revokeReason}` : ''}
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
                    Qayta tayinlash
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
