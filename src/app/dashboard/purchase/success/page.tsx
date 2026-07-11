'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { IconLoader } from '@/components/ui/icons'
import { trackPurchase } from '@/components/consent/TrackingScripts'

interface PurchaseInfo {
  id: string
  packName: string
  credits: number
  amountCents: number
  invoiceNumber: string | null
  createdAt: string
}

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 45000

function euro(cents: number) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function PurchaseSuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')

  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const startedAt = useRef(Date.now())

  const poll = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/purchase/by-session?session_id=${encodeURIComponent(sessionId)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.found) {
        setPurchase(data.purchase)
        setCreditBalance(data.creditBalance)
      }
    } catch {
      // Netzwerkfehler beim Polling ignorieren – nächster Versuch folgt
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId || purchase) return
    poll()
    const interval = setInterval(() => {
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        setTimedOut(true)
        clearInterval(interval)
        return
      }
      poll()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [sessionId, purchase, poll])

  // Conversion-Tracking (GA4 / Google Ads / Meta) – no-op ohne Consent/IDs,
  // pro Kauf genau einmal (Guard in trackPurchase).
  useEffect(() => {
    if (!purchase || !sessionId) return
    trackPurchase({
      transactionId: sessionId,
      valueEuro: purchase.amountCents / 100,
      itemName: `Profitora ${purchase.packName}`,
    })
  }, [purchase, sessionId])

  if (!sessionId) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Kein Kauf gefunden</h1>
          <p className="text-sm text-gray-500 mb-6">
            Dieser Seite fehlt die Kauf-Referenz. Ihre Käufe und Ihr Guthaben finden Sie im Bereich Analysen.
          </p>
          <Link
            href="/dashboard/subscription"
            className="inline-flex h-10 items-center rounded-lg bg-[#0D1630] px-5 text-sm font-semibold text-white hover:bg-[#1a2547]"
          >
            Zu Ihren Paketen
          </Link>
        </div>
      </div>
    )
  }

  // Noch kein Webhook-Ergebnis → Zahlung wird verbucht
  if (!purchase) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm text-center">
          {!timedOut ? (
            <>
              <IconLoader className="h-8 w-8 text-[#C9A84C] animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Zahlung wird verarbeitet …</h1>
              <p className="text-sm text-gray-500">
                Ihre Zahlung war erfolgreich. Wir schalten gerade Ihre Analyse-Credits frei –
                das dauert in der Regel nur wenige Sekunden.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Zahlung eingegangen</h1>
              <p className="text-sm text-gray-500 mb-6">
                Die Freischaltung dauert gerade etwas länger als üblich. Sie erhalten in Kürze
                eine Bestätigungs-E-Mail mit allen Details – Ihre Credits erscheinen automatisch
                im Dashboard. Bei Fragen: kontakt@profitora.de
              </p>
              <Link
                href="/dashboard/new-analysis"
                className="inline-flex h-10 items-center rounded-lg bg-[#0D1630] px-5 text-sm font-semibold text-white hover:bg-[#1a2547]"
              >
                Zum Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-10 pb-8 text-center border-b border-gray-100">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vielen Dank für Ihren Kauf!</h1>
          <p className="text-sm text-gray-500">
            Ihre Analyse-Credits wurden freigeschaltet. Eine Bestätigung mit Rechnung
            haben wir Ihnen per E-Mail gesendet.
          </p>
        </div>

        <div className="px-10 py-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Paket</span>
            <span className="font-semibold text-gray-900">
              Profitora {purchase.packName} ({purchase.credits} Analyse{purchase.credits === 1 ? '' : 'n'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Betrag</span>
            <span className="font-semibold text-gray-900">{euro(purchase.amountCents)}</span>
          </div>
          {purchase.invoiceNumber && (
            <div className="flex justify-between">
              <span className="text-gray-500">Rechnungsnummer</span>
              <span className="font-semibold text-gray-900">{purchase.invoiceNumber}</span>
            </div>
          )}
          {creditBalance !== null && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-gray-500">Ihr Analyse-Guthaben</span>
              <span className="inline-flex items-center rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-3 py-1 text-sm font-bold text-[#8a6d1f]">
                {creditBalance} Credit{creditBalance === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>

        <div className="px-10 pb-10 pt-2 flex flex-col sm:flex-row gap-3">
          <a
            href={`/api/invoice/${purchase.id}/pdf`}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Rechnung (PDF)
          </a>
          <Link
            href="/dashboard/new-analysis"
            className="flex-1 inline-flex h-11 items-center justify-center rounded-lg bg-[#0D1630] px-5 text-sm font-semibold text-white hover:bg-[#1a2547]"
          >
            Erste Analyse starten →
          </Link>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Tipp: Die Rechnung können Sie jederzeit erneut über diese Seite herunterladen.
      </p>
    </div>
  )
}

export default function PurchaseSuccessPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="p-8">
            <IconLoader className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        }
      >
        <PurchaseSuccessContent />
      </Suspense>
    </DashboardLayout>
  )
}
