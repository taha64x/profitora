import { redirect } from 'next/navigation'
import { shiftsBlocked } from '@/lib/entitlements-server'

// Schichtplan ist Business+ (greift erst mit NEXT_PUBLIC_SUBSCRIPTIONS_LIVE).
export default async function ShiftsGateLayout({ children }: { children: React.ReactNode }) {
  if (await shiftsBlocked()) redirect('/dashboard/subscription?upgrade=1')
  return <>{children}</>
}
