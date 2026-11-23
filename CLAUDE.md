# Tickern – instruktioner för AI-assistenter

Läs `SPEC.md` för hela specifikationen. Det här är reglerna som gäller vid varje ändring.

## Projektet
- Privat PWA med svenska aktier i grön terminalstil, används på iPhone.
- Ren HTML/CSS/JS **utan byggsteg**. Inga ramverk, ingen bundler.

## Språk och ton
- All UI-text, kommentarer, commit-meddelanden och testnamn på **svenska**.

## Får aldrig brytas
- **Supabase-projektet delas med Jaktvind och Svampkartan.** Rör aldrig befintliga tabeller, auth-inställningar eller mejlmallar.
  Allt Tickern-eget har prefixet `tickern-`/`tickern_` (funktionen heter `tickern-quote`).
- Inga hemligheter i koden. Edge function deployas från CI med `SUPABASE_ACCESS_TOKEN` som hemlighet.
- Kursdata kommer bara via `tickern-quote`, aldrig direkt från appen till Yahoo.

## Vid varje ändring
1. Höj `CACHE` i `sw.js` (`tickern-vN`) när appfiler ändras och lägg nya filer i `SHELL`.
2. Nya JS-filer: `<script>` i `index.html` och i `SHELL`.
3. Kör testerna: `npx playwright test`. All extern trafik mockas i `tests/mock.js`.
4. Lägg till tester för ny funktionalitet. `bild(page, 'Namn')` för skärmdumpar i rapporten.
5. Uppdatera `SPEC.md` och `README.md`.
6. Committa med svenskt meddelande och pusha till `main`.

## Design och kod
- Färger bara via CSS-variablerna i `styles.css`. Ljust + mörkt läge.
- Tryckytor ≥ 44 px, `env(safe-area-inset-*)`, input 16 px (ingen zoom i Safari).
- `localStorage` alltid i try/catch, nycklar börjar med `tickern-`. Escapa text som hamnar i HTML (`esc()`).
- Rött i WebKit men grönt i Chromium betyder oftast ett riktigt Safari-fel – fixa appen.
