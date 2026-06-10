'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface ProfileData {
  name: string
  email: string
  businessName: string
  businessType: string
  website: string
  phone: string
  street: string
  city: string
  zip: string
  country: string
}

const BUSINESS_TYPES = [
  'Restaurant / Gastronomie', 'Hotel / Unterkunft', 'Einzelhandel', 'E-Commerce',
  'Agentur / Beratung', 'Handwerk / Baugewerbe', 'Gesundheit / Medizin',
  'Fitness / Wellness', 'IT / Software', 'Bildung / Coaching',
  'Immobilien', 'Transport / Logistik', 'Produktion / Industrie', 'Sonstiges',
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', businessName: '', businessType: '',
    website: '', phone: '', street: '', city: '', zip: '', country: 'Deutschland',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setProfile((p) => ({ ...p, ...j.data }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const set = (k: keyof ProfileData, v: string) => setProfile((p) => ({ ...p, [k]: v }))

  if (loading) return (
    <DashboardLayout>
      <div className="p-8 flex items-center justify-center h-64 text-gray-400">Lädt…</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil & Unternehmen</h1>
            <p className="text-gray-500 text-sm mt-0.5">Persönliche Daten und Unternehmensangaben verwalten</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
            {saving ? 'Speichert…' : saved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        </div>

        {/* Personal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Persönliche Daten</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vollständiger Name</label>
              <input value={profile.name} onChange={(e) => set('name', e.target.value)} type="text" placeholder="Max Mustermann" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-Mail-Adresse</label>
              <input value={profile.email} onChange={(e) => set('email', e.target.value)} type="email" placeholder="max@beispiel.de" className="input bg-gray-50 cursor-not-allowed" readOnly/>
              <p className="text-xs text-gray-400 mt-1">E-Mail kann derzeit nicht geändert werden.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input value={profile.phone} onChange={(e) => set('phone', e.target.value)} type="tel" placeholder="+49 123 456 7890" className="input"/>
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Unternehmensdaten</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unternehmensname</label>
              <input value={profile.businessName} onChange={(e) => set('businessName', e.target.value)} type="text" placeholder="Mustermann GmbH" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branche</label>
              <select value={profile.businessType} onChange={(e) => set('businessType', e.target.value)} className="input">
                <option value="">Bitte wählen</option>
                {BUSINESS_TYPES.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
              <input value={profile.website} onChange={(e) => set('website', e.target.value)} type="url" placeholder="https://beispiel.de" className="input"/>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Adresse</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Straße & Hausnummer</label>
              <input value={profile.street} onChange={(e) => set('street', e.target.value)} type="text" placeholder="Musterstraße 1" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Postleitzahl</label>
              <input value={profile.zip} onChange={(e) => set('zip', e.target.value)} type="text" placeholder="10115" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stadt</label>
              <input value={profile.city} onChange={(e) => set('city', e.target.value)} type="text" placeholder="Berlin" className="input"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Land</label>
              <select value={profile.country} onChange={(e) => set('country', e.target.value)} className="input">
                {['Deutschland', 'Österreich', 'Schweiz', 'Luxemburg'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-50">
            {saving ? 'Speichert…' : saved ? '✓ Erfolgreich gespeichert' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
