'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

interface MonthRow {
  key: string
  label: string
  revenue: number
  expenses: number
  profit: number
}

export default function TrendSparkline() {
  const [months, setMonths] = useState<MonthRow[] | null>(null)

  useEffect(() => {
    fetch('/api/monthly-summary')
      .then((r) => r.json())
      .then((d) => setMonths(d?.months ?? []))
      .catch(() => setMonths([]))
  }, [])

  if (months === null) return <div className="h-36 rounded-xl bg-gray-50 animate-pulse" />
  if (months.length === 0) return null

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={months} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E1A33" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0E1A33" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} />
          <Tooltip
            formatter={(v, name) => [
              `${Number(v ?? 0).toLocaleString('de-DE')} €`,
              name === 'revenue' ? 'Einnahmen' : name === 'expenses' ? 'Ausgaben' : 'Ergebnis',
            ]}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#0E1A33" strokeWidth={2} fill="url(#revGrad)" />
          <Area type="monotone" dataKey="expenses" stroke="#C9A84C" strokeWidth={1.5} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
