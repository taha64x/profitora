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

export const STRIPE_PLANS: Record<string, {
  priceId: string
  limit: number
  label: string
  /** 'subscription' für Abos, 'payment' für Einmalkauf */
  mode: 'subscription' | 'payment'
}> = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    limit: 5,
    label: 'Starter',
    mode: 'subscription',
  },
  business: {
    priceId: process.env.STRIPE_PRICE_BUSINESS ?? '',
    limit: 9999,
    label: 'Business',
    mode: 'subscription',
  },
  single: {
    priceId: process.env.STRIPE_PRICE_SINGLE ?? '',
    limit: 1,
    label: 'Einzel-Analyse',
    mode: 'payment',
  },
}
