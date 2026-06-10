import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'

const FAQ = [
  {
    q: 'Was analysiert Profitora genau?',
    a: 'Profitora führt eine KI-gestützte betriebswirtschaftliche Analyse Ihrer Unternehmenskennzahlen durch – auf Basis Ihrer hochgeladenen Daten oder Ihrer Angaben im Fragebogen. Ausgewertet werden Kosten, Einnahmen, Personalquoten und Prozesseffizienz orientiert an branchenüblichen Controlling-Methoden.',
  },
  {
    q: 'Ersetzt Profitora meinen Steuerberater oder Wirtschaftsprüfer?',
    a: 'Nein. Profitora ist kein Ersatz für Steuerberater, Rechtsanwalt oder Wirtschaftsprüfer. Die Berichte sind betriebswirtschaftliche Entscheidungshilfen – keine rechtsverbindlichen Prüfungen im Sinne von §317 HGB.',
  },
  {
    q: 'Welche Dateiformate kann ich hochladen?',
    a: 'Sie können CSV-Dateien, Excel-Tabellen (.xlsx, .xls) und PDF-Dokumente hochladen. Für die genaueste Analyse empfehlen wir strukturierte CSV- oder Excel-Exporte aus Ihrem Kassensystem, Buchhaltungsprogramm oder Zeiterfassungssystem.',
  },
  {
    q: 'Wie werden meine Daten geschützt?',
    a: 'Ihre Daten werden ausschließlich für die Erstellung Ihres Analyseberichts verwendet. Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO. Personenbezogene Mitarbeiterdaten werden anonymisiert verarbeitet. Sie können Ihre Daten und Berichte jederzeit löschen.',
  },
  {
    q: 'Wie lange dauert eine Analyse?',
    a: 'Ein Schnellcheck dauert in der Regel 1–3 Minuten. Eine Tiefenanalyse mit vielen Daten kann bis zu 10 Minuten in Anspruch nehmen. Sie werden per E-Mail benachrichtigt, sobald Ihr Bericht fertig ist.',
  },
  {
    q: 'Kann ich mehrere Analysen vergleichen?',
    a: 'Ja, alle Ihre Berichte werden unter „Berichte" gespeichert und können jederzeit aufgerufen werden. Ein direkter Vergleich zweier Berichte ist in der Standard-Version geplant.',
  },
  {
    q: 'Was bedeuten die Sparpotenziale im Bericht?',
    a: 'Sparpotenziale sind immer als „geschätztes Potenzial" oder „mögliche Einsparung" gekennzeichnet. Sie basieren auf Branchenbenchmarks und Ihren eingegebenen Daten – keine Garantien. Die tatsächlichen Einsparungen hängen von Ihrer Umsetzung ab.',
  },
  {
    q: 'Wie kann ich mein Abonnement kündigen?',
    a: 'Sie können Ihr Abo jederzeit unter „Abo & Zahlung" kündigen. Nach der Kündigung bleibt Ihr Zugang bis zum Ende des bezahlten Zeitraums aktiv. Ihre Berichte bleiben 30 Tage nach Kündigung abrufbar.',
  },
]

const GUIDES = [
  { title: 'Erste Schritte: Ihre erste Analyse', href: '#', icon: '▶' },
  { title: 'CSV-Daten richtig vorbereiten', href: '#', icon: '📄' },
  { title: 'Kosten und Einnahmen einpflegen', href: '#', icon: '€' },
  { title: 'Bericht verstehen und nutzen', href: '#', icon: '📊' },
]

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hilfe & Support</h1>
        <p className="text-gray-500 text-sm mb-8">Antworten auf häufige Fragen und Anleitungen</p>

        {/* Quick guides */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {GUIDES.map((g) => (
            <a key={g.title} href={g.href} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
              <span className="text-xl flex-shrink-0">{g.icon}</span>
              <span className="text-sm font-medium text-gray-900">{g.title}</span>
            </a>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Häufige Fragen</h2>
        <div className="space-y-3 mb-10">
          {FAQ.map((item) => (
            <details key={item.q} className="bg-white rounded-xl border border-gray-200 shadow-sm group">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                <svg viewBox="0 0 20 20" fill="#6b7280" className="w-4 h-4 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </summary>
              <div className="px-6 pb-5 pt-1 text-sm text-gray-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-[#0D1630] rounded-xl p-6 text-white">
          <h2 className="font-semibold mb-2">Noch Fragen?</h2>
          <p className="text-white/60 text-sm mb-4">Unser Team hilft Ihnen gerne weiter.</p>
          <div className="flex gap-3">
            <a href="mailto:support@profitora.de" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
              E-Mail schreiben
            </a>
            <Link href="/impressum" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              Impressum
            </Link>
          </div>
        </div>

        <div className="mt-6 flex gap-4 text-xs text-gray-400">
          <Link href="/datenschutz" className="hover:text-gray-600">Datenschutzerklärung</Link>
          <Link href="/agb" className="hover:text-gray-600">AGB</Link>
          <Link href="/impressum" className="hover:text-gray-600">Impressum</Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
