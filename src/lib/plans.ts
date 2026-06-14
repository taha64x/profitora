// Zentrale Tarif-Konfiguration – einzige Quelle für Preise, Limits und KI-Modelle.
// Wird von Landing-PricingSection, Subscription-Seite, /api/analyze und /api/assistant genutzt.
//
// Modell: kostenloser Teaser (Schnellcheck mit gesperrtem Vollbericht) +
// kostenpflichtige Komplettanalyse als Premium-Einmalkauf.

export type PlanId = 'free' | 'premium'

export interface PlanConfig {
  id: PlanId
  name: string
  /** Monatspreis in EUR, null = kein Abo (Einmalkauf oder kostenlos) */
  priceMonthly: number | null
  /** Einmalpreis in EUR, nur für Einzelkauf */
  priceOnce: number | null
  /** Analysen pro Monat, null = unbegrenzt */
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
    name: 'Gratis-Schnellcheck',
    priceMonthly: 0,
    priceOnce: null,
    analysisLimit: 1,
    maxAccuracy: 'schnellcheck',
    teaser: true,
    assistantLimit: 5,
    aiModel: 'claude-haiku-4-5-20251001',
    aiModelLabel: 'Claude Haiku',
    stripePriceEnv: null,
    highlight: false,
    features: [
      'Kostenlose Vorschau Ihrer Wirtschaftlichkeit',
      'Wichtigste Kennzahl + Ergebnis-Einschätzung sichtbar',
      'Finanztracking (Kosten & Einnahmen) unbegrenzt',
      'Voller Bericht & EUR-Sparpotenziale gesperrt – erst mit Komplettanalyse',
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

/** Plan anhand des in Subscription.planName gespeicherten Werts auflösen (Altwerte fallen auf free zurück) */
export function getPlan(planName: string | null | undefined): PlanConfig {
  if (planName && planName in PLANS) return PLANS[planName as PlanId]
  return PLANS.free
}

export function getModelForPlan(planName: string | null | undefined): string {
  return getPlan(planName).aiModel
}
