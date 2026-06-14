'use client'

import { useEffect } from 'react'

/**
 * Markiert <html> nach der Hydration mit der Klasse `js-ready`.
 *
 * Davor erzwingt globals.css Sichtbarkeit für alle Framer-Motion-Reveal-
 * Elemente (inline opacity:0). So ist der Seiteninhalt auf langsamen Handys
 * oder bei fehlgeschlagenem JS-Laden immer sichtbar; erst danach übernehmen
 * die Scroll-Animationen.
 */
export default function HydrationFlag() {
  useEffect(() => {
    document.documentElement.classList.add('js-ready')
  }, [])
  return null
}
