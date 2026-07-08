# Google-Login aktivieren (einmalig, ~10 Min)

Der Code ist fertig deployed, aber der Button erscheint erst, wenn die drei
Umgebungsvariablen gesetzt sind. Dafür brauchst du einen Google-OAuth-Client:

## 1. Google Cloud Console
1. https://console.cloud.google.com öffnen (mit deinem Google-Konto)
2. Oben Projekt-Dropdown → **Neues Projekt** → Name `Profitora` → Erstellen
3. Menü → **APIs & Dienste → OAuth-Zustimmungsbildschirm**
   - User Type: **Extern** → Erstellen
   - App-Name: `Profitora`, Support-E-Mail: `kontakt@profitora.de`
   - App-Domain: `https://profitora.de`, Datenschutz: `https://profitora.de/datenschutz`
   - Speichern (Scopes/Testnutzer: einfach Weiter)
   - Am Ende: **App veröffentlichen** (Status „In Produktion", sonst können sich nur Testnutzer anmelden)
4. **APIs & Dienste → Anmeldedaten → + Anmeldedaten erstellen → OAuth-Client-ID**
   - Anwendungstyp: **Webanwendung**, Name `Profitora Web`
   - Autorisierte Weiterleitungs-URIs — beide eintragen:
     - `https://profitora.de/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback`
   - Erstellen → **Client-ID** und **Client-Secret** kopieren

## 2. Env-Variablen setzen (Claude sagen oder selbst)
```bash
cd ~/Desktop/Claude/hotel-audit-ai
printf 'DEINE_CLIENT_ID'     | npx vercel env add GOOGLE_CLIENT_ID production
printf 'DEIN_CLIENT_SECRET'  | npx vercel env add GOOGLE_CLIENT_SECRET production
printf '1'                   | npx vercel env add NEXT_PUBLIC_GOOGLE_LOGIN production
npx vercel deploy --prod
```
Zusätzlich in `.env.local` für lokale Entwicklung eintragen.

## Verhalten
- Button „Mit Google anmelden" auf /login und /register (Schritt 2)
- Neue Google-Nutzer: Konto + Platzhalter-Unternehmen → Onboarding fragt Branche etc. ab
- Bestehende E-Mail-Konten: Google-Login mit derselben E-Mail loggt ins bestehende Konto ein
- Mit gewähltem Paket (`/register?plan=triple`): nach Google-Login direkt zur Kaufseite
  (Kauf-Zustimmung §356 BGB bleibt dort Pflicht)
