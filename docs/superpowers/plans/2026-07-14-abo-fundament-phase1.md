# Abo-Fundament (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stripe-Abos (Starter/Business/Premium, monatlich/jährlich, 14 Tage Trial) mit Entitlement-Gating, neuer Pricing-Page hinter Feature-Flag und Analyse-Preisstaffel — bei unverändertem Live-Verhalten, solange `NEXT_PUBLIC_SUBSCRIPTIONS_LIVE` nicht `true` ist.

**Architecture:** Reine Plan-Logik in `src/lib/entitlements.ts` (testbar, ohne DB), DB-Guards in `src/lib/entitlements-server.ts`, Tarif-/Preis-Konfiguration in `src/lib/plans.ts`, Stripe-Glue in Checkout-/Webhook-Routen. Legacy-Credit-System bleibt vollständig funktionsfähig (Grandfathering); alle neuen Gates greifen nur mit Flag.

**Tech Stack:** Next.js 14 App Router, Prisma 7 (Postgres/Neon), Stripe v22 (Basil-API: Perioden liegen auf Subscription-Items), Vitest (neu, nur node-env Unit-Tests), Resend.

**Spec:** `docs/superpowers/specs/2026-07-14-abo-cockpit-design.md`

---

## Dateiübersicht

| Datei | Aktion | Verantwortung |
|---|---|---|
| `vitest.config.ts`, `package.json` | Create/Modify | Test-Infrastruktur (Unit-Tests für reine Logik) |
| `prisma/schema.prisma` | Modify | `Subscription.billingInterval`, `Subscription.lastIncludedAnalysisAt` (additiv) |
| `src/lib/plans.ts` | Modify | + `SUBSCRIPTION_PLANS`, Analyse-Preis-Envs, `getSubscriptionPlan`; CREDIT_PACKS als Legacy markiert |
| `src/lib/entitlements.ts` | Create | Plan→Feature/Limit-Matrix, `resolvePlanId` (Legacy-Guard), Trial-Preisregel, Quartals-Inklusivanalyse, `subscriptionsLive()` |
| `src/lib/entitlements-server.ts` | Create | `getOrgContext`, Page-/API-Guards (DB) |
| `src/lib/checkout-target.ts` | Create | Checkout-Body → Kaufziel (pack/subscription/analysis), rein & testbar |
| `src/lib/stripe.ts` | Modify | + `priceIdForSubscription`, `subscriptionPlanFromPriceId` (env-injizierbar) |
| `src/lib/email.ts` | Modify | + `sendPaymentFailedEmail` |
| `src/app/api/stripe/checkout/route.ts` | Modify | 3 Kaufarten: Legacy-Pack, Abo (Trial 14 T), Analyse-zum-Plan-Preis |
| `src/app/api/stripe/webhook/route.ts` | Modify | Abo-Checkout verarbeiten, Credit-Kauf schreibt kein planName mehr, Price-ID→Plan-Sync, payment_failed-Mail |
| `src/app/api/analyze/route.ts` | Modify | Premium-Quartals-Inklusivanalyse + 402 mit Plan-Preis |
| `src/app/api/assistant/route.ts` | Modify | Limits aus Entitlements (nur mit Flag) |
| `src/app/dashboard/{costs,revenues,finance,mein-weg,mein-weg/ziele}/page.tsx` | Modify | Cockpit-Gate (nur mit Flag) |
| `src/app/api/{expenses,revenues,monthly-summary,monthly-targets}/route.ts` | Modify | Cockpit-Gate 403 (nur mit Flag) |
| `src/components/landing/SubscriptionPricing.tsx` | Create | Neue Pricing-Sektion (3 Tiers + Einzelanalyse, M/J-Toggle) |
| `src/components/landing/PricingSection.tsx` | Modify | Flag-Switch alt/neu |
| `src/components/subscription/CheckoutButton.tsx` | Modify | + `kind`/`interval`-Props (abwärtskompatibel) |
| `src/components/subscription/PlanManager.tsx` | Create | Abo-Verwaltung: Status/Trial, Tier-Wechsel, Analyse-Kauf, Kündigungsbutton |
| `src/app/dashboard/subscription/page.tsx` | Modify | Flag-Switch: neues PlanManager-Layout / Legacy-Packs |
| `.env.example` | Modify | 10 neue Price-Envs + Flag |
| `tests/{plans,entitlements,stripe-helpers,checkout-target}.test.ts` | Create | Unit-Tests |

**Wichtige Bestandsfakten (nicht raten):**
- `getCurrentUser()` ist **synchron**, liefert `{ userId, email }` (`src/lib/auth.ts`).
- DB-Client: `import { db } from '@/lib/db'`.
- Dev-Server: `PORT=3100 npm run dev`. `.env.local`-`DATABASE_URL` zeigt auf die alte US-Dev-DB (de-facto Dev-Umgebung) — Prod-Schema kommt ausschließlich über `vercel-build` (`prisma db push`). **Niemals lokal gegen Prod pushen.**
- Stripe läuft LIVE auf gemeinsamem ScopeTradeAI-Konto. Lokale E2E-Tests nur mit `sk_test_…`-Key + `stripe listen` (Task 14).
- Tailwind-Markenklassen existieren: `bg-hotel-navy`, `text-au-gold`, `bg-au-gold`, Farben `#0D1630`/`#0E1A33`, Gold `#C9A84C`.

---

### Task 1: Vitest-Setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1.1: Vitest installieren**

Run: `npm install -D vitest`
Expected: `added … packages` ohne Fehler.

- [ ] **Step 1.2: `vitest.config.ts` anlegen**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

- [ ] **Step 1.3: Script ergänzen** — in `package.json` unter `"scripts"` nach `"lint"` einfügen:

```json
    "test": "vitest run",
```

- [ ] **Step 1.4: Verifizieren**

Run: `npm test`
Expected: `No test files found, exiting with code 0` (passWithNoTests).

- [ ] **Step 1.5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: Vitest für Unit-Tests der Abo-Logik"
```

---

### Task 2: Prisma-Felder (additiv)

**Files:**
- Modify: `prisma/schema.prisma` (Modell `Subscription`, Zeilen 183–202)

- [ ] **Step 2.1: Felder ergänzen** — in `model Subscription` direkt nach `stripeSubscriptionId String?` einfügen:

```prisma
  billingInterval        String?   // 'month' | 'year' – nur bei aktivem Abo gesetzt
  lastIncludedAnalysisAt DateTime? // Premium: letzte genutzte Quartals-Inklusivanalyse
```

Außerdem den Kommentar an `planName` aktualisieren:

```prisma
  planName               String    @default("free") // free | starter | business | premium; Altbestand: 'premium' OHNE stripeSubscriptionId = Legacy-Credit-Käufer (zählt als free)
```

- [ ] **Step 2.2: Client generieren + Dev-DB pushen**

Run: `npm run db:generate && npm run db:push`
Expected: `Generated Prisma Client`, dann `Your database is now in sync` — **ohne** Data-Loss-Warnung (rein additiv). Hinweis: trifft die alte US-Dev-DB; Prod bekommt die Spalten beim Deploy via `vercel-build`.

- [ ] **Step 2.3: Typecheck**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 2.4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): billingInterval + lastIncludedAnalysisAt am Subscription-Modell"
```

---

### Task 3: `plans.ts` — Abo-Tarife & Analyse-Preis-Envs

**Files:**
- Modify: `src/lib/plans.ts`
- Test: `tests/plans.test.ts`

- [ ] **Step 3.1: Failing Test schreiben** — `tests/plans.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionPlan,
  ANALYSIS_PRICE_ENVS,
  ANALYSIS_SOLO_PRICE_CENTS,
} from '@/lib/plans'

describe('SUBSCRIPTION_PLANS', () => {
  it('hat drei Tiers mit korrekten Preisen (Cent)', () => {
    expect(SUBSCRIPTION_PLANS.starter.priceMonthlyCents).toBe(14900)
    expect(SUBSCRIPTION_PLANS.starter.priceYearlyPerMonthCents).toBe(11900)
    expect(SUBSCRIPTION_PLANS.business.priceMonthlyCents).toBe(29900)
    expect(SUBSCRIPTION_PLANS.business.priceYearlyPerMonthCents).toBe(23900)
    expect(SUBSCRIPTION_PLANS.premium.priceMonthlyCents).toBe(59900)
    expect(SUBSCRIPTION_PLANS.premium.priceYearlyPerMonthCents).toBe(47900)
    expect(SUBSCRIPTION_PLANS.business.highlight).toBe(true)
  })

  it('nennt für jeden Tier eigene Stripe-Env-Vars (M/J, eindeutig)', () => {
    const envs = Object.values(SUBSCRIPTION_PLANS).flatMap((p) => [
      p.stripePriceEnvMonthly,
      p.stripePriceEnvYearly,
    ])
    expect(new Set(envs).size).toBe(6)
    envs.forEach((e) => expect(e).toMatch(/^STRIPE_PRICE_/))
  })
})

describe('getSubscriptionPlan', () => {
  it('löst gültige IDs auf und lehnt Rest ab', () => {
    expect(getSubscriptionPlan('business')?.id).toBe('business')
    expect(getSubscriptionPlan('single')).toBeNull()
    expect(getSubscriptionPlan(null)).toBeNull()
    expect(getSubscriptionPlan('free')).toBeNull()
  })
})

describe('Analyse-Preise', () => {
  it('Solo kostet 2.490 €, jede Stufe hat eine Price-Env', () => {
    expect(ANALYSIS_SOLO_PRICE_CENTS).toBe(249000)
    expect(ANALYSIS_PRICE_ENVS.free).toBe('STRIPE_PRICE_ANALYSIS_SOLO')
    expect(ANALYSIS_PRICE_ENVS.starter).toBe('STRIPE_PRICE_ANALYSIS_STARTER')
    expect(ANALYSIS_PRICE_ENVS.business).toBe('STRIPE_PRICE_ANALYSIS_BUSINESS')
    expect(ANALYSIS_PRICE_ENVS.premium).toBe('STRIPE_PRICE_ANALYSIS_PREMIUM')
  })
})
```

- [ ] **Step 3.2: Test läuft rot**

Run: `npm test`
Expected: FAIL — `SUBSCRIPTION_PLANS` ist kein Export von `@/lib/plans`.

