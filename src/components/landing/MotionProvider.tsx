'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Lädt nur das schlanke `domAnimation`-Feature-Set von framer-motion (~25 KB
 * statt ~110 KB des vollen `motion`-Pakets). Alle Landing-Komponenten nutzen
 * deshalb `m.*` statt `motion.*`. Spart spürbar JS beim Erstaufruf (Mobile).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
