'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

interface ForecastData {
  months: string[]
  forecastMonths: string[]
  revenue: number[]
  expenses: number[]
  revenueForecast: number[]
  expensesForecast: number[]
}

function eur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function label(key: string) {
  const [y, m] = key.split('-')
  return `${m}/${y.slice(2)}`
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/forecast')
      .then((r) => r.json())
      .then((d) => d?.success && setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chart = useMemo(() => {
    if (!data) return []
    const rows = data.months.map((m, i) => ({
      month: label(m),
      einnahmen: data.revenue[i],
      ausgaben: data.expenses[i],
      einnahmenPrognose: null as number | null,
      ausgabenPrognose: null as number | null,
    }))
    // Anschlusspunkt, damit die gestrichelte Linie an der Ist-Linie andockt
    if (rows.length > 0) {
      rows[rows.length - 1].einnahmenPrognose = data.revenue[data.revenue.length - 1]
      rows[rows.length - 1].ausgabenPrognose = data.expenses[data.expenses.length - 1]
    }
    for (let i = 0; i < data.forecastMonths.length; i++) {
      rows.push({
        month: label(data.forecastMonths[i]),
        einnahmen: null as unknown as number,
        ausgaben: null as unknown as number,
        einnahmenPrognose: data.revenueForecast[i],
        ausgabenPrognose: data.expensesForecast[i],
      })
    }
    return rows
  }, [data])

  const next12Revenue = data?.revenueForecast.reduce((a, b) => a + b, 0) ?? 0
  const next12Expenses = data?.expensesForecast.reduce((a, b) => a + b, 0) ?? 0
  const next12Profit = next12Revenue - next12Expenses

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forecast</h1>
            <p className="text-gray-500 text-sm mt-0.5">12-Monats-Prognose aus Ihren Ist-Daten (Trend + Saisonalität)</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Lädt…</div>
        ) : !data || data.months.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-gray-500 text-sm">Noch keine Finanzdaten — tragen Sie Einnahmen und Ausgaben ein, dann entsteht hier Ihre Prognose.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Erwartete Einnahmen (12 M)', value: eur(next12Revenue), color: 'text-green-600' },
                { label: 'Erwartete Ausgaben (12 M)', value: eur(next12Expenses), color: 'text-red-600' },
                { label: 'Erwartetes Ergebnis (12 M)', value: eur(next12Profit), color: next12Profit >= 0 ? 'text-green-600' : 'text-red-600' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-5">Ist & Prognose</h2>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => (v == null ? '–' : eur(Number(v)))} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="einnahmen" name="Einnahmen (Ist)" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="ausgaben" name="Ausgaben (Ist)" stroke="#0D1630" fill="#e5e9f2" strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="einnahmenPrognose" name="Einnahmen (Prognose)" stroke="#16a34a" strokeDasharray="6 4" fill="none" strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="ausgabenPrognose" name="Ausgaben (Prognose)" stroke="#0D1630" strokeDasharray="6 4" fill="none" strokeWidth={2} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-gray-400 mt-3">
                Statistische Fortschreibung Ihrer Ist-Daten (bei ≥ 13 Monaten Historie saisonbereinigt) — Entscheidungshilfe, keine Garantie.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
