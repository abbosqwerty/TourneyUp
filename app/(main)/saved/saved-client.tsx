'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Tournament } from '@/lib/types'
import { TournamentCard } from '@/components/tournament-card'
import { NoSavedTournaments } from '@/components/empty-state'
import { toggleSaveTournament } from '@/lib/actions'

export default function SavedClient({ initialTournaments }: { initialTournaments: Tournament[] }) {
  const [savedTournaments, setSavedTournaments] = useState(initialTournaments)

  const toggleSave = async (id: string) => {
    const previous = savedTournaments
    setSavedTournaments((prev) => prev.filter((t) => t.id !== id))

    const result = await toggleSaveTournament(id)
    if (!result.ok) {
      // The server refused — put the card back.
      setSavedTournaments(previous)
      toast.error(result.error)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Saqlangan turnirlar</h1>
        <p className="mt-1 text-muted-foreground">Qiziqtirgan turnirlarga tez kirish</p>
      </div>

      {savedTournaments.length === 0 ? (
        <NoSavedTournaments />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {savedTournaments.length} ta saqlangan turnir
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSave={() => toggleSave(tournament.id)}
                isSaved
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
