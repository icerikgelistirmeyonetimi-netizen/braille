// PDF "Image description" → P-format (muzik-brl-fixtures) token üretici + DOĞRULAYICI.
// Proven render() (39 mevcut parçayla aynı) ile braille üretir → re-import edip
// (a) per-nota perde+oktav, (b) per-nota SÜRE, (c) rest sayısı, (d) per-ölçü süre = zaman
// imzası kontrolüyle doğrular. Geçenleri P(...) kaynak satırı olarak yazar. Karmaşık
// (ornament/dinamik/tie/tuplet/repeat) tokenler şimdilik FLAG'lenir (sonraki parti).
import fs from 'node:fs';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { muzikTimeSigExpected16 } from '../src/utils/music/index.js';
import { render, SY, DYN, keySig, timeSig } from './muzik-brl-fixtures.mjs';

const DUR = { semibreve:'s', whole:'s', minim:'m', half:'m', crotchet:'c', quarter:'c', quaver:'q', eighth:'q', semiquaver:'16', sixteenth:'16', demisemiquaver:'32' };
const DUR_RE = /(semibreve|minim|crotchet|quaver|semiquaver|demisemiquaver)/;
const SURE16 = { s:16, m:8, c:4, q:2, '16':1, '32':0.5 };
// HÂLÂ deferred (sonraki parti): graphic hairpin (cresc/dim çizgi), tuplet, bracket-slur,
// yapısal tekrar/volta/ending, tremolo, arpej. Bunlar süreyi/yapıyı değiştirir → ayrı ele alınır.
const KARMASIK_RE = /(tremolo|tuplet|triplet|hairpin|crescendo|diminuendo|decrescendo|\bcresc\b|\bdim\b|repeat|ending|bracket|\bvolta\b|first time|second time|arpeg)/i;
// Tempo/title/composer SAF metadata (braille gövdesini etkilemez, mevcut parçalarla aynı) →
// karmaşık SAYILMAZ; meta.tempo/title olarak saklanır, notalar yine de doğrulanır.

// ---- İŞARET SÖZLÜĞÜ (açıklama terimi → P-format sembol adı) ----
// PRE_DYN → {dyn} alanı (söz işareti; SONRAKİ notaya oktav ZORLAR, L6 Kural 4).
// PRE_ORN/PRE_GRACE → {pre:[...]} (nüans/süsleme; oktav zorlamaz). POST_MOD → {post:[...]}.
// Uzun-eşleşme önce (ör. "turn above" < "turn", "staccatissimo" < "staccato").
const PRE_DYN = [
  [/^pianissimo\b|^pp\b/, 'DYN.pp'], [/^fortissimo\b|^ff\b/, 'DYN.ff'],
  [/^mezzo[- ]?forte\b|^mf\b/, 'DYN.mf'], [/^mezzo[- ]?piano\b|^mp\b/, 'DYN.mp'],
  [/^sforzando\b|^sfz\b|^sf\b/, 'DYN.sf'],
  [/^piano\b|^p\b/, 'DYN.p'], [/^forte\b|^f\b/, 'DYN.f'],
];
const PRE_GRACE = [
  [/^long appoggiatura\b/, 'SY.longApp'],
  [/^(short appoggiatura|acciaccatura)\b/, 'SY.shortApp'],
];
const PRE_ORN = [
  [/^upper mordent\b/, 'SY.upMordent'], [/^lower mordent\b/, 'SY.lowMordent'], [/^mordent\b/, 'SY.upMordent'],
  [/^turn above( note)?\b/, 'SY.turnAbove'], [/^turn\b/, 'SY.turn'], [/^trill\b/, 'SY.trill'],
  [/^staccatissimo\b/, 'SY.staccatissimo'], [/^mezzo[- ]?staccato\b/, 'SY.mezzoStaccato'], [/^staccato\b/, 'SY.staccato'],
  [/^tenuto\b/, 'SY.tenuto'], [/^martellato\b/, 'SY.martellato'], [/^accent\b/, 'SY.accent'],
];
const POST_MOD = [
  [/^tie\b/, 'SY.tie'], [/^slur\b/, 'SY.slur'],
  [/^(fermata|pause)\b/, 'SY.fermata'], [/^breath( mark)?\b/, 'SY.breath'],
  [/^break( mark)?\b/, 'SY.breakMark'], [/^(glissando|gliss)\b/, 'SY.gliss'],
];
function symBrl(name) { const [o, k] = name.split('.'); return o === 'DYN' ? DYN[k] : SY[k]; }
// Bir token başındaki PRE işaretlerini (dinamik/süsleme/nüans/grace) soyup geri kalanı döndür.
function prefixSoy(t) {
  const pre = []; let dyn = null, grace = false, changed = true;
  while (changed) {
    changed = false;
    for (const [re, sym] of PRE_DYN)   { if (re.test(t)) { dyn = sym; t = t.replace(re, '').trim(); changed = true; break; } }
    if (changed) continue;
    for (const [re, sym] of PRE_GRACE) { if (re.test(t)) { pre.push(sym); grace = true; t = t.replace(re, '').trim(); changed = true; break; } }
    if (changed) continue;
    for (const [re, sym] of PRE_ORN)   { if (re.test(t)) { pre.push(sym); t = t.replace(re, '').trim(); changed = true; break; } }
  }
  return { t, pre, dyn, grace };
}

