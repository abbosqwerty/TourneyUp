import type { TeamRole } from '@prisma/client'
import { db } from './db'
import { mediaUrl } from './media'

/** Plain helpers — not server actions. Guarded entry points live in `team-actions.ts`. */

export const MAX_OWNED_TEAMS = 10
export const MAX_TEAM_MEMBERS = 50
export const INVITE_TTL_DAYS = 7

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: 'Egasi',
  CAPTAIN: 'Kapitan',
  MEMBER: 'A’zo',
}

export type TeamAbility = {
  role: TeamRole | null
  isMember: boolean
  canEdit: boolean
  canInvite: boolean
  /** May remove plain members; only the owner may remove a captain. */
  canRemoveMembers: boolean
  canManageRoles: boolean
  canTransfer: boolean
  canDisband: boolean
  canRegister: boolean
}

const NONE: TeamAbility = {
  role: null,
  isMember: false,
  canEdit: false,
  canInvite: false,
  canRemoveMembers: false,
  canManageRoles: false,
  canTransfer: false,
  canDisband: false,
  canRegister: false,
}

/**
 * OWNER   → everything.
 * CAPTAIN → edit the team, invite, remove plain members, register for tournaments.
 * MEMBER  → read, chat, leave.
 * A disbanded team is read-only for everyone.
 */
export async function getTeamAbility(userId: string | null | undefined, teamId: string): Promise<TeamAbility> {
  if (!userId) return NONE
  const [team, membership] = await Promise.all([
    db.team.findUnique({ where: { id: teamId }, select: { disbandedAt: true } }),
    db.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } }, select: { role: true, leftAt: true } }),
  ])
  if (!team || !membership || membership.leftAt) return NONE

  const role = membership.role
  if (team.disbandedAt) return { ...NONE, role, isMember: true }

  const owner = role === 'OWNER'
  const lead = owner || role === 'CAPTAIN'
  return {
    role,
    isMember: true,
    canEdit: lead,
    canInvite: lead,
    canRemoveMembers: lead,
    canManageRoles: owner,
    canTransfer: owner,
    canDisband: owner,
    canRegister: lead,
  }
}

/**
 * Users locked into a team's roster for a tournament that has started and
 * not yet finished. They cannot leave or be removed until it ends.
 */
export async function lockedRosterUserIds(teamId: string): Promise<Set<string>> {
  const rows = await db.participantRosterMember.findMany({
    where: {
      participant: {
        teamId,
        tournament: { status: 'ongoing', drawGeneratedAt: { not: null } },
      },
    },
    select: { userId: true },
  })
  return new Set(rows.map((r) => r.userId))
}

/** Registrations of this team in tournaments that are not over yet. */
export async function activeRegistrations(teamId: string) {
  return db.participant.findMany({
    where: { teamId, tournament: { status: { in: ['upcoming', 'registration_open', 'ongoing'] } } },
    select: {
      id: true,
      status: true,
      tournament: { select: { id: true, title: true, status: true, drawGeneratedAt: true } },
    },
  })
}

export type TeamCard = {
  id: string
  name: string
  sport: string
  category: string
  logo: string | null
  description: string | null
  myRole: TeamRole
  owner: { id: string; name: string; username: string }
  memberCount: number
  disbanded: boolean
  activeTournaments: number
}

/** Teams the user owns or belongs to, newest first. */
export async function listTeamsForUser(userId: string): Promise<TeamCard[]> {
  const memberships = await db.teamMember.findMany({
    where: { userId, leftAt: null },
    orderBy: { joinedAt: 'desc' },
    select: {
      role: true,
      team: {
        select: {
          id: true,
          name: true,
          sport: true,
          category: true,
          description: true,
          logoMediaId: true,
          disbandedAt: true,
          owner: { select: { id: true, name: true, username: true } },
          _count: {
            select: {
              members: { where: { leftAt: null } },
              registrations: { where: { tournament: { status: { in: ['registration_open', 'upcoming', 'ongoing'] } } } },
            },
          },
        },
      },
    },
  })

  return memberships.map(({ role, team }) => ({
    id: team.id,
    name: team.name,
    sport: team.sport,
    category: team.category,
    logo: mediaUrl(team.logoMediaId),
    description: team.description,
    myRole: role,
    owner: team.owner,
    memberCount: team._count.members,
    disbanded: team.disbandedAt !== null,
    activeTournaments: team._count.registrations,
  }))
}

/** Pending, unexpired invitations for a user. */
export async function listInvitesForUser(userId: string) {
  const invites = await db.teamInvite.findMany({
    where: { invitedUserId: userId, status: 'PENDING', expiresAt: { gt: new Date() }, team: { disbandedAt: null } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      invitedBy: { select: { name: true } },
      team: { select: { id: true, name: true, sport: true, logoMediaId: true, _count: { select: { members: { where: { leftAt: null } } } } } },
    },
  })
  return invites.map((invite) => ({
    id: invite.id,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    invitedBy: invite.invitedBy?.name ?? null,
    team: {
      id: invite.team.id,
      name: invite.team.name,
      sport: invite.team.sport,
      logo: mediaUrl(invite.team.logoMediaId),
      memberCount: invite.team._count.members,
    },
  }))
}

/** Teams a user may register with (owner/captain of an active team). */
export async function listRegistrableTeams(userId: string, sport?: string) {
  const rows = await db.teamMember.findMany({
    where: {
      userId,
      leftAt: null,
      role: { in: ['OWNER', 'CAPTAIN'] },
      team: { disbandedAt: null, ...(sport ? { sport } : {}) },
    },
    select: {
      team: {
        select: {
          id: true,
          name: true,
          sport: true,
          members: {
            where: { leftAt: null },
            orderBy: { joinedAt: 'asc' },
            select: { role: true, user: { select: { id: true, name: true, username: true, avatar: true } } },
          },
        },
      },
    },
  })
  return rows.map(({ team }) => ({
    id: team.id,
    name: team.name,
    sport: team.sport,
    members: team.members.map((m) => ({ ...m.user, role: m.role })),
  }))
}
