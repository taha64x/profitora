import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { AnalysisResult } from '@/types'

const AI_PROVIDER = process.env.AI_PROVIDER || 'anthropic'

// ─── Branchenspezifische Konfigurationen für den Prompt ──────────────────────

interface BusinessConfig {
  name: string
  unitLabel: string           // z.B. "Zimmer", "Sitzplatz", "Behandlungsplatz"
  activeUnitLabel: string     // z.B. "belegte Nächte", "Gedecke", "Behandlungen"
  capacityLabel: string       // z.B. "verfügbare Zimmernächte", "Sitzplatzstunden"
  revenuePerUnitLabel: string // z.B. "ADR", "Umsatz/Gedeck", "Umsatz/Behandlung"
  revparLabel: string         // z.B. "RevPAR", "Umsatz/verfügbarem Sitzplatz"
  utilizationLabel: string    // z.B. "Zimmerauslastung", "Sitzauslastung"
  kpiTableRows: string
  laborBenchmark: number
  platformLabel: string       // z.B. "Buchungsportale", "Lieferplattformen"
  goodsLabel: string          // z.B. "Wareneinsatz", "Food Cost", "Materialkosten"
  disclaimerAddition: string
}

function getBusinessConfig(businessType: string): BusinessConfig {
  const configs: Record<string, BusinessConfig> = {
    hotel: {
      name: 'Hotel / Boardinghaus / Pension',
      unitLabel: 'Zimmer',
      activeUnitLabel: 'belegte Nächte',
      capacityLabel: 'verfügbare Zimmernächte',
      revenuePerUnitLabel: 'ADR (Ø Zimmerpreis)',
      revparLabel: 'RevPAR',
      utilizationLabel: 'Zimmerauslastung',
      kpiTableRows: `
| ADR (Ø Zimmerpreis) | [revenuePerUnit] EUR | Marktabhängig | – |
| RevPAR | [revenuePerAvailableUnit] EUR | Marktabhängig | – |
| Zimmerauslastung | [utilizationRate] % | >60 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~28 % | ✓/⚠/✗ |
| Energie / belegte Nacht | [energyCostPerUnit] EUR | <10 EUR | ✓/⚠/✗ |
| Kosten / belegte Nacht | [costPerActiveUnit] EUR | Marktabhängig | – |
| Portal-Provision | [portalCommissionRate] % | <8 % | ✓/⚠/✗ |`,
      laborBenchmark: 28,
      platformLabel: 'Buchungsportale (Booking.com, Airbnb etc.)',
      goodsLabel: 'Wäsche / Reinigungskosten',
      disclaimerAddition: 'Hotel-KPIs (ADR, RevPAR) sind betriebswirtschaftliche Richtwerte und keine verbindlichen Branchenstandards.',
    },
    restaurant: {
      name: 'Restaurant / Gastronomie',
      unitLabel: 'Sitzplatz',
      activeUnitLabel: 'Gedecke / Gäste',
      capacityLabel: 'verfügbare Sitzplatz-Einheiten',
      revenuePerUnitLabel: 'Umsatz / Gedeck (Ø)',
      revparLabel: 'Umsatz / verfügbarem Sitzplatz',
      utilizationLabel: 'Tisch-/Sitzauslastung',
      kpiTableRows: `
| Umsatz / Gedeck (Ø) | [revenuePerUnit] EUR | Marktabhängig | – |
| Sitzauslastung | [utilizationRate] % | >65 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~32 % | ✓/⚠/✗ |
| Wareneinsatz / Food Cost | [goodsCostRatio] % | ~30 % | ✓/⚠/✗ |
| Prime Cost (Personal + Waren) | [primeCostRatio] % | <65 % | ✓/⚠/✗ |
| Nettomargen | [netMarginPercent] % | 4–8 % | ✓/⚠/✗ |
| Lieferplattform-Provision | [portalCommissionRate] % | <15 % | ✓/⚠/✗ |`,
      laborBenchmark: 32,
      platformLabel: 'Lieferplattformen (Lieferando, Uber Eats etc.)',
      goodsLabel: 'Wareneinsatz / Food Cost',
      disclaimerAddition: 'Gastronomie-Benchmarks basieren auf DEHOGA-Daten und branchenüblichen Richtwerten 2024–2026.',
    },
    cafe_bakery: {
      name: 'Café / Bäckerei',
      unitLabel: 'Sitzplatz / Platz',
      activeUnitLabel: 'Kunden / Transaktionen',
      capacityLabel: 'verfügbare Kapazitätseinheiten',
      revenuePerUnitLabel: 'Umsatz / Transaktion (Ø)',
      revparLabel: 'Umsatz / verfügbarem Platz',
      utilizationLabel: 'Betriebsauslastung',
      kpiTableRows: `
| Umsatz / Transaktion (Ø) | [revenuePerUnit] EUR | Marktabhängig | – |
| Personalkostenquote | [laborCostRatio] % | ~38 % | ✓/⚠/✗ |
| Zutaten-/Rohstoffkosten | [goodsCostRatio] % | ~30 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | 5–10 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | Betriebsabhängig | – |`,
      laborBenchmark: 38,
      platformLabel: 'Lieferplattformen / Online-Bestellsysteme',
      goodsLabel: 'Rohstoff- / Zutatenkosten',
      disclaimerAddition: 'Bäckerei-/Café-Benchmarks basieren auf Betriebsvergleichsdaten des Deutschen Bäckerhandwerks.',
    },
    retail: {
      name: 'Einzelhandel / Ladengeschäft',
      unitLabel: 'Verkaufseinheit / m²',
      activeUnitLabel: 'Transaktionen / Verkäufe',
      capacityLabel: 'Verkaufskapazität',
      revenuePerUnitLabel: 'Umsatz / Transaktion (Ø Bon)',
      revparLabel: 'Umsatz / m²',
      utilizationLabel: 'Flächenproduktivität',
      kpiTableRows: `
| Ø Bon / Transaktion | [revenuePerUnit] EUR | Marktabhängig | – |
| Personalkostenquote | [laborCostRatio] % | ~14 % | ✓/⚠/✗ |
| Wareneinsatzquote | [goodsCostRatio] % | ~60 % | ✓/⚠/✗ |
| Rohertragsmarge | [grossMarginPercent] % | >40 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | 2–5 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | Betriebsabhängig | – |`,
      laborBenchmark: 14,
      platformLabel: 'Online-Marktplätze (Amazon, eBay etc.)',
      goodsLabel: 'Wareneinsatz / Einkaufskosten',
      disclaimerAddition: 'Einzelhandels-Benchmarks basieren auf HDE-Daten und branchenüblichen Rohertragswerten.',
    },
    medical: {
      name: 'Arztpraxis / Therapeut / Praxis',
      unitLabel: 'Behandlungsraum',
      activeUnitLabel: 'Behandlungen / Termine',
      capacityLabel: 'verfügbare Behandlungskapazität',
      revenuePerUnitLabel: 'Umsatz / Behandlung (Ø)',
      revparLabel: 'Umsatz / verfügbarer Kapazitätseinheit',
      utilizationLabel: 'Terminauslastung',
      kpiTableRows: `
| Umsatz / Behandlung (Ø) | [revenuePerUnit] EUR | Fachabhängig | – |
| Terminauslastung | [utilizationRate] % | >85 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~25 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | 350–450 EUR (Top-Praxen) | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | >12 % | ✓/⚠/✗ |`,
      laborBenchmark: 25,
      platformLabel: 'Online-Buchungsplattformen',
      goodsLabel: 'Material-/Verbrauchskosten',
      disclaimerAddition: 'Praxis-Benchmarks basieren auf Daten von rebmann-research.de und KBV-Betriebsvergleichen. Stark fachgruppenabhängig.',
    },
    craft: {
      name: 'Handwerk / Dienstleister',
      unitLabel: 'Mitarbeiter / Arbeitsplatz',
      activeUnitLabel: 'Auftragsstunden / Einsätze',
      capacityLabel: 'verfügbare Arbeitsstunden',
      revenuePerUnitLabel: 'Umsatz / Auftragsstunde (Ø)',
      revparLabel: 'Umsatz / verfügbarer Mitarbeiterstunde',
      utilizationLabel: 'Auslastungsgrad',
      kpiTableRows: `
| Umsatz / Auftragsstunde (Ø) | [revenuePerUnit] EUR | Betriebsabhängig | – |
| Auslastungsgrad | [utilizationRate] % | >70 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~35 % | ✓/⚠/✗ |
| Material-/Rohstoffkosten | [goodsCostRatio] % | ~30 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | >8 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | Betriebsabhängig | – |`,
      laborBenchmark: 35,
      platformLabel: 'Online-Plattformen / Vermittler',
      goodsLabel: 'Material-/Rohstoffkosten',
      disclaimerAddition: 'Handwerks-Benchmarks basieren auf Betriebsvergleichsdaten des ZDH und handwerk-magazin.de.',
    },
    fitness: {
      name: 'Fitnessstudio / Wellness',
      unitLabel: 'Platz / Mitglied',
      activeUnitLabel: 'Check-ins / Nutzungen',
      capacityLabel: 'Kapazitätseinheiten',
      revenuePerUnitLabel: 'Umsatz / Mitglied (Ø)',
      revparLabel: 'Umsatz / verfügbarem Platz',
      utilizationLabel: 'Kapazitätsauslastung',
      kpiTableRows: `
| Umsatz / Mitglied (Ø) | [revenuePerUnit] EUR | Marktabhängig | – |
| Kapazitätsauslastung | [utilizationRate] % | >70 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~30 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | >15 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | Betriebsabhängig | – |`,
      laborBenchmark: 30,
      platformLabel: 'Online-Buchungsplattformen',
      goodsLabel: 'Produkt- / Materialkosten',
      disclaimerAddition: 'Fitness-Benchmarks sind stark standort- und konzeptabhängig.',
    },
    beauty: {
      name: 'Kosmetik / Beauty-Salon',
      unitLabel: 'Behandlungsplatz',
      activeUnitLabel: 'Behandlungen / Termine',
      capacityLabel: 'verfügbare Behandlungskapazität',
      revenuePerUnitLabel: 'Umsatz / Behandlung (Ø)',
      revparLabel: 'Umsatz / verfügbarem Behandlungsplatz',
      utilizationLabel: 'Terminauslastung',
      kpiTableRows: `
| Umsatz / Behandlung (Ø) | [revenuePerUnit] EUR | Betriebsabhängig | – |
| Terminauslastung | [utilizationRate] % | >80 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~35 % | ✓/⚠/✗ |
| Produktkosten | [goodsCostRatio] % | ~12 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | >12 % | ✓/⚠/✗ |`,
      laborBenchmark: 35,
      platformLabel: 'Online-Buchungsplattformen',
      goodsLabel: 'Produkt- / Verbrauchskosten',
      disclaimerAddition: 'Beauty-Benchmarks basieren auf Branchendurchschnittswerten für Friseur- und Kosmetikbetriebe.',
    },
    consulting: {
      name: 'Beratung / Agentur',
      unitLabel: 'Mitarbeiter / Berater',
      activeUnitLabel: 'abrechenbare Stunden',
      capacityLabel: 'verfügbare Mitarbeiterstunden',
      revenuePerUnitLabel: 'Umsatz / abrechenbare Stunde (Ø Tagessatz)',
      revparLabel: 'Umsatz / verfügbarer Stunde',
      utilizationLabel: 'Auslastungsgrad (Billable Hours)',
      kpiTableRows: `
| Umsatz / abrechenb. Stunde (Ø) | [revenuePerUnit] EUR | Betriebsabhängig | – |
| Auslastungsgrad | [utilizationRate] % | >75 % | ✓/⚠/✗ |
| Personalkostenquote | [laborCostRatio] % | ~45 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | >18 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | Betriebsabhängig | – |`,
      laborBenchmark: 45,
      platformLabel: 'Online-Plattformen / Vermittler',
      goodsLabel: 'Material- / Projektkosten',
      disclaimerAddition: 'Beratungs-Benchmarks sind stark nischen- und marktabhängig.',
    },
    other: {
      name: 'Unternehmen',
      unitLabel: 'Einheit',
      activeUnitLabel: 'aktive Einheiten',
      capacityLabel: 'verfügbare Kapazität',
      revenuePerUnitLabel: 'Umsatz / aktiver Einheit',
      revparLabel: 'Umsatz / verfügbarer Einheit',
      utilizationLabel: 'Kapazitätsauslastung',
      kpiTableRows: `
| Umsatz / aktiver Einheit | [revenuePerUnit] EUR | Betriebsabhängig | – |
| Auslastung | [utilizationRate] % | Betriebsabhängig | – |
| Personalkostenquote | [laborCostRatio] % | ~30 % | ✓/⚠/✗ |
| Nettomarge | [netMarginPercent] % | >5 % | ✓/⚠/✗ |
| Umsatz / Mitarbeiterstunde | [revenuePerEmployeeHour] EUR | Betriebsabhängig | – |`,
      laborBenchmark: 30,
      platformLabel: 'Online-Plattformen / Vermittler',
      goodsLabel: 'Waren- / Materialkosten',
      disclaimerAddition: '',
    },
  }

  return configs[businessType] ?? configs['other']
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildReportPrompt(data: AnalysisResult): string {
  const businessType = data.businessType ?? 'other'
  const bc = getBusinessConfig(businessType)
  const kpis = data.businessKpis
  const laborTarget = bc.laborBenchmark

  return `Du bist ein KI-gestützter Wirtschaftlichkeitsassistent für ${bc.name}. Du arbeitest nach den Grundsätzen betriebswirtschaftlicher Prüfungen, orientiert an WPO/IDW- und ISA-Methodik – angepasst für diese Unternehmensart.

Methodische Grundhaltung (wie ein professioneller Prüfer):
- RISIKOORIENTIERT (ISA 315 / IDW PS 261): Konzentriere dich zuerst auf die risikoreichsten Bereiche dieser Branche.
- WESENTLICHKEIT (ISA 320): Bewerte Abweichungen relativ zur übergebenen Wesentlichkeitsschwelle ("materiality"). Unterhalb der Schwelle = unwesentlich.
- ANALYTISCHE PRÜFUNG (ISA 520): Soll-Ist-Vergleich gegen Branchenrichtwerte, Abweichungen erklären.
- PROFESSIONELLE SKEPSIS (ISA 240): Nutze die übergebenen "plausibilityFlags" als sachliche Hinweise zur Selbstprüfung – formuliere sie NEUTRAL und stelle NIEMALS einen Betrugs- oder Täuschungsvorwurf.

══════════════════════════════════════════════════════
UNTERNEHMENSART: ${bc.name.toUpperCase()}
══════════════════════════════════════════════════════
Einheit:         ${bc.unitLabel}
Auslastungsmaß:  ${bc.activeUnitLabel}
Kapazitätsmaß:   ${bc.capacityLabel}
Personal-Richtwert: ~${laborTarget} % der Umsätze (Branchenrichtwert)
Plattform-Typ:   ${bc.platformLabel}

══════════════════════════════════════════════════════
RECHTLICHER STATUS (ZWINGEND EINHALTEN)
══════════════════════════════════════════════════════
Diese Analyse ist:
✓ Eine KI-gestützte betriebswirtschaftliche Wirtschaftlichkeitsanalyse (§2 WPO analog)
✗ KEINE gesetzliche Abschlussprüfung nach §317 HGB
✗ KEINE Steuerberatung
✗ KEINE Rechtsberatung
Alle Ergebnisse sind betriebswirtschaftliche Entscheidungshilfen.

══════════════════════════════════════════════════════
OBLIGATORISCHE KI-ENTSCHEIDUNGSREGELN
══════════════════════════════════════════════════════
REGEL 1 – DATENBEZUG: Jede Aussage MUSS auf den vorliegenden Daten basieren.
REGEL 2 – KONJUNKTIV: "sollte", "wird empfohlen", "kann helfen" – NIEMALS "muss sofort"
REGEL 3 – FEHLENDE DATEN: Bei null/fehlend → "Daten nicht verfügbar – Einschätzung nicht möglich"
REGEL 4 – KEINE ERFINDUNGEN: Zahlen NIEMALS erfinden. Nur auf übergebenen Daten basieren.
REGEL 5 – NACHVOLLZIEHBARKEIT: Berechnungsgrundlagen immer nennen.
REGEL 6 – HAFTUNGSAUSSCHLUSS: An jede Empfehlung: "(Entscheidungshilfe – keine rechtsverbindliche Prüfung)"
REGEL 7 – WESENTLICHKEIT: Markiere Abweichungen nur dann als "wesentlich", wenn sie die übergebene Wesentlichkeitsschwelle (materiality) übersteigen. Kleinere Abweichungen als "unwesentlich" einordnen.
REGEL 8 – SKEPSIS OHNE VORWURF: plausibilityFlags sind neutrale Hinweise zur Selbstprüfung (z. B. fehlende/unvollständige Daten). NIEMALS als Betrug, Täuschung oder Schuldzuweisung formulieren.

══════════════════════════════════════════════════════
ANALYSEDATEN
══════════════════════════════════════════════════════
${JSON.stringify(data, null, 2)}

══════════════════════════════════════════════════════
BERICHTSSTRUKTUR – 10 ABSCHNITTE (als <section id="...">)
══════════════════════════════════════════════════════

<section id="management-summary">
Titel: "1. Management-Zusammenfassung"
- Beginne mit: "Basierend auf den geprüften Daten ergab die KI-Wirtschaftlichkeitsanalyse für [Unternehmensname] folgende Kernergebnisse:"
- Kompakte Tabelle: Umsatz | Ausgaben | Ergebnis | Nettomarge | ${bc.utilizationLabel} | Personalkostenquote (null-Werte als "Keine Daten")
- 2–3 wichtigste Auffälligkeiten in Kurzform
- Gesamteinsparung in EUR/Monat hervorheben (falls Sparpotenziale gefunden)
- Hinweis: "Diese Zusammenfassung basiert auf den hochgeladenen Dateien (Analysestand: [Datum])"
</section>

<section id="audit-scope">
Titel: "2. Prüfungsauftrag und Datengrundlage"
- Art der Prüfung: "Diese Analyse ist eine KI-gestützte betriebswirtschaftliche Wirtschaftlichkeitsanalyse für ein ${bc.name}. Sie ist keine gesetzliche Abschlussprüfung."
- Ausgewertete Datenkategorien: Liste welche vorhanden / fehlend sind
- Datenqualitätsbewertung als Tabelle:
  | Kategorie | Status | Hinweis |
  | Einnahmen | Vollständig / Lückenhaft / Nicht verfügbar | ... |
  | Ausgaben | ... | ... |
  | ${bc.activeUnitLabel} | ... | ... |
  | Mitarbeiterzeiten | ... | ... |
- IDW PS 312-Methode: "Die Analyse erfolgte mittels analytischer Prüfungshandlungen (Soll-Ist-Vergleich, Kennzahlenanalyse, Branchenvergleich)."
- Wesentlichkeit (falls "materiality" vorhanden): "Für diese Analyse wurde eine Wesentlichkeitsschwelle von [materiality.materiality] EUR angesetzt ([materiality.basis]); die Toleranzwesentlichkeit beträgt [materiality.performanceMateriality] EUR. Abweichungen unterhalb dieser Schwelle werden als unwesentlich behandelt." (orientiert an ISA 320 – Richtwert, kein verbindlicher Standard)
- Datenqualität entlang der Prüfungs-Aussagen (Assertions, ISA 315): bewerte je Kategorie Vollständigkeit (alle Posten erfasst?), Genauigkeit (Summen konsistent?) und Periodenabgrenzung (richtiger Zeitraum?).
- Hinweis zur Datengrundlage: "Es erfolgte keine Prüfung der Echtheit oder Vollständigkeit der zugrunde liegenden Belege; die Auswertung basiert auf den bereitgestellten Daten."
</section>

<section id="revenue-analysis">
Titel: "3. Einnahmenanalyse"
- Gesamtumsatz, Umsatz/Tag, Umsatz/Einheit (${bc.revenuePerUnitLabel})
- Falls Buchungskanäle verfügbar: Aufschlüsselung direkt vs. ${bc.platformLabel}
- Formulierung: "Basierend auf den Einnahmen-Daten ergibt sich..."
- Bei null: "Einnahmen-Daten nicht verfügbar – Einschätzung nicht möglich"
</section>

<section id="expense-analysis">
Titel: "4. Ausgabenanalyse"
- Tabelle: Kostenkategorie | Betrag (EUR) | Anteil (%) – sortiert nach Betrag absteigend
- Höchste 3 Kostenpositionen hervorheben und kommentieren
- ${bc.goodsLabel}: gesondert hervorheben falls vorhanden
- Vergleich mit branchenüblichen Werten für ${bc.name}
</section>

<section id="employee-analysis">
Titel: "5. Mitarbeiterzeitenanalyse"
- Gesamtstunden, Stunden/${bc.unitLabel}, Umsatz/MA-Stunde
- Personalkostenquote vs. Richtwert ~${laborTarget}% für ${bc.name} (Soll-Ist-Vergleich)
- PFLICHT: "Hinweis: Mitarbeiterdaten wurden für diese Analyse anonymisiert verarbeitet. Es erfolgt keine Bewertung einzelner Mitarbeiter. Die Auswertung bezieht sich ausschließlich auf aggregierte Betriebskennzahlen (Beschäftigtendatenschutz)."
- Bei fehlenden Daten: "Mitarbeiterzeiten-Daten nicht verfügbar – Personalkostenquote nicht berechenbar."
</section>

<section id="business-kpis">
Titel: "6. Branchen-Kennzahlen (KPI-Übersicht)"
Tabelle mit Soll-Ist-Vergleich (null-Werte als "Keine Daten"):
| Kennzahl | Wert | Richtwert | Bewertung |
${bc.kpiTableRows}
Bewertungslegende: ✓ = im Normbereich, ⚠ = Optimierungspotenzial, ✗ = Handlungsbedarf
Wichtig: Keine Emojis im gesamten Bericht verwenden – ausschließlich die Textsymbole ✓ ⚠ ✗ in Bewertungsspalten.
</section>

<section id="anomalies">
Titel: "7. Auffälligkeiten und Abweichungsprotokoll"
- "Die analytischen Prüfungshandlungen ergaben folgende wesentliche Abweichungen vom Sollwert:"
- Tabelle: Kennzahl | Ist-Wert | Soll-Wert | Abweichung | Handlungsbedarf (HOCH/MITTEL/NIEDRIG)
- Nur Kennzahlen mit vorhandenen Daten einbeziehen
- WESENTLICHKEIT: Abweichungen, die die Wesentlichkeitsschwelle (materiality) nicht übersteigen, ausdrücklich als "unwesentlich" kennzeichnen.
- PLAUSIBILITÄTSHINWEISE: Falls "plausibilityFlags" vorhanden sind, liste sie als gesonderten Block "Plausibilitäts- und Datenhinweise (zur Selbstprüfung)" mit Schweregrad (HOCH/MITTEL/NIEDRIG) und der jeweiligen Prüfungs-Aussage (assertion). Streng NEUTRAL formulieren – kein Betrugs-/Täuschungsvorwurf.
- Positives auch erwähnen: "Folgende Kennzahlen liegen im branchenüblichen Normbereich:"
</section>

<section id="savings-potential">
Titel: "8. Top-Sparpotenziale"
- Einleitung: "Basierend auf den geprüften Daten wurden folgende Sparpotenziale für das ${bc.name} identifiziert:"
- Für jedes Potenzial (max. 5):
  <strong>[Titel]</strong> (als fette Überschrift, ohne Emoji)
  Begründung: "Die Analyse ergab [konkrete Kennzahl/Abweichung], daher..."
  Geschätzte Einsparung: ~X.XXX EUR/Monat (~Y.YYY EUR/Jahr)
  Priorität: HOCH / MITTEL / NIEDRIG
  (Entscheidungshilfe – keine rechtsverbindliche Prüfung)
- Abschlusstabelle: Gesamteinsparung geschätzt ~X EUR/Monat
- "Diese Schätzwerte basieren auf den vorliegenden Daten und Branchenrichtwerten für ${bc.name}."
</section>

<section id="recommendations">
Titel: "9. Konkrete Handlungsempfehlungen"
- Nummerierte Liste (max. 6 Maßnahmen), angepasst für ${bc.name}
- Format: [Nr.] [Maßnahme] | Begründung | Zeitrahmen: Sofort / Kurzfristig (1–3 Monate) / Mittelfristig (3–6 Monate)
- "(Entscheidungshilfe – keine rechtsverbindliche Prüfung)" nach jeder Empfehlung
</section>

<section id="disclaimer">
Titel: "10. Rechtliche Abgrenzung und Warnhinweise"
PFLICHT – vollständiger Disclaimer:
"Diese Analyse ist eine KI-gestützte betriebswirtschaftliche Wirtschaftlichkeitsauswertung für ein ${bc.name}. Sie orientiert sich an den Grundsätzen betriebswirtschaftlicher Prüfungen (§2 WPO) und ersetzt keine gesetzliche Abschlussprüfung (§317 HGB), keine Steuerberatung und keine Rechtsberatung. Alle Ergebnisse, Kennzahlen und Empfehlungen dienen als betriebswirtschaftliche Entscheidungshilfe und müssen vom Unternehmen eigenverantwortlich geprüft werden. Die genannten Einsparpotenziale sind Schätzwerte auf Basis der vorliegenden Daten – tatsächliche Einsparungen können abweichen. Mitarbeiterdaten wurden anonymisiert verarbeitet. Es erfolgt keine Bewertung einzelner Mitarbeiter. Bei konkreten Verdachtsmomenten wird die Hinzuziehung professioneller Steuer- und Rechtsberatung empfohlen. ${bc.disclaimerAddition}"
+ DSGVO: "Datenschutz: Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse). Datenminimierung und Zweckbindung wurden beachtet."
</section>

══════════════════════════════════════════════════════
FORMATTING-REGELN (zwingend)
══════════════════════════════════════════════════════
- Eurobeträge: "1.234,56 EUR" (deutsches Format)
- Prozent: "32,3 %" (Leerzeichen vor %)
- Positive Werte / gut: <span class="text-green-600 font-medium">...</span>
- Negative Werte / Problem: <span class="text-red-600 font-medium">...</span>
- Neutral: <span class="text-gray-700">...</span>
- Tabellen: <table class="w-full text-sm border-collapse mb-4"> mit <th class="text-left py-2 px-3 bg-gray-50 font-semibold"> und <td class="py-2 px-3 border-b border-gray-100">
- Trennlinie: <hr class="my-6 border-gray-200">
- Nur HTML-Body-Inhalt (kein <html>/<head>/<body>-Tag)`
}

// ─── Report-Generierung ───────────────────────────────────────────────────────

export async function generateBusinessReport(data: AnalysisResult, options?: { model?: string }): Promise<string> {
  const prompt = buildReportPrompt(data)

  if (AI_PROVIDER === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY nicht gesetzt')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: options?.model ?? 'claude-opus-4-8',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })
    return (message.content[0] as { text: string }).text
  }

  if (AI_PROVIDER === 'openai') {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY nicht gesetzt')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })
    return response.choices[0].message.content || ''
  }

  throw new Error(`Unbekannter AI_PROVIDER: ${AI_PROVIDER}`)
}
