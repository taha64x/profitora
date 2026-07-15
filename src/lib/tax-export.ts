// Steuerberater-Export: deutsches Semikolon-CSV (Excel-kompatibel, BOM).
// Bewusst KEIN natives DATEV-Buchungsstapel-Format (Kontenrahmen fehlt) —
// Spalten sind so gewählt, dass der Steuerberater direkt weiterarbeiten kann.
export interface TaxExportRow {
  date: Date
  kind: 'Einnahme' | 'Ausgabe'
  category: string
  area: string | null
  description: string
  counterparty: string | null
  gross: number
  vatRate: number | null
  status: string | null
  hasReceipt: boolean
}

function esc(v: string): string {
  return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function de(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

function dateDe(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getUTCFullYear()}`
}

export function buildTaxExportCsv(rows: TaxExportRow[]): string {
  const header = 'Datum;Typ;Kategorie;Bereich;Beschreibung;Gegenpartei;Brutto;MwSt-Satz;Netto;Zahlung/Status;Beleg'
  const lines = rows.map((r) => {
    const net = r.vatRate ? r.gross / (1 + r.vatRate / 100) : r.gross
    return [
      dateDe(r.date),
      r.kind,
      esc(r.category),
      esc(r.area ?? ''),
      esc(r.description),
      esc(r.counterparty ?? ''),
      de(r.gross),
      r.vatRate === null ? '' : String(r.vatRate),
      de(net),
      esc(r.status ?? ''),
      r.hasReceipt ? 'ja' : 'nein',
    ].join(';')
  })
  return '﻿' + [header, ...lines].join('\n') + '\n'
}
