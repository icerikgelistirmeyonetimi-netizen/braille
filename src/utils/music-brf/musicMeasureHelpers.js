import {
  SURE_GOSTERGELERI,
} from '../../data/muzik.js';

export const manuelNormalOlcuCizgisiMi = (oge) => (
  oge?.tip === 'barline' &&
  (oge.kind === 'manual' || oge.auto === false) &&
  !oge.autoBarline &&
  !oge.otomatikOlcuCizgisi
);

export const olcuCizgisiMi = (oge) => {
  if (!oge) return false;

  if (oge.tip === 'timeSignatureChange' || oge.tip === 'keySignatureChange') {
    return false;
  }

  if (manuelNormalOlcuCizgisiMi(oge)) {
    return true;
  }

  if (oge.tip === 'barline') return true;

  const tip = String(oge.tip || oge.type || '').toLowerCase();
  const ad = String(oge.ad || oge.gorunum || '').toLowerCase();

  return (
    /barline|ölçü çizgisi|ölçü ayracı|final|bitiş|sectional|bölüm|repeat|tekrar|volta|dolap/.test(tip) ||
    /barline|ölçü çizgisi|ölçü ayracı|final|bitiş|sectional|bölüm|repeat|tekrar|volta|dolap/.test(ad)
  );
};

export const normalOlcuCizgisiMi = (oge) => {
  if (!oge) return false;

  if (oge.tip === 'timeSignatureChange' || oge.tip === 'keySignatureChange') {
    return false;
  }

  // Manuel çizgi kullanıcı girdisidir, otomatik çizgi gibi temizlenmemeli.
  if (manuelNormalOlcuCizgisiMi(oge)) {
    return false;
  }

  // Sadece otomatik normal çizgiler temizlenir.
  if (oge.autoBarline || oge.otomatikOlcuCizgisi || oge.auto === true) {
    return true;
  }

  const bosHucreliMi =
    Array.isArray(oge.hucreler) &&
    oge.hucreler.length > 0 &&
    Array.isArray(oge.hucreler[0]) &&
    oge.hucreler[0].length === 0;

  const ad = String(oge.ad || '').toLowerCase();

  if (bosHucreliMi && /otomatik/.test(ad)) return true;

  return false;
};

export const ozelOlcuCizgisiMi = (oge) => {
  if (!oge) return false;

  if (oge.tip === 'timeSignatureChange' || oge.tip === 'keySignatureChange') {
    return false;
  }

  if (manuelNormalOlcuCizgisiMi(oge)) {
    return false;
  }

  const tip = String(oge.tip || oge.type || oge.kind || '').toLowerCase();
  const ad = String(oge.ad || oge.gorunum || '').toLowerCase();

  return (
    [
      'finalbarline',
      'sectionalbarline',
      'beginrepeat',
      'endrepeat',
      'barlinefinal',
      'barlinesectional',
      'volta1',
      'volta2',
      'volta',
    ].includes(tip) ||
    /final|bitiş|sectional|bölüm|çift|double|repeat|tekrar|volta|dolap/.test(ad)
  );
};

export const otomatikOlcuCizgisiOlustur = (key) => ({
  id: `auto-barline-${key}`,
  tip: 'barline',
  ad: 'Otomatik ölçü çizgisi',
  gorunum: '|',
  hucreler: [[]],
  autoBarline: true,
  otomatikOlcuCizgisi: true,
});

/**
 * İçeriği (nota/sus) kalmamış ölçüleri kapatan NORMAL ölçü çizgilerini kaldırır,
 * böylece o boş ölçü görselden tamamen yok olur (silme sonrası "boş ölçü kalması"
 * sorununu çözer). Özel çizgiler (final, repeat, volta, sectional) korunur.
 * Klef/zaman/anahtar gibi yapısal öğeler "içerik" sayılmaz (korunur ama boş
 * ölçüyü ayakta tutmaz). Auto-bar/auto-rest zaten kaynak listede bulunmaz.
 */
export const bosOlculeriTemizle = (ogeler) => {
  if (!Array.isArray(ogeler) || !ogeler.length) return ogeler;
  const icerikMi = (oge) => oge && (oge.tip === 'nota' || oge.tip === 'sus');
  const sonuc = [];
  let icerikVar = false; // son ölçü çizgisinden (ya da baştan) beri nota/sus görüldü mü
  for (const oge of ogeler) {
    if (olcuCizgisiMi(oge)) {
      if (!icerikVar && !ozelOlcuCizgisiMi(oge)) {
        // Boş ölçüyü kapatan normal çizgi → at (ölçü çöksün).
        continue;
      }
      sonuc.push(oge);
      icerikVar = false;
    } else {
      sonuc.push(oge);
      if (icerikMi(oge)) icerikVar = true;
    }
  }
  return sonuc;
};

