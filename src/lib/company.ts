// Zentrale Anbieter-Stammdaten – einzige Quelle für Rechnung, Auftragsbestätigung,
// Impressum, AGB und E-Mail-Signatur.
//
// WICHTIG: Die mit [BITTE AUSFÜLLEN] markierten Werte müssen vor dem Live-Gang
// durch deine echten Daten ersetzt werden – sonst ist die Rechnung nicht gültig.
// Steuerlicher Status: Kleinunternehmer gemäß §19 UStG (keine Umsatzsteuer).

export const COMPANY = {
  /** Rechtlicher Name des Anbieters (Vor- und Nachname bei Einzelunternehmen) */
  legalName: '[BITTE AUSFÜLLEN: z. B. Taha Aslan]',
  /** Marken-/Produktname */
  brand: 'Profitora',
  /** Straße + Hausnummer */
  street: '[BITTE AUSFÜLLEN: Straße + Nr.]',
  /** PLZ + Ort */
  city: '[BITTE AUSFÜLLEN: PLZ Ort]',
  country: 'Deutschland',
  /** Steuernummer (Finanzamt) – auf Kleinbetragsrechnung < 250 € nicht zwingend, aber empfohlen */
  taxNumber: '[BITTE AUSFÜLLEN: Steuernummer]',
  /** Kontakt */
  email: 'kontakt@profitora.de',
  phone: '[BITTE AUSFÜLLEN: Telefon]',
  domain: 'profitora.de',
  /** Kleinunternehmer-Pflichthinweis nach §19 UStG */
  vatNote: 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.',
} as const

/** Einzeiler für Footer / Impressum-Kurzform */
export function companyOneLine(): string {
  return `${COMPANY.legalName} · ${COMPANY.street} · ${COMPANY.city} · ${COMPANY.country}`
}
