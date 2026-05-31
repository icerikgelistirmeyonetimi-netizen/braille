import React, { useEffect } from 'react';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import { brailleKategoriAl } from '../../utils/music-brf/brailleLegendRegistry.js';
import { MUZIK_SUSLEMELER, MUZIK_DINAMIKLER, MUZIK_HAIRPIN, MUZIK_NUANS_ONCE, MUZIK_NUANS_SONRA } from '../../data/muzik.js';

// Her süsleme için "ne anlama gelir" + "ses ne yapar" açıklaması.
// { anlam: kısa tanım, ses: çalındığında nasıl duyulur }
const SUSLEME_BILGI = {
  'kısa appoggiatura': {
    anlam: 'Asıl notadan hemen önce çalınan, çok kısa süreli yan (basamak) notadır; saplı ve çapraz çizgilidir.',
    ses: 'Asıl notanın hemen başında çok hızlı, “çarpma” gibi duyulan kısa bir ön nota çalınır; süresini asıl notadan neredeyse hiç çalmaz.',
  },
  'uzun appoggiatura': {
    anlam: 'Asıl notadan önce çalınan, süresi asıl notanın bir kısmını alan uzun yan notadır (çapraz çizgisiz).',
    ses: 'Ön nota belirgin biçimde tutulur ve asıl notanın süresinin (genelde yarısının) yerine geçer; vurgulu ve şarkı söyler gibi duyulur.',
  },
  trill: {
    anlam: 'Asıl nota ile bir üstündeki nota arasında hızlı gidip gelmedir.',
    ses: 'İki komşu nota çok hızlı sırayla tekrar tekrar çalınarak titreşen, “tril” eden bir efekt oluşturur.',
  },
  'bemollü trill': {
    anlam: 'Üstteki yardımcı notası bemol ile pesleştirilmiş trill.',
    ses: 'Trill titreşimi yapılır ama üst nota yarım ses pes (bemol) duyulur.',
  },
  'diyezli trill': {
    anlam: 'Üstteki yardımcı notası diyez ile tizleştirilmiş trill.',
    ses: 'Trill titreşimi yapılır ama üst nota yarım ses tiz (diyez) duyulur.',
  },
  'turn (notalar arası)': {
    anlam: 'Üst komşu – asıl – alt komşu – asıl nota sırasıyla dönen bir figürdür.',
    ses: 'Asıl notanın çevresinde yukarı–aşağı dolanan, dört notalık akıcı ve yuvarlak bir süsleme duyulur.',
  },
  'turn (nota üstünde)': {
    anlam: 'Turn figürü, tam notanın üstüne yazıldığında o nota üzerinde uygulanır.',
    ses: 'Notanın tam üzerinde üst–asıl–alt–asıl dönüşü çalınır; nota başlamadan değil, notanın üstünde duyulur.',
  },
  'ters turn (notalar arası)': {
    anlam: 'Turn’ün tersi: alt komşu – asıl – üst komşu – asıl sırasıyla döner.',
    ses: 'Önce aşağı sonra yukarı dolanan, dört notalık ters yönlü akıcı bir süsleme duyulur.',
  },
  'ters turn (nota üstünde)': {
    anlam: 'Ters turn figürü, tam notanın üstüne yazıldığında uygulanır.',
    ses: 'Notanın üzerinde alt–asıl–üst–asıl dönüşü çalınır.',
  },
  'üst mordent': {
    anlam: 'Asıl – üst komşu – asıl notanın hızlıca çalınmasıdır (tek salınım).',
    ses: 'Notaya basıldığı an bir üst notaya hızlı bir “kıvrım” yapılıp asıl notaya dönülür; kısa bir titreşim hissi verir.',
  },
  'uzun üst mordent': {
    anlam: 'Üst mordentin birden çok salınım yapan, daha uzun biçimi.',
    ses: 'Asıl ve üst nota arasında art arda birkaç hızlı gidiş-geliş yapılır.',
  },
  'alt mordent': {
    anlam: 'Asıl – alt komşu – asıl notanın hızlıca çalınmasıdır (tek salınım).',
    ses: 'Notaya basıldığı an bir alt notaya hızlı bir “kıvrım” yapılıp asıl notaya dönülür.',
  },
  'uzun alt mordent': {
    anlam: 'Alt mordentin birden çok salınım yapan, daha uzun biçimi.',
    ses: 'Asıl ve alt nota arasında art arda birkaç hızlı gidiş-geliş yapılır.',
  },
  glissando: {
    anlam: 'İki nota arasında, aradaki tüm sesler üzerinden kayarak geçiştir.',
    ses: 'Bir notadan diğerine doğru kesintisiz “kayan” bir geçiş duyulur (örn. piyano tuşları üzerinde süzülme).',
  },
};

// Tıklanan süslemenin (trill / turn / mordent …) kendi açıklama + kurallarından
// panel içeriği üretir. Legend tek renkken, ayrıntı burada gösterilir.
function suslemeKuralBilgisiAl(anlam = {}) {
  const ara = String(anlam?.etiket || anlam?.ad || anlam?.baslik || '').toLowerCase().trim();
  if (!ara) return null;
  const kayit = (Array.isArray(MUZIK_SUSLEMELER) ? MUZIK_SUSLEMELER : [])
    .find((o) => String(o.ad || '').toLowerCase() === ara);
  if (!kayit) return null;

  const bilgi = SUSLEME_BILGI[ara] || null;
  const kurallar = [];
  if (bilgi?.anlam) {
    kurallar.push({ baslik: 'Ne anlama gelir?', icerik: bilgi.anlam });
  } else if (kayit.aciklama) {
    kurallar.push({ baslik: 'Açıklama', icerik: kayit.aciklama });
  }
  if (bilgi?.ses) {
    kurallar.push({ baslik: 'Ses ne yapar?', icerik: bilgi.ses });
  }
  if (bilgi?.anlam && kayit.aciklama) {
    kurallar.push({ baslik: 'Kısa tanım', icerik: kayit.aciklama });
  }
  (Array.isArray(kayit.kurallar) ? kayit.kurallar : []).forEach((k, i) => {
    kurallar.push({ baslik: `Kural ${i + 1}`, icerik: k });
  });
  if (kurallar.length === 0) {
    kurallar.push({ baslik: 'Süsleme', icerik: 'Bu bir süsleme (ornament) işaretidir.' });
  }

  return { baslik: kayit.ad, renk: 'violet', kurallar };
}

