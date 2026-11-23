# Tickern

Svenska aktier i grön terminal. PWA för iPhone med watchlist, tickertape och kommandorad. Kurserna är fördröjda ~15 min.

- App: https://dennishoglund.github.io/tickern/
- Testrapport: https://dennishoglund.github.io/tickern/rapport/

## Kom igång
1. Öppna appen i Safari → Dela → Lägg till på hemskärmen.
2. Skriv `HELP` i kommandoraden.

## Filer
| Fil | Innehåll |
|---|---|
| `index.html`, `styles.css` | Sidan och terminaldesignen (ljust/mörkt) |
| `config.js` | Adress till kursfunktionen, standardlista |
| `kurser.js` | Symboler, hämtning, cache, formatering |
| `app.js` | Watchlist, tickertape, logg, kommandon, tema |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA och offline |
| `supabase/functions/tickern-quote/` | Edge function som hämtar kurser från Yahoo |

## Tester
```
npm ci
npx playwright install webkit chromium
npx playwright test
```
