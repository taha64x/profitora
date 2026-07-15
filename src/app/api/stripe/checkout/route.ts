import { NextResponse } from 'next/server'
import { getStripe, priceIdForSubscription } from '@/lib/stripe'
import { resolveCheckoutTarget } from '@/lib/checkout-target'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const body = await req.json()

    // Pflicht (§356 Abs. 4/5 BGB): ausdrückliche Zustimmung zur sofortigen Ausführung,
    // sonst kein Kauf. Wird unten als Nachweis in den Session-Metadaten gespeichert.
    if (body?.consent !== true) {
      return NextResponse.json(
        { error: 'Bitte stimmen Sie der sofortigen Ausführung zu, um fortzufahren.' },
        { status: 400 },
      )
    }
    const consentAt = new Date().toISOString()

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: {
        organization: { include: { subscription: true } },
      },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const org = membership.organization
    const target = resolveCheckoutTarget(body ?? {}, org.subscription)
    if (target.kind === 'invalid') {
      return NextResponse.json({ error: target.reason }, { status: 400 })
    }

    const userRecord = await db.user.findUnique({ where: { id: user.userId } })
    let customerId = org.subscription?.stripeCustomerId ?? undefined

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: userRecord!.email,
        name: org.name,
        metadata: { organizationId: org.id },
      })
      customerId = customer.id

      await db.subscription.upsert({
        where: { organizationId: org.id },
        create: {
          organizationId: org.id,
          stripeCustomerId: customerId,
          planName: 'free',
        },
        update: { stripeCustomerId: customerId },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // ── Abo-Kauf: Subscription-Checkout mit 14 Tagen Trial ──────────────────────
    if (target.kind === 'subscription') {
      const priceId = priceIdForSubscription(target.plan, target.interval)
      if (!priceId) return NextResponse.json({ error: 'Stripe Price ID nicht konfiguriert.' }, { status: 500 })

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        billing_address_collection: 'required',
        success_url: `${appUrl}/dashboard/subscription?subscribed=1`,
        cancel_url: `${appUrl}/dashboard/subscription`,
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            organizationId: org.id,
            subscriptionPlan: target.plan.id,
            interval: target.interval,
          },
        },
        metadata: {
          organizationId: org.id,
          subscriptionPlan: target.plan.id,
          interval: target.interval,
          consent_immediate_execution: 'true',
          consent_at: consentAt,
        },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Einmalkauf: Legacy-Pack oder Einzelanalyse zum Plan-Preis ───────────────
    const priceId =
      target.kind === 'pack'
        ? process.env[target.pack.stripePriceEnv] ?? ''
        : process.env[target.priceEnv] ?? ''
    if (!priceId) return NextResponse.json({ error: 'Stripe Price ID nicht konfiguriert.' }, { status: 500 })

    const packId = target.kind === 'pack' ? target.pack.id : 'analysis'
    const credits = target.kind === 'pack' ? target.pack.credits : 1

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Rechnungsadresse ist Pflicht: § 14 Abs. 4 UStG verlangt Name + Anschrift
      // des Leistungsempfängers auf Rechnungen über 250 €.
      billing_address_collection: 'required',
      success_url: `${appUrl}/dashboard/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/subscription`,
      metadata: {
        organizationId: org.id,
        pack: packId,
        credits: String(credits),
        ...(target.kind === 'analysis' ? { planAtPurchase: target.planId } : {}),
        consent_immediate_execution: 'true',
        consent_at: consentAt,
      },
      // Verwendungszweck auf der Kartenabrechnung: Konto läuft auf ScopeTradeAI,
      // Konto-Präfix PROFITORA + Suffix ergibt „PROFITORA* ANALYSE" (max. 22 Zeichen)
      payment_intent_data: {
        statement_descriptor_suffix: 'ANALYSE',
        metadata: { organizationId: org.id, pack: packId, credits: String(credits) },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Checkout konnte nicht erstellt werden.' }, { status: 500 })
  }
}
