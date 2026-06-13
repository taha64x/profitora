import Link from 'next/link'
import ScrollReveal from './ScrollReveal'
import { PLANS as PLAN_CONFIG } from '@/lib/plans'

const PLANS = [
  {
    name: PLAN_CONFIG.free.name,
    tag: 'Einstieg',
    price: 'Kostenlos',
    priceNote: 'Keine Kreditkarte erforderlich',
    highlight: false,
    desc: 'Finanztracking plus ein monatlicher KI-Schnellcheck – der perfekte Start.',
    features: PLAN_CONFIG.free.features,
    cta: 'Kostenlos starten',
    href: '/register',
  },
  {
    name: PLAN_CONFIG.starter.name,
    tag: 'Empfohlen',
    price: `€ ${PLAN_CONFIG.starter.priceMonthly}`,
    priceNote: 'pro Monat, jederzeit kündbar',
    highlight: true,
    desc: 'Für Betriebe, die ihre Zahlen jeden Monat im Griff haben wollen.',
    features: PLAN_CONFIG.starter.features,
    cta: 'Starter wählen',
    href: '/register?plan=starter',
  },
  {
    name: PLAN_CONFIG.business.name,
    tag: 'Maximal',
    price: `€ ${PLAN_CONFIG.business.priceMonthly}`,
    priceNote: 'pro Monat, jederzeit kündbar',
    highlight: false,
    desc: 'Unbegrenzte Tiefenanalysen mit dem besten KI-Modell und vollem Assistenten.',
    features: PLAN_CONFIG.business.features,
    cta: 'Business wählen',
    href: '/register?plan=business',
  },
  {
    name: PLAN_CONFIG.single.name,
    tag: 'Ohne Abo',
    price: `€ ${PLAN_CONFIG.single.priceOnce}`,
    priceNote: 'einmalig, kein Abo',
    highlight: false,
    desc: 'Eine vollständige Komplett-Analyse als Einmalkauf – ideal zum Ausprobieren.',
    features: PLAN_CONFIG.single.features,
    cta: 'Einzel-Analyse kaufen',
    href: '/register?plan=single',
  },
]

export default function PricingSection() {
  return (
    <section id="preise" className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-hotel-navy text-sm font-semibold tracking-widest uppercase mb-3">
              Pakete
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Abo oder Einmalkauf – Sie entscheiden
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Jeder Tarif enthält Finanztracking und KI-Assistent.
              Höhere Tarife nutzen leistungsstärkere KI-Modelle und bieten mehr Analysen.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div
                className={`relative flex flex-col h-full rounded-2xl border p-7 transition-all ${
                  plan.highlight
                    ? 'border-hotel-navy bg-hotel-navy text-white shadow-xl scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-hotel-navy/25 hover:shadow-md'
                }`}
              >
                {/* Tag */}
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      plan.highlight
                        ? 'bg-au-gold/20 text-au-gold'
                        : plan.tag === 'Empfohlen'
                        ? 'bg-hotel-navy/10 text-hotel-navy'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {plan.tag}
                  </span>
                </div>

                {/* Price */}
                <p className={`text-3xl font-black tracking-tight mb-0.5 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </p>
                <p className={`text-xs mb-4 ${plan.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                  {plan.priceNote}
                </p>

                {/* Name */}
                <p className={`text-lg font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </p>
                <p className={`text-sm leading-relaxed mb-6 ${plan.highlight ? 'text-white/60' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke={plan.highlight ? '#C9A84C' : '#1a2744'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.href}
                  className={`flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-au-gold text-[#06091A] hover:bg-au-gold-light'
                      : 'bg-hotel-navy text-white hover:bg-hotel-navy-light'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <p className="text-center text-gray-400 text-xs mt-8 max-w-lg mx-auto leading-relaxed">
            Alle Preise inkl. MwSt. Abos sind monatlich kündbar.
            Alle Analysen sind betriebswirtschaftliche Entscheidungshilfen –
            kein Ersatz für Steuerberater, Rechtsanwalt oder gesetzlichen Wirtschaftsprüfer.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
