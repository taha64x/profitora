import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-50 text-yellow-700 border-yellow-100',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED:  'bg-green-50 text-green-700 border-green-100',
  FAILED:     'bg-red-50 text-red-600 border-red-100',
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-100',
  processing: 'bg-blue-50 text-blue-700 border-blue-100',
  completed:  'bg-green-50 text-green-700 border-green-100',
  failed:     'bg-red-50 text-red-600 border-red-100',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Wartend', PROCESSING: 'In Bearbeitung', COMPLETED: 'Abgeschlossen', FAILED: 'Fehler',
  pending: 'Wartend', processing: 'In Bearbeitung', completed: 'Abgeschlossen', failed: 'Fehler',
}

function ReportCard({ report }: { report: { id: string; title: string; status: string; createdAt: Date; metadata: unknown } }) {
  const meta = report.metadata as { businessType?: string; analysisTypes?: string[] } | null
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0D1630] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[report.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {STATUS_LABELS[report.status] ?? report.status}
          </span>
        </div>
        <span className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString('de-DE')}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2">{report.title}</h3>
      {meta?.businessType && (
        <p className="text-xs text-gray-500 mb-3">Branche: {meta.businessType}</p>
      )}
      {meta?.analysisTypes && meta.analysisTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {meta.analysisTypes.slice(0, 3).map((t) => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{t}</span>
          ))}
        </div>
      )}
      <Link
        href={`/report/${report.id}`}
        className={`block w-full text-center text-xs font-semibold py-2.5 rounded-lg transition-colors ${report.status === 'COMPLETED' ? 'bg-[#0D1630] text-white hover:bg-[#152040]' : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'}`}
      >
        {report.status === 'COMPLETED' ? 'Bericht öffnen →' : 'Wird verarbeitet…'}
      </Link>
    </div>
  )
}

export default async function ReportsPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  const member = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  const reports = member
    ? await db.analysisReport.findMany({
        where: { organizationId: member.organizationId },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const completed = reports.filter((r) => r.status === 'COMPLETED')
  const inProgress = reports.filter((r) => r.status === 'PENDING' || r.status === 'PROCESSING')
  const failed = reports.filter((r) => r.status === 'FAILED')

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Berichte</h1>
            <p className="text-gray-500 text-sm mt-0.5">Alle abgeschlossenen Analyseberichte auf einen Blick</p>
          </div>
          <Link href="/analyze" className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Neue Analyse
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Berichte gesamt', value: reports.length },
            { label: 'Abgeschlossen', value: completed.length },
            { label: 'In Bearbeitung', value: inProgress.length },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="w-7 h-7">
                <path d="M9 12h6M9 16h6M9 8h3M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Berichte vorhanden</h3>
            <p className="text-gray-500 text-sm text-center max-w-xs mb-6">
              Starten Sie eine Analyse, um Ihren ersten KI-Bericht zu erhalten.
            </p>
            <Link href="/analyze" className="btn-primary px-6 py-2.5 text-sm">
              Analyse starten
            </Link>
          </div>
        ) : (
          <>
            {inProgress.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">In Bearbeitung</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgress.map((r) => <ReportCard key={r.id} report={r}/>)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Abgeschlossene Berichte</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map((r) => <ReportCard key={r.id} report={r}/>)}
                </div>
              </div>
            )}
            {failed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Fehlgeschlagen</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {failed.map((r) => <ReportCard key={r.id} report={r}/>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
