// Reine Schichtplan-Logik (Phase 3). Zeiten als Minuten seit 0:00 (0–1440).
// „Jetzt" rechnet in Europe/Berlin — der Server läuft in UTC.

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function labelToMinutes(label: string): number | null {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const minutes = Number(m[1]) * 60 + Number(m[2])
  return minutes >= 0 && minutes < 1440 && Number(m[2]) < 60 ? minutes : null
}

/** Überlappung zweier Zeitfenster; reines Berühren (Ende = Start) zählt nicht. */
export function shiftsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

function dateKeyUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Mo–So der Woche, in der `date` liegt — als UTC-Datumskeys (YYYY-MM-DD). */
export function weekDates(date: Date): string[] {
  const day = date.getUTCDay() // 0 = So
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + mondayOffset))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    return dateKeyUtc(d)
  })
}

export interface AbsenceLike {
  employeeId: string
  startDate: Date
  endDate: Date
}

/** Abwesend an einem Tag (Grenzen inklusive, Datumsvergleich per UTC-Key). */
export function isAbsent(absences: AbsenceLike[], employeeId: string, dateKey: string): boolean {
  return absences.some(
    (a) =>
      a.employeeId === employeeId &&
      dateKeyUtc(a.startDate) <= dateKey &&
      dateKey <= dateKeyUtc(a.endDate),
  )
}

export interface BerlinNow {
  dateKey: string
  minutes: number
}

/** Aktuelles Datum + Minuten seit Mitternacht in Europe/Berlin. */
export function nowInBerlin(now: Date = new Date()): BerlinNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  const hour = Number(get('hour')) % 24 // Intl liefert für Mitternacht teils "24"
  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + Number(get('minute')),
  }
}

export interface ShiftLike {
  date: Date
  startMin: number
  endMin: number
}

/** Gerade im Dienst? Schicht-Tag (UTC-Key) muss dem Berlin-Tag entsprechen. */
export function isOnDuty(shift: ShiftLike, berlinNow: BerlinNow): boolean {
  if (dateKeyUtc(shift.date) !== berlinNow.dateKey) return false
  return berlinNow.minutes >= shift.startMin && berlinNow.minutes < shift.endMin
}

/** Geplante Lohnkosten in Cent — nur Stundenlöhner (Gehälter sind Fixkosten). */
export function plannedWageCents(
  shifts: { employeeId: string; startMin: number; endMin: number }[],
  employees: Map<string, { hourlyWageCents: number | null }>,
): number {
  let total = 0
  for (const s of shifts) {
    const wage = employees.get(s.employeeId)?.hourlyWageCents
    if (!wage) continue
    total += ((s.endMin - s.startMin) / 60) * wage
  }
  return Math.round(total)
}
