import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: { include: { subscription: true } } },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const customerId = membership.organization.subscription?.stripeCustomerId
    if (!customerId) {
      return NextResponse.json({ error: 'Kein aktives Stripe-Abo gefunden.' }, { status: 400 })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/portal]', err)
    return NextResponse.json({ error: 'Customer Portal konnte nicht geöffnet werden.' }, { status: 500 })
  }
}
