'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { TournamentCard } from '@/components/tournament-card'
import { FeaturedStoriesRow, type StoryData } from '@/components/featured-story'
import { Pager } from '@/components/pager'
import type { Tournament } from '@/lib/types'
import { SearchFilters } from '@/components/search-filters'
import { filtersToQuery, hasActiveFilters, type TournamentFilters } from '@/lib/tournament-filters'
import { NoTournamentsFound } from '@/components/empty-state'
import { toggleSaveTournament } from '@/lib/actions'
import { useAuthModal } from '@/components/auth-modal'

export default function FeedClient({
  filters,
  tournaments,
  highlights,
  savedTournaments: initialSaved,
  totalCount,
  pageSize,
  currentUserId,
}: {
  filters: TournamentFilters
  tournaments: Tournament[]
  highlights: StoryData[]
  savedTournaments: string[]
  totalCount: number
  pageSize: number
  currentUserId?: string
}) {
  const { openLoginModal } = useAuthModal()
  // Optimistic overrides layered over the server's list: a new page of props
  // wins for every card the user has not touched, with no sync effect.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const isSaved = (id: string) => overrides[id] ?? initialSaved.includes(id)

  const toggleSave = async (id: string) => {
    if (!currentUserId) {
      openLoginModal({
        title: 'Saqlash uchun kiring',
        description: 'Turnirlarni saqlangan ro‘yxatga qo‘shish uchun akkauntingizga kiring.',
      })
      return
    }

    const next = !isSaved(id)
    setOverrides((prev) => ({ ...prev, [id]: next }))

    const result = await toggleSaveTournament(id)
    if (!result.ok) {
      // The server refused — put the UI back where it was.
      setOverrides((prev) => ({ ...prev, [id]: !next }))
      toast.error(result.error)
    }
  }

  const featured = tournaments.filter((t) => t.featured)
  const regular = tournaments.filter((t) => !t.featured)
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeStart = totalCount === 0 ? 0 : (filters.page - 1) * pageSize + 1
  const rangeEnd = Math.min(filters.page * pageSize, totalCount)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <SearchFilters filters={filters} />
      </div>

      {highlights.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 text-center text-base font-semibold text-foreground">Eng qizg‘inlari</h2>
          <FeaturedStoriesRow stories={highlights} />
        </section>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? 'Turnir topilmadi'
            : `${totalCount} ta turnirdan ${rangeStart}–${rangeEnd} ko‘rsatilmoqda`}
        </p>
      </div>

      {tournaments.length === 0 ? (
        <NoTournamentsFound />
      ) : (
        <div className="space-y-8">
          {featured.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Tanlangan turnirlar</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    variant="featured"
                    onSave={() => toggleSave(tournament.id)}
                    isSaved={isSaved(tournament.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {featured.length > 0 && <h2 className="mb-4 text-lg font-semibold">Barcha turnirlar</h2>}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {regular.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onSave={() => toggleSave(tournament.id)}
                    isSaved={isSaved(tournament.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <Pager
            page={filters.page}
            pageCount={pageCount}
            hrefFor={(page) => `/feed${filtersToQuery({ ...filters, page })}`}
            className="pt-2"
          />
        </div>
      )}

      {tournaments.length === 0 && hasActiveFilters(filters) ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Filtrlarni kengaytirib ko‘ring.
        </p>
      ) : null}
    </div>
  )
}
