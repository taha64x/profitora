'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Etwas ist schiefgelaufen</h1>
        <p className="text-gray-500 text-sm mb-8">
          Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
          {error.digest && <span className="block mt-1 text-xs text-gray-400">Fehler-ID: {error.digest}</span>}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="bg-[#0D1630] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            Erneut versuchen
          </button>
          <Link href="/dashboard" className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