- [ ] **Step 3.3: Implementieren** — in `src/lib/plans.ts`:

(a) Kommentar über `CREDIT_PACKS` (Zeile 80) ersetzen durch:

```ts
// ─── Analyse-Pakete (Credits) ─────────────────────────────────────────────────
// LEGACY: Wird zum Abo-Launch (NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=true) von
// SUBSCRIPTION_PLANS + Einzelanalyse abgelöst. Definitionen bleiben erhalten,
// damit Webhook-Replays, alte Checkout-Links und Kauf-Historie funktionieren.
```

(b) Ans Dateiende anhängen:

```ts
// ─── Abo-Tarife (Unternehmens-Cockpit) ───────────────────────────────────────
// Preise in Cent. priceYearlyPerMonthCents = Monatsäquivalent bei Jahreszahlung
// (−20 %). Feature-Strings mit "(in Kürze)" markieren Module späterer Phasen.

export type SubscriptionPlanId = 'starter' | 'business' | 'premium'
export type BillingInterval = 'month' | 'year'

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  tagline: string
  priceMonthlyCents: number
  priceYearlyPerMonthCents: number
  stripePriceEnvMonthly: string
  stripePriceEnvYearly: string
  /** Analyse-Einmalpreis für Kunden dieses Tiers (Cent) */
  analysisPriceCents: number
  highlight: boolean
  features: string[]
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Die Finanzen im Griff',
    priceMonthlyCents: 14900,
    priceYearlyPerMonthCents: 11900,
    stripePriceEnvMonthly: 'STRIPE_PRICE_STARTER_MONTHLY',
    stripePriceEnvYearly: 'STRIPE_PRICE_STARTER_YEARLY',
    analysisPriceCents: 49900,
    highlight: false,
    features: [
      'Finanz-Cockpit: alle Einnahmen & Ausgaben je Bereich',
      'CSV-Bankimport & wiederkehrende Posten',
      'KPI-Ampeln mit Branchen-Benchmarks',
      'Automatischer Monats-Kurzreport',
      'Bis 10 Mitarbeiter (Stammdaten) · 2 Nutzer',
      'KI-Assistent (50 Fragen/Monat)',
      'Analysen für 499 € statt 2.490 €',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Der komplette Betrieb an einem Ort',
    priceMonthlyCents: 29900,
    priceYearlyPerMonthCents: 23900,
    stripePriceEnvMonthly: 'STRIPE_PRICE_BUSINESS_MONTHLY',
    stripePriceEnvYearly: 'STRIPE_PRICE_BUSINESS_YEARLY',
    analysisPriceCents: 29900,
    highlight: true,
    features: [
      'Alles aus Starter',
      'Schichtplan & Live-Ansicht „Wer arbeitet gerade" (in Kürze)',
      'Urlaubs- & Abwesenheitsverwaltung (in Kürze)',
      'Voller Auto-Monatsreport + KPI-Alerts',
      'DATEV-/Steuerberater-Export',
      'Maßnahmen-Tracker mit Wirkungs-Messung',
      'Bis 30 Mitarbeiter · 5 Nutzer',
      'KI-Assistent (200 Fragen/Monat)',
      'Analysen für 299 € statt 2.490 €',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'Mehr Standorte, volle Tiefe',
    priceMonthlyCents: 59900,
    priceYearlyPerMonthCents: 47900,
    stripePriceEnvMonthly: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    stripePriceEnvYearly: 'STRIPE_PRICE_PREMIUM_YEARLY',
    analysisPriceCents: 19900,
    highlight: false,
    features: [
      'Alles aus Business',
      '1 Vollanalyse pro Quartal inklusive',
      'Forecast & Cashflow-Prognose (in Kürze)',
      'Bis 5 Standorte (in Kürze) · unbegrenzt Mitarbeiter · 15 Nutzer',
      'KI-Assistent unbegrenzt (Fair Use)',
      'Prioritäts-Support',
      'Weitere Analysen für 199 € statt 2.490 €',
    ],
  },
}

/** Einzelanalyse ohne Abo — ersetzt zum Launch die alten 3er/5er-Pakete */
export const ANALYSIS_SOLO_PRICE_CENTS = 249000

/** Env-Var der Stripe-Price-ID für den Analyse-Einmalkauf je effektivem Plan */
export const ANALYSIS_PRICE_ENVS: Record<'free' | SubscriptionPlanId, string> = {
  free: 'STRIPE_PRICE_ANALYSIS_SOLO',
  starter: 'STRIPE_PRICE_ANALYSIS_STARTER',
  business: 'STRIPE_PRICE_ANALYSIS_BUSINESS',
  premium: 'STRIPE_PRICE_ANALYSIS_PREMIUM',
}

export function getSubscriptionPlan(id: string | null | undefined): SubscriptionPlan | null {
  if (id && id in SUBSCRIPTION_PLANS) return SUBSCRIPTION_PLANS[id as SubscriptionPlanId]
  return null
}
```

- [ ] **Step 3.4: Test läuft grün**

Run: `npm test`
Expected: PASS (alle `plans.test.ts`).

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/plans.ts tests/plans.test.ts
git commit -m "feat: Abo-Tarife Starter/Business/Premium + Analyse-Preisstaffel in plans.ts"
```

---

### Task 4: `entitlements.ts` — Kernlogik

**Files:**
- Create: `src/lib/entitlements.ts`
- Test: `tests/entitlements.test.ts`

- [ ] **Step 4.1: Failing Tests schreiben** — `tests/entitlements.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  resolvePlanId,
  getEntitlements,
  analysisPriceEnvFor,
  canUseIncludedAnalysis,
  startOfQuarter,
  type SubscriptionState,
} from '@/lib/entitlements'

function sub(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    planName: 'free',
    status: 'active',
    stripeSubscriptionId: null,
    analysisCredits: 0,
    lastIncludedAnalysisAt: null,
    assistantMsgsThisMonth: 0,
    ...overrides,
  }
}

describe('resolvePlanId', () => {
  it('null/free → free', () => {
    expect(resolvePlanId(null)).toBe('free')
    expect(resolvePlanId(sub())).toBe('free')
  })
  it('Legacy-Credit-Käufer: planName premium OHNE stripeSubscriptionId → free', () => {
    expect(resolvePlanId(sub({ planName: 'premium' }))).toBe('free')
  })
  it('echtes Premium-Abo → premium', () => {
    expect(resolvePlanId(sub({ planName: 'premium', stripeSubscriptionId: 'sub_1' }))).toBe('premium')
  })
  it('gekündigt/abgelaufen → free', () => {
    expect(resolvePlanId(sub({ planName: 'starter', status: 'cancelled' }))).toBe('free')
    expect(resolvePlanId(sub({ planName: 'business', status: 'incomplete_expired' }))).toBe('free')
  })
  it('trialing und past_due behalten den Plan', () => {
    expect(resolvePlanId(sub({ planName: 'business', status: 'trialing' }))).toBe('business')
    expect(resolvePlanId(sub({ planName: 'starter', status: 'past_due' }))).toBe('starter')
  })
  it('unbekannter planName → free', () => {
    expect(resolvePlanId(sub({ planName: 'standard' }))).toBe('free')
  })
})

describe('getEntitlements', () => {
  it('free: kein Cockpit, Analyse 2.490 €, kein Assistent', () => {
    const e = getEntitlements(null)
    expect(e.planId).toBe('free')
    expect(e.cockpit).toBe(false)
    expect(e.analysisPriceCents).toBe(249000)
    expect(e.assistantMsgsPerMonth).toBe(0)
  })
  it('starter: Cockpit ja, Schichtplan nein, Analyse 499 €', () => {
    const e = getEntitlements(sub({ planName: 'starter' }))
    expect(e.cockpit).toBe(true)
    expect(e.shifts).toBe(false)
    expect(e.autoReport).toBe('short')
    expect(e.analysisPriceCents).toBe(49900)
    expect(e.maxEmployees).toBe(10)
  })
  it('business: Schichtplan/Alerts/DATEV/Maßnahmen, Analyse 299 €', () => {
    const e = getEntitlements(sub({ planName: 'business' }))
    expect(e.shifts).toBe(true)
    expect(e.alerts).toBe(true)
    expect(e.datevExport).toBe(true)
    expect(e.measures).toBe(true)
    expect(e.analysisPriceCents).toBe(29900)
  })
  it('premium: Forecast + Inklusivanalyse, Analyse 199 €', () => {
    const e = getEntitlements(sub({ planName: 'premium', stripeSubscriptionId: 'sub_1' }))
    expect(e.forecast).toBe(true)
    expect(e.includedAnalysesPerQuarter).toBe(1)
    expect(e.analysisPriceCents).toBe(19900)
  })
  it('Trial-Schutz: im Trial kostet die Analyse den Solo-Preis', () => {
    const e = getEntitlements(sub({ planName: 'business', status: 'trialing' }))
    expect(e.cockpit).toBe(true)
    expect(e.analysisPriceCents).toBe(249000)
  })
})

describe('analysisPriceEnvFor', () => {
  it('free/Trial → SOLO-Env, aktive Tiers → eigene Env', () => {
    expect(analysisPriceEnvFor(null)).toBe('STRIPE_PRICE_ANALYSIS_SOLO')
    expect(analysisPriceEnvFor(sub({ planName: 'business', status: 'trialing' }))).toBe('STRIPE_PRICE_ANALYSIS_SOLO')
    expect(analysisPriceEnvFor(sub({ planName: 'business' }))).toBe('STRIPE_PRICE_ANALYSIS_BUSINESS')
  })
})

describe('startOfQuarter', () => {
  it('liefert Quartalsanfänge', () => {
    expect(startOfQuarter(new Date(2026, 0, 15))).toEqual(new Date(2026, 0, 1))
    expect(startOfQuarter(new Date(2026, 2, 31))).toEqual(new Date(2026, 0, 1))
    expect(startOfQuarter(new Date(2026, 3, 1))).toEqual(new Date(2026, 3, 1))
    expect(startOfQuarter(new Date(2026, 11, 24))).toEqual(new Date(2026, 9, 1))
  })
})

