export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { resolveReportPlan } from '@/lib/report-teaser'

/**
 * Browser-Start: auf Vercel das serverless-taugliche @sparticuz/chromium,
 * lokal ein installiertes Chrome/Chromium (Pfad via LOCAL_CHROME_PATH override).
 */
async function launchBrowser() {
  if (process.env.VERCEL) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  const localChrome =
    process.env.LOCAL_CHROME_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  return puppeteer.launch({
    executablePath: localChrome,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

function buildHtmlDocument(orgName: string, title: string, createdAt: Date, body: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; }
    @page { size: A4; margin: 20mm 15mm; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.85rem; }
    th { text-align: left; padding: 0.5rem 0.75rem; background: #f9fafb; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
    section { margin-bottom: 2rem; page-break-inside: avoid; }
    h2 { font-size: 1.1rem; font-weight: 700; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 2px solid #0D1630; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; margin-bottom: 2rem; border-bottom: 3px solid #0D1630; }
    .brand { font-size: 1.4rem; font-weight: 900; color: #0D1630; letter-spacing: -0.02em; }
    .brand span { color: #C9A84C; }
    .meta { font-size: 0.78rem; color: #6b7280; text-align: right; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
  </style>
</head>
<body class="p-8">
  <div class="page-header">
    <div class="brand">Profit<span>ora</span></div>
    <div class="meta">
      <div class="font-semibold text-gray-800">${orgName}</div>
      <div>${title}</div>
      <div>${createdAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>
  ${body}
  <div style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e5e7eb;font-size:0.7rem;color:#9ca3af;">
    Erstellt mit Profitora · KI-gestützte Wirtschaftlichkeitsanalyse · Kein Ersatz für Steuer- oder Rechtsberatung.
  </div>
</body>
</html>`
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const reportId = searchParams.get('id')
    if (!reportId) return NextResponse.json({ error: 'Report-ID fehlt.' }, { status: 400 })

    const report = await db.analysisReport.findUnique({
      where: { id: reportId },
      include: { organization: { include: { subscription: true } } },
    })

    if (!report) return NextResponse.json({ error: 'Bericht nicht gefunden.' }, { status: 404 })
    if (!report.htmlContent) return NextResponse.json({ error: 'Kein Berichtsinhalt vorhanden.' }, { status: 400 })

    const member = await db.organizationMember.findFirst({
      where: { userId: user.userId, organizationId: report.organizationId },
    })
    if (!member) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    // Teaser-Gating: Im Gratis-Tarif kein PDF-Export des Vollberichts.
    const plan = resolveReportPlan(report.metadata, report.organization.subscription?.planName)
    if (plan.teaser) {
      return NextResponse.json(
        { error: 'PDF-Export ist Teil der Komplettanalyse (1.990 €).', upgradeRequired: true },
        { status: 402 },
      )
    }

    const html = buildHtmlDocument(
      report.organization.name,
      report.title,
      report.createdAt,
      report.htmlContent,
    )

    const browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
    })
    await browser.close()

    const safeName = report.title.replace(/[^a-z0-9äöü\s]/gi, '').replace(/\s+/g, '-').toLowerCase()
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="profitora-${safeName}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[report/pdf]', err)
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen.' }, { status: 500 })
  }
}
