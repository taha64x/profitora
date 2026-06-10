'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import ColumnMapper from '@/components/upload/ColumnMapper'

function ColumnMappingContent() {
  const searchParams = useSearchParams()
  const uploadId = searchParams.get('uploadId')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-hotel-navy text-white flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-hotel-gold">Profitora</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '📊' },
            { href: '/upload', label: 'Dateien hochladen', icon: '📁', active: true },
            { href: '/report', label: 'Berichte', icon: '📄' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/upload" className="hover:text-gray-600 transition-colors">
              Dateien hochladen
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Spalten zuordnen</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Spalten zuordnen</h1>
            <p className="text-gray-500 text-sm mt-1">
              Damit die KI Ihre Datei korrekt versteht, ordnen Sie die Spalten den Analysefeldern zu.
            </p>
          </div>

          {!uploadId ? (
            <div className="card p-6 border-yellow-200 bg-yellow-50">
              <p className="text-yellow-800 font-medium">Keine Datei ausgewählt.</p>
              <p className="text-yellow-700 text-sm mt-1">
                Bitte laden Sie zuerst eine Datei hoch.
              </p>
              <Link
                href="/upload"
                className="btn-primary inline-block mt-4 text-sm px-4 py-2"
              >
                Zurück zum Upload
              </Link>
            </div>
          ) : (
            <ColumnMapper uploadId={uploadId} />
          )}
        </div>
      </main>
    </div>
  )
}

export default function ColumnMappingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-400">Wird geladen...</p>
        </div>
      }
    >
      <ColumnMappingContent />
    </Suspense>
  )
}
