import { redirect } from 'next/navigation'
import { featureBlocked } from '@/lib/entitlements-server'

// Maßnahmen-Tracker ist Business+ (greift erst mit NEXT_PUBLIC_SUBSCRIPTIONS_LIVE).
export default async function MeasuresGateLayout({ children }: { children: React.ReactNode }) {
  if (await featureBlocked('measures')) redirect('/dashboard/subscription?upgrade=1')
  return <>{children}</>
}
