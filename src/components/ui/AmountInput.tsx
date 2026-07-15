'use client'

import { useEffect, useState } from 'react'
import { parseGermanAmount } from '@/lib/csv'

/**
 * Betragsfeld mit deutscher Eingabe: akzeptiert "1.234,56", "12,50" und "12.50".
 * type="number" lehnt je nach Browser das Komma ab — für deutsche Nutzer die
 * häufigste Eingabe-Hürde im Finanztracking.
 */
interface Props {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  className?: string
}

function format(n: number): string {
  return n === 0 ? '' : n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AmountInput({ value, onChange, placeholder = '0,00', required, autoFocus, className = 'input' }: Props) {
  const [text, setText] = useState(format(value))

  // Externe Wertänderung (z. B. Modal mit Edit-Daten neu geöffnet) übernehmen,
  // ohne die laufende Eingabe zu überschreiben.
  useEffect(() => {
    const parsed = parseGermanAmount(text)
    if ((parsed ?? 0) !== value) setText(format(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      required={required}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = parseGermanAmount(e.target.value)
        onChange(parsed !== null && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0)
      }}
      onBlur={() => {
        const parsed = parseGermanAmount(text)
        if (parsed !== null && parsed > 0) setText(format(parsed))
      }}
    />
  )
}
