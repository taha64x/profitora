// ─────────────────────────────────────────────────────────────────────────────
// Rechnungs-Template (PDF via Puppeteer).
// Pflichtangaben nach § 14 Abs. 4 UStG: Name + Anschrift von Aussteller und
// Leistungsempfänger, Steuernummer (sofern vergeben, via COMPANY_TAX_NUMBER),
// Ausstellungsdatum, fortlaufende Rechnungsnummer, Menge/Art der Leistung,
// Leistungszeitpunkt, Entgelt sowie der Kleinunternehmer-Hinweis nach § 19 UStG.
// ─────────────────────────────────────────────────────────────────────────────

import { COMPANY } from './company'

export interface InvoiceData {
  invoiceNumber: string
  /** Rechnungs- und Leistungsdatum (digitale Leistung, sofortige Bereitstellung) */
  date: Date
  /** Unternehmensname des Käufers (Organization) */
  buyerCompany?: string | null
  /** Vor- und Nachname aus der Stripe-Rechnungsadresse */
  buyerName?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  customerEmail?: string | null
  /** z. B. "3er-Paket" */
  packName: string
  credits: number
  amountCents: number
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Deutschland',
  AT: 'Österreich',
  CH: 'Schweiz',
  LI: 'Liechtenstein',
  LU: 'Luxemburg',
  NL: 'Niederlande',
  BE: 'Belgien',
  FR: 'Frankreich',
  IT: 'Italien',
  ES: 'Spanien',
}

function countryName(code?: string | null): string {
  if (!code) return ''
  return COUNTRY_NAMES[code.toUpperCase()] ?? code
}

