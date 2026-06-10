# CLAUDE.md – BizAudit AI

Projektregeln, Architektur und Coding-Standards für dieses Projekt.
Diese Datei ist verbindlich für alle Entwicklungsarbeiten.

---

## 1. Projektübersicht

**Name:** BizAudit AI  
**Arbeitstitel:** KI-gestützte Wirtschaftlichkeitsanalyse für jedes Unternehmen  
**Kontext:** Universal einsetzbar für Hotels, Restaurants, Einzelhandel, Arztpraxen, Handwerk, Fitness, Beauty, Beratung u.v.m.  
**Phase:** MVP

**Unterstützte Unternehmensarten (businessType):**
- `hotel` – Hotels, Boardinghäuser, Pensionen, Ferienwohnungen
- `restaurant` – Restaurants, Gaststätten, Bistros, Kantinen
- `cafe_bakery` – Cafés, Bäckereien, Konditoreien
- `retail` – Einzelhandel, Ladengeschäfte, Kioske
- `medical` – Arztpraxen, Therapeuten, Physio, Zahnarzt
- `craft` – Handwerk, Dienstleister, Installateure
- `fitness` – Fitnessstudios, Wellnesszentren, Yogastudios
- `beauty` – Kosmetik, Friseursalons, Nagelstudios
- `consulting` – Unternehmensberatung, Agenturen, Kanzleien
- `other` – Sonstiges (universelle Analyse)

**Kernversprechen:**
> „Laden Sie Ihre Unternehmensdaten hoch. Die KI zeigt Ihnen, wo Ihr Betrieb Geld verliert – mit branchenspezifischen Benchmarks und konkreten Sparpotenzialen in Euro."

---

## 2. Rechtliche Positionierung (ZWINGEND EINHALTEN)

- HotelAudit AI ist ein **KI-gestützter Controlling- und Wirtschaftlichkeitsassistent**
- Es ersetzt **KEINE** Steuerberatung
- Es ersetzt **KEINE** Rechtsberatung
- Es ersetzt **KEINE** gesetzliche Wirtschaftsprüfung
- Alle Empfehlungen sind **betriebswirtschaftliche Entscheidungshilfen**
- Jeder Bericht MUSS den Disclaimer in Abschnitt 10 enthalten
- KI-Aussagen MÜSSEN auf berechneten Zahlen basieren
- **Keine erfundenen Zahlen.** Wenn Daten fehlen → klar kommunizieren

---

## 3. Tech-Stack

| Bereich | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Datenbank | PostgreSQL via Prisma ORM |
| Auth | JWT (HTTP-only Cookies) – erweiterbar für Supabase/Clerk |
| Upload | Lokal `/uploads/` für MVP → später S3/Cloudflare R2 |
| Analyse | Python 3, pandas, openpyxl – `python/business_kpis.py` (universal) |
| KI | Anthropic API (Claude) oder OpenAI (GPT-4o) – austauschbar, dynamischer Prompt je Branche |
| PDF | HTML-Bericht zuerst, PDF später via Puppeteer/WeasyPrint |
| Payments | Stripe (vorbereitet, noch nicht integriert) |

---

## 4. Projektstruktur

```
hotel-audit-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Register (2-Schritt: Branche → Account)
│   │   ├── dashboard/          # Hauptdashboard (branchenspezifisch)
│   │   ├── upload/             # Datei-Upload (Labels je businessType)
│   │   ├── report/
│   │   │   ├── [id]/           # Dynamischer Bericht
│   │   │   └── example/        # Öffentlicher Beispiel-Bericht (Hotel)
│   │   └── api/
│   │       ├── analyze/        # POST – startet Python-Analyse + KI-Bericht
│   │       ├── organization/   # GET – Unternehmensdaten (inkl. businessType)
│   │       ├── upload/         # POST – Datei-Upload
│   │       └── auth/           # Login, Register, Logout
│   ├── components/             # Wiederverwendbare UI-Komponenten
│   ├── lib/
│   │   ├── ai.ts               # Dynamischer KI-Prompt je businessType
│   │   ├── auth.ts             # JWT-Auth
│   │   └── db.ts               # Prisma-Client
│   └── types/
│       └── index.ts            # BusinessKpis, BUSINESS_TYPES, dynamische Labels
├── prisma/
│   └── schema.prisma           # DB-Schema: Organization.businessType (String)
├── python/
│   ├── analyze_csv.py          # Hauptanalyse (universell, businessType-aware)
│   ├── business_kpis.py        # KPI-Engine + Benchmarks für alle Branchen
│   └── requirements.txt
├── uploads/                    # Lokale Uploads (.gitignore'd)
├── .env.example                # Vorlage (nie .env committen!)
└── CLAUDE.md                   # Diese Datei
```

