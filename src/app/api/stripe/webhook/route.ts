import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { getPlan, getCreditPack } from '@/lib/plans'
import { sendOrderConfirmationEmail } from '@/lib/email'

/** Analyse-Limit aus der zentralen Tarif-Konfiguration (null = unbegrenzt → 9999) */
function limitFor(planName: string): number {
  return getPlan(planName).analysisLimit ?? 9999
}

/** Anzeigename eines Packs für die Auftragsbestätigung */
function creditPackName(packId: string): string {
  return getCreditPack(packId)?.name ?? 'Komplettanalyse'
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
        // Neues Modell: Credits aus den Session-Metadaten. Alte Sessions (plan=premium)
        // ohne credits-Feld werden als Einzelanalyse (1 Credit) gewertet.
        const pack = session.metadata?.pack ?? session.metadata?.plan ?? 'single'
        const credits = Math.max(1, parseInt(session.metadata?.credits ?? '1', 10) || 1)
        if (!orgId) break

        // Käufer-Snapshot für die Rechnung (§ 14 UStG: Name + Anschrift des
        // Leistungsempfängers). Kommt aus der Stripe-Rechnungsadresse.
        const details = session.customer_details ?? {}
        const addr = details.address ?? {}
        const org = await db.organization.findUnique({ where: { id: orgId }, select: { name: true } })

        // Idempotenz: Stripe stellt Events mehrfach zu. Die unique Session-ID
        // sorgt dafür, dass pro Checkout genau einmal gutgeschrieben wird.
        // Rückgabe: vergebene Rechnungsnummer, null = bereits verarbeitet.
        const invoiceNumber = await db.$transaction(async (tx) => {
          const existing = await tx.stripePurchase.findUnique({
            where: { stripeSessionId: String(session.id) },
          })
          if (existing) return null

          // Fortlaufende Rechnungsnummer (§ 14 Abs. 4 Nr. 4 UStG), Zähler pro Jahr.
          const year = new Date().getFullYear()
          const counter = await tx.invoiceCounter.upsert({
            where: { year },
            create: { year, lastNumber: 1 },
            update: { lastNumber: { increment: 1 } },
          })
          const number = `PA-${year}-${String(counter.lastNumber).padStart(4, '0')}`

          await tx.stripePurchase.create({
            data: {
              organizationId: orgId,
              stripeSessionId: String(session.id),
              pack,
              credits,
              amountCents: session.amount_total ?? 0,
              invoiceNumber: number,
              buyerName: details.name ?? null,
              buyerCompany: org?.name ?? null,
              addressLine1: addr.line1 ?? null,
              addressLine2: addr.line2 ?? null,
              postalCode: addr.postal_code ?? null,
              city: addr.city ?? null,
              country: addr.country ?? null,
              customerEmail: details.email ?? session.customer_email ?? null,
            },
          })

          await tx.subscription.upsert({
            where: { organizationId: orgId },
            create: {
              organizationId: orgId,
              planName: 'premium',
              status: 'active',
              analysisCredits: credits,
              stripeCustomerId: session.customer as string,
            },
            update: {
              planName: 'premium',
              status: 'active',
              analysisCredits: { increment: credits },
              stripeCustomerId: session.customer as string,
            },
          })
          return number
        })

        if (!invoiceNumber) break

        // Auftragsbestätigung + Rechnung automatisch versenden (no-op ohne RESEND_API_KEY)
        try {
          const customerEmail = details.email ?? session.customer_email
          if (customerEmail) {
            await sendOrderConfirmationEmail({
              to: customerEmail,
              orgName: org?.name ?? 'Ihr Unternehmen',
              productName: `Profitora ${creditPackName(pack)} (${credits} Analyse${credits === 1 ? '' : 'n'})`,
              amountCents: session.amount_total ?? 0,
              invoiceNumber,
              date: new Date(),
              buyerName: details.name ?? undefined,
              addressLines: [
                addr.line1,
                addr.line2,
                [addr.postal_code, addr.city].filter(Boolean).join(' '),
              ].filter((l: unknown): l is string => typeof l === 'string' && l.length > 0),
              invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/purchase/success?session_id=${session.id}`,
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
