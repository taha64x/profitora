import { describe, it, expect } from 'vitest'
import {
  BUSINESS_BENCHMARKS,
  rateMetric,
  computeFinanceKpis,
  classifyCategory,
} from '@/lib/benchmarks'

describe('BUSINESS_BENCHMARKS', () => {
  it('deckt alle 10 businessTypes ab, jeder mit laborCostRatio + netMarginPercent', () => {
    const types = ['hotel','restaurant','cafe_bakery','retail','medical','craft','fitness','beauty','consulting','other']
    for (const t of types) {
      expect(BUSINESS_BENCHMARKS[t]?.laborCostRatio).toBeDefined()
      expect(BUSINESS_BENCHMARKS[t]?.netMarginPercent).toBeDefined()
    }
    expect(BUSINESS_BENCHMARKS.hotel.laborCostRatio).toEqual({ target: 28, warning: 30, critical: 35 })
    expect(BUSINESS_BENCHMARKS.retail.goodsCostRatio).toEqual({ target: 60, warning: 68, critical: 75 })
  })
})

describe('rateMetric', () => {
  const lower = { target: 28, warning: 30, critical: 35 }  // Kostenquote: niedriger besser
  const higher = { target: 10, warning: 5, critical: 0 }   // Marge: höher besser
  it('lower-better: <=target grün, <=warning gelb, sonst rot', () => {
    expect(rateMetric(27, lower)).toBe('green')
    expect(rateMetric(29.5, lower)).toBe('yellow')
    expect(rateMetric(31, lower)).toBe('red')
  })
  it('higher-better (target>warning): >=target grün, >=warning gelb, sonst rot', () => {
    expect(rateMetric(12, higher)).toBe('green')
    expect(rateMetric(6, higher)).toBe('yellow')
    expect(rateMetric(2, higher)).toBe('red')
  })
})

describe('classifyCategory', () => {
  it('erkennt Personal/Waren/Energie per Keyword', () => {
    expect(classifyCategory('Personal')).toBe('labor')
    expect(classifyCategory('Löhne & Gehälter')).toBe('labor')
    expect(classifyCategory('Einkauf')).toBe('goods')
    expect(classifyCategory('Lebensmittel Metro')).toBe('goods')
    expect(classifyCategory('Energie')).toBe('energy')
    expect(classifyCategory('Marketing')).toBe('other')
  })
})

describe('computeFinanceKpis', () => {
  it('berechnet Quoten aus Kategorien-Summen', () => {
    const kpis = computeFinanceKpis({
      revenueTotal: 10000,
      expenseTotal: 9000,
      expensesByCategory: { Personal: 3000, Einkauf: 2500, Energie: 500, Miete: 3000 },
    })
    expect(kpis.laborCostRatio).toBeCloseTo(30)
    expect(kpis.goodsCostRatio).toBeCloseTo(25)
    expect(kpis.netMarginPercent).toBeCloseTo(10)
  })
  it('ohne Umsatz → null-Quoten', () => {
    const kpis = computeFinanceKpis({ revenueTotal: 0, expenseTotal: 100, expensesByCategory: {} })
    expect(kpis.laborCostRatio).toBeNull()
    expect(kpis.netMarginPercent).toBeNull()
  })
})
