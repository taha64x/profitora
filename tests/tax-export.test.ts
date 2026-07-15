import { describe, it, expect } from 'vitest'
import { buildTaxExportCsv } from '@/lib/tax-export'

describe('buildTaxExportCsv', () => {
  it('baut deutsches Semikolon-CSV mit BOM, Netto-Berechnung aus Brutto+MwSt', () => {
    const csv = buildTaxExportCsv([
      { date: new Date(Date.UTC(2026, 6, 1)), kind: 'Ausgabe', category: 'Einkauf', area: 'Küche', description: 'Metro', counterparty: 'Metro AG', gross: 119, vatRate: 19, status: 'Überweisung', hasReceipt: true },
      { date: new Date(Date.UTC(2026, 6, 2)), kind: 'Einnahme', category: 'Dienstleistung', area: null, description: 'Rechnung 42', counterparty: null, gross: 100, vatRate: null, status: 'paid', hasReceipt: false },
    ])
    expect(csv.startsWith('﻿')).toBe(true)
    const lines = csv.replace('﻿', '').trim().split('\n')
    expect(lines[0]).toBe('Datum;Typ;Kategorie;Bereich;Beschreibung;Gegenpartei;Brutto;MwSt-Satz;Netto;Zahlung/Status;Beleg')
    expect(lines[1]).toBe('01.07.2026;Ausgabe;Einkauf;Küche;Metro;Metro AG;119,00;19;100,00;Überweisung;ja')
    expect(lines[2]).toContain(';;100,00;;100,00;paid;nein')
  })
  it('escapt Semikolons in Texten', () => {
    const csv = buildTaxExportCsv([
      { date: new Date(Date.UTC(2026, 6, 1)), kind: 'Ausgabe', category: 'Sonstiges', area: null, description: 'A;B', counterparty: null, gross: 10, vatRate: null, status: null, hasReceipt: false },
    ])
    expect(csv).toContain('"A;B"')
  })
})
