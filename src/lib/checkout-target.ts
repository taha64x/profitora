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
