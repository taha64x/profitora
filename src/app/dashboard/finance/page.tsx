'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'

const COST_COLORS = ['#0D1630','#1a2744','#2d4272','#3d5a9f','#5b7bc7','#7e9bd4','#adbee6','#c9d5f0','#1e3a5f','#4a6fa5']
const REV_COLORS  = ['#166534','#15803d','#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0','#dcfce7','#065f46','#047857']

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface EntryLite {
  category: string
  amount: number
  area?: { name: string } | null
}

export default function FinancePage() {
  const [expData, setExpData] = useState<{ category: string; amount: number }[]>([])
  const [revData, setRevData] = useState<{ category: string; amount: number }[]>([])
  const [areaData, setAreaData] = useState<{ area: string; einnahmen: number; ausgaben: number }[]>([])
  const [trendData, setTrendData] = useState<{ month: string; einnahmen: number; ausgaben: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [eRes, rRes] = await Promise.all([
        fetch(`/api/expenses?month=${filterMonth}`),
        fetch(`/api/revenues?month=${filterMonth}`),
      ])
      const [eJson, rJson] = await Promise.all([eRes.json(), rRes.json()])

      const areaMap: Record<string, { einnahmen: number; ausgaben: number }> = {}
      if (eJson.success) {
        const catMap: Record<string, number> = {}
        eJson.data.forEach((e: EntryLite) => {
          catMap[e.category] = (catMap[e.category] || 0) + e.amount
          const a = e.area?.name ?? 'Ohne Bereich'
          areaMap[a] = areaMap[a] ?? { einnahmen: 0, ausgaben: 0 }
          areaMap[a].ausgaben += e.amount
        })
        setExpData(Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount))
      }
      if (rJson.success) {
        const catMap: Record<string, number> = {}
        rJson.data.forEach((r: EntryLite) => {
          catMap[r.category] = (catMap[r.category] || 0) + r.amount
          const a = r.area?.name ?? 'Ohne Bereich'
          areaMap[a] = areaMap[a] ?? { einnahmen: 0, ausgaben: 0 }
          areaMap[a].einnahmen += r.amount
        })
        setRevData(Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount))
      }
      setAreaData(
        Object.entries(areaMap)
          .map(([area, v]) => ({ area, ...v }))
          .sort((a, b) => b.einnahmen + b.ausgaben - (a.einnahmen + a.ausgaben)),
      )
      setLoading(false)
    }
    load()
  }, [filterMonth])

  // Echte 12-Monats-Daten (letzte 6 anzeigen) statt des früheren Mock-Trends
  useEffect(() => {
    fetch('/api/monthly-summary')
      .then((r) => r.json())
      .then((d) => {
        const months = Array.isArray(d?.months) ? d.months : []
        setTrendData(
          months.slice(-6).map((m: { label: string; revenue: number; expenses: number }) => ({
            month: m.label,
            einnahmen: m.revenue,
            ausgaben: m.expenses,
          })),
        )
      })
      .catch(() => setTrendData([]))
  }, [])

  const handleExport = async () => {
    const year = Number(filterMonth.slice(0, 4)) || new Date().getFullYear()
    const res = await fetch(`/api/finance/export?year=${year}`)
    if (res.status === 403) {
      toast.error('Der Steuerberater-Export ist Teil des Business-Abos.')
      return
    }
    if (!res.ok) {
      toast.error('Export fehlgeschlagen.')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profitora-export-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalExp = expData.reduce((s, e) => s + e.amount, 0)
  const totalRev = revData.reduce((s, r) => s + r.amount, 0)
  const profit = totalRev - totalExp
  const margin = totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : '0.0'

  const HINTS = [
    totalExp > totalRev && { type: 'red', text: 'Ausgaben übersteigen Einnahmen diesen Monat. Eine Kostenanalyse könnte helfen.' },
    totalExp > 0 && expData[0] && expData[0].amount / totalExp > 0.4 && {
      type: 'yellow', text: `„${expData[0].category}" macht ${Math.round((expData[0].amount / totalExp) * 100)} % Ihrer Gesamtausgaben aus.`
    },
    totalRev > 0 && Number(margin) < 10 && { type: 'red', text: `Gewinnmarge von ${margin} % ist niedrig. Prüfen Sie Kostenbereiche.` },
    totalRev > 0 && Number(margin) > 20 && { type: 'green', text: `Gewinnmarge von ${margin} % liegt über dem Durchschnitt.` },
    { type: 'blue', text: 'Starten Sie eine KI-Analyse auf Basis dieser Daten für tiefere Einblicke.' },
  ].filter(Boolean) as { type: string; text: string }[]

  const hintColors: Record<string, string> = { red: 'bg-red-50 border-red-100 text-red-800', yellow: 'bg-amber-50 border-amber-100 text-amber-800', green: 'bg-green-50 border-green-100 text-green-800', blue: 'bg-blue-50 border-blue-100 text-blue-800' }
  const hintDots: Record<string, string> = { red: 'bg-red-500', yellow: 'bg-amber-500', green: 'bg-green-500', blue: 'bg-blue-500' }

  return (
    <DashboardLayout>
      <div className="dash-page">
        <div className="dash-head">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finanzübersicht</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kostenfluss, Einnahmestruktur und Gewinnentwicklung</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:border-gray-400 transition-colors">
              Steuerberater-Export (CSV)
            </button>
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input w-40 text-sm"/>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Einnahmen', value: formatEur(totalRev), color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Ausgaben', value: formatEur(totalExp), color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Gewinn', value: formatEur(profit), color: profit >= 0 ? 'text-green-600' : 'text-red-600', bg: profit >= 0 ? 'bg-green-50' : 'bg-red-50' },
            { label: 'Gewinnmarge', value: `${margin} %`, color: Number(margin) > 10 ? 'text-green-600' : 'text-red-600', bg: Number(margin) > 10 ? 'bg-green-50' : 'bg-red-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-5 shadow-sm`}>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-5">Entwicklung (letzte 6 Monate)</h2>
            {trendData.length === 0 ? <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Lädt…</div> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }}/>
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v: unknown) => formatEur(Number(v))} labelStyle={{ color: '#374151' }}/>
                  <Area type="monotone" dataKey="einnahmen" stackId="1" stroke="#16a34a" fill="#dcfce7" name="Einnahmen"/>
                  <Area type="monotone" dataKey="ausgaben" stackId="2" stroke="#dc2626" fill="#fee2e2" name="Ausgaben"/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cost donut */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-5">Kostenstruktur</h2>
            {loading ? <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Lädt…</div> : expData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Noch keine Kosten eingetragen.</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={expData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="amount" paddingAngle={2}>
                      {expData.map((_, i) => <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatEur(Number(v))}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {expData.slice(0, 5).map((e, i) => (
                    <div key={e.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COST_COLORS[i % COST_COLORS.length] }}/>
                        <span className="text-xs text-gray-600 truncate max-w-20">{e.category}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{Math.round((e.amount / totalExp) * 100)} %</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bereichs-Vergleich */}
        {areaData.length > 0 && (areaData.length > 1 || areaData[0].area !== 'Ohne Bereich') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-900 text-sm mb-5">Nach Bereich</h2>
            <ResponsiveContainer width="100%" height={Math.max(160, areaData.length * 44)}>
              <BarChart data={areaData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`}/>
                <YAxis type="category" dataKey="area" tick={{ fontSize: 11, fill: '#6b7280' }} width={110}/>
                <Tooltip formatter={(v: unknown) => formatEur(Number(v))}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Bar dataKey="einnahmen" name="Einnahmen" fill="#16a34a" radius={[0, 4, 4, 0]}/>
                <Bar dataKey="ausgaben" name="Ausgaben" fill="#0D1630" radius={[0, 4, 4, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue bar + Cost bar */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-5">Einnahmen nach Quelle</h2>
            {revData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Noch keine Einnahmen eingetragen.</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`}/>
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={90}/>
                  <Tooltip formatter={(v: unknown) => formatEur(Number(v))}/>
                  <Bar dataKey="amount" name="Einnahmen" radius={[0, 4, 4, 0]}>
                    {revData.map((_, i) => <Cell key={i} fill={REV_COLORS[i % REV_COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* KI-Hinweise */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-au-gold"/>
              <h2 className="font-semibold text-gray-900 text-sm">KI-Hinweise</h2>
            </div>
            <div className="space-y-2.5">
              {HINTS.slice(0, 4).map((h, i) => (
                <div key={i} className={`flex gap-2.5 p-3 rounded-lg border ${hintColors[h.type]}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${hintDots[h.type]}`}/>
                  <p className="text-xs leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
