import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY nicht gesetzt')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? 'Profitora <noreply@profitora.app>'

// ─── Templates ───────────────────────────────────────────────────────────────

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
  .header { background: #0D1630; padding: 28px 32px; }
  .brand { color: #C9A84C; font-size: 20px; font-weight: 900; letter-spacing: -0.02em; }
  .body { padding: 32px; }
  h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px; }
  p { font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; background: #0D1630; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; }
  .footer { padding: 20px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
  .disclaimer { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 20px; }
</style></head>
<body><div class="container">
  <div class="header"><div class="brand">Profitora</div></div>
  <div class="body">${content}</div>
  <div class="footer">Profitora · KI-gestützte Wirtschaftlichkeitsanalyse · Diese E-Mail ersetzt keine Steuer- oder Rechtsberatung.</div>
</div></body></html>`
}

// ─── Versand-Funktionen ───────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, orgName: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Willkommen bei Profitora, ${name || orgName}!`,
    html: baseHtml(`
      <h1>Willkommen bei Profitora!</h1>
      <p>Hallo ${name || 'dort'},<br><br>
      Ihr Konto für <strong>${orgName}</strong> wurde erfolgreich erstellt. Sie können jetzt Ihre ersten Einnahmen und Ausgaben eintragen oder direkt eine KI-Analyse starten.</p>
      <p><strong>Ihre nächsten Schritte:</strong></p>
      <ol style="color:#4b5563;font-size:15px;line-height:1.8;padding-left:20px;">
        <li>Einnahmen diesen Monat eintragen</li>
        <li>Ausgaben erfassen</li>
        <li>Erste KI-Analyse starten</li>
        <li>Monatliche Ziele in "Mein Weg" setzen</li>
      </ol>
      <br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Zum Dashboard</a>
      <div class="disclaimer">Profitora ist eine KI-gestützte Entscheidungshilfe und ersetzt keine gesetzliche Wirtschaftsprüfung, Steuerberatung oder Rechtsberatung.</div>
    `),
  })
}

export async function sendAnalysisCompletedEmail(to: string, orgName: string, reportId: string, reportTitle: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Ihre KI-Analyse ist fertig – ${reportTitle}`,
    html: baseHtml(`
      <h1>Ihre Analyse ist abgeschlossen</h1>
      <p>Die KI-Wirtschaftlichkeitsanalyse für <strong>${orgName}</strong> wurde erfolgreich erstellt.</p>
      <p>Der Bericht enthält:</p>
      <ul style="color:#4b5563;font-size:15px;line-height:1.8;padding-left:20px;">
        <li>Management-Zusammenfassung mit Kernergebnissen</li>
        <li>Einnahmen- und Ausgabenanalyse</li>
        <li>Branchenspezifische KPI-Benchmarks</li>
        <li>Top-Sparpotenziale in EUR</li>
        <li>Konkrete Handlungsempfehlungen</li>
      </ul>
      <br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/report/${reportId}" class="btn">Bericht ansehen</a>
      <div class="disclaimer">Alle Ergebnisse sind betriebswirtschaftliche Entscheidungshilfen. Sie ersetzen keine gesetzliche Abschlussprüfung (§317 HGB) oder Steuerberatung.</div>
    `),
  })
}

export async function sendMonthlyReminderEmail(to: string, name: string, orgName: string, monthLabel: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Monatserinnerung: ${monthLabel} – Daten für ${orgName} eintragen`,
    html: baseHtml(`
      <h1>Zeit für Ihren Monatsüberblick</h1>
      <p>Hallo ${name || 'dort'},<br><br>
      der Monat ${monthLabel} hat begonnen. Tragen Sie Ihre aktuellen Einnahmen und Ausgaben ein, um Ihren Fortschritt in "Mein Weg" zu verfolgen.</p>
      <p>Regelmäßige Dateneingabe hilft Ihnen:</p>
      <ul style="color:#4b5563;font-size:15px;line-height:1.8;padding-left:20px;">
        <li>Trends frühzeitig zu erkennen</li>
        <li>Ziele im Blick zu behalten</li>
        <li>Bessere KI-Analysen zu erhalten</li>
      </ul>
      <br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mein-weg" class="btn">Fortschritt ansehen</a>
    `),
  })
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Passwort zurücksetzen – Profitora',
    html: baseHtml(`
      <h1>Passwort zurücksetzen</h1>
      <p>Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link:</p>
      <br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}" class="btn">Passwort zurücksetzen</a>
      <br><br>
      <p style="font-size:13px;color:#9ca3af;">Dieser Link ist 1 Stunde gültig. Falls Sie kein Zurücksetzen angefordert haben, ignorieren Sie diese E-Mail.</p>
    `),
  })
}
