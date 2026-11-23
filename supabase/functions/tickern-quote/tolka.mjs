// Gör om Yahoo Finance chart-svar (v8, range=1mo, interval=1d) till Tickerns format.
// Ren funktion utan nätverk så att den kan testas i Node.

export function tolka(symbol, svar) {
  const res = svar && svar.chart && svar.chart.result && svar.chart.result[0];
  if (!res || !res.meta || typeof res.meta.regularMarketPrice !== 'number') {
    return { symbol, fel: 'okänd' };
  }
  const m = res.meta;
  const tider = res.timestamp || [];
  const stang = ((res.indicators && res.indicators.quote && res.indicators.quote[0].close) || []);

  // Para ihop tid och stängningskurs, hoppa över tomma dagar
  const dagar = [];
  for (let i = 0; i < tider.length; i++) {
    if (typeof stang[i] === 'number') dagar.push({ t: tider[i] * 1000, c: stang[i] });
  }

  const pris = m.regularMarketPrice;
  const tid = (m.regularMarketTime || 0) * 1000;
  const dag = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' });

  // Föregående stängning: dagen före den senaste handelsdagen
  let prev = null;
  if (dagar.length) {
    const sista = dagar[dagar.length - 1];
    if (dag(sista.t) === dag(tid)) prev = dagar.length > 1 ? dagar[dagar.length - 2].c : null;
    else prev = sista.c;
  }
  if (prev == null && typeof m.chartPreviousClose === 'number') prev = m.chartPreviousClose;

  const forandring = prev != null ? pris - prev : null;
  const procent = prev ? (forandring / prev) * 100 : null;

  return {
    symbol,
    namn: m.shortName || m.longName || symbol,
    valuta: m.currency || 'SEK',
    pris,
    prev,
    forandring,
    procent,
    hog: m.regularMarketDayHigh ?? null,
    lag: m.regularMarketDayLow ?? null,
    volym: m.regularMarketVolume ?? null,
    tid,
    spark: dagar.slice(-7).map((d) => d.c)
  };
}

// Godkända symboler: VOLV-B.ST, ^OMX, SINCH.ST osv.
export const SYMBOL = /^\^?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