---

## 5. Datenbankschema (Prisma)

### Modelle
- **User** – Nutzer mit E-Mail + Passwort-Hash
- **Organization** – Unternehmen (name, businessType: String, unitCount: Int, unitLabel: String)
- **OrganizationMember** – Verbindung User ↔ Organization mit Rolle (OWNER/ADMIN/MEMBER)
- **Upload** – Hochgeladene Datei mit Kategorie und Speicherpfad
- **AnalysisReport** – Fertiggestellter Bericht (HTML-Content, Metadata als JSON)
- **ReportUpload** – M:N-Verbindung Report ↔ Upload

### Upload-Kategorien (DB-Enum, Labels dynamisch je businessType)
```
EMPLOYEE_HOURS   → Mitarbeiterzeiten (universell)
REVENUE          → Einnahmen / Umsatz (universell)
EXPENSES         → Ausgaben / Kosten (universell)
BOOKINGS         → Hotel: Buchungen | Restaurant: Gedecke | Retail: Verkäufe | etc.
ROOM_CATEGORIES  → Hotel: Zimmerkat. | Restaurant: Speisekarte | Retail: Produktkat. | etc.
OTHER            → Sonstiges
```

### Branchenbenchmarks (business_kpis.py)
| Unternehmensart | Personal-Ziel | Waren-Ziel | Marge-Ziel |
|---|---|---|---|
| hotel | ~28% | – | >10% |
| restaurant | ~32% | ~30% (Food Cost) | 4–8% |
| cafe_bakery | ~38% | ~30% | 5–10% |
| retail | ~14% | ~60% | 2–5% |
| medical | ~25% | – | >12% |
| craft | ~35% | ~30% Material | >8% |
| fitness | ~30% | – | >15% |
| beauty | ~35% | ~12% Produkte | >12% |
| consulting | ~45% | – | >18% |

---

## 6. Sicherheitsregeln (ZWINGEND)

- **Keine API-Keys im Code** – immer über Umgebungsvariablen
- **.env niemals committen** – ist in .gitignore
- **uploads/ niemals committen** – enthält echte Kundendaten
- Dateinamen beim Upload immer mit `crypto.randomUUID()` randomisieren
- Dateitypen serverseitig validieren (nicht nur Client-Check)
- JWT in HTTP-only Cookies (nicht localStorage)
- Zugriffskontrolle: Nutzer sieht nur Daten der eigenen Organisation
- SQL-Injection: Prisma schützt automatisch, keine Raw-Queries ohne Parameter
- XSS: `dangerouslySetInnerHTML` nur für KI-generierten HTML-Bericht – dieser kommt von eigener API, kein User-Input

---

## 7. Datenschutz / DSGVO

- **Datenminimierung**: Nur notwendige Daten speichern
- **Zweckbindung**: Daten nur für Analyse verwenden
- **Löschmöglichkeit**: DELETE-Endpunkte für Reports und Uploads vorbereiten
- **Mitarbeiterdaten**: Namen anonymisieren oder als ID behandeln
- **Keine Leistungsbewertung einzelner Mitarbeiter** – nur Betriebskennzahlen
- Hinweis in jedem Bericht: Mitarbeiterdaten wurden anonymisiert verarbeitet

---

## 8. Coding-Standards

### TypeScript
- Strikte Typisierung (`strict: true`)
- Keine `any` außer absoluter Notwendigkeit mit Kommentar
- Typen in `src/types/index.ts` zentralisieren
- Prisma-Typen direkt verwenden (nicht duplizieren)

### React / Next.js
- App Router (nicht Pages Router)
- Server Components bevorzugen, `'use client'` nur wenn nötig
- Keine unnötigen `useEffect`-Fetches – lieber Server Component
- Formulare: kontrollierte Komponenten mit lokalem State

### API-Routes
- Immer `getCurrentUser()` prüfen bevor Daten ausgegeben werden
- Fehler immer als `{ error: "..." }` mit passendem HTTP-Status
- Erfolg als `{ success: true, data: ... }`
- Keine sensiblen Informationen in Fehlermeldungen (z.B. Stack-Traces)

### Python
- Alle Funktionen typisieren (`from __future__ import annotations`)
- Fehlende Spalten niemals crashen lassen – `Optional[str]` zurückgeben
- Alle Zahlen als `float` mit `round()` ausgeben
- Ausgabe immer als JSON auf stdout
- Fehler auf stderr, nie auf stdout

