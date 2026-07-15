'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useModalDismiss } from '@/components/ui/useModalDismiss'
import { labelToMinutes, minutesToLabel, plannedWageCents, weekDates } from '@/lib/shifts'

interface Area { id: string; name: string }
interface Employee { id: string; name: string; color: string; active: boolean; hourlyWageCents?: number | null }
interface Shift {
  id: string; employeeId: string; date: string; startMin: number; endMin: number
  note?: string | null; area?: Area | null
}
interface Absence { id: string; employeeId: string; startDate: string; endDate: string; type: string }
interface Template { id: string; label: string; startMin: number; endMin: number }

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function mondayOf(offsetWeeks: number): string {
  const today = new Date()
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offsetWeeks * 7))
  return weekDates(base)[0]
}

interface ShiftForm {
  employeeId: string
  dateKey: string
  start: string
  end: string
  areaId: string
  note: string
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(0))
  const [days, setDays] = useState<string[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<ShiftForm | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const dismissModal = useModalDismiss(Boolean(form), () => { setForm(null); setEditId(null) })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/team/shifts?week=${weekStart}`)
    const json = await res.json()
    if (json.success) {
      setDays(json.data.days)
      setShifts(json.data.shifts)
      setAbsences(json.data.absences)
    }
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/team/employees').then((r) => r.json()).then((d) => d?.success && setEmployees(d.data)).catch(() => {})
    fetch('/api/areas').then((r) => r.json()).then((d) => d?.success && setAreas(d.data)).catch(() => {})
    fetch('/api/team/templates').then((r) => r.json()).then((d) => d?.success && setTemplates(d.data)).catch(() => {})
  }, [])

  const active = useMemo(() => employees.filter((e) => e.active), [employees])
  const empById = useMemo(() => new Map(active.map((e) => [e.id, e])), [active])

  const isAbsentOn = useCallback(
    (employeeId: string, dateKey: string) =>
      absences.some((a) => a.employeeId === employeeId && a.startDate.slice(0, 10) <= dateKey && dateKey <= a.endDate.slice(0, 10)),
    [absences],
  )

  const weekMinutes = shifts.reduce((s, sh) => s + (sh.endMin - sh.startMin), 0)
  const wageCents = plannedWageCents(
    shifts,
    new Map(active.map((e) => [e.id, { hourlyWageCents: e.hourlyWageCents ?? null }])),
  )

  const navigate = (dir: -1 | 0 | 1) => {
    if (dir === 0) return setWeekStart(mondayOf(0))
    const d = new Date(`${weekStart}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + dir * 7)
    setWeekStart(d.toISOString().slice(0, 10))
  }

  const openNew = (employeeId: string, dateKey: string) =>
    setForm({ employeeId, dateKey, start: '08:00', end: '16:00', areaId: '', note: '' })

  const openEdit = (s: Shift) => {
    setEditId(s.id)
    setForm({
      employeeId: s.employeeId,
      dateKey: s.date.slice(0, 10),
      start: minutesToLabel(s.startMin),
      end: minutesToLabel(s.endMin),
      areaId: s.area?.id ?? '',
      note: s.note ?? '',
    })
  }

  const closeModal = () => { setForm(null); setEditId(null) }

  const save = async () => {
    if (!form) return
    const startMin = labelToMinutes(form.start)
    const endMin = labelToMinutes(form.end)
    if (startMin === null || endMin === null || endMin <= startMin) {
      toast.error('Ungültige Zeiten (Ende muss nach Beginn liegen).')
      return
    }
    const payload = {
      id: editId ?? undefined,
      employeeId: form.employeeId,
      date: form.dateKey,
      startMin,
      endMin,
      areaId: form.areaId || null,
      note: form.note,
    }
    const res = await fetch('/api/team/shifts', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Fehler beim Speichern')
    else { toast.success('Gespeichert'); closeModal() }
    load()
  }

  const remove = async () => {
    if (!editId) return
    await fetch(`/api/team/shifts?id=${editId}`, { method: 'DELETE' })
    toast.success('Schicht gelöscht')
    closeModal()
    load()
  }

  const copyLastWeek = async () => {
    const prev = new Date(`${weekStart}T00:00:00.000Z`)
    prev.setUTCDate(prev.getUTCDate() - 7)
    const res = await fetch('/api/team/shifts/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromWeek: prev.toISOString().slice(0, 10), toWeek: weekStart }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Kopieren fehlgeschlagen')
    else toast.success(`${data.data.copied} Schichten kopiert${data.data.skipped ? `, ${data.data.skipped} übersprungen` : ''}`)
    load()
  }

  const shareLink = async () => {
    const res = await fetch('/api/team/share')
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Fehler'); return }
    try {
      await navigator.clipboard.writeText(data.data.url)
      toast.success('Plan-Link kopiert — Mitarbeiter sehen den Plan ohne Login')
    } catch {
      toast.info(data.data.url)
    }
  }

  const applyTemplate = (t: Template) =>
    setForm((f) => (f ? { ...f, start: minutesToLabel(t.startMin), end: minutesToLabel(t.endMin) } : f))

  const saveAsTemplate = async () => {
    if (!form) return
    const startMin = labelToMinutes(form.start)
    const endMin = labelToMinutes(form.end)
    if (startMin === null || endMin === null || endMin <= startMin) return
    const label = `${form.start}–${form.end}`
    const res = await fetch('/api/team/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, startMin, endMin }),
    })
    if (res.ok) {
      toast.success('Als Vorlage gespeichert')
      fetch('/api/team/templates').then((r) => r.json()).then((d) => d?.success && setTemplates(d.data))
    }
  }

  const fmt = (key: string) => new Date(`${key}T00:00:00.000Z`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schichtplan</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {days.length ? `${fmt(days[0])} – ${fmt(days[6])}` : ''} · {(weekMinutes / 60).toLocaleString('de-DE')} Std. geplant
              {wageCents > 0 ? ` · ≈ ${(wageCents / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })} € Lohnkosten (Stundenlöhne)` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLastWeek} className="border border-gray-300 text-gray-700 font-semibold text-xs px-3 py-2.5 rounded-xl hover:border-gray-400">
              Vorwoche kopieren
            </button>
            <button onClick={shareLink} className="border border-gray-300 text-gray-700 font-semibold text-xs px-3 py-2.5 rounded-xl hover:border-gray-400">
              Plan teilen
            </button>
            <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden text-sm">
              <button onClick={() => navigate(-1)} className="px-3 py-2.5 hover:bg-gray-50">‹</button>
              <button onClick={() => navigate(0)} className="px-3 py-2.5 border-x border-gray-300 hover:bg-gray-50 text-xs font-semibold">Heute</button>
              <button onClick={() => navigate(1)} className="px-3 py-2.5 hover:bg-gray-50">›</button>
            </div>
          </div>
        </div>

        {active.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-gray-500 text-sm mb-3">Legen Sie zuerst Mitarbeiter an, um den Schichtplan zu nutzen.</p>
            <a href="/dashboard/team" className="btn-primary text-xs px-4 py-2 inline-block">Zu den Mitarbeitern</a>
          </div>
        ) : (
          <div className="table-card overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-40">Mitarbeiter</th>
                  {days.map((d, i) => (
                    <th key={d} className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {DAY_LABELS[i]} <span className="text-gray-400 font-normal">{fmt(d)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={8} rows={3} />
                ) : active.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 align-top">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: emp.color }}/>
                      {emp.name}
                    </td>
                    {days.map((d) => {
                      const absent = isAbsentOn(emp.id, d)
                      const cellShifts = shifts.filter((s) => s.employeeId === emp.id && s.date.slice(0, 10) === d)
                      return (
                        <td key={d} className={`px-1.5 py-2 ${absent ? 'bg-gray-100' : ''}`}>
                          <div className="space-y-1 min-h-[34px]">
                            {absent && <span className="block text-[10px] text-gray-400 px-1">Abwesend</span>}
                            {cellShifts.map((s) => (
                              <button key={s.id} onClick={() => openEdit(s)}
                                className="block w-full text-left rounded-md px-1.5 py-1 text-[11px] font-medium text-white hover:opacity-85 transition-opacity"
                                style={{ backgroundColor: emp.color }}>
                                {minutesToLabel(s.startMin)}–{minutesToLabel(s.endMin)}
                                {s.area ? <span className="opacity-75"> · {s.area.name}</span> : null}
                              </button>
                            ))}
                            {!absent && (
                              <button onClick={() => openNew(emp.id, d)}
                                className="block w-full rounded-md border border-dashed border-gray-200 text-gray-300 hover:text-gray-500 hover:border-gray-400 text-[11px] py-0.5 transition-colors">
                                +
                              </button>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schicht-Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={dismissModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editId ? 'Schicht bearbeiten' : 'Neue Schicht'} · {empById.get(form.employeeId)?.name} · {fmt(form.dateKey)}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {templates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => applyTemplate(t)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Beginn *</label>
                  <input type="time" value={form.start} onChange={(e) => setForm((f) => f && { ...f, start: e.target.value })} className="input"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ende *</label>
                  <input type="time" value={form.end} onChange={(e) => setForm((f) => f && { ...f, end: e.target.value })} className="input"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bereich</label>
                <select value={form.areaId} onChange={(e) => setForm((f) => f && { ...f, areaId: e.target.value })} className="input">
                  <option value="">Ohne Bereich</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notiz</label>
                <input type="text" value={form.note} onChange={(e) => setForm((f) => f && { ...f, note: e.target.value })} className="input"/>
              </div>
              <button onClick={saveAsTemplate} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Zeiten als Vorlage speichern
              </button>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              {editId && (
                <button onClick={remove} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50">
                  Löschen
                </button>
              )}
              <button onClick={closeModal} className="flex-1 btn-outline">Abbrechen</button>
              <button onClick={save} className="flex-1 btn-primary">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
