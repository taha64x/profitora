// ─── Upload-Kategorien ────────────────────────────────────────────────────────

export type UploadCategory =
  | 'EMPLOYEE_HOURS'
  | 'REVENUE'
  | 'EXPENSES'
  | 'BOOKINGS'
  | 'ROOM_CATEGORIES'
  | 'OTHER'

export const UPLOAD_CATEGORY_LABELS: Record<UploadCategory, string> = {
  EMPLOYEE_HOURS:  'Mitarbeiterzeiten',
  REVENUE:         'Einnahmen / Umsatz',
  EXPENSES:        'Ausgaben / Kosten',
  BOOKINGS:        'Auslastung / Transaktionen',
  ROOM_CATEGORIES: 'Einheitenkategorien / Preise',
  OTHER:           'Sonstiges',
}

// Dynamische Labels je Unternehmensart
export function getUploadCategoryLabels(businessType: string): Record<UploadCategory, string> {
  const overrides: Partial<Record<string, Partial<Record<UploadCategory, string>>>> = {
    hotel: {
      BOOKINGS:        'Buchungen / Belegung',
      ROOM_CATEGORIES: 'Zimmerkategorien / Preise',
    },
    restaurant: {
      BOOKINGS:        'Tischreservierungen / Gedecke',
      ROOM_CATEGORIES: 'Speisekarte / Warengruppen',
    },
    cafe_bakery: {
      BOOKINGS:        'Tagesfrequenz / Kundenanzahl',
      ROOM_CATEGORIES: 'Produktgruppen / Sortiment',
    },
    retail: {
      BOOKINGS:        'Verkaufsdaten / Kassenberichte',
      ROOM_CATEGORIES: 'Produktkategorien / Warengruppen',
    },
    medical: {
      BOOKINGS:        'Terminauslastung / Patientenzahlen',
      ROOM_CATEGORIES: 'Leistungsarten / Behandlungskategorien',
    },
    craft: {
      BOOKINGS:        'Auftragsübersicht / Auslastung',
      ROOM_CATEGORIES: 'Leistungsarten / Materialgruppen',
    },
    fitness: {
      BOOKINGS:        'Mitglieder / Kursauslastung',
      ROOM_CATEGORIES: 'Kursarten / Mitgliedschaftstypen',
    },
    beauty: {
      BOOKINGS:        'Terminauslastung / Behandlungen',
      ROOM_CATEGORIES: 'Behandlungsarten / Produktgruppen',
    },
    consulting: {
      BOOKINGS:        'Projektzeiten / Auftragsübersicht',
      ROOM_CATEGORIES: 'Leistungsarten / Projekttypen',
    },
  }
  return { ...UPLOAD_CATEGORY_LABELS, ...(overrides[businessType] ?? {}) }
}

// ─── Business-Typen ───────────────────────────────────────────────────────────

