import React, { useCallback, useState } from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import SesIzinEkrani from '../components/SesIzinEkrani.jsx';
import { KURAN_HARFLERI } from '../data/kuran.js';
import { nlDan, dokunmaKapanisi } from '../utils/noktaYardimci.js';
import {
  kuranHarfSesIdAl,
  kuranHarfSesUrlAl,
  kuranSesCal,
  kuranSesiniDurdur,
} from '../utils/kuranSesHelpers.js';

export default function KuranHarfEgitimi() {
  const [sesIzniVar, setSesIzniVar] = useState(false);

  const ogeler = KURAN_HARFLERI.map((h) => ({
    yazi: h.harf,
    ttsYazi: `${h.ad} harfi`,
    harfAdi: h.ad,
    sesId: h.sesId ?? kuranHarfSesIdAl(h.ad),
    hucreler: [h.noktalar],
    aciklama: '',
    // ⚠ İKİ hata düzeltildi: (1) HARF ADI yoktu — `tamYonergeMetni` verildiğinde kategoriAdi
    // dalı çalışmaz, ad elle yazılmalı; kullanıcı hangi harfi yazdığını duymuyordu.
    // (2) "1, 2 numaralı noktalardan" biçimi §11'de YASAK; `nlDan` ile "1. ve 2. noktalardan"
    // (tüm modüllerle tutarlı, ekran okuyucu sıra sayısını doğru okur).
    tamYonergeMetni: `${h.ad} harfi, ${nlDan(h.noktalar)} oluşur. ${dokunmaKapanisi(h.noktalar)}`,
  }));

  const harfSesiCal = useCallback((oge, opts = {}) => {
    const url = kuranHarfSesUrlAl(oge);

    console.log('KURAN HARF SES ISTEK', { oge, url });

    if (!url) {
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
        onIzinVerildi={() => setSesIzniVar(true)}
      />
    );
  }

  // ⚠ bittiMesaji: "braillesi harflerini" ZİNCİRLİ İYELİK hatasıydı (iki ardışık iyelik eki,
  // tamlayan belirsiz). "Kur'an-ı Kerim braille harfleri" = sıfat tamlaması + tek iyelik.
  return (
    <CokHucreOkuyucu
      baslik="Kur'an-ı Kerim: Harf Eğitimi"
      ogeler={ogeler}
      kategoriAdi="Kur'an harfi"
      bolumAnahtari="kuran-harfler"
      bittiMesaji="Tebrikler! Kur'an-ı Kerim Braille harflerini tamamladınız."
      rtl
      ogeSesiCal={harfSesiCal}
      ogeSesiDurdur={kuranSesiniDurdur}
      ogeSesiOnceCal
      ogeSesiHerZaman
      ogeSesiSonrasiKonusmaGecikmeMs={1200}
      okumaModundaSadeceOgeSesi
    />
  );
}
