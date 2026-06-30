import Link from 'next/link'
import StickyHeader from '@/components/landing/StickyHeader'
import ScrollReveal from '@/components/landing/ScrollReveal'
import AnimatedCounter from '@/components/landing/AnimatedCounter'
import AnalysisTypesSection from '@/components/landing/AnalysisTypesSection'
import WhatYouGetSection from '@/components/landing/WhatYouGetSection'
import ForWhomSection from '@/components/landing/ForWhomSection'
import PricingSection from '@/components/landing/PricingSection'
import HeroSection from '@/components/landing/HeroSection'
import AnalyseShowcase from '@/components/landing/AnalyseShowcase'
import MotionProvider from '@/components/landing/MotionProvider'
import ProfitChartSection from '@/components/landing/ProfitChartSection'
import DashboardPreviewSection from '@/components/landing/DashboardPreviewSection'

import {
  IconBuilding, IconUtensils, IconCoffee, IconBag, IconHeartPulse,
  IconWrench, IconDumbbell, IconScissors, IconBriefcase, IconGrid,
} from '@/components/ui/icons'

const INDUSTRIES = [
  { label: 'Hotel & Boarding', sub: 'ADR, RevPAR, Auslastung',          Icon: IconBuilding  },
  { label: 'Restaurant',       sub: 'Food Cost, Prime Cost, Gedecke',    Icon: IconUtensils  },
  { label: 'Café & Bäckerei',  sub: 'Rohstoffkosten, Transaktionen',     Icon: IconCoffee    },
  { label: 'Einzelhandel',     sub: 'Wareneinsatz, Rohertragsmarge',     Icon: IconBag       },
  { label: 'Arztpraxis',       sub: 'Stundenumsatz, Auslastung',         Icon: IconHeartPulse },
  { label: 'Handwerk',         sub: 'Materialquote, Auslastungsgrad',    Icon: IconWrench    },
  { label: 'Fitness & Wellness', sub: 'Mitglieder, Kapazität',           Icon: IconDumbbell  },
  { label: 'Beauty & Kosmetik', sub: 'Behandlungen, Produktkosten',      Icon: IconScissors  },
  { label: 'Beratung & Agentur', sub: 'Billable Hours, Nettomarge',      Icon: IconBriefcase },
  { label: 'Andere Betriebe',  sub: 'Universelle Analyse',               Icon: IconGrid      },
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
    <main className="min-h-screen bg-white text-[#0E1A33] overflow-x-clip">
      <StickyHeader />
      <MotionProvider>
      <HeroSection />

      {/* ── STATS (heller Trust-Streifen) ──────────────────────────────────── */}
      <section className="border-y border-gray-200 bg-gray-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 10,  prefix: '',  suffix: '',  label: 'unterstützte Branchen'   },
            { target: 15,  prefix: '',  suffix: '+', label: 'berechnete Kennzahlen'   },
            { target: 10,  prefix: '',  suffix: '',  label: 'Abschnitte je Bericht'   },
            { target: 5,   prefix: '<', suffix: ' Min', label: 'bis zum Bericht'      },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight">
                <AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANALYSEARTEN ───────────────────────────────────────────────────── */}
      <AnalysisTypesSection />

      {/* ── BRANCHEN ───────────────────────────────────────────────────────── */}
      <section id="branchen" className="bg-gray-50 py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
                Branchenspezifisch
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight">
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
                  className="card-lift group flex flex-col gap-3 p-5 rounded-2xl border border-gray-200 bg-white hover:border-[#0E1A33]/25 h-full"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-[#0E1A33]/10 flex items-center justify-center text-[#0E1A33] transition-colors">
                    <ind.Icon />
                  </div>
                  <div>
                    <div className="font-semibold text-[#0E1A33] text-sm leading-tight">
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
      <section id="ablauf" className="bg-white py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
                In 3 Schritten
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight">
                Analyse in unter 5 Minuten
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.num} delay={((i + 1) as 1 | 2 | 3)}>
                <div className="card-lift relative bg-white rounded-2xl p-8 border border-gray-200 shadow-sm h-full">
                  <div className="font-display text-4xl font-extrabold text-[#0E1A33]/15 leading-none mb-5 select-none">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-[#0E1A33] text-lg mb-3">
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

          <AnalyseShowcase />
        </div>
      </section>

      {/* ── UMSATZ RAUF, KOSTEN RUNTER (Scroll-Animation) ──────────────────── */}
      <ProfitChartSection />

      {/* ── FÜR WEN ────────────────────────────────────────────────────────── */}
      <ForWhomSection />

      {/* ── WAS BEKOMMT DER NUTZER ─────────────────────────────────────────── */}
      <WhatYouGetSection />

      {/* ── DASHBOARD PREVIEW (dauerhaft steuern) ──────────────────────────── */}
      <div id="vorschau" className="scroll-mt-24">
        <DashboardPreviewSection />
      </div>

      {/* ── BENTO FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
                Warum Profitora
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight">
                Professionell. Präzise. Praxisnah.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {/* Large card */}
            <ScrollReveal className="md:col-span-2">
              <div className="bento-card p-8 h-full min-h-[200px] flex flex-col justify-between">
                <div>
                  <span className="text-[#B8923A] text-xs font-semibold tracking-widest uppercase">
                    Kern-Feature
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#0E1A33] mt-3 mb-3">
                    KI-Analyse in unter 5 Minuten
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                    CSV oder Excel hochladen – die KI erkennt Spaltenstruktur automatisch,
                    berechnet über 15 Kennzahlen und erstellt einen strukturierten
                    10-Abschnitte-Bericht nach WPO/IDW-Methodik.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Automatisches Mapping', 'Soll-Ist-Vergleich', 'EUR-Beträge', '10 Branchen'].map(tag => (
                    <span key={tag} className="text-xs border border-gray-200 bg-white text-gray-600 px-3 py-1 rounded-full">
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
                  <div className="w-9 h-9 rounded-lg bg-[#0E1A33]/5 border border-[#0E1A33]/10 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#B8923A" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </div>
                  <span className="text-[#B8923A] text-xs font-semibold tracking-widest uppercase">Transparenz</span>
                  <h3 className="text-base font-bold text-[#0E1A33] mt-2 mb-2">
                    Keine erfundenen Zahlen
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
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
                  <div className="w-9 h-9 rounded-lg bg-[#0E1A33]/5 border border-[#0E1A33]/10 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#B8923A" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
                    </svg>
                  </div>
                  <span className="text-[#B8923A] text-xs font-semibold tracking-widest uppercase">Methodik</span>
                  <h3 className="text-base font-bold text-[#0E1A33] mt-2 mb-2">
                    WPO / IDW Methodik
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
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
                  <div className="w-9 h-9 rounded-lg bg-[#0E1A33]/5 border border-[#0E1A33]/10 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#B8923A" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span className="text-[#B8923A] text-xs font-semibold tracking-widest uppercase">Datenschutz</span>
                  <h3 className="text-base font-bold text-[#0E1A33] mt-2 mb-2">
                    DSGVO-konform
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Mitarbeiterdaten anonymisiert. Keine personenbezogenen Daten
                    in KI-Prompts. Art. 6 Abs. 1 lit. f DSGVO.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Large card 2 – Signature: Sparpotenziale */}
            <ScrollReveal delay={3} className="md:col-span-2">
              <div className="bento-card p-8 h-full flex flex-col justify-between">
                <div>
                  <span className="text-[#B8923A] text-xs font-semibold tracking-widest uppercase">Klarheit</span>
                  <h3 className="font-display text-xl font-bold text-[#0E1A33] mt-3 mb-3">
                    Sparpotenziale in konkreten EUR-Beträgen
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                    Nicht „Personal optimieren" – sondern „Personalkostenquote 36,2% liegt über
                    Branchenzielwert 32%. Geschätzte Einsparung: ~1.800 EUR/Monat bei
                    Schichtoptimierung." Konkret. Begründet. Prüfbar.
                  </p>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                  <div className="flex items-center justify-between text-gray-500 mb-2 text-xs uppercase tracking-wide font-medium">
                    <span>Beispiel Sparpotenzialtabelle</span>
                    <span className="text-[#B8923A]">Priorität</span>
                  </div>
                  {[
                    { label: 'Personalkostenoptimierung', amount: '~1.800 EUR/Mo', priority: 'HOCH',   color: 'text-red-500' },
                    { label: 'Energiekosten reduzieren',  amount: '~340 EUR/Mo',  priority: 'MITTEL', color: 'text-amber-500' },
                    { label: 'Direktbuchungsrate steigern', amount: '~620 EUR/Mo', priority: 'HOCH',  color: 'text-red-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-700 text-xs">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#0E1A33] text-xs font-semibold tabular-nums">{row.amount}</span>
                        <span className={`text-xs font-bold ${row.color}`}>{row.priority}</span>
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
            <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
              Kennzahlen
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-3">
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
                <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:border-[#0E1A33]/25 hover:bg-white transition-all cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                  {kpi}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREISE ─────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── CTA (Navy-Panel als bewusster Akzent) ──────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <ScrollReveal className="relative max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-[#0E1A33] px-6 py-16 sm:px-12 text-center">
            {/* dezenter Gold-Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#C9A84C]/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
                Bereit für Ihren
                <br />
                <span className="text-[#D9BC72]">ersten Profitora-Bericht?</span>
              </h2>
              <p className="text-white/60 text-base mb-8 max-w-md mx-auto leading-relaxed">
                Dokumente hochladen oder Fragebogen ausfüllen –
                die KI erstellt eine gründliche, datenbasierte betriebswirtschaftliche Analyse.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D9BC72] text-[#0E1A33] font-bold text-base px-10 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  Analyse starten
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </Link>
                <Link
                  href="/report/example"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-medium text-base px-8 py-4 rounded-xl transition-all duration-200"
                >
                  Beispielbericht ansehen
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── RECHTLICHER HINWEIS ────────────────────────────────────────────── */}
      <section className="py-8 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            <strong className="text-gray-500">Rechtlicher Hinweis:</strong> Profitora ist ein KI-gestützter Wirtschaftlichkeitsassistent (§2 WPO analog).
            Er ersetzt keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung (§317 HGB).
            Alle Ergebnisse sind betriebswirtschaftliche Entscheidungshilfen.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 2L14 13H2L8 2Z" fill="#0E1A33"/>
              </svg>
            </div>
            <span className="text-[#0E1A33] font-semibold text-sm tracking-tight">Profitora</span>
          </div>
          <p className="text-gray-400 text-xs">
            © 2026 Profitora · KI-gestützte Wirtschaftlichkeitsanalyse
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <Link href="/login" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">Anmelden</Link>
            <Link href="/register" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">Registrieren</Link>
            <Link href="/report/example" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">Beispiel</Link>
            <span className="text-gray-300">|</span>
            <Link href="/impressum" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">Datenschutz</Link>
            <Link href="/agb" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">AGB</Link>
            <Link href="/widerruf" className="text-gray-400 hover:text-[#0E1A33] text-xs transition-colors">Widerruf</Link>
          </div>
        </div>
      </footer>
      </MotionProvider>
    </main>
  )
}
