// Tickern – watchlist, kommandorad, logg och tema.
(function () {
  const K = window.TickernKurser;
  const CFG = window.TICKERN_CONFIG;
  const $ = (id) => document.getElementById(id);

  const WATCH_KEY = 'tickern-watch';
  const LOGG_KEY = 'tickern-logg';
  const THEME_KEY = 'tickern-theme';
  const LOGG_MAX = 40;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const las = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } };
  const spara = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignorera */ } };

  // ---- Tema --------------------------------------------------------------
  const THEMES = ['auto', 'light', 'dark'];
  const THEME_LABELS = { auto: 'Auto', light: 'Ljust', dark: 'Mörkt' };
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('theme-label').textContent = THEME_LABELS[theme];
    const dark = theme === 'dark' || (theme === 'auto' && darkQuery.matches);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#0A0F0A' : '#F1F4EC');
  }
  let theme = las(THEME_KEY, 'auto');
  if (!THEMES.includes(theme)) theme = 'auto';
  applyTheme(theme);
  darkQuery.addEventListener('change', () => applyTheme(theme));
  $('btn-theme').addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    spara(THEME_KEY, theme);
    applyTheme(theme);
  });

  // ---- Tid och marknad ---------------------------------------------------
  function sthlm(d) {
    const p = {};
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      .formatToParts(d).forEach((x) => { p[x.type] = x.value; });
    return p;
  }
  const klocka = (ms) => { const p = sthlm(new Date(ms)); return p.hour + ':' + p.minute + ':' + p.second; };
  function marknadOppen(d) {
    const p = sthlm(d);
    if (['lör', 'sön'].includes(p.weekday.replace('.', ''))) return false;
    const min = Number(p.hour) * 60 + Number(p.minute);
    return min >= 9 * 60 && min < 17 * 60 + 30;
  }

  // ---- Logg --------------------------------------------------------------
  let logg = las(LOGG_KEY, []);
  function logga(text, typ) {
    logg.unshift({ t: Date.now(), text, typ: typ || '' });
    logg = logg.slice(0, LOGG_MAX);
    spara(LOGG_KEY, logg);
    renderLogg();
  }
  function renderLogg() {
    $('logg').innerHTML = logg.map((r) =>
      '<li class="' + esc(r.typ) + '">[' + klocka(r.t) + '] ' + esc(r.text) + '</li>').join('');
  }

  // ---- Watchlist ---------------------------------------------------------
  let watch = las(WATCH_KEY, null);
  if (!Array.isArray(watch)) watch = CFG.standardlista.map(K.tillSymbol);
  let nyss = null;
  let offline = false;

  function renderLista() {
    const kurser = K.lasCache().kurser;
    if (!watch.length) {
      $('lista').innerHTML = '<p class="tom">Listan är tom. Skriv en ticker, t.ex. VOLV-B.</p>';
      return;
    }
    $('lista').innerHTML = watch.map((s) => {
      const k = kurser[s];
      const r = k ? K.riktning(k.procent) : 'still';
      return '<div class="rad ' + r + (s === nyss ? ' ny' : '') + '" role="row" data-symbol="' + esc(s) + '">' +
        '<span class="tkr" role="cell">' + esc(K.visning(s)) + '</span>' +
        '<span class="spark" role="cell" aria-hidden="true">' + esc(k ? K.sparkline(k.spark) : '') + '</span>' +
        '<span class="pris" role="cell">' + (k ? K.tal(k.pris) : '…') + '</span>' +
        '<span class="pct" role="cell">' + (k ? K.pil(k.procent) + K.procent(k.procent) : '') + '</span>' +
        '</div>';
    }).join('');
  }

  function renderTape() {
    const kurser = K.lasCache().kurser;
    const delar = ['^OMX', ...watch.filter((s) => s !== '^OMX')].map((s) => kurser[s]).filter(Boolean).map((k) =>
      '<span class="' + (K.riktning(k.procent) === 'ned' ? 'dim' : '') + '">' + esc(K.visning(k.symbol)) + ' ' +
      K.tal(k.pris) + ' ' + K.pil(k.procent) + K.procent(k.procent) + '% · </span>').join('');
    $('tape').innerHTML = delar ? delar + delar : '<span>VÄNTAR PÅ KURSER · </span>';
  }

  function renderStatus() {
    const c = K.lasCache();
    const marknad = marknadOppen(new Date()) ? 'MARKNAD ÖPPEN' : 'MARKNAD STÄNGD';
    const el = $('status');
    el.classList.toggle('offline', offline);
    el.textContent = offline
      ? '> OFFLINE · visar sparade kurser' + (c.hamtad ? ' från ' + klocka(c.hamtad) : '')
      : '> WATCH [' + (c.hamtad ? klocka(c.hamtad) : '--:--:--') + ' · ' + marknad + ']';
  }

  function renderAllt() { renderLista(); renderTape(); renderStatus(); }

  // ---- Uppdatering -------------------------------------------------------
  let pagar = false;
  async function uppdatera() {
    if (pagar) return;
    pagar = true;
    try {
      const symboler = [...new Set(['^OMX', ...watch])];
      const svar = await K.hamta(symboler);
      if (offline) logga('ONLINE · kurser uppdaterade', 'info');
      offline = false;
      for (const k of svar) {
        if (k.fel === 'okänd' && watch.includes(k.symbol)) {
          watch = watch.filter((s) => s !== k.symbol);
          spara(WATCH_KEY, watch);
          logga('ERR  ' + K.visning(k.symbol) + ' finns inte – borttagen', 'fel');
        }
      }
    } catch (e) {
      if (!offline) logga('OFFLINE · ' + (navigator.onLine ? 'kursservern svarar inte' : 'ingen anslutning'), 'fel');
      offline = true;
    } finally {
      pagar = false;
      renderAllt();
    }
  }

  // ---- Kommandon ---------------------------------------------------------
  const HJALP = [
    'VOLV-B        lägg till (Stockholm, .ST läggs på)',
    'DEL VOLV-B    ta bort från listan',
    'UPD           uppdatera kurserna nu',
    'CLEAR         töm loggen',
    'RESET         återställ standardlistan'
  ];

  function kor(rad) {
    const delar = rad.trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (!delar.length) return;
    const [ord, ...arg] = delar;

    if (ord === 'HELP' || ord === '?') { HJALP.slice().reverse().forEach((h) => logga(h, 'info')); return; }
    if (ord === 'CLEAR') { logg = []; spara(LOGG_KEY, logg); renderLogg(); return; }
    if (ord === 'UPD' || ord === 'R') { logga('UPD  hämtar kurser…', 'info'); uppdatera(); return; }
    if (ord === 'RESET') {
      watch = CFG.standardlista.map(K.tillSymbol);
      spara(WATCH_KEY, watch);
      logga('RESET standardlistan återställd');
      renderAllt(); uppdatera(); return;
    }
    if (ord === 'DEL' || ord === 'RM') {
      if (!arg.length) { logga('ERR  ange ticker, t.ex. DEL HM-B', 'fel'); return; }
      const s = K.tillSymbol(arg.join('-'));
      if (!watch.includes(s)) { logga('ERR  ' + K.visning(s) + ' finns inte i listan', 'fel'); return; }
      watch = watch.filter((x) => x !== s);
      spara(WATCH_KEY, watch);
      logga('DEL  ' + K.visning(s));
      renderAllt(); return;
    }

    const namn = (ord === 'ADD' || ord === 'WATCH') ? arg.join('-') : delar.join('-');
    if (!namn) { logga('ERR  ange ticker, t.ex. ADD SINCH', 'fel'); return; }
    if (!/^\^?[A-Z0-9][A-Z0-9.\-]{0,19}$/.test(namn)) { logga('ERR  okänt kommando: ' + rad.trim() + ' (skriv HELP)', 'fel'); return; }
    const s = K.tillSymbol(namn);
    if (watch.includes(s)) { logga(K.visning(s) + ' finns redan i listan', 'info'); return; }
    watch.unshift(s);
    nyss = s;
    spara(WATCH_KEY, watch);
    logga('ADD  ' + K.visning(s));
    renderAllt();
    uppdatera();
  }

  $('form-cmd').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('cmd');
    kor(input.value);
    input.value = '';
  });

  // ---- Start -------------------------------------------------------------
  renderLogg();
  renderAllt();
  if (!logg.length) logga('TICKERN startad · skriv HELP för kommandon', 'info');
  uppdatera();
  setInterval(uppdatera, (CFG.uppdateraSek || 60) * 1000);
  setInterval(renderStatus, 30 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') uppdatera(); });
  window.addEventListener('online', uppdatera);
  window.addEventListener('offline', () => { offline = true; renderStatus(); });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    let laddad = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!laddad) { laddad = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline-stöd saknas, appen fungerar ändå */ });
  }
})();
