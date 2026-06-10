'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'

interface Target {
  id: string
  year: number
  month: number
  revenueTarget: number | null
  expenseTarget: number | null
  note: string | null
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function ZielePage() {
  const now = new Date()
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    revenueTarget: '',
    expenseTarget: '',
    note: '',
  })

  useEffect(() => {
    fetch('/api/monthly-targets')
      .then((r) => r.json())
      .then((d) => { setTargets(d.targets ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/monthly-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: form.year,
          month: form.month,
          revenueTarget: form.revenueTarget ? Number(form.revenueTarget) : null,
          expenseTarget: form.expenseTarget ? Number(form.expenseTarget) : null,
          note: form.note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTargets((prev) => {
        const filtered = prev.filter((t) => !(t.year === form.year && t.month === form.month))
        return [...filtered, data.target].sort((a, b) => b.year - a.year || b.month - a.month)
      })
      toast.success('Ziel gespeichert')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Speichern'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/monthly-targets?id=${id}`, { method: 'DELETE' })
      setTargets((prev) => prev.filter((t) => t.id !== id))
      toast.success('Ziel gelöscht')
    } catch {
      toast.error('Fehler beim Löschen')
    }
  }

  // Pre-fill from existing target when month/year changes
  useEffect(() => {
    const existing = targets.find((t) => t.year === form.year && t.month === form.month)
    if (existing) {
      setForm((f) => ({
        ...f,
        revenueTarget: existing.revenueTarget?.toString() ?? '',
        expenseTarget: existing.expenseTarget?.toString() ?? '',
        note: existing.note ?? '',
      }))
    } else {
      setForm((f) => ({ ...f, revenueTarget: '', expenseTarget: '', note: '' }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.year, form.month, targets.length])

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/mein-weg" className="text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monatliche Ziele setzen</h1>
            <p className="text-gray-500 text-sm mt-0.5">Definieren Sie Ihre Ziel-Werte — der Fortschritt wird automatisch berechnet.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Ziel hinzufügen / bearbeiten</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monat</label>
              <select
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D1630]/20 focus:border-[#0D1630] outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jahr</label>
              <select
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D1630]/20 focus:border-[#0D1630] outline-none"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Umsatzziel (€)
                <span className="ml-1 text-gray-400 font-normal">optional</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.revenueTarget}
                onChange={(e) => setForm((f) => ({ ...f, revenueTarget: e.target.value }))}
                placeholder="z.B. 15000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D1630]/20 focus:border-[#0D1630] outline-none"
              />
              {form.revenueTarget && (
                <p className="text-xs text-gray-400 mt-1">{formatEur(Number(form.revenueTarget))}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ausgaben-Limit (€)
                <span className="ml-1 text-gray-400 font-normal">optional</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.expenseTarget}
                onChange={(e) => setForm((f) => ({ ...f, expenseTarget: e.target.value }))}
                placeholder="z.B. 8000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D1630]/20 focus:border-[#0D1630] outline-none"
              />
              {form.expenseTarget && (
                <p className="text-xs text-gray-400 mt-1">{formatEur(Number(form.expenseTarget))}</p>
              )}
            </div>
          </div>

          {form.revenueTarget && form.expenseTarget && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
              Ziel-Ergebnis: <strong>{formatEur(Number(form.revenueTarget) - Number(form.expenseTarget))}</strong>
              {' '}({((Number(form.revenueTarget) - Number(form.expenseTarget)) / Number(form.revenueTarget) * 100).toFixed(1)} % Marge)
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notiz <span className="text-gray-400 font-normal">optional</span></label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="z.B. Nach KI-Analyse optimierte Zielwerte"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D1630]/20 focus:border-[#0D1630] outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-[#0D1630] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors disabled:opacity-60"
          >
            {saving ? 'Speichern...' : 'Ziel speichern'}
          </button>
        </form>

        {/* Existing targets */}
        {!loading && targets.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Gespeicherte Ziele</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Monat</th>
                  <th className="text-right px-4 py-3">Umsatzziel</th>
                  <th className="text-right px-4 py-3">Ausgaben-Limit</th>
                  <th className="text-right px-4 py-3">Ziel-Gewinn</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => {
                  const profit = (t.revenueTarget ?? 0) - (t.expenseTarget ?? 0)
                  return (
                    <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {MONTHS[t.month - 1]} {t.year}
                        {t.note && <p className="text-xs text-gray-400 font-normal">{t.note}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-green-700">
                        {t.revenueTarget ? formatEur(t.revenueTarget) : '–'}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {t.expenseTarget ? formatEur(t.expenseTarget) : '–'}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {t.revenueTarget && t.expenseTarget ? formatEur(profit) : '–'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
