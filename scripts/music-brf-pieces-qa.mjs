// HAZIR PARÇALAR EKSİKSİZLİK DENETİMİ — her parçayı import edip, eksik/işlenmemiş içerik var mı denetler.
// Özellikle TEKRAR CİHAZLARININ (genişletme gerektiren) editör adaptörünce DESTEKLENEN bir türde
// olduğunu doğrular — yoksa skor EKSİK çizilir (kullanıcı: "bitti diyorsun ama eksikler çıkıyor").
//
// Geçme ölçütü:
//  (a) bilinmeyen hücre / empty-parse YOK,
//  (b) her repeatInstruction GENİŞLETİLEBİLİR tür: 'backward-numeral' (geri+çal sayısı) veya
//      'bar-number' (mutlak ölçü no/aralık) — geçersiz/sınıflandırılamayan tekrar = HATA,
//  (c) brailleRepeat tekrarSayisi>=1.
//
//   node scripts/music-brf-pieces-qa.mjs   (npm run qa:brf-pieces)

import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { MUZIK_HAZIR_PARCALAR } from '../src/data/muzikHazirParcalar.js';

let hata = 0;
const detay = [];
console.log('═'.repeat(78));
console.log('HAZIR PARÇALAR — eksiksizlik (tekrar cihazı genişletilebilirliği) denetimi');
console.log('═'.repeat(78));

for (const p of MUZIK_HAZIR_PARCALAR) {
  const r = brfMuzikOku(p.brf, { source: 'pieces-qa' });
  const items = r.items || [];
  const unknown = items.filter((it) => it.tip === 'unknown');
  const empty = (r.warnings || []).filter((w) => w.type === 'empty-parse');
  const repeatInstr = items.filter((it) => it.tip === 'repeatInstruction');
  const brailleRepeat = items.filter((it) => it.tip === 'brailleRepeat');

  const sorunlar = [];
  if (unknown.length) sorunlar.push(`${unknown.length} bilinmeyen hücre`);
  if (empty.length) sorunlar.push('empty-parse');

  for (const ri of repeatInstr) {
    if (ri.repeatTuru === 'backward-numeral') {
      if (!(Number(ri.geriSayisi) > 0 && Number(ri.calinanOlcu) > 0)) {
        sorunlar.push(`geri-sayısal tekrar GEÇERSİZ (${ri.gorunum})`);
      }
    } else if (ri.repeatTuru === 'bar-number') {
      if (!(Number(ri.mutlakBaslangic) > 0 && Number(ri.mutlakBitis) >= Number(ri.mutlakBaslangic))) {
        sorunlar.push(`bar-number tekrar GEÇERSİZ (${ri.gorunum})`);
      }
    } else {
      sorunlar.push(`SINIFLANDIRILAMAYAN tekrar yönergesi (${ri.gorunum || '?'})`);
    }
  }
  for (const br of brailleRepeat) {
    if (!(Number(br.tekrarSayisi || 1) >= 1)) sorunlar.push('brailleRepeat geçersiz sayı');
  }

  const ok = sorunlar.length === 0;
  if (!ok) { hata += 1; detay.push(`✗ ${p.ad}: ${sorunlar.join('; ')}`); }

  const tekrarOzet = [
    ...brailleRepeat.map((b) => `⠶×${b.tekrarSayisi || 1}`),
    ...repeatInstr.map((ri) => ri.repeatTuru === 'backward-numeral'
      ? `geri(${ri.geriSayisi}/${ri.calinanOlcu})`
      : `bar#(${ri.mutlakBaslangic}-${ri.mutlakBitis})`),
  ].join(' ');
  console.log(`${ok ? '✓' : '✗'} ${p.ad.slice(0, 44).padEnd(46)} ${tekrarOzet}`);
}

console.log('═'.repeat(78));
if (hata === 0) {
  console.log(`✓ ${MUZIK_HAZIR_PARCALAR.length} parça eksiksiz — tüm tekrar cihazları desteklenen türde, bilinmeyen hücre yok.`);
} else {
  console.log(`✗ ${hata} parçada eksik/işlenmemiş içerik:`);
  detay.forEach((d) => console.log('  ' + d));
  process.exit(1);
}
