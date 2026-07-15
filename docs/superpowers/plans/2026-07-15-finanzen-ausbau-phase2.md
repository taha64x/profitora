# Finanzen-Ausbau (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finanz-Cockpit ausbauen — Bereiche, wiederkehrende Posten mit Cron, CSV-Bankimport, Belege, MwSt, Steuerberater-Export, Cockpit-Startseite mit Benchmark-Ampeln, KPI-Alerts, Monatsreset — danach ist der öffentliche Abo-Launch möglich.

**Architecture:** Reine Logik in `src/lib/{benchmarks,csv,areas,recurring}.ts` (Vitest), DB via bestehende `{success,data}`-APIs, ein täglicher Vercel-Cron (`/api/cron/daily`, CRON_SECRET) für Recurring/Alerts/Monatsreset. Business+-Features (Export, Alerts) flag-gated über Entitlements; ohne Flag alles frei nutzbar (Prod bleibt voll funktional bis Launch).

**Tech Stack:** Next.js 14, Prisma 7, Recharts (vorhanden), Vercel Cron + Blob, Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-14-abo-cockpit-design.md` §4.1/§4.3/§4.4/§5.2 · Basis: Phase-1-Entitlements

---

## Dateiübersicht

| Datei | Aktion | Verantwortung |
|---|---|---|
| `prisma/schema.prisma` | Modify | +`Area`, `RecurringEntry`, `AlertRule`, `AlertEvent`; Expense/Revenue +`areaId,vatRate,receiptPath,receiptName,importHash,recurringEntryId` |
| `src/lib/benchmarks.ts` | Create | TS-Port der Python-Benchmarks, Ampel-Logik, KPI-Berechnung aus Kategorien (Keyword-Matching) |
| `src/lib/csv.ts` | Create | CSV-Parser (Delimiter-Detection, Quotes, deutsche Beträge/Daten), Spalten-Auto-Guess, importHash |
| `src/lib/areas.ts` | Create | Bereichs-Defaults je businessType |
| `src/lib/recurring.ts` | Create | `advanceNextRun` (Monatsend-sicher) |
| `src/app/api/areas/route.ts` | Create | CRUD + Lazy-Seed |
| `src/app/api/finance/import/route.ts` | Create | CSV-Zeilen → Expense/Revenue mit Duplikat-Check |
| `src/app/api/finance/receipt/route.ts` | Create | Beleg-Upload (Blob, org-scoped) + presigned GET |
| `src/app/api/finance/export/route.ts` | Create | Steuerberater-CSV (Business+ flag-gated) |
| `src/app/api/recurring/route.ts` | Create | CRUD wiederkehrende Posten |
| `src/app/api/cron/daily/route.ts` | Create | Recurring-Generator, Monatsreset, KPI-Alerts |
| `src/app/api/expenses/route.ts`, `revenues/route.ts` | Modify | +areaId/vatRate in POST/PUT, GET liefert Bereichsname |
| `src/app/dashboard/costs/page.tsx`, `revenues/page.tsx` | Modify | Formular: Bereich/MwSt/Intervall/Beleg; Liste: Badges; Import-Button |
| `src/components/finance/CsvImportDialog.tsx` | Create | Datei → Mapping → Preview → Import |
| `src/components/finance/ReceiptField.tsx` | Create | Beleg-Upload-Feld (Formular) |
| `src/app/dashboard/recurring/page.tsx` + `layout.tsx` | Create | Verwaltung wiederkehrender Posten (Gate) |
| `src/app/dashboard/page.tsx` | Modify | Komplettes Redesign: volle MTD-Aggregation (Bug-Fix take:5), Ampeln, Sparkline, Ziele, Alert-Feed |
| `src/components/dashboard/TrendSparkline.tsx` | Create | 12-Monats-Chart (nutzt verwaisten `/api/monthly-summary`) |
| `src/components/dashboard/DashboardLayout.tsx` | Modify | NavLink „Wiederkehrend" |
| `src/app/dashboard/finance/page.tsx` | Modify | Bereichs-Vergleich + Export-Button |
| `src/app/(auth)/register/page.tsx`, `GoogleLoginButton.tsx`, `api/auth/google/*` | Modify | `?abo=`-Durchreichung |
| `src/lib/email.ts` | Modify | +`sendKpiAlertEmail` |
| `vercel.json` | Modify | +crons |
| `.env.example` | Modify | +CRON_SECRET |
| `tests/{benchmarks,csv,recurring,areas}.test.ts` | Create | Unit-Tests |

**Bestandsfakten:** `getCurrentUser()` synchron; APIs antworten `{success,data}`/`{error}`; costs/revenues/finance sind Client-Pages mit Route-Layout-Gates (Phase 1); CATEGORIES hardcoded je Seite Zeile 7; `isRecurring`-Checkbox existiert, Intervall-Input fehlt; Home-Page lädt nur `take:5` (Bug); `/api/monthly-summary` verwaist (12 Monate, cockpit-gated); kein Cron/CRON_SECRET; Blob via `put()` + `presignBlobGetUrl(pathname, ttlMs)`; lokale Dev-DB via `DATABASE_URL` aus `.env` (nicht `.env.local`!).

---

### Task 1: Branch + Prisma-Modelle

**Files:** Modify: `prisma/schema.prisma`

- [ ] **Step 1.1: Branch**

```bash
git checkout -b feature/abo-cockpit-phase2
```

- [ ] **Step 1.2: Neue Modelle ans Schema-Ende anhängen**

```prisma
// ─── Bereiche (Finanzen + später Schichtplan) ────────────────────────────────

model Area {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  expenses     Expense[]
  revenues     Revenue[]

  @@unique([organizationId, name])
}

// ─── Wiederkehrende Posten (Cron erzeugt Einträge) ───────────────────────────

model RecurringEntry {
  id             String    @id @default(cuid())
  organizationId String
  kind           String    // INCOME | EXPENSE
  amount         Float
  category       String
  areaId         String?
  vatRate        Int?
  vendor         String?   // EXPENSE: Lieferant · INCOME: Kunde/Quelle
  description    String
  interval       String    // monthly | quarterly | yearly
  nextRun        DateTime
  active         Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ─── KPI-Alerts ───────────────────────────────────────────────────────────────

model AlertRule {
  id             String    @id @default(cuid())
  organizationId String
  metric         String    // laborCostRatio | goodsCostRatio | netMarginPercent
  threshold      Float
  direction      String    // ABOVE | BELOW (wann feuern)
  active         Boolean   @default(true)
  lastFiredAt    DateTime?
  createdAt      DateTime  @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, metric])
}

model AlertEvent {
  id             String   @id @default(cuid())
  organizationId String
  metric         String
  value          Float
  threshold      Float
  message        String
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, createdAt])
}
```

- [ ] **Step 1.3: Expense erweitern** — in `model Expense` nach `vendor String?` einfügen:

```prisma
  areaId             String?
  vatRate            Int?      // 0 | 7 | 19
  receiptPath        String?   // Blob: receipts/<orgId>/<uuid>.<ext>
  receiptName        String?
  importHash         String?   // Duplikat-Schutz CSV-Import
  recurringEntryId   String?   // Herkunft: Cron-generiert aus RecurringEntry
  area               Area?     @relation(fields: [areaId], references: [id], onDelete: SetNull)
```

- [ ] **Step 1.4: Revenue erweitern** — in `model Revenue` nach `paymentStatus …` dieselben 7 Zeilen einfügen (identisch zu 1.3).

- [ ] **Step 1.5: Organization-Relationen ergänzen** — in `model Organization` bei den Relationen anhängen:

```prisma
  areas            Area[]
  recurringEntries RecurringEntry[]
  alertRules       AlertRule[]
  alertEvents      AlertEvent[]
```

- [ ] **Step 1.6: Generate + Dev-DB**

Run: `npm run db:generate && npm run db:push && npx tsc --noEmit`
Expected: sync ohne Data-Loss-Warnung, tsc grün.

- [ ] **Step 1.7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): Area, RecurringEntry, AlertRule/Event + Finanz-Felder (Bereich, MwSt, Beleg, Import, Recurring-Herkunft)"
```

---

### Task 2: `benchmarks.ts` (TDD)

**Files:** Create: `src/lib/benchmarks.ts` · Test: `tests/benchmarks.test.ts`

- [ ] **Step 2.1: Failing Test** — `tests/benchmarks.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  BUSINESS_BENCHMARKS,
  rateMetric,
  computeFinanceKpis,
  classifyCategory,
} from '@/lib/benchmarks'

describe('BUSINESS_BENCHMARKS', () => {
  it('deckt alle 10 businessTypes ab, jeder mit laborCostRatio + netMarginPercent', () => {
    const types = ['hotel','restaurant','cafe_bakery','retail','medical','craft','fitness','beauty','consulting','other']
    for (const t of types) {
      expect(BUSINESS_BENCHMARKS[t]?.laborCostRatio).toBeDefined()
      expect(BUSINESS_BENCHMARKS[t]?.netMarginPercent).toBeDefined()
    }
    expect(BUSINESS_BENCHMARKS.hotel.laborCostRatio).toEqual({ target: 28, warning: 30, critical: 35 })
    expect(BUSINESS_BENCHMARKS.retail.goodsCostRatio).toEqual({ target: 60, warning: 68, critical: 75 })
  })
})

describe('rateMetric', () => {
  const lower = { target: 28, warning: 30, critical: 35 }  // Kostenquote: niedriger besser
  const higher = { target: 10, warning: 5, critical: 0 }   // Marge: höher besser
  it('lower-better: <=target grün, <=warning gelb, sonst rot', () => {
    expect(rateMetric(27, lower)).toBe('green')
    expect(rateMetric(29.5, lower)).toBe('yellow')
    expect(rateMetric(31, lower)).toBe('red')
  })
  it('higher-better (target>warning): >=target grün, >=warning gelb, sonst rot', () => {
    expect(rateMetric(12, higher)).toBe('green')
    expect(rateMetric(6, higher)).toBe('yellow')
    expect(rateMetric(2, higher)).toBe('red')
  })
})

describe('classifyCategory', () => {
  it('erkennt Personal/Waren/Energie per Keyword', () => {
    expect(classifyCategory('Personal')).toBe('labor')
    expect(classifyCategory('Löhne & Gehälter')).toBe('labor')
    expect(classifyCategory('Einkauf')).toBe('goods')
    expect(classifyCategory('Lebensmittel Metro')).toBe('goods')
    expect(classifyCategory('Energie')).toBe('energy')
    expect(classifyCategory('Marketing')).toBe('other')
  })
})

describe('computeFinanceKpis', () => {
  it('berechnet Quoten aus Kategorien-Summen', () => {
    const kpis = computeFinanceKpis({
      revenueTotal: 10000,
      expenseTotal: 9000,
      expensesByCategory: { Personal: 3000, Einkauf: 2500, Energie: 500, Miete: 3000 },
    })
    expect(kpis.laborCostRatio).toBeCloseTo(30)
    expect(kpis.goodsCostRatio).toBeCloseTo(25)
    expect(kpis.netMarginPercent).toBeCloseTo(10)
  })
  it('ohne Umsatz → null-Quoten', () => {
    const kpis = computeFinanceKpis({ revenueTotal: 0, expenseTotal: 100, expensesByCategory: {} })
    expect(kpis.laborCostRatio).toBeNull()
    expect(kpis.netMarginPercent).toBeNull()
  })
})
```

- [ ] **Step 2.2: Rot** — `npm test` → Modul fehlt.

- [ ] **Step 2.3: Implementieren** — `src/lib/benchmarks.ts` (komplett):

```ts
// TS-Port der Branchen-Benchmarks aus python/business_kpis.py (Quelle der Wahrheit
// für die Analyse bleibt Python; dieser Port treibt Cockpit-Ampeln + Alerts).
export interface Benchmark {
  target: number
  warning: number
  critical: number
}

export type TrafficLight = 'green' | 'yellow' | 'red'
export type MetricKey = 'laborCostRatio' | 'goodsCostRatio' | 'netMarginPercent'

export const METRIC_LABELS: Record<MetricKey, string> = {
  laborCostRatio: 'Personalkostenquote',
  goodsCostRatio: 'Wareneinsatzquote',
  netMarginPercent: 'Nettomarge',
}

// Nur die 3 Metriken, die sich ehrlich aus dem Finanztracking berechnen lassen.
// (utilization/energyPerUnit brauchen Belegungsdaten → nur in der Voll-Analyse.)
export const BUSINESS_BENCHMARKS: Record<string, Partial<Record<MetricKey, Benchmark>>> = {
  hotel:       { laborCostRatio: { target: 28, warning: 30, critical: 35 },                                                 netMarginPercent: { target: 10, warning: 5, critical: 0 } },
  restaurant:  { laborCostRatio: { target: 32, warning: 40, critical: 45 }, goodsCostRatio: { target: 30, warning: 35, critical: 38 }, netMarginPercent: { target: 8, warning: 4, critical: 1 } },
  cafe_bakery: { laborCostRatio: { target: 38, warning: 44, critical: 50 }, goodsCostRatio: { target: 30, warning: 35, critical: 40 }, netMarginPercent: { target: 10, warning: 5, critical: 2 } },
  retail:      { laborCostRatio: { target: 14, warning: 18, critical: 22 }, goodsCostRatio: { target: 60, warning: 68, critical: 75 }, netMarginPercent: { target: 5, warning: 2, critical: 0 } },
  medical:     { laborCostRatio: { target: 25, warning: 30, critical: 35 },                                                 netMarginPercent: { target: 20, warning: 12, critical: 5 } },
  craft:       { laborCostRatio: { target: 35, warning: 42, critical: 48 }, goodsCostRatio: { target: 30, warning: 38, critical: 45 }, netMarginPercent: { target: 10, warning: 5, critical: 2 } },
  fitness:     { laborCostRatio: { target: 30, warning: 38, critical: 45 },                                                 netMarginPercent: { target: 20, warning: 10, critical: 3 } },
  beauty:      { laborCostRatio: { target: 35, warning: 42, critical: 50 }, goodsCostRatio: { target: 12, warning: 18, critical: 22 }, netMarginPercent: { target: 15, warning: 8, critical: 2 } },
  consulting:  { laborCostRatio: { target: 45, warning: 55, critical: 65 },                                                 netMarginPercent: { target: 20, warning: 12, critical: 5 } },
  other:       { laborCostRatio: { target: 30, warning: 40, critical: 50 },                                                 netMarginPercent: { target: 8, warning: 3, critical: 0 } },
}

/**
 * Ampel: Richtung steckt in den Zahlen — target<warning = Kostenquote
 * (niedriger besser), target>warning = Marge (höher besser). Gleiches
 * Schema wie python/business_kpis.py.
 */
