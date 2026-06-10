import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  schnellcheck: 2,
  standard: 5,
  tiefenanalyse: 15,
  komplett: 9999,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPeriod(sub: any) {
  return {
    start: sub.current_period_start ? new Date(sub.current_period_start * 1000) : undefined,
    end: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook-Konfiguration fehlt.' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signatur ungültig:', err)
    return NextResponse.json({ error: 'Ungültige Signatur.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const orgId = session.metadata?.organizationId
        const plan = session.metadata?.plan
        if (!orgId || !plan) break

        const sub = await getStripe().subscriptions.retrieve(session.subscription as string)
        const period = getPeriod(sub)

        await db.subscription.upsert({
          where: { organizationId: orgId },
          create: {
            organizationId: orgId,
            planName: plan,
            status: 'active',
            monthlyAnalysisLimit: PLAN_LIMITS[plan] ?? 5,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: sub.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
          update: {
            planName: plan,
            status: 'active',
            monthlyAnalysisLimit: PLAN_LIMITS[plan] ?? 5,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: sub.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const plan = (sub.metadata?.plan as string) ?? 'standard'
        const period = getPeriod(sub)

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            planName: plan,
            monthlyAnalysisLimit: PLAN_LIMITS[plan] ?? 5,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: 'cancelled',
            planName: 'free',
            monthlyAnalysisLimit: PLAN_LIMITS['free'],
            stripeSubscriptionId: null,
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subId = invoice.subscription as string | null
        if (subId) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: 'past_due' },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('[webhook] Verarbeitungsfehler:', err)
    return NextResponse.json({ error: 'Webhook-Verarbeitung fehlgeschlagen.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
