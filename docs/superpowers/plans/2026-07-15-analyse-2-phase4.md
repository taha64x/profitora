# Analyse 2.0 (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Kompaktformat wie Phase 3 — Tasks spezifizieren Dateien/Verhalten/Verifikation, Code entsteht gegen den echten Dateistand.

**Goal:** Analysen deutlich besser machen (Spec §5): Datenqualitäts-Score + Schwerpunkte + Zeitraum im Wizard, Cockpit-Livedaten inkl. Plan-Personalkosten im Prompt, Maßnahmen-Tracker mit Wirkungs-Review, Auto-Monatsreport (regelbasiert, kein LLM), Forecast (Premium), Alt-Flow-Aufräumen.

**Spec:** §5.1/§5.2/§5.3 + §7 (Measure) · CLAUDE.md §17/§18 bleiben hart: keine Mitarbeiter-PII in Prompts — nur Aggregate.

## Tasks

### T1: Prisma `Measure` + generischer Feature-Guard
Measure lt. Spec §7 (organizationId, reportId?, title, description, potentialSavingsCents?, status OPEN|IMPLEMENTED|DISCARDED, implementedAt?). `entitlements-server.ts`: generisches `featureBlocked(key)` + `featureForbiddenResponse(label)`; `shiftsBlocked` als Wrapper erhalten. db:push, tsc, Commit.

### T2: Maßnahmen-Tracker
`/api/measures` CRUD (Business+ via `featureBlocked('measures')`), Status-Wechsel setzt/löscht `implementedAt`. UI `/dashboard/measures` (+layout-Gate): Status-Tabs, Karte je Maßnahme (Titel, Beschreibung, geschätzte Ersparnis, Datum), Formular-Modal, Status-Buttons (Umgesetzt/Verworfen/Wieder öffnen). NavLink „Maßnahmen" unter KI-Analyse. Commit.

### T3: Analyze-Pipeline 2.0
- Request-Body: `focusAreas` (Whitelist personal|wareneinsatz|energie|preise|marketing|fixkosten, max 3), `periodMonths` (1|3|12, Default wie bisher).
- `loadTrackedFinanceData`: Zeitraum parametrisieren; zusätzlich **Plan-Personalkosten** (Shifts der Periode × hourlyWageCents, aggregiert je Monat — KEINE Namen) und Bereichs-Summen (areaId→Name) mitgeben.
- Measures laden (OPEN alle + IMPLEMENTED letzte 6 Monate) → an Prompt.
- `ai.ts` `buildReportPrompt`: (a) Schwerpunkt-Anweisung (gewählte Themen doppelt so tief, Rest kompakt), (b) Executive Summary beginnt mit „Top-3-Sparpotenziale in €", (c) jede Empfehlung mit Schwierigkeit (leicht/mittel/schwer) + Zeithorizont, (d) neue Sektion „Maßnahmen-Review" wenn Maßnahmen vorhanden (Wirkung anhand der Zahlen beurteilen, Regel 3 bei fehlenden Daten), (e) Plan- vs. Ist-Personalkosten erwähnen wenn Plandaten da. Commit.

### T4: Wizard-Upgrade `/dashboard/new-analysis`
Neue API `/api/analysis-readiness`: {financeMonthsWithData, hasQuestionnairePossible, uploadCountByCategory, plannedShiftsExist} → Score 0–100 + konkrete Hint-Liste („Energie-Kategorie leer → Energie-Abschnitt entfällt"). UI: Score-Anzeige (Ampelfarbe) + Hinweise, Schwerpunkt-Chips (max 3), Zeitraum-Select (Dieser Monat/Quartal/12 Monate) → beides in analyze-POST. Warnung <40 vor Start. Commit.

### T5: Auto-Monatsreport (Cron, am 1.)
Nach Monatsreset: je Org Vormonats-KPIs (`computeFinanceKpis`) + Δ zum Vor-Vormonat + Ampeln; `sendMonthlyReportEmail` (short: KPI-Tabelle · full: + Ampel-Hinweise) an Owner, gated: flag-an → `ent.autoReport`; flag-aus → full für alle; nur wenn Umsatz>0 im Vormonat; `emailNotifications` respektieren. Regelbasiert, kein LLM. Commit.

### T6: Forecast (Premium)
`src/lib/forecast.ts` (TDD): `forecastSeries(history: {month, value}[], horizon=12)` — ≥13 Monate: Saison-naiv (Vorjahresmonat × Trendfaktor Ø6M/Ø6M-Vorjahr), sonst lineare Regression, Clamp ≥0, Runden. API `/api/forecast` (Premium via `featureBlocked('forecast')`): 24M-Historie (groupBy Monat) + Prognosen für Einnahmen/Ausgaben. Seite `/dashboard/forecast` (+Gate): Recharts-Chart Ist (solid) + Prognose (dashed) + Ergebnis-Zeile, Hinweis „statistische Fortschreibung, keine Garantie". NavLink „Forecast" unter Meine Zahlen. Commit.

### T7: Aufräumen
`/analyze`, `/analyze/upload`, `/analyze/questionnaire` → `redirect('/register?plan=single')` (Lead-Funnel; AnalysisRequest-Flow stillgelegt, Modell bleibt). `dashboard/reports/page.tsx` → `redirect('/dashboard/analyses')`. Commit.

### T8: Verifikation
Tests+tsc+build. Smoke: readiness-API-Score; Maßnahme anlegen→umsetzen; Forecast-API mit Seed-Daten; EIN echter Analyse-Lauf lokal (Opus) mit focusAreas+Maßnahme → Bericht enthält Top-3-Sparpotenziale vorn + Maßnahmen-Review + Schwierigkeit/Zeithorizont; Cron-Monatsreport-Zweig per Direktaufruf (Datum simulieren via Query `?forceMonthly=1` nur mit Secret). Flag-Gates: starter → measures/forecast 403. Merge+Push+Deploy-Verify.

## Empfohlene Plugins
Installiert & genutzt: vercel, context7 (Recharts/Prisma-Details bei Bedarf). Nichts Neues.
