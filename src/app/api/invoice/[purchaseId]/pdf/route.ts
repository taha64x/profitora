export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCreditPack } from '@/lib/plans'
import { renderInvoiceHtml } from '@/lib/invoice'
import { htmlToPdf } from '@/lib/pdf'

/**
 * PDF-Rechnung zu einem Kauf – nur für Mitglieder der Organisation,
 * der der Kauf gehört.
 */
export async function GET(_req: Request, { params }: { params: { purchaseId: string } }) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const purchase = await db.stripePurchase.findUnique({ where: { id: params.purchaseId } })
    if (!purchase) return NextResponse.json({ error: 'Kauf nicht gefunden.' }, { status: 404 })

    const member = await db.organizationMember.findFirst({
      where: { userId: user.userId, organizationId: purchase.organizationId },
    })
    if (!member) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    // Alt-Käufe (vor Einführung des Nummernkreises): dieselbe Nummer verwenden,
    // die damals per E-Mail kommuniziert wurde (PA-Jahr-Session-Suffix).
    const invoiceNumber =
      purchase.invoiceNumber ??
      `PA-${purchase.createdAt.getFullYear()}-${purchase.stripeSessionId.slice(-6).toUpperCase()}`

    // Käufer-Snapshot fehlt bei Alt-Käufen → Organisationsname als Empfänger.
    let buyerCompany = purchase.buyerCompany
    if (!buyerCompany) {
      const org = await db.organization.findUnique({
        where: { id: purchase.organizationId },
        select: { name: true },
      })
      buyerCompany = org?.name ?? null
    }

    const pack = getCreditPack(purchase.pack)
    const html = renderInvoiceHtml({
      invoiceNumber,
      date: purchase.createdAt,
      buyerCompany,
      buyerName: purchase.buyerName,
      addressLine1: purchase.addressLine1,
      addressLine2: purchase.addressLine2,
      postalCode: purchase.postalCode,
      city: purchase.city,
      country: purchase.country,
      customerEmail: purchase.customerEmail,
      packName: pack?.name ?? 'Komplettanalyse',
      credits: purchase.credits,
      amountCents: purchase.amountCents,
    })

    const pdf = await htmlToPdf(html)

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Profitora-Rechnung-${invoiceNumber}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[invoice/pdf]', err)
    return NextResponse.json({ error: 'Rechnung konnte nicht erstellt werden.' }, { status: 500 })
  }
}
