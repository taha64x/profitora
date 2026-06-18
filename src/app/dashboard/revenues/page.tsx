'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

const CATEGORIES = ['Produktverkauf', 'Dienstleistung', 'Online-Shop', 'Stammkunde', 'Neukunde', 'Plattform', 'Barzahlung', 'Überweisung', 'Sonstiges']
const PAYMENT_STATUSES = [{ value: 'paid', label: 'Bezahlt' }, { value: 'open', label: 'Offen' }, { value: 'cancelled', label: 'Storniert' }]

interface Revenue {
  id: string; date: string; category: string; description: string
  amount: number; currency: string; customerOrSource?: string
  paymentStatus: string; isRecurring: boolean; notes?: string
}

const EMPTY: Omit<Revenue, 'id'> = {
  date: new Date().toISOString().split('T')[0], category: 'Dienstleistung',
  description: '', amount: 0, currency: 'EUR', customerOrSource: '',
  paymentStatus: 'paid', isRecurring: false, notes: '',
}

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:      'bg-green-50 text-green-700',
    open:      'bg-yellow-50 text-yellow-700',
    cancelled: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = { paid: 'Bezahlt', open: 'Offen', cancelled: 'Storniert' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{labels[status] ?? status}</span>
}

function Modal({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void
  onSave: (d: Omit<Revenue, 'id'>) => void
  initial?: Omit<Revenue, 'id'>
}) {
  const [form, setForm] = useState(initial ?? EMPTY)
  useEffect(() => setForm(initial ?? EMPTY), [initial, open])
  if (!open) return null
  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{initial ? 'Einnahme bearbeiten' : 'Neue Einnahme'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Datum *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="input" required/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Betrag (€) *</label>
              <input type="number" step="0.01" min="0" value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} placeholder="0,00" className="input" required/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kategorie *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung *</label>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="z.B. Beratungsleistung Kunde A" className="input" required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kunde / Quelle</label>
              <input type="text" value={form.customerOrSource} onChange={(e) => set('customerOrSource', e.target.value)} placeholder="z.B. Max Mustermann" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Zahlungsstatus</label>
              <select value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)} className="input">
                {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notiz</label>
            <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optionale Notiz" className="input"/>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)} className="rounded border-gray-300"/>
            <span className="text-sm text-gray-600">Wiederkehrende Einnahme</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 btn-outline">Abbrechen</button>
          <button onClick={() => onSave(form)} disabled={!form.description || !form.amount} className="flex-1 btn-primary disabled:opacity-40">Speichern</button>
        </div>
      </div>
    </div>
  )
}

export default function RevenuesPage() {
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Revenue | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMonth) params.set('month', filterMonth)
    if (filterCat) params.set('category', filterCat)
    const res = await fetch(`/api/revenues?${params}`)
    const json = await res.json()
    if (json.success) setRevenues(json.data)
    setLoading(false)
  }, [filterMonth, filterCat])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: Omit<Revenue, 'id'>) => {
    try {
      const res = editTarget
        ? await fetch('/api/revenues', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, id: editTarget.id }) })
        : await fetch('/api/revenues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editTarget ? 'Einnahme aktualisiert' : 'Einnahme gespeichert')
    } catch {
      toast.error('Fehler beim Speichern')
    }
    setModalOpen(false); setEditTarget(null); load()
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/revenues?id=${id}`, { method: 'DELETE' })
      toast.success('Einnahme gelöscht')
    } catch {
      toast.error('Fehler beim Löschen')
    }
    setDeleting(null); load()
  }

  const filtered = revenues.filter((r) =>
    (!search || r.description.toLowerCase().includes(search.toLowerCase()) || (r.customerOrSource ?? '').toLowerCase().includes(search.toLowerCase()))
  )
  const total = filtered.reduce((s, r) => s + r.amount, 0)
  const paid = filtered.filter((r) => r.paymentStatus === 'paid').reduce((s, r) => s + r.amount, 0)
  const open = filtered.filter((r) => r.paymentStatus === 'open').reduce((s, r) => s + r.amount, 0)
  const topSource = Object.entries(filtered.reduce<Record<string, number>>((a, r) => ({ ...a, [r.category]: (a[r.category] || 0) + r.amount }), {})).sort((a, b) => b[1] - a[1])[0]

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Einnahmen</h1>
            <p className="text-gray-500 text-sm mt-0.5">Umsatz und Einnahmequellen verwalten</p>
          </div>
          <button onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Einnahme hinzufügen
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Gesamteinnahmen', value: formatEur(total), color: 'text-green-600' },
            { label: 'Bezahlt', value: formatEur(paid), color: 'text-green-600' },
            { label: 'Offen', value: formatEur(open), color: 'text-yellow-600' },
            { label: 'Größte Quelle', value: topSource ? topSource[0] : '–', color: 'text-gray-900' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input w-40 text-sm"/>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input w-44 text-sm">
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen…" className="input flex-1 min-w-40 text-sm"/>
        </div>

        <div className="table-card">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Datum', 'Kategorie', 'Beschreibung', 'Kunde / Quelle', 'Status', 'Wiederh.', 'Betrag', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Lädt…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-gray-400 mb-3">Noch keine Einnahmen für diesen Zeitraum.</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-4 py-2">+ Einnahme hinzufügen</button>
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(r.date).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-48 truncate">{r.description}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{r.customerOrSource || '–'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.paymentStatus}/></td>
                  <td className="px-4 py-3">{r.isRecurring && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Wiederh.</span>}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold whitespace-nowrap">{formatEur(r.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTarget(r); setModalOpen(true) }} className="text-gray-400 hover:text-[#0D1630] p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M11 2L14 5L5 14H2V11L11 2Z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
              <span className="text-xs text-gray-500">{filtered.length} Einträge</span>
              <span className="text-sm font-bold text-green-600">{formatEur(total)}</span>
            </div>
          )}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }} onSave={handleSave}
        initial={editTarget ? { date: editTarget.date, category: editTarget.category, description: editTarget.description, amount: editTarget.amount, currency: editTarget.currency, customerOrSource: editTarget.customerOrSource, paymentStatus: editTarget.paymentStatus, isRecurring: editTarget.isRecurring, notes: editTarget.notes } : undefined}/>
    </DashboardLayout>
  )
}