describe('canUseIncludedAnalysis', () => {
  const now = new Date(2026, 6, 14) // 14.07.2026 → Q3 beginnt 01.07.
  it('premium aktiv ohne bisherige Nutzung → ja', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'premium', stripeSubscriptionId: 's' }), now)).toBe(true)
  })
  it('bereits in diesem Quartal genutzt → nein', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'premium', stripeSubscriptionId: 's', lastIncludedAnalysisAt: new Date(2026, 6, 2) }), now)).toBe(false)
  })
  it('Nutzung im Vorquartal → wieder ja (nicht kumulierbar)', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'premium', stripeSubscriptionId: 's', lastIncludedAnalysisAt: new Date(2026, 5, 30) }), now)).toBe(true)
  })
  it('im Trial → nein (Exploit-Schutz)', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'premium', stripeSubscriptionId: 's', status: 'trialing' }), now)).toBe(false)
  })
  it('business → nein', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'business', stripeSubscriptionId: 's' }), now)).toBe(false)
  })
})
```

- [ ] **Step 4.2: Rot laufen lassen**

Run: `npm test`
Expected: FAIL — Modul `@/lib/entitlements` existiert nicht.

- [ ] **Step 4.3: Implementieren** — `src/lib/entitlements.ts` (komplette Datei):

```ts
// Einzige Quelle für Plan → Feature/Limit (Spec §6). Reine Logik ohne DB —
// DB-lesende Guards liegen in entitlements-server.ts.
import {
  ANALYSIS_PRICE_ENVS,
  ANALYSIS_SOLO_PRICE_CENTS,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from '@/lib/plans'

export type EffectivePlanId = 'free' | SubscriptionPlanId

/** Teilmenge des Prisma-Subscription-Modells, die die Logik braucht */
export interface SubscriptionState {
  planName: string
  status: string
  stripeSubscriptionId: string | null
  analysisCredits: number
  lastIncludedAnalysisAt: Date | null
  assistantMsgsThisMonth: number
}

type PlanRef = Pick<SubscriptionState, 'planName' | 'status' | 'stripeSubscriptionId'> | null | undefined

export interface Entitlements {
  planId: EffectivePlanId
  cockpit: boolean
  shifts: boolean
  alerts: boolean
  datevExport: boolean
  forecast: boolean
  measures: boolean
  autoReport: 'none' | 'short' | 'full'
  maxEmployees: number
  maxUsers: number
  maxLocations: number
  assistantMsgsPerMonth: number
  analysisPriceCents: number
  includedAnalysesPerQuarter: number
}

// 999999 statt Infinity: Entitlements wandern als JSON zum Client.
const MATRIX: Record<EffectivePlanId, Omit<Entitlements, 'planId' | 'analysisPriceCents'>> = {
  free:     { cockpit: false, shifts: false, alerts: false, datevExport: false, forecast: false, measures: false, autoReport: 'none',  maxEmployees: 0,      maxUsers: 1,  maxLocations: 0, assistantMsgsPerMonth: 0,    includedAnalysesPerQuarter: 0 },
  starter:  { cockpit: true,  shifts: false, alerts: false, datevExport: false, forecast: false, measures: false, autoReport: 'short', maxEmployees: 10,     maxUsers: 2,  maxLocations: 1, assistantMsgsPerMonth: 50,   includedAnalysesPerQuarter: 0 },
  business: { cockpit: true,  shifts: true,  alerts: true,  datevExport: true,  forecast: false, measures: true,  autoReport: 'full',  maxEmployees: 30,     maxUsers: 5,  maxLocations: 1, assistantMsgsPerMonth: 200,  includedAnalysesPerQuarter: 0 },
  premium:  { cockpit: true,  shifts: true,  alerts: true,  datevExport: true,  forecast: true,  measures: true,  autoReport: 'full',  maxEmployees: 999999, maxUsers: 15, maxLocations: 5, assistantMsgsPerMonth: 1000, includedAnalysesPerQuarter: 1 },
}

const ANALYSIS_PRICE_CENTS: Record<EffectivePlanId, number> = {
  free: ANALYSIS_SOLO_PRICE_CENTS,
  starter: SUBSCRIPTION_PLANS.starter.analysisPriceCents,
  business: SUBSCRIPTION_PLANS.business.analysisPriceCents,
  premium: SUBSCRIPTION_PLANS.premium.analysisPriceCents,
}

/** Abo-Status, in denen der Plan zählt. past_due behält Zugriff (Banner regelt die UI). */
const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due'])

/**
 * Effektiven Plan auflösen. Wichtig: Vor dem Abo-Launch schrieb der Credit-
 * Webhook planName='premium' OHNE stripeSubscriptionId (= Alt-Kunde mit
 * Einmalkauf, KEIN Premium-Abo). Solche Zeilen zählen als 'free' + Credits.
 */
export function resolvePlanId(sub: PlanRef): EffectivePlanId {
  if (!sub) return 'free'
  if (!(sub.planName in SUBSCRIPTION_PLANS)) return 'free'
  if (sub.planName === 'premium' && !sub.stripeSubscriptionId) return 'free'
  if (!ACTIVE_STATUSES.has(sub.status)) return 'free'
  return sub.planName as SubscriptionPlanId
}

/** Entitlements inkl. Trial-Schutz: im Trial kosten Analysen den Solo-Preis. */
export function getEntitlements(sub: PlanRef): Entitlements {
  const planId = resolvePlanId(sub)
  const analysisPriceCents =
    planId !== 'free' && sub?.status === 'trialing'
      ? ANALYSIS_PRICE_CENTS.free
      : ANALYSIS_PRICE_CENTS[planId]
  return { planId, analysisPriceCents, ...MATRIX[planId] }
}

/** Env-Var-Name der Stripe-Price-ID für den Analyse-Kauf (Trial → Solo-Preis) */
export function analysisPriceEnvFor(sub: PlanRef): string {
  const planId = resolvePlanId(sub)
  if (planId === 'free' || sub?.status === 'trialing') return ANALYSIS_PRICE_ENVS.free
  return ANALYSIS_PRICE_ENVS[planId]
}

/** Beginn des Kalenderquartals von `now` */
export function startOfQuarter(now: Date): Date {
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
}

/**
 * Premium: 1 Inklusivanalyse pro Kalenderquartal, nicht kumulierbar.
 * Nicht im Trial — sonst Trial abschließen → Gratis-Analyse → kündigen.
 */
export function canUseIncludedAnalysis(sub: SubscriptionState | null | undefined, now: Date = new Date()): boolean {
  if (!sub) return false
  if (resolvePlanId(sub) !== 'premium') return false
  if (sub.status !== 'active') return false
  if (!sub.lastIncludedAnalysisAt) return true
  return sub.lastIncludedAnalysisAt < startOfQuarter(now)
}

/** Launch-Schalter (Spec §3.4): neues Abo-Modell sichtbar/aktiv? */
export function subscriptionsLive(): boolean {
  return process.env.NEXT_PUBLIC_SUBSCRIPTIONS_LIVE === 'true'
}
```

- [ ] **Step 4.4: Grün laufen lassen**

Run: `npm test`
Expected: PASS (plans + entitlements).

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/entitlements.ts tests/entitlements.test.ts
git commit -m "feat: Entitlement-Matrix mit Legacy-Guard, Trial-Preisschutz und Quartals-Inklusivanalyse"
```

---

### Task 5: Stripe-Helper (Price-ID ↔ Plan)

**Files:**
- Modify: `src/lib/stripe.ts`
- Test: `tests/stripe-helpers.test.ts`

- [ ] **Step 5.1: Failing Test** — `tests/stripe-helpers.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { priceIdForSubscription, subscriptionPlanFromPriceId } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/plans'

const env = {
  STRIPE_PRICE_STARTER_MONTHLY: 'price_sm',
  STRIPE_PRICE_STARTER_YEARLY: 'price_sy',
  STRIPE_PRICE_BUSINESS_MONTHLY: 'price_bm',
  STRIPE_PRICE_BUSINESS_YEARLY: 'price_by',
  STRIPE_PRICE_PREMIUM_MONTHLY: 'price_pm',
  STRIPE_PRICE_PREMIUM_YEARLY: 'price_py',
} as NodeJS.ProcessEnv

describe('priceIdForSubscription', () => {
  it('löst Plan+Intervall zur Price-ID auf', () => {
    expect(priceIdForSubscription(SUBSCRIPTION_PLANS.business, 'month', env)).toBe('price_bm')
    expect(priceIdForSubscription(SUBSCRIPTION_PLANS.premium, 'year', env)).toBe('price_py')
  })
  it('liefert leeren String ohne Konfiguration', () => {
    expect(priceIdForSubscription(SUBSCRIPTION_PLANS.starter, 'month', {} as NodeJS.ProcessEnv)).toBe('')
  })
})

describe('subscriptionPlanFromPriceId', () => {
  it('mappt Price-IDs zurück auf Plan+Intervall', () => {
    expect(subscriptionPlanFromPriceId('price_by', env)).toEqual({ plan: 'business', interval: 'year' })
    expect(subscriptionPlanFromPriceId('price_sm', env)).toEqual({ plan: 'starter', interval: 'month' })
  })
  it('unbekannte/leere IDs → null', () => {
    expect(subscriptionPlanFromPriceId('price_x', env)).toBeNull()
    expect(subscriptionPlanFromPriceId(null, env)).toBeNull()
  })
})
```

- [ ] **Step 5.2: Rot**

Run: `npm test`
Expected: FAIL — `priceIdForSubscription` nicht exportiert.

- [ ] **Step 5.3: Implementieren** — an `src/lib/stripe.ts` anhängen:

```ts
import {
  SUBSCRIPTION_PLANS,
  type BillingInterval,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from '@/lib/plans'

/** Stripe-Price-ID eines Abo-Plans aus der Env auflösen ('' wenn nicht konfiguriert) */
export function priceIdForSubscription(
  plan: SubscriptionPlan,
  interval: BillingInterval,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const key = interval === 'year' ? plan.stripePriceEnvYearly : plan.stripePriceEnvMonthly
  return env[key] ?? ''
}

/** Plan+Intervall zu einer Stripe-Price-ID — für den Webhook-Sync (subscription.updated) */
export function subscriptionPlanFromPriceId(
  priceId: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): { plan: SubscriptionPlanId; interval: BillingInterval } | null {
  if (!priceId) return null
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    if (env[plan.stripePriceEnvMonthly] === priceId) return { plan: plan.id, interval: 'month' }
    if (env[plan.stripePriceEnvYearly] === priceId) return { plan: plan.id, interval: 'year' }
  }
  return null
}
```

(Der bestehende Import-Block aus `@/lib/plans` in Zeile 16 bleibt unverändert; ESLint erlaubt mehrere Import-Statements derselben Quelle nicht → beide zu **einem** Import zusammenführen: `import { CREDIT_PACKS, getCreditPack, SUBSCRIPTION_PLANS, type BillingInterval, type CreditPack, type SubscriptionPlan, type SubscriptionPlanId } from '@/lib/plans'`.)

- [ ] **Step 5.4: Grün**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5.5: Commit**

```bash
git add src/lib/stripe.ts tests/stripe-helpers.test.ts
git commit -m "feat: Stripe-Price-Auflösung für Abo-Tarife (hin und zurück)"
```

---

### Task 6: Checkout — drei Kaufarten

**Files:**
- Create: `src/lib/checkout-target.ts`
- Modify: `src/app/api/stripe/checkout/route.ts`
- Test: `tests/checkout-target.test.ts`

- [ ] **Step 6.1: Failing Test** — `tests/checkout-target.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveCheckoutTarget } from '@/lib/checkout-target'

const businessSub = { planName: 'business', status: 'active', stripeSubscriptionId: 'sub_1' }
const trialSub = { planName: 'business', status: 'trialing', stripeSubscriptionId: 'sub_1' }

describe('resolveCheckoutTarget', () => {
  it('Legacy-Pack-Kauf bleibt funktionsfähig', () => {
    const t = resolveCheckoutTarget({ plan: 'triple' }, null)
    expect(t.kind).toBe('pack')
    if (t.kind === 'pack') expect(t.pack.credits).toBe(3)
  })
  it("Alias 'premium' → Einzel-Pack (alte Links)", () => {
    const t = resolveCheckoutTarget({ plan: 'premium' }, null)
    expect(t.kind).toBe('pack')
  })
  it('Abo-Kauf mit Intervall', () => {
    const t = resolveCheckoutTarget({ kind: 'subscription', plan: 'starter', interval: 'year' }, null)
    expect(t).toMatchObject({ kind: 'subscription', interval: 'year' })
  })
  it('Abo mit unbekanntem Tarif → invalid', () => {
    expect(resolveCheckoutTarget({ kind: 'subscription', plan: 'gold' }, null).kind).toBe('invalid')
  })
  it('Analyse-Kauf: free zahlt Solo-Preis', () => {
    const t = resolveCheckoutTarget({ kind: 'analysis' }, null)
    expect(t).toMatchObject({ kind: 'analysis', priceEnv: 'STRIPE_PRICE_ANALYSIS_SOLO', amountCents: 249000 })
  })
  it('Analyse-Kauf: Business zahlt 299 €', () => {
    const t = resolveCheckoutTarget({ kind: 'analysis' }, businessSub)
    expect(t).toMatchObject({ priceEnv: 'STRIPE_PRICE_ANALYSIS_BUSINESS', amountCents: 29900 })
  })
  it('Analyse-Kauf im Trial → Solo-Preis (Exploit-Schutz)', () => {
    const t = resolveCheckoutTarget({ kind: 'analysis' }, trialSub)
    expect(t).toMatchObject({ priceEnv: 'STRIPE_PRICE_ANALYSIS_SOLO', amountCents: 249000 })
  })
  it('Müll → invalid', () => {
    expect(resolveCheckoutTarget({ plan: 'quatsch' }, null).kind).toBe('invalid')
    expect(resolveCheckoutTarget({}, null).kind).toBe('invalid')
  })
})
```

- [ ] **Step 6.2: Rot**

Run: `npm test` — Expected: FAIL (Modul fehlt).

- [ ] **Step 6.3: `src/lib/checkout-target.ts` implementieren** (komplette Datei):

```ts
// Reine Auflösung des Checkout-Request-Bodys → was genau gekauft wird.
// Hält /api/stripe/checkout dünn und macht die Preislogik testbar.
import {
  getCreditPack,
  getSubscriptionPlan,
  type BillingInterval,
  type CreditPack,
  type SubscriptionPlan,
} from '@/lib/plans'
import { analysisPriceEnvFor, getEntitlements } from '@/lib/entitlements'

export type CheckoutTarget =
  | { kind: 'pack'; pack: CreditPack }
  | { kind: 'subscription'; plan: SubscriptionPlan; interval: BillingInterval }
  | { kind: 'analysis'; priceEnv: string; amountCents: number; planId: string }
  | { kind: 'invalid'; reason: string }

export interface CheckoutBody {
  kind?: string
  plan?: string
  interval?: string
}

type SubLike = Parameters<typeof getEntitlements>[0]

export function resolveCheckoutTarget(body: CheckoutBody, sub: SubLike): CheckoutTarget {
  if (body.kind === 'subscription') {
    const plan = getSubscriptionPlan(body.plan)
    if (!plan) return { kind: 'invalid', reason: 'Unbekannter Abo-Tarif.' }
    const interval: BillingInterval = body.interval === 'year' ? 'year' : 'month'
    return { kind: 'subscription', plan, interval }
  }
  if (body.kind === 'analysis') {
    const ent = getEntitlements(sub)
    return {
      kind: 'analysis',
      priceEnv: analysisPriceEnvFor(sub),
      amountCents: ent.analysisPriceCents,
      planId: ent.planId,
    }
  }
  // Legacy: {plan: 'single'|'triple'|'five'|'premium'} — alte Links/Register-Flow
  const pack = getCreditPack(body.plan)
  if (pack) return { kind: 'pack', pack }
  return { kind: 'invalid', reason: 'Ungültiges Analyse-Paket.' }
}
```

- [ ] **Step 6.4: Grün**

Run: `npm test` — Expected: PASS.

- [ ] **Step 6.5: Checkout-Route umbauen** — `src/app/api/stripe/checkout/route.ts` komplett ersetzen:

```ts
import { NextResponse } from 'next/server'
import { getStripe, priceIdForSubscription } from '@/lib/stripe'
import { resolveCheckoutTarget } from '@/lib/checkout-target'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const body = await req.json()

    // Pflicht (§356 Abs. 4/5 BGB): ausdrückliche Zustimmung zur sofortigen Ausführung,
    // sonst kein Kauf. Wird unten als Nachweis in den Session-Metadaten gespeichert.
    if (body?.consent !== true) {
      return NextResponse.json(
        { error: 'Bitte stimmen Sie der sofortigen Ausführung zu, um fortzufahren.' },
        { status: 400 },
      )
    }
    const consentAt = new Date().toISOString()

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: {
        organization: { include: { subscription: true } },
      },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const org = membership.organization
    const target = resolveCheckoutTarget(body ?? {}, org.subscription)
    if (target.kind === 'invalid') {
      return NextResponse.json({ error: target.reason }, { status: 400 })
    }

    const userRecord = await db.user.findUnique({ where: { id: user.userId } })
    let customerId = org.subscription?.stripeCustomerId ?? undefined

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: userRecord!.email,
        name: org.name,
        metadata: { organizationId: org.id },
      })
      customerId = customer.id

      await db.subscription.upsert({
        where: { organizationId: org.id },
        create: {
          organizationId: org.id,
          stripeCustomerId: customerId,
          planName: 'free',
        },
        update: { stripeCustomerId: customerId },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // ── Abo-Kauf: Subscription-Checkout mit 14 Tagen Trial ──────────────────────
    if (target.kind === 'subscription') {
      const priceId = priceIdForSubscription(target.plan, target.interval)
      if (!priceId) return NextResponse.json({ error: 'Stripe Price ID nicht konfiguriert.' }, { status: 500 })

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        billing_address_collection: 'required',
        success_url: `${appUrl}/dashboard/subscription?subscribed=1`,
        cancel_url: `${appUrl}/dashboard/subscription`,
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            organizationId: org.id,
            subscriptionPlan: target.plan.id,
            interval: target.interval,
          },
        },
        metadata: {
          organizationId: org.id,
          subscriptionPlan: target.plan.id,
          interval: target.interval,
          consent_immediate_execution: 'true',
          consent_at: consentAt,
        },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Einmalkauf: Legacy-Pack oder Einzelanalyse zum Plan-Preis ───────────────
    const priceId =
      target.kind === 'pack'
        ? process.env[target.pack.stripePriceEnv] ?? ''
        : process.env[target.priceEnv] ?? ''
    if (!priceId) return NextResponse.json({ error: 'Stripe Price ID nicht konfiguriert.' }, { status: 500 })

    const packId = target.kind === 'pack' ? target.pack.id : 'analysis'
    const credits = target.kind === 'pack' ? target.pack.credits : 1

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Rechnungsadresse ist Pflicht: § 14 Abs. 4 UStG verlangt Name + Anschrift
      // des Leistungsempfängers auf Rechnungen über 250 €.
      billing_address_collection: 'required',
      success_url: `${appUrl}/dashboard/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/subscription`,
      metadata: {
        organizationId: org.id,
        pack: packId,
        credits: String(credits),
        ...(target.kind === 'analysis' ? { planAtPurchase: target.planId } : {}),
        consent_immediate_execution: 'true',
        consent_at: consentAt,
      },
      // Verwendungszweck auf der Kartenabrechnung: Konto läuft auf ScopeTradeAI,
      // Konto-Präfix PROFITORA + Suffix ergibt „PROFITORA* ANALYSE" (max. 22 Zeichen)
      payment_intent_data: {
        statement_descriptor_suffix: 'ANALYSE',
        metadata: { organizationId: org.id, pack: packId, credits: String(credits) },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Checkout konnte nicht erstellt werden.' }, { status: 500 })
  }
}
```

(Hinweis: `priceIdForPack` aus `@/lib/stripe` wird hier nicht mehr importiert — die Env-Auflösung passiert inline; der Export in `stripe.ts` bleibt für andere Nutzer bestehen.)

- [ ] **Step 6.6: Verifizieren**

Run: `npx tsc --noEmit && npm test`
Expected: beides grün.

- [ ] **Step 6.7: Commit**

```bash
git add src/lib/checkout-target.ts src/app/api/stripe/checkout/route.ts tests/checkout-target.test.ts
git commit -m "feat: Checkout unterstützt Abo (Trial 14 T) und Analyse-Kauf zum Plan-Preis"
```

---

### Task 7: Webhook-Ausbau

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts`
- Modify: `src/lib/email.ts`

- [ ] **Step 7.1: `sendPaymentFailedEmail`** — in `src/lib/email.ts` nach `sendOrderConfirmationEmail` einfügen:

```ts
export async function sendPaymentFailedEmail(to: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Zahlung fehlgeschlagen – Ihr Profitora-Abo',
    html: baseHtml(`
      <h1>Zahlung fehlgeschlagen</h1>
      <p>Die letzte Abbuchung für Ihr Profitora-Abo konnte nicht durchgeführt werden.
      Bitte aktualisieren Sie Ihre Zahlungsmethode – Stripe versucht die Abbuchung
      automatisch erneut. Ihr Zugang bleibt vorerst bestehen.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription" class="btn">Zahlungsmethode aktualisieren</a>
    `),
  })
}
```

- [ ] **Step 7.2: Webhook-Imports & Helfer anpassen** — in `src/app/api/stripe/webhook/route.ts`:

Imports (Zeilen 3–6) ersetzen durch:

```ts
import { getStripe, subscriptionPlanFromPriceId } from '@/lib/stripe'
import { db } from '@/lib/db'
import { getCreditPack, getSubscriptionPlan } from '@/lib/plans'
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email'
```

Die Funktion `limitFor` (Zeilen 8–11) **ersatzlos löschen** (legacy `monthlyAnalysisLimit` wird nicht mehr geschrieben). `creditPackName` (Zeilen 13–16) ersetzen durch:

```ts
/** Anzeigename eines Packs für die Auftragsbestätigung */
function creditPackName(packId: string): string {
  if (packId === 'analysis') return 'Einzelanalyse'
  return getCreditPack(packId)?.name ?? 'Komplettanalyse'
}
```

`getPeriod` (Zeilen 18–24) ersetzen durch (Stripe Basil-API: Perioden liegen auf dem Subscription-Item, ältere API-Versionen top-level):

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPeriod(sub: any) {
  const item = sub?.items?.data?.[0]
  const start = item?.current_period_start ?? sub?.current_period_start
  const end = item?.current_period_end ?? sub?.current_period_end
  return {
    start: start ? new Date(start * 1000) : undefined,
    end: end ? new Date(end * 1000) : undefined,
  }
}
```

