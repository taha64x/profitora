'use client'

import { m } from 'framer-motion'
import Link from 'next/link'

/* ─── Hero (Hell & Clean Redesign) ───────────────────────────────────────────
   Asymmetrisch: links Botschaft + CTAs, rechts ein echtes, fertig wirkendes
   Analyse-Panel mit konkreten EUR-Sparpotenzialen. Heller Hintergrund mit
   dezentem Gold-Glow – kein dunkler „Void" mehr. */

const KPIS = [
  { label: 'Nettomarge',    value: '23,5 %',  delta: '▲ 2,1', tone: 'text-emerald-600' },
  { label: 'Gewinn / Monat', value: '7.600 €', delta: 'aktuell', tone: 'text-gray-400' },
  { label: 'Personalquote', value: '36,2 %',  delta: 'Ziel 32 %', tone: 'text-red-500' },
]

const SAVINGS = [
  { label: 'Personalkosten optimieren', amount: '~1.800 €', dot: 'bg-red-500',    prio: 'HOCH' },
  { label: 'Energiekosten senken',      amount: '~340 €',   dot: 'bg-amber-400',  prio: 'MITTEL' },
  { label: 'Direktbuchungen steigern',  amount: '~620 €',   dot: 'bg-red-500',    prio: 'HOCH' },
]

export default function HeroSection() {
  return (
    <section className="relative px-6 pt-36 lg:pt-44 pb-28 overflow-hidden bg-white">
      {/* Dezenter Hintergrund: warmer Gold-Glow oben rechts + feines Raster */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 50% 40% at 85% 0%, rgba(201,168,76,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 5% 90%, rgba(14,26,51,0.05) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(14,26,51,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* ── Links: Botschaft ─────────────────────────────────────────────── */}
        <div className="text-center lg:text-left">
          <m.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-600 text-xs font-medium px-3.5 py-1.5 rounded-full mb-7 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            Controlling-Methodik · DSGVO-konform · EU-Server
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="font-display text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#0E1A33] mb-6"
          >
            Sehen Sie, wo Ihr
            <br />
            Betrieb{' '}
            <span className="relative whitespace-nowrap text-[#0E1A33]">
              Geld verliert
              <span className="absolute left-0 -bottom-1 h-3 w-full bg-[#C9A84C]/30 -z-0 rounded" />
            </span>
            .
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-gray-500 text-lg leading-relaxed mb-9 max-w-xl mx-auto lg:mx-0"
          >
            Laden Sie Ihre Zahlen hoch oder füllen Sie einen kurzen Fragebogen aus.
            Die KI analysiert Kosten, Personal und Prozesse – mit Branchen-Benchmarks
            und konkreten Sparpotenzialen in Euro.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
          >
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 bg-[#0E1A33] hover:bg-[#1a2744] text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#0E1A33]/15"
            >
              Analyse starten
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/report/example"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-medium text-base px-7 py-3.5 rounded-xl transition-all duration-200"
            >
              Beispielbericht ansehen
            </Link>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start mt-7 text-sm text-gray-500"
          >
            {['Keine erfundenen Zahlen', 'Ergebnis in < 5 Min', 'Über 15 Kennzahlen'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="2.2" className="w-4 h-4">
                  <path d="M5 10.5l3.5 3.5L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </span>
            ))}
          </m.div>
        </div>

        {/* ── Rechts: Produkt-Panel ────────────────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          {/* Schwebender Akzent-Chip */}
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute -top-5 right-5 z-20 hidden sm:flex items-center gap-2 bg-white rounded-full border border-gray-100 shadow-xl px-4 py-2"
          >
            <span className="text-emerald-600 text-base font-bold tabular-nums">−18 %</span>
            <span className="text-gray-500 text-xs">Kosten identifiziert</span>
          </m.div>

          <m.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-[#0E1A33]/10 overflow-hidden"
          >
            {/* Panel-Kopf */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#C9A84C] to-[#D9BC72] flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-3 h-3"><path d="M8 2L14 13H2L8 2Z" fill="#0E1A33" /></svg>
                </div>
                <span className="text-sm font-semibold text-[#0E1A33]">Profitora-Analyse</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">Juni 2026</span>
            </div>

            {/* KPI-Kacheln */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[11px] text-gray-400 mb-1 leading-tight">{k.label}</p>
                  <p className="text-base font-bold text-[#0E1A33] tracking-tight">{k.value}</p>
                  <p className={`text-[11px] mt-0.5 font-medium ${k.tone}`}>{k.delta}</p>
                </div>
              ))}
            </div>

            {/* Top-Sparpotenziale */}
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Top-Sparpotenziale
              </p>
              <div className="space-y-1">
                {SAVINGS.map((s) => (
                  <div key={s.label} className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <span className="text-sm text-gray-700 truncate">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-[#0E1A33] tabular-nums">{s.amount}</span>
                      <span className="text-[10px] font-bold text-gray-400 w-10 text-right">{s.prio}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gesamt-Einsparung */}
            <div className="m-4 mt-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-900">Gesamt-Einsparpotenzial</span>
              <span className="text-lg font-extrabold text-emerald-700 tabular-nums">~2.760 €/Mo</span>
            </div>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
