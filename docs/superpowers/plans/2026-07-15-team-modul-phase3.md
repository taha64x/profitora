# Team-Modul (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Kompaktformat: Tasks spezifizieren Dateien/Verhalten/Verifikation; Code entsteht beim Ausführen gegen den echten Dateistand (bewährtes Vorgehen aus Phase 1+2).

**Goal:** Mitarbeiter-Stammdaten, Wochen-Schichtplan, Abwesenheiten, Live-„Jetzt im Dienst", Plan-Share-Link, geplante Lohnkosten — Chef pflegt alles, keine Mitarbeiter-Logins (Spec §4.2).

**Spec:** `docs/superpowers/specs/2026-07-14-abo-cockpit-design.md` §4.2 · Gating: Stammdaten ab Starter (maxEmployees), Schichtplan/Abwesenheiten/Live Business+ (`ent.shifts`), alles flag-gated wie gehabt.

**Architektur-Entscheide:**
- Schichtzeiten als **Minuten seit 0:00** (`startMin`/`endMin`, 0–1440, endMin > startMin; Nachtschichten über Mitternacht = V2) → pure, testbare Logik in `src/lib/shifts.ts`.
- „Jetzt im Dienst" rechnet in **Europe/Berlin** (Server läuft UTC): `nowInBerlin()` via Intl, injizierbares `Date` für Tests.
- Geplante Lohnkosten V1 = nur Stundenlöhner (Gehälter sind Fixkosten, keine Plan-Rechnung).
- Konflikt-Prüfung serverseitig beim Schicht-Speichern: Überlappung gleicher MA/Tag → 409; Abwesenheit am Tag → 409.
- Share-Link: unguessbarer Token, öffentliche Read-only-Seite `/plan/[token]` (nur Name/Zeit/Bereich — bewusst öffentlich, regenerierbar).

## Tasks

### T1: Prisma — `Employee`, `Shift`, `ShiftTemplate`, `Absence`, `PlanShareToken`
Felder lt. Spec §7 (Löhne in Cent: `hourlyWageCents`, `monthlySalaryCents`; `color` default `#0E1A33`; `vacationDaysPerYear`). Shift: `date DateTime` (UTC-Mitternacht) + `startMin`/`endMin Int` + `areaId?` + `note?`, Index `[organizationId, date]`. Absence: `type` VACATION|SICK|OFF, `startDate`/`endDate`. PlanShareToken: `organizationId @unique`, `token @unique`, `active`. Organization/Area-Relationen ergänzen. `db:generate` + `db:push` (lokal) + tsc. Commit.

### T2: `src/lib/shifts.ts` (TDD, `tests/shifts.test.ts`)
`minutesToLabel/labelToMinutes` ('08:30'↔510), `shiftsOverlap`, `weekDates(date)` → 7 UTC-Datumskeys ab Montag, `isAbsent(absences, employeeId, dateKey)`, `nowInBerlin(now?)` → `{dateKey, minutes}`, `isOnDuty(shift, berlinNow)`, `plannedWageCents(shifts, employees)` (nur hourlyWageCents). Tests inkl. Wochenwechsel (Sonntag → Montag davor), Berlin-TZ-Fall (UTC 23:30 Winter = Berlin 00:30 Folgetag). Commit.

### T3: APIs `/api/team/*` (alle: Auth + `cockpitBlocked()`; Schicht-Routen zusätzlich `shifts`-Entitlement)
Neuer Guard in `entitlements-server.ts`: `shiftsBlocked()` (analog cockpitBlocked, prüft `ent.shifts`).
- `employees/route.ts`: CRUD; POST prüft `ent.maxEmployees` (flag-gated); DELETE = `active:false` + Anonymisierung NUR auf explizites `?hard=1` verzichten — V1: Soft-Delete (active false), Löschen mit Schichten blockieren wäre nervig → Soft only.
- `shifts/route.ts`: GET `?week=YYYY-MM-DD` (Mo–So, include employee minimal + area), POST/PUT mit Konflikt-409, DELETE; POST `copy-week` als eigener Endpoint `shifts/copy/route.ts` `{fromWeek, toWeek}` (kopiert alle Schichten, überspringt Konflikte, Antwort {copied, skipped}).
- `templates/route.ts`: GET/POST/DELETE (label, startMin, endMin, areaId?).
- `absences/route.ts`: CRUD (Validierung endDate ≥ startDate).
- `share/route.ts`: GET (erzeugt bei Bedarf Token, liefert `{url}`), POST `{regenerate:true}`.
tsc + Commit.

### T4: Öffentliche Plan-Seite `/plan/[token]/page.tsx`
Server-Component ohne Auth: Token→Org (active), `?week=` optional, zeigt Wochengrid read-only (MA-Name, Zeiten, Bereich, Abwesenheits-Marker), Profitora-Branding dezent, `robots: noindex`. 404 bei unbekanntem/inaktivem Token. Commit.

### T5: UI `/dashboard/team` (+ layout Cockpit-Gate)
Client-Page im costs-Stil: MA-Tabelle (Farb-Dot, Name, Position, Lohn/Gehalt, Wochenstunden, aktiv-Toggle), Modal-Form (alle Felder, Bereich-Select, Farbe aus 8er-Palette), Sektion „Abwesenheiten" (Liste kommende + Modal: MA/Typ/von/bis/Notiz). Limit-Hinweis wenn maxEmployees erreicht (403-Handling). Commit.

### T6: UI `/dashboard/schedule` (+ layout mit `shiftsBlocked()`-Gate → `?upgrade=1`)
Wochen-Navigation (‹ Heute ›, KW-Label), Grid Zeilen=aktive MA × Spalten=Mo–So; Zelle: Schicht-Chips (MA-Farbe, „08:00–16:00", Bereichs-Kürzel), Klick Zelle → Modal (Vorlagen-Buttons + Start/Ende/Bereich/Notiz), Chip → Bearbeiten/Löschen; Abwesenheits-Tage schraffiert/Badge. Kopfzeile: „Vorwoche kopieren", Share-Button (holt `/api/team/share`, kopiert URL in Zwischenablage), Wochensumme Stunden + geplante Lohnkosten. 409-Konflikte als Toast. Commit.

### T7: Nav + Home-Widget
DashboardLayout: Sektion „Team" (Mitarbeiter, Schichtplan) nach „Meine Zahlen". Home: Team-Teaser-Karte ersetzen durch `OnDutyCard` (Server): lädt heutige Schichten+Absences, `isOnDuty` mit Berlin-now → Avatare (Farb-Initialen) + „bis HH:MM"; leer → „Heute niemand eingeplant" + Link; keine MA → bisheriger Teaser-Text mit Link `/dashboard/team`; wenn Flag an && !ent.shifts → Upgrade-Teaser. Commit.

### T8: Verifikation
`npm test` + tsc + build. Server-Smoke (lokale DB): MA anlegen → Schicht heute (jetzt±2h Berlin) → Home zeigt „Jetzt im Dienst" mit Namen; Overlap-POST → 409; Absence anlegen → Schicht am Tag → 409; copy-week kopiert; Share-URL öffnet Plan ohne Cookie; Flag an: free → schedule redirect, business → offen; employees-Limit: starter (10) → 11. MA → 403. Merge in main + push + Deploy-Verify.

## Empfohlene Plugins
Installiert & genutzt: vercel (Deploy), chrome-devtools/playwright (Smoke optional), context7 (bei Bedarf Prisma/Next-Details). Nichts Neues nötig.