- [ ] **Step 7.3: Abo-Checkout verarbeiten** — im `case 'checkout.session.completed'` direkt nach `const session = event.data.object` einfügen:

```ts
        // ── Abo-Abschluss: Subscription-Zeile setzen (idempotent per Upsert) ──
        if (session.mode === 'subscription') {
          const orgId = session.metadata?.organizationId
          const plan = getSubscriptionPlan(session.metadata?.subscriptionPlan)
          if (!orgId || !plan) break
          const interval = session.metadata?.interval === 'year' ? 'year' : 'month'

          const stripeSub = session.subscription
            ? await getStripe().subscriptions.retrieve(String(session.subscription))
            : null
          const period = getPeriod(stripeSub)

          const data = {
            planName: plan.id,
            status: stripeSub?.status ?? 'trialing',
            billingInterval: interval,
            stripeCustomerId: (session.customer as string) ?? null,
            stripeSubscriptionId: stripeSub?.id ?? null,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          }
          await db.subscription.upsert({
            where: { organizationId: orgId },
            create: { organizationId: orgId, ...data },
            update: data,
          })
          break
        }
```

- [ ] **Step 7.4: Credit-Kauf schreibt kein planName mehr** — im selben Case den `subscription.upsert`-Block (bisher Zeilen 98–113) ersetzen durch:

