'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { IconCpu, IconLoader } from '@/components/ui/icons'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Wo kann ich am schnellsten Kosten senken?',
  'Wie kann ich meine Mitarbeiter effizienter einsetzen?',
  'Wie haben sich meine Ausgaben in den letzten Monaten entwickelt?',
  'Was ist mein größter Kostenbereich und ist er zu hoch?',
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading) return
    setError('')
    setInput('')
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Der Assistent ist gerade nicht erreichbar.')
        setMessages(messages)
        return
      }
      setMessages([...next, { role: 'assistant', content: data.reply }])
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      if (data.model) setModel(data.model)
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.')
      setMessages(messages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="dash-page max-w-3xl mx-auto flex flex-col h-[calc(100dvh-3.5rem)] lg:h-screen">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#0D1630] text-au-gold flex items-center justify-center">
                <IconCpu className="w-5 h-5" />
              </span>
              KI-Assistent
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Stellt Fragen zu Ihren Finanzen, Analysen und Sparpotenzialen – die Antworten basieren auf Ihren eingetragenen Daten.
            </p>
          </div>
          <div className="text-right shrink-0">
            {model && <p className="text-xs text-gray-400">Modell: {model}</p>}
            {remaining !== null && (
              <p className="text-xs text-gray-400 mt-0.5">{remaining} Fragen übrig diesen Monat</p>
            )}
          </div>
        </div>

        {/* Chat-Verlauf */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <p className="text-gray-700 font-semibold mb-1">Womit kann ich helfen?</p>
              <p className="text-gray-400 text-sm mb-6 max-w-sm">
                Zum Beispiel mit einer dieser Fragen – oder stellen Sie Ihre eigene:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm text-gray-600 border border-gray-200 hover:border-hotel-navy/40 hover:bg-gray-50 rounded-xl px-4 py-3 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#0D1630] text-white rounded-br-md'
                    : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
                <IconLoader className="w-4 h-4" />
                Analysiert Ihre Daten…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* Eingabe */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input) }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage stellen, z.B. „Wie senke ich meine Personalkosten?“"
            className="flex-1 border border-gray-300 focus:border-hotel-navy rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-hotel-navy text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-hotel-navy/90 transition-colors disabled:opacity-40"
          >
            Senden
          </button>
        </form>

        <p className="text-gray-300 text-xs text-center mt-3">
          KI-gestützte Entscheidungshilfe – ersetzt keine Steuer- oder Rechtsberatung.
        </p>
      </div>
    </DashboardLayout>
  )
}
