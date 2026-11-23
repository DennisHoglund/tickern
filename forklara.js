// Förklaringar i klarspråk, räknade fram av regler från kurserna (ingen AI, inga nyheter).
(function () {
  const K = window.TickernKurser;

  // Kort beskrivning av vanliga bolag på Stockholmsbörsen (nyckel = ticker utan .ST)
  const BOLAG = {
    'ABB': 'Elteknik och automation – motorer, robotar och elnät för industrin.',
    'ALFA': 'Alfa Laval – värmeväxlare, separatorer och pumpar för industri och fartyg.',
    'ASSA-B': 'Assa Abloy – lås, dörrar och passersystem över hela världen.',
    'ATCO-A': 'Atlas Copco – kompressorer, vakuumpumpar och industriverktyg.',
    'ATCO-B': 'Atlas Copco – kompressorer, vakuumpumpar och industriverktyg.',
    'AZN': 'AstraZeneca – läkemedel mot bland annat cancer, hjärt- och lungsjukdomar.',
    'BOL': 'Boliden – gruvor och smältverk för koppar, zink och andra metaller.',
    'ELUX-B': 'Electrolux – vitvaror som spisar, kylskåp och tvättmaskiner.',
    'EQT': 'EQT – riskkapitalbolag som köper, utvecklar och säljer företag.',
    'ERIC-B': 'Ericsson – utrustning och mjukvara för mobilnät (4G/5G).',
    'ESSITY-B': 'Essity – hygienprodukter som mjukpapper, blöjor och mensskydd.',
    'EVO': 'Evolution – sänder live-casinospel till spelbolag på nätet.',
    'GETI-B': 'Getinge – medicinteknik till sjukhus, t.ex. operations- och intensivvård.',
    'HEXA-B': 'Hexagon – mätteknik, sensorer och mjukvara för industri och kartor.',
    'HM-B': 'H&M – klädkedja med butiker och e-handel i stora delar av världen.',
    'INVE-B': 'Investor – Wallenbergsfärens investmentbolag, äger delar av t.ex. ABB, Atlas Copco och SEB.',
    'NDA-SE': 'Nordea – Nordens största bank.',
    'NIBE-B': 'Nibe – värmepumpar och annan klimatteknik för hus och fastigheter.',
    'SAAB-B': 'Saab – försvarsföretag: stridsflyg (Gripen), radar, robotar och ubåtar.',
    'SAND': 'Sandvik – verktyg för metallbearbetning och maskiner för gruvor.',
    'SCA-B': 'SCA – skogsbolag som äger skog och gör massa, papper och trävaror.',
    'SEB-A': 'SEB – storbank med fokus på företag och privatpersoner.',
    'SHB-A': 'Handelsbanken – storbank känd för sina lokala kontor.',
    'SINCH': 'Sinch – mjukvara för sms och meddelanden mellan företag och kunder.',
    'SKF-B': 'SKF – kullager och tätningar till fordon och industri.',
    'SWED-A': 'Swedbank – storbank med många privatkunder i Sverige och Baltikum.',
    'TEL2-B': 'Tele2 – mobil- och bredbandsoperatör.',
    'TELIA': 'Telia – mobil-, bredbands- och tv-operatör i Norden och Baltikum.',
    'VOLV-B': 'Volvo – lastbilar, bussar och anläggningsmaskiner (inte personbilarna).',
    'OMXS30': 'Index över de 30 mest handlade aktierna på Stockholmsbörsen – ett mått på "börsen i stort".'
  };

  const p = (v) => K.procent(v) + ' %';
  const verb = (v) => (v > 0.05 ? 'steg' : v < -0.05 ? 'sjönk' : 'stod still');

  function bolag(symbol) {
    return BOLAG[K.visning(symbol)] || '';
  }

  function manadsForandring(k) {
    const m = k.manad || [];
    if (m.length < 2) return null;
    return (m[m.length - 1] - m[0]) / m[0] * 100;
  }

  // Rader som förklarar dagens rörelse för en aktie
  function forklaring(k, omx) {
    const rader = [];
    if (k.procent == null) return ['Det finns ingen jämförelse mot igår ännu.'];
    const namn = K.visning(k.symbol);
    const index = k.symbol === '^OMX';

    rader.push((index ? 'Börsen ' : 'Aktien ') + verb(k.procent) + (Math.abs(k.procent) > 0.05 ? ' ' + p(Math.abs(k.procent)).replace(/^\+/, '') : '') + ' idag.');

    const stor = Math.abs(k.procent);
    if (stor >= 3) rader.push('Det är en stor rörelse för en enda dag.');
    else if (stor < 0.5) rader.push('En lugn dag – små rörelser är det vanliga.');

    if (!index && omx && omx.procent != null) {
      const diff = k.procent - omx.procent;
      if (Math.abs(diff) < 0.5) {
        rader.push('Ungefär som börsen i stort (OMXS30 ' + p(omx.procent) + '). Det var troligen hela marknaden som rörde sig, inte bara ' + namn + '.');
      } else if (k.procent > 0 && omx.procent < 0) {
        rader.push('Den gick upp fast börsen gick ner (OMXS30 ' + p(omx.procent) + '). Då brukar det handla om något i bolaget självt, t.ex. en nyhet eller rapport.');
      } else if (k.procent < 0 && omx.procent > 0) {
        rader.push('Den gick ner fast börsen gick upp (OMXS30 ' + p(omx.procent) + '). Då brukar det handla om något i bolaget självt, t.ex. en nyhet eller rapport.');
      } else if (diff > 0) {
        rader.push('Bättre än börsen i stort (OMXS30 ' + p(omx.procent) + ').');
      } else {
        rader.push('Sämre än börsen i stort (OMXS30 ' + p(omx.procent) + ').');
      }
    }

    if (k.hog != null && k.lag != null && k.hog > k.lag) {
      const lage = (k.pris - k.lag) / (k.hog - k.lag);
      if (lage >= 0.8) rader.push('Kursen ligger nära dagens högsta – köparna hade övertaget mot slutet.');
      else if (lage <= 0.2) rader.push('Kursen ligger nära dagens lägsta – säljarna hade övertaget mot slutet.');
    }

    const man = manadsForandring(k);
    if (man != null) {
      const m = k.manad;
      const max = Math.max(...m), min = Math.min(...m);
      let text = 'Senaste månaden: ' + p(man) + '.';
      if (k.pris >= max * 0.98) text += ' Den ligger nära månadens högsta.';
      else if (k.pris <= min * 1.02) text += ' Den ligger nära månadens lägsta.';
      rader.push(text);
    }
    return rader;
  }

  // Sammanfattning av dagen för watchlistan. Returnerar rader i läsordning.
  function sammanfattning(kurser, watch, omx, datum) {
    const lista = watch.map((s) => kurser[s]).filter((k) => k && k.procent != null);
    const rader = [];
    rader.push('DAGEN ' + datum + (omx && omx.procent != null ? ' · OMXS30 ' + K.pil(omx.procent) + p(omx.procent) : ''));
    if (!lista.length) { rader.push('Inga kurser i din lista att sammanfatta.'); return rader; }

    const sorterad = lista.slice().sort((a, b) => b.procent - a.procent);
    const bast = sorterad[0], samst = sorterad[sorterad.length - 1];
    rader.push('BÄST   ' + K.visning(bast.symbol) + ' ' + K.pil(bast.procent) + p(bast.procent));
    if (samst !== bast) rader.push('SÄMST  ' + K.visning(samst.symbol) + ' ' + K.pil(samst.procent) + p(samst.procent));

    const upp = lista.filter((k) => k.procent > 0).length;
    rader.push(upp + ' av ' + lista.length + ' i din lista steg idag.');

    if (omx && omx.procent != null) {
      const andel = upp / lista.length;
      if (omx.procent > 0.3 && andel >= 0.5) rader.push('Börsen steg och minst hälften av dina aktier följde med.');
      else if (omx.procent < -0.3 && andel <= 0.5) rader.push('Börsen sjönk och minst hälften av dina aktier följde med ner.');
      else if (Math.abs(omx.procent) <= 0.3) rader.push('En lugn dag på börsen – rörelserna i din lista handlar mest om bolagen själva.');
      else rader.push('Din lista gick åt ett annat håll än börsen idag.');
    }
    const stora = lista.filter((k) => Math.abs(k.procent) >= 3).map((k) => K.visning(k.symbol));
    if (stora.length) rader.push('Stora rörelser (±3 % eller mer): ' + stora.join(', ') + '. Tryck på aktien för att läsa mer.');
    return rader;
  }

  window.TickernForklara = { bolag, forklaring, sammanfattning, manadsForandring };
})();
