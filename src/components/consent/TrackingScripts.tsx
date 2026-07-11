'use client'

import { useEffect } from 'react'
import { CONSENT_EVENT, getConsent } from '@/lib/consent'

// IDs kommen aus Vercel-Envs — ohne gesetzte IDs wird nie etwas geladen.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const ADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

let googleLoaded = false
let metaLoaded = false

// Strikte Variante: Skripte werden erst nach Einwilligung eingebunden — vorher
// geht keine Anfrage (auch keine IP) an Google/Meta. Consent Mode v2 wird
// trotzdem gesetzt, damit Google die Signale korrekt einordnet.
function loadGoogleTag() {
  if (googleLoaded) return
  const primaryId = GA_ID || ADS_ID
  if (!primaryId) return
  googleLoaded = true

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag = gtag

  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  })
  gtag('js', new Date())
  if (GA_ID) gtag('config', GA_ID, { anonymize_ip: true })
  if (ADS_ID) gtag('config', ADS_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`
  document.head.appendChild(script)
}

function loadMetaPixel() {
  if (metaLoaded || !META_PIXEL_ID) return
  metaLoaded = true

  // Offizieller Pixel-Bootstrap (fbevents.js), erst nach Einwilligung.
  const w = window as Window
  if (!w.fbq) {
    const fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue: unknown[]
      push: unknown
      loaded: boolean
      version: string
    } = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue.push(args)
    } as never
    fbq.queue = []
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    w.fbq = fbq
    w._fbq = fbq
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }
  w.fbq!('consent', 'grant')
  w.fbq!('init', META_PIXEL_ID)
  w.fbq!('track', 'PageView')
}

function applyConsent() {
  if (getConsent()?.marketing) {
    loadGoogleTag()
    loadMetaPixel()
    return
  }
  // Widerruf nach bereits geladenen Skripten: Freigaben entziehen.
  if (googleLoaded) {
    window.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  }
  if (metaLoaded) window.fbq?.('consent', 'revoke')
}

export function TrackingScripts() {
  useEffect(() => {
    applyConsent()
    window.addEventListener(CONSENT_EVENT, applyConsent)
    return () => window.removeEventListener(CONSENT_EVENT, applyConsent)
  }, [])

  return null
}

/**
 * Kauf-Conversion (Bestätigungsseite) — feuert GA4-purchase, Google-Ads-Conversion
 * und Meta-Purchase. No-op ohne Einwilligung/IDs; pro Kauf genau einmal
 * (localStorage-Guard über die Stripe-Session).
 */
export function trackPurchase(params: {
  transactionId: string
  valueEuro: number
  itemName: string
}) {
  const { transactionId, valueEuro, itemName } = params
  if (!getConsent()?.marketing) return

  const guardKey = `pf_conv_${transactionId}`
  try {
    if (localStorage.getItem(guardKey)) return
    localStorage.setItem(guardKey, '1')
  } catch {
    // localStorage nicht verfügbar → lieber einmal zu viel als gar nicht tracken
  }

  if (window.gtag) {
    if (GA_ID) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: valueEuro,
        currency: 'EUR',
        items: [{ item_name: itemName, quantity: 1, price: valueEuro }],
      })
    }
    if (ADS_ID && ADS_CONVERSION_LABEL) {
      window.gtag('event', 'conversion', {
        send_to: `${ADS_ID}/${ADS_CONVERSION_LABEL}`,
        value: valueEuro,
        currency: 'EUR',
        transaction_id: transactionId,
      })
    }
  }

  if (window.fbq && META_PIXEL_ID) {
    window.fbq('track', 'Purchase', { value: valueEuro, currency: 'EUR' }, { eventID: transactionId })
  }
}
