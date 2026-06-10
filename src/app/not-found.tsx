import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#0D1630] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-2">Seite nicht gefunden</p>
        <p className="text-gray-500 text-sm mb-8">Die gesuchte Seite existiert nicht oder wurde verschoben.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="bg-[#0D1630] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            Zum Dashboard
          </Link>
          <Link href="/" className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
