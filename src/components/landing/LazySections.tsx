'use client'

import dynamic from 'next/dynamic'

/**
 * Schwere, rein dekorative Scroll-/Animations-Sektionen erst beim Scrollen laden
 * (ssr:false → eigener Chunk, nicht im initialen Bundle). Das senkt die JS-Last
 * beim Erstaufruf deutlich – wichtig auf Mobilgeräten. Die Platzhalter halten die
 * Höhe vor, damit es beim Nachladen keinen Layout-Sprung gibt.
 *
 * Hinweis: ssr:false ist in Server Components nicht erlaubt – deshalb dieses
 * 'use client'-Modul als Grenze.
 */
const ph = (cls: string) => () => <div className={cls} aria-hidden="true" />

export const ProfitChartLazy = dynamic(() => import('./ProfitChartSection'), {
  ssr: false,
  loading: ph('min-h-[600px]'),
})

export const ZoomStoryLazy = dynamic(() => import('./ZoomStorySection'), {
  ssr: false,
  loading: ph('min-h-[90vh]'),
})

export const FinanceFlowLazy = dynamic(() => import('./FinanceFlowSection'), {
  ssr: false,
  loading: ph('min-h-[600px]'),
})

export const DashboardPreviewLazy = dynamic(() => import('./DashboardPreviewSection'), {
  ssr: false,
  loading: ph('min-h-[600px]'),
})
