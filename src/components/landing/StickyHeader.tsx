'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { scrollToHash } from './QuickNav'

const NAV_ITEMS = [
  { href: '#analysearten', label: 'Analysen' },
  { href: '#branchen',     label: 'Branchen' },
  { href: '#ablauf',       label: 'Ablauf' },
  { href: '#vorschau',     label: 'Beispiel' },
  { href: '#features',     label: 'Funktionen' },
  { href: '#preise',       label: 'Preise' },
]

export default function StickyHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? 'header-blur bg-[#06091A]/85 border-b border-white/8 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M8 2L14 13H2L8 2Z" fill="#06091A" stroke="none"/>
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight text-[17px]">
            Profitora
          </span>
        </Link>

        {/* Desktop-Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); scrollToHash(item.href) }}
              className="nav-underline text-white/55 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA + Mobile-Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline text-white/55 hover:text-white text-sm font-medium transition-colors"
          >
            Anmelden
          </Link>
          <Link
            href="/analyze"
            className="btn-shine bg-au-gold hover:bg-au-gold-light text-[#06091A] text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Analyse starten
          </Link>
          {/* Hamburger – nur mobil */}
          <button
            type="button"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile-Menü */}
      {menuOpen && (
        <nav className="md:hidden mt-3 px-6 pb-2">
          <div className="flex flex-col gap-1 rounded-2xl bg-[#06091A]/95 border border-white/10 p-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollToHash(item.href) }}
                className="text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors sm:hidden"
            >
              Anmelden
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
