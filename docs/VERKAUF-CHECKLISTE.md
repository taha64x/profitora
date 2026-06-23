# Verkauf & Rechtstexte – Checkliste bis zum Live-Gang

Stand: 22.06.2026 · Status Steuer: **Kleinunternehmer §19 UStG**

## ✅ Schon gebaut (Code fertig, wartet auf Aktivierung)
- [x] Auto-Versand **Auftragsbestätigung + Rechnung** beim Kauf
      → `src/lib/email.ts` → `sendOrderConfirmationEmail()`
      → angebunden im Stripe-Webhook `src/app/api/stripe/webhook/route.ts`
- [x] Rechnung als **Kleinbetragsrechnung (§33 UStDV, < 250 €)** mit §19-Hinweis
- [x] Zentrale Anbieterdaten `src/lib/company.ts`
- [x] Gmail-Signatur `docs/email-signatur.html`

## 🔧 Du musst noch ausfüllen (sonst Rechnung ungültig)
In `src/lib/company.ts` die `[BITTE AUSFÜLLEN]`-Felder ersetzen:
- [ ] `legalName` – dein voller Name (Einzelunternehmen)
- [ ] `street`, `city` – ladungsfähige Anschrift (Pflicht für Impressum & Rechnung)
- [ ] `taxNumber` – Steuernummer vom Finanzamt
- [ ] `phone`
In `docs/email-signatur.html`: Name, Rolle, Telefon eintragen.

## 💳 Stripe (noch nicht vorhanden)
1. Konto auf **stripe.com** anlegen (kostenlos, Gebühr nur pro Verkauf ~1,5 % + 0,25 €).
2. Produkt „Komplettanalyse" anlegen, Preis **19,90 € einmalig** → Price-ID kopieren.
3. In `.env` setzen: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM`.
4. Webhook-Endpoint in Stripe anlegen: `https://profitora.de/api/stripe/webhook`
   → Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`.
5. **Zustimmung zum sofortigen Ausführen** beim Checkout abfragen (Pflicht für Widerruf-Verzicht
   bei digitalen Inhalten, §356 Abs. 5 BGB) – Checkbox vor dem Bezahlen.

## 📧 Resend (E-Mail-Versand)
- [ ] Konto auf **resend.com**, Domain `profitora.de` verifizieren (DNS bei name.com).
- [ ] `RESEND_API_KEY` in `.env` setzen. Ohne Key versendet der Code nichts (kein Fehler).

## ⚖️ Rechtstexte (anwaltlich prüfen lassen!) – als Seiten unter profitora.de
- [ ] **Impressum** (§5 DDG/TMG) – Pflicht, sofort
- [ ] **Datenschutzerklärung** (DSGVO)
- [ ] **AGB** – Leistungsbeschreibung, Preise, Zahlung
- [ ] **Widerrufsbelehrung** – inkl. Verzicht bei sofortiger digitaler Bereitstellung
- [ ] **AVV / Auftragsverarbeitungsvertrag** mit Anthropic (DPA verfügbar) – DSGVO-Pflicht,
      da Kundendaten durch KI verarbeitet werden (siehe CLAUDE.md §18)
- Die E-Mail verlinkt bereits `/agb`, `/widerruf`, `/datenschutz` – diese Seiten müssen existieren.

> Hinweis: Vorlagen für Impressum/AGB/Widerruf gibt es z. B. beim IT-Recht Kanzlei-Generator
> oder eRecht24. Für den AVV mit Anthropic deren Standard-DPA gegenzeichnen.
