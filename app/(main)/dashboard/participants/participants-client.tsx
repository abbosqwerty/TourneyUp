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
  MoreHorizontal,
  Users,
  Trophy,
  Calendar
} from 'lucide-react'
import { updateParticipantStatus } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { NoParticipants } from '@/components/empty-state'

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
}

interface ParticipantsClientProps {
  tournaments: TournamentType[]
  allParticipants: ParticipantType[]
}

export default function ParticipantsClient({ tournaments, allParticipants }: ParticipantsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTournament, setSelectedTournament] = useState(tournaments[0]?.id ?? '')
  const [participants, setParticipants] = useState(allParticipants)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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

  const handleStatusUpdate = (participantId: string, newStatus: string) => {
    // Optimistic update
    setParticipants(prev =>
      prev.map(p => p.id === participantId ? { ...p, status: newStatus as 'pending' | 'approved' | 'rejected' } : p)
    )
    startTransition(async () => {
      await updateParticipantStatus(participantId, newStatus, selectedTournament)
      router.refresh()
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Participant Management</h1>
          <p className="text-muted-foreground">
            Review and manage tournament registrations
          </p>
        </div>
        <Select value={selectedTournament} onValueChange={setSelectedTournament}>
          <SelectTrigger className="w-full md:w-72">
            <SelectValue placeholder="Select tournament" />
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

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or team..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                        <TableHead>Participant</TableHead>
                        <TableHead className="hidden md:table-cell">Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Payment</TableHead>
                        <TableHead className="hidden lg:table-cell">Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={participant.avatar} />
                                <AvatarFallback>{participant.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{participant.name}</p>
                                <p className="text-xs text-muted-foreground">{participant.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {participant.teamName || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[participant.status]}>
                              {participant.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {participant.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {participant.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {participant.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className={paymentColors[participant.paymentStatus]}>
                              {participant.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {new Date(participant.registeredAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {participant.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10"
                                    onClick={() => handleStatusUpdate(participant.id, 'approved')}
                                    disabled={isPending}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleStatusUpdate(participant.id, 'rejected')}
                                    disabled={isPending}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
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
                <CardTitle className="text-base">Tournament Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{tournament.title}</p>
                    <p className="text-xs text-muted-foreground">{tournament.sport}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(tournament.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {tournamentParticipants.length}/{tournament.maxParticipants} registered
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="outline" className={statusColors.pending}>
                  {pendingCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Approved</span>
                </div>
                <Badge variant="outline" className={statusColors.approved}>
                  {approvedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Rejected</span>
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
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                size="sm"
                onClick={() => {
                  tournamentParticipants
                    .filter(p => p.status === 'pending')
                    .forEach(p => handleStatusUpdate(p.id, 'approved'))
                }}
                disabled={isPending || pendingCount === 0}
              >
                <CheckCircle className="h-4 w-4" />
                Approve All Pending ({pendingCount})
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Mail className="h-4 w-4" />
                Email All Participants
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
