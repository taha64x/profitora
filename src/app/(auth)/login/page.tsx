'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'
import PasswordInput from '@/components/auth/PasswordInput'

const GOOGLE_ERRORS: Record<string, string> = {
  'google-config': 'Google-Login ist derzeit nicht verfügbar.',
  'google-state': 'Google-Anmeldung abgelaufen. Bitte erneut versuchen.',
  'google-token': 'Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
  'google-email': 'Ihre Google-E-Mail ist nicht bestätigt.',
  google: 'Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('error')
    if (code && GOOGLE_ERRORS[code]) setError(GOOGLE_ERRORS[code])
    if (params.get('reset') === '1') setInfo('Passwort geändert — melden Sie sich mit dem neuen Passwort an.')
  }, [])

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
    <AuthShell>
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Willkommen zurück</h1>
        <p className="text-gray-500 text-sm mb-6">Melden Sie sich in Ihrem Cockpit an.</p>

        {info && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <GoogleLoginButton />

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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="label !mb-0">Passwort</label>
              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-hotel-navy transition-colors">
                Passwort vergessen?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                <path d="M12 2a10 10 0 019.54 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {loading ? 'Anmeldung läuft…' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-hotel-navy font-medium hover:underline">
            Kostenlos registrieren
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
