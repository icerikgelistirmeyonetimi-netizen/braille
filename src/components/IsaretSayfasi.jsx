import React, { useEffect, useRef, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, basariBildir, hataBildir, konusmayiDurdur } from '../utils/ses.js';
import { indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Noktalama ve özel işaret sayfası.
// Listedeki her madde için: hücre(ler), açıklama, kullanım kuralları ve örnekleri sıralı olarak gösterir.
export default function IsaretSayfasi({ baslik, isaretler, bolumAnahtari, matematikHucreGorunumu = false }) {
  const [indeks, setIndeks] = useState(() => {
    const k = indeksAl(bolumAnahtari);
    return k < isaretler.length ? k : 0;
  });
  const [detayAcik, setDetayAcik] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]);
  const [yanlis, setYanlis] = useState([]);
  const [okumaModu, setOkumaModu] = useState(false);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? isaretler.filter((s) => kayitliAdlar.includes(s.ad))
    : isaretler;

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

  useEffect(() => {
    if (bitti) {
      konus(`Tebrikler! ${baslik} bölümünü tamamladınız.`);
      return;
    }
    const k = aktifListe[indeks];
    const tapMesaj = k.hucreler.length > 0 ? ' Lütfen noktalarına dokunun.' : '';
    const metin = `${k.ad}. ${k.aciklama}${tapMesaj}`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti, baslik, isaretler, kayitlilarModu]);

  // Yeni işarete geçince sıfırla
  useEffect(() => { setDetayAcik(false); setHucreIndeksi(0); }, [indeks]);
  useEffect(() => { setBasilanlar([]); setYanlis([]); }, [indeks, hucreIndeksi]);

  // Yeni hücreye geçince seslendir
  useEffect(() => {
    if (bitti || hucreIndeksi === 0) return;
    const k = aktifListe[indeks];
    if (!k || !k.hucreler[hucreIndeksi]) return;
    konus(`${hucreIndeksi + 1}. hücre: ${k.hucreler[hucreIndeksi].join(', ')} numaralı noktalara dokunun.`, { kesintiyle: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hucreIndeksi, indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  const okumaModunaGec = () => {
    konusmayiDurdur();
    setOkumaModu(true);
  };

  const okumaOgesiSec = (orijinalIndeks) => {
    setKayitlilarModu(false);
    setIndeks(orijinalIndeks);
    setDetayAcik(false);
    setHucreIndeksi(0);
    setBasilanlar([]);
    setYanlis([]);
    setOkumaModu(false);
  };

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            Okuma modu: {isaretler.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik={baslik}
            ogeler={isaretler}
            getEtiket={(isaret) => (isaret.sembol && isaret.sembol !== '—' ? isaret.sembol : isaret.ad)}
            getAltEtiket={(isaret) => (isaret.sembol && isaret.sembol !== '—' ? isaret.ad : isaret.aciklama)}
            getHucreler={(isaret) => isaret.hucreler || []}
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
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            {kayitlilarModu && aktifListe.length === 0
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : 'Tebrikler! Tüm işaretleri öğrendiniz.'}
          </div>
        </div>
        <div className="controls">
          {kayitlilarModu
            ? <button type="button" onClick={() => { setKayitlilarModu(false); setIndeks(0); }}>Tüm Listeye Dön</button>
            : <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>}
        </div>
      </div>
    );
  }

  const k = aktifListe[indeks];
  const hucreSayisi = k.hucreler.length;
  const guvenliHucreIndeksi = hucreSayisi > 0 ? Math.min(hucreIndeksi, hucreSayisi - 1) : 0;
  const ikiHucreYanYana = matematikHucreGorunumu && hucreSayisi === 2;
  const onizlemeliCokHucre = matematikHucreGorunumu && hucreSayisi > 2;
  const noktaMetni = k.hucreler.length > 0
    ? k.hucreler.map((h) => h.join('-')).join('  /  ')
    : 'Bu konu bir kuraldır, hücre sembolü yoktur.';

  const modDegistir = (kayitlilar) => {
    setKayitlilarModu(kayitlilar);
    setIndeks(0);
    setDetayAcik(false);
  };

  const kaydetSonra = () => {
    if (bitti || !k) return;
    const kaydedildi = sonraOgrenAl(anahtar).includes(k.ad);
    if (kaydedildi) {
      sonraOgrenKaldir(anahtar, k.ad);
      konus('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, k.ad);
      konus('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

  const noktayaTikla = (n) => {
    const aktifHucreNoktalar = k.hucreler[guvenliHucreIndeksi] || [];
    if (basilanlar.includes(n)) return;
    const beklenenSiradaki = aktifHucreNoktalar[basilanlar.length];
    if (n !== beklenenSiradaki) {
      setYanlis([n]);
      hataBildir(aktifHucreNoktalar.includes(n) ? `Sıra yanlış. Önce ${beklenenSiradaki} numaraya basın.` : `${n} numara yanlış.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    const tamamMi = yeni.length === aktifHucreNoktalar.length;
    if (tamamMi) {
      const sonHucreDir = guvenliHucreIndeksi >= k.hucreler.length - 1;
      if (sonHucreDir) {
        basariBildir('Tebrikler!');
        setTimeout(() => setIndeks((i) => i + 1), 800);
      } else {
        basariBildir('Doğru!');
        setTimeout(() => setHucreIndeksi((i) => i + 1), 500);
      }
    } else {
      konus(`Doğru. Sıradaki nokta: ${aktifHucreNoktalar[yeni.length]} numara.`);
    }
  };

  return (
    <div className="page">
      {toast && <div className="toast" aria-live="assertive">{toast}</div>}
      <div>
        <PageHeader baslik={baslik} />
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

      <div
        className="isaret-icerik"
        style={{
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div className="ders-eylem-satiri">
          <OkumaModuButonu onClick={okumaModunaGec} />
          <button
            type="button"
            className={`sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(k?.ad) ? ' kaydedildi' : ''}`}
            onClick={kaydetSonra}
            aria-label="Daha sonra öğren listesine kaydet"
            title="Daha sonra öğren"
          >
            <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '1.5em', fontWeight: 700, color: 'var(--accent)' }}>
          {k.ad}
          {k.sembol && k.sembol !== '—' && (
            <span style={{ marginLeft: '0.5em', color: 'var(--muted)', fontSize: '0.7em' }}>
              ({k.sembol})
            </span>
          )}
        </div>

        {k.hucreler.length > 0 && (
          <>
            {ikiHucreYanYana ? (
              <div className="cell-row fit" style={{ '--hucre-sayisi': 2 }}>
                {k.hucreler.map((noktalar, hucreIndex) => (
                  <BrailleCell
                    key={hucreIndex}
                    baslik={`${hucreIndex + 1}`}
                    baslikAriaLabel={`${k.ad} sembolü ${hucreIndex + 1}. hücre`}
                    hedefNoktalar={noktalar}
                    dogruNoktalar={hucreIndex < guvenliHucreIndeksi ? noktalar : hucreIndex === guvenliHucreIndeksi ? basilanlar : []}
                    yanlisNoktalar={hucreIndex === guvenliHucreIndeksi ? yanlis : []}
                    tiklanabilir={hucreIndex === guvenliHucreIndeksi}
                    onNoktaTikla={noktayaTikla}
                  />
                ))}
              </div>
            ) : onizlemeliCokHucre ? (
              <>
                <div className="aktif-hucre-wrap">
                  <BrailleCell
                    hedefNoktalar={k.hucreler[guvenliHucreIndeksi]}
                    dogruNoktalar={basilanlar}
                    yanlisNoktalar={yanlis}
                    tiklanabilir
                    onNoktaTikla={noktayaTikla}
                    baslikAriaLabel={`${k.ad} sembolü ${guvenliHucreIndeksi + 1}. hücre`}
                  />
                </div>
                <div className="hucre-onizleme" role="tablist" aria-label="Hücre listesi">
                  {k.hucreler.map((noktalar, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === guvenliHucreIndeksi}
                      className={`hucre-onizleme-oge ${i === guvenliHucreIndeksi ? 'aktif' : ''}`}
                      onClick={() => setHucreIndeksi(i)}
                      aria-label={`${i + 1}. hücreye git`}
                    >
                      <span className="hucre-onizleme-grid" aria-hidden="true">
                        {[1, 4, 2, 5, 3, 6].map((n) => (
                          <span key={n} className={`hucre-onizleme-nokta ${noktalar.includes(n) ? 'on' : ''}`} />
                        ))}
                      </span>
                      <span className="hucre-onizleme-no" aria-hidden="true">{i + 1}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <BrailleCell
                hedefNoktalar={k.hucreler[guvenliHucreIndeksi]}
                dogruNoktalar={basilanlar}
                yanlisNoktalar={yanlis}
                tiklanabilir
                onNoktaTikla={noktayaTikla}
                baslikAriaLabel={k.hucreler.length > 1 ? `${k.ad} sembolü ${guvenliHucreIndeksi + 1}. hücre` : `${k.ad} sembolü`}
              />
            )}
            {k.hucreler.length > 1 && (
              <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>
                Hücre {guvenliHucreIndeksi + 1} / {k.hucreler.length}
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em' }}>
          <strong>Noktalar:</strong> {noktaMetni}
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          aria-label="Tekrar dinle"
          onClick={() => konus(`${k.ad}. ${k.aciklama} ${k.kurallar?.[0] || ''}`, { kesintiyle: true })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button type="button" aria-label="Detayı göster" onClick={() => setDetayAcik(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="btn-etiket">Detay</span>
        </button>
        <button type="button" aria-label="Önceki" disabled={indeks === 0} onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="btn-etiket">Önceki</span>
        </button>
        <button
          type="button"
          aria-label={k.hucreler.length > 0 ? 'Atla, sonraki' : 'Anladım, sonraki'}
          onClick={() => {
            if (k.hucreler.length > 0 && hucreIndeksi < k.hucreler.length - 1) {
              setHucreIndeksi((i) => i + 1);
            } else {
              basariBildir('Sıradaki işaret.');
              setTimeout(() => setIndeks((i) => i + 1), 400);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="btn-etiket">{k.hucreler.length > 0 ? 'Atla' : 'Anladım'}</span>
        </button>
      </div>

      {detayAcik && (
        <div
          className="detay-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${k.ad} detayları`}
          onClick={(e) => { if (e.target === e.currentTarget) setDetayAcik(false); }}
        >
          <div className="detay-popup">
            <div className="detay-baslik">
              <h2 style={{ margin: 0, color: 'var(--accent)' }}>
                {k.ad}
                {k.sembol && k.sembol !== '—' && (
                  <span style={{ marginLeft: '0.5em', color: 'var(--muted)', fontSize: '0.7em' }}>
                    ({k.sembol})
                  </span>
                )}
              </h2>
              <button
                type="button"
                className="detay-kapat"
                onClick={() => setDetayAcik(false)}
                aria-label="Detayı kapat"
              >
                ✕
              </button>
            </div>
            <div className="detay-icerik">
              <p style={{ margin: '0 0 0.8em 0' }}>{k.aciklama}</p>
              {k.kurallar?.length > 0 && (
                <>
                  <strong>Kullanıldığı yerler:</strong>
                  <ul style={{ margin: '0.3em 0 0.8em 1.2em', padding: 0 }}>
                    {k.kurallar.map((kr, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{kr}</li>)}
                  </ul>
                </>
              )}
              {k.ornekler?.length > 0 && (
                <>
                  <strong>Örnek:</strong>
                  <ul style={{ margin: '0.3em 0 0 1.2em', padding: 0 }}>
                    {k.ornekler.map((o, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{o}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
