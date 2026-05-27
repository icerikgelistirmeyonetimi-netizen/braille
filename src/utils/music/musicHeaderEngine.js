// Modül 8 Bölüm 1,6 — Header BRF emission (title, composer, tempo, key, time)
import { MUZIK_HARF_NOKTALARI, MUZIK_UST_RAKAM, MUZIK_ALT_RAKAM } from './musicConstants.js';

// Modül 8 Bölüm 1.5 — Zaman imzası hücreleri
// "4/4" → [numero-işareti, üst-rakam(lar), alt-rakam(lar)]
// "common" → [4,6][1,4], "cut common" → [4,5,6][1,4]
export function muzikTimeSignatureHucreleri(sig) {
  const ad = String((sig && (sig.ad || sig.gorunum)) || sig || '').toLowerCase().trim();
  if (!ad) return [];
  if (ad === 'common' || ad === 'c') return [[4, 6], [1, 4]];
  if (ad === 'cut common' || ad === 'cut c' || ad === '𝄵') return [[4, 5, 6], [1, 4]];
  if (ad === '10/8') {
    return [
      [3, 4, 5, 6],
      [2, 4, 5],
      [2, 3, 5],
    ];
  }
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(ad);
  if (!m) return [];
  const ust = m[1].split('').map((d) => MUZIK_UST_RAKAM[d] || []).filter((h) => h.length);
  const alt = m[2].split('').map((d) => MUZIK_ALT_RAKAM[d] || []).filter((h) => h.length);
  return [[3, 4, 5, 6], ...ust, ...alt];
}

// Modül 8 Bölüm 6 — Kontraksiyonsuz Grade 1 braille (büyük harf yok)
export function muzikKontraksiyonsuzMetinHucreleri(metin) {
  const hucreler = [];
  const m = String(metin || '').toLocaleLowerCase('tr');

  for (const c of m) {
    if (c === ' ') {
      hucreler.push([]);
      continue;
    }

    if (c === '.') {
      hucreler.push([2, 5, 6]);
      continue;
    }

    if (c === ',') {
      hucreler.push([2]);
      continue;
    }

    if (c === '-') {
      hucreler.push([3, 6]);
      continue;
    }

    if (MUZIK_HARF_NOKTALARI[c]) {
      hucreler.push(MUZIK_HARF_NOKTALARI[c]);
    }
  }

  return hucreler;
}

export function muzikHucreDot123IcerirMi(hucre) {
  return Array.isArray(hucre) && hucre.some((dot) => dot === 1 || dot === 2 || dot === 3);
}

export function muzikDot3AyiriciGerekliMi(sonrakiHucre) {
  return muzikHucreDot123IcerirMi(sonrakiHucre);
}

export function muzikGerekirseDot3AyiriciEkle(hucreler, sonrakiHucre) {
  const sonuc = Array.isArray(hucreler) ? [...hucreler] : [];

  if (muzikDot3AyiriciGerekliMi(sonrakiHucre)) {
    sonuc.push([3]);
  }

  return sonuc;
}

// 40-hücre satırda ortala (gerçek BRF kağıt çıktısı için)
export function muzikHucrelerOrtala(cells, satirdaHucre = 40) {
  const sol = Math.max(0, Math.floor((satirdaHucre - cells.length) / 2));
  const sag = Math.max(0, satirdaHucre - cells.length - sol);
  const out = [];
  for (let i = 0; i < sol; i++) out.push([]);
  for (const c of cells) out.push(c);
  for (let i = 0; i < sag; i++) out.push([]);
  return out;
}

