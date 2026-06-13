'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_FIELD_DEFINITIONS, UPLOAD_CATEGORY_LABELS } from '@/types'
import type { UploadCategory } from '@/types'
import { IconClipboard, IconFileText } from '@/components/ui/icons'

interface ColumnMapperProps {
  uploadId: string
}

interface HeadersResponse {
  success: boolean
  columns: string[]
  existingMapping: Record<string, string> | null
  category: UploadCategory
  originalName: string
  error?: string
}

const NONE_VALUE = '__none__'

export default function ColumnMapper({ uploadId }: ColumnMapperProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState<HeadersResponse | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadHeaders() {
      try {
        const res = await fetch(`/api/upload/${uploadId}/headers`)
        const data: HeadersResponse = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Spalten konnten nicht geladen werden.')
          setLoading(false)
          return
        }
        setInfo(data)
        setMapping(data.existingMapping ?? {})
      } catch {
        setError('Verbindungsfehler beim Laden der Spalteninformationen.')
      } finally {
        setLoading(false)
      }
    }
    loadHeaders()
  }, [uploadId])

  function setField(fieldKey: string, column: string) {
    setMapping((prev) => {
      const next = { ...prev }
      if (column === NONE_VALUE) {
        delete next[fieldKey]
      } else {
        next[fieldKey] = column
      }
      return next
    })
  }

  async function handleSave() {
    if (!info) return

    const fields = CATEGORY_FIELD_DEFINITIONS[info.category]
    const missingRequired = fields.filter((f) => f.required && !mapping[f.key])
    if (missingRequired.length > 0) {
      setError(`Pflichtfeld fehlt: ${missingRequired.map((f) => f.label).join(', ')}`)
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/column-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, mapping }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Speichern fehlgeschlagen.')
        return
      }
      router.push('/upload')
    } catch {
      setError('Verbindungsfehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="flex justify-center mb-3 animate-pulse text-hotel-navy/50">
            <IconClipboard className="w-8 h-8" />
          </div>
          <p className="text-gray-500">Datei wird gelesen...</p>
        </div>
      </div>
    )
  }

  if (error && !info) {
    return (
      <div className="card p-6 border-red-200 bg-red-50">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={() => router.push('/upload')}
          className="mt-4 btn-outline text-sm"
        >
          Zurück zum Upload
        </button>
      </div>
    )
  }

  if (!info) return null

  const fields = CATEGORY_FIELD_DEFINITIONS[info.category]

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="card p-5 border-hotel-navy/20 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <span className="text-hotel-navy/60"><IconFileText className="w-6 h-6" /></span>
          <div>
            <p className="font-semibold text-gray-900">{info.originalName}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Kategorie: <span className="font-medium text-hotel-navy">{UPLOAD_CATEGORY_LABELS[info.category]}</span>
              {' · '}
              {info.columns.length} Spalten erkannt
            </p>
          </div>
        </div>
      </div>

      {/* Mapping table */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Spalten zuordnen</h2>
        <p className="text-sm text-gray-500 mb-5">
          Wählen Sie, welche Spalte aus Ihrer Datei welchem Analysefeld entspricht.
          Pflichtfelder (<span className="text-red-500">*</span>) müssen zugeordnet werden.
        </p>

        {fields.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            Für die Kategorie „Sonstiges" ist keine Zuordnung erforderlich.
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {field.hint && (
                    <p className="text-xs text-gray-400 mt-0.5">{field.hint}</p>
                  )}
                </div>
                <div>
                  <select
                    value={mapping[field.key] ?? NONE_VALUE}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={`input w-full text-sm ${
                      field.required && !mapping[field.key]
                        ? 'border-red-300 focus:ring-red-300'
                        : ''
                    }`}
                  >
                    <option value={NONE_VALUE}>
                      {field.required ? '— Bitte auswählen —' : '— Nicht zuordnen —'}
                    </option>
                    {info.columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detected columns preview */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Erkannte Spalten in Ihrer Datei ({info.columns.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {info.columns.map((col) => {
            const isMapped = Object.values(mapping).includes(col)
            return (
              <span
                key={col}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  isMapped
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                {isMapped ? '✓ ' : ''}{col}
              </span>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2.5 disabled:opacity-50"
        >
          {saving ? 'Wird gespeichert...' : 'Zuordnung speichern →'}
        </button>
        <button
          onClick={() => router.push('/upload')}
          className="btn-outline px-6 py-2.5"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
