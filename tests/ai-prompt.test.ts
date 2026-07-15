import { describe, it, expect } from 'vitest'
import { focusSection, measuresSection } from '@/lib/ai'

describe('focusSection', () => {
  it('leer ohne Schwerpunkte', () => {
    expect(focusSection()).toBe('')
    expect(focusSection([])).toBe('')
  })
  it('nennt gewählte Schwerpunkte mit Doppelte-Tiefe-Anweisung', () => {
    const s = focusSection(['personal', 'energie'])
    expect(s).toContain('Personal & Produktivität')
    expect(s).toContain('Energie & Versorgung')
    expect(s).toContain('DOPPELTER Tiefe')
    expect(s).toContain('Regel 3')
  })
})

describe('measuresSection', () => {
  it('leer ohne Maßnahmen', () => {
    expect(measuresSection()).toBe('')
    expect(measuresSection([])).toBe('')
  })
  it('listet Maßnahmen mit Status und verlangt Wirkungs-Check-Sektion', () => {
    const s = measuresSection([
      { title: 'Energieanbieter wechseln', status: 'IMPLEMENTED', potentialSavingsEur: 1200, implementedAt: '2026-07-15' },
      { title: 'Wareneinsatz senken', status: 'OPEN', potentialSavingsEur: null, implementedAt: null },
    ])
    expect(s).toContain('UMGESETZT am 2026-07-15')
    expect(s).toContain('Energieanbieter wechseln')
    expect(s).toContain('geschätztes Potenzial 1200 EUR/Jahr')
    expect(s).toContain('[OFFEN] Wareneinsatz senken')
    expect(s).toContain('measure-review')
    expect(s).toContain('Wirkung noch nicht messbar – Datengrundlage fehlt')
  })
})
