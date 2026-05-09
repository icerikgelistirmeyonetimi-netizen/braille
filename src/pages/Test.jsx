import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { HARFLER, RAKAMLAR, NOKTALAMA } from '../data/braille.js';
import { konus, basariBildir, hataBildir } from '../utils/ses.js';

const KAYNAKLAR = {
  harfler: {
    etiket: 'Harfler',
    veri: HARFLER.map((h) => ({ ad: h.harf, ariaAd: `${h.harf} `, noktalar: h.noktalar })),
    kategori: 'harf'
  },
  rakamlar: {
    etiket: 'Rakamlar',
    veri: RAKAMLAR.map((r) => ({ ad: r.rakam, ariaAd: `${r.rakam} `, noktalar: r.noktalar })),
    kategori: 'rakam'
  },
  noktalama: {
    etiket: 'Noktalama',
    veri: NOKTALAMA.map((n) => ({ ad: n.isaret, ariaAd: n.isim, noktalar: n.noktalar })),
    kategori: 'işaret'
  }
};

const SORU_SAYISI = 10;

function karistir(dizi) {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

export default function Test() {
  const [kaynak, setKaynak] = useState(null);
  const [sorular, setSorular] = useState([]);
  const [indeks, setIndeks] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]);
  const [yanlis, setYanlis] = useState([]);
  const [puan, setPuan] = useState(0);
  const [hataSayisi, setHataSayisi] = useState(0);
  const [soruHata, setSoruHata] = useState(0);
  const [aciklandi, setAciklandi] = useState(false);
  const [bittimi, setBittimi] = useState(false);

  const aktif = sorular[indeks];

  const basla = (anahtar) => {
    const k = KAYNAKLAR[anahtar];
    const seri = karistir(k.veri).slice(0, Math.min(SORU_SAYISI, k.veri.length));
    setKaynak(k);
    setSorular(seri);
    setIndeks(0);
    setBasilanlar([]);
    setYanlis([]);
    setPuan(0);
    setHataSayisi(0);
    setSoruHata(0);
    setAciklandi(false);
    setBittimi(false);
  };

  useEffect(() => {
    if (!aktif || bittimi || aciklandi) return;
    const metin = `Soru ${indeks + 1}: ${aktif.ariaAd || aktif.ad} ${kaynak.kategori}ini oluşturan noktalara dokunun.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, aktif, bittimi, kaynak, aciklandi]);

  const sonrakiSoruyaGec = () => {
    if (indeks + 1 >= sorular.length) {
      setBittimi(true);
    } else {
      setIndeks((i) => i + 1);
      setBasilanlar([]);
      setYanlis([]);
      setSoruHata(0);
      setAciklandi(false);
    }
  };

  const cevapSoyle = () => {
    if (!aktif || aciklandi) return;
    setAciklandi(true);
    setYanlis([]);
    setBasilanlar(aktif.noktalar);
    const ad = aktif.ariaAd || aktif.ad;
    const noktaListesi = aktif.noktalar.join(', ');
    konus(`Doğru cevap: ${ad}. Noktaları: ${noktaListesi}.`, {
      kesintiyle: true,
      onSon: () => setTimeout(sonrakiSoruyaGec, 700)
    });
  };

  const tikla = (n) => {
    if (!aktif || bittimi || aciklandi) return;
    if (basilanlar.includes(n)) return;
    if (n !== aktif.noktalar[basilanlar.length]) {
      setYanlis([n]);
      setHataSayisi((h) => h + 1);
      const yeniSoruHata = soruHata + 1;
      setSoruHata(yeniSoruHata);
      konus(`${n} yanlış`, { kesintiyle: true });
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    const tamam = yeni.length === aktif.noktalar.length;
    if (tamam) {
      setPuan((p) => p + 1);
      const ad = aktif.ariaAd || aktif.ad;
      konus(`${n} doğru. Tebrikler! ${ad} doğru.`, { kesintiyle: true });
      setTimeout(sonrakiSoruyaGec, 3000);
    } else {
      konus(`${n} doğru`, { kesintiyle: true });
    }
  };

  if (!kaynak) {
    return (
      <div className="page">
        <PageHeader baslik="Test Modu" />
        <nav className="menu" aria-label="Test kategorileri" style={{ margin: 0, gap: 10 }}>
          {Object.entries(KAYNAKLAR).map(([k, v]) => (
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
          <button type="button" onClick={() => basla(Object.keys(KAYNAKLAR).find((k) => KAYNAKLAR[k] === kaynak))}>
            Tekrar Dene
          </button>
          <button type="button" onClick={() => setKaynak(null)}>
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
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
        }}
      >
        Soru {indeks + 1} / {sorular.length}. {aktif.ariaAd || aktif.ad} {kaynak.kategori}ini oluşturan noktalara dokunun.
      </div>

      <div className="page-mid">
        <BrailleCell
          baslik={aktif.ad}
          baslikAriaLabel={aktif.ariaAd || aktif.ad}
          tiklanabilir={!aciklandi}
          kesfedilebilir={!aciklandi}
          onNoktaTikla={tikla}
          dogruNoktalar={basilanlar}
          yanlisNoktalar={yanlis}
        />
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() =>
            konus(
              `${aktif.ariaAd || aktif.ad} ${kaynak.kategori}ini oluşturan noktalara dokunun.`
            )
          }
        >
          Soruyu Tekrarla
        </button>
        <button type="button" onClick={cevapSoyle} disabled={aciklandi}>
          Cevabı Söyle
        </button>
        <button type="button" onClick={sonrakiSoruyaGec}>
          Atla →
        </button>
      </div>
    </div>
  );
}
