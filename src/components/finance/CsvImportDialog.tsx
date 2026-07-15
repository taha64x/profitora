'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { parseCsv, parseGermanAmount, parseFlexibleDate, guessColumns, type ParsedCsv } from '@/lib/csv'

interface Area { id: string; name: string }
interface Props {
  kind: 'expense' | 'revenue'
  categories: string[]
  open: boolean
  onClose: () => void
  onDone: () => void
}

type SignFilter = 'all' | 'negative' | 'positive'

export default function CsvImportDialog({ kind, categories, open, onClose, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csv, setCsv] = useState<ParsedCsv | null>(null)
  const [cols, setCols] = useState({ date: -1, amount: -1, description: -1, vendor: -1 })
  const [sign, setSign] = useState<SignFilter>(kind === 'expense' ? 'negative' : 'positive')
  const [category, setCategory] = useState(categories[0] ?? 'Sonstiges')
  const [areas, setAreas] = useState<Area[]>([])
  const [areaId, setAreaId] = useState('')
  const [vatRate, setVatRate] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/areas').then((r) => r.json()).then((d) => d?.success && setAreas(d.data)).catch(() => {})
  }, [open])

  async function handleFile(file: File) {
    const parsed = parseCsv(await file.text())
    setCsv(parsed)
    const g = guessColumns(parsed.headers)
    setCols({ date: g.date ?? -1, amount: g.amount ?? -1, description: g.description ?? -1, vendor: g.vendor ?? -1 })
  }

  const rows = useMemo(() => {
    if (!csv || cols.date < 0 || cols.amount < 0 || cols.description < 0) return []
    return csv.rows
      .map((r) => {
        const date = parseFlexibleDate(r[cols.date] ?? '')
        const amount = parseGermanAmount(r[cols.amount] ?? '')
        const description = (r[cols.description] ?? '').trim()
        if (!date || amount === null || amount === 0 || !description) return null
        if (sign === 'negative' && amount >= 0) return null
        if (sign === 'positive' && amount <= 0) return null
        return {
          date: date.toISOString(),
          amount: Math.abs(amount),
          description,
          vendor: cols.vendor >= 0 ? (r[cols.vendor] ?? '').trim() || undefined : undefined,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [csv, cols, sign])

  async function handleImport() {
    setBusy(true)
    try {
      const res = await fetch('/api/finance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          rows,
          defaults: { category, areaId: areaId || undefined, vatRate: vatRate ? Number(vatRate) : undefined },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import fehlgeschlagen')
      toast.success(
        `${data.data.imported} importiert · ${data.data.skippedDuplicates} Duplikate übersprungen · ${data.data.invalid} ungültig`,
      )
      onDone()
      onClose()
      setCsv(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const colSelect = (label: string, key: keyof typeof cols, required: boolean) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}{required ? ' *' : ''}</label>
      <select
        value={cols[key]}
        onChange={(e) => setCols((c) => ({ ...c, [key]: Number(e.target.value) }))}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
      >
        <option value={-1}>–</option>
        {csv?.headers.map((h, i) => (
          <option key={i} value={i}>{h}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">CSV importieren ({kind === 'expense' ? 'Ausgaben' : 'Einnahmen'})</h2>
        <p className="text-xs text-gray-500 mb-4">Bankexport hochladen — Duplikate werden automatisch übersprungen.</p>

        {!csv ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 text-sm text-gray-500 hover:border-gray-400"
          >
            CSV-Datei wählen
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {colSelect('Datum', 'date', true)}
              {colSelect('Betrag', 'amount', true)}
              {colSelect('Beschreibung', 'description', true)}
              {colSelect('Gegenpartei', 'vendor', false)}
            </div>
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
              {(['all', 'negative', 'positive'] as SignFilter[]).map((s) => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={sign === s} onChange={() => setSign(s)} />
                  {s === 'all' ? 'Alle Zeilen' : s === 'negative' ? 'Nur negative (Abbuchungen)' : 'Nur positive (Eingänge)'}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bereich</label>
                <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">–</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">MwSt</label>
                <select value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">–</option>
                  <option value="0">0 %</option>
                  <option value="7">7 %</option>
                  <option value="19">19 %</option>
                </select>
              </div>
            </div>
            <div className="border border-gray-100 rounded-lg mb-4 overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{new Date(r.date).toLocaleDateString('de-DE')}</td>
                      <td className="px-3 py-1.5 font-medium whitespace-nowrap">{r.amount.toLocaleString('de-DE')} €</td>
                      <td className="px-3 py-1.5 text-gray-600 truncate max-w-[240px]">{r.description}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td className="px-3 py-4 text-gray-400 text-center">Keine gültigen Zeilen — Spalten-Zuordnung prüfen.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{rows.length} gültige Zeilen</p>
              <div className="flex gap-2">
                <button onClick={() => setCsv(null)} className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Andere Datei</button>
                <button
                  onClick={handleImport}
                  disabled={busy || rows.length === 0}
                  className="text-xs px-4 py-2 rounded-lg bg-[#0D1630] text-white disabled:opacity-50"
                >
                  {busy ? 'Importiert…' : `${rows.length} Zeilen importieren`}
                </button>
              </div>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  )
}
