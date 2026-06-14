'use client'

import { m, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

const BARS = [
  { label: 'Personal', pct: 72, color: '#C9A84C' },
  { label: 'Miete', pct: 45, color: '#6B8CFF' },
  { label: 'Energie', pct: 28, color: '#4CAF8C' },
  { label: 'Software', pct: 18, color: '#E07C4A' },
  { label: 'Marketing', pct: 34, color: '#A854F7' },
]

const REV_ITEMS = [
  { label: 'Produktverkauf', amount: '18.400 €', up: true },
  { label: 'Dienstleistung', amount: '9.200 €', up: true },
  { label: 'Online-Shop', amount: '4.800 €', up: false },
]

const HINT_ITEMS = [
  { color: '#C9A84C', text: 'Personalkostenquote bei 42 % – Richtwert 32 %' },
  { color: '#4CAF8C', text: 'Einnahmen gestiegen um 8 % ggü. Vormonat' },
  { color: '#E07C4A', text: 'Marketingkosten +18 % ohne Umsatzanstieg' },
]

function MiniCard({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="bg-white/5 border border-white/10 rounded-xl p-4"
    >
      {children}
    </m.div>
  )
}

export default function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-28 px-6 bg-[#06091A] relative overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#C9A84C]/5 blur-[120px] rounded-full"/>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Heading */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/50 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
            Ihr Dashboard
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Mehr als eine Analyse –<br/>
            <span className="text-[#C9A84C]">Ihr Finanz- und Optimierungsdashboard</span>
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto leading-relaxed">
            Speichern Sie Kosten, Einnahmen und Ausgaben dauerhaft. Starten Sie Analysen auf echten Finanzdaten. Verwalten Sie alles an einem Ort.
          </p>
        </m.div>

        {/* Mock dashboard */}
        <m.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-[#0A0E22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#060912]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60"/>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
              <div className="w-3 h-3 rounded-full bg-green-500/60"/>
            </div>
            <div className="text-white/20 text-xs font-mono">auditly.app/dashboard</div>
            <div/>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-44 border-r border-white/5 p-4 flex-shrink-0 hidden md:block">
              {['Übersicht', 'Neue Analyse', 'Finanzübersicht', 'Kosten', 'Einnahmen', 'Berichte', 'Abo'].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-xs ${i === 0 ? 'bg-white/10 text-white' : 'text-white/30'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#C9A84C]' : 'bg-white/20'}`}/>
                  {item}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 space-y-4 min-w-0">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Einnahmen/Mo', value: '32.400 €', up: true },
                  { label: 'Ausgaben/Mo', value: '24.800 €', up: false },
                  { label: 'Gewinn', value: '7.600 €', up: true },
                  { label: 'Gewinnmarge', value: '23.5 %', up: true },
                ].map((card, i) => (
                  <MiniCard key={card.label} delay={0.3 + i * 0.08}>
                    <p className="text-white/30 text-xs mb-1">{card.label}</p>
                    <p className="text-white font-bold text-sm">{card.value}</p>
                    <p className={`text-xs mt-0.5 ${card.up ? 'text-green-400' : 'text-red-400'}`}>
                      {card.up ? '↑' : '↓'} ggü. Vormonat
                    </p>
                  </MiniCard>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid md:grid-cols-2 gap-3">
                {/* Cost bars */}
                <MiniCard delay={0.55}>
                  <p className="text-white/50 text-xs mb-3">Kostenbereiche diesen Monat</p>
                  <div className="space-y-2">
                    {BARS.map((b, i) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs text-white/30 mb-1">
                          <span>{b.label}</span>
                          <span>{b.pct} %</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <m.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: b.color }}
                            initial={{ width: 0 }}
                            animate={inView ? { width: `${b.pct}%` } : {}}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </MiniCard>

                {/* Revenue + hints */}
                <div className="space-y-3">
                  <MiniCard delay={0.6}>
                    <p className="text-white/50 text-xs mb-2">Einnahmen nach Quelle</p>
                    {REV_ITEMS.map((r) => (
                      <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-white/50 text-xs">{r.label}</span>
                        <span className={`text-xs font-semibold ${r.up ? 'text-green-400' : 'text-white/60'}`}>{r.amount}</span>
                      </div>
                    ))}
                  </MiniCard>
                  <MiniCard delay={0.65}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
                      <p className="text-white/50 text-xs">KI-Hinweise</p>
                    </div>
                    {HINT_ITEMS.map((h) => (
                      <div key={h.text} className="flex gap-2 mb-1.5">
                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: h.color }}/>
                        <p className="text-white/40 text-xs leading-relaxed">{h.text}</p>
                      </div>
                    ))}
                  </MiniCard>
                </div>
              </div>
            </div>
          </div>
        </m.div>

        {/* CTA */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-10"
        >
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#06091A] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-[#d4b86a] transition-colors">
            Dashboard freischalten
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </Link>
          <p className="text-white/25 text-xs mt-3">Kostenlos starten · Kein Kreditkarte nötig</p>
        </m.div>
      </div>
    </section>
  )
}
