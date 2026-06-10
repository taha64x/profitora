'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import UploadZone from '@/components/analyze/UploadZone'
import type { AnalysisType, AccuracyLevel, InputMethod, AnalysisGoal } from '@/types'

function UploadContent() {
  const params = useSearchParams()
  const [files, setFiles] = useState<File[]>([])
  const [consent, setConsent] = useState({ upload: false, noLegal: false, privacy: false })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const industry = params.get('industry') ?? 'other'
  const types    = (params.get('types') ?? 'komplett').split(',').filter(Boolean) as AnalysisType[]
  const method   = (params.get('method') ?? 'upload') as InputMethod
  const level    = (params.get('level') ?? 'standard') as AccuracyLevel
  const goals    = (params.get('goals') ?? '').split(',').filter(Boolean) as AnalysisGoal[]

  const allConsented = consent.upload && consent.noLegal && consent.privacy

  const handleStart = async () => {
    if (!allConsented) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/analysis-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          analysisTypes:       types,
          accuracyLevel:       level,
          inputMethod:         method,
          goals,
          uploadedFiles:       files.map((f) => f.name),
          consentConfirmed:    consent.noLegal,
          privacyConfirmed:    consent.privacy,
          uploadAuthConfirmed: consent.upload,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Fehler beim Speichern. Bitte erneut versuchen.')
        return
      }
      setSubmitted(json.data.id)
    } catch {
      setError('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#06091A] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Analyse eingereicht</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-2">Referenz-ID:</p>
          <code className="text-au-gold text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg block mb-6">
            {submitted}
          </code>
          <p className="text-white/35 text-sm leading-relaxed mb-8">
            Ihre Analyse wurde vorbereitet. Ihre Daten werden ausgewertet und Sie erhalten
            einen strukturierten betriebswirtschaftlichen Bericht.
          </p>
          <Link href="/dashboard"
            className="flex items-center justify-center bg-au-gold hover:bg-au-gold-light text-[#06091A] font-bold text-sm px-6 py-3 rounded-xl transition-all w-full">
            Zum Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06091A] text-white">
      <header className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link href="/analyze" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Zurück zur Konfiguration
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M8 2L14 13H2L8 2Z" fill="#06091A"/>
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight">Profitora</span>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Dokumente hochladen</h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto">
            Laden Sie Ihre Unternehmensdaten hoch. Die KI erkennt Struktur, liest Tabellen
            aus, extrahiert Kennzahlen und markiert fehlende Informationen.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8">
          <UploadZone
            onFilesChange={setFiles}
            consent={consent}
            onConsentChange={(key, val) => setConsent((c) => ({ ...c, [key]: val }))}
          />

          <div className="mt-6 pt-6 border-t border-white/8">
            <button
              type="button"
              onClick={handleStart}
              disabled={!allConsented || loading}
              className="w-full bg-au-gold hover:bg-au-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-[#06091A] font-bold text-sm px-6 py-3.5 rounded-xl transition-all hover:scale-[1.01]"
            >
              {loading ? 'Wird eingereicht…' : 'Analyse einreichen →'}
            </button>
            {!allConsented && (
              <p className="text-white/25 text-xs text-center mt-2">
                Bitte bestätigen Sie alle drei Hinweise oben.
              </p>
            )}
          </div>
        </div>

        {/* Optional: also fill questionnaire */}
        {method === 'hybrid' && (
          <div className="mt-4 p-5 rounded-xl border border-white/8 bg-white/[0.02]">
            <p className="text-white/50 text-sm mb-3">
              Sie nutzen die <strong className="text-white/70">Hybrid-Option</strong> – ergänzen Sie auch den Fragebogen
              für die genaueste Analyse.
            </p>
            <Link
              href={`/analyze/questionnaire?${params.toString()}`}
              className="text-au-gold text-sm hover:underline"
            >
              Zum Fragebogen →
            </Link>
          </div>
        )}

        <p className="text-white/20 text-xs text-center mt-6 leading-relaxed">
          Diese Analyse ersetzt keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung.
          Alle Einsparpotenziale sind Schätzungen – abhängig von Umsetzung und Einzelfall.
        </p>
      </div>
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06091A] flex items-center justify-center">
        <div className="text-white/30 text-sm">Lädt…</div>
      </div>
    }>
      <UploadContent />
    </Suspense>
  )
}