export function rateMetric(value: number, b: Benchmark): TrafficLight {
  const lowerIsBetter = b.target <= b.warning
  if (lowerIsBetter) {
    if (value <= b.target) return 'green'
    if (value <= b.warning) return 'yellow'
    return 'red'
  }
  if (value >= b.target) return 'green'
  if (value >= b.warning) return 'yellow'
  return 'red'
}

// Keyword-Listen aus python/business_kpis.py (Zeilen 73–79)
const LABOR_KEYWORDS = ['personal', 'lohn', 'löhne', 'gehalt', 'gehälter', 'mitarbeiter', 'labor', 'personalkosten']
const GOODS_KEYWORDS = ['waren', 'material', 'rohstoff', 'lebensmittel', 'zutaten', 'einkauf', 'wareneinsatz', 'food', 'getränke', 'beverage']
const ENERGY_KEYWORDS = ['energie', 'strom', 'gas', 'wasser', 'energy', 'heizung']

export type CategoryClass = 'labor' | 'goods' | 'energy' | 'other'

export function classifyCategory(category: string): CategoryClass {
  const c = category.toLowerCase()
  if (LABOR_KEYWORDS.some((k) => c.includes(k))) return 'labor'
  if (GOODS_KEYWORDS.some((k) => c.includes(k))) return 'goods'
  if (ENERGY_KEYWORDS.some((k) => c.includes(k))) return 'energy'
  return 'other'
}

