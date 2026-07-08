import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CAT_LABELS: Record<string, string> = {
  EMPLOYEE_HOURS: 'Mitarbeiterzeiten',
  REVENUE:        'Einnahmen',
  EXPENSES:       'Ausgaben',
  BOOKINGS:       'Buchungen / Verkäufe',
  ROOM_CATEGORIES:'Kategorien / Preisliste',
  OTHER:          'Sonstiges',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileIcon({ type }: { type: string }) {
  const ext = (type ?? '').toLowerCase()
  if (ext.includes('csv') || ext.includes('sheet')) return (
    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
      <span className="text-green-700 font-bold text-xs">CSV</span>
    </div>
  )
  if (ext.includes('pdf')) return (
    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
      <span className="text-red-600 font-bold text-xs">PDF</span>
    </div>
  )
  if (ext.includes('xls') || ext.includes('excel')) return (
    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
      <span className="text-emerald-700 font-bold text-xs">XLS</span>
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
      <svg viewBox="0 0 20 20" fill="#9ca3af" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
    </div>
  )
}

export default async function FilesPage() {
  const user = getCurrentUser()
  if (!user) redirect('/login')

  const member = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  const uploads = member
    ? await db.upload.findMany({
        where: { organizationId: member.organizationId },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const totalSize = uploads.reduce((s, u) => s + (u.fileSize ?? 0), 0)

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dateien</h1>
            <p className="text-gray-500 text-sm mt-0.5">Hochgeladene Dokumente und Datenexporte</p>
          </div>
          <Link href="/dashboard/new-analysis" className="flex items-center gap-2 bg-[#0D1630] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#152040] transition-colors">
            + Datei hochladen
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Hochgeladene Dateien', value: String(uploads.length) },
            { label: 'Gesamtgröße', value: formatBytes(totalSize) },
            { label: 'Letzte Aktivität', value: uploads[0] ? new Date(uploads[0].createdAt).toLocaleDateString('de-DE') : '–' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="w-7 h-7">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Dateien</h3>
            <p className="text-gray-500 text-sm mb-5 text-center max-w-xs">
              Laden Sie CSV-, Excel- oder PDF-Dateien hoch, um eine Analyse zu starten.
            </p>
            <Link href="/dashboard/new-analysis" className="btn-primary text-sm px-5 py-2.5">
              Erste Datei hochladen
            </Link>
          </div>
        ) : (
          <div className="table-card">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['', 'Dateiname', 'Kategorie', 'Größe', 'Hochgeladen', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <FileIcon type={u.mimeType ?? ''}/>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-64 truncate">{u.originalName ?? u.filename}</p>
                      <p className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {CAT_LABELS[u.category ?? ''] ?? u.category ?? '–'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {u.fileSize ? formatBytes(u.fileSize) : '–'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('de-DE')}, {new Date(u.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/api/upload/download?id=${u.id}`} className="text-[#0D1630] text-xs hover:underline font-medium">
                        Download
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Datenschutzhinweis:</strong> Hochgeladene Dateien werden ausschließlich für die betriebswirtschaftliche Analyse verwendet und gemäß Art. 6 Abs. 1 lit. f DSGVO verarbeitet. Sie können Ihre Dateien jederzeit löschen. Kein Ersatz für Steuerberater, Rechtsanwalt oder Wirtschaftsprüfer.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
