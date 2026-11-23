// Mockar allt externt: kurs-funktionen i Supabase och Google Fonts.
// Testerna rör aldrig riktiga kurser.

const QUOTE = 'https://sjdznlmnvubqscftdkoj.supabase.co/functions/v1/tickern-quote';
const IDAG = Date.UTC(2026, 10, 23, 14, 0, 0); // 23 nov 2026 15:00 svensk tid

function kurs(symbol, namn, pris, prev, spark) {
  return { symbol, namn, valuta: 'SEK', pris, prev, forandring: pris - prev, procent: (pris - prev) / prev * 100,
    hog: pris * 1.01, lag: pris * 0.99, volym: 1000000, tid: IDAG, spark };
}

function exempelKurser() {
  return {
    '^OMX': kurs('^OMX', 'OMX Stockholm 30', 2512.4, 2496.9, [2470, 2480, 2475, 2490, 2500, 2497, 2512]),
    'VOLV-B.ST': kurs('VOLV-B.ST', 'Volvo B', 287.1, 283.58, [276, 279, 281, 280, 284, 283.6, 287.1]),
    'ERIC-B.ST': kurs('ERIC-B.ST', 'Ericsson B', 71.32, 71.93, [74, 73.5, 73, 72.4, 72.1, 71.9, 71.3]),
    'INVE-B.ST': kurs('INVE-B.ST', 'Investor B', 298.5, 297.31, [295, 296, 297, 296, 298, 297.3, 298.5]),
    'ATCO-A.ST': kurs('ATCO-A.ST', 'Atlas Copco A', 176.45, 175.21, [174, 173, 174, 175, 176, 175.2, 176.5]),
    'SAAB-B.ST': kurs('SAAB-B.ST', 'Saab B', 214.8, 210.38, [200, 203, 204, 208, 210, 210.4, 214.8]),
    'HM-B.ST': kurs('HM-B.ST', 'H&M B', 152.05, 154.05, [160, 158, 157, 156, 154, 154.1, 152.1]),
    'EVO.ST': kurs('EVO.ST', 'Evolution', 812.4, 832.8, [870, 860, 850, 845, 835, 832.8, 812.4]),
    'SINCH.ST': kurs('SINCH.ST', 'Sinch', 24.18, 23.6, [22, 22.5, 23, 23.2, 23.4, 23.6, 24.2])
  };
}

async function mocka(page) {
  const api = { kurser: exempelKurser(), nere: false, anrop: [] };

  await page.route(QUOTE + '**', (route) => {
    const url = new URL(route.request().url());
    const symboler = (url.searchParams.get('symbols') || '').split(',').filter(Boolean);
    api.anrop.push(symboler);
    if (api.nere) return route.abort('failed');
    const kurser = symboler.map((s) => api.kurser[s] || { symbol: s, fel: 'okänd' });
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ hamtad: IDAG, kurser }) });
  });

  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

  return api;
}

module.exports = { mocka, exempelKurser, QUOTE };
