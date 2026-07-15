import Link from 'next/link'
import ScrollReveal from './ScrollReveal'
import { CREDIT_PACKS } from '@/lib/plans'
import { subscriptionsLive } from '@/lib/entitlements'
import SubscriptionPricing from './SubscriptionPricing'

const PLANS = [
  {
    name: CREDIT_PACKS.single.name,
    tag: CREDIT_PACKS.single.tag,
    price: `€ ${CREDIT_PACKS.single.priceOnce.toLocaleString('de-DE')}`,
    priceNote: 'einmalig, kein Abo',
    highlight: false,
    desc: 'Die vollständige KI-Wirtschaftlichkeitsanalyse mit allen Kennzahlen, Sparpotenzialen in Euro und Handlungsempfehlungen.',
    features: CREDIT_PACKS.single.features,
    cta: 'Einzelanalyse kaufen',
    href: '/register?plan=single',
  },
  {
    name: CREDIT_PACKS.triple.name,
    tag: CREDIT_PACKS.triple.tag,
    price: `€ ${CREDIT_PACKS.triple.priceOnce.toLocaleString('de-DE')}`,
    priceNote: `einmalig · ${Math.round(CREDIT_PACKS.triple.priceOnce / CREDIT_PACKS.triple.credits).toLocaleString('de-DE')} € pro Analyse`,
    highlight: true,
    desc: 'Drei vollständige Analysen – ideal, um Maßnahmen im Quartalsvergleich zu überprüfen und dranzubleiben.',
    features: CREDIT_PACKS.triple.features,
    cta: '3er-Paket kaufen',
    href: '/register?plan=triple',
  },
  {
    name: CREDIT_PACKS.five.name,
    tag: CREDIT_PACKS.five.tag,
    price: `€ ${CREDIT_PACKS.five.priceOnce.toLocaleString('de-DE')}`,
    priceNote: `einmalig · ${Math.round(CREDIT_PACKS.five.priceOnce / CREDIT_PACKS.five.credits).toLocaleString('de-DE')} € pro Analyse`,
    highlight: false,
    desc: 'Fünf vollständige Analysen für kontinuierliches Controlling – Monat für Monat den Erfolg messen.',
    features: CREDIT_PACKS.five.features,
    cta: '5er-Paket kaufen',
    href: '/register?plan=five',
  },
]

export default function PricingSection() {
  // Launch-Schalter: neues Abo-Pricing statt Legacy-Credit-Pakete (Spec §3.4)
  if (subscriptionsLive()) return <SubscriptionPricing />

  return (
    <section id="preise" className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
              Pakete
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-4">
              Pro Analyse zahlen – kein Abo
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Jede Analyse ist ein vollständiger 10-Abschnitt-Bericht mit Sparpotenzialen in Euro.
              Im Paket wird jede Analyse günstiger – das Guthaben verfällt nicht.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div
                className={`relative flex flex-col h-full rounded-2xl border p-7 transition-all ${
                  plan.highlight
                    ? 'border-hotel-navy bg-gradient-to-br from-[#0E1A33] to-[#243459] text-white shadow-xl scale-[1.02]'
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
            Kostenloser Account inklusive: Finanztracking, Beispielbericht und KI-Assistent zum Kennenlernen –{' '}
            <Link href="/register" className="underline hover:text-gray-600">jetzt kostenlos registrieren</Link>.
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
            Alle Analysen sind betriebswirtschaftliche Entscheidungshilfen –
            kein Ersatz für Steuerberater, Rechtsanwalt oder gesetzlichen Wirtschaftsprüfer.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
