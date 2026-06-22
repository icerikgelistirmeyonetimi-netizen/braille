import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import {
  KURAN_HARFLERI,
  KURAN_HAREKELERI,
  KURAN_TECVID,
  KURAN_HECELERI,
} from '../data/kuran.js';
import {
  kuranHarfSesIdAl,
  kuranHarfSesUrlAl,
  kuranHeceSesUrlAl,
  kuranSesCal,
  kuranSesiniDurdur,
} from '../utils/kuranSesHelpers.js';

// Modül 5 (Kur'an) Test/Sınav — ortak CokluTest bileşeni (klavye girişi + ses efekti +
// Perkins/mobil klavye). Harf ve hece kategorilerinde ses KAYDI işitsel ipucu olarak çalar;
// hareke/tecvid kategorilerinde ses kaydı yoktur.

const sadeceHucreliTecvid = KURAN_TECVID.filter(
  (t) => Array.isArray(t.hucreler) && t.hucreler.length > 0
);

const KAYNAKLAR = {
  harfler: {
    etiket: "Kur'an-ı Kerim Harfleri",
    kategori: "Kur'an harfi",
    veri: KURAN_HARFLERI.map((h) => ({
      ad: h.harf,
      ariaAd: `${h.ad} harfi`,
      ipucu: `${h.ad} (okunuşu: ${h.okunus})`,
      hucreler: [h.noktalar],
      sesId: h.sesId ?? kuranHarfSesIdAl(h.ad),
      harfAdi: h.ad,
    })),
  },
  harekeler: {
    etiket: 'Harekeler',
    kategori: 'hareke',
    veri: KURAN_HAREKELERI.map((h) => ({
      ad: h.isaret,
      ariaAd: `${h.ad} harekesi`,
      ipucu: `${h.ad} (${h.okunus})`,
      hucreler: [h.noktalar],
    })),
  },
  heceler: {
    etiket: 'Heceler',
    kategori: 'hece',
    veri: KURAN_HECELERI.map((h) => ({
      ad: h.yazi,
      ariaAd: `${h.okunus} hecesi`,
      ipucu: `${h.harf} + ${h.hareke} → "${h.okunus}"`,
      hucreler: h.hucreler,
      harf: h.harf,
      hareke: h.hareke,
    })),
  },
  tecvid: {
    etiket: 'Tecvid İşaretleri',
    kategori: 'tecvid işareti',
    veri: sadeceHucreliTecvid.map((t) => ({
      ad: t.sembol,
      ariaAd: t.ad,
      ipucu: t.ad,
      hucreler: t.hucreler,
    })),
  },
};

// Harf → harf sesi; hece → hece sesi; diğerlerinde ses yok.
const kuranTestSesiCal = (oge, opts = {}) => {
  let url = '';
  if (oge?.sesId) url = kuranHarfSesUrlAl(oge);
  else if (oge?.harf && oge?.hareke) url = kuranHeceSesUrlAl(oge);
  if (!url) { if (typeof opts.onEnded === 'function') opts.onEnded(); return; }
  kuranSesCal(url, { volume: 0.95, onEnded: opts.onEnded });
};

const kuranTestSesiVarMi = (oge) => !!(oge?.sesId || (oge?.harf && oge?.hareke));

const ILK_SES_URL = kuranHarfSesUrlAl({
  sesId: kuranHarfSesIdAl(KURAN_HARFLERI[0]?.ad || ''),
});

export default function TestKuran() {
  return (
    <CokluTest
      baslik="Modül 5 Test / Sınav"
      kaynaklar={KAYNAKLAR}
      ogeSesiCal={kuranTestSesiCal}
      ogeSesiDurdur={kuranSesiniDurdur}
      ogeSesiVarMi={kuranTestSesiVarMi}
      sesPrompt
      sesButonEtiketi="Sesi Dinle"
      sesIzin={{
        aciklama: 'Bu testte harf ve hece ses kayıtları işitsel ipucu olarak kullanılacak. Başlamadan önce sesi başlatmanız gerekir.',
        butonMetni: 'Sesi Başlat ve Teste Geç',
        ilkSesUrl: ILK_SES_URL,
      }}
    />
  );
}
