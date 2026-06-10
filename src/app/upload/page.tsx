'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUploadCategoryLabels } from '@/types'
import type { UploadCategory } from '@/types'

interface UploadedFile {
  id: string
  originalName: string
  category: UploadCategory
  fileSize: number
  createdAt: string
  columnMapping?: Record<string, string> | null
}

const CATEGORIES: UploadCategory[] = [
  'REVENUE',
  'EXPENSES',
  'BOOKINGS',
  'EMPLOYEE_HOURS',
  'ROOM_CATEGORIES',
  'OTHER',
]

// Basis-Hints – werden durch businessType ergänzt
const BASE_CATEGORY_HINTS: Record<UploadCategory, string> = {
  REVENUE:         'z.B. Tagesumsätze, Kassenbuch, Umsatzberichte',
  EXPENSES:        'z.B. Rechnungen, Ausgabenlisten, Buchungsauszüge',
  BOOKINGS:        'z.B. Belegungsreport, Auslastungsübersicht, Buchungsliste',
  EMPLOYEE_HOURS:  'z.B. Arbeitszeitnachweise, Stundenauswertung',
  ROOM_CATEGORIES: 'z.B. Preislisten, Kategorienübersicht, Tarifliste',
  OTHER:           'Alle sonstigen relevanten Dokumente',
}

const BUSINESS_TYPE_HINTS: Record<string, Partial<Record<UploadCategory, string>>> = {
  hotel:       { BOOKINGS: 'z.B. resigo Belegungsreport, Buchungsübersicht', ROOM_CATEGORIES: 'z.B. DIRS21-Preisexport, Zimmerkategorien' },
  restaurant:  { BOOKINGS: 'z.B. Reservierungsliste, Gedeckeanzahl pro Tag', ROOM_CATEGORIES: 'z.B. Speisekarte, Warengruppen-Übersicht' },
  cafe_bakery: { BOOKINGS: 'z.B. Kassierberichte, Kundenanzahl pro Tag',     ROOM_CATEGORIES: 'z.B. Produktgruppen, Sortimentsübersicht' },
  retail:      { BOOKINGS: 'z.B. Kassenjournale, Tagesberichte, POS-Export',  ROOM_CATEGORIES: 'z.B. Artikelgruppen, Warengruppenübersicht' },
  medical:     { BOOKINGS: 'z.B. Terminauslastung, Behandlungsübersicht',     ROOM_CATEGORIES: 'z.B. EBM-Leistungen, Behandlungsarten' },
  craft:       { BOOKINGS: 'z.B. Auftragsübersicht, Stundenzettel',           ROOM_CATEGORIES: 'z.B. Leistungsarten, Materialgruppen' },
  fitness:     { BOOKINGS: 'z.B. Check-in-Liste, Mitgliederstatistik',        ROOM_CATEGORIES: 'z.B. Mitgliedschaftsarten, Kurstypen' },
  beauty:      { BOOKINGS: 'z.B. Terminkalender-Export, Behandlungsliste',    ROOM_CATEGORIES: 'z.B. Behandlungsarten, Produktgruppen' },
  consulting:  { BOOKINGS: 'z.B. Zeiterfassung, Projektübersicht',            ROOM_CATEGORIES: 'z.B. Leistungsarten, Projektkategorien' },
}

