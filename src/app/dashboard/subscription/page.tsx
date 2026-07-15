import { Suspense } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import CheckoutButton from '@/components/subscription/CheckoutButton'
import PortalButton from '@/components/subscription/PortalButton'
import PlanManager from '@/components/subscription/PlanManager'
import { CREDIT_PACKS } from '@/lib/plans'
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'

const PACKS = Object.values(CREDIT_PACKS)

export default async function SubscriptionPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')
  const m = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  const sub = m ? await db.subscription.findUnique({ where: { organizationId: m.organizationId } }) : null

  const credits = sub?.analysisCredits ?? 0
  const used = sub?.usedAnalysesThisMonth ?? 0
  const purchases = m
    ? await db.stripePurchase.findMany({
        where: { organizationId: m.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    : []

  // ── Neues Abo-Modell (Launch-Flag) ──────────────────────────────────────────
  if (subscriptionsLive()) {
    const ent = getEntitlements(sub)
    return (
      <DashboardLayout>
        <div className="dash-page">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Abo & Analysen</h1>
          <p className="text-gray-500 text-sm mb-8">
            Ihr Tarif, Ihre Analysen und Ihre Rechnungen — alles an einem Ort.
          </p>
          <Suspense>
            <PlanManager
              planId={ent.planId}
              status={sub?.status ?? 'active'}
              billingInterval={sub?.billingInterval ?? null}
              periodEnd={sub?.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null}
              analysisPriceCents={ent.analysisPriceCents}
              credits={credits}
              hasStripeCustomer={Boolean(sub?.stripeCustomerId)}
            />
          </Suspense>

          {purchases.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6">
              <p className="font-semibold text-gray-900 text-sm mb-3">Ihre Einmalkäufe</p>
              <div className="space-y-2">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-700">{p.credits} Analyse{p.credits === 1 ? '' : 'n'} ({p.pack})</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('de-DE')} · {(p.amountCents / 100).toLocaleString('de-DE')} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // ── Legacy-Ansicht (Credit-Pakete), unverändert bis zum Launch ──────────────
  return (
    <DashboardLayout>
      <div className="dash-page">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysen & Zahlung</h1>
        <p className="text-gray-500 text-sm mb-8">
          Jede Analyse verbraucht 1 Guthaben. Einzeln kaufen oder mit Paketen sparen – einmalig, kein Abo, Guthaben verfällt nicht.
        </p>

        {/* Current status */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#0D1630] rounded-xl p-6 text-white">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Analyse-Guthaben</p>
            <p className="text-2xl font-bold">{credits} Analyse{credits === 1 ? '' : 'n'}</p>
            <p className="text-white/40 text-xs mt-1">{credits > 0 ? 'Bereit zum Starten' : 'Kein Guthaben'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Analysen diesen Monat</p>
            <p className="text-2xl font-bold text-gray-900">{used}</p>
            <p className="text-gray-400 text-xs mt-1">Gestartete Analysen</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Letzter Kauf</p>
            <p className="text-2xl font-bold text-gray-900">
              {purchases[0] ? new Date(purchases[0].createdAt).toLocaleDateString('de-DE') : '–'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {purchases[0] ? `${purchases[0].credits} Analyse${purchases[0].credits === 1 ? '' : 'n'} · ${(purchases[0].amountCents / 100).toLocaleString('de-DE')} €` : 'Noch kein Kauf'}
            </p>
          </div>
        </div>

        {/* Packs */}
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Analyse-Guthaben kaufen</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`rounded-xl border p-6 ${pack.highlight ? 'border-[#0D1630] bg-[#0D1630] text-white shadow-lg' : 'border-gray-200 bg-white'}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pack.highlight ? 'text-au-gold' : 'text-gray-500'}`}>
                {pack.name}
              </p>
              <p className={`text-[11px] mb-3 ${pack.highlight ? 'text-white/50' : 'text-gray-400'}`}>{pack.tag}</p>
              <p className={`text-2xl font-black mb-1 ${pack.highlight ? 'text-white' : 'text-gray-900'}`}>
                {pack.priceOnce.toLocaleString('de-DE')} €
              </p>
              <p className={`text-xs mb-4 ${pack.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                einmalig · {Math.round(pack.priceOnce / pack.credits).toLocaleString('de-DE')} € pro Analyse
              </p>
              <ul className="space-y-1.5 mb-5">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 flex-shrink-0">
                      <path d="M2 6l3 3 5-5" stroke={pack.highlight ? '#C9A84C' : '#1a2744'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={pack.highlight ? 'text-white/70' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <CheckoutButton plan={pack.id} label={`${pack.credits} Analyse${pack.credits === 1 ? '' : 'n'} kaufen`} light={pack.highlight} />
            </div>
          ))}
        </div>

        {/* Käufe */}
        {purchases.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <p className="font-semibold text-gray-900 text-sm mb-3">Ihre Käufe</p>
            <div className="space-y-2">
              {purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-700">{p.credits} Analyse{p.credits === 1 ? '' : 'n'} ({p.pack})</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('de-DE')} · {(p.amountCents / 100).toLocaleString('de-DE')} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stripe Verwaltung */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Zahlungen & Rechnungen verwalten</p>
              <p className="text-gray-500 text-xs mt-1">
                Zahlungsmethode ändern oder Rechnungen herunterladen.
              </p>
            </div>
            {sub?.stripeCustomerId ? (
              <PortalButton />
            ) : (
              <span className="text-xs text-gray-400">Noch kein Kauf</span>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
