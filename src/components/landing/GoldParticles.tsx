'use client'

import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { useState, useEffect } from 'react'

// Dezente goldene Partikel im Hero: schweben sanft (CSS-Float je Partikel)
// und wandern beim Scrollen in drei Parallax-Ebenen unterschiedlich schnell mit.
// Feste Positionen (kein Math.random) – verhindert Hydration-Mismatch.

interface Particle {
  x: number      // % von links
  y: number      // % von oben
  size: number   // px
  opacity: number
  duration: number // Schwebe-Dauer in s
  delay: number
}

const LAYER_1: Particle[] = [ // nah – bewegt sich am stärksten
  { x: 8,  y: 12, size: 4, opacity: 0.5,  duration: 6,   delay: 0 },
  { x: 22, y: 28, size: 3, opacity: 0.35, duration: 7.5, delay: 1.2 },
  { x: 38, y: 8,  size: 5, opacity: 0.45, duration: 6.8, delay: 0.6 },
  { x: 61, y: 18, size: 3, opacity: 0.4,  duration: 7.2, delay: 2.0 },
  { x: 79, y: 10, size: 4, opacity: 0.5,  duration: 6.4, delay: 0.9 },
  { x: 92, y: 24, size: 3, opacity: 0.35, duration: 8,   delay: 1.6 },
]

const LAYER_2: Particle[] = [ // mittel
  { x: 14, y: 20, size: 2.5, opacity: 0.3,  duration: 9,   delay: 0.4 },
  { x: 31, y: 35, size: 2,   opacity: 0.25, duration: 10,  delay: 1.8 },
  { x: 47, y: 15, size: 3,   opacity: 0.3,  duration: 8.6, delay: 0.2 },
  { x: 56, y: 30, size: 2,   opacity: 0.22, duration: 9.4, delay: 2.4 },
  { x: 70, y: 22, size: 2.5, opacity: 0.28, duration: 8.8, delay: 1.0 },
  { x: 85, y: 34, size: 2,   opacity: 0.25, duration: 10,  delay: 0.7 },
]

const LAYER_3: Particle[] = [ // fern – bewegt sich am wenigsten
  { x: 5,  y: 32, size: 1.5, opacity: 0.18, duration: 12, delay: 0.5 },
  { x: 27, y: 14, size: 1.5, opacity: 0.15, duration: 13, delay: 1.4 },
  { x: 44, y: 26, size: 1.5, opacity: 0.18, duration: 11, delay: 2.2 },
  { x: 66, y: 9,  size: 1.5, opacity: 0.15, duration: 12, delay: 0.8 },
  { x: 76, y: 31, size: 1.5, opacity: 0.16, duration: 13, delay: 1.9 },
  { x: 95, y: 16, size: 1.5, opacity: 0.18, duration: 11, delay: 0.3 },
]

function Layer({ particles, y }: { particles: Particle[]; y: any }) {
  return (
    <m.div style={{ y }} className="absolute inset-0">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#C9A84C] particle-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px rgba(201,168,76,0.6)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </m.div>
  )
}

export default function GoldParticles() {
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  // Parallax: nahe Partikel wandern beim Scrollen schneller nach oben als ferne
  const y1 = useTransform(scrollY, [0, 900], [0, -260])
  const y2 = useTransform(scrollY, [0, 900], [0, -140])
  const y3 = useTransform(scrollY, [0, 900], [0, -60])

  // Nur auf größeren Bildschirmen rendern: die 18 box-shadow-Partikel +
  // scroll-gebundene Transforms sind auf Mobilgeräten ein spürbarer
  // Repaint-/Jank-Treiber. Auf Mobile/bei "Bewegung reduzieren": komplett aus.
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    if (reduceMotion) return
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [reduceMotion])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <Layer particles={LAYER_3} y={y3} />
      <Layer particles={LAYER_2} y={y2} />
      <Layer particles={LAYER_1} y={y1} />
    </div>
  )
}
