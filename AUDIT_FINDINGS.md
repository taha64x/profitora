# AUDIT_FINDINGS.md — Profitora (profitora.de)

Phase-0-Bestandsaufnahme (nur Dokumentation, keine Code-Änderungen).
Stand: 15.06.2026. Quelle: Code-Verifikation + externer Audit-Auftrag.

---

## 1. Stack (verifiziert)

| Bereich | Technologie |
|---|---|
| Framework | Next.js 14.2 (App Router), TypeScript |
| Styling | Tailwind CSS + CSS-Variablen (`globals.css`) + teils inline |
| Auth | Eigenes JWT in HTTP-only-Cookie `auth_token`; `src/middleware.ts` schützt Routen |
| DB | Prisma + PostgreSQL (Prod: Neon) |
| Zahlung | Stripe (`src/lib/stripe.ts`, `/api/stripe/checkout|webhook|portal`) — **Code da, KEINE Keys gesetzt → Checkout funktioniert noch nicht** |
| KI | Anthropic/OpenAI über `src/lib/ai.ts` (`AI_PROVIDER`), Default `claude-opus-4-8` — **kein `ANTHROPIC_API_KEY` in Prod → Analyse läuft nicht** |
| Analyse-Engine | Python/pandas als Vercel-Serverless-Funktion (`api/py/analyze.py`) + Node-Helper (`src/lib/analyze-engine.ts`); Uploads via Vercel Blob |
| Hosting | Vercel, Domain profitora.de; Deploy via `vercel --prod --force` (vom lokalen Ordner) |

## 2. Routen (verifiziert)

