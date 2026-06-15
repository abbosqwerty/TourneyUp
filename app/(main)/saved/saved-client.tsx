'use client'

import { useState } from 'react'
import { TournamentCard } from '@/components/tournament-card'
import { NoSavedTournaments } from '@/components/empty-state'
import { toggleSaveTournament } from '@/lib/actions'

export default function SavedClient({
  initialTournaments
}: {
  initialTournaments: any[]
}) {
  const [savedTournaments, setSavedTournaments] = useState<any[]>(initialTournaments)
  
  const toggleSave = async (id: string) => {
    setSavedTournaments(prev => prev.filter(t => t.id !== id))
    await toggleSaveTournament(id, 'user1')
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Saved Tournaments</h1>
        <p className="text-muted-foreground mt-1">
          Quick access to tournaments you're interested in
        </p>
      </div>

      {/* Grid */}
      {savedTournaments.length === 0 ? (
        <NoSavedTournaments />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {savedTournaments.length} saved tournament{savedTournaments.length !== 1 ? 's' : ''}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSave={() => toggleSave(tournament.id)}
                isSaved={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
