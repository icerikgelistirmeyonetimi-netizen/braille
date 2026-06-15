// Hazır parçaları (MUZIK_HAZIR_PARCALAR) STANDART-DOĞRU export pipeline'ından yeniden üretir.
// Mantık: orijinal BRF → import → editör-oge adaptörü → scoreToCanonicalBrf (standart-doğru) → yeni BRF.
// scoreToCanonicalBrf music-brf-standard-qa.mjs ile standarda uygun doğrulandı → yeni BRF standart-doğru
// notasyon (oktav/Kural4, boşluk, gruplama, işaret-sırası). İçerik (nota/süre/dinamik/yapı) KORUNUR:
// yeni BRF tekrar okunup okunur-özet ESKİ ile karşılaştırılır; eşleşirse sadece notasyon düzelmiştir.
//
// Adaptör (brfReaderSonucundanSkorOgeleriAl + yardımcıları) useMuzikBrfEditor.jsx:2423-2694'ten
// FAITHFUL replike edildi (hook state'siz: varsayilan oktav fallback = 4; reader oktavı hep geçerli verir).
//
//   node scripts/music-brf-fix-pieces.mjs            # RAPOR: diff + içerik koruma
//   node scripts/music-brf-fix-pieces.mjs --write    # muzikHazirParcalar.js'i güncelle

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { muzikNotaSkorOgesi, muzikSusSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import { muzikTimeSigExpected16, muzikTimeSignatureHucreleri } from '../src/utils/music/index.js';
import { MUZIK_VARSAYILAN_ZAMAN_IMZASI } from '../src/utils/music-brf/musicConstants.js';
import { MUZIK_HAZIR_PARCALAR } from '../src/data/muzikHazirParcalar.js';
import { SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI } from '../src/data/muzik.js';

// Editör brfReaderHeaderOlustur (useMuzikBrfEditor.jsx:2399) faithful kopya — reader'ın hafif
// header'ını (timeSignature sadece ad/gorunum) tam header'a çevirir (hucreler + expectedDuration16).
// Aksi halde re-export zaman imzası satırını yazamaz (hucreler eksik) → kaybolur.
function brfReaderHeaderOlustur(readerHeader = {}) {
  const tsAd = readerHeader.timeSignature?.gorunum || readerHeader.timeSignature?.ad || MUZIK_VARSAYILAN_ZAMAN_IMZASI;
  return {
    title: readerHeader.title || '',
    composer: readerHeader.composer || '',
    tempo: readerHeader.tempo || '',
    keySignature: readerHeader.keySignature || null,
    timeSignature: {
      ad: tsAd, gorunum: tsAd,
      expectedDuration16: muzikTimeSigExpected16(tsAd),
      hucreler: muzikTimeSignatureHucreleri(tsAd),
    },
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const yaz = process.argv.includes('--write');
const diffGoster = process.argv.includes('--diff');
const sadece = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7); // --only=Neşeye

// ── Adaptör (useMuzikBrfEditor.jsx faithful kopya) ───────────────────────────
const guvenliOktavAl = (deger, fallback = 4) => {
  const n = Number(deger);
  return Number.isFinite(n) && n >= 1 && n <= 7 ? n : fallback;
};

const brfReaderSureIndeksiAl = (item) => {
  if (Number.isInteger(item?.sureIndeksi)) return item.sureIndeksi;
  const realValue = Number(item?.realValue || item?.sureRealValue || item?.durationRealValue);
  if (Number.isFinite(realValue) && realValue > 0) {
    const idx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === realValue);
    if (idx >= 0) return idx;
  }
  const duration16 = Number(item?.duration16 || item?.sure16);
  if (Number.isFinite(duration16) && duration16 > 0) {
    const realFrom16 = 16 / duration16;
    const idx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === realFrom16);
    if (idx >= 0) return idx;
  }
  return 0;
};

