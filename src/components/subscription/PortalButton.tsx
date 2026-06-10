'use client'

import { useState } from 'react'

export default function PortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePortal}
        disabled={loading}
        className="text-xs border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {loading ? 'Öffne Portal...' : 'Abo & Rechnungen verwalten'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
