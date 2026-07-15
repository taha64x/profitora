'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useModalDismiss } from '@/components/ui/useModalDismiss'
import { parseGermanAmount } from '@/lib/csv'

interface Area { id: string; name: string }

interface Employee {
  id: string
  name: string
  position?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  hourlyWageCents?: number | null
  monthlySalaryCents?: number | null
  weeklyHours?: number | null
  vacationDaysPerYear?: number | null
  color: string
  active: boolean
  notes?: string | null
}

interface Absence {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  note?: string | null
  employee: { id: string; name: string; color: string }
}

const COLORS = ['#0E1A33', '#C9A84C', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#db2777']
const ABSENCE_TYPES = [
  { value: 'VACATION', label: 'Urlaub' },
  { value: 'SICK', label: 'Krank' },
  { value: 'OFF', label: 'Frei' },
]

interface EmpForm {
  name: string; position: string; email: string; phone: string; address: string
  wageType: 'hourly' | 'salary'; wageEur: string
  weeklyHours: string; vacationDaysPerYear: string; color: string; notes: string
}

const EMPTY_EMP: EmpForm = {
  name: '', position: '', email: '', phone: '', address: '',
  wageType: 'hourly', wageEur: '', weeklyHours: '', vacationDaysPerYear: '', color: COLORS[0], notes: '',
}

function eur(cents?: number | null) {
  return cents ? (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €' : null
}

function EmployeeModal({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void; onSave: (f: EmpForm) => void; initial?: EmpForm
}) {
  const [form, setForm] = useState(initial ?? EMPTY_EMP)
  useEffect(() => setForm(initial ?? EMPTY_EMP), [initial, open])
  const dismiss = useModalDismiss(open, onClose)
  if (!open) return null
  const set = (k: keyof EmpForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={dismiss}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{initial ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="input" autoFocus required/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
              <input type="text" value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="z.B. Service" className="input"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-Mail</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
            <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className="input"/>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vergütung</label>
              <select value={form.wageType} onChange={(e) => set('wageType', e.target.value)} className="input">
                <option value="hourly">Stundenlohn</option>
                <option value="salary">Monatsgehalt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{form.wageType === 'hourly' ? '€ / Stunde' : '€ / Monat'}</label>
              <input type="text" inputMode="decimal" placeholder="0,00" value={form.wageEur} onChange={(e) => set('wageEur', e.target.value)} className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Std. / Woche</label>
              <input type="number" step="0.5" min="0" value={form.weeklyHours} onChange={(e) => set('weeklyHours', e.target.value)} className="input"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Urlaubstage / Jahr</label>
              <input type="number" min="0" value={form.vacationDaysPerYear} onChange={(e) => set('vacationDaysPerYear', e.target.value)} className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Farbe im Plan</label>
              <div className="flex items-center gap-1.5 pt-1">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                    className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ backgroundColor: c }}/>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notiz</label>
            <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} className="input"/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 btn-outline">Abbrechen</button>
          <button onClick={() => onSave(form)} disabled={!form.name} className="flex-1 btn-primary disabled:opacity-40">Speichern</button>
        </div>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [absenceForm, setAbsenceForm] = useState({ employeeId: '', type: 'VACATION', startDate: '', endDate: '', note: '' })
  const [shiftsLocked, setShiftsLocked] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [eRes, aRes] = await Promise.all([fetch('/api/team/employees'), fetch('/api/team/absences')])
    const eJson = await eRes.json()
    if (eJson.success) setEmployees(eJson.data)
    if (aRes.status === 403) {
      setShiftsLocked(true)
    } else {
      const aJson = await aRes.json()
      if (aJson.success) setAbsences(aJson.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (f: EmpForm) => {
    // Deutsche Eingabe erlauben ("16,50" statt nur "16.50")
    const parsedWage = f.wageEur ? parseGermanAmount(f.wageEur) : null
    const wageCents = parsedWage && parsedWage > 0 ? Math.round(parsedWage * 100) : null
    const payload = {
      name: f.name, position: f.position, email: f.email, phone: f.phone, address: f.address,
      hourlyWageCents: f.wageType === 'hourly' ? wageCents : null,
      monthlySalaryCents: f.wageType === 'salary' ? wageCents : null,
      weeklyHours: f.weeklyHours ? Number(f.weeklyHours) : null,
      vacationDaysPerYear: f.vacationDaysPerYear ? Number(f.vacationDaysPerYear) : null,
      color: f.color, notes: f.notes,
    }
    const res = editTarget
      ? await fetch('/api/team/employees', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editTarget.id, active: editTarget.active }) })
      : await fetch('/api/team/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Fehler beim Speichern')
    } else {
      toast.success('Gespeichert')
      setModalOpen(false); setEditTarget(null)
    }
    load()
  }

  const toggleActive = async (e: Employee) => {
    await fetch('/api/team/employees', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id, active: !e.active }) })
    load()
  }

  const addAbsence = async () => {
    const res = await fetch('/api/team/absences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(absenceForm) })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Fehler')
    else {
      toast.success('Abwesenheit eingetragen')
      setAbsenceForm({ employeeId: '', type: 'VACATION', startDate: '', endDate: '', note: '' })
    }
    load()
  }

  const deleteAbsence = async (id: string) => {
    await fetch(`/api/team/absences?id=${id}`, { method: 'DELETE' })
    load()
  }

  const active = employees.filter((e) => e.active)
  const typeLabel = (t: string) => ABSENCE_TYPES.find((x) => x.value === t)?.label ?? t

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-500 text-sm mt-0.5">Mitarbeiter, Löhne und Abwesenheiten an einem Ort</p>
          </div>
          <button onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Mitarbeiter
          </button>
        </div>

        {/* Mitarbeiter */}
        <div className="table-card mb-8">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Name', 'Position', 'Vergütung', 'Std./Woche', 'Urlaub/Jahr', 'Aktiv', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={7} />
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <p className="text-gray-400 mb-3">Noch keine Mitarbeiter angelegt.</p>
                  <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-4 py-2">+ Ersten Mitarbeiter anlegen</button>
                </td></tr>
              ) : employees.map((e) => (
                <tr key={e.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!e.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: e.color }}/>
                    {e.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.position || '–'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {eur(e.hourlyWageCents) ? `${eur(e.hourlyWageCents)}/h` : eur(e.monthlySalaryCents) ? `${eur(e.monthlySalaryCents)}/M` : '–'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.weeklyHours ?? '–'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.vacationDaysPerYear ?? '–'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(e)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${e.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${e.active ? 'left-[18px]' : 'left-0.5'}`}/>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditTarget(e); setModalOpen(true) }}
                      className="text-gray-400 hover:text-[#0D1630] p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M11 2L14 5L5 14H2V11L11 2Z"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Abwesenheiten */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Abwesenheiten</h2>
        {shiftsLocked ? (
          <div className="rounded-xl border border-au-gold/40 bg-au-gold/10 p-4 text-sm text-[#0E1A33]">
            Urlaubs- & Abwesenheitsverwaltung ist Teil des Business-Abos.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Mitarbeiter</label>
                <select value={absenceForm.employeeId} onChange={(e) => setAbsenceForm((f) => ({ ...f, employeeId: e.target.value }))} className="input">
                  <option value="">Wählen…</option>
                  {active.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Typ</label>
                <select value={absenceForm.type} onChange={(e) => setAbsenceForm((f) => ({ ...f, type: e.target.value }))} className="input">
                  {ABSENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Von</label>
                <input type="date" value={absenceForm.startDate} onChange={(e) => setAbsenceForm((f) => ({ ...f, startDate: e.target.value }))} className="input"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bis</label>
                <input type="date" value={absenceForm.endDate} onChange={(e) => setAbsenceForm((f) => ({ ...f, endDate: e.target.value }))} className="input"/>
              </div>
              <button onClick={addAbsence} disabled={!absenceForm.employeeId || !absenceForm.startDate || !absenceForm.endDate}
                className="btn-primary text-xs px-4 py-2.5 disabled:opacity-40">Eintragen</button>
            </div>

            <div className="table-card">
              <table className="w-full text-sm min-w-[560px]">
                <tbody>
                  {absences.length === 0 ? (
                    <tr><td className="text-center py-8 text-gray-400">Keine Abwesenheiten eingetragen.</td></tr>
                  ) : absences.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: a.employee.color }}/>
                        {a.employee.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.type === 'SICK' ? 'bg-red-50 text-red-600' : a.type === 'VACATION' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {typeLabel(a.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(a.startDate).toLocaleDateString('de-DE', { timeZone: 'UTC' })} – {new Date(a.endDate).toLocaleDateString('de-DE', { timeZone: 'UTC' })}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{a.note ?? ''}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteAbsence(a.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <EmployeeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }} onSave={handleSave}
        initial={editTarget ? {
          name: editTarget.name, position: editTarget.position ?? '', email: editTarget.email ?? '',
          phone: editTarget.phone ?? '', address: editTarget.address ?? '',
          wageType: editTarget.monthlySalaryCents ? 'salary' : 'hourly',
          wageEur: editTarget.hourlyWageCents ? String(editTarget.hourlyWageCents / 100) : editTarget.monthlySalaryCents ? String(editTarget.monthlySalaryCents / 100) : '',
          weeklyHours: editTarget.weeklyHours ? String(editTarget.weeklyHours) : '',
          vacationDaysPerYear: editTarget.vacationDaysPerYear ? String(editTarget.vacationDaysPerYear) : '',
          color: editTarget.color, notes: editTarget.notes ?? '',
        } : undefined}/>
    </DashboardLayout>
  )
}
