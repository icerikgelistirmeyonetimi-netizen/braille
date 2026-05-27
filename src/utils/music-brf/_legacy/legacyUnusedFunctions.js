// LEGACY UNUSED FUNCTIONS
// Bu dosya, aktif projede artık kullanılmayan ancak doğrudan silinmemesi gerektiği düşünülen
// eski BRF yardımcı fonksiyonlarının kaynak kodunu içerir.
//
// Not: Bu dosya şu anda bir modül olarak import edilmemelidir; sadece referans ve geri dönüş amacıyla tutulur.

/*
export function brailleGlobalOlculeriOlustur(tumHucreler, tumAnlamlar) {
  const olculer = [];
  let aktif = [];
  let aktifOlcuIciIcerikVar = false;

  const pushAktif = () => {
    if (aktif.length === 0) return;

    const gorunum = aktif.filter((item) => (
      !brailleAnlamOlcuCizgisiMi(item.anlam, item.hucre)
    ));

    if (gorunum.length > 0) {
      olculer.push(gorunum);
    }

    aktif = [];
    aktifOlcuIciIcerikVar = false;
  };

  (tumHucreler || []).forEach((hucre, i) => {
    const anlam = tumAnlamlar?.[i] || { tip: 'isaret', baslik: 'Müzik hücresi', etiket: '' };
    const sinir = brailleAnlamOlcuSiniriMi(anlam, hucre);
    const isBeginRepeat = brailleAnlamBeginRepeatMi(anlam);
    const isEndRepeat = brailleAnlamEndRepeatMi(anlam);
    const tekBasinaOlcu = brailleAnlamTekBasinaOlcuMu(anlam);

    aktif.push({
      hucre,
      anlam,
      index: i,
    });

    if (tekBasinaOlcu) {
      aktifOlcuIciIcerikVar = true;
      pushAktif();
      return;
    }

    if (isBeginRepeat) {
      if (!aktifOlcuIciIcerikVar) {
        aktifOlcuIciIcerikVar = true;
        return;
      }

      const beginRepeatItem = aktif.pop();
      pushAktif();
      aktif.push(beginRepeatItem);
      aktifOlcuIciIcerikVar = true;
      return;
    }

    if (!sinir && brailleAnlamOlcuIciIcerikMi(anlam)) {
      aktifOlcuIciIcerikVar = true;
    }

    if (sinir && aktifOlcuIcerikVar) {
      pushAktif();
    }
  });

  pushAktif();

  return olculer;
}
*/
