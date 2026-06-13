'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import GoldParticles from './GoldParticles'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-grid opacity-60" />
      <div className="absolute inset-0 hero-glow" />
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#C9A84C]/10 rounded-full blur-[120px] pointer-events-none glow-drift"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[260px] bg-[#1a2744]/40 rounded-full blur-[110px] pointer-events-none" />
      <GoldParticles />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-medium px-4 py-1.5 rounded-full mb-8 bg-[#C9A84C]/5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          Orientiert an Methoden aus Controlling, Kostenrechnung & betriebswirtschaftlicher Prüfung
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-6"
        >
          <span className="gradient-text">KI-gestützte Unternehmensanalyse</span>
          <br />
          für Kosten, Prozesse und Einsparpotenziale
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Laden Sie Dokumente hoch oder beantworten Sie einen strukturierten Fragebogen.
          Die KI analysiert Kosten, Mitarbeiter, Buchhaltung, Prozesse und
          branchentypische Vergleichswerte – für klare Optimierungsvorschläge.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href="/analyze"
            className="btn-shine bg-[#C9A84C] hover:bg-[#d4b86a] text-[#06091A] font-bold text-base px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Analyse starten →
          </Link>
          <a
            href="#ablauf"
            className="border border-white/15 text-white/80 hover:text-white hover:border-white/30 text-base font-medium px-8 py-3.5 rounded-xl transition-all duration-200 bg-white/3 hover:bg-white/6"
          >
            So funktioniert es
          </a>
        </motion.div>

        {/* Trust */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="text-white/25 text-xs mt-6 tracking-wide max-w-sm mx-auto leading-relaxed text-center"
        >
          Kein Ersatz für Steuerberater oder Wirtschaftsprüfer ·
          Betriebswirtschaftliche Entscheidungshilfe
        </motion.p>

        {/* Floating dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 mx-auto max-w-2xl"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-[#0A0E22]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#060912]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/>
              </div>
              <span className="text-white/20 text-xs font-mono">profitora.de/dashboard</span>
              <div/>
            </div>
            {/* Stat cards */}
            <div className="p-4 grid grid-cols-4 gap-2">
              {[
                { l: 'Einnahmen', v: '32.400 €', c: 'text-green-400' },
                { l: 'Ausgaben', v: '24.800 €', c: 'text-red-400' },
                { l: 'Gewinn', v: '7.600 €', c: 'text-green-400' },
                { l: 'Marge', v: '23.5 %', c: 'text-[#C9A84C]' },
              ].map((card, i) => (
                <motion.div
                  key={card.l}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                  className="bg-white/5 rounded-xl p-3"
                >
                  <p className="text-white/30 text-xs mb-1">{card.l}</p>
                  <p className={`font-bold text-sm ${card.c}`}>{card.v}</p>
                </motion.div>
              ))}
            </div>
            {/* Cost bars */}
            <div className="px-4 pb-4 space-y-2">
              {[
                { cat: 'Personal', pct: 72, color: '#C9A84C' },
                { cat: 'Miete', pct: 45, color: '#6B8CFF' },
                { cat: 'Energie', pct: 18, color: '#4CAF8C' },
              ].map((b, i) => (
                <div key={b.cat}>
                  <div className="flex justify-between text-xs text-white/25 mb-0.5">
                    <span>{b.cat}</span><span>{b.pct} %</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: b.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${b.pct}%` }}
                      transition={{ delay: 1.1 + i * 0.12, duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </motion.div>
    </section>
  )
}
