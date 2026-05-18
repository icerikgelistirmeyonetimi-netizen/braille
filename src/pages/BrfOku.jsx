import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { toJpeg } from 'html-to-image';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import {
  hucreAnlami,
  SATIRDA_HUCRE,
  SAYFADA_SATIR,
  BRAILLE_SAYFA_BOYUTU,
  TABLET_SATIR_HUCRE,
  TABLET_SAYFADA_SATIR,
  TABLET_BRAILLE_SAYFA_BOYUTU,
  tabletDelikAynala,
  tabletSayfasiUnicodeKopyaMetni,
  sayfaBaslangicDurumlariniHesapla,
  sayfaAnlamlariniTopluHesapla,
  hucreleriBRFDizgesine,
  brfKagitBoyutunuDuzeltGirdi,
  brfIcindekiSayfaMetinleri,
  brfSatirininBrailleUnicodeKarsiligi,
  BRF_KAGIT_PRESET_STANDART,
  BRF_KAGIT_PRESET_DAR_A4_OZERI,
} from './Araclar.jsx';
import { kisaEtiket, noktalardanUnicode } from './BelgeBrf.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import BrailleGrid from '../components/BrailleGrid.jsx';
import { siraSayisiSonRakamEtiketiNoktaEki } from '../utils/brailleCevir.js';
// ��� Bile�en ��������������������������������������������������������������

