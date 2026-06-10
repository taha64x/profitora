# HotelAudit AI

KI-gestützte Wirtschaftlichkeitsanalyse für Hotels und kleine Beherbergungsbetriebe.

> Laden Sie Ihre Hotel-Daten hoch. Unsere KI zeigt Ihnen, wo Ihr Betrieb Geld verliert – mit konkreten Sparpotenzialen in Euro.

**Wichtig:** HotelAudit AI ist ein betriebswirtschaftlicher Assistent. Er ersetzt keine Steuerberatung, Rechtsberatung oder gesetzliche Wirtschaftsprüfung.

---

## Voraussetzungen

- Node.js 20+
- PostgreSQL (lokal oder Docker)
- Python 3.10+
- npm oder pnpm

---

## Installation

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Dann `.env` bearbeiten:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hotel_audit_ai"
JWT_SECRET="min-32-zeichen-langes-geheimnis-hier-eingeben"
AI_PROVIDER="anthropic"            # oder "openai"
ANTHROPIC_API_KEY="sk-ant-..."    # Anthropic Console: console.anthropic.com
# OPENAI_API_KEY="sk-..."         # falls OpenAI bevorzugt
```

### 3. Datenbank einrichten

```bash
# PostgreSQL-Datenbank erstellen
createdb hotel_audit_ai

# Schema deployen
npx prisma db push

# Prisma Client generieren
npx prisma generate
```

### 4. Python-Abhängigkeiten installieren

```bash
cd python
pip install -r requirements.txt
cd ..
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

App ist erreichbar unter: http://localhost:3000

---

## Erste Schritte

1. **Account erstellen** unter `/register`
2. **Hotel anlegen** (Name + Zimmeranzahl)
3. **Dateien hochladen** unter `/upload`
   - Einnahmen (CSV/Excel aus resigo oder Buchhaltung)
   - Ausgaben (CSV/Excel aus Buchhaltung)
   - Buchungen/Belegung (resigo Belegungsreport)
   - Mitarbeiterzeiten (optional)
4. **Analyse starten** → KI erstellt Bericht
5. **Bericht ansehen** mit Kennzahlen und Sparpotenzialen

**Beispiel-Bericht** (ohne Account): http://localhost:3000/report/example

---

## Dateiformat-Beispiele

### Einnahmen (REVENUE)
```csv
datum,betrag,kategorie
2025-05-01,1250.00,Zimmer
2025-05-01,85.00,Restaurant
2025-05-02,980.00,Zimmer
```

### Ausgaben (EXPENSES)
```csv
datum,betrag,kategorie,beschreibung
2025-05-01,450.00,Personal,Lohn Rezeption
2025-05-03,280.00,Energie,Stromrechnung
2025-05-05,120.00,Software,resigo Lizenz
```

### Buchungen (BOOKINGS)
```csv
datum,belegt,kanal,umsatz,provision
2025-05-01,12,Booking.com,1560.00,12
2025-05-01,3,Direkt,390.00,0
2025-05-02,8,Expedia,1040.00,15
```

### Mitarbeiterzeiten (EMPLOYEE_HOURS)
```csv
datum,mitarbeiter_id,stunden,abteilung
2025-05-01,MA-001,8,Rezeption
2025-05-01,MA-002,6,Housekeeping
```

---

## Verfügbare Skripte

```bash
npm run dev           # Entwicklungsserver
npm run build         # Produktions-Build
npm run db:studio     # Prisma Studio (Datenbank-GUI)
npm run db:migrate    # Neue Migration erstellen
npm run db:push       # Schema ohne Migration pushen (Entwicklung)
```

---

## Architektur

```
[Browser] → [Next.js App Router]
                ├── Server Components (Dashboard, Berichte)
                ├── Client Components (Upload, Formulare)
                └── API Routes
                        ├── /api/auth/  (Login, Register, Logout)
                        ├── /api/upload (Datei-Upload)
                        ├── /api/analyze (Analyse starten)
                        └── /api/report/[id] (Bericht abrufen)

[API /analyze] → [Python analyze_csv.py] → [hotel_kpis.py]
                                                    ↓
                                          [Anthropic/OpenAI API]
                                                    ↓
                                          [HTML-Bericht in DB]
```

---

## Sicherheitshinweise

- `.env` **niemals** in Git committen
- `uploads/` **niemals** in Git committen
- API-Keys **niemals** hardcoden
- Mitarbeiterdaten werden anonymisiert verarbeitet
- Keine Bewertung einzelner Mitarbeiter

---

## Zukünftige Features (nach MVP)

- PDF-Export
- Stripe-Bezahlung / SaaS-Abonnements
- S3/Cloudflare R2 für Datei-Storage
- Supabase Auth / Clerk
- Monatsvergleich / Vorjahresvergleich
- resigo API-Integration
- DIRS21 API-Integration
- Multi-Hotel-Unterstützung
