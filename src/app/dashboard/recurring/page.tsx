'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AmountInput from '@/components/ui/AmountInput'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useModalDismiss } from '@/components/ui/useModalDismiss'
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES, RECURRENCE_INTERVALS } from '@/lib/finance-categories'

interface Area { id: string; name: string }

interface RecurringEntry {
  id: string
  kind: 'INCOME' | 'EXPENSE'
  amount: number
  category: string
  areaId?: string | null
  areaName?: string | null
  vatRate?: number | null
  vendor?: string | null
  description: string
  interval: string
  nextRun: string
  active: boolean
}

interface FormState {
  kind: 'INCOME' | 'EXPENSE'
  amount: number
  category: string
  areaId: string
  vatRate: string
  vendor: string
  description: string
  interval: string
  nextRun: string
}

const EMPTY = (kind: 'INCOME' | 'EXPENSE'): FormState => ({
  kind,
  amount: 0,
  category: kind === 'EXPENSE' ? 'Miete' : 'Dienstleistung',
  areaId: '',
  vatRate: '',
  vendor: '',
  description: '',
  interval: 'monthly',
  nextRun: new Date().toISOString().split('T')[0],
})

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

const INTERVAL_LABELS: Record<string, string> = { monthly: 'Monatlich', quarterly: 'Quartalsweise', yearly: 'Jährlich' }

function Modal({ open, onClose, onSave, initial, areas, kind }: {
  open: boolean; onClose: () => void
  onSave: (d: FormState) => void
  initial?: FormState
  areas: Area[]
  kind: 'INCOME' | 'EXPENSE'
}) {
  const [form, setForm] = useState(initial ?? EMPTY(kind))
  useEffect(() => setForm(initial ?? EMPTY(kind)), [initial, open, kind])
  const dismiss = useModalDismiss(open, onClose)
  if (!open) return null
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))
  const categories = form.kind === 'EXPENSE' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={dismiss}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {initial ? 'Posten bearbeiten' : form.kind === 'EXPENSE' ? 'Neue wiederkehrende Ausgabe' : 'Neue wiederkehrende Einnahme'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Betrag (€) *</label>
              <AmountInput value={form.amount} onChange={(n) => set('amount', n)} autoFocus required/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Intervall *</label>
              <select value={form.interval} onChange={(e) => set('interval', e.target.value)} className="input">
                {RECURRENCE_INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung *</label>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={form.kind === 'EXPENSE' ? 'z.B. Monatsmiete Büro' : 'z.B. Wartungsvertrag Kunde A'} className="input" required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategorie *</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{form.kind === 'EXPENSE' ? 'Anbieter' : 'Kunde / Quelle'}</label>
              <input type="text" value={form.vendor} onChange={(e) => set('vendor', e.target.value)} className="input"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bereich</label>
              <select value={form.areaId} onChange={(e) => set('areaId', e.target.value)} className="input">
                <option value="">Ohne</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">MwSt</label>
              <select value={form.vatRate} onChange={(e) => set('vatRate', e.target.value)} className="input">
                <option value="">–</option>
                <option value="0">0 %</option>
                <option value="7">7 %</option>
                <option value="19">19 %</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nächster Lauf *</label>
              <input type="date" value={form.nextRun} onChange={(e) => set('nextRun', e.target.value)} className="input" required/>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Ab dem nächsten Lauf legt Profitora den Eintrag automatisch in {form.kind === 'EXPENSE' ? 'Ausgaben' : 'Einnahmen'} an — im gewählten Intervall, ohne weiteres Zutun.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 btn-outline">Abbrechen</button>
          <button onClick={() => onSave(form)} disabled={!form.description || !form.amount} className="flex-1 btn-primary disabled:opacity-40">Speichern</button>
        </div>
      </div>
    </div>
  )
}

export default function RecurringPage() {
  const [entries, setEntries] = useState<RecurringEntry[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RecurringEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/recurring')
    const json = await res.json()
    if (json.success) setEntries(json.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/areas').then((r) => r.json()).then((d) => d?.success && setAreas(d.data)).catch(() => {})
  }, [])

  const handleSave = async (data: FormState) => {
    const payload = {
      ...data,
      vatRate: data.vatRate === '' ? null : Number(data.vatRate),
      areaId: data.areaId || null,
    }
    try {
      const res = editTarget
        ? await fetch('/api/recurring', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editTarget.id, active: editTarget.active }) })
        : await fetch('/api/recurring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success('Gespeichert')
    } catch {
      toast.error('Fehler beim Speichern')
    }
    setModalOpen(false); setEditTarget(null); load()
  }

  const toggleActive = async (e: RecurringEntry) => {
    await fetch('/api/recurring', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id, active: !e.active }) })
    load()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' })
    toast.success('Gelöscht')
    load()
  }

  const visible = entries.filter((e) => e.kind === tab)
  const monthlySum = visible
    .filter((e) => e.active)
    .reduce((s, e) => s + (e.interval === 'monthly' ? e.amount : e.interval === 'quarterly' ? e.amount / 3 : e.amount / 12), 0)

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wiederkehrende Posten</h1>
            <p className="text-gray-500 text-sm mt-0.5">Miete, Abos & Verträge einmal anlegen — Profitora bucht sie automatisch</p>
          </div>
          <button onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Posten hinzufügen
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['EXPENSE', 'INCOME'] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={`text-sm font-semibold px-4 py-2 rounded-full ${tab === k ? 'bg-[#0D1630] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {k === 'EXPENSE' ? 'Ausgaben' : 'Einnahmen'}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">
            ≈ {formatEur(monthlySum)} / Monat {tab === 'EXPENSE' ? 'fix' : 'wiederkehrend'}
          </span>
        </div>

        <div className="table-card">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Beschreibung', 'Kategorie', 'Bereich', 'Intervall', 'Nächster Lauf', 'Betrag', 'Aktiv', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={8} />
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-gray-400 mb-3">Noch keine wiederkehrenden {tab === 'EXPENSE' ? 'Ausgaben' : 'Einnahmen'}.</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-4 py-2">+ Posten hinzufügen</button>
                  </td>
                </tr>
              ) : visible.map((e) => (
                <tr key={e.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!e.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-56 truncate">{e.description}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    {e.areaName ? <span className="inline-flex items-center text-xs font-medium bg-au-gold/10 text-[#8a6d2f] px-2 py-0.5 rounded-full">{e.areaName}</span> : <span className="text-gray-300">–</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{INTERVAL_LABELS[e.interval] ?? e.interval}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(e.nextRun).toLocaleDateString('de-DE')}</td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${e.kind === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>{formatEur(e.amount)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(e)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${e.active ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={e.active ? 'Aktiv — klicken zum Pausieren' : 'Pausiert — klicken zum Aktivieren'}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${e.active ? 'left-[18px]' : 'left-0.5'}`}/>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTarget(e); setModalOpen(true) }} className="text-gray-400 hover:text-[#0D1630] p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M11 2L14 5L5 14H2V11L11 2Z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }} onSave={handleSave} areas={areas} kind={tab}
        initial={editTarget ? {
          kind: editTarget.kind, amount: editTarget.amount, category: editTarget.category,
          areaId: editTarget.areaId ?? '', vatRate: editTarget.vatRate == null ? '' : String(editTarget.vatRate),
          vendor: editTarget.vendor ?? '', description: editTarget.description,
          interval: editTarget.interval, nextRun: editTarget.nextRun.slice(0, 10),
        } : undefined}/>
    </DashboardLayout>
  )
}