// Her dinamik / ifade işareti için "ne anlama gelir" + "ses ne yapar" açıklaması.
// Anahtar: kaydın 'ad' alanı küçük harfe çevrilmiş hali.
const DINAMIK_BILGI = {
  'pp (pianissimo)': {
    anlam: 'Çok hafif çalın anlamına gelen dinamik işaret (pianissimo).',
    ses: 'Notalar çok kısık, neredeyse fısıltı gibi yumuşak bir ses düzeyinde duyulur.',
  },
  'p (piano)': {
    anlam: 'Hafif çalın anlamına gelen dinamik işaret (piano).',
    ses: 'Notalar yumuşak ve kısık bir ses düzeyinde duyulur.',
  },
  'mp (mezzo piano)': {
    anlam: 'Orta hafiflikte çalın (mezzo piano); piano ile mezzo forte arasıdır.',
    ses: 'Hafifin biraz üstünde, orta-yumuşak bir ses düzeyi duyulur.',
  },
  'mf (mezzo forte)': {
    anlam: 'Orta kuvvette çalın (mezzo forte); piano ile forte arasıdır.',
    ses: 'Ne çok kısık ne çok yüksek; dengeli, orta-kuvvetli bir ses düzeyi duyulur.',
  },
  'f (forte)': {
    anlam: 'Kuvvetli/yüksek çalın anlamına gelen dinamik işaret (forte).',
    ses: 'Notalar gür, dolgun ve yüksek bir ses düzeyinde duyulur.',
  },
  'ff (fortissimo)': {
    anlam: 'Çok kuvvetli çalın anlamına gelen dinamik işaret (fortissimo).',
    ses: 'Notalar çok gür ve güçlü, mümkün olan en yüksek seslerden biriyle duyulur.',
  },
  'sf (sforzando)': {
    anlam: 'Tek bir notaya/akora ani ve sert vurgu (sforzando).',
    ses: 'İlgili nota aniden, keskin bir aksanla öne çıkartılarak çalınır.',
  },
  'cresc. (crescendo)': {
    anlam: 'Giderek kuvvetlenerek çalın (crescendo); ses düzeyi kademeli artar.',
    ses: 'Pasaj boyunca ses giderek yükselir, sönükten güre doğru büyür.',
  },
  'decresc. (decrescendo)': {
    anlam: 'Giderek hafifleyerek çalın (decrescendo); ses düzeyi kademeli azalır.',
    ses: 'Pasaj boyunca ses giderek kısılır, gürden sönüğe doğru küçülür.',
  },
  'dim. (diminuendo)': {
    anlam: 'Giderek azaltın (diminuendo); decrescendo ile eş anlamlıdır.',
    ses: 'Ses düzeyi yavaş yavaş düşer, notalar gittikçe yumuşar.',
  },
  'rit. (ritardando)': {
    anlam: 'Giderek yavaşlatın (ritardando); bu bir tempo işaretidir.',
    ses: 'Tempo kademeli olarak düşer; notalar gitgide daha uzun aralıklarla duyulur.',
  },
  'hairpin crescendo': {
    anlam: 'Genişleyen iki çizgiyle gösterilen crescendo (kıl/hairpin).',
    ses: 'Çizgilerin kapsadığı notalarda ses giderek yükselir.',
  },
  'hairpin decrescendo': {
    anlam: 'Daralan iki çizgiyle gösterilen decrescendo (kıl/hairpin).',
    ses: 'Çizgilerin kapsadığı notalarda ses giderek kısılır.',
  },
};

// Tıklanan dinamiğin (p/f/mf/cresc…) kendi açıklama + kurallarından panel içeriği üretir.
function dinamikKuralBilgisiAl(anlam = {}) {
  const ara = String(anlam?.etiket || anlam?.ad || anlam?.baslik || '').toLowerCase().trim();
  if (!ara) return null;
  const havuz = [...(Array.isArray(MUZIK_DINAMIKLER) ? MUZIK_DINAMIKLER : []),
                 ...(Array.isArray(MUZIK_HAIRPIN) ? MUZIK_HAIRPIN : [])];
  // Önce ad, sonra sembol (pp, mf…) ile eşle.
  const kayit = havuz.find((o) => String(o.ad || '').toLowerCase() === ara)
    || havuz.find((o) => String(o.sembol || '').toLowerCase() === ara);
  if (!kayit) return null;

  const bilgi = DINAMIK_BILGI[String(kayit.ad || '').toLowerCase()] || null;
  const kurallar = [];
  if (bilgi?.anlam) {
    kurallar.push({ baslik: 'Ne anlama gelir?', icerik: bilgi.anlam });
  } else if (kayit.aciklama) {
    kurallar.push({ baslik: 'Açıklama', icerik: kayit.aciklama });
  }
  if (bilgi?.ses) {
    kurallar.push({ baslik: 'Ses ne yapar?', icerik: bilgi.ses });
  }
  // Braille yazım kuralı: dinamikler söz işareti (nokta 3-4-5) ile yazılır.
  kurallar.push({
    baslik: 'Braille\'de Yazım',
    icerik: 'Dinamik/ifade işaretleri Braille\'de söz işareti (nokta 3-4-5) ile başlar ve harf harf yazılır. İşaretin ardından gelen ilk nota mutlaka oktav işareti alır.',
  });
  (Array.isArray(kayit.kurallar) ? kayit.kurallar : []).forEach((k, i) => {
    kurallar.push({ baslik: `Kural ${i + 1}`, icerik: k });
  });
  if (kurallar.length === 0) {
    kurallar.push({ baslik: 'Dinamik', icerik: 'Bu bir dinamik/ifade işaretidir.' });
  }

  return { baslik: kayit.ad, renk: 'purple', kurallar };
}

// ─── Nüans (artikülasyon) bilgisi ─────────────────────────────────────────────
const NUANS_ONCE_ADLARI_SET = new Set(
  (Array.isArray(MUZIK_NUANS_ONCE) ? MUZIK_NUANS_ONCE : []).map((o) => String(o.ad || '').toLowerCase()),
);

