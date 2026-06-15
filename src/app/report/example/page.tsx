import Link from 'next/link'
import { IconAlertTriangle } from '@/components/ui/icons'

// Realistische Dummy-Daten: Boardinghotel Heidelberg, Mai 2025, 20 Zimmer
const EXAMPLE = {
  hotel: 'Boardinghotel Heidelberg (Beispiel)',
  period: 'Mai 2025',
  roomCount: 20,
  availableNights: 620,
  occupiedNights: 346,
  occupancyRate: 55.8,
  totalRevenue: 44850,
  totalExpenses: 37200,
  netResult: 7650,
  netMargin: 17.1,
  adr: 129.63,
  revpar: 72.34,
  employeeHours: 420,
  revenuePerEmployeeHour: 106.79,
  costPerOccupiedNight: 107.51,
  laborCostRatio: 32.3,
  expenses: [
    { category: 'Personal', amount: 14500, percent: 39.0 },
    { category: 'Portalprovisionen', amount: 4200, percent: 11.3 },
    { category: 'Energie (Strom, Gas, Wasser)', amount: 3800, percent: 10.2 },
    { category: 'Reinigung & Wäsche', amount: 2100, percent: 5.6 },
    { category: 'Einkauf & Material', amount: 1800, percent: 4.8 },
    { category: 'Versicherungen', amount: 1200, percent: 3.2 },
    { category: 'Software & Abos', amount: 950, percent: 2.6 },
    { category: 'Instandhaltung', amount: 850, percent: 2.3 },
    { category: 'Sonstige', amount: 7800, percent: 21.0 },
  ],
  savings: [
    {
      rank: 1,
      title: 'Direkte Buchungsstrategie ausbauen',
      desc: 'Portalprovisionen von durchschnittlich 9.4% sind überdurchschnittlich hoch. 40% der Buchungen kommen über Booking.com (12% Provision). Mehr Direktbuchungen durch eigene Website und Stammkundenprogramm senken die Provisionskosten.',
      saving: 800,
      priority: 'HOCH',
      color: 'red',
    },
    {
      rank: 2,
      title: 'Personaleinsatz bei niedriger Auslastung optimieren',
      desc: 'Personalkostenquote von 32.3% liegt über dem Branchenrichtwert von ~28%. An Wochentagen mit unter 40% Auslastung (Montag, Dienstag) sind überproportional viele Stunden erfasst. Flexibler Personaleinsatz spart Kosten.',
      saving: 650,
      priority: 'HOCH',
      color: 'red',
    },
    {
      rank: 3,
      title: 'Energieverbrauch analysieren',
      desc: 'Energiekosten von 3.800 EUR bei 55.8% Auslastung ergeben 10.98 EUR/belegte Nacht. Gerätesteuerung, Thermostat-Management und LED-Umrüstung können 10-15% reduzieren.',
      saving: 400,
      priority: 'MITTEL',
      color: 'yellow',
    },
    {
      rank: 4,
      title: 'Software-Abos konsolidieren',
      desc: 'Es wurden 950 EUR/Monat für Software erfasst. Analyse zeigt 3 Tools mit überlappenden Funktionen (Kommunikation, Planung). Konsolidierung auf 2 Tools möglich.',
      saving: 150,
      priority: 'NIEDRIG',
      color: 'green',
    },
  ],
}

const totalSavings = EXAMPLE.savings.reduce((s, x) => s + x.saving, 0)

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR'
}

