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
            <p className="text-gray-700 leading-relaxed">
              Im Berichtszeitraum <strong>{EXAMPLE.period}</strong> erzielte das Hotel bei einer Auslastung von{' '}
              <strong>{fmtN(EXAMPLE.occupancyRate)}%</strong> einen Gesamtumsatz von{' '}
              <strong>{fmt(EXAMPLE.totalRevenue)}</strong> bei Gesamtausgaben von{' '}
              <strong>{fmt(EXAMPLE.totalExpenses)}</strong>. Das ergibt ein vorläufiges Betriebsergebnis von{' '}
              <strong className="text-green-700">{fmt(EXAMPLE.netResult)}</strong> ({fmtN(EXAMPLE.netMargin)}% Marge).
              Die KI hat <strong>4 Sparpotenziale</strong> mit einer Gesamteinsparung von geschätzt{' '}
              <strong className="text-green-700">{fmt(totalSavings)}/Monat ({fmt(totalSavings * 12)}/Jahr)</strong> identifiziert.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiBox label="Gesamtumsatz" value={fmt(EXAMPLE.totalRevenue)} good />
            <KpiBox label="Gesamtausgaben" value={fmt(EXAMPLE.totalExpenses)} />
            <KpiBox label="Betriebsergebnis" value={fmt(EXAMPLE.netResult)} good />
            <KpiBox label="Nettomarge" value={`${fmtN(EXAMPLE.netMargin)}%`} good={EXAMPLE.netMargin > 15} />
          </div>
        </section>

        {/* ─── 2. Prüfungsauftrag ─────────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            Prüfungsauftrag und Datengrundlage
          </h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-900">
            <strong>Art der Analyse:</strong> KI-gestützte betriebswirtschaftliche Wirtschaftlichkeitsanalyse (§2 WPO analog). Keine gesetzliche Abschlussprüfung nach §317 HGB. Methodik: Analytische Prüfungshandlungen nach IDW PS 312 (Soll-Ist-Vergleich, Kennzahlenanalyse, Branchenvergleich).
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
            Einnahmenanalyse
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KpiBox label="Gesamtumsatz" value={fmt(EXAMPLE.totalRevenue)} />
            <KpiBox label="Umsatz / Tag" value={fmt(EXAMPLE.totalRevenue / 31)} />
            <KpiBox label="Umsatz / belegte Nacht" value={fmt(EXAMPLE.totalRevenue / EXAMPLE.occupiedNights)} />
            <KpiBox label="Umsatz / MA-Stunde" value={`${fmtN(EXAMPLE.revenuePerEmployeeHour)} EUR`} />
          </div>
        </section>

        {/* ─── 4. Ausgabenanalyse ──────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
            Ausgabenanalyse
          </h2>
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
            Mitarbeiterzeitenanalyse
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiBox label="Gesamtstunden" value={`${EXAMPLE.employeeHours} h`} />
            <KpiBox label="Stunden / belegte Nacht" value={`${fmtN(EXAMPLE.employeeHours / EXAMPLE.occupiedNights)} h`} />
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
            Hotel-Kennzahlen
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiBox label="ADR" value={`${fmtN(EXAMPLE.adr)} EUR`} sub="Average Daily Rate" />
            <KpiBox label="RevPAR" value={`${fmtN(EXAMPLE.revpar)} EUR`} sub="Revenue per Available Room" />
            <KpiBox label="Auslastung" value={`${fmtN(EXAMPLE.occupancyRate)}%`} sub={`${EXAMPLE.occupiedNights} von ${EXAMPLE.availableNights} Nächten`} good={EXAMPLE.occupancyRate > 60} />
            <KpiBox label="Kosten / belegte Nacht" value={`${fmtN(EXAMPLE.costPerOccupiedNight)} EUR`} />
          </div>
        </section>

        {/* ─── 7. Abweichungsprotokoll ─────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
            Auffälligkeiten und Abweichungsprotokoll
          </h2>
          <p className="text-sm text-gray-500 mb-5 italic">
            Basierend auf den geprüften Daten ergaben die analytischen Prüfungshandlungen (IDW PS 312) folgende wesentliche Soll-Ist-Abweichungen:
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
            Richtwerte basieren auf Branchendurchschnittswerten für kleine Hotelbetriebe (10–80 Zimmer). Marktabhängige Kennzahlen (ADR, RevPAR) sind standortspezifisch und werden individuell bewertet.
            (Entscheidungshilfe – keine rechtsverbindliche Prüfung)
          </p>
        </section>

        {/* ─── 8. Sparpotenziale ───────────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-2 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
            Top-Sparpotenziale
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
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-green-700">~{fmt(s.saving)}</p>
                    <p className="text-xs text-gray-400">pro Monat</p>
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

        {/* ─── 9. Handlungsempfehlungen ─────────────────────────────────── */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold text-hotel-navy mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-hotel-navy text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
            Konkrete Handlungsempfehlungen
          </h2>
          <ol className="space-y-3">
            {[
              'Direktbuchungsrate erhöhen: Website-Buchungsmodul (z.B. Little Hotelier) einrichten und Stammkundenprogramm mit Direktbucher-Rabatt (5%) starten.',
              'Personalplanung überprüfen: Montag und Dienstag Schichtplanung an tatsächliche Auslastung anpassen. Bei unter 8 belegten Zimmern reduzierte Besetzung prüfen.',
              'Energieaudit beauftragen: Monatliche Energieauswertung nach Auslastung starten. Thermostat-Zeitsteuerung für unbesetzte Zimmer einrichten.',
              'Software konsolidieren: Liste aller aktiven Abos erstellen und auf Überschneidungen prüfen. Konsolidierung auf 1-2 Kerntools anstreben.',
            ].map((rec, i) => (
              <li key={i} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-6 h-6 bg-hotel-navy text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── 10. Disclaimer ───────────────────────────────────────────── */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h2 className="text-base font-bold text-amber-900 mb-4 flex items-center gap-2">
            <IconAlertTriangle className="w-5 h-5" /> 10. Rechtliche Abgrenzung und Warnhinweise
          </h2>
          <div className="text-sm text-amber-800 space-y-3 leading-relaxed">
            <p>
              <strong>Art der Analyse:</strong> Diese Analyse ist eine KI-gestützte betriebswirtschaftliche
              Wirtschaftlichkeitsauswertung. Sie orientiert sich an den Grundsätzen betriebswirtschaftlicher
              Prüfungen (§2 WPO) und ersetzt <strong>keine gesetzliche Abschlussprüfung (§317 HGB)</strong>,
              keine Steuerberatung und keine Rechtsberatung.
            </p>
            <p>
              <strong>Entscheidungshilfe:</strong> Alle Ergebnisse, Kennzahlen und Empfehlungen dienen als
              betriebswirtschaftliche Entscheidungshilfe und müssen vom Unternehmen eigenverantwortlich
              geprüft werden. Die genannten Einsparpotenziale sind Schätzwerte auf Basis der vorliegenden
              Daten – tatsächliche Einsparungen können abweichen.
            </p>
            <p>
              <strong>Methodik:</strong> Die Analyse erfolgte mittels analytischer Prüfungshandlungen
              (Soll-Ist-Vergleich, Kennzahlenanalyse, Branchenvergleich) nach IDW PS 312. Alle Aussagen
              basieren auf den hochgeladenen Daten. Es wurden keine Zahlen erfunden oder Annahmen ohne
              Datenbasis getroffen.
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
