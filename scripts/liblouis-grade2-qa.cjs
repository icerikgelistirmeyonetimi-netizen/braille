/*
 * liblouis Grade 2 / Grade 1 doğrulama (Node).
 * - Tablo zincirlerinin yüklendiğini,
 * - kelime-kelime çevirinin tüm-metin çevirisiyle AYNI sonucu verdiğini,
 * - bilinen kısaltmaların gerçekten Grade 2 olduğunu doğrular.
 * Çalıştır: node scripts/liblouis-grade2-qa.cjs
 */
const liblouis = require('liblouis');
liblouis.enableOnDemandTableLoading();

const P = (t) => `/tables/${t}`;
const TBL_G2 = {
  en: `${P('unicode.dis')},${P('en-ueb-g2.ctb')}`,
  de: `${P('unicode.dis')},${P('de-de-g2.ctb')}`,
  fr: `${P('unicode.dis')},${P('fr-bfu-g2.ctb')}`,
};
const TBL_G1 = {
  en: `${P('unicode.dis')},${P('en-ueb-g1.ctb')}`,
  de: `${P('unicode.dis')},${P('de-de-g1.ctb')}`,
  fr: `${P('unicode.dis')},${P('fr-bfu-comp6.utb')}`,
};

let basari = 0, hata = 0;
const fails = [];

function dots(u) {
  return [...u].map((ch) => {
    if (ch === ' ') return '_';
    const c = ch.codePointAt(0);
    if (c < 0x2800 || c > 0x28ff) return '?';
    const b = c - 0x2800; let s = '';
    for (let i = 0; i < 6; i++) if (b & (1 << i)) s += i + 1;
    return s || '_';
  }).join(' ');
}

// Kelime-kelime çeviri (worker'daki mantığın aynısı)
function tokenCevir(tbl, metin) {
  let out = '';
  let i = 0; const n = metin.length;
  while (i < n) {
    if (/\s/.test(metin[i])) { out += metin[i]; i++; continue; }
    let j = i; while (j < n && !/\s/.test(metin[j])) j++;
    out += liblouis.translateString(tbl, metin.slice(i, j));
    i = j;
  }
  return out;
}

// 1) Tablo yükleniyor mu + Grade 2 gerçekten kısaltıyor mu (bilinen örnekler)
function tabloVar(ad, tbl, metin) {
  const r = liblouis.translateString(tbl, metin);
  if (r == null || r.length === 0) { hata++; fails.push(`tablo yüklenemedi: ${ad}`); return false; }
  basari++; return true;
}
tabloVar('en-g2', TBL_G2.en, 'the');
tabloVar('de-g2', TBL_G2.de, 'und');
tabloVar('fr-g2', TBL_G2.fr, 'le');
tabloVar('en-g1', TBL_G1.en, 'cat');
tabloVar('de-g1', TBL_G1.de, 'und');
tabloVar('fr-g1', TBL_G1.fr, 'le');

// 2) Bilinen UEB Grade 2 kısaltmaları (otorite: liblouis; burada beklenen değer
//    UEB standardından — tablo bunları üretmezse tabloda sorun var demektir)
function bekle(tbl, metin, beklenenDots, etiket) {
  const out = liblouis.translateString(tbl, metin);
  const got = dots(out || '');
  if (got === beklenenDots) basari++;
  else { hata++; fails.push(`${etiket}: "${metin}"\n    beklenen: ${beklenenDots}\n    alınan  : ${got}`); }
}
// UEB: "the" = ⠮ (2-3-4-6); "and" = ⠯ (1-2-3-4-6); "for" = ⠿ (1-2-3-4-5-6); "with" = ⠾ (2-3-4-5-6)
bekle(TBL_G2.en, 'the', '2346', 'UEB the');
bekle(TBL_G2.en, 'and', '12346', 'UEB and');
bekle(TBL_G2.en, 'for', '123456', 'UEB for');
bekle(TBL_G2.en, 'with', '23456', 'UEB with');
// UEB "child" = ⠡ (1-6) tek hücre (wordsign)
bekle(TBL_G2.en, 'child', '16', 'UEB child');

// 3) Kelime-kelime == tüm-metin (segmentasyon bozmuyor)
const cumleler = {
  en: [
    'Good morning, children! I will read.',
    'The quick brown fox jumps over 12 lazy dogs.',
    'Knowledge about mother and father.',
  ],
  de: [
    'Guten Morgen, Kinder! Ich heiße Müller.',
    'Die Schule und das Haus sind groß.',
  ],
  fr: [
    'Bonjour les enfants, comment allez-vous ?',
    'Le petit chat est sur la table.',
  ],
};
for (const dil of ['en', 'de', 'fr']) {
  for (const c of cumleler[dil]) {
    const tam = liblouis.translateString(TBL_G2[dil], c);
    const tok = tokenCevir(TBL_G2[dil], c);
    if (tam === tok) basari++;
    else {
      hata++;
      fails.push(`segment farkı [${dil}] "${c}"\n    tam: ${dots(tam)}\n    tok: ${dots(tok)}`);
    }
  }
}

console.log(`\nBaşarılı: ${basari}  |  Hatalı: ${hata}\n`);
if (fails.length) { fails.forEach((f) => console.log('✗ ' + f)); process.exit(1); }
else console.log('✓ Tüm liblouis testleri geçti.');
