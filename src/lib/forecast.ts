// Einfache, ehrliche Prognose (Premium-Feature, Spec §4/§9 Phase 4):
// ≥13 Monate Historie → saison-naiv (Vorjahresmonat × Trendfaktor),
// sonst lineare Regression. Statistische Fortschreibung, keine Garantie.

export interface MonthValue {
  month: string
  value: number
}

function linearForecast(values: number[], horizon: number): number[] {
  const n = values.length
  if (n === 0) return Array(horizon).fill(0)
  if (n === 1) return Array(horizon).fill(Math.max(0, Math.round(values[0])))
  // Kleinste Quadrate über Index → Wert
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = yMean - slope * xMean
  return Array.from({ length: horizon }, (_, k) => Math.max(0, Math.round(intercept + slope * (n + k))))
}

export function forecastSeries(history: MonthValue[], horizon = 12): number[] {
  const values = history.map((h) => h.value)
  const n = values.length
  if (n >= 13) {
    // Trendfaktor: Ø der letzten 6 Monate vs. Ø derselben 6 Monate im Vorjahr
    const recent = values.slice(-6)
    const lastYearSame = values.slice(-18, -12).length === 6 ? values.slice(-18, -12) : values.slice(0, 6)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const baseAvg = lastYearSame.reduce((a, b) => a + b, 0) / lastYearSame.length
    const factor = baseAvg > 0 ? recentAvg / baseAvg : 1
    return Array.from({ length: horizon }, (_, k) => {
      // Vorjahreswert des Prognosemonats: 12 Monate zurück ab Prognoseposition
      const idx = n + k - 12
      const base = idx >= 0 && idx < n ? values[idx] : values[n - 1]
      return Math.max(0, Math.round(base * factor))
    })
  }
  return linearForecast(values, horizon)
}
