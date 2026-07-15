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
} as unknown as NodeJS.ProcessEnv

describe('priceIdForSubscription', () => {
  it('löst Plan+Intervall zur Price-ID auf', () => {
    expect(priceIdForSubscription(SUBSCRIPTION_PLANS.business, 'month', env)).toBe('price_bm')
    expect(priceIdForSubscription(SUBSCRIPTION_PLANS.premium, 'year', env)).toBe('price_py')
  })
  it('liefert leeren String ohne Konfiguration', () => {
    expect(priceIdForSubscription(SUBSCRIPTION_PLANS.starter, 'month', {} as unknown as NodeJS.ProcessEnv)).toBe('')
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
