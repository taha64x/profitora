'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

// Umsatz steigt, Kosten fallen: Animation startet automatisch beim Erreichen
// der Sektion und läuft flüssig durch – kein Scroll-Scrubbing, kein "Festhängen".

const MONTHS = ['Monat 1', 'Monat 2', 'Monat 3', 'Monat 4', 'Monat 5', 'Monat 6']

const REVENUE_START = 24_800
const REVENUE_END = 32_400
const COSTS_START = 23_900
const COSTS_END = 19_600

const DRAW_DURATION = 2.5

function formatEur(n: number) {
  return `${Math.round(n).toLocaleString('de-DE')} €`
}

export default function ProfitChartSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-25% 0px' })

  const [revenue, setRevenue] = useState(REVENUE_START)
  const [costs, setCosts] = useState(COSTS_START)

  useEffect(() => {
    if (!inView) return
    const r = animate(REVENUE_START, REVENUE_END, {
      duration: DRAW_DURATION,
      ease: 'easeInOut',
      onUpdate: (v) => setRevenue(v),
    })
    const c = animate(COSTS_START, COSTS_END, {
      duration: DRAW_DURATION,
      ease: 'easeInOut',
      onUpdate: (v) => setCosts(v),
    })
    return () => { r.stop(); c.stop() }
  }, [inView])

  const profit = revenue - costs

  return (
    <section className="bg-[#06091A] relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div ref={ref} className="max-w-5xl mx-auto w-full relative">
        <div className="text-center mb-10">
          <p className="text-au-gold text-sm font-semibold tracking-widest uppercase mb-3">
            Das Ziel
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Umsatz rauf. Kosten runter.
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto leading-relaxed">
            Das passiert, wenn Analyse-Empfehlungen konsequent umgesetzt werden.
          </p>
        </div>

        {/* Live-Zahlen */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-center">
            <p className="text-white/35 text-xs uppercase tracking-wide mb-1">Umsatz</p>
            <p className="text-green-400 font-bold text-lg md:text-2xl tabular-nums">{formatEur(revenue)}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-center">
            <p className="text-white/35 text-xs uppercase tracking-wide mb-1">Kosten</p>
            <p className="text-red-400 font-bold text-lg md:text-2xl tabular-nums">{formatEur(costs)}</p>
          </div>
          <div className="bg-au-gold/8 border border-au-gold/25 rounded-xl p-4 text-center">
            <p className="text-au-gold/70 text-xs uppercase tracking-wide mb-1">Gewinn / Monat</p>
            <p className="text-au-gold font-bold text-lg md:text-2xl tabular-nums">{formatEur(profit)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="relative bg-[#0A0E22]/80 border border-white/8 rounded-2xl p-6 md:p-8">
          <svg viewBox="0 0 800 320" className="w-full h-auto" fill="none">
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="40" x2="780" y1={50 + i * 70} y2={50 + i * 70}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}

            {/* Gewinn-Fläche zwischen den Kurven */}
            <motion.path
              d="M40,200 C180,190 320,160 480,120 C600,90 700,70 780,60
                 L780,225 C700,232 600,240 480,242 C320,245 180,235 40,215 Z"
              fill="url(#profitGradient)"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: DRAW_DURATION * 0.65, duration: 1, ease: 'easeOut' }}
            />

            {/* Umsatz – steigend */}
            <motion.path
              d="M40,200 C180,190 320,160 480,120 C600,90 700,70 780,60"
              stroke="#4ade80"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: DRAW_DURATION, ease: 'easeInOut' }}
            />
            {/* Kosten – fallend */}
            <motion.path
              d="M40,215 C180,235 320,245 480,242 C600,240 700,232 780,225"
              stroke="#f87171"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: DRAW_DURATION, ease: 'easeInOut' }}
            />

            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(201,168,76,0.22)" />
                <stop offset="100%" stopColor="rgba(201,168,76,0.02)" />
              </linearGradient>
            </defs>

            {MONTHS.map((m, i) => (
              <text key={m} x={70 + i * 136} y="305"
                fill="rgba(255,255,255,0.25)" fontSize="12" textAnchor="middle">
                {m}
              </text>
            ))}
          </svg>

          {/* Kurven-Labels */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-green-400/80">
              <span className="w-3 h-[2px] bg-green-400 inline-block rounded-full" /> Umsatz
            </span>
            <span className="inline-flex items-center gap-1.5 text-red-400/80">
              <span className="w-3 h-[2px] bg-red-400 inline-block rounded-full" /> Kosten
            </span>
          </div>

          {/* Gewinn-Badge erscheint am Ende */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: DRAW_DURATION * 0.85, duration: 0.6, type: 'spring', bounce: 0.35 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#06091A]/90 border border-au-gold/40 rounded-xl px-5 py-3 text-center shadow-2xl"
          >
            <p className="text-au-gold font-black text-xl md:text-2xl tabular-nums">
              +{formatEur(REVENUE_END - COSTS_END - (REVENUE_START - COSTS_START))}
            </p>
            <p className="text-white/45 text-xs mt-0.5">mehr Gewinn pro Monat</p>
          </motion.div>
        </div>

        <p className="text-white/20 text-xs text-center mt-5 leading-relaxed max-w-md mx-auto">
          Beispielhafte Darstellung. Tatsächliche Ergebnisse hängen von Ihrem Betrieb
          und der Umsetzung der Empfehlungen ab – keine Erfolgsgarantie.
        </p>
      </div>
    </section>
  )
}
