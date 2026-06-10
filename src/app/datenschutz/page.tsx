import Link from 'next/link'

export const metadata = { title: 'Datenschutzerklärung – Profitora' }

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0D1630] flex items-center justify-center">
            <span className="text-[#C9A84C] font-black text-xs">A</span>
          </div>
          <span className="font-bold text-[#0D1630]">Profitora</span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Zurück</Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-gray-500 text-sm mb-8">Stand: Juni 2026</p>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-8 text-sm text-gray-700">

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">1. Verantwortlicher</h2>
            <p className="leading-relaxed">
              Verantwortlicher im Sinne der DSGVO ist: [Unternehmensname], [Anschrift], E-Mail: kontakt@profitora.de
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">2. Erhobene Daten und Zwecke</h2>
            <p className="leading-relaxed mb-3">
              Beim Besuch und der Nutzung von Profitora werden folgende Daten verarbeitet:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              <li><strong>Registrierungsdaten:</strong> Name, E-Mail-Adresse, Unternehmensname, Branche – zur Bereitstellung des Accounts (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li><strong>Finanzdaten:</strong> Kosten- und Einnahmendaten, die Sie manuell eingeben oder als Datei hochladen – zur KI-Analyse (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li><strong>Mitarbeiterdaten:</strong> Werden anonymisiert/pseudonymisiert verarbeitet. Keine Einzelbewertung von Mitarbeitern.</li>
              <li><strong>Nutzungsdaten:</strong> Technische Logs für Betrieb und Sicherheit (Art. 6 Abs. 1 lit. f DSGVO)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">3. KI-Verarbeitung</h2>
            <p className="leading-relaxed">
              Zur Erstellung der Analyseberichte werden Ihre Daten an KI-Dienste übermittelt (Anthropic/OpenAI). Mit diesen Anbietern bestehen Auftragsverarbeitungsverträge nach Art. 28 DSGVO. Es werden keine personenbezogenen Mitarbeiterdaten in KI-Prompts übertragen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">4. Speicherdauer</h2>
            <p className="leading-relaxed">
              Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Nach Kontolöschung werden Daten innerhalb von 30 Tagen endgültig gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen (z.B. § 147 AO: 10 Jahre für Buchungsunterlagen).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">5. Cookies und Sitzungsdaten</h2>
            <p className="leading-relaxed">
              Profitora verwendet technisch notwendige HTTP-only Cookies für die Authentifizierung. Diese Cookies enthalten keine personenbezogenen Daten außer einer sicheren Sitzungs-ID und sind für den Betrieb der Plattform erforderlich (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">6. Ihre Rechte</h2>
            <p className="leading-relaxed mb-3">Sie haben nach DSGVO folgende Rechte:</p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>Auskunftsrecht (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              <li>Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Wenden Sie sich dazu an: <a href="mailto:datenschutz@profitora.de" className="text-[#0D1630] hover:underline">datenschutz@profitora.de</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">7. Datensicherheit</h2>
            <p className="leading-relaxed">
              Alle Verbindungen sind SSL/TLS-verschlüsselt. Authentifizierungstoken werden in HTTP-only Cookies gespeichert (kein Zugriff via JavaScript). Dateiuploads werden mit zufälligen IDs gespeichert und sind nicht öffentlich zugänglich.
            </p>
          </section>

        </div>

        <div className="flex gap-4 mt-8 text-xs text-gray-400">
          <Link href="/impressum" className="hover:text-gray-600">Impressum</Link>
          <Link href="/agb" className="hover:text-gray-600">AGB</Link>
        </div>
      </div>
    </div>
  )
}
