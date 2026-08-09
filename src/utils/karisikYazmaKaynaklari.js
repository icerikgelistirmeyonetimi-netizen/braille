// Karışık yazma kaynak kayıtları.
// Header'daki "karışık yazma" butonu ve /yazma-karisik/:kaynak sayfası bunları kullanır.
//
// Her item: { etiket, ariaAd, hucreler: number[][] }
//   etiket   : ekranda gösterilen kısa yazı/sembol
//   ariaAd   : sesli yönerge için tanım ("be harfi", "soru işareti" vb.)
//   hucreler : sırayla yazılması beklenen braille hücreleri (her biri nokta dizisi)

import {
  HARFLER, RAKAMLAR,
  KELIME_KISALTMALARI, IKI_HARFLI_KISALTMALAR, HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI, KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA_ISARETLERI, OZEL_ISARETLER
} from '../data/braille.js';
import {
  KURAN_HAREKELERI, KURAN_TECVID, KURAN_HARFLERI,
  KURAN_HECELERI, KURAN_KELIMELERI, KURAN_KELIMELERI_TEMEL,
  CEZM_SEDDE, TENVINLER, TA_I_MERBUTA, MED_HARFLERI, MUKADDER_MEDLER,
  ELIF_ZAID, DIGER_UZATMA, HEMZELER, HEMZE_VASL
} from '../data/kuran.js';
import { KURAN_SURELERI } from '../data/kuranSureler.js';
import {
  MATEMATIK_RAKAMLAR, MATEMATIK_SEMBOLLER, GEOMETRI_SEMBOLLERI,
  MATEMATIK_OLCULER, MATEMATIK_IFADELER,
  RAKAM_GOSTERGESI, SIRA_SAYISI_RAKAM_NOKTALARI
} from '../data/matematik.js';
import {
  YUNAN_HARFLERI, FEN_SEMBOLLER,
  KIMYASAL_FORMULLER, FIZIK_FORMULLERI
} from '../data/fen.js';
import { NOTALAR, MUZIK_SEMBOLLERI, MUZIK_BOLUMLER } from '../data/muzik.js';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';
import { FRANSIZCA_BOLUMLER } from '../data/fransizcaBraille.js';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';

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
  // '/noktalama' (Modül 1) KALDIRILDI — ders Modül 3'e devredildi
  // ('/noktalama-isaretleri' kaydı aşağıda).
  // --- Modül 3 ---
  '/kisaltma-bir-harfli': {
    yol: '/kisaltma-bir-harfli',
    baslik: 'Bir Harfli Kısaltma',
    etiketTuru: 'kısaltma',
    items: KELIME_KISALTMALARI.map((k) => ({
      etiket: k.harf,
      ariaAd: `${k.kelime} kelimesi kısaltması ${k.harf}`,
      hucreler: tek(k.noktalar)
    }))
  },
  '/kisaltma-iki-harfli': {
    yol: '/kisaltma-iki-harfli',
    baslik: 'İki Harfli Kısaltma',
    etiketTuru: 'kısaltma',
    items: IKI_HARFLI_KISALTMALAR.map((k) => ({
      etiket: k.harf,
      ariaAd: `${k.kelime} kelimesi kısaltması ${k.harf}`,
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
      ariaAd: `${k.kelime} kelimesi kısaltması ${k.etiket}`,
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
      // Basılı karşılığı olmayan biçim işaretlerinde `sembol` yok → etiket ADA düşer.
      etiket: (n.sembol && n.sembol !== '—') ? n.sembol : n.ad,
      ariaAd: n.ad,
      hucreler: n.hucreler
    })).filter(gecerliItem)
  },
  // --- Modül 5: Kur'an ---
  '/kuran-harfler': {
    yol: '/kuran-harfler',
    baslik: "Kur'an-ı Kerim Harfleri",
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
  '/kuran-uzatma': {
    yol: '/kuran-uzatma',
    baslik: 'Durak İşaretleri',
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
  '/kuran-kelimeler-temel': {
    yol: '/kuran-kelimeler-temel',
    baslik: 'Kur\u2019an Kelimeleri (temel)',
    etiketTuru: 'kelime',
    items: KURAN_KELIMELERI_TEMEL.map((kw) => ({
      etiket: kw.yazi,
      ariaAd: kw.okunus,
      hucreler: kw.hucreler
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
  }
  // ⚠ '/muzik-diziler' (Müzik Dizileri) kaydı KALDIRILDI: "Dizi Okuma" dersi tamamen
  // silindi (kullanıcı isteği) → karışık yazma kaynağı da ölü rotaya işaret etmesin.
};

// ───────────────────────────────────────────────────────────────────────────
// İÇ İÇE (parametreli) ROTALAR — programatik kayıt.
// Bu rotalar `/kuran-isaretler/:slug`, `/muzik/:slug`, `/almanca|fransizca|ingilizce/:slug`
// gibi alt-segment taşır. /yazma-karisik/:kaynak tek segment kabul ettiğinden, bu kayıtlar
// EĞİK ÇİZGİSİZ bir `kaynak` anahtarı taşır (segmentler `--` ile birleşir). KAYNAKLAR yine
// pathname ile anahtarlanır; `kaynak` alanı navigasyonda kullanılır.
// ───────────────────────────────────────────────────────────────────────────

// Hücre dizisini normalize et: flat ([2,5]) veya nested ([[2,5]]) gelebilir.
const hucreNorm = (h) => {
  if (!Array.isArray(h) || h.length === 0) return [];
  return Array.isArray(h[0]) ? h : [h];
};
// Bölüm verisi (ad/sembol/hucreler) → yazma item'i
const bolumItem = (it) => ({
  etiket: it.sembol || it.ad || it.harf || it.yazi || '',
  ariaAd: it.ad || it.okunus || it.sembol || '',
  hucreler: hucreNorm(it.hucreler || it.noktalar),
});

// İç içe rota kaydı ekle (kaynak = pathname'in /'leri '--' ile değişmiş hali).
const iceKayit = (yol, baslik, etiketTuru, items) => {
  const temiz = (items || []).filter(gecerliItem);
  if (temiz.length === 0) return; // yazılabilir öğesi yoksa ekleme (buton görünmesin)
  KAYNAKLAR[yol] = {
    yol,
    kaynak: yol.replace(/^\//, '').replace(/\//g, '--'),
    baslik,
    etiketTuru,
    items: temiz,
  };
};

// Modül 5 — Kur'an işaretleri (/kuran-isaretler/:slug)
const KURAN_ISARET_KAYNAKLARI = {
  'cezm-sedde': { veri: CEZM_SEDDE, baslik: 'Cezim ve Şedde' },
  'tenvinler': { veri: TENVINLER, baslik: 'Tenvinler' },
  'ta-i-merbuta': { veri: TA_I_MERBUTA, baslik: 'Ta-i Merbûta' },
  'med-harfleri': { veri: MED_HARFLERI, baslik: 'Med (Uzatma) Harfleri' },
  'mukadder-medler': { veri: MUKADDER_MEDLER, baslik: 'Mukadder Medler' },
  'elif-zaid': { veri: ELIF_ZAID, baslik: 'Elif-i Zaid' },
  'diger-uzatma': { veri: DIGER_UZATMA, baslik: 'Diğer Uzatma İşaretleri' },
  'hemzeler': { veri: HEMZELER, baslik: 'Hemzeler' },
  'hemze-vasl': { veri: HEMZE_VASL, baslik: 'Hemze-i Vasl ve Kat' },
};
Object.entries(KURAN_ISARET_KAYNAKLARI).forEach(([slug, { veri, baslik }]) => {
  iceKayit(`/kuran-isaretler/${slug}`, baslik, 'işaret', (veri || []).map(bolumItem));
});

// Modül 6 — Sıra sayıları (/mat-sira-sayilari)
const SIRALI_AD = {
  '1': 'birinci', '2': 'ikinci', '3': 'üçüncü', '4': 'dördüncü', '5': 'beşinci',
  '6': 'altıncı', '7': 'yedinci', '8': 'sekizinci', '9': 'dokuzuncu',
};
iceKayit(
  '/mat-sira-sayilari', 'Sıra Sayıları', 'rakam',
  ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => ({
    etiket: `${d}.`,
    ariaAd: `${SIRALI_AD[d]} sıra sayısı`,
    hucreler: [RAKAM_GOSTERGESI, SIRA_SAYISI_RAKAM_NOKTALARI[d] || []],
  }))
);

// Modül 8 — Müzik grup dersleri (/muzik/:slug)
MUZIK_BOLUMLER.forEach((b) => {
  iceKayit(`/muzik/${b.slug}`, b.kisaBaslik, 'müzik', (b.veri || []).map(bolumItem));
});

// Modül 9 — Yabancı dil dersleri (/ingilizce|almanca|fransizca/:slug)
const dilKaynaklariEkle = (bolumler, dilYol, dilAd, etiketTuru) => {
  bolumler.forEach((b) => {
    iceKayit(`/${dilYol}/${b.slug}`, `${dilAd} · ${b.kisaBaslik}`, etiketTuru, (b.veri || []).map(bolumItem));
  });
};
dilKaynaklariEkle(INGILIZCE_BOLUMLER, 'ingilizce', 'İngilizce', 'harf');
dilKaynaklariEkle(ALMANCA_BOLUMLER, 'almanca', 'Almanca', 'harf');
dilKaynaklariEkle(FRANSIZCA_BOLUMLER, 'fransizca', 'Fransızca', 'harf');

// Bir kaydın eğik-çizgisiz kaynak anahtarı (varsa kaynak alanı, yoksa yol'dan üretilir).
const kayitAnahtari = (yolKey, entry) => entry.kaynak || yolKey.replace(/^\//, '');

// Pathname'e bakarak kaynak anahtarını döner. Yazılabilir öğesi yoksa veya tanımsızsa null.
export function mevcutSayfaIcinKaynakAnahtar(pathname) {
  if (!pathname) return null;
  const entry = KAYNAKLAR[pathname];
  if (!entry || !entry.items || entry.items.length === 0) return null;
  return kayitAnahtari(pathname, entry);
}

// Anahtardan kaynak nesnesini döner. Bilinmiyorsa null. (Hem düz '/harfler' hem iç içe
// 'muzik--notalar' biçimini çözer.)
export function kaynagiAl(anahtar) {
  if (!anahtar) return null;
  // Düz rota: doğrudan eşleşme
  const yol = anahtar.startsWith('/') ? anahtar : '/' + anahtar;
  if (KAYNAKLAR[yol]) return KAYNAKLAR[yol];
  // İç içe rota: kaynak alanına göre ara
  for (const key in KAYNAKLAR) {
    if (kayitAnahtari(key, KAYNAKLAR[key]) === anahtar) return KAYNAKLAR[key];
  }
  return null;
}

// Tüm kayıtların listesi (isteğe bağlı, ileride kullanılabilir)
export function tumKaynaklar() {
  return Object.values(KAYNAKLAR);
}
