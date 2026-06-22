'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  target: number
  prefix?: string
  suffix?: string
  duration?: number
}

export default function AnimatedCounter({ target, prefix = '', suffix = '', duration = 1800 }: Props) {
  // Start bei target, damit SSR/Initialzustand nie „0" zeigt (Conversion-Schaden).
  // Die Hochzähl-Animation startet erst, wenn das Element sichtbar wird.
  const [value, setValue] = useState(target)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          setValue(0)
          const start = performance.now()

          const tick = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString('de-DE')}{suffix}
    </span>
  )
}
