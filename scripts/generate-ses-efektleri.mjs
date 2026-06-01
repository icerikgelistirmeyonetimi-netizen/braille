// Geçici, %100 telifsiz ses efektleri üretir (tıklama / doğru / yanlış).
// Sesler burada sentezlenir; hiçbir dosya indirilmez. Kullanıcı kendi
// lisanslı seslerini aynı isimle koyduğunda otomatik olarak onlar kullanılır.
//
// Çalıştırma:  node scripts/generate-ses-efektleri.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cikisKlasor = join(__dirname, '..', 'public', 'audio', 'efekt');
mkdirSync(cikisKlasor, { recursive: true });

const ORNEKLEME = 44100;

// 16-bit PCM mono WAV oluşturur.
function wavYaz(yol, ornekler) {
  const veriBoyutu = ornekler.length * 2;
  const buf = Buffer.alloc(44 + veriBoyutu);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + veriBoyutu, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);       // fmt chunk boyutu
  buf.writeUInt16LE(1, 20);        // PCM
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(ORNEKLEME, 24);
  buf.writeUInt32LE(ORNEKLEME * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);        // block align
  buf.writeUInt16LE(16, 34);       // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(veriBoyutu, 40);
  for (let i = 0; i < ornekler.length; i++) {
    let v = Math.max(-1, Math.min(1, ornekler[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(yol, buf);
}

// Tek bir ton parçası üretir (yumuşak zarf ile).
function ton({ frekans, sure, tip = 'sine', kazanc = 0.3, baslangic = 0 }) {
  const n = Math.floor(ORNEKLEME * (baslangic + sure));
  const off = Math.floor(ORNEKLEME * baslangic);
  const out = new Float32Array(n);
  const atak = Math.floor(ORNEKLEME * 0.006);
  const sustain = Math.floor(ORNEKLEME * sure);
  for (let i = 0; i < sustain; i++) {
    const t = i / ORNEKLEME;
    let s;
    const faz = 2 * Math.PI * frekans * t;
    switch (tip) {
      case 'triangle':
        s = (2 / Math.PI) * Math.asin(Math.sin(faz));
        break;
      case 'sawtooth':
        s = 2 * ((frekans * t) % 1) - 1;
        break;
      default:
        s = Math.sin(faz);
    }
    // Üstel sönüm zarfı
    let zarf = Math.exp(-3 * (i / sustain));
    if (i < atak) zarf *= i / atak;
    out[off + i] = s * kazanc * zarf;
  }
  return out;
}

// Birden çok ton parçasını üst üste bindirir.
function birlestir(parcalar) {
  const uzunluk = Math.max(...parcalar.map((p) => p.length));
  const out = new Float32Array(uzunluk);
  for (const p of parcalar) {
    for (let i = 0; i < p.length; i++) out[i] += p[i];
  }
  // Basit limitleme
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

// Tıklama: kısa, nötr tık
const tiklama = ton({ frekans: 440, sure: 0.05, tip: 'triangle', kazanc: 0.35 });

// Doğru: yükselen iki nota
const dogru = birlestir([
  ton({ frekans: 660, sure: 0.12, tip: 'sine', kazanc: 0.32, baslangic: 0 }),
  ton({ frekans: 880, sure: 0.18, tip: 'sine', kazanc: 0.32, baslangic: 0.1 })
]);

// Yanlış: alçalan iki nota (yumuşak)
const yanlis = birlestir([
  ton({ frekans: 320, sure: 0.14, tip: 'sawtooth', kazanc: 0.22, baslangic: 0 }),
  ton({ frekans: 200, sure: 0.22, tip: 'sawtooth', kazanc: 0.22, baslangic: 0.12 })
]);

wavYaz(join(cikisKlasor, 'tiklama.wav'), tiklama);
wavYaz(join(cikisKlasor, 'dogru.wav'), dogru);
wavYaz(join(cikisKlasor, 'yanlis.wav'), yanlis);

console.log('Geçici ses efektleri üretildi:');
console.log('  public/audio/efekt/tiklama.wav');
console.log('  public/audio/efekt/dogru.wav');
console.log('  public/audio/efekt/yanlis.wav');
