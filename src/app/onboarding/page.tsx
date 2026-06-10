'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant / Gastronomie', icon: '🍽️' },
  { value: 'hotel', label: 'Hotel / Unterkunft', icon: '🏨' },
  { value: 'retail', label: 'Einzelhandel', icon: '🛍️' },
  { value: 'ecommerce', label: 'E-Commerce / Online-Shop', icon: '🌐' },
  { value: 'consulting', label: 'Agentur / Beratung', icon: '💼' },
  { value: 'craft', label: 'Handwerk / Baugewerbe', icon: '🔧' },
  { value: 'medical', label: 'Gesundheit / Medizin', icon: '🏥' },
  { value: 'fitness', label: 'Fitness / Wellness', icon: '💪' },
  { value: 'beauty', label: 'Beauty / Kosmetik', icon: '✂️' },
  { value: 'it', label: 'IT / Software', icon: '💻' },
  { value: 'education', label: 'Bildung / Coaching', icon: '📚' },
  { value: 'other', label: 'Sonstiges', icon: '🏢' },
]

const GOALS = [
  { value: 'kosten_senken', label: 'Kosten senken' },
  { value: 'gewinn_steigern', label: 'Gewinn steigern' },
  { value: 'personal_optimieren', label: 'Personalquote optimieren' },
  { value: 'prozesse_verbessern', label: 'Prozesse verbessern' },
  { value: 'risiken_erkennen', label: 'Risiken erkennen' },
  { value: 'alles_pruefen', label: 'Alles prüfen lassen' },
]

const EMPLOYEE_COUNTS = ['1–5', '6–15', '16–30', '31–50', '51–100', '100+']
const REVENUE_RANGES = ['Bis 100.000 €', '100.001 – 250.000 €', '250.001 – 500.000 €', '500.001 – 1 Mio. €', 'Über 1 Mio. €']

interface OnboardingData {
  businessType: string
  businessName: string
  city: string
  employees: string
  revenue: string
  goals: string[]
}

const EMPTY: OnboardingData = {
  businessType: '', businessName: '', city: '',
  employees: '', revenue: '', goals: [],
}

const STEPS = ['Branche', 'Unternehmen', 'Team & Umsatz', 'Ziele', 'Fertig']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const set = <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => setData((d) => ({ ...d, [k]: v }))

  const toggleGoal = (g: string) =>
    set('goals', data.goals.includes(g) ? data.goals.filter((x) => x !== g) : [...data.goals, g])

  const canNext = () => {
    if (step === 0) return !!data.businessType
    if (step === 1) return !!data.businessName.trim()
    if (step === 2) return !!data.employees && !!data.revenue
    if (step === 3) return data.goals.length > 0
    return true
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.businessName,
          businessType: data.businessType,
          city: data.city,
          employees: data.employees,
          annualRevenue: data.revenue,
          onboardingGoals: data.goals,
        }),
      })
    } catch {}
    setSaving(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#06091A] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center">
              <span className="text-[#06091A] font-black text-sm">A</span>
            </div>
            <span className="text-white font-bold text-lg">Profitora</span>
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full h-1 rounded-full transition-colors ${i <= step ? 'bg-[#C9A84C]' : 'bg-white/10'}`}/>
              <span className={`text-xs ${i === step ? 'text-[#C9A84C] font-semibold' : 'text-white/30'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">

          {/* Step 0 – Branche */}
          {step === 0 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">Welche Branche passt zu Ihnen?</h1>
              <p className="text-gray-500 text-sm mb-6">Wir passen die Analysen und Benchmarks auf Ihre Branche an.</p>
              <div className="grid grid-cols-3 gap-2.5">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    onClick={() => set('businessType', bt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${data.businessType === bt.value ? 'border-[#0D1630] bg-[#EFF1F7]' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">{bt.icon}</span>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{bt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 1 – Unternehmen */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">Ihr Unternehmen</h1>
              <p className="text-gray-500 text-sm mb-6">Wie heißt Ihr Betrieb und wo sind Sie tätig?</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Unternehmensname *</label>
                  <input
                    type="text"
                    value={data.businessName}
                    onChange={(e) => set('businessName', e.target.value)}
                    placeholder="z.B. Mustermann GmbH"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Standort (optional)</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="z.B. Berlin"
                    className="input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2 – Team & Umsatz */}
          {step === 2 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">Team & Umsatzgröße</h1>
              <p className="text-gray-500 text-sm mb-6">Diese Angaben helfen uns, passende Benchmarks auszuwählen.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Anzahl Mitarbeiter *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EMPLOYEE_COUNTS.map((e) => (
                      <button
                        key={e}
                        onClick={() => set('employees', e)}
                        className={`py-2.5 text-sm font-medium rounded-xl border-2 transition-colors ${data.employees === e ? 'border-[#0D1630] bg-[#EFF1F7] text-[#0D1630]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Jahresumsatz (geschätzt) *</label>
                  <div className="space-y-2">
                    {REVENUE_RANGES.map((r) => (
                      <button
                        key={r}
                        onClick={() => set('revenue', r)}
                        className={`w-full text-left py-2.5 px-4 text-sm rounded-xl border-2 transition-colors ${data.revenue === r ? 'border-[#0D1630] bg-[#EFF1F7] text-[#0D1630] font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3 – Ziele */}
          {step === 3 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">Was möchten Sie erreichen?</h1>
              <p className="text-gray-500 text-sm mb-6">Mehrfachauswahl möglich. Wir priorisieren die Analyse entsprechend.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => toggleGoal(g.value)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-colors ${data.goals.includes(g.value) ? 'border-[#0D1630] bg-[#EFF1F7]' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${data.goals.includes(g.value) ? 'border-[#0D1630] bg-[#0D1630]' : 'border-gray-300'}`}>
                      {data.goals.includes(g.value) && (
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                          <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{g.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 4 – Done */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="w-8 h-8">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Alles eingerichtet!</h1>
              <p className="text-gray-500 text-sm mb-2">
                Ihr Profil ist bereit. Sie können jetzt Ihre erste KI-Analyse starten.
              </p>
              <p className="text-xs text-gray-400 mb-8">
                Kein Ersatz für Steuerberater, Rechtsanwalt oder Wirtschaftsprüfer. Alle Analysen sind betriebswirtschaftliche Entscheidungshilfen.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full bg-[#0D1630] text-white font-semibold py-3 rounded-xl hover:bg-[#152040] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Einrichten…' : 'Zum Dashboard →'}
                </button>
                <Link href="/analyze" onClick={handleFinish} className="w-full text-center text-sm text-[#0D1630] font-medium hover:underline">
                  Direkt zur ersten Analyse starten
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="flex-1 btn-outline py-3">
                  Zurück
                </button>
              )}
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="flex-1 bg-[#0D1630] text-white font-semibold py-3 rounded-xl hover:bg-[#152040] transition-colors disabled:opacity-40"
              >
                {step === 3 ? 'Abschließen' : 'Weiter'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Sie können alle Angaben später unter „Profil" ändern.
        </p>
      </div>
    </div>
  )
}
