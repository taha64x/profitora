// Zentrale Tarif-Konfiguration – einzige Quelle für Preise, Limits und KI-Modelle.
// Wird von Landing-PricingSection, Subscription-Seite, /api/analyze und /api/assistant genutzt.
//
// Bezahlmodell: JEDE Analyse kostet – 1 Analyse = 1 Credit. Credits werden als
// Einzelanalyse oder rabattiertes Paket gekauft (Einmalzahlung, kein Abo) und
// verfallen nicht. Ein kostenloser Analyse-Lauf existiert nicht mehr; der
// Gratis-Account bietet Finanztracking, Beispielbericht und begrenzten Assistent.

export type PlanId = 'free' | 'premium'

export interface PlanConfig {
  id: PlanId
  name: string
  /** Monatspreis in EUR, null = kein Abo (Einmalkauf oder kostenlos) */
  priceMonthly: number | null
  /** Einmalpreis in EUR, nur für Einzelkauf */
  priceOnce: number | null
  /** Analysen pro Monat, null = unbegrenzt (Credits regeln die Menge) */
  analysisLimit: number | null
  /** maximale Analysetiefe */
  maxAccuracy: 'schnellcheck' | 'standard' | 'komplett'
  /** true = nur Teaser-Vorschau, voller Bericht + Sparpotenziale gesperrt */
  teaser: boolean
  /** KI-Assistent: Fragen pro Monat, null = unbegrenzt */
  assistantLimit: number | null
  /** Claude-Modell für Analysen und Assistent */
  aiModel: string
  aiModelLabel: string
  /** Env-Variable mit der Stripe-Price-ID */
  stripePriceEnv: string | null
  highlight: boolean
  features: string[]
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratis-Account',
    priceMonthly: 0,
    priceOnce: null,
    analysisLimit: 0,
    maxAccuracy: 'schnellcheck',
    teaser: true,
    assistantLimit: 5,
    aiModel: 'claude-haiku-4-5-20251001',
    aiModelLabel: 'Claude Haiku',
    stripePriceEnv: null,
    highlight: false,
    features: [
      'Finanztracking (Kosten & Einnahmen) unbegrenzt',
      'Beispielbericht ansehen',
      'KI-Assistent zum Kennenlernen (5 Fragen/Monat)',
      'Analysen einzeln oder im Paket freischalten',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Komplettanalyse',
    priceMonthly: null,
    priceOnce: 1990,
    analysisLimit: null,
    maxAccuracy: 'komplett',
    teaser: false,
    assistantLimit: null,
    aiModel: 'claude-opus-4-8',
    aiModelLabel: 'Claude Opus',
    stripePriceEnv: 'STRIPE_PRICE_PREMIUM',
    highlight: true,
    features: [
      'Vollständige KI-Tiefenanalyse (10-Abschnitt-Bericht)',
      'Alle Branchen-Kennzahlen mit Soll-Ist-Vergleich',
      'Konkrete Sparpotenziale in Euro + Handlungsempfehlungen',
      'Wesentlichkeits- & Plausibilitätsprüfung nach Prüfer-Methodik',
      'Bestes KI-Modell: Claude Opus · PDF-Export',
      'KI-Assistent unbegrenzt · einmalig, kein Abo',
    ],
  },
}

// ─── Analyse-Pakete (Credits) ─────────────────────────────────────────────────
// LEGACY: Wird zum Abo-Launch (NEXT_PUBLIC_SUBSCRIPTIONS_LIVE=true) von
// SUBSCRIPTION_PLANS + Einzelanalyse abgelöst. Definitionen bleiben erhalten,
// damit Webhook-Replays, alte Checkout-Links und Kauf-Historie funktionieren.

export type CreditPackId = 'single' | 'triple' | 'five'

export interface CreditPack {
  id: CreditPackId
  name: string
  /** Anzahl Analysen (Credits), die der Kauf gutschreibt */
  credits: number
  /** Gesamtpreis in EUR (einmalig) */
  priceOnce: number
  /** Env-Variable mit der Stripe-Price-ID */
  stripePriceEnv: string
  highlight: boolean
  tag: string
  features: string[]
}

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  single: {
    id: 'single',
    name: 'Einzelanalyse',
    credits: 1,
    priceOnce: 1990,
    stripePriceEnv: 'STRIPE_PRICE_PREMIUM',
    highlight: false,
    tag: '1 Analyse',
    features: PLANS.premium.features,
  },
  triple: {
    id: 'triple',
    name: '3er-Paket',
    credits: 3,
    priceOnce: 4990,
    stripePriceEnv: 'STRIPE_PRICE_PACK3',
    highlight: true,
    tag: '3 Analysen · 980 € sparen',
    features: [
      'Alles aus der Komplettanalyse',
      '3 vollständige Analysen (z. B. Quartalsvergleich)',
      'Nur 1.663 € statt 1.990 € pro Analyse',
      'Credits verfallen nicht',
    ],
  },
  five: {
    id: 'five',
    name: '5er-Paket',
    credits: 5,
    priceOnce: 6990,
    stripePriceEnv: 'STRIPE_PRICE_PACK5',
    highlight: false,
    tag: '5 Analysen · 2.960 € sparen',
    features: [
      'Alles aus der Komplettanalyse',
      '5 vollständige Analysen (z. B. Monats-Tracking)',
      'Nur 1.398 € statt 1.990 € pro Analyse',
      'Credits verfallen nicht',
    ],
  },
}

/** Pack anhand des Checkout-Parameters auflösen; 'premium' bleibt als Alias für die Einzelanalyse gültig (alte Links/Register-Flow). */
export function getCreditPack(packId: string | null | undefined): CreditPack | null {
  if (!packId) return null
  if (packId === 'premium') return CREDIT_PACKS.single
  if (packId in CREDIT_PACKS) return CREDIT_PACKS[packId as CreditPackId]
  return null
}

/** Plan anhand des in Subscription.planName gespeicherten Werts auflösen (Altwerte fallen auf free zurück) */
export function getPlan(planName: string | null | undefined): PlanConfig {
  if (planName && planName in PLANS) return PLANS[planName as PlanId]
  return PLANS.free
}

export function getModelForPlan(planName: string | null | undefined): string {
  return getPlan(planName).aiModel
}

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
