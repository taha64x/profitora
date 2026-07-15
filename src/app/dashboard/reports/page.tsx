import { redirect } from 'next/navigation'

// Duplikat von /dashboard/analyses — zusammengeführt (Spec §5.3).
export default function LegacyReportsRedirect() {
  redirect('/dashboard/analyses')
}
