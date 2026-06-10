'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StickyHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'header-blur bg-[#06091A]/85 border-b border-white/8 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M8 2L14 13H2L8 2Z" fill="#06091A" stroke="none"/>
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight text-[17px]">
            Profitora
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {[
            { href: '#analysearten', label: 'Analysen' },
            { href: '#branchen',     label: 'Branchen' },
            { href: '#ablauf',       label: 'Wie es funktioniert' },
            { href: '#preise',       label: 'Preise' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-white/55 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-white/55 hover:text-white text-sm font-medium transition-colors"
          >
            Anmelden
          </Link>
          <Link
            href="/analyze"
            className="bg-au-gold hover:bg-au-gold-light text-[#06091A] text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Analyse starten
          </Link>
        </div>
      </div>
    </header>
  )
}
