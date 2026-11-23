// Kurser: symboler, hämtning från edge function, cache för offline och formatering.
(function () {
  const CACHE_KEY = 'tickern-kurser';
  const BLOCK = '▁▂▃▄▅▆▇█';

  // "volv-b" → "VOLV-B.ST", "omx"/"omxs30" → "^OMX"
  function tillSymbol(text) {
    const t = String(text || '').trim().toUpperCase().replace(/\s+/g, '-');
    if (!t) return '';
    if (t === 'OMX' || t === 'OMXS30' || t === '^OMX') return '^OMX';
    if (t.startsWith('^') || t.includes('.')) return t;
    return t + '.ST';
  }

  // "VOLV-B.ST" → "VOLV-B", "^OMX" → "OMXS30"
  function visning(symbol) {
    if (symbol === '^OMX') return 'OMXS30';
    return symbol.replace(/\.ST$/, '');
  }

  function lasCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || { kurser: {} }; } catch (e) { return { kurser: {} }; }
  }

  function sparaCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* fullt eller privat läge */ }
  }

  // Hämtar kurser. Kastar vid nätverksfel så att appen kan visa OFFLINE.
  async function hamta(symboler) {
    const url = window.TICKERN_CONFIG.quoteUrl + '?symbols=' + symboler.map(encodeURIComponent).join(',');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Kursservern svarade ' + res.status);
    const data = await res.json();
    const c = lasCache();
    for (const k of data.kurser || []) if (!k.fel) c.kurser[k.symbol] = k;
    c.hamtad = data.hamtad || Date.now();
    sparaCache(c);
    return data.kurser || [];
  }

  function sparkline(varden) {
    if (!varden || varden.length < 2) return '';
    const min = Math.min(...varden), max = Math.max(...varden);
    const span = max - min || 1;
    return varden.map((v) => BLOCK[Math.round(((v - min) / span) * (BLOCK.length - 1))]).join('');
  }

  const nf = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Vanligt minustecken och vanligt mellanslag – ser rätt ut i monospace
  const tal = (v) => (v == null || isNaN(v) ? '–' : nf.format(v).replace(/−/g, '-').replace(/[  ]/g, ' '));
  const procent = (v) => (v == null || isNaN(v) ? '–' : (v > 0 ? '+' : '') + tal(v));
  const riktning = (v) => (v == null || isNaN(v) || v === 0 ? 'still' : v > 0 ? 'upp' : 'ned');
  const pil = (v) => ({ upp: '▲', ned: '▼', still: '■' })[riktning(v)];

  window.TickernKurser = { tillSymbol, visning, hamta, lasCache, sparkline, tal, procent, riktning, pil };
})();
