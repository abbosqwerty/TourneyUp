'use server'

import { db } from './db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Helper: check if a userId belongs to an organizer
export async function isOrganizer(userId: string): Promise<boolean> {
  if (userId.startsWith('org')) return true
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.globalRank === 0
}

export async function createTournament(formData: {
  title: string
  sport: string
  category: string
  date: string
  time: string
  location: string
  maxParticipants: string
  description: string
  rules: string
  requirements: string
  prizePool: string
  entryFee: string
}) {
  const maxParticipants = parseInt(formData.maxParticipants) || 32
  
  // Format rules & requirements from newline separated text to JSON array
  const rulesJson = JSON.stringify(
    formData.rules ? formData.rules.split('\n').map(r => r.trim()).filter(Boolean) : []
  )
  const requirementsJson = JSON.stringify(
    formData.requirements ? formData.requirements.split('\n').map(r => r.trim()).filter(Boolean) : []
  )

  const prize = formData.prizePool ? (formData.prizePool.startsWith('$') ? formData.prizePool : `$${formData.prizePool}`) : 'Free'
  const entry = formData.entryFee ? (formData.entryFee.startsWith('$') ? formData.entryFee : `$${formData.entryFee}`) : 'Free'

  let finalOrganizerId = 'org1'
  const cookieStore = await cookies()
  const loggedInId = cookieStore.get('userId')?.value
  if (loggedInId) {
    finalOrganizerId = loggedInId
  }

  // RBAC: Only organizers can create tournaments
  const organizerCheck = await isOrganizer(finalOrganizerId)
  if (!organizerCheck) {
    throw new Error('Only organizers can create tournaments')
  }

  await db.tournament.create({
    data: {
      title: formData.title || 'Untitled Tournament',
      sport: formData.sport || 'General',
      category: formData.category || 'sports',
      location: formData.location || 'Online',
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || '12:00 PM',
      maxParticipants,
      posterUrl: `/tournaments/${formData.sport ? formData.sport : 'placeholder'}.jpg`, // generic placeholder
      organizerId: finalOrganizerId,
      description: formData.description || '',
      rulesJson,
      requirementsJson,
      prizePool: prize,
      entryFee: entry,
      status: 'registration_open',
      featured: false
    }
  })

  revalidatePath('/feed')
  redirect('/feed')
}

export async function toggleSaveTournament(tournamentId: string, userId?: string) {
  let finalUserId = userId
  if (!finalUserId || finalUserId === 'user1') {
    const cookieStore = await cookies()
    finalUserId = cookieStore.get('userId')?.value || 'user1'
  }

  const existing = await db.savedTournament.findUnique({
    where: {
      userId_tournamentId: {
        userId: finalUserId,
        tournamentId
      }
    }
  })

  if (existing) {
    await db.savedTournament.delete({
      where: {
        userId_tournamentId: {
          userId: finalUserId,
          tournamentId
        }
      }
    })
  } else {
    await db.savedTournament.create({
      data: {
        userId: finalUserId,
        tournamentId
      }
    })
  }

  revalidatePath('/feed')
  revalidatePath('/saved')
}

export async function registerParticipant(
  tournamentId: string, 
  userId?: string, 
  data?: { name: string; email: string; teamName?: string }
) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId }
  })
  
  if (!tournament) return

  let finalUserId = userId
  if (!finalUserId || finalUserId === 'user1') {
    const cookieStore = await cookies()
    finalUserId = cookieStore.get('userId')?.value || 'user1'
  }

  // RBAC: Organizers cannot register as participants
  const orgCheck = await isOrganizer(finalUserId)
  if (orgCheck) {
    throw new Error('Organizers cannot register for tournaments')
  }

  const user = await db.user.findUnique({
    where: { id: finalUserId }
  })

  if (!user) return

  await db.participant.create({
    data: {
      name: user.name,
      email: user.username + '@tuit.uz',
      avatar: user.avatar,
      registeredAt: new Date().toISOString(),
      status: 'pending',
      teamName: data?.teamName || null,
      paymentStatus: tournament.entryFee && tournament.entryFee !== 'Free' ? 'pending' : 'paid',
      tournamentId,
      userId: finalUserId
    }
  })

  revalidatePath(`/tournament/${tournamentId}`)
  revalidatePath('/dashboard/participants')
  revalidatePath('/feed')
}

export async function updateParticipantStatus(
  participantId: string, 
  status: string, 
  tournamentId: string
) {
  await db.participant.update({
    where: { id: participantId },
    data: { status }
  })

  revalidatePath('/dashboard/participants')
  revalidatePath(`/tournament/${tournamentId}`)
}

export async function sendMessage(conversationId: string, content: string, senderId?: string) {
  let finalSenderId = senderId
  if (!finalSenderId || finalSenderId === 'user1') {
    const cookieStore = await cookies()
    finalSenderId = cookieStore.get('userId')?.value || 'user1'
  }

  const user = await db.user.findUnique({
    where: { id: finalSenderId }
  })
  
  if (!user) return

  await db.message.create({
    data: {
      conversationId,
      senderId: finalSenderId,
      senderName: user.name,
      senderAvatar: user.avatar,
      content,
      timestamp: new Date().toISOString(),
      read: false
    }
  })

  await db.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessage: content,
      lastMessageTime: new Date().toISOString()
    }
  })

  revalidatePath('/messages')
}

export async function loginUser(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('userId', userId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: false, // Allow client-side access if needed
  })
}

export async function logoutUser() {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
}
