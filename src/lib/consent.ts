// ─────────────────────────────────────────────────────────────────────────────
// Cookie-/Tracking-Consent — zentral (DSGVO / § 25 TDDDG).
// Marketing-Skripte (GA4, Google Ads, Meta Pixel) laden erst NACH ausdrücklicher
// Einwilligung; ohne Einwilligung wird kein Tracking-Skript geladen und keine
// IP an Google/Meta übertragen. Widerruf jederzeit über resetConsent().
// ─────────────────────────────────────────────────────────────────────────────

export const CONSENT_KEY = 'profitora_cookie_consent_v1'
export const CONSENT_EVENT = 'pf-consent-changed'

export type Consent = {
  /** GA4 + Google Ads + Meta Pixel (Statistik & Conversion-Tracking) */
  marketing: boolean
  ts: number
}

export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Consent
    if (typeof parsed.marketing !== 'boolean') return null
    return parsed
  } catch {
    return null
  }
}

export function setConsent(marketing: boolean) {
  const consent: Consent = { marketing, ts: Date.now() }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }))
}

/** Widerruf: Entscheidung löschen → Banner erscheint wieder. */
export function resetConsent() {
  localStorage.removeItem(CONSENT_KEY)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }))
}
