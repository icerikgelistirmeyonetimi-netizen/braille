// Ortak dönüştürücü: işaret veri nesnesi → CokHucreOkuyucu ögesi.
// secenekler.ekBilgi   — ekBilgi panelini doldur (kurallar/ornekler varsa)
// secenekler.okumaOzeti — aciklama yoksa s.okumaOzeti'ni kullan (yabancı dil sayfaları)
export function isarettenOgeye(s, { ekBilgi = false, okumaOzeti = false } = {}) {
  const hucreler = s.hucreler || [];
  const aciklama = okumaOzeti ? (s.aciklama || s.okumaOzeti) : s.aciklama;
  return {
    yazi: s.ad,
    altMetin: s.sembol && s.sembol !== '—' ? s.sembol : undefined,
    hucreler,
    ...(s.hucreBasliklari ? { hucreBasliklari: s.hucreBasliklari } : {}),
    yonergeDetay: aciklama || undefined,
    ...(ekBilgi && (aciklama || s.kurallar?.length || s.ornekler?.length)
      ? { ekBilgi: { aciklama, kurallar: s.kurallar, ornekler: s.ornekler } }
      : {}),
  };
}
