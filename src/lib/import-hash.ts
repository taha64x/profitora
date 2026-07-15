// Server-seitiger Duplikat-Hash für den CSV-Import.
// Getrennt von csv.ts, damit der Parser browser-sicher bleibt (kein Node-crypto im Client-Bundle).
import { createHash } from 'crypto'

/** Stabiler Duplikat-Hash: Datum + Betrag + normalisierte Beschreibung */
export function importHash(date: Date, amount: number, description: string): string {
  const key = `${date.toISOString().slice(0, 10)}|${amount.toFixed(2)}|${description.trim().toLowerCase()}`
  return createHash('sha256').update(key).digest('hex').slice(0, 32)
}