Öffentlich: `/`, `/analyze`, `/analyze/upload`, `/analyze/questionnaire`, `/register`, `/login`,
`/onboarding`, `/report/example`, `/impressum`, `/datenschutz`, `/agb`.
Geschützt (Login): `/dashboard/*` (subscription, finance, assistant, costs, help, profile, settings,
revenues, analyses, files, reports, new-analysis, mein-weg), `/upload`, `/column-mapping`,
`/report/[id]`, `/organization`.
API: auth, analyze, assistant, upload, report/pdf, stripe/*, expenses, revenues, organization, u.a.

## 3. Funktioniert vs. Stub/Blocker

**Funktioniert:** Landing inkl. Navigation, Registrierung (legt User+Organisation an), Login,
Finanztracking (DB), Seiten-Rendering, neues Preismodell (Gratis + 1.990 €) wird angezeigt,
Direkt-Kauf-Flow leitet zum Checkout (fällt ohne Stripe sanft auf Tarif-Seite).

**Stub / blockiert:**
- **Stripe-Checkout** — keine Keys → 1.990 € nicht kassierbar.
- **KI-Analyse** — kein Anthropic-Key in Prod → kein echter Bericht.
- **Teaser-Gating NICHT gebaut** — „Gratis"-Nutzer bekämen aktuell den vollen Bericht (Kernlücke des Preismodells).
- **Passwort-Reset / E-Mail-Verifizierung** — noch zu prüfen/ergänzen.
- **Konto löschen / Datenexport (DSGVO Art. 17/20)** — in Datenschutz zugesagt, Funktion noch zu prüfen.

---

## 4. Bestätigte Befunde nach Audit-Phasen (mit Fundstelle)

### Phase 1 — Rechtliches (KRITISCH)
- **Impressum**: Platzhalter `[Unternehmensname]`, `[Straße…]`, `[PLZ] [Stadt]`, `[DE-Nummer]`, `[Name des Verantwortlichen]` → `src/app/impressum/page.tsx`. **Blocker A: echte Anbieterdaten nötig.**
- **Datenschutz**: dieselben Platzhalter → `src/app/datenschutz/page.tsx`.
- **AGB**: Platzhalter in §1; **§4 nennt 4 Tarife „Free, Standard, Tiefenanalyse, Komplett"** (`src/app/agb/page.tsx:60`) — Widerspruch zu echten 2 Tarifen (Gratis + Komplett 1.990 €). **Blocker D.**
- **Widerrufsbelehrung FEHLT komplett** (kein Treffer für „Widerruf" in `src/app`) — kritisch bei 1.990 €. Kein Muster-Formular, keine Kauf-Pflicht-Checkbox. **Blocker B (Verbraucher vs. Unternehmer).**
- **WPO/IDW-Claims**: `src/app/page.tsx`, `src/app/report/example/page.tsx`, `src/lib/ai.ts` (Prompt: „§2 WPO analog"). Kann als Gütesiegel-Anmutung gelten. **Blocker C: neutralisieren?**
- **Gewinnversprechen** (z. B. „+11.900 €/Monat", „Umsatz rauf. Kosten runter.") — als illustratives Rechenbeispiel kennzeichnen.

### Phase 2 — Kaputte/irreführende Knöpfe
- **`/report/example` → Login-Redirect**: `src/middleware.ts` schützt `'/report'` (matcht auch `/report/example`). Fix: `/report/example` ausnehmen. (Die Seite selbst hat KEINEN Auth-Check — nur die Middleware blockt.)
- **Fremddomain „auditly.app/dashboard"**: `src/components/landing/DashboardPreviewSection.tsx:86` (alter Projektname). Projektweit ersetzen.
- **„0"-Statistiken**: `src/components/landing/AnimatedCounter.tsx` startet bei `useState(0)` und zählt erst per IntersectionObserver hoch → SSR/Initialzustand zeigt „0". Fix: Zielwert als serverseitiger Fallback rendern (nie „0").
- **Buttons/Links**: noch systematisch durchklicken (Phase 0 Teil 2 offen) — bekannt: Branchen-Kacheln → `/register`, „Komplettanalyse kaufen" → `/register?plan=premium` → Checkout.
- **Schnellcheck-CTA** mit langer Query-URL (`/analyze/questionnaire?level=…`) — Direktstart noch zu verifizieren.

### Phase 3 — Video
- `src/components/landing/AnalyseVideo.tsx` = der 8-Sek-Higgsfield-Clip (abstraktes Motion-Graphic), kein Produkt-Tutorial. Soll durch echtes, untertiteltes Screen-Recording (60–120 Sek.) ersetzt werden. **Blocker E: selbst aufnehmen oder nur Skript+Player vorbereiten?**

### Phase 4 — Konsistenz
- Abschnittsanzahl gemischt („10" / „bis zu 12" / „zehn"); KPI-Anzahl; Branchen 10. Eine Zahl je Aussage festlegen.

---

## 5. Bereits in dieser Session umgesetzt (zur Einordnung)
Serverless-Umbau (Python-Funktion, Vercel Blob, PDF via @sparticuz/chromium), Security-Härtung
(fail-closed Token, SSRF/LFI), Mobile-Sichtbarkeits-Fix, Prüfer-Methodik im Prompt (Wesentlichkeit/
Plausibilität), Preismodell-Pivot (Gratis + 1.990 €, Abos raus), Direkt-Kauf-Flow, Sticky-Nav +
Mobile-Menü, Performance (LazyMotion), Nav-Scroll-Fix + Quick-Nav, „leere Sektionen"-Fix
(Inhalt immer sichtbar). **Hinweis:** Der „Inhalt immer sichtbar"-Fix hat die Reveal-Animationen
deaktiviert — der AnimatedCounter-Fix (Phase 2.3) muss damit zusammenpassen.

---

## 6. Offene Fragen / Blocker (Entscheidung nötig — nicht geraten)
| # | Frage | Status |
|---|---|---|
| A | Echte Anbieterdaten (Name, Anschrift, USt-ID / Kleinunternehmer)? | **Blocker** — ohne das kein Launch der Legal-Seiten |
| B | Käufer Verbraucher oder Unternehmer (B2B)? → Widerrufsrecht | Sicherheitshalber Widerruf + Checkbox |
| C | „WPO/IDW"-Claim neutralisieren? | Empfehlung: ja, nur als Abgrenzung |
| D | Echte Tarife final (nur Gratis + 1.990 €)? | AGB §4 daran angleichen |
| E | Video: selbst aufnehmen oder Skript+Player vorbereiten? | offen |
| F | Stripe-Account vorhanden (Checkout/Webhooks)? | für Kauf-Flow nötig |
| G | Teaser-Gating bauen (Gratis = nur Vorschau)? | offen — Kernlücke Preismodell |

---

## 7. Empfohlene Reihenfolge (nach Freigabe)
1. Zentrale `lib/legal/company.ts` + Impressum/Datenschutz/AGB befüllen (braucht **A**).
2. Widerrufsbelehrung + Kauf-Pflicht-Checkbox (braucht **B**).
3. `/report/example` aus Middleware-Schutz nehmen + echter Beispielbericht.
4. „auditly" → „profitora.de"; AnimatedCounter SSR-Fallback (keine „0").
5. AGB-Tarife angleichen; WPO/IDW entschärfen; Gewinn-Claims rahmen.
6. Video ersetzen/aufnahmebereit (braucht **E**).
7. Konto (Reset/Verifizierung/Löschung/Export) + Stripe (braucht **F**) + Teaser-Gating (**G**).
8. SEO/Meta/OG, Sitemap, robots, JSON-LD, A11y, Mobil.