export const sonrakiSkorDevamEdiyorMu = (liste, baslangicIdx) => {
  for (let i = baslangicIdx; i < liste.length; i += 1) {
    const oge = liste[i];

    if (!oge) continue;

    if (normalOlcuCizgisiMi(oge)) continue;

    if (ozelOlcuCizgisiMi(oge)) return false;

    return true;
  }

  return false;
};

export const sonOgeOtomatikOlcuCizgisiMi = (liste) => {
  const son = liste[liste.length - 1];
  return Boolean(son?.autoBarline || son?.otomatikOlcuCizgisi);
};

export const keySignatureSayisiAl = (keySignature) => {
  const keyAd = String(keySignature?.ad || '').toLowerCase();
  const keyM = /^(\d+)\s*(diyezli|bemollü|bemollu|bemol)/i.exec(keyAd);

  return keyM
    ? Math.min(7, Math.max(0, parseInt(keyM[1], 10) || 0))
    : 0;
};

export const timeSignatureToplam64Al = (header) => {
  const ts = String(header?.timeSignature?.ad || '').toLowerCase();
  if (!ts) return 0;
  if (ts === 'common') return 4 * (64 / 4);
  if (ts === 'cut common') return 4 * (64 / 4);

  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(ts);
  if (!m) return 0;

  const ust = parseInt(m[1], 10);
  const alt = parseInt(m[2], 10);

  if (!Number.isFinite(ust) || !Number.isFinite(alt) || alt <= 0) return 0;

  return ust * (64 / alt);
};

export const sureBilgisiAl = (oge, sureGostergeleri = SURE_GOSTERGELERI) => {
  if (!oge) return null;
  if (oge.tip === 'nota' || oge.tip === 'sus') {
    return sureGostergeleri[oge.sureIndeksi ?? 0] || null;
  }
  return null;
};

export const ogeSure64Al = (oge, sureGostergeleri = SURE_GOSTERGELERI) => {
  const sure = sureBilgisiAl(oge, sureGostergeleri);
  if (!sure || !Number.isFinite(sure.realValue)) return 0;

  let birim = 64 / sure.realValue;
  if (oge.dotted) {
    birim += birim / 2;
  }

  return birim;
};

export const restSureIdxByRealValue = (realValue, sureGostergeleri = SURE_GOSTERGELERI) => {
  const idx = sureGostergeleri.findIndex((s) => s.realValue === realValue);
  return idx >= 0 ? idx : 0;
};

const standartRestAdaylari = [
  { realValue: 1, birim64: 64 },
  { realValue: 2, birim64: 32 },
  { realValue: 4, birim64: 16 },
  { realValue: 8, birim64: 8 },
  { realValue: 16, birim64: 4 },
  { realValue: 32, birim64: 2 },
  { realValue: 64, birim64: 1 },
];

export const zamanImzasindanVurus64Al = (header) => {
  const ts = String(header?.timeSignature?.ad || '').toLowerCase();
  if (!ts) return 16;
  if (ts === 'common') return 16;
  if (ts === 'cut common') return 32;

  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(ts);
  if (!m) return 16;

  const ust = parseInt(m[1], 10);
  const alt = parseInt(m[2], 10);

  if (!Number.isFinite(ust) || !Number.isFinite(alt) || alt <= 0) {
    return 16;
  }

  if (alt === 8 && ust > 3 && ust % 3 === 0) {
    return 24;
  }

  if (alt === 4) return 16;
  if (alt === 8) return 8;
  if (alt === 2) return 32;

  return 64 / alt;
};

export const timeSignatureDegisimiMi = (oge) => (
  oge?.tip === 'timeSignatureChange' && oge.timeSignature
);

export const aktifHeaderOlustur = (baseHeader, timeSignature) => ({
  ...(baseHeader || {}),
  timeSignature: timeSignature || baseHeader?.timeSignature || null,
});

export const ogeTimeSignatureAl = (oge) => (
  oge?.timeSignature || null
);

const enBuyukStandartRestAl = (maxBirim64) => {
  return standartRestAdaylari.find((aday) => aday.birim64 <= maxBirim64) || standartRestAdaylari[standartRestAdaylari.length - 1];
};

