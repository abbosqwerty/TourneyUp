'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/language-context'

export type RegistrableTeam = {
  id: string
  name: string
  sport: string
  members: { id: string; name: string; username: string; role: string }[]
}

export type TeamSelection = { teamId: string; rosterUserIds: string[] }

/**
 * Pick which of your teams registers and who plays. Shows the tournament's
 * roster rule up front; the server re-checks everything.
 */
export function TeamRegistrationPicker({
  teams,
  sport,
  teamSize,
  teamSizeMax,
  value,
  onChange,
  disabled,
}: {
  teams: RegistrableTeam[]
  sport: string
  teamSize: number | null
  teamSizeMax: number | null
  value: TeamSelection
  onChange: (value: TeamSelection) => void
  disabled?: boolean
}) {
  const { dict } = useLanguage()
  const r = dict.team.registration
  const min = teamSize ?? 1
  const max = teamSizeMax ?? teamSize ?? 50
  const eligible = useMemo(
    () => teams.filter((t) => sport === 'Other' || t.sport.toLowerCase() === sport.toLowerCase()),
    [teams, sport]
  )
  const team = eligible.find((t) => t.id === value.teamId)
  const count = value.rosterUserIds.length
  const sizeOk = count >= min && count <= max

  if (eligible.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <p>{r.no_team(sport)}</p>
        <Link href="/teams" className="font-medium text-primary hover:underline">
          {r.create_team}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-border/50 bg-secondary/40 p-2.5 text-xs text-muted-foreground">
        {r.rule(min === max ? r.players(min) : r.players_range(min, max))}
      </p>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{r.team}</Label>
        <Select
          value={value.teamId}
          disabled={disabled}
          onValueChange={(teamId) => {
            const next = eligible.find((t) => t.id === teamId)
            // Preselect everyone if the whole team fits the roster rule.
            const all = next?.members.map((m) => m.id) ?? []
            onChange({ teamId, rosterUserIds: all.length <= max ? all : [] })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={r.choose_team} />
          </SelectTrigger>
          <SelectContent>
            {eligible.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} · {dict.team.members(t.members.length)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {team ? (
        <fieldset className="space-y-2">
          <legend className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span>{r.roster}</span>
            <span className={sizeOk ? 'text-success' : 'text-destructive'}>
              {count} / {min === max ? min : `${min}–${max}`}
            </span>
          </legend>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {team.members.map((member) => {
              const checked = value.rosterUserIds.includes(member.id)
              return (
                <li key={member.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-secondary/50">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(next) =>
                        onChange({
                          teamId: value.teamId,
                          rosterUserIds: next
                            ? [...value.rosterUserIds, member.id]
                            : value.rosterUserIds.filter((id) => id !== member.id),
                        })
                      }
                    />
                    <span className="truncate">{member.name}</span>
                    <span className="truncate text-xs text-muted-foreground">@{member.username}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          {team.members.length < min ? (
            <p className="text-xs text-destructive">{r.not_enough(min)}</p>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  )
}
