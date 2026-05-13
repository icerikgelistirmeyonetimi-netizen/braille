import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import mammoth from 'mammoth';
import { toJpeg } from 'html-to-image';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { metniBrailleyeCevir, metniBrailleyeCevirKisaltmali, siraSayisiSonRakamEtiketiNoktaEki } from '../utils/brailleCevir.js';
import { hucreAnlami } from './Araclar.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';

const SATIRDA_HUCRE = 40;
const SAYFADA_SATIR = 25;
const BRAILLE_SAYFA_BOYUTU = 200; // hücre/sayfa

/**
 * Bir braille hücresinin nokta dizisini Unicode braille karakterine çevirir.
 * U+2800 = boş hücre. Bit n = (dot n+1).
 * Ekran okuyucular (NVDA, JAWS, VoiceOver) bu blok karakterleri tanır.
 */
export function noktalardanUnicode(noktalar) {
  if (!noktalar || noktalar.length === 0) return '\u2800'; // boş hücre (görünür ayraç)
  let val = 0;
  for (const n of noktalar) {
    if (typeof n === 'number' && n >= 1 && n <= 8) val |= 1 << (n - 1);
  }
  return String.fromCharCode(0x2800 + val);
}

function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of noktalar) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return String.fromCharCode(0x20 + bits);
}

// Hücre anlamından kısa etiket türet (genişlet modunda hücre altında gösterilir)
export function kisaEtiket(anlam) {
  if (!anlam || anlam.tip === 'bosluk') return '';
  // İşaret hücreleri (kök/parça/sayı/büyük) → tek sembol
  if (anlam.tip === 'isaret') {
    if (anlam.baslik.includes('Tümü Büyük')) return '⇧⇧';
    if (anlam.baslik.includes('Büyük Harf')) return '⇧';
    if (anlam.baslik.includes('Sayı')) return '#';
    if (anlam.baslik === 'Harf İşareti') return '(h)';
    if (anlam.baslik.includes('Bölük')) return '.';
    if (anlam.baslik.includes('Tarih Ayırma')) return '3-6';
    if (anlam.baslik.includes('Düzeltme') || anlam.baslik.includes('Yabancı Harf')) return '^';
    if (anlam.baslik.includes('Bağ İşareti')) return '-';
    if (anlam.baslik.includes('Ayırma')) return '3';
    if (anlam.baslik.includes('Tek Küçük Harf')) return '5-6';
    if (anlam.baslik.includes('Kök') || anlam.baslik.includes('Parça')) return '*';
    return '*';
  }
  if (anlam.etiket === '') return '';
  // Kısaltma: hucreAnlami doğrudan kasalı etiket sağladıysa onu kullan
  if (anlam.etiket) return anlam.etiket;
  // Harf: doğru kasada (büyük/küçük) göster
  if (anlam.tip === 'harf' && anlam.harf) return anlam.harf;
  if (anlam.tip === 'harf') {
    const hm = anlam.baslik.match(/Harf:\s*(.+)/);
    if (hm) return hm[1].trim();
  }
  // Tırnak içindeki değer (yedek)
  const tm = anlam.baslik.match(/[\u201C\u201D"]([^\u201C\u201D"]+)[\u201C\u201D"]/);
  if (tm) return tm[1];
  if (anlam.tip === 'noktalama') {
    if (anlam.isaret) return anlam.isaret;
    const pm = anlam.baslik.match(/\(([^)]+)\)/);
    if (pm) return pm[1];
  }
  if (anlam.tip === 'rakam') {
    const rm = anlam.baslik.match(/Rakam:\s*(.+)/);
    if (rm) return rm[1].trim();
    const sm = anlam.baslik.match(/Sıra sayısı[:\s]*(\d)/u);
    if (sm) return sm[1];
  }
  return anlam.baslik;
}

