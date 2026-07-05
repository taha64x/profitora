import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { getPlan } from '@/lib/plans'
import { sendOrderConfirmationEmail } from '@/lib/email'

/** Analyse-Limit aus der zentralen Tarif-Konfiguration (null = unbegrenzt → 9999) */
function limitFor(planName: string): number {
  return getPlan(planName).analysisLimit ?? 9999
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

        // Einmalkauf (mode 'payment') hat keine Subscription – nur bei Abos abrufen
        const subId = typeof session.subscription === 'string' ? session.subscription : null
        const sub = subId ? await getStripe().subscriptions.retrieve(subId) : null
        const period = sub ? getPeriod(sub) : { start: undefined, end: undefined }

        await db.subscription.upsert({
          where: { organizationId: orgId },
          create: {
            organizationId: orgId,
            planName: plan,
            status: 'active',
            monthlyAnalysisLimit: limitFor(plan),
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subId,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
          update: {
            planName: plan,
            status: 'active',
            monthlyAnalysisLimit: limitFor(plan),
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subId,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
        })

        // Auftragsbestätigung + Rechnung automatisch versenden (no-op ohne RESEND_API_KEY)
        try {
          const customerEmail = session.customer_details?.email ?? session.customer_email
          if (customerEmail) {
            const org = await db.organization.findUnique({ where: { id: orgId }, select: { name: true } })
            const now = new Date()
            const invoiceNumber = `PA-${now.getFullYear()}-${String(session.id).slice(-6).toUpperCase()}`
            await sendOrderConfirmationEmail({
              to: customerEmail,
              orgName: org?.name ?? 'Ihr Unternehmen',
              productName: getPlan(plan).name,
              amountCents: session.amount_total ?? 0,
              invoiceNumber,
              date: now,
            })
          }
        } catch (mailErr) {
          // Mailfehler darf den Webhook nicht fehlschlagen lassen (Stripe würde sonst retrien)
          console.error('[webhook] Auftragsbestätigung konnte nicht versendet werden:', mailErr)
        }
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
            monthlyAnalysisLimit: limitFor(plan),
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
            monthlyAnalysisLimit: limitFor('free'),
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
