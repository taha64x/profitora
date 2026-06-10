'use client'

interface MonthEntry {
  label: string
  revenue: number
  expenses: number
  profit: number
  revenueTarget: number | null
  expenseTarget: number | null
}

interface Props {
  months: MonthEntry[]
  mode: 'revenue' | 'expenses' | 'profit'
}

function formatEur(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k €`
  return `${Math.round(n)} €`
}

export default function MonthlyBarChart({ months, mode }: Props) {
  const getValue = (m: MonthEntry) =>
    mode === 'revenue' ? m.revenue : mode === 'expenses' ? m.expenses : m.profit

  const getTarget = (m: MonthEntry) =>
    mode === 'revenue' ? m.revenueTarget : mode === 'expenses' ? m.expenseTarget : null

  const values = months.map(getValue)
  const maxVal = Math.max(...values.map(Math.abs), 1)

  const color =
    mode === 'revenue' ? '#16a34a' :
    mode === 'expenses' ? '#dc2626' : '#2563eb'

  const bgColor =
    mode === 'revenue' ? '#dcfce7' :
    mode === 'expenses' ? '#fee2e2' : '#dbeafe'

  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {months.map((m, i) => {
        const val = getValue(m)
        const target = getTarget(m)
        const pct = Math.min((Math.abs(val) / maxVal) * 100, 100)
        const isNeg = val < 0
        const targetPct = target ? Math.min((target / maxVal) * 100, 100) : null

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
              <div className="font-semibold">{m.label}</div>
              <div style={{ color }}>{formatEur(val)}</div>
              {target && <div className="text-gray-300">Ziel: {formatEur(target)}</div>}
            </div>

            {/* Bar container */}
            <div className="w-full flex flex-col justify-end" style={{ height: '108px' }}>
              <div className="relative w-full">
                {/* Target marker */}
                {targetPct !== null && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed opacity-60"
                    style={{ bottom: `${targetPct}%`, borderColor: color }}
                  />
                )}
                {/* Bar */}
                <div
                  className="w-full rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    backgroundColor: isNeg ? '#fca5a5' : bgColor,
                    border: `1px solid ${isNeg ? '#f87171' : color}`,
                    opacity: val === 0 ? 0.3 : 1,
                  }}
                />
              </div>
            </div>

            {/* Label */}
            <span className="text-gray-400 text-[10px] leading-none mt-1 truncate w-full text-center">
              {m.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