```ts
          // Credits gutschreiben. planName wird NICHT mehr angefasst — der alte
          // 'premium'-Marker kollidiert mit dem echten Premium-Abo-Tier; Alt-
          // Zeilen fängt resolvePlanId() über den fehlenden stripeSubscriptionId ab.
          await tx.subscription.upsert({
            where: { organizationId: orgId },
            create: {
              organizationId: orgId,
              planName: 'free',
              status: 'active',
              analysisCredits: credits,
              stripeCustomerId: session.customer as string,
            },
            update: {
              analysisCredits: { increment: credits },
              stripeCustomerId: session.customer as string,
            },
          })
```

- [ ] **Step 7.5: `customer.subscription.updated`** — kompletten Case ersetzen durch:

```ts
      case 'customer.subscription.updated': {
        const sub = event.data.object
        // Plan primär über die Price-ID bestimmen (robust bei Upgrades im
        // Stripe-Portal), Fallback: Metadaten aus dem Checkout.
        const mapped = subscriptionPlanFromPriceId(sub.items?.data?.[0]?.price?.id)
        const planId = mapped?.plan ?? getSubscriptionPlan(sub.metadata?.subscriptionPlan)?.id ?? null
        if (!planId) break // fremdes/unbekanntes Abo – nichts anfassen
        const period = getPeriod(sub)

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            planName: planId,
            ...(mapped ? { billingInterval: mapped.interval } : {}),
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
        })
        break
      }
```

- [ ] **Step 7.6: `customer.subscription.deleted`** — Case-Inhalt ersetzen durch:

```ts
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: 'cancelled',
            planName: 'free',
            billingInterval: null,
            stripeSubscriptionId: null,
          },
        })
        break
      }
```

- [ ] **Step 7.7: `invoice.payment_failed` + Mail** — Case ersetzen durch:

```ts
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subId = invoice.subscription as string | null
        if (subId) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: 'past_due' },
          })
          const email = invoice.customer_email as string | null
          if (email) {
            await sendPaymentFailedEmail(email).catch((mailErr) =>
              console.error('[webhook] payment_failed-Mail fehlgeschlagen:', mailErr),
            )
          }
        }
        break
      }
```

- [ ] **Step 7.8: Verifizieren**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: alles grün (Webhook-E2E folgt in Task 14).

- [ ] **Step 7.9: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts src/lib/email.ts
git commit -m "feat: Webhook verarbeitet Abo-Lifecycle; Credit-Kauf setzt kein planName mehr"
```

---

### Task 8: Server-Guards + Cockpit-Gating

**Files:**
- Create: `src/lib/entitlements-server.ts`
- Modify: `src/app/dashboard/costs/page.tsx`, `src/app/dashboard/revenues/page.tsx`, `src/app/dashboard/finance/page.tsx`, `src/app/dashboard/mein-weg/page.tsx`, `src/app/dashboard/mein-weg/ziele/page.tsx`
- Modify: `src/app/api/expenses/route.ts`, `src/app/api/revenues/route.ts`, `src/app/api/monthly-summary/route.ts`, `src/app/api/monthly-targets/route.ts`

- [ ] **Step 8.1: `src/lib/entitlements-server.ts`** (komplette Datei):

```ts
// DB-lesende Entitlement-Guards für Server-Pages und API-Routen.
// Alle Gates greifen NUR mit Launch-Flag (subscriptionsLive) — davor verhält
// sich die App exakt wie bisher.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getEntitlements, subscriptionsLive, type Entitlements } from '@/lib/entitlements'

export interface OrgContext {
  userId: string
  organizationId: string
  subscription: Awaited<ReturnType<typeof db.subscription.findUnique>>
  entitlements: Entitlements
}

/** Org + Entitlements des eingeloggten Nutzers laden (null = kein Login / keine Org) */
export async function getOrgContext(): Promise<OrgContext | null> {
  const user = getCurrentUser()
  if (!user) return null
  const membership = await db.organizationMember.findFirst({
    where: { userId: user.userId },
  })
  if (!membership) return null
  const subscription = await db.subscription.findUnique({
    where: { organizationId: membership.organizationId },
  })
  return {
    userId: user.userId,
    organizationId: membership.organizationId,
    subscription,
    entitlements: getEntitlements(subscription),
  }
}

/** true = Zugriff auf Cockpit-Features verweigern (Seite → redirect, API → 403) */
export async function cockpitBlocked(): Promise<boolean> {
  if (!subscriptionsLive()) return false
  const ctx = await getOrgContext()
  return !ctx || !ctx.entitlements.cockpit
}

/** Einheitliche 403-Antwort für gesperrte Cockpit-APIs */
export function cockpitForbiddenResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Diese Funktion ist Teil des Profitora-Abos.', upgradeRequired: true },
    { status: 403 },
  )
}
```

- [ ] **Step 8.2: Seiten gaten** — in jeder der 5 Dashboard-Seiten (`costs`, `revenues`, `finance`, `mein-weg`, `mein-weg/ziele`):

(a) Import ergänzen:

```ts
import { cockpitBlocked } from '@/lib/entitlements-server'
```

(b) Direkt nach dem bestehenden Auth-Guard (`const user = getCurrentUser()` … `if (!user) redirect('/login')` — Muster wie in `subscription/page.tsx:12-13`) einfügen:

```ts
  // Cockpit ist Teil des Abos (greift erst mit NEXT_PUBLIC_SUBSCRIPTIONS_LIVE)
  if (await cockpitBlocked()) redirect('/dashboard/subscription?upgrade=1')
```

Falls eine der Seiten den Auth-Guard anders formuliert: den Gate-Aufruf als erste Zeile nach der Auth-Prüfung setzen. Vorher mit `grep -n "getCurrentUser" src/app/dashboard/costs/page.tsx` etc. die exakte Stelle prüfen.

- [ ] **Step 8.3: APIs gaten** — in den 4 API-Routen (`expenses`, `revenues`, `monthly-summary`, `monthly-targets`) in **jedem** Handler (GET/POST/PUT/DELETE) direkt nach der bestehenden Auth-Prüfung (`if (!user) return …401`) einfügen:

```ts
  if (await cockpitBlocked()) return cockpitForbiddenResponse()