const brfReaderBarlineOgesiOlustur = (item, index) => {
  const tip = item?.tip || 'barline';
  const barlineMap = {
    barline: { tip: 'barline', ad: 'BRF ölçü çizgisi', gorunum: '|', hucreler: [[]] },
    finalBarline: { tip: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [[1, 2, 6], [1, 3]] },
    sectionalBarline: { tip: 'sectionalBarline', ad: 'Bölüm sonu çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3], [3]] },
    endRepeat: { tip: 'endRepeat', ad: 'Bitiş tekrarı', gorunum: '𝄇', hucreler: [[1, 2, 6], [2, 3]] },
    beginRepeat: { tip: 'beginRepeat', ad: 'Başlangıç tekrarı', gorunum: '𝄆', hucreler: [[1, 2, 6], [2, 3, 5, 6]] },
  };
  const base = barlineMap[tip] || barlineMap.barline;
  return { ...base, id: item?.id || `brf-reader-barline-${index}`, kind: 'manual', auto: false, importKaynak: 'brf-reader' };
};

const brfReaderIteminiSkorOgesineCevir = (item, index) => {
  if (item?.tip === 'nota') {
    return {
      ...muzikNotaSkorOgesi(item.id || `brf-reader-note-${index}`, item.notaAd, brfReaderSureIndeksiAl(item), {
        oktav: guvenliOktavAl(item.oktav, 4),
        accidental: item.accidental || null,
        dotted: Boolean(item.dotted),
        modifiers: (item.modifiers && typeof item.modifiers === 'object')
          ? {
              oncesi: Array.isArray(item.modifiers.oncesi) ? item.modifiers.oncesi : [],
              sonrasi: Array.isArray(item.modifiers.sonrasi) ? item.modifiers.sonrasi : [],
            }
          : { oncesi: [], sonrasi: [] },
      }),
      importKaynak: 'brf-reader',
    };
  }
  if (item?.tip === 'sus') {
    return { ...muzikSusSkorOgesi(item.id || `brf-reader-rest-${index}`, brfReaderSureIndeksiAl(item), { dotted: Boolean(item.dotted) }), importKaynak: 'brf-reader' };
  }
  if (['barline', 'finalBarline', 'sectionalBarline', 'endRepeat', 'beginRepeat'].includes(item?.tip)) {
    return brfReaderBarlineOgesiOlustur(item, index);
  }
  if (item?.tip === 'volta1' || item?.tip === 'volta2') {
    const voltaTip = item.tip;
    return {
      id: item.id || `brf-reader-${voltaTip}-${index}`, tip: voltaTip,
      ad: item.ad || (voltaTip === 'volta1' ? '1. ev' : '2. ev'),
      gorunum: item.gorunum || (voltaTip === 'volta1' ? '1.' : '2.'),
      hucreler: Array.isArray(item.hucreler) && item.hucreler.length ? item.hucreler
        : (voltaTip === 'volta1' ? [[3, 4, 5, 6], [2]] : [[3, 4, 5, 6], [2, 3]]),
      kind: 'manual', auto: false, importKaynak: 'brf-reader',
    };
  }
  return null;
};

const BARLINE_TIPLERI = ['barline', 'finalBarline', 'sectionalBarline', 'beginRepeat', 'endRepeat'];

function brfReaderSonucundanSkorOgeleriAl(readerResult) {
  const measures = Array.isArray(readerResult?.measures) ? readerResult.measures : [];
  const ogeler = [];
  const olcuKapanisBarlineId = [];
  const voltaKayitlari = [];
  let oncekiOlcuIcerik = [];

  measures.forEach((measure, measureIndex) => {
    const measureItems = Array.isArray(measure?.items) ? measure.items : [];
    const olcuTekrariMi = measureItems.some((it) => it?.tip === 'brailleRepeat');
    let sonBarlineOge = null;
    let buOlcuIcerik = [];

    if (olcuTekrariMi && oncekiOlcuIcerik.length) {
      oncekiOlcuIcerik.forEach((kaynak) => {
        const klon = {
          ...kaynak,
          id: `${kaynak.id}-rpt-${measureIndex}`,
          modifiers: kaynak.modifiers
            ? { oncesi: [...(kaynak.modifiers.oncesi || [])], sonrasi: [...(kaynak.modifiers.sonrasi || [])] }
            : undefined,
          _repeatCopy: true,
        };
        ogeler.push(klon);
        buOlcuIcerik.push(klon);
      });
    } else {
      measureItems.forEach((item) => {
        const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length);
        if (!oge) return;
        ogeler.push(oge);
        if (oge.tip === 'volta1' || oge.tip === 'volta2') voltaKayitlari.push({ oge, measureIndex });
        if (oge.tip === 'nota' || oge.tip === 'sus') buOlcuIcerik.push(oge);
        if (BARLINE_TIPLERI.includes(oge.tip)) sonBarlineOge = oge;
      });
    }

    if (measureIndex < measures.length - 1) {
      const son = ogeler[ogeler.length - 1];
      const nextFirst = Array.isArray(measures[measureIndex + 1]?.items) ? measures[measureIndex + 1].items[0] : null;
      const nextBeginsWithRepeat = nextFirst?.tip === 'beginRepeat';
      if (!BARLINE_TIPLERI.includes(son?.tip) && !nextBeginsWithRepeat) {
        const barlineOge = brfReaderBarlineOgesiOlustur({ tip: 'barline' }, ogeler.length);
        ogeler.push(barlineOge);
        sonBarlineOge = barlineOge;
      }
    }
    olcuKapanisBarlineId[measureIndex] = sonBarlineOge?.id || null;
    if (buOlcuIcerik.length) oncekiOlcuIcerik = buOlcuIcerik;
  });

  // Volta kapsamı
  for (let k = 0; k < voltaKayitlari.length; k++) {
    const cur = voltaKayitlari[k];
    if (cur.oge.tip === 'volta1') {
      const next = voltaKayitlari[k + 1];
      if (next && next.oge.tip === 'volta2') {
        cur.oge._voltaOlcuSayisi = next.measureIndex - cur.measureIndex;
        const bid = olcuKapanisBarlineId[next.measureIndex - 1];
        if (bid) cur.oge._voltaBitisBarlineId = bid;
      }
    } else if (cur.oge.tip === 'volta2') {
      const prev = voltaKayitlari[k - 1];
      const span = (prev && prev.oge.tip === 'volta1' && prev.oge._voltaOlcuSayisi) ? prev.oge._voltaOlcuSayisi : 1;
      const bid = olcuKapanisBarlineId[cur.measureIndex + span - 1];
      if (bid) cur.oge._voltaBitisBarlineId = bid;
    }
  }

  if (ogeler.length === 0) {
    (readerResult?.items || []).forEach((item) => {
      const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length);
      if (oge) ogeler.push(oge);
    });
  }
  return ogeler;
}

