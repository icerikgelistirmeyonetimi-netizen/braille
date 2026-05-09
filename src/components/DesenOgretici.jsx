import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrailleCell from './BrailleCell.jsx';
import PageHeader from './PageHeader.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { ogrenildiIsaretle, indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';
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
export default function DesenOgretici({ baslik, ogeler, kategoriAdi, bolumAnahtari, bittiMesaji, rtl }) {
  const [indeks, setIndeks] = useState(() => {
    const kaydedilen = indeksAl(bolumAnahtari);
    return kaydedilen < ogeler.length ? kaydedilen : 0;
  });
  const [basilanlar, setBasilanlar] = useState([]); // doğru basılmışlar
  const [yanlis, setYanlis] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const tebriklerAktif = useRef(false);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? ogeler.filter((o) => kayitliAdlar.includes(o.ad))
    : ogeler;

  const aktifOge = aktifListe[indeks];
  const bitti = indeks >= aktifListe.length;

  // Nerede kaldıysa kaydet (kayıtlılar modunda kaydetme)
  useEffect(() => {
    if (bolumAnahtari && !kayitlilarModu) indeksKaydet(bolumAnahtari, indeks);
  }, [indeks, bolumAnahtari, kayitlilarModu]);

  const gosterToast = (mesaj) => {
    clearTimeout(toastTimerRef.current);
    setToast(mesaj);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  const modDegistir = (kayitlilar) => {
    setKayitlilarModu(kayitlilar);
    setIndeks(0);
    setBasilanlar([]);
    setYanlis([]);
  };

  const kaydetSonra = () => {
    if (bitti || !aktifOge) return;
    const kaydedildi = sonraOgrenAl(anahtar).includes(aktifOge.ad);
    if (kaydedildi) {
      sonraOgrenKaldir(anahtar, aktifOge.ad);
      konus('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, aktifOge.ad);
      konus('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

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
    const oge = aktifListe[indeks];
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
  }, [indeks, kayitlilarModu]);

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
            {kayitlilarModu && aktifListe.length === 0
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : (bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!')}
          </div>
        </div>
        <div className="controls">
          {kayitlilarModu
            ? <button type="button" onClick={() => modDegistir(false)}>Tüm Listeye Dön</button>
            : <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>}
        </div>
      </div>
    );
  }

  const noktayaTikla = (n) => {
    if (basilanlar.includes(n)) return;
    const beklenenSiradaki = aktifOge.noktalar[basilanlar.length];
    if (n !== beklenenSiradaki) {
      setYanlis([n]);
      hataBildir(aktifOge.noktalar.includes(n) ? `Sıra yanlış. Önce ${beklenenSiradaki} numaraya basın.` : `${n} numara yanlış. Tekrar deneyin.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    const tamamMi = yeni.length === aktifOge.noktalar.length;
    if (tamamMi) {
      if (bolumAnahtari) ogrenildiIsaretle(bolumAnahtari, aktifOge.ad);
      konusmayiDurdur();
      tebriklerAktif.current = true;
      basariBildir('Tebrikler!');
      setTimeout(() => setIndeks((i) => i + 1), 800);
    } else {
      konus(`Doğru. Sıradaki nokta: ${aktifOge.noktalar[yeni.length]} numara.`);
    }
  };

  return (
    <div className="page">
      {toast && <div className="toast" aria-live="assertive">{toast}</div>}
      <div>
        {baslik && <PageHeader baslik={baslik} />}
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {aktifListe.length}
        </div>
        {kayitliSayisi > 0 && (
          <div className="banner-grup-secim" style={{ margin: '4px 0 0' }}>
            <button type="button" className={!kayitlilarModu ? 'aktif' : ''} aria-pressed={!kayitlilarModu} onClick={() => modDegistir(false)}>Tümü</button>
            <button type="button" className={kayitlilarModu ? 'aktif' : ''} aria-pressed={kayitlilarModu} onClick={() => modDegistir(true)}>Kayıtlılar ({kayitliSayisi})</button>
          </div>
        )}
      </div>

      <div className="page-mid">
        <button
          type="button"
          className={`sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(aktifOge?.ad) ? ' kaydedildi' : ''}`}
          onClick={kaydetSonra}
          aria-label="Daha sonra öğren listesine kaydet"
          title="Daha sonra öğren"
          style={{ alignSelf: 'flex-end' }}
        >
          <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
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
          baslikStyle={rtl ? { fontFamily: "'Amasya', serif", direction: 'rtl' } : undefined}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button
          type="button"
          aria-label="Sıfırla"
          onClick={() => {
            setBasilanlar([]);
            setYanlis([]);
            konus('Tekrar deneyelim.');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          <span className="btn-etiket">Sıfırla</span>
        </button>
        <button
          type="button"
          onClick={() => setIndeks((i) => Math.min(i + 1, aktifListe.length))}
          aria-label="Bu öğeyi atla"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          <span className="btn-etiket">Atla</span>
        </button>
      </div>
    </div>
  );
}
