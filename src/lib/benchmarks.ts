// TS-Port der Branchen-Benchmarks aus python/business_kpis.py (Quelle der Wahrheit
// für die Analyse bleibt Python; dieser Port treibt Cockpit-Ampeln + Alerts).
export interface Benchmark {
  target: number
  warning: number
  critical: number
}

export type TrafficLight = 'green' | 'yellow' | 'red'
export type MetricKey = 'laborCostRatio' | 'goodsCostRatio' | 'netMarginPercent'

export const METRIC_LABELS: Record<MetricKey, string> = {
  laborCostRatio: 'Personalkostenquote',
  goodsCostRatio: 'Wareneinsatzquote',
  netMarginPercent: 'Nettomarge',
}

// Nur die 3 Metriken, die sich ehrlich aus dem Finanztracking berechnen lassen.
// (utilization/energyPerUnit brauchen Belegungsdaten → nur in der Voll-Analyse.)
export const BUSINESS_BENCHMARKS: Record<string, Partial<Record<MetricKey, Benchmark>>> = {
  hotel:       { laborCostRatio: { target: 28, warning: 30, critical: 35 },                                                                          netMarginPercent: { target: 10, warning: 5, critical: 0 } },
  restaurant:  { laborCostRatio: { target: 32, warning: 40, critical: 45 }, goodsCostRatio: { target: 30, warning: 35, critical: 38 }, netMarginPercent: { target: 8, warning: 4, critical: 1 } },
  cafe_bakery: { laborCostRatio: { target: 38, warning: 44, critical: 50 }, goodsCostRatio: { target: 30, warning: 35, critical: 40 }, netMarginPercent: { target: 10, warning: 5, critical: 2 } },
  retail:      { laborCostRatio: { target: 14, warning: 18, critical: 22 }, goodsCostRatio: { target: 60, warning: 68, critical: 75 }, netMarginPercent: { target: 5, warning: 2, critical: 0 } },
  medical:     { laborCostRatio: { target: 25, warning: 30, critical: 35 },                                                                          netMarginPercent: { target: 20, warning: 12, critical: 5 } },
  craft:       { laborCostRatio: { target: 35, warning: 42, critical: 48 }, goodsCostRatio: { target: 30, warning: 38, critical: 45 }, netMarginPercent: { target: 10, warning: 5, critical: 2 } },
  fitness:     { laborCostRatio: { target: 30, warning: 38, critical: 45 },                                                                          netMarginPercent: { target: 20, warning: 10, critical: 3 } },
  beauty:      { laborCostRatio: { target: 35, warning: 42, critical: 50 }, goodsCostRatio: { target: 12, warning: 18, critical: 22 }, netMarginPercent: { target: 15, warning: 8, critical: 2 } },
  consulting:  { laborCostRatio: { target: 45, warning: 55, critical: 65 },                                                                          netMarginPercent: { target: 20, warning: 12, critical: 5 } },
  other:       { laborCostRatio: { target: 30, warning: 40, critical: 50 },                                                                          netMarginPercent: { target: 8, warning: 3, critical: 0 } },
}

/**
 * Ampel: Richtung steckt in den Zahlen — target<warning = Kostenquote
 * (niedriger besser), target>warning = Marge (höher besser). Gleiches
 * Schema wie python/business_kpis.py.
 */
export function rateMetric(value: number, b: Benchmark): TrafficLight {
  const lowerIsBetter = b.target <= b.warning
  if (lowerIsBetter) {
    if (value <= b.target) return 'green'
    if (value <= b.warning) return 'yellow'
    return 'red'
  }
  if (value >= b.target) return 'green'
  if (value >= b.warning) return 'yellow'
  return 'red'
}

// Keyword-Listen aus python/business_kpis.py (Zeilen 73–79)
const LABOR_KEYWORDS = ['personal', 'lohn', 'löhne', 'gehalt', 'gehälter', 'mitarbeiter', 'labor', 'personalkosten']
const GOODS_KEYWORDS = ['waren', 'material', 'rohstoff', 'lebensmittel', 'zutaten', 'einkauf', 'wareneinsatz', 'food', 'getränke', 'beverage']
const ENERGY_KEYWORDS = ['energie', 'strom', 'gas', 'wasser', 'energy', 'heizung']

export type CategoryClass = 'labor' | 'goods' | 'energy' | 'other'

export function classifyCategory(category: string): CategoryClass {
  const c = category.toLowerCase()
  if (LABOR_KEYWORDS.some((k) => c.includes(k))) return 'labor'
  if (GOODS_KEYWORDS.some((k) => c.includes(k))) return 'goods'
  if (ENERGY_KEYWORDS.some((k) => c.includes(k))) return 'energy'
  return 'other'
}

export interface FinanceKpis {
  laborCostRatio: number | null
  goodsCostRatio: number | null
  netMarginPercent: number | null
  laborCost: number
  goodsCost: number
}

/** Quoten aus aggregierten Monats-Summen (Kategorie → Summe) */
export function computeFinanceKpis(input: {
  revenueTotal: number
  expenseTotal: number
  expensesByCategory: Record<string, number>
}): FinanceKpis {
  let laborCost = 0
  let goodsCost = 0
  for (const [cat, sum] of Object.entries(input.expensesByCategory)) {
    const cls = classifyCategory(cat)
    if (cls === 'labor') laborCost += sum
    else if (cls === 'goods') goodsCost += sum
  }
  const rev = input.revenueTotal
  return {
    laborCost: Math.round(laborCost * 100) / 100,
    goodsCost: Math.round(goodsCost * 100) / 100,
    laborCostRatio: rev > 0 ? Math.round((laborCost / rev) * 1000) / 10 : null,
    goodsCostRatio: rev > 0 ? Math.round((goodsCost / rev) * 1000) / 10 : null,
    netMarginPercent: rev > 0 ? Math.round(((rev - input.expenseTotal) / rev) * 1000) / 10 : null,
  }
}

/** Benchmarks für einen businessType (Fallback: other) */
export function benchmarksFor(businessType: string | null | undefined): Partial<Record<MetricKey, Benchmark>> {
  return BUSINESS_BENCHMARKS[businessType ?? 'other'] ?? BUSINESS_BENCHMARKS.other
}