export interface BusinessTypeConfig {
  value: string
  label: string
  unitLabel: string
  unitHint: string
  description: string
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    value: 'hotel',
    label: 'Hotel / Boardinghaus / Pension',
    unitLabel: 'Zimmeranzahl',
    unitHint: 'z.B. 20',
    description: 'Hotels, Boardinghäuser, Pensionen, Ferienwohnungen',
  },
  {
    value: 'restaurant',
    label: 'Restaurant / Gastronomie',
    unitLabel: 'Sitzplätze',
    unitHint: 'z.B. 60',
    description: 'Restaurants, Gaststätten, Kantinen, Bistros',
  },
  {
    value: 'cafe_bakery',
    label: 'Café / Bäckerei',
    unitLabel: 'Sitzplätze / Plätze',
    unitHint: 'z.B. 30 (optional)',
    description: 'Cafés, Bäckereien, Konditoreien, Imbisse',
  },
  {
    value: 'retail',
    label: 'Einzelhandel / Ladengeschäft',
    unitLabel: 'Verkaufsfläche (m²)',
    unitHint: 'z.B. 200',
    description: 'Einzelhandel, Ladengeschäfte, Onlineshops, Kioske',
  },
  {
    value: 'medical',
    label: 'Arztpraxis / Therapeut / Praxis',
    unitLabel: 'Behandlungsräume',
    unitHint: 'z.B. 3',
    description: 'Arztpraxen, Physiotherapeuten, Psychologen, Zahnarzt',
  },
  {
    value: 'craft',
    label: 'Handwerk / Dienstleister',
    unitLabel: 'Mitarbeiter (Anzahl)',
    unitHint: 'z.B. 5 (optional)',
    description: 'Handwerksbetriebe, Dienstleister, Installateure, Maler',
  },
  {
    value: 'fitness',
    label: 'Fitnessstudio / Wellness',
    unitLabel: 'Kapazität (Plätze / Mitglieder)',
    unitHint: 'z.B. 200 (optional)',
    description: 'Fitnessstudios, Wellnesszentren, Yogastudios, Schwimmbäder',
  },
  {
    value: 'beauty',
    label: 'Kosmetik / Beauty-Salon',
    unitLabel: 'Behandlungsplätze',
    unitHint: 'z.B. 4',
    description: 'Friseursalons, Kosmetikstudios, Nagelstudios, Massagepraxen',
  },
  {
    value: 'consulting',
    label: 'Beratung / Agentur',
    unitLabel: 'Mitarbeiter (Anzahl)',
    unitHint: 'z.B. 8',
    description: 'Unternehmensberatung, Agenturen, Anwaltskanzleien, Steuerberater',
  },
  {
    value: 'other',
    label: 'Sonstiges Unternehmen',
    unitLabel: 'Einheiten / Kapazität',
    unitHint: 'optional',
    description: 'Andere Unternehmensarten – universelle Analyse',
  },
]

export function getBusinessTypeConfig(value: string): BusinessTypeConfig {
  return BUSINESS_TYPES.find((b) => b.value === value) ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1]
}

// ─── Analyse-Status ───────────────────────────────────────────────────────────

export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: string
  email: string
  organizationId?: string
}

// ─── KPIs (universal für alle Unternehmensarten) ─────────────────────────────

export interface BusinessKpis {
  businessType: string

  // Umsatz
  totalRevenue: number | null
  revenuePerDay: number | null

  // Ausgaben
  totalExpenses: number | null
  expensesByCategory: Record<string, number>

  // Ergebnis
  netResult: number | null
  netMarginPercent: number | null

  // Kapazität / Auslastung (Zimmer, Gedecke, Behandlungen, etc.)
  utilizationRate: number | null
  activeUnits: number | null
  availableCapacity: number | null
  unusedCapacity: number | null

  // Einheitskennzahlen (ADR/RevPAR-Äquivalente)
  revenuePerUnit: number | null           // Umsatz pro aktiver Einheit (wie ADR)
  revenuePerAvailableUnit: number | null  // Umsatz pro verfügbarer Einheit (wie RevPAR)
  costPerActiveUnit: number | null

  // Personal
  laborCostRatio: number | null
  totalEmployeeHours: number | null
  hoursPerUnit: number | null
  revenuePerEmployeeHour: number | null

  // Energie & Services
  energyCostPerUnit: number | null
  serviceCostPerUnit: number | null

  // Portal / Plattform-Provisionen
  portalCommissions: number | null
  portalCommissionRate: number | null

  // Waren- / Materialkosten
  goodsCostRatio: number | null
  grossMargin: number | null
  grossMarginPercent: number | null
  primeCostRatio: number | null

  // Branchenbenchmarks (aus Python mitgeliefert)
  benchmarks: Record<string, { target: number; warning: number; critical: number }>
}

export interface SavingsPotential {
  title: string
  description: string
  estimatedSavingsEur: number | null
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
}

