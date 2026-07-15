import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { isAbsent, minutesToLabel, weekDates } from '@/lib/shifts'

// Öffentlicher Read-only-Wochenplan (Mitarbeiter ohne Login, Link vom Chef).
// Bewusst ohne Auth: Token ist unguessbar (24 Byte) und jederzeit regenerierbar.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Schichtplan',
  robots: { index: false, follow: false },
}

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default async function PublicPlanPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { week?: string }
}) {
  const share = await db.planShareToken.findUnique({ where: { token: params.token } })
  if (!share || !share.active) notFound()

  const base = searchParams.week ? new Date(`${searchParams.week.slice(0, 10)}T00:00:00.000Z`) : new Date()
  const days = weekDates(Number.isNaN(base.getTime()) ? new Date() : base)
  const from = new Date(`${days[0]}T00:00:00.000Z`)
  const to = new Date(`${days[6]}T00:00:00.000Z`)
  to.setUTCDate(to.getUTCDate() + 1)

  const [org, employees, shifts, absences] = await Promise.all([
    db.organization.findUnique({ where: { id: share.organizationId }, select: { name: true } }),
    db.employee.findMany({
      where: { organizationId: share.organizationId, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true },
    }),
    db.shift.findMany({
      where: { organizationId: share.organizationId, date: { gte: from, lt: to } },
      include: { area: { select: { name: true } } },
      orderBy: { startMin: 'asc' },
    }),
    db.absence.findMany({
      where: { organizationId: share.organizationId, startDate: { lt: to }, endDate: { gte: from } },
    }),
  ])

  const prevWeek = new Date(from)
  prevWeek.setUTCDate(prevWeek.getUTCDate() - 7)
  const nextWeek = new Date(from)
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)
  const fmt = (key: string) => new Date(`${key}T00:00:00.000Z`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0E1A33]">Schichtplan · {org?.name}</h1>
            <p className="text-gray-500 text-sm">{fmt(days[0])} – {fmt(days[6])}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <a href={`?week=${prevWeek.toISOString().slice(0, 10)}`} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white">‹ Vorwoche</a>
            <a href={`?week=${nextWeek.toISOString().slice(0, 10)}`} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white">Nächste ›</a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-44">Mitarbeiter</th>
                {days.map((d, i) => (
                  <th key={d} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">
                    {DAY_LABELS[i]} <span className="text-gray-400 font-normal">{fmt(d)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Keine Mitarbeiter.</td></tr>
              ) : employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: emp.color }} />
                    {emp.name}
                  </td>
                  {days.map((d) => {
                    const absent = isAbsent(absences, emp.id, d)
                    const dayShifts = shifts.filter((s) => s.employeeId === emp.id && s.date.toISOString().slice(0, 10) === d)
                    return (
                      <td key={d} className={`px-3 py-2 align-top ${absent ? 'bg-gray-100' : ''}`}>
                        {absent ? (
                          <span className="text-[11px] text-gray-400">Abwesend</span>
                        ) : dayShifts.length === 0 ? (
                          <span className="text-gray-200">–</span>
                        ) : (
                          <div className="space-y-1">
                            {dayShifts.map((s) => (
                              <div key={s.id} className="rounded-md px-2 py-1 text-[11px] font-medium text-white" style={{ backgroundColor: emp.color }}>
                                {minutesToLabel(s.startMin)}–{minutesToLabel(s.endMin)}
                                {s.area ? <span className="opacity-75"> · {s.area.name}</span> : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Bereitgestellt mit <span className="font-semibold text-[#B8923A]">Profitora</span> · Änderungen macht die Betriebsleitung.
        </p>
      </div>
    </div>
  )
}
