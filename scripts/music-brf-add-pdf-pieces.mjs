// 39 PDF-doğrulanmış fixture'ı editör HAZIR PARÇALARINA (muzikHazirParcalar.js) ekler.
// Her fixture için tam BRF kurar: [başlık satırı] + [donanım+ölçü imza satırı] + [gövde braille].
// Kullanıcı editörde "PDF: …" parçalarını yükleyip PDF örneklerini kontrol edebilir.
//
//   node scripts/music-brf-add-pdf-pieces.mjs            # RAPOR: her örnek temiz yükleniyor mu
//   node scripts/music-brf-add-pdf-pieces.mjs --write    # hazır parçalara ekle

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pieces, keySig, timeSig } from './muzik-brl-fixtures.mjs';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { muzikKontraksiyonsuzMetinHucreleri } from '../src/utils/music/musicHeaderEngine.js';
import { MUZIK_HAZIR_PARCALAR } from '../src/data/muzikHazirParcalar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const yaz = process.argv.includes('--write');

const hucreToBraille = (h) => { let b = 0x2800; for (const d of (h || [])) b |= 1 << (d - 1); return String.fromCodePoint(b); };
const metinBraille = (metin) => (muzikKontraksiyonsuzMetinHucreleri(metin) || []).map(hucreToBraille).join('');

