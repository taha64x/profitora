'use client'

import { useState } from 'react'
import type { QuestionnaireData, AccuracyLevel, AnalysisGoal } from '@/types'
import { ACCURACY_LEVELS, ANALYSIS_GOALS } from '@/types'

interface Props {
  industry: string
  onSubmit: (data: QuestionnaireData) => void
  loading?: boolean
}

const EMPTY: QuestionnaireData = {
  companyName: '', industry: '', location: '', locationCount: 1, companySize: '',
  monthlyRevenue: 0, avgProfit: 0, mainServices: '', mainCostAreas: '',
  employees: [],
  costs: { rent: 0, energy: 0, insurance: 0, softwareSubscriptions: 0, marketing: 0, goods: 0, vehicles: 0, leasing: 0, taxConsultant: 0, externalServices: 0, other: 0, notes: '' },
  revenue: { monthlyRevenue: 0, mainSources: '', seasonalFluctuations: '', strongestMonths: '', weakestMonths: '', avgOrderValue: 0, customersPerMonth: 0, marginNotes: '' },
  processes: { dailyManualTasks: '', timeDrainingTasks: '', toolsUsed: '', errorPoints: '', waitingPoints: '', automationCandidates: '' },
  goals: [],
  accuracyLevel: 'standard',
}

const COMPANY_SIZES = ['1–5 Mitarbeiter', '6–15 Mitarbeiter', '16–50 Mitarbeiter', '51–200 Mitarbeiter', '200+']
const EMPLOYMENT_TYPES = [
  { value: 'vollzeit', label: 'Vollzeit' },
  { value: 'teilzeit', label: 'Teilzeit' },
  { value: 'minijob', label: 'Minijob' },
  { value: 'freelance', label: 'Freelance / extern' },
]

const FIELD = 'w-full bg-white border border-gray-300 text-[#0E1A33] placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition-all'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-gray-600 text-sm font-medium mb-1.5">{children}</label>
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <input {...props} className={FIELD} />
    </div>
  )
}

function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea {...props} rows={3} className={`${FIELD} resize-none`} />
    </div>
  )
}

const STEP_TITLES = [
  'Unternehmensdaten',
  'Mitarbeiter',
  'Kosten',
  'Einnahmen',
  'Prozesse',
  'Ziele',
  'Analysetiefe',
]