const otomatikSusOgesiOlustur = (realValue, key, sureGostergeleri = SURE_GOSTERGELERI, muzikSusSkorOgesiFn) => {
  const sureIdx = restSureIdxByRealValue(realValue, sureGostergeleri);
  const rest = muzikSusSkorOgesiFn(`auto-rest-${key}-${realValue}`, sureIdx);

  return {
    ...rest,
    id: `auto-rest-${key}-${realValue}`,
    autoRest: true,
    otomatik: true,
    ad: `${rest.ad || 'Sus'} (otomatik ölçü tamamlama)`,
  };
};

export const kalan64RestlereVurusluBol = ({
  kalan64,
  olcuIciBaslangic64,
  hedefOlcu64,
  vurus64,
  keyPrefix,
  sureGostergeleri = SURE_GOSTERGELERI,
  muzikSusSkorOgesiFn,
}) => {
  const restler = [];
  let kalan = Math.round(kalan64);
  let pozisyon = Math.round(olcuIciBaslangic64);
  let sayac = 0;

  const guvenliVurus64 = Math.max(1, Math.round(vurus64 || 16));
  const guvenliHedef64 = Math.max(1, Math.round(hedefOlcu64 || kalan || 16));

  while (kalan > 0) {
    const vurusIciKonum = pozisyon % guvenliVurus64;
    let maxChunk;

    if (vurusIciKonum !== 0) {
      maxChunk = Math.min(kalan, guvenliVurus64 - vurusIciKonum);
    } else {
      const kalanOlcu = guvenliHedef64 - pozisyon;

      if (guvenliVurus64 === 16 && kalan >= 32 && pozisyon % 32 === 0) {
        maxChunk = Math.min(kalan, kalanOlcu, 32);
      } else if (guvenliVurus64 === 24 && kalan >= 24) {
        maxChunk = Math.min(kalan, kalanOlcu, 24);
      } else {
        maxChunk = Math.min(kalan, kalanOlcu, guvenliVurus64);
      }
    }

    const aday = enBuyukStandartRestAl(maxChunk);

    restler.push(
      otomatikSusOgesiOlustur(
        aday.realValue,
        `${keyPrefix}-${sayac}`,
        sureGostergeleri,
        muzikSusSkorOgesiFn,
      ),
    );

    kalan -= aday.birim64;
    pozisyon += aday.birim64;
    sayac += 1;

    if (pozisyon >= guvenliHedef64) {
      pozisyon = 0;
    }
  }

  return restler;
};

