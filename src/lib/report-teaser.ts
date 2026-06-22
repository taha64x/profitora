// Teaser-Gating: Im Gratis-Tarif (plan.teaser === true) darf NICHT der volle
// Bericht ausgeliefert werden. Diese Helfer bestimmen den Tarif eines Berichts
// und erzeugen einen Anriss, sodass der gesperrte Inhalt erst gar nicht an den
// Client gelangt (echte Paywall, nicht nur per CSS verdeckt).

import { getPlan, type PlanConfig } from '@/lib/plans'

/**
 * Tarif eines Berichts ermitteln. Bevorzugt der bei der Analyse gespeicherte
 * Snapshot (`metadata.planId`) – so wird ein dünner Gratis-Bericht nicht
 * nachträglich „freigeschaltet", wenn der Nutzer später Premium kauft.
 * Fallback: aktueller Abo-Tarif der Organisation.
 */
export function resolveReportPlan(
  metadata: unknown,
  currentPlanName: string | null | undefined,
): PlanConfig {
  const snapshot =
    metadata && typeof metadata === 'object' && 'planId' in metadata
      ? (metadata as { planId?: string }).planId
      : undefined
  return getPlan(snapshot ?? currentPlanName)
}

/**
 * Anriss aus dem vollständigen Bericht-HTML. Der KI-Bericht leitet jede Sektion
 * mit <h2> ein; im Teaser zeigen wir nur Intro + erste Sektion
 * (Management-Zusammenfassung). Alles Weitere bleibt serverseitig.
 */
export function buildTeaserHtml(fullHtml: string): string {
  if (!fullHtml) return ''

  const parts = fullHtml.split(/(?=<h2)/i)
  if (parts.length <= 1) {
    // Kein klar in Sektionen gegliederter Bericht – nur ein kurzer Textanriss.
    const text = fullHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const snippet = text.slice(0, 600)
    return `<p>${snippet}${text.length > 600 ? '…' : ''}</p>`
  }

  // Intro (vor der ersten Überschrift) + erste Sektion.
  return parts.slice(0, 2).join('')
}
