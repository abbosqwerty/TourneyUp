'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Users,
  Trophy,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { setParticipantSeed, updateParticipantStatus } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { NoParticipants } from '@/components/empty-state'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatDateLong, formatDayMonth } from '@/lib/time'
import { sportLabel } from '@/lib/sports'

const statusColors = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  approved: 'bg-success/20 text-success border-success/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
}

const paymentColors = {
  paid: 'bg-success/20 text-success border-success/30',
  pending: 'bg-warning/20 text-warning border-warning/30',
  waived: 'bg-secondary text-secondary-foreground',
}

type TournamentType = {
  id: string
  title: string
  sport: string
  date: string
  maxParticipants: number
  status: string
}

type ParticipantType = {
  id: string
  name: string
  email: string
  avatar: string
  registeredAt: string
  status: 'pending' | 'approved' | 'rejected'
  teamName?: string
  paymentStatus: 'paid' | 'pending' | 'waived'
  tournamentId: string
  tournamentName: string
  /** Team registrations: the players on the roster. */
  roster: string[]
  seed: number | null
  /** Draw made — line-up and seeds are final. */
  drawn: boolean
}

interface ParticipantsClientProps {
  tournaments: TournamentType[]
  allParticipants: ParticipantType[]
  /** Tournaments where this viewer may approve/reject — SUPPORT gets read-only. */
  manageableTournamentIds: string[]
}

