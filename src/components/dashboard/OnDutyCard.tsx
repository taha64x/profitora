import Link from 'next/link'
import { db } from '@/lib/db'
import { isAbsent, isOnDuty, minutesToLabel, nowInBerlin } from '@/lib/shifts'

// Server-Component: „Jetzt im Dienst" aus dem Schichtplan (Berlin-Zeit).
export default async function OnDutyCard({ organizationId }: { organizationId: string }) {
  const berlin = nowInBerlin()
  const today = new Date(`${berlin.dateKey}T00:00:00.000Z`)

  const [employees, shifts, absences] = await Promise.all([
    db.employee.findMany({
      where: { organizationId, active: true },
      select: { id: true, name: true, color: true },
    }),
    db.shift.findMany({ where: { organizationId, date: today } }),
    db.absence.findMany({
      where: { organizationId, startDate: { lte: today }, endDate: { gte: today } },
    }),
  ])

  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 flex flex-col justify-center">
        <p className="text-xs font-semibold text-[#B8923A] uppercase tracking-widest mb-2">Team</p>
        <h2 className="font-semibold text-gray-900 text-sm mb-1.5">Wer arbeitet gerade?</h2>
        <p className="text-gray-500 text-xs leading-relaxed mb-3">
          Legen Sie Mitarbeiter an und planen Sie Schichten — hier sehen Sie dann live, wer im Dienst ist.
        </p>
        <Link href="/dashboard/team" className="text-xs text-[#0D1630] font-semibold hover:underline">Mitarbeiter anlegen →</Link>
      </div>
    )
  }

  const empById = new Map(employees.map((e) => [e.id, e]))
  const onDuty = shifts
    .filter((s) => isOnDuty(s, berlin) && !isAbsent(absences, s.employeeId, berlin.dateKey))
    .map((s) => ({ shift: s, employee: empById.get(s.employeeId) }))
    .filter((x): x is { shift: (typeof shifts)[number]; employee: NonNullable<ReturnType<typeof empById.get>> } => Boolean(x.employee))

  const upcoming = shifts
    .filter((s) => s.startMin > berlin.minutes && !isAbsent(absences, s.employeeId, berlin.dateKey))
    .sort((a, b) => a.startMin - b.startMin)
    .slice(0, 3)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-sm">Jetzt im Dienst</h2>
        <Link href="/dashboard/schedule" className="text-xs text-[#0D1630] hover:underline">Schichtplan →</Link>
      </div>
      {onDuty.length === 0 ? (
        <p className="text-gray-400 text-sm mb-3">Gerade niemand eingeplant.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {onDuty.map(({ shift, employee }) => (
            <div key={shift.id} className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: employee.color }}
              >
                {employee.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{employee.name}</p>
                <p className="text-[11px] text-gray-400">bis {minutesToLabel(shift.endMin)}</p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <p className="text-[11px] text-gray-400 border-t border-gray-50 pt-2.5">
          Später heute:{' '}
          {upcoming
            .map((s) => `${empById.get(s.employeeId)?.name ?? '?'} ab ${minutesToLabel(s.startMin)}`)
            .join(' · ')}
        </p>
      )}
    </div>
  )
}
