import { redirect } from 'next/navigation'
import { cockpitBlocked } from '@/lib/entitlements-server'

// Mitarbeiter-Stammdaten sind ab Starter enthalten (Cockpit-Gate).
export default async function CockpitGateLayout({ children }: { children: React.ReactNode }) {
  if (await cockpitBlocked()) redirect('/dashboard/subscription?upgrade=1')
  return <>{children}</>
}
