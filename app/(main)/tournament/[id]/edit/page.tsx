import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser, getTournamentAbility } from '@/lib/session'
import { tournamentPoster } from '@/lib/media'
import { safeParseJsonArray } from '@/lib/json'
import EditForm from './edit-form'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || !(await getTournamentAbility(user.id, id)).canEditTournament) notFound()
  const t = await db.tournament.findUnique({ where: { id } })
  if (!t) notFound()
  return <EditForm id={id} posterUrl={tournamentPoster(t)} values={{
    title: t.title, description: t.description, location: t.location, date: t.date, time: t.time,
    rules: safeParseJsonArray(t.rulesJson).join('\n'), requirements: safeParseJsonArray(t.requirementsJson).join('\n'),
    prizePool: t.prizePool ?? '', entryFee: t.entryFee ?? '',
  }} />
}
