import Link from 'next/link'
import { COMPANY } from '@/lib/company'

export const metadata = { title: 'AGB – Profitora' }

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0D1630] flex items-center justify-center">
            <span className="text-[#C9A84C] font-black text-xs">P</span>
          </div>
          <span className="font-bold text-[#0D1630]">Profitora</span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Zurück</Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-gray-500 text-sm mb-8">Stand: Juni 2026</p>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-8 text-sm text-gray-700">

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 1 Geltungsbereich</h2>
            <p className="leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen {COMPANY.legalName} (Geschäftsbezeichnung „{COMPANY.brand}", {COMPANY.street}, {COMPANY.city}) und Nutzern der Plattform profitora.de. Abweichende Bedingungen des Nutzers werden nicht anerkannt. Das Angebot richtet sich vorrangig an Unternehmer im Sinne des § 14 BGB (Betriebe, z. B. Hotels und Gastronomie).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 2 Leistungsbeschreibung</h2>
            <p className="leading-relaxed mb-3">
              Profitora stellt eine KI-gestützte Plattform zur betriebswirtschaftlichen Unternehmensanalyse bereit. Die Plattform ermöglicht:
            </p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>Upload und Analyse von Finanzdaten (CSV, Excel, PDF)</li>
              <li>KI-gestützte Auswertung von Kosten, Einnahmen und Kennzahlen</li>
              <li>Generierung von Analyseberichten mit Optimierungsempfehlungen</li>
              <li>Vergleich mit branchenspezifischen Benchmarks</li>
              <li>Verwaltung von Kosten- und Einnahmeposten</li>
            </ul>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="leading-relaxed font-medium text-amber-800">
                Wichtiger Hinweis: Profitora ist eine KI-gestützte Analyse zur betriebswirtschaftlichen Entscheidungsunterstützung. Die Berichte ersetzen keine gesetzliche Wirtschaftsprüfung (§§ 316 ff. HGB), keine Steuerberatung und keine Rechtsberatung. Alle Empfehlungen sind unverbindliche Einschätzungen und kein Ersatz für professionelle Beratung.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 3 Vertragsschluss und Nutzerkonto</h2>
            <p className="leading-relaxed">
              Mit der Registrierung schließen Sie einen Nutzungsvertrag mit {COMPANY.brand} ab. Ein kostenpflichtiger Vertrag kommt mit Abschluss des Bestellvorgangs über den Zahlungsdienstleister Stripe zustande. Sie sind für die Sicherheit Ihres Kontos verantwortlich. Pro Unternehmen ist ein Konto zulässig.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 4 Preise und Zahlung</h2>
            <p className="leading-relaxed">
              Profitora wird in folgenden Paketen angeboten: ein kostenloser Gratis-Schnellcheck sowie die kostenpflichtige Komplettanalyse (einmalige Zahlung von 1.990 EUR). Als Kleinunternehmer im Sinne von § 19 UStG wird keine Umsatzsteuer ausgewiesen. Die jeweils aktuellen Preise und Leistungsumfänge sind auf der Preisseite ersichtlich. Zahlungen werden über den Zahlungsdienstleister Stripe abgewickelt.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 5 Laufzeit, Kündigung, Widerruf und Erstattung</h2>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li><strong>Abonnements</strong> können jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt werden. Der Zugang bleibt bis zum Ende des bereits bezahlten Zeitraums aktiv. Bereits gezahlte Beträge werden nicht (auch nicht anteilig) erstattet.</li>
              <li>Die <strong>Komplettanalyse</strong> ist ein einmaliger Kauf einer digitalen Dienstleistung. Nach Bereitstellung bzw. Ausführung der Leistung ist eine Erstattung ausgeschlossen.</li>
              <li>Der <strong>Gratis-Schnellcheck</strong> kann jederzeit ohne Kündigung beendet werden.</li>
              <li><strong>Verbraucher</strong> im Sinne des § 13 BGB haben ein gesetzliches Widerrufsrecht nach Maßgabe der <Link href="/widerruf" className="text-[#0D1630] hover:underline">Widerrufsbelehrung</Link>. Dieses erlischt bei digitalen Inhalten und Dienstleistungen, wenn der Verbraucher der sofortigen Ausführung ausdrücklich zustimmt und seine Kenntnis vom Erlöschen des Widerrufsrechts bestätigt (§ 356 Abs. 4 und 5 BGB).</li>
              <li>Gegenüber <strong>Unternehmern</strong> (§ 14 BGB) besteht kein gesetzliches Widerrufsrecht; eine Erstattung ist ausgeschlossen.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 6 Pflichten des Nutzers</h2>
            <p className="leading-relaxed mb-2">Der Nutzer verpflichtet sich:</p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>Nur rechtmäßig erlangte Daten hochzuladen</li>
              <li>Die Plattform nicht für illegale Zwecke zu nutzen</li>
              <li>Keine Scraping-, Reverse-Engineering- oder Missbrauchsversuche durchzuführen</li>
              <li>Mitarbeiterdaten ausschließlich anonymisiert zu verarbeiten</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 7 Haftungsbeschränkung</h2>
            <p className="leading-relaxed">
              Profitora haftet nicht für wirtschaftliche Entscheidungen, die auf Basis der KI-generierten Analysen getroffen wurden. Die Berichte sind Entscheidungshilfen – keine Garantien. Geschätzte Sparpotenziale sind als „mögliche Einsparungen" zu verstehen und können von den tatsächlich realisierbaren Einsparungen abweichen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 8 Datenschutz</h2>
            <p className="leading-relaxed">
              Details zur Datenverarbeitung finden Sie in der <Link href="/datenschutz" className="text-[#0D1630] hover:underline">Datenschutzerklärung</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 9 Schlussbestimmungen</h2>
            <p className="leading-relaxed">
              Es gilt deutsches Recht. Soweit der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist, ist Gerichtsstand der Sitz des Anbieters. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>

        </div>

        <div className="flex gap-4 mt-8 text-xs text-gray-400">
          <Link href="/impressum" className="hover:text-gray-600">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-gray-600">Datenschutzerklärung</Link>
          <Link href="/widerruf" className="hover:text-gray-600">Widerruf</Link>
        </div>
      </div>
    </div>
  )
}