function fmtN(n: number, decimals = 1) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function KpiBox({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${good === true ? 'text-green-600' : good === false ? 'text-red-600' : 'text-hotel-navy'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function ExampleReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-hotel-navy text-white px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-1">
          <span className="font-bold text-hotel-gold">Profitora</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">Beispiel-Bericht</span>
          <Link href="/register" className="btn-gold text-sm">
            Eigene Analyse starten
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Titel */}
        <div className="text-center mb-10">
          <div className="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-medium mb-3">
            BEISPIEL-BERICHT · KEINE ECHTEN DATEN
          </div>
          <h1 className="text-3xl font-bold text-hotel-navy mb-2">Wirtschaftlichkeitsanalyse</h1>
          <p className="text-gray-600 text-lg">{EXAMPLE.hotel}</p>
          <p className="text-gray-400 text-sm mt-1">Berichtszeitraum: {EXAMPLE.period} · {EXAMPLE.roomCount} Zimmer</p>
        </div>

        {/* ─── 1. Management-Zusammenfassung ──────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
            Management-Zusammenfassung
          </h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5">
            <p className="text-gray-900 font-semibold leading-relaxed mb-3">
              Der Betrieb ist mit {fmtN(EXAMPLE.netMargin)}% GOP-Marge solide profitabel – verliert aber geschätzt
              rund <span className="text-green-700">{fmt(totalSavings)}/Monat</span> an drei klar benennbaren Stellen.
            </p>
            <p className="text-sm text-gray-600 mb-3">Die größten Werthebel (Euro/Monat · Konfidenz):</p>
            <ol className="text-sm text-gray-700 space-y-1 mb-1">
              <li>1. Direktbuchungen ausbauen — <strong className="text-green-700">~650–950 €</strong> (Basis ~800) · Konfidenz mittel</li>
              <li>2. Personaleinsatz bei Schwachlast optimieren — <strong className="text-green-700">~450–800 €</strong> (Basis ~650) · Konfidenz mittel</li>
              <li>3. Energieverbrauch senken — <strong className="text-green-700">~300–550 €</strong> (Basis ~400) · Konfidenz mittel</li>
            </ol>
            <p className="text-xs text-gray-500 mt-3">
              Leitkennzahl GOPPAR (Gross Operating Profit je verfügbarer Zimmernacht): <strong>{fmtN(EXAMPLE.netResult / EXAMPLE.availableNights, 2)} EUR</strong>.
              Auslastung {fmtN(EXAMPLE.occupancyRate)}%, Umsatz {fmt(EXAMPLE.totalRevenue)}, Betriebsergebnis (GOP) {fmt(EXAMPLE.netResult)}.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiBox label="Umsatz" value={fmt(EXAMPLE.totalRevenue)} good />
            <KpiBox label="Kosten" value={fmt(EXAMPLE.totalExpenses)} />
            <KpiBox label="GOP" value={fmt(EXAMPLE.netResult)} good />
            <KpiBox label="GOP-Marge" value={`${fmtN(EXAMPLE.netMargin)} %`} good={EXAMPLE.netMargin > 15} />
            <KpiBox label="GOPPAR" value={`${fmtN(EXAMPLE.netResult / EXAMPLE.availableNights, 2)} EUR`} sub="GOP / verf. Zimmernacht" />
          </div>
        </section>

        {/* ─── 2. Prüfungsauftrag ─────────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            Auftrag, Datengrundlage &amp; Datenqualität
          </h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-900">
            <strong>Art der Analyse:</strong> KI-gestützte betriebswirtschaftliche Wirtschaftlichkeitsanalyse, orientiert an anerkannten Controlling- und Kostenrechnungsmethoden (USALI-Kostengliederung, STR/HotStats-Kennzahlenlogik, DEHOGA-Betriebsvergleich). Methodik: Soll-Ist-Vergleich, Kennzahlenanalyse und Branchenvergleich. Es erfolgte keine Prüfung der Belege; die Auswertung basiert auf den bereitgestellten Daten und ersetzt keine Abschlussprüfung, Steuer- oder Rechtsberatung.
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Datenqualität nach Kategorie</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-600 rounded-l-lg">Datenkategorie</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 rounded-r-lg">Einschränkung</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Einnahmen', status: 'Vollständig', ok: true, note: '–' },
                  { label: 'Ausgaben', status: 'Vollständig', ok: true, note: '–' },
                  { label: 'Buchungen / Belegung', status: 'Vollständig', ok: true, note: '–' },
                  { label: 'Mitarbeiterzeiten', status: 'Vollständig', ok: true, note: 'Anonymisiert verarbeitet' },
                  { label: 'Zimmerkategorien (DIRS21)', status: 'Nicht verfügbar', ok: false, note: 'ADR-Aufschlüsselung nach Zimmertyp nicht möglich' },
                  { label: 'Vormonatsdaten', status: 'Nicht verfügbar', ok: false, note: 'Monatsvergleich / Trendanalyse nicht möglich' },
                ].map((d) => (
                  <tr key={d.label} className="border-b border-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.label}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.ok ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.ok ? '✓' : '○'} {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic">
            Datenminimierung (DSGVO Art. 5): Es wurden ausschließlich die für die Wirtschaftlichkeitsanalyse notwendigen Daten verarbeitet.
          </p>
        </section>

        {/* ─── 3. Einnahmenanalyse ──────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
            Erlösanalyse
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KpiBox label="ADR" value={`${fmtN(EXAMPLE.adr)} EUR`} sub="Ø Zimmerpreis (verkaufte Nächte)" />
            <KpiBox label="RevPAR" value={`${fmtN(EXAMPLE.revpar)} EUR`} sub="Zimmerumsatz / verf. Nacht" />
            <KpiBox label="TRevPAR" value={`${fmtN(EXAMPLE.totalRevenue / EXAMPLE.availableNights, 2)} EUR`} sub="Gesamtumsatz / verf. Nacht" />
            <KpiBox label="Umsatz / Tag" value={fmt(EXAMPLE.totalRevenue / 31)} />
          </div>
          <p className="text-xs text-gray-400 italic">
            Annahme: Da keine getrennten Nebenerlöse (F&amp;B) erfasst sind, wird „Gesamtumsatz ≈ Zimmerumsatz" angenommen –
            ADR und RevPAR sind entsprechend zu lesen. Direkt- vs. Portalbuchungsanteil siehe Werthebel.
            Marktabhängige Größen (ADR, RevPAR) sind standortspezifisch.
          </p>
        </section>

        {/* ─── 4. Ausgabenanalyse ──────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
            Kostenanalyse (USALI-Gliederung)
          </h2>
          <p className="text-xs text-gray-400 italic mb-4">
            Gliederung nach USALI-Logik: direkte Abteilungskosten (Reinigung/Wäsche), nicht verteilte Betriebskosten
            (Vertrieb/Portalprovisionen, Energie, Verwaltung, Software) und Fixkosten (Versicherungen). Anteile in % vom Umsatz.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 rounded-l-lg">Kategorie</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Betrag</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right rounded-r-lg">Anteil</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE.expenses.map((e) => (
                  <tr key={e.category} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-gray-800">{e.category}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-hotel-navy rounded-full h-1.5"
                            style={{ width: `${e.percent}%` }}
                          />
                        </div>
                        <span className="text-gray-600 w-10 text-right">{fmtN(e.percent)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 rounded-l-lg">Gesamt</td>
                  <td className="px-4 py-3 text-right">{fmt(EXAMPLE.totalExpenses)}</td>
                  <td className="px-4 py-3 text-right rounded-r-lg">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 5. Mitarbeiterzeiten ──────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
            Personal- &amp; Produktivitätsanalyse
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiBox label="Gesamtstunden" value={`${EXAMPLE.employeeHours} h`} />
            <KpiBox label="Stunden / belegte Nacht" value={`${fmtN(EXAMPLE.employeeHours / EXAMPLE.occupiedNights)} h`} />
            <KpiBox label="Personalkosten / belegte Nacht" value={`${fmtN(14500 / EXAMPLE.occupiedNights, 2)} EUR`} />
            <KpiBox label="Umsatz / MA-Stunde" value={`${fmtN(EXAMPLE.revenuePerEmployeeHour)} EUR`} good />
            <KpiBox label="Personalkostenquote" value={`${fmtN(EXAMPLE.laborCostRatio)}%`} good={EXAMPLE.laborCostRatio < 28} />
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Hinweis: Mitarbeiternamen wurden für die Analyse anonymisiert. Es werden keine individuellen
            Leistungsbewertungen einzelner Mitarbeiter vorgenommen.
          </p>
        </section>

        {/* ─── 6. Hotel-Kennzahlen ──────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
            Hotel-Kennzahlen (Leitkennzahl: GOPPAR)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiBox label="GOPPAR" value={`${fmtN(EXAMPLE.netResult / EXAMPLE.availableNights, 2)} EUR`} sub="Leitkennzahl: GOP / verf. Nacht" good />
            <KpiBox label="ADR" value={`${fmtN(EXAMPLE.adr)} EUR`} sub="Average Daily Rate" />
            <KpiBox label="RevPAR" value={`${fmtN(EXAMPLE.revpar)} EUR`} sub="Revenue per Available Room" />
            <KpiBox label="Auslastung" value={`${fmtN(EXAMPLE.occupancyRate)}%`} sub={`${EXAMPLE.occupiedNights} / ${EXAMPLE.availableNights} Nächte`} good={EXAMPLE.occupancyRate > 60} />
            <KpiBox label="CPOR" value={`${fmtN(EXAMPLE.costPerOccupiedNight)} EUR`} sub="Kosten / belegte Nacht" />
          </div>
        </section>

        {/* ─── 7. Abweichungsprotokoll ─────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
            Kennzahlen-Cockpit &amp; Soll-Ist-Abweichungen
          </h2>
          <p className="text-sm text-gray-500 mb-5 italic">
            Soll-Ist-Vergleich gegen Branchenrichtwerte, sortiert nach Handlungsbedarf:
          </p>
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-600 rounded-l-lg">Kennzahl</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">Ist-Wert</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">Richtwert</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">Abweichung</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 rounded-r-lg">Handlungsbedarf</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { kpi: 'Personalkostenquote', ist: '32,3 %', soll: '~28 %', diff: '+4,3 %', prio: 'HOCH', red: true },
                  { kpi: 'Portalprovision (Ø)', ist: '9,4 %', soll: '<8 %', diff: '+1,4 %', prio: 'HOCH', red: true },
                  { kpi: 'Energie / belegte Nacht', ist: '10,98 EUR', soll: '<10 EUR', diff: '+0,98 EUR', prio: 'MITTEL', red: true },
                  { kpi: 'Auslastung', ist: '55,8 %', soll: '>60 %', diff: '-4,2 %', prio: 'MITTEL', red: true },
                  { kpi: 'Reinigung / belegte Nacht', ist: '6,07 EUR', soll: '<8 EUR', diff: '-1,93 EUR', prio: '–', red: false },
                  { kpi: 'Umsatz / MA-Stunde', ist: '106,79 EUR', soll: '>80 EUR', diff: '+26,79 EUR', prio: '–', red: false },
                ].map((row) => (
                  <tr key={row.kpi} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.kpi}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${row.red ? 'text-red-600' : 'text-green-600'}`}>{row.ist}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{row.soll}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${row.red ? 'text-red-600' : 'text-green-600'}`}>{row.diff}</td>
                    <td className="px-4 py-2.5">
                      {row.prio !== '–' ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.prio === 'HOCH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {row.prio}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Im Soll</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic">
            Quellen der Richtwerte: DEHOGA-Zahlenspiegel &amp; dwif-Betriebsvergleich (2025), Bezugsgröße kleine Hotelbetriebe
            10–80 Zimmer, bundesweit (Median). Marktabhängige Kennzahlen (ADR, RevPAR) sind standortspezifisch und werden
            nicht gegen den Bundesschnitt bewertet. Richtwerte ohne belastbare Quelle werden nicht ausgewiesen.
            (Entscheidungshilfe – keine rechtsverbindliche Prüfung)
          </p>
        </section>

        {/* ─── Ergebnis-Brücke ──────────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-1 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
            Ergebnis-Brücke (Ist-GOP → Ziel-GOP)
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Vom heutigen Betriebsergebnis zum Zielergebnis – jeder Werthebel als eigener Beitrag. Summe der Hebel = Gesamtpotenzial (keine Doppelzählung).
          </p>
          {(() => {
            const base = EXAMPLE.netResult
            const target = base + totalSavings
            const steps = [
              { label: 'Ist-GOP', value: base, add: false },
              { label: '+ Direktbuchungen ausbauen', value: 800, add: true },
              { label: '+ Personaleinsatz optimieren', value: 650, add: true },
              { label: '+ Energieverbrauch senken', value: 400, add: true },
              { label: '+ Software-Abos bündeln', value: 150, add: true },
              { label: 'Ziel-GOP', value: target, add: false },
            ]
            return (
              <div className="space-y-2">
                {steps.map((s) => {
                  const display = s.add
                    ? base + steps.filter((x) => x.add && steps.indexOf(x) <= steps.indexOf(s)).reduce((a, b) => a + b.value, 0)
                    : s.value
                  const pct = Math.min(100, (display / target) * 100)
                  const isTotal = !s.add
                  return (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className={`text-sm w-52 shrink-0 ${isTotal ? 'font-bold text-hotel-navy' : 'text-gray-700'}`}>{s.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${isTotal ? 'bg-hotel-navy' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-sm w-28 text-right ${isTotal ? 'font-bold text-hotel-navy' : 'text-green-700 font-medium'}`}>
                        {s.add ? '+' : ''}{fmt(s.value)}
                      </span>
                    </div>
                  )
                })}
                <p className="text-xs text-gray-400 pt-2">
                  GOP-Marge steigt rechnerisch von {fmtN(EXAMPLE.netMargin)}% auf ~{fmtN((target / EXAMPLE.totalRevenue) * 100)}%
                  (geschätztes Potenzial bei Umsetzung; Beträge gerundet).
                </p>
              </div>
            )
          })()}
        </section>

        {/* ─── 9. Sparpotenziale ───────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-2 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
            Werthebel / Sparpotenziale (priorisiert)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Geschätzte Gesamteinsparung:{' '}
            <strong className="text-green-600">{fmt(totalSavings)}/Monat · {fmt(totalSavings * 12)}/Jahr</strong>
          </p>
          <div className="space-y-4">
            {EXAMPLE.savings.map((s) => (
              <div
                key={s.rank}
                className={`rounded-xl p-5 border ${
                  s.color === 'red'
                    ? 'bg-red-50 border-red-100'
                    : s.color === 'yellow'
                    ? 'bg-yellow-50 border-yellow-100'
                    : 'bg-green-50 border-green-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                        #{s.rank}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Geschätztes Potenzial: ~{Math.round((s.saving * 0.7) / 10) * 10}–{Math.round((s.saving * 1.3) / 10) * 10} EUR/Monat
                      (Basis ~{s.saving} EUR) · Konfidenz: mittel · Umsetzbarkeit: {s.rank <= 2 ? 'mittel' : 'gering'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-green-700">~{fmt(s.saving)}</p>
                    <p className="text-xs text-gray-400">pro Monat (Basis)</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                        s.priority === 'HOCH'
                          ? 'bg-red-100 text-red-700'
                          : s.priority === 'MITTEL'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {s.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 10. Maßnahmenplan 30/60/90 ───────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">10</span>
            Maßnahmenplan 30 / 60 / 90 Tage
          </h2>
          <ol className="space-y-3">
            {[
              { frist: '0–30 Tage', rec: 'Personalplanung anpassen: Montag/Dienstag-Schichten an die tatsächliche Auslastung koppeln; bei unter 8 belegten Zimmern reduzierte Besetzung prüfen. Aufwand gering.' },
              { frist: '0–30 Tage', rec: 'Software-Abos sichten: Liste aller aktiven Tools erstellen, Überschneidungen identifizieren, auf 1–2 Kerntools konsolidieren. Aufwand gering.' },
              { frist: '30–60 Tage', rec: 'Direktbuchungen ausbauen: eigenes Buchungsmodul einrichten und Stammkundenprogramm mit Direktbucher-Vorteil (z. B. 5 %) starten, um die Portalprovisionsquote zu senken. Aufwand mittel.' },
              { frist: '60–90 Tage', rec: 'Energieauswertung & -optimierung: monatliche Verbrauchsauswertung nach Auslastung, Thermostat-Zeitsteuerung für unbelegte Zimmer, LED-Umrüstung prüfen. Aufwand mittel.' },
            ].map((m, i) => (
              <li key={i} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-6 h-6 bg-hotel-navy text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-hotel-navy/10 text-hotel-navy mr-2">{m.frist}</span>
                  <span className="text-sm text-gray-700 leading-relaxed">{m.rec}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── 11. Annahmen & Einschränkungen ───────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">11</span>
            Annahmen, offene Punkte &amp; Einschränkungen
          </h2>
          <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
            <li>Gesamtumsatz ≈ Zimmerumsatz angenommen (keine getrennten Nebenerlöse erfasst) – ADR/RevPAR entsprechend zu lesen.</li>
            <li>Sparpotenziale sind datenbasierte Schätzungen mit Spanne; Portalanteil ~40 % / Provision ~12 % als Annahme zugrunde gelegt.</li>
            <li>Kein Vormonatsvergleich vorhanden → keine Trend-/Flow-Through-Aussage möglich. Zimmerkategorien (DIRS21) fehlen → keine ADR-Aufschlüsselung nach Zimmertyp.</li>
            <li>Eine Folgeanalyse mit Vergleichszeitraum und getrennten Erlösarten erhöht die Präzision deutlich.</li>
          </ul>
        </section>

        {/* ─── 10. Disclaimer ───────────────────────────────────────────── */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h2 className="text-base font-bold text-amber-900 mb-4 flex items-center gap-2">
            <IconAlertTriangle className="w-5 h-5" /> Rechtliche Abgrenzung und Warnhinweise
          </h2>
          <div className="text-sm text-amber-800 space-y-3 leading-relaxed">
            <p>
              <strong>Art der Analyse:</strong> Diese Analyse ist eine KI-gestützte betriebswirtschaftliche
              Wirtschaftlichkeitsauswertung, orientiert an anerkannten Controlling- und Kostenrechnungsmethoden
              (USALI, DEHOGA-Betriebsvergleich). Sie ersetzt <strong>keine gesetzliche Abschlussprüfung (§317 HGB)</strong>,
              keine Steuerberatung und keine Rechtsberatung.
            </p>
            <p>
              <strong>Entscheidungshilfe:</strong> Alle Ergebnisse, Kennzahlen und Empfehlungen dienen als
              betriebswirtschaftliche Entscheidungshilfe und müssen vom Unternehmen eigenverantwortlich
              geprüft werden. Die genannten Einsparpotenziale sind Schätzwerte auf Basis der vorliegenden
              Daten – tatsächliche Einsparungen können abweichen.
            </p>
            <p>
              <strong>Methodik:</strong> Soll-Ist-Vergleich, Kennzahlenanalyse und Branchenvergleich
              (USALI-Kostengliederung, GOPPAR-Logik). Alle Kennzahlen basieren auf den hochgeladenen Daten;
              Sparpotenziale sind datenbasierte Schätzungen mit offengelegten Annahmen.
            </p>
            <div className="pt-2 border-t border-amber-200">
              <p className="text-xs text-amber-700 font-medium mb-1">Datenschutz (DSGVO)</p>
              <p className="text-xs text-amber-700">
                Mitarbeiterdaten wurden anonymisiert verarbeitet. Es erfolgt keine Bewertung einzelner
                Mitarbeiter (Beschäftigtendatenschutz). Verarbeitungsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes betriebliches Interesse). Datenminimierung und Zweckbindung (Art. 5 DSGVO)
                wurden beachtet.
              </p>
            </div>
            <p className="text-xs text-amber-600 italic">
              Bei konkreten Verdachtsmomenten oder rechtlich relevanten Feststellungen wird die Hinzuziehung
              qualifizierter Steuer- und Rechtsberatung empfohlen.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Möchten Sie Ihre echten Daten analysieren?
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Laden Sie Ihre CSV/Excel-Dateien hoch – in unter 5 Minuten haben Sie Ihren persönlichen Bericht.
          </p>
          <Link href="/register" className="btn-gold text-base px-8 py-4 rounded-xl">
            Jetzt kostenlos starten →
          </Link>
        </div>
      </div>
    </div>
  )
}
