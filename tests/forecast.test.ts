import { describe, it, expect } from 'vitest'
import { forecastSeries } from '@/lib/forecast'

describe('forecastSeries', () => {
  it('mit ≥13 Monaten: saison-naiv (Vorjahresmonat × Trendfaktor)', () => {
    // 18 Monate Historie: Vorjahr konstant 1000, letzte 6 Monate konstant 1200 → Faktor 1,2
    const history = Array.from({ length: 18 }, (_, i) => ({
      month: `m${i}`,
      value: i < 12 ? 1000 : 1200,
    }))
    const fc = forecastSeries(history, 6)
    expect(fc).toHaveLength(6)
    // Vorjahreswerte der Prognosemonate (Index 6..11 der Historie) = 1000 → × 1,2 = 1200
    expect(fc[0]).toBe(1200)
    expect(fc[5]).toBe(1200)
  })
  it('mit wenig Historie: linearer Trend, geclampt auf ≥0', () => {
    const history = [
      { month: 'a', value: 300 },
      { month: 'b', value: 200 },
      { month: 'c', value: 100 },
    ]
    const fc = forecastSeries(history, 4)
    expect(fc[0]).toBe(0) // 0 wäre nächster Trendwert, Clamp greift spätestens danach
    expect(fc[3]).toBe(0)
  })
  it('steigender Trend setzt sich fort', () => {
    const history = [
      { month: 'a', value: 100 },
      { month: 'b', value: 200 },
      { month: 'c', value: 300 },
    ]
    const fc = forecastSeries(history, 2)
    expect(fc[0]).toBe(400)
    expect(fc[1]).toBe(500)
  })
  it('leere Historie → Nullen', () => {
    expect(forecastSeries([], 3)).toEqual([0, 0, 0])
  })
})
