import type { Dictionary } from '../i18n/dictionaries'

/**
 * Round and stage names in the viewer's language.
 *
 * The engine stores `Match.stage` and auto-generated `CompetitionGroup.name`
 * in Uzbek at draw time ("Yarim final", "Quyi to‘r: 2-raund",
 * "A guruh, 3-tur"). These helpers recognise every pattern the engine
 * writes and render it from the dictionary; anything else (a stage typed by
 * staff for an old manual fixture, a group named by the organizer) is user
 * content and comes back unchanged. Safe to call on both server and client.
 */

type Rounds = Dictionary['competition']['rounds']

/** "A guruh" → "Group A"; organizer-typed group names stay as written. */
export function groupLabel(dict: Dictionary, name: string): string {
  const m = /^([A-Z]\d*) guruh$/.exec(name)
  return m ? dict.competition.rounds.group(m[1]) : name
}

/** A knockout round name without any bracket prefix, or null if unknown. */
function coreStage(r: Rounds, text: string): string | null {
  let m: RegExpExecArray | null
  if ((m = /^(\d+)-tur$/.exec(text))) return r.round(Number(m[1]))
  if (text === 'Final') return r.final
  if (text === 'Yarim final') return r.semifinal
  if (text === 'Chorak final') return r.quarterfinal
  if ((m = /^1\/(\d+) final$/.exec(text))) return r.fraction(Number(m[1]))
  if (text === '3-o‘rin uchun') return r.third_place
  if (text === 'Quyi to‘r finali') return r.lower_final
  if ((m = /^Quyi to‘r: (\d+)-raund$/.exec(text))) return r.lower_round(Number(m[1]))
  if (text === 'Grand final') return r.grand_final
  if (text === 'Grand final (qayta)') return r.grand_final_reset
  return null
}

const PREFIXES: [string, keyof Rounds][] = [
  ['Pley-off', 'playoff'],
  ['Yuqori to‘r', 'upper'],
]

/**
 * A match's stage in the viewer's language. `short` drops the bracket
 * prefix ("Pley-off: Final" → "Final"), for column headers inside a bracket.
 */
export function stageLabel(dict: Dictionary, stage: string, options: { short?: boolean } = {}): string {
  if (!stage) return stage
  const r = dict.competition.rounds

  for (const [uz, key] of PREFIXES) {
    if (stage.startsWith(`${uz}: `)) {
      const inner = coreStage(r, stage.slice(uz.length + 2))
      if (inner === null) return stage
      return options.short ? inner : `${r[key] as string}: ${inner}`
    }
  }

  const grouped = /^(.+), (\d+)-tur$/.exec(stage)
  if (grouped) return `${groupLabel(dict, grouped[1])}, ${r.round(Number(grouped[2]))}`

  const core = coreStage(r, stage)
  if (core !== null) {
    if (options.short && stage.startsWith('Quyi to‘r: ')) return r.round_short(Number(/(\d+)/.exec(stage)![1]))
    return core
  }
  return stage
}
