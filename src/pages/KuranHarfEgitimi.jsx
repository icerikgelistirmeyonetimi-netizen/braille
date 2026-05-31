import React, { useCallback, useEffect, useState } from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import SesIzinEkrani from '../components/SesIzinEkrani.jsx';
import { KURAN_HARFLERI } from '../data/kuran.js';
import {
  kuranHarfSesIdAl,
  kuranHarfSesUrlAl,
  kuranSesCal,
  kuranSesiniDurdur,
  kuranSesleriPreloadEt,
} from '../utils/kuranSesHelpers.js';

export default function KuranHarfEgitimi() {
  const [sesIzniVar, setSesIzniVar] = useState(false);
  const [ilkSesCalindi, setIlkSesCalindi] = useState(false);

  const ogeler = KURAN_HARFLERI.map((h) => ({
    ad: h.harf,
    ariaAd: `${h.ad} harfi`,
    harfAdi: h.ad,
    sesId: kuranHarfSesIdAl(h.ad),
    noktalar: h.noktalar,
    aciklama: '',
    tamYonergeMetni: `${h.noktalar.join(', ')} numaralı noktalardan oluşur. Lütfen numaralara sırayla dokunun.`,
  }));

  const harfSesiCal = useCallback((oge, opts = {}) => {
    const url = kuranHarfSesUrlAl(oge);

    console.log('KURAN HARF SES ISTEK', {
      oge,
      url,
    });

    if (!url) {
      // Ses yoksa bitiş callback'ini yine de tetikle (Braille okuması beklemede kalmasın)
      if (typeof opts.onEnded === 'function') opts.onEnded();
      return;
    }
    kuranSesCal(url, { volume: 0.95, onEnded: opts.onEnded });
  }, []);

  if (!sesIzniVar) {
    return (
      <SesIzinEkrani
        baslik="Kur'an-ı Kerim Harf Eğitimi"
        aciklama="Bu etkinlikte harf ses kayıtları kullanılacak. Etkinliğe başlamadan önce sesi başlatmanız gerekir."
        butonMetni="Sesi Başlat ve Harf Eğitimine Geç"
        ilkSesUrl={kuranHarfSesUrlAl(ogeler[0])}
        sessizBaslat
        onIzinVerildi={({ ilkSesCalindi: calindi } = {}) => {
          setIlkSesCalindi(Boolean(calindi));
          setSesIzniVar(true);
        }}
      />
    );
  }

  return (
    <DesenOgretici
      baslik="Kur'an-ı Kerim: Harf Eğitimi"
      ogeler={ogeler}
      kategoriAdi="Arap harfi"
      bolumAnahtari="kuran-harfler"
      bittiMesaji="Tebrikler! Kur'an-ı Kerim braillesi harflerini tamamladınız."
      rtl
      ogeSesiCal={harfSesiCal}
      ogeSesiDurdur={kuranSesiniDurdur}
      ogeSesiOnceCal
      ogeSesiHerZaman
      ogeSesiSonrasiKonusmaGecikmeMs={1200}
      ilkOgeSesiHariciCalindi={ilkSesCalindi}
okumaModundaSadeceOgeSesi
    />
  );
}