export interface FinanceKpis {
  laborCostRatio: number | null
  goodsCostRatio: number | null
  netMarginPercent: number | null
  laborCost: number
  goodsCost: number
}

/** Quoten aus aggregierten Monats-Summen (Kategorie → Summe) */
export function computeFinanceKpis(input: {
  revenueTotal: number
  expenseTotal: number
  expensesByCategory: Record<string, number>
}): FinanceKpis {
  let laborCost = 0
  let goodsCost = 0
  for (const [cat, sum] of Object.entries(input.expensesByCategory)) {
    const cls = classifyCategory(cat)
    if (cls === 'labor') laborCost += sum
    else if (cls === 'goods') goodsCost += sum
  }
  const rev = input.revenueTotal
  return {
    laborCost: Math.round(laborCost * 100) / 100,
    goodsCost: Math.round(goodsCost * 100) / 100,
    laborCostRatio: rev > 0 ? Math.round((laborCost / rev) * 1000) / 10 : null,
    goodsCostRatio: rev > 0 ? Math.round((goodsCost / rev) * 1000) / 10 : null,
    netMarginPercent: rev > 0 ? Math.round(((rev - input.expenseTotal) / rev) * 1000) / 10 : null,
  }
}

/** Benchmarks für einen businessType (Fallback: other) */
export function benchmarksFor(businessType: string | null | undefined): Partial<Record<MetricKey, Benchmark>> {
  return BUSINESS_BENCHMARKS[businessType ?? 'other'] ?? BUSINESS_BENCHMARKS.other
}
```

- [ ] **Step 2.4: Grün + Commit**

```bash
npm test
git add src/lib/benchmarks.ts tests/benchmarks.test.ts
git commit -m "feat: Branchen-Benchmarks als TS-Port mit Ampel-Logik und KPI-Berechnung"
```

---

### Task 3: `csv.ts` (TDD)

**Files:** Create: `src/lib/csv.ts` · Test: `tests/csv.test.ts`

- [ ] **Step 3.1: Failing Test** — `tests/csv.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseCsv, parseGermanAmount, parseFlexibleDate, guessColumns, importHash } from '@/lib/csv'

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
```

- [ ] **Step 3.2: Rot** — `npm test`.

- [ ] **Step 3.3: Implementieren** — `src/lib/csv.ts` (komplett):

```ts
// Leichter CSV-Parser für Bank-Exporte (deutsch: Semikolon + Komma-Beträge).
// Bewusst ohne Dependency — Format ist simpel, Tests decken die Fälle ab.
import { createHash } from 'crypto'

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

/** Stabiler Duplikat-Hash: Datum + Betrag + normalisierte Beschreibung */
export function importHash(date: Date, amount: number, description: string): string {
  const key = `${date.toISOString().slice(0, 10)}|${amount.toFixed(2)}|${description.trim().toLowerCase()}`
  return createHash('sha256').update(key).digest('hex').slice(0, 32)
}
```

- [ ] **Step 3.4: Grün + Commit**

```bash
npm test
git add src/lib/csv.ts tests/csv.test.ts
git commit -m "feat: CSV-Parser für Bankexporte (deutsche Beträge/Daten, Auto-Guess, Duplikat-Hash)"
```

---

### Task 4: Areas — Defaults, API, `recurring.ts`-Helper (TDD)

**Files:** Create: `src/lib/areas.ts`, `src/lib/recurring.ts`, `src/app/api/areas/route.ts` · Tests: `tests/areas.test.ts`, `tests/recurring.test.ts`

- [ ] **Step 4.1: Failing Tests** — `tests/areas.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { areaDefaultsFor } from '@/lib/areas'

describe('areaDefaultsFor', () => {
  it('liefert branchenspezifische Defaults, Fallback other', () => {
    expect(areaDefaultsFor('hotel')).toContain('Logis')
    expect(areaDefaultsFor('restaurant')).toContain('Küche')
    expect(areaDefaultsFor('unbekannt')).toEqual(areaDefaultsFor('other'))
    for (const t of ['hotel','restaurant','cafe_bakery','retail','medical','craft','fitness','beauty','consulting','other']) {
      expect(areaDefaultsFor(t).length).toBeGreaterThanOrEqual(2)
    }
  })
})
```

`tests/recurring.test.ts`:

```ts
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
})
```

- [ ] **Step 4.2: Rot** — `npm test`.

- [ ] **Step 4.3: `src/lib/areas.ts`** (komplett):

```ts
// Bereichs-Defaults je Branche — beim ersten GET /api/areas geseedet.
const AREA_DEFAULTS: Record<string, string[]> = {
  hotel: ['Logis', 'F&B', 'Spa/Wellness', 'Veranstaltungen', 'Sonstiges'],
  restaurant: ['Küche', 'Service', 'Bar', 'Terrasse', 'Lieferung/To-Go'],
  cafe_bakery: ['Verkauf', 'Café', 'Produktion'],
  retail: ['Verkaufsfläche', 'Online', 'Lager'],
  medical: ['Behandlung', 'Empfang/Verwaltung', 'Labor'],
  craft: ['Baustelle', 'Werkstatt', 'Büro'],
  fitness: ['Training', 'Kurse', 'Theke/Shop'],
  beauty: ['Behandlung', 'Verkauf'],
  consulting: ['Beratung', 'Projekte', 'Verwaltung'],
  other: ['Betrieb', 'Verwaltung', 'Vertrieb'],
}

export function areaDefaultsFor(businessType: string | null | undefined): string[] {
  return AREA_DEFAULTS[businessType ?? 'other'] ?? AREA_DEFAULTS.other
}
```

- [ ] **Step 4.4: `src/lib/recurring.ts`** (komplett):

```ts
export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly'

