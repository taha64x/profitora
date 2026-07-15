'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import PasswordInput from '@/components/auth/PasswordInput'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Zurücksetzen fehlgeschlagen.')
        return
      }
      router.push('/login?reset=1')
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="card p-8">
        {token === null ? (
          <p className="text-gray-400 text-sm">Lädt…</p>
        ) : token === '' || !token ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link ungültig</h1>
            <p className="text-gray-500 text-sm mb-6">
              Dieser Link ist unvollständig. Fordern Sie einen neuen Link zum Zurücksetzen an.
            </p>
            <Link href="/forgot-password" className="btn-primary w-full block text-center">Neuen Link anfordern</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Neues Passwort setzen</h1>
            <p className="text-gray-500 text-sm mb-6">Mindestens 8 Zeichen — danach sind Sie direkt startklar.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Neues Passwort</label>
                <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="Mindestens 8 Zeichen" required/>
              </div>
              <div>
                <label className="label">Passwort wiederholen</label>
                <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" required/>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
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
