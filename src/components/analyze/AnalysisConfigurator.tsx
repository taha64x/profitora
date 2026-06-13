'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BUSINESS_TYPES, ANALYSIS_TYPES, ACCURACY_LEVELS, ANALYSIS_GOALS } from '@/types'
import type { AnalysisType, AccuracyLevel, InputMethod, AnalysisGoal } from '@/types'

interface ConfigState {
  industry: string
  analysisTypes: AnalysisType[]
  inputMethod: InputMethod
  accuracyLevel: AccuracyLevel
  goals: AnalysisGoal[]
}

const INITIAL: ConfigState = {
  industry: '',
  analysisTypes: [],
  inputMethod: 'hybrid',
  accuracyLevel: 'standard',
  goals: [],
}

const STEP_LABELS = [
  'Branche',
  'Analysearten',
  'Datenquelle',
  'Genauigkeit',
  'Ziele',
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current
                ? 'bg-au-gold text-[#06091A]'
                : i === current
                ? 'bg-white/15 text-white border border-white/30'
                : 'bg-white/5 text-white/25'
            }`}
          >
            {i < current ? (
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                <path d="M2 6l3 3 5-5" stroke="#06091A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8 md:w-12 transition-all ${i < current ? 'bg-au-gold/60' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function OptionButton({
  selected,
  onClick,
  children,
  multi,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  multi?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative text-left w-full p-4 rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-au-gold bg-au-gold/10 text-white'
          : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white/80 hover:bg-white/3'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-${multi ? 'md' : 'full'} border-2 flex items-center justify-center transition-all ${
            selected ? 'border-au-gold bg-au-gold' : 'border-white/25'
          }`}
        >
          {selected && (
            <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#06091A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div>{children}</div>
      </div>
    </button>
  )
}