function metniBRFe(metin, cevirFn) {
  const { hucreler } = cevirFn(metin, { buyukHarfIsareti: true, sayiIsareti: true });
  const satirlar = [];
  let satir = '';
  let sonBosluk = -1; // satır içinde son boş hücre konumu (boşluk)
  for (const hucre of hucreler) {
    const ch = noktalariBRF(hucre);
    satir += ch;
    if (hucre.length === 0) sonBosluk = satir.length; // boşluk konumu (sonrası)
    if (satir.length >= SATIRDA_HUCRE) {
      // Kelime ortasında kırma: en yakın boşluk varsa orada böl
      if (sonBosluk > 0 && sonBosluk < satir.length) {
        satirlar.push(satir.slice(0, sonBosluk - 1)); // boşluğu da at (satır sonu = sınır)
        satir = satir.slice(sonBosluk);
      } else {
        satirlar.push(satir);
        satir = '';
      }
      sonBosluk = -1;
    }
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

  const SISTEM_VARSAYILAN = { hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true };
  const [kisaltmaSistemler, setKisaltmaSistemler] = useState(() => {
    const saved = localStorage.getItem('belgeBrfKisaltmaSistemler');
    if (!saved) return { ...SISTEM_VARSAYILAN };
    try { return { ...SISTEM_VARSAYILAN, ...JSON.parse(saved) }; } catch { return { ...SISTEM_VARSAYILAN }; }
  });
  const [sistemPaneli, setSistemPaneli] = useState(false);
  const sistemPaneliRef = useRef(null);

  const sistemToggle = (key) => setKisaltmaSistemler((prev) => {
    const yeni = { ...prev, [key]: !prev[key] };
    localStorage.setItem('belgeBrfKisaltmaSistemler', JSON.stringify(yeni));
    return yeni;
  });

  useEffect(() => {
    if (!sistemPaneli) return;
    const handle = (e) => {
      if (sistemPaneliRef.current && !sistemPaneliRef.current.contains(e.target))
        setSistemPaneli(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [sistemPaneli]);

  const [konusuyor, setKonusuyor] = useState(false); // 'metin' | 'nokta' | false
  const [dragOver, setDragOver] = useState(false);
  const [aktifTab, setAktifTab] = useState('metin');
  const [brailleSayfa, setBrailleSayfa] = useState(0);
  const [sayfaInput, setSayfaInput] = useState('');
  const brailleKutuRef = useRef(null);
  const jpgIndir = useCallback(async () => {
    const el = brailleKutuRef.current;
    if (!el) return;
    // Geçici: scroll'u kapat, dot içindeki rakamları gizle
    el.classList.add('jpg-export');
    const oncekiOverflowY = el.style.overflowY;
    const oncekiMaxH = el.style.maxHeight;
    const oncekiH = el.style.height;
    el.style.overflowY = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
    // Repaint için bir frame bekle
    await new Promise((r) => requestAnimationFrame(() => r()));
    const w = el.scrollWidth;
    const h = el.scrollHeight;
    try {
      const dataUrl = await toJpeg(el, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        width: w,
        height: h,
        style: { width: w + 'px', height: h + 'px' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `braille-sayfa-${brailleSayfa + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('JPG indirme hatası:', e);
    } finally {
      el.classList.remove('jpg-export');
      el.style.overflowY = oncekiOverflowY;
      el.style.maxHeight = oncekiMaxH;
      el.style.height = oncekiH;
    }
  }, [brailleSayfa]);
  const [seciliHucre, setSeciliHucre] = useState(null); // { index, anlam }
  const [genisletAktif, setGenisletAktif] = useState(false);
  // Erişilebilir mod: nokta grafiği yerine Unicode braille glifleri (⠁⠃⠉…).
  // Ekran okuyucular bu blokları “braille pattern dots …” veya tercih edilen
  // çevriyazı şeklinde okur; ek olarak aria-label kaynak metni sunar.
  const [erisilebilirMod, setErisilebilirMod] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    if (!seciliHucre) return;
    const kapat = (e) => { if (e.key === 'Escape') setSeciliHucre(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [seciliHucre]);

  // Sayfa değişince seçili hücreyi temizle
  useEffect(() => { setSeciliHucre(null); }, [brailleSayfa, aktifTab, kisaltmaAktif]);

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
    const brf = metniBRFe(belgeMetni, cevirFn);
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

  const sesToggle = (alan, metinFn) => {
    if (konusuyor === alan) { konusmayiDurdur(); setKonusuyor(false); return; }
    const metin = metinFn();
    if (!metin || !metin.trim()) return;
    setKonusuyor(alan);
    konus(metin, { kesintiyle: true, onSon: () => setKonusuyor(false) });
  };

  const metniSeslendir = () => sesToggle('metin', () => belgeMetni);

  const noktalariSeslendir = () => sesToggle('nokta', () => {
    if (!belgeMetni.trim()) return '';
    const kaynakMetin = belgeMetni;
    const { hucreler: hh, esleme } = cevirFn(belgeMetni, { buyukHarfIsareti: true, sayiIsareti: true });
    const parcalar = [];
    for (let i = 0; i < hh.length; i++) {
      const n = hh[i];
      const kaynak = esleme ? esleme[i] : -1;
      if (n.length === 0) { parcalar.push('boşluk'); continue; }
      const noktaMetni = n.join(' ');
      const anlam = hucreAnlami(hh, i, kisaltmaAktif, { kaynak: kaynakMetin, esleme });
      if (anlam.tip === 'isaret') {
        parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik}`);
        continue;
      }
      if (anlam.tip === 'kisaltma') {
        parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik.replace(/"/g, '')}`);
        continue;
      }
      if (anlam.tip === 'noktalama') {
        parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik}`);
        continue;
      }
      const harfMetni = kaynak >= 0 ? kaynakMetin[kaynak] : '';
      parcalar.push(harfMetni ? `nokta ${noktaMetni}, ${harfMetni}` : `nokta ${noktaMetni}`);
    }
    return parcalar.join('. ');
  });

  const temizle = () => {
    setBelgeMetni(''); setBelgeAdi(''); setHata('');
    setKonusuyor(false); konusmayiDurdur(); setAktifTab('metin'); setBrailleSayfa(0);
  };

  const cevirFn = kisaltmaAktif
    ? (m, o) => metniBrailleyeCevirKisaltmali(m, { ...o, ...kisaltmaSistemler })
    : metniBrailleyeCevir;
  const cevirSonuc = useMemo(() => {
    if (!belgeMetni) return { hucreler: [], esleme: [], kaynak: '' };
    const kaynak = belgeMetni;
    const r = cevirFn(belgeMetni, { buyukHarfIsareti: true, sayiIsareti: true });
    return { hucreler: r.hucreler, esleme: r.esleme, kaynak };
  }, [belgeMetni, kisaltmaAktif, kisaltmaSistemler]);
  const hucreler = cevirSonuc.hucreler;
  const eslemeCache = cevirSonuc.esleme;
  const kaynakCache = cevirSonuc.kaynak;

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
                className={'araclar-seslendir-btn' + (konusuyor === 'metin' ? ' aktif' : '')}
                style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={metniSeslendir}
                disabled={!belgeMetni.trim()}
                aria-label={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                title={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
              >
                {konusuyor === 'metin'
                  ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                }
              </button>
            </div>}

            {/* Braille görünümü */}
            {aktifTab === 'braille' && (
              <div className="araclar-nokta-sarici">
                {erisilebilirMod ? (
                  <div
                    ref={brailleKutuRef}
                    className="belge-braille-erisilebilir"
                    role="region"
                    aria-label={`Erişilebilir braille metin görünümü, sayfa ${brailleSayfa + 1} / ${toplamSayfa}`}
                    lang="tr"
                  >
                    <p
                      className="belge-braille-text"
                      // Ekran okuyucular Unicode braille bloklarını tanır;
                      // ayrıca aria-label ile kaynak Türkçe metin sunulur.
                      aria-label={belgeMetni}
                    >
                      {sayfaHucreler.map(noktalardanUnicode).join('')}
                    </p>
                  </div>
                ) : (
                <div ref={brailleKutuRef} className={'araclar-nokta-gorunus belge-braille-kutu' + (genisletAktif ? ' genisletilmis' : '')} aria-label="Braille nokta görünümü">
                  {sayfaHucreler.map((noktalar, i) => {
                    const globalIdx = sayfaBaslangic + i;
                    const anlam = hucreAnlami(hucreler, globalIdx, kisaltmaAktif, { kaynak: kaynakCache, esleme: eslemeCache });
                    const kisaltmaHucre = kisaltmaAktif && (
                      anlam.tip === 'kisaltma' ||
                      (anlam.tip === 'isaret' && (
                        anlam.baslik === 'Kelime Kökü İşareti' ||
                        anlam.baslik === 'Kelime Parçası İşareti'
                      ))
                    );
                    const noktalamaHucre = anlam.tip === 'noktalama';
                    const bolukIsaretiHucre = anlam.tip === 'isaret' && anlam.baslik === 'Bölük İşareti';
                    const siraSayisiHucre = anlam.tip === 'rakam' && /^Sıra sayısı/u.test(anlam.baslik);
                    const ondalikAyiracHucre = anlam.tip === 'noktalama' && anlam.baslik.includes('ondalık ayraç');
                    const matematikHucre = anlam.tip === 'islem' || bolukIsaretiHucre || siraSayisiHucre || ondalikAyiracHucre;
                    // Sayı/büyük/tümü büyük gibi özel işaretler → siyah göster
                    const ozelIsaretHucre = anlam.tip === 'isaret' && !kisaltmaHucre && !bolukIsaretiHucre;
                    const sinif = 'belge-braille-hucre' +
                      (seciliHucre?.index === globalIdx ? ' secili' : '') +
                      (kisaltmaHucre ? ' kisaltma-hucre' : '') +
                      (noktalamaHucre ? ' noktalama-hucre' : '') +
                      (matematikHucre ? ' matematik-hucre' : '') +
                      (ozelIsaretHucre ? ' ozel-isaret-hucre' : '');
                    const etiket = genisletAktif
                      ? `${kisaEtiket(anlam)}${siraSayisiSonRakamEtiketiNoktaEki(
                        anlam,
                        globalIdx,
                        hucreler,
                        kaynakCache,
                        eslemeCache,
                      )}`
                      : '';
                    return (
                      <div
                        key={globalIdx}
                        className={sinif}
                        role="button"
                        tabIndex={0}
                        title="Tıkla: anlam göster"
                        onClick={() => {
                          setSeciliHucre(seciliHucre?.index === globalIdx ? null : { index: globalIdx, anlam });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSeciliHucre(seciliHucre?.index === globalIdx ? null : { index: globalIdx, anlam });
                          }
                        }}
                      >
                        <BrailleCell aktifNoktalar={noktalar} tiklanabilir={false} kesfedilebilir={false} />
                        {genisletAktif && (
                          <div className="belge-hucre-etiket" aria-hidden="true">{etiket || '\u00A0'}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
                {!erisilebilirMod && seciliHucre && (
                  <div className="braille-hucre-popup" role="dialog" aria-label="Hücre anlamı">
                    <div className="bhp-header">
                      <span className="bhp-baslik-kucuk">Hücre {seciliHucre.index + 1}</span>
                      <button
                        type="button"
                        className="bhp-kapat"
                        onClick={() => setSeciliHucre(null)}
                        aria-label="Kapat"
                      >✕</button>
                    </div>
                    <div className="bhp-noktalar">Nokta: {seciliHucre.anlam.noktaStr}</div>
                    <div className={'bhp-anlam bhp-tip-' + seciliHucre.anlam.tip}>
                      {seciliHucre.anlam.baslik}
                    </div>
                    {seciliHucre.anlam.detay && (
                      <div className="bhp-detay">{seciliHucre.anlam.detay}</div>
                    )}
                  </div>
                )}
                <div className="belge-braille-altbar">
                  <span className="belge-altbar-sol" />
                  {toplamSayfa > 1 ? (
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
                      <form
                        className="belge-sayfa-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const n = parseInt(sayfaInput, 10);
                          if (!isNaN(n) && n >= 1 && n <= toplamSayfa) {
                            setBrailleSayfa(n - 1);
                          }
                          setSayfaInput('');
                        }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          className="belge-sayfa-input"
                          value={sayfaInput}
                          placeholder={String(brailleSayfa + 1)}
                          onChange={(e) => setSayfaInput(e.target.value.replace(/\D/g, ''))}
                          onBlur={() => {
                            const n = parseInt(sayfaInput, 10);
                            if (!isNaN(n) && n >= 1 && n <= toplamSayfa) setBrailleSayfa(n - 1);
                            setSayfaInput('');
                          }}
                          aria-label="Sayfa numarasına git"
                        />
                        <span className="belge-sayfa-toplam">/ {toplamSayfa}</span>
                      </form>
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
                  ) : <span />}
                  <div className="belge-altbar-sag">
                    <button
                      type="button"
                      className={'belge-genislet-btn' + (genisletAktif ? ' aktif' : '')}
                      onClick={() => setGenisletAktif((v) => !v)}
                      aria-pressed={genisletAktif}
                      aria-label={genisletAktif ? 'Etiketleri gizle (Daralt)' : 'Hücre altlarına etiket göster (Genişlet)'}
                      title={genisletAktif ? 'Daralt' : 'Genişlet'}
                    >
                      {genisletAktif ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                          <polyline points="4 14 10 14 10 20"/>
                          <polyline points="20 10 14 10 14 4"/>
                          <line x1="14" y1="10" x2="21" y2="3"/>
                          <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                          <polyline points="15 3 21 3 21 9"/>
                          <polyline points="9 21 3 21 3 15"/>
                          <line x1="21" y1="3" x2="14" y2="10"/>
                          <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      className="belge-genislet-btn belge-jpg-btn"
                      onClick={jpgIndir}
                      aria-label="Sayfayı JPG olarak indir"
                      title="JPG indir"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                           strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className={'araclar-seslendir-btn araclar-seslendir-nokta' + (konusuyor === 'nokta' ? ' aktif' : '')}
                  onClick={noktalariSeslendir}
                  aria-label={konusuyor === 'nokta' ? 'Durdur' : 'Braille Noktaları Oku'}
                  title={konusuyor === 'nokta' ? 'Durdur' : 'Braille Noktaları Oku'}
                >
                  {konusuyor === 'nokta'
                    ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  }
                </button>
                <button
                  type="button"
                  className={'araclar-seslendir-btn araclar-erisilebilir-btn' + (erisilebilirMod ? ' aktif' : '')}
                  onClick={() => setErisilebilirMod((v) => !v)}
                  aria-pressed={erisilebilirMod}
                  aria-label={erisilebilirMod ? 'Nokta görünümüne dön' : 'Erişilebilir braille metin görünümüne geç (Unicode braille glifleri)'}
                  title={erisilebilirMod ? 'Nokta görünümüne dön' : 'Erişilebilir mod (braille metin/font görünümü)'}
                >
                  {erisilebilirMod ? (
                    // Nokta grafiğine dönüş ikonu (6 nokta)
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                      <circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>
                      <circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
                    </svg>
                  ) : (
                    // Erişilebilir/font ikonu (büyük A harfi)
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20l6-14h4l6 14"/><path d="M7 14h10"/>
                    </svg>
                  )}
                </button>
                {erisilebilirMod && (
                  <button
                    type="button"
                    className={'araclar-seslendir-btn araclar-kopyala-btn' + (kopyalandi ? ' aktif' : '')}
                    onClick={async () => {
                      const metin = sayfaHucreler.map(noktalardanUnicode).join('');
                      if (!metin) return;
                      try {
                        await navigator.clipboard.writeText(metin);
                      } catch {
                        const ta = document.createElement('textarea');
                        ta.value = metin;
                        ta.style.position = 'fixed'; ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); } catch { /* yoksay */ }
                        document.body.removeChild(ta);
                      }
                      setKopyalandi(true);
                      setTimeout(() => setKopyalandi(false), 1500);
                    }}
                    aria-label={kopyalandi ? 'Panoya kopyalandı' : 'Braille metnini panoya kopyala'}
                    title={kopyalandi ? 'Kopyalandı ✓' : 'Panoya kopyala'}
                  >
                    {kopyalandi ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
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
            <div className="kisaltma-btn-grup" ref={sistemPaneliRef}>
              <button
                type="button"
                className={'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}
                onClick={() => setKisaltmaAktif((v) => !v)}
                aria-pressed={kisaltmaAktif}
                aria-label={'Kısaltma ' + (kisaltmaAktif ? 'Aktif' : 'Kapalı')}
                style={{ borderRadius: 'var(--radius) 0 0 var(--radius)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                  <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
                </svg>
                <span className="btn-yazi">Kısaltma</span>
              </button>
              <button
                type="button"
                className={'kisaltma-sistem-acilis-btn araclar-perkins-btn' + (kisaltmaAktif && sistemPaneli ? ' aktif' : '') + (kisaltmaAktif ? '' : ' disabled')}
                onClick={() => kisaltmaAktif && setSistemPaneli((v) => !v)}
                aria-expanded={sistemPaneli}
                aria-label="Kısaltma sistemleri"
                title="Hangi kısaltma sistemleri aktif?"
                style={{ borderRadius: '0 var(--radius) var(--radius) 0' }}
              >▾</button>
              {kisaltmaAktif && sistemPaneli && (
                <div className="kisaltma-sistem-panel" role="menu">
                  <p className="kisaltma-sistem-panel-baslik">Kısaltma Sistemleri</p>
                  {[
                    { key: 'hece',    label: 'Hece Kısaltmaları' },
                    { key: 'birHarf', label: 'Bir Harfli Kısaltmalar' },
                    { key: 'ikiHarf', label: 'İki Harfli Kısaltmalar' },
                    { key: 'kok',     label: 'Kelime Kökü Kısaltmaları' },
                    { key: 'parca',   label: 'Kelime Parçası Kısaltmaları' },
                  ].map(({ key, label }) => (
                    <label key={key} className="kisaltma-sistem-satir">
                      <input
                        type="checkbox"
                        checked={kisaltmaSistemler[key]}
                        onChange={() => sistemToggle(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
