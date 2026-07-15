'use client'

import { useRef, useState } from 'react'

interface Props {
  value: { path: string; name: string } | null
  onChange: (v: { path: string; name: string } | null) => void
}

export default function ReceiptField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/finance/receipt', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen')
      onChange(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Beleg (optional)</label>
      {value ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate max-w-[200px] text-gray-700">📎 {value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline">
            Entfernen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-gray-400 w-full text-left disabled:opacity-60"
        >
          {uploading ? 'Lädt hoch…' : 'Foto oder PDF anhängen'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
