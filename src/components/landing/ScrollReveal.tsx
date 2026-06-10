'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode } from 'react'

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
  const inView = useInView(ref, { once: true, margin: '-60px' })

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
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.55, delay: DELAY_MAP[delay], ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
