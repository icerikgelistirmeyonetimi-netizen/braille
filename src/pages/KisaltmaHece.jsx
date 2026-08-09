import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { HECE_KISALTMALARI } from '../data/braille.js';

// Kelime sonunda kullanılamayan heceler. ⚠ "ki" BURADA DEĞİL — kelimenin başında,
// ortasında ve sonunda kullanılır (kullanıcı düzeltmesi).
const SON_KULLANILAMAZ = ['ba', 'be', 'bu', 'ka', 'ha'];

export default function KisaltmaHece() {
  const ogeler = HECE_KISALTMALARI.map((k) => {
    const kisitli = SON_KULLANILAMAZ.includes(k.hece);
    // "ki" bağlaç olarak tek başına yazılıp ardından noktalama işareti
    // geldiğinde kısaltma kullanılmaz (kullanıcı isteği).
    const ekKural = k.hece === 'ki'
      ? ' Tek başına olup da sonunda noktalama işareti olursa kısaltılmaz.'
      : '';
    return {
      yazi: k.hece,
      ttsYazi: kisitli
        ? `${k.hece} hecesi, kelime sonunda kullanılamaz`
        : `${k.hece} hecesi`,
      // Hızlı dolaşım kartı (yalnız ekran okuyucu/TTS) — kullanım kuralı da söylenir.
      // ⚠ Sonuna nokta KOYMA: kart etiketi bunu "…. {nokta bilgisi}" ile birleştiriyor
      // (nokta koyulursa "kullanılamaz.." gibi çift nokta okunur).
      okumaAltEtiket: 'hece kısaltması', // kartta hecenin altında görünen açıklama
      okumaAciklama: `"${k.hece}" hece kısaltması, tek hücre ile yazılır`
        + (kisitli ? '. Kelimenin sonunda kullanılamaz' : '')
        + (ekKural ? ekKural.replace(/\s*\.\s*$/, '') : ''),
      hucreler: [k.noktalar],
      tamYonergeMetni: (kisitli
        ? `"${k.hece}" hecesi. Bu hece kelimenin sonunda kullanılamaz.`
        : `"${k.hece}" hecesi. Kelimenin başında, ortasında ve sonunda kullanılır.`) + ekKural,
      altMetinAciklama: (kisitli
        ? `Bu sembol "${k.hece}" hecesini ifade eder. Kelimenin sonunda kullanılamaz.`
        : `Bu sembol "${k.hece}" hecesini ifade eder. Kelimenin başında, ortasında ve sonunda kullanılır.`) + ekKural,
    };
  });

  return (
    <CokHucreOkuyucu
      baslik="Hece Kısaltmaları"
      ogeler={ogeler}
      kategoriAdi="hecesi"
      bolumAnahtari="kisaltma-hece"
      bittiMesaji="Tebrikler! Tüm hece kısaltmalarını öğrendiniz."
      noktalariSeslendir
    />
  );
}
