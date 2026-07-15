'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useModalDismiss } from '@/components/ui/useModalDismiss'
import { parseGermanAmount } from '@/lib/csv'

interface Measure {
  id: string
  title: string
  description?: string | null
  potentialSavingsCents?: number | null
  status: 'OPEN' | 'IMPLEMENTED' | 'DISCARDED'
  implementedAt?: string | null
  createdAt: string
}

const TABS = [
  { value: 'OPEN', label: 'Offen' },
  { value: 'IMPLEMENTED', label: 'Umgesetzt' },
  { value: 'DISCARDED', label: 'Verworfen' },
] as const

export default function MeasuresPage() {
  const [measures, setMeasures] = useState<Measure[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Measure['status']>('OPEN')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', savingsEur: '' })
  const dismissModal = useModalDismiss(modalOpen, () => setModalOpen(false))

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/measures')
    const json = await res.json()
    if (json.success) setMeasures(json.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const res = await fetch('/api/measures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        potentialSavingsCents: (() => {
          const parsed = form.savingsEur ? parseGermanAmount(form.savingsEur) : null
          return parsed && parsed > 0 ? Math.round(parsed * 100) : null
        })(),
      }),
    })
    if (!res.ok) toast.error('Fehler beim Speichern')
    else {
      toast.success('Maßnahme angelegt')
      setModalOpen(false)
      setForm({ title: '', description: '', savingsEur: '' })
    }
    load()
  }

  const setStatus = async (m: Measure, status: Measure['status']) => {
    await fetch('/api/measures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, status }) })
    load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/measures?id=${id}`, { method: 'DELETE' })
    load()
  }

  const visible = measures.filter((m) => m.status === tab)
  const openSavings = measures
    .filter((m) => m.status === 'OPEN')
    .reduce((s, m) => s + (m.potentialSavingsCents ?? 0), 0)

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maßnahmen</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Empfehlungen aus Ihren Analysen nachhalten — die nächste Analyse bewertet die Wirkung umgesetzter Maßnahmen.
            </p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Maßnahme
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`text-sm font-semibold px-4 py-2 rounded-full ${tab === t.value ? 'bg-[#0D1630] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {t.label} ({measures.filter((m) => m.status === t.value).length})
            </button>
          ))}
          {openSavings > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              Offenes Potenzial: <strong className="text-green-600">{(openSavings / 100).toLocaleString('de-DE')} €</strong>
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Lädt…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-gray-500 text-sm mb-3">
              {tab === 'OPEN'
                ? 'Keine offenen Maßnahmen. Übernehmen Sie Empfehlungen aus Ihrem letzten Analysebericht.'
                : 'Nichts hier.'}
            </p>
            {tab === 'OPEN' && (
              <Link href="/dashboard/analyses" className="btn-primary text-xs px-4 py-2 inline-block">Zu den Analysen</Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {visible.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="font-semibold text-gray-900 text-sm">{m.title}</h2>
                  {m.potentialSavingsCents ? (
                    <span className="text-xs font-bold text-green-600 whitespace-nowrap">
                      ≈ {(m.potentialSavingsCents / 100).toLocaleString('de-DE')} €
                    </span>
                  ) : null}
                </div>
                {m.description && <p className="text-gray-500 text-xs leading-relaxed mb-3">{m.description}</p>}
                <p className="text-[11px] text-gray-400 mb-3">
                  Angelegt {new Date(m.createdAt).toLocaleDateString('de-DE')}
                  {m.implementedAt ? ` · Umgesetzt ${new Date(m.implementedAt).toLocaleDateString('de-DE')}` : ''}
                </p>
                <div className="flex items-center gap-2">
                  {m.status !== 'IMPLEMENTED' && (
                    <button onClick={() => setStatus(m, 'IMPLEMENTED')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                      Umgesetzt
                    </button>
                  )}
                  {m.status !== 'DISCARDED' && (
                    <button onClick={() => setStatus(m, 'DISCARDED')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                      Verwerfen
                    </button>
                  )}
                  {m.status !== 'OPEN' && (
                    <button onClick={() => setStatus(m, 'OPEN')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                      Wieder öffnen
                    </button>
                  )}
                  <button onClick={() => remove(m.id)} className="ml-auto text-gray-300 hover:text-red-500 p-1">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={dismissModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Neue Maßnahme</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titel *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="z.B. Energieanbieter wechseln" className="input" autoFocus/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} className="input" placeholder="Aus dem Analysebericht kopieren oder eigene Notiz"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Geschätzte Ersparnis (€/Jahr)</label>
                <input type="text" inputMode="decimal" placeholder="0,00" value={form.savingsEur} onChange={(e) => setForm((f) => ({ ...f, savingsEur: e.target.value }))} className="input"/>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 btn-outline">Abbrechen</button>
              <button onClick={save} disabled={!form.title} className="flex-1 btn-primary disabled:opacity-40">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
