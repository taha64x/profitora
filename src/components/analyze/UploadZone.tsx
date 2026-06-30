'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  onFilesChange: (files: File[]) => void
  consent: { upload: boolean; noLegal: boolean; privacy: boolean }
  onConsentChange: (key: keyof Props['consent'], value: boolean) => void
}

const ACCEPTED_TYPES = [
  '.pdf', '.xlsx', '.xls', '.csv', '.docx', '.doc',
  '.png', '.jpg', '.jpeg', '.webp', '.heic',
  '.txt', '.ods',
]

const EXAMPLES = [
  'Buchhaltungstabellen (Excel, CSV)',
  'Rechnungen und Belege (PDF, Bilder)',
  'Mitarbeiterlisten und Dienstpläne',
  'Kassenberichte und Monatsauswertungen',
  'Einnahmen- / Ausgabenübersichten',
  'Screenshots aus Ihrer Buchhaltungssoftware',
]

export default function UploadZone({ onFilesChange, consent, onConsentChange }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming)
      const updated = [...files, ...arr]
      setFiles(updated)
      onFilesChange(updated)
    },
    [files, onFilesChange]
  )

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesChange(updated)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="p-5 rounded-xl bg-gray-50 border border-gray-200">
        <p className="text-gray-700 text-sm leading-relaxed font-medium mb-3">
          Je mehr echte Daten Sie hochladen, desto genauer wird die Analyse.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {EXAMPLES.map((ex) => (
            <div key={ex} className="flex items-center gap-2 text-gray-500 text-xs">
              <div className="w-1 h-1 rounded-full bg-[#C9A84C] flex-shrink-0" />
              {ex}
            </div>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-[#C9A84C] bg-[#C9A84C]/10 scale-[1.01]'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#B8923A]">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>
        <p className="text-[#0E1A33] font-semibold text-sm mb-1">
          Dateien hier ablegen oder klicken zum Auswählen
        </p>
        <p className="text-gray-400 text-xs">
          PDF, Excel, CSV, Word, Bilder · Bis zu 50 MB je Datei
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide">
            {files.length} Datei{files.length > 1 ? 'en' : ''} ausgewählt
          </p>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#B8923A" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M4 4h7l5 5v7a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/>
                    <path d="M11 4v5h5"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[#0E1A33] text-sm font-medium truncate">{f.name}</p>
                  <p className="text-gray-400 text-xs">{formatSize(f.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Consent checkboxes */}
      <div className="border border-gray-200 bg-gray-50 rounded-xl p-5 space-y-3">
        <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">
          Erforderliche Bestätigungen
        </p>

        {([
          {
            key: 'upload' as const,
            label: 'Ich bestätige, dass ich berechtigt bin, diese Dokumente hochzuladen, und dass sie keine personenbezogenen Daten enthalten, die ich nicht teilen darf.',
          },
          {
            key: 'noLegal' as const,
            label: 'Ich habe verstanden, dass die Analyse keine Steuer-, Rechts- oder Wirtschaftsprüferberatung ersetzt und betriebswirtschaftliche Entscheidungshilfe ist.',
          },
          {
            key: 'privacy' as const,
            label: 'Ich akzeptiere die Datenschutzbedingungen. Hochgeladene Dateien werden ausschließlich zur Erstellung meiner Analyse verwendet.',
          },
        ]).map(({ key, label }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <div
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                consent[key]
                  ? 'border-au-gold bg-au-gold'
                  : 'border-gray-300 group-hover:border-gray-400'
              }`}
              onClick={() => onConsentChange(key, !consent[key])}
            >
              {consent[key] && (
                <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#0E1A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span
              className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-700 transition-colors"
              onClick={() => onConsentChange(key, !consent[key])}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
