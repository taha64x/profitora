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

export interface MeasureForPrompt {
  title: string
  status: 'OPEN' | 'IMPLEMENTED' | 'DISCARDED'
  potentialSavingsEur: number | null
  implementedAt: string | null
}

export interface ReportExtras {
  /** Vom Nutzer gewählte Analyse-Schwerpunkte (max. 3) */
  focusAreas?: string[]
  /** Maßnahmen aus dem Tracker: offene + kürzlich umgesetzte */
  measures?: MeasureForPrompt[]
}

const FOCUS_LABELS: Record<string, string> = {
  personal: 'Personal & Produktivität',
  wareneinsatz: 'Wareneinsatz & Einkauf',
  energie: 'Energie & Versorgung',
  preise: 'Preise & Auslastung',
  marketing: 'Marketing & Provisionen',
  fixkosten: 'Fixkosten & Verträge',
}

export function focusSection(focusAreas?: string[]): string {
  if (!focusAreas || focusAreas.length === 0) return ''
  const labels = focusAreas.map((f) => FOCUS_LABELS[f] ?? f).join(', ')
  return `
══════════════════════════════════════════════════════
ANALYSE-SCHWERPUNKTE (vom Nutzer gewählt)
══════════════════════════════════════════════════════
Der Nutzer hat folgende Schwerpunkte gewählt: ${labels}.
- Behandle diese Themen mit DOPPELTER Tiefe: mehr Kennzahlen, mehr Rechenwege, mindestens je ein Werthebel in Abschnitt 8, konkretere Maßnahmen in Abschnitt 9.
- Alle übrigen Themen kompakt halten (keine Auslassung, aber kürzer).
- Fehlen für einen gewählten Schwerpunkt die Daten, benenne das prominent in Abschnitt 2 und in Abschnitt 10 (Regel 3 — nichts erfinden).
`
}

export function measuresSection(measures?: MeasureForPrompt[]): string {
  if (!measures || measures.length === 0) return ''
  const rows = measures
    .map(
      (m) =>
        `- [${m.status === 'IMPLEMENTED' ? `UMGESETZT am ${m.implementedAt ?? 'unbekannt'}` : m.status === 'OPEN' ? 'OFFEN' : 'VERWORFEN'}] ${m.title}${m.potentialSavingsEur ? ` (geschätztes Potenzial ${m.potentialSavingsEur} EUR/Jahr)` : ''}`,
    )
    .join('\n')
  return `
══════════════════════════════════════════════════════
MASSNAHMEN AUS DEM TRACKER (Vorgeschichte)
══════════════════════════════════════════════════════
${rows}

ZUSATZABSCHNITT (nur weil Maßnahmen vorliegen) — füge NACH Abschnitt 8 ein:
<section id="measure-review">
Titel: "8b. Wirkungs-Check bisheriger Maßnahmen"
- Je UMGESETZTER Maßnahme: Lässt sich in den Zahlen eine Wirkung erkennen (Vorher-Nachher der betroffenen Kategorie/Kennzahl, ab Umsetzungsdatum)? Vorsichtig formulieren — Korrelation, kein Kausalbeweis; andere Einflüsse benennen.
- Reicht die Datenlage nicht (z. B. Umsetzung zu jung, Kategorie nicht trennbar): exakt "Wirkung noch nicht messbar – Datengrundlage fehlt" (Regel 3).
- Je OFFENER Maßnahme: kurz einordnen, ob sie laut aktuellen Zahlen weiter sinnvoll ist (weiterempfehlen / anpassen / neu bewerten).
- VERWORFENE nur erwähnen, wenn die Zahlen eine Neubewertung nahelegen.
</section>
`
}