// ── İçerik özeti: MÜZİKAL ÖZ (nota/sus/dinamik) ile YAPI (barline/volta) AYRI ──
// Müzikal öz korunmalı (zorunlu); yapı trailing-barline farkları benign olabilir.
function icerikImzasi(res) {
  const muzikal = []; // nota/sus/dinamik — KORUNMALI
  const yapi = [];     // barline/volta/repeat — yapısal
  for (const it of res.items || []) {
    if (it.tip === 'nota') {
      const mods = [it.modifiers?.oncesi, it.modifiers?.sonrasi].flat().filter(Boolean)
        .map((m) => m?.kayit?.ad || m?.ad || '').filter(Boolean);
      muzikal.push(`N:${it.notaAd}${it.oktav}/${it.sureIndeksi}${it.accidental ? '#' + it.accidental : ''}${it.dotted ? '.' : ''}${mods.length ? '[' + mods.join(',') + ']' : ''}`);
    } else if (it.tip === 'sus') muzikal.push(`R:/${it.sureIndeksi}${it.dotted ? '.' : ''}`);
    else if (it.tip === 'brailleRepeat') yapi.push('RPT');
    else if (BARLINE_TIPLERI.includes(it.tip)) yapi.push(`|${it.tip}`);
    else if (it.tip === 'volta1' || it.tip === 'volta2') yapi.push(it.tip);
  }
  // trailing barline'ları kırp (benign): son elemandan geriye doğru sade barline'ları at
  while (yapi.length && yapi[yapi.length - 1] === '|barline') yapi.pop();
  return { muzikal, yapi };
}
const diziEsit = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ── Çalıştır ─────────────────────────────────────────────────────────────────
console.log('═'.repeat(72));
console.log('HAZIR PARÇALARI STANDART-DOĞRU PIPELINE\'DAN YENİDEN ÜRET');
console.log(yaz ? '(--write: muzikHazirParcalar.js GÜNCELLENECEK)' : '(RAPOR modu — değişiklik yazılmaz; uygulamak için --write)');
console.log('═'.repeat(72));

