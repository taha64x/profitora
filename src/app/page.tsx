import Link from 'next/link'
import StickyHeader from '@/components/landing/StickyHeader'
import ScrollReveal from '@/components/landing/ScrollReveal'
import AnimatedCounter from '@/components/landing/AnimatedCounter'
import AnalysisTypesSection from '@/components/landing/AnalysisTypesSection'
import WhatYouGetSection from '@/components/landing/WhatYouGetSection'
import ForWhomSection from '@/components/landing/ForWhomSection'
import PricingSection from '@/components/landing/PricingSection'
import DashboardPreviewSection from '@/components/landing/DashboardPreviewSection'
import ZoomStorySection from '@/components/landing/ZoomStorySection'
import FinanceFlowSection from '@/components/landing/FinanceFlowSection'
import HeroSection from '@/components/landing/HeroSection'

// ─── SVG Icons (kein Emoji) ──────────────────────────────────────────────────

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>
    </svg>
  )
}
function IconUtensils() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  )
}
function IconCoffee() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3"/>
    </svg>
  )
}
function IconBag() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
    </svg>
  )
}
function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )
}
function IconWrench() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}
function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  )
}
function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  )
}
function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}

const INDUSTRIES = [
  { label: 'Hotel & Boarding', sub: 'ADR, RevPAR, Auslastung',          Icon: IconBuilding  },
  { label: 'Restaurant',       sub: 'Food Cost, Prime Cost, Gedecke',    Icon: IconUtensils  },
  { label: 'Café & Bäckerei',  sub: 'Rohstoffkosten, Transaktionen',     Icon: IconCoffee    },
  { label: 'Einzelhandel',     sub: 'Wareneinsatz, Rohertragsmarge',     Icon: IconBag       },
  { label: 'Arztpraxis',       sub: 'Stundenumsatz, Auslastung',         Icon: IconHeart     },
  { label: 'Handwerk',         sub: 'Materialquote, Auslastungsgrad',    Icon: IconWrench    },
  { label: 'Fitness & Wellness', sub: 'Mitglieder, Kapazität',           Icon: IconZap       },
  { label: 'Beauty & Kosmetik', sub: 'Behandlungen, Produktkosten',      Icon: IconSparkle   },
  { label: 'Beratung & Agentur', sub: 'Billable Hours, Nettomarge',      Icon: IconBriefcase },
  { label: 'Andere Betriebe',  sub: 'Universelle Analyse',               Icon: IconGrid      },
]

const FEATURES = [
  {
    size: 'col-span-2 row-span-1',
    title: 'KI-Analyse in unter 5 Minuten',
    desc: 'CSV oder Excel hochladen – die KI erkennt Struktur und Spalten automatisch. Keine manuelle Zuordnung nötig. Kein Excel-Chaos.',
    tag: 'Kern-Feature',
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'Keine erfundenen Zahlen',
    desc: 'Jede Aussage basiert auf Ihren echten Betriebsdaten. Fehlende Daten werden klar kommuniziert – nie geschätzt.',
    tag: 'Transparenz',
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'WPO / IDW Methodik',
    desc: 'Orientiert an betriebswirtschaftlichen Prüfungsstandards. Professionelle Tiefe ohne Wirtschaftsprüfer-Rechnung.',
    tag: 'Methodik',
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'Sparpotenziale in EUR',
    desc: 'Konkrete Zahlen: Nicht „Personal optimieren", sondern „~2.400 EUR/Monat Einsparpotenzial bei Personaleinsatz".',
    tag: 'Klarheit',
  },
  {
    size: 'col-span-1 row-span-1',
    title: 'DSGVO-konform',
    desc: 'Mitarbeiterdaten werden anonymisiert verarbeitet. Keine personenbezogenen Daten in KI-Prompts.',
    tag: 'Datenschutz',
  },
]

const KPIS = [
  'Umsatz / Tag', 'Nettomarge %', 'Personalkostenquote',
  'Umsatz / Mitarbeiterstunde', 'Auslastungsgrad', 'Sparpotenziale in EUR',
  'Wareneinsatz / Food Cost', 'Rohertragsmarge', 'Energiekosten / Einheit',
  'ADR & RevPAR (Hotels)', 'Plattform-Provisionen', 'Prime Cost (Gastronomie)',
]

