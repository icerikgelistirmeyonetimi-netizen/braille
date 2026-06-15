import { brfMuzikOku } from './brfMusicReader.js';

// Satır başı ölçü numarası (Lesson 5, PDF s.40) — SUNUM yardımcısı.
// Standart: her braille satırının 1. hücresine, SAYI İŞARETİ OLMADAN, ÜST rakam
// (a–j harfleri: 1=⠁ … 6=⠋ … 0=⠚) ile o satırın ilk ölçü numarası yazılır; sonra
// BİR BOŞLUK bırakılıp müziğe geçilir. Anacrusis (es-vuruş) = 0. ölçü.
// (PDF örneği: bar 1=⠁, bar 8=⠓, bar 16=⠁⠋.)

// Üst-hücre rakam → Unicode braille (a–j; sayı işareti YOK)
const UST_RAKAM = {
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
  '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
};

export function ustRakamYaz(n) {
  return String(n).split('').map((d) => UST_RAKAM[d] || '').join('');
}
// Geriye dönük uyumluluk için eski ad; artık ÜST rakam üretir.
export const altRakamYaz = ustRakamYaz;

const UST_RAKAM_CHARS = new Set(Object.values(UST_RAKAM));

// Satır başındaki MEVCUT ölçü numarasını (üst-rakam dizisi + ardından bir ayraç) siler.
// Zaten numaralı bir BRF (örn. indirilmiş dosya) tekrar görüntülen/numaralanırken
// ÇİFT numara oluşmasın diye, numaralamadan ÖNCE her gövde satırının başındaki numara
// temizlenir. (Müzik satırının ilk notası oktav işaretiyle başlar — üst-rakamla DEĞİL —
// dolayısıyla üst-rakam+ayraç ile başlayan satır kesinlikle bir ölçü numarasıdır.)
export function satirBasiNumarasiniSil(satir) {
  const s = String(satir || '');
  let i = 0;
  while (i < s.length && UST_RAKAM_CHARS.has(s[i])) i += 1;
  if (i > 0 && i < s.length && (s[i] === '⠀' || s[i] === ' ')) return s.slice(i + 1);
  return s;
}

const BOSLUK_MU = (ch) => ch === '⠀' || ch === ' ';

// Bir müzik gövde satırını ölçülere böler (ayraç: ⠀ veya normal boşluk).
// Çok-hücreli barline (final ⠣⠅ vb.) ölçüye bitişik kaldığından bölme bozulmaz.
export function olculereBol(govde) {
  const s = String(govde || '');
  const olculer = [];
  let cur = '';
  for (let i = 0; i < s.length; i += 1) {
    if (BOSLUK_MU(s[i])) {
      if (cur) { olculer.push(cur); cur = ''; }
    } else {
      cur += s[i];
    }
  }
  if (cur) olculer.push(cur);
  return olculer;
}

// Kanonik BRF metnini, satır başı ölçü numaralı + 40-hücre satırlara bölünmüş
// standart biçime çevirir (İNDİRME için). Numara notaya BİTİŞİK yazılır (Format B):
// reader satır-başı bağlamında bunu ölçü numarası sayıp atlar (round-trip güvenli).
// Kendi içinde reader'ı çalıştırır → başlık/gövde sınırı girdi metniyle daima uyumlu.
export function numaraliBrfMetni(metin, { genislik = 40 } = {}) {
  if (typeof metin !== 'string' || !metin.trim()) return metin;
  let r;
  try { r = brfMuzikOku(metin, { source: 'numarali-export' }); } catch { return metin; }
  const g = brfNumaraliGorunum(metin, r, { genislik });
  if (!g || !Array.isArray(g.govde) || g.govde.length === 0) return metin;
  // PDF s.40: numara (üst rakam) + BOŞLUK + müzik (numara kendi hücresinde, ardından ayraç).
  const govdeSatir = g.govde.map((s) => `${ustRakamYaz(s.no)}⠀${s.metin}`);
  const cikti = [...g.basliklar, ...govdeSatir].join('\n');
  // GÜVENLİK: numaralı çıktı orijinalle AYNI müziği (nota dizisi + ölçü sayısı) veriyorsa
  // kullan; vermiyorsa (zaman/donanım değişimi, tuplet-içi boşluk, sayısal tekrar gibi
  // özel boşluk taşıyan kenar durumlar) orijinali döndür → indirilen dosya DAİMA aynen
  // geri okunur. (Reader satır-başı numarayı zaten atlar; risk yalnız ölçü-sınırı kayması.)
  return roundTripGuvenli(r, cikti) ? cikti : metin;
}

function ogeImzasi(r) {
  const dizi = (r?.items || [])
    .filter((i) => i.tip === 'nota' || i.tip === 'sus')
    .map((i) => (i.tip === 'sus' ? `R${i.sureIndeksi}` : `${i.notaAd}${i.oktav}/${i.sureIndeksi}`))
    .join('|');
  return `${(r?.measures || []).length}#${dizi}`;
}

function roundTripGuvenli(orijinalSonuc, numaraliMetin) {
  try {
    const yeni = brfMuzikOku(numaraliMetin, { source: 'rt-check' });
    return ogeImzasi(orijinalSonuc) === ogeImzasi(yeni);
  } catch { return false; }
}

