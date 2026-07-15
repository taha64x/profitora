// Zentrale Kategorien-Listen für Ausgaben/Einnahmen — genutzt von costs-,
// revenues-, recurring-Seite und CSV-Import (vorher je Seite hartkodiert).
export const EXPENSE_CATEGORIES = [
  'Personal',
  'Miete',
  'Energie',
  'Software',
  'Marketing',
  'Einkauf',
  'Fahrzeuge',
  'Versicherungen',
  'Steuern/Buchhaltung',
  'Dienstleister',
  'Reparaturen',
  'Sonstiges',
]

export const REVENUE_CATEGORIES = [
  'Produktverkauf',
  'Dienstleistung',
  'Online-Shop',
  'Stammkunde',
  'Neukunde',
  'Plattform',
  'Barzahlung',
  'Überweisung',
  'Sonstiges',
]

export const PAYMENT_METHODS = ['Überweisung', 'Kreditkarte', 'Bar', 'SEPA-Lastschrift', 'PayPal', 'Sonstiges']

export const RECURRENCE_INTERVALS = [
  { value: 'monthly', label: 'Monatlich' },
  { value: 'quarterly', label: 'Quartalsweise' },
  { value: 'yearly', label: 'Jährlich' },
] as const
