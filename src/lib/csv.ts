// Leichter CSV-Parser für Bank-Exporte (deutsch: Semikolon + Komma-Beträge).
// Browser-sicher (kein Node-Import) — läuft im Import-Dialog clientseitig.
// Bewusst ohne Dependency; Tests decken die Formate ab.

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
  delimiter: string
}

function detectDelimiter(headerLine: string): string {
  const candidates = [';', '\t', ',']
  let best = ';'
  let bestCount = -1
  for (const d of candidates) {
    const count = headerLine.split(d).length - 1
    if (count > bestCount) {
      best = d
      bestCount = count
    }
  }
  return best
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

export function parseCsv(text: string): ParsedCsv {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [], delimiter: ';' }
  const delimiter = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delimiter)
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter))
  return { headers, rows, delimiter }
}

/** '1.234,56' → 1234.56 · '1,234.56' → 1234.56 · '12.50 €' → 12.5 */
export function parseGermanAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.\-]/g, '')
  if (!cleaned || !/\d/.test(cleaned)) return null
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized: string
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, '')
  } else {
    normalized = cleaned
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** DD.MM.YYYY · DD.MM.YY · YYYY-MM-DD · DD/MM/YYYY (UTC-Mitternacht) */
export function parseFlexibleDate(raw: string): Date | null {
  const s = raw.trim()
  let m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/)
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
    const d = new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[1])))
    return Number.isNaN(d.getTime()) ? null : d
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export interface ColumnGuess {
  date: number | null
  amount: number | null
  description: number | null
  vendor: number | null
}

const GUESS_PATTERNS: Record<keyof ColumnGuess, RegExp> = {
  date: /datum|date|buchungstag|buchung|valuta|wertstellung/i,
  amount: /betrag|amount|umsatz|wert|soll\/haben/i,
  description: /verwendungszweck|beschreibung|buchungstext|zweck|text|description|info/i,
  vendor: /beguenstigter|begünstigter|empf|auftraggeber|zahlungspflichtiger|partner|name|kunde/i,
}

export function guessColumns(headers: string[]): ColumnGuess {
  const guess: ColumnGuess = { date: null, amount: null, description: null, vendor: null }
  for (const key of Object.keys(GUESS_PATTERNS) as (keyof ColumnGuess)[]) {
    const idx = headers.findIndex((h) => GUESS_PATTERNS[key].test(h))
    guess[key] = idx >= 0 ? idx : null
  }
  return guess
}
