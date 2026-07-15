import { describe, it, expect } from 'vitest'
import {
  minutesToLabel,
  labelToMinutes,
  shiftsOverlap,
  weekDates,
  isAbsent,
  nowInBerlin,
  isOnDuty,
  plannedWageCents,
} from '@/lib/shifts'

describe('minutesToLabel / labelToMinutes', () => {
  it('konvertiert hin und zurück', () => {
    expect(minutesToLabel(510)).toBe('08:30')
    expect(minutesToLabel(0)).toBe('00:00')
    expect(minutesToLabel(1439)).toBe('23:59')
    expect(labelToMinutes('08:30')).toBe(510)
    expect(labelToMinutes('23:59')).toBe(1439)
    expect(labelToMinutes('quatsch')).toBeNull()
  })
})

describe('shiftsOverlap', () => {
  it('erkennt Überlappung, Berührung zählt nicht', () => {
    expect(shiftsOverlap(480, 960, 900, 1200)).toBe(true)
    expect(shiftsOverlap(480, 960, 960, 1200)).toBe(false)
    expect(shiftsOverlap(480, 960, 200, 480)).toBe(false)
    expect(shiftsOverlap(480, 960, 500, 600)).toBe(true)
  })
})

describe('weekDates', () => {
  it('liefert Mo–So der Woche des Datums (UTC-Keys)', () => {
    // 15.07.2026 = Mittwoch → Woche 13.–19.07.
    const w = weekDates(new Date(Date.UTC(2026, 6, 15)))
    expect(w).toHaveLength(7)
    expect(w[0]).toBe('2026-07-13')
    expect(w[6]).toBe('2026-07-19')
  })
  it('Sonntag gehört zur Woche ab Montag davor', () => {
    const w = weekDates(new Date(Date.UTC(2026, 6, 19))) // So 19.07.
    expect(w[0]).toBe('2026-07-13')
  })
})

describe('isAbsent', () => {
  const absences = [
    { employeeId: 'e1', startDate: new Date(Date.UTC(2026, 6, 10)), endDate: new Date(Date.UTC(2026, 6, 20)) },
  ]
  it('innerhalb des Zeitraums (inklusive Grenzen)', () => {
    expect(isAbsent(absences, 'e1', '2026-07-15')).toBe(true)
    expect(isAbsent(absences, 'e1', '2026-07-10')).toBe(true)
    expect(isAbsent(absences, 'e1', '2026-07-20')).toBe(true)
    expect(isAbsent(absences, 'e1', '2026-07-21')).toBe(false)
    expect(isAbsent(absences, 'e2', '2026-07-15')).toBe(false)
  })
})

describe('nowInBerlin', () => {
  it('Sommer: UTC 10:00 = Berlin 12:00', () => {
    const b = nowInBerlin(new Date('2026-07-15T10:00:00Z'))
    expect(b.dateKey).toBe('2026-07-15')
    expect(b.minutes).toBe(12 * 60)
  })
  it('Winter über Mitternacht: UTC 23:30 = Berlin 00:30 Folgetag', () => {
    const b = nowInBerlin(new Date('2026-01-15T23:30:00Z'))
    expect(b.dateKey).toBe('2026-01-16')
    expect(b.minutes).toBe(30)
  })
})

describe('isOnDuty', () => {
  const berlinNow = { dateKey: '2026-07-15', minutes: 600 } // 10:00
  it('im Dienst wenn heute und jetzt im Fenster', () => {
    expect(isOnDuty({ date: new Date(Date.UTC(2026, 6, 15)), startMin: 480, endMin: 960 }, berlinNow)).toBe(true)
    expect(isOnDuty({ date: new Date(Date.UTC(2026, 6, 15)), startMin: 660, endMin: 960 }, berlinNow)).toBe(false)
    expect(isOnDuty({ date: new Date(Date.UTC(2026, 6, 14)), startMin: 480, endMin: 960 }, berlinNow)).toBe(false)
  })
})

describe('plannedWageCents', () => {
  it('summiert nur Stundenlöhner', () => {
    const employees = new Map([
      ['e1', { hourlyWageCents: 1500 }],
      ['e2', { hourlyWageCents: null }],
    ])
    const shifts = [
      { employeeId: 'e1', startMin: 480, endMin: 960 }, // 8h × 15 €
      { employeeId: 'e2', startMin: 480, endMin: 960 }, // Gehalt → ignoriert
      { employeeId: 'e1', startMin: 1020, endMin: 1140 }, // 2h × 15 €
    ]
    expect(plannedWageCents(shifts, employees)).toBe(15000)
  })
})