const NUANS_BILGI = {
  'staccato': {
    anlam: 'Notayı yazılı değerinden daha kısa çal; notalar kesik ve ayrı duyulmalı.',
    ses: 'Her nota belirgin biçimde kısaltılarak çalınır; notalar arasında küçük bir sessizlik kalır.',
  },
  'staccatissimo': {
    anlam: "Staccato'dan da kısa; olabildiğince kısa ve sivri bir saldırıyla çal.",
    ses: 'Notalar son derece kısa, keskin ve parlak bir "tık" sesi gibi duyulur.',
  },
  'mezzo-staccato': {
    anlam: 'Portato olarak da bilinir; staccato ile tenuto arasında, yarı kısaltılmış.',
    ses: 'Notalar biraz kısaltılır ama tam staccato kadar kesik değil; hafif bir "bırakma" hissiyle duyulur.',
  },
  'tenuto (agogic accent)': {
    anlam: 'Notayı tam yazılı değerinde tut; hafif vurguyla legato çal.',
    ses: 'Nota tam süresini alır ve bir sonrakine yumuşakça bağlanır; hafif bir ağırlıkla vurgulanır.',
  },
  'accent': {
    anlam: 'Notayı daha kuvvetli ve belirgin biçimde vurgula.',
    ses: 'Nota güçlü, belirgin bir saldırıyla başlar; çevresindeki notalardan daha öne çıkar.',
  },
  'expressive accent': {
    anlam: 'Müzikal ifade ağırlıklı, nüanslı bir vurgu; dinamik değil, ton renklendirilmesi.',
    ses: 'Nota biraz öne çıkarılır ama kaba değil; melankolik ya da lirik bir ton değişimi duyulur.',
  },
  'reversed accent': {
    anlam: 'Ters vurgu; notanın zayıftan güçlüye doğru şişen hareketi.',
    ses: "Nota sessizce başlayıp hafifçe büyür; normal aksanın tersi bir hareket hissedilir.",
  },
  'martellato': {
    anlam: 'Çekiç gibi sert, üstüne basan bir vurgu.',
    ses: 'Nota son derece kuvvetli ve sert bir saldırıyla duyulur; çekiç darbesini andıran keskin bir "tok" sesi.',
  },
  'staccato accent': {
    anlam: 'Hem staccato (kısa) hem de vurgulu; kesik ve belirgin.',
    ses: 'Nota hem kısa kesilerek hem de güçlü bir saldırıyla çalınır.',
  },
  'swell (<>)': {
    anlam: 'Notanın ortasında önce güçlenen, sonra azalan küçük bir şişkinlik.',
    ses: 'Tek bir nota üzerinde hafif bir güçlenme-zayıflama dalgası hissedilir (piyano sınırları içinde).',
  },
  'fermata (durak)': {
    anlam: 'Notayı normal değerinin ötesinde uzat; uzunluğu icracı belirler.',
    ses: 'Nota, genellikle değerinin 1,5–2 katı kadar tutulur; zamanın askıya alındığı hissi yaratır.',
  },
  'notalar arası fermata': {
    anlam: 'İki nota arasına yerleştirilen fermata; sessizliği uzatır.',
    ses: 'Notalar arasında küçük ama belirgin bir durak yaratır; nefes noktası gibi duyulur.',
  },
  'ölçü çizgisi üstü fermata': {
    anlam: 'Ölçü çizgisinin üstüne yazılan fermata; ölçü sonu durak.',
    ses: 'Ölçünün bitiminde zaman uzatılır; sonraki ölçüye geçişte belirgin bir soluk alınır.',
  },
  'kare fermata': {
    anlam: 'Kare şekilli fermata; uzun ve kesin bir tutuş.',
    ses: "Normal fermatadan daha uzun tutulur; katı ve net bir duruş hissi verir.",
  },
  'üçgen fermata': {
    anlam: 'Üçgen (çadır) şekilli fermata; kısa bir durak.',
    ses: 'Fermata türleri arasında en kısası; hafif bir nefes molası gibi duyulur.',
  },
  'nefes işareti': {
    anlam: 'Küçük virgül şeklinde işaret; kısa bir nefes alınacağını gösterir, ritmi bozmaz.',
    ses: 'Notanın hemen ardından kısa bir sessizlik eklenir; tempo değişmez, yalnızca küçük bir "soluk" boşluğu duyulur.',
  },
  'caesura (break / //)': {
    anlam: 'Çift çizgi ya da // ile gösterilir; nefes işaretinden daha belirgin bir mola.',
    ses: 'Notadan sonra daha uzun bir sessizlik eklenir; ritim kesintiye uğrar ve icracı zaman kazanır.',
  },
};

function nuansKuralBilgisiAl(anlam = {}) {
  const ara = String(anlam?.etiket || anlam?.ad || anlam?.baslik || '').toLowerCase().trim();
  if (!ara) return null;
  const havuz = [
    ...(Array.isArray(MUZIK_NUANS_ONCE)  ? MUZIK_NUANS_ONCE  : []),
    ...(Array.isArray(MUZIK_NUANS_SONRA) ? MUZIK_NUANS_SONRA : []),
  ];
  const kayit = havuz.find((o) => String(o.ad || '').toLowerCase() === ara);
  if (!kayit) return null;

  const bilgi = NUANS_BILGI[ara] || null;
  const yon = NUANS_ONCE_ADLARI_SET.has(ara) ? 'önce' : 'sonra';
  const kurallar = [];
  if (bilgi?.anlam) {
    kurallar.push({ baslik: 'Ne anlama gelir?', icerik: bilgi.anlam });
  } else if (kayit.aciklama) {
    kurallar.push({ baslik: 'Açıklama', icerik: kayit.aciklama });
  }
  if (bilgi?.ses) {
    kurallar.push({ baslik: 'Ses ne yapar?', icerik: bilgi.ses });
  }
  (Array.isArray(kayit.kurallar) ? kayit.kurallar : []).forEach((k, i) => {
    kurallar.push({ baslik: `Kural ${i + 1}`, icerik: k });
  });
  if (kurallar.length === 0) {
    kurallar.push({ baslik: 'Nüans', icerik: 'Bu bir nüans (artikülasyon) işaretidir.' });
  }
  return { baslik: `${kayit.ad} (nüans ${yon})`, renk: 'amber', kurallar };
}

// ─── Süre indeksi → Türkçe ad ────────────────────────────────────────────────
const SURE_ADLARI = ['sekizlik', 'dörtlük', 'yarım', 'tam', "on altılık", "otuz ikili", "altmış dörtlük"];

