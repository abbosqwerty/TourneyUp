import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from './db'
import type { StaffRole, User } from '@prisma/client'

export const SESSION_COOKIE = 'tu_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

/**
 * The cookie carries a raw random token; the database stores only its
 * SHA-256 digest, so a leaked session table cannot be replayed as a login.
 */
function digest(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.session.create({
    data: { id: digest(token), userId, expiresAt, userAgent: userAgent ?? null },
  })

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })

  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { id: digest(token) } }).catch(() => {})
  }
  jar.delete(SESSION_COOKIE)
}

/** Invalidate every session of a user (used after a password change). */
export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } }).catch(() => {})
}

export type SessionUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'username'
  | 'email'
  | 'role'
  | 'avatar'
  | 'verified'
  | 'globalRank'
  | 'totalPoints'
  | 'mustChangePassword'
>

/**
 * Resolve the signed-in user. Returns null for guests and for stale or
 * expired cookies. Never throws — a database outage degrades to "guest"
 * so public pages keep rendering.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  let token: string | undefined
  try {
    const jar = await cookies()
    token = jar.get(SESSION_COOKIE)?.value
  } catch {
    return null
  }
  if (!token) return null

  try {
    const session = await db.session.findUnique({
      where: { id: digest(token) },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            avatar: true,
            verified: true,
            globalRank: true,
            totalPoints: true,
            mustChangePassword: true,
          },
        },
      },
    })

    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) {
      await db.session.deleteMany({ where: { id: digest(token) } }).catch(() => {})
      return null
    }
    return session.user
  } catch {
    return null
  }
})

// ------------------------------------------------------------
// Guards — throw on violation; callers in pages use redirect()
// ------------------------------------------------------------

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError('Avval tizimga kiring')
  return user
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'SUPER_ADMIN') throw new AuthError('Faqat super admin uchun')
  return user
}

/** The organization account itself (not its tournament staff). */
export async function requireOrganizationAccount() {
  const user = await requireUser()
  if (user.role === 'SUPER_ADMIN') return { user, organization: null as null | { id: string } }
  if (user.role !== 'ORGANIZATION') throw new AuthError('Faqat tashkilot akkaunti uchun')

  const organization = await db.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true, slug: true, status: true },
  })
  if (!organization) throw new AuthError('Tashkilot topilmadi')
  if (organization.status === 'SUSPENDED') throw new AuthError('Tashkilot akkaunti to‘xtatilgan')

  return { user, organization }
}

// ------------------------------------------------------------
// Tournament-scoped permissions
// ------------------------------------------------------------

export type TournamentAbility = {
  /** Owns the tournament through its organization (or is super admin). */
  isOwner: boolean
  staffRole: StaffRole | null
  canEditTournament: boolean
  canManageParticipants: boolean
  canManageStaff: boolean
  canPostToChannel: boolean
  canRecordResults: boolean
}

const NO_ACCESS: TournamentAbility = {
  isOwner: false,
  staffRole: null,
  canEditTournament: false,
  canManageParticipants: false,
  canManageStaff: false,
  canPostToChannel: false,
  canRecordResults: false,
}

/**
 * Effective rights of `userId` over one tournament.
 *
 * Owner (organization account / super admin) → everything.
 * ADMIN      → everything except changing the owner.
 * ORGANIZER  → edit the tournament, manage participants, post, record results.
 * SUPPORT    → read participants and answer in the channel.
 *
 * A grant with `revokedAt != null` grants nothing, which is how access
 * disappears once the tournament is closed.
 */
export async function getTournamentAbility(
  userId: string | null | undefined,
  tournamentId: string
): Promise<TournamentAbility> {
  if (!userId) return NO_ACCESS

  const [user, tournament] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true, organization: { select: { ownerId: true } } },
    }),
  ])

  if (!user || !tournament) return NO_ACCESS

  const isOwner =
    user.role === 'SUPER_ADMIN' ||
    tournament.organizerId === userId ||
    tournament.organization?.ownerId === userId

  if (isOwner) {
    return {
      isOwner: true,
      staffRole: null,
      canEditTournament: true,
      canManageParticipants: true,
      canManageStaff: true,
      canPostToChannel: true,
      canRecordResults: true,
    }
  }

  const grant = await db.tournamentStaff.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: { role: true, revokedAt: true },
  })

  if (!grant || grant.revokedAt) return NO_ACCESS

  switch (grant.role) {
    case 'ADMIN':
      return {
        isOwner: false,
        staffRole: 'ADMIN',
        canEditTournament: true,
        canManageParticipants: true,
        canManageStaff: true,
        canPostToChannel: true,
        canRecordResults: true,
      }
    case 'ORGANIZER':
      return {
        isOwner: false,
        staffRole: 'ORGANIZER',
        canEditTournament: true,
        canManageParticipants: true,
        canManageStaff: false,
        canPostToChannel: true,
        canRecordResults: true,
      }
    case 'SUPPORT':
      return {
        isOwner: false,
        staffRole: 'SUPPORT',
        canEditTournament: false,
        canManageParticipants: false,
        canManageStaff: false,
        canPostToChannel: true,
        canRecordResults: false,
      }
    default:
      return NO_ACCESS
  }
}

/** Live staff grants of a user across all tournaments. */
export async function getActiveStaffAssignments(userId: string) {
  return db.tournamentStaff.findMany({
    where: { userId, revokedAt: null, tournament: { status: { notIn: ['completed', 'cancelled'] } } },
    select: {
      id: true,
      role: true,
      grantedAt: true,
      tournament: {
        select: { id: true, title: true, sport: true, status: true, date: true, posterMediaId: true },
      },
    },
    orderBy: { grantedAt: 'desc' },
  })
}
