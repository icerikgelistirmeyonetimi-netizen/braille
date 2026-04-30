import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI
} from '../data/braille.js';
import { konus, basariBildir, hataBildir, konusmayiDurdur } from '../utils/ses.js';

// Modül 3 (Kısaltma Sistemi) Test/Sınav etkinliği.
// Modül 1'deki Test.jsx ile aynı mantıkta çalışır; tek farkı bazı
// kısaltmaların iki braille hücresinden oluşmasıdır. Kullanıcı önce
// soldaki hücrenin noktalarına, ardından sağdaki hücrenin noktalarına basar.

const KAYNAKLAR = {
  'bir-harfli': {
    etiket: 'Bir Harfli Kısaltmalar',
    kategori: 'kısaltma',
    veri: KELIME_KISALTMALARI.map((k) => ({
      ad: k.harf,
      ariaAd: `${k.harf} harfi, ${k.kelime} kelimesi`,
      ipucu: `“${k.kelime}” kelimesi`,
      hucreler: [k.noktalar]
    }))
  },
  'iki-harfli': {
    etiket: 'İki Harfli Kısaltmalar',
    kategori: 'kısaltma',
    veri: IKI_HARFLI_KISALTMALAR.map((k) => {
      const buyuk = k.harf.toLocaleUpperCase('tr');
      return {
        ad: buyuk,
        ariaAd: `${buyuk} kısaltması, ${k.kelime} kelimesi`,
        ipucu: `“${k.kelime}” kelimesi`,
        hucreler: [k.sol, k.sag]
      };
    })
  },
  'hece': {
    etiket: 'Hece Kısaltmaları',
    kategori: 'hece',
    veri: HECE_KISALTMALARI.map((h) => ({
      ad: h.hece,
      ariaAd: `${h.hece} hecesi`,
      ipucu: `“${h.hece}” hecesi`,
      hucreler: [h.noktalar]
    }))
  },
  'kelime-koku': {
    etiket: 'Kelime Kökü Kısaltmaları',
    kategori: 'kelime kökü kısaltması',
    veri: KELIME_KOKU_KISALTMALARI.map((k) => ({
      ad: k.etiket,
      ariaAd: `${k.etiket} kısaltması, ${k.kelime} kelime kökü`,
      ipucu: `“${k.kelime}” kelime kökü`,
      hucreler: [[5], k.sag]
    }))
  },
  'kelime-parcasi': {
    etiket: 'Kelime Parçası Kısaltmaları',
    kategori: 'kelime parçası kısaltması',
    veri: KELIME_PARCASI_KISALTMALARI.map((k) => ({
      ad: k.etiket,
      ariaAd: `${k.etiket} kısaltması, ${k.ekler} ekleri`,
      ipucu: `“${k.ekler}” ekleri`,
      hucreler: [k.sol, k.sag]
    }))
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

const HUCRE_ETIKET = ['birinci', 'ikinci', 'üçüncü', 'dördüncü'];

export default function TestKisaltma() {
  const [kaynak, setKaynak] = useState(null);
  const [kaynakAnahtar, setKaynakAnahtar] = useState(null);
  const [sorular, setSorular] = useState([]);
  const [indeks, setIndeks] = useState(0);
  // Her hücre için ayrı basılan noktalar dizisi.
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
    const k = KAYNAKLAR[anahtar];
    const seri = karistir(k.veri).slice(0, Math.min(SORU_SAYISI, k.veri.length));
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

  // Soru / hücre değiştiğinde sesli yönerge.
  useEffect(() => {
    if (!aktif || bittimi || aciklandi) return;
    const adi = aktif.ariaAd || aktif.ad;
    const hucreSayisi = aktif.hucreler.length;
    let metin;
    if (hucreSayisi === 1) {
      metin = `Soru ${indeks + 1}: ${adi}. Bu ${kaynak.kategori}sını oluşturan noktalara dokunun.`;
    } else {
      const sira = HUCRE_ETIKET[hucreIndeksi] || `${hucreIndeksi + 1}.`;
      if (hucreIndeksi === 0) {
        metin = `Soru ${indeks + 1}: ${adi}. Önce ${sira} hücrenin noktalarına dokunun.`;
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

  const tikla = (hi, n) => {
    if (!aktif || bittimi || aciklandi) return;
    if (hi !== hucreIndeksi) {
      // Sıra başka hücrede.
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
        // Tüm hücreleri doğru noktalarıyla doldur.
        setBasilanlar(aktif.hucreler.map((h) => [...h]));
        setHucreIndeksi(aktif.hucreler.length - 1);
        const ad = aktif.ariaAd || aktif.ad;
        const noktaMetin = aktif.hucreler
          .map((h, i) => `${HUCRE_ETIKET[i] || (i + 1) + '.'} hücre ${h.join(', ')}`)
          .join('; ');
        konus('Üç yanlış hak doldu.', { kesintiyle: true });
        setTimeout(() => {
          konus(`Doğru cevap: ${ad}. Noktalar: ${noktaMetin}.`,
            { kesintiyle: true });
        }, 900);
        setTimeout(() => {
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
        }, 4500);
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
        setTimeout(() => {
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
        }, 1400);
      } else {
        // Sonraki hücreye geç.
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
        <PageHeader baslik="Modül 3 Test / Sınav" />
        <nav className="menu" aria-label="Kısaltma test kategorileri" style={{ margin: 0, gap: 10 }}>
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
          <button type="button" onClick={() => basla(kaynakAnahtar)}>
            Tekrar Dene
          </button>
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
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
        }}
      >
        Soru {indeks + 1} / {sorular.length}. {aktif.ariaAd || aktif.ad}.
        {cokHucreli
          ? ` ${HUCRE_ETIKET[hucreIndeksi] || (hucreIndeksi + 1) + '.'} hücrenin noktalarına dokunun.`
          : ` ${kaynak.kategori}sını oluşturan noktalara dokunun.`}
      </div>

      <div className="page-mid">
        <div style={{
          display: 'flex',
          gap: 'var(--cell-gap)',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {aktif.hucreler.map((_, hi) => {
            const harfler = (aktif.ad || '').split('');
            const harf = harfler[hi] || '';
            const aktifHucreVurgu = cokHucreli && hi === hucreIndeksi
              ? { outline: '3px solid var(--accent)', borderRadius: 12, padding: 6 }
              : { padding: 6 };
            return (
              <div key={hi} style={aktifHucreVurgu}>
                <BrailleCell
                  baslik={cokHucreli ? harf : aktif.ad}
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
              konus(`${adi}. ${kaynak.kategori}sını oluşturan noktalara dokunun.`, { kesintiyle: true });
            }
          }}
        >
          Soruyu Tekrarla
        </button>
        <button
          type="button"
          onClick={() => {
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
          }}
        >
          Atla →
        </button>
      </div>
    </div>
  );
}
