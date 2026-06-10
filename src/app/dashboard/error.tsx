'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Fehler beim Laden</h2>
          <p className="text-gray-500 text-sm mb-6">Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="bg-[#0D1630] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#152040] transition-colors">
              Erneut laden
            </button>
            <Link href="/dashboard" className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
