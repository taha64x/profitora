'use client'

/**
 * Prominente Schnell-Navigation direkt unter dem Hero: zeigt auf einen Blick,
 * was die Seite enthält, und springt per Klick zur Sektion. Nutzt scrollIntoView
 * (zuverlässig – natives Anker-Scrollen wird durch overflow-x-clip auf <main>
 * blockiert). scroll-margin-top der Ziele sorgt für Abstand zum Sticky-Header.
 */
const ITEMS = [
  { href: '#analysearten', label: 'Analysearten' },
  { href: '#branchen',     label: 'Branchen' },
  { href: '#ablauf',       label: 'Ablauf' },
  { href: '#vorschau',     label: 'Beispiel' },
  { href: '#features',     label: 'Funktionen' },
  { href: '#preise',       label: 'Preise' },
]

export function scrollToHash(href: string) {
  const el = document.querySelector(href)
  if (!el) return
  // Natives Anker-/Smooth-Scrollen und scrollIntoView sind hier unzuverlässig
  // (overflow-x-clip auf <main> + framer-Transforms). Absolutes window.scrollTo
  // mit behavior:'auto' ist verifiziert zuverlässig. 80px Offset für den Sticky-Header.
  const HEADER_OFFSET = 80
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET)
  // 'instant' erzwingt sofortiges Scrollen (umgeht das hier kaputte CSS-Smooth-Scroll).
  window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
  history.replaceState(null, '', href)
}

export default function QuickNav() {
  return (
    <section className="bg-[#06091A] border-b border-white/6 px-6 py-5">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-white/35 text-xs uppercase tracking-widest mb-3">
          Schnell zu …
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); scrollToHash(item.href) }}
              className="px-4 py-2 rounded-full text-sm font-medium border border-white/12 text-white/70 hover:text-[#06091A] hover:bg-au-gold hover:border-au-gold transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
