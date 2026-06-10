import Link from 'next/link'

export const metadata = { title: 'Impressum – Profitora' }

export default function ImpressumPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Impressum</h1>

        <section className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Angaben gemäß § 5 TMG</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Profitora<br/>
              [Unternehmensname]<br/>
              [Straße und Hausnummer]<br/>
              [PLZ] [Stadt]<br/>
              Deutschland
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Kontakt</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              E-Mail: <a href="mailto:kontakt@profitora.de" className="text-[#0D1630] hover:underline">kontakt@profitora.de</a>
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Umsatzsteuer-ID</h2>
            <p className="text-gray-700 text-sm">Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [DE-Nummer]</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Verantwortlich für den Inhalt</h2>
            <p className="text-gray-700 text-sm">[Name des Verantwortlichen], [Anschrift wie oben]</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Haftungsausschluss</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed mt-3">
              <strong>KI-Analysehinweis:</strong> Profitora ist eine KI-gestützte Analyseplattform für betriebswirtschaftliche Entscheidungshilfen. Die generierten Berichte ersetzen keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung nach §§ 316 ff. HGB. Alle Empfehlungen sind unverbindliche Einschätzungen.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Urheberrecht</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors.
            </p>
          </div>
        </section>

        <div className="flex gap-4 mt-8 text-xs text-gray-400">
          <Link href="/datenschutz" className="hover:text-gray-600">Datenschutzerklärung</Link>
          <Link href="/agb" className="hover:text-gray-600">AGB</Link>
        </div>
      </div>
    </div>
  )
}
