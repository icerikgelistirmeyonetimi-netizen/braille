import React, { useEffect, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import { konus, basariBildir, hataBildir, konusmayiDurdur } from '../utils/ses.js';

// Genel amaçlı çoklu kategori sınav bileşeni.
// kaynaklar şekli:
//   {
//     anahtar: {
//       etiket: 'Görünen ad',
//       kategori: 'sembol/işaret/...',
//       veri: [{ ad, ariaAd?, ipucu?, hucreler: number[][] }, ...]
//     }, ...
//   }
const HUCRE_ETIKET = ['birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'altıncı'];
const SORU_SAYISI = 10;

function karistir(dizi) {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

export default function CokluTest({ baslik, kaynaklar }) {
  const [kaynak, setKaynak] = useState(null);
  const [kaynakAnahtar, setKaynakAnahtar] = useState(null);
  const [sorular, setSorular] = useState([]);
  const [indeks, setIndeks] = useState(0);
  const [basilanlar, setBasilanlar] = useState([[]]);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [yanlis, setYanlis] = useState({ hucre: -1, noktalar: [] });
  const [puan, setPuan] = useState(0);
  const [hataSayisi, setHataSayisi] = useState(0);
  const [soruHata, setSoruHata] = useState(0);
  const [aciklandi, setAciklandi] = useState(false);
  const [bittimi, setBittimi] = useState(false);

  const aktif = sorular[indeks];
  const cokHucreli = aktif && aktif.hucreler.length > 1;

  const basla = (anahtar) => {
    const k = kaynaklar[anahtar];
    const veri = k.veri.filter((s) => Array.isArray(s.hucreler) && s.hucreler.length > 0);
    const seri = karistir(veri).slice(0, Math.min(SORU_SAYISI, veri.length));
    setKaynak(k);
    setKaynakAnahtar(anahtar);
    setSorular(seri);
    setIndeks(0);
    setBasilanlar(seri[0] ? seri[0].hucreler.map(() => []) : [[]]);
    setHucreIndeksi(0);
    setYanlis({ hucre: -1, noktalar: [] });
    setPuan(0);
    setHataSayisi(0);
    setSoruHata(0);
    setAciklandi(false);
    setBittimi(false);
  };

  useEffect(() => {
    if (!aktif || bittimi || aciklandi) return;
    const adi = aktif.ariaAd || aktif.ad;
    const hucreSayisi = aktif.hucreler.length;
    let metin;
    if (hucreSayisi === 1) {
      metin = `Soru ${indeks + 1}: ${adi}. Bu ${kaynak.kategori}ni oluşturan noktalara dokunun.`;
    } else {
      const sira = HUCRE_ETIKET[hucreIndeksi] || `${hucreIndeksi + 1}.`;
      if (hucreIndeksi === 0) {
        metin = `Soru ${indeks + 1}: ${adi}. ${hucreSayisi} hücreden oluşur. Önce ${sira} hücrenin noktalarına dokunun.`;
      } else {
        metin = `Şimdi ${sira} hücrenin noktalarına dokunun.`;
      }
    }
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, hucreIndeksi, aktif, bittimi, kaynak, aciklandi]);

  useEffect(() => () => konusmayiDurdur(), []);

  const sonrakiSoruyaGec = () => {
    if (indeks + 1 >= sorular.length) {
      setBittimi(true);
    } else {
      const sira = sorular[indeks + 1];
      setIndeks((i) => i + 1);
      setBasilanlar(sira.hucreler.map(() => []));
      setHucreIndeksi(0);
      setYanlis({ hucre: -1, noktalar: [] });
      setSoruHata(0);
      setAciklandi(false);
    }
  };

  const tikla = (hi, n) => {
    if (!aktif || bittimi || aciklandi) return;
    if (hi !== hucreIndeksi) {
      const sira = HUCRE_ETIKET[hucreIndeksi] || `${hucreIndeksi + 1}.`;
      hataBildir(`Önce ${sira} hücreyi tamamlayın.`);
      return;
    }
    const mevcut = basilanlar[hi] || [];
    if (mevcut.includes(n)) return;
    const beklenen = aktif.hucreler[hi];
    if (!beklenen.includes(n)) {
      setYanlis({ hucre: hi, noktalar: [n] });
      setHataSayisi((h) => h + 1);
      const yeniSoruHata = soruHata + 1;
      setSoruHata(yeniSoruHata);
      if (yeniSoruHata >= 3) {
        setAciklandi(true);
        setYanlis({ hucre: -1, noktalar: [] });
        setBasilanlar(aktif.hucreler.map((h) => [...h]));
        setHucreIndeksi(aktif.hucreler.length - 1);
        const ad = aktif.ariaAd || aktif.ad;
        const noktaMetin = aktif.hucreler
          .map((h, i) => `${HUCRE_ETIKET[i] || (i + 1) + '.'} hücre ${h.join(', ')}`)
          .join('; ');
        konus('Üç yanlış hak doldu.', { kesintiyle: true });
        setTimeout(() => {
          konus(`Doğru cevap: ${ad}. Noktalar: ${noktaMetin}.`, { kesintiyle: true });
        }, 900);
        setTimeout(sonrakiSoruyaGec, 4500);
        return;
      }
      hataBildir(`${n} numara yanlış.`);
      setTimeout(() => setYanlis({ hucre: -1, noktalar: [] }), 700);
      return;
    }
    const yeni = [...mevcut, n];
    const yeniBasilanlar = basilanlar.map((b, i) => (i === hi ? yeni : b));
    setBasilanlar(yeniBasilanlar);
    const hucreTamam = beklenen.every((x) => yeni.includes(x));
    if (hucreTamam) {
      const sonHucre = hi + 1 >= aktif.hucreler.length;
      if (sonHucre) {
        setPuan((p) => p + 1);
        const adi = aktif.ariaAd || aktif.ad;
        basariBildir(`Tebrikler! ${adi} doğru.`);
        setTimeout(sonrakiSoruyaGec, 1400);
      } else {
        const sira = HUCRE_ETIKET[hi + 1] || `${hi + 2}.`;
        konus(`Doğru. Şimdi ${sira} hücreye geçin.`);
        setTimeout(() => setHucreIndeksi(hi + 1), 400);
      }
    } else {
      const kalan = beklenen.filter((x) => !yeni.includes(x));
      konus(`Doğru. Sıradaki nokta: ${kalan[0]} numara.`);
    }
  };

  if (!kaynak) {
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <nav className="menu" aria-label="Test kategorileri" style={{ margin: 0, gap: 10 }}>
          {Object.entries(kaynaklar).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => basla(k)}
              aria-label={`${v.etiket} testini başlat`}
            >
              {v.etiket} Testi
            </button>
          ))}
        </nav>
      </div>
    );
  }

  if (bittimi) {
    const yuzde = Math.round((puan / sorular.length) * 100);
    return (
      <div className="page">
        <PageHeader baslik="Test Sonucu" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            <div style={{ fontSize: '1.2em', fontWeight: 800 }}>
              Puanınız: {puan} / {sorular.length}  ({yuzde}%)
            </div>
            <div>Toplam yanlış basma: {hataSayisi}</div>
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => basla(kaynakAnahtar)}>Tekrar Dene</button>
          <button type="button" onClick={() => { setKaynak(null); setKaynakAnahtar(null); }}>
            Kategori Değiştir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div>
        <PageHeader baslik={`Test: ${kaynak.etiket}`} />
        <div className="progress" aria-hidden="true">
          Soru {indeks + 1} / {sorular.length} • Doğru: {puan} • Yanlış: {hataSayisi}
        </div>
      </div>
      <div role="status" aria-live="polite" style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
      }}>
        Soru {indeks + 1} / {sorular.length}. {aktif.ariaAd || aktif.ad}.
      </div>

      <div className="page-mid">
        <div className={`cell-row ${aktif.hucreler.length >= 7 ? 'cok-hucre' : aktif.hucreler.length >= 4 ? 'cok-hucre-orta' : ''}`}>
          {aktif.hucreler.map((_, hi) => {
            const aktifHucreVurgu = cokHucreli && hi === hucreIndeksi
              ? { outline: '3px solid var(--accent)', borderRadius: 12, padding: 6 }
              : { padding: 6 };
            return (
              <div key={hi} style={aktifHucreVurgu}>
                <BrailleCell
                  baslik={hi === 0 ? aktif.ad : ''}
                  baslikAriaLabel={cokHucreli
                    ? `${HUCRE_ETIKET[hi] || (hi + 1) + '.'} hücre`
                    : (aktif.ariaAd || aktif.ad)}
                  tiklanabilir
                  onNoktaTikla={(n) => tikla(hi, n)}
                  dogruNoktalar={basilanlar[hi] || []}
                  yanlisNoktalar={yanlis.hucre === hi ? yanlis.noktalar : []}
                />
              </div>
            );
          })}
        </div>
        {aktif.ipucu && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em' }}>
            İpucu: {aktif.ipucu}
            {cokHucreli && ` (${aktif.hucreler.length} hücre)`}
          </div>
        )}
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => {
            const adi = aktif.ariaAd || aktif.ad;
            if (cokHucreli) {
              const sira = HUCRE_ETIKET[hucreIndeksi] || `${hucreIndeksi + 1}.`;
              konus(`${adi}. ${sira} hücrenin noktalarına dokunun.`, { kesintiyle: true });
            } else {
              konus(`${adi}. ${kaynak.kategori}ni oluşturan noktalara dokunun.`, { kesintiyle: true });
            }
          }}
        >
          Soruyu Tekrarla
        </button>
        <button type="button" onClick={sonrakiSoruyaGec}>Atla →</button>
      </div>
    </div>
  );
}
