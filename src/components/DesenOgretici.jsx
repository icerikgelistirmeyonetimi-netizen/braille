import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrailleCell from './BrailleCell.jsx';
import PageHeader from './PageHeader.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { ogrenildiIsaretle } from '../utils/ilerleme.js';
import { deseniGonder, deseniTemizle } from '../utils/arduino.js';

/**
 * Bir Braille deseni (örn. bir harf) öğretmek için ortak ekran.
 *
 * Props:
 *  - baslik: string  (sayfa başlığı)
 *  - ogeler: { ad, ariaAd?, noktalar }[]
 *  - kategoriAdi: string
 *  - bolumAnahtari?: string
 *  - bittiMesaji?: string
 */
export default function DesenOgretici({ baslik, ogeler, kategoriAdi, bolumAnahtari, bittiMesaji }) {
  const [indeks, setIndeks] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]); // doğru basılmışlar
  const [yanlis, setYanlis] = useState([]);
  const tebriklerAktif = useRef(false);

  const aktifOge = ogeler[indeks];
  const bitti = indeks >= ogeler.length;

  const yonergeMetni = useMemo(() => {
    if (bitti) return bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!';
    const kalan = aktifOge.noktalar.filter((n) => !basilanlar.includes(n));
    if (kalan.length === aktifOge.noktalar.length) {
      const noktaListesi = aktifOge.noktalar.join(', ');
      const ad = aktifOge.ariaAd || aktifOge.ad;
      const ek = aktifOge.aciklama ? ` ${aktifOge.aciklama}` : '';
      return `${ad} ${kategoriAdi}, ${noktaListesi} numaralı noktalardan oluşur.${ek} Lütfen bu noktalara sırayla dokunun.`;
    }
    return `Sıradaki nokta: ${kalan[0]} numara.`;
  }, [aktifOge, basilanlar, bitti, bittiMesaji, kategoriAdi]);

  useEffect(() => {
    // Yeni öğeye geçişte intro'yu seslendir.
    if (bitti) {
      konus(bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!');
      return;
    }
    const oge = ogeler[indeks];
    const ad = oge.ariaAd || oge.ad;
    const noktaListesi = oge.noktalar.join(', ');
    const ek = oge.aciklama ? ` ${oge.aciklama}` : '';
    const giris = `${ad} ${kategoriAdi}, ${noktaListesi} numaralı noktalardan oluşur. Lütfen bu noktalara sırayla dokunun.${ek}`;
    const gecikme = tebriklerAktif.current ? 1100 : 250;
    const t = setTimeout(() => {
      tebriklerAktif.current = false;
      konus(giris, { kesintiyle: false });
    }, gecikme);

    // Telefon sallanınca yönergeyi tekrar oku
    const tekrar = () => {
      tebriklerAktif.current = false;
      konus(giris, { kesintiyle: true });
    };
    window.addEventListener('yonergeTekrar', tekrar);

    return () => {
      clearTimeout(t);
      window.removeEventListener('yonergeTekrar', tekrar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks]);

  // Yeni öğe geldiğinde durumu sıfırla
  useEffect(() => {
    setBasilanlar([]);
    setYanlis([]);
  }, [indeks]);

  // Ekrandaki desen değiştikçe Arduino'ya gönder (bağlı değilse sessizce yok sayılır).
  useEffect(() => {
    if (bitti) {
      deseniTemizle();
      return;
    }
    if (aktifOge && aktifOge.noktalar) {
      deseniGonder(aktifOge.noktalar);
    }
    return () => { deseniTemizle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, bitti]);

  if (bitti) {
    return (
      <div className="page">
        {baslik && <PageHeader baslik={baslik} />}
        <div className="page-mid">
          <div className="instruction success" role="status" aria-live="polite">
            {bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!'}
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const noktayaTikla = (n) => {
    if (basilanlar.includes(n)) return;
    const dogruMu = aktifOge.noktalar.includes(n);
    if (!dogruMu) {
      setYanlis([n]);
      hataBildir(`${n} numara yanlış. Tekrar deneyin.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    const tamamMi = aktifOge.noktalar.every((x) => yeni.includes(x));
    if (tamamMi) {
      if (bolumAnahtari) ogrenildiIsaretle(bolumAnahtari, aktifOge.ad);
      konusmayiDurdur();
      tebriklerAktif.current = true;
      basariBildir('Tebrikler!');
      setTimeout(() => setIndeks((i) => i + 1), 800);
    } else {
      const kalan = aktifOge.noktalar.filter((x) => !yeni.includes(x));
      konus(`Doğru. Sıradaki nokta: ${kalan[0]} numara.`);
    }
  };

  return (
    <div className="page">
      <div>
        {baslik && <PageHeader baslik={baslik} />}
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {ogeler.length}
        </div>
      </div>

      <div className="page-mid">
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0
          }}
        >
          {yonergeMetni}
        </div>
        <BrailleCell
          baslik={aktifOge.ad}
          baslikAriaLabel={aktifOge.ariaAd || aktifOge.ad}
          tiklanabilir
          onNoktaTikla={noktayaTikla}
          hedefNoktalar={aktifOge.noktalar}
          dogruNoktalar={basilanlar}
          yanlisNoktalar={yanlis}
        />
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(yonergeMetni)}
          aria-label="Yönergeyi tekrar dinle"
        >
          Yönergeyi Tekrarla
        </button>
        <button
          type="button"
          onClick={() => {
            setBasilanlar([]);
            setYanlis([]);
            konus('Tekrar deneyelim.');
          }}
        >
          Sıfırla
        </button>
        <button
          type="button"
          onClick={() => setIndeks((i) => Math.min(i + 1, ogeler.length))}
          aria-label="Bu öğeyi atla"
        >
          Atla →
        </button>
      </div>
    </div>
  );
}
