import { describe, it, expect } from 'vitest'
import { advanceNextRun } from '@/lib/recurring'

describe('advanceNextRun', () => {
  it('monatlich, quartalsweise, jährlich', () => {
    expect(advanceNextRun(new Date(Date.UTC(2026, 0, 15)), 'monthly').toISOString().slice(0, 10)).toBe('2026-02-15')
    expect(advanceNextRun(new Date(Date.UTC(2026, 0, 15)), 'quarterly').toISOString().slice(0, 10)).toBe('2026-04-15')
    expect(advanceNextRun(new Date(Date.UTC(2026, 0, 15)), 'yearly').toISOString().slice(0, 10)).toBe('2027-01-15')
  })
  it('Monatsende-sicher: 31.01. + monthly → 28.02. (kein Überlauf in März)', () => {
    expect(advanceNextRun(new Date(Date.UTC(2026, 0, 31)), 'monthly').toISOString().slice(0, 10)).toBe('2026-02-28')
  })
  it('Jahreswechsel: 15.11. + quarterly → 15.02. Folgejahr', () => {
    expect(advanceNextRun(new Date(Date.UTC(2026, 10, 15)), 'quarterly').toISOString().slice(0, 10)).toBe('2027-02-15')
  })
})
