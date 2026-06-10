'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const BUSINESS_OPTIONS = [
  { value: 'hotel',      label: 'Hotel / Pension',       laborTarget: 28, goodsTarget: 0  },
  { value: 'restaurant', label: 'Restaurant / Bistro',   laborTarget: 32, goodsTarget: 30 },
  { value: 'cafe_bakery',label: 'Café / Bäckerei',       laborTarget: 38, goodsTarget: 30 },
  { value: 'retail',     label: 'Einzelhandel',          laborTarget: 14, goodsTarget: 60 },
  { value: 'medical',    label: 'Arztpraxis / Therapie', laborTarget: 25, goodsTarget: 0  },
  { value: 'craft',      label: 'Handwerk',              laborTarget: 35, goodsTarget: 30 },
  { value: 'fitness',    label: 'Fitness / Wellness',    laborTarget: 30, goodsTarget: 0  },
  { value: 'beauty',     label: 'Beauty / Kosmetik',     laborTarget: 35, goodsTarget: 12 },
  { value: 'consulting', label: 'Beratung / Agentur',    laborTarget: 45, goodsTarget: 0  },
]

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/55 text-sm">{label}</span>
        <span className="text-white font-semibold text-sm tabular-nums">{format(value)}</span>
      </div>
      <div className="relative h-1.5 bg-white/10 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-au-gold rounded-full transition-all duration-75"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-au-gold rounded-full border-2 border-[#06091A] shadow-lg pointer-events-none transition-all duration-75"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-white/20 text-xs mt-1.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

export default function SavingsCalculator() {
  const [businessType, setBusinessType] = useState('restaurant')
  const [monthlyRevenue, setMonthlyRevenue] = useState(35000)
  const [laborCostPct, setLaborCostPct] = useState(40)
  const [goodsCostPct, setGoodsCostPct] = useState(36)

  const config = useMemo(
    () => BUSINESS_OPTIONS.find((o) => o.value === businessType) ?? BUSINESS_OPTIONS[0],
    [businessType]
  )

  const results = useMemo(() => {
    const laborOverage = Math.max(0, laborCostPct - config.laborTarget)
    const laborSaving = (laborOverage / 100) * monthlyRevenue

    const goodsOverage = config.goodsTarget > 0 ? Math.max(0, goodsCostPct - config.goodsTarget) : 0
    const goodsSaving = (goodsOverage / 100) * monthlyRevenue

    const totalMonthly = Math.round(laborSaving + goodsSaving)
    const totalAnnual = totalMonthly * 12

    const laborOk = laborCostPct <= config.laborTarget
    const goodsOk = config.goodsTarget === 0 || goodsCostPct <= config.goodsTarget

    return { laborSaving, goodsSaving, totalMonthly, totalAnnual, laborOverage, goodsOverage, laborOk, goodsOk }
  }, [businessType, monthlyRevenue, laborCostPct, goodsCostPct, config])

  return (
    <section className="bg-[#06091A] py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-au-gold text-sm font-semibold tracking-widest uppercase mb-3">
            Schnellcheck
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Wie viel verliert Ihr Betrieb gerade?
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-base leading-relaxed">
            Stellen Sie Ihre aktuellen Kennzahlen ein. Die Berechnung basiert auf
            verifizierten Branchenbenchmarks – keine Schätzungen.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left: Inputs */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-7 space-y-7">
            {/* Business type */}
            <div>
              <label className="text-white/55 text-sm block mb-2">Unternehmensart</label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBusinessType(opt.value)}
                    className={`text-xs px-2.5 py-2 rounded-lg border text-center transition-all duration-150 leading-tight ${
                      businessType === opt.value
                        ? 'border-au-gold bg-au-gold/10 text-au-gold font-semibold'
                        : 'border-white/10 text-white/45 hover:border-white/25 hover:text-white/65'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue slider */}
            <Slider
              label="Monatlicher Umsatz"
              value={monthlyRevenue}
              min={5000}
              max={200000}
              step={1000}
              onChange={setMonthlyRevenue}
              format={(v) => formatEur(v)}
            />

            {/* Labor cost slider */}
            <div>
              <Slider
                label="Aktuelle Personalkostenquote"
                value={laborCostPct}
                min={10}
                max={65}
                step={0.5}
                onChange={setLaborCostPct}
                format={(v) => `${v.toFixed(1)} %`}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${results.laborOk ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-white/30">
                  Branchenziel: ~{config.laborTarget} %
                </span>
              </div>
            </div>

            {/* Goods cost slider – only if relevant */}
            {config.goodsTarget > 0 && (
              <div>
                <Slider
                  label="Wareneinsatz / Food Cost"
                  value={goodsCostPct}
                  min={10}
                  max={80}
                  step={0.5}
                  onChange={setGoodsCostPct}
                  format={(v) => `${v.toFixed(1)} %`}
                />
                <div className="mt-2 flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${results.goodsOk ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-white/30">
                    Branchenziel: ~{config.goodsTarget} %
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div className="flex flex-col gap-4">
            {/* Main result */}
            <div className={`rounded-2xl border p-7 transition-all duration-300 ${
              results.totalMonthly > 0
                ? 'bg-red-950/30 border-red-500/20'
                : 'bg-green-950/30 border-green-500/20'
            }`}>
              <p className="text-white/50 text-sm mb-2">
                {results.totalMonthly > 0 ? 'Geschätztes Einsparpotenzial' : 'Ihr Betrieb liegt im Zielbereich'}
              </p>
              <div className={`text-5xl md:text-6xl font-black tracking-tight mb-1 transition-all duration-300 ${
                results.totalMonthly > 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {results.totalMonthly > 0 ? formatEur(results.totalMonthly) : '✓'}
              </div>
              {results.totalMonthly > 0 && (
                <p className="text-white/35 text-sm">pro Monat · {formatEur(results.totalAnnual)} pro Jahr</p>
              )}
            </div>

            {/* Breakdown */}
            {results.totalMonthly > 0 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-3">
                <p className="text-white/40 text-xs uppercase tracking-widest font-medium mb-3">Aufschlüsselung</p>

                {results.laborSaving > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-white/60 text-sm">
                        Personalkosten ({results.laborOverage.toFixed(1)} % über Ziel)
                      </span>
                    </div>
                    <span className="text-red-400 text-sm font-semibold tabular-nums">
                      {formatEur(Math.round(results.laborSaving))}/Mo
                    </span>
                  </div>
                )}

                {results.goodsSaving > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-white/60 text-sm">
                        Wareneinsatz ({results.goodsOverage.toFixed(1)} % über Ziel)
                      </span>
                    </div>
                    <span className="text-orange-400 text-sm font-semibold tabular-nums">
                      {formatEur(Math.round(results.goodsSaving))}/Mo
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer + CTA */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <p className="text-white/30 text-xs leading-relaxed mb-4">
                Dies ist eine Schätzung auf Basis von Branchenbenchmarks.
                Für eine präzise Analyse mit Ihren echten Daten:
              </p>
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 bg-au-gold hover:bg-au-gold-light text-[#06091A] font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] w-full"
              >
                Jetzt echte Analyse starten
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