// Sadece BRF metninden numaralı görünüm üret (reader'ı içeride çalıştırır).
// Yeni yazılan skorlarda `brfOkumaSonucu` henüz yok olabilir; bu yüzden export
// önizlemesi gibi yerlerde metinden doğrudan numaralı görünüm hesaplanır.
export function brfGorunumMetinden(metin, { genislik = 40 } = {}) {
  if (typeof metin !== 'string' || !metin.trim()) return null;
  let r;
  try { r = brfMuzikOku(metin, { source: 'gorunum-metin' }); } catch { return null; }
  return brfNumaraliGorunum(metin, r, { genislik });
}

// Anacrusis (es-vuruş / pickup) var mı? → ilk ölçü dolu ölçüden kısaysa.
// reader measures: [{ no, items, total16 }]. Baskın (en sık) ölçü süresinden
// kısa bir ilk ölçü = anacrusis → 0. ölçü olarak numaralanır.
export function anakruzisVarMi(measures) {
  if (!Array.isArray(measures) || measures.length < 2) return false;
  const totals = measures.map((m) => Number(m?.total16) || 0).filter((t) => t > 0);
  if (totals.length < 2) return false;
  const freq = new Map();
  for (const t of totals) freq.set(t, (freq.get(t) || 0) + 1);
  let baskin = totals[0];
  let enCok = 0;
  for (const [t, c] of freq) if (c > enCok) { enCok = c; baskin = t; }
  const ilk = Number(measures[0]?.total16) || 0;
  return ilk > 0 && ilk < baskin;
}

// Görüntülenecek BRF metnini + reader sonucunu alıp numaralı görünüm üretir.
//   metin            : ekranda gösterilen ham BRF (başlık satırları + gövde)
//   brfOkumaSonucu   : reader sonucu (cells → başlık/gövde sınırı, measures → anacrusis)
// Döner: { basliklar: string[], govde: [{no, metin}] } | null
export function brfNumaraliGorunum(metin, brfOkumaSonucu, { genislik = 40 } = {}) {
  if (typeof metin !== 'string' || !metin) return null;
  const satirlar = metin.split(/\r?\n/);
  const cells = Array.isArray(brfOkumaSonucu?.cells) ? brfOkumaSonucu.cells : [];

  // Header cell'leri reader tarafından 'header-*' / 'header boşluk' diye etiketli.
  const muzikCellMi = (c) =>
    c &&
    c.category !== 'header-title' &&
    c.category !== 'header-time-signature' &&
    c.meaning !== 'header boşluk';

  const muzikSatirlari = cells.filter(muzikCellMi)
    .map((c) => c.lineIndex)
    .filter((n) => Number.isInteger(n) && n >= 0);

  if (muzikSatirlari.length === 0) return null; // gövde tespit edilemedi → çağıran fallback yapar
  const ilkGovdeIdx = Math.min(...muzikSatirlari);

  const basliklar = satirlar.slice(0, ilkGovdeIdx);
  // Gövde satırlarındaki MEVCUT satır-başı numaralarını sil → tekrar numaralarken çift
  // numara oluşmaz ve numara hücresi yanlışlıkla "ölçü" gibi sayılmaz (yanlış ölçü no).
  const govdeMetni = satirlar.slice(ilkGovdeIdx).map(satirBasiNumarasiniSil).join('⠀');
  const ilkNo = anakruzisVarMi(brfOkumaSonucu?.measures) ? 0 : 1;
  const govde = muzikGovdesiniNumarali(govdeMetni, { genislik, ilkNo });

  return { basliklar, govde };
}

// Müzik gövdesini, satır başına ölçü numarası taşıyan satırlara böler.
//   govde     : müzik gövdesi (ölçüler boşlukla ayrık tek metin)
//   genislik  : satır başına braille hücresi (varsayılan 40)
//   ilkNo     : ilk ölçünün numarası (anacrusis varsa 0, yoksa 1)
// Döner: [{ no, metin }] — `metin` numarasız müzik içeriği; UI numarayı ayrı basar.
export function muzikGovdesiniNumarali(govde, { genislik = 40, ilkNo = 1 } = {}) {
  const olculer = olculereBol(govde);
  if (olculer.length === 0) return [];

  const satirlar = [];
  let i = 0;
  let no = ilkNo;
  while (i < olculer.length) {
    const satirNo = no;
    const onEkUzunluk = altRakamYaz(satirNo).length + 1; // numara + 1 hücre boşluk
    const kullanilabilir = Math.max(8, genislik - onEkUzunluk);

    let parcalar = [];
    let uzunluk = 0;
    while (i < olculer.length) {
      const olcu = olculer[i];
      const ekle = (parcalar.length === 0 ? 0 : 1) + olcu.length; // ayraç + ölçü
      if (parcalar.length > 0 && uzunluk + ekle > kullanilabilir) break;
      parcalar.push(olcu);
      uzunluk += ekle;
      i += 1;
      no += 1;
    }
    // Tek ölçü genişlikten uzunsa yine de bir satıra koy (bölme yok — ölçü bütün kalır)
    if (parcalar.length === 0) { parcalar.push(olculer[i]); i += 1; no += 1; }

    satirlar.push({ no: satirNo, metin: parcalar.join('⠀') });
  }
  return satirlar;
}
