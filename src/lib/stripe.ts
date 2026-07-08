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

import { CREDIT_PACKS, getCreditPack, type CreditPack } from '@/lib/plans'

export { CREDIT_PACKS, getCreditPack }

/** Stripe-Price-ID eines Packs aus der Env auflösen ('' wenn nicht konfiguriert) */
export function priceIdForPack(pack: CreditPack): string {
  return process.env[pack.stripePriceEnv] ?? ''
}
