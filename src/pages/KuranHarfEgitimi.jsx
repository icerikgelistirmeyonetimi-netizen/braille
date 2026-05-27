import React, { useCallback, useEffect, useState } from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import SesIzinEkrani from '../components/SesIzinEkrani.jsx';
import { KURAN_HARFLERI } from '../data/kuran.js';
import {
  kuranHarfSesIdAl,
  kuranHarfSesUrlAl,
  kuranSesCal,
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

  const harfSesiCal = useCallback((oge) => {
    const url = kuranHarfSesUrlAl(oge);

    console.log('KURAN HARF SES ISTEK', {
      oge,
      url,
    });

    if (!url) return;
    kuranSesCal(url, { volume: 0.95 });
  }, []);

  if (!sesIzniVar) {
    return (
      <SesIzinEkrani
        baslik="Kur'an Harf Eğitimi"
        aciklama="Bu etkinlikte harf ses kayıtları kullanılacak. Etkinliğe başlamadan önce sesi başlatmanız gerekir."
        butonMetni="Sesi Başlat ve Harf Eğitimine Geç"
        ilkSesUrl={kuranHarfSesUrlAl(ogeler[0])}
        onIzinVerildi={({ ilkSesCalindi: calindi } = {}) => {
          setIlkSesCalindi(Boolean(calindi));
          setSesIzniVar(true);
        }}
      />
    );
  }

  return (
    <DesenOgretici
      baslik="Kur'an: Harf Eğitimi"
      ogeler={ogeler}
      kategoriAdi="Arap harfi"
      bolumAnahtari="kuran-harfler"
      bittiMesaji="Tebrikler! Kur'an braillesi harflerini tamamladınız."
      rtl
      ogeSesiCal={harfSesiCal}
      ogeSesiOnceCal
      ogeSesiHerZaman
      ogeSesiSonrasiKonusmaGecikmeMs={1200}
      ilkOgeSesiHariciCalindi={ilkSesCalindi}
      sesKaydiButonuGoster
      sesKaydiButonEtiketi="Harf Sesini Dinle"
      okumaModundaSadeceOgeSesi
    />
  );
}
