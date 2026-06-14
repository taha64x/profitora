'use client'

import { m, useInView, useReducedMotion } from 'framer-motion'
import { useRef, useState, useEffect, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  variant?: 'default' | 'left' | 'scale'
  delay?: 0 | 1 | 2 | 3 | 4 | 5
  threshold?: number
}

const DELAY_MAP: Record<number, number> = { 0: 0, 1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4, 5: 0.5 }

export default function ScrollReveal({ children, className = '', variant = 'default', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Erst NACH dem Mounten animieren. Dadurch ist der server-gerenderte Inhalt
  // immer sofort sichtbar – auch wenn JS langsam lädt oder (z.B. auf wackligem
  // Mobilfunk) ein Script-Chunk gar nicht ankommt. Die Reveal-Animation ist
  // reine Progressive Enhancement und kann den Inhalt nie dauerhaft verstecken.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const inView = useInView(ref, { once: true, margin: '-60px' })

  // Vor Mount oder bei "Bewegung reduzieren": Inhalt direkt sichtbar, keine Animation.
  if (!mounted || reduceMotion) {
    return <div className={className}>{children}</div>
  }

  const initial =
    variant === 'left'  ? { opacity: 0, x: -24 } :
    variant === 'scale' ? { opacity: 0, scale: 0.95, y: 12 } :
                          { opacity: 0, y: 20 }

  const animate = inView
    ? variant === 'left'  ? { opacity: 1, x: 0 } :
      variant === 'scale' ? { opacity: 1, scale: 1, y: 0 } :
                            { opacity: 1, y: 0 }
    : initial

  return (
    <m.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.55, delay: DELAY_MAP[delay], ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  )
}
