# Executive Summary – HotelAudit AI (Produktspezifikation)

> Quelle: Executive Summary.pdf (ChatGPT-generiert, Juni 2026)
> Dieses Dokument dient als Produktspezifikation und Roadmap-Referenz.

---

## Produkt-Kurzfassung

HotelAudit AI ist ein webbasiertes SaaS-Tool für kleine Hotels (10–80 Zimmer), das KI-gestützte Wirtschaftlichkeitsprüfungen automatisiert. Nutzer laden Excel-/CSV- oder PDF-Daten zu Einnahmen, Ausgaben, Buchungen, Mitarbeiterzeiten etc. hoch. Die Plattform berechnet zentrale Kennzahlen (ADR, RevPAR, Personalkostenquote, Kosten pro belegter Nacht) und erstellt einen verständlichen Bericht mit Auffälligkeiten und Sparpotenzialen in Euro.

---

## Tech Stack (Spezifikation)

| Schicht | Technologie |
|---|---|
| Frontend | Next.js (TypeScript) + Tailwind CSS |
| Backend | Next.js API-Routen (Node.js) |
| Datenbank | PostgreSQL via Prisma ORM |
| Dateispeicher | Lokal /uploads MVP → später S3/Cloudflare R2 |
| Analyse & KI | Python (pandas, openpyxl, pdfplumber) + OpenAI/Anthropic |
| Zahlung | Stripe Billing (Abo, Webhooks) |

---

## Roadmap (30/90/180 Tage)

### 0–30 Tage (MVP)
- Projektsetup ✅
- Dateiupload mit Basisanalyse ✅
- Auth (Login/Register) ✅
- Dashboard ✅
- Beispiel-Bericht ✅
- Pilotkunden-Treffen

### 30–90 Tage (Ausbau)
- Stripe-Integration (Abo-Verwaltung)
- Column-Mapping-UI (nach Upload Spalten zuordnen)
- PDF-Support (pdfplumber)
- Marketing-Vorbereitung (Landingpage, Outreach)
- Preisseite

### 90–180 Tage (Skalierung)
- Feature-Erweiterungen
- Performance-Optimierung
- Mehrmandantenfähigkeit
- ERP/PMS-Anbindung (resigo, DIRS21 API)

---

## Preis- und Abomodell

| Tarif | Preis | Leistungen |
|---|---:|---|
| Starter | 49 EUR/Monat | 5 Analysen/Monat, 500 MB Upload |
| Business | 149 EUR/Monat | 15 Analysen, 2 GB Upload, E-Mail-Support |
| Pro | 299 EUR/Monat | 50 Analysen, Multi-User, 5 GB Upload, Premium-Support |

Gratis-Testphase: 14 Tage oder 1 kostenlose Analyse empfohlen.

---

## Fehlende Features vs. aktuellem MVP-Stand

### 1. Column-Mapping UI (PRIORITÄT HOCH)
Nach dem Upload soll der Nutzer CSV-Spalten den internen Feldern zuordnen:
- z.B. Spalte "Erlös" → revenue
- z.B. Spalte "Stunden" → employee_hours
- Seite: `/column-mapping` oder Modal nach Upload
- Komponente: `ColumnMapper.tsx`

### 2. Stripe-Integration (PRIORITÄT HOCH)
- Preisseite (`/pricing`) mit 3 Tarifen
- `POST /api/stripe/checkout` – Checkout-Session erstellen
- `POST /api/stripe/webhook` – Webhooks verarbeiten (Invoice-Paid, Subscription-Changed)
- User-Modell um `stripeCustomerId`, `subscriptionTier` erweitern

### 3. PDF-Support (PRIORITÄT MITTEL)
- Python: `pdfplumber` für PDF-Dateien
- Upload: PDF-Dateitypen erlauben
- Analyse: Tabellen aus PDFs extrahieren

