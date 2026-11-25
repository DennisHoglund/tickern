# Tickern – specifikation

## Syfte
Personlig PWA för iPhone som visar svenska aktier i en grön terminal: watchlist, tickertape, logg och kommandorad.
Kurserna är fördröjda cirka 15 minuter (gratis källa). Riktar sig till nybörjare: siffrorna förklaras i klarspråk. En användare (Dennis), ingen inloggning i steg 1.

## Stack
- Ren HTML/CSS/JS utan byggsteg. Moduler som IIFE på `window` (`TickernKurser`).
- Typsnitt IBM Plex Mono från Google Fonts.
- Supabase edge function `tickern-quote` i det delade projektet (`sjdznlmnvubqscftdkoj`, samma som Jaktvind/Svampkartan).
  Funktionen hämtar Yahoo Finance chart-API (v8, `range=1mo`, `interval=1d`), cachar 60 s och rör ingen databas.
- GitHub Pages via Actions. Edge function deployas i samma workflow (kräver `SUPABASE_ACCESS_TOKEN`).

## Design
- Mörkt (standard): bakgrund `#0A0F0A`, text `#33FF66`, dämpad `#1F9E45`, nedgång `#FF5252` (röd). Scanlines.
- Ljust ("papperstryck"): bakgrund `#F1F4EC`, text `#0B5D25`, dämpad `#3F6E4C`, nedgång `#C62828`.
- Temaknapp Auto/Ljust/Mörkt (`tickern-theme`). Upp/ned visas med både färg och ▲▼.
- Ikon: `>_` med stigande staplar på svart.

## Funktioner (steg 1)
- Watchlist: ticker, 7-dagars sparkline (blocktecken), senaste kurs, förändring % mot föregående handelsdag.
- Tickertape med OMXS30 + listans aktier.
- Status: tid för senaste hämtning, marknad öppen/stängd (09:00–17:30 vardagar, helgdagar ignoreras), OFFLINE.
- Kommandon: `VOLV-B`/`ADD X`/`WATCH X` lägger till (`.ST` läggs på, `OMX` → `^OMX`), `DEL X`/`RM X`, `UPD`, `CLEAR`, `RESET`, `HELP`.
- Okänd ticker tas bort automatiskt och loggas som fel.
- Uppdatering var 60:e sekund, vid `visibilitychange` och `online`.

## Funktioner (steg 2) – förklaringar i klarspråk
Allt räknas fram av regler i `forklara.js` från kurserna. Ingen AI och inga nyheter, så appen säger aldrig *varför* på riktigt, bara vad siffrorna visar.
- **Detaljvy:** tryck på en aktie eller skriv `INFO VOLV-B`. Visar bolagsbeskrivning (fast lista för vanliga bolag),
  kurs, månadsgraf, "Vad hände?" och nyckeltal med förklaringar. ESC stänger.
- Regler för "Vad hände?": steg/sjönk X %, stor rörelse (≥3 %) eller lugn dag (<0,5 %), jämförelse mot OMXS30
  (som börsen inom 0,5 procentenheter, bättre/sämre, eller åt motsatt håll = troligen bolagsspecifikt), nära dagens
  högsta/lägsta (översta/nedersta 20 %), förändring senaste månaden och nära månadens högsta/lägsta (inom 2 %).
- **Dagens sammanfattning:** vardagar efter 17:30 skrivs en gång per dag (`tickern-sammanfattning`) i loggen:
  OMXS30, bästa och sämsta aktien, hur många som steg och en mening om hur listan följde börsen. `DAG` visar den när som helst.

## Lagring (localStorage)
- `tickern-watch` – symboler, t.ex. `VOLV-B.ST`.
- `tickern-kurser` – senaste kurser för offline-visning.
- `tickern-logg` – högst 40 rader.
- `tickern-sammanfattning` – datum för senaste automatiska sammanfattningen.

## Edge function
`GET /functions/v1/tickern-quote?symbols=VOLV-B.ST,^OMX` → `{ hamtad, kurser: [{ symbol, namn, valuta, pris, prev, forandring, procent, hog, lag, volym, tid, spark, manad }] }`. `spark` = senaste 7 stängningskurserna, `manad` = alla stängningskurser senaste månaden.
Okänd symbol ger `{ symbol, fel: 'okänd' }`. Högst 40 symboler. Tolkningen ligger i `tolka.mjs` och testas i Node.

## Tester
Playwright på iPhone 14 (WebKit) och Pixel 7 (Chromium). Kursfunktionen och Google Fonts mockas i `tests/mock.js`.
Rapport: https://dennishoglund.github.io/tickern/rapport/

## Beslut
- Ingen officiell gratiskälla för realtid på Stockholmsbörsen → Yahoo, fördröjt, bakom eget utbytbart lager.
- Avanza/Nordnet används inte (inget öppet API / tar inte emot nya API-kunder).

## Kvar att göra
- Längre grafer (1Å–5Å) i detaljvyn.
- Prislarm (push eller logg).
- Eventuellt AI-förklaringar med nyheter (beslut nu: regler, gratis).
- Steg 4: insynshandel från FI som loggrader.