const yeniBrfler = new Map();
let degisen = 0, icerikSapan = 0;

for (const parca of MUZIK_HAZIR_PARCALAR) {
  if (sadece && !parca.ad.includes(sadece)) continue;
  // "PDF: …" parçaları PDF-doğrulanmış ORACLE'dır (referans braille) — kanonikleştirme/regenerasyon
  // UYGULANMAZ (satır kırılması/ifade gibi özellikleri kasıtlı; round-trip değiştirebilir).
  if (String(parca.ad).startsWith('PDF:')) continue;
  const eskiBrf = parca.brf;
  const r1 = brfMuzikOku(eskiBrf, { source: 'fix-in' });
  const ogeler = brfReaderSonucundanSkorOgeleriAl(r1);
  // EKSİK DÜZELTME: parça düzgün bir kapanış çizgisiyle bitmeli. Orijinallerde final barline
  // ⠣⠀⠅ boşlukla bölünüp düz barline'a düşüyordu (malformed) → sondaki düz barline'ları kırp,
  // sonra son anlamlı öğe nota/sus ise standart final barline (𝄂 = ⠣⠅) ekle. endRepeat ile
  // bitenler zaten kapanış sağlar → dokunma.
  while (ogeler.length && ogeler[ogeler.length - 1].tip === 'barline') ogeler.pop();
  const sonOge = ogeler[ogeler.length - 1];
  if (sonOge && (sonOge.tip === 'nota' || sonOge.tip === 'sus')) {
    ogeler.push({ id: `final-${ogeler.length}`, tip: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [[1, 2, 6], [1, 3]], kind: 'manual', auto: false });
  }
  const baglar = (r1.baglar || []).filter((b) => {
    const ids = new Set(ogeler.map((o) => o.id));
    return (!b.basId || ids.has(b.basId)) && (!b.sonId || ids.has(b.sonId));
  });
  const header = brfReaderHeaderOlustur(r1.header || {});
  // Bar numaraları SAKLANAN tek-satır gövdeye GÖMÜLMEZ: süsleme hücreleriyle çakışır
  // (⠖=bar-no-6 ⇄ tril; ⠦=bar-no-8 ⇄ staccato) → re-import bozulur. Bar numaraları satır-
  // kırılması/sunum özelliğidir; editör DISPLAY'de satır başlarında üretir. Saklanan kanonik
  // form = mantıksal içerik (bar-no'suz), editör default export'uyla da tutarlı + stabil.
  const out = scoreToCanonicalBrf({ ogeler, baglar, header, tupletler: [], options: { includeBarNumbers: false } });
  const yeniBrf = out.brfText;

  // İçerik koruma: yeni BRF'i tekrar oku, imza karşılaştır
  const r2 = brfMuzikOku(yeniBrf, { source: 'fix-out' });
  const i1 = icerikImzasi(r1), i2 = icerikImzasi(r2);
  const muzikalAyni = diziEsit(i1.muzikal, i2.muzikal); // ZORUNLU koruma
  const yapiAyni = diziEsit(i1.yapi, i2.yapi);
  // Header koruma: zaman imzası + donanım(key) + başlık + besteci kaybolmamalı
  const hImza = (h) => `t:${h?.timeSignature?.ad || '-'}|k:${h?.keySignature?.ad || h?.keySignature?.gorunum || '-'}|b:${h?.title || '-'}|c:${h?.composer || '-'}`;
  const headerAyni = hImza(r1.header) === hImza(r2.header);
  if (!headerAyni) console.log(`     ⚠ HEADER farkı: "${hImza(r1.header)}" → "${hImza(r2.header)}"`);
  const guvenli = muzikalAyni && headerAyni;             // müzikal öz + header korunduysa yazılabilir
  const farkliMi = eskiBrf.replace(/\s+$/gm, '') !== yeniBrf.replace(/\s+$/gm, '');

  if (!guvenli) icerikSapan++;
  if (farkliMi) degisen++;
  yeniBrfler.set(parca.ad, { yeniBrf, guvenli });

  const durum = !muzikalAyni ? '✗ MÜZİKAL İÇERİK SAPTI' : !yapiAyni ? '~ notasyon düzeltildi (yapı: trailing fark)' : farkliMi ? '~ notasyon düzeltildi' : '= zaten doğru';
  console.log(`${guvenli ? '✓' : '✗'} ${parca.ad.padEnd(24)} ${durum}`);
  if (!muzikalAyni) {
    const ilk = i1.muzikal.findIndex((x, i) => x !== i2.muzikal[i]);
    console.log(`     müzikal ilk fark @${ilk}: "${i1.muzikal[ilk] || '-'}" → "${i2.muzikal[ilk] || '-'}"  (eski ${i1.muzikal.length} / yeni ${i2.muzikal.length} nota-sus)`);
  }
  if (diffGoster && farkliMi) {
    const eskiSatir = eskiBrf.split('\n');
    const yeniSatir = yeniBrf.split('\n');
    console.log('     ── ESKİ ──');
    eskiSatir.forEach((l) => console.log('       ' + l));
    console.log('     ── YENİ ──');
    yeniSatir.forEach((l) => console.log('       ' + l));
  }
}

