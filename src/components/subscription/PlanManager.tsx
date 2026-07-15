'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CheckoutButton from '@/components/subscription/CheckoutButton'
import PortalButton from '@/components/subscription/PortalButton'
import { SUBSCRIPTION_PLANS } from '@/lib/plans'
import { VAT_NOTE } from '@/lib/company'

interface Props {
  planId: 'free' | 'starter' | 'business' | 'premium'
  status: string
  billingInterval: string | null
  /** ISO-Datum des Periodenendes (Verlängerung/Trial-Ende), null wenn unbekannt */
  periodEnd: string | null
  analysisPriceCents: number
  credits: number
  hasStripeCustomer: boolean
}

const TIERS = [SUBSCRIPTION_PLANS.starter, SUBSCRIPTION_PLANS.business, SUBSCRIPTION_PLANS.premium]

function euro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE')
}

export default function PlanManager({
  planId,
  status,
  billingInterval,
  periodEnd,
  analysisPriceCents,
  credits,
  hasStripeCustomer,
}: Props) {
  const [interval, setInterval] = useState<'month' | 'year'>(
    billingInterval === 'year' ? 'year' : 'month',
  )
  const searchParams = useSearchParams()
  const showUpgradeBanner = searchParams.get('upgrade') === '1'
  const justSubscribed = searchParams.get('subscribed') === '1'

  const currentPlan = planId !== 'free' ? SUBSCRIPTION_PLANS[planId] : null
  const endLabel = periodEnd ? new Date(periodEnd).toLocaleDateString('de-DE') : null

  return (
    <div>
      {showUpgradeBanner && (
        <div className="mb-6 rounded-xl border border-au-gold/40 bg-au-gold/10 p-4 text-sm text-[#0E1A33]">
          Diese Funktion ist Teil des Profitora-Abos. Wählen Sie unten einen Tarif — 14 Tage kostenlos testen.
        </div>
      )}
      {justSubscribed && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Abo abgeschlossen — willkommen an Bord! Ihr Cockpit ist jetzt freigeschaltet.
        </div>
      )}
      {status === 'past_due' && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Ihre letzte Zahlung ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode unten im Kundenportal.
        </div>
      )}

      {/* Aktueller Plan */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#0D1630] rounded-xl p-6 text-white">
          <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Ihr Tarif</p>
          <p className="text-2xl font-bold">{currentPlan ? currentPlan.name : 'Kein Abo'}</p>
          <p className="text-white/40 text-xs mt-1">
            {status === 'trialing' && endLabel
              ? `Testphase bis ${endLabel}`
              : currentPlan && endLabel
                ? `Verlängert sich am ${endLabel}`
                : 'Cockpit & günstige Analysen gibt es im Abo'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Ihr Analyse-Preis</p>
          <p className="text-2xl font-bold text-gray-900">{euro(analysisPriceCents)} €</p>
          <p className="text-gray-400 text-xs mt-1">
            {status === 'trialing' && currentPlan
              ? 'Im Testzeitraum gilt der Einzelpreis'
              : currentPlan
                ? 'statt 2.490 € ohne Abo'
                : 'pro Analyse (Einzelkauf)'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Analyse-Guthaben</p>
          <p className="text-2xl font-bold text-gray-900">{credits}</p>
          <p className="text-gray-400 text-xs mt-1">{credits > 0 ? 'Bereit zum Starten' : 'Kein Guthaben'}</p>
        </div>
      </div>

      {/* Analyse kaufen */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">KI-Analyse kaufen</p>
          <p className="text-gray-500 text-xs mt-1">
            Vollständiger 10-Abschnitt-Bericht mit Sparpotenzialen in Euro — {euro(analysisPriceCents)} € einmalig.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <CheckoutButton kind="analysis" plan="analysis" label={`Analyse für ${euro(analysisPriceCents)} € kaufen`} />
        </div>
      </div>

      {/* Tarife */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{currentPlan ? 'Tarif wechseln' : 'Abo abschließen'}</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInterval('month')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${interval === 'month' ? 'bg-[#0D1630] text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${interval === 'year' ? 'bg-[#0D1630] text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Jährlich −20 %
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {TIERS.map((tier) => {
          const cents = interval === 'year' ? tier.priceYearlyPerMonthCents : tier.priceMonthlyCents
          const isCurrent = currentPlan?.id === tier.id
          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-6 ${tier.highlight ? 'border-[#0D1630] bg-[#0D1630] text-white shadow-lg' : 'border-gray-200 bg-white'}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${tier.highlight ? 'text-au-gold' : 'text-gray-500'}`}>
                {tier.name}
              </p>
              <p className={`text-[11px] mb-3 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>{tier.tagline}</p>
              <p className={`text-2xl font-black mb-1 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                {euro(cents)} € <span className="text-sm font-semibold">/ Monat</span>
              </p>
              <p className={`text-xs mb-4 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                {interval === 'year' ? 'bei jährlicher Zahlung' : 'monatlich kündbar'} · Analysen {euro(tier.analysisPriceCents)} €
              </p>
              <ul className="space-y-1.5 mb-5">
                {tier.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                      <path d="M2 6l3 3 5-5" stroke={tier.highlight ? '#C9A84C' : '#1a2744'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={tier.highlight ? 'text-white/70' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className={`text-xs text-center font-semibold py-2.5 rounded-lg ${tier.highlight ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-500'}`}>
                  Ihr aktueller Tarif
                </div>
              ) : currentPlan ? (
                // Tarifwechsel eines laufenden Abos läuft über das Stripe-Portal
                // (Proration übernimmt Stripe) — kein zweites Abo anlegen.
                <PortalButton />
              ) : (
                <CheckoutButton
                  kind="subscription"
                  plan={tier.id}
                  interval={interval}
                  label="14 Tage kostenlos testen"
                  light={tier.highlight}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Verwaltung + Kündigung (§ 312k BGB: gut sichtbarer Kündigungsweg) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Zahlungen, Rechnungen & Kündigung</p>
            <p className="text-gray-500 text-xs mt-1">
              Zahlungsmethode ändern, Rechnungen herunterladen oder das Abo mit einem Klick kündigen —
              Kündigung wirkt zum Ende der laufenden Periode.
            </p>
          </div>
          {hasStripeCustomer ? <PortalButton /> : <span className="text-xs text-gray-400">Noch kein Kauf</span>}
        </div>
        {currentPlan && hasStripeCustomer && (
          <p className="text-xs text-gray-400 mt-3">
            Verträge hier kündigen: Über „Abo & Rechnungen verwalten" → „Abo kündigen".
          </p>
        )}
        <p className="text-xs text-gray-400 mt-3">{VAT_NOTE} Es gelten die <a href="/agb" className="underline hover:text-gray-600">AGB</a> und die <a href="/widerruf" className="underline hover:text-gray-600">Widerrufsbelehrung</a>.</p>
      </div>
    </div>
  )
}
