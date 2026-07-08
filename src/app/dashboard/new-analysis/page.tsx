'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { IconChartBar, IconUpload, IconLoader, IconTrendingUp } from '@/components/ui/icons'

const CAT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'REVENUE',         label: 'Einnahmen / Umsatz' },
  { value: 'EXPENSES',        label: 'Ausgaben / Kosten' },
  { value: 'EMPLOYEE_HOURS',  label: 'Mitarbeiterzeiten' },
  { value: 'BOOKINGS',        label: 'Buchungen / Verkäufe' },
  { value: 'ROOM_CATEGORIES', label: 'Kategorien / Preisliste' },
  { value: 'OTHER',           label: 'Sonstiges' },
]

interface UploadRow {
  id: string
  originalName: string
  category: string
  fileSize: number
  createdAt: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function NewAnalysisContent() {
  const router = useRouter()
  const params = useSearchParams()
  const justPurchased = params.get('purchase') === 'success'

  const [credits, setCredits] = useState<number | null>(null)
  const [uploads, setUploads] = useState<UploadRow[]>([])
  const [category, setCategory] = useState('REVENUE')
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [needCredits, setNeedCredits] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const loadState = useCallback(async () => {
    try {
      const [creditsRes, uploadsRes] = await Promise.all([
        fetch('/api/credits'),
        fetch('/api/upload'),
      ])
      if (creditsRes.ok) {
        const c = await creditsRes.json()
        setCredits(c.credits ?? 0)
      }
      if (uploadsRes.ok) {
        const u = await uploadsRes.json()
        setUploads(u.uploads ?? [])
      }
    } catch {
      // Anzeige-Daten – Fehler hier blockieren die Seite nicht
    }
  }, [])

  useEffect(() => {
    loadState()
  }, [loadState])

  // Nach Kauf: Webhook kann ein paar Sekunden brauchen – Guthaben kurz nachladen
  useEffect(() => {
    if (!justPurchased) return
    const t1 = setTimeout(loadState, 3000)
    const t2 = setTimeout(loadState, 8000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [justPurchased, loadState])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    setUploadMsg('')
    let ok = 0
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || `Upload von ${file.name} fehlgeschlagen.`)
        } else {
          ok++
        }
      } catch {
        setError(`Upload von ${file.name} fehlgeschlagen.`)
      }
    }
    if (ok > 0) setUploadMsg(`${ok} Datei${ok > 1 ? 'en' : ''} hochgeladen.`)
    if (inputRef.current) inputRef.current.value = ''
    setUploading(false)
    loadState()
  }

  async function startAnalysis() {
    setStarting(true)
    setError('')
    setNeedCredits(false)
    try {
      const res = await fetch('/api/analyze', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Analyse konnte nicht gestartet werden.')
        if (data.needCredits) setNeedCredits(true)
        return
      }
      router.push(`/report/${data.reportId}`)
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setStarting(false)
    }
  }

  const hasCredits = (credits ?? 0) > 0

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Neue Analyse</h1>
        <p className="text-gray-500 text-sm mb-6">
          Dateien hochladen, Analyse starten – jede Analyse verbraucht 1 Analyse-Guthaben.
        </p>

        {justPurchased && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            Zahlung erfolgreich – Ihr Analyse-Guthaben wird aufgeladen (kann wenige Sekunden dauern).
          </div>
        )}

        {/* Guthaben */}
        <div className={`mb-8 flex items-center justify-between rounded-2xl border p-5 ${
          hasCredits ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Analyse-Guthaben</p>
            <p className="text-2xl font-black text-gray-900">
              {credits === null ? '…' : `${credits} Analyse${credits === 1 ? '' : 'n'}`}
            </p>
            {!hasCredits && credits !== null && (
              <p className="text-amber-700 text-xs mt-1">
                Kein Guthaben – kaufen Sie eine Einzelanalyse (1.990 €) oder sparen Sie mit dem 3er-/5er-Paket.
              </p>
            )}
          </div>
          <Link
            href="/dashboard/subscription"
            className="shrink-0 bg-[#0D1630] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors"
          >
            {hasCredits ? 'Guthaben aufladen' : 'Analyse kaufen'}
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            {needCredits && (
              <Link href="/dashboard/subscription" className="block mt-1 font-semibold underline">
                Jetzt Analyse-Guthaben kaufen →
              </Link>
            )}
          </div>
        )}

        {/* Schritt 1: Dateien */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-[#0D1630] text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="font-bold text-gray-900">Daten bereitstellen</h2>
          </div>
          <p className="text-gray-500 text-sm mb-5 ml-8">
            CSV- oder Excel-Dateien hochladen (z. B. Buchhaltungsexport) – oder Einnahmen/Ausgaben unter{' '}
            <Link href="/dashboard/finance" className="text-[#0D1630] underline">Meine Zahlen</Link> eintragen.
            Die Analyse nutzt automatisch alles, was vorhanden ist.
          </p>

          <div className="ml-8 flex flex-col sm:flex-row gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white"
            >
              {CAT_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors disabled:opacity-60"
            >
              {uploading ? <IconLoader className="w-4 h-4" /> : <IconUpload className="w-4 h-4" />}
              {uploading ? 'Lädt hoch…' : 'Dateien auswählen (CSV/Excel)'}
            </button>
          </div>
          {uploadMsg && <p className="ml-8 mt-2 text-green-700 text-xs">{uploadMsg}</p>}

          {uploads.length > 0 && (
            <div className="ml-8 mt-4 space-y-1.5">
              <p className="text-gray-500 text-xs uppercase tracking-wide">{uploads.length} Datei{uploads.length > 1 ? 'en' : ''} vorhanden</p>
              {uploads.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <span className="text-gray-800 truncate">{u.originalName}</span>
                  <span className="text-gray-400 text-xs shrink-0 ml-3">
                    {CAT_OPTIONS.find((c) => c.value === u.category)?.label ?? u.category} · {formatBytes(u.fileSize)}
                  </span>
                </div>
              ))}
              {uploads.length > 6 && (
                <Link href="/dashboard/files" className="block text-xs text-[#0D1630] underline">
                  Alle {uploads.length} Dateien ansehen →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Schritt 2: Starten */}
        <div className="bg-[#0D1630] text-white rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-au-gold text-[#0D1630] text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="font-bold">Analyse starten</h2>
          </div>
          <p className="text-white/55 text-sm mb-5 ml-8">
            Die KI analysiert Ihre hochgeladenen Dateien und eingetragenen Finanzdaten und erstellt den
            vollständigen 10-Abschnitt-Bericht mit Sparpotenzialen in Euro.
          </p>
          <div className="ml-8 flex items-center gap-4">
            <button
              onClick={startAnalysis}
              disabled={starting || !hasCredits}
              className="flex items-center gap-2 bg-au-gold text-[#0D1630] font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? <IconLoader className="w-4 h-4" /> : <IconTrendingUp className="w-4 h-4" />}
              {starting ? 'Analyse wird gestartet…' : 'Analyse jetzt starten (1 Guthaben)'}
            </button>
            {!hasCredits && credits !== null && (
              <span className="text-white/50 text-xs">Erst Guthaben kaufen</span>
            )}
          </div>
        </div>

        {/* Konfigurator-Hinweis */}
        <div className="mt-6 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <span className="text-gray-400 mt-0.5"><IconChartBar className="w-4 h-4" /></span>
          <p className="text-gray-500 text-xs leading-relaxed">
            Tipp: Je mehr Daten vorhanden sind, desto präziser der Bericht. Kategorien helfen der KI,
            Ihre Dateien richtig einzuordnen (Einnahmen, Ausgaben, Mitarbeiterzeiten …).
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function NewAnalysisPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="p-8 text-gray-400 text-sm">Lädt…</div>
      </DashboardLayout>
    }>
      <NewAnalysisContent />
    </Suspense>
  )
}