const STEPS = [
  {
    num: '01',
    title: 'Unternehmensart wählen',
    desc: 'Wählen Sie Ihre Branche – die KI lädt automatisch die richtigen Branchenbenchmarks und Kennzahlen für Ihren Betrieb.',
  },
  {
    num: '02',
    title: 'Dateien hochladen',
    desc: 'Einnahmen, Ausgaben, Mitarbeiterzeiten aus Ihrer Software als CSV oder Excel – automatisch erkannt, kein manuelles Mapping nötig.',
  },
  {
    num: '03',
    title: 'Professionellen Bericht erhalten',
    desc: 'Zehn strukturierte Abschnitte: von der Management-Zusammenfassung bis zu konkreten Handlungsempfehlungen mit EUR-Zahlen.',
  },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#06091A] text-white overflow-x-hidden">
      <StickyHeader />
      <HeroSection />

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-white/[0.02] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 500,  prefix: '',  suffix: '+', label: 'Betriebe analysiert'    },
            { target: 2800000, prefix: '€', suffix: '', label: 'identifizierte Sparpotenziale' },
            { target: 10,   prefix: '',  suffix: '',  label: 'unterstützte Branchen'  },
            { target: 5,    prefix: '<', suffix: ' Min', label: 'bis zum Bericht'     },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                <AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANALYSEARTEN ───────────────────────────────────────────────────── */}
      <AnalysisTypesSection />

      {/* ── BRANCHEN ───────────────────────────────────────────────────────── */}
      <section id="branchen" className="bg-white py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-au-gold text-sm font-semibold tracking-widest uppercase mb-3">
                Branchenspezifisch
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Passende Benchmarks für jeden Betrieb
              </h2>
              <p className="text-gray-500 mt-4 max-w-xl mx-auto text-base leading-relaxed">
                Kein generisches Tool. Profitora kennt die Richtwerte Ihrer Branche
                und vergleicht Ihren Betrieb automatisch mit dem Branchendurchschnitt.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {INDUSTRIES.map((ind, i) => (
              <ScrollReveal key={ind.label} delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5}>
                <Link
                  href="/register"
                  className="group flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 hover:border-hotel-navy/25 hover:bg-hotel-navy/3 transition-all duration-200 h-full"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-hotel-navy/10 flex items-center justify-center text-hotel-navy transition-colors">
                    <ind.Icon />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm leading-tight">
                      {ind.label}
                    </div>
                    <div className="text-gray-400 text-xs mt-1 leading-tight">
                      {ind.sub}
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="ablauf" className="bg-gray-50 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-hotel-navy text-sm font-semibold tracking-widest uppercase mb-3">
                In 3 Schritten
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Analyse in unter 5 Minuten
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.num} delay={((i + 1) as 1 | 2 | 3)}>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="text-5xl font-black text-gray-100 leading-none mb-5 select-none">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FÜR WEN ────────────────────────────────────────────────────────── */}
      <ForWhomSection />

      {/* ── WAS BEKOMMT DER NUTZER ─────────────────────────────────────────── */}
      <WhatYouGetSection />

      {/* ── NICHT NUR ANALYSIEREN ──────────────────────────────────────────── */}
      <section className="bg-[#06091A] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/50 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"/>
                Dauerhaft steuern
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
                Nicht nur analysieren –<br/>
                <span className="text-[#C9A84C]">dauerhaft steuern</span>
              </h2>
              <p className="text-white/40 text-base max-w-xl mx-auto leading-relaxed">
                Speichern Sie Kosten, Einnahmen und Ausgaben direkt in Ihrem Account. So behalten Sie jeden Monat den Überblick und können Analysen auf echten Finanzdaten aufbauen.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '📊', title: 'Monatliches Finanztracking', text: 'Kosten und Einnahmen strukturiert erfassen – nach Kategorie, Anbieter und Zeitraum.' },
              { icon: '🤖', title: 'KI analysiert Ihre Daten', text: 'Auf Basis Ihrer gespeicherten Finanzdaten startet die KI-Analyse – präziser als mit Fragebögen allein.' },
              { icon: '📈', title: 'Monatsvergleiche', text: 'Sehen Sie, wie sich Kosten und Einnahmen über Zeit entwickeln – und wo Handlungsbedarf besteht.' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={((i + 1) as 1 | 2 | 3)}>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors">
                  <span className="text-2xl mb-4 block">{item.icon}</span>
                  <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{item.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINANCE FLOW ───────────────────────────────────────────────────── */}
      <FinanceFlowSection />

      {/* ── ZOOM STORY ─────────────────────────────────────────────────────── */}
      <ZoomStorySection />

      {/* ── DASHBOARD PREVIEW ──────────────────────────────────────────────── */}
      <DashboardPreviewSection />

      {/* ── BENTO FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#06091A] py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-au-gold text-sm font-semibold tracking-widest uppercase mb-3">
                Warum Profitora
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Professionell. Präzise. Praxisnah.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {/* Large card */}
            <ScrollReveal className="md:col-span-2">
              <div className="bento-card p-8 h-full min-h-[200px] flex flex-col justify-between">
                <div>
                  <span className="text-au-gold text-xs font-semibold tracking-widest uppercase">
                    Kern-Feature
                  </span>
                  <h3 className="text-xl font-bold text-white mt-3 mb-3">
                    KI-Analyse in unter 5 Minuten
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed max-w-md">
                    CSV oder Excel hochladen – die KI erkennt Spaltenstruktur automatisch,
                    berechnet über 15 Kennzahlen und erstellt einen strukturierten
                    10-Abschnitte-Bericht nach WPO/IDW-Methodik.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Automatisches Mapping', 'Soll-Ist-Vergleich', 'EUR-Beträge', '10 Branchen'].map(tag => (
                    <span key={tag} className="text-xs border border-white/12 text-white/50 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Small card 1 */}
            <ScrollReveal delay={1}>
              <div className="bento-card p-7 h-full min-h-[200px] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#C9A84C" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </div>
                  <span className="text-au-gold text-xs font-semibold tracking-widest uppercase">Transparenz</span>
                  <h3 className="text-base font-bold text-white mt-2 mb-2">
                    Keine erfundenen Zahlen
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Jede Aussage basiert auf Ihren Daten. Fehlende Werte werden klar als
                    „Nicht verfügbar" gekennzeichnet.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Small card 2 */}
            <ScrollReveal delay={1}>
              <div className="bento-card p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#C9A84C" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
                    </svg>
                  </div>
                  <span className="text-au-gold text-xs font-semibold tracking-widest uppercase">Methodik</span>
                  <h3 className="text-base font-bold text-white mt-2 mb-2">
                    WPO / IDW Methodik
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Orientiert an betriebswirtschaftlichen Prüfungsstandards – professionelle
                    Tiefe ohne Beraterhonorar.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Small card 3 */}
            <ScrollReveal delay={2}>
              <div className="bento-card p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#C9A84C" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span className="text-au-gold text-xs font-semibold tracking-widest uppercase">Datenschutz</span>
                  <h3 className="text-base font-bold text-white mt-2 mb-2">
                    DSGVO-konform
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Mitarbeiterdaten anonymisiert. Keine personenbezogenen Daten
                    in KI-Prompts. Art. 6 Abs. 1 lit. f DSGVO.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Large card 2 */}
            <ScrollReveal delay={3} className="md:col-span-2">
              <div className="bento-card p-8 h-full flex flex-col justify-between">
                <div>
                  <span className="text-au-gold text-xs font-semibold tracking-widest uppercase">Klarheit</span>
                  <h3 className="text-xl font-bold text-white mt-3 mb-3">
                    Sparpotenziale in konkreten EUR-Beträgen
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed max-w-md">
                    Nicht „Personal optimieren" – sondern „Personalkostenquote 36,2% liegt über
                    Branchenzielwert 32%. Geschätzte Einsparung: ~1.800 EUR/Monat bei
                    Schichtoptimierung." Konkret. Begründet. Prüfbar.
                  </p>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-white/4 border border-white/8 text-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs uppercase tracking-wide font-medium">
                    <span>Beispiel Sparpotenzialtabelle</span>
                    <span className="text-au-gold text-xs">Priorität</span>
                  </div>
                  {[
                    { label: 'Personalkostenoptimierung', amount: '~1.800 EUR/Mo', priority: 'HOCH',   color: 'text-red-400' },
                    { label: 'Energiekosten reduzieren',  amount: '~340 EUR/Mo',  priority: 'MITTEL', color: 'text-yellow-400' },
                    { label: 'Direktbuchungsrate steigern', amount: '~620 EUR/Mo', priority: 'HOCH',  color: 'text-red-400' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/6 last:border-0">
                      <span className="text-white/55 text-xs">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/80 text-xs font-mono">{row.amount}</span>
                        <span className={`text-xs font-semibold ${row.color}`}>{row.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-hotel-navy text-sm font-semibold tracking-widest uppercase mb-3">
              Kennzahlen
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Über 15 KPIs – aus Ihren echten Daten
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-12 text-base">
              Keine Schätzungen. Keine erfundenen Zahlen.
              Alle Kennzahlen basieren auf Ihren hochgeladenen Daten.
            </p>
          </ScrollReveal>

          <div className="flex flex-wrap justify-center gap-2.5">
            {KPIS.map((kpi, i) => (
              <ScrollReveal key={kpi} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:border-hotel-navy/25 hover:bg-hotel-navy/3 transition-all cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-au-gold" />
                  {kpi}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREISE ─────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#06091A] py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-au-gold/8 rounded-full blur-[100px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
            Bereit für Ihren
            <br />
            <span className="gradient-text-gold">ersten Profitora-Bericht?</span>
          </h2>
          <p className="text-white/45 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Dokumente hochladen oder Fragebogen ausfüllen –
            die KI erstellt eine gründliche, datenbasierte betriebswirtschaftliche Analyse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-au-gold hover:bg-au-gold-light text-[#06091A] font-bold text-base px-10 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              Analyse starten
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </Link>
            <Link
              href="/analyze/questionnaire?level=schnellcheck&industry=other&types=komplett&method=questionnaire&goals=alles_pruefen"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-medium text-base px-8 py-4 rounded-xl transition-all duration-200"
            >
              Kostenloser Schnellcheck
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── RECHTLICHER HINWEIS ────────────────────────────────────────────── */}
      <section className="py-6 px-6 bg-[#030610] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/20 text-xs text-center leading-relaxed">
            <strong className="text-white/35">Rechtlicher Hinweis:</strong> Profitora ist ein KI-gestützter Wirtschaftlichkeitsassistent (§2 WPO analog).
            Er ersetzt keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung (§317 HGB).
            Alle Ergebnisse sind betriebswirtschaftliche Entscheidungshilfen.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#030610] border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 2L14 13H2L8 2Z" fill="#06091A"/>
              </svg>
            </div>
            <span className="text-white/60 font-semibold text-sm tracking-tight">Profitora</span>
          </div>
          <p className="text-white/20 text-xs">
            © 2026 Profitora · KI-gestützte Wirtschaftlichkeitsanalyse
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <Link href="/login" className="text-white/25 hover:text-white/50 text-xs transition-colors">Anmelden</Link>
            <Link href="/register" className="text-white/25 hover:text-white/50 text-xs transition-colors">Registrieren</Link>
            <Link href="/report/example" className="text-white/25 hover:text-white/50 text-xs transition-colors">Beispiel</Link>
            <span className="text-white/10">|</span>
            <Link href="/impressum" className="text-white/25 hover:text-white/50 text-xs transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="text-white/25 hover:text-white/50 text-xs transition-colors">Datenschutz</Link>
            <Link href="/agb" className="text-white/25 hover:text-white/50 text-xs transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
