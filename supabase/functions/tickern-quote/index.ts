// Tickern – hämtar fördröjda kurser (~15 min) från Yahoo Finance och cachar i 60 s.
// Anrop: GET /functions/v1/tickern-quote?symbols=VOLV-B.ST,^OMX
// Rör ingen databas. Deployas med --no-verify-jwt (publik, bara läsning).
import { tolka, SYMBOL } from './tolka.mjs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info'
};
const TTL = 60_000;
const MAX = 40;
const cache = new Map<string, { t: number; data: unknown }>();

async function hamta(symbol: string) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.t < TTL) return hit.data;
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) + '?range=1mo&interval=1d';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Tickern)' } });
  if (res.status === 404) return { symbol, fel: 'okänd' };
  if (!res.ok) throw new Error('Yahoo svarade ' + res.status);
  const data = tolka(symbol, await res.json());
  cache.set(symbol, { t: Date.now(), data });
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' } });

  const symbols = [...new Set((new URL(req.url).searchParams.get('symbols') || '')
    .split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (!symbols.length) return json({ fel: 'Ange symbols, t.ex. ?symbols=VOLV-B.ST' }, 400);
  if (symbols.length > MAX) return json({ fel: 'Högst ' + MAX + ' symboler per anrop' }, 400);
  const ogiltiga = symbols.filter((s) => !SYMBOL.test(s));
  if (ogiltiga.length) return json({ fel: 'Ogiltig symbol: ' + ogiltiga.join(', ') }, 400);

  const kurser = await Promise.all(symbols.map((s) =>
    hamta(s).catch((e) => ({ symbol: s, fel: String(e.message || e) }))));
  return json({ hamtad: Date.now(), kurser });
});
