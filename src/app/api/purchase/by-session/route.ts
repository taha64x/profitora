export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCreditPack } from '@/lib/plans'

/**
 * Kauf-Status für die Bestätigungsseite nach dem Stripe-Checkout.
 * Der Webhook kann ein paar Sekunden hinter dem Redirect liegen –
 * die Seite pollt, bis der Kauf verbucht ist ({ found: false } solange).
 */
export async function GET(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ error: 'session_id fehlt.' }, { status: 400 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: { include: { subscription: true } } },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const purchase = await db.stripePurchase.findUnique({
      where: { stripeSessionId: sessionId },
    })

    // Nur Käufe der eigenen Organisation ausliefern.
    if (!purchase || purchase.organizationId !== membership.organizationId) {
      return NextResponse.json({ found: false })
    }

    const pack = getCreditPack(purchase.pack)
    return NextResponse.json({
      found: true,
      purchase: {
        id: purchase.id,
        packName: pack?.name ?? 'Komplettanalyse',
        credits: purchase.credits,
        amountCents: purchase.amountCents,
        invoiceNumber: purchase.invoiceNumber,
        createdAt: purchase.createdAt,
      },
      creditBalance: membership.organization.subscription?.analysisCredits ?? 0,
    })
  } catch (err) {
    console.error('[purchase/by-session]', err)
    return NextResponse.json({ error: 'Kauf konnte nicht geladen werden.' }, { status: 500 })
  }
}
