export function brailleHucreToUnicode(hucre) {
  if (!Array.isArray(hucre) || hucre.length === 0) {
    return '\u2800';
  }

  let bit = 0;

  hucre.forEach((nokta) => {
    if (nokta >= 1 && nokta <= 8) {
      bit |= 1 << (nokta - 1);
    }
  });

  return String.fromCharCode(0x2800 + bit);
}

export function brailleHucreleriMetneCevir(hucreler = []) {
  return (hucreler || []).map(brailleHucreToUnicode).join('');
}

export function brfSatiraBol({
  metin,
  satirUzunlugu = 40,
}) {
  const temizMetin = String(metin || '');
  const satirlar = [];

  for (let i = 0; i < temizMetin.length; i += satirUzunlugu) {
    satirlar.push(temizMetin.slice(i, i + satirUzunlugu));
  }

  return satirlar.length ? satirlar : [''];
}

export function brfSatiriOrtala({
  hucreler = [],
  satirUzunlugu = 40,
}) {
  const metin = brailleHucreleriMetneCevir(hucreler);
  const uzunluk = metin.length;

  if (uzunluk >= satirUzunlugu) {
    return brfSatiraBol({ metin, satirUzunlugu });
  }

  const solBosluk = Math.floor((satirUzunlugu - uzunluk) / 2);
  const sagBosluk = satirUzunlugu - uzunluk - solBosluk;

  return [
    `${'\u2800'.repeat(solBosluk)}${metin}${'\u2800'.repeat(sagBosluk)}`,
  ];
}

export function muzikHeaderSatirlariniExportEt({
  headerSatirlari = [],
  satirUzunlugu = 40,
}) {
  const satirlar = [];

  (headerSatirlari || []).forEach((satir) => {
    const hucreler = Array.isArray(satir.hucreler) ? satir.hucreler : [];

    if (!hucreler.length) return;

    const ortaliSatirlar = brfSatiriOrtala({
      hucreler,
      satirUzunlugu,
    });

    satirlar.push(...ortaliSatirlar);
  });

  return satirlar;
}

export function muzikGovdeHucreleriniExportEt({
  hucreler = [],
  satirUzunlugu = 40,
}) {
  const metin = brailleHucreleriMetneCevir(hucreler);

  return brfSatiraBol({
    metin,
    satirUzunlugu,
  });
}

// LEGACY FALLBACK:
// Canonical BRF pipeline aktifken ana export yolunda kullanılmayan eski ölçü metin çeviri yardımcı fonksiyonu.
export function muzikOlcuGruplariniMetneCevir({
  brailleSatirlari = [],
}) {
  const olcuMetinleri = [];

  (brailleSatirlari || []).forEach((rowMeasures) => {
    (rowMeasures || []).forEach((measure) => {
      const hucreler = (measure || []).map((item) => item.hucre || []);
      const metin = brailleHucreleriMetneCevir(hucreler);

      if (metin.trim() || metin.length > 0) {
        olcuMetinleri.push(metin);
      }
    });
  });

  return olcuMetinleri;
}

// LEGACY FALLBACK:
// Canonical BRF pipeline aktifken ana export yolunda kullanılmayan eski satır bölme fonksiyonu.
export function brfOlcuBazliSatirlaraBol({
  olcuMetinleri = [],
  satirUzunlugu = 40,
  olcuArasiBosluk = '\u2800',
}) {
  const satirlar = [];
  let aktifSatir = '';

  (olcuMetinleri || []).forEach((olcuMetni) => {
    const temizOlcu = String(olcuMetni || '');

    if (!temizOlcu) return;

    if (!aktifSatir) {
      if (temizOlcu.length <= satirUzunlugu) {
        aktifSatir = temizOlcu;
      } else {
        const parcalar = brfSatiraBol({
          metin: temizOlcu,
          satirUzunlugu,
        });

        satirlar.push(...parcalar.slice(0, -1));
        aktifSatir = parcalar[parcalar.length - 1] || '';
      }

      return;
    }

    const aday = `${aktifSatir}${olcuArasiBosluk}${temizOlcu}`;

    if (aday.length <= satirUzunlugu) {
      aktifSatir = aday;
      return;
    }

    satirlar.push(aktifSatir);
    aktifSatir = temizOlcu;

    if (aktifSatir.length > satirUzunlugu) {
      const parcalar = brfSatiraBol({
        metin: aktifSatir,
        satirUzunlugu,
      });

      satirlar.push(...parcalar.slice(0, -1));
      aktifSatir = parcalar[parcalar.length - 1] || '';
    }
  });

  if (aktifSatir) {
    satirlar.push(aktifSatir);
  }

  return satirlar.length ? satirlar : [''];
}

// FALLBACK ONLY:
// Ana BRF üretimi scoreToCanonicalBrf üzerinden yapılır.
// Bu fonksiyon yalnızca canonical BRF üretimi başarısız olursa kullanılmalıdır.
export function muzikBrfExportMetniOlustur({
  cevirSonuc,
  brailleSatirlari = null,
  satirUzunlugu = 40,
  olcuBazli = true,
}) {
  const headerSatirlari = muzikHeaderSatirlariniExportEt({
    headerSatirlari: cevirSonuc?.headerSatirlari || [],
    satirUzunlugu,
  });

  let govdeSatirlari = [];

  if (olcuBazli && Array.isArray(brailleSatirlari)) {
    const olcuMetinleri = muzikOlcuGruplariniMetneCevir({
      brailleSatirlari,
    });

    govdeSatirlari = brfOlcuBazliSatirlaraBol({
      olcuMetinleri,
      satirUzunlugu,
    });
  } else {
    govdeSatirlari = muzikGovdeHucreleriniExportEt({
      hucreler: cevirSonuc?.hucreler || [],
      satirUzunlugu,
    });
  }

  return [...headerSatirlari, ...govdeSatirlari].join('\n');
}