### 4. Pricing-Seite
- Öffentliche Seite `/pricing` mit Tarifen und CTA

### 5. Marketing-Landingpage Update
- Hero-Text anpassen: "Hotelkosten automatisch prüfen lassen – mit KI."
- CTA: "Kostenlose Beispielanalyse"

### 6. Tests
- Python: pytest für KPI-Berechnungen
- Next.js: Jest/SuperTest für API-Routen
- E2E: Playwright

### 7. Cron-Jobs
- Wöchentliche Datei-Bereinigung (alte Uploads)
- Tägliche Backup-Routine

---

## API-Endpunkte (Soll)

| Endpunkt | Status |
|---|---|
| POST /api/auth/register | ✅ Implementiert |
| POST /api/auth/login | ✅ Implementiert |
| POST /api/auth/logout | ✅ Implementiert |
| POST /api/upload | ✅ Implementiert |
| POST /api/analyze | ✅ Implementiert |
| GET /api/report/[id] | ✅ Implementiert |
| DELETE /api/report/[id] | ✅ Implementiert |
| POST /api/stripe/checkout | ❌ Fehlt |
| POST /api/stripe/webhook | ❌ Fehlt |
| GET /api/user/profile | ❌ Fehlt |
| POST /api/column-mapping | ❌ Fehlt |

---

## Sicherheit & DSGVO (Zusammenfassung)

- TLS/HTTPS für alle Verbindungen
- bcrypt für Passwörter ✅
- JWT in HTTP-only Cookies ✅
- .env in .gitignore ✅
- uploads/ in .gitignore ✅
- EU-Hosting empfohlen: Hetzner, IONOS (ISO-27001)
- AVV mit Hosting-Partner und KI-API-Providern erforderlich
- Fair-Use-Limits pro Tarif (API-Kosten: Claude Sonnet ~3$/1M Input, 15$/1M Output)

---

## Abnahmekriterien MVP

- [ ] Nutzer kann sich einloggen und Hotel anlegen
- [ ] Dateien (CSV/PDF) hochladen und in Upload-Historie sehen
- [ ] Nach "Analysieren" wird Bericht mit Kennzahlen erstellt
- [ ] Bericht plausibel bei echten Daten
- [ ] Keine Fehler bei fehlenden Daten (verständliche Fehlermeldungen)
- [ ] Datenschutz: Keine echten Mitarbeiternamen im Bericht

---

## Marketing-Starterkit

### Hero-Text (Landingpage)
> "Hotelkosten automatisch prüfen lassen – mit KI. Laden Sie Mitarbeiterzeiten, Buchungen, Einnahmen und Ausgaben hoch. Unsere KI analysiert Ihre Daten und zeigt Ihnen in wenigen Minuten, wo Ihr Hotel Geld verliert – mit konkreten Sparvorschlägen in Euro."

### Pilot-E-Mail
```
Betreff: Einladung zur kostenlosen KI-Kostenanalyse für Ihr Hotel

Sehr geehrte/r Frau/Herr [Name],

wir entwickeln eine KI-gestützte Kostenanalyse für Hotels.
Im Rahmen eines Pilotprojekts bieten wir exklusiv 5 Hotels
eine kostenlose Monatsanalyse (Wert ~299 EUR) an.

Sie erhalten einen Bericht mit den fünf größten Sparpotenzialen Ihres Betriebs.

Einzige Bedingung: Anonymisierte Datenbereitstellung und kurzes Feedback.

Viele Grüße,
[Ihr Name]
```

### 30-Tage-Outreach-Plan
- Woche 1: Landingpage + 50 Hotels recherchieren (Mannheim, Frankfurt)
- Woche 2: 20 personalisierte E-Mails/Tag, 3-5 LinkedIn-Kontakte/Tag
- Woche 3: 3 Pilotkunden gewinnen, anonymisierte Daten auswerten
- Woche 4: Case Studies veröffentlichen, bezahlte Abos starten
