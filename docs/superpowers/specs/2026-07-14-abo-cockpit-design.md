# Spec: Profitora Abo-Cockpit

**Datum:** 2026-07-14
**Status:** Freigegeben (Design-Review mit Taha am 14.07.2026)
**Scope:** Neues Abomodell mit Unternehmens-Cockpit (Finanzen, Team/Schichtplan, Live-Übersicht) + Preisumstellung + Analyse-Strategie 2.0

---

## 1. Ziel & Kontext

Profitora (profitora.de) verkauft heute Einmal-Analysen über Credits (1/3/5 = 1.990/4.990/6.990 €). Neu:

- **Abomodell** = Unternehmens-Cockpit: alle Infos eines Betriebs an einem Ort — Buchhaltung (jede Einnahme/Ausgabe je Bereich), Mitarbeiter mit Schichtplänen, Live-Übersicht „wer arbeitet gerade", KPIs mit Branchen-Benchmarks.
- **Dashboard/Cockpit gibt es nur mit Abo.** Ohne Abo: nur Einzelanalyse kaufbar (teurer als heute).
- **Analysen mit Abo deutlich günstiger** (199–499 € je Stufe), ohne Abo 2.490 €.
- 3 Tiers mit steigendem Funktionsumfang.

Vorhandenes Fundament (wird wiederverwendet):
- `Expense`/`Revenue`/`MonthlyTarget`-Modelle + Dashboard-Seiten `costs`, `revenues`, `finance`, `mein-weg`
- `Subscription`-Modell mit `stripeSubscriptionId`, Monatslimits, Perioden (ungenutzt)
- Stripe-Webhook verarbeitet bereits `customer.subscription.updated/deleted`, `invoice.payment_failed`; Portal-Route existiert
- Fragebogen (`QuestionnaireWizard`), Spalten-Mapping (`ColumnMapper`), Python-KPI-Engine (`business_kpis.py` mit Branchen-Benchmarks), Claude-Berichtsgenerierung (`src/lib/ai.ts`)

---

## 2. Getroffene Entscheidungen

| Frage | Entscheidung |
|---|---|
| Mitarbeiter-Modul-Tiefe V1 | **Chef pflegt alles.** Keine Mitarbeiter-Logins, keine echte Stempeluhr. Live-Status wird aus dem Schichtplan abgeleitet. Logins/Stempeluhr = V2. |
| Abo-Preise | **149 / 299 / 599 €/Monat** (Starter/Business/Premium), Jahreszahlung −20 % → 119/239/479 €/Monat-Äquivalent |
| Einzelanalyse ohne Abo | **2.490 €**, 3er/5er-Pakete werden gestrichen. Bestandscredits bleiben gültig. |
| Buchhaltungs-Dateneingang V1 | **Manuell + CSV-Import + wiederkehrende Posten.** Bank-API (finAPI/GoCardless) = V2. |
| Trial | 14 Tage, Zahlungsmittel erforderlich (Stripe `trial_period_days`). Im Trial (`status='trialing'`) kosten Analysen den Einzelpreis 2.490 € — verhindert Abo-abschließen→199-€-Analyse→kündigen-Exploit. Abo-Analysepreis gilt ab Status `active`. |
| Architektur | Bestehende Next.js-App phasenweise ausbauen (kein separates Produkt, kein Big-Bang). |

---

## 3. Preismodell

### 3.1 Tiers