// ─── Kural veri tabanı (Türkçe, kapsamlı) ────────────────────────────────────
const KURAL_DB = {
  nota: {
    baslik: 'Nota',
    renk: 'emerald',
    kurallar: [
      {
        baslik: 'Perde ve Süre Bir Arada',
        icerik:
          'Her Braille nota hücresi hem perdeyi (hangi nota olduğunu) hem de süreyi (ne kadar süreceğini) aynı anda kodlar. Nokta 1-2-4-5 kombinasyonu perdeyi, nokta 3 ve 6 ise süreyi belirler. Sekizlik için ek nokta gerekmez; dörtlük için nokta 6; yarım için nokta 3; tam nota için nokta 3 ve 6 birlikte eklenir.',
      },
      {
        baslik: 'İkili Anlam (Dual Meaning)',
        icerik:
          'Braille müzikte her süre sembolü iki farklı değeri temsil edebilir: tam nota aynı zamanda on altılık notadır; yarım nota otuz ikili notadır; dörtlük altmış dörtlük notadır; sekizlik ise yüz yirmi sekizlik notadır. Hangi değerin geçerli olduğunu zaman imzası ve ölçüdeki toplam vuruş sayısı belirler.',
      },
      {
        baslik: 'Oktav İşareti: Ne Zaman?',
        icerik:
          'Parçanın ilk notası ve her yeni Braille satırının ilk notası her zaman oktav işareti alır. Bir önceki notaya olan aralık ikinci veya üçüncü ise oktav işareti gerekmez. Dördüncü veya beşinci aralıkta yalnızca oktav değiştiğinde gerekir. Altıncı, yedinci veya oktav aralığında ise her zaman zorunludur.',
      },
      {
        baslik: 'Oktav İşaretinin Sırası',
        icerik:
          'Nota aksidental de alıyorsa sıralama şu şekildedir: önce aksidental (♯ / ♭ / ♮), ardından oktav işareti, ardından nota. Oktav işareti ile nota arasına hiçbir başka sembol giremez.',
      },
      {
        baslik: 'Tekrar ve Volta Sonrası',
        icerik:
          'Tekrar başı, tekrar sonu ve volta işaretlerinin hemen ardından gelen ilk nota, aralıktan bağımsız olarak mutlaka oktav işareti almalıdır.',
      },
    ],
  },

  sus: {
    baslik: 'Sus',
    renk: 'slate',
    kurallar: [
      {
        baslik: 'Sus Değerleri',
        icerik:
          'Her nota değerinin karşılık gelen bir sus sembolü vardır. Tam sus: nokta 1-3-4; yarım sus: nokta 1-3-6; dörtlük sus: nokta 1-2-3-6; sekizlik sus: nokta 1-3-4-6; on altılık sus: tam nota sembolüyle aynı hücre kodunu paylaşır; değeri zaman imzasına göre belirlenir.',
      },
      {
        baslik: 'Noktalı Sus',
        icerik:
          'Bir susun süresi nokta ile uzatılabilir. Braille\'de noktalı sus, sus hücresinin hemen ardına nokta 3 eklenerek yazılır; bu kural noktalı notalarla birebir aynıdır.',
      },
      {
        baslik: 'Oktav İşareti Almaz',
        icerik:
          'Susların perdesi yoktur; dolayısıyla oktav işareti almazlar. Yeni bir Braille satırının başında bile sus varsa oktav işareti o susa değil, arkasından gelen ilk notaya uygulanır.',
      },
      {
        baslik: 'Dinamik İşareti Alamaz',
        icerik:
          'Suslar dinamik (forte, piano, mezzo forte vb.) işaretleri alamaz; çünkü suslar sessizlik anlamına gelir, dolayısıyla bir ses düzeyi yoktur. Ancak tempo işaretleri (allegro, adagio, rit. vb.) suslardan önce gelebilir.',
      },
    ],
  },

  oktav: {
    baslik: 'Oktav İşareti',
    renk: 'violet',
    kurallar: [
      {
        baslik: 'Zorunlu Kullanım',
        icerik:
          'Parçanın ilk notası ve her yeni Braille satırının ilk notası mutlaka oktav işareti alır. Tekrar başı, tekrar sonu ve volta işaretlerinin ardından gelen ilk nota da oktav işareti almalıdır.',
      },
      {
        baslik: 'Aralık Kuralı',
        icerik:
          'İkinci veya üçüncü aralık: asla oktav işareti gerekmez. Dördüncü veya beşinci aralık: yalnızca oktav değiştiğinde gerekir. Altıncı, yedinci veya oktav aralığı: her durumda oktav işareti zorunludur.',
      },
      {
        baslik: 'Aralığı Nasıl Sayarız?',
        icerik:
          'İki nota arasındaki aralığı hesaplamak için bulunduğunuz notadan başlayarak çizgi ve aralıkları sayın; başlangıç notasını "1" olarak kabul edin. Örneğin Do\'dan Sol\'a: Do(1)–Re(2)–Mi(3)–Fa(4)–Sol(5) → beşinci aralık.',
      },
      {
        baslik: 'Yerleşim Kuralı',
        icerik:
          'Oktav işareti ile bağlı olduğu nota arasına hiçbir sembol giremez. Aksidental varsa sıra şöyle olur: aksidental → oktav işareti → nota.',
      },
    ],
  },

  barline: {
    baslik: 'Ölçü Çizgisi',
    renk: 'zinc',
    kurallar: [
      {
        baslik: 'Braille\'de Gösterim',
        icerik:
          'Baskı notasında dikine çizgi olan ölçü çizgisi, Braille\'de tek boş hücre (boşluk) ile temsil edilir. Ölçüler bu boşlukla birbirinden ayrılır.',
      },
      {
        baslik: 'Ölçü Numaralandırma',
        icerik:
          'Enstrüman müziğinde ölçüler mutlaka numaralandırılır; baskı notasında numara yoksa bile Braille\'de eklenir. Numaralar Braille satırının birinci hücresine sayı işareti olmadan yazılır. Anakrüz (arsis/upbeat), sıfırıncı ölçü (0) olarak numaralandırılır.',
      },
    ],
  },

  finalBarline: {
    baslik: 'Bitiş Çizgisi',
    renk: 'zinc',
    kurallar: [
      {
        baslik: 'Parça Sonu',
        icerik:
          'Parçanın veya bölümün bitişini gösteren çift çizgidir. Ölçünün bir parçası sayıldığından, işaret ile ölçüdeki son nota arasında boşluk bırakılmaz.',
      },
    ],
  },

  sectionalBarline: {
    baslik: 'Bölüm Çizgisi',
    renk: 'zinc',
    kurallar: [
      {
        baslik: 'Büyük Bölüm Bitişi',
        icerik:
          'Bir büyük bölümün bitişini gösteren çift çizgidir. Ölçünün parçası sayılır; işaret ile bağlı olduğu ölçü arasında boşluk bırakılmaz.',
      },
    ],
  },

  beginRepeat: {
    baslik: 'Tekrar Başlangıcı',
    renk: 'amber',
    kurallar: [
      {
        baslik: 'Braille Sembolü',
        icerik:
          'Tekrar başlangıcı işareti iki hücreyle yazılır: önce nokta 1-2-6, ardından nokta 2-3-5-6. Bu Braille metni "<7" biçiminde gösterilir.',
      },
      {
        baslik: 'Konumu',
        icerik:
          'Tekrar işareti ölçünün bir parçasıdır; dolayısıyla işaret ile bağlı olduğu ölçü arasında boşluk bırakılmaz. Tekrar işaretinin ardından ise bir boşluk bırakılır.',
      },
      {
        baslik: 'Zorunlu Oktav',
        icerik:
          'Tekrar başlangıcı işaretinin hemen ardından gelen ilk nota, aralıktan bağımsız olarak mutlaka oktav işareti almalıdır.',
      },
      {
        baslik: 'Artikülasyon Sıralaması',
        icerik:
          'Staccato, aksan ve arpej gibi artikülasyonlar etkilenen notadan önce yazılır; bu işaretlerin ardından gelen nota oktav işareti almaz. Dört veya daha fazla ardışık nota aynı artikülasyona sahipse işaret çiftlenebilir (doubling). Sıralama: arpej → staccato/staccatissimo → aksan → tenuto.',
      },
    ],
  },

  endRepeat: {
    baslik: 'Tekrar Sonu',
    renk: 'amber',
    kurallar: [
      {
        baslik: 'Braille Sembolü',
        icerik:
          'Tekrar sonu işareti iki hücreyle yazılır: önce nokta 1-2-6, ardından nokta 2-3. Bu Braille metni "<2" biçiminde gösterilir.',
      },
      {
        baslik: 'Konumu',
        icerik:
          'Tekrar işareti ölçünün bir parçasıdır; işaret ile bağlı olduğu ölçü arasında boşluk bırakılmaz. Tekrar işaretinin ardından boşluk bırakılır.',
      },
      {
        baslik: 'Zorunlu Oktav',
        icerik:
          'Tekrar sonu işaretinin ardından gelen ilk nota, aralıktan bağımsız olarak mutlaka oktav işareti almalıdır.',
      },
    ],
  },

  barRepeat: {
    baslik: 'Ölçü Tekrarı',
    renk: 'amber',
    kurallar: [
      {
        baslik: 'Anlamı',
        icerik:
          'Ölçü tekrarı işareti, bir önceki ölçünün birebir aynısının çalınacağını gösterir. Notalar yeniden yazılmaz; tek bir işaretle önceki ölçü tekrarlanır. Bu, aynı ölçünün defalarca yazılmasını önleyerek yer kazandırır.',
      },
      {
        baslik: 'Braille\'de Gösterim',
        icerik:
          'Tekrarlanacak ölçünün yerine, o ölçüyü dolduran tek bir tekrar hücresi yazılır. İşaret kendi ölçüsünün tamamını temsil eder; bu nedenle başka nota veya sus eklenmez.',
      },
      {
        baslik: 'Konumu',
        icerik:
          'Ölçü tekrarı, tekrarlanan ölçünün bulunduğu yere, diğer ölçüler gibi boşlukla ayrılarak yazılır. Birden fazla ardışık ölçü aynıysa her biri için ayrı tekrar işareti kullanılır.',
      },
    ],
  },

  volta1: {
    baslik: '1. Ev (Volta)',
    renk: 'sky',
    kurallar: [
      {
        baslik: 'Yazım',
        icerik:
          'Volta, ölçünün başına küçük bir alt rakam olarak yazılır. Birinci ev için sayı işareti ardından "1" (#1), ikinci ev için sayı işareti ardından "2" (#2) kullanılır.',
      },
      {
        baslik: 'Boşluk Bırakılmaz',
        icerik:
          'Volta numarası ile bağlı olduğu ölçü arasında boşluk bırakılmaz. Volta ölçünün doğrudan bir parçası gibi davranır.',
      },
      {
        baslik: 'Zorunlu Oktav',
        icerik:
          'Volta işaretinin hemen ardından gelen ilk nota, önceki notayla olan aralıktan bağımsız olarak mutlaka oktav işareti almalıdır.',
      },
      {
        baslik: 'Nokta 3 Ayırıcı',
        icerik:
          'Volta numarasından hemen sonra gelen hücre nokta 1, 2 veya 3 içeriyorsa volta numarasının ardından nokta 3 ayırıcı eklenir. Örneğin volta numarasının arkasından diyez geliyorsa araya nokta 3 konulur.',
      },
      {
        baslik: 'Köşeli Parantez Yazılmaz',
        icerik:
          'Baskı notasında voltanın üstündeki köşeli parantez Braille\'de gösterilmez. Aynı şekilde baskıdaki nokta, virgül gibi noktalama işaretleri de Braille\'e aktarılmaz.',
      },
      {
        baslik: 'Birden Fazla Numara',
        icerik:
          'Bir voltada birden fazla numara (ör. "1-3") varsa her rakam ayrı sayı işareti alır. Tire (nokta 3-6) sonrasında gelen rakam ise sayı işareti almaz; numaralar arasında boşluk bırakılmaz.',
      },
    ],
  },

  volta2: {
    baslik: '2. Ev (Volta)',
    renk: 'sky',
    kurallar: [
      {
        baslik: 'Yazım',
        icerik:
          'İkinci ev için sayı işareti ardından "2" (#2) kullanılır. Volta numarası ile bağlı olduğu ölçü arasında boşluk bırakılmaz.',
      },
      {
        baslik: 'Zorunlu Oktav',
        icerik:
          'Volta işaretinin ardından gelen ilk nota mutlaka oktav işareti almalıdır.',
      },
      {
        baslik: 'Nokta 3 Ayırıcı',
        icerik:
          'Volta numarasından hemen sonra gelen hücre nokta 1, 2 veya 3 içeriyorsa volta numarasının ardından nokta 3 ayırıcı eklenir.',
      },
      {
        baslik: 'Yazılmayan Unsurlar',
        icerik:
          'Baskıdaki köşeli parantez ve noktalama işaretleri Braille\'de gösterilmez.',
      },
    ],
  },

  tie: {
    baslik: 'Bağ – Uzatma (Tie)',
    renk: 'blue',
    kurallar: [
      {
        baslik: 'Tanım',
        icerik:
          'Baskı notasında tie, aynı perdedeki iki notayı birleştiren kavisli bir çizgidir. Bağlı notalar bir arada tek nota gibi çalınır; toplam süresi ikisinin toplamına eşittir.',
      },
      {
        baslik: 'Braille Sembolü',
        icerik:
          'Braille\'de tie işareti iki hücreyle yazılır: nokta 4 ardından nokta 1-4. Braille metni "@C" olarak gösterilir.',
      },
      {
        baslik: 'Kullanım',
        icerik:
          'Tie işareti birleştirilecek notaların arasına yazılır; çoğunlukla ilk notanın hemen ardından yer alır. Ölçü sınırı aşılabilir (bir ölçünün son notası sonraki ölçünün ilk notasına bağlanabilir).',
      },
      {
        baslik: 'Slur Farkı',
        icerik:
          'Baskıda tie ve slur benzer görünebilir. Tie: yalnızca aynı perdedeki notaları birleştirir; çalınırken tek nota etkisi verir. Slur (legato bağı): farklı perdedeki notaların akıcı biçimde çalınmasını sağlar.',
      },
    ],
  },

  slur: {
    baslik: 'Legato Bağı (Slur)',
    renk: 'blue',
    kurallar: [
      {
        baslik: 'Tanım',
        icerik:
          'Slur, notaların akıcı ve kesintisiz (legato) çalınacağını gösterir. Vokal müzikte aynı hece üzerine birden fazla nota bağlamak için de kullanılır.',
      },
      {
        baslik: 'Tekli Slur (2–4 nota)',
        icerik:
          'Tekli slur sembolü (nokta 1-4) iki ila dört nota arasında kullanılır. İşaret, etkilenen her notanın (sonuncusu hariç) ardına konur.',
      },
      {
        baslik: 'Çiftleme (4+ nota)',
        icerik:
          'Dört veya daha fazla nota kapsayan slurlarda çiftleme kuralı uygulanabilir: ilk notanın ardından çift slur işareti, son notadan önce tekli slur işareti konur. Bu sayede daha az hücre kullanılır.',
      },
      {
        baslik: 'Oktav Kuralına Etkisi Yok',
        icerik:
          'Slur varlığı oktav işareti kuralını değiştirmez. Slur içindeki bir nota altıncı veya daha büyük aralık içeriyorsa yine oktav işareti alır.',
      },
    ],
  },

  accidental: {
    baslik: 'Aksidental',
    renk: 'rose',
    kurallar: [
      {
        baslik: 'Diyez ♯ — Ses Tizleşir',
        icerik:
          'Diyez işareti, notanın perdesini yarım ton (yarım adım) yükseltir. Klavyede bir tuş sağa kaymak gibidir. Örneğin Do♯, Do ile Re arasındaki perdedir. Diyez sesi inceltir ve tizleştirir.',
      },
      {
        baslik: 'Bemol ♭ — Ses Pesleşir',
        icerik:
          'Bemol işareti, notanın perdesini yarım ton alçaltır. Örneğin Si♭, Si ile La arasındaki perdedir. Bemol sesi kalınlaştırır ve pesleştirir.',
      },
      {
        baslik: 'Natürel ♮ — İptal',
        icerik:
          'Natürel işareti, daha önce uygulanmış bir diyez ya da bemolü iptal eder ve notayı doğal perdesine (beyaz tuşa) döndürür.',
      },
      {
        baslik: 'Çift Diyez ve Çift Bemol',
        icerik:
          'Çift diyez (𝄪) notayı iki yarım ton, yani bir tam ton yükseltir. Çift bemol (𝄫) ise notayı bir tam ton alçaltır. Her ikisi de nadir kullanılır.',
      },
      {
        baslik: 'Konumu',
        icerik:
          'Aksidental, her zaman etkilediği notadan hemen önce yazılır. Nota oktav işareti de alıyorsa sıralama şöyledir: aksidental → oktav işareti → nota. Araya başka sembol girmez.',
      },
      {
        baslik: 'Donanım ile İlişkisi',
        icerik:
          'Donanımda (anahtar armüründe) belirtilen aksidentaller ölçü boyunca geçerlidir. Natürel ile iptal edilmedikçe ölçü içinde tekrar yazılmazlar. Yeni bir ölçü başladığında donanım aksidentalleri yeniden devreye girer.',
      },
    ],
  },

  dot: {
    baslik: 'Noktalı Uzatma',
    renk: 'orange',
    kurallar: [
      {
        baslik: 'Süre Etkisi',
        icerik:
          'Nota veya susun yanına konulan augmentation dot (uzatma noktası), o değerin süresini yarısı kadar artırır. Dörtlük nota 1 vuruşsa, noktalı dörtlük 1 + ½ = 1,5 vuruştur. Yarım nota 2 vuruşsa, noktalı yarım 3 vuruştur.',
      },
      {
        baslik: 'Braille\'de Yazım',
        icerik:
          'Braille müzikte noktalama işareti, nota veya sus hücresinin hemen ardından nokta 3 eklenerek gösterilir. Başka hiçbir sembol araya girmemelidir.',
      },
      {
        baslik: 'Çift Nokta',
        icerik:
          'İki noktalı değerlerde süre 1 + ½ + ¼ oranında uzar (örneğin dörtlük için 1,75 vuruş). Braille\'de ardışık iki nokta 3 kullanılır.',
      },
      {
        baslik: 'Sus ile Kullanım',
        icerik:
          'Suslar da noktalanabilir; kural notalarla aynıdır. Sus hücresinin hemen ardına nokta 3 konur.',
      },
    ],
  },

  timeSignature: {
    baslik: 'Zaman İmzası',
    renk: 'teal',
    kurallar: [
      {
        baslik: 'Yazım',
        icerik:
          'Braille\'de zaman imzası üç hücreyle yazılır: önce sayı işareti (#), ardından üst sayı (her ölçüdeki vuruş sayısı), ardından alt sayı (bir vuruşun nota değeri). Alt sayılar (2, 4, 8 vb.) hücrenin alt noktalarında kodlanır.',
      },
      {
        baslik: 'Konumu',
        icerik:
          'Zaman imzası müziğin üstünde, anahtar armürü ile birlikte ayrı bir satırda ortalanmış olarak yazılır.',
      },
      {
        baslik: 'Anlam',
        icerik:
          '4/4 imzasında üstteki 4 her ölçüde 4 vuruş olduğunu, alttaki 4 bir vuruşun dörtlük nota değerinde olduğunu gösterir. 3/4\'te üç dörtlük vuruş vardır (vals ritmi).',
      },
      {
        baslik: 'Değişim',
        icerik:
          'Parça içinde zaman imzası değişirse yeni imza, değişimin gerçekleştiği ölçü çizgisinden hemen sonra yazılır ve ardından gelen ilk nota oktav işareti alır.',
      },
    ],
  },

  keySignature: {
    baslik: 'Donanım (Anahtar Armürü)',
    renk: 'indigo',
    kurallar: [
      {
        baslik: 'Geçerlilik',
        icerik:
          'Donanımdaki diyez veya bemol işaretleri parça boyunca geçerlidir. Belirtilen notalar natürel ile iptal edilmedikçe o aksidentalle çalınır.',
      },
      {
        baslik: 'Ölçü Başında Yenileme',
        icerik:
          'Her yeni ölçünün başında donanım aksidentalleri yeniden devreye girer. Önceki ölçüde kullanılan geçici bir natürel ya da aksidental bitmiş sayılır.',
      },
      {
        baslik: 'Donanım Değişimi',
        icerik:
          'Parça içinde donanım değişirse, yeni donanım eski ölçü çizgisinin ardından belirtilir. Değişim notası oktav işareti alır.',
      },
    ],
  },

  tuplet: {
    baslik: 'Grup (Tuplet)',
    renk: 'fuchsia',
    kurallar: [
      {
        baslik: 'Tanım',
        icerik:
          'Tuplet, normalde bir vuruşa eşit olan süreye farklı sayıda nota sığdırmayı sağlar. En yaygın örnek triolet (üçleme): iki sekizliğin yerine üç sekizlik çalınır.',
      },
      {
        baslik: 'Braille\'de Gösterim',
        icerik:
          'Tuplet grubu için sayı işareti ardından grup sayısı (ör. 3 için "3") yazılır. Bu sayı, grubun ilk notasından önce gelir.',
      },
      {
        baslik: 'Süre',
        icerik:
          'Tuplet içindeki notalar yazılı sürelerinden daha kısa veya daha uzun çalınır; bu oran grubun türüne göre değişir. Örneğin triolette her nota, normal değerinin 2/3\'ü kadar sürer.',
      },
    ],
  },

  dynamic: {
    baslik: 'Dinamik / İfade İşareti',
    renk: 'purple',
    kurallar: [
      {
        baslik: 'Sözcük İşareti',
        icerik:
          'Braille müzikte tüm sözcükler kısaltmasız, harf harf yazılır. Her sözcükten önce sözcük işareti (nokta 3-4-5) konur. Büyük harf kullanılmaz.',
      },
      {
        baslik: 'Sıralama Kuralı',
        icerik:
          'Bir ölçünün başında hem tempo hem de dinamik işareti varsa önce tempo işareti, ardından dinamik işareti, ardından nota yazılır. Dinamik işareti susa değil notaya uygulandığından mutlaka notadan önce gelir.',
      },
      {
        baslik: 'Cresc / Decresc / Dim Kısaltmaları',
        icerik:
          'Crescendo, baskıda nasıl kısaltılmış olursa olsun her zaman "cr" olarak yazılır. Decrescendo "decr", diminuendo ise "dim" olarak kodlanır. Bu standart form ülkeden bağımsız uygulanır.',
      },
      {
        baslik: 'Oktav Zorunluluğu',
        icerik:
          'Bir sözcük veya ifade işaretinin ardından gelen ilk nota mutlaka oktav işareti almalıdır.',
      },
      {
        baslik: 'Nokta 3 Ayırıcı',
        icerik:
          'Sözcükten sonra gelen hücre nokta 1, 2 veya 3 içeriyorsa sözcüğün ardına nokta 3 ayırıcı eklenir. İstisna: sözcük ölçü sonundaysa, ardından başka bir sözcük işareti geliyorsa veya zaten nokta 3 varsa ayırıcı gerekmez.',
      },
    ],
  },
};

