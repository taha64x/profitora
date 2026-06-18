import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CheckoutButton from '@/components/subscription/CheckoutButton'
import PortalButton from '@/components/subscription/PortalButton'
import { PLANS as PLAN_CONFIG } from '@/lib/plans'

const PLANS = [
  { key: 'free',    name: PLAN_CONFIG.free.name,    price: '0 €',                                                      features: PLAN_CONFIG.free.features },
  { key: 'premium', name: PLAN_CONFIG.premium.name, price: `${PLAN_CONFIG.premium.priceOnce?.toLocaleString('de-DE')} € einmalig`, features: PLAN_CONFIG.premium.features },
]

export default async function SubscriptionPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')
  const m = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  const sub = m ? await db.subscription.findUnique({ where: { organizationId: m.organizationId } }) : null

  const currentPlan = sub?.planName ?? 'free'
  const used = sub?.usedAnalysesThisMonth ?? 0
  const limit = sub?.monthlyAnalysisLimit ?? 1

  return (
    <DashboardLayout>
      <div className="dash-page">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Abo & Zahlung</h1>
        <p className="text-gray-500 text-sm mb-8">Ihr aktuelles Paket und Zahlungsoptionen verwalten</p>

        {/* Current status */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#0D1630] rounded-xl p-6 text-white">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Aktuelles Paket</p>
            <p className="text-2xl font-bold capitalize">{currentPlan}</p>
            <p className="text-white/40 text-xs mt-1">{sub?.status === 'active' ? 'Aktiv' : 'Inaktiv'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Analysen diesen Monat</p>
            <p className="text-2xl font-bold text-gray-900">{used} / {limit >= 999 ? '∞' : limit}</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
              <div className="h-full bg-[#0D1630] rounded-full" style={{ width: `${Math.min((used / Math.max(limit, 1)) * 100, 100)}%` }}/>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Nächste Abrechnung</p>
            <p className="text-2xl font-bold text-gray-900">
              {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE') : '–'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {sub?.stripeSubscriptionId ? `ID: ${sub.stripeSubscriptionId.slice(0, 12)}…` : 'Kein aktives Abo'}
            </p>
          </div>
        </div>

        {/* Plans */}
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Pläne vergleichen</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan
            return (
              <div key={plan.key} className={`rounded-xl border p-6 ${isCurrent ? 'border-[#0D1630] bg-[#0D1630] text-white' : 'border-gray-200 bg-white'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isCurrent ? 'text-au-gold' : 'text-gray-500'}`}>{plan.name}</p>
                <p className={`text-2xl font-black mb-4 ${isCurrent ? 'text-white' : 'text-gray-900'}`}>{plan.price}</p>
                <ul className="space-y-1.5 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                        <path d="M2 6l3 3 5-5" stroke={isCurrent ? '#C9A84C' : '#1a2744'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={isCurrent ? 'text-white/70' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-xs text-white/40 text-center py-2">Aktueller Plan</div>
                ) : (
                  <CheckoutButton
                    plan={plan.key}
                    label={plan.key === 'free' ? 'Kostenlos' : 'Komplettanalyse kaufen'}
                    disabled={plan.key === 'free'}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Stripe Abo-Verwaltung */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Abo & Rechnungen verwalten</p>
              <p className="text-gray-500 text-xs mt-1">
                Zahlungsmethode ändern, Rechnungen herunterladen oder Abo kündigen.
              </p>
            </div>
            {sub?.stripeCustomerId ? (
              <PortalButton />
            ) : (
              <span className="text-xs text-gray-400">Kein aktives Stripe-Abo</span>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