| | Ohne Abo | Starter | Business ⭐ | Premium |
|---|---|---|---|---|
| Preis/Monat | — | 149 € | 299 € | 599 € |
| Jahreszahlung (−20 %) | — | 119 €/M (1.428 €/J) | 239 €/M (2.868 €/J) | 479 €/M (5.748 €/J) |
| Analyse-Preis | 2.490 € | 499 € | 299 € | 199 € |
| Inklusiv-Analysen | — | — | — | 1 pro Kalenderquartal (nicht kumulierbar) |
| Finanz-Cockpit | ✗ | ✓ | ✓ | ✓ |
| Schichtplan + Live-Status + Abwesenheiten | ✗ | ✗ | ✓ | ✓ |
| Auto-Monatsreport | ✗ | Kurzversion | Vollversion | Vollversion |
| KPI-Alerts | ✗ | ✗ | ✓ | ✓ |
| DATEV-/Steuerberater-Export (CSV) | ✗ | ✗ | ✓ | ✓ |
| Forecast/Cashflow-Prognose (12 M) | ✗ | ✗ | ✗ | ✓ |
| Maßnahmen-Tracker | ✗ | ✗ | ✓ | ✓ |
| Mitarbeiter (Stammdaten) | — | 10 | 30 | unbegrenzt |
| Nutzer (Logins) | 1 | 2 | 5 | 15 |
| Standorte | — | 1 | 1 | 5 (Umsetzung Phase 3+; bis dahin auf Pricing-Seite als „in Kürze") |
| KI-Assistent | ✗ | 50 Msg/Monat | 200 Msg/Monat | unbegrenzt (Fair Use 1.000/M) |
| Support | E-Mail | E-Mail | E-Mail | Priorität |

Verkaufslogik: Anker 2.490 € Einzelanalyse. Business + 1 Analyse = 598 € < 2.490 € → Abo ist der offensichtliche Deal. Mengenrabatt existiert nur noch übers Abo.

### 3.2 Stripe-Struktur

- **6 Subscription-Prices** (3 Produkte × monatlich/jährlich), Checkout `mode:'subscription'`, `trial_period_days: 14`.
  Env-Vars: `STRIPE_PRICE_STARTER_MONTHLY|YEARLY`, `STRIPE_PRICE_BUSINESS_MONTHLY|YEARLY`, `STRIPE_PRICE_PREMIUM_MONTHLY|YEARLY`
- **4 Analyse-Einmalpreise**, Checkout `mode:'payment'` (bestehender Flow):
  `STRIPE_PRICE_ANALYSIS_SOLO` (2.490), `_ANALYSIS_STARTER` (499), `_ANALYSIS_BUSINESS` (299), `_ANALYSIS_PREMIUM` (199)
- Preis-Wahl beim Analyse-Kauf serverseitig anhand `Subscription.planName` + `status` (trialing → SOLO).
- **Rechnungen:** Abo-Rechnungen erstellt Stripe (Customer Portal, Stripe-Invoice-Settings mit Firmendaten/Steuernummer). Die eigene §14-UStG-Rechnung (PA-Nummernkreis, `src/lib/invoice.ts`) bleibt nur für Analyse-Einmalkäufe.
- Webhook-Erweiterung:
  - `checkout.session.completed` mit `mode='subscription'` → Subscription-Zeile setzen (planName aus Price-ID-Mapping, stripeSubscriptionId, status, Periode)
  - `customer.subscription.updated/deleted` → Plan/Status/Periode synchen (Price-ID→Plan-Mapping ergänzen; Handler-Grundgerüst existiert)
  - `invoice.payment_failed` → Status `past_due` + E-Mail an Kunden (Resend)
- Idempotenz wie bisher über `StripePurchase.stripeSessionId` (Einmalkäufe) bzw. Subscription-Upsert (idempotent per stripeSubscriptionId).

### 3.3 Bestandskunden (Grandfathering)

- Vorhandene `analysisCredits` bleiben unbegrenzt gültig und einlösbar (Wizard + Berichte).
- Wer je gekauft hat (StripePurchase existiert) oder `analysisCredits > 0` hat: behält Zugriff auf Analyse-Wizard, Uploads und seine Berichte — **kein** Cockpit.
- Alte `planName='premium'`-Markierung aus dem Credit-Webhook wird migriert: zählt entitlement-seitig als `free` + Credits. Neuer Webhook setzt planName bei Credit-Käufen nicht mehr um.
- Registrierung bleibt gratis (`planName='free'`): sieht Paywall/Pricing + kann Einzelanalyse kaufen. Bisher frei zugängliche Finanz-Seiten (costs/revenues/finance/mein-weg) werden Starter+ — akzeptiert, Produkt ist jung.

### 3.4 Launch-Strategie

Phase 1 baut das komplette Abo-Fundament **hinter Feature-Flag** `NEXT_PUBLIC_SUBSCRIPTIONS_LIVE` (Pricing-Page-Umschaltung + Checkout-Freischaltung). Öffentlicher Launch der neuen Pricing-Seite erst, wenn Phase 2 (Finanzen) fertig ist — Starter/Business dürfen nichts verkaufen, was nicht existiert. Schichtplan-Feature erscheint auf der Pricing-Seite erst mit Phase 3 (bis dahin „in Kürze"-Badge auf Business/Premium). Bis zum Launch bleibt das heutige Credit-Pricing öffentlich sichtbar.

---

## 4. Module

### 4.1 Finanzen (Ausbau des Bestehenden) — Starter+

- **Erfassen:** Einnahme/Ausgabe mit Datum, Betrag, Kategorie, **Bereich**, Zahlungsart, Lieferant/Quelle, Notiz. Branchenspezifische Kategorie-Presets je `businessType` (Hotel: Logis/F&B/Spa/…; Restaurant: Küche/Bar/Terrasse/…), frei erweiterbar.
- **Bereiche (`Area`):** org-weite Liste, genutzt von Finanzen UND Schichtplan. Onboarding legt Branchen-Defaults an.
- **Wiederkehrende Posten (`RecurringEntry`):** Vorlage mit Intervall (monatlich/quartalsweise/jährlich), erzeugt Einträge automatisch via Vercel Cron (täglicher Lauf, `nextRun`-Prinzip, idempotent).
- **CSV-Import:** Bankexport hochladen → bestehendes Spalten-Mapping wiederverwenden → Vorschau → Duplikat-Erkennung (Datum+Betrag+Text-Hash) → Import als Expense/Revenue.
- **Belege:** Foto/PDF je Eintrag (Vercel Blob, `receiptUploadId`).
- **MwSt-Feld** (0/7/19 %) je Eintrag — Voraussetzung für DATEV-Export.
- **Ansichten:** Monats-/Jahresübersicht, Kategorie-Drilldown, Bereichs-Vergleich, Export CSV; DATEV-kompatibler Export (Business+).

### 4.2 Team (neu, greenfield) — Business+ (Stammdaten ab Starter)

- **Mitarbeiter-Stammdaten (`Employee`):** Name, Position, E-Mail, Telefon, Adresse, Stundenlohn ODER Monatsgehalt, Wochenstunden, Standard-Bereich, Farbe, Notizen, aktiv/inaktiv. Ab Starter (Limit 10).
- **Schichtplan (`Shift`):** Wochenraster Mo–So × Mitarbeiter. Schicht = Datum, Start, Ende, Bereich, Notiz. Schicht-Vorlagen (`ShiftTemplate`, z. B. „Frühschicht 06–14"). Woche kopieren. Konflikt-Warnung bei Überschneidung/Abwesenheit. Business+.
- **Abwesenheiten (`Absence`):** Urlaub/Krank/Frei mit Zeitraum, blockt Schichten, Resturlaub-Zähler (Urlaubsanspruch als Feld am Employee).
- **Live-Status „Jetzt im Dienst":** abgeleitet aus Plan (heute ∧ jetzt ∈ [Start, Ende] ∧ keine Abwesenheit). Widget auf Cockpit-Startseite. Keine echte Zeiterfassung in V1.
- **Plan teilen:** PDF-Export + öffentlicher Read-only-Link mit unguessbarem Token (Mitarbeiter sehen Wochenplan ohne Login; Link org-seitig regenerierbar).
- **Personalkosten-Brücke:** geplante Stunden × Stundenlohn (bzw. anteiliges Gehalt) → als Plan-Personalkosten in Finanz-KPIs und Analysen.

### 4.3 Cockpit-Startseite — Starter+

- Kopf: Umsatz MTD, Ausgaben MTD, Ergebnis MTD, Trend vs. Vormonat.
- **Benchmark-Ampeln:** KPIs (Personalkostenquote, Wareneinsatz, Marge, …) grün/gelb/rot gegen Branchenwerte aus `business_kpis.py`-Benchmarks.
- „Jetzt im Dienst"-Widget (Business+; Starter sieht Upgrade-CTA).
- 12-Monats-Sparkline Einnahmen/Ausgaben (Recharts).
- Zielfortschritt (`MonthlyTarget`, existiert).
- Alert-Feed (Business+).

### 4.4 KPI-Alerts (`AlertRule`) — Business+

Regel = Metrik + Schwelle + Richtung (z. B. Personalkostenquote > 32 %). Prüfung im täglichen Cron; bei Verletzung E-Mail (Resend) + Feed-Eintrag; `lastFiredAt` verhindert Spam (max. 1×/Woche je Regel). Sinnvolle Default-Regeln je Branche beim Onboarding.

---

## 5. Analyse-Strategie 2.0

### 5.1 Ohne Abo — Einzelanalyse 2.490 €

Geführter 4-Schritt-Wizard (baut auf `QuestionnaireWizard` + `UploadZone`/`ColumnMapper` auf):

1. **Branche + Betriebsprofil:** businessType, Einheiten (Zimmer/Sitzplätze/…), Öffnungszeiten, MA-Anzahl, Saisonalität, Ziele.
2. **Daten hochladen** mit branchenspezifischer Checkliste: BWA oder Summen-/Saldenliste, Umsatzliste/Kassenexport, Lohnjournal/Stundenliste, Belegung/Bons. Spalten-Mapping. **Datenqualitäts-Score live** (0–100, zeigt konkret: „Energiekosten fehlen → Energie-Abschnitt entfällt"). Score < 40 → Warnung vor Kauf.
3. **Schwerpunkte wählen** (max. 3): Personal, Wareneinsatz, Energie, Preise/Auslastung, Marketing/Provisionen, Fixkosten. Steuert Prompt-Tiefe.
4. **Kauf → Analyse:** Python-KPI-Engine → Claude-Bericht (10 Abschnitte, WPO/IDW-angelehnt, CLAUDE.md-Regeln 1–6) → Online-Bericht + PDF.

Berichts-Qualitäts-Upgrades (gelten für alle Analysen):
- Executive Summary beginnt mit **Top-3-Sparpotenzialen in €**.
- Jede Empfehlung mit Rechenweg (Regel 5), Umsetzungs-Schwierigkeit (leicht/mittel/schwer) und Zeithorizont.
- Peer-Benchmark je Branche in jedem KPI-Abschnitt.

### 5.2 Mit Abo

- **Datengrundlage = Cockpit-Livedaten** (Finanzen + Plan-Personalkosten) für frei wählbaren Zeitraum + optionale Zusatz-Uploads. Kein Pflicht-Upload mehr.
- Vergleichsdimensionen: vs. Vorperiode, vs. Branchen-Benchmark, vs. eigene Ziele (`MonthlyTarget`).
- **Maßnahmen-Tracker (`Measure`)** — Retention-Kern: Empfehlungen aus dem Bericht werden Maßnahmen (Titel, Beschreibung, geschätzte Ersparnis, Status offen/umgesetzt/verworfen, Datum). Die **nächste** Analyse referenziert umgesetzte Maßnahmen und misst Wirkung („Energiekosten −8 % seit Maßnahme 3"). Business+.
- **Auto-Monatsreport** (Cron, Monatsanfang für Vormonat): kompakte KPI-Seite + Soll-Ist-Abweichungen + 3 Kurz-Hinweise. Günstiges Modell (Haiku), KEIN voller WPO-Bericht. Starter = Kurzversion (nur KPI-Tabelle + Ampeln), Business/Premium = Vollversion inkl. Hinweise. Per E-Mail + im Dashboard.
- **Premium-Inklusivanalyse:** 1 Vollanalyse pro Kalenderquartal, nicht kumulierbar. Tracking über `lastIncludedAnalysisAt` (erlaubt, wenn keine im laufenden Kalenderquartal).

### 5.3 Aufräumen (eine Pipeline statt zwei)

- Alter öffentlicher Flow `/analyze/*` + `AnalysisRequest`-Modell wird zum Lead-Funnel für die Einzelanalyse umgebaut (mündet in Wizard-Schritt 1) oder stillgelegt — Entscheidung in Phase 4, Default: umbauen.
- Duplikat `dashboard/analyses` + `dashboard/reports` wird zu einer Seite gemergt.
- Teaser-/Free-Analyse-Reste (`report-teaser.ts`, `PLANS.free.teaser`) entfernen.

---

## 6. Entitlements

Neue Datei `src/lib/entitlements.ts` — einzige Quelle für Plan→Feature/Limit:

```ts
type PlanId = 'free' | 'starter' | 'business' | 'premium'

interface Entitlements {
  cockpit: boolean            // Finanzen + Startseite
  shifts: boolean             // Schichtplan, Abwesenheiten, Live-Status
  alerts: boolean
  datevExport: boolean
  forecast: boolean
  measures: boolean           // Maßnahmen-Tracker
  autoReport: 'none' | 'short' | 'full'
  maxEmployees: number        // Infinity bei premium
  maxUsers: number
  maxLocations: number
  assistantMsgsPerMonth: number  // 0 | 50 | 200 | 1000 (Fair Use)
  analysisPriceCents: number     // 249000 | 49900 | 29900 | 19900
  includedAnalysesPerQuarter: number // 0 | 0 | 0 | 1
}
```

- Serverseitige Guards: `requireEntitlement(orgId, 'shifts')` in jeder betroffenen API-Route/Server-Page → 403 mit `upgradeRequired`-Payload.
- Client: `useEntitlements()`-Hook; gesperrte Features sichtbar, aber geblurrt/mit Upgrade-CTA („Ab Business") — verkauft besser als Verstecken.
- Trial (`status='trialing'`): volle Features des gewählten Plans, aber `analysisPriceCents = SOLO`.
- `past_due`: Cockpit read-only (Banner „Zahlung fehlgeschlagen"), kein Analyse-Abo-Preis. `canceled`/abgelaufen → wie `free`, Daten bleiben 6 Monate erhalten (Reaktivierungs-Anreiz), danach Löschung nach Ankündigung.

---

## 7. Datenmodell-Änderungen (Prisma, alle additiv)

**Neue Modelle:**

| Modell | Kernfelder |
|---|---|
| `Area` | organizationId, name, sortOrder |
| `Employee` | organizationId, name, position, email?, phone?, address?, hourlyWageCents?, monthlySalaryCents?, weeklyHours?, vacationDaysPerYear?, defaultAreaId?, color, active, notes? |
| `Shift` | organizationId, employeeId, date, startTime, endTime, areaId?, note?, status(PLANNED\|CANCELLED) |
| `ShiftTemplate` | organizationId, label, startTime, endTime, areaId? |
| `Absence` | organizationId, employeeId, type(VACATION\|SICK\|OFF), startDate, endDate, note? |
| `RecurringEntry` | organizationId, kind(INCOME\|EXPENSE), amount, category, areaId?, vendor?, description, interval(MONTHLY\|QUARTERLY\|YEARLY), nextRun, active |
| `Measure` | organizationId, reportId?, title, description, potentialSavingsCents?, status(OPEN\|IMPLEMENTED\|DISCARDED), implementedAt? |
| `AlertRule` | organizationId, metric, threshold, direction(ABOVE\|BELOW), active, lastFiredAt? |
| `PlanShareToken` | organizationId, token(unique), active — Read-only-Schichtplan-Link |

**Geänderte Modelle:**

- `Expense`, `Revenue`: + `areaId?`, + `vatRate?` (0/7/19), + `receiptUploadId?`
- `Subscription`: `planName` ∈ free|starter|business|premium; + `billingInterval('month'|'year')?`, + `lastIncludedAnalysisAt?`; `analysisCredits` bleibt (Bestand + Einmalkäufe laufen weiter als Credit=1-Kauf)
- Migrationen ausschließlich additiv; Anwendung über `vercel-build` (Achtung bekanntes Muster: bei `db push`-Warnung temporär `--accept-data-loss` rein + sofort revert — Commits 1b2074b/8769d2e; `.env.local`-DATABASE_URLs zeigen auf falsche alte US-DB, Prod-Migrationen NIE lokal fahren)

---

## 8. Recht & DSGVO (zwingend)

- **Mitarbeiter-PII geht NIE in KI-Prompts.** Prompt-Builder erhält nur Aggregate (Stunden je Bereich, Kostenquoten). Keine Leistungsbewertung Einzelner (CLAUDE.md §18 bleibt hart).
- Mitarbeiter-Löschung = Anonymisierung („Ehemalige/r #n"), Schichten bleiben für Kostenhistorie.
- **Kündigungsbutton** (§ 312k BGB) sichtbar auf Abo-Seite + Stripe Customer Portal; Kündigung zum Periodenende, monatlich kündbar.
- Datenschutzerklärung ergänzen: Mitarbeiterdaten-Verarbeitung (Art. 6 Abs. 1 lit. b/f), Auftragsverarbeiter-Liste (Stripe, Vercel, Neon, Resend, Anthropic).
- AGB um Abo-Klauseln erweitern (Laufzeit, Verlängerung, Preisänderungen) → **Cousin prüfen lassen** (offener Punkt).
- **USt-Warnung:** Abo-Umsätze reißen die Kleinunternehmergrenze schnell → mit Steuerberater klären (Hinweis, keine Steuerberatung). Steuernummer-Env (`COMPANY_TAX_NUMBER`) weiterhin offen (ELSTER).

---

## 9. Phasen-Rollout

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **1 — Abo-Fundament** | `entitlements.ts`, `plans.ts`-Rework, 10 neue Stripe-Prices + Checkout `mode:'subscription'` + Trial, Webhook-Ausbau, neue Pricing-Page (hinter Flag), Dashboard-Gating + Upgrade-CTAs, Abo-Verwaltungsseite (Portal, Kündigungsbutton), Analyse-Preisstaffel, Credits-Grandfathering | Technisch verkaufbar (Flag aus) |
| **2 — Finanzen-Ausbau** | `Area`, `RecurringEntry` + Cron, CSV-Import-Ausbau + Duplikate, Belege, MwSt, DATEV-Export, Cockpit-Startseite mit Ampeln, `AlertRule` + Cron | Starter/Business-Wert vorhanden → **öffentlicher Launch** |
| **3 — Team-Modul** | `Employee`, `Shift`, `ShiftTemplate`, `Absence`, Wochenplan-UI, Live-Widget, Plan-PDF + Share-Link, Personalkosten-Brücke | Business/Premium voll |
| **4 — Analyse 2.0** | Wizard-Umbau (Qualitäts-Score, Schwerpunkte), Livedaten-Analyse, `Measure`-Tracker, Auto-Monatsreport, Premium-Quartalsanalyse, Alt-Flow-Aufräumen, Forecast (Premium) | Komplett |

Jede Phase einzeln deploybar. Phase 1 = nächster Implementierungsplan.

## 10. V2-Parkplatz (dokumentiert, NICHT bauen)

Mitarbeiter-Logins + echte Stempeluhr (Verkaufsargument: Arbeitszeiterfassungspflicht BAG/EuGH), Bank-API (finAPI/GoCardless) als Premium-Feature, Dokumentenablage (Verträge/Personalakten), Aufgaben-/Öffnungs-Checklisten, Inventar/Wareneinsatz-Modul, Mobile PWA, Multi-Währung, Betriebsrat-/Mehrbenutzer-Rollenfeinheit.

## 11. Empfohlene Plugins

Alle bereits installiert — keine Neuinstallation nötig:

- **stripe** — Subscription-Products/Prices anlegen, Webhook-Events debuggen (`/stripe`-Tools)
- **vercel** — Cron-Jobs (wiederkehrende Posten, Alerts, Monatsreport), Deploys, Env-Verwaltung
- **context7** — aktuelle Stripe-Billing- und Next.js-Docs beim Implementieren
- **chrome-devtools / playwright** — E2E-Smoke: Checkout, Trial, Gating, Kündigungsbutton
- **ui-ux-pro-max + frontend-design** — Cockpit-/Pricing-Design („sehr schön designed"-Anspruch)

Neue npm-Lib (kein Plugin): **Recharts** für Cockpit-Charts (Sparklines, Bereichs-Vergleich).

## 12. Offene Punkte (außerhalb des Codes)

1. AGB-Abo-Klauseln vom Cousin prüfen lassen (vor öffentlichem Launch)
2. USt/Kleinunternehmergrenze mit Steuerberater klären; ELSTER-Steuernummer → `COMPANY_TAX_NUMBER`
3. Stripe-Invoice-Einstellungen (Firmendaten auf Abo-Rechnungen) im Stripe-Dashboard pflegen
4. Google-Ads-Kampagne (läuft parallel) nach Launch auf neue Pricing-Seite zeigen lassen
