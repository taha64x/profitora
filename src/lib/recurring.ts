export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly'

/** Nächster Lauf, Monatsende-sicher (31.01.+1M → 28./29.02., nie Überlauf). */
export function advanceNextRun(from: Date, interval: RecurringInterval): Date {
  const months = interval === 'yearly' ? 12 : interval === 'quarterly' ? 3 : 1
  const y = from.getUTCFullYear()
  const m = from.getUTCMonth() + months
  const targetYear = y + Math.floor(m / 12)
  const targetMonth = ((m % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const day = Math.min(from.getUTCDate(), lastDay)
  return new Date(Date.UTC(targetYear, targetMonth, day))
}
