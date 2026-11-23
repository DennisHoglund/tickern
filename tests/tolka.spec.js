// Enhetstester för edge functionens tolkning av Yahoo-svar (körs utan webbläsare).
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const modul = () => import(pathToFileURL(path.join(__dirname, '..', 'supabase', 'functions', 'tickern-quote', 'tolka.mjs')).href);

// Tre handelsdagar, sista är idag (23 nov 2026)
const svar = {
  chart: { result: [{
    meta: { currency: 'SEK', symbol: 'VOLV-B.ST', shortName: 'Volvo B', regularMarketPrice: 287.1,
      regularMarketTime: Date.UTC(2026, 10, 23, 14, 0) / 1000, regularMarketDayHigh: 288.4, regularMarketDayLow: 283.1,
      regularMarketVolume: 4812330, chartPreviousClose: 270 },
    timestamp: [Date.UTC(2026, 10, 19, 8) / 1000, Date.UTC(2026, 10, 20, 8) / 1000, Date.UTC(2026, 10, 23, 8) / 1000],
    indicators: { quote: [{ close: [280, 283.58, 287.1] }] }
  }] }
};

test.describe('Edge function', () => {
  test('räknar förändring mot föregående handelsdag', async () => {
    const { tolka } = await modul();
    const k = tolka('VOLV-B.ST', svar);
    expect(k.namn).toBe('Volvo B');
    expect(k.prev).toBe(283.58);
    expect(k.procent).toBeCloseTo(1.241, 2);
    expect(k.spark).toEqual([280, 283.58, 287.1]);
  });

  test('utan handel idag jämförs mot senaste stängning', async () => {
    const { tolka } = await modul();
    const igar = JSON.parse(JSON.stringify(svar));
    igar.chart.result[0].meta.regularMarketTime = Date.UTC(2026, 10, 24, 14) / 1000;
    expect(tolka('VOLV-B.ST', igar).prev).toBe(287.1);
  });

  test('okänd symbol ger fel', async () => {
    const { tolka, SYMBOL } = await modul();
    expect(tolka('X.ST', { chart: { result: null, error: { code: 'Not Found' } } }).fel).toBe('okänd');
    expect(SYMBOL.test('VOLV-B.ST')).toBe(true);
    expect(SYMBOL.test('^OMX')).toBe(true);
    expect(SYMBOL.test('<script>')).toBe(false);
  });
});
