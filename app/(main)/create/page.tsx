import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isOrganizer } from '@/lib/actions'
import CreateTournamentClient from './create-client'

export const dynamic = 'force-dynamic'

export default async function CreateTournamentPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    redirect('/login')
  }

  const isOrg = await isOrganizer(userId)

  if (!isOrg) {
    // Non-organizer users cannot access the create page
    redirect('/feed')
  }

  return <CreateTournamentClient />
}