export default function AnalysisConfigurator({ defaultLevel }: { defaultLevel?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<ConfigState>({
    ...INITIAL,
    accuracyLevel: (['schnellcheck', 'standard', 'tiefenanalyse', 'komplett'].includes(defaultLevel ?? '')
      ? (defaultLevel as AccuracyLevel)
      : 'standard'),
  })
  const [loading, setLoading] = useState(false)

  const toggleType = (t: AnalysisType) => {
    setConfig((c) => ({
      ...c,
      analysisTypes: c.analysisTypes.includes(t)
        ? c.analysisTypes.filter((x) => x !== t)
        : [...c.analysisTypes, t],
    }))
  }

  const toggleGoal = (g: AnalysisGoal) => {
    setConfig((c) => ({
      ...c,
      goals: c.goals.includes(g) ? c.goals.filter((x) => x !== g) : [...c.goals, g],
    }))
  }

  const canProceed = () => {
    if (step === 0) return !!config.industry
    if (step === 1) return config.analysisTypes.length > 0
    if (step === 2) return !!config.inputMethod
    if (step === 3) return !!config.accuracyLevel
    if (step === 4) return config.goals.length > 0
    return false
  }

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1)
    } else {
      handleStart()
    }
  }

  const handleStart = () => {
    setLoading(true)
    const params = new URLSearchParams({
      industry:      config.industry,
      types:         config.analysisTypes.join(','),
      method:        config.inputMethod,
      level:         config.accuracyLevel,
      goals:         config.goals.join(','),
    })

    if (config.inputMethod === 'questionnaire') {
      router.push(`/analyze/questionnaire?${params}`)
    } else {
      router.push(`/analyze/upload?${params}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={step} total={5} />

      {/* Step 0: Branche */}
      {step === 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Ihre Branche</h2>
          <p className="text-white/40 text-sm mb-6">
            Die KI lädt automatisch die passenden Branchenbenchmarks.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BUSINESS_TYPES.map((bt) => (
              <OptionButton
                key={bt.value}
                selected={config.industry === bt.value}
                onClick={() => setConfig((c) => ({ ...c, industry: bt.value }))}
              >
                <p className="font-semibold text-sm leading-snug">{bt.label}</p>
                <p className="text-xs text-white/35 mt-0.5 leading-snug">{bt.description}</p>
              </OptionButton>
            ))}
          </div>

          {/* Eigene Branche als Freitext */}
          <div className="mt-5">
            <p className="text-white/40 text-xs mb-2 uppercase tracking-wide font-medium">
              Oder eigene Branche eingeben
            </p>
            <input
              type="text"
              placeholder='z.B. "Autowerkstatt", "Eventagentur", "Logistikunternehmen"…'
              value={BUSINESS_TYPES.some((bt) => bt.value === config.industry) ? '' : config.industry}
              onChange={(e) => setConfig((c) => ({ ...c, industry: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 outline-none transition-colors"
            />
            <p className="text-white/25 text-xs mt-2">
              Die KI erstellt dann eine universelle Analyse, zugeschnitten auf Ihre Beschreibung.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Analysearten */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analysearten</h2>
          <p className="text-white/40 text-sm mb-6">
            Wählen Sie eine oder mehrere Analysearten. Bei Komplettanalyse werden alle Module kombiniert.
          </p>
          <div className="space-y-2">
            {ANALYSIS_TYPES.map((at) => (
              <OptionButton
                key={at.value}
                selected={config.analysisTypes.includes(at.value)}
                onClick={() => {
                  if (at.value === 'komplett') {
                    setConfig((c) => ({
                      ...c,
                      analysisTypes: c.analysisTypes.includes('komplett') ? [] : ['komplett'],
                    }))
                  } else {
                    // Remove 'komplett' if specific type selected
                    setConfig((c) => ({
                      ...c,
                      analysisTypes: c.analysisTypes.includes(at.value)
                        ? c.analysisTypes.filter((x) => x !== at.value)
                        : [...c.analysisTypes.filter((x) => x !== 'komplett'), at.value],
                    }))
                  }
                }}
                multi
              >
                <p className="font-semibold text-sm">{at.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{at.description}</p>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Datenquelle */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Datenquelle</h2>
          <p className="text-white/40 text-sm mb-6">
            Wie möchten Sie Ihre Unternehmensdaten bereitstellen?
          </p>
          <div className="space-y-3">
            {([
              {
                value: 'upload' as InputMethod,
                label: 'Dokumente hochladen',
                desc: 'PDF, Excel, CSV, Bilder oder Screenshots. Je mehr echte Daten Sie hochladen, desto genauer wird die Analyse.',
                badge: 'Empfohlen für genauste Ergebnisse',
              },
              {
                value: 'questionnaire' as InputMethod,
                label: 'Fragebogen ausfüllen',
                desc: 'Kein Dokument zur Hand? Beantworten Sie unseren strukturierten Fragebogen. Die KI erstellt daraus eine fundierte Analyse.',
                badge: 'Ohne Unterlagen möglich',
              },
              {
                value: 'hybrid' as InputMethod,
                label: 'Beides kombinieren',
                desc: 'Für die genaueste Analyse: Dokumente hochladen und Fragebogen ergänzen. Echte Daten + Hintergrundinformationen.',
                badge: 'Beste Analysequalität',
              },
            ] as const).map((opt) => (
              <OptionButton
                key={opt.value}
                selected={config.inputMethod === opt.value}
                onClick={() => setConfig((c) => ({ ...c, inputMethod: opt.value }))}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-white/35 mt-1 leading-relaxed max-w-sm">{opt.desc}</p>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-xs border border-au-gold/30 text-au-gold/70 px-2 py-0.5 rounded-full">
                    {opt.badge}
                  </span>
                </div>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Genauigkeit */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analysetiefe</h2>
          <p className="text-white/40 text-sm mb-6">
            Wie detailliert soll die Analyse sein?
          </p>
          <div className="space-y-2">
            {ACCURACY_LEVELS.map((al) => (
              <OptionButton
                key={al.value}
                selected={config.accuracyLevel === al.value}
                onClick={() => setConfig((c) => ({ ...c, accuracyLevel: al.value }))}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="font-semibold text-sm">{al.label}</p>
                    <p className="text-xs text-white/35 mt-0.5 leading-relaxed max-w-sm">{al.description}</p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                    al.tag === 'Empfohlen'
                      ? 'bg-au-gold/20 text-au-gold border border-au-gold/30'
                      : 'border border-white/15 text-white/30'
                  }`}>
                    {al.tag}
                  </span>
                </div>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Ziele */}
      {step === 4 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Ihre Ziele</h2>
          <p className="text-white/40 text-sm mb-6">
            Was soll die Analyse vorrangig prüfen? Mehrfachauswahl möglich.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ANALYSIS_GOALS.map((g) => (
              <OptionButton
                key={g.value}
                selected={config.goals.includes(g.value)}
                onClick={() => toggleGoal(g.value)}
                multi
              >
                <p className="font-semibold text-sm">{g.label}</p>
              </OptionButton>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-5 rounded-xl bg-white/[0.04] border border-white/8">
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Zusammenfassung</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Branche</span>
                <span className="text-white/80 font-medium">
                  {BUSINESS_TYPES.find((b) => b.value === config.industry)?.label ?? config.industry}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Analysearten</span>
                <span className="text-white/80 font-medium text-right">
                  {config.analysisTypes.map((t) =>
                    ANALYSIS_TYPES.find((a) => a.value === t)?.label
                  ).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Datenquelle</span>
                <span className="text-white/80 font-medium">
                  {config.inputMethod === 'upload' ? 'Dokumente' : config.inputMethod === 'questionnaire' ? 'Fragebogen' : 'Kombiniert'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Genauigkeit</span>
                <span className="text-white/80 font-medium">
                  {ACCURACY_LEVELS.find((a) => a.value === config.accuracyLevel)?.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="text-white/40 hover:text-white text-sm font-medium transition-colors disabled:opacity-0 disabled:cursor-default"
        >
          ← Zurück
        </button>

        <div className="text-white/25 text-xs">
          {step + 1} / {STEP_LABELS.length}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="bg-au-gold hover:bg-au-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-[#06091A] font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? 'Wird geladen…' : step === 4 ? 'Analyse starten →' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}
