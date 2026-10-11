import { describe, expect, it } from 'vitest'
import {
  computeLeaderboard,
  formatTime,
  leaderboardPlacements,
  parseTime,
  type LeaderboardEntryData,
} from '@/lib/competition/leaderboard'
import { suggestFormat } from '@/lib/competition/config'

const entry = (entrant: string, round: number, value: number | null, status: LeaderboardEntryData['status'] = 'done') => ({
  entrant,
  round,
  value,
  status,
})

describe('leaderboard — points', () => {
  const config = { scoreKind: 'points' as const, leaderboardRounds: 2 }

  it('sums rounds, highest first, and reports movement', () => {
    const entries = [
      entry('a', 1, 10), entry('b', 1, 6), entry('c', 1, 3),
      entry('a', 2, 1), entry('b', 2, 8), entry('c', 2, 2),
    ]
    const rows = computeLeaderboard(config, ['a', 'b', 'c'], entries)
    expect(rows.map((r) => [r.entrant, r.total, r.rank, r.move])).toEqual([
      ['b', 14, 1, 1],
      ['a', 11, 2, -1],
      ['c', 5, 3, 0],
    ])
  })

  it('breaks a tie on the best single round, then shares the place', () => {
    const rows = computeLeaderboard({ ...config, leaderboardRounds: 1 }, ['a', 'b', 'c'], [
      entry('a', 1, 5), entry('b', 1, 5), entry('c', 1, 7),
    ])
    expect(rows.map((r) => [r.entrant, r.rank])).toEqual([['c', 1], ['a', 2], ['b', 2]])
  })

  it('has no movement before a second round starts', () => {
    const rows = computeLeaderboard(config, ['a', 'b'], [entry('a', 1, 1), entry('b', 1, 2), entry('a', 2, null, 'pending')])
    expect(rows.every((r) => r.move === null)).toBe(true)
  })
})

describe('leaderboard — time', () => {
  const config = { scoreKind: 'time' as const, leaderboardRounds: 1 }

  it('ranks the fastest first and every DNF last', () => {
    const rows = computeLeaderboard(config, ['a', 'b', 'c'], [
      entry('a', 1, 61_000), entry('b', 1, null, 'dnf'), entry('c', 1, 59_500),
    ])
    expect(rows.map((r) => r.entrant)).toEqual(['c', 'a', 'b'])
  })

  it('only places entrants once every result is in', () => {
    const pending = [entry('a', 1, 1000), entry('b', 1, null, 'pending')]
    expect(leaderboardPlacements(config, ['a', 'b'], pending)).toBeNull()
    const done = [entry('a', 1, 1000), entry('b', 1, 900)]
    expect([...leaderboardPlacements(config, ['a', 'b'], done)!]).toEqual([['b', 1], ['a', 2]])
  })
})

describe('time parsing', () => {
  it.each([
    ['58.32', 58_320],
    ['2:05.4', 125_400],
    ['1:02:05.12', 3_725_120],
    ['65', 65_000],
    ['1,5', 1_500],
  ])('parses %s', (text, ms) => expect(parseTime(text)).toBe(ms))

  it.each(['', 'abc', '1:75', '-3', '0'])('rejects %s', (text) => expect(parseTime(text)).toBeNull())

  it('round-trips through formatTime', () => {
    expect(formatTime(3_725_120)).toBe('1:02:05.12')
    expect(formatTime(125_400)).toBe('2:05.40')
    expect(parseTime(formatTime(125_400))).toBe(125_400)
  })
})

describe('suggestFormat', () => {
  it.each([
    ['Running', 'LEADERBOARD'],
    ['Swimming', 'LEADERBOARD'],
    ['PUBG Mobile', 'LEADERBOARD'],
    ['Chess', 'SWISS'],
    ['Football', 'GROUPS_KNOCKOUT'],
    ['Basketball', 'GROUPS_KNOCKOUT'],
    ['Valorant', 'SINGLE_ELIMINATION'],
  ])('%s → %s', (sport, format) => expect(suggestFormat(sport).format).toBe(format))
})
