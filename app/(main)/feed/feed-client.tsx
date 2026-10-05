'use client'

import { useState } from 'react'
import { TournamentCard } from '@/components/tournament-card'
import { FeaturedStoriesRow } from '@/components/featured-story'
import { SearchFilters, type FilterState } from '@/components/search-filters'
import { NoTournamentsFound } from '@/components/empty-state'
import { toggleSaveTournament } from '@/lib/actions'
import { useAuthModal } from '@/components/auth-modal'

export default function FeedClient({
  initialTournaments,
  initialFeaturedStories,
  initialSavedTournaments,
  currentUserId,
}: {
  initialTournaments: any[]
  initialFeaturedStories: any[]
  initialSavedTournaments: string[]
  currentUserId?: string
}) {
  const { openLoginModal } = useAuthModal()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    sport: 'all',
    location: 'All Locations',
    status: 'all',
    dateRange: 'all',
  })
  const [savedTournaments, setSavedTournaments] = useState<string[]>(initialSavedTournaments)

  const toggleSave = async (id: string) => {
    if (!currentUserId) {
      openLoginModal({
        title: 'Sign in to Save Tournaments',
        description: 'Sign in with a player or organizer account to bookmark tournaments to your saved list.'
      })
      return
    }
    setSavedTournaments(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
    await toggleSaveTournament(id, currentUserId)
  }

  // Filter tournaments based on search, category, and filters
  const filteredTournaments = initialTournaments.filter(tournament => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        tournament.title.toLowerCase().includes(query) ||
        tournament.sport.toLowerCase().includes(query) ||
        tournament.organizer.name.toLowerCase().includes(query) ||
        tournament.location.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Sport filter
    if (filters.sport !== 'all') {
      const sportMatch = tournament.sport.toLowerCase().replace(/\s+/g, '-') === filters.sport
      if (!sportMatch) return false
    }

    // Location filter
    if (filters.location !== 'All Locations') {
      const locQuery = filters.location.toLowerCase().trim()
      if (!tournament.location.toLowerCase().includes(locQuery)) return false
    }

    // Status filter
    if (filters.status !== 'all') {
      if (tournament.status !== filters.status) return false
    }

    return true
  })

  const featuredTournaments = filteredTournaments.filter(t => t.featured)
  const regularTournaments = filteredTournaments.filter(t => !t.featured)

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilters 
          onSearch={setSearchQuery}
          onFilterChange={setFilters}
        />
      </div>

      {/* Featured Stories / Highlights */}
      <section className="mb-8">
        <h2 className="text-base font-semibold mb-4 text-foreground text-center">Highlights</h2>
        <FeaturedStoriesRow stories={initialFeaturedStories} />
      </section>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Tournament Grid */}
      {filteredTournaments.length === 0 ? (
        <NoTournamentsFound />
      ) : (
        <div className="space-y-8">
          {/* Featured Tournaments */}
          {featuredTournaments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Featured Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    variant="featured"
                    onSave={() => toggleSave(tournament.id)}
                    isSaved={savedTournaments.includes(tournament.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Tournaments */}
          <section>
            {featuredTournaments.length > 0 && (
              <h2 className="text-lg font-semibold mb-4">All Tournaments</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onSave={() => toggleSave(tournament.id)}
                  isSaved={savedTournaments.includes(tournament.id)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
