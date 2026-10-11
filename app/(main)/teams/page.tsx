import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { listInvitesForUser, listTeamsForUser, MAX_OWNED_TEAMS } from '@/lib/teams'
import { DbErrorCard } from '@/components/db-error-card'
import { getI18n } from '@/lib/i18n/server'
import { TeamsClient } from './teams-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return { title: dict.teams.title, robots: { index: false } }
}

export default async function TeamsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fteams')
  if (user.role !== 'USER') redirect('/feed')

  let data: { teams: Awaited<ReturnType<typeof listTeamsForUser>>; invites: Awaited<ReturnType<typeof listInvitesForUser>> } | null = null
  try {
    const [teams, invites] = await Promise.all([listTeamsForUser(user.id), listInvitesForUser(user.id)])
    data = { teams, invites }
  } catch (error) {
    console.error('teams page failed', error)
  }
  if (!data) return <DbErrorCard message={(await getI18n()).dict.team.list.load_failed} />

  const ownedActive = data.teams.filter((t) => t.myRole === 'OWNER' && !t.disbanded).length

  return (
    <TeamsClient
      teams={data.teams}
      invites={data.invites}
      canCreate={ownedActive < MAX_OWNED_TEAMS}
      maxTeams={MAX_OWNED_TEAMS}
    />
  )
}
