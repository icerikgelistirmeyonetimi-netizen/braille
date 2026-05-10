// Karışık yazma kaynak kayıtları.
// Header'daki "karışık yazma" butonu ve /yazma-karisik/:kaynak sayfası bunları kullanır.
//
// Her item: { etiket, ariaAd, hucreler: number[][] }
//   etiket   : ekranda gösterilen kısa yazı/sembol
//   ariaAd   : sesli yönerge için tanım ("be harfi", "soru işareti" vb.)
//   hucreler : sırayla yazılması beklenen braille hücreleri (her biri nokta dizisi)

import {
  HARFLER, RAKAMLAR, NOKTALAMA,
  KELIME_KISALTMALARI, IKI_HARFLI_KISALTMALAR, HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI, KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA_ISARETLERI, OZEL_ISARETLER
} from '../data/braille.js';
import {
  KURAN_HARFLERI, KURAN_HAREKELERI, KURAN_TECVID,
  KURAN_HECELERI, KURAN_KELIMELERI
} from '../data/kuran.js';
import { KURAN_SURELERI } from '../data/kuranSureler.js';
import {
  MATEMATIK_RAKAMLAR, MATEMATIK_SEMBOLLER, GEOMETRI_SEMBOLLERI,
  MATEMATIK_OLCULER, MATEMATIK_IFADELER
} from '../data/matematik.js';
import {
  YUNAN_HARFLERI, FEN_SEMBOLLER,
  KIMYASAL_FORMULLER, FIZIK_FORMULLERI
} from '../data/fen.js';
import { NOTALAR, MUZIK_SEMBOLLERI, MUZIK_DIZILERI } from '../data/muzik.js';

// Yardımcı: hücre dizilerinin geçerli (boş olmayan) olduğundan emin ol
const gecerliHucre = (h) => Array.isArray(h) && h.length > 0;
const gecerliItem = (it) =>
  Array.isArray(it.hucreler) && it.hucreler.length > 0 && it.hucreler.every(gecerliHucre);

const tek = (n) => [n];