function euro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function dateDe(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Adresszeilen des Rechnungsempfängers (leere Teile werden übersprungen). */
function recipientLines(d: InvoiceData): string[] {
  return [
    d.buyerCompany ?? '',
    d.buyerName ?? '',
    d.addressLine1 ?? '',
    d.addressLine2 ?? '',
    [d.postalCode, d.city].filter(Boolean).join(' '),
    countryName(d.country),
  ].filter((line) => line.trim().length > 0)
}

export function renderInvoiceHtml(d: InvoiceData): string {
  const recipient = recipientLines(d)
  const productLabel = `Profitora ${d.packName} – KI-gestützte Wirtschaftlichkeitsanalyse`
  const productDetail =
    d.credits === 1
      ? '1 vollständige Analyse (Analyse-Credit, verfällt nicht)'
      : `${d.credits} vollständige Analysen (Analyse-Credits, verfallen nicht)`

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Rechnung ${esc(d.invoiceNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; }
  body {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    background: #ffffff;
    color: #111827;
    font-size: 10pt;
    line-height: 1.55;
    display: flex;
    flex-direction: column;
    padding: 16mm 18mm 12mm;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { display: flex; align-items: center; gap: 9px; }
  .brand-mark {
    width: 34px; height: 34px; border-radius: 9px; background: #0D1630;
    display: flex; align-items: center; justify-content: center;
    color: #C9A84C; font-weight: 900; font-size: 15pt;
  }
  .brand-name { font-size: 15pt; font-weight: 800; color: #0D1630; letter-spacing: -0.02em; }
  .brand-sub { font-size: 7.5pt; color: #6b7280; margin-top: 1px; }
  .doc-type { text-align: right; }
  .doc-type .label { font-size: 17pt; font-weight: 700; color: #0D1630; letter-spacing: 0.12em; }
  .doc-type .number { font-size: 9pt; color: #6b7280; margin-top: 2px; }
  .gold-rule { border: none; border-top: 2.5px solid #C9A84C; margin: 8mm 0 10mm; }
  .parties { display: flex; justify-content: space-between; gap: 10mm; }
  .sender-line { font-size: 7pt; color: #9ca3af; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 8px; }
  .recipient { font-size: 10.5pt; }
  .recipient .company { font-weight: 700; }
  .meta { min-width: 62mm; font-size: 9pt; }
  .meta table { width: 100%; border-collapse: collapse; }
  .meta td { padding: 2.5px 0; vertical-align: top; }
  .meta td:first-child { color: #6b7280; padding-right: 12px; white-space: nowrap; }
  .meta td:last-child { text-align: right; font-weight: 600; color: #111827; }
  .paid-badge {
    display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;
    font-size: 8pt; font-weight: 700; padding: 1px 10px; border-radius: 999px;
  }
  .items { margin-top: 12mm; }
  .items table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  .items th {
    text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em;
    color: #6b7280; font-weight: 600; padding: 0 10px 6px; border-bottom: 2px solid #0D1630;
  }
  .items td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .items .num { text-align: right; white-space: nowrap; }
  .items .detail { font-size: 8.5pt; color: #6b7280; margin-top: 2px; }
  .totals { margin-top: 6mm; display: flex; justify-content: flex-end; }
  .totals table { border-collapse: collapse; font-size: 10pt; min-width: 70mm; }
  .totals td { padding: 4px 10px; }
  .totals td:last-child { text-align: right; }
  .totals .grand td {
    background: #0D1630; color: #fff; font-weight: 700; font-size: 11.5pt; padding: 9px 12px;
  }
  .totals .grand td:first-child { border-radius: 8px 0 0 8px; }
  .totals .grand td:last-child { border-radius: 0 8px 8px 0; }
  .notes { margin-top: 10mm; font-size: 8.5pt; color: #4b5563; }
  .notes p { margin-bottom: 5px; }
  .footer { margin-top: auto; border-top: 1px solid #e5e7eb; padding-top: 5mm; display: flex; gap: 8mm; font-size: 7.5pt; color: #6b7280; }
  .footer .col { flex: 1; }
  .footer .head { font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; font-size: 6.8pt; margin-bottom: 3px; }
</style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="brand-mark">P</div>
      <div>
        <div class="brand-name">Profitora</div>
        <div class="brand-sub">KI-gestützte Wirtschaftlichkeitsanalyse</div>
      </div>
    </div>
    <div class="doc-type">
      <div class="label">RECHNUNG</div>
      <div class="number">${esc(d.invoiceNumber)}</div>
    </div>
  </div>

  <hr class="gold-rule">

  <div class="parties">
    <div style="flex:1;">
      <div class="sender-line">${esc(COMPANY.legalName)} · ${esc(COMPANY.street)} · ${esc(COMPANY.city)} · ${esc(COMPANY.country)}</div>
      <div class="recipient">
        ${recipient.length > 0
          ? recipient
              .map((line, i) => `<div${i === 0 ? ' class="company"' : ''}>${esc(line)}</div>`)
              .join('')
          : `<div class="company">–</div>`}
        ${d.customerEmail ? `<div style="font-size:8.5pt;color:#6b7280;margin-top:4px;">${esc(d.customerEmail)}</div>` : ''}
      </div>
    </div>
    <div class="meta">
      <table>
        <tr><td>Rechnungsnummer</td><td>${esc(d.invoiceNumber)}</td></tr>
        <tr><td>Rechnungsdatum</td><td>${dateDe(d.date)}</td></tr>
        <tr><td>Leistungsdatum</td><td>${dateDe(d.date)}</td></tr>
        <tr><td>Zahlungsstatus</td><td><span class="paid-badge">Bezahlt</span></td></tr>
      </table>
    </div>
  </div>

  <div class="items">
    <table>
      <thead>
        <tr>
          <th style="width:8mm;">Pos.</th>
          <th>Leistung</th>
          <th class="num" style="width:18mm;">Menge</th>
          <th class="num" style="width:30mm;">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>${esc(productLabel)}</strong>
            <div class="detail">${esc(productDetail)} · Digitale Leistung, Bereitstellung unmittelbar nach Zahlungseingang</div>
          </td>
          <td class="num">1</td>
          <td class="num">${euro(d.amountCents)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <table>
      <tr class="grand"><td>Gesamtbetrag</td><td>${euro(d.amountCents)}</td></tr>
    </table>
  </div>

  <div class="notes">
    <p><strong>${esc(COMPANY.vatNote)}</strong></p>
    <p>Der Rechnungsbetrag wurde bereits vollständig per Kreditkarte beglichen – es ist keine Zahlung mehr erforderlich.</p>
    <p>Das Leistungsdatum entspricht dem Rechnungsdatum; die Leistung (Analyse-Credits) wurde unmittelbar nach dem Kauf bereitgestellt.</p>
  </div>

  <div class="footer">
    <div class="col">
      <div class="head">Anbieter</div>
      ${esc(COMPANY.legalName)}<br>
      ${esc(COMPANY.street)}<br>
      ${esc(COMPANY.city)}, ${esc(COMPANY.country)}
    </div>
    <div class="col">
      <div class="head">Kontakt</div>
      ${esc(COMPANY.email)}<br>
      ${esc(COMPANY.phone)}<br>
      ${esc(COMPANY.domain)}
    </div>
    <div class="col">
      <div class="head">Steuerliche Angaben</div>
      ${COMPANY.taxNumber ? `Steuernummer: ${esc(COMPANY.taxNumber)}<br>` : ''}
      ${esc(COMPANY.vatNote)}
    </div>
  </div>

</body>
</html>`
}