function keyCode(seg) {
  if (!seg) return '0';
  const s = seg.toLowerCase();
  if (/no (sharps|flats|accidentals)/.test(s)) return '0';
  const m = /(\d+)\s*(sharp|flat)/.exec(s);
  return m ? `${m[1]}${m[2] === 'sharp' ? '#' : 'b'}` : '0';
}
function timeCode(seg) {
  const s = (seg || '').toLowerCase();
  if (/cut common/.test(s)) return 'cut';
  if (/common/.test(s)) return 'C';
  const m = /(\d+)\s*\/?\s*(\d+)/.exec(s);
  return m ? `${m[1]}/${m[2]}` : '4/4';
}
function timeSigAd(code) {
  if (code === 'C') return '4/4';
  if (code === 'cut') return '2/2';
  return code;
}

function tokenCoz(tok, ctx) {
  let t = tok.trim().toLowerCase();
  if (!t) return null;
  const gm = /^group of (\d+)\s+(semibreve|minim|crotchet|quaver|semiquaver|demisemiquaver)s?\b/.exec(t);
  if (gm) { ctx.grupSure = DUR[gm[2]]; ctx.grupKalan = parseInt(gm[1], 10); ctx.grupLider = true; t = t.slice(gm[0].length).trim(); if (!t) return { tip: 'ATLA' }; }
  if (/double bar\s?line|double barline/.test(t)) return { tip: 'final' };
  if (/bar\s?line|final/.test(t) && !/octave/.test(t)) return null;
  // Standalone POST işareti (tie/slur/fermata/breath/break/gliss) — tüm token bu işaretse
  for (const [re, sym] of POST_MOD) { if (re.test(t) && t.replace(re, '').trim() === '') return { tip: 'post', sym }; }
  // Baştaki PRE işaretlerini soy (nota/rest token'ı bunlarla ön-eklenmiş olabilir)
  const px = prefixSoy(t);
  t = px.t;
  const preBilgi = { pre: px.pre, dyn: px.dyn, grace: px.grace };
  // Standalone PRE (geriye nota/rest kalmadı) → sonraki notaya iliştir
  if (!t && (px.pre.length || px.dyn)) return { tip: 'pre', ...preBilgi };
  const dotted = /dotted/.test(t);
  if (/rest/.test(t)) {
    if (/whole bar rest|bar(?:'s)? rest|whole rest|semibreve rest/.test(t)) return { tip: 'sus', d: 's', tamOlcu: true, ...preBilgi };
    const dm = DUR_RE.exec(t);
    const d = dm ? DUR[dm[1]] : ctx.defaultDur;
    if (!d) return { tip: 'HATA', neden: 'rest süresi yok: ' + tok };
    return { tip: 'sus', d, dot: dotted, ...preBilgi };
  }
  const om = /(\d+)(?:st|nd|rd|th)?\s*octave\s+(?:(sharp|flat|natural)\s+)?([a-g])(?:\s*(sharp|flat|natural))?/.exec(t);
  if (om) {
    const oktav = parseInt(om[1], 10);
    const harf = om[3].toUpperCase();
    const dm = DUR_RE.exec(t);
    let dMus; // MÜZİKAL süre (açıklamadaki)
    if (dm) dMus = DUR[dm[1]];
    else if (ctx.grupKalan > 0 && ctx.grupSure) dMus = ctx.grupSure;
    else dMus = ctx.defaultDur;
    if (!dMus) return { tip: 'HATA', neden: 'nota süresi yok: ' + tok };
    // GRUPLAMA yazım kuralı: 16'lık/32'lik grupta LİDER tam değer, DEVAMLAR 8'lik-yüzeyli ('q')
    // braille hücresiyle yazılır (reader gruplama ile 16'lığa çözer). Müzikal değer korunur.
    let dBrl = dMus;
    if (ctx.grupKalan > 0) {
      if (ctx.grupLider) ctx.grupLider = false;
      else if (dMus === '16' || dMus === '32') dBrl = 'q';
      ctx.grupKalan -= 1;
    }
    ctx.lastOktav = oktav;
    const accR = om[2] || om[4];
    const acc = accR === 'sharp' ? '#' : accR === 'flat' ? 'b' : accR === 'natural' ? 'n' : null;
    return { tip: 'nota', harf, oktav, d: dBrl, dMus, dot: dotted, acc, ...preBilgi };
  }
  const lm = /^([a-g])$/.exec(t);
  if (lm && ctx.defaultDur) return { tip: 'nota', harf: lm[1].toUpperCase(), oktav: ctx.lastOktav || 4, d: ctx.defaultDur, dot: false, acc: null };
  return { tip: 'ATLA' };
}

export function aciklamadanUret(entry) {
  const desc = entry.desc || '';
  if (KARMASIK_RE.test(desc)) return { ok: false, neden: 'karmaşık-token' };
  let defaultDur = null;
  const gd = /all note values are (\w+)/i.exec(desc) || /all notes are (\w+)/i.exec(desc);
  if (gd) { const d = gd[1].toLowerCase().replace(/s$/, ''); if (DUR[d]) defaultDur = DUR[d]; }
  const ksSeg = /key\s*signature\s*:\s*([^]*?)(?:time\s*signature|tempo|bar\s*\d|$)/i.exec(desc);
  const tsSeg = /time\s*signature\s*:\s*([^]*?)(?:bar\s*\d|key|tempo|$)/i.exec(desc);
  if (!tsSeg) return { ok: false, neden: 'zaman imzası yok (anakruz/egzersiz)' };
  const key = keyCode(ksSeg ? ksSeg[1] : '');
  const time = timeCode(tsSeg[1]);
  const expected16 = muzikTimeSigExpected16(timeSigAd(time)) || 16;

  const barParts = desc.split(/Bar\s+\d+\s*:/i).slice(1);
  if (!barParts.length) return { ok: false, neden: 'bar yok' };

  const ctx = { defaultDur, lastOktav: null };
  const tokens = [];
  const beklenenNota = []; // doğrulama için
  const barSure = [];
  let finalBar = false;
  let nota = 0, rest = 0;
  let bekleyenPre = [], bekleyenDyn = null, bekleyenGrace = false; // sonraki notaya iliştirilecek
  let sonNotaToken = null;                                          // standalone POST için son nota/sus token'ı

  for (let bi = 0; bi < barParts.length; bi++) {
    let bar = barParts[bi].split(/Exercise|Remember|Image|\bThe \w/i)[0];
    // "group of N <dur> all <note>" → grup-form: "group of N <dur> <note>" + (N-1)×bare note
    // (lider/devam yazım kuralı tokenCoz'da uygulanır).
    bar = bar.replace(/group of (\d+)\s+(semibreve|minim|crotchet|quaver|semiquaver|demisemiquaver)s?\s+all\s+(\d+(?:st|nd|rd|th)?\s*octave\s+(?:(?:sharp|flat|natural)\s+)?[a-g])/gi,
      (m, n, dur, note) => { const N = parseInt(n, 10); return `group of ${N} ${dur} ${note}` + `, ${note}`.repeat(N - 1); });
    const toks = bar.split(/,/).map((s) => s.trim()).filter(Boolean);
    let sure16 = 0;
    for (const tok of toks) {
      const r = tokenCoz(tok, ctx);
      if (!r) continue;
      if (r.tip === 'HATA') return { ok: false, neden: r.neden };
      if (r.tip === 'ATLA') continue;
      if (r.tip === 'final') { finalBar = true; continue; }
      if (r.tip === 'pre') { bekleyenPre.push(...(r.pre || [])); if (r.dyn) bekleyenDyn = r.dyn; if (r.grace) bekleyenGrace = true; continue; }
      if (r.tip === 'post') { if (sonNotaToken) sonNotaToken.postSym = [...(sonNotaToken.postSym || []), r.sym]; continue; }
      // birikmiş PRE işaretlerini (standalone + embedded) birleştir
      const pre = [...bekleyenPre, ...(r.pre || [])];
      const dyn = bekleyenDyn || r.dyn || null;
      const grace = bekleyenGrace || r.grace || false;
      bekleyenPre = []; bekleyenDyn = null; bekleyenGrace = false;
      const dMus = r.dMus || r.d;
      if (!grace) sure16 += r.tamOlcu ? expected16 : SURE16[dMus] * (r.dot ? 1.5 : 1); // grace ölçü süresine sayılmaz
      if (r.tip === 'nota') {
        const tk = { n: r.harf, o: r.oktav, d: r.d };                  // d = BRAILLE kodu (lider/devam)
        if (r.dot) tk.dot = 1;
        if (r.acc) tk.acc = r.acc;
        if (dyn) tk.dynSym = dyn;
        if (pre.length) tk.preSym = pre;
        tokens.push(tk); sonNotaToken = tk;
        beklenenNota.push({ harf: r.harf, oktav: r.oktav, d: dMus, dot: !!r.dot }); // MÜZİKAL süre ile doğrula
        nota++;
      } else {
        const tk = { r: r.d };
        if (r.dot) tk.dot = 1;
        // sus'ta {dyn} alanı yok → dinamik varsa pre hücresi olarak yaz
        const susPre = [...(dyn ? [dyn] : []), ...pre];
        if (susPre.length) tk.preSym = susPre;
        tokens.push(tk); sonNotaToken = tk; rest++;
      }
    }
    barSure.push(sure16);
    if (bi < barParts.length - 1) tokens.push({ bar: 1 });
  }
  if (finalBar) tokens.push({ raw: SY.finalBar });

  const sureUyari = [];
  barSure.forEach((s, i) => { if (Math.abs(s - expected16) > 0.01 && i > 0 && i < barSure.length - 1) sureUyari.push(`bar${i + 1}=${s}/${expected16}`); });

  // sembol adlarını (dynSym/preSym/postSym) render'ın beklediği braille alanlarına (dyn/pre/post) çöz
  const renderTokens = tokens.map((t) => {
    if (!t.dynSym && !t.preSym && !t.postSym) return t;
    const o = { ...t };
    if (t.dynSym) o.dyn = symBrl(t.dynSym);
    if (t.preSym) o.pre = t.preSym.map(symBrl);
    if (t.postSym) o.post = t.postSym.map(symBrl);
    return o;
  });
  let body;
  try { body = render(renderTokens); } catch (e) { return { ok: false, neden: 'render hata: ' + e.message }; }
  // TAM braille = donanım+zaman imzası satırı + gövde (reader dual-meaning'i zaman imzasıyla çözer).
  const imza = [keySig(key), time ? timeSig(time) : ''].filter(Boolean).join('');
  const brl = (imza ? imza + '\n' : '') + body;
  let r2;
  try { r2 = brfMuzikOku(brl); } catch (e) { return { ok: false, neden: 'import hata: ' + e.message }; }

  const PITCH = { la:'A', si:'B', do:'C', re:'D', mi:'E', fa:'F', sol:'G' };
  const DURIDX = { q:0, c:1, m:2, s:3, '16':4, '32':5 };
  const outNotes = (r2.items || []).filter((o) => o.tip === 'nota');
  const outRest = (r2.items || []).filter((o) => o.tip === 'sus').length;
  const eff = (o) => (Number.isInteger(o.grupSureIndeksi) ? o.grupSureIndeksi : o.sureIndeksi);
  const sayiOk = outNotes.length === beklenenNota.length;
  const pitchOk = sayiOk && beklenenNota.every((n, i) => PITCH[outNotes[i].notaAd] === n.harf && (outNotes[i].oktav ?? 4) === n.oktav);
  const durOk = sayiOk && beklenenNota.every((n, i) => eff(outNotes[i]) === DURIDX[n.d] && Boolean(outNotes[i].dotted) === n.dot);
  const restOk = outRest === rest;

  return { ok: pitchOk && durOk && restOk && sureUyari.length === 0, key, time, tempo: tempoAl(desc), id: idTuret(entry), nota, rest, pitchOk, durOk, restOk, sureUyari, tokens, brl };
}

function tempoAl(desc) {
  const m = /tempo\s*marking\s*:\s*([^]*?)(?:key|time|bar\s*\d|subtitle|composer|$)/i.exec(desc);
  return m ? m[1].trim().replace(/\s+/g, ' ').slice(0, 30) : '';
}
function idTuret(entry) {
  const ttl = entry.title || '';
  const d = entry.desc || '';
  let ad = '';
  const t = /title\s*:\s*([^]*?)(?:composer|subtitle|tempo|key|time|bar\s*\d|$)/i.exec(d);
  if (t) ad = t[1].trim();
  if (!ad) { const m = /([A-Z][A-Za-z0-9.'’ ]+?)\s+by\s+([A-Z][a-z]+)/.exec(ttl); if (m) ad = m[1].trim() + ' — ' + m[2]; }
  if (!ad) { const m = /\bfrom\s+([A-Z][A-Za-z0-9.'’ ]+?)(?:\s+into\b|[.,]|$)/.exec(ttl); if (m) ad = m[1].trim(); }
  ad = ad.replace(/\s+/g, ' ').replace(/\bAir\b\s*$/i, '').replace(/[.,;:]+$/, '').replace(/\binto\s+braille.*$/i, '').trim().slice(0, 44);
  // tempo'yu yedek ad olarak kullan (piyano parça adı yoksa)
  if ((!ad || ad.length < 3)) { const tm = tempoAl(d); ad = tm || 'örnek'; }
  const comp = /composer\s*:\s*([A-Z][\w.'’ ]+?)(?:subtitle|tempo|key|time|bar|$)/i.exec(d);
  if (comp && !/—/.test(ad)) ad += ' — ' + comp[1].trim().slice(0, 20);
  return `PDF: ${ad} (s.${entry.page})`;
}
// token nesnesini P() kaynak ifadesine çevir
function tokenKaynak(t) {
  if (t.bar) return 'BAR';
  if (t.line) return 'LINE';
  if (t.raw) return '{raw:SY.finalBar}';
  const parts = [];
  if (t.dynSym) parts.push(`dyn:${t.dynSym}`);           // ham ifade (SY./DYN.)
  if (t.preSym) parts.push(`pre:[${t.preSym.join(',')}]`);
  if (t.postSym) parts.push(`post:[${t.postSym.join(',')}]`);
  if (t.dot) parts.push('dot:1');
  if (t.acc) parts.push(`acc:'${t.acc}'`);
  const optStr = parts.length ? `,{${parts.join(',')}}` : '';
  if (t.r) return `R('${t.r}'${optStr})`;
  return `N('${t.n}',${t.o},'${t.d}'${optStr})`;
}
export function pKaynakUret(r) {
  const satir = [];
  let cur = [];
  r.tokens.forEach((t) => { cur.push(tokenKaynak(t)); if (t.bar || t.line) { satir.push('  ' + cur.join(',')); cur = []; } });
  if (cur.length) satir.push('  ' + cur.join(','));
  return `P({ id: '${r.id.replace(/'/g, "\\'")}', key: '${r.key}', time: '${r.time === '4/4' ? 'C' : r.time}', tempo: '${r.tempo}' }, [\n${satir.join(',\n')},\n]);`;
}

if (process.argv[1] && process.argv[1].includes('music-pdf-desc-builder')) {
  const descs = JSON.parse(fs.readFileSync('C:/Users/HP/braille/_pdf_descriptions.json', 'utf8'));
  const dbg = (process.argv.find((a) => a.startsWith('--debug=')) || '').split('=')[1];
  if (dbg) {
    const d = descs.find((x) => x.page === dbg);
    const r = aciklamadanUret(d);
    console.log('DESC:', d.desc.slice(0, 180));
    console.log('SONUÇ:', JSON.stringify({ ok: r.ok, neden: r.neden, key: r.key, time: r.time, nota: r.nota, pitchOk: r.pitchOk, durOk: r.durOk, restOk: r.restOk, sureUyari: r.sureUyari }));
    if (r.brl) console.log('BRL:', JSON.stringify(r.brl));
    process.exit(0);
  }
  if (process.argv.includes('--gen')) {
    const fixt = fs.readFileSync('C:/Users/HP/braille/scripts/muzik-brl-fixtures.mjs', 'utf8');
    const ex = new Set((fixt.match(/s\.(\d+)/g) || []).map((m) => m.replace('s.', '')));
    const src = [];
    for (const d of descs) {
      if (ex.has(String(d.page))) continue;            // zaten ekli sayfa
      const r = aciklamadanUret(d);
      if (r.ok) src.push({ id: r.id, src: pKaynakUret(r) });
    }
    fs.writeFileSync('C:/Users/HP/braille/_pdf_new_pieces.txt', src.map((x) => x.src).join('\n\n'));
    console.log('YENİ doğrulanan parça (eklenmemiş):', src.length);
    src.forEach((x) => console.log('  ' + x.id));
    process.exit(0);
  }
  let ok = 0, karmasik = 0, hata = 0;
  const basarili = [];
  for (const d of descs) {
    const r = aciklamadanUret(d);
    if (r.ok) { ok++; basarili.push({ page: d.page, title: d.title, key: r.key, time: r.time, nota: r.nota, brl: r.brl }); }
    else if (r.neden === 'karmaşık-token') karmasik++;
    else { hata++; if (hata <= 14) console.log(`✗ s.${d.page}: ${r.neden || JSON.stringify(r.sureUyari)}`); }
  }
  console.log(`\n✓ DOĞRULANDI: ${ok} | karmaşık: ${karmasik} | hata: ${hata}`);
  fs.writeFileSync('C:/Users/HP/braille/_pdf_built.json', JSON.stringify(basarili, null, 1));
}
