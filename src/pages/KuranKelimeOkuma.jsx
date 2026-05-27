import React, { useCallback, useEffect, useState } from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import SesIzinEkrani from '../components/SesIzinEkrani.jsx';
import { KURAN_HECELERI, KURAN_KELIMELERI, KURAN_KELIMELERI_TEMEL } from '../data/kuran.js';
import {
  kuranHeceSesUrlAl,
  kuranKelimeOkuma1SesUrlAl,
  kuranSesCal,
  kuranSesleriPreloadEt,
} from '../utils/kuranSesHelpers.js';

// Kur'an braillesinde harf + hareke ardı ardına ayrı hücreler olarak yazılır.
// Bu sayfa, tek hücre adımlama modunda (mobilde de net okunan) her kelimenin
// braille hücrelerini sırayla gösterir.
const KAYNAKLAR = {
  hece: {
    etiket: 'Hece Okuma',
    bittiMesaji: 'Tebrikler! Tüm heceleri okudunuz.',
    veri: KURAN_HECELERI.map((h) => ({
      yazi: h.yazi,
      okunus: h.okunus,
      harf: h.harf,
      hareke: h.hareke,
      hucreler: h.hucreler,
    }))
  },
  'kelime-temel': {
    etiket: 'Kelime Okuma — Bölüm 1',
    bittiMesaji: 'Tebrikler! Temel kelime okuma bölümünü tamamladınız.',
    veri: KURAN_KELIMELERI_TEMEL.map((kw) => ({
      yazi: kw.yazi,
      okunus: kw.okunus,
      anlam: kw.anlam,
      hucreler: kw.hucreler,
      sesId: kw.sesId,
    }))
  },
  kelime: {
    etiket: 'Kelime Okuma — Bölüm 2',
    bittiMesaji: 'Tebrikler! Geniş kelime okuma listesini tamamladınız.',
    veri: KURAN_KELIMELERI.map((k) => ({
      yazi: k.yazi,
      okunus: k.okunus,
      anlam: k.anlam,
      hucreler: k.hucreler,
      sesId: k.sesId,
    }))
  }
};

export default function KuranKelimeOkuma({ kaynakAnahtari = 'hece', baslik }) {
  const [sesIzniVar, setSesIzniVar] = useState(false);
  const [ilkSesCalindi, setIlkSesCalindi] = useState(false);
  const kaynak = KAYNAKLAR[kaynakAnahtari] || KAYNAKLAR.hece;
  const ogeler = kaynak.veri;
  const sesliSayfa = kaynakAnahtari === 'hece' || kaynakAnahtari === 'kelime-temel';

  const ilkSesUrl = sesliSayfa
    ? kaynakAnahtari === 'hece'
      ? kuranHeceSesUrlAl(ogeler[0])
      : kuranKelimeOkuma1SesUrlAl(ogeler[0])
    : '';

  useEffect(() => {
    if (!sesliSayfa) return;

    const urls = ogeler.map((oge) => (
      kaynakAnahtari === 'hece'
        ? kuranHeceSesUrlAl(oge)
        : kuranKelimeOkuma1SesUrlAl(oge)
    ));

    kuranSesleriPreloadEt(urls);
  }, [ogeler, kaynakAnahtari, sesliSayfa]);

  const kelimeSesiCal = useCallback((oge) => {
    if (kaynakAnahtari === 'hece') {
      const url = kuranHeceSesUrlAl(oge);
      if (url) kuranSesCal(url, { volume: 0.95 });
      return;
    }

    if (kaynakAnahtari === 'kelime-temel') {
      const url = kuranKelimeOkuma1SesUrlAl(oge);
      if (url) kuranSesCal(url, { volume: 0.95 });
      return;
    }
  }, [kaynakAnahtari]);

  if (sesliSayfa && !sesIzniVar) {
    return (
      <SesIzinEkrani
        baslik={kaynakAnahtari === 'hece' ? 'Kur’an Hece Okuma' : 'Kur’an Kelime Okuma 1'}
        aciklama="Bu etkinlikte ses kayıtları kullanılacak. Etkinliğe başlamadan önce sesi başlatmanız gerekir."
        butonMetni="Sesi Başlat ve Etkinliğe Geç"
        ilkSesUrl={ilkSesUrl}
        onIzinVerildi={({ ilkSesCalindi: calindi } = {}) => {
          setIlkSesCalindi(Boolean(calindi));
          setSesIzniVar(true);
        }}
      />
    );
  }

  return (
    <CokHucreOkuyucu
      baslik={baslik || kaynak.etiket}
      ogeler={ogeler}
      bittiMesaji={kaynak.bittiMesaji}
      rtl
      bolumAnahtari={`kuran-kelime-${kaynakAnahtari}`}
      ogeSesiCal={sesliSayfa ? kelimeSesiCal : undefined}
      ogeSesiOnceCal={sesliSayfa}
      ogeSesiHerZaman={sesliSayfa}
      ogeSesiSonrasiKonusmaGecikmeMs={1200}
      ilkOgeSesiHariciCalindi={ilkSesCalindi}
      sesKaydiButonuGoster={sesliSayfa}
      sesKaydiButonEtiketi={kaynakAnahtari === 'hece' ? 'Hece Sesini Dinle' : 'Kelime Sesini Dinle'}
      okumaModundaSadeceOgeSesi={sesliSayfa}
      sadeceHucreYonergesiOku={sesliSayfa}
    />
  );
}
