import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { OZEL_ISARETLER } from '../data/braille.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

// ⚠ ÖRNEKLERİ YÜZEYE ÇIKAR (kullanıcı: "tarih ve rumuzlu ifade sayfaları örnek bakımından
// güncellenecekti, güncellenmemiş görünüyor"): Veri (braille.js) örnekleri İKİ kez
// güncellenmişti (23.4.1923 ailesi; TBMM/TDK/MEB/TÜBİTAK) ama sayfa isarettenOgeye'yi
// ekBilgi OLMADAN çağırdığından örnekler/kurallar HİÇ render edilmiyordu; tek örnek
// göstergesi altMetin (sembol) da aria-hidden → ekran okuyucuya tamamen kapalıydı.
// Fix (yalnız bu iki öğe): (1) ekBilgi paneli açılır (görsel + ekran okuyucu okur);
// (2) örnekler yönergeye (yonergeDetay) de eklenir — ekBilgi paneli yalnız İÇERİK
// DEĞİŞİNCE polite duyurulduğundan (öncesiz öğeden gelişte panel yeni mount olur ve
// okunmayabilir), garanti kanal sesli yönergedir. ⚠ Diğer öğelerde ekBilgi AÇILMAZ:
// biçim işaretlerinin örnekleri braille-ASCII glifleri içerir ("`Ali", "hOtello",
// "pa köşesi") → NVDA anlamsız okur (eski "anlamsız p h p" şikâyetinin aynı sınıfı).
const ORNEKLI_OGELER = new Set(['Tarih Yazma', 'Rumuzlu İfadeler']);
const OGELER = OZEL_ISARETLER.map((s) => {
  const ornekli = ORNEKLI_OGELER.has(s.ad);
  const oge = isarettenOgeye(s, { ekBilgi: ornekli });
  if (ornekli && s.ornekler?.length) {
    oge.yonergeDetay = `${oge.yonergeDetay || ''} Örnekler: ${s.ornekler.join(', ')}.`.trim();
  }
  return oge;
});

export default function OzelIsaretler() {
  return (
    <CokHucreOkuyucu
      baslik="Diğer Özel İşaretler"
      ogeler={OGELER}
      kategoriAdi="işareti"
      bolumAnahtari="ozel-isaretler"
      bittiMesaji="Tebrikler! Tüm özel işaretleri öğrendiniz."
    />
  );
}
