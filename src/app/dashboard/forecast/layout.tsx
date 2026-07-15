import { redirect } from 'next/navigation'
import { featureBlocked } from '@/lib/entitlements-server'

// Forecast ist Premium (greift erst mit NEXT_PUBLIC_SUBSCRIPTIONS_LIVE).
export default async function ForecastGateLayout({ children }: { children: React.ReactNode }) {
  if (await featureBlocked('forecast')) redirect('/dashboard/subscription?upgrade=1')
  return <>{children}</>
}
