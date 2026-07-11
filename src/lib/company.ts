// Zentrale Anbieter-Stammdaten – einzige Quelle für Rechnung, Auftragsbestätigung,
// Impressum, AGB und E-Mail-Signatur.
//
// WICHTIG: Die mit [BITTE AUSFÜLLEN] markierten Werte müssen vor dem Live-Gang
// durch deine echten Daten ersetzt werden – sonst ist die Rechnung nicht gültig.
// Steuerlicher Status: Kleinunternehmer gemäß §19 UStG (keine Umsatzsteuer).

export const COMPANY = {
  /** Rechtlicher Name des Anbieters (Vor- und Nachname bei Einzelunternehmen) */
  legalName: 'Taha Aslan',
  /** Marken-/Produktname */
  brand: 'Profitora',
  /** Straße + Hausnummer */
  street: 'Haberstraße 15',
  /** PLZ + Ort */
  city: '69126 Heidelberg',
  country: 'Deutschland',
  /** Steuernummer (Finanzamt) – leer = wird auf Rechnung weggelassen.
   *  Achtung: Bei Rechnungen über 250 € ist die Steuernummer nach §14 Abs. 4 UStG
   *  Pflichtangabe (gilt auch für Kleinunternehmer). Sobald vom Finanzamt vergeben:
   *  COMPANY_TAX_NUMBER in Vercel setzen – erscheint dann automatisch auf Rechnungen. */
  taxNumber: process.env.COMPANY_TAX_NUMBER ?? '',
  /** Kontakt */
  email: 'kontakt@profitora.de',
  phone: '0170 7877462',
  domain: 'profitora.de',
  /** Kleinunternehmer-Pflichthinweis nach §19 UStG */
  vatNote: 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.',
} as const

/** Einzeiler für Footer / Impressum-Kurzform */
export function companyOneLine(): string {
  return `${COMPANY.legalName} · ${COMPANY.street} · ${COMPANY.city} · ${COMPANY.country}`
}
