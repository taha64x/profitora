// Bereichs-Defaults je Branche — beim ersten GET /api/areas geseedet.
const AREA_DEFAULTS: Record<string, string[]> = {
  hotel: ['Logis', 'F&B', 'Spa/Wellness', 'Veranstaltungen', 'Sonstiges'],
  restaurant: ['Küche', 'Service', 'Bar', 'Terrasse', 'Lieferung/To-Go'],
  cafe_bakery: ['Verkauf', 'Café', 'Produktion'],
  retail: ['Verkaufsfläche', 'Online', 'Lager'],
  medical: ['Behandlung', 'Empfang/Verwaltung', 'Labor'],
  craft: ['Baustelle', 'Werkstatt', 'Büro'],
  fitness: ['Training', 'Kurse', 'Theke/Shop'],
  beauty: ['Behandlung', 'Verkauf'],
  consulting: ['Beratung', 'Projekte', 'Verwaltung'],
  other: ['Betrieb', 'Verwaltung', 'Vertrieb'],
}

export function areaDefaultsFor(businessType: string | null | undefined): string[] {
  return AREA_DEFAULTS[businessType ?? 'other'] ?? AREA_DEFAULTS.other
}