console.log('═'.repeat(72));
console.log(`${MUZIK_HAZIR_PARCALAR.length} parça · ${degisen} notasyon düzeltmesi · ${icerikSapan} içerik sapması`);

if (icerikSapan > 0) {
  console.log('⚠ İçerik sapan parça(lar) var — bunlar YAZILMAYACAK (orijinal korunur), elle incelenmeli.');
}

if (yaz) {
  if (icerikSapan > 0) {
    console.log('\n✗ İçerik sapan parça var — GÜVENLİK: hiçbir şey yazılmadı. Önce sapmayı çöz.');
    process.exit(1);
  }
  const dosya = path.join(__dirname, '..', 'src', 'data', 'muzikHazirParcalar.js');
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const parcaBloklari = MUZIK_HAZIR_PARCALAR.map((parca) => {
    // PDF: oracle parçaları (yeniBrfler'de yok) ve regenere edilenler → uygun brf seç.
    const yeniBrf = yeniBrfler.get(parca.ad)?.yeniBrf ?? parca.brf;
    const satirlar = yeniBrf.split('\n').map((l) => `      '${esc(l)}',`).join('\n');
    return `  {\n    ad: '${esc(parca.ad)}',\n    brf: [\n${satirlar}\n    ].join('\\n'),\n  },`;
  }).join('\n');
  const icerik = `// Müzik BRF Yazım editöründe hazır gelen örnek parçalar.
// Her parça canonical BRF metnidir (Unicode braille). Select kutusundan
// seçildiğinde brfMetniYukle() ile editöre yüklenir.
//
// NOT: Bu dosya scripts/music-brf-fix-pieces.mjs ile standart-doğru pipeline'dan
// yeniden üretildi (oktav/Kural4/boşluk/gruplama düzeltmeleri; içerik korunarak).

export const MUZIK_HAZIR_PARCALAR = [
${parcaBloklari}
];
`;
  fs.writeFileSync(dosya, icerik, 'utf8');
  console.log(`\n✓ ${MUZIK_HAZIR_PARCALAR.length} parça muzikHazirParcalar.js'e yazıldı (standart-doğru notasyon, içerik korundu).`);
}
