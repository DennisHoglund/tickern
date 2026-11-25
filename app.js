// Tickern – watchlist, kommandorad, logg och tema.
(function () {
  const K = window.TickernKurser;
  const F = window.TickernForklara;
  const CFG = window.TICKERN_CONFIG;
  const $ = (id) => document.getElementById(id);

  const WATCH_KEY = 'tickern-watch';
  const LOGG_KEY = 'tickern-logg';
  const THEME_KEY = 'tickern-theme';
  const DAG_KEY = 'tickern-sammanfattning';
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
        '<span class="tkr" role="cell"><button type="button" class="info" data-symbol="' + esc(s) + '" aria-label="Visa ' + esc(K.visning(s)) + '">' + esc(K.visning(s)) + '</button></span>' +
        '<span class="spark" role="cell" aria-hidden="true">' + esc(k ? K.sparkline(k.spark) : '') + '</span>' +
        '<span class="pris" role="cell">' + (k ? K.tal(k.pris) : '…') + '</span>' +
        '<span class="pct" role="cell">' + (k ? K.pil(k.procent) + K.procent(k.procent) : '') + '</span>' +
        '</div>';
    }).join('');
  }

  function renderTape() {
    const kurser = K.lasCache().kurser;
    const delar = ['^OMX', ...watch.filter((s) => s !== '^OMX')].map((s) => kurser[s]).filter(Boolean).map((k) =>
      '<span class="' + (K.riktning(k.procent) === 'ned' ? 'ned' : '') + '">' + esc(K.visning(k.symbol)) + ' ' +
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

  // ---- Detaljvy ----------------------------------------------------------
  let oppen = null;

  function visaDetalj(symbol) {
    const kurser = K.lasCache().kurser;
    const k = kurser[symbol];
    oppen = symbol;
    $('d-symbol').textContent = K.visning(symbol);
    $('detalj-titel').textContent = k ? k.namn : K.visning(symbol);
    const besk = F.bolag(symbol);
    $('d-bolag').textContent = besk;
    $('d-bolag').hidden = !besk;
    if (!k) {
      $('d-pris').textContent = '…';
      $('d-forandring').textContent = '';
      $('d-graf').textContent = '';
      $('d-tal').innerHTML = '';
      $('d-forklaring').innerHTML = '<li>Inga kurser ännu – försök igen när kurserna hämtats.</li>';
    } else {
      const r = K.riktning(k.procent);
      $('d-pris').textContent = K.tal(k.pris);
      $('d-forandring').textContent = K.pil(k.procent) + ' ' + (k.forandring != null ? (k.forandring > 0 ? '+' : '') + K.tal(k.forandring) : '–') + ' (' + K.procent(k.procent) + ' %)';
      $('d-kurs').className = 'd-kurs ' + r;
      $('d-graf').textContent = K.sparkline(k.manad || k.spark);
      const man = F.manadsForandring(k);
      const tal = [
        ['Förra stängning', K.tal(k.prev), 'Kursen när börsen stängde förra handelsdagen.'],
        ['Dagens högsta', K.tal(k.hog), ''],
        ['Dagens lägsta', K.tal(k.lag), ''],
        ['Volym', k.volym != null ? new Intl.NumberFormat('sv-SE').format(k.volym).replace(/[\u00a0\u202f]/g, ' ') : '–', 'Antal aktier som köpts och sålts idag.'],
        ['1 månad', man != null ? K.procent(man) + ' %' : '–', '']
      ];
      $('d-tal').innerHTML = tal.map((t) => '<div><dt>' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd>' +
        (t[2] ? '<dd class="hint">' + esc(t[2]) + '</dd>' : '') + '</div>').join('');
      const omx = kurser['^OMX'];
      $('d-forklaring').innerHTML = F.forklaring(k, omx).map((t) => '<li>' + esc(t) + '</li>').join('');
    }
    $('detalj').hidden = false;
    $('detalj').scrollTop = 0;
    $('btn-tillbaka').focus();
  }

  function stangDetalj() {
    const sym = oppen;
    oppen = null;
    $('detalj').hidden = true;
    const knapp = sym && document.querySelector('#lista .info[data-symbol="' + CSS.escape(sym) + '"]');
    if (knapp) knapp.focus();
  }

  $('lista').addEventListener('click', (e) => {
    const rad = e.target.closest('.rad[data-symbol]');
    if (rad) visaDetalj(rad.dataset.symbol);
  });
  $('btn-tillbaka').addEventListener('click', stangDetalj);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && oppen) stangDetalj(); });

  // ---- Dagens sammanfattning --------------------------------------------
  const idag = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' });
  const kortDatum = () => { const d = idag().split('-'); return Number(d[2]) + '/' + Number(d[1]); };

  function skrivSammanfattning() {
    const kurser = K.lasCache().kurser;
    const rader = F.sammanfattning(kurser, watch, kurser['^OMX'], kortDatum());
    // Rader med nedgång (▼) blir röda, rubrikraden är halvfet
    rader.slice().reverse().forEach((t, i) => {
      const typ = [i === rader.length - 1 ? 'dag' : '', t.includes('▼') ? 'ned' : ''].filter(Boolean).join(' ');
      logga(t, typ);
    });
  }

  function efterStangning(d) {
    const p = sthlm(d);
    if (['lör', 'sön'].includes(p.weekday.replace('.', ''))) return false;
    return Number(p.hour) * 60 + Number(p.minute) >= 17 * 60 + 30;
  }

  function kollaSammanfattning() {
    if (!efterStangning(new Date()) || las(DAG_KEY, '') === idag()) return;
    spara(DAG_KEY, idag());
    skrivSammanfattning();
  }

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
      setTimeout(() => { kollaSammanfattning(); if (oppen) visaDetalj(oppen); }, 0);
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
    'INFO VOLV-B   förklaring i klarspråk (eller tryck på aktien)',
    'DAG           sammanfattning av dagen',
    'UPD           uppdatera kurserna nu',
    'CLEAR         töm loggen',
    'RESET         återställ standardlistan'
  ];

  function kor(rad) {
    const delar = rad.trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (!delar.length) return;
    const [ord, ...arg] = delar;

    if (ord === 'HELP' || ord === '?') { HJALP.slice().reverse().forEach((h) => logga(h, 'info')); return; }
    if (ord === 'DAG') { skrivSammanfattning(); return; }
    if (ord === 'INFO') {
      if (!arg.length) { logga('ERR  ange ticker, t.ex. INFO VOLV-B', 'fel'); return; }
      visaDetalj(K.tillSymbol(arg.join('-')));
      return;
    }
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
