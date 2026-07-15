import Link from 'next/link'
import { COMPANY } from '@/lib/company'

export const metadata = { title: 'Widerrufsbelehrung – Profitora' }

export default function WiderrufPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Widerrufsbelehrung</h1>
        <p className="text-gray-500 text-sm mb-8">Stand: Juli 2026</p>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-8 text-sm text-gray-700">

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">Geltung</h2>
            <p className="leading-relaxed">
              Das gesetzliche Widerrufsrecht steht ausschließlich <strong>Verbrauchern</strong> im Sinne des § 13 BGB zu.
              Unternehmern im Sinne des § 14 BGB (z. B. Hotels und gewerbliche Betriebe) steht kein gesetzliches
              Widerrufsrecht zu.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">Widerrufsrecht</h2>
            <p className="leading-relaxed">
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
            </p>
            <p className="leading-relaxed mt-3">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
            </p>
            <p className="leading-relaxed mt-2 pl-4 border-l-2 border-gray-200">
              {COMPANY.legalName}<br/>
              {COMPANY.street}<br/>
              {COMPANY.city}<br/>
              E-Mail: <a href={`mailto:${COMPANY.email}`} className="text-[#0D1630] hover:underline">{COMPANY.email}</a>
            </p>
            <p className="leading-relaxed mt-3">
              mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren
              Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das untenstehende
              Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist
              reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
              absenden.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">Folgen des Widerrufs</h2>
            <p className="leading-relaxed">
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben,
              unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
              Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
            </p>
            <p className="leading-relaxed mt-3">
              <strong>Besonderheit bei Abonnements (Dienstleistungen):</strong> Haben Sie verlangt, dass die
              Bereitstellung des Abonnements während der Widerrufsfrist beginnt (Zustimmung im Bestellvorgang), so
              zahlen Sie uns im Widerrufsfall einen angemessenen Betrag, der dem Anteil der bis zum Widerruf bereits
              erbrachten Leistung im Vergleich zum Gesamtumfang des Vertrags entspricht (§ 357a BGB). Beginnt das
              Abonnement mit einem kostenlosen Testzeitraum, fällt für die Zeit bis zur ersten Abbuchung kein
              Wertersatz an.
            </p>
          </section>

          <section>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h2 className="font-semibold text-amber-900 mb-2 text-base">Vorzeitiges Erlöschen des Widerrufsrechts</h2>
              <p className="leading-relaxed text-amber-800">
                Bei einem Vertrag über die Erbringung digitaler Inhalte bzw. Dienstleistungen erlischt das
                Widerrufsrecht, wenn wir mit der Ausführung des Vertrags begonnen haben, nachdem Sie
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 leading-relaxed text-amber-800">
                <li>ausdrücklich zugestimmt haben, dass wir mit der Ausführung vor Ablauf der Widerrufsfrist beginnen, und</li>
                <li>Ihre Kenntnis davon bestätigt haben, dass Sie durch diese Zustimmung mit Beginn der Ausführung Ihr Widerrufsrecht verlieren (§ 356 Abs. 4 und 5 BGB).</li>
              </ul>
              <p className="leading-relaxed text-amber-800 mt-2">
                Diese Zustimmung holen wir vor dem Kauf im Bestellvorgang ein. Die KI-Analyse wird unmittelbar
                nach dem Kauf bereitgestellt; das Widerrufsrecht erlischt entsprechend mit Beginn der Ausführung.
                Bei Abonnements erlischt das Widerrufsrecht mit vollständiger Erbringung der Leistung; bis dahin gilt
                bei Widerruf die oben beschriebene Wertersatzpflicht.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-3 text-base">Muster-Widerrufsformular</h2>
            <p className="leading-relaxed mb-3 text-gray-500">
              (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden es zurück.)
            </p>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl leading-relaxed">
              An {COMPANY.legalName}, {COMPANY.street}, {COMPANY.city}, {COMPANY.email}:<br/><br/>
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden
              Dienstleistung (*):<br/><br/>
              _______________________________________________<br/><br/>
              Bestellt am (*) / erhalten am (*): _____________________<br/><br/>
              Name des/der Verbraucher(s): _____________________<br/><br/>
              Anschrift des/der Verbraucher(s): _____________________<br/><br/>
              Datum: _____________________<br/><br/>
              (*) Unzutreffendes streichen.
            </div>
          </section>

        </div>

        <div className="flex gap-4 mt-8 text-xs text-gray-400">
          <Link href="/impressum" className="hover:text-gray-600">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-gray-600">Datenschutzerklärung</Link>
          <Link href="/agb" className="hover:text-gray-600">AGB</Link>
        </div>
      </div>
    </div>
  )
}
