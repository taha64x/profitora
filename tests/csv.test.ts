import { describe, it, expect } from 'vitest'
import { parseCsv, parseGermanAmount, parseFlexibleDate, guessColumns } from '@/lib/csv'
import { importHash } from '@/lib/import-hash'

describe('parseCsv', () => {
  it('erkennt Semikolon-Delimiter (deutsche Bank-CSV) + Quotes', () => {
    const r = parseCsv('Datum;Betrag;"Verwendungszweck"\n01.07.2026;-12,50;"Kaffee; Bohnen"\n02.07.2026;100,00;Miete')
    expect(r.headers).toEqual(['Datum', 'Betrag', 'Verwendungszweck'])
    expect(r.rows).toHaveLength(2)
    expect(r.rows[0][2]).toBe('Kaffee; Bohnen')
  })
  it('erkennt Komma-Delimiter', () => {
    const r = parseCsv('date,amount\n2026-07-01,12.50')
    expect(r.headers).toEqual(['date', 'amount'])
    expect(r.rows[0][1]).toBe('12.50')
  })
  it('überspringt Leerzeilen', () => {
    const r = parseCsv('a;b\n1;2\n\n3;4\n')
    expect(r.rows).toHaveLength(2)
  })
})

describe('parseGermanAmount', () => {
  it('parst deutsche und englische Formate', () => {
    expect(parseGermanAmount('1.234,56')).toBe(1234.56)
    expect(parseGermanAmount('-12,50')).toBe(-12.5)
    expect(parseGermanAmount('1,234.56')).toBe(1234.56)
    expect(parseGermanAmount('100')).toBe(100)
    expect(parseGermanAmount('12.50 €')).toBe(12.5)
    expect(parseGermanAmount('quatsch')).toBeNull()
  })
})

describe('parseFlexibleDate', () => {
  it('parst DD.MM.YYYY, DD.MM.YY, ISO, DD/MM/YYYY', () => {
    expect(parseFlexibleDate('01.07.2026')?.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(parseFlexibleDate('01.07.26')?.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(parseFlexibleDate('2026-07-01')?.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(parseFlexibleDate('01/07/2026')?.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(parseFlexibleDate('kein datum')).toBeNull()
  })
})

describe('guessColumns', () => {
  it('rät Standard-Bankspalten', () => {
    const g = guessColumns(['Buchungstag', 'Verwendungszweck', 'Beguenstigter/Zahlungspflichtiger', 'Betrag'])
    expect(g.date).toBe(0)
    expect(g.description).toBe(1)
    expect(g.vendor).toBe(2)
    expect(g.amount).toBe(3)
  })
})

describe('importHash', () => {
  it('stabil für gleiche Zeile, verschieden für andere', () => {
    const a = importHash(new Date('2026-07-01'), 12.5, 'Kaffee')
    expect(a).toBe(importHash(new Date('2026-07-01'), 12.5, '  kaffee '))
    expect(a).not.toBe(importHash(new Date('2026-07-02'), 12.5, 'Kaffee'))
  })
})
