// BRF IMPORT (BRF Yükle) SMOKE testi — hazır parçalar.
// Editöre hazır gelen tüm parçaları (MUZIK_HAZIR_PARCALAR) brfMuzikOku ile içe aktarır;
// reader herhangi bir hücreye TAKILIYOR mu (bilinmeyen hücre / boş-parse) kontrol eder.
//
// ⚠ ÖNEMLİ: Hazır parçalar güncellemelerden ÖNCE yazıldı; STANDARDA UYGUN OLMAYABİLİR.
// Bu yüzden onları "doğru yazım" oracle'ı SAYMA. Geçme ölçütü yalnızca: bilinmeyen hücre yok.
// İdempotency burada BİLGİLENDİRİCİdir (hata değil) — girdi standart-dışı + mini-adaptör kayıplı.
// Gerçek import-DOĞRULUĞU testi: music-brf-standard-qa.mjs (PDF fixture oracle'ı ile round-trip).
//
//   node scripts/music-brf-import-qa.mjs

import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { muzikNotaSkorOgesi, muzikSusSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import { MUZIK_HAZIR_PARCALAR } from '../src/data/muzikHazirParcalar.js';

const icerikTip = new Set(['nota', 'sus']);

// Reader item'ları hafiftir (hucreler: undefined). Editör adaptörünü (hook-içi) taklit eden
// minimal-sadık dönüştürücü: nota/sus → factory ile GERÇEK hücreler; barline/repeat → düz ölçü
// çizgisi (nota round-trip'ini izole etmek için). Note-adı+süre dizisi korunmalı.
let _id = 0;
function readerItemleriniOgelereCevir(items) {
  const ogeler = [];
  for (const it of items || []) {
    if (it.tip === 'nota') {
      ogeler.push(muzikNotaSkorOgesi(`q${_id++}`, it.notaAd, it.sureIndeksi, {
        oktav: it.oktav, accidental: it.accidental || null, dotted: !!it.dotted,
        modifiers: it.modifiers || { oncesi: [], sonrasi: [] },
      }));
    } else if (it.tip === 'sus') {
      ogeler.push(muzikSusSkorOgesi(`q${_id++}`, it.sureIndeksi, { dotted: !!it.dotted }));
    } else if (['barline', 'finalBarline', 'sectionalBarline', 'beginRepeat', 'endRepeat'].includes(it.tip)) {
      ogeler.push({ id: `q${_id++}`, tip: 'barline', kind: 'manual', ad: 'Ölçü çizgisi', hucreler: [[]] });
    }
    // volta/tuplet/diğer işaretler nota round-trip'i için atlanır
  }
  return ogeler;
}
const notaDizisi = (items) => (items || [])
  .filter((it) => it.tip === 'nota')
  .map((it) => `${it.notaAd}/${it.sureIndeksi}${it.accidental ? '#' : ''}${it.dotted ? '.' : ''}`);

function ozet(res) {
  const items = Array.isArray(res.items) ? res.items : [];
  const unknown = items.filter((it) => it.tip === 'unknown');
  const notaSus = items.filter((it) => icerikTip.has(it.tip));
  const warnUnknown = (res.warnings || []).filter((w) => w.type === 'unknown-cell');
  const warnDur = (res.warnings || []).filter((w) => w.type === 'measure-duration-warning');
  const warnEmpty = (res.warnings || []).filter((w) => w.type === 'empty-parse');
  return { items, unknown, notaSus, warnUnknown, warnDur, warnEmpty, olcu: (res.measures || []).length };
}

console.log('═'.repeat(70));
console.log('BRF IMPORT (BRF Yükle) — hazır parçalar eksiksizlik/hatasızlık testi');
console.log('═'.repeat(70));

let toplamHata = 0;
for (const parca of MUZIK_HAZIR_PARCALAR) {
  const res = brfMuzikOku(parca.brf, { source: 'hazir-parca-qa' });
  const o = ozet(res);

  // idempotency: reader items → (adaptör) ogeler → export → re-import; nota-adı dizisi korunmalı.
  // Mini-adaptör volta/ölçü-tekrarı(⠶)/tuplet'i sadık üretemez (bunlar ölçü-süresini değiştirir →
  // dual-meaning süre belirsizliğini etkiler). Bu özellikleri içeren parçalarda idempotency ATLANIR;
  // onlar runtime editör adaptörü + qa:brf-roundtrip ile kapsanır. Yalnızca "düz" parçalarda kesin test.
  const karmasik = res.items.some((it) =>
    it.tip === 'brailleRepeat' || it.tip === 'volta1' || it.tip === 'volta2'
    || it.tupletId || /tuplet|leme/i.test(String(it.tip)));
  let idemNot = '';
  let idemSorun = false;
  if (karmasik) {
    idemNot = '  idempotency atlandı (ölçü-tekrarı/volta/tuplet — runtime adaptörü kapsar)';
  } else {
    try {
      const ogeler = readerItemleriniOgelereCevir(res.items);
      const back = scoreToCanonicalBrf({ ogeler, baglar: [], header: res.header || {}, tupletler: [], options: {} });
      const res2 = brfMuzikOku(back.brfText, { source: 'hazir-parca-qa-2' });
      const o2 = ozet(res2);
      const a = notaDizisi(res.items), b = notaDizisi(res2.items);
      const ayniDizi = a.length === b.length && a.every((x, i) => x === b[i]);
      if (o2.unknown.length > 0) { idemNot = `  ⚠ re-import ${o2.unknown.length} bilinmeyen`; idemSorun = true; }
      else if (!ayniDizi) {
        const ilkFark = a.findIndex((x, i) => x !== b[i]);
        idemNot = `  ⚠ nota dizisi sapması (${a.length}→${b.length}, ilk fark @${ilkFark}: ${a[ilkFark]||'-'}≠${b[ilkFark]||'-'})`;
        idemSorun = true;
      } else idemNot = '  idempotent ✓';
    } catch (e) {
      idemNot = `  ⚠ re-export hata: ${e.message}`; idemSorun = true;
    }
  }

  // Geçme ölçütü: reader takılmadı (bilinmeyen hücre/boş-parse yok). İdempotency bilgilendirici.
  const sorun = o.unknown.length > 0 || o.warnUnknown.length > 0 || o.warnEmpty.length > 0;
  if (sorun) toplamHata++;

  const durum = o.unknown.length === 0 && o.warnUnknown.length === 0 && o.warnEmpty.length === 0 ? '✓' : '✗';
  console.log(`${durum} ${parca.ad.padEnd(22)} nota/sus:${String(o.notaSus.length).padStart(3)}  ölçü:${String(o.olcu).padStart(2)}  bilinmeyen:${o.unknown.length}  süre-uyarı:${o.warnDur.length}${idemNot}`);

  // Bilinmeyen hücre detayı (varsa)
  o.unknown.slice(0, 5).forEach((u) => console.log(`      ↳ bilinmeyen: char="${u.char || ''}" noktalar=${JSON.stringify(u.hucre || u.dots || [])}`));
  o.warnUnknown.slice(0, 5).forEach((w) => console.log(`      ↳ uyarı: ${w.message || JSON.stringify(w)}`));
}

// ── TUPLET round-trip: reader üçleme/düzensiz grup işaretlerini decode ediyor mu ──
console.log('─ Tuplet (üçleme/düzensiz grup) reader decode round-trip ─');
{
  let tHata = 0;
  let tc = 0;
  const yid = () => `tq${tc++}`;
  const senaryolar = [
    { ad: 'üçleme (tek hücre ⠆)', hucreler: [[2, 3]], adAd: 'üçleme', count: 3 },
    { ad: 'üçleme (çok hücre ⠸⠒⠄)', hucreler: [[4, 5, 6], [2, 5], [3]], adAd: 'üçleme (3 hücreli)', count: 3 },
    { ad: 'ikileme (⠸⠆⠄)', hucreler: [[4, 5, 6], [2, 3], [3]], adAd: 'ikileme (duplet)', count: 2 },
  ];
  for (const s of senaryolar) {
    const ns = Array.from({ length: s.count }, (_, i) => muzikNotaSkorOgesi(yid(), ['do', 're', 'mi', 'fa'][i], 1, { oktav: 4 }));
    const tplr = [{ id: yid(), notaIdler: ns.map((n) => n.id), ratio: { played: s.count, inTimeOf: 2 }, kayit: { hucreler: s.hucreler, ad: s.adAd } }];
    const brf = scoreToCanonicalBrf({ ogeler: ns, baglar: [], header: {}, tupletler: tplr, options: {} })?.brfText || '';
    const r = brfMuzikOku(brf, { source: 'tuplet-qa' });
    const ok = (r.tupletler || []).length === 1 && (r.tupletler[0]?.notaIdler?.length === s.count) && !(r.items || []).some((it) => it.tip === 'unknown');
    if (!ok) tHata++;
    console.log(`  ${ok ? '✓' : '✗'} ${s.ad.padEnd(24)} reader.tupletler:${(r.tupletler || []).length} etiketli:${r.tupletler?.[0]?.notaIdler?.length || 0}/${s.count} unknown:${(r.items || []).filter((it) => it.tip === 'unknown').length}`);
  }
  if (tHata) toplamHata += tHata;
}

console.log('═'.repeat(70));
console.log(toplamHata === 0
  ? `✓ SMOKE GEÇTİ: ${MUZIK_HAZIR_PARCALAR.length} parça bilinmeyen hücre OLMADAN + tuplet decode round-trip OK`
  : `✗ ${toplamHata} sorun (bilinmeyen hücre/boş-parse veya tuplet decode)`);
console.log('Not: "⚠ nota dizisi sapması" = hazır parça standart-dışı OLABİLİR veya mini-adaptör kayıplı — HATA DEĞİL.');
console.log('     "süre-uyarı" = anacrusis/serbest ölçü olabilir. Gerçek doğruluk: music-brf-standard-qa.mjs.');
process.exit(toplamHata ? 1 : 0);
