import { redirect } from 'next/navigation'
import { cockpitBlocked } from '@/lib/entitlements-server'

// Cockpit ist Teil des Abos (greift erst mit NEXT_PUBLIC_SUBSCRIPTIONS_LIVE).
// Deckt /dashboard/mein-weg und /dashboard/mein-weg/ziele ab.
export default async function CockpitGateLayout({ children }: { children: React.ReactNode }) {
  if (await cockpitBlocked()) redirect('/dashboard/subscription?upgrade=1')
  return <>{children}</>
}