/** Nächster Lauf, Monatsende-sicher (31.01.+1M → 28./29.02., nie Überlauf). */
export function advanceNextRun(from: Date, interval: RecurringInterval): Date {
  const months = interval === 'yearly' ? 12 : interval === 'quarterly' ? 3 : 1
  const y = from.getUTCFullYear()
  const m = from.getUTCMonth() + months
  const targetYear = y + Math.floor(m / 12)
  const targetMonth = ((m % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const day = Math.min(from.getUTCDate(), lastDay)
  return new Date(Date.UTC(targetYear, targetMonth, day))
}
```

- [ ] **Step 4.5: `src/app/api/areas/route.ts`** (komplett):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import { areaDefaultsFor } from '@/lib/areas'

async function orgFor(userId: string) {
  const m = await db.organizationMember.findFirst({
    where: { userId },
    include: { organization: { select: { id: true, businessType: true } } },
  })
  return m?.organization ?? null
}

// GET: Bereiche der Org; seedet Branchen-Defaults beim ersten Aufruf.
export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const org = await orgFor(user.userId)
  if (!org) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  let areas = await db.area.findMany({ where: { organizationId: org.id }, orderBy: { sortOrder: 'asc' } })
  if (areas.length === 0) {
    const defaults = areaDefaultsFor(org.businessType)
    await db.area.createMany({
      data: defaults.map((name, i) => ({ organizationId: org.id, name, sortOrder: i })),
      skipDuplicates: true,
    })
    areas = await db.area.findMany({ where: { organizationId: org.id }, orderBy: { sortOrder: 'asc' } })
  }
  return NextResponse.json({ success: true, data: areas })
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const org = await orgFor(user.userId)
  if (!org) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 40) return NextResponse.json({ error: 'Ungültiger Name.' }, { status: 400 })
  const count = await db.area.count({ where: { organizationId: org.id } })
  if (count >= 20) return NextResponse.json({ error: 'Maximal 20 Bereiche.' }, { status: 400 })
  try {
    const area = await db.area.create({ data: { organizationId: org.id, name, sortOrder: count } })
    return NextResponse.json({ success: true, data: area })
  } catch {
    return NextResponse.json({ error: 'Bereich existiert bereits.' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const org = await orgFor(user.userId)
  if (!org) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })
  await db.area.deleteMany({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4.6: Grün + tsc + Commit**

```bash
npm test && npx tsc --noEmit
git add src/lib/areas.ts src/lib/recurring.ts src/app/api/areas/route.ts tests/areas.test.ts tests/recurring.test.ts
git commit -m "feat: Bereiche mit Branchen-Defaults (Lazy-Seed) + Monatsende-sicherer Recurring-Helper"
```

---

### Task 5: Expense/Revenue-APIs erweitern

**Files:** Modify: `src/app/api/expenses/route.ts`, `src/app/api/revenues/route.ts`

- [ ] **Step 5.1:** In beiden Dateien: GET-`findMany` um `include: { area: { select: { id: true, name: true } } }` erweitern. POST-`create`-`data` und PUT-`update`-`data` um folgende Felder erweitern (Werte aus Body, defensiv):

```ts
        areaId: typeof body.areaId === 'string' && body.areaId ? body.areaId : null,
        vatRate: [0, 7, 19].includes(Number(body.vatRate)) ? Number(body.vatRate) : null,
        receiptPath: typeof body.receiptPath === 'string' && body.receiptPath ? body.receiptPath : undefined,
        receiptName: typeof body.receiptName === 'string' && body.receiptName ? body.receiptName : undefined,
```

(`receiptPath/Name` bei PUT nur setzen wenn übergeben — `undefined` lässt bestehenden Wert stehen. `areaId` serverseitig gegen Org validieren: vor dem Write `if (areaId) { const a = await db.area.findFirst({ where: { id: areaId, organizationId } }); if (!a) areaId = null }`.)

- [ ] **Step 5.2: Verify + Commit**

```bash
npx tsc --noEmit
git add src/app/api/expenses/route.ts src/app/api/revenues/route.ts
git commit -m "feat: Finanz-APIs kennen Bereich, MwSt und Beleg"
```

---

### Task 6: Beleg-API

**Files:** Create: `src/app/api/finance/receipt/route.ts`

- [ ] **Step 6.1:** (komplett; Muster aus `api/upload/route.ts` — Blob mit lokalem Fallback):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import { presignBlobGetUrl } from '@/lib/blob'

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf'])
const MAX_BYTES = 10 * 1024 * 1024

async function orgIdFor(userId: string): Promise<string | null> {
  const m = await db.organizationMember.findFirst({ where: { userId } })
  return m?.organizationId ?? null
}

// POST: Beleg hochladen → { path, name } für receiptPath/receiptName am Eintrag.
export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const orgId = await orgIdFor(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Keine Datei.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Beleg größer als 10 MB.' }, { status: 400 })
  const ext = ('.' + (file.name.split('.').pop() ?? '')).toLowerCase()
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: 'Nur JPG, PNG, WebP oder PDF.' }, { status: 400 })

  const pathname = `receipts/${orgId}/${randomUUID()}${ext}`
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    await put(pathname, file, { access: 'public', addRandomSuffix: false })
  } else {
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const dir = path.join(process.env.UPLOAD_DIR ?? './uploads', 'receipts', orgId)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, pathname.split('/').pop()!), Buffer.from(await file.arrayBuffer()))
  }
  return NextResponse.json({ success: true, data: { path: pathname, name: file.name } })
}

// GET ?kind=expense|revenue&id=… : Org-geprüfter Redirect auf den Beleg.
export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  const orgId = await orgIdFor(user.userId)
  if (!orgId) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  const id = url.searchParams.get('id') ?? ''
  const entry =
    kind === 'expense'
      ? await db.expense.findFirst({ where: { id, organizationId: orgId }, select: { receiptPath: true } })
      : kind === 'revenue'
        ? await db.revenue.findFirst({ where: { id, organizationId: orgId }, select: { receiptPath: true } })
        : null
  if (!entry?.receiptPath) return NextResponse.json({ error: 'Kein Beleg vorhanden.' }, { status: 404 })

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const signed = await presignBlobGetUrl(entry.receiptPath, 5 * 60 * 1000)
    return NextResponse.redirect(signed)
  }
  const path = await import('path')
  const { readFile } = await import('fs/promises')
  const filePath = path.join(process.env.UPLOAD_DIR ?? './uploads', entry.receiptPath)
  const buf = await readFile(filePath).catch(() => null)
  if (!buf) return NextResponse.json({ error: 'Beleg nicht gefunden.' }, { status: 404 })
  const mime = entry.receiptPath.endsWith('.pdf') ? 'application/pdf' : 'image/*'
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': mime } })
}
```

**Achtung:** Signatur von `presignBlobGetUrl` vor Nutzung in `src/lib/blob.ts:20` prüfen (Rückgabetyp/Param-Reihenfolge) und Aufruf anpassen, falls abweichend.

- [ ] **Step 6.2: tsc + Commit**

```bash
npx tsc --noEmit
git add src/app/api/finance/receipt/route.ts
git commit -m "feat: Beleg-Upload und org-geprüfter Beleg-Abruf (Blob + lokaler Fallback)"
```

---

### Task 7: Formulare costs/revenues erweitern

**Files:** Modify: `src/app/dashboard/costs/page.tsx`, `src/app/dashboard/revenues/page.tsx` · Create: `src/components/finance/ReceiptField.tsx`

- [ ] **Step 7.1: `ReceiptField.tsx`** (komplett):

```tsx
'use client'

import { useRef, useState } from 'react'

interface Props {
  value: { path: string; name: string } | null
  onChange: (v: { path: string; name: string } | null) => void
}

export default function ReceiptField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/finance/receipt', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen')
      onChange(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Beleg (optional)</label>
      {value ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate max-w-[200px] text-gray-700">📎 {value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline">
            Entfernen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-gray-400 w-full text-left disabled:opacity-60"
        >
          {uploading ? 'Lädt hoch…' : 'Foto oder PDF anhängen'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 7.2: costs/page.tsx erweitern** (revenues analog):
  - State: `areas` (fetch `/api/areas` on mount), Formular-Felder `areaId`, `vatRate`, `receipt` (ReceiptField-Value), `recurrenceInterval`.
  - Formular-Modal: Select „Bereich" (Optionen aus `areas`, leer = ohne), Select „MwSt" (–/0 %/7 %/19 %), `<ReceiptField/>`; wenn `isRecurring`-Checkbox an → Select „Intervall" (monatlich/quartalsweise/jährlich, Default monatlich). POST/PUT-Body um `areaId, vatRate, receiptPath: receipt?.path, receiptName: receipt?.name, recurrenceInterval` ergänzen.
  - Liste: Bereichs-Badge (`entry.area?.name`), 📎-Link auf `/api/finance/receipt?kind=expense&id=<id>` (target _blank) wenn `receiptPath`.
  - Hinweis-Zeile unter isRecurring: „Automatisch neu anlegen? → Wiederkehrende Posten" (Link `/dashboard/recurring`).
  - Exakte Einfügepunkte beim Ausführen aus der Datei lesen (Formular-Modal + Listen-Row); Felder-Markup im Stil der bestehenden Inputs.

- [ ] **Step 7.3: Verify**

`npx tsc --noEmit`; Browser-Smoke folgt Task 14.

- [ ] **Step 7.4: Commit**

```bash
git add src/app/dashboard/costs/page.tsx src/app/dashboard/revenues/page.tsx src/components/finance/ReceiptField.tsx
git commit -m "feat: Formulare mit Bereich, MwSt, Beleg und Wiederholungs-Intervall"
```

---

### Task 8: CSV-Import (Dialog + API)

**Files:** Create: `src/components/finance/CsvImportDialog.tsx`, `src/app/api/finance/import/route.ts` · Modify: beide Finanz-Seiten (Import-Button)

- [ ] **Step 8.1: Import-API** — `src/app/api/finance/import/route.ts` (komplett):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
import { importHash } from '@/lib/csv'

interface ImportRow {
  date: string        // ISO
  amount: number      // absolut, > 0
  description: string
  vendor?: string
}

const MAX_ROWS = 2000

// POST { kind: 'expense'|'revenue', rows: ImportRow[], defaults: { category, areaId?, vatRate? } }
export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
  const m = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  if (!m) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })
  const orgId = m.organizationId

  const body = await req.json().catch(() => null)
  const kind = body?.kind === 'revenue' ? 'revenue' : body?.kind === 'expense' ? 'expense' : null
  const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : []
  const category = typeof body?.defaults?.category === 'string' && body.defaults.category ? body.defaults.category : 'Sonstiges'
  const areaId = typeof body?.defaults?.areaId === 'string' && body.defaults.areaId ? body.defaults.areaId : null
  const vatRate = [0, 7, 19].includes(Number(body?.defaults?.vatRate)) ? Number(body.defaults.vatRate) : null
  if (!kind || rows.length === 0) return NextResponse.json({ error: 'Keine Zeilen übermittelt.' }, { status: 400 })
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Maximal ${MAX_ROWS} Zeilen pro Import.` }, { status: 400 })
  if (areaId) {
    const a = await db.area.findFirst({ where: { id: areaId, organizationId: orgId } })
    if (!a) return NextResponse.json({ error: 'Unbekannter Bereich.' }, { status: 400 })
  }

  const prepared = rows
    .map((r) => {
      const date = new Date(r.date)
      const amount = Math.abs(Number(r.amount))
      const description = String(r.description ?? '').slice(0, 300).trim()
      if (Number.isNaN(date.getTime()) || !Number.isFinite(amount) || amount <= 0 || !description) return null
      return { date, amount, description, vendor: r.vendor ? String(r.vendor).slice(0, 200) : null, hash: importHash(date, amount, description) }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  const hashes = prepared.map((r) => r.hash)
  const table = kind === 'expense' ? db.expense : db.revenue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing: { importHash: string | null }[] = await (table as any).findMany({
    where: { organizationId: orgId, importHash: { in: hashes } },
    select: { importHash: true },
  })
  const known = new Set(existing.map((e) => e.importHash))
  const fresh = prepared.filter((r) => !known.has(r.hash))
  // Duplikate innerhalb der Datei ebenfalls einmalig
  const seen = new Set<string>()
  const unique = fresh.filter((r) => (seen.has(r.hash) ? false : (seen.add(r.hash), true)))

  if (unique.length > 0) {
    const common = (r: (typeof unique)[number]) => ({
      organizationId: orgId,
      createdById: user.userId,
      date: r.date,
      category,
      areaId,
      vatRate,
      description: r.description,
      amount: r.amount,
      importHash: r.hash,
    })
    if (kind === 'expense') {
      await db.expense.createMany({ data: unique.map((r) => ({ ...common(r), vendor: r.vendor })) })
    } else {
      await db.revenue.createMany({ data: unique.map((r) => ({ ...common(r), customerOrSource: r.vendor })) })
    }
  }

  return NextResponse.json({
    success: true,
    data: { imported: unique.length, skippedDuplicates: prepared.length - unique.length, invalid: rows.length - prepared.length },
  })
}
```

- [ ] **Step 8.2: `CsvImportDialog.tsx`** (komplett) — Client-Dialog: Datei einlesen (`file.text()`), `parseCsv` + `guessColumns` aus `@/lib/csv`, 4 Spalten-Selects (Datum*, Betrag*, Beschreibung*, Gegenpartei), Radio „Alle Zeilen / nur negative Beträge (Abbuchungen) / nur positive (Eingänge)", Defaults: Kategorie-Select (Props `categories`), Bereich-Select (fetch `/api/areas`), MwSt-Select; Vorschau erste 5 gültige Zeilen (Datum/Betrag/Beschreibung); Button „X Zeilen importieren" → POST `/api/finance/import` → Ergebnis-Toast `importiert/übersprungen (Duplikate)/ungültig` → `onDone()`:

```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { parseCsv, parseGermanAmount, parseFlexibleDate, guessColumns, type ParsedCsv } from '@/lib/csv'

interface Area { id: string; name: string }
interface Props {
  kind: 'expense' | 'revenue'
  categories: string[]
  open: boolean
  onClose: () => void
  onDone: () => void
}

type SignFilter = 'all' | 'negative' | 'positive'

export default function CsvImportDialog({ kind, categories, open, onClose, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csv, setCsv] = useState<ParsedCsv | null>(null)
  const [cols, setCols] = useState({ date: -1, amount: -1, description: -1, vendor: -1 })
  const [sign, setSign] = useState<SignFilter>(kind === 'expense' ? 'negative' : 'positive')
  const [category, setCategory] = useState(categories[0] ?? 'Sonstiges')
  const [areas, setAreas] = useState<Area[]>([])
  const [areaId, setAreaId] = useState('')
  const [vatRate, setVatRate] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/areas').then((r) => r.json()).then((d) => d?.success && setAreas(d.data)).catch(() => {})
  }, [open])

  async function handleFile(file: File) {
    const parsed = parseCsv(await file.text())
    setCsv(parsed)
    const g = guessColumns(parsed.headers)
    setCols({ date: g.date ?? -1, amount: g.amount ?? -1, description: g.description ?? -1, vendor: g.vendor ?? -1 })
  }

  const rows = useMemo(() => {
    if (!csv || cols.date < 0 || cols.amount < 0 || cols.description < 0) return []
    return csv.rows
      .map((r) => {
        const date = parseFlexibleDate(r[cols.date] ?? '')
        const amount = parseGermanAmount(r[cols.amount] ?? '')
        const description = (r[cols.description] ?? '').trim()
        if (!date || amount === null || amount === 0 || !description) return null
        if (sign === 'negative' && amount >= 0) return null
        if (sign === 'positive' && amount <= 0) return null
        return {
          date: date.toISOString(),
          amount: Math.abs(amount),
          description,
          vendor: cols.vendor >= 0 ? (r[cols.vendor] ?? '').trim() || undefined : undefined,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [csv, cols, sign])

  async function handleImport() {
    setBusy(true)
    try {
      const res = await fetch('/api/finance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          rows,
          defaults: { category, areaId: areaId || undefined, vatRate: vatRate ? Number(vatRate) : undefined },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import fehlgeschlagen')
      toast.success(`${data.data.imported} importiert · ${data.data.skippedDuplicates} Duplikate übersprungen · ${data.data.invalid} ungültig`)
      onDone()
      onClose()
      setCsv(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  const colSelect = (label: string, key: keyof typeof cols, required: boolean) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}{required ? ' *' : ''}</label>
      <select
        value={cols[key]}
        onChange={(e) => setCols((c) => ({ ...c, [key]: Number(e.target.value) }))}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
      >
        <option value={-1}>–</option>
        {csv?.headers.map((h, i) => (
          <option key={i} value={i}>{h}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">CSV importieren ({kind === 'expense' ? 'Ausgaben' : 'Einnahmen'})</h2>
        <p className="text-xs text-gray-500 mb-4">Bankexport hochladen — Duplikate werden automatisch übersprungen.</p>

        {!csv ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 text-sm text-gray-500 hover:border-gray-400"
          >
            CSV-Datei wählen
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {colSelect('Datum', 'date', true)}
              {colSelect('Betrag', 'amount', true)}
              {colSelect('Beschreibung', 'description', true)}
              {colSelect('Gegenpartei', 'vendor', false)}
            </div>
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
              {(['all', 'negative', 'positive'] as SignFilter[]).map((s) => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sign === s} onChange={() => setSign(s)} />
                  {s === 'all' ? 'Alle Zeilen' : s === 'negative' ? 'Nur negative (Abbuchungen)' : 'Nur positive (Eingänge)'}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bereich</label>
                <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">–</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">MwSt</label>
                <select value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">–</option>
                  <option value="0">0 %</option>
                  <option value="7">7 %</option>
                  <option value="19">19 %</option>
                </select>
              </div>
            </div>
            <div className="border border-gray-100 rounded-lg mb-4 overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-1.5 text-gray-500">{new Date(r.date).toLocaleDateString('de-DE')}</td>
                      <td className="px-3 py-1.5 font-medium">{r.amount.toLocaleString('de-DE')} €</td>
                      <td className="px-3 py-1.5 text-gray-600 truncate max-w-[240px]">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{rows.length} gültige Zeilen</p>
              <div className="flex gap-2">
                <button onClick={() => setCsv(null)} className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Andere Datei</button>
                <button
                  onClick={handleImport}
                  disabled={busy || rows.length === 0}
                  className="text-xs px-4 py-2 rounded-lg bg-[#0D1630] text-white disabled:opacity-50"
                >
                  {busy ? 'Importiert…' : `${rows.length} Zeilen importieren`}
                </button>
              </div>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  )
}
```

**Hinweis:** `@/lib/csv` importiert `crypto` (Node) — `importHash` wird im Dialog NICHT genutzt, aber der Import zieht das Modul. Deshalb `importHash` in eine eigene Datei `src/lib/import-hash.ts` auslagern und `csv.ts` browser-sicher halten (kein `crypto`-Import). Test-Import entsprechend anpassen. (Beim Ausführen umsetzen.)

- [ ] **Step 8.3: Import-Buttons** — auf beiden Seiten neben „+ Neu"-Button: `CSV importieren` → öffnet Dialog (`kind`, `categories=CATEGORIES`, `onDone={reload}`).

- [ ] **Step 8.4: Verify + Commit**

```bash
npm test && npx tsc --noEmit
git add src/lib/csv.ts src/lib/import-hash.ts src/components/finance/CsvImportDialog.tsx src/app/api/finance/import/route.ts src/app/dashboard/costs/page.tsx src/app/dashboard/revenues/page.tsx tests/csv.test.ts
git commit -m "feat: CSV-Bankimport mit Spalten-Mapping, Vorzeichen-Filter und Duplikat-Schutz"
```

---

### Task 9: Wiederkehrende Posten (API + Seite)

**Files:** Create: `src/app/api/recurring/route.ts`, `src/app/dashboard/recurring/page.tsx`, `src/app/dashboard/recurring/layout.tsx` · Modify: `DashboardLayout.tsx`

- [ ] **Step 9.1: API** — CRUD analog expenses-Route: GET (Liste, include area), POST (kind INCOME|EXPENSE, amount>0, category, areaId?, vatRate?, vendor?, description, interval monthly|quarterly|yearly, `nextRun` = Body-Datum oder heute; Validierung wie import-Route), PUT (Felder + active), DELETE ?id. Alle mit Auth + `cockpitBlocked()`.

- [ ] **Step 9.2: Seite** — Client-Page im Stil von costs/page.tsx: Tabs Ausgaben/Einnahmen, Liste (Beschreibung, Betrag, Intervall-Badge, Bereich, nächster Lauf, aktiv-Toggle, löschen), Modal-Formular (Felder wie POST). Kategorie-Optionen: EXPENSE = CATEGORIES aus costs, INCOME = aus revenues (Arrays in die Seite kopieren oder nach `src/lib/finance-categories.ts` extrahieren und in allen 3 Seiten importieren — extrahieren bevorzugt, DRY).

- [ ] **Step 9.3: Gate + Nav** — `recurring/layout.tsx` = Kopie von `costs/layout.tsx`. In `DashboardLayout.tsx` unter „Meine Zahlen" nach Finanzübersicht: `<NavLink href="/dashboard/recurring" label="Wiederkehrend" …/>` (Icon im Stil der Nachbarn).

- [ ] **Step 9.4: Verify + Commit**

```bash
npx tsc --noEmit
git add src/lib/finance-categories.ts src/app/api/recurring/route.ts src/app/dashboard/recurring src/components/dashboard/DashboardLayout.tsx src/app/dashboard/costs/page.tsx src/app/dashboard/revenues/page.tsx
git commit -m "feat: Wiederkehrende Posten — Verwaltung mit Intervall und nächstem Lauf"
```

---

### Task 10: Täglicher Cron (Recurring + Monatsreset + Alerts)

**Files:** Create: `src/app/api/cron/daily/route.ts` · Modify: `vercel.json`, `src/lib/email.ts`, `.env.example`

- [ ] **Step 10.1: `sendKpiAlertEmail`** — in `email.ts` nach `sendPaymentFailedEmail`:

```ts
export async function sendKpiAlertEmail(to: string, orgName: string, message: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `KPI-Hinweis für ${orgName}`,
    html: baseHtml(`
      <h1>KPI-Hinweis</h1>
      <p>${message}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Zum Cockpit</a>
      <div class="disclaimer">Automatischer Hinweis auf Basis Ihrer Finanzdaten – Entscheidungshilfe, keine rechtsverbindliche Prüfung.</div>
    `),
  })
}
```

- [ ] **Step 10.2: Cron-Route** — `src/app/api/cron/daily/route.ts` (komplett):

```ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { advanceNextRun, type RecurringInterval } from '@/lib/recurring'
import { benchmarksFor, computeFinanceKpis, METRIC_LABELS, rateMetric, type MetricKey } from '@/lib/benchmarks'
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'
import { sendKpiAlertEmail } from '@/lib/email'

// Vercel Cron ruft täglich 04:00 UTC mit `Authorization: Bearer <CRON_SECRET>`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }
  const now = new Date()
  const result = { recurringCreated: 0, monthlyReset: false, alertsFired: 0 }

  // ── 1) Wiederkehrende Posten erzeugen (holt verpasste Läufe nach, Kappe 24) ──
  const due = await db.recurringEntry.findMany({ where: { active: true, nextRun: { lte: now } } })
  for (const entry of due) {
    let nextRun = entry.nextRun
    let guard = 0
    while (nextRun <= now && guard < 24) {
      const runDate = nextRun
      const data = {
        organizationId: entry.organizationId,
        createdById: 'system-cron',
        date: runDate,
        category: entry.category,
        areaId: entry.areaId,
        vatRate: entry.vatRate,
        description: entry.description,
        amount: entry.amount,
        isRecurring: true,
        recurrenceInterval: entry.interval,
        recurringEntryId: entry.id,
      }
      if (entry.kind === 'EXPENSE') {
        await db.expense.create({ data: { ...data, vendor: entry.vendor } })
      } else {
        await db.revenue.create({ data: { ...data, customerOrSource: entry.vendor } })
      }
      result.recurringCreated++
      nextRun = advanceNextRun(nextRun, entry.interval as RecurringInterval)
      guard++
    }
    await db.recurringEntry.update({ where: { id: entry.id }, data: { nextRun } })
  }

  // ── 2) Monatsreset am 1. (Assistent- und Analyse-Zähler) ────────────────────
  if (now.getUTCDate() === 1) {
    await db.subscription.updateMany({ data: { usedAnalysesThisMonth: 0, assistantMsgsThisMonth: 0 } })
    result.monthlyReset = true
  }

  // ── 3) KPI-Alerts (ab dem 7. des Monats, Throttle 7 Tage je Regel) ──────────
  if (now.getUTCDate() >= 7) {
    result.alertsFired = await runKpiAlerts(now)
  }

  return NextResponse.json({ success: true, data: result })
}

async function runKpiAlerts(now: Date): Promise<number> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const throttleBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  let fired = 0

  const orgs = await db.organization.findMany({
    select: { id: true, name: true, businessType: true, subscription: true, settings: true },
  })
  for (const org of orgs) {
    // Alerts sind Business+ — greift erst mit Launch-Flag, davor für alle (Produkt jung).
    if (subscriptionsLive() && !getEntitlements(org.subscription).alerts) continue

    const [expenses, revenues] = await Promise.all([
      db.expense.groupBy({ by: ['category'], where: { organizationId: org.id, date: { gte: monthStart } }, _sum: { amount: true } }),
      db.revenue.aggregate({ where: { organizationId: org.id, date: { gte: monthStart } }, _sum: { amount: true } }),
    ])
    const revenueTotal = revenues._sum.amount ?? 0
    if (revenueTotal <= 0) continue
    const expensesByCategory = Object.fromEntries(expenses.map((e) => [e.category, e._sum.amount ?? 0]))
    const expenseTotal = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)
    const kpis = computeFinanceKpis({ revenueTotal, expenseTotal, expensesByCategory })
    const benchmarks = benchmarksFor(org.businessType)

    // Default-Regeln lazy anlegen (Schwelle = warning-Wert der Branche)
    const metrics = Object.keys(benchmarks) as MetricKey[]
    for (const metric of metrics) {
      const b = benchmarks[metric]!
      await db.alertRule.upsert({
        where: { organizationId_metric: { organizationId: org.id, metric } },
        create: {
          organizationId: org.id,
          metric,
          threshold: b.warning,
          direction: b.target <= b.warning ? 'ABOVE' : 'BELOW',
        },
        update: {},
      })
    }

    const rules = await db.alertRule.findMany({ where: { organizationId: org.id, active: true } })
    for (const rule of rules) {
      const value = kpis[rule.metric as MetricKey]
      if (value === null || value === undefined) continue
      const breached = rule.direction === 'ABOVE' ? value > rule.threshold : value < rule.threshold
      if (!breached) continue
      if (rule.lastFiredAt && rule.lastFiredAt > throttleBefore) continue

      const label = METRIC_LABELS[rule.metric as MetricKey] ?? rule.metric
      const message = `${label} liegt aktuell bei ${value.toLocaleString('de-DE')} % (Richtwert Ihrer Branche: ${rule.threshold.toLocaleString('de-DE')} %).`
      await db.$transaction([
        db.alertEvent.create({ data: { organizationId: org.id, metric: rule.metric, value, threshold: rule.threshold, message } }),
        db.alertRule.update({ where: { id: rule.id }, data: { lastFiredAt: now } }),
      ])
      fired++

      if (org.settings?.emailNotifications !== false) {
        const owner = await db.organizationMember.findFirst({
          where: { organizationId: org.id, role: 'OWNER' },
          include: { user: { select: { email: true } } },
        })
        if (owner?.user.email) {
          await sendKpiAlertEmail(owner.user.email, org.name, message).catch((err) =>
            console.error('[cron] Alert-Mail fehlgeschlagen:', err),
          )
        }
      }
    }
  }
  return fired
}
```

**Achtung `createdById: 'system-cron'`:** Prisma-Relation? `Expense.createdById` prüfen — laut Schema hat Expense KEINE User-Relation auf createdById (nur organizationId-Relation), String reicht. Beim Ausführen im Schema verifizieren; falls doch FK → stattdessen Owner-userId der Org verwenden.

- [ ] **Step 10.3: vercel.json erweitern**

```json
{
  "functions": {
    "api/py/analyze.py": { "includeFiles": "python/**", "maxDuration": 60 }
  },
  "crons": [
    { "path": "/api/cron/daily", "schedule": "0 4 * * *" }
  ]
}
```

- [ ] **Step 10.4: `.env.example`** — im App-Block ergänzen:

```bash
# Täglicher Cron (Vercel sendet den Wert als Bearer-Token an /api/cron/daily)
# Generieren: openssl rand -hex 32
CRON_SECRET=""
```

- [ ] **Step 10.5: Verify + Commit**

```bash
npx tsc --noEmit && npm test
git add src/app/api/cron/daily/route.ts vercel.json src/lib/email.ts .env.example
git commit -m "feat: Täglicher Cron — Recurring-Generator, Monatsreset, KPI-Alerts mit Mail"
```

---

### Task 11: Cockpit-Startseite (Redesign)

**Files:** Modify: `src/app/dashboard/page.tsx` · Create: `src/components/dashboard/TrendSparkline.tsx`, `src/components/dashboard/KpiLight.tsx`

- [ ] **Step 11.1: `KpiLight.tsx`** (komplett):

```tsx
import type { Benchmark, TrafficLight } from '@/lib/benchmarks'
import { rateMetric } from '@/lib/benchmarks'

const COLORS: Record<TrafficLight, { dot: string; bg: string; text: string }> = {
  green: { dot: 'bg-green-500', bg: 'bg-green-50 border-green-100', text: 'text-green-700' },
  yellow: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
  red: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-100', text: 'text-red-700' },
}

interface Props {
  label: string
  value: number | null
  unit?: string
  benchmark: Benchmark
}

export default function KpiLight({ label, value, unit = '%', benchmark }: Props) {
  if (value === null) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-gray-400">Noch keine Daten</p>
      </div>
    )
  }
  const light = rateMetric(value, benchmark)
  const c = COLORS[light]
  const lowerIsBetter = benchmark.target <= benchmark.warning
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${c.text}`}>
        {value.toLocaleString('de-DE')} {unit}
      </p>
      <p className="text-[11px] text-gray-400 mt-0.5">
        Branchen-Richtwert: {lowerIsBetter ? '≤' : '≥'} {benchmark.target.toLocaleString('de-DE')} {unit}
      </p>
    </div>
  )
}
```

- [ ] **Step 11.2: `TrendSparkline.tsx`** (komplett) — nutzt endlich den verwaisten `/api/monthly-summary`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

interface MonthRow {
  key: string
  label: string
  revenue: number
  expenses: number
  profit: number
}

export default function TrendSparkline() {
  const [months, setMonths] = useState<MonthRow[] | null>(null)

  useEffect(() => {
    fetch('/api/monthly-summary')
      .then((r) => r.json())
      .then((d) => setMonths(d?.months ?? []))
      .catch(() => setMonths([]))
  }, [])

  if (months === null) return <div className="h-36 rounded-xl bg-gray-50 animate-pulse" />
  if (months.length === 0) return null

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={months} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E1A33" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0E1A33" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} />
          <Tooltip
            formatter={(v: number, name: string) => [`${v.toLocaleString('de-DE')} €`, name === 'revenue' ? 'Einnahmen' : name === 'expenses' ? 'Ausgaben' : 'Ergebnis']}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#0E1A33" strokeWidth={2} fill="url(#revGrad)" />
          <Area type="monotone" dataKey="expenses" stroke="#C9A84C" strokeWidth={1.5} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 11.3: `dashboard/page.tsx` neu aufbauen** — Server-Component behält Grundgerüst (DashboardLayout, Header, „Neue Analyse"-CTA, Letzte Analysen), ersetzt aber Datenladung + Karten:
  - **Bug-Fix:** MTD-Aggregation statt `take:5` — `db.expense.groupBy({ by: ['category'], where: { organizationId, date: { gte: monthStart } }, _sum: { amount: true } })` + `db.revenue.aggregate(_sum)` + Vormonat-Totals (für Trend-Pfeile) + `db.monthlyTarget.findUnique` (aktueller Monat) + `db.alertEvent.findMany take 5 desc` + Subscription.
  - StatCards: Einnahmen MTD, Ausgaben MTD, Ergebnis MTD (je mit ±%-Vergleich zum Vormonat), Analyse-Guthaben.
  - **Ampel-Sektion „Ihre Kennzahlen vs. Branche"**: `computeFinanceKpis` + `benchmarksFor(org.businessType)` → bis zu 3 `<KpiLight/>` (nur Metriken mit Benchmark).
  - **12-Monats-Trend**: `<TrendSparkline/>`.
  - **Zielfortschritt**: wenn MonthlyTarget existiert → 2 Fortschrittsbalken (Einnahmen vs. revenueTarget, Ausgaben vs. expenseTarget), sonst Link „Ziele setzen".
  - **Hinweis-Feed**: letzte 5 `AlertEvent.message` mit Datum; leer → „Keine Auffälligkeiten – gut so."
  - **Team-Teaser**: Karte „Schichtplan & Live-Status — in Kürze" (Phase 3).
  - Hardcodierte „KI-Hinweise" + „Empfohlene nächste Schritte"-Arrays ersatzlos entfernen.
  - Gating: wenn `subscriptionsLive()` und kein `ent.cockpit` → statt Finanz-Sektionen eine Teaser-Karte („Cockpit ist Teil des Abos") mit CTA `/dashboard/subscription?upgrade=1`; StatCard Guthaben + Letzte Analysen bleiben sichtbar.

- [ ] **Step 11.4: Verify + Commit**

```bash
npx tsc --noEmit
git add src/app/dashboard/page.tsx src/components/dashboard/TrendSparkline.tsx src/components/dashboard/KpiLight.tsx
git commit -m "feat: Cockpit-Startseite — volle Monatsdaten, Benchmark-Ampeln, Trend, Ziele, Hinweis-Feed"
```

---

### Task 12: Steuerberater-Export + Bereichs-Vergleich

**Files:** Create: `src/app/api/finance/export/route.ts`, `src/lib/tax-export.ts` · Modify: `src/app/dashboard/finance/page.tsx` · Test: `tests/tax-export.test.ts`

- [ ] **Step 12.1: Failing Test** — `tests/tax-export.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildTaxExportCsv } from '@/lib/tax-export'

describe('buildTaxExportCsv', () => {
  it('baut deutsches Semikolon-CSV mit BOM, Netto-Berechnung aus Brutto+MwSt', () => {
    const csv = buildTaxExportCsv([
      { date: new Date(Date.UTC(2026, 6, 1)), kind: 'Ausgabe', category: 'Einkauf', area: 'Küche', description: 'Metro', counterparty: 'Metro AG', gross: 119, vatRate: 19, status: 'Überweisung', hasReceipt: true },
      { date: new Date(Date.UTC(2026, 6, 2)), kind: 'Einnahme', category: 'Dienstleistung', area: null, description: 'Rechnung 42', counterparty: null, gross: 100, vatRate: null, status: 'paid', hasReceipt: false },
    ])
    expect(csv.startsWith('﻿')).toBe(true)
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('﻿Datum;Typ;Kategorie;Bereich;Beschreibung;Gegenpartei;Brutto;MwSt-Satz;Netto;Zahlung/Status;Beleg')
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
```

- [ ] **Step 12.2: `src/lib/tax-export.ts`** (komplett):

```ts
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

export function buildTaxExportCsv(rows: TaxExportRow[]): string {
  const header = 'Datum;Typ;Kategorie;Bereich;Beschreibung;Gegenpartei;Brutto;MwSt-Satz;Netto;Zahlung/Status;Beleg'
  const lines = rows.map((r) => {
    const net = r.vatRate ? r.gross / (1 + r.vatRate / 100) : r.gross
    return [
      r.date.toLocaleDateString('de-DE', { timeZone: 'UTC' }),
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
```

- [ ] **Step 12.3: Export-API** — `src/app/api/finance/export/route.ts`: GET `?year=2026` (Default aktuelles Jahr): Auth + `cockpitBlocked()` + **Business+-Gate**: `if (subscriptionsLive()) { ctx = await getOrgContext(); if (!ctx.entitlements.datevExport) return 403 upgradeRequired }`. Lädt Expenses+Revenues des Jahres (include area), mappt auf `TaxExportRow` (Expense: counterparty=vendor, status=paymentMethod · Revenue: counterparty=customerOrSource, status=paymentStatus), Response `new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="profitora-export-<year>.csv"' } })`.

- [ ] **Step 12.4: finance/page.tsx** — oben rechts Button „Steuerberater-Export (CSV)" → `window.open('/api/finance/export?year=' + selectedYear)`; bei 403-Antwort Toast „Ab Business-Abo". Zusätzlich neues BarChart „Nach Bereich" (Ausgaben+Einnahmen je `area.name` aggregiert aus den bereits geladenen Einträgen; Einträge ohne Bereich = „Ohne Bereich").

- [ ] **Step 12.5: Verify + Commit**

```bash
npm test && npx tsc --noEmit
git add src/lib/tax-export.ts src/app/api/finance/export/route.ts src/app/dashboard/finance/page.tsx tests/tax-export.test.ts
git commit -m "feat: Steuerberater-CSV-Export (Business+) und Bereichs-Vergleich in der Finanzübersicht"
```

---

### Task 13: Register `?abo=`-Durchreichung

**Files:** Modify: `src/app/(auth)/register/page.tsx`, `src/components/auth/GoogleLoginButton.tsx`, `src/app/api/auth/google/route.ts`, `src/app/api/auth/google/callback/route.ts`

- [ ] **Step 13.1: register/page.tsx** — neben `?plan=` auch `?abo=` + `?interval=` lesen (`abo` = starter|business|premium via `getSubscriptionPlan`). Wenn `abo`: Consent-Checkbox anzeigen (wie pack), nach erfolgreichem Register statt Pack-Checkout: `POST /api/stripe/checkout {kind:'subscription', plan: abo, interval, consent}` → redirect auf `data.url`. Anzeige-Text im Kopf: „Sie starten mit: <Tarifname> — 14 Tage kostenlos".

- [ ] **Step 13.2: Google-Flow light** — `GoogleLoginButton` bekommt optionale `abo`/`interval`-Props → hängt sie an `/api/auth/google?…` an; google/route.ts schreibt sie mit in den State-Cookie (bestehendes plan-Muster kopieren); callback/route.ts: wenn abo im State → Redirect `/dashboard/subscription?upgrade=1` statt `/dashboard` (kein Auto-Checkout — Consent fehlt beim OAuth-Rücksprung).

- [ ] **Step 13.3: Verify + Commit**

```bash
npx tsc --noEmit
git add "src/app/(auth)/register/page.tsx" src/components/auth/GoogleLoginButton.tsx src/app/api/auth/google
git commit -m "feat: Landing-Abo-CTAs führen durch Registrierung direkt in den Abo-Checkout"
```

---

### Task 14: Gesamt-Verifikation

- [ ] **Step 14.1: Statisch** — `npm test && npx tsc --noEmit && npm run build` → alles grün.

- [ ] **Step 14.2: Server-Smoke** (lokale DB, `DATABASE_URL` aus `.env` exportieren, PORT 3111):
  1. Ohne Flag: registrieren → `/api/areas` GET seedet Branchen-Defaults → Ausgabe mit Bereich+MwSt anlegen → Liste zeigt Badge.
  2. CSV-Import: Mini-CSV posten (`/api/finance/import`) → imported/skipped korrekt; zweiter identischer Import → alles Duplikate.
  3. Recurring: Eintrag mit `nextRun` gestern anlegen → `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/daily` (CRON_SECRET als Shell-Env) → Expense erzeugt, nextRun vorgerückt; zweiter Lauf erzeugt nichts Neues.
  4. Home `/dashboard`: StatCards mit vollen Monatssummen, Ampeln sichtbar (hotel-Benchmarks), Sparkline lädt.
  5. Export: `/api/finance/export?year=2026` liefert CSV mit BOM + Einträgen.
  6. Mit Flag (`NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=true`): free-User → Export 403 upgradeRequired; Business-Sub (DB-Update) → Export 200; Home zeigt Teaser für free.
  7. Register-Flow: `/register?abo=business&interval=month` zeigt Tarif-Hinweis + Consent (Checkout-Redirect bricht ohne Price-IDs mit klarer Fehlermeldung ab — ok, Stripe-E2E separat).

- [ ] **Step 14.3: Abschluss-Commit falls Fixes**

```bash
git add -A && git commit -m "fix: Feinschliff aus Phase-2-Verifikation"
```

---

## Nicht in Phase 2 (bewusst)

Alert-Regeln-UI (Defaults + emailNotifications-Toggle reichen; Verwaltung später), echtes DATEV-Buchungsstapel-Format, Bank-API, Auto-Monatsreport per Mail (Phase 4, braucht Analyse-Modell), Belege nachträglich an ALTE Einträge im Listen-Edit (nur via Bearbeiten-Modal), Google-OAuth-Auto-Checkout.

## Empfohlene Plugins

Installiert & genutzt: **vercel** (Cron-Deploy + CRON_SECRET-Env), **context7** (Vercel-Cron/Prisma-groupBy-Docs bei Bedarf), **chrome-devtools/playwright** (UI-Smoke), **stripe** (später Launch-E2E). Neu: nichts.
