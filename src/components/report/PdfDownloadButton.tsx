'use client'

import { useState } from 'react'

export default function PdfDownloadButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/report/pdf?id=${reportId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'PDF-Fehler')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `profitora-bericht-${reportId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-white border border-white/30 text-white/90 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
            </svg>
            PDF wird erstellt...
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            PDF herunterladen
          </>
        )}
      </button>
      {error && <p className="text-red-300 text-xs mt-1">{error}</p>}
    </div>
  )
}
