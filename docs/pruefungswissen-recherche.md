# Prüfungswissen – Recherche-Dossier (verifiziert)

**Zweck:** Geprüftes Wissen, wie professionelle Wirtschaftsprüfer (Big Four, IDW/ISA-Standards, Hochschul-/Berufsexamen) eine Prüfung methodisch aufbauen — übertragen auf Profitora als **betriebswirtschaftliche Wirtschaftlichkeitsanalyse** (KEINE gesetzliche Abschlussprüfung nach §317 HGB).

> **Verifikationshinweis:** Jeder Block nennt die Quelle und den Prüfstatus. „Verifiziert (primär)" = direkt aus Standard/Originalquelle bestätigt. „Verifiziert (mehrfach korroboriert)" = übereinstimmend in mehreren Fachquellen (ACCA, ICAEW, IFAC, PCAOB, IDW), Originalstandard kostenpflichtig.
> Stand der Recherche: Juni 2026.

---

## 1. Risikoorientierter Prüfungsansatz (das Fundament)

**Kernidee:** Prüfungsaufwand dorthin lenken, wo das Risiko wesentlicher Fehler am größten ist — statt alles gleich tief zu prüfen.

**Audit-Risikomodell** *(verifiziert, mehrfach korroboriert – ACCA P7, ICAEW)*:
```
Prüfungsrisiko = Inhärentes Risiko × Kontrollrisiko × Entdeckungsrisiko
(Audit Risk    = Inherent Risk     × Control Risk    × Detection Risk)
```
- **Inhärentes Risiko:** Fehleranfälligkeit aus der Natur des Geschäfts (komplexe/subjektive/veränderliche/unsichere Posten, Manipulationsanfälligkeit).
- **Kontrollrisiko:** internes Kontrollsystem verhindert/entdeckt Fehler nicht.
- **Entdeckungsrisiko:** die Prüfungshandlungen selbst übersehen den Fehler. Nur dieses steuert der Prüfer direkt (über Art/Umfang/Zeitpunkt der Prüfung).

**Standard:** ISA 315 (Revised 2019) – Identifizierung und Beurteilung der Risiken wesentlicher falscher Angaben auf Abschluss- UND Aussageebene; Risiko als *Spektrum*, nicht als Schublade. Deutsches Pendant: **IDW PS 261 n.F.** *(verifiziert primär – IDW-Verlag)*.

**Für Profitora:** Vor der Analyse Risiko-Schwerpunkte je Branche setzen (z. B. Hotel → Portalprovisionen + Personal; Gastro → Wareneinsatz/Food Cost). → bereits teilweise in `business_kpis.py`-Benchmarks angelegt.

---

## 2. Wesentlichkeit / Materiality (ISA 320 / IDW PS 250)

**Kernidee:** Nicht jede Abweichung zählt — nur solche, die eine wirtschaftliche Entscheidung beeinflussen würden.

**Benchmark-Beispiele aus ISA 320.A8** *(verifiziert – IFAC-Dokumentstruktur bestätigt; Prozentwerte mehrfach korroboriert, ICAEW/IFAC)*:
- Gewinnorientiertes Unternehmen: **~5 % des Ergebnisses vor Steuern (EBT)**
- Non-Profit / Break-even: **~1 % des Umsatzes oder der Gesamtkosten**

> **Wichtige Nuance (verifiziert):** ISA 320 nennt diese Prozentsätze ausdrücklich als *Beispiele, die berufliches Ermessen erfordern* — KEINE starre Formel.

**Performance Materiality (Toleranzwesentlichkeit):** niedriger angesetzt als die Gesamt-Wesentlichkeit, um das Risiko zu senken, dass viele kleine Fehler in Summe wesentlich werden.

**Für Profitora (Integrationsvorschlag):** Eine Wesentlichkeitsschwelle berechnen (z. B. ~5 % des Netto-Ergebnisses bzw. ~1 % des Umsatzes) und im Bericht nur Abweichungen oberhalb dieser Schwelle als „wesentlich" markieren. Macht die Analyse fokussierter und prüfer-ähnlicher.

---

## 3. Analytische Prüfungshandlungen (ISA 520 / IDW PS 312)

**Definition (verifiziert):** Beurteilung von Finanzinformationen durch Analyse *plausibler Zusammenhänge* zwischen finanziellen und nicht-finanziellen Daten; Untersuchung von Schwankungen/Beziehungen, die *von Erwartungswerten signifikant abweichen*.

