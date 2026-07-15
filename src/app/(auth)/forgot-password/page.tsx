'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Anfrage fehlgeschlagen.')
        return
      }
      setSent(true)
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="card p-8">
        {sent ? (
          <>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">E-Mail unterwegs</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Falls ein Konto für <strong className="text-gray-700">{email}</strong> existiert, haben wir
              einen Link zum Zurücksetzen gesendet. Der Link ist 60 Minuten gültig — prüfen Sie
              auch den Spam-Ordner.
            </p>
            <Link href="/login" className="btn-primary w-full block text-center">Zur Anmeldung</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Passwort vergessen?</h1>
            <p className="text-gray-500 text-sm mb-6">
              Geben Sie Ihre E-Mail-Adresse ein — wir senden Ihnen einen Link zum Zurücksetzen.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">E-Mail-Adresse</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  className="input"
                  placeholder="max@unternehmen.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Wird gesendet…' : 'Link senden'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="text-hotel-navy font-medium hover:underline">← Zurück zur Anmeldung</Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
