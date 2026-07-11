import { NextResponse } from 'next/server'
import { getStripe, getCreditPack, priceIdForPack } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const { plan, consent } = await req.json()
    const pack = getCreditPack(plan)
    if (!pack) return NextResponse.json({ error: 'Ungültiges Analyse-Paket.' }, { status: 400 })
    const priceId = priceIdForPack(pack)
    if (!priceId) return NextResponse.json({ error: 'Stripe Price ID nicht konfiguriert.' }, { status: 500 })

    // Pflicht (§356 Abs. 4/5 BGB): ausdrückliche Zustimmung zur sofortigen Ausführung,
    // sonst kein Kauf. Wird unten als Nachweis in den Session-Metadaten gespeichert.
    if (consent !== true) {
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

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Rechnungsadresse ist Pflicht: § 14 Abs. 4 UStG verlangt Name + Anschrift
      // des Leistungsempfängers auf Rechnungen über 250 €.
      billing_address_collection: 'required',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
      metadata: {
        organizationId: org.id,
        pack: pack.id,
        credits: String(pack.credits),
        consent_immediate_execution: 'true',
        consent_at: consentAt,
      },
      // Verwendungszweck auf der Kartenabrechnung: Konto läuft auf ScopeTradeAI,
      // Konto-Präfix PROFITORA + Suffix ergibt „PROFITORA* ANALYSE" (max. 22 Zeichen)
      payment_intent_data: {
        statement_descriptor_suffix: 'ANALYSE',
        metadata: { organizationId: org.id, pack: pack.id, credits: String(pack.credits) },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Checkout konnte nicht erstellt werden.' }, { status: 500 })
  }
}
