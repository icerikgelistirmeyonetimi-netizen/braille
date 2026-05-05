import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { IKI_HARFLI_KISALTMALAR } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';
import { indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';

const ANAHTAR = 'kisaltma-iki-harfli';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – İki Harfli Kısaltmalar.
// İki ayrı braille hücresi yan yana gösterilir; alttaki etiket
// ifade ettiği kelimeyi yazar.
export default function KisaltmaIkiHarfli() {
  const [indeks, setIndeks] = useState(() => indeksAl(ANAHTAR));
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const kayitliAdlar = sonraOgrenAl(ANAHTAR);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? IKI_HARFLI_KISALTMALAR.filter((o) => kayitliAdlar.includes(o.kelime))
    : IKI_HARFLI_KISALTMALAR;

  const bitti = indeks >= aktifListe.length;

  useEffect(() => { if (!kayitlilarModu) indeksKaydet(ANAHTAR, indeks); }, [indeks, kayitlilarModu]);

  const gosterToast = (mesaj) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(mesaj);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  const modDegistir = (kayitlilar) => { setKayitlilarModu(kayitlilar); setIndeks(0); };

  const kaydetSonra = () => {
    if (bitti) return;
    const k = aktifListe[indeks];
    const kaydedildi = sonraOgrenAl(ANAHTAR).includes(k.kelime);
    if (kaydedildi) {
      sonraOgrenKaldir(ANAHTAR, k.kelime);
      konus('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(ANAHTAR, k.kelime);
      konus('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! İki harfli kısaltmaları tamamladınız.');
      return;
    }
    const k = aktifListe[indeks];
    const metin = `${k.harf.toLocaleUpperCase('tr')} kısaltması, "${k.kelime}" kelimesini ifade eder.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="İki Harfli Kısaltmalar" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            {kayitlilarModu && aktifListe.length === 0
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : 'Tebrikler! Tüm iki harfli kısaltmaları öğrendiniz.'}
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

  const k = aktifListe[indeks];
  const harfBuyuk = k.harf.toLocaleUpperCase('tr');
  const kaydedildi = sonraOgrenAl(ANAHTAR).includes(k.kelime);

  return (
    <div className="page">
      {toast && <div className="toast" aria-live="assertive">{toast}</div>}
      <div>
        <PageHeader baslik="İki Harfli Kısaltmalar" />
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
          aria-label={kaydedildi ? 'Sonra öğren listesinden kaldır' : 'Sonra öğren listesine kaydet'}
          className={`sonra-kaydet-btn sayfa-ici${kaydedildi ? ' kaydedildi' : ''}`}
          onClick={kaydetSonra}
          style={{ alignSelf: 'flex-end' }}
        >
          <svg viewBox="0 0 24 24" fill={kaydedildi ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <div style={{ display: 'flex', gap: 'var(--cell-gap)', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
          <BrailleCell
            aktifNoktalar={k.sol}
            baslik={harfBuyuk[0]}
            baslikAriaLabel={`${harfBuyuk[0]} harfi`}
          />
          <BrailleCell
            aktifNoktalar={k.sag}
            baslik={harfBuyuk[1]}
            baslikAriaLabel={`${harfBuyuk[1]} harfi`}
          />
        </div>
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.kelime}”
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 560 }}>
          {harfBuyuk} harfleri yan yana yazıldığında “{k.kelime}” kelimesini ifade eder.
          Bu kısaltma yalnız başına veya kelimenin başında ek alarak kullanılır.
        </div>
      </div>

      <div className="controls">
        <button type="button" aria-label="Tekrar dinle" onClick={() => konus(`${harfBuyuk} kısaltması, ${k.kelime} kelimesi.`, { kesintiyle: true })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button type="button" aria-label="Önceki" disabled={indeks === 0} onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="btn-etiket">Önceki</span>
        </button>
        <button type="button" aria-label="Anladım, sonraki" onClick={() => { basariBildir('Sıradaki kısaltma.'); setTimeout(() => setIndeks((i) => i + 1), 600); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="btn-etiket">Anladım</span>
        </button>
      </div>
    </div>
  );
}
