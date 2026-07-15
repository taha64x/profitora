import Link from 'next/link'
import { COMPANY, VAT_NOTE } from '@/lib/company'

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
        <p className="text-gray-500 text-sm mb-8">Stand: Juli 2026</p>

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
              <li>Unternehmens-Cockpit: Verwaltung von Kosten- und Einnahmeposten (inkl. Bereichen, wiederkehrenden Posten, Belegen, CSV-Import und Exporten)</li>
              <li>Team-Funktionen: Mitarbeiter-Stammdaten, Schichtplanung, Abwesenheitsverwaltung sowie ein optional teilbarer, öffentlicher Nur-Lese-Link auf den Wochenplan</li>
              <li>Automatische Auswertungen: KPI-Hinweise, Monatsreport per E-Mail, Prognose (Forecast) und Maßnahmen-Verwaltung</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Der konkrete Funktionsumfang richtet sich nach dem gewählten Tarif (§ 4). Der Anbieter darf Funktionen weiterentwickeln und in zumutbarem Umfang ändern, sofern der Vertragszweck erhalten bleibt.
            </p>
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
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 4 Tarife, Preise und Zahlung</h2>
            <p className="leading-relaxed mb-3">
              Profitora wird in folgenden Varianten angeboten:
            </p>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li><strong>Kostenloser Account:</strong> Registrierung, Beispielbericht und Kauf einzelner Analysen. Kein Zugang zum Unternehmens-Cockpit.</li>
              <li><strong>Abonnements</strong> (Unternehmens-Cockpit) in drei Tarifen: <strong>Starter</strong> (149 EUR/Monat), <strong>Business</strong> (299 EUR/Monat) und <strong>Premium</strong> (599 EUR/Monat), jeweils wahlweise mit jährlicher Zahlung (1.428 / 2.868 / 5.748 EUR pro Jahr, entspricht 20 % Ersparnis). Der Funktionsumfang je Tarif (u. a. Anzahl Mitarbeiter und Nutzer, Schichtplan, Alerts, Export, Forecast) ergibt sich aus der Preisseite.</li>
              <li><strong>KI-Analysen</strong> als Einmalkauf: ohne Abonnement 2.490 EUR je Analyse; mit aktivem Abonnement zum vergünstigten Tarifpreis (Starter 499 EUR, Business 299 EUR, Premium 199 EUR). Im Premium-Tarif ist eine Analyse pro Kalenderquartal enthalten (nicht übertragbar, nicht kumulierbar). Jede durchgeführte Analyse verbraucht ein Analyse-Guthaben; erworbenes Guthaben verfällt nicht. Während eines Testzeitraums (§ 5) gilt für Analyse-Einmalkäufe der Preis ohne Abonnement.</li>
            </ul>
            <p className="leading-relaxed mt-3">
              {VAT_NOTE} Die jeweils aktuellen Preise und Leistungsumfänge sind auf der Preisseite ersichtlich. Zahlungen werden über den Zahlungsdienstleister Stripe abgewickelt; für Abonnements erteilt der Nutzer Stripe ein entsprechendes Zahlungsmandat für wiederkehrende Zahlungen.
            </p>
            <p className="leading-relaxed mt-3">
              <strong>Preisänderungen bei Abonnements:</strong> Der Anbieter kann die Abonnementpreise mit Wirkung für künftige Abrechnungszeiträume anpassen. Preiserhöhungen werden mindestens 6 Wochen vor Wirksamwerden per E-Mail angekündigt; dem Nutzer steht in diesem Fall ein Sonderkündigungsrecht zum Zeitpunkt des Wirksamwerdens zu. Für den laufenden, bereits bezahlten Zeitraum bleibt der vereinbarte Preis unverändert.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">§ 5 Laufzeit, Testzeitraum, Kündigung, Widerruf und Erstattung</h2>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li><strong>Testzeitraum:</strong> Neue Abonnements beginnen mit einem kostenlosen Testzeitraum von 14 Tagen. Wird das Abonnement nicht vor Ablauf des Testzeitraums gekündigt, geht es automatisch in ein kostenpflichtiges Abonnement über und die erste Abbuchung erfolgt. Ein Testzeitraum wird je Unternehmen nur einmal gewährt.</li>
              <li><strong>Laufzeit und Verlängerung:</strong> Abonnements laufen je nach gewählter Zahlweise einen Monat oder ein Jahr und verlängern sich automatisch um den jeweiligen Zeitraum, wenn sie nicht vorher gekündigt werden.</li>
              <li><strong>Kündigung:</strong> Abonnements können jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt werden — direkt im Kundenkonto unter „Abo &amp; Analysen" über „Abo &amp; Rechnungen verwalten" („Verträge hier kündigen") oder per E-Mail an {COMPANY.email}. Der Zugang bleibt bis zum Ende des bereits bezahlten Zeitraums aktiv. Bereits gezahlte Beträge werden nicht (auch nicht anteilig) erstattet.</li>
              <li><strong>Nach Vertragsende:</strong> Das Konto fällt auf den kostenlosen Account zurück. Eingegebene Daten (Finanzdaten, Team, Berichte) bleiben mindestens 6 Monate gespeichert und werden bei Reaktivierung wieder verfügbar; danach kann der Anbieter sie nach vorheriger Ankündigung per E-Mail löschen. Nicht verbrauchtes Analyse-Guthaben bleibt bestehen.</li>
              <li><strong>Zahlungsverzug:</strong> Schlägt eine Abbuchung fehl, informiert der Anbieter den Nutzer; Stripe wiederholt die Abbuchung. Bleibt die Zahlung aus, kann der Anbieter den Zugang zum Cockpit bis zum Zahlungseingang aussetzen und das Abonnement nach erfolgloser Nachfrist kündigen.</li>
              <li><strong>Analyse-Guthaben</strong> ist ein einmaliger Kauf einer digitalen Dienstleistung. Nach Bereitstellung bzw. Ausführung der Leistung ist eine Erstattung ausgeschlossen; erworbenes, noch nicht verbrauchtes Guthaben verfällt nicht.</li>
              <li>Der <strong>kostenlose Account</strong> kann jederzeit ohne Kündigung beendet werden.</li>
              <li><strong>Verbraucher</strong> im Sinne des § 13 BGB haben ein gesetzliches Widerrufsrecht nach Maßgabe der <Link href="/widerruf" className="text-[#0D1630] hover:underline">Widerrufsbelehrung</Link>. Bei Analysen erlischt es, wenn der Verbraucher der sofortigen Ausführung ausdrücklich zustimmt und seine Kenntnis vom Erlöschen des Widerrufsrechts bestätigt (§ 356 Abs. 4 und 5 BGB). Bei Abonnements, deren Bereitstellung auf Verlangen des Verbrauchers vor Ablauf der Widerrufsfrist beginnt, ist im Widerrufsfall Wertersatz für die bis zum Widerruf erbrachte Leistung zu zahlen (§ 357a BGB).</li>
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
              <li>Mitarbeiterdaten nur einzugeben, soweit er dazu datenschutzrechtlich berechtigt ist (Art. 6 DSGVO), und seine Mitarbeiter nach Art. 13/14 DSGVO zu informieren; in KI-Analysen werden Mitarbeiterdaten ausschließlich aggregiert und ohne Namen verarbeitet</li>
              <li>Den öffentlichen Schichtplan-Link (Nur-Lese-Ansicht mit Namen und Arbeitszeiten) eigenverantwortlich nur an berechtigte Personen weiterzugeben; der Link kann im Kundenkonto jederzeit erneuert und damit entwertet werden</li>
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
