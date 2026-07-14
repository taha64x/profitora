import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY nicht gesetzt')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {} as any)
  }
  return _stripe
}

import {
  CREDIT_PACKS,
  getCreditPack,
  SUBSCRIPTION_PLANS,
  type BillingInterval,
  type CreditPack,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from '@/lib/plans'

export { CREDIT_PACKS, getCreditPack }

/** Stripe-Price-ID eines Packs aus der Env auflösen ('' wenn nicht konfiguriert) */
export function priceIdForPack(pack: CreditPack): string {
  return process.env[pack.stripePriceEnv] ?? ''
}

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
