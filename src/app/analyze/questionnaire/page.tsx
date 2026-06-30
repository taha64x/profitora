'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import QuestionnaireWizard from '@/components/analyze/QuestionnaireWizard'
import type { QuestionnaireData, AnalysisType, AccuracyLevel, InputMethod, AnalysisGoal } from '@/types'

function QuestionnaireContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const industry      = params.get('industry') ?? 'other'
  const types         = (params.get('types') ?? 'komplett').split(',').filter(Boolean) as AnalysisType[]
  const method        = (params.get('method') ?? 'questionnaire') as InputMethod
  const level         = (params.get('level') ?? 'standard') as AccuracyLevel
  const goals         = (params.get('goals') ?? '').split(',').filter(Boolean) as AnalysisGoal[]

  const handleSubmit = async (data: QuestionnaireData) => {
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
          questionnaireData:   data,
          consentConfirmed:    true,
          privacyConfirmed:    true,
          uploadAuthConfirmed: false,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Unbekannter Fehler. Bitte versuchen Sie es erneut.')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0E1A33] mb-3">Analyse eingereicht</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Ihre Angaben wurden erfolgreich übermittelt. Referenz-ID:
          </p>
          <code className="text-[#B8923A] text-xs bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg block mb-6">
            {submitted}
          </code>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Ihre Analyse wurde vorbereitet. Im nächsten Schritt werden Ihre Daten von der KI
            ausgewertet und Sie erhalten einen strukturierten Bericht.
          </p>
          <div className="space-y-3">
            <Link href="/dashboard"
              className="flex items-center justify-center gap-2 bg-[#0E1A33] hover:bg-[#1a2744] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all w-full shadow-lg shadow-[#0E1A33]/15">
              Zum Dashboard
            </Link>
            <Link href="/"
              className="flex items-center justify-center text-gray-500 hover:text-[#0E1A33] text-sm transition-colors w-full">
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#0E1A33]">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/analyze" className="flex items-center gap-2 text-gray-500 hover:text-[#0E1A33] text-sm transition-colors">
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
          <h1 className="font-display text-3xl font-extrabold text-[#0E1A33] mb-3">Unternehmens-Fragebogen</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Beantworten Sie die Fragen möglichst genau. Je detaillierter Ihre Angaben,
            desto präziser die betriebswirtschaftliche Analyse.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <QuestionnaireWizard industry={industry} onSubmit={handleSubmit} loading={loading} />
        </div>

        <p className="text-gray-400 text-xs text-center mt-6 leading-relaxed">
          Diese Analyse ersetzt keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung.
          Alle Einsparpotenziale sind Schätzungen – abhängig von Umsetzung und Einzelfall.
        </p>
      </div>
    </div>
  )
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Lädt…</div>
      </div>
    }>
      <QuestionnaireContent />
    </Suspense>
  )
}
