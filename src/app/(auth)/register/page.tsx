'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BUSINESS_TYPES, getBusinessTypeConfig } from '@/types'
import { PLANS as PLAN_CONFIG, type PlanId } from '@/lib/plans'
import { BusinessTypeIcon } from '@/components/ui/icons'

const PAID_PLANS: PlanId[] = ['starter', 'business', 'single']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  // Tarif aus ?plan= (von der Preis-Sektion der Landing-Page) merken,
  // damit wir nach der Anmeldung direkt zur Zahlung weiterleiten können.
  const [plan, setPlan] = useState<PlanId | null>(null)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan')
    if (p && p in PLAN_CONFIG) setPlan(p as PlanId)
  }, [])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    organizationName: '',
    businessType: '',
    unitCount: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedBusiness = form.businessType ? getBusinessTypeConfig(form.businessType) : null

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.businessType) {
      setError('Bitte wählen Sie Ihre Unternehmensart.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    if (form.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          organizationName: form.organizationName,
          businessType: form.businessType,
          unitCount: form.unitCount ? parseInt(form.unitCount) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registrierung fehlgeschlagen.')
        return
      }

      // Direkt-Kauf: bei kostenpflichtigem Tarif sofort zum Stripe-Checkout,
      // ohne Umweg über das Dashboard (weniger Reibung = mehr Abschlüsse).
      if (plan && PAID_PLANS.includes(plan)) {
        try {
          const checkoutRes = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan }),
          })
          const checkoutData = await checkoutRes.json()
          if (checkoutRes.ok && checkoutData.url) {
            window.location.href = checkoutData.url
            return
          }
        } catch {
          /* Checkout (noch) nicht möglich – sanft auf die Tarif-Seite ausweichen */
        }
        router.push('/dashboard/subscription')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-2xl font-bold text-hotel-navy">Profitora</span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">
            {plan && PAID_PLANS.includes(plan)
              ? 'Account erstellen – danach geht es direkt zur Zahlung'
              : 'Kostenlosen Account erstellen'}
          </p>
        </div>

        <div className="card p-8">
          {plan && PAID_PLANS.includes(plan) && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-hotel-navy/5 border border-hotel-navy/15 px-4 py-3">
              <span className="text-sm text-gray-600">Gewählter Tarif</span>
              <span className="text-sm font-semibold text-hotel-navy">
                {PLAN_CONFIG[plan].name}
                {PLAN_CONFIG[plan].priceMonthly != null
                  ? ` · ${PLAN_CONFIG[plan].priceMonthly} €/Monat`
                  : PLAN_CONFIG[plan].priceOnce != null
                  ? ` · ${PLAN_CONFIG[plan].priceOnce} € einmalig`
                  : ''}
              </span>
            </div>
          )}
          {/* Schritte */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-hotel-navy text-white' : 'bg-green-500 text-white'}`}>
              {step === 2 ? '✓' : '1'}
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-hotel-navy text-white' : 'bg-gray-200 text-gray-400'}`}>
              2
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Schritt 1: Unternehmensart */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Ihre Unternehmensart</h1>
              <p className="text-gray-500 text-sm mb-5">
                Wählen Sie aus, welche Art von Unternehmen Sie betreiben – die KI passt die Analyse und alle Branchenbenchmarks automatisch an.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => update('businessType', bt.value)}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                      form.businessType === bt.value
                        ? 'border-hotel-navy bg-hotel-navy text-white'
                        : 'border-gray-200 bg-white hover:border-hotel-navy/40'
                    }`}
                  >
                    <div className={`mb-1.5 ${form.businessType === bt.value ? 'text-white' : 'text-hotel-navy'}`}>
                      <BusinessTypeIcon type={bt.value} className="w-5 h-5" />
                    </div>
                    <div className={`font-medium text-sm leading-tight ${form.businessType === bt.value ? 'text-white' : 'text-gray-800'}`}>
                      {bt.label}
                    </div>
                    <div className={`text-xs mt-1 leading-tight ${form.businessType === bt.value ? 'text-white/70' : 'text-gray-400'}`}>
                      {bt.description}
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!form.businessType}
                onClick={() => {
                  if (!form.businessType) {
                    setError('Bitte wählen Sie Ihre Unternehmensart.')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                className="btn-primary w-full disabled:opacity-40"
              >
                Weiter →
              </button>
            </div>
          )}

          {/* Schritt 2: Account-Daten */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-400 hover:text-gray-700"
                >
                  ← Zurück
                </button>
                {selectedBusiness && (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-sm bg-hotel-navy/10 text-hotel-navy px-3 py-1 rounded-full font-medium">
                    <BusinessTypeIcon type={selectedBusiness.value} className="w-4 h-4" />
                    {selectedBusiness.label}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-semibold text-gray-900">Account erstellen</h1>

              <div>
                <label className="label">Ihr Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Max Mustermann"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>

              <div>
                <label className="label">E-Mail-Adresse</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="max@unternehmen.de"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Name Ihres Unternehmens</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder={
                    selectedBusiness?.value === 'hotel' ? 'Boardinghotel Heidelberg' :
                    selectedBusiness?.value === 'restaurant' ? 'Restaurant Zur Eiche' :
                    selectedBusiness?.value === 'retail' ? 'Modehaus Mustermann' :
                    'Unternehmensname'
                  }
                  value={form.organizationName}
                  onChange={(e) => update('organizationName', e.target.value)}
                />
              </div>

              {selectedBusiness && (
                <div>
                  <label className="label">
                    {selectedBusiness.unitLabel}{' '}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99999"
                    className="input"
                    placeholder={selectedBusiness.unitHint}
                    value={form.unitCount}
                    onChange={(e) => update('unitCount', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Wird für Auslastungsberechnungen benötigt
                  </p>
                </div>
              )}

              <div>
                <label className="label">Passwort</label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="Mindestens 8 Zeichen"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Passwort wiederholen</label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={form.passwordConfirm}
                  onChange={(e) => update('passwordConfirm', e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Wird registriert...' : 'Account erstellen'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
            Mit der Registrierung stimmen Sie zu, dass Profitora ein KI-gestützter
            Wirtschaftlichkeitsassistent ist und keine Steuer- oder Rechtsberatung ersetzt.
          </p>

          <p className="mt-4 text-center text-sm text-gray-500">
            Bereits registriert?{' '}
            <Link href="/login" className="text-hotel-navy font-medium hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
