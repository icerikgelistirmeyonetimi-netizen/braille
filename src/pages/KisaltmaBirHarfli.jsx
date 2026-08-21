import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KELIME_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaBirHarfli() {
  // ⚠ EK KURALI (kullanıcı: "tek harfli kısaltmalarda kelimeye ek gelirse 3. nokta ile
  // ayrılma durumu ekran okuyucu ile öğrenilebilir olacaktı"): MEB kuralı — bir harfli
  // kısaltma ek aldığında kısaltma ile ek arasına 3. nokta (ayırma işareti) yazılır
  // (encoder'da uygulanır: "aynısı" → A + [3] + "sı"; brailleCevir.js
  // TEK_HARF_EK_AYIRMA_ISARETI). Yalnız DERS metni — encoder/decoder DEĞİŞMEDİ.
  // Kural 28 öğenin hepsinde geçerli olduğundan her öğenin yönergesine eklenir
  // (KisaltmaHece "ki" ekKural emsali). ⚠ İki harfli kısaltmaya KOPYALAMA — orada
  // ayırma işareti KONMAZ (ek doğrudan gelir: "bedeni" → bd + i).
  const ekKural = 'Kelime ek aldığında önce kısaltma, ardından ayırma işareti olan 3. nokta, sonra ekler yazılır.';
  const ogeler = KELIME_KISALTMALARI.map((k) => ({
    yazi: k.harf,
    ttsYazi: `${k.harf} harfi, ${k.kelime} kelimesi`,
    // Hızlı dolaşım kartı (yalnız ekran okuyucu/TTS): kart üzerinde tek harf görünür,
    // bu yüzden neyin kısaltması olduğu ve nasıl yazıldığı söylenir.
    // ⚠ Sonuna nokta koyma — kart etiketi ". " + nokta bilgisi ekliyor (çift nokta okunur).
    okumaAciklama: `"${k.kelime}" kelimesinin kısaltması, ${k.harf} harfi ile yazılır. Ek aldığında kısaltma ile ek arasına 3. nokta ayırma işareti konur`,
    okumaAltEtiket: k.kelime, // kartta harfin altında görünen açıklama

    hucreler: [k.noktalar],
    tamYonergeMetni: `${k.harf} harfi tek başına yazıldığında "${k.kelime}" kelimesi okunur. ${ekKural}`,
    altMetin: `"${k.kelime}"`,
    altMetinAciklama: `${k.harf} harfi tek başına yazıldığında veya kelimenin başında ek alarak kullanıldığında "${k.kelime}" okunur. ${ekKural}`,
  }));

  return (
    <CokHucreOkuyucu
      baslik="Bir Harfli Kısaltmalar"
      ogeler={ogeler}
      kategoriAdi="kısaltması"
      bolumAnahtari="kisaltma-bir-harfli"
      bittiMesaji="Tebrikler! Tüm bir harfli kısaltmaları öğrendiniz."
      noktalariSeslendir
    />
  );
}