// Tüm kayıtları aşağıdaki yapıda topluyoruz:
//   key (route): { yol, baslik, etiketTuru, items }
const KAYNAKLAR = {
  // --- Modül 1 ---
  '/harfler': {
    yol: '/harfler',
    baslik: 'Harf',
    etiketTuru: 'harf',
    items: HARFLER.map((h) => ({
      etiket: h.harf,
      ariaAd: `${h.harf} harfi`,
      hucreler: tek(h.noktalar)
    }))
  },
  '/rakamlar': {
    yol: '/rakamlar',
    baslik: 'Rakam',
    etiketTuru: 'rakam',
    items: RAKAMLAR.map((r) => ({
      etiket: r.rakam,
      ariaAd: `${r.rakam} rakamı`,
      hucreler: tek(r.noktalar)
    }))
  },
  '/noktalama': {
    yol: '/noktalama',
    baslik: 'Noktalama',
    etiketTuru: 'noktalama',
    items: NOKTALAMA.map((n) => ({
      etiket: n.isaret,
      ariaAd: n.isim,
      hucreler: tek(n.noktalar)
    }))
  },
  // --- Modül 3 ---
  '/kisaltma-bir-harfli': {
    yol: '/kisaltma-bir-harfli',
    baslik: 'Bir Harfli Kısaltma',
    etiketTuru: 'kısaltma',
    items: KELIME_KISALTMALARI.map((k) => ({
      etiket: k.harf,
      ariaAd: `${k.harf} kısaltması, ${k.kelime}`,
      hucreler: tek(k.noktalar)
    }))
  },
  '/kisaltma-iki-harfli': {
    yol: '/kisaltma-iki-harfli',
    baslik: 'İki Harfli Kısaltma',
    etiketTuru: 'kısaltma',
    items: IKI_HARFLI_KISALTMALAR.map((k) => ({
      etiket: k.harf,
      ariaAd: `${k.harf} kısaltması, ${k.kelime}`,
      hucreler: [k.sol, k.sag]
    }))
  },
  '/kisaltma-hece': {
    yol: '/kisaltma-hece',
    baslik: 'Hece Kısaltması',
    etiketTuru: 'hece',
    items: HECE_KISALTMALARI.map((h) => ({
      etiket: h.hece,
      ariaAd: `${h.hece} hecesi`,
      hucreler: tek(h.noktalar)
    }))
  },
  '/kisaltma-kelime-koku': {
    yol: '/kisaltma-kelime-koku',
    baslik: 'Kelime Kökü',
    etiketTuru: 'kısaltma',
    items: KELIME_KOKU_KISALTMALARI.map((k) => ({
      etiket: k.etiket,
      ariaAd: `${k.etiket} kısaltması, ${k.kelime}`,
      // Kelime kökü her zaman 5. nokta + sembol harfi/hecesi
      hucreler: [[5], k.sag]
    }))
  },
  '/kisaltma-kelime-parcasi': {
    yol: '/kisaltma-kelime-parcasi',
    baslik: 'Kelime Parçası',
    etiketTuru: 'kısaltma',
    items: KELIME_PARCASI_KISALTMALARI.map((k) => ({
      etiket: k.etiket,
      ariaAd: `${k.etiket} kısaltması`,
      hucreler: [k.sol, k.sag]
    }))
  },
  // --- Modül 4 ---
  '/noktalama-isaretleri': {
    yol: '/noktalama-isaretleri',
    baslik: 'Noktalama İşaretleri',
    etiketTuru: 'noktalama',
    items: NOKTALAMA_ISARETLERI.map((n) => ({
      etiket: n.sembol,
      ariaAd: n.ad,
      hucreler: n.hucreler
    })).filter(gecerliItem)
  },
  '/ozel-isaretler': {
    yol: '/ozel-isaretler',
    baslik: 'Özel İşaretler',
    etiketTuru: 'işaret',
    items: OZEL_ISARETLER.map((n) => ({
      etiket: n.sembol,
      ariaAd: n.ad,
      hucreler: n.hucreler
    })).filter(gecerliItem)
  },
  // --- Modül 5: Kur'an ---
  '/kuran-harfler': {
    yol: '/kuran-harfler',
    baslik: 'Arap Harfleri',
    etiketTuru: 'harf',
    items: KURAN_HARFLERI.map((h) => ({
      etiket: h.harf,
      ariaAd: `${h.ad} harfi`,
      hucreler: tek(h.noktalar)
    }))
  },
  '/kuran-harekeler': {
    yol: '/kuran-harekeler',
    baslik: 'Harekeler',
    etiketTuru: 'hareke',
    items: KURAN_HAREKELERI.map((h) => ({
      etiket: h.isaret || h.ad,
      ariaAd: h.ad,
      hucreler: tek(h.noktalar)
    }))
  },
  '/kuran-tecvid': {
    yol: '/kuran-tecvid',
    baslik: 'Tecvid İşaretleri',
    etiketTuru: 'tecvid',
    items: KURAN_TECVID.map((t) => ({
      etiket: t.sembol || t.ad,
      ariaAd: t.ad,
      hucreler: t.hucreler
    })).filter(gecerliItem)
  },
  // --- Modül 6: Matematik ---
  '/mat-rakamlar': {
    yol: '/mat-rakamlar',
    baslik: 'Matematik Rakamları',
    etiketTuru: 'rakam',
    items: MATEMATIK_RAKAMLAR.map((r) => ({
      etiket: r.rakam,
      ariaAd: r.ad,
      hucreler: r.hucreler
    }))
  },
  '/mat-semboller': {
    yol: '/mat-semboller',
    baslik: 'Matematik Sembolleri',
    etiketTuru: 'sembol',
    items: MATEMATIK_SEMBOLLER.map((s) => ({
      etiket: s.sembol,
      ariaAd: s.ad,
      hucreler: s.hucreler
    })).filter(gecerliItem)
  },
  '/mat-olculer': {
    yol: '/mat-olculer',
    baslik: 'Matematik Ölçüleri',
    etiketTuru: 'ölçü',
    items: MATEMATIK_OLCULER.map((s) => ({
      etiket: s.sembol,
      ariaAd: s.ad,
      hucreler: s.hucreler
    })).filter(gecerliItem)
  },
  '/mat-geometri': {
    yol: '/mat-geometri',
    baslik: 'Geometri Sembolleri',
    etiketTuru: 'sembol',
    items: GEOMETRI_SEMBOLLERI.map((s) => ({
      etiket: s.sembol,
      ariaAd: s.ad,
      hucreler: s.hucreler
    })).filter(gecerliItem)
  },
  // --- Modül 7: Fen ---
  '/fen-yunan': {
    yol: '/fen-yunan',
    baslik: 'Yunan Harfleri',
    etiketTuru: 'harf',
    items: YUNAN_HARFLERI.map((h) => ({
      etiket: h.harf,
      ariaAd: h.ad,
      // Yunan harfleri için Yunan göstergesi (4-5-6) + harf hücresi
      hucreler: [[4, 5, 6], h.noktalar]
    }))
  },
  '/fen-semboller': {
    yol: '/fen-semboller',
    baslik: 'Fen Sembolleri',
    etiketTuru: 'sembol',
    items: FEN_SEMBOLLER.map((s) => ({
      etiket: s.sembol,
      ariaAd: s.ad,
      hucreler: s.hucreler
    })).filter(gecerliItem)
  },
  // --- Modül 8: Müzik ---
  '/muzik-notalar': {
    yol: '/muzik-notalar',
    baslik: 'Notalar',
    etiketTuru: 'nota',
    items: NOTALAR.map((n) => ({
      etiket: n.ad,
      ariaAd: `${n.ad} notası`,
      hucreler: tek(n.noktalar)
    }))
  },
  '/muzik-semboller': {
    yol: '/muzik-semboller',
    baslik: 'Müzik Sembolleri',
    etiketTuru: 'sembol',
    items: MUZIK_SEMBOLLERI.map((s) => ({
      etiket: s.sembol,
      ariaAd: s.ad,
      hucreler: s.hucreler
    })).filter(gecerliItem)
  },

  // --- Hücre Tanıma (harf hücreleri ile) ---
  '/hucre': {
    yol: '/hucre',
    baslik: 'Hücre',
    etiketTuru: 'harf',
    items: HARFLER.map((h) => ({
      etiket: h.harf,
      ariaAd: `${h.harf} harfi`,
      hucreler: tek(h.noktalar)
    }))
  },

  // --- Modül 5: Kur'an okuma sayfaları ---
  '/kuran-heceler': {
    yol: '/kuran-heceler',
    baslik: 'Kur\u2019an Heceleri',
    etiketTuru: 'hece',
    items: KURAN_HECELERI.map((h) => ({
      etiket: h.yazi,
      ariaAd: `${h.okunus} hecesi`,
      hucreler: h.hucreler
    })).filter(gecerliItem)
  },
  '/kuran-kelimeler': {
    yol: '/kuran-kelimeler',
    baslik: 'Kur\u2019an Kelimeleri',
    etiketTuru: 'kelime',
    items: KURAN_KELIMELERI.map((kw) => ({
      etiket: kw.yazi,
      ariaAd: kw.okunus,
      hucreler: kw.hucreler
    })).filter(gecerliItem)
  },
  '/kuran-sureler': {
    yol: '/kuran-sureler',
    baslik: 'Kısa Sureler',
    etiketTuru: 'kelime',
    items: KURAN_SURELERI.flatMap((s) => (s.kelimeler || []).map((kw) => ({
      etiket: kw.yazi,
      ariaAd: `${s.ad} — ${kw.okunus}`,
      hucreler: kw.hucreler
    }))).filter(gecerliItem)
  },

  // --- Modül 6: Matematik okuma ---
  '/mat-ifadeler': {
    yol: '/mat-ifadeler',
    baslik: 'Matematik İfadeleri',
    etiketTuru: 'ifade',
    items: MATEMATIK_IFADELER.map((i) => ({
      etiket: i.yazi,
      ariaAd: i.okunus,
      hucreler: i.hucreler
    })).filter(gecerliItem)
  },

  // --- Modül 7: Fen formülleri ---
  '/fen-kimya': {
    yol: '/fen-kimya',
    baslik: 'Kimyasal Formüller',
    etiketTuru: 'formül',
    items: KIMYASAL_FORMULLER.map((f) => ({
      etiket: f.yazi,
      ariaAd: f.okunus,
      hucreler: f.hucreler
    })).filter(gecerliItem)
  },
  '/fen-fizik': {
    yol: '/fen-fizik',
    baslik: 'Fizik Formülleri',
    etiketTuru: 'formül',
    items: FIZIK_FORMULLERI.map((f) => ({
      etiket: f.yazi,
      ariaAd: f.okunus,
      hucreler: f.hucreler
    })).filter(gecerliItem)
  },

  // --- Modül 8: Müzik dizileri ---
  '/muzik-diziler': {
    yol: '/muzik-diziler',
    baslik: 'Müzik Dizileri',
    etiketTuru: 'dizi',
    items: MUZIK_DIZILERI.map((d) => ({
      etiket: d.yazi,
      ariaAd: d.okunus,
      hucreler: d.hucreler
    })).filter(gecerliItem)
  }
};

// Pathname'e bakarak kaynak anahtarını döner. Bilinmiyorsa null.
export function mevcutSayfaIcinKaynakAnahtar(pathname) {
  if (!pathname) return null;
  // Ham eşleşme yeterli; alt parametreli rotalar yok.
  return KAYNAKLAR[pathname] ? pathname.replace(/^\//, '') : null;
}

// Anahtardan kaynak nesnesini döner. Bilinmiyorsa null.
export function kaynagiAl(anahtar) {
  if (!anahtar) return null;
  const yol = anahtar.startsWith('/') ? anahtar : '/' + anahtar;
  return KAYNAKLAR[yol] || null;
}

// Tüm kayıtların listesi (isteğe bağlı, ileride kullanılabilir)
export function tumKaynaklar() {
  return Object.values(KAYNAKLAR);
}