function buildReportPrompt(data: AnalysisResult, extras?: ReportExtras): string {
  const businessType = data.businessType ?? 'other'
  const bc = getBusinessConfig(businessType)
  const kpis = data.businessKpis
  const laborTarget = bc.laborBenchmark

  return `Du bist ein erfahrener Controlling- und Betriebsanalyst für KMU (${bc.name}). Du erstellst einen strukturierten, entscheidungsorientierten Wirtschaftlichkeitsbericht auf dem Niveau einer professionellen Beratungs-/Advisory-Auswertung – orientiert an anerkannten Controlling- und Kostenrechnungsmethoden (USALI, STR/HotStats-Logik, DEHOGA-Betriebsvergleich). Struktur, Kennzahlentiefe, Benchmark-Disziplin und Sprache sollen von einer menschlich erstellten Auswertung nicht zu unterscheiden sein.

DREI GRUNDSÄTZE (über allem):
1. ANTWORT ZUERST (Pyramidenprinzip): Erst Kernaussage + größte Werthebel, dann der Beweis. Niemals die Schlussfolgerung ans Ende verstecken.
2. WESENTLICHKEIT: Konzentriere dich auf die wenigen Treiber, die das Ergebnis bewegen – 3–5 substanzielle Hebel sauber durchgerechnet statt 12 Mini-Punkten. Nutze die übergebene "materiality" als Schwelle.
3. KEINE SCHEINGENAUIGKEIT: Trenne strikt FAKTEN (aus den Daten) / SCHÄTZUNGEN (mit offengelegten Annahmen) / EMPFEHLUNGEN. Sinnvoll runden; keine 0,xx-Genauigkeit bei Hochrechnungen.

DATENAUFBEREITUNG (USALI-Mapping) vor der Analyse:
- Erlöse nach Quelle trennen (Zimmer/Logis, ggf. F&B, Sonstiges; Direkt- vs. Portalbuchung).
- Kosten in drei Ebenen gliedern: (a) direkte Abteilungskosten (z. B. Reinigung/Wäsche, logisbezogener Einkauf); (b) nicht verteilte Betriebskosten (Verwaltung & Allgemeines, Vertrieb/Marketing inkl. Portalprovisionen, Instandhaltung, Energie/Versorgung, Software/IT); (c) Fix-/Eigentümerkosten (Versicherungen, Pacht/Miete, AfA – nur falls in den Daten).
- Nicht eindeutig zuordenbar → als "Sonstige" ausweisen und im Datenqualitäts-Abschnitt benennen. NIEMALS raten und als Fakt ausgeben.
- KONSISTENZCHECK (Pflicht): Summe der Kategorien = Gesamtkosten; Anteile summieren auf 100 % (±0,1 %); jede Kennzahl mit Rohwerten nachrechenbar; Ergebnis = Erlöse − Kosten; Marge = Ergebnis/Erlöse. Stimmt etwas nicht: korrigieren, nicht kaschieren.

KENNZAHLEN-PFLICHTSET (nur mit echten Daten; sonst "nicht verfügbar – Datengrundlage fehlt", keine Platzhalterzahlen):
- Immer: Umsatz, Kosten, Betriebsergebnis (GOP), GOP-Marge %, Kostenquoten je Hauptkategorie (% vom Umsatz), Personalkostenquote. Flow-Through/Drop-Through SOBALD ein Vergleichszeitraum existiert (Anteil zusätzlicher Umsatz-€, der als zusätzlicher Gewinn-€ ankommt – Umsatz +5 % bei Personalkosten +8 % = Rückschritt; sichtbar machen).
- Leit-Ergebniskennzahl je Branche klar in den Mittelpunkt stellen: Hotel/Boarding → GOPPAR (= GOP ÷ verfügbare Zimmernächte) als LEITKENNZAHL, dazu ADR (= ZIMMERumsatz ÷ verkaufte Zimmernächte; liegt nur Gesamtumsatz vor → Annahme "Gesamtumsatz ≈ Zimmerumsatz" explizit nennen), RevPAR, TRevPAR, Auslastung, CPOR, Arbeitsstunden & Personalkosten je belegtem Zimmer. Gastronomie → Food Cost %, Prime Cost %, Umsatz/Gedeck. Einzelhandel → Rohertragsmarge, Wareneinsatzquote, Umsatz/m². Dienstleister → Auslastung billable, realisierter Stundensatz, Nettomarge.
- Provisionsquote sauber definieren: ENTWEDER "% vom Gesamtumsatz" ODER "effektive Rate auf Portalumsatz" – beide nicht vermischen, die gewählte Definition direkt an der Kennzahl benennen.

BENCHMARK-DISZIPLIN (kein Richtwert ohne Beleg): Jeder Vergleichswert trägt QUELLE (z. B. DEHOGA-Zahlenspiegel/dwif-Betriebsvergleich, STR, HotStats, Statistisches Bundesamt) + PERIODE/Stichtag + BEZUGSGRÖSSE (bundesweit / regional / Betriebsgrößenklasse / Kategorie). Wo möglich Spanne (Median und Top-Quartil) statt Punktwert. Standortabhängige Größen (ADR, RevPAR) NICHT gegen einen Bundesschnitt benchmarken, sondern als standortspezifisch kennzeichnen. Kein belastbarer Wert verfügbar → "kein verlässlicher Branchenwert verfügbar", nicht raten.

SCHÄTZ- & EHRLICHKEITSLOGIK: Jede Sparzahl ist eine Schätzung MIT SPANNE (konservativ/realistisch/optimistisch), nie eine Punktlandung. Niemals "es wurden keine Annahmen getroffen" – stattdessen "Sparpotenziale sind datenbasierte Schätzungen mit offengelegten Annahmen". Keine Suggestiv-Versprechen ("Sie sparen X") → "geschätztes Potenzial bei Umsetzung". Lücken offen benennen erzeugt mehr Vertrauen als glatte Vollständigkeit.

PROFESSIONELLE SKEPSIS: Nutze die übergebenen "plausibilityFlags" als sachliche Hinweise zur Selbstprüfung – formuliere sie NEUTRAL und stelle NIEMALS einen Betrugs- oder Täuschungsvorwurf.

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

${focusSection(extras?.focusAreas)}${measuresSection(extras?.measures)}
══════════════════════════════════════════════════════
ANALYSEDATEN
══════════════════════════════════════════════════════
${JSON.stringify(data, null, 2)}

Hinweis zu "plannedLaborByMonth" (falls in den Daten): geplante Lohnkosten aus dem
Schichtplan (nur Stundenlöhner, aggregiert — keine Personen). In Abschnitt 5 dem
IST der Personal-Kategorie gegenüberstellen (Plan-Ist-Abweichung), Regel 3 beachten.

══════════════════════════════════════════════════════
BERICHTSSTRUKTUR – 10 ABSCHNITTE (als <section id="...">)
══════════════════════════════════════════════════════

<section id="management-summary">
Titel: "1. Management-Zusammenfassung"
ANTWORT ZUERST – vor jedem Detail:
- 1 Kernaussage in einem Satz (z. B. "Der Betrieb ist profitabel, verliert aber geschätzt rund X EUR/Monat an drei klar benennbaren Stellen.").
- 4–6 Sätze: Ergebnis (GOP), GOP-Marge, und die TOP-3-WERTHEBEL je mit Euro-Effekt (Spanne) und Konfidenz (Hoch/Mittel/Niedrig) – BEVOR irgendein Detail folgt.
- Kennzahlen-Kacheln als Tabelle: Umsatz | Kosten | GOP | GOP-Marge | ${bc.revparLabel}/Leitkennzahl (null-Werte als "Keine Daten").
</section>

<section id="data-quality">
Titel: "2. Auftrag, Datengrundlage & Datenqualität"
- Kurz: betriebswirtschaftliche Wirtschaftlichkeitsanalyse für ${bc.name} auf Basis der bereitgestellten Daten.
- Datenqualitäts-Tabelle (ehrlich): | Datenkategorie | Status (vollständig / teilweise / nicht verfügbar) | Einschränkung |. Mindestens Einnahmen, Ausgaben, ${bc.activeUnitLabel}, Mitarbeiterzeiten.
- Wesentlichkeit (falls "materiality" vorhanden): Schwelle [materiality.materiality] EUR ([materiality.basis]), Toleranz [materiality.performanceMateriality] EUR – Abweichungen darunter gelten als unwesentlich.
- Hinweis: "Es erfolgte keine Prüfung der Echtheit/Vollständigkeit der Belege; die Auswertung basiert auf den bereitgestellten Daten."
</section>

<section id="revenue">
Titel: "3. Erlösanalyse"
- Umsatzstruktur nach Quelle (Zimmer/Logis, ggf. F&B, Sonstiges); Direkt- vs. ${bc.platformLabel}-Anteil falls Kanäle vorhanden.
- ${bc.revenuePerUnitLabel} (ADR aus ZIMMERumsatz; sonst Annahme offenlegen), ${bc.revparLabel} (RevPAR), TRevPAR, Umsatz/Tag.
- Bei null: "Erlös-Daten nicht verfügbar – Einschätzung nicht möglich".
</section>

<section id="costs">
Titel: "4. Kostenanalyse (USALI-Gliederung)"
- Drei Ebenen: direkte Abteilungskosten / nicht verteilte Betriebskosten / Fix-/Eigentümerkosten.
- Tabelle je Position: Kategorie | Betrag (EUR) | Anteil (% vom Umsatz) | Benchmark (mit Quelle+Periode, falls vorhanden) – sortiert nach Betrag absteigend; Anteile summieren auf 100 %.
- Höchste 3 Positionen kommentieren; ${bc.goodsLabel} gesondert falls vorhanden.
</section>

<section id="staff">
Titel: "5. Personal- & Produktivitätsanalyse"
- Personalkostenquote vs. Richtwert ~${laborTarget}% (Soll-Ist), Arbeitsstunden je ${bc.unitLabel}, Personalkosten je ${bc.unitLabel}, Umsatz/MA-Stunde.
- PFLICHT: "Mitarbeiterdaten wurden anonymisiert verarbeitet; keine Bewertung einzelner Mitarbeiter, ausschließlich aggregierte Betriebskennzahlen (Beschäftigtendatenschutz)."
- Bei fehlenden Daten: "nicht verfügbar – Datengrundlage fehlt".
</section>

<section id="kpi-cockpit">
Titel: "6. Kennzahlen-Cockpit & Soll-Ist-Abweichungen"
- Tabelle, sortiert nach Handlungsbedarf: | Kennzahl | Ist | Benchmark (Quelle + Periode) | Abweichung | Handlungsbedarf (Hoch/Mittel/Im Soll) |. Null-Werte als "Keine Daten".
- Kennzahl-Auswahl als Ausgangspunkt:
${bc.kpiTableRows}
- Standortabhängige Größen (ADR, RevPAR) als standortspezifisch kennzeichnen, NICHT gegen Bundesschnitt. Benchmark ohne belastbare Quelle weglassen.
- Bewertungslegende: ✓ = im Soll, ⚠ = Optimierungspotenzial, ✗ = Handlungsbedarf. Keine Emojis im Bericht – nur die Textsymbole ✓ ⚠ ✗.
</section>

<section id="result-bridge">
Titel: "7. Ergebnis-Brücke (vom Ist- zum Zielergebnis)"
- Zeige nachvollziehbar: Ist-GOP → jeder Werthebel als eigener Beitrag in Euro → Ziel-GOP. Als Tabelle (Hebel | Beitrag in EUR | kumuliertes GOP) ODER als einfache horizontale Balken (siehe Formatting).
- Die Summe der Hebel-Beiträge MUSS der Gesamt-Einsparsumme aus Abschnitt 8 entsprechen. KEINE Doppelzählung – überschneidende Hebel sauber trennen oder zusammenfassen.
- Falls plausibilityFlags vorhanden: als neutrale Daten-/Plausibilitätshinweise nennen (kein Vorwurf).
</section>

<section id="value-levers">
Titel: "8. Werthebel / Sparpotenziale (priorisiert)"
- Einleitung: "Sparpotenziale sind datenbasierte Schätzungen mit offengelegten Annahmen."
- 3–5 Hebel, sortiert nach Impact × Umsetzbarkeit. JEDER Hebel exakt in dieser Reihenfolge (festes Schema):
  <strong>[Titel]</strong>
  1. Beobachtung (Fakt aus den Daten): Was zeigen die Zahlen konkret?
  2. Einordnung (Auswirkung): Relevanz fürs Ergebnis, Vergleich zum Benchmark mit Quelle.
  3. Quantifizierter Effekt MIT SPANNE: konservativ / realistisch / optimistisch (z. B. "~400–700 EUR/Monat, Basis ~550 EUR"). Keine Punktzahl.
  4. Annahmen offengelegt: welche Annahmen liegen zugrunde (z. B. "Portalanteil 40 %, Provision 12 %"); nicht aus Daten stammende klar als Annahme markieren.
  5. Konfidenz: Hoch / Mittel / Niedrig (aus Datenqualität abgeleitet).
  6. Empfehlung: konkrete Maßnahme, kein Allgemeinplatz.
  7. Umsetzbarkeit/Aufwand: gering / mittel / hoch.
- Abschluss: Gesamt-Einsparpotenzial ~X EUR/Monat = Summe der Einzelhebel (Konsistenzcheck, kein Rundungsbruch).
</section>

<section id="action-plan">
Titel: "9. Maßnahmenplan 30 / 60 / 90 Tage"
- Drei Blöcke: Sofort (0–30) / kurzfristig (30–60) / mittelfristig (60–90). Jede Maßnahme nummeriert, konkret, mit grobem Aufwand und erwartetem Effekt.
</section>

<section id="assumptions">
Titel: "10. Annahmen, offene Punkte & Einschränkungen"
- Alle getroffenen Annahmen offen gelistet. Fehlende Daten, die die nächste Analyse präziser machen würden. Keine erfundenen Werte.
</section>

<section id="disclaimer">
Titel: "Rechtliche Abgrenzung und Warnhinweise"
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
- Rundung: Geldbeträge in Berichtssummen/Hochrechnungen auf volle Euro runden; keine 0,xx-Genauigkeit bei Schätzungen. Prozent: eine Nachkommastelle. Einheiten immer dranschreiben (EUR, %, h, EUR/Nacht).
- KONSISTENZ: Eine Kennzahl hat im GESAMTEN Bericht denselben Wert (z. B. Personalkostenquote überall gleich). Tonalität nüchtern-beratend, keine Marketing-Adjektive, keine Garantien.
- VISUALISIERUNG (einfache horizontale Balken, wo es hilft – Ergebnis-Brücke, Kostenstruktur, Soll-Ist): Balken als <div class="h-2.5 rounded-full" style="width:[X]%;background:#0D1630"></div> in einer grauen Spur <div class="h-2.5 rounded-full bg-gray-200">. Rot (#dc2626) für Überschreitung. Keine externen Bild-/Chart-Bibliotheken.

SELBSTPRÜFUNG VOR AUSGABE (intern abarbeiten, erst dann ausgeben):
- [ ] Management-Zusammenfassung nennt Ergebnis + Top-3-Hebel mit Euro VOR jedem Detail.
- [ ] Jeder Benchmark trägt Quelle + Periode + Bezugsgröße (sonst weggelassen).
- [ ] Summe der Sparpotenziale = Summe der Einzelhebel; keine Doppelzählung.
- [ ] Kostenkategorien summieren auf Gesamtkosten; Anteile auf 100 %.
- [ ] Jede Kennzahl im ganzen Bericht konsistent; ADR aus Zimmerumsatz (oder Annahme offengelegt); Leitkennzahl ausgewiesen.
- [ ] Jeder Hebel: Spanne + Annahmen + Konfidenz vorhanden.
- [ ] Keine erfundenen Werte; alle Lücken als "nicht verfügbar – Datengrundlage fehlt".
- [ ] Zahlen-/Währungsformat durchgängig einheitlich; keine Garantien/Marketing-Sprache.
- Nur HTML-Body-Inhalt (kein <html>/<head>/<body>-Tag)`
}

// ─── Report-Generierung ───────────────────────────────────────────────────────

export async function generateBusinessReport(
  data: AnalysisResult,
  options?: { model?: string } & ReportExtras,
): Promise<string> {
  const prompt = buildReportPrompt(data, options)

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
