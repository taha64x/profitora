'use client'

import { useState } from 'react'

interface Props {
  plan: string
  label: string
  disabled?: boolean
}

export default function CheckoutButton({ plan, label, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  async function handleCheckout() {
    if (!consent) {
      setError('Bitte stimmen Sie der sofortigen Ausführung zu.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, consent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Checkout')
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <div className="text-xs text-gray-400 text-center py-2">Kostenlos</div>
    )
  }

  return (
    <div>
      <label className="flex items-start gap-2 text-[11px] text-gray-500 leading-snug mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 shrink-0 accent-[#0D1630]"
        />
        <span>
          Ich stimme ausdrücklich zu, dass mit der Ausführung sofort begonnen wird, und bestätige, dass
          ich mit Beginn der Ausführung mein Widerrufsrecht verliere.
        </span>
      </label>
      <button
        onClick={handleCheckout}
        disabled={loading || !consent}
        className="w-full text-xs font-semibold py-2.5 rounded-lg bg-[#0D1630] text-white hover:bg-[#152040] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Weiterleitung...' : label}
      </button>
      {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
    </div>
  )
}
