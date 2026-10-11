import { db } from './db'
import { REVOKE_REASON_CLOSED } from './staff-labels'

export { STAFF_ROLE_DESCRIPTIONS, STAFF_ROLE_LABELS } from './staff-labels'

/**
 * Plain helpers (NOT server actions). Everything exported from a
 * `'use server'` module becomes a public HTTP endpoint, so privileged
 * internals live here instead and are called from guarded actions.
 */

/**
 * Expire every live staff grant of a tournament. Called when the
 * tournament moves to `completed`/`cancelled`, which is how temporary
 * access is taken away without anyone doing it by hand.
 */
export async function closeTournamentAccess(tournamentId: string, actorId?: string) {
  const now = new Date()

  await db.tournamentStaff.updateMany({
    where: { tournamentId, revokedAt: null },
    data: { revokedAt: now, revokeReason: REVOKE_REASON_CLOSED },
  })

  // Staff lose their posting rights in the channel too; subscribers keep
  // read access to the archive.
  const channel = await db.channel.findUnique({ where: { tournamentId }, select: { id: true } })
  if (channel) {
    await db.channelMember.updateMany({
      where: { channelId: channel.id, role: 'STAFF' },
      data: { role: 'SUBSCRIBER' },
    })
    await db.channel.update({ where: { id: channel.id }, data: { archived: true } })
  }

  if (actorId) {
    console.warn(`[staff] tournament ${tournamentId} closed by ${actorId}; grants revoked at ${now.toISOString()}`)
  }
}

export async function listTournamentStaff(tournamentId: string) {
  return db.tournamentStaff.findMany({
    where: { tournamentId },
    orderBy: [{ revokedAt: 'asc' }, { grantedAt: 'desc' }],
    select: {
      id: true,
      role: true,
      grantedAt: true,
      revokedAt: true,
      revokeReason: true,
      user: { select: { id: true, name: true, username: true, email: true, avatar: true } },
      grantedBy: { select: { name: true, username: true } },
    },
  })
}
