'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * Echte Beispiel-Analyse als animierte In-Page-Showcase (ersetzt das alte,
 * nichtssagende Abstrakt-Video). Zeigt lesbar, was hinten rauskommt – mit den
 * exakten Zahlen aus dem vollen Beispielbericht (/report/example):
 * Boardinghotel Heidelberg, Auslastung 55,8 %, Personalkostenquote 32,3 %,
 * 4 Sparpotenziale = ~2.000 €/Monat. Beispieldaten, keine echten Kundendaten.
 *
 * Eigenständige Frame-Animation (kein framer-motion) – läuft ab Mount, pausiert
 * bei Hover, Frames per Punkt anwählbar.
 */
const FRAMES = ['Daten erkannt', 'Kennzahlen', 'Auffälligkeit', 'Sparpotenziale'] as const

export default function AnalyseShowcase() {
  const [frame, setFrame] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setFrame((f) => (f + 1) % FRAMES.length)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mt-16 mx-auto max-w-4xl">
      <div
        className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl bg-white"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
      >
        {/* Kopfzeile wie ein echter Bericht */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0D1630] text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-au-gold">●</span> Profitora · Beispiel-Analyse
          </div>
          <div className="text-xs text-white/50">Boardinghotel Heidelberg · Mai 2025</div>
        </div>

        {/* Frame-Bühne */}
        <div className="relative min-h-[330px] p-6 sm:p-8">
          {/* Frame 0 – Daten erkannt */}
          <Frame active={frame === 0}>
            <FrameTitle step="1 / 4" title="Daten automatisch erkannt" />
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Einnahmen (CSV)', '346 Zeilen'],
                ['Ausgaben (Excel)', '9 Kategorien'],
                ['Mitarbeiterzeiten', '420 Std.'],
                ['Buchungen (resigo)', '4 Kanäle'],
              ].map(([label, meta]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  <span className="text-xs text-green-600 font-semibold">✓ {meta}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">Spalten automatisch zugeordnet – kein manuelles Mapping nötig.</p>
          </Frame>

          {/* Frame 1 – Kennzahlen */}
          <Frame active={frame === 1}>
            <FrameTitle step="2 / 4" title="Kennzahlen berechnet" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Auslastung', '55,8 %'],
                ['Umsatz', '44.850 €'],
                ['Nettomarge', '17,1 %'],
                ['Personalquote', '32,3 %'],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-gray-200 px-4 py-4 text-center">
                  <div className="text-xl font-black text-[#0D1630]">{val}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">Über 15 Kennzahlen inkl. ADR 129,63 € · RevPAR 72,34 € · Umsatz/MA-Stunde 106,79 €.</p>
          </Frame>

          {/* Frame 2 – Auffälligkeit (Soll-Ist) */}
          <Frame active={frame === 2}>
            <FrameTitle step="3 / 4" title="Auffälligkeit erkannt (Soll-Ist)" />
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">Personalkostenquote</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Handlungsbedarf: HOCH</span>
              </div>
              <Bar label="Ihr Betrieb" value={32.3} max={40} tone="red" valueLabel="32,3 %" />
              <Bar label="Branchen-Richtwert" value={28} max={40} tone="navy" valueLabel="~28 %" />
              <p className="mt-3 text-sm text-gray-600">+4,3 % über dem Richtwert für kleine Hotels (10–80 Zimmer).</p>
            </div>
          </Frame>

          {/* Frame 3 – Sparpotenziale */}
          <Frame active={frame === 3}>
            <FrameTitle step="4 / 4" title="Sparpotenziale in Euro" />
            <div className="space-y-2">
              {[
                ['Direktbuchungen ausbauen', '~800 €/Mo'],
                ['Personaleinsatz optimieren', '~650 €/Mo'],
                ['Energieverbrauch senken', '~400 €/Mo'],
                ['Software-Abos bündeln', '~150 €/Mo'],
              ].map(([title, val]) => (
                <div key={title} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5">
                  <span className="text-sm text-gray-800">{title}</span>
                  <span className="text-sm font-semibold text-green-700">{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0D1630] text-white px-4 py-3">
              <span className="text-sm">Gesamt-Einsparpotenzial</span>
              <span className="text-lg font-black text-au-gold">~2.000 €/Monat</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">Inkl. konkretem 30/60/90-Tage-Plan.</p>
          </Frame>
        </div>

        {/* Steuerung + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            {FRAMES.map((f, i) => (
              <button
                key={f}
                aria-label={`Schritt ${i + 1}: ${f}`}
                onClick={() => setFrame(i)}
                className={`h-2 rounded-full transition-all ${i === frame ? 'w-6 bg-[#0D1630]' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
          <Link
            href="/report/example"
            className="text-sm font-semibold text-[#0D1630] hover:text-au-gold transition-colors inline-flex items-center gap-1.5"
          >
            Vollständigen Beispielbericht ansehen
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
      <p className="text-center text-gray-400 text-xs mt-3">
        Beispieldaten (Boardinghotel Heidelberg) – keine echten Kundendaten. Entscheidungshilfe, kein Ersatz für Steuerberatung.
      </p>
    </div>
  )
}

function Frame({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`transition-opacity duration-500 ${active ? 'opacity-100 relative' : 'opacity-0 absolute inset-0 p-6 sm:p-8 pointer-events-none'}`}
      aria-hidden={!active}
    >
      {children}
    </div>
  )
}

function FrameTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="mb-4">
      <span className="text-xs font-semibold tracking-widest uppercase text-au-gold">{step}</span>
      <h3 className="text-lg font-bold text-gray-900 mt-1">{title}</h3>
    </div>
  )
}

function Bar({ label, value, max, tone, valueLabel }: { label: string; value: number; max: number; tone: 'red' | 'navy'; valueLabel: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-gray-600 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${tone === 'red' ? 'bg-red-500' : 'bg-[#0D1630]'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-800 w-12 text-right">{valueLabel}</span>
    </div>
  )
}