export default function UploadPage() {
  const router = useRouter()
  const [businessType, setBusinessType] = useState<string>('other')
  const [selectedCategory, setSelectedCategory] = useState<UploadCategory>('REVENUE')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastUploadId, setLastUploadId] = useState<string | null>(null)

  // Unternehmensart aus dem Profil holen
  useEffect(() => {
    fetch('/api/organization')
      .then((r) => r.json())
      .then((d) => { if (d.businessType) setBusinessType(d.businessType) })
      .catch(() => {})
  }, [])

  const categoryLabels = getUploadCategoryLabels(businessType)
  const hints: Record<UploadCategory, string> = {
    ...BASE_CATEGORY_HINTS,
    ...(BUSINESS_TYPE_HINTS[businessType] ?? {}),
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const allowed = ['text/csv', 'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

      const invalid = fileArray.filter(
        (f) => !allowed.includes(f.type) && !f.name.match(/\.(csv|xlsx|xls)$/i)
      )
      if (invalid.length > 0) {
        setError('Nur CSV und Excel-Dateien (.csv, .xlsx, .xls) sind erlaubt.')
        return
      }

      setUploading(true)
      setError('')
      setSuccess('')

      for (const file of fileArray) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', selectedCategory)

        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const data = await res.json()

          if (!res.ok) {
            setError(data.error || `Fehler beim Upload von ${file.name}`)
            continue
          }

          setUploadedFiles((prev) => [data.upload, ...prev])
          setLastUploadId(data.upload.id)
          setSuccess(`${file.name} erfolgreich hochgeladen.`)
        } catch {
          setError(`Upload fehlgeschlagen für ${file.name}`)
        }
      }

      setUploading(false)
    },
    [selectedCategory]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  async function startAnalysis() {
    setUploading(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Analyse fehlgeschlagen.')
        return
      }
      window.location.href = `/report/${data.reportId}`
    } catch {
      setError('Verbindungsfehler beim Starten der Analyse.')
    } finally {
      setUploading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-hotel-navy text-white flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-hotel-gold">Profitora</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { href: '/dashboard', label: 'Dashboard',         icon: '📊' },
            { href: '/upload',    label: 'Dateien hochladen', icon: '📁', active: true },
            { href: '/report',    label: 'Berichte',          icon: '📄' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dateien hochladen</h1>
            <p className="text-gray-500 text-sm mt-1">
              Laden Sie CSV oder Excel-Dateien hoch – die KI erkennt automatisch die Struktur.
            </p>
          </div>

          {/* Kategorie-Auswahl */}
          <div className="card p-6 mb-6">
            <label className="label text-base mb-3">Datenkategorie auswählen</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedCategory === cat
                      ? 'border-hotel-navy bg-hotel-navy text-white'
                      : 'border-gray-200 bg-white hover:border-hotel-navy/40'
                  }`}
                >
                  <div className="font-medium text-sm">
                    {categoryLabels[cat]}
                  </div>
                  <div
                    className={`text-xs mt-1 leading-tight ${
                      selectedCategory === cat ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {hints[cat]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer mb-6 ${
              dragging
                ? 'border-hotel-navy bg-blue-50'
                : 'border-gray-300 bg-white hover:border-hotel-navy/50 hover:bg-gray-50'
            }`}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <div className="text-4xl mb-3">{uploading ? '⏳' : '📂'}</div>
            <p className="text-gray-700 font-medium mb-1">
              {uploading ? 'Wird hochgeladen...' : 'Datei hier ablegen oder klicken'}
            </p>
            <p className="text-gray-400 text-sm">CSV, XLSX, XLS · max. 20 MB</p>
            <p className="text-hotel-navy text-sm font-medium mt-2">
              Kategorie: {categoryLabels[selectedCategory]}
            </p>
          </div>

          {/* Meldungen */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && lastUploadId && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">✓ {success}</p>
              <p className="text-green-600 text-xs mt-1 mb-3">
                Ordnen Sie jetzt die Spalten zu, damit die KI Ihre Daten korrekt versteht.
              </p>
              <button
                onClick={() => router.push(`/column-mapping?uploadId=${lastUploadId}`)}
                className="bg-hotel-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-hotel-navy/90 transition-colors font-medium"
              >
                Spalten zuordnen →
              </button>
            </div>
          )}

          {/* Hochgeladene Dateien */}
          {uploadedFiles.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Hochgeladene Dateien ({uploadedFiles.length})
              </h2>
              <div className="space-y-3">
                {uploadedFiles.map((f) => {
                  const hasMapped = f.columnMapping && Object.keys(f.columnMapping).length > 0
                  return (
                    <div key={f.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{f.originalName}</p>
                          <p className="text-xs text-gray-400">
                            {categoryLabels[f.category]} · {formatBytes(f.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasMapped ? (
                          <span className="badge-green">✓ Zugeordnet</span>
                        ) : (
                          <span className="badge-yellow">Spalten fehlen</span>
                        )}
                        <button
                          onClick={() => router.push(`/column-mapping?uploadId=${f.id}`)}
                          className="text-xs text-hotel-navy hover:underline ml-1"
                        >
                          {hasMapped ? 'Bearbeiten' : 'Zuordnen →'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Analyse starten */}
          {uploadedFiles.length > 0 && (
            <div className="card p-6 bg-hotel-navy text-white">
              <h2 className="font-semibold text-lg mb-2">Bereit für die Analyse?</h2>
              <p className="text-white/70 text-sm mb-4">
                Die KI analysiert Ihre Daten und erstellt einen professionellen Bericht
                mit branchenspezifischen Kennzahlen und konkreten Sparpotenzialen.
              </p>
              <button
                onClick={startAnalysis}
                disabled={uploading}
                className="bg-hotel-gold text-hotel-navy px-6 py-3 rounded-xl font-bold hover:bg-hotel-gold-light transition-colors disabled:opacity-50"
              >
                {uploading ? 'Analyse läuft...' : 'Analyse starten →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
