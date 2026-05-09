import React, { useRef, useState, useCallback, useMemo } from 'react';
import mammoth from 'mammoth';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { metniBrailleyeCevir, metniBrailleyeCevirKisaltmali } from '../utils/brailleCevir.js';
import { konus, konusmayiDurdur } from '../utils/ses.js';

const SATIRDA_HUCRE = 40;
const SAYFADA_SATIR = 25;
const BRAILLE_SAYFA_BOYUTU = 200; // hücre/sayfa

function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of noktalar) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return String.fromCharCode(0x20 + bits);
}

function metniBRFe(metin, cevirFn) {
  const { hucreler } = cevirFn(metin, { buyukHarfIsareti: true, sayiIsareti: true });
  const satirlar = [];
  let satir = '';
  for (const hucre of hucreler) {
    satir += noktalariBRF(hucre);
    if (satir.length >= SATIRDA_HUCRE) { satirlar.push(satir); satir = ''; }
  }
  if (satir.length) satirlar.push(satir);
  const chunks = [];
  for (let i = 0; i < satirlar.length; i += SAYFADA_SATIR) {
    chunks.push(satirlar.slice(i, i + SAYFADA_SATIR).join('\r\n'));
  }
  return chunks.join('\r\n\f\r\n');
}

// Belgeden çekilen ham metni temizle
function metniTemizle(ham) {
  return ham
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Kontrol karakterlerini (tab hariç) sil
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Tab → boşluk
    .replace(/\t/g, ' ')
    // Üst üste boş satırları 2'ye indir
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function BelgeBrf() {
  const dosyaRef = useRef(null);
  const [belgeAdi, setBelgeAdi] = useState('');
  const [belgeMetni, setBelgeMetni] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [kisaltmaAktif, setKisaltmaAktif] = useState(false);
  const [konusuyor, setKonusuyor] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aktifTab, setAktifTab] = useState('metin');
  const [brailleSayfa, setBrailleSayfa] = useState(0);

  const processFile = async (dosya) => {
    const ad = dosya.name.toLowerCase();
    const gecerli = ['.txt', '.docx', '.rtf', '.md'].some((ext) => ad.endsWith(ext));
    if (!gecerli) {
      setHata('Desteklenen formatlar: .txt .docx .rtf .md');
      return;
    }
    setHata('');
    setBelgeAdi(dosya.name);
    setYukleniyor(true);
    setBelgeMetni('');
    try {
      let metin = '';
      if (ad.endsWith('.docx')) {
        const arrayBuffer = await dosya.arrayBuffer();
        const sonuc = await mammoth.extractRawText({ arrayBuffer });
        metin = sonuc.value;
      } else {
        metin = await dosya.text();
      }
      setBelgeMetni(metniTemizle(metin));
    } catch (err) {
      setHata('Dosya okunurken hata oluştu: ' + (err?.message || ''));
    } finally {
      setYukleniyor(false);
    }
  };

  const brfIndir = () => {
    if (!belgeMetni.trim()) return;
    const fn = kisaltmaAktif ? metniBrailleyeCevirKisaltmali : metniBrailleyeCevir;
    const brf = metniBRFe(belgeMetni, fn);
    const blob = new Blob([brf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (belgeAdi.replace(/\.[^.]+$/, '') || 'cikti') + '.brf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sesToggle = () => {
    if (konusuyor) { konusmayiDurdur(); setKonusuyor(false); return; }
    if (!belgeMetni.trim()) return;
    setKonusuyor(true);
    konus(belgeMetni, { kesintiyle: true, onSon: () => setKonusuyor(false) });
  };

  const temizle = () => {
    setBelgeMetni(''); setBelgeAdi(''); setHata('');
    setKonusuyor(false); konusmayiDurdur(); setAktifTab('metin'); setBrailleSayfa(0);
  };

  const cevirFn = kisaltmaAktif ? metniBrailleyeCevirKisaltmali : metniBrailleyeCevir;
  const hucreler = useMemo(() => {
    if (!belgeMetni) return [];
    return cevirFn(belgeMetni, { buyukHarfIsareti: true, sayiIsareti: true }).hucreler;
  }, [belgeMetni, kisaltmaAktif]);

  const toplamSayfa = Math.max(1, Math.ceil(hucreler.length / BRAILLE_SAYFA_BOYUTU));
  const sayfaBaslangic = brailleSayfa * BRAILLE_SAYFA_BOYUTU;
  const sayfaHucreler = hucreler.slice(sayfaBaslangic, sayfaBaslangic + BRAILLE_SAYFA_BOYUTU);

  const brailleTabAc = () => { setAktifTab('braille'); setBrailleSayfa(0); };
  const brailleTabKapat = () => setAktifTab('metin');

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dosya = e.dataTransfer.files?.[0];
    if (dosya) processFile(dosya);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  return (
    <div className="page yazma-page araclar-page">

      {/* Üst */}
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Belge → BRF" />
      </div>

      {/* Orta */}
      <div className="yazma-bolum yazma-bolum-orta">
        <input
          ref={dosyaRef}
          type="file"
          accept=".txt,.docx,.rtf,.md"
          onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); e.target.value = ''; }}
          style={{ display: 'none' }}
          aria-label="Belge seç"
        />

        {/* ── Boş durum: drop zone ── */}
        {!belgeMetni && !yukleniyor && (
          <div
            className={'belge-drop-zone' + (dragOver ? ' drag-over' : '')}
            onClick={() => dosyaRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role="button"
            tabIndex={0}
            aria-label="Belge seç"
            onKeyDown={(e) => e.key === 'Enter' && dosyaRef.current?.click()}
          >
            <div className="belge-drop-ikon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M36 4H16a4 4 0 0 0-4 4v48a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V20Z"/>
                <path d="M36 4v16h16"/>
                <path d="M32 48V34"/>
                <path d="M26 42l6-8 6 8"/>
              </svg>
            </div>
            <p className="belge-drop-baslik">Belge seçin</p>
            <p className="belge-drop-alt">veya dosyayı buraya sürükleyin</p>
            <div className="belge-format-badges">
              {['.txt', '.docx', '.rtf', '.md'].map((f) => (
                <span key={f} className="belge-format-badge">{f}</span>
              ))}
            </div>
            {hata && (
              <p className="belge-drop-hata" role="alert">{hata}</p>
            )}
          </div>
        )}

        {/* ── Yükleniyor ── */}
        {yukleniyor && (
          <div className="belge-yukleniyor">
            <span className="belge-yukleniyor-spinner" aria-hidden="true" />
            <span>Okunuyor…</span>
          </div>
        )}

        {/* ── Metin önizleme ── */}
        {!yukleniyor && belgeMetni && (
          <>
            {/* Dosya chip */}
            <div className="belge-dosya-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="belge-dosya-adi">{belgeAdi}</span>
              <span className="belge-dosya-karakter">{belgeMetni.length.toLocaleString('tr')} karakter</span>
              <button
                type="button"
                className="belge-dosya-kaldir"
                onClick={temizle}
                aria-label="Dosyayı kaldır"
                title="Kaldır"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" width="14" height="14" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Tab butonları */}
            <div className="belge-tab-bar">
              <button
                type="button"
                className={'belge-tab' + (aktifTab === 'metin' ? ' aktif' : '')}
                onClick={() => setAktifTab('metin')}
                aria-pressed={aktifTab === 'metin'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
                </svg>
                Metin
              </button>
              <button
                type="button"
                className={'belge-tab' + (aktifTab === 'braille' ? ' aktif' : '')}
                onClick={brailleTabAc}
                aria-pressed={aktifTab === 'braille'}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="15" height="15" aria-hidden="true">
                  <circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>
                  <circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
                </svg>
                Braille
              </button>
            </div>

            {/* Metin alanı */}
            {aktifTab === 'metin' && <div className="belge-metin-sarici">
              <textarea
                className="belge-metin-textarea"
                value={belgeMetni}
                onChange={(e) => setBelgeMetni(e.target.value)}
                aria-label="Belgeden okunan metin (düzenlenebilir)"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button
                type="button"
                className={'araclar-seslendir-btn' + (konusuyor ? ' aktif' : '')}
                style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={sesToggle}
                disabled={!belgeMetni.trim()}
                aria-label={konusuyor ? 'Durdur' : 'Metni Seslendir'}
                title={konusuyor ? 'Durdur' : 'Metni Seslendir'}
              >
                {konusuyor
                  ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                }
              </button>
            </div>}

            {/* Braille görünümü */}
            {aktifTab === 'braille' && (
              <div className="araclar-nokta-sarici">
                <div className="araclar-nokta-gorunus" aria-label="Braille nokta görünümü">
                  {sayfaHucreler.map((noktalar, i) => (
                    <BrailleCell key={sayfaBaslangic + i} aktifNoktalar={noktalar} tiklanabilir={false} kesfedilebilir={false} />
                  ))}
                </div>
                {toplamSayfa > 1 && (
                  <div className="belge-braille-sayfalama">
                    <button
                      type="button"
                      className="belge-sayfa-btn"
                      onClick={() => setBrailleSayfa((p) => Math.max(0, p - 1))}
                      disabled={brailleSayfa === 0}
                      aria-label="Önceki sayfa"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                           strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </button>
                    <span className="belge-sayfa-bilgi">
                      {brailleSayfa + 1} / {toplamSayfa}
                    </span>
                    <button
                      type="button"
                      className="belge-sayfa-btn"
                      onClick={() => setBrailleSayfa((p) => Math.min(toplamSayfa - 1, p + 1))}
                      disabled={brailleSayfa === toplamSayfa - 1}
                      aria-label="Sonraki sayfa"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                           strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Alt — butonlar */}
      <div className="yazma-bolum yazma-bolum-alt">
        {belgeMetni && (
          <div className="controls">
            <button type="button" onClick={brfIndir} disabled={!belgeMetni.trim()} aria-label="BRF İndir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 20h14"/>
              </svg>
              <span className="btn-yazi">BRF İndir</span>
            </button>
            <button
              type="button"
              className={'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}
              onClick={() => setKisaltmaAktif((v) => !v)}
              aria-pressed={kisaltmaAktif}
              aria-label={'Kısaltma ' + (kisaltmaAktif ? 'Aktif' : 'Kapalı')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
              </svg>
              <span className="btn-yazi">Kısaltma {kisaltmaAktif ? 'Aktif' : 'Kapalı'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
