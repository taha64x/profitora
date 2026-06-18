import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  kosten: 'Kostenanalyse',
  mitarbeiter: 'Mitarbeiteranalyse',
  buchhaltung: 'Buchhaltungsanalyse',
  prozess: 'Prozessanalyse',
  branche: 'Branchenvergleich',
  komplett: 'Komplettanalyse',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-50 text-yellow-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  COMPLETED:  'bg-green-50 text-green-700',
  FAILED:     'bg-red-50 text-red-600',
  pending:    'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  completed:  'bg-green-50 text-green-700',
  failed:     'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Wartend',
  PROCESSING: 'In Bearbeitung',
  COMPLETED:  'Abgeschlossen',
  FAILED:     'Fehler',
  pending:    'Wartend',
  processing: 'In Bearbeitung',
  completed:  'Abgeschlossen',
  failed:     'Fehler',
}

export default async function AnalysesPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  const member = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  const reports = member
    ? await db.analysisReport.findMany({
        where: { organizationId: member.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    : []

  const requests = member
    ? await db.analysisRequest.findMany({
        where: { organizationId: member.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    : []

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meine Analysen</h1>
            <p className="text-gray-500 text-sm mt-0.5">Alle gestarteten und abgeschlossenen Analysen</p>
          </div>
          <Link href="/analyze" className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Neue Analyse
          </Link>
        </div>

        {/* Completed reports */}
        {reports.length > 0 && (
          <div className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Abgeschlossene Berichte</h2>
            <div className="table-card">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Datum', 'Bezeichnung', 'Branche', 'Status', 'Erstellt', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(r.createdAt).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-64 truncate">{r.title}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {(r.metadata as { businessType?: string })?.businessType ?? '–'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/report/${r.id}`} className="text-[#0D1630] hover:underline text-xs font-medium">
                          Bericht öffnen →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending requests */}
        {requests.length > 0 && (
          <div className="mb-10">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Analyseanfragen</h2>
            <div className="table-card">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Datum', 'Analysearten', 'Methode', 'Genauigkeit', 'Status', 'Ref.'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    return (
                      <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(req.analysisTypes ?? []).slice(0, 3).map((t) => (
                              <span key={t} className="text-xs bg-[#EFF1F7] text-[#0D1630] px-2 py-0.5 rounded-full">
                                {TYPE_LABELS[t] ?? t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs capitalize">{req.inputMethod ?? '–'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs capitalize">{req.accuracyLevel ?? '–'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[req.status] ?? req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{req.id.slice(0, 8)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reports.length === 0 && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="w-8 h-8">
                <path d="M9 17h6M9 13h6M9 9h3M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Analysen</h3>
            <p className="text-gray-500 text-sm text-center max-w-xs mb-6">
              Starten Sie jetzt Ihre erste KI-gestützte Unternehmensanalyse.
            </p>
            <Link href="/analyze" className="btn-primary px-6 py-2.5 text-sm">
              Erste Analyse starten
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