```

Import je Datei:

```ts
import { cockpitBlocked, cockpitForbiddenResponse } from '@/lib/entitlements-server'
```

- [ ] **Step 8.4: Verifizieren**

Run: `npx tsc --noEmit && npm run lint`
Expected: grün. Ohne Flag ändert sich nichts (`cockpitBlocked()` liefert sofort `false`).

- [ ] **Step 8.5: Commit**

```bash
git add src/lib/entitlements-server.ts src/app/dashboard src/app/api/expenses src/app/api/revenues src/app/api/monthly-summary src/app/api/monthly-targets
git commit -m "feat: Cockpit-Gating für Finanz-Seiten und -APIs (aktiv erst mit Launch-Flag)"
```

---

### Task 9: Assistent-Limits über Entitlements

**Files:**
- Modify: `src/app/api/assistant/route.ts:28-41`

- [ ] **Step 9.1: Limit-Block ersetzen** — Import ergänzen:

```ts
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'
```

Den Block Zeilen 28–41 (von `const plan = getPlan(...)` bis zum Ende der Limit-Prüfung) ersetzen durch:

```ts
  const plan = getPlan(org.subscription?.planName)

  // Monatslimit: mit Launch-Flag aus den Entitlements (free = 0 → Abo-CTA),
  // davor Legacy-Verhalten über plans.ts.
  if (subscriptionsLive()) {
    const ent = getEntitlements(org.subscription)
    if (ent.assistantMsgsPerMonth <= 0) {
      return NextResponse.json(
        { error: 'Der KI-Assistent ist Teil des Profitora-Abos.', upgradeRequired: true },
        { status: 403 },
      )
    }
    if ((org.subscription?.assistantMsgsThisMonth ?? 0) >= ent.assistantMsgsPerMonth) {
      return NextResponse.json(
        {
          error: `Ihr Monatslimit von ${ent.assistantMsgsPerMonth} Fragen ist erreicht. Upgraden Sie für mehr Fragen.`,
          limitReached: true,
        },
        { status: 429 },
      )
    }
  } else if (plan.assistantLimit !== null && org.subscription) {
    if (org.subscription.assistantMsgsThisMonth >= plan.assistantLimit) {
      return NextResponse.json(
        {
          error: `Ihr Monatslimit von ${plan.assistantLimit} Fragen ist erreicht. Upgraden Sie für mehr Fragen.`,
          limitReached: true,
        },
        { status: 429 }
      )
    }
  }
```

(`plan` wird weiter unten in der Route für die Modellwahl genutzt — nicht entfernen. Bekannte Lücke: `assistantMsgsThisMonth` hat noch keinen Monats-Reset; kommt mit dem Phase-2-Cron.)

- [ ] **Step 9.2: Verifizieren + Commit**

Run: `npx tsc --noEmit`

```bash
git add src/app/api/assistant/route.ts
git commit -m "feat: Assistent-Limits aus Entitlements (free ohne Abo gesperrt, flag-gated)"
```

---

### Task 10: Analyze-Route — Inklusivanalyse + Plan-Preis im 402

**Files:**
- Modify: `src/app/api/analyze/route.ts:75-93` (Charge-Block) und der Fehler-Callback (Zeilen 107–120)

- [ ] **Step 10.1: Imports ergänzen**

```ts
import { canUseIncludedAnalysis, getEntitlements, startOfQuarter, subscriptionsLive } from '@/lib/entitlements'
```

- [ ] **Step 10.2: Charge-Block ersetzen** — Zeilen 75–93 (`const charged = …` bis zum Ende des `if (charged.count === 0)`-Blocks) ersetzen durch:

```ts
    // Bezahlmodell: jede Analyse verbraucht 1 Credit (atomar, race-sicher).
    // Premium-Abo hat zusätzlich 1 Inklusivanalyse pro Kalenderquartal.
    let consumedIncluded = false
    const charged = await db.subscription.updateMany({
      where: { organizationId: org.id, analysisCredits: { gte: 1 } },
      data: {
        analysisCredits: { decrement: 1 },
        usedAnalysesThisMonth: { increment: 1 },
      },
    })
    if (charged.count === 0) {
      if (subscriptionsLive() && canUseIncludedAnalysis(org.subscription)) {
        // Atomar: nur wenn in diesem Kalenderquartal noch keine Inklusivanalyse lief.
        const included = await db.subscription.updateMany({
          where: {
            organizationId: org.id,
            planName: 'premium',
            status: 'active',
            OR: [
              { lastIncludedAnalysisAt: null },
              { lastIncludedAnalysisAt: { lt: startOfQuarter(new Date()) } },
            ],
          },
          data: {
            lastIncludedAnalysisAt: new Date(),
            usedAnalysesThisMonth: { increment: 1 },
          },
        })
        consumedIncluded = included.count > 0
      }
      if (!consumedIncluded) {
        if (subscriptionsLive()) {
          const ent = getEntitlements(org.subscription)
          return NextResponse.json(
            {
              error:
                ent.planId === 'free'
                  ? 'Kein Analyse-Guthaben verfügbar. Kaufen Sie eine Einzelanalyse – oder sichern Sie sich das Abo mit deutlich günstigeren Analysen.'
                  : `Kein Analyse-Guthaben verfügbar. Mit Ihrem ${ent.planId.charAt(0).toUpperCase() + ent.planId.slice(1)}-Abo kostet die Analyse nur ${(ent.analysisPriceCents / 100).toLocaleString('de-DE')} €.`,
              needCredits: true,
              analysisPriceCents: ent.analysisPriceCents,
              planId: ent.planId,
            },
            { status: 402 }
          )
        }
        return NextResponse.json(
          {
            error: 'Kein Analyse-Guthaben verfügbar. Kaufen Sie eine Einzelanalyse oder sparen Sie mit dem 3er-/5er-Paket.',
            needCredits: true,
          },
          { status: 402 }
        )
      }
    }
```

- [ ] **Step 10.3: Fehler-Callback anpassen** — im `.catch(async (err) => { … })` des `runAnalysis`-Aufrufs den Credit-Rückgabe-Block (`await db.subscription.updateMany({ … analysisCredits: { increment: 1 } … })`) ersetzen durch:

```ts
        // Fehlgeschlagene Analyse darf nichts kosten: Credit zurück bzw.
        // Inklusivanalyse wieder freigeben.
        await (consumedIncluded
          ? db.subscription.updateMany({
              where: { organizationId: org.id },
              data: { lastIncludedAnalysisAt: null },
            })
          : db.subscription.updateMany({
              where: { organizationId: org.id },
              data: { analysisCredits: { increment: 1 } },
            })
        ).catch((refundErr) => console.error('[analyze] Rückgabe fehlgeschlagen:', refundErr))
```

- [ ] **Step 10.4: Verifizieren + Commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: Premium-Quartals-Inklusivanalyse + Plan-Preis im 402 (flag-gated)"
```

---

### Task 11: Landing-Pricing — neue Abo-Sektion hinter Flag

**Files:**
- Create: `src/components/landing/SubscriptionPricing.tsx`
- Modify: `src/components/landing/PricingSection.tsx`

- [ ] **Step 11.1: `SubscriptionPricing.tsx`** (komplette Datei; Stil folgt der bestehenden PricingSection):

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ANALYSIS_SOLO_PRICE_CENTS, SUBSCRIPTION_PLANS } from '@/lib/plans'

const TIERS = [SUBSCRIPTION_PLANS.starter, SUBSCRIPTION_PLANS.business, SUBSCRIPTION_PLANS.premium]

function euro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE')
}

