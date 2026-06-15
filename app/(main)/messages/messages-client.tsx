'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Search, Send, MoreVertical, Phone, Video, Trophy, ChevronLeft } from 'lucide-react'
import { NoMessages } from '@/components/empty-state'
import { sendMessage } from '@/lib/actions'
import { useRouter } from 'next/navigation'

type MessageType = {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  read: boolean
}

type ConversationType = {
  id: string
  participants: { id: string; name: string; avatar: string }[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  tournamentContext?: { id: string; name: string }
  messages: MessageType[]
}

interface MessagesClientProps {
  initialConversations: ConversationType[]
  currentUserId: string
}

export default function MessagesClient({ initialConversations, currentUserId }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  const selectedConversation = conversations.find(c => c.id === selectedConvId) ?? null

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return conv.participants.some(p => p.name.toLowerCase().includes(query)) ||
           conv.tournamentContext?.name.toLowerCase().includes(query)
  })

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConvId || isSending) return
    const content = messageInput.trim()
    setMessageInput('')
    setIsSending(true)

    // Optimistic update
    const tempMsg: MessageType = {
      id: `tmp-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'Alex Thompson',
      senderAvatar: '/avatars/alex.jpg',
      content,
      timestamp: new Date().toISOString(),
      read: true,
    }
    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConvId
          ? { ...c, messages: [...c.messages, tempMsg], lastMessage: content }
          : c
      )
    )

    try {
      await sendMessage(selectedConvId, content, currentUserId)
      router.refresh()
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] flex rounded-lg border border-border overflow-hidden bg-card">
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-80 border-r border-border flex flex-col",
          selectedConvId && "hidden md:flex"
        )}>
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-4">
                <NoMessages />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conversation) => {
                  const other = conversation.participants[0]
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConvId(conversation.id)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-secondary/50 transition-colors",
                        selectedConvId === conversation.id && "bg-secondary"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={other?.avatar} />
                          <AvatarFallback>{other?.name?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{other?.name}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(conversation.lastMessageTime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {conversation.tournamentContext && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                              <Trophy className="h-2.5 w-2.5 mr-1" />
                              {conversation.tournamentContext.name}
                            </Badge>
                          )}
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center flex-shrink-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedConvId && "hidden md:flex"
          )}>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSelectedConvId(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.participants[0]?.avatar} />
                  <AvatarFallback>
                    {selectedConversation.participants[0]?.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.participants[0]?.name}</p>
                  {selectedConversation.tournamentContext && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {selectedConversation.tournamentContext.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => {
                  const isOwn = message.senderId === currentUserId
                  return (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", isOwn && "flex-row-reverse")}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback>{message.senderName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("max-w-[70%] space-y-1", isOwn && "items-end")}>
                        <div className={cn(
                          "rounded-2xl px-4 py-2",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary rounded-bl-md"
                        )}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className={cn(
                          "text-xs text-muted-foreground",
                          isOwn && "text-right"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage() }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={isSending || !messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
