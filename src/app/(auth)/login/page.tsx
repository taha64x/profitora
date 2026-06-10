'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Anmeldung fehlgeschlagen.')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-2xl font-bold text-hotel-navy">Profitora</span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Melden Sie sich an</p>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Anmelden</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">E-Mail-Adresse</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                placeholder="max@hotel.de"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Passwort</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Anmeldung läuft...' : 'Anmelden'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-hotel-navy font-medium hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
