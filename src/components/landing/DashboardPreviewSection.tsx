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
      className="bg-gray-50 border border-gray-200 rounded-xl p-4"
    >
      {children}
    </m.div>
  )
}

export default function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-28 px-6 bg-gradient-to-b from-white via-gray-100 to-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        {/* Heading */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 mb-5 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
            Ihr Dashboard
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-4">
            Mehr als eine Analyse –<br/>
            <span className="text-[#B8923A]">Ihr Finanz- und Optimierungsdashboard</span>
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            Speichern Sie Kosten, Einnahmen und Ausgaben dauerhaft. Starten Sie Analysen auf echten Finanzdaten. Verwalten Sie alles an einem Ort.
          </p>
        </m.div>

        {/* Mock dashboard */}
        <m.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl shadow-[#0E1A33]/10"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"/>
              <div className="w-3 h-3 rounded-full bg-yellow-400"/>
              <div className="w-3 h-3 rounded-full bg-green-400"/>
            </div>
            <div className="text-gray-400 text-xs font-mono">profitora.de/dashboard</div>
            <div/>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-44 border-r border-gray-200 p-4 flex-shrink-0 hidden md:block bg-gray-50/50">
              {['Übersicht', 'Neue Analyse', 'Finanzübersicht', 'Kosten', 'Einnahmen', 'Berichte', 'Abo'].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-xs ${i === 0 ? 'bg-white border border-gray-200 text-[#0E1A33] font-medium shadow-sm' : 'text-gray-400'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#C9A84C]' : 'bg-gray-300'}`}/>
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
                    <p className="text-gray-400 text-xs mb-1">{card.label}</p>
                    <p className="text-[#0E1A33] font-bold text-sm">{card.value}</p>
                    <p className={`text-xs mt-0.5 ${card.up ? 'text-emerald-600' : 'text-red-500'}`}>
                      {card.up ? '↑' : '↓'} ggü. Vormonat
                    </p>
                  </MiniCard>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid md:grid-cols-2 gap-3">
                {/* Cost bars */}
                <MiniCard delay={0.55}>
                  <p className="text-gray-500 text-xs mb-3 font-medium">Kostenbereiche diesen Monat</p>
                  <div className="space-y-2">
                    {BARS.map((b, i) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{b.label}</span>
                          <span>{b.pct} %</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                    <p className="text-gray-500 text-xs mb-2 font-medium">Einnahmen nach Quelle</p>
                    {REV_ITEMS.map((r) => (
                      <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-0">
                        <span className="text-gray-500 text-xs">{r.label}</span>
                        <span className={`text-xs font-semibold ${r.up ? 'text-emerald-600' : 'text-gray-600'}`}>{r.amount}</span>
                      </div>
                    ))}
                  </MiniCard>
                  <MiniCard delay={0.65}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
                      <p className="text-gray-500 text-xs font-medium">KI-Hinweise</p>
                    </div>
                    {HINT_ITEMS.map((h) => (
                      <div key={h.text} className="flex gap-2 mb-1.5">
                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: h.color }}/>
                        <p className="text-gray-500 text-xs leading-relaxed">{h.text}</p>
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
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#0E1A33] text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-[#1a2744] transition-colors shadow-lg shadow-[#0E1A33]/15">
            Dashboard freischalten
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </Link>
          <p className="text-gray-400 text-xs mt-3">Kostenlos starten · Keine Kreditkarte nötig</p>
        </m.div>
      </div>
    </section>
  )
}