export interface AnalysisResult {
  analyzedAt: string
  businessType: string
  businessName?: string
  businessKpis: BusinessKpis
  savingsPotential: SavingsPotential[]
  missingData: string[]
  warnings: string[]
  expenseBreakdown: Array<{ category: string; amount: number; percent: number }>
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ─── Analyse-Konfigurator ─────────────────────────────────────────────────────

export type AnalysisType =
  | 'kosten'
  | 'mitarbeiter'
  | 'buchhaltung'
  | 'prozess'
  | 'branche'
  | 'komplett'

export type AccuracyLevel = 'schnellcheck' | 'standard' | 'tiefenanalyse' | 'komplett'
export type InputMethod = 'upload' | 'questionnaire' | 'hybrid'

export type AnalysisGoal =
  | 'kosten_senken'
  | 'gewinn_steigern'
  | 'personal_optimieren'
  | 'prozesse_verbessern'
  | 'risiken_erkennen'
  | 'alles_pruefen'

export interface AnalysisTypeConfig {
  value: AnalysisType
  label: string
  description: string
}

export const ANALYSIS_TYPES: AnalysisTypeConfig[] = [
  {
    value: 'kosten',
    label: 'Kostenanalyse',
    description: 'Erkennt unnötige Ausgaben, teure Fixkosten, wiederkehrende Kosten und mögliche Einsparungen.',
  },
  {
    value: 'mitarbeiter',
    label: 'Mitarbeiteranalyse',
    description: 'Prüft Aufgaben, Arbeitszeiten, Personalkosten und mögliche Verbesserungen in der Aufgabenverteilung.',
  },
  {
    value: 'buchhaltung',
    label: 'Buchhaltungsanalyse',
    description: 'Analysiert Einnahmen, Ausgaben, Margen, Zahlungsflüsse und Auffälligkeiten in Tabellen.',
  },
  {
    value: 'prozess',
    label: 'Prozessanalyse',
    description: 'Findet manuelle Arbeitsschritte, Zeitverluste, Doppelarbeit und Automatisierungsmöglichkeiten.',
  },
  {
    value: 'branche',
    label: 'Branchenvergleich',
    description: 'Vergleicht Unternehmensdaten mit aktuellen Brancheninformationen und typischen Kostenstrukturen.',
  },
  {
    value: 'komplett',
    label: 'Komplettanalyse',
    description: 'Kombiniert alle Bereiche zu einem vollständigen Optimierungsbericht mit Prioritätenplan.',
  },
]

export interface AccuracyConfig {
  value: AccuracyLevel
  label: string
  description: string
  tag: string
}

export const ACCURACY_LEVELS: AccuracyConfig[] = [
  {
    value: 'schnellcheck',
    label: 'Schnellcheck',
    description: 'Erster strukturierter Überblick über Kostenstruktur und offensichtliche Einsparpotenziale.',
    tag: 'Basisauswertung',
  },
  {
    value: 'standard',
    label: 'Standardanalyse',
    description: 'Solide betriebswirtschaftliche Auswertung mit konkretem Maßnahmenplan und Benchmarkvergleich.',
    tag: 'Empfohlen',
  },
  {
    value: 'tiefenanalyse',
    label: 'Tiefenanalyse',
    description: 'Detaillierte Kosten- und Prozessprüfung mit vollständigem Branchenvergleich und 30/60/90-Tage-Plan.',
    tag: 'Detailliert',
  },
  {
    value: 'komplett',
    label: 'Komplettanalyse',
    description: 'Vollständige KI-gestützte Unternehmensanalyse aller Bereiche mit persönlichem Reviewing.',
    tag: 'Maximal',
  },
]

export interface AnalysisGoalConfig {
  value: AnalysisGoal
  label: string
}

export const ANALYSIS_GOALS: AnalysisGoalConfig[] = [
  { value: 'kosten_senken',       label: 'Kosten senken' },
  { value: 'gewinn_steigern',     label: 'Gewinn steigern' },
  { value: 'personal_optimieren', label: 'Personal effizienter einsetzen' },
  { value: 'prozesse_verbessern', label: 'Prozesse vereinfachen' },
  { value: 'risiken_erkennen',    label: 'Risiken erkennen' },
  { value: 'alles_pruefen',       label: 'Alles prüfen' },
]

// ─── Fragebogen-Datenstruktur ─────────────────────────────────────────────────

export interface EmployeeEntry {
  role: string
  tasks: string
  weeklyHours: number
  monthlyWage: number
  employmentType: 'vollzeit' | 'teilzeit' | 'minijob' | 'freelance'
  productivityNote: string
}

export interface QuestionnaireData {
  // Schritt 1: Unternehmen
  companyName: string
  industry: string
  location: string
  locationCount: number
  companySize: string
  monthlyRevenue: number
  avgProfit: number
  mainServices: string
  mainCostAreas: string

