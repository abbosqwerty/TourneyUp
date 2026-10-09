'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Copy, ExternalLink, Globe, Loader2, Mail, MapPin, Phone, ShieldCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { approveOrganizationApplication, rejectOrganizationApplication } from '@/lib/org-actions'
import type { ProvisionedCredentials } from '@/lib/org-types'

type Application = {
  id: string
  orgName: string
  contactName: string
  email: string
  phone: string | null
  website: string | null
  location: string
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  reviewedBy: { name: string } | null
  organization: { id: string; slug: string; owner: { username: string } } | null
}

const STATUS_LABELS = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan',
} as const

function suggestUsername(orgName: string) {
  return orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 28)
}

export function ApplicationsClient({ applications }: { applications: Application[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [approving, setApproving] = useState<Application | null>(null)
  const [rejecting, setRejecting] = useState<Application | null>(null)
  const [credentials, setCredentials] = useState<ProvisionedCredentials | null>(null)

  const visible = filter === 'ALL' ? applications : applications.filter((a) => a.status === filter)
  const counts = {
    PENDING: applications.filter((a) => a.status === 'PENDING').length,
    APPROVED: applications.filter((a) => a.status === 'APPROVED').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
    ALL: applications.length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Tashkilot arizalari</h1>
        <p className="text-sm text-muted-foreground">
          Arizani tasdiqlaganingizda tashkilot uchun akkaunt yaratiladi va parol bir marta ko‘rsatiladi.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((key) => (
            <TabsTrigger key={key} value={key}>
              {key === 'ALL' ? 'Hammasi' : STATUS_LABELS[key]}
              <span className="ml-1 text-xs text-muted-foreground">({counts[key]})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Bu bo‘limda ariza yo‘q.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((application) => (
            <Card key={application.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">{application.orgName}</CardTitle>
                  <CardDescription>
                    {application.contactName} ·{' '}
                    {new Date(application.createdAt).toLocaleDateString('uz-UZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    application.status === 'PENDING'
                      ? 'secondary'
                      : application.status === 'APPROVED'
                        ? 'default'
                        : 'destructive'
                  }
                  className="shrink-0"
                >
                  {STATUS_LABELS[application.status]}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{application.description}</p>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <a href={`mailto:${application.email}`} className="truncate hover:underline">
                      {application.email}
                    </a>
                  </span>
                  {application.phone ? (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      {application.phone}
                    </span>
                  ) : null}
                  {application.website ? (
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <a
                        href={application.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        {application.website}
                      </a>
                    </span>
                  ) : null}
                  {application.location ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      {application.location}
                    </span>
                  ) : null}
                </div>

                {application.status === 'PENDING' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="gap-2" onClick={() => setApproving(application)}>
                      <ShieldCheck className="h-4 w-4" aria-hidden />
                      Tasdiqlash va akkaunt yaratish
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setRejecting(application)}>
                      <X className="h-4 w-4" aria-hidden />
                      Rad etish
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <p>
                      {application.reviewedBy?.name ?? 'Admin'} ·{' '}
                      {application.reviewedAt
                        ? new Date(application.reviewedAt).toLocaleString('uz-UZ')
                        : '—'}
                    </p>
                    {application.reviewNote ? <p className="text-foreground">{application.reviewNote}</p> : null}
                    {application.organization ? (
                      <p className="flex items-center gap-1">
                        Akkaunt: <code className="font-mono">@{application.organization.owner.username}</code>
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ApproveDialog
        application={approving}
        onClose={() => setApproving(null)}
        onProvisioned={(creds) => {
          setApproving(null)
          setCredentials(creds)
          router.refresh()
        }}
      />

      <RejectDialog
        application={rejecting}
        onClose={() => setRejecting(null)}
        onDone={() => {
          setRejecting(null)
          router.refresh()
        }}
      />

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  )
}

function ApproveDialog({
  application,
  onClose,
  onProvisioned,
}: {
  application: Application | null
  onClose: () => void
  onProvisioned: (credentials: ProvisionedCredentials) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <Dialog open={Boolean(application)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tashkilotni tasdiqlash</DialogTitle>
          <DialogDescription>
            {application?.orgName} uchun ORGANIZATION akkaunti yaratiladi. Parol avtomatik generatsiya qilinadi
            va faqat bir marta ko‘rsatiladi.
          </DialogDescription>
        </DialogHeader>

        <form
          id="approve-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!application) return
            const form = new FormData(event.currentTarget)
            setErrors({})

            startTransition(async () => {
              const result = await approveOrganizationApplication({
                applicationId: application.id,
                username: String(form.get('username') ?? '').toLowerCase(),
                note: String(form.get('note') ?? ''),
              })

              if (!result.ok) {
                setErrors(result.fieldErrors ?? {})
                toast.error(result.error)
                return
              }

              toast.success('Tashkilot akkaunti yaratildi')
              onProvisioned(result.data)
            })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="approve-username">Login (username)</Label>
            <Input
              id="approve-username"
              name="username"
              defaultValue={application ? suggestUsername(application.orgName) : ''}
              pattern="[a-z0-9_]+"
              disabled={isPending}
              required
            />
            {errors.username ? <p className="text-xs text-destructive">{errors.username}</p> : null}
            <p className="text-xs text-muted-foreground">
              Email sifatida ariza emaili ishlatiladi: <code className="font-mono">{application?.email}</code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approve-note">Izoh (ixtiyoriy)</Label>
            <Textarea id="approve-note" name="note" rows={3} disabled={isPending} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="approve-form" className="gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Tasdiqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectDialog({
  application,
  onClose,
  onDone,
}: {
  application: Application | null
  onClose: () => void
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <Dialog open={Boolean(application)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Arizani rad etish</DialogTitle>
          <DialogDescription>{application?.orgName} arizasi rad etiladi. Sabab yozib qoldiring.</DialogDescription>
        </DialogHeader>

        <form
          id="reject-form"
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!application) return
            const form = new FormData(event.currentTarget)
            setErrors({})

            startTransition(async () => {
              const result = await rejectOrganizationApplication({
                applicationId: application.id,
                note: String(form.get('note') ?? ''),
              })

              if (!result.ok) {
                setErrors(result.fieldErrors ?? {})
                toast.error(result.error)
                return
              }

              toast.success('Ariza rad etildi')
              onDone()
            })
          }}
        >
          <Label htmlFor="reject-note">Sabab</Label>
          <Textarea id="reject-note" name="note" rows={4} disabled={isPending} required />
          {errors.note ? <p className="text-xs text-destructive">{errors.note}</p> : null}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="reject-form" variant="destructive" className="gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Rad etish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: ProvisionedCredentials | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const text = credentials
    ? `TourneyUp — ${credentials.organizationName}\nLogin: ${credentials.username}\nEmail: ${credentials.email}\nParol: ${credentials.password}`
    : ''

  return (
    <Dialog open={Boolean(credentials)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Akkaunt ma‘lumotlari</DialogTitle>
          <DialogDescription>
            Bu parol qayta ko‘rsatilmaydi — hoziroq tashkilotga yetkazing. Ular birinchi kirishda parolni
            almashtirishga majbur qilinadi.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tashkilot</dt>
            <dd className="font-medium">{credentials?.organizationName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Login</dt>
            <dd className="font-mono">{credentials?.username}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-mono">{credentials?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Parol</dt>
            <dd className="font-mono text-base font-semibold">{credentials?.password}</dd>
          </div>
        </dl>

        <DialogFooter>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text)
                setCopied(true)
                toast.success('Nusxa olindi')
                setTimeout(() => setCopied(false), 2000)
              } catch {
                toast.error('Nusxa olinmadi — qo‘lda ko‘chiring')
              }
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Nusxa olish
          </Button>
          <Button onClick={onClose}>Yopish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
