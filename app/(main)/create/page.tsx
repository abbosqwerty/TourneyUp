import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { getI18n } from '@/lib/i18n/server'
import CreateTournamentClient from './create-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.create.meta_title, robots: { index: false } }
}

export default async function CreateTournamentPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/login?next=%2Fcreate')
  // Tournament creation belongs to the organization account, not to the
  // per-tournament staff roles it hands out.
  if (user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN') redirect('/feed')

  return <CreateTournamentClient />
}
