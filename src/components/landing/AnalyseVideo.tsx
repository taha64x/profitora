'use client'

import { useState } from 'react'

/**
 * Hero-Video "So funktioniert die Analyse".
 * Mobil-schonend: lädt erst beim Klick (preload="none"), kein Autoplay,
 * kein erzwungener Download der ~17 MB. Vorher nur ein leichtes, gebrandetes
 * Poster mit Play-Button.
 */
export default function AnalyseVideo() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative mt-16 mx-auto max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#06091A]">
      {playing ? (
        <video
          className="w-full h-full object-cover"
          src="/analyse-hero.mp4"
          controls
          autoPlay
          playsInline
          preload="none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Video abspielen: So funktioniert die Analyse"
          className="group absolute inset-0 flex flex-col items-center justify-center"
        >
          {/* Gebrandeter Verlauf statt Poster-Bild (kein Vorab-Download) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D1630] via-[#06091A] to-[#0D1630]" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 30%, rgba(201,168,76,0.25), transparent 55%), radial-gradient(circle at 75% 70%, rgba(201,168,76,0.15), transparent 50%)',
            }}
          />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-au-gold text-[#06091A] shadow-xl transition-transform duration-300 group-hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="relative mt-5 text-white font-semibold text-lg">So funktioniert die Analyse</p>
          <p className="relative mt-1 text-white/50 text-sm">Kurzes Video ansehen (8 Sek.)</p>
        </button>
      )}
    </div>
  )
}
