import { describe, it, expect } from 'vitest'
import { resolveCheckoutTarget } from '@/lib/checkout-target'

const businessSub = { planName: 'business', status: 'active', stripeSubscriptionId: 'sub_1' }
const trialSub = { planName: 'business', status: 'trialing', stripeSubscriptionId: 'sub_1' }

describe('resolveCheckoutTarget', () => {
  it('Legacy-Pack-Kauf bleibt funktionsfähig', () => {
    const t = resolveCheckoutTarget({ plan: 'triple' }, null)
    expect(t.kind).toBe('pack')
    if (t.kind === 'pack') expect(t.pack.credits).toBe(3)
  })
  it("Alias 'premium' → Einzel-Pack (alte Links)", () => {
    const t = resolveCheckoutTarget({ plan: 'premium' }, null)
    expect(t.kind).toBe('pack')
  })
  it('Abo-Kauf mit Intervall', () => {
    const t = resolveCheckoutTarget({ kind: 'subscription', plan: 'starter', interval: 'year' }, null)
    expect(t).toMatchObject({ kind: 'subscription', interval: 'year' })
  })
  it('Abo mit unbekanntem Tarif → invalid', () => {
    expect(resolveCheckoutTarget({ kind: 'subscription', plan: 'gold' }, null).kind).toBe('invalid')
  })
  it('Analyse-Kauf: free zahlt Solo-Preis', () => {
    const t = resolveCheckoutTarget({ kind: 'analysis' }, null)
    expect(t).toMatchObject({ kind: 'analysis', priceEnv: 'STRIPE_PRICE_ANALYSIS_SOLO', amountCents: 249000 })
  })
  it('Analyse-Kauf: Business zahlt 299 €', () => {
    const t = resolveCheckoutTarget({ kind: 'analysis' }, businessSub)
    expect(t).toMatchObject({ priceEnv: 'STRIPE_PRICE_ANALYSIS_BUSINESS', amountCents: 29900 })
  })
  it('Analyse-Kauf im Trial → Solo-Preis (Exploit-Schutz)', () => {
    const t = resolveCheckoutTarget({ kind: 'analysis' }, trialSub)
    expect(t).toMatchObject({ priceEnv: 'STRIPE_PRICE_ANALYSIS_SOLO', amountCents: 249000 })
  })
  it('Müll → invalid', () => {
    expect(resolveCheckoutTarget({ plan: 'quatsch' }, null).kind).toBe('invalid')
    expect(resolveCheckoutTarget({}, null).kind).toBe('invalid')
  })
})