// Modül 8 Bölüm 1 — Header satırları (kompakt; padding/ortalama YOK)
// Ekran gösteriminde ortalama boşlukları çirkin durduğu için padding'siz döner.
// Title / Composer / (Tempo + Key + Time) her biri ayrı satır olur.
export function muzikHeaderSatirlariUret(header) {
  if (!header) return [];
  const satirlar = [];
  if (header.title) {
    const cells = muzikKontraksiyonsuzMetinHucreleri(header.title);
    if (cells.length) satirlar.push({ kaynak: 'title', etiket: header.title, hucreler: cells });
  }
  if (header.composer) {
    const cells = muzikKontraksiyonsuzMetinHucreleri(header.composer);
    if (cells.length) satirlar.push({ kaynak: 'composer', etiket: header.composer, hucreler: cells });
  }
  const ucuncu = [];
  const kaynaklar = [];
  const hucreEtiketleri = [];
  const parcalar = [];

  function headerParcasiEkle({
    hedef,
    kaynaklar: hedefKaynaklar,
    hucreEtiketleri: hedefEtiketler,
    hucreler,
    kaynak,
    etiket,
    sonrakiIlkHucre = null,
    dot3AyiriciKontrol = false,
    boslukSonrasi = false,
  }) {
    if (!Array.isArray(hucreler) || hucreler.length === 0) return;

    hucreler.forEach((h) => {
      hedef.push(Array.isArray(h) ? [...h] : []);
      hedefKaynaklar.push(kaynak);
      hedefEtiketler.push(etiket);
    });

    if (dot3AyiriciKontrol && muzikDot3AyiriciGerekliMi(sonrakiIlkHucre)) {
      hedef.push([3]);
      hedefKaynaklar.push(kaynak);
      hedefEtiketler.push(`${etiket} ayırıcı dot 3`);
    }

    if (boslukSonrasi) {
      hedef.push([]);
      hedefKaynaklar.push(kaynak);
      hedefEtiketler.push(etiket);
    }
  }

  const tempoCells = header.tempo ? muzikKontraksiyonsuzMetinHucreleri(header.tempo) : [];
  const keyCells = header.keySignature && Array.isArray(header.keySignature.hucreler)
    ? header.keySignature.hucreler
    : [];
  const timeCells = header.timeSignature && Array.isArray(header.timeSignature.hucreler)
    ? header.timeSignature.hucreler
    : [];

  if (tempoCells.length) {
    const tempoEtiket = `Tempo: ${header.tempo}`;
    const sonrakiTempoHucre = keyCells[0] || timeCells[0] || null;
    headerParcasiEkle({
      hedef: ucuncu,
      kaynaklar,
      hucreEtiketleri,
      hucreler: tempoCells,
      kaynak: 'tempo',
      etiket: tempoEtiket,
      sonrakiIlkHucre: sonrakiTempoHucre,
      dot3AyiriciKontrol: true,
      boslukSonrasi: Boolean(keyCells.length || timeCells.length),
    });
    parcalar.push(tempoEtiket);
  }

  if (keyCells.length) {
    const ks = header.keySignature.ad || header.keySignature.gorunum || '';
    const keyLabel = `Donanım: ${ks}`;
    headerParcasiEkle({
      hedef: ucuncu,
      kaynaklar,
      hucreEtiketleri,
      hucreler: keyCells,
      kaynak: 'key-signature',
      etiket: keyLabel,
      sonrakiIlkHucre: timeCells[0] || null,
      dot3AyiriciKontrol: false,
      boslukSonrasi: Boolean(timeCells.length),
    });
    if (ks) parcalar.push(keyLabel);
  }

  if (timeCells.length) {
    const ts = header.timeSignature.gorunum || header.timeSignature.ad || '';
    const timeLabel = `Zaman: ${ts}`;
    headerParcasiEkle({
      hedef: ucuncu,
      kaynaklar,
      hucreEtiketleri,
      hucreler: timeCells,
      kaynak: 'time-signature',
      etiket: timeLabel,
      dot3AyiriciKontrol: false,
    });
    if (ts) parcalar.push(timeLabel);
  }

  if (ucuncu.length) {
    satirlar.push({
      kaynak: 'header-meta',
      etiket: parcalar.filter(Boolean).join(' • '),
      hucreler: ucuncu,
      hucreKaynaklari: kaynaklar,
      hucreEtiketleri,
    });
  }

  return satirlar;
}

// Gerçek BRF kağıt dökümünde her header satırı 40-hücre satırda ortalanır.
export function muzikHeaderSatirOrtali(satir, satirdaHucre = 40) {
  if (!satir) return [];
  return muzikHucrelerOrtala(satir.hucreler || [], satirdaHucre);
}