export default function BrfOku() {
  const dosyaRef = useRef(null);
  const [okunanMetin, setOkunanMetin] = useState('');
  const [dosyaIcerik, setDosyaIcerik] = useState('');
  const [dosyaAdi, setDosyaAdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [kisaltmaAktif, setKisaltmaAktif] = useState(true);
  const [konusuyor, setKonusuyor] = useState(false); // 'metin' | 'nokta' | false
  const [dragOver, setDragOver] = useState(false);
  const [aktifTab, setAktifTab] = useState('metin');
  const [brailleSayfa, setBrailleSayfa] = useState(0);
  const [sayfaInput, setSayfaInput] = useState('');
  const [seciliHucre, setSeciliHucre] = useState(null);
  const [genisletAktif, setGenisletAktif] = useState(true);
  const [erisilebilirMod, setErisilebilirMod] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [tabletModuAktif, setTabletModuAktif] = useState(false);
  const [brfOnizlemeAcik, setBrfOnizlemeAcik] = useState(false);
  const [brfOnizlemePreset, setBrfOnizlemePreset] = useState('standart');
  const [brfOnizlemeOzelHucre, setBrfOnizlemeOzelHucre] = useState(String(SATIRDA_HUCRE));
  const [brfOnizlemeOzelSatir, setBrfOnizlemeOzelSatir] = useState(String(SAYFADA_SATIR));
  const brailleKutuRef = useRef(null);

  const SISTEM_VARSAYILAN = { hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true };
  const [kisaltmaSistemler, setKisaltmaSistemler] = useState(() => {
    const saved = localStorage.getItem('araclarKisaltmaSistemler');
    if (!saved) return { ...SISTEM_VARSAYILAN };
    try { return { ...SISTEM_VARSAYILAN, ...JSON.parse(saved) }; } catch { return { ...SISTEM_VARSAYILAN }; }
  });
  const [sistemPaneli, setSistemPaneli] = useState(false);
  const sistemPaneliRef = useRef(null);

  const sistemToggle = (key) => setKisaltmaSistemler((prev) => {
    const yeni = { ...prev, [key]: !prev[key] };
    localStorage.setItem('araclarKisaltmaSistemler', JSON.stringify(yeni));
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

  const [metinBrailleSonuc, setMetinBrailleSonuc] = useState({ hucreler: [], esleme: [], kaynak: '' });

  // Worker i�in referanslar
  const workerRef = useRef(null);
  const islemIdRef = useRef(0);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/araclarCevir.worker.js', import.meta.url), { type: 'module' });
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Dosya i�eri�i, k�saltma modu veya sistemler de�i�ince metni yeniden ��z
  useEffect(() => {
    if (!dosyaIcerik || !workerRef.current) return;
    setYukleniyor(true);
    islemIdRef.current += 1;
    const currentId = islemIdRef.current;
    
    workerRef.current.onmessage = (e) => {
      if (e.data.requestId !== currentId) return;
      if (e.data.actionType === 'brfToText' || typeof e.data.resultText === 'string') {
        if (e.data.ok) {
          setOkunanMetin(e.data.resultText);
          setYukleniyor(false);
        } else {
          setHata('�eviri s�ras�nda hata olu�tu: ' + (e.data.error || ''));
          setYukleniyor(false);
        }
      }
    };

    // Araya setTimeout koyarak React'in 'yukleniyor: true' state'ini �izmesine izin verelim
    const t = setTimeout(() => {
      workerRef.current.postMessage({
        action: 'brfToText',
        text: dosyaIcerik,
        kisaltmali: kisaltmaAktif,
        opts: kisaltmaSistemler,
        requestId: currentId
      });
    }, 50);
    return () => clearTimeout(t);
  }, [dosyaIcerik, kisaltmaAktif, kisaltmaSistemler]);

  // Metin olu�tuktan sonra esleme dizisini hesaplamak i�in worker kullan
  useEffect(() => {
    if (!okunanMetin || !workerRef.current) {
      setMetinBrailleSonuc({ hucreler: [], esleme: [], kaynak: '' });
      return;
    }
    islemIdRef.current += 1;
    const currentId = islemIdRef.current;
    
    const workerHandler = workerRef.current.onmessage;
    workerRef.current.onmessage = (e) => {
      if (e.data.requestId === currentId) {
        if (e.data.ok && Array.isArray(e.data.hucreler) && Array.isArray(e.data.esleme)) {
          setMetinBrailleSonuc({
            hucreler: e.data.hucreler,
            esleme: e.data.esleme,
            kaynak: e.data.kaynak || okunanMetin,
          });
        }
      } else if (workerHandler) {
        workerHandler(e);
      }
    };

    const t = setTimeout(() => {
      workerRef.current.postMessage({
        action: 'textToBrf',
        text: okunanMetin,
        kisaltmali: kisaltmaAktif,
        opts: { ...kisaltmaSistemler, buyukHarfIsareti: true, sayiIsareti: true },
        requestId: currentId
      });
    }, 50);
    return () => clearTimeout(t);
  }, [okunanMetin, kisaltmaAktif, kisaltmaSistemler]);

  const temizle = () => {
    setOkunanMetin(''); setDosyaIcerik(''); setDosyaAdi('');
    setHata(''); setYukleniyor(false);
    setAktifTab('metin'); setBrailleSayfa(0); setSeciliHucre(null);
    setMetinBrailleSonuc({ hucreler: [], esleme: [], kaynak: '' });
    if (konusuyor) { konusmayiDurdur(); setKonusuyor(false); }
  };

  const processBrfFile = (dosya) => {
    if (!dosya) return;
    if (!dosya.name.toLowerCase().endsWith('.brf')) {
      setHata('Lütfen .brf uzantılı bir dosya seçin.');
      return;
    }
    setHata('');
    setDosyaAdi(dosya.name);
    setYukleniyor(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const icerik = ev.target.result;
      setDosyaIcerik(icerik);
      // setYukleniyor(false); => Worker'a devrediliyor
    };
    reader.onerror = () => { setHata('Dosya okunurken hata oluştu.'); setYukleniyor(false); };
    reader.readAsText(dosya, 'latin1');
  };

  const sesToggle = (alan, metinFn) => {
    if (konusuyor === alan) { konusmayiDurdur(); setKonusuyor(false); return; }
    const metin = metinFn();
    if (!metin || !metin.trim()) return;
    setKonusuyor(alan);
    konus(metin, { kesintiyle: true, onSon: () => setKonusuyor(false) });
  };

  const metniSeslendir = () => sesToggle('metin', () => okunanMetin);

  const hucreler = metinBrailleSonuc.hucreler;
  const gorunumEsleme = metinBrailleSonuc.esleme.length === hucreler.length ? metinBrailleSonuc.esleme : null;
  const hucreAnlamiOpts = gorunumEsleme ? { kaynak: metinBrailleSonuc.kaynak || okunanMetin, esleme: gorunumEsleme } : undefined;

  const brfOnizlemeKagitBoyutu = useMemo(() => {
    if (brfOnizlemePreset === BRF_KAGIT_PRESET_STANDART.id)
      return { satirdaHucre: BRF_KAGIT_PRESET_STANDART.satirdaHucre, sayfadaSatir: BRF_KAGIT_PRESET_STANDART.sayfadaSatir };
    if (brfOnizlemePreset === BRF_KAGIT_PRESET_DAR_A4_OZERI.id)
      return { satirdaHucre: BRF_KAGIT_PRESET_DAR_A4_OZERI.satirdaHucre, sayfadaSatir: BRF_KAGIT_PRESET_DAR_A4_OZERI.sayfadaSatir };
    return brfKagitBoyutunuDuzeltGirdi({
      satirdaHucre: Number.parseInt(String(brfOnizlemeOzelHucre), 10),
      sayfadaSatir: Number.parseInt(String(brfOnizlemeOzelSatir), 10),
    });
  }, [brfOnizlemePreset, brfOnizlemeOzelHucre, brfOnizlemeOzelSatir]);

  const brfOnizlemeDosyaMetni = useMemo(() => {
    if (!brfOnizlemeAcik) return '';
    if (!hucreler.length) return '';
    try {
      // It's already from a BRF file, but the preview formats it into pages
      return hucreleriBRFDizgesine(hucreler, brfOnizlemeKagitBoyutu);
    } catch (err) {
      console.error('BRF ön izleme hatası:', err);
      return '';
    }
  }, [brfOnizlemeAcik, hucreler, brfOnizlemeKagitBoyutu]);

  const brfOnizlemeSayfalari = useMemo(
    () => brfIcindekiSayfaMetinleri(brfOnizlemeDosyaMetni),
    [brfOnizlemeDosyaMetni],
  );

  const brfOnizlemeUnicodeSayfalari = useMemo(() => {
    if (!brfOnizlemeAcik || brfOnizlemeSayfalari.length === 0) return [];
    return brfOnizlemeSayfalari.map((sayfaMetni) =>
      sayfaMetni.split('\n').map((satir) => brfSatirininBrailleUnicodeKarsiligi(satir)),
    );
  }, [brfOnizlemeAcik, brfOnizlemeSayfalari]);

  const brailleSayfaBoyutu = tabletModuAktif ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
  const toplamSayfa = Math.max(1, Math.ceil(hucreler.length / brailleSayfaBoyutu));
  const sayfaBaslangic = brailleSayfa * brailleSayfaBoyutu;
  const sayfaHucreler = hucreler.slice(sayfaBaslangic, sayfaBaslangic + brailleSayfaBoyutu);
  const sayfaSonIndeks = sayfaBaslangic + sayfaHucreler.length;
  const sayfaBaslangicDurumlari = useMemo(
    () => sayfaBaslangicDurumlariniHesapla(hucreler, brailleSayfaBoyutu, hucreAnlamiOpts),
    [hucreler, brailleSayfaBoyutu, hucreAnlamiOpts],
  );
  const sayfaHucreAnlamlari = useMemo(
    () => sayfaAnlamlariniTopluHesapla(hucreler, sayfaBaslangic, sayfaSonIndeks, kisaltmaAktif, {
      ...hucreAnlamiOpts,
      baslangicDurumu: sayfaBaslangicDurumlari[brailleSayfa],
    }),
    [hucreler, sayfaBaslangic, sayfaSonIndeks, kisaltmaAktif, hucreAnlamiOpts, sayfaBaslangicDurumlari, brailleSayfa],
  );

  const tabletSatirYerelleri = useMemo(() => {
    const n = sayfaHucreler.length;
    const satirlar = [];
    for (let b = 0; b < n; b += TABLET_SATIR_HUCRE) {
      const yerel = [];
      for (let j = b; j < Math.min(b + TABLET_SATIR_HUCRE, n); j++) yerel.push(j);
      satirlar.push(yerel);
    }
    return satirlar;
  }, [sayfaBaslangic, sayfaHucreler.length]);

  const erisilebilirTabletUnicodeHucreleri = useMemo(() => {
    if (!erisilebilirMod || !tabletModuAktif || !okunanMetin) return null;
    if (sayfaSonIndeks <= sayfaBaslangic) return [];
    const dilim = hucreler.slice(sayfaBaslangic, sayfaSonIndeks);
    return dilim.map((noktalar) => noktalardanUnicode(tabletDelikAynala(noktalar)));
  }, [erisilebilirMod, tabletModuAktif, okunanMetin, hucreler, sayfaBaslangic, sayfaSonIndeks]);

  useEffect(() => { setSeciliHucre(null); }, [brailleSayfa, aktifTab, kisaltmaAktif]);

  useEffect(() => {
    if (!seciliHucre) return;
    const kapat = (e) => { if (e.key === 'Escape') setSeciliHucre(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [seciliHucre]);

  useEffect(() => {
    if (!brfOnizlemeAcik) return;
    const kap = (e) => {
      if (e.key === 'Escape') setBrfOnizlemeAcik(false);
    };
    window.addEventListener('keydown', kap);
    return () => window.removeEventListener('keydown', kap);
  }, [brfOnizlemeAcik]);

  const noktalariSeslendir = () => sesToggle('nokta', () => {
    if (!hucreler.length) return '';
    const parcalar = [];
    for (let i = 0; i < hucreler.length; i++) {
      const n = hucreler[i];
      if (n.length === 0) { parcalar.push('boşluk'); continue; }
      const noktaMetni = n.join(' ');
      const anlam = hucreAnlami(hucreler, i, kisaltmaAktif, hucreAnlamiOpts);
      if (anlam.tip === 'isaret' || anlam.tip === 'kisaltma' || anlam.tip === 'noktalama') {
        parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik.replace(/"/g, '')}`);
        continue;
      }
      const harf = anlam.harf || (anlam.baslik.match(/Harf:\s*(.+)/)?.[1] || '');
      parcalar.push(harf ? `nokta ${noktaMetni}, ${harf}` : `nokta ${noktaMetni}`);
    }
    return parcalar.join('. ');
  });

  const jpgIndir = useCallback(async () => {
    const el = brailleKutuRef.current;
    if (!el) return;
    el.classList.add('jpg-export');
    const oncekiOverflowY = el.style.overflowY;
    const oncekiMaxH = el.style.maxHeight;
    const oncekiH = el.style.height;
    el.style.overflowY = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
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

  const brailleTabAc = () => { setAktifTab('braille'); setBrailleSayfa(0); };

  return (
    <div className="page yazma-page araclar-page">

      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="BRF -> Metin" />
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <input
          ref={dosyaRef}
          type="file"
          accept=".brf"
          onChange={(e) => { processBrfFile(e.target.files?.[0]); e.target.value = ''; }}
          style={{ display: 'none' }}
          aria-label="BRF dosyasını seç"
        />

        {/* Drop zone */}
        {!okunanMetin && !yukleniyor && (
          <div
            className={'belge-drop-zone' + (dragOver ? ' drag-over' : '')}
            onClick={() => dosyaRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); processBrfFile(e.dataTransfer.files?.[0]); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            role="button"
            tabIndex={0}
            aria-label="BRF dosyasını seç"
            onKeyDown={(e) => e.key === 'Enter' && dosyaRef.current?.click()}
          >
            <div className="belge-drop-ikon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M36 4H16a4 4 0 0 0-4 4v48a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V20Z"/>
                <path d="M36 4v16h16"/>
                <circle cx="22" cy="36" r="3" fill="currentColor" stroke="none"/>
                <circle cx="22" cy="46" r="3" fill="currentColor" stroke="none"/>
                <circle cx="32" cy="31" r="3" fill="currentColor" stroke="none"/>
                <circle cx="32" cy="41" r="3" fill="currentColor" stroke="none"/>
                <circle cx="42" cy="36" r="3" fill="currentColor" stroke="none"/>
                <circle cx="42" cy="46" r="3" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <p className="belge-drop-baslik">BRF dosyasını seçin</p>
            <p className="belge-drop-alt">veya dosyayı buraya sürükleyin</p>
            <div className="belge-format-badges">
              <span className="belge-format-badge">.brf</span>
            </div>
            {hata && <p className="belge-drop-hata" role="alert">{hata}</p>}
          </div>
        )}

        {/* Yükleniyor */}
        {yukleniyor && (
          <div className="belge-yukleniyor">
            <span className="belge-yukleniyor-spinner" aria-hidden="true" />
            <span>Okunuyor...</span>
          </div>
        )}

        {/* Dosya yüklendi */}
        {!yukleniyor && okunanMetin && (
          <>
            <div className="belge-dosya-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="belge-dosya-adi">{dosyaAdi}</span>
              <span className="belge-dosya-karakter">{okunanMetin.length.toLocaleString('tr')} karakter</span>
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

            <div className="araclar-alan-sarici belge-tab-icerik-sarici">
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

              {/* Metin sekmesi */}
              {aktifTab === 'metin' && (
                <div className="belge-metin-sarici">
                  <textarea
                    className="belge-metin-textarea"
                    value={okunanMetin}
                    onChange={(e) => setOkunanMetin(e.target.value)}
                    aria-label="BRF dosyasından okunan metin (düzenlenebilir)"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <button
                    type="button"
                    className={'araclar-seslendir-btn' + (konusuyor === 'metin' ? ' aktif' : '')}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={metniSeslendir}
                    disabled={!okunanMetin.trim()}
                    aria-label={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                    title={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                  >
                    {konusuyor === 'metin'
                      ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    }
                  </button>
                </div>
              )}

              {/* Braille sekmesi */}
              {aktifTab === 'braille' && (
                <div className="araclar-nokta-sarici">
                  {erisilebilirMod ? (
                    <div
                      ref={brailleKutuRef}
                      className={'belge-braille-erisilebilir' + (tabletModuAktif ? ' belge-braille-erisilebilir-tablet' : '')}
                      role="region"
                      aria-label={(tabletModuAktif ? `Tablet: ${TABLET_SATIR_HUCRE} hücre/satır, ${TABLET_SAYFADA_SATIR} satır/sayfa. ` : '')
                        + `Erişilebilir braille metin görünümü, sayfa ${brailleSayfa + 1} / ${toplamSayfa}`}
                      lang="tr"
                    >
                      <div className={'belge-braille-text-unicode-group' + (tabletModuAktif ? ' belge-braille-text-unicode-group-tablet' : '')} aria-label={okunanMetin}>
                        {tabletModuAktif ? (
                          <div className="tablet-numara-sargisi">
                            <div className="tablet-kolon-basliklari">
                              <div className="tablet-satir-numarasi" style={{ visibility: 'hidden' }}>00</div>
                              <div className="araclar-tablet-satir" style={{ flexGrow: 1, margin: 0, padding: 0 }}>
                                {Array.from({ length: TABLET_SATIR_HUCRE }, (_, i) => (
                                  <div key={i} className="tablet-kolon-numarasi">{i + 1}</div>
                                ))}
                              </div>
                            </div>
                            {tabletSatirYerelleri.map((yerler, ri) => (
                              <div key={`er-t-${brailleSayfa}-${ri}`} className="tablet-satir-sargisi">
                                <div className="tablet-satir-numarasi">{ri + 1}</div>
                                <div className="araclar-tablet-er-satir" role="row" style={{ flexGrow: 1 }}>
                                  {yerler.map((i) => {
                                    const globalIdx = sayfaBaslangic + i;
                                    return (
                                      <span
                                        key={globalIdx}
                                        className="unicode-hucre araclar-tablet-er-unicode-hucre"
                                      >
                                        {erisilebilirTabletUnicodeHucreleri?.[i] ?? ''}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          sayfaHucreler.map((noktalar, i) => (
                            <span
                              key={sayfaBaslangic + i}
                              className="unicode-hucre"
                              style={{
                                fontSize: '.2 em',
                                display: 'inline-block',
                                padding: '0 1px',
                                lineHeight: '1',
                              }}
                            >
                              {noktalardanUnicode(noktalar)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                  <div
                    ref={brailleKutuRef}
                    className={'araclar-nokta-gorunus belge-braille-kutu'
                      + (genisletAktif ? ' genisletilmis' : '')
                      + (tabletModuAktif ? ' araclar-tablet-mod' : '')}
                    aria-label={tabletModuAktif
                      ? `Braille nokta görünümü (tablet: ${TABLET_SATIR_HUCRE} hücre × ${TABLET_SAYFADA_SATIR} satır, sağdan sola)`
                      : 'Braille nokta görünümü'}
                  >
                    {tabletModuAktif ? (
                      <div className="araclar-tablet-grid">
                        {/* Üst kolon numaraları */}
                        <div className="tablet-satir-numarasi" style={{ visibility: 'hidden' }}>00</div>
                        {Array.from({ length: TABLET_SATIR_HUCRE }, (_, i) => (
                          <div key={`col-${i}`} className="tablet-kolon-numarasi">{i + 1}</div>
                        ))}

                        {/* Satırlar */}
                        {tabletSatirYerelleri.map((yerler, ri) => (
                          <React.Fragment key={`t-${brailleSayfa}-${ri}`}>
                            <div className="tablet-satir-numarasi">{ri + 1}</div>
                            {yerler.map((i) => {
                              const noktalar = sayfaHucreler[i];
                              const globalIdx = sayfaBaslangic + i;
                              const anlam = hucreAnlami(hucreler, globalIdx, kisaltmaAktif, hucreAnlamiOpts);
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
                                  '',
                                  [],
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
                                  <BrailleCell aktifNoktalar={tabletDelikAynala(noktalar)} tiklanabilir={false} kesfedilebilir={false} />
                                  {genisletAktif && (
                                    <div className="belge-hucre-etiket" aria-hidden="true">{etiket || '\u00A0'}</div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Eksik hücreleri doldur */}
                            {Array.from({ length: TABLET_SATIR_HUCRE - yerler.length }).map((_, emptyIdx) => (
                              <div key={`empty-${ri}-${emptyIdx}`} />
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <BrailleGrid
                        hucreler={hucreler}
                        indices={Array.from({ length: sayfaHucreler.length }, (_, i) => i)}
                        baseIndex={sayfaBaslangic}
                        kisaltmaAktif={kisaltmaAktif}
                        genisletAktif={genisletAktif}
                        seciliIndex={(seciliHucre && typeof seciliHucre.index === 'number') ? seciliHucre.index : -1}
                        onSelect={(idx, anlam) => setSeciliHucre(seciliHucre && seciliHucre.index === idx ? null : { index: idx, anlam })}
                        anlamlar={sayfaHucreAnlamlari}
                        buildEtiket={(anlam, idx) => `${kisaEtiket(anlam)}${siraSayisiSonRakamEtiketiNoktaEki(anlam, idx, hucreler, '', [])}`}
                      />
                    )}
                  </div>
                  )}
                  {!erisilebilirMod && seciliHucre && (
                    <div className="braille-hucre-popup" role="dialog" aria-label="Hücre anlamı">
                      <div className="bhp-header">
                        <div className="bhp-baslik-bloku">
                          <span className="bhp-baslik-kucuk">Hücre {seciliHucre.index + 1}</span>
                          <span className={'bhp-anlam bhp-tip-' + seciliHucre.anlam.tip}>
                            {seciliHucre.anlam.baslik}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="bhp-kapat"
                          onClick={() => setSeciliHucre(null)}
                          aria-label="Kapat"
                        >X</button>
                      </div>
                      <div className="bhp-noktalar">Nokta: {seciliHucre.anlam.noktaStr}</div>
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
                            if (!isNaN(n) && n >= 1 && n <= toplamSayfa) setBrailleSayfa(n - 1);
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
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                        <circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>
                        <circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
                      </svg>
                    ) : (
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
                      title={kopyalandi ? 'Kopyalandı' : 'Kopyala'}
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
            </div>
          </>
        )}
      </div>

      {brfOnizlemeAcik && (
        <div
          className="araclar-brf-onizle-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setBrfOnizlemeAcik(false); }}
        >
          <div
            className="araclar-brf-onizle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="araclar-brf-onizle-baslik"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="araclar-brf-onizle-ust">
              <h2 id="araclar-brf-onizle-baslik" className="araclar-brf-onizle-baslik">
                Kabartmalı çıktı ön izlemesi (BRF sırası)
              </h2>
              <button
                type="button"
                className="araclar-brf-onizle-kapat"
                onClick={() => setBrfOnizlemeAcik(false)}
                aria-label="Kapat"
              >
                X
              </button>
            </div>
            <div className="araclar-brf-onizle-govde">
              <aside className="araclar-brf-onizle-panel" aria-label="Kağıt ve satır düzeni">
                <p className="araclar-brf-onizle-panel-baslik">Sayfa düzeni</p>
                <p className="araclar-brf-onizle-aciklama">
                  Sıra başına hücre ve sayfa başına satır yazıcısındaki delik satırlarına karşılık gelir. Seçilen düzen ön izlemede kullanılır.
                </p>
                <div className="araclar-brf-onizle-sec">
                  {[BRF_KAGIT_PRESET_STANDART, BRF_KAGIT_PRESET_DAR_A4_OZERI].map((p) => (
                    <label key={p.id} className="araclar-brf-onizle-radio">
                      <input
                        type="radio"
                        name="brf-kagit"
                        checked={brfOnizlemePreset === p.id}
                        onChange={() => {
                          setBrfOnizlemePreset(p.id);
                          setBrfOnizlemeOzelHucre(String(p.satirdaHucre));
                          setBrfOnizlemeOzelSatir(String(p.sayfadaSatir));
                        }}
                      />
                      <span>{p.etiket}</span>
                    </label>
                  ))}
                  <label className="araclar-brf-onizle-radio">
                    <input
                      type="radio"
                      name="brf-kagit"
                      checked={brfOnizlemePreset === 'ozel'}
                      onChange={() => setBrfOnizlemePreset('ozel')}
                    />
                    <span>Özel (elle)</span>
                  </label>
                </div>
                {brfOnizlemePreset === 'ozel' && (
                  <div className="araclar-brf-onizle-ozel">
                    <label className="araclar-brf-onizle-satir">
                      <span>Sıra başına hücre</span>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        inputMode="numeric"
                        value={brfOnizlemeOzelHucre}
                        onChange={(e) => setBrfOnizlemeOzelHucre(e.target.value)}
                      />
                    </label>
                    <label className="araclar-brf-onizle-satir">
                      <span>Sayfa başına satır</span>
                      <input
                        type="number"
                        min={5}
                        max={64}
                        inputMode="numeric"
                        value={brfOnizlemeOzelSatir}
                        onChange={(e) => setBrfOnizlemeOzelSatir(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <p className="araclar-brf-onizle-kucuk">
                  Ön izleme Unicode braille ile gösterilir.
                </p>
              </aside>
              <div className="araclar-brf-onizle-icerik" tabIndex={0}>
                {brfOnizlemeSayfalari.length === 0 ? (
                  <p className="araclar-brf-onizle-bos">Ön izlenecek BRF içeriği yok.</p>
                ) : (
                  brfOnizlemeUnicodeSayfalari.map((unicodeSatirlari, sayfaInd) => (
                    <div key={sayfaInd} className="araclar-brf-onizle-sayfa">
                      <div className="araclar-brf-onizle-sayfa-baslik">
                        Sayfa {sayfaInd + 1} / {brfOnizlemeSayfalari.length}
                        <span className="araclar-brf-onizle-sayfa-oran">
                          {brfOnizlemeKagitBoyutu.satirdaHucre} x {brfOnizlemeKagitBoyutu.sayfadaSatir}
                        </span>
                      </div>
                      <pre className="araclar-brf-onizle-pre" lang="und">
                        {unicodeSatirlari.map((satirUnicode, si) => (
                          <div key={si} className="araclar-brf-onizle-satir">
                            {satirUnicode}
                          </div>
                        ))}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alt aksiyonlar */}
      {okunanMetin && (
        <div className="yazma-bolum yazma-bolum-alt">
          <div className="controls">
            <div className="araclar-brf-grup">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(okunanMetin).catch(() => {})}
                aria-label="Panoya Kopyala"
                className="araclar-brf-grup-ilk"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span className="btn-yazi">Kopyala</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([okunanMetin], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = (dosyaAdi.replace(/\.brf$/i, '') || 'metin') + '.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                aria-label="TXT olarak indir"
                className="araclar-brf-grup-orta"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                  <path d="M12 3v13M7 11l5 5 5-5"/>
                  <path d="M5 20h14"/>
                </svg>
                <span className="btn-yazi">TXT İndir</span>
              </button>
              <button
                type="button"
                disabled={!okunanMetin.trim()}
                onClick={() => setBrfOnizlemeAcik(true)}
                className="araclar-brf-grup-son araclar-brf-grup-onizle"
                aria-label="Kabartmalı çıktı için BRF ön izlemesi"
                title="Ön izle ö kağıda göre sıra ve satır (form feed)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                  <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                </svg>
              </button>
            </div>
            
            <button
              type="button"
              disabled={!okunanMetin}
              className={'araclar-perkins-btn araclar-perkins-btn--yalnizca-ikon' + (tabletModuAktif ? ' aktif' : '')}
              onClick={() => {
                const eskiBoyut = tabletModuAktif ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
                const yeniTablet = !tabletModuAktif;
                const yeniBoyut = yeniTablet ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
                setBrailleSayfa((sayfa) => Math.floor((sayfa * eskiBoyut) / yeniBoyut));
                setTabletModuAktif(yeniTablet);
              }}
              aria-pressed={tabletModuAktif}
              aria-label={`Tablet modu ${tabletModuAktif ? 'açık' : 'kapalı'}`}
              title={'Tablet modu (' + (tabletModuAktif ? 'açık' : 'kapalı') + `). Sayfa: ${TABLET_SATIR_HUCRE}x${TABLET_SAYFADA_SATIR} hücre (${TABLET_BRAILLE_SAYFA_BOYUTU}); satır başına ${TABLET_SATIR_HUCRE} hücre, sağdan sola; delik yönüne göre yansıtılmış nokta`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="7" y1="8" x2="7" y2="16" />
                <line x1="17" y1="8" x2="17" y2="16" />
              </svg>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
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
        </div>
      )}
    </div>
  );
}