// Yedek kural seti
const VARSAYILAN_KURAL = {
  baslik: 'Braille Müzik Sembolü',
  renk: 'zinc',
  kurallar: [
    {
      baslik: 'Genel',
      icerik:
        'Bu Braille hücresi bir müzik sembolünü temsil etmektedir. Sembolün ayrıntıları için bağlam ve ölçü içeriğini inceleyiniz.',
    },
  ],
};

// ─── Renk haritası ────────────────────────────────────────────────────────────
const RENK_MAP = {
  emerald: { badge: 'bg-emerald-100 text-emerald-800', baslik: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  slate:   { badge: 'bg-slate-100 text-slate-700',     baslik: 'text-slate-600',   border: 'border-slate-200',  bg: 'bg-slate-50' },
  violet:  { badge: 'bg-violet-100 text-violet-800',   baslik: 'text-violet-700',  border: 'border-violet-200', bg: 'bg-violet-50' },
  zinc:    { badge: 'bg-zinc-100 text-zinc-700',       baslik: 'text-zinc-600',    border: 'border-zinc-200',   bg: 'bg-zinc-50' },
  amber:   { badge: 'bg-amber-100 text-amber-800',     baslik: 'text-amber-700',   border: 'border-amber-200',  bg: 'bg-amber-50' },
  sky:     { badge: 'bg-sky-100 text-sky-800',         baslik: 'text-sky-700',     border: 'border-sky-200',    bg: 'bg-sky-50' },
  blue:    { badge: 'bg-blue-100 text-blue-800',       baslik: 'text-blue-700',    border: 'border-blue-200',   bg: 'bg-blue-50' },
  rose:    { badge: 'bg-rose-100 text-rose-800',       baslik: 'text-rose-700',    border: 'border-rose-200',   bg: 'bg-rose-50' },
  orange:  { badge: 'bg-orange-100 text-orange-800',   baslik: 'text-orange-700',  border: 'border-orange-200', bg: 'bg-orange-50' },
  purple:  { badge: 'bg-purple-100 text-purple-800',   baslik: 'text-purple-700',  border: 'border-purple-200', bg: 'bg-purple-50' },
  teal:    { badge: 'bg-teal-100 text-teal-800',       baslik: 'text-teal-700',    border: 'border-teal-200',   bg: 'bg-teal-50' },
  indigo:  { badge: 'bg-indigo-100 text-indigo-800',   baslik: 'text-indigo-700',  border: 'border-indigo-200', bg: 'bg-indigo-50' },
  fuchsia: { badge: 'bg-fuchsia-100 text-fuchsia-800', baslik: 'text-fuchsia-700', border: 'border-fuchsia-200',bg: 'bg-fuchsia-50' },
};

// ─── Kural anahtarı belirleme ─────────────────────────────────────────────────
function getKuralKey(anlam) {
  // Kaynak/tip değerleri kaynağa göre camelCase ('beginRepeat') ya da
  // küçük harf ('beginrepeat') olabilir; karşılaştırmayı küçük harfe indirgeyerek
  // her iki biçimi de yakalarız.
  const kaynak = String(anlam?.kaynak || '').toLowerCase();
  const tip = String(anlam?.tip || '').toLowerCase();

  // Volta
  if (kaynak === 'volta1' || tip === 'volta1') return 'volta1';
  if (kaynak === 'volta2' || tip === 'volta2') return 'volta2';

  // Tekrar çizgileri
  if (kaynak === 'beginrepeat' || tip === 'beginrepeat') return 'beginRepeat';
  if (kaynak === 'endrepeat'   || tip === 'endrepeat')   return 'endRepeat';
  if (kaynak === 'finalbarline' || tip === 'finalbarline') return 'finalBarline';
  if (kaynak === 'sectionalbarline' || tip === 'sectionalbarline') return 'sectionalBarline';
  if (kaynak === 'bar-repeat' || tip === 'bar-repeat') return 'barRepeat';

  // Dot
  if (kaynak === 'dot' || tip === 'dot') return 'dot';

  // Header braille (kaynak alanı doğrudan): zaman/donanım/tempo
  if (kaynak === 'time-signature' || tip === 'time-signature') return 'timeSignature';
  if (kaynak === 'key-signature' || tip === 'key-signature') return 'keySignature';
  if (kaynak === 'tempo' || tip === 'tempo') return 'dynamic';

  // Kategori tabanlı eşleme
  const kat = brailleKategoriAl(anlam);
  if (kat === 'susleme') return 'susleme';
  if (kat === 'nota') return 'nota';
  if (kat === 'sus') return 'sus';
  if (kat === 'oktav') return 'oktav';
  if (kat === 'beginrepeat') return 'beginRepeat';
  if (kat === 'endrepeat') return 'endRepeat';
  if (kat === 'bar-repeat') return 'barRepeat';
  if (kat === 'barline') return 'barline';
  if (kat === 'volta1') return 'volta1';
  if (kat === 'volta2') return 'volta2';
  if (kat === 'accidental') return 'accidental';
  if (kat === 'tie') return 'tie';
  if (kat === 'slur' || kat === 'bag') return 'slur';
  if (kat === 'time-signature' || kat === 'time-signature-change') return 'timeSignature';
  if (kat === 'key-signature' || kat === 'key-signature-change') return 'keySignature';
  if (kat === 'tuplet') return 'tuplet';
  if (kat === 'tempo' || kat === 'dynamic') return 'dynamic';
  if (kat === 'nuans-once' || kat === 'nuans-sonra') return 'nuans';

  return null;
}

// ─── Nota bilgisi çözümleme ───────────────────────────────────────────────────
function notaBilgisiAl(anlam, oge) {
  if (!oge) return null;

  if (oge.tip === 'nota') {
    const notaAd = oge.notaAd || oge.ad || null;
    const oktav = Number.isFinite(Number(oge.oktav)) ? Number(oge.oktav) : null;
    const sureIdx = Number.isFinite(oge.sureIndeksi) ? oge.sureIndeksi : null;
    const sureAd = sureIdx !== null ? (SURE_ADLARI[sureIdx] || null) : null;
    const dotted = Boolean(oge.dotted);
    return { tip: 'nota', notaAd, oktav, sureAd, dotted };
  }

  if (oge.tip === 'sus') {
    const sureIdx = Number.isFinite(oge.sureIndeksi) ? oge.sureIndeksi : null;
    const sureAd = sureIdx !== null ? (SURE_ADLARI[sureIdx] || null) : null;
    const dotted = Boolean(oge.dotted);
    return { tip: 'sus', sureAd, dotted };
  }

  return null;
}

// ─── Panel Bileşeni ───────────────────────────────────────────────────────────
export default function BrailleDetayPanel({ detay, onKapat, style }) {
  // ESC tuşu ile kapat
  useEffect(() => {
    if (!detay) return;
    const handler = (e) => {
      if (e.key === 'Escape') onKapat?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [detay, onKapat]);

  if (!detay) return null;

  const { anlam, hucre, oge } = detay;
  const kuralKey = getKuralKey(anlam);
  // Süsleme/dinamik ise o işarete özel açıklama/kuralları göster; değilse genel kural DB.
  const suslemeKurali = kuralKey === 'susleme' ? suslemeKuralBilgisiAl(anlam) : null;
  const dinamikKurali = kuralKey === 'dynamic' ? dinamikKuralBilgisiAl(anlam) : null;
  const nuansKurali   = kuralKey === 'nuans'   ? nuansKuralBilgisiAl(anlam)   : null;
  const kuralBilgisi = suslemeKurali || dinamikKurali || nuansKurali || (kuralKey && KURAL_DB[kuralKey]) || VARSAYILAN_KURAL;
  const renkler = RENK_MAP[kuralBilgisi.renk] || RENK_MAP.zinc;

  const nota = notaBilgisiAl(anlam, oge);
  const etiket = anlam?.etiket || anlam?.baslik || anlam?.ad || kuralBilgisi.baslik;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[120] border-t-2 border-slate-200 bg-white shadow-[0_-6px_32px_rgba(0,0,0,0.13)]"
      role="complementary"
      aria-label="Braille detay paneli"
      style={style}
    >
      {/* Sürükleme tutacağı */}
      <div className="flex justify-center pt-1.5 pb-0.5">
        <div className="h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />
      </div>

      {/* Başlık şeridi */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-1">
        {/* Braille hücresi */}
        <div className="shrink-0">
          <BrailleHucreMini
            noktalar={hucre}
            anlam={anlam}
            hoverAktif={false}
            seciliAktif={false}
            index={0}
          />
        </div>

        {/* Başlık + bilgi rozetleri */}
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900 leading-tight">
            {kuralBilgisi.baslik}
          </span>

          {/* Etiket rozeti */}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${renkler.badge}`}>
            {etiket}
          </span>

          {/* Nota bilgisi rozeti */}
          {nota?.tip === 'nota' && nota.notaAd && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              {nota.notaAd}
              {nota.sureAd ? ` · ${nota.sureAd}` : ''}
              {nota.dotted ? ' noktalı' : ''}
              {nota.oktav ? ` · ${nota.oktav}. oktav` : ''}
            </span>
          )}

          {/* Sus bilgisi rozeti */}
          {nota?.tip === 'sus' && nota.sureAd && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {nota.sureAd} sus{nota.dotted ? ' (noktalı)' : ''}
            </span>
          )}
        </div>

        {/* Kapat butonu */}
        <button
          type="button"
          onClick={onKapat}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg leading-none transition-colors"
          aria-label="Kapat"
        >
          ×
        </button>
      </div>

      {/* Kural kartları — yatay kaydırılabilir */}
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-3"
        style={{ scrollbarWidth: 'thin' }}
      >
        {kuralBilgisi.kurallar.map((kural, idx) => (
          <div
            key={idx}
            className={`shrink-0 w-72 rounded-xl border ${renkler.border} bg-white p-3`}
          >
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${renkler.baslik}`}>
              {kural.baslik}
            </div>
            <p className="text-xs leading-relaxed text-slate-700">
              {kural.icerik}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
