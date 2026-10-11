import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { getI18n } from '@/lib/i18n/server'
import { NewTicketForm } from './new-ticket-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.chat.meta.new_ticket, robots: { index: false } }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function NewTicketPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fmessages%2Fsupport%2Fnew')

  const params = await searchParams
  const preselected = Array.isArray(params.tournament) ? params.tournament[0] : params.tournament

  // Tournaments the user is involved in come first; a preselected one (from
  // the tournament page's "ask a question") is always offered.
  const [mine, chosen] = await Promise.all([
    db.tournament.findMany({
      where: {
        status: { notIn: ['completed', 'cancelled'] },
        OR: [{ participants: { some: { userId: user.id } } }, { participants: { some: { roster: { some: { userId: user.id } } } } }],
      },
      select: { id: true, title: true },
      orderBy: { date: 'asc' },
      take: 30,
    }),
    preselected
      ? db.tournament.findFirst({
          where: { id: preselected, status: { notIn: ['completed', 'cancelled'] } },
          select: { id: true, title: true },
        })
      : null,
  ])
  const tournaments = chosen && !mine.some((t) => t.id === chosen.id) ? [chosen, ...mine] : mine

  return <NewTicketForm tournaments={tournaments} preselected={chosen?.id ?? null} />
}
