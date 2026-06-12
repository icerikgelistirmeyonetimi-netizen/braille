import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { HECE_KISALTMALARI } from '../data/braille.js';

const SON_KULLANILAMAZ = ['ba', 'be', 'bu', 'ka', 'ha', 'ki'];

export default function KisaltmaHece() {
  const ogeler = HECE_KISALTMALARI.map((k) => {
    const kisitli = SON_KULLANILAMAZ.includes(k.hece);
    return {
      yazi: k.hece,
      ttsYazi: kisitli
        ? `${k.hece} hecesi, kelime sonunda kullanılamaz`
        : `${k.hece} hecesi`,
      hucreler: [k.noktalar],
      tamYonergeMetni: kisitli
        ? `"${k.hece}" hecesi. Bu hece kelimenin sonunda kullanılamaz.`
        : `"${k.hece}" hecesi.`,
      altMetinAciklama: kisitli
        ? `Bu sembol "${k.hece}" hecesini ifade eder. Kelimenin sonunda kullanılamaz.`
        : `Bu sembol "${k.hece}" hecesini ifade eder.`,
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