export const muzikOgeleriOlcuTamamla = ({
  muzikOgeleri,
  muzikHeader,
  muzikSusSkorOgesi: muzikSusSkorOgesiFn,
  sureGostergeleri = SURE_GOSTERGELERI,
}) => {
  let aktifTimeSignature = muzikHeader?.timeSignature || null;
  let aktifHeader = aktifHeaderOlustur(muzikHeader, aktifTimeSignature);

  let hedefOlcu64 = timeSignatureToplam64Al(aktifHeader);
  let vurus64 = zamanImzasindanVurus64Al(aktifHeader);

  if (!hedefOlcu64) {
    return muzikOgeleri.filter((oge) => !normalOlcuCizgisiMi(oge));
  }

  const sonuc = [];
  let olcuSure64 = 0;
  let olcuNo = 1;
  let autoSayac = 0;
  const autoCompleteMeasures = muzikHeader?.autoCompleteMeasures !== false;
  const pickupMeasure = Boolean(muzikHeader?.pickupMeasure);

  const aktifSureleriGuncelle = (timeSignature) => {
    aktifTimeSignature = timeSignature || aktifTimeSignature;
    aktifHeader = aktifHeaderOlustur(muzikHeader, aktifTimeSignature);
    hedefOlcu64 = timeSignatureToplam64Al(aktifHeader);
    vurus64 = zamanImzasindanVurus64Al(aktifHeader);
  };

  const otomatikOlcuCizgisiEkle = (neden) => {
    if (sonOgeOtomatikOlcuCizgisiMi(sonuc)) return;
    if (sonuc.length === 0) return;

    sonuc.push(
      otomatikOlcuCizgisiOlustur(`${neden}-m${olcuNo}-${autoSayac}`),
    );

    autoSayac += 1;
  };

  const eksikKalanSureyiSuslaDoldur = (neden) => {
    if (!autoCompleteMeasures) return;

    // İlk ölçü pickup ise eksik kalan süre susla doldurulmaz.
    if (pickupMeasure && olcuNo === 1) return;

    const yuvarlanmis = Math.round(olcuSure64);
    if (yuvarlanmis > 0 && yuvarlanmis < hedefOlcu64) {
      const kalan = hedefOlcu64 - yuvarlanmis;
      const restler = kalan64RestlereVurusluBol({
        kalan64: kalan,
        olcuIciBaslangic64: yuvarlanmis,
        hedefOlcu64,
        vurus64,
        keyPrefix: `${neden}-m${olcuNo}`,
        sureGostergeleri,
        muzikSusSkorOgesiFn,
      });

      sonuc.push(...restler);
      olcuSure64 = hedefOlcu64;
    }
  };

  const olcuyuKapat = (neden, otomatikCizgiEkle = true) => {
    eksikKalanSureyiSuslaDoldur(neden);

    if (otomatikCizgiEkle && olcuSure64 >= hedefOlcu64 - 0.0001) {
      otomatikOlcuCizgisiEkle(neden);
    }

    olcuSure64 = 0;
    olcuNo += 1;
  };

  muzikOgeleri.forEach((oge, idx) => {
    if (!oge) return;

    if (oge.tip === 'anahtar') {
      sonuc.push(oge);
      return;
    }

    if (normalOlcuCizgisiMi(oge)) {
      return;
    }

    if (manuelNormalOlcuCizgisiMi(oge)) {
      // Kullanıcı manuel ölçü çizgisi eklediyse, mevcut ölçü burada kapanır.
      // Pickup kapalıysa ve ölçü eksikse otomatik susla tamamlanır.
      if (olcuSure64 > 0 && olcuSure64 < hedefOlcu64) {
        eksikKalanSureyiSuslaDoldur('before-manual-barline');
      }

      // Önceki otomatik çizgi varsa kaldır, manuel çizgi kalacak.
      if (sonOgeOtomatikOlcuCizgisiMi(sonuc)) {
        sonuc.pop();
      }

      sonuc.push(oge);

      olcuSure64 = 0;
      olcuNo += 1;
      return;
    }

    if (ozelOlcuCizgisiMi(oge)) {
      if (olcuSure64 > 0 && olcuSure64 < hedefOlcu64) {
        eksikKalanSureyiSuslaDoldur('before-special-barline');
      }
      if (sonOgeOtomatikOlcuCizgisiMi(sonuc)) {
        sonuc.pop();
      }
      sonuc.push(oge);
      olcuSure64 = 0;
      olcuNo += 1;
      return;
    }

    if (timeSignatureDegisimiMi(oge)) {
      // Zaman imzası değişikliği süre taşımaz.
      // Öncesinde ölçü dolmuşsa çizgi zaten eklenmiştir.
      sonuc.push(oge);
      aktifSureleriGuncelle(ogeTimeSignatureAl(oge));
      olcuSure64 = 0;
      return;
    }

    const sure64 = ogeSure64Al(oge, sureGostergeleri);

    if (sure64 <= 0) {
      sonuc.push(oge);
      return;
    }

    if (
      olcuSure64 > 0 &&
      olcuSure64 + sure64 > hedefOlcu64 + 0.0001
    ) {
      olcuyuKapat('split-before-overflow', true);
    }

    if (sure64 > hedefOlcu64 + 0.0001) {
      sonuc.push(oge);
      olcuSure64 = (olcuSure64 + sure64) % hedefOlcu64;

      if (Math.abs(olcuSure64) < 0.0001) {
        olcuSure64 = 0;
        if (sonrakiSkorDevamEdiyorMu(muzikOgeleri, idx + 1)) {
          otomatikOlcuCizgisiEkle('oversized-duration');
          olcuNo += 1;
        }
      }

      return;
    }

    sonuc.push(oge);
    olcuSure64 += sure64;

    if (Math.abs(olcuSure64 - hedefOlcu64) < 0.0001) {
      if (sonrakiSkorDevamEdiyorMu(muzikOgeleri, idx + 1)) {
        otomatikOlcuCizgisiEkle('measure-complete');
      }
      olcuSure64 = 0;
      olcuNo += 1;
    }
  });

  if (
    autoCompleteMeasures &&
    !(pickupMeasure && olcuNo === 1) &&
    olcuSure64 > 0 &&
    olcuSure64 < hedefOlcu64
  ) {
    const kalan = hedefOlcu64 - Math.round(olcuSure64);
    const restler = kalan64RestlereVurusluBol({
      kalan64: kalan,
      olcuIciBaslangic64: Math.round(olcuSure64),
      hedefOlcu64,
      vurus64,
      keyPrefix: `end-m${olcuNo}`,
      sureGostergeleri,
      muzikSusSkorOgesiFn,
    });

    sonuc.push(...restler);
  }

  while (sonOgeOtomatikOlcuCizgisiMi(sonuc)) {
    sonuc.pop();
  }

  return sonuc;
};
