'use client'

import { useEffect } from 'react'

/** Modal-Komfort: Escape schließt; für Backdrop-Klick den zurückgegebenen
 *  Handler auf das Overlay legen (schließt nur bei Klick AUF das Overlay,
 *  nicht bei Klicks im Dialog). */
export function useModalDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }
}
