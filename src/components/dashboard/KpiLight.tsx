import type { Benchmark, TrafficLight } from '@/lib/benchmarks'
import { rateMetric } from '@/lib/benchmarks'

const COLORS: Record<TrafficLight, { dot: string; bg: string; text: string }> = {
  green: { dot: 'bg-green-500', bg: 'bg-green-50 border-green-100', text: 'text-green-700' },
  yellow: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
  red: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-100', text: 'text-red-700' },
}

interface Props {
  label: string
  value: number | null
  unit?: string
  benchmark: Benchmark
}

export default function KpiLight({ label, value, unit = '%', benchmark }: Props) {
  if (value === null) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-gray-400">Noch keine Daten</p>
      </div>
    )
  }
  const light = rateMetric(value, benchmark)
  const c = COLORS[light]
  const lowerIsBetter = benchmark.target <= benchmark.warning
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${c.text}`}>
        {value.toLocaleString('de-DE')} {unit}
      </p>
      <p className="text-[11px] text-gray-400 mt-0.5">
        Branchen-Richtwert: {lowerIsBetter ? '≤' : '≥'} {benchmark.target.toLocaleString('de-DE')} {unit}
      </p>
    </div>
  )
}
