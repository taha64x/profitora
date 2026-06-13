// Zentrale Tarif-Konfiguration – einzige Quelle für Preise, Limits und KI-Modelle.
// Wird von Landing-PricingSection, Subscription-Seite, /api/analyze und /api/assistant genutzt.

export type PlanId = 'free' | 'starter' | 'business' | 'single'

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
    name: 'Free',
    priceMonthly: 0,
    priceOnce: null,
    analysisLimit: 1,
    maxAccuracy: 'schnellcheck',
    assistantLimit: 10,
    aiModel: 'claude-haiku-4-5-20251001',
    aiModelLabel: 'Claude Haiku',
    stripePriceEnv: null,
    highlight: false,
    features: [
      '1 Schnellcheck-Analyse pro Monat',
      'Finanztracking (Kosten & Einnahmen) unbegrenzt',
      'Monatsübersicht mit Gewinn-Berechnung',
      'KI-Assistent: 10 Fragen pro Monat',
      'KI-Modell: Claude Haiku',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 19,
    priceOnce: null,
    analysisLimit: 5,
    maxAccuracy: 'standard',
    assistantLimit: 200,
    aiModel: 'claude-sonnet-4-6',
    aiModelLabel: 'Claude Sonnet',
    stripePriceEnv: 'STRIPE_PRICE_STARTER',
    highlight: true,
    features: [
      '5 Analysen pro Monat (bis Standard-Tiefe)',
      'Alles aus Free',
      'Monatsvergleiche & Trend-Auswertung',
      'KI-Assistent: 200 Fragen pro Monat',
      'Analyse direkt aus Ihren Finanzdaten',
      'KI-Modell: Claude Sonnet',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    priceMonthly: 49,
    priceOnce: null,
    analysisLimit: null,
    maxAccuracy: 'komplett',
    assistantLimit: null,
    aiModel: 'claude-opus-4-8',
    aiModelLabel: 'Claude Opus',
    stripePriceEnv: 'STRIPE_PRICE_BUSINESS',
    highlight: false,
    features: [
      'Unbegrenzte Analysen inkl. Komplett-Tiefenanalyse',
      'Alles aus Starter',
      'KI-Assistent unbegrenzt',
      'PDF-Export der Berichte',
      'Bestes KI-Modell: Claude Opus',
      'Prioritäts-Support',
    ],
  },
  single: {
    id: 'single',
    name: 'Einzel-Analyse',
    priceMonthly: null,
    priceOnce: 29,
    analysisLimit: 1,
    maxAccuracy: 'komplett',
    assistantLimit: 30,
    aiModel: 'claude-opus-4-8',
    aiModelLabel: 'Claude Opus',
    stripePriceEnv: 'STRIPE_PRICE_SINGLE',
    highlight: false,
    features: [
      'Eine Komplett-Analyse ohne Abo',
      'Volle Tiefenanalyse mit Claude Opus',
      '30 Tage Zugriff auf den KI-Assistenten',
      'PDF-Export des Berichts',
      'Kein Abonnement, keine Folgekosten',
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
