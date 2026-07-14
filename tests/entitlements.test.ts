import { describe, it, expect } from 'vitest'
import {
  resolvePlanId,
  getEntitlements,
  analysisPriceEnvFor,
  canUseIncludedAnalysis,
  startOfQuarter,
  type SubscriptionState,
} from '@/lib/entitlements'

function sub(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    planName: 'free',
    status: 'active',
    stripeSubscriptionId: null,
    analysisCredits: 0,
    lastIncludedAnalysisAt: null,
    assistantMsgsThisMonth: 0,
    ...overrides,
  }
}

describe('resolvePlanId', () => {
  it('null/free → free', () => {
    expect(resolvePlanId(null)).toBe('free')
    expect(resolvePlanId(sub())).toBe('free')
  })
  it('Legacy-Credit-Käufer: planName premium OHNE stripeSubscriptionId → free', () => {
    expect(resolvePlanId(sub({ planName: 'premium' }))).toBe('free')
  })
  it('echtes Premium-Abo → premium', () => {
    expect(resolvePlanId(sub({ planName: 'premium', stripeSubscriptionId: 'sub_1' }))).toBe('premium')
  })
  it('gekündigt/abgelaufen → free', () => {
    expect(resolvePlanId(sub({ planName: 'starter', status: 'cancelled' }))).toBe('free')
    expect(resolvePlanId(sub({ planName: 'business', status: 'incomplete_expired' }))).toBe('free')
  })
  it('trialing und past_due behalten den Plan', () => {
    expect(resolvePlanId(sub({ planName: 'business', status: 'trialing' }))).toBe('business')
    expect(resolvePlanId(sub({ planName: 'starter', status: 'past_due' }))).toBe('starter')
  })
  it('unbekannter planName → free', () => {
    expect(resolvePlanId(sub({ planName: 'standard' }))).toBe('free')
  })
})

describe('getEntitlements', () => {
  it('free: kein Cockpit, Analyse 2.490 €, kein Assistent', () => {
    const e = getEntitlements(null)
    expect(e.planId).toBe('free')
    expect(e.cockpit).toBe(false)
    expect(e.analysisPriceCents).toBe(249000)
    expect(e.assistantMsgsPerMonth).toBe(0)
  })
  it('starter: Cockpit ja, Schichtplan nein, Analyse 499 €', () => {
    const e = getEntitlements(sub({ planName: 'starter' }))
    expect(e.cockpit).toBe(true)
    expect(e.shifts).toBe(false)
    expect(e.autoReport).toBe('short')
    expect(e.analysisPriceCents).toBe(49900)
    expect(e.maxEmployees).toBe(10)
  })
  it('business: Schichtplan/Alerts/DATEV/Maßnahmen, Analyse 299 €', () => {
    const e = getEntitlements(sub({ planName: 'business' }))
    expect(e.shifts).toBe(true)
    expect(e.alerts).toBe(true)
    expect(e.datevExport).toBe(true)
    expect(e.measures).toBe(true)
    expect(e.analysisPriceCents).toBe(29900)
  })
  it('premium: Forecast + Inklusivanalyse, Analyse 199 €', () => {
    const e = getEntitlements(sub({ planName: 'premium', stripeSubscriptionId: 'sub_1' }))
    expect(e.forecast).toBe(true)
    expect(e.includedAnalysesPerQuarter).toBe(1)
    expect(e.analysisPriceCents).toBe(19900)
  })
  it('Trial-Schutz: im Trial kostet die Analyse den Solo-Preis', () => {
    const e = getEntitlements(sub({ planName: 'business', status: 'trialing' }))
    expect(e.cockpit).toBe(true)
    expect(e.analysisPriceCents).toBe(249000)
  })
})

describe('analysisPriceEnvFor', () => {
  it('free/Trial → SOLO-Env, aktive Tiers → eigene Env', () => {
    expect(analysisPriceEnvFor(null)).toBe('STRIPE_PRICE_ANALYSIS_SOLO')
    expect(analysisPriceEnvFor(sub({ planName: 'business', status: 'trialing' }))).toBe('STRIPE_PRICE_ANALYSIS_SOLO')
    expect(analysisPriceEnvFor(sub({ planName: 'business' }))).toBe('STRIPE_PRICE_ANALYSIS_BUSINESS')
  })
})

describe('startOfQuarter', () => {
  it('liefert Quartalsanfänge', () => {
    expect(startOfQuarter(new Date(2026, 0, 15))).toEqual(new Date(2026, 0, 1))
    expect(startOfQuarter(new Date(2026, 2, 31))).toEqual(new Date(2026, 0, 1))
    expect(startOfQuarter(new Date(2026, 3, 1))).toEqual(new Date(2026, 3, 1))
    expect(startOfQuarter(new Date(2026, 11, 24))).toEqual(new Date(2026, 9, 1))
  })
})

describe('canUseIncludedAnalysis', () => {
  const now = new Date(2026, 6, 14) // 14.07.2026 → Q3 beginnt 01.07.
  it('premium aktiv ohne bisherige Nutzung → ja', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'premium', stripeSubscriptionId: 's' }), now)).toBe(true)
  })
  it('bereits in diesem Quartal genutzt → nein', () => {
    expect(
      canUseIncludedAnalysis(
        sub({ planName: 'premium', stripeSubscriptionId: 's', lastIncludedAnalysisAt: new Date(2026, 6, 2) }),
        now,
      ),
    ).toBe(false)
  })
  it('Nutzung im Vorquartal → wieder ja (nicht kumulierbar)', () => {
    expect(
      canUseIncludedAnalysis(
        sub({ planName: 'premium', stripeSubscriptionId: 's', lastIncludedAnalysisAt: new Date(2026, 5, 30) }),
        now,
      ),
    ).toBe(true)
  })
  it('im Trial → nein (Exploit-Schutz)', () => {
    expect(
      canUseIncludedAnalysis(sub({ planName: 'premium', stripeSubscriptionId: 's', status: 'trialing' }), now),
    ).toBe(false)
  })
  it('business → nein', () => {
    expect(canUseIncludedAnalysis(sub({ planName: 'business', stripeSubscriptionId: 's' }), now)).toBe(false)
  })
})