// Fixture id → temiz başlık (sayfa ref ve özel karakterleri sadeleştir, başlık braille'i için)
function baslikTemiz(id) {
  return id
    .replace(/\(s\.[^)]*\)/g, '')      // (s.24) sayfa referansı
    .replace(/—.*$/, '')               // — sonrası (besteci/açıklama)
    .replace(/[⚠]/g, '')
    .replace(/[^\p{L}\p{N} ']/gu, ' ') // harf/rakam/boşluk dışını sadeleştir
    .replace(/\s+/g, ' ')
    .trim();
}

// PDF açıklamalarından başlık/besteci/altbaşlık/tempo çıkar (sayfa → meta). Açıklama dosyası
// yoksa fixture id'sine/tempo'suna düşülür → script yine de çalışır (metadata zayıflar).
const descMeta = {};
try {
  const descs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_pdf_descriptions.json'), 'utf8'));
  const al = (re, s) => { const m = re.exec(s); return m ? m[1].trim().replace(/\s+/g, ' ') : ''; };
  for (const x of descs) {
    const s = x.desc || '';
    descMeta[String(x.page)] = {
      title: al(/title\s*:\s*([^]*?)(?:composer|subtitle|tempo|key\s*sig|time\s*sig|bar\s*\d|$)/i, s),
      composer: al(/composer\s*:\s*([^]*?)(?:subtitle|tempo|key\s*sig|time\s*sig|bar\s*\d|$)/i, s),
      subtitle: al(/subtitle\s*:\s*([^]*?)(?:composer|tempo|key\s*sig|time\s*sig|bar\s*\d|$)/i, s),
      tempo: al(/tempo\s*marking\s*:\s*([^]*?)(?:key\s*sig|time\s*sig|composer|subtitle|bar\s*\d|$)/i, s),
    };
  }
} catch { /* açıklama dosyası yok — fixture meta'ya düş */ }

// Bir fixture için nihai başlık/besteci/tempo + select etiketi (ad).
function parcaMeta(meta) {
  const pg = (/s\.([\d-]+)/.exec(meta.id) || [])[1] || '';
  const dm = descMeta[pg] || descMeta[pg.split('-')[0]] || {};
  const idComposer = (/—\s*(.+?)\s*\(/.exec(meta.id) || [, ''])[1] || '';
  let title = dm.title || baslikTemiz(meta.id);
  let composer = dm.composer || idComposer || dm.subtitle || '';
  let tempo = dm.tempo || meta.tempo || '';
  const ay = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase();
  if (ay(title, tempo)) tempo = '';     // yalnız-tempo egzersizi (başlık=tempo) → tekrarı önle
  if (ay(title, composer)) composer = ''; // başlık=besteci → tekrarı önle
  const ad = `PDF: ${[title, composer ? '— ' + composer : ''].filter(Boolean).join(' ')} (s.${pg})`.replace(/\s+/g, ' ').trim();
  return { title, composer, tempo, ad };
}

// Her fixture için tam BRF kur — başlık / besteci / tempo (varsa, ayrı satırlar) + donanım+zaman + gövde.
// Reader metin satırlarını sırayla title→composer→tempo'ya atar; bu yüzden besteci tempo'dan ÖNCE gelir.
function tamBrfKur(meta, brl) {
  const { title, composer, tempo } = parcaMeta(meta);
  const satirlar = [];
  if (title) satirlar.push(metinBraille(title));
  if (composer) satirlar.push(metinBraille(composer));
  if (tempo) satirlar.push(metinBraille(tempo));
  const imza = [keySig(meta.key), meta.time ? timeSig(meta.time) : ''].filter(Boolean).join('');
  if (imza) satirlar.push(imza);
  satirlar.push(brl); // gövde (çok satırlı olabilir)
  return satirlar.join('\n');
}

console.log('═'.repeat(74));
console.log(`PDF örneklerini HAZIR PARÇALARA ekle — ${pieces.length} fixture`);
console.log(yaz ? '(--write: muzikHazirParcalar.js güncellenecek)' : '(RAPOR — her örnek temiz yükleniyor mu)');
console.log('═'.repeat(74));

const yeniParcalar = [];
let hata = 0, metaHata = 0;
for (const { meta, brl } of pieces) {
  const pm = parcaMeta(meta);
  const brf = tamBrfKur(meta, brl);
  const r = brfMuzikOku(brf, { source: 'pdf-add' });
  const unknown = (r.items || []).filter((it) => it.tip === 'unknown').length;
  const nota = (r.items || []).filter((it) => it.tip === 'nota').length;
  const bos = (r.warnings || []).some((w) => w.type === 'empty-parse');
  // başlık/besteci/tempo round-trip doğrula — okunan header beklenenle birebir olmalı
  const oT = r.header?.title || '', oC = r.header?.composer || '', oTm = r.header?.tempo || '';
  const metaOk = oT === pm.title && oC === pm.composer && oTm === pm.tempo;
  const ok = unknown === 0 && !bos && nota > 0 && metaOk;
  if (!ok) hata += 1;
  if (!metaOk) {
    metaHata += 1;
    console.log(`✗ META s.${(/s\.([\d-]+)/.exec(meta.id) || [])[1]}  bek[T=${JSON.stringify(pm.title)} C=${JSON.stringify(pm.composer)} Tm=${JSON.stringify(pm.tempo)}]  oku[T=${JSON.stringify(oT)} C=${JSON.stringify(oC)} Tm=${JSON.stringify(oTm)}]`);
  }
  console.log(`${ok ? '✓' : '✗'} ${meta.id.slice(0, 40).padEnd(42)} nota:${String(nota).padStart(3)} unk:${unknown}${bos ? ' BOŞ' : ''} | bes:${(oC || '-').slice(0, 14).padEnd(14)} tmp:${(oTm || '-').slice(0, 12)}`);
  yeniParcalar.push({ ad: pm.ad, brf });
}

console.log('═'.repeat(74));
console.log(hata === 0 ? `✓ ${pieces.length} PDF örneği temiz yükleniyor (başlık/besteci/tempo round-trip dahil)` : `✗ ${hata} örnek sorunlu (meta hatası: ${metaHata})`);

if (yaz) {
  const dosya = path.join(__dirname, '..', 'src', 'data', 'muzikHazirParcalar.js');
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const blok = (p) => {
    const satirlar = p.brf.split('\n').map((l) => `      '${esc(l)}',`).join('\n');
    return `  {\n    ad: '${esc(p.ad)}',\n    brf: [\n${satirlar}\n    ].join('\\n'),\n  },`;
  };
  // Mevcut 9 parçayı koru (PDF: ile başlamayanlar), PDF örneklerini sona ekle (tekrar çalıştırınca çift olmasın)
  const mevcut = MUZIK_HAZIR_PARCALAR.filter((p) => !String(p.ad).startsWith('PDF:'));
  const tumu = [...mevcut, ...yeniParcalar];
  const icerik = `// Müzik BRF Yazım editöründe hazır gelen örnek parçalar.
// Her parça canonical BRF metnidir (Unicode braille). Select kutusundan
// seçildiğinde brfMetniYukle() ile editöre yüklenir.
//
// "PDF: …" parçaları: muzik-braille-test-ornekleri.md'deki PDF-doğrulanmış işlenmiş örnekler
// (scripts/music-brf-add-pdf-pieces.mjs ile eklenir). PDF örneklerini editörde kontrol için.

export const MUZIK_HAZIR_PARCALAR = [
${tumu.map(blok).join('\n')}
];
`;
  fs.writeFileSync(dosya, icerik, 'utf8');
  console.log(`\n✓ ${mevcut.length} mevcut + ${yeniParcalar.length} PDF örneği = ${tumu.length} parça yazıldı.`);
}