export default function SubscriptionPricing() {
  const [interval, setInterval] = useState<'month' | 'year'>('month')

  return (
    <section id="preise" className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
            Preise
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-4">
            Ihr ganzes Unternehmen. Ein Cockpit.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Finanzen, Team und Kennzahlen an einem Ort – mit KI-Analysen zum Bruchteil des Einzelpreises.
            14 Tage kostenlos testen, monatlich kündbar.
          </p>
        </div>

        {/* Intervall-Toggle */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setInterval('month')}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              interval === 'month' ? 'bg-hotel-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              interval === 'year' ? 'bg-hotel-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Jährlich <span className="text-au-gold">−20 %</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const cents = interval === 'year' ? tier.priceYearlyPerMonthCents : tier.priceMonthlyCents
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col h-full rounded-2xl border p-7 transition-all ${
                  tier.highlight
                    ? 'border-hotel-navy bg-gradient-to-br from-[#0E1A33] to-[#243459] text-white shadow-xl scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-hotel-navy/25 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      tier.highlight ? 'bg-au-gold/20 text-au-gold' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tier.highlight ? 'Beliebt' : tier.tagline}
                  </span>
                </div>

                <p className={`text-3xl font-black tracking-tight mb-0.5 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {euro(cents)} €<span className="text-base font-semibold"> / Monat</span>
                </p>
                <p className={`text-xs mb-4 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                  {interval === 'year'
                    ? `bei jährlicher Zahlung (${euro(cents * 12)} €/Jahr) · zzgl. Analysen`
                    : 'monatlich kündbar · zzgl. Analysen'}
                </p>

                <p className={`text-lg font-bold mb-2 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>{tier.name}</p>

                <ul className="space-y-2 flex-1 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke={tier.highlight ? '#C9A84C' : '#1a2744'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className={`text-sm ${tier.highlight ? 'text-white/70' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?abo=${tier.id}&interval=${interval}`}
                  className={`flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 ${
                    tier.highlight
                      ? 'bg-au-gold text-[#06091A] hover:bg-au-gold-light'
                      : 'bg-hotel-navy text-white hover:bg-hotel-navy-light'
                  }`}
                >
                  14 Tage kostenlos testen
                </Link>
              </div>
            )
          })}
        </div>

        {/* Einzelanalyse ohne Abo */}
        <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">Einzelanalyse ohne Abo</p>
            <p className="text-sm text-gray-500">
              Die vollständige KI-Wirtschaftlichkeitsanalyse als Einmalkauf – ohne Cockpit.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-black text-gray-900">{euro(ANALYSIS_SOLO_PRICE_CENTS)} €</p>
            <Link
              href="/register?plan=single"
              className="text-sm font-semibold px-5 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 hover:border-hotel-navy/40 transition-colors"
            >
              Einzelanalyse kaufen
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8 max-w-lg mx-auto leading-relaxed">
          Abo-Analysen: Starter 499 € · Business 299 € · Premium 199 € (statt {euro(ANALYSIS_SOLO_PRICE_CENTS)} € einzeln).
          Monatlich kündbar, Kündigung jederzeit im Kundenkonto.
          Alle Analysen sind betriebswirtschaftliche Entscheidungshilfen –
          kein Ersatz für Steuerberater, Rechtsanwalt oder gesetzlichen Wirtschaftsprüfer.
        </p>
      </div>
    </section>
  )
}
```

Hinweis: Der `/register?abo=…`-Parameter wird vom Register-Flow in Phase 1 noch ignoriert (Nutzer registriert sich normal und schließt das Abo unter `/dashboard/subscription` ab). Durchgereichter Abo-Checkout direkt nach Registrierung = Punkt für den Launch-Feinschliff in Phase 2.

- [ ] **Step 11.2: Flag-Switch in `PricingSection.tsx`** — Imports ergänzen und Funktionskopf ändern:

```tsx
import { subscriptionsLive } from '@/lib/entitlements'
import SubscriptionPricing from './SubscriptionPricing'
```

und als erste Zeile im Komponenten-Body von `PricingSection`:

```tsx
  if (subscriptionsLive()) return <SubscriptionPricing />
```

- [ ] **Step 11.3: Verifizieren**

Run: `npx tsc --noEmit && npm run lint`
Dann visuell: `NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=true PORT=3100 npm run dev` → `http://localhost:3100/#preise` zeigt 3 Abo-Karten + Einzelanalyse-Leiste; ohne Flag die alten 3 Pakete.

- [ ] **Step 11.4: Commit**

```bash
git add src/components/landing/SubscriptionPricing.tsx src/components/landing/PricingSection.tsx
git commit -m "feat: Abo-Pricing-Sektion mit M/J-Toggle hinter Launch-Flag"
```

---

### Task 12: Abo-Verwaltung im Dashboard

**Files:**
- Modify: `src/components/subscription/CheckoutButton.tsx`
- Create: `src/components/subscription/PlanManager.tsx`
- Modify: `src/app/dashboard/subscription/page.tsx`

- [ ] **Step 12.1: `CheckoutButton` erweitern** — Props-Interface und `handleCheckout` ersetzen (Rest der Datei bleibt):

```tsx
interface Props {
  plan: string
  label: string
  disabled?: boolean
  /** true = helle Variante für dunkle Karten */
  light?: boolean
  /** Kaufart: Legacy-Pack (default), Abo oder Einzelanalyse zum Plan-Preis */
  kind?: 'pack' | 'subscription' | 'analysis'
  /** nur für kind='subscription' */
  interval?: 'month' | 'year'
}

export default function CheckoutButton({ plan, label, disabled, light, kind = 'pack', interval }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  async function handleCheckout() {
    if (!consent) {
      setError('Bitte stimmen Sie der sofortigen Ausführung zu.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          kind === 'pack' ? { plan, consent } : { kind, plan, interval, consent },
        ),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Checkout')
      setLoading(false)
    }
  }
```

Zusätzlich den Checkbox-Text dynamisch machen — das bestehende `<span>…Widerrufsrecht verliere.</span>` ersetzen durch:

```tsx
        <span>
          {kind === 'subscription'
            ? 'Ich verlange ausdrücklich, dass mit der Bereitstellung des Dienstes vor Ablauf der Widerrufsfrist begonnen wird. Bei Widerruf zahle ich Wertersatz für bereits erbrachte Leistungen.'
            : 'Ich stimme ausdrücklich zu, dass mit der Ausführung sofort begonnen wird, und bestätige, dass ich mit Beginn der Ausführung mein Widerrufsrecht verliere.'}
        </span>
```

- [ ] **Step 12.2: `PlanManager.tsx`** (komplette Datei):

```tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CheckoutButton from '@/components/subscription/CheckoutButton'
import PortalButton from '@/components/subscription/PortalButton'
import { SUBSCRIPTION_PLANS } from '@/lib/plans'

interface Props {
  planId: 'free' | 'starter' | 'business' | 'premium'
  status: string
  billingInterval: string | null
  /** ISO-Datum des Periodenendes (Verlängerung/Trial-Ende), null wenn unbekannt */
  periodEnd: string | null
  analysisPriceCents: number
  credits: number
  hasStripeCustomer: boolean
}

const TIERS = [SUBSCRIPTION_PLANS.starter, SUBSCRIPTION_PLANS.business, SUBSCRIPTION_PLANS.premium]

function euro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE')
}

export default function PlanManager({
  planId,
  status,
  billingInterval,
  periodEnd,
  analysisPriceCents,
  credits,
  hasStripeCustomer,
}: Props) {
  const [interval, setInterval] = useState<'month' | 'year'>(
    billingInterval === 'year' ? 'year' : 'month',
  )
  const searchParams = useSearchParams()
  const showUpgradeBanner = searchParams.get('upgrade') === '1'
  const justSubscribed = searchParams.get('subscribed') === '1'

  const currentPlan = planId !== 'free' ? SUBSCRIPTION_PLANS[planId] : null
  const endLabel = periodEnd ? new Date(periodEnd).toLocaleDateString('de-DE') : null

  return (
    <div>
      {showUpgradeBanner && (
        <div className="mb-6 rounded-xl border border-au-gold/40 bg-au-gold/10 p-4 text-sm text-[#0E1A33]">
          Diese Funktion ist Teil des Profitora-Abos. Wählen Sie unten einen Tarif — 14 Tage kostenlos testen.
        </div>
      )}
      {justSubscribed && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Abo abgeschlossen — willkommen an Bord! Ihr Cockpit ist jetzt freigeschaltet.
        </div>
      )}
      {status === 'past_due' && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Ihre letzte Zahlung ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode unten im Kundenportal.
        </div>
      )}

      {/* Aktueller Plan */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#0D1630] rounded-xl p-6 text-white">
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Ihr Tarif</p>
          <p className="text-2xl font-bold">{currentPlan ? currentPlan.name : 'Kein Abo'}</p>
          <p className="text-white/40 text-xs mt-1">
            {status === 'trialing' && endLabel
              ? `Testphase bis ${endLabel}`
              : currentPlan && endLabel
                ? `Verlängert sich am ${endLabel}`
                : 'Cockpit & günstige Analysen gibt es im Abo'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Ihr Analyse-Preis</p>
          <p className="text-2xl font-bold text-gray-900">{euro(analysisPriceCents)} €</p>
          <p className="text-gray-400 text-xs mt-1">
            {status === 'trialing'
              ? 'Im Testzeitraum gilt der Einzelpreis'
              : currentPlan
                ? 'statt 2.490 € ohne Abo'
                : 'pro Analyse (Einzelkauf)'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Analyse-Guthaben</p>
          <p className="text-2xl font-bold text-gray-900">{credits}</p>
          <p className="text-gray-400 text-xs mt-1">{credits > 0 ? 'Bereit zum Starten' : 'Kein Guthaben'}</p>
        </div>
      </div>

      {/* Analyse kaufen */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">KI-Analyse kaufen</p>
          <p className="text-gray-500 text-xs mt-1">
            Vollständiger 10-Abschnitt-Bericht mit Sparpotenzialen in Euro — {euro(analysisPriceCents)} € einmalig.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <CheckoutButton kind="analysis" plan="analysis" label={`Analyse für ${euro(analysisPriceCents)} € kaufen`} />
        </div>
      </div>

      {/* Tarife */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{currentPlan ? 'Tarif wechseln' : 'Abo abschließen'}</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInterval('month')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${interval === 'month' ? 'bg-[#0D1630] text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${interval === 'year' ? 'bg-[#0D1630] text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Jährlich −20 %
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {TIERS.map((tier) => {
          const cents = interval === 'year' ? tier.priceYearlyPerMonthCents : tier.priceMonthlyCents
          const isCurrent = currentPlan?.id === tier.id
          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-6 ${tier.highlight ? 'border-[#0D1630] bg-[#0D1630] text-white shadow-lg' : 'border-gray-200 bg-white'}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${tier.highlight ? 'text-au-gold' : 'text-gray-500'}`}>
                {tier.name}
              </p>
              <p className={`text-[11px] mb-3 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>{tier.tagline}</p>
              <p className={`text-2xl font-black mb-1 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                {euro(cents)} € <span className="text-sm font-semibold">/ Monat</span>
              </p>
              <p className={`text-xs mb-4 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                {interval === 'year' ? 'bei jährlicher Zahlung' : 'monatlich kündbar'} · Analysen {euro(tier.analysisPriceCents)} €
              </p>
              <ul className="space-y-1.5 mb-5">
                {tier.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                      <path d="M2 6l3 3 5-5" stroke={tier.highlight ? '#C9A84C' : '#1a2744'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={tier.highlight ? 'text-white/70' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className={`text-xs text-center font-semibold py-2.5 rounded-lg ${tier.highlight ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-500'}`}>
                  Ihr aktueller Tarif
                </div>
              ) : currentPlan ? (
                // Tarifwechsel eines laufenden Abos läuft über das Stripe-Portal
                // (Proration übernimmt Stripe) — kein zweites Abo anlegen.
                <PortalButton />
              ) : (
                <CheckoutButton
                  kind="subscription"
                  plan={tier.id}
                  interval={interval}
                  label="14 Tage kostenlos testen"
                  light={tier.highlight}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Verwaltung + Kündigung (§ 312k BGB: gut sichtbarer Kündigungsweg) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Zahlungen, Rechnungen & Kündigung</p>
            <p className="text-gray-500 text-xs mt-1">
              Zahlungsmethode ändern, Rechnungen herunterladen oder das Abo mit einem Klick kündigen —
              Kündigung wirkt zum Ende der laufenden Periode.
            </p>
          </div>
          {hasStripeCustomer ? <PortalButton /> : <span className="text-xs text-gray-400">Noch kein Kauf</span>}
        </div>
        {currentPlan && hasStripeCustomer && (
          <p className="text-xs text-gray-400 mt-3">
            Verträge hier kündigen: Über „Abo & Rechnungen verwalten" → „Abo kündigen".
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 12.3: `subscription/page.tsx` umbauen** — Datei komplett ersetzen:

```tsx
import { Suspense } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import CheckoutButton from '@/components/subscription/CheckoutButton'
import PortalButton from '@/components/subscription/PortalButton'
import PlanManager from '@/components/subscription/PlanManager'
import { CREDIT_PACKS } from '@/lib/plans'
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'

const PACKS = Object.values(CREDIT_PACKS)

export default async function SubscriptionPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')
  const m = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  const sub = m ? await db.subscription.findUnique({ where: { organizationId: m.organizationId } }) : null

  const credits = sub?.analysisCredits ?? 0
  const used = sub?.usedAnalysesThisMonth ?? 0
  const purchases = m
    ? await db.stripePurchase.findMany({
        where: { organizationId: m.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    : []

  // ── Neues Abo-Modell (Launch-Flag) ──────────────────────────────────────────
  if (subscriptionsLive()) {
    const ent = getEntitlements(sub)
    return (
      <DashboardLayout>
        <div className="dash-page">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Abo & Analysen</h1>
          <p className="text-gray-500 text-sm mb-8">
            Ihr Tarif, Ihre Analysen und Ihre Rechnungen — alles an einem Ort.
          </p>
          <Suspense>
            <PlanManager
              planId={ent.planId}
              status={sub?.status ?? 'active'}
              billingInterval={sub?.billingInterval ?? null}
              periodEnd={sub?.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null}
              analysisPriceCents={ent.analysisPriceCents}
              credits={credits}
              hasStripeCustomer={Boolean(sub?.stripeCustomerId)}
            />
          </Suspense>

          {purchases.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6">
              <p className="font-semibold text-gray-900 text-sm mb-3">Ihre Einmalkäufe</p>
              <div className="space-y-2">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-700">{p.credits} Analyse{p.credits === 1 ? '' : 'n'} ({p.pack})</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('de-DE')} · {(p.amountCents / 100).toLocaleString('de-DE')} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // ── Legacy-Ansicht (Credit-Pakete), unverändert bis zum Launch ──────────────
  return (
    <DashboardLayout>
      {/* … bisheriges JSX der Datei ab `<div className="dash-page">` 1:1 hier belassen … */}
    </DashboardLayout>
  )
}
```

**Wichtig:** Im Legacy-Zweig das komplette bisherige JSX (Status-Karten, Packs-Grid, Käufe, Stripe-Verwaltung — heutige Zeilen 29–124) unverändert übernehmen, nicht neu schreiben.

- [ ] **Step 12.4: Verifizieren**

Run: `npx tsc --noEmit && npm run lint`
Dann visuell mit Flag (`NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=true PORT=3100 npm run dev`): `/dashboard/subscription` zeigt Tarif-Karten, Analyse-Kauf-Box, Kündigungshinweis; ohne Flag exakt die alte Seite.

- [ ] **Step 12.5: Commit**

```bash
git add src/components/subscription/CheckoutButton.tsx src/components/subscription/PlanManager.tsx src/app/dashboard/subscription/page.tsx
git commit -m "feat: Abo-Verwaltung mit Tarifwechsel, Analyse-Kauf und Kündigungsweg (§ 312k)"
```

---

### Task 13: Envs, Stripe-Prices (Test-Modus), Doku

**Files:**
- Modify: `.env.example`

- [ ] **Step 13.1: `.env.example` ergänzen** (an den Stripe-Block anhängen):

```bash
# ── Abo-Modell (Phase 1) ──────────────────────────────────────────────────────
# Launch-Schalter: erst auf "true", wenn Phase 2 (Finanzen-Ausbau) fertig ist.
NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=false

# Abo-Preise (Stripe Price-IDs, recurring)
STRIPE_PRICE_STARTER_MONTHLY=   # 149,00 €/Monat
STRIPE_PRICE_STARTER_YEARLY=    # 1.428,00 €/Jahr (119 €/Monat-Äquivalent)
STRIPE_PRICE_BUSINESS_MONTHLY=  # 299,00 €/Monat
STRIPE_PRICE_BUSINESS_YEARLY=   # 2.868,00 €/Jahr (239 €/Monat-Äquivalent)
STRIPE_PRICE_PREMIUM_MONTHLY=   # 599,00 €/Monat
STRIPE_PRICE_PREMIUM_YEARLY=    # 5.748,00 €/Jahr (479 €/Monat-Äquivalent)

# Analyse-Einmalpreise je Plan (Stripe Price-IDs, one-time)
STRIPE_PRICE_ANALYSIS_SOLO=     # 2.490,00 € (ohne Abo / im Trial)
STRIPE_PRICE_ANALYSIS_STARTER=  # 499,00 €
STRIPE_PRICE_ANALYSIS_BUSINESS= # 299,00 €
STRIPE_PRICE_ANALYSIS_PREMIUM=  # 199,00 €
```

- [ ] **Step 13.2: Stripe-Produkte + Prices im TEST-Modus anlegen** (Stripe CLI, `stripe login` vorausgesetzt; Live-Anlage ist ein separater Launch-Schritt):

```bash
# Produkte
stripe products create --name "Profitora Starter"  -d "metadata[app]=profitora"
stripe products create --name "Profitora Business" -d "metadata[app]=profitora"
stripe products create --name "Profitora Premium"  -d "metadata[app]=profitora"
stripe products create --name "Profitora KI-Analyse" -d "metadata[app]=profitora"

# Abo-Prices (je <PRODUKT_ID> aus der Ausgabe oben einsetzen)
stripe prices create --product <STARTER_ID>  --currency eur --unit-amount 14900  -d "recurring[interval]=month"
stripe prices create --product <STARTER_ID>  --currency eur --unit-amount 142800 -d "recurring[interval]=year"
stripe prices create --product <BUSINESS_ID> --currency eur --unit-amount 29900  -d "recurring[interval]=month"
stripe prices create --product <BUSINESS_ID> --currency eur --unit-amount 286800 -d "recurring[interval]=year"
stripe prices create --product <PREMIUM_ID>  --currency eur --unit-amount 59900  -d "recurring[interval]=month"
stripe prices create --product <PREMIUM_ID>  --currency eur --unit-amount 574800 -d "recurring[interval]=year"

# Analyse-Einmalpreise
stripe prices create --product <ANALYSE_ID> --currency eur --unit-amount 249000
stripe prices create --product <ANALYSE_ID> --currency eur --unit-amount 49900
stripe prices create --product <ANALYSE_ID> --currency eur --unit-amount 29900
stripe prices create --product <ANALYSE_ID> --currency eur --unit-amount 19900
```

Die 10 `price_…`-IDs in `.env.local` unter den Env-Namen aus Step 13.1 eintragen (nur lokal, Test-Modus). **Vercel-Envs (Live-IDs) kommen erst beim Launch** — zusammen mit `NEXT_PUBLIC_SUBSCRIPTIONS_LIVE`.

- [ ] **Step 13.3: Commit**

```bash
git add .env.example
git commit -m "docs: Env-Vorlage für Abo-Preise + Launch-Flag"
```

---

### Task 14: End-to-End-Verifikation (Stripe-Test-Modus)

**Files:** keine (nur Verifikation)

- [ ] **Step 14.1: Statische Checks**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: alles grün.

- [ ] **Step 14.2: Webhook-Forwarding starten** (eigenes Terminal):

```bash
stripe listen --forward-to localhost:3100/api/stripe/webhook
```

Ausgegebenes `whsec_…` kopieren.

- [ ] **Step 14.3: Dev-Server mit Test-Keys + Flag starten** (Test-Keys NUR als Shell-Env, `.env.local` mit Live-Keys nicht anfassen):

```bash
STRIPE_SECRET_KEY=sk_test_… STRIPE_WEBHOOK_SECRET=whsec_… \
NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=true PORT=3100 npm run dev
```

- [ ] **Step 14.4: E2E-Checkliste durchklicken**

1. Neuen Test-Account registrieren → `/dashboard/costs` aufrufen → Redirect auf `/dashboard/subscription?upgrade=1` mit Banner. ✅ Gating
2. Business monatlich abschließen (Testkarte `4242 4242 4242 4242`, beliebige Zukunft/CVC) → zurück mit `?subscribed=1`-Banner. ✅ Checkout
3. DB prüfen (`npx prisma studio`): `Subscription.planName='business'`, `status='trialing'`, `billingInterval='month'`, `stripeSubscriptionId` gesetzt. ✅ Webhook
4. `/dashboard/costs` lädt jetzt. ✅ Entitlement
5. Analyse ohne Guthaben starten → 402 mit `analysisPriceCents: 249000` (Trial → Solo-Preis). ✅ Trial-Schutz
6. Trial beenden: `stripe subscriptions update <sub_id> -d "trial_end=now"` → Webhook `customer.subscription.updated` → `status='active'` → Analyse-402 zeigt jetzt `29900`. ✅ Preisstaffel
7. Analyse-Kauf-Box auf `/dashboard/subscription` → Checkout zeigt 299,00 € → zahlen → Webhook schreibt Credit (+1), `planName` bleibt `'business'`. ✅ Einmalkauf
8. „Abo & Rechnungen verwalten" öffnet das Stripe-Portal; Kündigung dort → Webhook `customer.subscription.deleted` → `planName='free'`, Cockpit wieder gesperrt. ✅ Kündigungsweg
9. Server ohne Flag neu starten → Landing zeigt alte Pakete, `/dashboard/costs` für free erreichbar, Subscription-Seite = Legacy. ✅ Flag-Off unverändert
10. Legacy-Grandfathering: bei einem Bestands-Datensatz (`planName='premium'`, `stripeSubscriptionId=null`, `analysisCredits>0`) mit Flag an: kein Cockpit, aber Analyse-Start verbraucht Credit normal. ✅ resolvePlanId-Guard

- [ ] **Step 14.5: Abschluss-Commit (falls Fixes anfielen) + Plan-Checkboxen aktualisieren**

```bash
git add -A && git commit -m "fix: Feinschliff aus E2E-Verifikation Phase 1"
```

---

## Nicht in Phase 1 (bewusst)

- Register-Flow mit `?abo=`-Durchreichung zum Subscription-Checkout (Launch-Feinschliff, Phase 2)
- `assistantMsgsThisMonth`-Monatsreset (Phase-2-Cron)
- DashboardLayout-Navigation mit Schloss-Icons für gesperrte Module (Phase 2, mit Cockpit-Startseite)
- Live-Stripe-Prices + Vercel-Envs + Flag-Umlegung (Launch-Checkliste, nach Phase 2)
- AGB/Widerrufsbelehrung für Abos (Cousin), USt-Klärung (Steuerberater)

## Empfohlene Plugins

Bereits installiert und im Einsatz für diesen Plan: **stripe** (Prices anlegen, Webhook-Debug), **vercel** (Envs/Deploy), **context7** (Stripe-Basil-API-Details), **chrome-devtools/playwright** (E2E-Checkliste 14.4). Keine Neuinstallation nötig.