export default function QuestionnaireWizard({ industry, onSubmit, loading }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<QuestionnaireData>({ ...EMPTY, industry })

  const set = (field: keyof QuestionnaireData, value: unknown) =>
    setData((d) => ({ ...d, [field]: value }))

  const setCosts = (field: keyof QuestionnaireData['costs'], value: number | string) =>
    setData((d) => ({ ...d, costs: { ...d.costs, [field]: value } }))

  const setRevenue = (field: keyof QuestionnaireData['revenue'], value: number | string) =>
    setData((d) => ({ ...d, revenue: { ...d.revenue, [field]: value } }))

  const setProcesses = (field: keyof QuestionnaireData['processes'], value: string) =>
    setData((d) => ({ ...d, processes: { ...d.processes, [field]: value } }))

  const addEmployee = () =>
    setData((d) => ({
      ...d,
      employees: [...d.employees, { role: '', tasks: '', weeklyHours: 40, monthlyWage: 0, employmentType: 'vollzeit', productivityNote: '' }],
    }))

  const setEmployee = (i: number, field: string, value: string | number) =>
    setData((d) => ({
      ...d,
      employees: d.employees.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
    }))

  const removeEmployee = (i: number) =>
    setData((d) => ({ ...d, employees: d.employees.filter((_, idx) => idx !== i) }))

  const toggleGoal = (g: AnalysisGoal) =>
    setData((d) => ({
      ...d,
      goals: d.goals.includes(g) ? d.goals.filter((x) => x !== g) : [...d.goals, g],
    }))

  const handleSubmit = () => onSubmit(data)

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-1">
        {STEP_TITLES.map((title, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full transition-all ${i <= step ? 'bg-au-gold' : 'bg-gray-200'}`} />
            <p className={`text-xs mt-1.5 transition-colors ${i === step ? 'text-[#B8923A] font-semibold' : 'text-gray-400'}`}>
              {title}
            </p>
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0E1A33]">Unternehmensdaten</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Firmenname (optional)" placeholder="Muster GmbH" value={data.companyName} onChange={(e) => set('companyName', e.target.value)} />
            <Input label="Standort / Region" placeholder="z.B. München, Bayern" value={data.location} onChange={(e) => set('location', e.target.value)} />
            <div>
              <Label>Unternehmensgröße</Label>
              <select value={data.companySize} onChange={(e) => set('companySize', e.target.value)} className={FIELD}>
                <option value="">Bitte wählen…</option>
                {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="Anzahl Standorte" type="number" min={1} value={data.locationCount} onChange={(e) => set('locationCount', Number(e.target.value))} />
            <Input label="Monatlicher Umsatz (€)" type="number" placeholder="z.B. 45000" value={data.monthlyRevenue || ''} onChange={(e) => set('monthlyRevenue', Number(e.target.value))} />
            <Input label="Durchschnittlicher Gewinn/Monat (€)" type="number" placeholder="z.B. 5000" value={data.avgProfit || ''} onChange={(e) => set('avgProfit', Number(e.target.value))} />
          </div>
          <TextArea label="Hauptleistungen / Produkte" placeholder="Was bieten Sie an?" value={data.mainServices} onChange={(e) => set('mainServices', e.target.value)} />
          <TextArea label="Wichtigste Kostenbereiche" placeholder="z.B. Personal, Miete, Material…" value={data.mainCostAreas} onChange={(e) => set('mainCostAreas', e.target.value)} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-[#0E1A33]">Mitarbeiter</h3>
            <button type="button" onClick={addEmployee}
              className="text-[#B8923A] text-sm font-semibold border border-[#C9A84C]/40 px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/10 transition-colors">
              + Mitarbeiter / Rolle hinzufügen
            </button>
          </div>
          {data.employees.length === 0 && (
            <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-400 text-sm">Noch keine Mitarbeiter eingetragen.</p>
              <button type="button" onClick={addEmployee}
                className="mt-3 text-[#B8923A] text-sm hover:underline">
                Ersten Mitarbeiter hinzufügen
              </button>
            </div>
          )}
          {data.employees.map((emp, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs uppercase tracking-wide">Mitarbeiter / Rolle {i + 1}</p>
                <button type="button" onClick={() => removeEmployee(i)} className="text-gray-400 hover:text-red-500 text-xs transition-colors">Entfernen</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Rolle / Position" placeholder="z.B. Verkäuferin, Koch, Buchhalter" value={emp.role} onChange={(e) => setEmployee(i, 'role', e.target.value)} />
                <div>
                  <Label>Beschäftigungsart</Label>
                  <select value={emp.employmentType} onChange={(e) => setEmployee(i, 'employmentType', e.target.value)} className={FIELD}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <Input label="Wochenstunden" type="number" min={0} max={60} value={emp.weeklyHours} onChange={(e) => setEmployee(i, 'weeklyHours', Number(e.target.value))} />
                <Input label="Monatsgehalt / Stundenlohn (€)" type="number" placeholder="Brutto in €" value={emp.monthlyWage || ''} onChange={(e) => setEmployee(i, 'monthlyWage', Number(e.target.value))} />
              </div>
              <TextArea label="Aufgaben" placeholder="Was macht diese Person täglich / wöchentlich?" value={emp.tasks} onChange={(e) => setEmployee(i, 'tasks', e.target.value)} />
              <TextArea label="Besonderheiten / Probleme (optional)" placeholder="z.B. oft Überstunden, viel Leerlauf, Doppelarbeit…" value={emp.productivityNote} onChange={(e) => setEmployee(i, 'productivityNote', e.target.value)} />
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0E1A33]">Monatliche Kosten</h3>
          <p className="text-gray-500 text-sm">Tragen Sie Ihre typischen monatlichen Kosten ein (Schätzungen sind in Ordnung).</p>
          <div className="grid md:grid-cols-2 gap-4">
            {([
              ['rent',                 'Miete (€/Monat)'],
              ['energy',               'Strom / Energie (€/Monat)'],
              ['insurance',            'Versicherungen (€/Monat)'],
              ['softwareSubscriptions','Software-Abos (€/Monat)'],
              ['marketing',            'Marketing / Werbung (€/Monat)'],
              ['goods',                'Wareneinsatz / Material (€/Monat)'],
              ['vehicles',             'Fahrzeuge / Transport (€/Monat)'],
              ['leasing',              'Leasing / Finanzierung (€/Monat)'],
              ['taxConsultant',        'Steuerberater / Buchhaltung (€/Monat)'],
              ['externalServices',     'Externe Dienstleister (€/Monat)'],
              ['other',                'Sonstiges (€/Monat)'],
            ] as [keyof QuestionnaireData['costs'], string][]).map(([field, label]) => (
              <Input key={field} label={label} type="number" min={0}
                value={(data.costs[field] as number) || ''}
                onChange={(e) => setCosts(field, Number(e.target.value))} />
            ))}
          </div>
          <TextArea label="Notizen zu Kosten (optional)" placeholder="z.B. besonders teure Positionen, Sonderausgaben, bekannte Probleme…"
            value={data.costs.notes} onChange={(e) => setCosts('notes', e.target.value)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0E1A33]">Einnahmen</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Monatliche Einnahmen (€)" type="number" value={data.revenue.monthlyRevenue || ''} onChange={(e) => setRevenue('monthlyRevenue', Number(e.target.value))} />
            <Input label="Durchschnittlicher Auftragswert (€)" type="number" value={data.revenue.avgOrderValue || ''} onChange={(e) => setRevenue('avgOrderValue', Number(e.target.value))} />
            <Input label="Kunden / Aufträge pro Monat" type="number" value={data.revenue.customersPerMonth || ''} onChange={(e) => setRevenue('customersPerMonth', Number(e.target.value))} />
            <Input label="Stärkste Monate" placeholder="z.B. Juli, August, Dezember" value={data.revenue.strongestMonths} onChange={(e) => setRevenue('strongestMonths', e.target.value)} />
            <Input label="Schwächste Monate" placeholder="z.B. Januar, Februar" value={data.revenue.weakestMonths} onChange={(e) => setRevenue('weakestMonths', e.target.value)} />
          </div>
          <TextArea label="Wichtigste Einnahmequellen" placeholder="z.B. Hauptprodukt, Dienstleistungen, Abos, Beratung…" value={data.revenue.mainSources} onChange={(e) => setRevenue('mainSources', e.target.value)} />
          <TextArea label="Saisonale Schwankungen" placeholder="Gibt es Hochsaison / Nebensaison? Wie stark?" value={data.revenue.seasonalFluctuations} onChange={(e) => setRevenue('seasonalFluctuations', e.target.value)} />
          <TextArea label="Marge / Gewinn-Notizen (optional)" placeholder="z.B. Marge auf Produkt A ca. 30 %, Service B ca. 60 %…" value={data.revenue.marginNotes} onChange={(e) => setRevenue('marginNotes', e.target.value)} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0E1A33]">Prozesse & Abläufe</h3>
          <p className="text-gray-500 text-sm">Diese Angaben helfen der KI, Automatisierungs- und Effizienzpotenziale zu erkennen.</p>
          <TextArea label="Welche Aufgaben werden täglich manuell erledigt?" placeholder="z.B. Rechnungen schreiben, Bestellungen eingeben, Dienstplan erstellen…" value={data.processes.dailyManualTasks} onChange={(e) => setProcesses('dailyManualTasks', e.target.value)} />
          <TextArea label="Welche Aufgaben dauern besonders lange?" placeholder="z.B. Monatsabrechnung 3 Stunden, Angebote erstellen 2 Stunden…" value={data.processes.timeDrainingTasks} onChange={(e) => setProcesses('timeDrainingTasks', e.target.value)} />
          <TextArea label="Welche Software / Programme werden genutzt?" placeholder="z.B. Excel, DATEV, SAP, eigenes POS-System, Google Sheets…" value={data.processes.toolsUsed} onChange={(e) => setProcesses('toolsUsed', e.target.value)} />
          <TextArea label="Wo entstehen Fehler oder Probleme?" placeholder="z.B. falsche Bestellmengen, Zahlungsverzug, doppelte Dateneingabe…" value={data.processes.errorPoints} onChange={(e) => setProcesses('errorPoints', e.target.value)} />
          <TextArea label="Wo entstehen Wartezeiten?" placeholder="z.B. warten auf Lieferanten, interne Freigaben, Kundenantworten…" value={data.processes.waitingPoints} onChange={(e) => setProcesses('waitingPoints', e.target.value)} />
          <TextArea label="Was könnte automatisiert werden?" placeholder="z.B. Rechnungsversand, Erinnerungen, Bestellungen, Berichte…" value={data.processes.automationCandidates} onChange={(e) => setProcesses('automationCandidates', e.target.value)} />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0E1A33]">Ihre Ziele</h3>
          <p className="text-gray-500 text-sm">Was soll die Analyse vorrangig zeigen? Mehrfachauswahl möglich.</p>
          <div className="grid grid-cols-2 gap-2">
            {ANALYSIS_GOALS.map((g) => (
              <button key={g.value} type="button" onClick={() => toggleGoal(g.value)}
                className={`p-4 rounded-xl border text-left text-sm font-medium transition-all ${
                  data.goals.includes(g.value)
                    ? 'border-au-gold bg-au-gold/10 text-[#0E1A33]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-[#0E1A33]'
                }`}>
                <div className={`w-3 h-3 rounded-full mb-2 ${data.goals.includes(g.value) ? 'bg-au-gold' : 'bg-gray-300'}`} />
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0E1A33]">Analysetiefe wählen</h3>
          <div className="space-y-2">
            {ACCURACY_LEVELS.map((al) => (
              <button key={al.value} type="button" onClick={() => set('accuracyLevel', al.value)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  data.accuracyLevel === al.value
                    ? 'border-au-gold bg-au-gold/10 text-[#0E1A33]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{al.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{al.description}</p>
                  </div>
                  {al.tag === 'Empfohlen' && (
                    <span className="text-xs bg-[#C9A84C]/15 text-[#B8923A] border border-[#C9A84C]/30 px-2 py-0.5 rounded-full ml-3">
                      Empfohlen
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-gray-500 text-xs leading-relaxed">
              <strong className="text-gray-700">Hinweis:</strong> Diese Analyse ist eine KI-gestützte
              betriebswirtschaftliche Auswertung auf Basis Ihrer Angaben. Sie ersetzt keine
              Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung. Alle
              Einsparpotenziale sind Schätzungen – abhängig von Umsetzung und Einzelfall.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0}
          className="text-gray-500 hover:text-[#0E1A33] text-sm font-medium transition-colors disabled:opacity-0">
          ← Zurück
        </button>
        <span className="text-gray-400 text-xs">{step + 1} / {STEP_TITLES.length}</span>
        {step < 6 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)}
            className="bg-[#0E1A33] hover:bg-[#1a2744] text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-[#0E1A33]/15">
            Weiter →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="bg-[#0E1A33] hover:bg-[#1a2744] disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-[#0E1A33]/15">
            {loading ? 'Wird gesendet…' : 'Analyse einreichen →'}
          </button>
        )}
      </div>
    </div>
  )
}
