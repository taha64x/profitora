'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { IconChartBar, IconUpload, IconLoader, IconTrendingUp } from '@/components/ui/icons'

export default function NewAnalysisPage() {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  async function startFromFinanceData() {
    setStarting(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Analyse konnte nicht gestartet werden.')
        return
      }
      router.push(`/report/${data.reportId}`)
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Neue Analyse</h1>
        <p className="text-gray-500 text-sm mb-8">
          Wählen Sie, wie Ihre Analyse erstellt werden soll.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Aus Finanzdaten */}
          <button
            onClick={startFromFinanceData}
            disabled={starting}
            className="text-left bg-[#0D1630] text-white rounded-2xl p-7 hover:bg-[#15204a] transition-colors disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-au-gold/15 text-au-gold flex items-center justify-center mb-4">
              {starting ? <IconLoader className="w-5 h-5" /> : <IconTrendingUp className="w-5 h-5" />}
            </div>
            <h2 className="font-bold text-base mb-2">
              {starting ? 'Analyse wird gestartet…' : 'Aus meinen Finanzdaten'}
            </h2>
            <p className="text-white/55 text-sm leading-relaxed">
              Die KI analysiert direkt Ihre eingetragenen Einnahmen, Ausgaben und hochgeladenen Dateien –
              ohne weitere Konfiguration. Ein Klick, fertig.
            </p>
            <span className="inline-block mt-4 text-au-gold text-sm font-semibold">
              Sofort starten →
            </span>
          </button>

          {/* Konfigurierte Analyse */}
          <Link
            href="/analyze"
            className="bg-white border border-gray-200 rounded-2xl p-7 hover:border-hotel-navy/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-hotel-navy/5 text-hotel-navy flex items-center justify-center mb-4">
              <IconChartBar className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-base mb-2">Analyse konfigurieren</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Branche, Analysearten, Genauigkeit und Datenquelle selbst festlegen –
              mit Fragebogen, Datei-Upload oder beidem kombiniert.
            </p>
            <span className="inline-block mt-4 text-hotel-navy text-sm font-semibold">
              Konfigurator öffnen →
            </span>
          </Link>
        </div>

        {/* Hinweis */}
        <div className="mt-6 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <span className="text-gray-400 mt-0.5"><IconUpload className="w-4 h-4" /></span>
          <p className="text-gray-500 text-xs leading-relaxed">
            Tipp: Je mehr Daten vorhanden sind, desto präziser der Bericht. Tragen Sie Einnahmen und Ausgaben
            unter „Meine Zahlen" ein oder laden Sie CSV-/Excel-Dateien unter „Dateien" hoch –
            die Analyse nutzt automatisch alles, was verfügbar ist.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
