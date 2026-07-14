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
