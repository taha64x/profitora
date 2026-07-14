import { describe, it, expect } from 'vitest'
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionPlan,
  ANALYSIS_PRICE_ENVS,
  ANALYSIS_SOLO_PRICE_CENTS,
} from '@/lib/plans'

describe('SUBSCRIPTION_PLANS', () => {
  it('hat drei Tiers mit korrekten Preisen (Cent)', () => {
    expect(SUBSCRIPTION_PLANS.starter.priceMonthlyCents).toBe(14900)
    expect(SUBSCRIPTION_PLANS.starter.priceYearlyPerMonthCents).toBe(11900)
    expect(SUBSCRIPTION_PLANS.business.priceMonthlyCents).toBe(29900)
    expect(SUBSCRIPTION_PLANS.business.priceYearlyPerMonthCents).toBe(23900)
    expect(SUBSCRIPTION_PLANS.premium.priceMonthlyCents).toBe(59900)
    expect(SUBSCRIPTION_PLANS.premium.priceYearlyPerMonthCents).toBe(47900)
    expect(SUBSCRIPTION_PLANS.business.highlight).toBe(true)
  })

  it('nennt für jeden Tier eigene Stripe-Env-Vars (M/J, eindeutig)', () => {
    const envs = Object.values(SUBSCRIPTION_PLANS).flatMap((p) => [
      p.stripePriceEnvMonthly,
      p.stripePriceEnvYearly,
    ])
    expect(new Set(envs).size).toBe(6)
    envs.forEach((e) => expect(e).toMatch(/^STRIPE_PRICE_/))
  })
})

describe('getSubscriptionPlan', () => {
  it('löst gültige IDs auf und lehnt Rest ab', () => {
    expect(getSubscriptionPlan('business')?.id).toBe('business')
    expect(getSubscriptionPlan('single')).toBeNull()
    expect(getSubscriptionPlan(null)).toBeNull()
    expect(getSubscriptionPlan('free')).toBeNull()
  })
})

describe('Analyse-Preise', () => {
  it('Solo kostet 2.490 €, jede Stufe hat eine Price-Env', () => {
    expect(ANALYSIS_SOLO_PRICE_CENTS).toBe(249000)
    expect(ANALYSIS_PRICE_ENVS.free).toBe('STRIPE_PRICE_ANALYSIS_SOLO')
    expect(ANALYSIS_PRICE_ENVS.starter).toBe('STRIPE_PRICE_ANALYSIS_STARTER')
    expect(ANALYSIS_PRICE_ENVS.business).toBe('STRIPE_PRICE_ANALYSIS_BUSINESS')
    expect(ANALYSIS_PRICE_ENVS.premium).toBe('STRIPE_PRICE_ANALYSIS_PREMIUM')
  })
})