---

## 9. Hotel-Kennzahlen (Pflichtimplementierung)

| Kennzahl | Formel |
|---|---|
| ADR | Gesamtumsatz / belegte Nächte |
| RevPAR | Gesamtumsatz / verfügbare Zimmer-Nächte |
| Auslastung | belegte Nächte / verfügbare Nächte × 100 |
| Personalkostenquote | Personalkosten / Gesamtumsatz × 100 |
| Umsatz / MA-Stunde | Gesamtumsatz / Mitarbeiterstunden |
| Kosten / belegte Nacht | Gesamtausgaben / belegte Nächte |
| Energie / belegte Nacht | Energiekosten / belegte Nächte |
| Portalprovisions-Quote | Provisionen / Portal-Buchungsumsatz × 100 |

---

## 10. Sparpotenzial-Erkennung

Das System MUSS auf folgende Muster prüfen:
- Personalkostenquote > 30% → Handlungsbedarf
- Portalprovision > 8% → Direktbuchungsstrategie empfehlen
- Energiekosten > 10 EUR/belegte Nacht → Optimierung prüfen
- Auslastung < 60% → Revenue Management prüfen
- Wiederkehrende Abos → auf Überschneidungen prüfen

---

## 11. Berichtsstruktur (10 Abschnitte)

Jeder generierte Bericht MUSS diese Abschnitte enthalten:

1. Management-Zusammenfassung
2. Datenqualität und fehlende Daten
3. Einnahmenanalyse
4. Ausgabenanalyse
5. Mitarbeiterzeitenanalyse
6. Hotel-Kennzahlen (ADR, RevPAR, Auslastung)
7. Auffälligkeiten
8. Top-Sparpotenziale mit geschätzter Ersparnis in EUR
9. Konkrete Handlungsempfehlungen
10. **Rechtliche Abgrenzung & Warnhinweise** (IMMER vorhanden!)

---

## 12. KI-Integration

- Provider über `AI_PROVIDER` Umgebungsvariable wählen (`anthropic` oder `openai`)
- Kein API-Key im Code
- Modell: Claude Opus (Anthropic) oder GPT-4o (OpenAI) als Default
- Prompts in `src/lib/ai.ts` zentralisiert
- Prompt muss immer den Disclaimer-Auftrag enthalten
- KI darf keine Zahlen erfinden – nur auf gelieferten Daten basieren

---

## 13. Entwicklungs-Workflow

```bash
# Setup
npm install
cp .env.example .env   # Dann .env ausfüllen!
npx prisma db push
npm run dev

# Python
cd python
pip install -r requirements.txt
python3 analyze_csv.py --config-json '{"files": {}, "room_count": 20}'
```

---

## 14. Skalierungs-Vorbereitung (NOCH NICHT UMSETZEN)

Diese Punkte sind vorbereitet, aber für MVP nicht aktiv:
- S3/R2 für Datei-Storage (statt lokaler Uploads)
- Stripe für Payments
- Supabase Auth oder Clerk als Auth-Provider
- Job-Queue (z.B. Trigger.dev) für asynchrone Analysen
- PDF-Export via Puppeteer oder WeasyPrint

---

## 15. Verbotene Muster

- `console.log` mit sensiblen Daten (API-Keys, Passwörter, Mitarbeiterdaten)
- Hardcodierte Credentials oder API-Keys
- `git add uploads/` – NIEMALS
- `git add .env` – NIEMALS
- Einzelne Mitarbeiter bewerten oder ranken
- Zahlen erfinden wenn Daten fehlen
- Behauptungen ohne Datengrundlage in Berichten

---

## 16. WPO/IDW-Prüfungsmethodik

> Vollständige Referenz: `docs/pruefungsmethodik.md`

HotelAudit AI orientiert sich an der risikoorientierten Prüfungsmethodik nach WPO/IDW –
als **betriebswirtschaftliche Analyse**, nicht als gesetzliche Abschlussprüfung (§317 HGB).

### Rechtsposition (ZWINGEND)
- Bezeichnung immer: "KI-gestützte betriebswirtschaftliche Wirtschaftlichkeitsanalyse"
- NIEMALS: "Wirtschaftsprüfung", "Abschlussprüfung", "geprüft nach HGB"
- Rechtsgrundlage analog §2 WPO – betriebswirtschaftliche Prüfungen
- Berufsgrundsätze analog WPO §1: Unabhängigkeit, Gewissenhaftigkeit, Verschwiegenheit

