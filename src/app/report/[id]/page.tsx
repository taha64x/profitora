import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PdfDownloadButton from '@/components/report/PdfDownloadButton'
import { IconXCircle } from '@/components/ui/icons'

interface PageProps {
  params: { id: string }
}

export default async function ReportPage({ params }: PageProps) {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  const report = await db.analysisReport.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      createdBy: { select: { email: true, name: true } },
    },
  })

  if (!report) notFound()

  // Zugriffskontrolle
  const member = await db.organizationMember.findFirst({
    where: { userId: user.userId, organizationId: report.organizationId },
  })
  if (!member) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-hotel-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/60 hover:text-white text-sm">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-1">
            <span className="font-bold text-hotel-gold">Profitora</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              report.status === 'COMPLETED'
                ? 'bg-green-900/50 text-green-300'
                : report.status === 'FAILED'
                ? 'bg-red-900/50 text-red-300'
                : 'bg-yellow-900/50 text-yellow-300'
            }`}
          >
            {report.status === 'COMPLETED'
              ? 'Abgeschlossen'
              : report.status === 'FAILED'
              ? 'Fehler'
              : 'In Bearbeitung...'}
          </span>
          {report.status === 'COMPLETED' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="text-sm border border-white/30 text-white/80 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Drucken
              </button>
              <PdfDownloadButton reportId={report.id} />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {report.organization.name} ·{' '}
            {new Date(report.createdAt).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {report.status === 'PENDING' || report.status === 'PROCESSING' ? (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyse läuft...</h2>
            <p className="text-gray-500 text-sm">
              Die KI analysiert Ihre Daten. Das dauert in der Regel 30–60 Sekunden.
              Diese Seite lädt sich automatisch neu.
            </p>
          </div>
        ) : report.status === 'FAILED' ? (
          <div className="card p-12 text-center">
            <div className="flex justify-center mb-4 text-red-400">
              <IconXCircle className="w-14 h-14" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyse fehlgeschlagen</h2>
            <p className="text-gray-500 text-sm mb-6">
              Bei der Analyse ist ein Fehler aufgetreten. Bitte überprüfen Sie Ihre hochgeladenen
              Dateien und versuchen Sie es erneut.
            </p>
            <Link href="/upload" className="btn-primary">
              Zurück zum Upload
            </Link>
          </div>
        ) : (
          <div>
            {/* Disclaimer oben */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800">
              <strong>Hinweis:</strong> Diese KI-gestützte Analyse ersetzt keine Steuerberatung,
              Rechtsberatung oder gesetzliche Wirtschaftsprüfung. Alle Ergebnisse sind
              betriebswirtschaftliche Entscheidungshilfen.
            </div>

            {/* KI-generierter Bericht */}
            <div
              className="card p-8 prose prose-sm max-w-none report-content"
              dangerouslySetInnerHTML={{ __html: report.htmlContent || '' }}
            />
          </div>
        )}
      </div>

      {/* Auto-refresh für laufende Analysen */}
      {(report.status === 'PENDING' || report.status === 'PROCESSING') && (
        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(() => window.location.reload(), 5000)`,
          }}
        />
      )}
    </div>
  )
}
