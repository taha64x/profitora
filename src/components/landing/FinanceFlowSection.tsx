'use client'

import { m, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

const INCOME_STREAMS = [
  { label: 'Produktverkauf', amount: '18.400 €', color: '#4CAF8C', delay: 0.2 },
  { label: 'Dienstleistung', amount: '9.200 €', color: '#6B8CFF', delay: 0.35 },
  { label: 'Online-Shop', amount: '4.800 €', color: '#A854F7', delay: 0.5 },
]

const COST_STREAMS = [
  { label: 'Personal', amount: '14.200 €', color: '#C9A84C', delay: 0.7 },
  { label: 'Miete', amount: '3.800 €', color: '#E07C4A', delay: 0.85 },
  { label: 'Energie', amount: '892 €', color: '#ef4444', delay: 1.0 },
  { label: 'Software', amount: '640 €', color: '#6B8CFF', delay: 1.15 },
]

const TRUST_BADGES = [
  'DSGVO-konform',
  'B2B-fokussiert',
  'Dokument-Upload',
  'Fragebogen',
  'Finanzdaten speicherbar',
  'PDF-Bericht',
]

export default function FinanceFlowSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-28 px-6 bg-[#06091A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0D1630]/80 blur-[100px] rounded-full"/>
      </div>

      <div className="max-w-5xl mx-auto relative">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/50 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
            Finanzstruktur
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Alle Zahlen an einem Ort
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            Erfassen Sie Ausgaben, Einnahmen, Dateien und Analyseergebnisse zentral. Die KI erkennt Muster, Auffälligkeiten und mögliche Einsparbereiche.
          </p>
        </m.div>

        {/* Flow diagram */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-0 mb-16">
          {/* Left – Income */}
          <div className="flex-1 space-y-3">
            <p className="text-white/30 text-xs uppercase tracking-widest text-center md:text-right mb-4">Einnahmen</p>
            {INCOME_STREAMS.map((s) => (
              <m.div
                key={s.label}
                initial={{ opacity: 0, x: -24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: s.delay, duration: 0.5 }}
                className="flex items-center justify-end gap-3 md:flex-row"
              >
                <div className="text-right">
                  <p className="text-white/70 text-xs font-medium">{s.label}</p>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.amount}</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: s.color, backgroundColor: `${s.color}30` }}/>
              </m.div>
            ))}
          </div>

          {/* Center – AI core */}
          <div className="relative flex items-center justify-center mx-8 flex-shrink-0">
            {/* Connecting lines */}
            <m.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-[#C9A84C]/40 origin-left hidden md:block"
              style={{ top: '50%' }}
            />
            <m.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute right-0 w-8 h-0.5 bg-gradient-to-l from-transparent to-[#C9A84C]/40 origin-right hidden md:block"
              style={{ top: '50%' }}
            />

            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.55, duration: 0.6, ease: 'backOut' }}
              className="relative"
            >
              <div className="w-28 h-28 rounded-full bg-[#0D1630] border border-[#C9A84C]/30 flex flex-col items-center justify-center text-center shadow-lg shadow-[#C9A84C]/10">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center mb-1.5">
                  <svg viewBox="0 0 20 20" fill="#C9A84C" className="w-4 h-4">
                    <path d="M13 7H7v6h6V7z"/>
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 110-2h1V5a2 2 0 012-2h2V2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-white/80 text-xs font-bold leading-tight">KI analysiert</p>
                <p className="text-white/30 text-xs leading-tight">Ihre Finanz-</p>
                <p className="text-white/30 text-xs leading-tight">struktur</p>
              </div>

              {/* Pulse ring */}
              <m.div
                className="absolute inset-0 rounded-full border border-[#C9A84C]/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </m.div>
          </div>

          {/* Right – Costs */}
          <div className="flex-1 space-y-3">
            <p className="text-white/30 text-xs uppercase tracking-widest text-center md:text-left mb-4">Ausgaben</p>
            {COST_STREAMS.map((s) => (
              <m.div
                key={s.label}
                initial={{ opacity: 0, x: 24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: s.delay, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: s.color, backgroundColor: `${s.color}30` }}/>
                <div>
                  <p className="text-white/70 text-xs font-medium">{s.label}</p>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.amount}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>

        {/* 4 sections row */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {[
            { step: '1', title: 'Kosten & Einnahmen speichern', color: '#C9A84C' },
            { step: '2', title: 'Daten automatisch strukturieren', color: '#6B8CFF' },
            { step: '3', title: 'Analyse starten', color: '#4CAF8C' },
            { step: '4', title: 'Bericht & Maßnahmen', color: '#A854F7' },
          ].map((item, i) => (
            <m.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.0 + i * 0.1, duration: 0.5 }}
              className="bg-white/3 border border-white/8 rounded-xl p-4 text-center"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-xs font-black" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                {item.step}
              </div>
              <p className="text-white/60 text-xs leading-relaxed">{item.title}</p>
            </m.div>
          ))}
        </div>

        {/* Trust badges */}
        <m.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {TRUST_BADGES.map((badge, i) => (
            <m.span
              key={badge}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 1.3 + i * 0.07, duration: 0.3 }}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/50"
            >
              <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                <path d="M1.5 5l2 2 5-4" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {badge}
            </m.span>
          ))}
        </m.div>
      </div>
    </section>
  )
}
