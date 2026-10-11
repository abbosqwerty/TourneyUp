import { randomUUID } from 'node:crypto'
import type { TournamentFormat } from '@prisma/client'
import { db } from '@/lib/db'

export const hasTestDb = Boolean(process.env.DATABASE_URL_TEST)

const uid = () => randomUUID().slice(0, 8)

export async function createUser(overrides: { role?: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN'; name?: string } = {}) {
  const id = uid()
  return db.user.create({
    data: {
      name: overrides.name ?? `User ${id}`,
      username: `u_${id}`,
      email: `${id}@test.local`,
      role: overrides.role ?? 'USER',
      bio: '',
      joinedDate: '2026-01-01',
    },
  })
}

export async function createOrganizer() {
  const owner = await createUser({ role: 'ORGANIZATION' })
  const organization = await db.organization.create({
    data: { name: `Org ${owner.id}`, slug: `org-${owner.id}`, description: 'Test', email: 'org@test.local', ownerId: owner.id },
  })
  return { owner, organization }
}

export async function createTournament(options: {
  format?: TournamentFormat
  config?: Record<string, unknown>
  participants?: number
  sport?: string
  category?: string
  participantType?: 'INDIVIDUAL' | 'TEAM'
}) {
  const { owner, organization } = await createOrganizer()
  const tournament = await db.tournament.create({
    data: {
      title: `Cup ${uid()}`,
      sport: options.sport ?? 'Chess',
      category: options.category ?? 'academic',
      location: 'Tashkent',
      date: '2026-12-01',
      time: '10:00',
      maxParticipants: 64,
      organizerId: owner.id,
      organizationId: organization.id,
      description: 'Integration test tournament',
      rulesJson: '[]',
      requirementsJson: '[]',
      status: 'registration_open',
      format: options.format ?? 'SINGLE_ELIMINATION',
      participantType: options.participantType ?? 'INDIVIDUAL',
      formatConfigJson: JSON.stringify(options.config ?? {}),
    },
  })

  const players = []
  for (let i = 0; i < (options.participants ?? 0); i++) {
    const user = await createUser({ name: `P${i + 1}` })
    const participant = await db.participant.create({
      data: {
        name: user.name,
        email: user.email!,
        avatar: '',
        registeredAt: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
        status: 'approved',
        paymentStatus: 'paid',
        tournamentId: tournament.id,
        userId: user.id,
        seed: i + 1,
      },
    })
    players.push({ user, participant })
  }

  return { owner, organization, tournament, players }
}

/** Seed 1 always wins — makes expected placements obvious. */
export const firstSeedRng = () => 0
