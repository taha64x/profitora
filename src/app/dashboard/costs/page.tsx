'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

const CATEGORIES = ['Personal', 'Miete', 'Energie', 'Software', 'Marketing', 'Einkauf', 'Fahrzeuge', 'Versicherungen', 'Steuern/Buchhaltung', 'Dienstleister', 'Reparaturen', 'Sonstiges']
const PAYMENT_METHODS = ['Überweisung', 'Kreditkarte', 'Bar', 'SEPA-Lastschrift', 'PayPal', 'Sonstiges']

interface Expense {
  id: string; date: string; category: string; description: string
  amount: number; currency: string; paymentMethod?: string; vendor?: string
  isRecurring: boolean; notes?: string
}

const EMPTY: Omit<Expense, 'id'> = {
  date: new Date().toISOString().split('T')[0], category: 'Sonstiges',
  description: '', amount: 0, currency: 'EUR', paymentMethod: '',
  vendor: '', isRecurring: false, notes: '',
}

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function Modal({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void
  onSave: (data: Omit<Expense, 'id'>) => void
  initial?: Omit<Expense, 'id'>
}) {
  const [form, setForm] = useState(initial ?? EMPTY)
  useEffect(() => setForm(initial ?? EMPTY), [initial, open])
  if (!open) return null

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{initial ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}</h2>
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
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="z.B. Monatsmiete Büro" className="input" required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Zahlungsart</label>
              <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} className="input">
                <option value="">Wählen…</option>
                {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Anbieter</label>
              <input type="text" value={form.vendor} onChange={(e) => set('vendor', e.target.value)} placeholder="z.B. Deutsche Telekom" className="input"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notiz</label>
            <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optionale Notiz" className="input"/>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)} className="rounded border-gray-300"/>
            <span className="text-sm text-gray-600">Wiederkehrende Ausgabe</span>
          </label>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 btn-outline">Abbrechen</button>
          <button onClick={() => onSave(form)} disabled={!form.description || !form.amount}
            className="flex-1 btn-primary disabled:opacity-40">Speichern</button>
        </div>
      </div>
    </div>
  )
}

export default function CostsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMonth) params.set('month', filterMonth)
    if (filterCat) params.set('category', filterCat)
    const res = await fetch(`/api/expenses?${params}`)
    const json = await res.json()
    if (json.success) setExpenses(json.data)
    setLoading(false)
  }, [filterMonth, filterCat])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: Omit<Expense, 'id'>) => {
    try {
      const res = editTarget
        ? await fetch('/api/expenses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, id: editTarget.id }) })
        : await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success(editTarget ? 'Ausgabe aktualisiert' : 'Ausgabe gespeichert')
    } catch {
      toast.error('Fehler beim Speichern')
    }
    setModalOpen(false); setEditTarget(null); load()
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
      toast.success('Ausgabe gelöscht')
    } catch {
      toast.error('Fehler beim Löschen')
    }
    setDeleting(null); load()
  }

  const filtered = expenses.filter((e) =>
    (!search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? '').toLowerCase().includes(search.toLowerCase()))
  )
  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const fixedTotal = filtered.filter((e) => e.isRecurring).reduce((s, e) => s + e.amount, 0)
  const varTotal = total - fixedTotal
  const topCat = Object.entries(filtered.reduce<Record<string, number>>((a, e) => ({ ...a, [e.category]: (a[e.category] || 0) + e.amount }), {})).sort((a, b) => b[1] - a[1])[0]

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kosten</h1>
            <p className="text-gray-500 text-sm mt-0.5">Alle Ausgaben erfassen, verwalten und auswerten</p>
          </div>
          <button onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Ausgabe hinzufügen
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Gesamtkosten', value: formatEur(total), color: 'text-red-600' },
            { label: 'Fixkosten', value: formatEur(fixedTotal), color: 'text-orange-600' },
            { label: 'Variable Kosten', value: formatEur(varTotal), color: 'text-yellow-600' },
            { label: 'Größte Kategorie', value: topCat ? topCat[0] : '–', color: 'text-gray-900' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="input w-40 text-sm"/>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input w-44 text-sm">
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…" className="input flex-1 min-w-40 text-sm"/>
        </div>

        {/* Table */}
        <div className="table-card">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Datum', 'Kategorie', 'Beschreibung', 'Anbieter', 'Zahlungsart', 'Wiederh.', 'Betrag', ''].map((h) => (
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
                    <p className="text-gray-400 mb-3">Noch keine Ausgaben für diesen Zeitraum.</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-4 py-2">+ Ausgabe hinzufügen</button>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(e.date).toLocaleDateString('de-DE')}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium max-w-48 truncate">{e.description}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{e.vendor || '–'}</td>
                    <td className="px-4 py-3 text-gray-500">{e.paymentMethod || '–'}</td>
                    <td className="px-4 py-3">
                      {e.isRecurring && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Wiederh.</span>}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-semibold whitespace-nowrap">{formatEur(e.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTarget(e); setModalOpen(true) }}
                          className="text-gray-400 hover:text-[#0D1630] p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                            <path d="M11 2L14 5L5 14H2V11L11 2Z"/>
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
              <span className="text-xs text-gray-500">{filtered.length} Einträge</span>
              <span className="text-sm font-bold text-red-600">{formatEur(total)}</span>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSave={handleSave} initial={editTarget ? { date: editTarget.date, category: editTarget.category, description: editTarget.description, amount: editTarget.amount, currency: editTarget.currency, paymentMethod: editTarget.paymentMethod, vendor: editTarget.vendor, isRecurring: editTarget.isRecurring, notes: editTarget.notes } : undefined}/>
    </DashboardLayout>
  )
}
