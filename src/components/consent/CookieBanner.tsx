'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CONSENT_EVENT, getConsent, resetConsent, setConsent } from '@/lib/consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(getConsent() === null)
    const onChange = () => setVisible(getConsent() === null)
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_EVENT, onChange)
  }, [])

  if (!visible) return null

  function decide(marketing: boolean) {
    setConsent(marketing)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[60] animate-fade-up"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl shadow-gray-900/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-[#0D1630] flex items-center justify-center shrink-0">
            <span className="text-[#C9A84C] font-black text-sm">P</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">Cookies &amp; Tracking</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          Wir nutzen technisch notwendige Cookies für Login und Sicherheit. Mit Ihrer
          Einwilligung setzen wir zusätzlich Google Analytics, Google Ads und Meta Pixel
          ein, um Nutzung und Werbekampagnen zu messen. Ihre Wahl können Sie jederzeit in
          der{' '}
          <Link href="/datenschutz" className="text-[#0D1630] font-medium hover:underline">
            Datenschutzerklärung
          </Link>{' '}
          widerrufen.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => decide(false)}
            className="flex-1 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Nur notwendige
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="flex-1 h-9 rounded-lg bg-[#0D1630] text-white text-xs font-semibold hover:bg-[#1a2547] transition-colors"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}

/** Textlink zum Widerruf — öffnet das Banner erneut (z. B. in der Datenschutzerklärung). */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => resetConsent()} className={className}>
      Cookie-Einstellungen ändern
    </button>
  )
}