**Vorgehen (verifiziert, ACCA):**
1. **Erwartungswert bilden** aus Branchen-/Vorjahres-/Plausibilitätswissen (z. B. „Umsatz korreliert mit Sitzplätzen/Fläche").
2. Erwartung mit Ist vergleichen, Toleranz festlegen.
3. Signifikante Abweichungen *untersuchen und plausibel erklären*.
4. Verlässlichkeit der Vergleichsdaten sicherstellen.

**Kennzahlen-/Branchenvergleich** ist explizit Teil davon (z. B. Margen je Handelssegment, Umsatz/Forderungen vs. Branchenschnitt).

**Für Profitora:** Genau das macht der Soll-Ist-Vergleich gegen `BUSINESS_TYPE_BENCHMARKS` bereits. Ausbaufähig: Erwartungswert + Toleranz pro KPI explizit ausweisen und Abweichungen erklären lassen.

---

## 4. Aussagen / Assertions (ISA 315 Revised 2019)

*(Verifiziert primär – ACCA, wörtlich aus ISA 315 Revised 2019)*

**Für Geschäftsvorfälle/Transaktionen:**
- **Occurrence (Eintritt):** erfasste Vorfälle sind tatsächlich passiert und betreffen das Unternehmen.
- **Completeness (Vollständigkeit):** alle zu erfassenden Vorfälle sind erfasst.
- **Accuracy (Genauigkeit):** Beträge/Daten korrekt erfasst.
- **Cut-off (Periodenabgrenzung):** in der richtigen Periode erfasst.
- **Classification (Zuordnung):** in den richtigen Konten erfasst.
- **Presentation (Darstellung):** korrekt aggregiert/aufgegliedert und verständlich beschrieben.

**Für Kontensalden:**
- **Existence (Existenz):** Vermögen/Schulden/Eigenkapital existieren wirklich.
- **Rights & Obligations (Rechte/Pflichten):** Unternehmen hat Eigentum/Verpflichtung.
- **Completeness, Accuracy/Valuation/Allocation (Bewertung), Classification, Presentation.**

**Für Profitora:** Auch ohne Belegprüfung nutzbar als *Plausibilitäts-Linse*: z. B. Completeness („sind alle Monate/Kostenarten vorhanden?"), Cut-off („Umsatzsprünge an Periodengrenzen?"), Accuracy („Summen konsistent?"). → speist die Datenqualitäts-Bewertung in Berichtsabschnitt 2.

---

## 5. Professionelle Skepsis & Fraud-Risiko (ISA 240)

*(Verifiziert, mehrfach korroboriert – IFAC, PwC Viewpoint, PCAOB AS 2401)*

- **Professionelle Skepsis:** durchgehend kritische Grundhaltung, „hinterfragender Verstand" — unabhängig von früherer Ehrlichkeit des Managements.
- **Zwei Pflicht-Annahmen:**
  1. **Umsatzrealisierung = widerlegbare** Fraud-Risiko-Vermutung (Umsatz ist der am häufigsten manipulierte Posten). Widerlegung nur dokumentiert.
  2. **Management Override of Controls = NICHT widerlegbar** — besteht immer, in jedem Unternehmen.
- **Red Flags:** Druck/Anreize (z. B. Umsatz-/Gewinnziele), ungewöhnliche Buchungen, Journal Entries zu untypischen Zeiten/Beträgen.

**Für Profitora:** Als *Auffälligkeits-/Plausibilitätsprüfung* nutzbar (z. B. „Umsatz unrealistisch glatt", „Sprünge zum Periodenende", „eine Kostenkategorie dominiert untypisch"). **Wichtig:** klar als Hinweis-zur-Selbstprüfung framen, KEINE Betrugsbehauptung.

---

## 6. Prüfungsnachweise & Stichproben (ISA 500 / ISA 530)

*(Verifiziert, mehrfach korroboriert)*

- **ISA 500 – Nachweise:** müssen **ausreichend** (Quantität) UND **angemessen** (Qualität = Relevanz + Verlässlichkeit) sein. Dokumentierte Nachweise sind verlässlicher als mündliche.
- **ISA 530 – Stichproben:** jede Einheit hat Auswahlchance; Ergebnis wird auf Grundgesamtheit hochgerechnet. Höhere geforderte Sicherheit → größerer Stichprobenumfang.

**Für Profitora:** Profitora rechnet über die **gesamte** hochgeladene Datenmenge (Voll-Population, kein Sampling) — das ist methodisch sogar stärker als Stichprobe, aber: es prüft NICHT die Echtheit/Vollständigkeit der Belege („Garbage in, garbage out"). Muss im Disclaimer klar bleiben.

---

## 7. Moderner Big-Four-Ansatz: Daten-Analytik

*(Verifiziert, mehrfach korroboriert – CPA Journal, Nature HSSC, MindBridge)*

- Trend zu **Full-Population-Testing** statt Stichprobe (ganze Transaktionsmenge auf Ausreißer prüfen).
- **Journal-Entry-Testing** per KI: Big-Four-Tools **Deloitte „Argon", EY „Helix", PwC „Aura"**.
- CAATs (computergestützte Prüfungstechniken) + KI erhöhen Prüfungsqualität; Skepsis bleibt menschlich.
- Hinweis: selbst bei Big Four nutzen erst ~12 % durchgängig die Vollpopulation statt Sampling — Profitoras Vollpopulations-Ansatz ist also modern.

**Für Profitora:** bestätigt die Architektur (Python rechnet Voll-Population, KI formuliert + erklärt Auffälligkeiten). Positionierung „KI-gestützte Analyse über die gesamten Daten" ist anschlussfähig an den State of the Art.

---

## 8. Standard-Prüfungsphasen (Synthese, verifiziert)

1. **Auftrag & Zielsetzung** annehmen/abgrenzen.
2. **Verständnis** von Unternehmen & Umfeld (ISA 315).
3. **Wesentlichkeit** festlegen (ISA 320).
4. **Risiken** identifizieren/beurteilen (ISA 315/240).
5. **Prüfungsstrategie/-programm** als Reaktion auf Risiken (ISA 330).
6. **Prüfungshandlungen:** Kontrolltests + aussagebezogene Prüfungen (analytisch ISA 520 + Einzelfall/Stichprobe ISA 530).
7. **Nachweise** würdigen (ISA 500), Skepsis wahren (ISA 240).
8. **Schlussfolgerung & Bericht.**

---

## Quellen (Stand Juni 2026)

- ACCA – Audit of assertions (ISA 315 Revised 2019): https://www.accaglobal.com/us/en/student/exam-support-resources/fundamentals-exams-study-resources/f8/technical-articles/assertions.html *(primär verifiziert)*
- ACCA – Audit risk (P7): https://www.accaglobal.com/middle-east/en/student/exam-support-resources/professional-exams-study-resources/p7/technical-articles/audit-risk.html
- ACCA – Analytical procedures (P7): https://www.accaglobal.com/us/en/student/exam-support-resources/professional-exams-study-resources/p7/technical-articles/analytical-procedures.html
- ICAEW – Risk assessment & ISA 315: https://www.icaew.com/technical/audit-and-assurance/audit/risk-assessment-internal-control-and-response/1-understanding-and-applying-the-requirements
- ICAEW – Materiality (ISA 320): https://www.icaew.com/library/subject-gateways/auditing/isa-320
- IFAC/IAASB – ISA 320 (Materiality), ISA 240 (Fraud), ISA 530 (Sampling) Handbook PDFs: https://www.ifac.org *(Dokumentstruktur primär bestätigt)*
- PCAOB – AS 2401 Consideration of Fraud: https://pcaobus.org/oversight/standards/auditing-standards/details/AS2401
- IDW-Verlag – IDW PS 261 n.F. (Fehlerrisiken) & IDW PS 312 (Analytische Prüfungshandlungen): https://shop.idw-verlag.de *(primär verifiziert: Standards existieren wie zitiert)*
- CPA Journal – Use of Data Analytics in Auditing (2023): https://www.cpajournal.com/2023/10/23/the-use-of-data-analytics-in-auditing-2/
- Nature Humanities & Social Sciences Communications – Big data analytics & journal-entry testing (2026): https://www.nature.com/articles/s41599-026-06626-0

## NICHT verifiziert / bewusst weggelassen
- Konkrete interne Prüfungs-Handbücher der Big Four (vertraulich, nicht öffentlich nachprüfbar) — nicht übernommen.
- YouTube-Einzelmeinungen: nur als Hinweisgeber genutzt, NICHT als Beleg übernommen (nicht verifizierbar).
- Exakte Original-Paragraphentexte der ISA/IDW (kostenpflichtig) — Inhalte über mehrere autorisierte Sekundärquellen korroboriert.
