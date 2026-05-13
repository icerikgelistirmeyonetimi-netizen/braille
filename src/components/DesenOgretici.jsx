import React, { useEffect, useMemo, useRef, useState } from 'react';
import BrailleCell from './BrailleCell.jsx';
import PageHeader from './PageHeader.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { ogrenildiIsaretle, indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';
import { deseniGonder, deseniTemizle, satiriGonder } from '../utils/arduino.js';

/**
 * Bir Braille deseni (örn. bir harf) öğretmek için ortak ekran.
 *
 * Props:
 *  - baslik: string  (sayfa başlığı)
 *  - ogeler: { ad, ariaAd?, noktalar, hucreler?, hucreBasliklari?, hucreAriaEtiketleri?, hucreAdlari?, yonergeDetay? }[]
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
  const [okumaModu, setOkumaModu] = useState(false);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? ogeler.filter((o) => kayitliAdlar.includes(o.ad))
    : ogeler;

  const aktifOge = aktifListe[indeks];
  const bitti = indeks >= aktifListe.length;
  const aktifHucreler = useMemo(() => {
    if (!aktifOge) return [];
    if (Array.isArray(aktifOge.hucreler) && aktifOge.hucreler.length > 0) return aktifOge.hucreler;
    return [aktifOge.noktalar || []];
  }, [aktifOge]);
  const cokHucreli = aktifHucreler.length > 1;
  const aktifAdimlar = useMemo(() => aktifHucreler.flatMap((noktalar, hucreIndex) =>
    (noktalar || []).map((n) => ({
      hucreIndex,
      n,
      key: `${hucreIndex}:${n}`
    }))
  ), [aktifHucreler]);

  const hucreAdi = (hucreIndex) =>
    aktifOge?.hucreAdlari?.[hucreIndex] || (cokHucreli ? `${hucreIndex + 1}. hücre` : 'hücre');
  const adimMetni = (adim) => {
    if (!adim || adim.n === undefined || adim.n === null) return 'sıradaki nokta';
    return cokHucreli
      ? `${hucreAdi(adim.hucreIndex)} ${adim.n} numara`
      : `${adim.n} numara`;
  };

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

  const okumaModunaGec = () => {
    konusmayiDurdur();
    setOkumaModu(true);
  };

  const okumaOgesiSec = (orijinalIndeks) => {
    setKayitlilarModu(false);
    setIndeks(orijinalIndeks);
    setBasilanlar([]);
    setYanlis([]);
    setOkumaModu(false);
  };

  const yonergeMetni = useMemo(() => {
    if (bitti) return bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!';
    const kalan = aktifAdimlar.filter((adim) => !basilanlar.includes(adim.key));
    if (kalan.length === aktifAdimlar.length) {
      const ad = aktifOge.ariaAd || aktifOge.ad;
      const ek = aktifOge.aciklama ? ` ${aktifOge.aciklama}` : '';
      const detay = aktifOge.yonergeDetay || `${(aktifOge.noktalar || []).join(', ')} numaralı noktalardan oluşur.`;
      return `${ad} ${kategoriAdi}, ${detay}${ek} Lütfen bu noktalara sırayla dokunun.`;
    }
    if (kalan.length === 0) {
      return 'Tamamlandı. Bir sonraki öğeye geçiliyor.';
    }
    return `Sıradaki nokta: ${adimMetni(kalan[0])}.`;
  }, [aktifAdimlar, aktifOge, basilanlar, bitti, bittiMesaji, kategoriAdi]);

  useEffect(() => {
    // Yeni öğeye geçişte intro'yu seslendir.
    if (bitti) {
      konus(bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!');
      return;
    }
    const oge = aktifListe[indeks];
    const ad = oge.ariaAd || oge.ad;
    const detay = oge.yonergeDetay || `${(oge.noktalar || []).join(', ')} numaralı noktalardan oluşur.`;
    const ek = oge.aciklama ? ` ${oge.aciklama}` : '';
    const giris = `${ad} ${kategoriAdi}, ${detay} Lütfen bu noktalara sırayla dokunun.${ek}`;
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
    if (aktifOge && aktifHucreler.length) {
      if (aktifHucreler.length > 1) satiriGonder(aktifHucreler);
      else deseniGonder(aktifHucreler[0]);
    }
    return () => { deseniTemizle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, bitti, aktifHucreler]);

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          {baslik && <PageHeader baslik={baslik} />}
          <div className="progress" aria-hidden="true">
            Okuma modu: {ogeler.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik={baslik || 'Öğrenme'}
            ogeler={ogeler}
            rtl={rtl}
            getEtiket={(oge) => oge.ad}
            getAltEtiket={(oge) => (oge.ariaAd && oge.ariaAd !== oge.ad ? oge.ariaAd : oge.aciklama)}
            getHucreler={(oge) => (Array.isArray(oge.hucreler) && oge.hucreler.length > 0 ? oge.hucreler : (oge.noktalar || []))}
            onSec={okumaOgesiSec}
            onKapat={() => setOkumaModu(false)}
          />
        </div>
        <div className="controls">
          <button type="button" onClick={() => setOkumaModu(false)}>Öğrenme Moduna Dön</button>
        </div>
      </div>
    );
  }

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

  const noktayaTikla = (n, hucreIndex = 0) => {
    const tiklananKey = `${hucreIndex}:${n}`;
    if (basilanlar.includes(tiklananKey)) return;
    const beklenenSiradaki = aktifAdimlar[basilanlar.length];
    if (!beklenenSiradaki || n !== beklenenSiradaki.n || hucreIndex !== beklenenSiradaki.hucreIndex) {
      setYanlis([tiklananKey]);
      const hucredeVar = aktifHucreler[hucreIndex]?.includes(n);
      hataBildir(hucredeVar ? `Sıra yanlış. Önce ${adimMetni(beklenenSiradaki)}.` : `${adimMetni({ hucreIndex, n })} yanlış. Tekrar deneyin.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, beklenenSiradaki.key];
    setBasilanlar(yeni);
    const tamamMi = yeni.length === aktifAdimlar.length;
    if (tamamMi) {
      if (bolumAnahtari) ogrenildiIsaretle(bolumAnahtari, aktifOge.ad);
      konusmayiDurdur();
      tebriklerAktif.current = true;
      basariBildir('Tebrikler!');
      setTimeout(() => setIndeks((i) => i + 1), 800);
    } else {
      konus(`Doğru. Sıradaki nokta: ${adimMetni(aktifAdimlar[yeni.length])}.`);
    }
  };

  const hucreNoktalari = (anahtarlar, hucreIndex) => anahtarlar
    .filter((anahtar) => anahtar.startsWith(`${hucreIndex}:`))
    .map((anahtar) => Number(anahtar.split(':')[1]));

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
        <div className="ders-eylem-satiri">
          <OkumaModuButonu onClick={okumaModunaGec} />
          <button
            type="button"
            className={`sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(aktifOge?.ad) ? ' kaydedildi' : ''}`}
            onClick={kaydetSonra}
            aria-label="Daha sonra öğren listesine kaydet"
            title="Daha sonra öğren"
          >
            <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
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
        {cokHucreli ? (
          <div className="cell-row fit" style={{ '--hucre-sayisi': aktifHucreler.length }}>
            {aktifHucreler.map((noktalar, hucreIndex) => (
              <BrailleCell
                key={hucreIndex}
                baslik={aktifOge.hucreBasliklari?.[hucreIndex] || (hucreIndex + 1).toString()}
                baslikAriaLabel={aktifOge.hucreAriaEtiketleri?.[hucreIndex] || hucreAdi(hucreIndex)}
                baslikStyle={rtl ? { fontFamily: "'Amasya', serif", direction: 'rtl' } : undefined}
                tiklanabilir
                onNoktaTikla={(n) => noktayaTikla(n, hucreIndex)}
                hedefNoktalar={noktalar}
                dogruNoktalar={hucreNoktalari(basilanlar, hucreIndex)}
                yanlisNoktalar={hucreNoktalari(yanlis, hucreIndex)}
              />
            ))}
          </div>
        ) : (
          <BrailleCell
            baslik={aktifOge.ad}
            baslikAriaLabel={aktifOge.ariaAd || aktifOge.ad}
            baslikStyle={rtl ? { fontFamily: "'Amasya', serif", direction: 'rtl' } : undefined}
            tiklanabilir
            onNoktaTikla={(n) => noktayaTikla(n, 0)}
            hedefNoktalar={aktifHucreler[0] || []}
            dogruNoktalar={hucreNoktalari(basilanlar, 0)}
            yanlisNoktalar={hucreNoktalari(yanlis, 0)}
          />
        )}
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