  // Schritt 2: Mitarbeiter
  employees: EmployeeEntry[]

  // Schritt 3: Kosten
  costs: {
    rent: number
    energy: number
    insurance: number
    softwareSubscriptions: number
    marketing: number
    goods: number
    vehicles: number
    leasing: number
    taxConsultant: number
    externalServices: number
    other: number
    notes: string
  }

  // Schritt 4: Einnahmen
  revenue: {
    monthlyRevenue: number
    mainSources: string
    seasonalFluctuations: string
    strongestMonths: string
    weakestMonths: string
    avgOrderValue: number
    customersPerMonth: number
    marginNotes: string
  }

  // Schritt 5: Prozesse
  processes: {
    dailyManualTasks: string
    timeDrainingTasks: string
    toolsUsed: string
    errorPoints: string
    waitingPoints: string
    automationCandidates: string
  }

  // Schritt 6: Ziele
  goals: AnalysisGoal[]

  // Schritt 7: Genauigkeit
  accuracyLevel: AccuracyLevel
}

export interface AnalysisRequestPayload {
  industry: string
  analysisTypes: AnalysisType[]
  accuracyLevel: AccuracyLevel
  inputMethod: InputMethod
  goals: AnalysisGoal[]
  questionnaireData?: Partial<QuestionnaireData>
  uploadedFiles?: string[]
  consentConfirmed: boolean
  privacyConfirmed: boolean
  uploadAuthConfirmed: boolean
}

// ─── Upload-Felddefinitionen ──────────────────────────────────────────────────

export interface FieldDef {
  key: string
  label: string
  required: boolean
  hint?: string
}

export const CATEGORY_FIELD_DEFINITIONS: Record<UploadCategory, FieldDef[]> = {
  REVENUE: [
    { key: 'amount',   label: 'Umsatzbetrag (EUR)',   required: true,  hint: 'z.B. „Betrag", „Umsatz", „Total"' },
    { key: 'date',     label: 'Datum',                 required: false, hint: 'z.B. „Datum", „Tag", „Date"' },
    { key: 'category', label: 'Kategorie / Art',       required: false, hint: 'z.B. „Kategorie", „Art"' },
  ],
  EXPENSES: [
    { key: 'amount',   label: 'Ausgabenbetrag (EUR)',  required: true,  hint: 'z.B. „Betrag", „Kosten", „Ausgabe"' },
    { key: 'date',     label: 'Datum',                 required: false },
    { key: 'category', label: 'Kostenkategorie',       required: false, hint: 'z.B. „Personalkosten", „Energie", „Material"' },
  ],
  BOOKINGS: [
    { key: 'rooms_occupied', label: 'Aktive Einheiten (Zimmer / Gedecke / Behandlungen / ...)', required: true, hint: 'z.B. „Belegt", „Gedecke", „Behandlungen", „Aufträge"' },
    { key: 'date',     label: 'Datum',                 required: false },
    { key: 'channel',  label: 'Buchungskanal / Quelle', required: false, hint: 'z.B. „Kanal", „Plattform", „Quelle"' },
    { key: 'revenue',  label: 'Umsatz dieser Einheit (EUR)', required: false },
    { key: 'commission', label: 'Provision (%)',       required: false, hint: 'z.B. „Provision", „Provisionssatz" in %' },
  ],
  EMPLOYEE_HOURS: [
    { key: 'hours',       label: 'Arbeitsstunden',          required: true,  hint: 'z.B. „Stunden", „Std.", „h"' },
    { key: 'date',        label: 'Datum',                   required: false },
    { key: 'employee_id', label: 'Mitarbeiter-ID (anonym)', required: false, hint: 'Kein Name – nur ID oder Nummer' },
    { key: 'hourly_rate', label: 'Stundenlohn (EUR)',        required: false },
  ],
  ROOM_CATEGORIES: [
    { key: 'category', label: 'Kategorie / Art',       required: false, hint: 'z.B. „Standard", „Premium", „Behandlungsart"' },
    { key: 'price',    label: 'Preis / Tarif (EUR)',    required: false },
  ],
  OTHER: [],
}
