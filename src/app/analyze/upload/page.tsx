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
  const [error, setError] = useState<string | null>(null)

  const industry = params.get('industry') ?? 'other'
  const types    = (params.get('types') ?? 'komplett').split(',').filter(Boolean) as AnalysisType[]
  const method   = (params.get('method') ?? 'upload') as InputMethod
  const level    = (params.get('level') ?? 'standard') as AccuracyLevel
  const goals    = (params.get('goals') ?? '').split(',').filter(Boolean) as AnalysisGoal[]

  const allConsented = consent.upload && consent.noLegal && consent.privacy

  const handleStart = async () => {
    if (!allConsented) return
    if (files.length === 0) {
      setError('Bitte wählen Sie mindestens eine Datei aus.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // Dateien wirklich hochladen (Konto erforderlich). Danach geht es im
      // Dashboard weiter, wo die Analyse mit Guthaben gestartet wird.
      let uploadedCount = 0
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        form.append('category', 'OTHER')
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (res.status === 401) {
          // Nicht eingeloggt: erst Account anlegen, Konfiguration bleibt in der URL
          window.location.href = `/register?plan=premium`
          return
        }
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? `Upload von ${file.name} fehlgeschlagen. Hinweis: Es werden CSV- und Excel-Dateien unterstützt.`)
          return
        }
        uploadedCount++
      }

      // Konfigurations-Metadaten zusätzlich speichern (für spätere Auswertung)
      fetch('/api/analysis-request', {
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
      }).catch(() => {})

      if (uploadedCount > 0) {
        window.location.href = '/dashboard/new-analysis'
      }
    } catch {
      setError('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#0E1A33]">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/analyze" className="text-gray-500 hover:text-[#0E1A33] text-sm transition-colors">
          ← Zurück zur Konfiguration
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M8 2L14 13H2L8 2Z" fill="#0E1A33"/>
            </svg>
          </div>
          <span className="text-[#0E1A33] font-semibold tracking-tight">Profitora</span>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-extrabold text-[#0E1A33] mb-3">Dokumente hochladen</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Laden Sie Ihre Unternehmensdaten hoch. Die KI erkennt Struktur, liest Tabellen
            aus, extrahiert Kennzahlen und markiert fehlende Informationen.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <UploadZone
            onFilesChange={setFiles}
            consent={consent}
            onConsentChange={(key, val) => setConsent((c) => ({ ...c, [key]: val }))}
          />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleStart}
              disabled={!allConsented || loading}
              className="w-full bg-[#0E1A33] hover:bg-[#1a2744] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all hover:scale-[1.01] shadow-lg shadow-[#0E1A33]/15"
            >
              {loading ? 'Dateien werden hochgeladen…' : 'Dateien hochladen & weiter →'}
            </button>
            {!allConsented && (
              <p className="text-gray-400 text-xs text-center mt-2">
                Bitte bestätigen Sie alle drei Hinweise oben.
              </p>
            )}
          </div>
        </div>

        {/* Optional: also fill questionnaire */}
        {method === 'hybrid' && (
          <div className="mt-4 p-5 rounded-xl border border-gray-200 bg-white">
            <p className="text-gray-500 text-sm mb-3">
              Sie nutzen die <strong className="text-gray-700">Hybrid-Option</strong> – ergänzen Sie auch den Fragebogen
              für die genaueste Analyse.
            </p>
            <Link
              href={`/analyze/questionnaire?${params.toString()}`}
              className="text-[#B8923A] text-sm font-medium hover:underline"
            >
              Zum Fragebogen →
            </Link>
          </div>
        )}

        <p className="text-gray-400 text-xs text-center mt-6 leading-relaxed">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Lädt…</div>
      </div>
    }>
      <UploadContent />
    </Suspense>
  )
}
