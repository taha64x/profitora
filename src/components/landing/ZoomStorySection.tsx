'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const STAGES = [
  {
    label: '01',
    title: 'Unübersichtliche Daten',
    color: '#ef4444',
    bg: 'bg-red-950/20 border-red-500/20',
    rows: [
      ['Jan', 'Personal', '14.200 €', '??'],
      ['Jan', 'Miete', '3.800 €', '–'],
      ['Feb', 'Energie', '892 €', '?'],
      ['Feb', 'Einkauf', '7.440 €', '??'],
      ['Mrz', '???', '2.100 €', '–'],
    ],
  },
  {
    label: '02',
    title: 'KI analysiert Ihre Struktur',
    color: '#C9A84C',
    bg: 'bg-amber-950/20 border-amber-500/20',
    items: ['Spalten erkannt', 'Kategorien zugeordnet', 'Duplikate entfernt', 'Zeiträume normiert', 'Benchmarks geladen'],
  },
  {
    label: '03',
    title: 'Strukturierte Kostenbereiche',
    color: '#6B8CFF',
    bg: 'bg-blue-950/20 border-blue-500/20',
    bars: [
      { cat: 'Personal', pct: 42, eur: '14.200 €' },
      { cat: 'Einkauf', pct: 22, eur: '7.440 €' },
      { cat: 'Miete', pct: 11, eur: '3.800 €' },
      { cat: 'Energie', pct: 3, eur: '892 €' },
    ],
  },
  {
    label: '04',
    title: 'Ihr Maßnahmenplan',
    color: '#4CAF8C',
    bg: 'bg-green-950/20 border-green-500/20',
    actions: [
      { prio: 'Hoch', text: 'Personalplanung optimieren → ~2.400 €/Mo', done: false },
      { prio: 'Mittel', text: 'Einkauf bündeln → ~800 €/Mo', done: false },
      { prio: 'Info', text: 'Energiekosten unter Richtwert', done: true },
    ],
  },
]

export default function ZoomStorySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })

  const stage = useTransform(scrollYProgress, [0.05, 0.3, 0.55, 0.8], [0, 1, 2, 3])

  return (
    <section ref={containerRef} className="relative py-28 px-6 bg-[#030610] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/50 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
            So funktioniert es
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Von unübersichtlichen Zahlen<br/>
            <span className="text-[#C9A84C]">zu klaren Entscheidungen.</span>
          </h2>
          <p className="text-white/40 text-base max-w-lg mx-auto">
            Profitora verwandelt Ihre rohen Betriebsdaten in einen strukturierten Analysebericht mit konkreten Handlungsempfehlungen.
          </p>
        </motion.div>

        {/* Stage cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {STAGES.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: idx * 0.12 }}
              className={`border rounded-2xl p-6 ${s.bg}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono font-bold" style={{ color: s.color }}>{s.label}</span>
                <span className="text-white/70 font-semibold text-sm">{s.title}</span>
              </div>

              {/* Stage 0: messy table */}
              {idx === 0 && (
                <div className="overflow-hidden rounded-lg border border-white/5">
                  <table className="w-full text-xs">
                    <tbody>
                      {s.rows!.map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          {row.map((cell, j) => (
                            <td key={j} className={`px-3 py-2 ${j === 3 ? 'text-red-400' : 'text-white/30'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 text-red-400/60 text-xs flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                    </svg>
                    Fehlende Kategorien, unklare Struktur
                  </div>
                </div>
              )}

              {/* Stage 1: AI processing */}
              {idx === 1 && (
                <div className="space-y-2">
                  {s.items!.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-4 h-4 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                          <path d="M1.5 5l2 2 5-4" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-white/50 text-xs">{item}</span>
                    </motion.div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#C9A84C] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-[#C9A84C] text-xs font-semibold">100 %</span>
                  </div>
                </div>
              )}

              {/* Stage 2: bars */}
              {idx === 2 && (
                <div className="space-y-3">
                  {s.bars!.map((b, i) => (
                    <div key={b.cat}>
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>{b.cat}</span>
                        <span>{b.eur} <span className="text-white/20">({b.pct} %)</span></span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#6B8CFF]"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${b.pct * 2}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stage 3: action items */}
              {idx === 3 && (
                <div className="space-y-2.5">
                  {s.actions!.map((a, i) => (
                    <motion.div
                      key={a.text}
                      initial={{ opacity: 0, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.12 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                    >
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${a.prio === 'Hoch' ? 'bg-red-500/20 text-red-400' : a.prio === 'Mittel' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        {a.prio}
                      </span>
                      <span className="text-white/60 text-xs leading-relaxed">{a.text}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
