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
}> = {
  standard: {
    priceId: process.env.STRIPE_PRICE_STANDARD ?? '',
    limit: 5,
    label: 'Standard',
  },
  tiefenanalyse: {
    priceId: process.env.STRIPE_PRICE_TIEFENANALYSE ?? '',
    limit: 15,
    label: 'Tiefenanalyse',
  },
  komplett: {
    priceId: process.env.STRIPE_PRICE_KOMPLETT ?? '',
    limit: 9999,
    label: 'Komplett',
  },
}