export default function ParticipantsClient({
  tournaments,
  allParticipants,
  manageableTournamentIds,
}: ParticipantsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTournament, setSelectedTournament] = useState(tournaments[0]?.id ?? '')
  const [participants, setParticipants] = useState(allParticipants)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { dict, locale } = useLanguage()
  const t = dict.dashboard.participants

  const canManage = manageableTournamentIds.includes(selectedTournament)
  const tournamentParticipants = participants.filter(p => p.tournamentId === selectedTournament)

  const filteredParticipants = tournamentParticipants.filter(p => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !p.name.toLowerCase().includes(query) &&
        !p.email.toLowerCase().includes(query) &&
        !p.teamName?.toLowerCase().includes(query)
      ) return false
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const tournament = tournaments.find(t => t.id === selectedTournament)
  const pendingCount = tournamentParticipants.filter(p => p.status === 'pending').length
  const approvedCount = tournamentParticipants.filter(p => p.status === 'approved').length
  const rejectedCount = tournamentParticipants.filter(p => p.status === 'rejected').length

  const handleStatusUpdate = (participantId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!canManage) {
      toast.error(t.read_only)
      return
    }

    const previous = participants
    setParticipants(prev => prev.map(p => (p.id === participantId ? { ...p, status: newStatus } : p)))

    startTransition(async () => {
      const result = await updateParticipantStatus({ participantId, status: newStatus })
      if (!result.ok) {
        setParticipants(previous)
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  /**
   * Approve sequentially rather than firing N parallel transitions, so one
   * failure stops the batch instead of leaving the table out of sync.
   */
  const handleApproveAll = () => {
    if (!canManage) {
      toast.error(t.read_only)
      return
    }

    const pending = tournamentParticipants.filter(p => p.status === 'pending')
    if (pending.length === 0) return

    startTransition(async () => {
      let approved = 0
      for (const participant of pending) {
        const result = await updateParticipantStatus({ participantId: participant.id, status: 'approved' })
        if (!result.ok) {
          toast.error(`${participant.name}: ${result.error}`)
          break
        }
        approved += 1
      }

      if (approved > 0) toast.success(t.approved_toast(approved))
      router.refresh()
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">
            {t.subtitle}
          </p>
        </div>
        <Select value={selectedTournament} onValueChange={setSelectedTournament}>
          <SelectTrigger className="w-full md:w-72">
            <SelectValue placeholder={t.select_tournament} />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search_placeholder}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.filter_status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all_statuses}</SelectItem>
                <SelectItem value="pending">{t.statuses.pending}</SelectItem>
                <SelectItem value="approved">{t.statuses.approved}</SelectItem>
                <SelectItem value="rejected">{t.statuses.rejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participants Table */}
          <Card>
            <CardContent className="p-0">
              {filteredParticipants.length === 0 ? (
                <NoParticipants />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.col_participant}</TableHead>
                        <TableHead className="hidden md:table-cell">{t.col_team}</TableHead>
                        <TableHead>{t.col_status}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t.col_payment}</TableHead>
                        <TableHead className="hidden lg:table-cell">{t.col_registered}</TableHead>
                        <TableHead className="text-right">{t.col_actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={participant.avatar} alt={dict.dashboard.avatar_alt(participant.name)} />
                                <AvatarFallback>{participant.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{participant.name}</p>
                                <p className="text-xs text-muted-foreground">{participant.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p>{participant.teamName || '-'}</p>
                            {participant.roster.length > 0 ? (
                              <p className="max-w-56 truncate text-xs text-muted-foreground" title={participant.roster.join(', ')}>
                                {t.roster(participant.roster.join(', '))}
                              </p>
                            ) : null}
                            {manageableTournamentIds.includes(participant.tournamentId) && !participant.drawn && participant.status === 'approved' ? (
                              <SeedInput participantId={participant.id} seed={participant.seed} />
                            ) : participant.seed ? (
                              <p className="text-xs text-muted-foreground">{t.seed_n(participant.seed)}</p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[participant.status]}>
                              {participant.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {participant.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {participant.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {t.statuses[participant.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className={paymentColors[participant.paymentStatus]}>
                              {t.payment[participant.paymentStatus]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {formatDayMonth(participant.registeredAt, locale)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canManage && participant.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={t.approve_aria(participant.name)}
                                    className="h-8 w-8 p-0 text-success hover:bg-success/10 hover:text-success"
                                    onClick={() => handleStatusUpdate(participant.id, 'approved')}
                                    disabled={isPending}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={t.reject_aria(participant.name)}
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleStatusUpdate(participant.id, 'rejected')}
                                    disabled={isPending}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : null}
                              {canManage && participant.status !== 'pending' ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  aria-label={t.reset_aria(participant.name)}
                                  className="h-8 w-8 p-0 text-muted-foreground"
                                  onClick={() => handleStatusUpdate(participant.id, 'pending')}
                                  disabled={isPending}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              ) : null}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                <a href={`mailto:${participant.email}`} aria-label={t.email_aria(participant.name)}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tournament Summary */}
          {tournament && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.summary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{tournament.title}</p>
                    <p className="text-xs text-muted-foreground">{sportLabel(dict, tournament.sport)}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDateLong(tournament.date, locale)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {t.registered(tournamentParticipants.length, tournament.maxParticipants)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.status_overview}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">{t.statuses.pending}</span>
                </div>
                <Badge variant="outline" className={statusColors.pending}>
                  {pendingCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">{t.statuses.approved}</span>
                </div>
                <Badge variant="outline" className={statusColors.approved}>
                  {approvedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">{t.statuses.rejected}</span>
                </div>
                <Badge variant="outline" className={statusColors.rejected}>
                  {rejectedCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.quick_actions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="h-auto min-h-8 w-full justify-start gap-2 whitespace-normal py-1.5 text-left"
                size="sm"
                onClick={handleApproveAll}
                disabled={isPending || pendingCount === 0 || !canManage}
              >
                <CheckCircle className="h-4 w-4" />
                {t.approve_all(pendingCount)}
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-8 w-full justify-start gap-2 whitespace-normal py-1.5 text-left"
                size="sm"
                disabled={tournamentParticipants.length === 0}
                asChild
              >
                <a
                  href={`mailto:?bcc=${encodeURIComponent(
                    tournamentParticipants.map(p => p.email).join(',')
                  )}&subject=${encodeURIComponent(tournament?.title ?? t.mail_subject_fallback)}`}
                >
                  <Mail className="h-4 w-4" />
                  {t.email_all}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/** Manual seed for the "seeded" draw. Saved on blur. */
function SeedInput({ participantId, seed }: { participantId: string; seed: number | null }) {
  const router = useRouter()
  const [value, setValue] = useState(seed ? String(seed) : '')
  const [saving, startSaving] = useTransition()
  const { dict } = useLanguage()

  const save = () => {
    if (value === (seed ? String(seed) : '')) return
    startSaving(async () => {
      const result = await setParticipantSeed({ participantId, seed: value })
      if (!result.ok) {
        toast.error(result.error)
        setValue(seed ? String(seed) : '')
        return
      }
      router.refresh()
    })
  }

  return (
    <label className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      {dict.dashboard.participants.seed}
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        disabled={saving}
        className="h-7 w-16 px-2 text-xs"
        aria-label={dict.dashboard.participants.seed_aria}
        placeholder="—"
      />
    </label>
  )
}
