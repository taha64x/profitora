'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface SettingsData {
  language: string
  currency: string
  emailNotifications: boolean
  monthlyReminder: boolean
  defaultAnalysisPeriod: string
}

const DEFAULTS: SettingsData = {
  language: 'de',
  currency: 'EUR',
  emailNotifications: true,
  monthlyReminder: true,
  defaultAnalysisPeriod: 'last_month',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setSettings({ ...DEFAULTS, ...j.data })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const set = <K extends keyof SettingsData>(k: K, v: SettingsData[K]) => setSettings((s) => ({ ...s, [k]: v }))

  if (loading) return (
    <DashboardLayout>
      <div className="p-8 flex items-center justify-center h-64 text-gray-400">Lädt…</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
            <p className="text-gray-500 text-sm mt-0.5">Sprache, Währung und Benachrichtigungen konfigurieren</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
            {saving ? 'Speichert…' : saved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        </div>

        {/* General */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Allgemein</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sprache</label>
              <select value={settings.language} onChange={(e) => set('language', e.target.value)} className="input w-52">
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Standardwährung</label>
              <select value={settings.currency} onChange={(e) => set('currency', e.target.value)} className="input w-52">
                <option value="EUR">Euro (€)</option>
                <option value="CHF">Schweizer Franken (CHF)</option>
                <option value="USD">US-Dollar ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Standard-Analysezeitraum</label>
              <select value={settings.defaultAnalysisPeriod} onChange={(e) => set('defaultAnalysisPeriod', e.target.value)} className="input w-64">
                <option value="last_month">Letzter Monat</option>
                <option value="last_quarter">Letztes Quartal</option>
                <option value="last_6_months">Letzte 6 Monate</option>
                <option value="last_year">Letztes Jahr</option>
                <option value="current_year">Laufendes Jahr</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Benachrichtigungen</h2>
          <div className="space-y-4">
            <ToggleRow
              label="E-Mail-Benachrichtigungen"
              description="Infos zu Analyseberichten und Systemnachrichten"
              checked={settings.emailNotifications}
              onChange={(v) => set('emailNotifications', v)}
            />
            <ToggleRow
              label="Monatliche Erinnerung"
              description="Erinnerung zum Eintragen neuer Kosten und Einnahmen"
              checked={settings.monthlyReminder}
              onChange={(v) => set('monthlyReminder', v)}
            />
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
          <h2 className="font-semibold text-red-700 mb-5">Datenverwaltung</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Alle Finanzdaten löschen</p>
                <p className="text-xs text-gray-500 mt-0.5">Löscht unwiderruflich alle Kosten- und Einnahmeneinträge.</p>
              </div>
              <button className="text-xs font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                Löschen
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Konto löschen</p>
                <p className="text-xs text-gray-500 mt-0.5">Alle Daten werden dauerhaft gelöscht. Nicht rückgängig machbar.</p>
              </div>
              <button className="text-xs font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                Konto löschen
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-50">
            {saving ? 'Speichert…' : saved ? '✓ Erfolgreich gespeichert' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#0D1630]' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
    </div>
  )
}
