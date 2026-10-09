'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KeyRound, Loader2, Pause, Play, Search, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { resetOrganizationPassword, setOrganizationStatus } from '@/lib/org-actions'
import type { ProvisionedCredentials } from '@/lib/org-types'
import { CredentialsDialog } from '../applications/applications-client'

type Organization = {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  website: string | null
  location: string
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  owner: {
    id: string
    username: string
    email: string | null
    lastLoginAt: string | null
    mustChangePassword: boolean
  }
  _count: { tournaments: number }
}

export function OrganizationsClient({ organizations }: { organizations: Organization[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [credentials, setCredentials] = useState<ProvisionedCredentials | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return organizations
    return organizations.filter(
      (organization) =>
        organization.name.toLowerCase().includes(q) ||
        organization.owner.username.toLowerCase().includes(q) ||
        organization.email.toLowerCase().includes(q)
    )
  }, [organizations, query])

  const toggleStatus = (organization: Organization) => {
    const next = organization.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setBusyId(organization.id)
    startTransition(async () => {
      const result = await setOrganizationStatus(organization.id, next)
      setBusyId(null)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(next === 'ACTIVE' ? 'Tashkilot faollashtirildi' : 'Tashkilot to‘xtatildi')
      router.refresh()
    })
  }

  const resetPassword = (organization: Organization) => {
    setBusyId(organization.id)
    startTransition(async () => {
      const result = await resetOrganizationPassword(organization.id)
      setBusyId(null)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCredentials(result.data)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Tashkilotlar</h1>
          <p className="text-sm text-muted-foreground">
            Akkauntni to‘xtatish darhol barcha seansni yopadi. Parolni tiklash yangi parol beradi.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, username yoki email"
            className="pl-9"
            aria-label="Tashkilotlarni qidirish"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Tashkilot topilmadi.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((organization) => {
            const busy = isPending && busyId === organization.id
            return (
              <Card key={organization.id}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">{organization.name}</CardTitle>
                    <CardDescription className="truncate">
                      @{organization.owner.username} · {organization.email}
                      {organization.location ? ` · ${organization.location}` : ''}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={organization.status === 'ACTIVE' ? 'secondary' : 'destructive'}
                    className="shrink-0"
                  >
                    {organization.status === 'ACTIVE' ? 'Faol' : 'To‘xtatilgan'}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" aria-hidden />
                      {organization._count.tournaments} turnir
                    </span>
                    <span>
                      Qo‘shilgan: {new Date(organization.createdAt).toLocaleDateString('uz-UZ')}
                    </span>
                    <span>
                      Oxirgi kirish:{' '}
                      {organization.owner.lastLoginAt
                        ? new Date(organization.owner.lastLoginAt).toLocaleString('uz-UZ')
                        : 'hali kirmagan'}
                    </span>
                    {organization.owner.mustChangePassword ? (
                      <span className="font-medium text-foreground">Parolni almashtirishi kerak</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={organization.status === 'ACTIVE' ? 'outline' : 'default'}
                      className="gap-2"
                      disabled={busy}
                      onClick={() => toggleStatus(organization)}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : organization.status === 'ACTIVE' ? (
                        <Pause className="h-4 w-4" aria-hidden />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden />
                      )}
                      {organization.status === 'ACTIVE' ? 'To‘xtatish' : 'Faollashtirish'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled={busy}
                      onClick={() => resetPassword(organization)}
                    >
                      <KeyRound className="h-4 w-4" aria-hidden />
                      Parolni tiklash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  )
}