### 9-Schritt-Prüfungsprozess
1. Prüfungsauftrag und Zielsetzung definieren
2. Unternehmens- und Umfeldanalyse
3. Risiko- und Schwerpunktplanung
4. Prüfplanung dokumentieren
5. Datenaufbereitung und -prüfung (GoB-Vollständigkeit)
6. Analytische Prüfungshandlungen (IDW PS 312)
7. Einzelfallprüfungen / Stichproben
8. Dokumentation in Arbeitspapieren (IDW PS 460)
9. Berichtserstellung

### Berichtsstruktur (10 Abschnitte)
1. Management-Zusammenfassung
2. Prüfungsauftrag und Datengrundlage
3. Einnahmenanalyse
4. Ausgabenanalyse
5. Mitarbeiterzeitenanalyse
6. Hotel-Kennzahlen (KPI-Übersicht)
7. Auffälligkeiten und Abweichungsprotokoll (Soll-Ist)
8. Top-Sparpotenziale (mit EUR-Schätzwerten und Datenbezug)
9. Konkrete Handlungsempfehlungen (nummeriert, begründet)
10. Rechtliche Abgrenzung und Warnhinweise (IMMER vollständig!)

---

## 17. KI-Entscheidungsregeln (verbindlich für alle Prompts)

Diese Regeln sind ZWINGEND in alle KI-Prompts einzubauen:

### Regel 1 – Datenbezug
Jede Aussage MUSS auf den vorliegenden Daten basieren.
Formulierung: "Die Analyse zeigt, dass..." oder "Basierend auf den geprüften Daten..."

### Regel 2 – Konjunktiv
Empfehlungen in vorsichtigem Modus: "sollte", "wird empfohlen", "kann helfen"
NIEMALS: "muss", "ist falsch", "Sie haben einen Fehler gemacht"

### Regel 3 – Fehlende Daten
Bei fehlenden Daten → exakt schreiben: "Daten nicht verfügbar – Einschätzung nicht möglich"
NIEMALS Lücken mit Annahmen füllen.

### Regel 4 – Keine Erfindungen
NIEMALS Zahlen erfinden. Nur auf gelieferten Daten basieren.

### Regel 5 – Nachvollziehbarkeit
Berechnungsgrundlagen und konkrete Kennzahlen referenzieren.
Beispiel: "Die Personalkostenquote von 32,3% ergibt sich aus Personalkosten (14.500 EUR) / Umsatz (44.850 EUR)"

### Regel 6 – Haftungsausschluss
An jede Empfehlung: "(Entscheidungshilfe – keine rechtsverbindliche Prüfung)"
Abschnitt 10 MUSS immer vollständig sein.

### Obligatorische Textbausteine
```
Einleitung:   "Basierend auf den geprüften Daten [Zeitraum]..."
Personalkosten: "Die Personalkostenquote ([X]%) liegt [über/unter] dem Richtwert von ~28%..."
Empfehlung:   "Es wird empfohlen, [Maßnahme], da die Analyse [Daten] ergab."
Empfehlung-Ende: "(Entscheidungshilfe – keine rechtsverbindliche Prüfung)"
Disclaimer:   "Hinweis: Diese KI-Analyse ersetzt keine gesetzliche Prüfung (§2 WPO),
               sondern dient als interne betriebswirtschaftliche Entscheidungshilfe."
```

---

## 18. DSGVO und Beschäftigtendatenschutz

### Pflichtmaßnahmen
- Mitarbeiterdaten anonymisieren/pseudonymisieren (nur Abteilung/ID, kein Name)
- Rechtsgrundlage dokumentieren: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
- Auftragsverarbeitungsvertrag mit KI-Providern (Art. 28 DSGVO) prüfen
- Speicherbegrenzung: Personenbezogene Daten nur so lange wie nötig
- Löschmöglichkeit implementieren und nutzbar halten
- Bei sensiblen Mitarbeiterdaten: ggf. Betriebsrat informieren

### Beschäftigtendatenschutz
- Abwägung: Arbeitgeberinteresse vs. Privatsphäre
- Keine Leistungsbewertung einzelner Mitarbeiter
- Nur aggregierte Auswertungen auf Betriebsebene
- Hinweis in jedem Bericht pflichtmäßig einbauen

### API-Sicherheit
- KI-Provider-Keys nur in `.env` (niemals ins Repo)
- Auftragsverarbeitungsvertrag: Anthropic (DPA verfügbar), OpenAI (DPA verfügbar)
- Keine personenbezogenen Mitarbeiterdaten in Prompts übergeben
- Uploads lokal halten (MVP) – Cloud nur mit entsprechenden DSGVO-Verträgen
