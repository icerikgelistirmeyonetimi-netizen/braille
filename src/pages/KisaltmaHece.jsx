import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import OkumaModuListesi, { OkumaModuButonu } from '../components/OkumaModu.jsx';
import { HECE_KISALTMALARI } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';
import { indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';

const ANAHTAR = 'kisaltma-hece';
const SON_KULLANILAMAZ = ['ba', 'be', 'bu', 'ka', 'ha', 'ki'];

export default function KisaltmaHece() {
  const [indeks, setIndeks] = useState(() => indeksAl(ANAHTAR));
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [okumaModu, setOkumaModu] = useState(false);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const kayitliAdlar = sonraOgrenAl(ANAHTAR);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? HECE_KISALTMALARI.filter((o) => kayitliAdlar.includes(o.hece))
    : HECE_KISALTMALARI;

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
    const kaydedildi = sonraOgrenAl(ANAHTAR).includes(k.hece);
    if (kaydedildi) {
      sonraOgrenKaldir(ANAHTAR, k.hece);
      konus('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(ANAHTAR, k.hece);
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
    setOkumaModu(false);
  };

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! Hece kısaltmalarını tamamladınız.');
      return;
    }
    const k = aktifListe[indeks];
    const metin = `"${k.hece}" hecesi.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          <PageHeader baslik="Hece Kısaltmaları" />
          <div className="progress" aria-hidden="true">
            Okuma modu: {HECE_KISALTMALARI.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik="Hece Kısaltmaları"
            ogeler={HECE_KISALTMALARI}
            getEtiket={(oge) => oge.hece}
            getAltEtiket={(oge) => (SON_KULLANILAMAZ.includes(oge.hece) ? 'Kelime sonunda kullanılmaz' : undefined)}
            getHucreler={(oge) => oge.noktalar}
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
        <PageHeader baslik="Hece Kısaltmaları" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            {kayitlilarModu && aktifListe.length === 0
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : 'Tebrikler! Tüm hece kısaltmalarını öğrendiniz.'}
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
  const sondaKullanilamaz = SON_KULLANILAMAZ.includes(k.hece);
  const kaydedildi = sonraOgrenAl(ANAHTAR).includes(k.hece);

  return (
    <div className="page">
      {toast && <div className="toast" aria-live="assertive">{toast}</div>}
      <div>
        <PageHeader baslik="Hece Kısaltmaları" />
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
            aria-label={kaydedildi ? 'Sonra öğren listesinden kaldır' : 'Sonra öğren listesine kaydet'}
            className={`sonra-kaydet-btn sayfa-ici${kaydedildi ? ' kaydedildi' : ''}`}
            onClick={kaydetSonra}
          >
            <svg viewBox="0 0 24 24" fill={kaydedildi ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <BrailleCell
          aktifNoktalar={k.noktalar}
          baslik={k.hece}
          baslikAriaLabel={`${k.hece} hecesi`}
        />
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.hece}”
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 560 }}>
          Bu sembol “{k.hece}” hecesini ifade eder. Noktalar:{' '}
          {k.noktalar.join(', ')}.
          {sondaKullanilamaz && (
            <>
              <br />
              <b>Kural:</b> “{k.hece}” hecesi kelimenin sonunda kullanılamaz.
            </>
          )}
        </div>
      </div>

      <div className="controls">
        <button type="button" aria-label="Tekrar dinle" onClick={() => konus(`${k.hece} hecesi.`, { kesintiyle: true })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button type="button" aria-label="Önceki" disabled={indeks === 0} onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="btn-etiket">Önceki</span>
        </button>
        <button type="button" aria-label="Anladım, sonraki" onClick={() => { basariBildir('Sıradaki hece.'); setTimeout(() => setIndeks((i) => i + 1), 600); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="btn-etiket">Anladım</span>
        </button>
      </div>
    </div>
  );
}
