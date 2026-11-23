# Tickern

Svenska aktier i grön terminal. PWA för iPhone med watchlist, tickertape och kommandorad. Kurserna är fördröjda ~15 min.

- App: https://dennishoglund.github.io/tickern/
- Testrapport: https://dennishoglund.github.io/tickern/rapport/

## Kom igång
1. Öppna appen i Safari → Dela → Lägg till på hemskärmen.
2. Skriv `HELP` i kommandoraden. Tryck på en aktie för en förklaring i klarspråk. `DAG` visar dagens sammanfattning (kommer automatiskt efter 17:30).

## Filer
| Fil | Innehåll |
|---|---|
| `index.html`, `styles.css` | Sidan och terminaldesignen (ljust/mörkt) |
| `config.js` | Adress till kursfunktionen, standardlista |
| `kurser.js` | Symboler, hämtning, cache, formatering |
| `forklara.js` | Bolagsbeskrivningar, förklaringar och dagens sammanfattning (regler) |
| `app.js` | Watchlist, detaljvy, tickertape, logg, kommandon, tema |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA och offline |
| `supabase/functions/tickern-quote/` | Edge function som hämtar kurser från Yahoo |

## Tester
```
npm ci
npx playwright install webkit chromium
npx playwright test
```
