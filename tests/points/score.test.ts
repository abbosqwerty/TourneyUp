import { describe, expect, it } from 'vitest'
import { basePoints, finalPoints, POINTS_CONFIG, sizeMultiplier } from '@/lib/points/score'

describe('base points', () => {
  it('follows the universal table', () => {
    expect(basePoints(1, true)).toBe(100)
    expect(basePoints(2, true)).toBe(70)
    expect(basePoints(3, true)).toBe(50)
    for (const place of [4, 5, 6, 7, 8]) expect(basePoints(place, true)).toBe(25)
    expect(basePoints(9, true)).toBe(10)
    expect(basePoints(64, true)).toBe(10)
  })

  it('never scores a registration without participation', () => {
    expect(basePoints(1, false)).toBe(0)
    expect(basePoints(null, false)).toBe(0)
    expect(basePoints(null, true)).toBe(0)
  })
})

describe('tournament size bonus', () => {
  it('is round(Base × (1 + 0.2 × log10(N)))', () => {
    expect(finalPoints(100, 1)).toBe(100)
    expect(finalPoints(100, 10)).toBe(120)
    expect(finalPoints(100, 100)).toBe(140)
    expect(finalPoints(100, 8)).toBe(Math.round(100 * (1 + 0.2 * Math.log10(8))))
    expect(finalPoints(70, 16)).toBe(Math.round(70 * (1 + 0.2 * Math.log10(16))))
    expect(finalPoints(10, 1000)).toBe(16)
  })

  it('treats N below 1 as 1', () => {
    expect(sizeMultiplier(0)).toBe(1)
    expect(finalPoints(50, -3)).toBe(50)
  })

  it('reads its constants from the config', () => {
    const custom = { ...POINTS_CONFIG, sizeBonusFactor: 0.5 }
    expect(finalPoints(100, 10, custom)).toBe(150)
  })
})
