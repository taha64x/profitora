'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ANALYSIS_SOLO_PRICE_CENTS, SUBSCRIPTION_PLANS } from '@/lib/plans'
import { VAT_NOTE } from '@/lib/company'

const TIERS = [SUBSCRIPTION_PLANS.starter, SUBSCRIPTION_PLANS.business, SUBSCRIPTION_PLANS.premium]

function euro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE')
}

export default function SubscriptionPricing() {
  const [interval, setInterval] = useState<'month' | 'year'>('month')

  return (
    <section id="preise" className="bg-white py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#B8923A] text-sm font-semibold tracking-widest uppercase mb-3">
            Preise
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0E1A33] tracking-tight mb-4">
            Ihr ganzes Unternehmen. Ein Cockpit.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Finanzen, Team und Kennzahlen an einem Ort – mit KI-Analysen zum Bruchteil des Einzelpreises.
            14 Tage kostenlos testen, monatlich kündbar.
          </p>
        </div>

        {/* Intervall-Toggle */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setInterval('month')}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              interval === 'month' ? 'bg-hotel-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              interval === 'year' ? 'bg-hotel-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Jährlich <span className={interval === 'year' ? 'text-au-gold' : 'text-[#B8923A]'}>−20 %</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const cents = interval === 'year' ? tier.priceYearlyPerMonthCents : tier.priceMonthlyCents
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col h-full rounded-2xl border p-7 transition-all ${
                  tier.highlight
                    ? 'border-hotel-navy bg-gradient-to-br from-[#0E1A33] to-[#243459] text-white shadow-xl scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-hotel-navy/25 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      tier.highlight ? 'bg-au-gold/20 text-au-gold' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tier.highlight ? 'Beliebt' : tier.tagline}
                  </span>
                </div>

                <p className={`text-3xl font-black tracking-tight mb-0.5 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {euro(cents)} €<span className="text-base font-semibold"> / Monat</span>
                </p>
                <p className={`text-xs mb-4 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                  {interval === 'year'
                    ? `bei jährlicher Zahlung (${euro(cents * 12)} €/Jahr) · zzgl. Analysen`
                    : 'monatlich kündbar · zzgl. Analysen'}
                </p>

                <p className={`text-lg font-bold mb-2 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>{tier.name}</p>

                <ul className="space-y-2 flex-1 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke={tier.highlight ? '#C9A84C' : '#1a2744'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className={`text-sm ${tier.highlight ? 'text-white/70' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?abo=${tier.id}&interval=${interval}`}
                  className={`flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 ${
                    tier.highlight
                      ? 'bg-au-gold text-[#06091A] hover:bg-au-gold-light'
                      : 'bg-hotel-navy text-white hover:bg-hotel-navy-light'
                  }`}
                >
                  14 Tage kostenlos testen
                </Link>
              </div>
            )
          })}
        </div>

        {/* Einzelanalyse ohne Abo */}
        <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">Einzelanalyse ohne Abo</p>
            <p className="text-sm text-gray-500">
              Die vollständige KI-Wirtschaftlichkeitsanalyse als Einmalkauf – ohne Cockpit.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-black text-gray-900">{euro(ANALYSIS_SOLO_PRICE_CENTS)} €</p>
            <Link
              href="/register?plan=single"
              className="text-sm font-semibold px-5 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 hover:border-hotel-navy/40 transition-colors"
            >
              Einzelanalyse kaufen
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8 max-w-lg mx-auto leading-relaxed">
          Abo-Analysen: Starter 499 € · Business 299 € · Premium 199 € (statt {euro(ANALYSIS_SOLO_PRICE_CENTS)} € einzeln).
          Monatlich kündbar, Kündigung jederzeit im Kundenkonto. {VAT_NOTE}
          Alle Analysen sind betriebswirtschaftliche Entscheidungshilfen –
          kein Ersatz für Steuerberater, Rechtsanwalt oder gesetzlichen Wirtschaftsprüfer.
        </p>
      </div>
    </section>
  )
}
