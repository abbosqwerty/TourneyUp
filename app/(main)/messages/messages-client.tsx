'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Channel,
  ChannelPost,
  SupportTicket,
  initialChannels,
  initialPosts,
  initialSupportTickets,
} from '@/lib/channels-data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Search,
  CheckCircle2,
  Plus,
  Check,
  BarChart3,
  LifeBuoy,
  ChevronLeft,
  Pin,
  Eye,
  Send,
  Building2,
  Trophy,
  Ticket,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessagesClientProps {
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string
  isOrganizer?: boolean
}

export default function MessagesClient({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isOrganizer = false,
}: MessagesClientProps) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [posts, setPosts] = useState<ChannelPost[]>(initialPosts)
  const [tickets, setTickets] = useState<SupportTicket[]>(initialSupportTickets)

  // Navigation State
  const [activeTab, setActiveTab] = useState<'organizers' | 'tournaments' | 'support'>('organizers')
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(initialChannels[0].id)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [ticketReplyInput, setTicketReplyInput] = useState('')
  const [channelMessageInput, setChannelMessageInput] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState<number>(360)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Load persisted custom width on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tourneyup_messages_sidebar_width')
      if (saved) {
        const val = parseInt(saved, 10)
        if (!isNaN(val) && val >= 260 && val <= 560) {
          setSidebarWidth(val)
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleTouchStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleResetSidebarWidth = useCallback(() => {
    setSidebarWidth(360)
    try {
      localStorage.setItem('tourneyup_messages_sidebar_width', '360')
    } catch {}
  }, [])

  useEffect(() => {
    if (!isDragging) return

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - rect.left
      const maxAllowed = Math.min(560, Math.floor(rect.width * 0.48))
      const clamped = Math.max(260, Math.min(maxAllowed, newWidth))
      setSidebarWidth(clamped)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || !e.touches[0]) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = e.touches[0].clientX - rect.left
      const maxAllowed = Math.min(560, Math.floor(rect.width * 0.48))
      const clamped = Math.max(260, Math.min(maxAllowed, newWidth))
      setSidebarWidth(clamped)
    }

    const onEnd = () => {
      setIsDragging(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      try {
        localStorage.setItem('tourneyup_messages_sidebar_width', sidebarWidth.toString())
      } catch {}
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onEnd)

    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, sidebarWidth])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ticketEndRef = useRef<HTMLDivElement>(null)

  // Contact Organizer Form State
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'payment' as SupportTicket['category'],
    message: '',
  })

  // Selected Channel & Posts
  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) ?? null,
    [channels, selectedChannelId]
  )

  const channelPosts = useMemo(() => {
    if (!selectedChannelId) return []
    return posts
      .filter((p) => p.channelId === selectedChannelId)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return 0
      })
  }, [posts, selectedChannelId])

  // Selected Support Ticket
  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelPosts.length, selectedChannelId])

  useEffect(() => {
    ticketEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedTicket?.messages.length, selectedTicketId])

  // Filtered Channels for Sidebar
  const filteredChannels = useMemo(() => {
    let list = channels
    if (activeTab === 'organizers') {
      list = list.filter((c) => c.type === 'organizer')
    } else if (activeTab === 'tournaments') {
      list = list.filter((c) => c.type === 'tournament')
    }

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.lastPostSnippet.toLowerCase().includes(q)
    )
  }, [channels, activeTab, searchQuery])

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets
    const q = searchQuery.toLowerCase()
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.organizerName.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q)
    )
  }, [tickets, searchQuery])

  // Toggle Follow Channel
  const handleToggleFollow = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch
        const nextFollowed = !ch.isFollowed
        return {
          ...ch,
          isFollowed: nextFollowed,
          subscribers: nextFollowed ? ch.subscribers + 1 : Math.max(0, ch.subscribers - 1),
          stats: ch.stats
            ? {
                ...ch.stats,
                followers: nextFollowed ? ch.stats.followers + 1 : ch.stats.followers - 1,
              }
            : undefined,
        }
      })
    )
  }

  // Handle Create Support Ticket
  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return

    const orgId = selectedChannel?.type === 'organizer' ? selectedChannel.id : 'org-sports'
    const orgName = selectedChannel?.name || 'Tournament Organizing Committee'

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      organizerId: orgId,
      organizerName: orgName,
      tournamentTitle: selectedChannel?.type === 'tournament' ? selectedChannel.name : undefined,
      category: contactForm.category,
      priority: 'high',
      status: 'open',
      subject: contactForm.subject.trim(),
      description: contactForm.message.trim(),
      createdAt: 'Just now',
      updatedAt: 'Just now',
      messages: [
        {
          id: `tm-${Date.now()}`,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          senderRole: 'player',
          content: contactForm.message.trim(),
          timestamp: 'Just now',
        },
      ],
    }

    setTickets((prev) => [newTicket, ...prev])
    setSelectedTicketId(newTicket.id)
    setActiveTab('support')
    setContactModalOpen(false)
    setContactForm({ subject: '', category: 'payment', message: '' })
  }

  // Handle Send Reply in Ticket
  const handleSendTicketReply = () => {
    if (!ticketReplyInput.trim() || !selectedTicketId) return

    const replyMsg = {
      id: `tm-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      senderRole: 'player' as const,
      content: ticketReplyInput.trim(),
      timestamp: 'Just now',
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicketId
          ? {
              ...t,
              updatedAt: 'Just now',
              messages: [...t.messages, replyMsg],
            }
          : t
      )
    )
    setTicketReplyInput('')

    setTimeout(() => {
      ticketEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    // Simulated official response
    setTimeout(() => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === selectedTicketId) {
            const staffReply = {
              id: `tm-reply-${Date.now()}`,
              senderId: 'staff-desk',
              senderName: `${t.organizerName} Support Desk`,
              senderAvatar: '/avatars/stanford.jpg',
              senderRole: 'official' as const,
              content: `Thank you for your update. Referee and operations staff have logged this and are reviewing now.`,
              timestamp: 'Just now',
            }
            return {
              ...t,
              status: 'in_review' as const,
              messages: [...t.messages, staffReply],
              updatedAt: 'Just now',
            }
          }
          return t
        })
      )
      setTimeout(() => {
        ticketEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }, 1800)
  }

  // Handle Send Channel Message
  const handleSendChannelMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!channelMessageInput.trim() || !selectedChannel) return

    const userMessageContent = channelMessageInput.trim()
    const newPost: ChannelPost = {
      id: `post-user-${Date.now()}`,
      channelId: selectedChannel.id,
      title: 'Community Message',
      content: userMessageContent,
      type: 'announcement',
      timestamp: 'Just now',
      views: 1,
      authorName: currentUserName,
      authorRole: 'Player / Participant',
      authorAvatar: currentUserAvatar,
    }

    setPosts((prev) => [...prev, newPost])
    setChannelMessageInput('')

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    // Simulated desk acknowledgment
    setTimeout(() => {
      const isTournament = selectedChannel.type === 'tournament'
      const deskName = isTournament ? `${selectedChannel.name} Desk` : `${selectedChannel.name} Operations`
      const autoReply: ChannelPost = {
        id: `post-reply-${Date.now()}`,
        channelId: selectedChannel.id,
        title: isTournament ? 'Tournament Desk Acknowledgment' : 'Organizer Bulletin Desk',
        content: `Hi @${currentUserName}, your message has been received by the desk! For official private arbitration or urgent issues, you can also use "Contact Organizer".`,
        type: 'announcement',
        badge: 'Desk Arbiter',
        timestamp: 'Just now',
        views: 2,
        authorName: deskName,
        authorRole: 'Official Staff',
        authorAvatar: selectedChannel.avatar,
      }
      setPosts((prev) => [...prev, autoReply])
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }, 1200)
  }

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId)
    setSelectedTicketId(null)
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, unreadCount: 0 } : ch))
    )
  }

  const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length

  return (
    <div className="w-full h-[calc(100dvh-4rem-4.5rem)] md:h-[calc(100dvh-4rem)] flex justify-center bg-background p-0 md:p-3 lg:p-4 xl:p-6 overflow-hidden">
      {/* ── Centered Messenger Frame (Spaces placed outside) ─── */}
      <div
        ref={containerRef}
        style={{
          '--sidebar-width': `${sidebarWidth}px`,
        } as React.CSSProperties}
        className={cn(
          'w-full max-w-[1440px] h-full flex overflow-hidden relative',
          'rounded-none md:rounded-2xl border-0 md:border md:border-border/70 bg-card/60 backdrop-blur-sm shadow-none md:shadow-2xl',
          isDragging && 'select-none'
        )}
      >
        {/* ── Left Sidebar (Telegram Style Channels & Support) ─── */}
        <aside
          className={cn(
            'w-full md:w-[var(--sidebar-width)] flex flex-col bg-card/95 flex-shrink-0 h-full overflow-hidden',
            (selectedChannelId || selectedTicketId) ? 'hidden md:flex' : 'flex'
          )}
        >
        {/* Top Search */}
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels & bulletins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-border rounded-lg placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Telegram-style Folder Tabs */}
          <div className="flex items-center px-2 py-1.5 border-b border-border/50 bg-secondary/20 text-xs font-medium gap-1">
            <button
              onClick={() => {
                setActiveTab('organizers')
                setSelectedTicketId(null)
                if (!selectedChannelId) setSelectedChannelId(channels.find((c) => c.type === 'organizer')?.id || null)
              }}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs font-semibold',
                activeTab === 'organizers'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Organizers</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tournaments')
                setSelectedTicketId(null)
                if (!selectedChannelId) setSelectedChannelId(channels.find((c) => c.type === 'tournament')?.id || null)
              }}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs font-semibold',
                activeTab === 'tournaments'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>Tournaments</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('support')
                setSelectedChannelId(null)
                if (!selectedTicketId && tickets.length > 0) setSelectedTicketId(tickets[0].id)
              }}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs font-semibold',
                activeTab === 'support'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Ticket className="h-3.5 w-3.5 text-emerald-500" />
              <span>Support</span>
              {openTicketsCount > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {openTicketsCount}
                </span>
              )}
            </button>
          </div>

          {/* List of Channels or Support Tickets */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {activeTab !== 'support' ? (
              // ── CHANNELS LIST ──
              <div className="divide-y divide-border/30">
                {filteredChannels.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No channels found
                  </div>
                ) : (
                  filteredChannels.map((channel) => {
                    const isSelected = selectedChannelId === channel.id
                    return (
                      <button
                        key={channel.id}
                        onClick={() => handleSelectChannel(channel.id)}
                        className={cn(
                          'w-full px-3.5 py-3 text-left transition-colors flex items-center gap-3',
                          isSelected
                            ? 'bg-primary/15 hover:bg-primary/20'
                            : 'hover:bg-secondary/60'
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 rounded-full border border-border/50">
                            <AvatarImage src={channel.avatar} alt={channel.name} />
                            <AvatarFallback className="font-semibold text-sm bg-primary/20 text-primary">
                              {channel.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {channel.isFollowed && (
                            <span
                              title="Followed Channel"
                              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground ring-2 ring-card flex items-center justify-center text-[9px]"
                            >
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
                            <div className="flex items-center gap-1 truncate">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {channel.name}
                              </p>
                              {channel.verified && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground flex-shrink-0">
                              {channel.lastPostTime}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {channel.lastPostSnippet}
                            </p>
                            {channel.unreadCount > 0 && (
                              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                {channel.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            ) : (
              // ── SUPPORT TICKETS LIST ──
              <div className="divide-y divide-border/30">
                <div className="p-3 bg-secondary/30 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Private Dispute & Arbitration Desk
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContactModalOpen(true)}
                    className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30"
                  >
                    <Plus className="h-3 w-3" />
                    New Ticket
                  </Button>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No open tickets
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={cn(
                          'w-full px-3.5 py-3 text-left transition-colors flex items-start gap-3',
                          isSelected
                            ? 'bg-primary/15 hover:bg-primary/20'
                            : 'hover:bg-secondary/60'
                        )}
                      >
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5 flex-shrink-0">
                          <LifeBuoy className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1.5 mb-1">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {ticket.ticketNumber}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 py-0 capitalize',
                                ticket.status === 'open' && 'border-amber-500/40 text-amber-500 bg-amber-500/5',
                                ticket.status === 'in_review' && 'border-blue-500/40 text-blue-500 bg-blue-500/5',
                                ticket.status === 'resolved' && 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5'
                              )}
                            >
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <p className="font-semibold text-sm text-foreground truncate mb-0.5">
                            {ticket.subject}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.organizerName} • {ticket.updatedAt}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Resizable Line (Draggable between Sidebar & Chat) ── */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleResetSidebarWidth}
          title="Drag left or right to customize sidebar width • Double-click to reset"
          className={cn(
            'hidden md:flex relative group cursor-col-resize select-none items-center justify-center',
            'w-2.5 -mx-1 z-30 flex-shrink-0 transition-colors',
            isDragging ? 'bg-primary/20' : 'hover:bg-primary/10'
          )}
        >
          {/* Vertical divider line */}
          <div
            className={cn(
              'w-px h-full transition-colors',
              isDragging ? 'bg-primary w-0.5 shadow-sm' : 'bg-border/80 group-hover:bg-primary/80'
            )}
          />

          {/* Grab handle indicator pill */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-3.5 h-8 rounded-full border shadow-xs transition-all pointer-events-none',
              isDragging
                ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md ring-2 ring-primary/25'
                : 'bg-card border-border/80 text-muted-foreground group-hover:border-primary/60 group-hover:text-primary group-hover:scale-105'
            )}
          >
            <div className="flex flex-col gap-0.5 items-center justify-center">
              <span className="w-0.5 h-1 rounded-full bg-current" />
              <span className="w-0.5 h-1 rounded-full bg-current" />
              <span className="w-0.5 h-1 rounded-full bg-current" />
            </div>
          </div>
        </div>

        {/* ── Right Panel (Channel Feed or Support Ticket) ─────── */}
        <main
          className={cn(
            'flex-1 min-w-0 flex flex-col h-full bg-background/50 relative overflow-hidden',
            !(selectedChannelId || selectedTicketId) ? 'hidden md:flex' : 'flex'
          )}
        >
          {activeTab !== 'support' && selectedChannel ? (
            // ── VIEW A: TELEGRAM BROADCAST CHANNEL STREAM ──
            <>
              {/* Minimal Channel Header */}
              <div className="h-16 px-4 border-b border-border/70 flex items-center justify-between bg-card/85 backdrop-blur-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedChannelId(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Avatar className="h-10 w-10 rounded-full border border-border/50 flex-shrink-0">
                    <AvatarImage src={selectedChannel.avatar} alt={selectedChannel.name} />
                    <AvatarFallback className="font-semibold text-xs bg-primary/20 text-primary">
                      {selectedChannel.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <h2 className="font-bold text-sm md:text-base text-foreground truncate">
                        {selectedChannel.name}
                      </h2>
                      {selectedChannel.verified && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedChannel.subscribers.toLocaleString()} subscribers
                      {selectedChannel.sport ? ` • ${selectedChannel.sport} Tournament Timeline` : ' • Official Federation Feed'}
                    </p>
                  </div>
                </div>

                {/* Header Actions: Follow, Stats, Contact Organizer */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Follow Button */}
                  <Button
                    size="sm"
                    variant={selectedChannel.isFollowed ? 'secondary' : 'default'}
                    onClick={() => handleToggleFollow(selectedChannel.id)}
                    className={cn(
                      'h-8 px-3 text-xs font-semibold gap-1 rounded-lg transition-all shadow-xs',
                      selectedChannel.isFollowed ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {selectedChannel.isFollowed ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>

                  {/* Channel Statistics Button */}
                  {selectedChannel.stats && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatsModalOpen(true)}
                      className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border hover:bg-secondary"
                      title="View Channel Performance"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Stats</span>
                    </Button>
                  )}

                  {/* Contact Organizer Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContactModalOpen(true)}
                    className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    title="Open a support ticket"
                  >
                    <LifeBuoy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Contact Organizer</span>
                  </Button>
                </div>
              </div>

              {/* Telegram-style Timeline Post Stream */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 overscroll-contain">
                <div className="w-full space-y-4">
                  {/* Subtle Timeline Date Separator */}
                  <div className="flex justify-center my-1">
                    <span className="px-3.5 py-1 rounded-full bg-secondary/80 text-muted-foreground text-xs font-medium shadow-xs backdrop-blur-sm">
                      Official Tournament Chronicle • March 2026
                    </span>
                  </div>

                  {channelPosts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-border/70 bg-card/85 p-4 md:p-5 shadow-sm space-y-3 transition-colors hover:border-border"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 rounded-full border border-border/40">
                            <AvatarImage src={post.authorAvatar || selectedChannel.avatar} />
                            <AvatarFallback className="text-xs">
                              {post.authorName.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {post.authorName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{post.authorRole}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {post.pinned && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-500 bg-amber-500/5 gap-1"
                            >
                              <Pin className="h-2.5 w-2.5" />
                              Pinned
                            </Badge>
                          )}
                          {post.badge && (
                            <Badge
                              variant="secondary"
                              className="text-[11px] px-2 py-0.5 font-semibold bg-primary/10 text-primary border-primary/20"
                            >
                              {post.badge}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Post Title & Content */}
                      <div>
                        {post.title && (
                          <h3 className="text-sm md:text-base font-bold text-foreground mb-1.5">
                            {post.title}
                          </h3>
                        )}
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Post Footer: Views & Timestamp */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{post.views.toLocaleString()} views</span>
                        </div>
                        <time>{post.timestamp}</time>
                      </div>
                    </article>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Channel Footer: Broadcast for Organizers vs Broadcast Notice & Contact for Players */}
              <div className="p-3 md:p-4 border-t border-border/70 bg-card/90 backdrop-blur-md flex-shrink-0">
                {isOrganizer ? (
                  <form
                    onSubmit={handleSendChannelMessage}
                    className="w-full flex items-center gap-2"
                  >
                    <Input
                      placeholder={`Broadcast official announcement to ${selectedChannel.name}...`}
                      value={channelMessageInput}
                      onChange={(e) => setChannelMessageInput(e.target.value)}
                      className="flex-1 h-10 text-sm bg-secondary/60 border-transparent focus-visible:bg-background focus-visible:border-border rounded-full px-4"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!channelMessageInput.trim()}
                      className="h-10 w-10 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                      title="Post announcement"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Broadcast announcement</span>
                    </Button>
                  </form>
                ) : (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                      <span className="h-2 w-2 rounded-full bg-primary/70 flex-shrink-0" />
                      <span className="truncate">
                        Official tournament broadcast • Only organizers can post bulletins
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setContactModalOpen(true)}
                      className="h-9 px-4 text-xs font-semibold gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex-shrink-0"
                    >
                      <LifeBuoy className="h-3.5 w-3.5" />
                      <span>Contact Organizer</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'support' && selectedTicket ? (
            // ── VIEW B: SEPARATE SUPPORT TICKET CHAT ──
            <>
              {/* Ticket Header */}
              <div className="h-16 px-4 border-b border-border/70 flex items-center justify-between bg-card/85 backdrop-blur-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedTicketId(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <LifeBuoy className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-foreground truncate">
                        {selectedTicket.subject}
                      </h2>
                      <span className="font-mono text-xs text-muted-foreground">
                        ({selectedTicket.ticketNumber})
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedTicket.organizerName} • Category: {selectedTicket.category.toUpperCase()}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-2 py-0.5 capitalize',
                    selectedTicket.status === 'open' && 'border-amber-500/40 text-amber-500 bg-amber-500/5',
                    selectedTicket.status === 'in_review' && 'border-blue-500/40 text-blue-500 bg-blue-500/5',
                    selectedTicket.status === 'resolved' && 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5'
                  )}
                >
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Ticket Messages Stream */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-3 overscroll-contain">
                <div className="w-full space-y-3">
                  {selectedTicket.messages.map((m) => {
                    const isOwn = m.senderId === currentUserId
                    return (
                      <div
                        key={m.id}
                        className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm break-words shadow-xs space-y-1',
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-xs'
                              : 'bg-secondary text-foreground rounded-bl-xs border border-border/40'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] opacity-80 mb-0.5">
                            <span className="font-semibold">{m.senderName}</span>
                            <span>{m.timestamp}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={ticketEndRef} />
                </div>
              </div>

              {/* Ticket Reply Input */}
              <div className="p-3 md:p-4 border-t border-border/70 bg-card/90">
                <div className="w-full flex items-center gap-2">
                  <Input
                    placeholder="Reply to tournament referee desk..."
                    value={ticketReplyInput}
                    onChange={(e) => setTicketReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendTicketReply()
                      }
                    }}
                    className="flex-1 h-10 text-sm bg-secondary/60 border-transparent focus-visible:bg-background focus-visible:border-border rounded-full px-4"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendTicketReply}
                    disabled={!ticketReplyInput.trim()}
                    className="h-10 w-10 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send reply</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // ── EMPTY STATE (TELEGRAM DESKTOP STYLE) ──
            <div className="flex-1 flex items-center justify-center p-4">
              <span className="px-4 py-1.5 rounded-full bg-secondary/80 text-muted-foreground text-xs md:text-sm font-medium shadow-xs select-none backdrop-blur-sm">
                Select a channel to view announcements
              </span>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL 1: Channel Statistics ─────────────────────── */}
      <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Channel Statistics</span>
            </DialogTitle>
            <DialogDescription>
              Audience engagement and tournament conversion metrics for{' '}
              <strong className="text-foreground">{selectedChannel?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedChannel?.stats && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Followers</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {selectedChannel.stats.followers.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Last 30 Days</span>
                </div>
                <div className="text-xl font-bold text-emerald-500">
                  +{selectedChannel.stats.growth30Days} followers
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                  <span>Avg Post Views</span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {selectedChannel.stats.avgPostViews.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Registrations</span>
                </div>
                <div className="text-xl font-bold text-amber-500">
                  {selectedChannel.stats.registrationsFromChannel} entries
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            💡 Channel metrics help organizers track direct conversion from announcements to paid tournament entries. Included with TourneyUp Organizer Pro.
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: Dedicated Contact Organizer ─────────────── */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateTicketSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-5 w-5 text-amber-500" />
                <span>Contact Organizer Support Desk</span>
              </DialogTitle>
              <DialogDescription>
                Submit an inquiry or dispute regarding payments, schedule, or rules.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-foreground">Category</label>
                <select
                  value={contactForm.category}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      category: e.target.value as SupportTicket['category'],
                    })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="payment">Payment Problem</option>
                  <option value="dispute">Rules / Match Dispute</option>
                  <option value="schedule">Schedule Conflict</option>
                  <option value="technical">Technical / Anti-Cheat</option>
                  <option value="general">General Question</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Subject</label>
                <Input
                  placeholder="e.g. Payment Problem"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Message</label>
                <Textarea
                  placeholder="e.g. My payment was deducted but registration is still pending."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={4}
                  className="text-xs resize-none"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setContactModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground font-semibold">
                Submit Support Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
