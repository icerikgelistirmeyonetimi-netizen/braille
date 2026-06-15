import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MusicNoteGlyph from './svg/MusicNoteGlyph';
import BeamGroup from './svg/BeamGroup';
import RestGlyph from './svg/RestGlyph';
import StaffLines from './svg/StaffLines';
import SlurTiePath from './svg/SlurTiePath';
import MuzikScoreBrailleOverlay from './MuzikScoreBrailleOverlay.jsx';
import BrailleDetayPanel from './BrailleDetayPanel.jsx';
import { keySignatureAccidentalsAl } from '../../utils/music-brf/musicPianoAudioHelpers.js';
import MuzikBarlineTimeSignatureModal from './MuzikBarlineTimeSignatureModal.jsx';
import MuzikTimeSignatureGlyph from './MuzikTimeSignatureGlyph.jsx';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import {
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
  MUZIK_SUSLEMELER,
  MUZIK_DINAMIKLER,
  MUZIK_NUANS_ONCE,
  MUZIK_NUANS_SONRA,
  MUZIK_ZAMAN_IMZASI,
} from '../../data/muzik.js';
import { MUZIK_GRUPLAMA_SECENEKLERI } from '../../utils/music/musicConstants.js';
import {
  brailleLejantKeyAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import {
  notaGorselYHesapla,
  notaGorselYClampEdildiMi,
  notaYHesapla,
} from '../../utils/music-brf/musicScoreHelpers.jsx';
import ScoreBarlineGlyph from './ScoreBarlineGlyph.jsx';
import {
  skorBarlineTipiAl,
  skorFinalBarlineSatirSonuMu,
  skorBarlineXAl,
  SCORE_STAFF_TOP_Y,
  SCORE_STAFF_BOTTOM_Y,
} from '../../utils/music-brf/musicVisualBarlineHelpers.js';
import {
  skorSatirSagXHesapla,
  SCORE_ROW_RIGHT_INSET,
} from '../../utils/music-brf/musicVisualLayoutHelpers.js';
import { notaGraceMi } from '../../utils/music-brf/musicMeasureHelpers.js';
import {
  BRAILLE_HUCRE_TEMA,
  DONANIM_LISTESI,
  SVG_CLEF_X,
  SVG_KEY_ACCIDENTAL_GAP,
  SVG_ROW_HEIGHT,
  SVG_ROW_VIEWBOX_Y,
  SVG_SCORE_BRAILLE_Y_OFFSET,
  SVG_SCORE_BRAILLE_NOTE_GAP,
  SVG_SAG_SINIR_X,
  SVG_STAFF_LEFT_X,
  suslemeSmuflGlyph,
  suslemeGraceMi,
  dinamikModifierMi,
  dinamikSmuflGlyph,
  dinamikHairpinGlyph,
  dinamikEtiketAl,
  nuansSmuflGlyph,
  nuansModifierMi,
} from '../../utils/music-brf/musicConstants.js';
import { clefGlyph, clefStaffY, BRAVURA_FONT, glyphChar, ACCIDENTAL_CP } from '../../utils/music-brf/bravuraMetrics.js';
import { ayarlariAl, ayarlariDinle } from '../../utils/ayarlar.js';
import { konus } from '../../utils/ses.js';

// Donanım (key signature) ♯/♭ — SMuFL standalone (aksidentalle aynı standart).
const KEY_SHARP = glyphChar(ACCIDENTAL_CP.sharp);
const KEY_FLAT = glyphChar(ACCIDENTAL_CP.flat);

// Tuplet rakamı → SMuFL Bravura tuplet glyph'i. SMuFL "Tuplets" aralığı:
// tuplet0 = U+E880 … tuplet9 = U+E889 (porte üstüne özel çizilen rakamlar).
const TUPLET_RAKAM_GLYPH = (sayi) => String(sayi ?? '')
  .split('')
  .map((ch) => (/[0-9]/.test(ch) ? String.fromCodePoint(0xE880 + Number(ch)) : ch))
  .join('');

// Tuplet 'played' sayısı → Türkçe ad (ekran okuyucu için).
const TUPLET_TURKCE_AD = { 2: 'ikileme', 3: 'üçleme', 4: 'dörtleme', 5: 'beşleme', 6: 'altılama', 7: 'yedileme' };

// Ölçü sayıları TEK KAYNAK: data/muzik.js MUZIK_ZAMAN_IMZASI (Türk/aksak 5/8, 7/8, 9/8 dahil).
// 'ad' sayısal forma indirgenir ('2/2 (sebare)' → '2/2'); motorun desteklediği ekstra bileşik metreler
// (10/8, 12/8) + C/𝄵 kısayolları korunur. Dedup.
const _tsSayisalFormu = (ad = '') => {
  const m = String(ad).match(/(\d+)\s*\/\s*(\d+)/);
  return m ? `${m[1]}/${m[2]}` : null;
};
const HEADER_TS_OPTIONS = [
  ...new Set([
    ...MUZIK_ZAMAN_IMZASI.map((z) => _tsSayisalFormu(z.ad)).filter(Boolean),
    '10/8', '12/8', 'common', 'cut common',
  ]),
];

// Aksak metrenin gruplama seçenekleri (yoksa null) — staff header TS menüsünde gruplama seçtirmek için.
const headerGruplamaSecenekleriAl = (ad) => {
  const m = String(ad || '').match(/(\d+)\s*\/\s*(\d+)/);
  return m ? (MUZIK_GRUPLAMA_SECENEKLERI[`${m[1]}/${m[2]}`] || null) : null;
};

const slurMu = (bag) => {
  const tip = String(bag?.tip || bag?.kayit?.tip || '').toLowerCase();
  const mode = String(bag?.mode || bag?.kayit?.mode || 'single').toLowerCase();
  return tip === 'slur' && mode === 'single';
};

const tieMi = (bag) => {
  const tip = String(bag?.tip || bag?.kayit?.tip || '').toLowerCase();
  const ad = String(bag?.kayit?.ad || bag?.ad || '').toLowerCase();
  return tip === 'tie' || /tie|uzatma/.test(ad);
};

const brfImportBagMu = (bag) => (
  bag?.importKaynak === 'brf-reader' ||
  bag?.kayit?.importKaynak === 'brf-reader' ||
  bag?.kaynak === 'brf-reader' ||
  bag?.source === 'brf-reader'
);

const bagCizimBasSonAl = (bag) => {
  const ids = Array.isArray(bag?.notaIdler) ? bag.notaIdler.filter(Boolean) : [];
  if (ids.length >= 2) {
    return {
      basId: ids[0],
      sonId: ids[ids.length - 1],
    };
  }
  return {
    basId: bag?.basId,
    sonId: bag?.sonId,
  };
};

const ardisikSlurlariBirlestir = (baglar = []) => {
  const sonuc = [];
  const kullanildi = new Set();

  const singleSlurlar = baglar.filter((bag) => slurMu(bag) && !tieMi(bag) && !brfImportBagMu(bag));
  const digerleri = baglar.filter((bag) => !slurMu(bag) || tieMi(bag) || brfImportBagMu(bag));

  if (baglar.some(brfImportBagMu)) {
  }

  for (const bag of singleSlurlar) {
    if (!bag?.id || kullanildi.has(bag.id)) continue;

    const zincir = [bag];
    kullanildi.add(bag.id);

    let currentEnd = bag.sonId || bag.notaIdler?.[bag.notaIdler.length - 1];
    let devamVar = true;

    while (devamVar) {
      devamVar = false;

      const next = singleSlurlar.find((aday) => {
        if (!aday?.id || kullanildi.has(aday.id)) return false;

        const adayBas = aday.basId || aday.notaIdler?.[0];
        return adayBas && currentEnd && adayBas === currentEnd;
      });

      if (next) {
        zincir.push(next);
        kullanildi.add(next.id);
        currentEnd = next.sonId || next.notaIdler?.[next.notaIdler.length - 1];
        devamVar = true;
      }
    }

    if (zincir.length === 1) {
      sonuc.push(bag);
      continue;
    }

    const ilk = zincir[0];
    const son = zincir[zincir.length - 1];
    const notaIdler = [];

    zincir.forEach((z) => {
      const ids = Array.isArray(z.notaIdler) && z.notaIdler.length
        ? z.notaIdler
        : [z.basId, z.sonId].filter(Boolean);

      ids.forEach((id) => {
        if (id && !notaIdler.includes(id)) {
          notaIdler.push(id);
        }
      });
    });

    sonuc.push({
      ...ilk,
      id: `${ilk.id}-merged-${son.id}`,
      tip: 'slur',
      mode: 'single',
      basId: ilk.basId || notaIdler[0],
      sonId: son.sonId || notaIdler[notaIdler.length - 1],
      notaIdler,
      mergedFrom: zincir.map((z) => z.id),
    });
  }

  const merged = [...digerleri, ...sonuc];
  if (baglar.some(brfImportBagMu)) {
  }

  return merged;
};

export default function MuzikScoreSvg({
  muzikSatirlar,
  olcuBrailleSonuclari,
  notaEkleKonuma,
  seciliSureIdx,
  setSeciliSureIdx,
  sonKullanilanOktav,
  setSonKullanilanOktav,
  notaSuresiniCiftTiklaDegistir,
  svgGlobalIndexBul,
  svgYerlesimHaritasi,
  svgCizilecekOgeler,
  svgBeamGruplari,
  ogeXHesapla,
  satirIcindeBeamliMi,
  ilkSatirHeaderBilgisi,
  onHeaderBrailleAc,
  muzikHeader,
  muzikBaglar,
  barlineMenu,
  setBarlineMenu,
  barlineTiklandi,
  inlineTimeSignatureEkle,
  inlineKeySignatureEkle,
  olcuCizgisiniDegistir,
  olcuCizgisiniSil,
  hoverBrailleOgeId,
  hoverBrailleBagId,
  hoverCizgiBagId,
  setHoverBrailleOgeId,
  setHoverBrailleBagId,
  setHoverCizgiBagId,
  seciliOgeId,
  sonEklenenOgeId,
  seciliBagId,
  setSeciliOgeId,
  setSeciliBagId,
  muzikSatirOlculeri,
  setPopupAcik,
  setAnahtarPopupAcik,
  mevcutAnahtar,
  anahtarFontClassAl,
  muzikOgeleri,
  notaTiklandi,
  bagTipiTieMi,
  bagYonunuHesapla,
  bagCizimNoktalari,
  bagHitRectHesapla,
  ledgerCizgileri,
  gorunenSatirBrailleLejantMaplari,
  gorunenSatirBrailleLejantlari,
  baslangicBrailleBilgisi,
  seciliBagiSil,
  setTimeSignature,
  donanimiDegistir,
  muzikTupletler,
  tupletSil,
  playMeasure,
  playFromOge,
  pause,
  // Playback props (from parent)
  playNote,
  isPlaying = false,
  playbackOgeId = null,
  aktifPlaybackSatirIdx = null,
  // Volta ekleme modu
  voltaEkleModu = null,
  voltaEkleBaslangicId = null,
  voltaBarlineEkle,
  voltaSil,
  voltaGuncelle,
  seciliNotayiGuncelle,
  seciliOgeyiSil,
  ogeleriSil,
  seciliSusuNotayaCevir,
  susEkleKonuma,
  manuelOlcuCizgisiEkle,
  bagAraclari,
  seciliNotaModifierSil,
  seciliNotaModifierGuncelle,
  bekleyenModifier = null,
  setMuzikHeader,
  tempoListesi = [],
  onPerkinsAc,
}) {
  const [tempoDropdownPos, setTempoDropdownPos] = useState(null); // {x, y} | null
  // Satır içi düzenleme: title | composer | tempo
  const [inlineEdit, setInlineEdit] = useState(null); // { alan, x, y, w, deger }
  const inlineEditRef = useRef(null);

  // ── Glyph dikey karşı-ölçek ────────────────────────────────────────────
  // SVG preserveAspectRatio="none" + sabit 220px yükseklik → dikey ölçek sabit
  // (220/340=0.647), yatay ölçek genişlikle değişir. TÜM font glyph'leri (sol/fa
  // anahtarı, nota kafası, zaman imzası, donanım ♯♭, aksidental, sus, dinamik,
  // süsleme, nüans) bu fark kadar dikey ezilir ("üstten basık").
  // Çözüm: gerçek genişliği ölçüp k = scaleX/scaleY hesapla.
  //   • Clef ve nota kafası: SVG transform ile (kendi çapasına göre) → glyphScaleY state.
  //   • Diğer tüm glyph'ler: CSS değişkeni --glyph-unsquash + transform-origin:center
  //     (her glyph kendi merkezinde dikey açılır). styles.css'teki kural uygular.
  // Erişilebilirlik: notaya odaklanınca/hover'da piyanodan çal (ayardan aç/kapa).
  const [notaOdakPiyano, setNotaOdakPiyano] = useState(() => {
    try { return ayarlariAl().notaOdakPiyano !== false; } catch { return true; }
  });
  useEffect(() => ayarlariDinle((a) => setNotaOdakPiyano(a.notaOdakPiyano !== false)), []);
  // Ekran okuyucu için canlı duyuru (nota-nota gezinme/çalma)
  const [sesliDuyuru, setSesliDuyuru] = useState('');
  // Ayarlardaki "Sesli yönerge" (sesAcik) AÇIK → tarayıcı TTS (konus) okur;
  // KAPALI → ekran okuyucu için canlı (aria-live) bölgeye yazılır.
  const duyur = useCallback((metin) => {
    const m = String(metin || '');
    let tts = false;
    try { tts = !!ayarlariAl().sesAcik; } catch { /* */ }
    if (tts && m) {
      konus(m, { kesintiyle: true });
    } else {
      setSesliDuyuru('');
      window.requestAnimationFrame(() => setSesliDuyuru(m));
    }
  }, []);
  // Duyuruyu yap, BİTİNCE (TTS varsa onSon, yoksa kısa gecikme) `sonra`'yı çağır.
  // "Düzenleme modu açıldı" gibi yönergeler önce okunsun, sonra dizeğe odaklanılsın.
  const duyurVeSonra = useCallback((metin, sonra) => {
    const m = String(metin || '');
    let tts = false;
    try { tts = !!ayarlariAl().sesAcik; } catch { /* */ }
    if (tts && m) {
      konus(m, { kesintiyle: true, onSon: () => { try { sonra?.(); } catch { /* */ } } });
    } else {
      setSesliDuyuru('');
      window.requestAnimationFrame(() => setSesliDuyuru(m));
      if (typeof sonra === 'function') {
        window.setTimeout(() => { try { sonra(); } catch { /* */ } }, 900);
      }
    }
  }, []);

  // ── Global klavye düzenleme modu (Faz 4) ───────────────────────────────────
  // Enter ile tüm parça için açılır/kapanır. Açıkken: a-h nota, 1-7 süre,
  // ğ/ü oktav, ↑/↓ diyez/bemol, . nokta, Delete sil.
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);
  const duzenlemeModuRef = useRef(false);
  useEffect(() => { duzenlemeModuRef.current = duzenlemeModu; }, [duzenlemeModu]);
  // Düzenleme modu alt-modu: 'ekleme' (harf=yeni nota ekler) | 'duzeltme' (harf=seçili
  // notanın PERDESİNİ, 1-7=SÜRESİNİ değiştirir). F2 ile geçilir. Ref'ten okunur (stabil).
  const altModRef = useRef('ekleme');
  // Çift Enter algılaması: son Enter zaman damgası. İki Enter < 450ms → Perkins modu.
  const sonEnterZamaniRef = useRef(0);
  // Çoklu seçim (Shift+ok, Ctrl+A): seçili öğe id dizisi + aralık çapası (anchor).
  const [cokluSecimIds, setCokluSecimIds] = useState([]);
  const cokluSecimSet = useMemo(() => new Set(cokluSecimIds), [cokluSecimIds]);
  const secimAnchorRef = useRef(null);
  // Programatik odakta (Alt→braille) focusin TTS'i tekrar okumasın diye bastırma.
  const sonProgramatikOdakRef = useRef(null);
  const applicationRef = useRef(null);
  const klavyeYakalayiciRef = useRef(null);
  // Klavye handler'ı güncel değerleri ref'ten okur → listener stabil (tek attach).
  // Atama, ihtiyaç duyulan tüm değerler tanımlandıktan SONRA yapılır (aşağıda).
  const kbRef = useRef({});

  const skorScrollRef = useRef(null);
  const [glyphScaleY, setGlyphScaleY] = useState(1);
  useEffect(() => {
    const el = skorScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const olc = () => {
      const svgEl = el.querySelector('.araclar-muzik-skor-svg');
      const w = svgEl?.getBoundingClientRect().width;
      if (!w) return;
      const scaleX = w / 800;                 // viewBox genişliği 800
      const scaleY = 220 / SVG_ROW_HEIGHT;    // sabit dikey ölçek
      // Net oran uniform olsun diye glyph'i dikeyde scaleX/scaleY kadar uzat.
      const k = Math.max(1, Math.min(2.4, Number.isFinite(scaleX / scaleY) ? scaleX / scaleY : 1));
      setGlyphScaleY(k);
      el.style.setProperty('--glyph-unsquash', String(k));
    };
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    olc();
    return () => ro.disconnect();
  }, []);

  const inlineEditAc = (alan, e, mevcutDeger, svgFontSize, fontWeight, fontStyle) => {
    e.stopPropagation();
    const textEl = e.currentTarget;
    const rect = textEl.getBoundingClientRect();
    // SVG ölçeğinden tam font boyutunu hesapla
    const svgEl = textEl.closest('svg');
    const svgRect = svgEl?.getBoundingClientRect();
    const vbParts = svgEl?.getAttribute('viewBox')?.split(' ').map(Number);
    const scaleY = (svgRect && vbParts) ? svgRect.height / vbParts[3] : 1;
    const fontSize = svgFontSize * scaleY;
    setInlineEdit({ alan, rect, fontSize, fontWeight, fontStyle, deger: mevcutDeger || '' });
    setTimeout(() => { inlineEditRef.current?.focus(); inlineEditRef.current?.select(); }, 20);
  };

  const inlineEditKaydet = () => {
    if (!inlineEdit) return;
    const { alan } = inlineEdit;
    // Uncontrolled input: değeri ref'ten oku (controlled value re-render'ı
    // ölü tuş / â,î kompozisyonunu bozuyordu).
    const deger = (inlineEditRef.current?.value ?? inlineEdit.deger ?? '').trim();
    setMuzikHeader?.((h) => ({ ...h, [alan]: deger }));
    setInlineEdit(null);
  };
  const [hoverBarlineId, setHoverBarlineId] = useState(null);
  const [hoverTupletId, setHoverTupletId] = useState(null);
  const [hoverBrailleCellKey, setHoverBrailleCellKey] = useState(null);
  // Braille detay paneli — tıklanan hücrenin anlam/oge bilgisi
  const [brailleDetay, setBrailleDetay] = useState(null);
  const [hoverEklemeNotasi, setHoverEklemeNotasi] = useState(null);
  // Slur/Tie silme popup
  const [bagEditMenu, setBagEditMenu] = useState(null);
  // {x, y, bagIds: string[], tip: 'tie'|'slur'} | null
  // Volta düzenleme popup
  const [voltaEditMenu, setVoltaEditMenu] = useState(null);
  // {x, y, voltaOgeId, voltaTip} | null
  // Volta hover: hoverBrailleOgeId üzerinden çift yönlü senkronize çalışır
  // (bracket hover → braille; braille hover → bracket)

  // Modifier (aksidental / nokta) hover + edit popup
  // hoverModifier: { ogeId, type: 'accidental' | 'dot' } | null
  const [hoverModifier, setHoverModifier] = useState(null);
  // modifierEditMenu: { x, y, ogeId, type } | null
  const [modifierEditMenu, setModifierEditMenu] = useState(null);
  // Header sol anahtarı / donanım / zaman imzası hover
  const [hoverHeaderClef, setHoverHeaderClef] = useState(false);
  const [hoverHeaderKeySig, setHoverHeaderKeySig] = useState(false);
  const [hoverHeaderTimeSig, setHoverHeaderTimeSig] = useState(false);
  // Sol anahtar altındaki "B" (header braille) butonu hover
  const [hoverHeaderBrailleBtn, setHoverHeaderBrailleBtn] = useState(false);
  const [headerTsMenuPos, setHeaderTsMenuPos] = useState(null);
  // {x, y} | null
  const tsMenuRef = useRef(null);
  const oncekiTsOdakRef = useRef(null);
  // Ölçü sayısı menüsü açılınca odaklan (ekran okuyucu/TTS okur), kapanınca eski odağa dön.
  useEffect(() => {
    if (headerTsMenuPos) {
      oncekiTsOdakRef.current = document.activeElement;
      const id = requestAnimationFrame(() => tsMenuRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    const el = oncekiTsOdakRef.current;
    oncekiTsOdakRef.current = null;
    if (el && typeof el.focus === 'function') {
      const id = requestAnimationFrame(() => { try { el.focus(); } catch { /* */ } });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [headerTsMenuPos]);
  const [headerKsMenuPos, setHeaderKsMenuPos] = useState(null);
  // {x, y} | null — donanım (key signature) değiştirme popup'ı
  const [hoverSatirIdx, setHoverSatirIdx] = useState(null);
  // Üzerine gelinen ölçü: play butonu yalnızca o ölçüde görünür → ekran sade kalır
  const [hoverOlcuKey, setHoverOlcuKey] = useState(null);
  const [hoverEklemeKonumuId, setHoverEklemeKonumuId] = useState(null);
  const [dottedMiniToolbar, setDottedMiniToolbar] = useState(false);
  const clickTimerRef = useRef(null);
  // seciliSureIdx'in güncel değerini event listener içinde okumak için ref
  const seciliSureIdxRef = useRef(seciliSureIdx);
  useEffect(() => { seciliSureIdxRef.current = seciliSureIdx; }, [seciliSureIdx]);
  const satirRefMap = useRef(new Map());
  const sonEklenenScrollIdRef = useRef(null);
  const sonPlaybackScrollSatirRef = useRef(null);
  // Ekleme kutusu üzerindeyken scroll ile seciliSureIdx değiştir,
  // sayfa kaymasını engelle. passive:false zorunlu — React onWheel yetmez.
  useEffect(() => {
    if (!hoverEklemeNotasi) return undefined;
    const handler = (e) => {
      e.preventDefault();
      const sureSayisi = MUZIK_SURE_GOSTERGELERI.length;
      const mevcutIdx = Number.isInteger(seciliSureIdxRef.current) ? seciliSureIdxRef.current : 1;
      const yon = e.deltaY > 0 ? 1 : -1;
      setSeciliSureIdx(((mevcutIdx + yon) + sureSayisi) % sureSayisi);
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, [hoverEklemeNotasi]);

  const satirRefAta = useCallback((satirIdx) => (node) => {
    if (node) {
      satirRefMap.current.set(satirIdx, node);
    } else {
      satirRefMap.current.delete(satirIdx);
    }
  }, []);
  const headerKeySignatureAccidentals = useMemo(
    () => keySignatureAccidentalsAl(muzikHeader?.keySignature),
    [muzikHeader?.keySignature],
  );

  const sonEklenenOgeSatirIdx = useMemo(() => {
    if (!sonEklenenOgeId) return null;

    const yer = svgYerlesimHaritasi?.get?.(sonEklenenOgeId);
    if (Number.isFinite(Number(yer?.satirIdx))) {
      return Number(yer.satirIdx);
    }

    return null;
  }, [sonEklenenOgeId, svgYerlesimHaritasi]);

  /**
   * Volta ekleme modu için her ölçü başlangıcının referans bilgisi.
   * measureIndex → { insertAfterId, endBarlineId, startX }
   *
   * insertAfterId: volta bu ölçünün ÖNÜNE eklenecek → önceki ölçünün son öğesi
   * endBarlineId:  bu ölçünün son barline'ı (ikinci tıkta kullanılır)
   * startX:        ölçü sol kenar X'i (+ düğmesinin yeri)
   */
  const voltaMeasureRefMap = useMemo(() => {
    if (!voltaEkleModu) return new Map();

    // Tüm satırlardaki ölçüleri measureIndex'e göre sıralı düzle
    const allMeasures = (muzikSatirOlculeri || [])
      .flat()
      .sort((a, b) => (a.measureIndex ?? a.index ?? 0) - (b.measureIndex ?? b.index ?? 0));

    const map = new Map();
    allMeasures.forEach((measure, flatIdx) => {
      const mIdx = measure.measureIndex ?? measure.index ?? flatIdx;
      const items = measure.items || [];

      // insertAfterId: önceki ölçünün son öğesi
      let insertAfterId = null;
      if (flatIdx > 0) {
        const prevItems = allMeasures[flatIdx - 1].items || [];
        for (let i = prevItems.length - 1; i >= 0; i--) {
          if (prevItems[i]?.id) { insertAfterId = prevItems[i].id; break; }
        }
      }

      // endBarlineId: bu ölçünün son öğesi (genellikle barline)
      let endBarlineId = null;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i]?.id) { endBarlineId = items[i].id; break; }
      }

      map.set(mIdx, {
        insertAfterId,   // volta bu ölçüden ÖNCE = sonrasına ekle
        endBarlineId,    // ikinci tıkta _voltaBitisBarlineId olarak kullanılır
        startX: measure.startX ?? measure.measureStartX ?? 0,
        endX:   measure.endX   ?? measure.measureEndX   ?? 0,
      });
    });

    return map;
  }, [voltaEkleModu, muzikSatirOlculeri]);

  /**
   * Her satır için çizilecek volta bracket segmentleri.
   * Tek satır, başlangıç satırı, devam satırı, bitiş satırı ayrı ayrı ele alınır.
   */
  const voltaBracketSegments = useMemo(() => {
    if (!svgCizilecekOgeler || !svgYerlesimHaritasi) return new Map();

    const rowRightX = skorSatirSagXHesapla({
      staffRightX: SVG_SAG_SINIR_X,
      rightInset: SCORE_ROW_RIGHT_INSET,
    });
    const BARLINE_T = new Set([
      'barline', 'finalBarline', 'sectionalBarline',
      'beginRepeat', 'endRepeat', 'volta1', 'volta2',
    ]);
    const result = new Map();

    svgCizilecekOgeler.forEach((oge, voltaGlobalIdx) => {
      if (oge.tip !== 'volta1' && oge.tip !== 'volta2') return;

      const voltaYer = svgYerlesimHaritasi.get(oge.id);
      if (!voltaYer) return;

      // ── BAŞLANGIÇ — volta marker'dan SONRA gelen ilk gerçek içerik (nota/sus/clef değil)
      // öğesinin satırını ve ölçüsünün sol kenarını kullan.
      // Sebep: volta marker barline-like olduğu için kendi 64px'lik "volta ölçüsü"nü
      // oluşturuyor; bu ölçü bir önceki satırın SONUNA sığabilir ama içerik bir sonraki
      // satırda kalır. Bracket içeriğin olduğu satırda görünmeli.
      let startSatirIdx = voltaYer.satirIdx ?? 0;
      let bracketStartX = Number.isFinite(voltaYer.x) ? voltaYer.x : 0;
      for (let i = voltaGlobalIdx + 1; i < svgCizilecekOgeler.length; i++) {
        const next = svgCizilecekOgeler[i];
        if (!next) continue;
        if (next.tip === 'volta1' || next.tip === 'volta2') continue;
        const nextYer = svgYerlesimHaritasi.get(next.id);
        if (!nextYer) continue;
        startSatirIdx = nextYer.satirIdx ?? startSatirIdx;
        if (Number.isFinite(nextYer.measureStartX)) bracketStartX = nextYer.measureStartX;
        else if (Number.isFinite(nextYer.x)) bracketStartX = nextYer.x;
        break;
      }

      let endSatirIdx = startSatirIdx;
      let bracketEndX = rowRightX;

      if (oge._voltaBitisBarlineId) {
        const bitisYer = svgYerlesimHaritasi.get(oge._voltaBitisBarlineId);
        if (bitisYer) {
          endSatirIdx = bitisYer.satirIdx ?? startSatirIdx;
          // Bitiş barline → ait olduğu ölçünün SAĞ kenarı
          if (Number.isFinite(bitisYer.measureEndX)) bracketEndX = bitisYer.measureEndX;
          else if (Number.isFinite(bitisYer.x)) bracketEndX = bitisYer.x;
        }
      } else {
        // Bitiş barline ID yoksa: aynı satırda sıradaki barline'ı bul
        const rowItems = muzikSatirlar?.[startSatirIdx] || [];
        const vi = rowItems.findIndex((item) => item.id === oge.id);
        if (vi >= 0) {
          for (let j = vi + 1; j < rowItems.length; j++) {
            if (BARLINE_T.has(rowItems[j]?.tip)) {
              const ny = svgYerlesimHaritasi.get(rowItems[j].id);
              if (Number.isFinite(ny?.x)) { bracketEndX = ny.x; break; }
              if (Number.isFinite(ny?.measureEndX)) { bracketEndX = ny.measureEndX; break; }
              break;
            }
          }
        }
      }

      // Hem 1. ev hem 2. ev için bracket sağ ucu kapansın (aşağı uzantı)
      const closedRight = oge.tip === 'volta1' || oge.tip === 'volta2';
      const isSingleRow = startSatirIdx === endSatirIdx;

      for (let row = startSatirIdx; row <= endSatirIdx; row++) {
        if (!result.has(row)) result.set(row, []);
        // Devam / bitiş satırlarında ilk ölçünün sol kenarından başla
        const contStartX = muzikSatirOlculeri?.[row]?.[0]?.measureStartX ?? SVG_CLEF_X;
        result.get(row).push({
          key: `vb-${oge.id}-r${row}`,
          voltaOgeId: oge.id,
          voltaTip: oge.tip,
          closedRight,
          isStartRow: row === startSatirIdx,
          isEndRow:   row === endSatirIdx,
          isSingleRow,
          bracketStartX,
          bracketEndX,
          rowRightX,
          contStartX,
        });
      }
    });

    return result;
  }, [svgCizilecekOgeler, svgYerlesimHaritasi, muzikSatirlar, muzikSatirOlculeri]);

  useEffect(() => {
    if (!isPlaying) {
      sonPlaybackScrollSatirRef.current = null;
      return;
    }

    if (!Number.isFinite(Number(aktifPlaybackSatirIdx))) return;

    const satirIdx = Number(aktifPlaybackSatirIdx);
    if (sonPlaybackScrollSatirRef.current === satirIdx) return;

    const node = satirRefMap.current.get(satirIdx);
    if (!node) return;

    sonPlaybackScrollSatirRef.current = satirIdx;

    window.requestAnimationFrame(() => {
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
  }, [isPlaying, aktifPlaybackSatirIdx]);

  useEffect(() => {
    if (isPlaying) return;
    if (!sonEklenenOgeId) return;
    if (sonEklenenScrollIdRef.current === sonEklenenOgeId) return;
    if (!Number.isFinite(Number(sonEklenenOgeSatirIdx))) return;

    const satirIdx = Number(sonEklenenOgeSatirIdx);

    sonEklenenScrollIdRef.current = sonEklenenOgeId;

    const scrollEt = () => {
      const node = satirRefMap.current.get(satirIdx);
      if (!node) {
        return;
      }

      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollEt);
    });
  }, [isPlaying, sonEklenenOgeId, sonEklenenOgeSatirIdx, muzikSatirlar.length]);

  const notaOgesiById = useMemo(() => {
    const map = new Map();
    (muzikOgeleri || []).forEach((oge) => {
      if (oge?.id) map.set(oge.id, oge);
    });
    (svgCizilecekOgeler || []).forEach((oge) => {
      if (oge?.id && !map.has(oge.id)) map.set(oge.id, oge);
    });
    return map;
  }, [muzikOgeleri, svgCizilecekOgeler]);

  const notaOgesiAl = (ogeId) => {
    const oge = notaOgesiById.get(ogeId);
    return oge?.tip === 'nota' ? oge : null;
  };

  // Herhangi bir oge tipini döndürür — detay paneli için
  const ogeAl = useCallback(
    (ogeId) => (ogeId ? (notaOgesiById.get(ogeId) || null) : null),
    [notaOgesiById],
  );

  // Erişilebilirlik: nota-nota ADIM (ileri/geri) sırasında çalınan notayı sesli
  // duyur. Tam çalma (isPlaying) sırasında duyurma — müziği kesmesin.
  useEffect(() => {
    if (!playbackOgeId || isPlaying) return;
    const oge = notaOgesiById.get(playbackOgeId);
    if (!oge) return;
    const _sure = ['8lik', '4lük', '2lik', '1lik', '16lık', '32lik', '64lük'];
    const _ariza = { sharp: 'diyez', diyez: 'diyez', flat: 'bemol', bemol: 'bemol', natural: 'naturel', naturel: 'naturel', doubleSharp: 'çift diyez', doubleFlat: 'çift bemol' };
    if (oge.tip === 'nota') {
      duyur([
        oge.notaAd || oge.ad || 'nota',
        _ariza[oge.accidental] || '',
        Number.isFinite(Number(oge.oktav)) ? `${oge.oktav}. oktav` : '',
        _sure[oge.sureIndeksi ?? 0] || '',
        oge.dotted ? 'noktalı' : '',
      ].filter(Boolean).join(' '));
    } else if (oge.tip === 'sus') {
      duyur(`sus ${_sure[oge.sureIndeksi ?? 0] || ''}${oge.dotted ? ' noktalı' : ''}`.trim());
    }
  }, [playbackOgeId, isPlaying, notaOgesiById, duyur]);

  // Klavye handler'ının okuyacağı güncel değerler (her render'da tazelenir).
  kbRef.current = {
    seciliOgeId, seciliSureIdx, sonKullanilanOktav,
    notaEkleKonuma, seciliNotayiGuncelle, seciliOgeyiSil, ogeleriSil,
    seciliSusuNotayaCevir, susEkleKonuma,
    setSeciliSureIdx, setSonKullanilanOktav, setSeciliOgeId, playNote,
    notaOgesiById, headerKeySignatureAccidentals, duyur, duyurVeSonra,
    playFromOge, pause, isPlaying,
    cokluSecimIds, setCokluSecimIds,
    bagAraclari, manuelOlcuCizgisiEkle,
    setHoverBrailleOgeId, notaOdakPiyano,
    onPerkinsAc,
  };

  // ── Global klavye düzenleme modu — tek capture-listener, kbRef'ten okur ────
  useEffect(() => {
    // İki nota tuş düzeni (ayardan seçilir):
    // - alfabetik (uluslararası harf): a=la, b=si, c=do, d=re, e=mi, f=fa, g=sol (H DEĞİL — G uluslararası standart; H Alman sisteminde Si demek).
    // - piyano (klavye sırası, hızlı): a=do, s=re, d=mi, f=fa, g=sol, h=la, j=si, k=do (ana sıra beyaz tuşlar). Arıza için ↑/↓.
    const NOTE_KEYS_ALFABETIK = { a: 'la', b: 'si', c: 'do', d: 're', e: 'mi', f: 'fa', g: 'sol' };
    const NOTE_KEYS_PIYANO = { a: 'do', s: 're', d: 'mi', f: 'fa', g: 'sol', h: 'la', j: 'si', k: 'do' };
    const noteKeysAl = () => {
      let duzen = 'alfabetik';
      try { duzen = ayarlariAl().notaTusDuzeni === 'piyano' ? 'piyano' : 'alfabetik'; } catch { /* */ }
      return duzen === 'piyano' ? NOTE_KEYS_PIYANO : NOTE_KEYS_ALFABETIK;
    };
    const DUR_KEY_TO_IDX = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 4, 6: 5, 7: 6 };
    const DUR_ADI = { 1: '1lik', 2: '2lik', 3: '4lük', 4: '8lik', 5: '16lık', 6: '32lik', 7: '64lük' };
    const SURE_ADI = ['8lik', '4lük', '2lik', '1lik', '16lık', '32lik', '64lük'];

    const handler = (e) => {
      const ae = document.activeElement;
      const muzikKlavyeYakalayiciMi = ae?.getAttribute?.('data-muzik-keyboard-sink') === 'true';
      if (ae && !muzikKlavyeYakalayiciMi && (/^(input|textarea|select)$/i.test(ae.tagName) || ae.isContentEditable)) return;

      // F1 → klavye kısayolları yardım penceresini aç (her zaman, mod fark etmez).
      if (e.key === 'F1') {
        e.preventDefault(); e.stopPropagation();
        window.dispatchEvent(new CustomEvent('muzik-klavye-yardim-ac'));
        return;
      }
      // Bir dialog (yardım, nota düzenleme vb.) odaktayken kısayolları işleme.
      if (ae && ae.closest && ae.closest('[role="dialog"]')) return;

      const k = kbRef.current;

      // Çoklu seçimi temizle (içerik değiştiren / tekli hedefli aksiyonlardan sonra
      // stale mavi-çerçeve kalmasın). Seçim KURAN aksiyonlar (Shift+ok, Ctrl+A) çağırmaz.
      const secimSifirla = () => {
        secimAnchorRef.current = null;
        if (k.cokluSecimIds && k.cokluSecimIds.length) k.setCokluSecimIds?.([]);
      };

      // NVDA browse mode swallows single-letter quick-nav keys before the browser
      // can see them. Keeping focus in this real input puts NVDA in focus mode.
      const yazmaYakalayiciyiOdakla = () => {
        const input = klavyeYakalayiciRef.current;
        if (!input) return;
        try {
          input.value = '';
          input.focus({ preventScroll: true });
        } catch { /* */ }
      };

      const skorOgesiniOdakla = () => {
        const items = [...document.querySelectorAll('.araclar-muzik-skor-svg [data-nav]')];
        const hedef = (k.seciliOgeId && items.find((el) => el.getAttribute('data-oge-id') === k.seciliOgeId)) || items[0] || applicationRef.current;
        window.requestAnimationFrame(() => {
          try { hedef?.focus?.({ preventScroll: true }); } catch { hedef?.focus?.(); }
        });
      };

      const navOgeSec = (el, { duyurEt = true, piyanoCal = true } = {}) => {
        if (!el) {
          yazmaYakalayiciyiOdakla();
          return;
        }
        const id = el.getAttribute('data-oge-id');
        const nav = el.getAttribute('data-nav');
        if (id) {
          k.setSeciliOgeId?.(id);
          k.setHoverBrailleOgeId?.((nav === 'nota' || nav === 'sus' || nav === 'barline') ? id : null);
        }
        if (piyanoCal && nav === 'nota' && k.notaOdakPiyano !== false) {
          const oge = k.notaOgesiById?.get?.(id);
          if (oge) k.playNote?.(oge, { keySignatureAccidentals: k.headerKeySignatureAccidentals });
        }
        yazmaYakalayiciyiOdakla();
        if (duyurEt) {
          const etiket = (el.getAttribute('aria-label') || '')
            .replace(/^Nota:\s*/, '')
            .replace(/^Sus:\s*/, 'sus ');
          if (etiket) k.duyur?.(etiket);
        }
      };

      const duzenlemeModunuKapat = () => {
        duzenlemeModuRef.current = false;
        setDuzenlemeModu(false);
        altModRef.current = 'ekleme';
        skorOgesiniOdakla();
        k.duyur('Klavye düzenleme modu kapatıldı');
      };

      // Alt (tek başına, basılı) → seçili notanın braille'ine konumlan; önce nota
      // adını sonra braille noktalarını seslendir (ekran okuyucu veya tarayıcı TTS).
      if (e.key === 'Alt' && !e.ctrlKey && !e.shiftKey && !e.repeat) {
        const id = k.seciliOgeId;
        if (!id) return;
        e.preventDefault();
        let esc;
        try { esc = (window.CSS && CSS.escape) ? CSS.escape(id) : id; } catch { esc = id; }
        const notaEl = document.querySelector(`.araclar-muzik-skor-svg [data-oge-id="${esc}"][data-nav]`);
        const notaAdi = (notaEl?.getAttribute('aria-label') || '').replace(/^Nota:\s*/, '').replace(/^Sus:\s*/, 'sus ') || 'öğe';
        const cells = [...document.querySelectorAll(`.muzik-braille-hucre[data-oge-id="${esc}"]`)];
        const brailleMetni = cells.length
          ? cells.map((c) => {
            const d = c.getAttribute('data-braille-dots');
            return d ? ('nokta ' + d.split('-').join(' ')) : 'boşluk';
          }).join(', ')
          : 'yok';
        k.duyur(`${notaAdi}. Braille: ${brailleMetni}`);
        if (cells[0]) { sonProgramatikOdakRef.current = cells[0]; cells[0].focus(); }
        return;
      }

      // Enter: TEK Enter → düzenleme modunu aç/kapa. ÇİFT Enter (arka arkaya, <450ms)
      // → Perkins (Braille yazım) modunu aç. Sayfanın HER YERİNDEN algılanır.
      // İstisna: gerçek buton/link/form öğeleri (orada Enter = onay/etkinleştir).
      // (input/textarea/select zaten handler başında atlanıyor.)
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (ae && /^(button|a)$/i.test(ae.tagName)) return;
        // Sol anahtarı / zaman imzası odaktayken Enter, o öğenin KENDİ popup'ını açsın
        // (mod değiştirme yerine). Bu öğeler kendi onKeyDown'larıyla açılır.
        if (ae && ae.closest && ae.closest('.muzik-anahtar-grup, .muzik-zaman-imza-grup, .muzik-barline-hit-area')) return;
        e.preventDefault(); e.stopPropagation();

        // Çift Enter → Perkins (Braille yazım) modu. İlk Enter düzenleme modunu
        // açmış olabilir; geri alıp Perkins'e gir (focus textarea'ya kayacak).
        const simdi = Date.now();
        if (simdi - sonEnterZamaniRef.current < 450) {
          sonEnterZamaniRef.current = 0;
          if (duzenlemeModuRef.current) {
            duzenlemeModuRef.current = false;
            setDuzenlemeModu(false);
            altModRef.current = 'ekleme';
          }
          if (k.onPerkinsAc) {
            k.onPerkinsAc();
          } else {
            k.duyur('Braille yazım modu kullanılamıyor');
          }
          return;
        }
        sonEnterZamaniRef.current = simdi;

        const yeni = !duzenlemeModuRef.current;
        duzenlemeModuRef.current = yeni;
        setDuzenlemeModu(yeni);
        if (yeni) {
          const items = [...document.querySelectorAll('.araclar-muzik-skor-svg [data-nav]')];
          const hedef = (k.seciliOgeId && items.find((el) => el.getAttribute('data-oge-id') === k.seciliOgeId)) || items[0];
          if (hedef) navOgeSec(hedef, { duyurEt: false, piyanoCal: false });
          else yazmaYakalayiciyiOdakla();
          k.duyur('Klavye düzenleme modu açıldı, nota yazmaya hazır. İki kez Enter ile Braille yazım moduna geçebilirsiniz');
        } else {
          duzenlemeModunuKapat();
        }
        return;
      }

      if (!duzenlemeModuRef.current) return;

      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        duzenlemeModunuKapat();
        return;
      }

      // F2 → alt-mod geçişi: Ekleme ↔ Düzeltme.
      if (e.key === 'F2') {
        e.preventDefault(); e.stopPropagation();
        altModRef.current = altModRef.current === 'duzeltme' ? 'ekleme' : 'duzeltme';
        k.duyur(altModRef.current === 'duzeltme'
          ? 'Düzeltme modu açık: harfler seçili notanın perdesini, 1 ile 7 süresini değiştirir'
          : 'Ekleme modu açık: harfler yeni nota ekler');
        return;
      }

      const key = (e.key || '').toLowerCase();

      // Space → bulunulan (seçili) notadan çal / çalıyorsa duraklat
      if ((e.key === ' ' || e.code === 'Space') && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault(); e.stopPropagation();
        if (k.isPlaying) {
          k.pause?.();
          k.duyur('duraklatıldı');
        } else if (typeof k.playFromOge === 'function') {
          k.playFromOge(k.seciliOgeId);
          k.duyur('çalınıyor');
        }
        return;
      }

      // Ctrl+A → tüm nota/susları seç (çoklu seçim)
      if (e.ctrlKey && !e.altKey && key === 'a') {
        const items = [...document.querySelectorAll('.araclar-muzik-skor-svg [data-nav]')];
        if (!items.length) return;
        e.preventDefault(); e.stopPropagation();
        const ids = items.map((el) => el.getAttribute('data-oge-id'));
        secimAnchorRef.current = ids[0];
        k.setCokluSecimIds(ids);
        const son = items[items.length - 1];
        const sonId = son?.getAttribute('data-oge-id');
        if (sonId) {
          k.setSeciliOgeId?.(sonId);
          k.setHoverBrailleOgeId?.(sonId);
        }
        yazmaYakalayiciyiOdakla();
        k.duyur('tümü seçili, ' + ids.length + ' öğe');
        return;
      }

      // ← / → : önceki / sonraki nota-sus (odak = imleç → onFocus seçer + seslendirir).
      // Home / End : ilk / son. Shift basılı → aralık (çoklu) seçim; değilse tekli (seçimi temizler).
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        if (e.altKey) return;
        const items = [...document.querySelectorAll('.araclar-muzik-skor-svg [data-nav]')];
        if (!items.length) return;
        e.preventDefault(); e.stopPropagation();
        const idOf = (el) => el.getAttribute('data-oge-id');
        let curIdx = items.findIndex((el) => idOf(el) === k.seciliOgeId);
        const mOf = (i) => {
          const v = items[i]?.getAttribute('data-measure');
          return v == null || v === '' ? null : Number(v);
        };
        // Ctrl+ok → ölçü atlama: yöndeki komşu ölçünün ilk öğesine git.
        const olcuAtla = (yon) => {
          const curM = curIdx >= 0 ? mOf(curIdx) : null;
          if (yon === 1) {
            for (let i = Math.max(0, curIdx) + 1; i < items.length; i++) {
              const m = mOf(i);
              if (m != null && (curM == null || m > curM)) return i;
            }
            return items.length - 1;
          }
          // geri: mevcut ölçünün başına; zaten baştaysak önceki ölçünün başına.
          let bas = Math.max(0, curIdx);
          while (bas - 1 >= 0 && mOf(bas - 1) === curM) bas--;
          if (bas <= 0) return 0;
          const prevM = mOf(bas - 1);
          let i = bas - 1;
          while (i - 1 >= 0 && mOf(i - 1) === prevM) i--;
          return i;
        };
        let hedef;
        if (e.key === 'Home') {
          hedef = 0;
        } else if (e.key === 'End') {
          hedef = items.length - 1;
        } else {
          const yon = e.key === 'ArrowRight' ? 1 : -1;
          if (curIdx < 0) curIdx = yon === 1 ? -1 : items.length;
          if (e.ctrlKey) {
            hedef = olcuAtla(yon);
          } else {
            hedef = Math.max(0, Math.min(items.length - 1, curIdx + yon));
          }
        }

        if (e.shiftKey) {
          // Aralık seçimi: çapa (anchor) yoksa mevcut imleçten başlat.
          if (secimAnchorRef.current == null) {
            secimAnchorRef.current = k.seciliOgeId || (curIdx >= 0 ? idOf(items[Math.max(0, curIdx)]) : idOf(items[hedef]));
          }
          let anchorIdx = items.findIndex((el) => idOf(el) === secimAnchorRef.current);
          if (anchorIdx < 0) anchorIdx = hedef;
          const lo = Math.min(anchorIdx, hedef);
          const hi = Math.max(anchorIdx, hedef);
          const ids = items.slice(lo, hi + 1).map(idOf);
          k.setCokluSecimIds(ids);
          navOgeSec(items[hedef], { duyurEt: false });
          k.duyur(ids.length + ' öğe seçili');
        } else {
          // Tekli gezinme: çoklu seçimi temizle.
          secimAnchorRef.current = null;
          if (k.cokluSecimIds && k.cokluSecimIds.length) k.setCokluSecimIds([]);
          navOgeSec(items[hedef]);
        }
        return;
      }

      if (DUR_KEY_TO_IDX[key] !== undefined && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        const yeniIdx = DUR_KEY_TO_IDX[key];
        k.setSeciliSureIdx(yeniIdx);
        // DÜZELTME modunda: seçili nota/susun SÜRESİNİ değiştir + bildir (TTS + ekran okuyucu).
        const sel0 = k.notaOgesiById.get(k.seciliOgeId);
        if (altModRef.current === 'duzeltme' && sel0 && (sel0.tip === 'nota' || sel0.tip === 'sus')) {
          k.seciliNotayiGuncelle({ sureIndeksi: yeniIdx });
          const tur = sel0.tip === 'sus' ? 'sus' : (sel0.notaAd || 'nota');
          k.duyur(`${tur} süresi ${DUR_ADI[key]} olarak değiştirildi`);
        } else {
          k.duyur('süre ' + DUR_ADI[key]);
        }
        return;
      }
      if (key === 'ğ' || key === 'ü') {
        e.preventDefault(); e.stopPropagation();
        const cur = Number(k.sonKullanilanOktav) || 4;
        const yeni = Math.max(1, Math.min(7, cur + (key === 'ü' ? 1 : -1)));
        k.setSonKullanilanOktav(yeni);
        k.duyur('oktav ' + yeni);
        return;
      }
      // Shift+P / Shift+F / Shift+M → seçili notaya dinamik. Shift kullanılır çünkü
      // 'f' tuşu nota (fa) ile çakışır. Aynı tuşa tekrar basınca aynı grupta gezinir:
      // P: p ↔ pp · F: f ↔ ff · M: mf ↔ mp (notada tek dinamik tutulur).
      if (e.shiftKey && !e.ctrlKey && !e.altKey && (key === 'p' || key === 'f' || key === 'm')) {
        const ba = k.bagAraclari;
        if (ba && typeof ba.dinamik === 'function') {
          e.preventDefault(); e.stopPropagation();
          const dongu = { p: ['p', 'pp'], f: ['f', 'ff'], m: ['mf', 'mp'] };
          const adlar = { p: 'piano', pp: 'pianissimo', f: 'forte', ff: 'fortissimo', mf: 'mezzo forte', mp: 'mezzo piano' };
          const sel = k.notaOgesiById.get(k.seciliOgeId);
          const mevcutDin = ((sel?.modifiers?.oncesi) || []).find((m) => m?.kayit?.gorselTip === 'dinamik')?.kayit?.sembol || null;
          const secenek = dongu[key];
          const sembol = mevcutDin === secenek[0] ? secenek[1] : secenek[0];
          const ok = ba.dinamik(sembol);
          secimSifirla();
          k.duyur(ok ? ('dinamik ' + sembol + ' (' + (adlar[sembol] || '') + ')') : 'dinamik eklenemedi, önce bir nota seçin');
          return;
        }
      }
      const NOTE_KEYS = noteKeysAl();
      if (NOTE_KEYS[key] && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault(); e.stopPropagation();
        secimSifirla();

        // ── DİZE BAŞI (anahtar/zaman imzası) seçiliyken → en BAŞA nota ekle ──
        if (k.seciliOgeId === 'ANAHTAR_BAS' || k.seciliOgeId === 'ZAMAN_IMZA') {
          if (altModRef.current === 'duzeltme') {
            k.duyur('anahtar düzeltilemez; düzeltmek için bir nota seçin');
            return;
          }
          const oge = k.notaEkleKonuma({ notaAd: NOTE_KEYS[key], sureIdx: k.seciliSureIdx, basaEkle: true });
          if (oge) {
            k.playNote(oge, { keySignatureAccidentals: k.headerKeySignatureAccidentals });
            k.duyur([NOTE_KEYS[key], `${oge.oktav}. oktav`, SURE_ADI[oge.sureIndeksi ?? 0], '(başa eklendi)'].filter(Boolean).join(' '));
          }
          return;
        }

        const sel = k.notaOgesiById.get(k.seciliOgeId);

        // ── DÜZELTME modu: seçili NOTANIN PERDESİNİ değiştir (ekleme yapmaz) ──
        if (altModRef.current === 'duzeltme') {
          if (sel && sel.tip === 'nota') {
            // Perdeyi değiştir; arızayı sıfırla (temiz perde — istenirse ↑/↓ ile eklenir).
            k.seciliNotayiGuncelle({ notaAd: NOTE_KEYS[key], accidental: null });
            const oktav = Number(sel.oktav) || Number(k.sonKullanilanOktav) || 4;
            k.playNote(
              { tip: 'nota', notaAd: NOTE_KEYS[key], oktav, sureIndeksi: sel.sureIndeksi ?? k.seciliSureIdx, dotted: !!sel.dotted },
              { keySignatureAccidentals: k.headerKeySignatureAccidentals },
            );
            k.duyur([NOTE_KEYS[key], `${oktav}. oktav`, SURE_ADI[sel.sureIndeksi ?? 0], 'olarak değiştirildi'].filter(Boolean).join(' '));
            return;
          }
          if (sel && sel.tip === 'sus' && typeof k.seciliSusuNotayaCevir === 'function') {
            k.seciliSusuNotayaCevir(NOTE_KEYS[key]);
            const oktav = Number(k.sonKullanilanOktav) || Number(sel.oktav) || 4;
            k.duyur([NOTE_KEYS[key], `${oktav}. oktav`, '(sus notaya çevrildi)'].filter(Boolean).join(' '));
            return;
          }
          k.duyur('düzeltmek için önce bir nota seçin');
          return;
        }

        // ── EKLEME modu ──
        // Seçili öğe bir SUS ise: yeni nota EKLEMEK yerine sus'u bu notaya çevir.
        if (sel && sel.tip === 'sus' && typeof k.seciliSusuNotayaCevir === 'function') {
          k.seciliSusuNotayaCevir(NOTE_KEYS[key]);
          const oktav = Number(k.sonKullanilanOktav) || Number(sel.oktav) || 4;
          k.playNote(
            { tip: 'nota', notaAd: NOTE_KEYS[key], oktav, sureIndeksi: sel.sureIndeksi ?? k.seciliSureIdx, dotted: !!sel.dotted },
            { keySignatureAccidentals: k.headerKeySignatureAccidentals },
          );
          k.duyur([NOTE_KEYS[key], `${oktav}. oktav`, SURE_ADI[sel.sureIndeksi ?? 0], '(sustan)'].filter(Boolean).join(' '));
          return;
        }
        // seçili ögenin ARDINA ekle (araya ekleme; son notadaysa sona ekleme).
        const oge = k.notaEkleKonuma({ notaAd: NOTE_KEYS[key], sureIdx: k.seciliSureIdx, insertAfterId: k.seciliOgeId });
        if (oge) {
          k.playNote(oge, { keySignatureAccidentals: k.headerKeySignatureAccidentals });
          k.duyur([NOTE_KEYS[key], `${oge.oktav}. oktav`, SURE_ADI[oge.sureIndeksi ?? 0]].filter(Boolean).join(' '));
        }
        return;
      }
      // r → konuma duyarlı sus ekle (seçili ögenin ardına; dize başındaysan en başa)
      if (key === 'r' && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        secimSifirla();
        if (typeof k.susEkleKonuma === 'function') {
          const basta = k.seciliOgeId === 'ANAHTAR_BAS' || k.seciliOgeId === 'ZAMAN_IMZA';
          const oge = basta
            ? k.susEkleKonuma({ sureIdx: k.seciliSureIdx, basaEkle: true })
            : k.susEkleKonuma({ sureIdx: k.seciliSureIdx, insertAfterId: k.seciliOgeId });
          if (oge) k.duyur(['sus', SURE_ADI[oge.sureIndeksi ?? 0], basta ? '(başa eklendi)' : ''].filter(Boolean).join(' '));
        }
        return;
      }
      // l (kolay tuş, görsel olarak | gibi) VEYA | → seçili ögenin ardına MANUEL ölçü
      // çizgisi ekle. (Çift/tekrar/final için çizgiye gelip Enter ile popup'tan değiştir.)
      if ((key === 'l' || e.key === '|') && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        secimSifirla();
        if (typeof k.manuelOlcuCizgisiEkle === 'function') {
          const insAfter = (k.seciliOgeId && k.seciliOgeId !== 'ANAHTAR_BAS' && k.seciliOgeId !== 'ZAMAN_IMZA') ? k.seciliOgeId : null;
          k.manuelOlcuCizgisiEkle(insAfter);
          k.duyur('ölçü çizgisi eklendi');
        }
        return;
      }
      // t / y / u → seçili (çoklu) notalara üçleme / hece bağı (slur) / uzatma bağı (tie)
      if ((key === 't' || key === 'y' || key === 'u') && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); e.stopPropagation();
        const ba = k.bagAraclari;
        if (!ba) return;
        const secimler = (k.cokluSecimIds && k.cokluSecimIds.length >= 2)
          ? k.cokluSecimIds
          : (k.seciliOgeId ? [k.seciliOgeId] : []);
        let ok = false; let ad = '';
        if (key === 't') { ad = 'üçleme'; ok = ba.ucleme?.(secimler); }
        else if (key === 'y') { ad = 'hece bağı'; ok = ba.slur?.(secimler); }
        else { ad = 'uzatma bağı'; ok = ba.tie?.(secimler); }
        if (ok) secimSifirla();
        k.duyur(ok ? (ad + ' uygulandı') : (ad + ' uygulanamadı, en az iki uygun nota seçin'));
        return;
      }
      if (key === '.') {
        // seciliNotayiGuncelle hook'un GÜNCEL seçimini hedefler; kbRef stale olsa
        // bile çalışır. sel yalnızca toggle/duyuru için (best-effort).
        e.preventDefault(); e.stopPropagation();
        secimSifirla();
        const sel = k.notaOgesiById.get(k.seciliOgeId);
        const yeni = sel ? !sel.dotted : true;
        k.seciliNotayiGuncelle({ dotted: yeni });
        k.duyur(yeni ? 'noktalı' : 'nokta kaldırıldı');
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Arıza merdiveni (perde artan): bemol → naturel → arıza yok → diyez.
        // ↑ bir basamak yukarı, ↓ bir basamak aşağı (döngüsel).
        e.preventDefault(); e.stopPropagation();
        const LADDER = ['flat', 'natural', 'none', 'sharp'];
        const ADI = { flat: 'bemol', natural: 'naturel', none: 'arıza yok', sharp: 'diyez' };
        secimSifirla();
        const sel = k.notaOgesiById.get(k.seciliOgeId);
        const cur = (sel && sel.tip === 'nota' && sel.accidental) ? sel.accidental : 'none';
        let idx = LADDER.indexOf(cur);
        if (idx < 0) idx = LADDER.indexOf('none');
        idx = (idx + (e.key === 'ArrowUp' ? 1 : LADDER.length - 1)) % LADDER.length;
        const yeni = LADDER[idx];
        const arizaDeger = yeni === 'none' ? null : yeni;
        k.seciliNotayiGuncelle({ accidental: arizaDeger });
        if (sel && sel.tip === 'nota') {
          k.playNote({ ...sel, accidental: arizaDeger }, { keySignatureAccidentals: k.headerKeySignatureAccidentals });
        }
        k.duyur(ADI[yeni]);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); e.stopPropagation();
        const secimler = k.cokluSecimIds || [];
        if (secimler.length > 1 && typeof k.ogeleriSil === 'function') {
          const adet = secimler.length;
          k.ogeleriSil(secimler);
          k.setCokluSecimIds?.([]);
          secimAnchorRef.current = null;
          k.duyur(adet + ' öğe silindi');
        } else {
          k.seciliOgeyiSil?.();
          k.duyur('silindi');
        }
        return;
      }
    };

    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, []);

  // ── Tarayıcı seslendirme (sesAcik) AÇIKKEN: odaklanan her nesnenin adını TTS oku ──
  // Ekran okuyucusu olmayan görme engelli kullanıcı için; notalar, kısayol satırları,
  // butonlar, popup başlığı vb. odaklanınca seslendirilir (ekran okuyucu gibi davranış).
  useEffect(() => {
    // Öğenin temel etiketi: aria-label → aria-labelledby → label[for] → saran <label>
    // → placeholder → title.
    const temelEtiket = (el) => {
      const al = el.getAttribute && el.getAttribute('aria-label');
      if (al && al.trim()) return al.trim();
      const lb = el.getAttribute && el.getAttribute('aria-labelledby');
      if (lb) {
        const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
        if (t) return t;
      }
      if (el.id) {
        let sel; try { sel = `label[for="${(window.CSS && CSS.escape) ? CSS.escape(el.id) : el.id}"]`; } catch { sel = null; }
        const f = sel && document.querySelector(sel);
        if (f && f.textContent.trim()) return f.textContent.replace(/\s+/g, ' ').trim();
      }
      const wrap = el.closest && el.closest('label');
      if (wrap && wrap.textContent.trim()) return wrap.textContent.replace(/\s+/g, ' ').trim();
      return (el.getAttribute('placeholder') || el.getAttribute('title') || '').trim();
    };
    // Tam erişim adı — form öğelerinde DEĞER / DURUM da eklenir (select seçili değeri,
    // checkbox/radio işaretli durumu) ki ekran okuyucu gibi tam okusun.
    const erisimAdi = (el) => {
      if (!el || el === document.body || el.nodeType !== 1) return '';
      const tag = (el.tagName || '').toLowerCase();
      const tip = (el.getAttribute('type') || '').toLowerCase();
      if (tag === 'select') {
        const secili = (el.options && el.options[el.selectedIndex] && el.options[el.selectedIndex].text) || 'yok';
        return `${temelEtiket(el) || 'Seçim'}, seçili: ${secili}, seçim kutusu`;
      }
      if (tip === 'checkbox') {
        return `${temelEtiket(el) || 'Onay kutusu'}, ${el.checked ? 'işaretli' : 'işaretsiz'}, onay kutusu`;
      }
      if (tip === 'radio') {
        // Grup içindeki konum (X / Y) → kullanıcı kaç seçenek olduğunu, ok tuşuyla
        // diğerlerine geçebileceğini anlar (Tab yalnız seçili olana gelir; bu normaldir).
        let konum = '';
        try {
          if (el.name) {
            const ad = (window.CSS && CSS.escape) ? CSS.escape(el.name) : el.name;
            const grup = [...document.querySelectorAll(`input[type="radio"][name="${ad}"]`)];
            if (grup.length > 1) konum = `, ${grup.indexOf(el) + 1} / ${grup.length}`;
          }
        } catch { /* */ }
        return `${temelEtiket(el) || 'Seçenek'}, ${el.checked ? 'seçili' : 'seçili değil'}${konum}, seçenek düğmesi`;
      }
      if (tag === 'input' || tag === 'textarea') {
        const val = (el.value || '').trim();
        return `${temelEtiket(el) || 'Metin kutusu'}${val ? ', ' + val : ', boş'}`;
      }
      const al = el.getAttribute('aria-label');
      if (al && al.trim()) return al.trim();
      const lb = el.getAttribute('aria-labelledby');
      if (lb) {
        const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
        if (t) return t;
      }
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt && txt.length <= 140) return txt;
      return el.getAttribute('title') || '';
    };
    const ttsAcikMi = () => { try { return !!ayarlariAl().sesAcik; } catch { return false; } };
    let sonEl = null;
    const onFocusIn = (e) => {
      if (!ttsAcikMi()) return;
      const el = e.target;
      // Alt→braille gibi programatik odakta duyuru zaten yapıldı → tekrar okuma.
      if (el === sonProgramatikOdakRef.current) { sonProgramatikOdakRef.current = null; return; }
      if (!el || el === sonEl) return;
      sonEl = el;
      const ad = erisimAdi(el);
      if (ad) konus(ad, { kesintiyle: true });
    };
    // Form öğesi DEĞİŞİNCE (odak değişmeden): yeni değer/durumu seslendir.
    const onChange = (e) => {
      if (!ttsAcikMi()) return;
      const el = e.target;
      if (!el || el.nodeType !== 1) return;
      const tag = (el.tagName || '').toLowerCase();
      const tip = (el.getAttribute('type') || '').toLowerCase();
      if (tag === 'select' || tip === 'checkbox' || tip === 'radio') {
        const ad = erisimAdi(el);
        if (ad) konus(ad, { kesintiyle: true });
      }
    };
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('change', onChange, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('change', onChange, true);
    };
  }, []);

  const svgBaglar = ardisikSlurlariBirlestir(muzikBaglar);

  const bagIdEslesiyorMu = (bag, id) => {
    if (!bag || !id) return false;

    const adaylar = [
      bag.id,
      bag.bagId,
      bag.sourceId,
      bag.originalId,
      ...(Array.isArray(bag.mergedFrom) ? bag.mergedFrom : []),
      ...(Array.isArray(bag.originalIds) ? bag.originalIds : []),
    ].filter(Boolean);

    return adaylar.includes(id);
  };

  const bagAktifId = (bag) => (
    Array.isArray(bag.mergedFrom) && bag.mergedFrom.length
      ? bag.mergedFrom[0]
      : bag.id
  );

  const renderInlineTimeSignature = (oge, x) => {
    const ts = oge.timeSignature?.ad || oge.ad || oge.gorunum || '';

    return (
      <MuzikTimeSignatureGlyph
        key={oge.id}
        value={ts}
        x={x}
        className="muzik-inline-time-sig"
      />
    );
  };

  const measureLayoutForItem = (ogeId, satirOlculeri = []) => (
    satirOlculeri.find((m) => Array.isArray(m.itemIds) && m.itemIds.includes(ogeId)) || null
  );

  const barlineMeasureEndXAl = (oge, satirOlculeri = []) => {
    const layout = measureLayoutForItem(oge.id, satirOlculeri);
    if (!layout) return null;
    if (Number.isFinite(layout.measureEndX)) return layout.measureEndX;
    if (Number.isFinite(layout.endX)) return layout.endX;
    return null;
  };

  const satirSonGorunurOgesiMi = (itemIndex, rowItems = []) => {
    for (let i = itemIndex + 1; i < rowItems.length; i += 1) {
      const oge = rowItems[i];
      if (!oge) continue;
      if (oge.hidden || oge.gizli) continue;
      return false;
    }
    return true;
  };

  const renderInlineKeySignature = (oge, x) => {
    const ad = String(oge.keySignature?.ad || oge.ad || '').toLowerCase();

    const m = /^(\d+)\s*(diyezli|bemollü|bemollu|bemol)/i.exec(ad);

    if (!m) {
      return (
        <g key={oge.id} className="muzik-inline-key-sig">
          <rect
            x={x - 16}
            y={68}
            width={32}
            height={44}
            rx={8}
            className="muzik-note-hover-rect"
          />
          <text
            x={x}
            y="98"
            textAnchor="middle"
            className="muzik-key-sig-glyph"
          >
            {glyphChar(ACCIDENTAL_CP.natural)}
          </text>
        </g>
      );
    }

    const sayi = Math.min(7, Math.max(0, parseInt(m[1], 10) || 0));
    if (sayi <= 0) return null;

    const diyez = /diyez/i.test(ad);
    // Sol anahtarı donanım arıza konumları (header ile aynı) — baseline'lar.
    const diyezY = [72, 90, 66, 84, 102, 78, 96];
    const bemolY = [96, 78, 102, 84, 108, 90, 114];
    const ys = (diyez ? diyezY : bemolY).slice(0, sayi);
    const sym = diyez ? KEY_SHARP : KEY_FLAT;
    const width = Math.max(30, ys.length * SVG_KEY_ACCIDENTAL_GAP + 18);
    const startX = x - width / 2 + 10;

    return (
      <g key={oge.id} className="muzik-inline-key-sig">
        <rect
          x={x - width / 2}
          y={50}
          width={width}
          height={64}
          rx={10}
          className="muzik-note-hover-rect"
        />

        {ys.map((y, i) => (
          <text
            key={`${oge.id}-acc-${i}`}
            x={startX + i * SVG_KEY_ACCIDENTAL_GAP}
            y={y}
            textAnchor="middle"
            className="muzik-key-sig-glyph"
          >
            {sym}
          </text>
        ))}
      </g>
    );
  };

  const aktifOktavAl = useCallback(() => {
    const adaylar = [
      sonKullanilanOktav,
      [...(svgCizilecekOgeler || [])]
        .reverse()
        .find((oge) => oge?.tip === 'nota' && !oge.autoRest && !oge.otomatik)?.oktav,
      4,
    ];

    for (const aday of adaylar) {
      const n = Number(aday);
      if (Number.isFinite(n) && n >= 1 && n <= 7) return n;
    }

    return 4;
  }, [sonKullanilanOktav, svgCizilecekOgeler]);

  const aktifSureIdxAl = useCallback(() => (
    Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1
  ), [seciliSureIdx]);

  const notaEklemeAdaylariAl = useCallback(() => {
    const temelNotalar = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
    const aktifOktav = aktifOktavAl();

    return temelNotalar.map((notaAd) => {
      const oge = {
        id: `ekleme-aday-${notaAd}-${aktifOktav}`,
        tip: 'nota',
        notaAd,
        oktav: aktifOktav,
        sureIndeksi: Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1,
      };

      return {
        notaAd,
        oktav: aktifOktav,
        y: notaGorselYHesapla(oge, mevcutAnahtar),
        oge,
      };
    });
  }, [
    seciliSureIdx,
    mevcutAnahtar,
    aktifOktavAl,
  ]);

  const eklemeReferansOgesiMi = (oge) => (
    oge &&
    oge.tip !== 'anahtar' &&
    oge.tip !== 'brailleShorthand' &&
    !oge._repeatCopy &&
    !oge.autoRest &&
    !oge.otomatik &&
    !oge.autoBarline &&
    !oge.otomatikOlcuCizgisi
  );

  const satirEklemeKonumlariAl = useCallback((satirIdx) => {
    const satirOgeleri = Array.isArray(muzikSatirlar?.[satirIdx])
      ? muzikSatirlar[satirIdx]
      : [];

    const referansOgeler = satirOgeleri.filter(eklemeReferansOgesiMi);

    if (referansOgeler.length === 0) {
      return [
        {
          id: `satir-${satirIdx}-bos-baslangic`,
          insertAfterId: null,
          x: SVG_STAFF_LEFT_X + 120,
        },
      ];
    }

    return referansOgeler.map((oge, index) => {
      const sonrakiOge = referansOgeler[index + 1] || null;

      // Bir sonraki öge zaman imzası veya donanım değişikliğiyse
      // bu konuma nota eklenemez — inline change item her zaman ölçü başında durmalı.
      if (
        sonrakiOge?.tip === 'timeSignatureChange' ||
        sonrakiOge?.tip === 'keySignatureChange'
      ) {
        return null;
      }

      const yer = svgYerlesimHaritasi?.get?.(oge.id);
      const currentX = Number.isFinite(Number(yer?.x))
        ? Number(yer.x)
        : SVG_STAFF_LEFT_X + 120;

      const sonrakiYer = sonrakiOge?.id
        ? svgYerlesimHaritasi?.get?.(sonrakiOge.id)
        : null;

      const nextX = Number.isFinite(Number(sonrakiYer?.x))
        ? Number(sonrakiYer.x)
        : null;

      const x = nextX !== null
        ? currentX + Math.max(24, Math.min(54, (nextX - currentX) / 2))
        : currentX + 48;

      return {
        id: `satir-${satirIdx}-after-${oge.id}`,
        insertAfterId: oge.id,
        x: Math.min(Math.max(x, SVG_STAFF_LEFT_X + 40), SVG_SAG_SINIR_X - 32),
      };
    }).filter(Boolean);
  }, [muzikSatirlar, svgYerlesimHaritasi]);

  const sureButonlari = useMemo(() => (
    (MUZIK_SURE_GOSTERGELERI || [])
      .map((sure, index) => ({
        index,
        ad: sure?.ad || sure?.kisaAd || `${index}`,
        kisaAd: sure?.kisaAd || sure?.ad || `${index}`,
        realValue: sure?.realValue,
      }))
      .filter((sure) => Number.isFinite(Number(sure.realValue)))
  ), []);

  const sureIkonuAl = (sure) => {
    const realValue = Number(sure?.realValue);

    if (realValue === 1) return '𝅝';      // birlik
    if (realValue === 2) return '𝅗𝅥';      // ikilik
    if (realValue === 4) return '𝅘𝅥';      // dörtlük
    if (realValue === 8) return '𝅘𝅥𝅮';      // sekizlik
    if (realValue === 16) return '𝅘𝅥𝅯';     // onaltılık
    if (realValue === 32) return '𝅘𝅥𝅰';     // otuz ikilik
    if (realValue === 64) return '𝅘𝅥𝅱';     // altmış dörtlük

    return '♪';
  };

  const renderSatirEklemeAracCubugu = (satirIdx) => {
    if (hoverSatirIdx !== satirIdx) return null;

    const aktifOktav = aktifOktavAl();
    const aktifSureIdx = aktifSureIdxAl();

    return (
      <foreignObject
        x={SVG_STAFF_LEFT_X + 8}
        y={SVG_ROW_VIEWBOX_Y + 6}
        width={860}
        height={52}
        style={{ overflow: 'visible' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="inline-flex w-fit max-w-[840px] items-center gap-2 rounded-xl bg-white/95 px-2 py-1.5 text-xs shadow-sm backdrop-blur"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-semibold text-slate-700">Süre</span>

          <div className="flex items-center gap-1">
            {sureButonlari.map((sure) => {
              const aktif = sure.index === aktifSureIdx;

              return (
                <button
                  key={`satir-sure-${sure.index}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSeciliSureIdx?.(sure.index);
                  }}
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-md border text-base leading-none transition',
                    aktif
                      ? 'border-sky-500 bg-sky-100 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50',
                  ].join(' ')}
                  title={sure.ad}
                  aria-label={sure.ad}
                >
                  <span aria-hidden="true">{sureIkonuAl(sure)}</span>
                </button>
              );
            })}
          </div>

          {/* Noktalı toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDottedMiniToolbar((d) => !d);
            }}
            className={[
              'flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-bold leading-none transition',
              dottedMiniToolbar
                ? 'border-violet-500 bg-violet-100 text-violet-800'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-violet-50 hover:border-violet-300',
            ].join(' ')}
            title={dottedMiniToolbar ? 'Noktalı: açık — kapat' : 'Noktalı: kapalı — aç'}
            aria-pressed={dottedMiniToolbar}
          >
            <span className="text-base">·</span>
            <span>Noktalı</span>
          </button>

          <span className="ml-2 font-semibold text-slate-700">Oktav</span>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((oktav) => {
              const aktif = oktav === aktifOktav;

              return (
                <button
                  key={`satir-oktav-${oktav}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSonKullanilanOktav?.(oktav);
                  }}
                  className={[
                    'h-7 w-7 rounded-md border text-xs font-bold transition',
                    aktif
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50',
                  ].join(' ')}
                >
                  {oktav}
                </button>
              );
            })}
          </div>
        </div>
      </foreignObject>
    );
  };

  const eklenenNotayiCal = useCallback((aday) => {
    if (!aday?.oge || typeof playNote !== 'function') return;

    playNote(aday.oge, {
      keySignatureAccidentals: headerKeySignatureAccidentals,
    });
  }, [playNote, headerKeySignatureAccidentals]);

  const svgMouseNoktasiAl = (svg, event) => {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const eklemeHoverGuncelle = useCallback((event, satirIdx) => {
    const target = event.target;
    const svg = event.currentTarget;
    const nokta = svg?.createSVGPoint ? svgMouseNoktasiAl(svg, event) : null;

    // Ölçü hover tespiti — imlecin x koordinatına denk gelen ölçüyü bul.
    // Notaların/işaretlerin üzerinde de çalışır (dinleyici svg üzerinde, mousemove yukarı kabarcıklanır).
    if (nokta) {
      const olculer = muzikSatirOlculeri?.[satirIdx] || [];
      let bulunanKey = null;
      for (let i = 0; i < olculer.length; i += 1) {
        const m = olculer[i];
        const sx = m.startX ?? m.measureStartX ?? 0;
        const sonraki = olculer[i + 1];
        const ex = m.endX ?? m.measureEndX
          ?? sonraki?.startX ?? sonraki?.measureStartX
          ?? Number.POSITIVE_INFINITY;
        if (nokta.x >= sx && nokta.x < ex) {
          bulunanKey = `${satirIdx}:${m.measureIndex ?? m.index ?? i}`;
          break;
        }
      }
      setHoverOlcuKey((prev) => (prev === bulunanKey ? prev : bulunanKey));
    }

    if (
      target?.closest?.(
        '.muzik-skor-ogesi, .muzik-bag-grup, .muzik-barline-hit-area, .muzik-anahtar-grup'
      )
    ) {
      setHoverEklemeKonumuId(null);
      setHoverEklemeNotasi(null);
      return;
    }

    if (!nokta) return;

    const konumlar = satirEklemeKonumlariAl(satirIdx);

    const aktifKonum = konumlar.find((konum) => (
      Math.abs(nokta.x - konum.x) <= 24 &&
      nokta.y >= SCORE_STAFF_TOP_Y - 34 &&
      nokta.y <= SCORE_STAFF_BOTTOM_Y + 34
    ));

    if (!aktifKonum) {
      setHoverEklemeKonumuId(null);
      setHoverEklemeNotasi(null);
      return;
    }

    setHoverEklemeKonumuId(aktifKonum.id);
  }, [satirEklemeKonumlariAl, muzikSatirOlculeri]);

  const renderNotaEklemeKutulari = (satirIdx) => {
    if (hoverSatirIdx !== satirIdx) return null;
    if (typeof notaEkleKonuma !== 'function') return null;

    const konumlar = satirEklemeKonumlariAl(satirIdx);
    if (!konumlar.length) return null;

    const adaylar = notaEklemeAdaylariAl();

    return (
      <g
        className="muzik-nota-ekleme-kutulari"
        pointerEvents="none"
        style={{ pointerEvents: 'none' }}
      >
        {konumlar.map((konum) => {
          const konumAktif = hoverEklemeKonumuId === konum.id;

          return (
            <g
              key={konum.id}
              className="muzik-nota-ekleme-konumu"
              pointerEvents="none"
              style={{ pointerEvents: 'none' }}
            >
              <rect
                x={konum.x - 24}
                y={SCORE_STAFF_TOP_Y - 34}
                width={48}
                height={SCORE_STAFF_BOTTOM_Y - SCORE_STAFF_TOP_Y + 68}
                rx={10}
                fill="transparent"
                pointerEvents="none"
              />

              {konumAktif && adaylar.map((aday) => {
                const hoverKey = `${konum.id}-${aday.notaAd}-${aday.oktav}`;
                const aktif = hoverEklemeNotasi?.key === hoverKey;

                return (
                  <g
                    key={hoverKey}
                    role="button"
                    tabIndex={0}
                    pointerEvents="auto"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    aria-label={`${aday.oktav}. oktav ${aday.notaAd} ekle`}
                    onMouseEnter={() => setHoverEklemeNotasi({
                      ...aday,
                      key: hoverKey,
                      insertAfterId: konum.insertAfterId,
                    })}
                    onMouseLeave={() => setHoverEklemeNotasi((onceki) => (
                      onceki?.key === hoverKey ? null : onceki
                    ))}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      notaEkleKonuma({
                        notaAd: aday.notaAd,
                        oktav: aday.oktav,
                        sureIdx: Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1,
                        insertAfterId: konum.insertAfterId,
                        dotted: dottedMiniToolbar,
                      });

                      eklenenNotayiCal?.(aday);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();

                        notaEkleKonuma({
                          notaAd: aday.notaAd,
                          oktav: aday.oktav,
                          sureIdx: Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1,
                          insertAfterId: konum.insertAfterId,
                          dotted: dottedMiniToolbar,
                        });

                        eklenenNotayiCal?.(aday);
                      }
                    }}
                  >
                    {/* Hit alanı dar tutulur (komşu notayı kapatmasın → nota
                        tıklanabilir kalır); görünür mavi kutuyu (±11) kapsar. */}
                    <rect
                      x={konum.x - 14}
                      y={aday.y - 16}
                      width={28}
                      height={32}
                      rx={8}
                      fill="transparent"
                      pointerEvents="all"
                    />

                    <rect
                      x={konum.x - 11}
                      y={aday.y - 7}
                      width={22}
                      height={14}
                      rx={4}
                      fill="#2563eb"
                      fillOpacity={aktif ? 0.18 : 0.07}
                      stroke="#2563eb"
                      strokeOpacity={aktif ? 0.7 : 0.22}
                      strokeWidth={aktif ? 1.4 : 0.9}
                    />

                    {aktif && (
                      <text
                        x={konum.x + 18}
                        y={aday.y + 4}
                        textAnchor="start"
                        fontSize="11"
                        fontWeight="700"
                        fill="#2563eb"
                        pointerEvents="none"
                      >
                        {aday.notaAd}{dottedMiniToolbar ? '·' : ''}
                      </text>
                    )}

                    {aktif && (
                      <>
                        {ledgerCizgileri(konum.x, aday.y, mevcutAnahtar, { maxLines: 5 })}

                        <MusicNoteGlyph
                          item={aday.oge}
                          x={konum.x}
                          y={aday.y}
                          sure={MUZIK_SURE_GOSTERGELERI[aday.oge.sureIndeksi ?? 1]}
                          grouped={false}
                          beamCount={0}
                          glyphScaleY={glyphScaleY}
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  const renderBarlineGlyph = (oge, x, itemIndex, rowItems, satirOlculeri = [], rowRightX) => {
    const type = skorBarlineTipiAl(oge);
    const beginRepeatMi = oge?.tip === 'beginRepeat' || String(type).toLowerCase().includes('begin');

    let normalX;
    if (beginRepeatMi) {
      normalX = x;
    } else {
      const layoutEndX = barlineMeasureEndXAl(oge, satirOlculeri);
      normalX = Number.isFinite(layoutEndX) ? layoutEndX : x;
    }

    const rowEnd = satirSonGorunurOgesiMi(itemIndex, rowItems);
    if (!beginRepeatMi && rowEnd) {
      normalX = Math.max(normalX, rowRightX);
    }

    const isRowEnd = !beginRepeatMi && type === 'final' && skorFinalBarlineSatirSonuMu({
      itemIndex,
      rowItems,
    });
    const finalX = beginRepeatMi
      ? normalX
      : skorBarlineXAl({
          normalX,
          rowRightX,
          barlineType: type,
          isRowEnd,
        });
    const hoverAktif = hoverBrailleOgeId === oge.id;
    const seciliAktif = seciliOgeId === oge.id || barlineMenu?.ogeId === oge.id;

    return (
      <g>
        {/* Hit area + hover/select frame (notalarla aynı mavi tasarım) */}
        <rect
          x={finalX - 16}
          y={SCORE_STAFF_TOP_Y - 2}
          width={32}
          height={SCORE_STAFF_BOTTOM_Y - SCORE_STAFF_TOP_Y + 4}
          rx={6}
          fill={
            seciliAktif ? 'rgba(59,130,246,0.18)'
            : hoverAktif ? 'rgba(59,130,246,0.10)'
            : 'transparent'
          }
          stroke={hoverAktif || seciliAktif ? '#3b82f6' : 'transparent'}
          strokeWidth={seciliAktif ? 1.8 : hoverAktif ? 1.4 : 0}
          strokeDasharray={hoverAktif && !seciliAktif ? '4 3' : undefined}
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
        />
        <ScoreBarlineGlyph
          x={finalX}
          type={type}
          topY={SCORE_STAFF_TOP_Y}
          bottomY={SCORE_STAFF_BOTTOM_Y}
        />

        {/* Volta bracket artık voltaBracketSegments useMemo'da, satır döngüsünde çiziliyor */}
      </g>
    );
  };

  return (
    <div
      ref={applicationRef}
      tabIndex={-1}
      className="w-full p-3 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-2 outline-none"
      role="application"
      aria-roledescription="Müzik notası editörü"
      aria-label={`Müzik çizim alanı, ${muzikSatirlar?.length || 0} satır. Notalara Tab ile gezinip Enter ile düzenleyebilirsiniz. Tam sözel okuma için BRF okuma sekmesine geçin.`}
    >
      {/* Ekran okuyucu canlı duyuru bölgesi (görünmez) — nota-nota gezinme/çalma */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {sesliDuyuru}
      </div>
      <input
        ref={klavyeYakalayiciRef}
        data-muzik-keyboard-sink="true"
        type="text"
        className="sr-only"
        tabIndex={duzenlemeModu ? 0 : -1}
        aria-label="Müzik nota yazma alanı. Harflerle nota yazın; ok tuşlarıyla gezin; Enter veya Escape ile kapatın."
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onInput={(e) => { e.currentTarget.value = ''; }}
        onChange={(e) => { e.currentTarget.value = ''; }}
      />
      {/* ── Skor satırları (yatay scroll için kendi container'ı) ────────── */}
      <div ref={skorScrollRef} className="muzik-skor-scroll w-full flex flex-col gap-2 overflow-x-auto">
      {muzikSatirlar.map((satir, satirIdx) => {
        const satirOlculeri = muzikSatirOlculeri?.[satirIdx] || [];
        const satirOlcuBrailleleri = olcuBrailleSonuclari[satirIdx] || [];
        const satirNotaYleri = satir
          .filter((oge) => oge.tip === 'nota')
          .map((oge) => notaYHesapla(oge, mevcutAnahtar));
        const enAlcakNotaY = satirNotaYleri.length
          ? Math.max(...satirNotaYleri)
          : 112;
        const svgCssHeight = 220;
        const svgScale = svgCssHeight / SVG_ROW_HEIGHT;
        const brailleTargetY = Math.max(
          SVG_SCORE_BRAILLE_Y_OFFSET,
          enAlcakNotaY + SVG_SCORE_BRAILLE_NOTE_GAP,
        );
        const brailleYShift = svgCssHeight - brailleTargetY * svgScale;
        const satirSagX = skorSatirSagXHesapla({
          staffRightX: SVG_SAG_SINIR_X,
          rightInset: SCORE_ROW_RIGHT_INSET,
        });

        const aktifPlaybackSatiri = isPlaying && aktifPlaybackSatirIdx === satirIdx;
        return (
          <div key={`skor-olcu-braille-satir-wrap-${satirIdx}`} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* İlk satır: başlık ve besteci HTML olarak, SVG'nin üstünde */}
          {satirIdx === 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', position: 'relative', paddingBottom: 2, minHeight: 32 }}>
              {/* Başlık — ortada: editing modunda input, değilse span */}
              {inlineEdit?.alan === 'title' ? (
                <input
                  ref={inlineEditRef}
                  type="text"
                  aria-label="Eser başlığı"
                  defaultValue={inlineEdit.deger}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); inlineEditKaydet(); }
                    if (e.key === 'Escape') { e.preventDefault(); setInlineEdit(null); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Başlık yazınız"
                  style={{
                    fontSize: 22, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
                    color: '#1e293b', textAlign: 'center',
                    background: 'transparent', border: 'none',
                    boxShadow: '0 1.5px 0 #3b82f6', outline: 'none',
                    padding: 0, margin: 0, width: Math.max(inlineEdit.rect?.width || 200, 220),
                    lineHeight: 'normal', position: 'relative', zIndex: 160,
                  }}
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Eser başlığı: ${muzikHeader?.title || 'boş'}. Düzenlemek için Enter.`}
                  onClick={(e) => inlineEditAc('title', e, muzikHeader?.title, 22, 700, 'normal')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      inlineEditAc('title', e, muzikHeader?.title, 22, 700, 'normal');
                    }
                  }}
                  style={{
                    fontSize: 22, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
                    color: muzikHeader?.title ? '#1e293b' : '#cbd5e1',
                    cursor: 'text', userSelect: 'none', textAlign: 'center',
                  }}
                >
                  {muzikHeader?.title || 'Başlık yazınız'}
                </span>
              )}
              {/* Besteci — sağda absolute: editing modunda input, değilse span */}
              {inlineEdit?.alan === 'composer' ? (
                <input
                  ref={inlineEditRef}
                  type="text"
                  aria-label="Besteci"
                  defaultValue={inlineEdit.deger}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); inlineEditKaydet(); }
                    if (e.key === 'Escape') { e.preventDefault(); setInlineEdit(null); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Besteci"
                  style={{
                    position: 'absolute', right: 0, bottom: 2,
                    fontSize: 13, fontStyle: 'italic', fontFamily: 'system-ui, sans-serif',
                    color: '#64748b', textAlign: 'right',
                    background: 'transparent', border: 'none',
                    boxShadow: '0 1.5px 0 #3b82f6', outline: 'none',
                    padding: 0, margin: 0, width: Math.max(inlineEdit.rect?.width || 100, 130),
                    lineHeight: 'normal', zIndex: 160,
                  }}
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Besteci: ${muzikHeader?.composer || 'boş'}. Düzenlemek için Enter.`}
                  onClick={(e) => inlineEditAc('composer', e, muzikHeader?.composer, 13, 400, 'italic')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      inlineEditAc('composer', e, muzikHeader?.composer, 13, 400, 'italic');
                    }
                  }}
                  style={{
                    position: 'absolute', right: 0, bottom: 2,
                    fontSize: 13, fontStyle: 'italic', fontFamily: 'system-ui, sans-serif',
                    color: muzikHeader?.composer ? '#64748b' : '#cbd5e1',
                    cursor: 'text', userSelect: 'none',
                  }}
                >
                  {muzikHeader?.composer || 'Besteci'}
                </span>
              )}
            </div>
          )}
          <div
            key={`skor-olcu-braille-satir-${satirIdx}`}
            ref={satirRefAta(satirIdx)}
            className={[
              'muzik-olcu-braille-blok',
              aktifPlaybackSatiri ? 'muzik-playback-satir-aktif' : '',
            ].filter(Boolean).join(' ')}
            onMouseEnter={() => setHoverSatirIdx(satirIdx)}
            onMouseLeave={() => {
              setHoverSatirIdx((onceki) => (onceki === satirIdx ? null : onceki));
              setHoverEklemeNotasi(null);
              setHoverEklemeKonumuId(null);
              setHoverOlcuKey((prev) => (prev && prev.startsWith(`${satirIdx}:`) ? null : prev));
            }}
            style={{
              background: aktifPlaybackSatiri ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              boxShadow: aktifPlaybackSatiri ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.16)' : 'none',
              borderRadius: 14,
              transition: 'background-color 180ms ease, box-shadow 180ms ease',
            }}
          >
            <svg
              className="araclar-muzik-skor-svg"
              viewBox={`0 ${SVG_ROW_VIEWBOX_Y} 800 ${SVG_ROW_HEIGHT}`}
              preserveAspectRatio="none"
              aria-label={`Porte satır ${satirIdx + 1}`}
              onMouseMove={(event) => eklemeHoverGuncelle(event, satirIdx)}
              onClick={() => {
                setSeciliOgeId(null);
                setSeciliBagId?.(null);
                setHoverCizgiBagId?.(null);
                setPopupAcik(false);
                setBagEditMenu(null);
                setHeaderTsMenuPos(null);
              }}
              style={{ overflow: 'visible' }}
            >
              <StaffLines
                x={SVG_STAFF_LEFT_X}
                rightX={satirSagX}
              />

              {renderSatirEklemeAracCubugu(satirIdx)}

              <g className="muzik-anahtar-grup"
                role="button"
                tabIndex={0}
                data-nav={satirIdx === 0 ? 'anahtar' : undefined}
                data-oge-id={satirIdx === 0 ? 'ANAHTAR_BAS' : undefined}
                aria-label={satirIdx === 0
                  ? `${mevcutAnahtar.ad || 'Anahtar'}, dize başı — düzenleme modunda harfe basınca en başa nota eklenir`
                  : `${mevcutAnahtar.ad || 'Anahtar'} — değiştirmek için tıkla`}
                style={{ cursor: 'pointer' }}
                onFocus={satirIdx === 0 ? () => setSeciliOgeId?.('ANAHTAR_BAS') : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); e.stopPropagation();
                    setAnahtarPopupAcik(true);
                  }
                }}
                onMouseEnter={() => setHoverHeaderClef(true)}
                onMouseLeave={() => setHoverHeaderClef(false)}
                onClick={(e) => { e.stopPropagation(); setAnahtarPopupAcik(true); }}>
                <rect
                  x={SVG_CLEF_X - 24}
                  y={42}
                  width={48}
                  height={96}
                  rx={12}
                  fill={hoverHeaderClef ? 'rgba(59,130,246,0.10)' : 'transparent'}
                  stroke={hoverHeaderClef ? '#3b82f6' : 'transparent'}
                  strokeWidth={hoverHeaderClef ? 1.4 : 0}
                  strokeDasharray={hoverHeaderClef ? '4 3' : undefined}
                  style={{ pointerEvents: 'all' }}
                />
                <text
                  x={SVG_CLEF_X}
                  y={clefStaffY(mevcutAnahtar)}
                  textAnchor="middle"
                  className={anahtarFontClassAl(mevcutAnahtar)}
                  // Standalone Bravura SMuFL anahtar (nota/bayrakla aynı standart).
                  // Inline font, paylaşılan .muzik-clef CSS'ini (legacy Araclar) bozmaz.
                  // Dikey karşı-ölçek: çapa (sol=G4 y=100, fa=F3 y=76) sabit, glyph açılır.
                  style={{ fontFamily: BRAVURA_FONT }}
                  transform={`translate(0 ${clefStaffY(mevcutAnahtar)}) scale(1 ${glyphScaleY}) translate(0 ${-clefStaffY(mevcutAnahtar)})`}
                >
                  {clefGlyph(mevcutAnahtar)}
                </text>
              </g>
              {/* Sol anahtar altında "B" butonu → eser bilgileri + header braille popup */}
              {satirIdx === 0 && (
                <g
                  className="muzik-header-braille-btn"
                  role="button"
                  tabIndex={0}
                  aria-label="Eser bilgileri ve header braille"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoverHeaderBrailleBtn(true)}
                  onMouseLeave={() => setHoverHeaderBrailleBtn(false)}
                  onClick={(e) => { e.stopPropagation(); onHeaderBrailleAc?.(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onHeaderBrailleAc?.();
                    }
                  }}
                >
                  <rect
                    x={SVG_CLEF_X - 13}
                    y={150}
                    width={26}
                    height={26}
                    rx={7}
                    fill={hoverHeaderBrailleBtn ? '#2563eb' : '#eff6ff'}
                    stroke="#2563eb"
                    strokeWidth={1.6}
                    style={{ pointerEvents: 'all' }}
                  />
                  <text
                    x={SVG_CLEF_X}
                    y={169}
                    textAnchor="middle"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      fill: hoverHeaderBrailleBtn ? '#ffffff' : '#2563eb',
                      fontFamily: 'system-ui, sans-serif',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    B
                  </text>
                  <title>Eser bilgileri & header braille</title>
                </g>
              )}
              {/* Tempo — ilk dizenin sol başında, porte çizgilerinin üstünde */}
              {satirIdx === 0 && (
                <text
                  x={72}
                  y={SCORE_STAFF_TOP_Y - 8}
                  textAnchor="start"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fill: muzikHeader?.tempo ? '#334155' : '#cbd5e1',
                    fontFamily: 'system-ui, sans-serif',
                    cursor: 'text',
                    userSelect: 'none',
                    fontStyle: 'italic',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTempoDropdownPos({ x: rect.left, y: rect.bottom + 4 });
                  }}
                  role="button"
                  aria-label={`Tempo: ${muzikHeader?.tempo || 'yok'} — tıklayarak düzenle`}
                >
                  {muzikHeader?.tempo || 'Tempo yok'}
                </text>
              )}
              {satirIdx === 0 && muzikOgeleri.length === 0 && (
                <text x="120" y="94" className="muzik-bos-yardim">Önce bir nota seçin…</text>
              )}
              {satirIdx === 0 && muzikHeader.keySignature && (() => {
                const ad = String(muzikHeader.keySignature.ad || '').toLowerCase();
                const m = /^(\d+)\s*(diyezli|bemollü|bemollu|bemol)/i.exec(ad);

                if (!m) return null;

                const sayi = Math.min(7, Math.max(0, parseInt(m[1], 10) || 0));
                if (sayi <= 0) return null;

                const diyez = /diyez/i.test(ad);
                // Sol anahtarı (treble) için donanım arıza konumları — text
                // baseline'ları. Glif mürekkep merkezi baseline'ın ~8 birim
                // üstünde olduğundan, hedef porte konumu + 8 olarak verilir.
                // Diyez sırası (mürekkep merkezi): F#64 C#82 G#58 D#76 A#94 E#70 B#88
                const diyezY = [72, 90, 66, 84, 102, 78, 96];
                // Bemol sırası (mürekkep merkezi): Bb88 Eb70 Ab94 Db76 Gb100 Cb82 Fb106
                const bemolY = [96, 78, 102, 84, 108, 90, 114];
                const ys = (diyez ? diyezY : bemolY).slice(0, sayi);
                const sym = diyez ? KEY_SHARP : KEY_FLAT;

                const startX = ilkSatirHeaderBilgisi.keyStartX;
                const width = Math.max(30, ys.length * SVG_KEY_ACCIDENTAL_GAP + 18);

                return (
                  <g
                    className="muzik-key-sig"
                    role="button"
                    tabIndex={0}
                    aria-label="Donanım (key signature) — değiştirmek için tıkla"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverHeaderKeySig(true)}
                    onMouseLeave={() => setHoverHeaderKeySig(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeaderKsMenuPos({ x: e.clientX, y: e.clientY });
                      setBagEditMenu(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setHeaderKsMenuPos({ x: 200, y: 160 });
                      }
                    }}
                  >
                    {/* Hit-area + hover çerçevesi (notalarla aynı standart mavi tasarım) */}
                    <rect
                      x={startX - 10}
                      y={50}
                      width={width}
                      height={60}
                      rx={10}
                      fill={hoverHeaderKeySig ? 'rgba(59,130,246,0.10)' : 'transparent'}
                      stroke={hoverHeaderKeySig ? '#3b82f6' : 'transparent'}
                      strokeWidth={hoverHeaderKeySig ? 1.4 : 0}
                      strokeDasharray={hoverHeaderKeySig ? '4 3' : undefined}
                      style={{ pointerEvents: 'all' }}
                    />

                    {ys.map((y, i) => (
                      <text
                        key={i}
                        x={startX + i * SVG_KEY_ACCIDENTAL_GAP}
                        y={y}
                        textAnchor="middle"
                        className="muzik-key-sig-glyph"
                      >
                        {sym}
                      </text>
                    ))}
                  </g>
                );
              })()}
              {satirIdx === 0 && muzikHeader.timeSignature && (() => {
                const ts = muzikHeader.timeSignature.ad || muzikHeader.timeSignature.gorunum || '';
                // Zaman imzası donanıma biraz daha yakın (sola) konumlanır.
                // SMuFL rakam glifinin görsel merkezi text-x'ten ~6 birim sağda
                // olduğundan, +2 ile görsel merkez timeStartX+8'e gelir.
                const tsx = ilkSatirHeaderBilgisi.timeStartX + 2;

                return (
                  <g
                    className="muzik-zaman-imza-grup"
                    role="button"
                    tabIndex={0}
                    data-nav="zaman"
                    data-oge-id="ZAMAN_IMZA"
                    aria-label={`Ölçü sayısı ${ts} — değiştirmek için Enter`}
                    style={{ cursor: 'pointer' }}
                    onFocus={() => setSeciliOgeId?.('ZAMAN_IMZA')}
                    onMouseEnter={() => setHoverHeaderTimeSig(true)}
                    onMouseLeave={() => setHoverHeaderTimeSig(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeaderTsMenuPos({ x: e.clientX, y: e.clientY });
                      setBagEditMenu(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setHeaderTsMenuPos({ x: 200, y: 160 });
                      }
                    }}
                  >
                    {/* Hit-area + hover çerçevesi (notalarla aynı standart mavi tasarım) */}
                    <rect
                      x={tsx - 22}
                      y={55}
                      width={44}
                      height={60}
                      rx={10}
                      fill={hoverHeaderTimeSig ? 'rgba(59,130,246,0.10)' : 'transparent'}
                      stroke={hoverHeaderTimeSig ? '#3b82f6' : 'transparent'}
                      strokeWidth={hoverHeaderTimeSig ? 1.4 : 0}
                      strokeDasharray={hoverHeaderTimeSig ? '4 3' : undefined}
                      style={{ pointerEvents: 'all' }}
                    />
                    <MuzikTimeSignatureGlyph
                      value={ts}
                      x={tsx}
                      className="muzik-time-sig"
                      hoverRectClass=""
                    />
                  </g>
                );
              })()}

              {(() => {
                const beams = [];

                svgBeamGruplari.forEach((grup) => {
                  const grupOgeleri = (grup.indices || [])
                    .map((idx) => svgCizilecekOgeler[idx])
                    .filter((oge) => oge && oge.tip === 'nota');

                  if (grupOgeleri.length < 2) return;

                  const ayniSatirdakiOgeler = grupOgeleri.filter((oge) => {
                    const yer = svgYerlesimHaritasi.get(oge.id);
                    return yer && yer.satirIdx === satirIdx;
                  });

                  if (ayniSatirdakiOgeler.length < 2) return;

                  const notes = ayniSatirdakiOgeler.map((oge) => {
                    const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
                    const beamCount = Number.isFinite(sure?.bayrak) ? sure.bayrak : 0;

                    return {
                      ...oge,
                      id: oge.id,
                      x: ogeXHesapla(oge.id),
                      y: notaGorselYHesapla(oge, mevcutAnahtar),
                      beamCount,
                    };
                  });

                  beams.push(
                    <BeamGroup
                      key={`${grup.id}-satir-${satirIdx}`}
                      notes={notes}
                    />
                  );
                });

                return beams;
              })()}
              {/* Tuplet brackets */}
              {Array.isArray(muzikTupletler) && muzikTupletler.length > 0 && (() => {
                const brackets = [];
                muzikTupletler.forEach((tuplet) => {
                  const ids = Array.isArray(tuplet.notaIdler) ? tuplet.notaIdler.filter(Boolean) : [];
                  if (ids.length < 2) return;
                  const satirNotalar = ids.map((id) => {
                    const yer = svgYerlesimHaritasi?.get?.(id);
                    if (!yer || yer.satirIdx !== satirIdx) return null;
                    const nx = ogeXHesapla(id);
                    const no = svgCizilecekOgeler.find((o) => o?.id === id);
                    const ny = no ? notaGorselYHesapla(no, mevcutAnahtar) : 88;
                    return { id, x: nx, y: ny };
                  }).filter(Boolean);
                  if (satirNotalar.length < 2) return;
                  const xs = satirNotalar.map((n) => n.x);
                  const ys = satirNotalar.map((n) => n.y);
                  const x1 = Math.min(...xs) - 6;
                  const x2 = Math.max(...xs) + 6;
                  const midX = (x1 + x2) / 2;
                  const minY = Math.min(...ys);
                  // Bracket en yüksek notanın 26px üstüne, en fazla y=42'ye
                  const bracketY = Math.min(minY - 26, 42);
                  const hookH = 12;   // dikey uç çizgisi yüksekliği
                  const numGap = 9;   // sayı etrafında boşluk
                  const num = String(tuplet.ratio?.played ?? '');
                  const numGlyph = TUPLET_RAKAM_GLYPH(num);
                  const tupletAd = (() => {
                    const kayitAd = String(tuplet.kayit?.ad || '').split('(')[0].trim();
                    return kayitAd || TUPLET_TURKCE_AD[Number(num)] || `${num}'li grup`;
                  })();
                  const isHover = hoverTupletId === tuplet.id;
                  const color = isHover ? '#6d28d9' : '#7c3aed';
                  const sw = isHover ? 2.2 : 1.6;
                  brackets.push(
                    <g
                      key={`tuplet-${tuplet.id}-satir-${satirIdx}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${tupletAd} — kaldırmak için tıkla`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoverTupletId(tuplet.id)}
                      onMouseLeave={() => setHoverTupletId((prev) => prev === tuplet.id ? null : prev)}
                      onFocus={() => setHoverTupletId(tuplet.id)}
                      onBlur={() => setHoverTupletId((prev) => prev === tuplet.id ? null : prev)}
                      onClick={(e) => { e.stopPropagation(); tupletSil?.(tuplet.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Delete') { e.preventDefault(); tupletSil?.(tuplet.id); } }}
                    >
                      {/* Tıklama alanı — görünmez arka plan rect */}
                      <rect
                        x={x1 - 6} y={bracketY - 14}
                        width={x2 - x1 + 12} height={hookH + 20}
                        fill={isHover ? 'rgba(109,40,217,0.08)' : 'transparent'}
                        stroke={isHover ? color : 'transparent'}
                        strokeWidth={isHover ? 1 : 0}
                        rx={4}
                      />
                      {/* Sol düşey uç */}
                      <line x1={x1} y1={bracketY} x2={x1} y2={bracketY + hookH} stroke={color} strokeWidth={sw} strokeLinecap="round" />
                      {/* Sol yatay kol */}
                      <line x1={x1} y1={bracketY} x2={midX - numGap} y2={bracketY} stroke={color} strokeWidth={sw} strokeLinecap="round" />
                      {/* Sağ yatay kol */}
                      <line x1={midX + numGap} y1={bracketY} x2={x2} y2={bracketY} stroke={color} strokeWidth={sw} strokeLinecap="round" />
                      {/* Sağ düşey uç */}
                      <line x1={x2} y1={bracketY} x2={x2} y2={bracketY + hookH} stroke={color} strokeWidth={sw} strokeLinecap="round" />
                      {/* Sayı — SMuFL Bravura tuplet rakam glyph'i (porte üstü engraving standardı) */}
                      <text
                        x={midX} y={bracketY + 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: 18, fontFamily: "'Bravura Text', 'Bravura', serif", fill: color }}
                      >
                        {numGlyph}
                      </text>
                      {/* Hover: silme göstergesi */}
                      {isHover && (
                        <text
                          x={x2 + 8} y={bracketY + 2}
                          textAnchor="middle" dominantBaseline="middle"
                          style={{ fontSize: 11, fontFamily: 'sans-serif', fill: '#dc2626', fontWeight: 'bold' }}
                        >
                          ✕
                        </text>
                      )}
                    </g>
                  );
                });
                return brackets;
              })()}

              {satir.map((oge, itemIndex) => {
                const x = ogeXHesapla(oge.id);
                const secili = oge.id === seciliOgeId;
                const cokluSecili = cokluSecimSet.has(oge.id);
                if (oge.tip === 'nota') {
                  const brailleHoverAktif = hoverBrailleOgeId === oge.id;
                  const gruptaMi = (() => {
                    if (typeof satirIcindeBeamliMi !== 'function') return false;

                    const globalIdx = svgGlobalIndexBul(oge.id);
                    if (globalIdx < 0) return false;

                    const grup = svgBeamGruplari.find((g) => (
                      Array.isArray(g.indices) && g.indices.includes(globalIdx)
                    ));

                    if (!grup) return false;

                    const ayniSatirdakiNotaSayisi = grup.indices
                      .map((idx) => svgCizilecekOgeler[idx])
                      .filter((item) => item && item.tip === 'nota')
                      .filter((item) => {
                        const yer = svgYerlesimHaritasi.get(item.id);
                        return yer && yer.satirIdx === satirIdx;
                      })
                      .length;

                    return ayniSatirdakiNotaSayisi >= 2;
                  })();
                  const noteY = notaGorselYHesapla(oge, mevcutAnahtar);
                  const clampEdildi = notaGorselYClampEdildiMi(oge, mevcutAnahtar);
                  const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
                  const bayrak = Number.isFinite(sure?.bayrak) ? sure.bayrak : 0;
                  // Süsleme (tril/turn/mordan) Y'si: kirişli grupta kirişin YÖNÜne göre.
                  // BeamGroup mantığı (orta çizgi 88): üstte çoğunluk → sap-AŞAĞI (kiriş ALTTA) →
                  // süsleme en yüksek nota kafasının üstünde; altta çoğunluk → sap-YUKARI (kiriş
                  // ÜSTTE, ≈highestNoteY−34) → süsleme onun ~6px üstünde. Böylece NE kirişe biner
                  // NE de abartılı yukarıda kalır (kullanıcı: "abartılı yukarıda kaldılar").
                  const grupSusGy = (() => {
                    if (!gruptaMi || typeof svgGlobalIndexBul !== 'function') return null;
                    const gi = svgGlobalIndexBul(oge.id);
                    const grup = svgBeamGruplari.find((g) => Array.isArray(g.indices) && g.indices.includes(gi));
                    if (!grup) return null;
                    const ys = grup.indices.map((idx) => svgCizilecekOgeler[idx])
                      .filter((it) => it && it.tip === 'nota')
                      .map((it) => notaGorselYHesapla(it, mevcutAnahtar))
                      .filter(Number.isFinite);
                    if (!ys.length) return null;
                    const enYuksek = Math.min(...ys);
                    let ust = 0, alt = 0;
                    ys.forEach((y) => { if (y < 88) ust += 1; else if (y > 88) alt += 1; });
                    const dir = ust > alt ? 'down' : alt > ust ? 'up'
                      : (ys.reduce((a, b) => a + b, 0) / ys.length <= 88 ? 'down' : 'up');
                    return dir === 'up' ? (enYuksek - 40) : (enYuksek - 16);
                  })();
                  // GRACE BEAM: ardışık 2+ apejetür (grace) notası PDF'te BİRLİKTE kirişlenir
                  // (kullanıcı: "apajur notalar birleştirilmiyor, ayrık duruyor"). Aynı satırdaki
                  // ardışık grace dizisini bul → hepsi bayraksız çizilir, ilk grace küçük kirişi çizer.
                  const graceRunBilgi = (() => {
                    if (!notaGraceMi(oge) || typeof svgGlobalIndexBul !== 'function') return null;
                    const gi = svgGlobalIndexBul(oge.id);
                    if (gi < 0) return null;
                    const ayniSatir = (o) => {
                      const yer = svgYerlesimHaritasi.get(o?.id);
                      return yer && yer.satirIdx === satirIdx;
                    };
                    const graceKomsu = (o) => o && o.tip === 'nota' && notaGraceMi(o) && ayniSatir(o);
                    const run = [{ oge, idx: gi }];
                    for (let i = gi - 1; i >= 0 && graceKomsu(svgCizilecekOgeler[i]); i -= 1) run.unshift({ oge: svgCizilecekOgeler[i], idx: i });
                    for (let i = gi + 1; i < svgCizilecekOgeler.length && graceKomsu(svgCizilecekOgeler[i]); i += 1) run.push({ oge: svgCizilecekOgeler[i], idx: i });
                    if (run.length < 2) return null;
                    return { run, isFirst: run[0].oge.id === oge.id };
                  })();
                  const playbackAktif = playbackOgeId === oge.id;
                  const noteHoverAktif = hoverBrailleOgeId === oge.id || playbackAktif;
                  const noteSeciliAktif = secili || cokluSecili || playbackAktif;
                  const overlayWidth = 22;
                  const overlayHeight = 44;
                  const overlayX = x - overlayWidth / 2;
                  const overlayY = noteY - overlayHeight / 2;
                  // Erisilebilirlik: notanin Turkce sozel adi (perde + oktav + sure + nokta + ariza)
                  const _sureAdlari = ['8lik', '4lük', '2lik', '1lik', '16lık', '32lik', '64lük'];
                  const _arizaAdlari = { sharp: 'diyez', diyez: 'diyez', flat: 'bemol', bemol: 'bemol', natural: 'naturel', naturel: 'naturel', doubleSharp: 'çift diyez', doubleFlat: 'çift bemol' };
                  const notaErisimEtiketi = [
                    oge.notaAd || oge.ad || 'nota',
                    _arizaAdlari[oge.accidental] || '',
                    Number.isFinite(Number(oge.oktav)) ? `${oge.oktav}. oktav` : '',
                    _sureAdlari[oge.sureIndeksi ?? 0] || '',
                    oge.dotted ? 'noktalı' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <g
                      key={oge.id}
                      data-oge-id={oge._repeatCopy ? undefined : oge.id}
                      data-nav="nota"
                      data-measure={svgYerlesimHaritasi?.get?.(oge.id)?.measureIndex ?? undefined}
                      role={oge._repeatCopy ? undefined : 'button'}
                      tabIndex={oge._repeatCopy ? undefined : 0}
                      aria-label={oge._repeatCopy ? undefined : `Nota: ${notaErisimEtiketi}`}
                      pointerEvents={oge._repeatCopy ? 'none' : 'all'}
                      style={{
                        pointerEvents: oge._repeatCopy ? 'none' : 'all',
                        cursor: oge._repeatCopy ? 'default' : 'pointer',
                        opacity: 1,
                      }}
                      className={[
                        'muzik-skor-ogesi',
                        oge._repeatCopy ? 'muzik-repeat-kopya' : '',
                        secili ? 'secili' : '',
                        brailleHoverAktif ? 'muzik-nota-braille-hover' : '',
                      ].filter(Boolean).join(' ')}
                      onMouseEnter={oge._repeatCopy ? undefined : () => {
                        setHoverBrailleOgeId(oge.id);
                        setHoverBrailleBagId?.(null);
                        setHoverCizgiBagId?.(null);
                        // Modifier hover state'ini temizle ki ana nota hover'ında
                        // aksidental/nokta cell'leri yanlışlıkla highlight olmasın.
                        setHoverModifier(null);
                        if (notaOdakPiyano) playNote(oge, { keySignatureAccidentals: headerKeySignatureAccidentals });
                      }}
                      onMouseLeave={oge._repeatCopy ? undefined : () => setHoverBrailleOgeId(null)}
                      onFocus={oge._repeatCopy ? undefined : () => {
                        // Klavye/ekran okuyucu odağı: aria-label zaten okunur; ayar açıksa piyanodan da çal.
                        // Odak = imleç: düzenleme modunda nota buraya eklensin diye seç.
                        setHoverBrailleOgeId(oge.id);
                        setSeciliOgeId?.(oge.id);
                        if (notaOdakPiyano) playNote(oge, { keySignatureAccidentals: headerKeySignatureAccidentals });
                      }}
                      onBlur={oge._repeatCopy ? undefined : () => setHoverBrailleOgeId((p) => (p === oge.id ? null : p))}
                      onClick={oge._repeatCopy ? undefined : (e) => {
                        e.stopPropagation();

                        if (clickTimerRef.current) {
                          window.clearTimeout(clickTimerRef.current);
                          clickTimerRef.current = null;
                        }

                        clickTimerRef.current = window.setTimeout(() => {
                          setSeciliBagId?.(null);
                          notaTiklandi(oge, e);
                          clickTimerRef.current = null;
                        }, 180);
                      }}
                      onDoubleClick={oge._repeatCopy ? undefined : (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (clickTimerRef.current) {
                          window.clearTimeout(clickTimerRef.current);
                          clickTimerRef.current = null;
                        }

                        setSeciliBagId?.(null);
                        notaSuresiniCiftTiklaDegistir?.(oge, e);
                      }}
                      onKeyDown={oge._repeatCopy ? undefined : (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          notaTiklandi(oge, e);
                        }
                      }}
                    >
                      {ledgerCizgileri(x, noteY, mevcutAnahtar, { maxLines: 5 })}
                      {(() => {
                        // Modifier hover/select aktifse, ana nota çerçevesi gizlenir
                        // (çift çerçeveyi önle — sadece modifier kendi çerçevesini gösterir).
                        const modifierAktif = hoverModifier?.ogeId === oge.id
                          || modifierEditMenu?.ogeId === oge.id;
                        const showFrame = (noteSeciliAktif || noteHoverAktif) && !modifierAktif;
                        return (
                          <rect
                            x={overlayX}
                            y={overlayY}
                            width={overlayWidth}
                            height={overlayHeight}
                            rx={6}
                            ry={6}
                            pointerEvents="all"
                            fill={
                              !showFrame ? 'transparent'
                              : noteSeciliAktif ? 'rgba(59,130,246,0.18)'
                              : 'rgba(59,130,246,0.10)'
                            }
                            stroke={showFrame ? '#3b82f6' : 'none'}
                            strokeWidth={!showFrame ? 0 : noteSeciliAktif ? 1.8 : 1.4}
                            strokeDasharray={showFrame && !noteSeciliAktif ? '4 3' : undefined}
                            style={{ pointerEvents: 'all', cursor: 'pointer' }}
                          />
                        );
                      })()}
                      {(() => {
                        const graceMi = notaGraceMi(oge);
                        // Grace dizisindeyse bayrak çizme (grouped=true) — kiriş elle çizilir.
                        const inRun = graceMi && graceRunBilgi != null;
                        const glyph = (
                          <MusicNoteGlyph
                            item={oge}
                            x={x}
                            y={noteY}
                            sure={sure}
                            grouped={graceMi ? inRun : gruptaMi}
                            beamCount={bayrak}
                            glyphScaleY={glyphScaleY}
                          />
                        );
                        // Grace (apejetür) notası ~%60 ölçekle, kendi konumu (x,noteY) etrafında küçült.
                        if (!graceMi) return glyph;
                        return (
                          <>
                            <g transform={`translate(${x} ${noteY}) scale(0.6) translate(${-x} ${-noteY})`}>
                              {glyph}
                            </g>
                            {/* Grace run kirişi: ilk grace, dizinin küçük sap+ince kirişini çizer. */}
                            {graceRunBilgi?.isFirst && (() => {
                              const pts = graceRunBilgi.run.map(({ oge: o }) => ({
                                x: ogeXHesapla(o.id),
                                y: notaGorselYHesapla(o, mevcutAnahtar),
                              }));
                              const stemDx = 3.4;                                  // 0.6 × nota kafası yarı-genişlik
                              const beamY = Math.min(...pts.map((p) => p.y)) - 17; // 0.6 × ~28 sap (yukarı)
                              return (
                                <g aria-hidden="true">
                                  {pts.map((p, k) => (
                                    <line key={`gstem-${oge.id}-${k}`} x1={p.x + stemDx} y1={p.y} x2={p.x + stemDx} y2={beamY}
                                      className="stroke-zinc-900" strokeWidth={1} strokeLinecap="round" />
                                  ))}
                                  <line x1={pts[0].x + stemDx} y1={beamY} x2={pts[pts.length - 1].x + stemDx} y2={beamY}
                                    className="stroke-zinc-900" strokeWidth={3} strokeLinecap="butt" />
                                </g>
                              );
                            })()}
                          </>
                        );
                      })()}
                      {/* Aksidental (♯ ♭ ♮) — ayrı seçilebilir */}
                      {oge.accidental && (() => {
                        const accHoverAktif = hoverModifier?.ogeId === oge.id
                          && hoverModifier?.type === 'accidental';
                        const accSeciliAktif = modifierEditMenu?.ogeId === oge.id
                          && modifierEditMenu?.type === 'accidental';
                        return (
                          <g
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setHoverModifier({ ogeId: oge.id, type: 'accidental' });
                            }}
                            onMouseLeave={() => {
                              setHoverModifier((prev) => (
                                prev?.ogeId === oge.id && prev?.type === 'accidental' ? null : prev
                              ));
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSeciliOgeId?.(oge.id);
                              setModifierEditMenu({
                                x: e.clientX,
                                y: e.clientY,
                                ogeId: oge.id,
                                type: 'accidental',
                                accidentalAd: oge.accidental,
                              });
                            }}
                          >
                            <rect
                              x={x - 30}
                              y={noteY - 13}
                              width={20}
                              height={26}
                              rx={5}
                              fill={
                                accSeciliAktif ? 'rgba(59,130,246,0.18)'
                                : accHoverAktif ? 'rgba(59,130,246,0.10)'
                                : 'transparent'
                              }
                              stroke={accHoverAktif || accSeciliAktif ? '#3b82f6' : 'transparent'}
                              strokeWidth={accSeciliAktif ? 1.8 : accHoverAktif ? 1.4 : 0}
                              strokeDasharray={accHoverAktif && !accSeciliAktif ? '4 3' : undefined}
                              pointerEvents="all"
                            />
                          </g>
                        );
                      })()}
                      {/* Nokta (·) — ayrı seçilebilir */}
                      {oge.dotted && (() => {
                        const dotHoverAktif = hoverModifier?.ogeId === oge.id
                          && hoverModifier?.type === 'dot';
                        const dotSeciliAktif = modifierEditMenu?.ogeId === oge.id
                          && modifierEditMenu?.type === 'dot';
                        return (
                          <g
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setHoverModifier({ ogeId: oge.id, type: 'dot' });
                            }}
                            onMouseLeave={() => {
                              setHoverModifier((prev) => (
                                prev?.ogeId === oge.id && prev?.type === 'dot' ? null : prev
                              ));
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSeciliOgeId?.(oge.id);
                              setModifierEditMenu({
                                x: e.clientX,
                                y: e.clientY,
                                ogeId: oge.id,
                                type: 'dot',
                              });
                            }}
                          >
                            <rect
                              x={x + 11}
                              y={noteY - 9}
                              width={14}
                              height={18}
                              rx={4}
                              fill={
                                dotSeciliAktif ? 'rgba(59,130,246,0.18)'
                                : dotHoverAktif ? 'rgba(59,130,246,0.10)'
                                : 'transparent'
                              }
                              stroke={dotHoverAktif || dotSeciliAktif ? '#3b82f6' : 'transparent'}
                              strokeWidth={dotSeciliAktif ? 1.8 : dotHoverAktif ? 1.4 : 0}
                              strokeDasharray={dotHoverAktif && !dotSeciliAktif ? '4 3' : undefined}
                              pointerEvents="all"
                            />
                          </g>
                        );
                      })()}
                      {(() => {
                        const oncesiMods = Array.isArray(oge.modifiers?.oncesi) ? oge.modifiers.oncesi : [];
                        const sonrasiMods = Array.isArray(oge.modifiers?.sonrasi) ? oge.modifiers.sonrasi : [];
                        if (oncesiMods.length === 0 && sonrasiMods.length === 0) return null;

                        // Çizim yok — yüklü SMuFL (Bravura Text) font glyph'leri kullanılır.
                        // Süslemeler nota üstünde/solunda; dinamikler porte ALTINDA; nüanslar notaheadin üstünde.
                        // Her işaret ayrı seçilebilir/silinebilir (hover + tıklama).
                        let graceX = 0;          // grace notalar (appoggiatura) sola dizilir
                        let ustX = 0;            // nota üstü süslemeler yatayda dizilir
                        let dinX = 0;            // porte altı dinamikler yatayda dizilir
                        let nuansX = 0;          // nüanslar notahead üstünde yatayda dizilir

                        // Bu nota üzerindeki dinamik modifier sayısı (yatay ortalama için)
                        const dinamikSayisi = oncesiMods.filter((m) => dinamikModifierMi(m.kayit)).length;
                        let dinIndex = 0;

                        const modifierAc = (m, e, type, yon = 'oncesi') => {
                          e.stopPropagation();
                          setModifierEditMenu({
                            x: e.clientX,
                            y: e.clientY,
                            ogeId: oge.id,
                            type,
                            modId: m.id,
                            yon,
                            ad: type === 'dinamik' ? dinamikEtiketAl(m.kayit) : (m.kayit?.ad || ''),
                            etiket: m.kayit?.ad || '',
                          });
                        };

                        // Tek bir modifier element'i çizer (oncesi veya sonrasi).
                        const modifierEl = (m, mi, gx, gy, type, isim, className, yon = 'oncesi') => {
                          const ad = String(m.kayit?.ad || '');
                          const eslesir = (h) => h?.ogeId === oge.id && h?.type === type
                            && (h?.modId ? h.modId === m.id
                              : String(h?.etiket || '').toLowerCase() === ad.toLowerCase());
                          const modHover = eslesir(hoverModifier);
                          const modSecili = eslesir(modifierEditMenu);
                          const vurguRenk = type === 'dinamik' ? '37,99,235' : type === 'nuans' ? '5,150,105' : '124,58,237';
                          const vurguHex  = type === 'dinamik' ? '#2563eb'   : type === 'nuans' ? '#059669'   : '#7c3aed';
                          return (
                            <g
                              key={m.id || mi}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.stopPropagation(); setHoverModifier({ ogeId: oge.id, type, modId: m.id, etiket: ad }); }}
                              onMouseLeave={() => { setHoverModifier((prev) => (eslesir(prev) ? null : prev)); }}
                              onClick={(e) => modifierAc(m, e, type, yon)}
                            >
                              <rect x={gx - 12} y={gy - 20} width={24} height={28} rx={5}
                                fill={modSecili ? `rgba(${vurguRenk},0.18)` : modHover ? `rgba(${vurguRenk},0.10)` : 'transparent'}
                                stroke={modHover || modSecili ? vurguHex : 'transparent'}
                                strokeWidth={modSecili ? 1.8 : modHover ? 1.4 : 0}
                                strokeDasharray={modHover && !modSecili ? '4 3' : undefined}
                                pointerEvents="all"
                              />
                              {(() => {
                                const txt = <text x={gx} y={gy} textAnchor="middle" className={className}>{isim}</text>;
                                const cp = String(isim || '').codePointAt(0);
                                // SMuFL hairpin glyph'i (U+E53E/E53F) DEVASA bbox'lu (~88px) → porte
                                // İÇİNE taşıp nota üstüne biniyor (kullanıcı: Weber "nota altında kalmış").
                                // %38 ölçekle (gx,gy çapa) → porte altında küçük kreşendo işareti kalır.
                                if (cp !== 0xE53E && cp !== 0xE53F) return txt;
                                return (
                                  <g transform={`translate(${gx} ${gy}) scale(0.38) translate(${-gx} ${-gy})`}>{txt}</g>
                                );
                              })()}
                            </g>
                          );
                        };

                        return (
                          <g>
                            {oncesiMods.map((m, mi) => {
                              const ad = String(m.kayit?.ad || '');
                              // Apejetür (grace) modifier'ı AYRI glyph çizilmez — nota zaten küçük
                              // grace notası olarak çiziliyor (yoksa çift görünür).
                              if (/apejet[üu]r|appoggiatura|acciaccatura/i.test(ad)) return null;
                              const dinamik = dinamikModifierMi(m.kayit);
                              const nuans   = !dinamik && nuansModifierMi(m.kayit);
                              const type    = dinamik ? 'dinamik' : nuans ? 'nuans' : 'susleme';

                              let isim;
                              let grace = false;
                              if (dinamik) {
                                // Harf dinamiği (p/mf/ff…) → SMuFL glyph; keskin kreşendo/dekreşendo
                                // → hairpin İKONU (U+E53E '<' / U+E53F '>'); kalanlar italik metin.
                                const dglif = dinamikSmuflGlyph(m.kayit?.sembol) || dinamikHairpinGlyph(ad);
                                isim = dglif || dinamikEtiketAl(m.kayit);
                              } else if (nuans) {
                                isim = nuansSmuflGlyph(ad) || m.kayit?.sembol || ad.split(' ')[0].split('(')[0].trim();
                              } else {
                                const glif = suslemeSmuflGlyph(ad);
                                isim = glif || m.kayit?.sembol || '';
                                grace = suslemeGraceMi(ad);
                              }
                              if (!isim) return null;

                              let gx, gy, cls;
                              if (dinamik) {
                                gx = x - ((dinamikSayisi - 1) * 9) + dinX;
                                gy = SCORE_STAFF_BOTTOM_Y + 16;
                                dinX += 18;
                                dinIndex += 1;
                                cls = 'muzik-dynamic';
                              } else if (nuans) {
                                // Üst porte çizgisinin üstünde, nota pozisyonuna göre yaklaştırılmış.
                                // min(noteY-18, topStaff-8): porte içine girmez, yüksek notalar için daha yakın.
                                gx = x + nuansX;
                                gy = Math.min(noteY - 18, SCORE_STAFF_TOP_Y - 8);
                                nuansX += 16;
                                cls = 'muzik-nuans-glyph';
                              } else if (grace) {
                                gx = x - 16 - graceX;
                                gy = noteY;
                                graceX += 14;
                                cls = 'muzik-grace-note';
                              } else {
                                gx = x - ((oncesiMods.length - 1) * 7) + ustX;
                                // Süsleme (tril/turn/mordan) porte ÜSTÜnde. Sabit y=52 kirişli notalarda
                                // (özellikle düşük nota → sap-yukarı → kiriş notanın ÜSTÜnde) kirişe biniyordu
                                // (kullanıcı: "ikincisi grup çizgisinin üzerine gelmiş"). Kirişli notada
                                // süslemeyi kirişin de üstüne al (kiriş ~y39-51); kirişsizde notaya yakın tut.
                                gy = (grupSusGy != null)
                                  ? Math.max(-12, Math.min(52, grupSusGy))
                                  : Math.min(52, noteY - 16);
                                ustX += 14;
                                cls = 'muzik-ornament-glyph';
                              }

                              return modifierEl(m, mi, gx, gy, type, isim, cls);
                            })}

                            {sonrasiMods.map((m, mi) => {
                              const ad  = String(m.kayit?.ad || '');
                              const type = 'nuans';
                              const isim = nuansSmuflGlyph(ad) || m.kayit?.sembol || ad.split('(')[0].trim();
                              if (!isim) return null;

                              const fermataMi = /fermata/i.test(ad);
                              const nefesMi   = /nefes|caesura/i.test(ad);
                              let gx, gy;
                              if (nefesMi) {
                                // Notanın sağında, üst çizgi hizasında
                                gx = x + 18;
                                gy = SCORE_STAFF_TOP_Y - 2;
                              } else {
                                // Fermata ve diğerleri: üst porte çizgisi üstünde, notaya yakın
                                gx = x;
                                gy = Math.min(noteY - 22, SCORE_STAFF_TOP_Y - 12);
                              }

                              return modifierEl(m, `s${mi}`, gx, gy, type, isim, 'muzik-ornament-glyph', 'sonrasi');
                            })}
                          </g>
                        );
                      })()}
                    </g>
                  );
                }
                if (oge.tip === 'sus') {
                  const susSecili = oge.id === seciliOgeId || cokluSecili;
                  const susHoverAktif = hoverBrailleOgeId === oge.id || playbackOgeId === oge.id;
                  const _susSureAdlari = ['8lik', '4lük', '2lik', '1lik', '16lık', '32lik', '64lük'];
                  const susErisimEtiketi = `Sus: ${_susSureAdlari[oge.sureIndeksi ?? 0] || ''}${oge.dotted ? ' noktalı' : ''}${oge.autoRest || oge.otomatik ? ' (otomatik)' : ''}`;
                  const susEtkilesimli = !(oge._repeatCopy || oge.autoRest || oge.otomatik);
                  return (
                    <g
                      key={oge.id}
                      data-oge-id={susEtkilesimli ? oge.id : undefined}
                      data-nav={susEtkilesimli ? 'sus' : undefined}
                      data-measure={susEtkilesimli ? (svgYerlesimHaritasi?.get?.(oge.id)?.measureIndex ?? undefined) : undefined}
                      role={susEtkilesimli ? 'button' : 'img'}
                      tabIndex={susEtkilesimli ? 0 : undefined}
                      aria-label={susErisimEtiketi}
                      onFocus={susEtkilesimli ? () => {
                        setHoverBrailleOgeId(oge.id);
                        setSeciliOgeId?.(oge.id);
                      } : undefined}
                      onBlur={susEtkilesimli ? () => setHoverBrailleOgeId((p) => (p === oge.id ? null : p)) : undefined}
                      onKeyDown={susEtkilesimli ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); notaTiklandi(oge, e); }
                      } : undefined}
                      opacity={oge.autoRest || oge.otomatik ? 0.48 : 1}
                      pointerEvents={oge._repeatCopy || oge.autoRest || oge.otomatik ? 'none' : 'auto'}
                      onMouseEnter={() => {
                        if (!(oge.autoRest || oge.otomatik)) {
                          setHoverBrailleOgeId(oge.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!(oge.autoRest || oge.otomatik)) {
                          setHoverBrailleOgeId((prev) => (prev === oge.id ? null : prev));
                        }
                      }}
                    >
                      {!oge.autoRest && !oge.otomatik && (
                        <rect
                          x={x - 13}
                          y={72}
                          width={26}
                          height={48}
                          rx={6}
                          fill={
                            susSecili ? 'rgba(59,130,246,0.18)'
                            : susHoverAktif ? 'rgba(59,130,246,0.10)'
                            : 'transparent'
                          }
                          stroke={susSecili || susHoverAktif ? '#3b82f6' : 'transparent'}
                          strokeWidth={susSecili ? 1.8 : susHoverAktif ? 1.4 : 0}
                          strokeDasharray={susHoverAktif && !susSecili ? '4 3' : undefined}
                        />
                      )}
                      <RestGlyph
                        item={oge}
                        x={x}
                        onClick={oge.autoRest || oge.otomatik ? undefined : (e) => notaTiklandi(oge, e)}
                        autoRest={oge.autoRest || oge.otomatik}
                      />
                    </g>
                  );
                }
                {
                  const isInlineChange = oge.tip === 'timeSignatureChange' || oge.tip === 'keySignatureChange';
                  const isGenericPopupTarget = !isInlineChange
                    && (!['barline', 'sectionalBarline', 'finalBarline', 'beginRepeat', 'endRepeat'].includes(oge.tip));

                  // inline change item (timeSignatureChange / keySignatureChange) tıklandığında
                  // barlineTiklandi ile açılır; modal hem değişiklik hem silme sunar.
                  const inlineClickHandler = isInlineChange ? (e) => {
                    e.stopPropagation();
                    setSeciliBagId?.(null);
                    if (typeof barlineTiklandi === 'function') {
                      const synthOge = { id: oge.inlineSource?.barlineId || oge.id };
                      const synthYerlesim = {
                        measureIndex: oge.inlineSource?.measureIndex ?? null,
                      };
                      barlineTiklandi(synthOge, e, synthYerlesim, {
                        inlineDeleteId: oge.id,
                        inlineType: oge.tip,
                        insertAfterId: oge.inlineSource?.insertAfterId || oge.id,
                      });
                    }
                  } : null;

                  const popupClickProps = isInlineChange ? {
                    role: 'button',
                    tabIndex: 0,
                    style: { cursor: 'pointer' },
                    onClick: inlineClickHandler,
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inlineClickHandler?.(e);
                      }
                    },
                  } : isGenericPopupTarget ? {
                    role: 'button',
                    tabIndex: 0,
                    onClick: (e) => {
                      e.stopPropagation();
                      setSeciliBagId?.(null);
                      notaTiklandi(oge, e);
                    },
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        notaTiklandi(oge, e);
                      }
                    },
                  } : {};

                  return (
                    <g key={oge.id} className={`muzik-skor-ogesi${secili ? ' secili' : ''}`} aria-label={oge.ad} {...popupClickProps}>
                      {oge.tip === 'timeSignatureChange' ? (
                        renderInlineTimeSignature(oge, x)
                      ) : oge.tip === 'keySignatureChange' ? (
                        renderInlineKeySignature(oge, x)
                      ) : (
                        oge?.tip === 'barline'
                        || oge?.tip === 'sectionalBarline'
                        || oge?.tip === 'finalBarline'
                        || oge?.tip === 'beginRepeat'
                        || oge?.tip === 'endRepeat'
                        || oge?.tip === 'volta1'
                        || oge?.tip === 'volta2'
                        || (oge.hucreler && oge.hucreler.length && oge.hucreler[0].length === 0)
                      ) ? (
                        <g
                          role="button"
                          tabIndex={0}
                          className="muzik-barline-hit-area"
                          data-nav="barline"
                          data-oge-id={oge.id}
                          aria-label={(() => {
                            const m = svgYerlesimHaritasi?.get?.(oge.id)?.measureIndex;
                            const olcu = Number.isFinite(Number(m)) ? `${Number(m) + 1}. ölçü sonu — ` : '';
                            return `${olcu}${oge.ad || 'Ölçü çizgisi'}, değiştirmek için Enter`;
                          })()}
                          pointerEvents="all"
                          style={bekleyenModifier?.plasiyasyon === 'olcu-cizgisi' ? { cursor: 'crosshair' } : undefined}
                          onMouseEnter={() => setHoverBrailleOgeId?.(oge.id)}
                          onMouseLeave={() => setHoverBrailleOgeId?.((prev) => (prev === oge.id ? null : prev))}
                          onFocus={() => { setHoverBrailleOgeId?.(oge.id); setSeciliOgeId?.(oge.id); }}
                          onBlur={() => setHoverBrailleOgeId?.((prev) => (prev === oge.id ? null : prev))}
                          onClick={(e) => {
                            e.preventDefault?.();
                            e.stopPropagation?.();
                            if (typeof barlineTiklandi === 'function') {
                              barlineTiklandi(oge, e, svgYerlesimHaritasi.get(oge.id));
                            }
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && typeof barlineTiklandi === 'function') {
                              e.preventDefault();
                              e.stopPropagation?.();
                              barlineTiklandi(oge, e, svgYerlesimHaritasi.get(oge.id));
                            }
                          }}
                        >
                          {/* olcu-cizgisi modunda barline'lar daima hedef olarak vurgulanır */}
                          {bekleyenModifier?.plasiyasyon === 'olcu-cizgisi' && (
                            <rect
                              x={x - 10} y={SCORE_STAFF_TOP_Y - 4}
                              width={20} height={SCORE_STAFF_BOTTOM_Y - SCORE_STAFF_TOP_Y + 8}
                              rx={4}
                              fill={hoverBrailleOgeId === oge.id ? 'rgba(245,158,11,0.28)' : 'rgba(245,158,11,0.12)'}
                              stroke="#f59e0b"
                              strokeWidth={hoverBrailleOgeId === oge.id ? 2 : 1.2}
                              pointerEvents="none"
                            />
                          )}
                          {renderBarlineGlyph(oge, x, itemIndex, satir, satirOlculeri, satirSagX)}
                          {/* Barline üstü nüans modifier'ları (ölçü çizgisi üstü fermata vb.) */}
                          {Array.isArray(oge.modifiers) && oge.modifiers.map((mod, mi) => {
                            const glyph = nuansSmuflGlyph(mod?.kayit?.ad || '') || mod?.kayit?.sembol || mod?.kayit?.gorunum || '';
                            if (!glyph) return null;
                            return (
                              <text key={mod.id || mi}
                                x={x} y={SCORE_STAFF_TOP_Y - 10}
                                textAnchor="middle"
                                className="muzik-nuans-glyph"
                                style={{ pointerEvents: 'none' }}
                              >{glyph}</text>
                            );
                          })}
                        </g>
                      ) : oge.plasiyasyon === 'nota-arasi' || oge.plasiyasyon === 'olcu-cizgisi' ? (
                        // Nüans standalone elemanı (notalar arası / ölçü çizgisi üstü fermata)
                        <>
                          <rect
                            x={x - 14} y={SCORE_STAFF_TOP_Y - 24}
                            width={28} height={32} rx={5}
                            className="muzik-note-hover-rect"
                          />
                          <text
                            x={x} y={SCORE_STAFF_TOP_Y - 8}
                            textAnchor="middle"
                            className="muzik-nuans-glyph"
                          >{oge.gorunum || '𝄐'}</text>
                          {/* Küçük etiket */}
                          <text
                            x={x} y={SCORE_STAFF_TOP_Y + 4}
                            textAnchor="middle"
                            style={{ fontSize: 8, fill: '#059669', fontFamily: 'sans-serif', userSelect: 'none', pointerEvents: 'none' }}
                          >{oge.plasiyasyon === 'nota-arasi' ? 'n.arası' : 'ö.çizgi'}</text>
                        </>
                      ) : (
                        <>
                          <rect
                            x={x - 16}
                            y={76}
                            width={32}
                            height={44}
                            rx={8}
                            className="muzik-note-hover-rect"
                          />
                          <text x={x - 8} y="98" textAnchor="middle" className="muzik-symbol-text">{oge.gorunum || ''}</text>
                        </>
                      )}
                    </g>
                  );
                }
              })}

              {/* ── Ekleme modu aktifken tüm note/barline hit-area'ları pasif ── */}
              {(bekleyenModifier?.plasiyasyon === 'nota-arasi' || bekleyenModifier?.plasiyasyon === 'olcu-cizgisi') && (
                <rect
                  x={0} y={SVG_ROW_VIEWBOX_Y} width={800} height={340}
                  fill="transparent" pointerEvents="none"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* ── Nota arası ekleme noktaları (nota-arasi modu) ── */}
              {bekleyenModifier?.plasiyasyon === 'nota-arasi' && (() => {
                const glyph = bekleyenModifier.kayit
                  ? (nuansSmuflGlyph(bekleyenModifier.kayit.ad || '') || bekleyenModifier.kayit.sembol || bekleyenModifier.kayit.gorunum || '𝄐')
                  : '𝄐';
                const oynanabilir = satir.filter((o) => o.tip === 'nota' || o.tip === 'sus');
                return oynanabilir.slice(0, -1).map((oge, pairIdx) => {
                  const sonraki = oynanabilir[pairIdx + 1];
                  const x1 = ogeXHesapla(oge.id);
                  const x2 = ogeXHesapla(sonraki.id);
                  if (!Number.isFinite(x1) || !Number.isFinite(x2)) return null;
                  const mx = (x1 + x2) / 2;
                  const midY = (SCORE_STAFF_TOP_Y + SCORE_STAFF_BOTTOM_Y) / 2;
                  return (
                    <g key={`arasi-ins-${oge.id}-${sonraki.id}`} style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); typeof notaTiklandi === 'function' && notaTiklandi(oge, e); }}
                    >
                      <rect x={mx - 12} y={SCORE_STAFF_TOP_Y - 24} width={24} height={SCORE_STAFF_BOTTOM_Y - SCORE_STAFF_TOP_Y + 28}
                        rx={5} fill="rgba(245,158,11,0.13)" stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="4 2"
                        pointerEvents="all"
                      />
                      <text x={mx} y={SCORE_STAFF_TOP_Y - 8} textAnchor="middle"
                        style={{ fontFamily: "'Bravura Text','Cambria Math','Noto Music',serif", fontSize: 24, fill: '#f59e0b', opacity: 0.9, pointerEvents: 'none', userSelect: 'none' }}
                      >{glyph}</text>
                      <text x={mx} y={midY + 1} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: 13, fontWeight: 800, fill: '#f59e0b', pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
                      >+</text>
                    </g>
                  );
                });
              })()}

              {/* Measure number — dizenin ilk ölçüsü için sol anahtarının sol
                  üst köşesine yakın (clef'in üst sol kısmı yanında) */}
              {(() => {
                const olculer = muzikSatirOlculeri?.[satirIdx] || [];
                const ilk = olculer[0];
                if (!ilk) return null;
                const mIdx = ilk.measureIndex ?? ilk.index ?? 0;
                return (
                  <text key={`olcu-no-${mIdx}`}
                    x={SVG_CLEF_X - 14}
                    y={SVG_ROW_VIEWBOX_Y + 18}
                    style={{
                      fontSize: 18,
                      fill: '#64748b',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                    textAnchor="end"
                    aria-label={`${mIdx + 1}. ölçü başlangıcı`}>
                    {mIdx + 1}
                  </text>
                );
              })()}

              {/* Per-measure play buttons — yalnızca imlecin bulunduğu ölçüde görünür */}
              {(muzikSatirOlculeri?.[satirIdx] || []).map((measure, measureSira) => {
                const mx = (measure.startX ?? 0) + 14;
                const my = SVG_ROW_VIEWBOX_Y + 14;
                const mIdx = measure.measureIndex ?? measure.index ?? measureSira;
                if (hoverOlcuKey !== `${satirIdx}:${mIdx}`) return null;
                const handlePlayMeasure = (e) => {
                  e.stopPropagation();
                  if (typeof playMeasure === 'function') {
                    playMeasure(mIdx);
                  }
                };
                return (
                  <g key={`play-olcu-${mIdx}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${mIdx + 1}. ölçüyü çal`}
                    className="muzik-olcu-play-btn"
                    style={{ cursor: 'pointer' }}
                    onClick={handlePlayMeasure}
                  >
                    {/* Düz tek renk daire — gölgesiz, sade ikonik tasarım */}
                    <circle cx={mx} cy={my} r={11}
                      fill="#2563eb"
                      className="muzik-olcu-play-core"
                    />
                    {/* Play ikonu — sade üçgen */}
                    <path
                      d={`M ${mx - 3.2} ${my - 4.6} L ${mx + 5} ${my} L ${mx - 3.2} ${my + 4.6} Z`}
                      fill="white"
                      className="muzik-olcu-play-icon"
                      pointerEvents="none"
                    />
                  </g>
                );
              })}

              {/* ── Volta bracket segmentleri (çok-satır desteği) ─────────────── */}
              {(voltaBracketSegments.get(satirIdx) || []).map((seg) => {
                const bTop  = SCORE_STAFF_TOP_Y - 16;
                const bDown = SCORE_STAFF_TOP_Y - 1;

                let x1, x2, showLeft, showRight, showNum;
                if (seg.isSingleRow) {
                  x1 = seg.bracketStartX;
                  x2 = seg.bracketEndX;
                  showLeft  = true;
                  showRight = seg.closedRight;
                  showNum   = true;
                } else if (seg.isStartRow) {
                  x1 = seg.bracketStartX;
                  x2 = seg.rowRightX;
                  showLeft  = true;
                  showRight = false;
                  showNum   = true;
                } else if (seg.isEndRow) {
                  x1 = seg.contStartX;
                  x2 = seg.bracketEndX;
                  showLeft  = false;
                  showRight = seg.closedRight;
                  showNum   = false;
                } else {
                  // orta satır
                  x1 = seg.contStartX;
                  x2 = seg.rowRightX;
                  showLeft  = false;
                  showRight = false;
                  showNum   = false;
                }

                // Tıklanabilir geniş alan + hover frame. Portenin ÜZERİNDE kalır
                // — aksi halde nota tıklamalarını engellerdi.
                // hoverBrailleOgeId hem bracket'ten hem de braille hücresinden set edilir
                // → çift yönlü sync (braille hover → bracket frame, bracket hover → braille hl).
                const hoverAktif = hoverBrailleOgeId === seg.voltaOgeId;
                // Çerçeve porte üst kenarına yapışmasın — barline ile görsel
                // karışmayı önlemek için ~5px boşluk bırakılır.
                const cerceveTop    = SCORE_STAFF_TOP_Y - 24;
                const cerceveBottom = SCORE_STAFF_TOP_Y - 6;
                const cerceveH      = cerceveBottom - cerceveTop;
                const cerceveX      = x1 - 6;
                const cerceveW      = Math.max(20, x2 - x1 + 12);
                return (
                  <g
                    key={seg.key}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      if (voltaEkleModu) return;
                      setHoverBrailleOgeId?.(seg.voltaOgeId);
                    }}
                    onMouseLeave={() => {
                      setHoverBrailleOgeId?.((prev) => (prev === seg.voltaOgeId ? null : prev));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Volta ekleme modu açıksa, edit popup'ı açma
                      if (voltaEkleModu) return;
                      // Önceki seçimleri temizle ki barline/nota "seçili" görünmesin
                      setSeciliOgeId?.(null);
                      setSeciliBagId?.(null);
                      setPopupAcik?.(false);
                      setVoltaEditMenu({
                        x: e.clientX,
                        y: e.clientY,
                        voltaOgeId: seg.voltaOgeId,
                        voltaTip: seg.voltaTip,
                      });
                    }}
                  >
                    {/* Mavi hover seçim çerçevesi — bracket + portenin üzerinde */}
                    <rect
                      x={cerceveX}
                      y={cerceveTop}
                      width={cerceveW}
                      height={cerceveH}
                      rx={6}
                      fill={hoverAktif ? 'rgba(59,130,246,0.10)' : 'transparent'}
                      stroke={hoverAktif ? '#3b82f6' : 'transparent'}
                      strokeWidth={hoverAktif ? 1.4 : 0}
                      strokeDasharray={hoverAktif ? '4 3' : undefined}
                      pointerEvents="all"
                    />
                    <line x1={x1} y1={bTop} x2={x2} y2={bTop}
                      stroke="#111827" strokeWidth={1.4} strokeLinecap="square"
                      pointerEvents="none" />
                    {showLeft && (
                      <line x1={x1} y1={bTop} x2={x1} y2={bDown}
                        stroke="#111827" strokeWidth={1.4} strokeLinecap="square"
                        pointerEvents="none" />
                    )}
                    {showRight && (
                      <line x1={x2} y1={bTop} x2={x2} y2={bDown}
                        stroke="#111827" strokeWidth={1.4} strokeLinecap="square"
                        pointerEvents="none" />
                    )}
                    {showNum && (
                      <text x={x1 + 5} y={bTop - 2}
                        fontSize="11" fontWeight="700"
                        fontFamily="Georgia, serif" fill={hoverAktif ? '#1e40af' : '#111827'}
                        dominantBaseline="auto" pointerEvents="none">
                        {seg.voltaTip === 'volta1' ? '1.' : '2.'}
                      </text>
                    )}
                  </g>
                );
              })}

              {svgBaglar.map((bag) => {
                const { basId, sonId } = bagCizimBasSonAl(bag);
                const basIdx = svgGlobalIndexBul(basId);
                const sonIdx = svgGlobalIndexBul(sonId);

                if (basIdx < 0 || sonIdx < 0) return null;

                const basOge = svgCizilecekOgeler[basIdx];
                const sonOge = svgCizilecekOgeler[sonIdx];
                if (!basOge || !sonOge) return null;

                const basYer = svgYerlesimHaritasi.get(basOge.id);
                const sonYer = svgYerlesimHaritasi.get(sonOge.id);
                if (!basYer || !sonYer) return null;

                if (basYer.satirIdx !== satirIdx && sonYer.satirIdx !== satirIdx) {
                  return null;
                }

                const bagTieMi = bag?.tip === 'tie' || bagTipiTieMi(bag);
                const type = bagTieMi ? 'tie' : 'slur';
                let direction = bagYonunuHesapla(basOge, sonOge, mevcutAnahtar);
                // "Üstten" yay aradaki nota/grace'i (kirişi yukarıda) KESİYORSA "alttan" bağla
                // (kullanıcı: "tie ile bağladığında çizimi kesmesin, kesecekse alttan bağlasın").
                if (direction === 'above' && basOge?.tip === 'nota' && sonOge?.tip === 'nota' && typeof ogeXHesapla === 'function') {
                  const bx = ogeXHesapla(basOge.id);
                  const ex = ogeXHesapla(sonOge.id);
                  const loX = Math.min(bx, ex);
                  const hiX = Math.max(bx, ex);
                  const ucTepe = Math.min(
                    notaGorselYHesapla(basOge, mevcutAnahtar),
                    notaGorselYHesapla(sonOge, mevcutAnahtar),
                  );
                  const kesiyor = svgCizilecekOgeler.some((o) => {
                    if (!o || o.tip !== 'nota' || o.id === basOge.id || o.id === sonOge.id) return false;
                    const yer = svgYerlesimHaritasi.get(o.id);
                    if (!yer || yer.satirIdx !== satirIdx) return false;
                    const ox = ogeXHesapla(o.id);
                    if (ox <= loX || ox >= hiX) return false;
                    // ara öğe uçlardan yüksek/eşit VEYA grace (kirişi yukarıda) → üstten yay keser
                    return notaGorselYHesapla(o, mevcutAnahtar) <= ucTepe + 2 || notaGraceMi(o);
                  });
                  if (kesiyor) direction = 'below';
                }
                const { start, end } = bagCizimNoktalari(
                  basOge,
                  sonOge,
                  basYer,
                  sonYer,
                  satirIdx,
                  ogeXHesapla,
                  mevcutAnahtar,
                  { visualClamp: true },
                );
                const hitRect = bagHitRectHesapla(start, end, direction);
                const bagHoverAktif =
                  bagIdEslesiyorMu(bag, hoverCizgiBagId) ||
                  bagIdEslesiyorMu(bag, hoverBrailleBagId);
                const bagSeciliAktif = bagIdEslesiyorMu(bag, seciliBagId);
                const bagAktif = bagHoverAktif || bagSeciliAktif;
                const bagGroupClasses = ['muzik-bag-grup', bagHoverAktif ? 'braille-hover' : '', bagSeciliAktif ? 'secili' : '']
                  .filter(Boolean)
                  .join(' ');
                const bagCurrentId = bagAktifId(bag);

                return (
                  <g
                    key={bag.id}
                    className={bagGroupClasses}
                    onMouseEnter={() => {
                      setHoverBrailleBagId?.(bagCurrentId);
                      setHoverCizgiBagId?.(bagCurrentId);
                      setHoverBrailleOgeId?.(null);
                    }}
                    onMouseLeave={() => {
                      setHoverBrailleBagId?.((prev) => (prev === bagCurrentId ? null : prev));
                      setHoverCizgiBagId?.((prev) => (prev === bagCurrentId ? null : prev));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSeciliBagId?.(bagCurrentId);
                      setSeciliOgeId?.(null);
                      setPopupAcik?.(false);
                      setBagEditMenu({
                        x: e.clientX,
                        y: e.clientY,
                        bagIds: Array.isArray(bag.mergedFrom) && bag.mergedFrom.length
                          ? bag.mergedFrom
                          : [bag.id],
                        tip: bagTieMi ? 'tie' : 'slur',
                      });
                    }}
                    role="button"
                    aria-label={`${bag.kayit?.ad || 'Bağ'} — seçmek için tıkla`}
                  >
                    <rect
                      x={hitRect.x}
                      y={hitRect.y}
                      width={hitRect.width}
                      height={hitRect.height}
                      rx={8}
                      fill={
                        bagSeciliAktif ? 'rgba(59,130,246,0.18)'
                        : bagHoverAktif ? 'rgba(59,130,246,0.10)'
                        : 'transparent'
                      }
                      stroke={bagHoverAktif || bagSeciliAktif ? '#3b82f6' : 'transparent'}
                      strokeWidth={bagSeciliAktif ? 1.8 : bagHoverAktif ? 1.4 : 0}
                      strokeDasharray={bagHoverAktif && !bagSeciliAktif ? '4 3' : undefined}
                      pointerEvents="all"
                      style={{ cursor: 'pointer' }}
                    />

                    <SlurTiePath
                      start={start}
                      end={end}
                      type={type}
                      direction={direction}
                      active={bagAktif}
                      selected={bagSeciliAktif}
                    />
                  </g>
                );
              })}

              {renderNotaEklemeKutulari(satirIdx)}

              {/* ── Volta ekleme modu: ölçü BAŞLARINDAKİ barline üzerine + düğmesi
                   - 1. ev ve 2. ev modunda da gösterilir
                   - 1. tık: bu ölçü voltanın başlangıç ölçüsü
                   - 2. tık: tıklanan barline voltanın bitiş çizgisi → bir ÖNCEKİ ölçü son ölçü
                   - z-order: en sonda çizilir → her şeyin üzerinde kalır
                   ─────────────────────────────────────────────────────────── */}
              {voltaEkleModu && (satirOlculeri || []).map((measure) => {
                const mIdx = measure.measureIndex ?? measure.index;
                const ref  = voltaMeasureRefMap.get(mIdx);
                if (!ref) return null;

                const SENTINEL = '__VOLT_START__';
                const isBaslangic = voltaEkleBaslangicId !== null && (
                  voltaEkleBaslangicId === ref.insertAfterId ||
                  (voltaEkleBaslangicId === SENTINEL && ref.insertAfterId === null)
                );
                const adimBekliyor = voltaEkleBaslangicId !== null;

                // 2. adımda kendi başlangıç barline'ımız üzerine bitiş butonu koyma
                if (adimBekliyor && isBaslangic) return null;

                // + butonu ölçü çizgisinin (barline) tam üzerinde, dikeyde porte ortasında
                const btnX = Number.isFinite(ref.startX) ? ref.startX : 0;
                const btnY = (SCORE_STAFF_TOP_Y + SCORE_STAFF_BOTTOM_Y) / 2;
                const btnR = 16;
                const renk = isBaslangic ? '#10b981' : (adimBekliyor ? '#f59e0b' : '#10b981');
                const voltaEtiket = voltaEkleModu?.tip === 'volta2' ? '2. ev' : '1. ev';
                const tooltip = isBaslangic
                  ? 'Başlangıç ölçüsü seçildi — bitiş barline\'ına tıkla (bir önceki ölçü son ölçü olur)'
                  : adimBekliyor
                    ? `${voltaEtiket} bu barline'da bitir (bir önceki ölçü voltanın SON ölçüsü olur)`
                    : `${voltaEtiket} burada başlasın`;

                return (
                  <g
                    key={`volta-plus-${mIdx}`}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (voltaEkleBaslangicId === null) {
                        voltaBarlineEkle?.(ref.insertAfterId);
                      } else {
                        // 2. tık: tıklanan barline = voltanın BİTİŞ çizgisi
                        // (= bir ÖNCEKİ ölçünün son barline'ı = ref.insertAfterId)
                        voltaBarlineEkle?.(ref.insertAfterId);
                      }
                    }}
                  >
                    {/* Hit area — büyük şeffaf */}
                    <circle cx={btnX} cy={btnY} r={btnR + 4} fill="transparent" />
                    {/* Beyaz halo (kontrast) */}
                    <circle cx={btnX} cy={btnY} r={btnR + 2} fill="white" opacity={0.85} />
                    {/* Asıl daire */}
                    <circle cx={btnX} cy={btnY} r={btnR} fill={renk}
                      stroke="white" strokeWidth={2} />

                    {/* Sembol — text yerine vektör (font baseline sorununu önler) */}
                    {isBaslangic ? (
                      // Dolu nokta: küçük bir iç daire
                      <circle cx={btnX} cy={btnY} r={btnR * 0.32} fill="white" />
                    ) : adimBekliyor ? (
                      // Ok (→)
                      <g pointerEvents="none">
                        <line
                          x1={btnX - btnR * 0.5} y1={btnY}
                          x2={btnX + btnR * 0.4} y2={btnY}
                          stroke="white" strokeWidth={2.5} strokeLinecap="round"
                        />
                        <polyline
                          points={`${btnX + btnR * 0.1},${btnY - btnR * 0.45} ${btnX + btnR * 0.55},${btnY} ${btnX + btnR * 0.1},${btnY + btnR * 0.45}`}
                          fill="none" stroke="white" strokeWidth={2.5}
                          strokeLinecap="round" strokeLinejoin="round"
                        />
                      </g>
                    ) : (
                      // Artı (+) — daire ortasında iki çizgi
                      <g pointerEvents="none">
                        <line
                          x1={btnX - btnR * 0.55} y1={btnY}
                          x2={btnX + btnR * 0.55} y2={btnY}
                          stroke="white" strokeWidth={3.2} strokeLinecap="round"
                        />
                        <line
                          x1={btnX} y1={btnY - btnR * 0.55}
                          x2={btnX} y2={btnY + btnR * 0.55}
                          stroke="white" strokeWidth={3.2} strokeLinecap="round"
                        />
                      </g>
                    )}
                    <title>{tooltip}</title>
                  </g>
                );
              })}
            </svg>

            <MuzikScoreBrailleOverlay
              satirIdx={satirIdx}
              satirOlcuBrailleleri={satirOlcuBrailleleri}
              baslangicBrailleBilgisi={baslangicBrailleBilgisi}
              ilkSatirHeaderBilgisi={ilkSatirHeaderBilgisi}
              gorunenSatirBrailleLejantMaplari={gorunenSatirBrailleLejantMaplari}
              gorunenSatirBrailleLejantlari={gorunenSatirBrailleLejantlari}
              setHoverBrailleOgeId={setHoverBrailleOgeId}
              hoverBrailleOgeId={hoverBrailleOgeId}
              setHoverBrailleBagId={setHoverBrailleBagId}
              hoverBrailleBagId={hoverBrailleBagId}
              hoverCizgiBagId={hoverCizgiBagId}
              setHoverCizgiBagId={setHoverCizgiBagId}
              hoverBrailleCellKey={hoverBrailleCellKey}
              setHoverBrailleCellKey={setHoverBrailleCellKey}
              hoverTupletId={hoverTupletId}
              setHoverTupletId={setHoverTupletId}
              seciliOgeId={seciliOgeId}
              setSeciliOgeId={setSeciliOgeId}
              seciliBagId={seciliBagId}
              setSeciliBagId={setSeciliBagId}
              brailleYShift={brailleYShift}
              playNote={playNote}
              notaOgesiAl={notaOgesiAl}
              ogeAl={ogeAl}
              keySignatureAccidentals={headerKeySignatureAccidentals}
              setPopupAcik={setPopupAcik}
              hoverModifier={hoverModifier}
              setHoverModifier={setHoverModifier}
              setModifierEditMenu={setModifierEditMenu}
              onBrailleDetayGoster={setBrailleDetay}
            />
          </div>
          </div>
        );
      })}
      </div>  {/* skor satırları wrapper (overflow-x-auto) sonu */}
      <MuzikBarlineTimeSignatureModal
        barlineMenu={barlineMenu}
        setBarlineMenu={setBarlineMenu}
        inlineTimeSignatureEkle={inlineTimeSignatureEkle}
        inlineKeySignatureEkle={inlineKeySignatureEkle}
        olcuCizgisiniDegistir={olcuCizgisiniDegistir}
        olcuCizgisiniSil={olcuCizgisiniSil}
      />

      {/* ── Modifier (aksidental / nokta) düzenleme popup ── */}
      {modifierEditMenu && (
        <div
          className="fixed inset-0 z-50"
          role="presentation"
          onClick={() => setModifierEditMenu(null)}
        >
          <div
            className={`absolute rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2 ${(modifierEditMenu.type === 'susleme' || modifierEditMenu.type === 'dinamik' || modifierEditMenu.type === 'nuans') ? 'w-64' : 'w-52'}`}
            style={{
              left: Math.min(modifierEditMenu.x, window.innerWidth - ((modifierEditMenu.type === 'susleme' || modifierEditMenu.type === 'dinamik' || modifierEditMenu.type === 'nuans') ? 272 : 224)),
              top: Math.min(modifierEditMenu.y + 8, window.innerHeight - ((modifierEditMenu.type === 'susleme' || modifierEditMenu.type === 'dinamik' || modifierEditMenu.type === 'nuans') ? 280 : 148)),
            }}
            role="dialog"
            aria-modal="true"
            aria-label={
              modifierEditMenu.type === 'accidental' ? 'Aksidental'
              : modifierEditMenu.type === 'susleme' ? 'Süsleme'
              : modifierEditMenu.type === 'dinamik' ? 'Dinamik'
              : modifierEditMenu.type === 'nuans' ? 'Nüans'
              : 'Nokta'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-sm font-bold text-slate-800">
                {modifierEditMenu.type === 'accidental'
                  ? `♯/♭ Aksidental`
                  : modifierEditMenu.type === 'susleme'
                  ? `Süsleme: ${modifierEditMenu.ad || ''}`
                  : modifierEditMenu.type === 'dinamik'
                  ? `Dinamik: ${modifierEditMenu.ad || ''}`
                  : modifierEditMenu.type === 'nuans'
                  ? `Nüans: ${modifierEditMenu.ad || ''}`
                  : '· Noktalı uzatma'}
              </span>
              <button
                type="button"
                className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 text-base leading-none shrink-0"
                onClick={() => setModifierEditMenu(null)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
              onClick={() => {
                // seciliOgeId zaten note.id'ye set edildi. Modifier sil.
                if (modifierEditMenu.type === 'accidental') {
                  seciliNotayiGuncelle?.({ accidental: null });
                } else if (modifierEditMenu.type === 'dot') {
                  seciliNotayiGuncelle?.({ dotted: false });
                } else if (modifierEditMenu.type === 'susleme' || modifierEditMenu.type === 'dinamik' || modifierEditMenu.type === 'nuans') {
                  seciliNotaModifierSil?.(modifierEditMenu.modId, modifierEditMenu.yon || 'oncesi', modifierEditMenu.ogeId);
                }
                setModifierEditMenu(null);
              }}
            >
              Sil
            </button>
            {modifierEditMenu.type === 'susleme' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 px-0.5">Değiştir</span>
                <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {(Array.isArray(MUZIK_SUSLEMELER) ? MUZIK_SUSLEMELER : []).map((sus) => {
                    const glif = suslemeSmuflGlyph(sus.ad);
                    const aktif = String(sus.ad).toLowerCase() === String(modifierEditMenu.ad || '').toLowerCase();
                    return (
                      <button
                        key={sus.ad}
                        type="button"
                        title={sus.ad + (sus.aciklama ? '\n' + sus.aciklama : '')}
                        className={`h-9 rounded-md border flex items-center justify-center leading-none transition-colors ${aktif ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                        style={glif ? { fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif", fontSize: '17px' } : { fontSize: '13px' }}
                        onClick={() => {
                          if (!aktif) {
                            const yeniKayit = { ...sus, tip: 'isaret', gorunum: sus.sembol || sus.ad };
                            seciliNotaModifierGuncelle?.(modifierEditMenu.modId, yeniKayit, modifierEditMenu.yon || 'oncesi', modifierEditMenu.ogeId);
                          }
                          setModifierEditMenu(null);
                        }}
                      >
                        {glif || sus.sembol || sus.ad.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {modifierEditMenu.type === 'nuans' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 px-0.5">Değiştir</span>
                <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {((modifierEditMenu.yon === 'sonrasi' ? MUZIK_NUANS_SONRA : MUZIK_NUANS_ONCE) || []).map((nu) => {
                    const glif = nuansSmuflGlyph(nu.ad);
                    const aktif = String(nu.ad).toLowerCase() === String(modifierEditMenu.ad || '').toLowerCase();
                    return (
                      <button
                        key={nu.ad}
                        type="button"
                        title={nu.ad + (nu.aciklama ? '\n' + nu.aciklama : '')}
                        className={`h-9 rounded-md border flex items-center justify-center leading-none transition-colors ${aktif ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                        style={glif ? { fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif", fontSize: '17px' } : { fontSize: '13px' }}
                        onClick={() => {
                          if (!aktif) {
                            const yeniKayit = { ...nu, tip: 'isaret', gorunum: nu.sembol || nu.ad };
                            seciliNotaModifierGuncelle?.(modifierEditMenu.modId, yeniKayit, modifierEditMenu.yon || 'oncesi', modifierEditMenu.ogeId);
                          }
                          setModifierEditMenu(null);
                        }}
                      >
                        {glif || nu.sembol || nu.ad.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {modifierEditMenu.type === 'dinamik' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 px-0.5">Değiştir</span>
                <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {(Array.isArray(MUZIK_DINAMIKLER) ? MUZIK_DINAMIKLER : [])
                    .map((din) => {
                      const dglif = dinamikSmuflGlyph(din.sembol) || dinamikHairpinGlyph(din.ad);
                      const etiket = dinamikEtiketAl(din);
                      const hedef = String(modifierEditMenu.ad || '').toLowerCase();
                      const aktif = etiket.toLowerCase() === hedef || String(din.ad).toLowerCase() === hedef;
                      return (
                        <button
                          key={din.ad}
                          type="button"
                          title={din.ad + (din.aciklama ? '\n' + din.aciklama : '')}
                          className={`h-9 rounded-md border flex items-center justify-center leading-none transition-colors ${aktif ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                          style={dglif ? { fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif", fontSize: '17px' } : { fontStyle: 'italic', fontSize: '12px' }}
                          onClick={() => {
                            if (!aktif) {
                              const yeniKayit = { ...din, tip: 'isaret', gorunum: din.sembol || din.ad };
                              seciliNotaModifierGuncelle?.(modifierEditMenu.modId, yeniKayit, modifierEditMenu.yon || 'oncesi', modifierEditMenu.ogeId);
                            }
                            setModifierEditMenu(null);
                          }}
                        >
                          {dglif || etiket}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => setModifierEditMenu(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Volta düzenleme popup ── */}
      {voltaEditMenu && (() => {
        // Volta marker'ının ait olduğu ölçü (basOlcu) ve _voltaBitisBarlineId'nin
        // ait olduğu ölçü (bitisOlcu) hesaplanır.
        const allMeasures = (muzikSatirOlculeri || []).flat();
        const voltaOge = svgCizilecekOgeler?.find((o) => o?.id === voltaEditMenu.voltaOgeId);

        // basOlcu: volta marker'ını içeren ölçü
        let basOlcuNo = 1;
        for (const m of allMeasures) {
          if ((m.items || []).some((it) => it.id === voltaEditMenu.voltaOgeId)) {
            basOlcuNo = (m.measureIndex ?? m.index ?? 0) + 1;
            break;
          }
        }

        // bitisOlcu: _voltaBitisBarlineId'yi içeren ölçü
        let bitisOlcuNo = basOlcuNo;
        const bitisBId = voltaOge?._voltaBitisBarlineId;
        if (bitisBId) {
          for (const m of allMeasures) {
            if ((m.items || []).some((it) => it.id === bitisBId)) {
              bitisOlcuNo = (m.measureIndex ?? m.index ?? 0) + 1;
              break;
            }
          }
        }

        return (
          <VoltaEditPopup
            menu={voltaEditMenu}
            initialBas={basOlcuNo}
            initialBitis={bitisOlcuNo}
            maxOlcu={allMeasures.length}
            onClose={() => setVoltaEditMenu(null)}
            onSil={() => {
              voltaSil?.(voltaEditMenu.voltaOgeId);
              setVoltaEditMenu(null);
            }}
            onGuncelle={(bas, bitis) => {
              voltaGuncelle?.(voltaEditMenu.voltaOgeId, {
                basOlcuNo: bas,
                bitisOlcuNo: bitis,
              });
              setVoltaEditMenu(null);
            }}
          />
        );
      })()}

      {/* ── Slur / Tie silme popup ── */}
      {bagEditMenu && (
        <div
          className="fixed inset-0 z-50"
          role="presentation"
          onClick={() => setBagEditMenu(null)}
        >
          <div
            className="absolute w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2"
            style={{
              left: Math.min(bagEditMenu.x, window.innerWidth - 224),
              top: Math.min(bagEditMenu.y + 8, window.innerHeight - 148),
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Bağ işlemleri"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-sm font-bold text-slate-800">
                {bagEditMenu.tip === 'tie' ? '🎵 Uzatma bağı' : '🎼 Hece bağı'}
              </span>
              <button
                type="button"
                className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 text-base leading-none"
                onClick={() => setBagEditMenu(null)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
              onClick={() => {
                seciliBagiSil?.(bagEditMenu.bagIds);
                setBagEditMenu(null);
              }}
            >
              Sil
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => setBagEditMenu(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Braille Detay Paneli (sayfanın altında fixed) ── */}
      <BrailleDetayPanel
        detay={brailleDetay}
        onKapat={() => setBrailleDetay(null)}
      />

      {/* ── Header zaman imzası değiştirme popup ── */}
      {headerTsMenuPos && (
        <div
          className="fixed inset-0 z-50"
          role="presentation"
          onClick={() => setHeaderTsMenuPos(null)}
        >
          <div
            ref={tsMenuRef}
            tabIndex={-1}
            className="absolute w-60 rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2 outline-none"
            style={{
              left: Math.min(headerTsMenuPos.x - 30, window.innerWidth - 260),
              top: Math.min(headerTsMenuPos.y + 10, window.innerHeight - 340),
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Ölçü sayısını değiştir"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') { e.preventDefault(); setHeaderTsMenuPos(null); return; }
              if (e.key === 'Tab') {
                const odak = tsMenuRef.current?.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
                if (!odak || !odak.length) return;
                const ilk = odak[0]; const son = odak[odak.length - 1];
                if (e.shiftKey && (document.activeElement === ilk || document.activeElement === tsMenuRef.current)) { e.preventDefault(); son.focus(); }
                else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
              }
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-sm font-bold text-slate-800">Ölçü sayısı</span>
              <button
                type="button"
                className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 text-base leading-none"
                onClick={() => setHeaderTsMenuPos(null)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 pb-0.5">
              Seçin
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {HEADER_TS_OPTIONS.map((sig) => {
                const mevcutTs = muzikHeader?.timeSignature?.ad || muzikHeader?.timeSignature?.gorunum || '';
                const aktif = mevcutTs === sig;
                return (
                  <button
                    key={sig}
                    type="button"
                    className={[
                      'rounded-lg border px-2 py-2 text-sm font-semibold text-slate-700 transition-colors',
                      aktif
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-white hover:bg-amber-100 hover:border-amber-400',
                    ].join(' ')}
                    onClick={() => {
                      setTimeSignature?.(sig);
                      setHeaderTsMenuPos(null);
                    }}
                  >
                    {sig === 'common' ? 'C' : sig === 'cut common' ? '𝄵' : sig}
                  </button>
                );
              })}
            </div>

            {/* Aksak/düzensiz metre VURUŞ GRUPLAMASI — yalnız 5/8, 7/8, 9/8, 10/8 gibi metrelerde görünür.
                Seçim görsel kiriş + ekran-altı braille + indirileni belirler (gruplamaDeseni). */}
            {(() => {
              const mevcutTs = muzikHeader?.timeSignature?.ad || muzikHeader?.timeSignature?.gorunum || '';
              const secenekler = headerGruplamaSecenekleriAl(mevcutTs);
              if (!secenekler) return null;
              const aktifAnahtar = Array.isArray(muzikHeader?.timeSignature?.gruplamaDeseni)
                ? muzikHeader.timeSignature.gruplamaDeseni.join('+')
                : secenekler[0].join('+');
              return (
                <div className="mt-2 border-t border-slate-200 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 pb-1">
                    Vuruş gruplaması
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {secenekler.map((desen) => {
                      const anahtar = desen.join('+');
                      const aktifMi = anahtar === aktifAnahtar;
                      return (
                        <button
                          key={anahtar}
                          type="button"
                          className={[
                            'rounded-lg border px-2 py-1.5 text-sm font-bold tabular-nums transition-colors',
                            aktifMi
                              ? 'border-amber-400 bg-amber-50 text-amber-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-amber-100 hover:border-amber-400',
                          ].join(' ')}
                          onClick={() => {
                            setTimeSignature?.(mevcutTs, desen);
                            setHeaderTsMenuPos(null);
                          }}
                        >
                          {anahtar}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <button
              type="button"
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => setHeaderTsMenuPos(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Header donanım (key signature) değiştirme popup ── */}

      {/* Başlık/besteci düzenleme açıkken dışarı tıklayınca kaydet */}
      {inlineEdit && (
        <div className="fixed inset-0 z-[150]" style={{ pointerEvents: 'all' }} onClick={inlineEditKaydet} />
      )}

      {/* ── Tempo seçim dropdown'u ── */}
      {tempoDropdownPos && (
        <div
          className="fixed inset-0 z-[210]"
          role="presentation"
          onClick={() => setTempoDropdownPos(null)}
        >
          <div
            className="absolute min-w-[220px] rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden"
            style={{
              left: Math.min(tempoDropdownPos.x, window.innerWidth - 240),
              top: Math.min(tempoDropdownPos.y, window.innerHeight - 340),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Elle giriş */}
            <div className="px-3 pt-2.5 pb-1.5 border-b border-zinc-100">
              <input
                type="text"
                placeholder="Tempo yaz…"
                defaultValue={muzikHeader?.tempo || ''}
                autoFocus
                className="w-full text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-sky-400 italic"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setMuzikHeader?.((h) => ({ ...h, tempo: e.target.value.trim() }));
                    setTempoDropdownPos(null);
                  }
                  if (e.key === 'Escape') setTempoDropdownPos(null);
                }}
              />
            </div>
            {/* Liste */}
            <div className="py-1 max-h-56 overflow-y-auto">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-50"
                onClick={() => { setMuzikHeader?.((h) => ({ ...h, tempo: '' })); setTempoDropdownPos(null); }}
              >
                Tempo yok
              </button>
              <div className="h-px bg-zinc-100 mx-3 my-0.5" />
              {(tempoListesi || []).map((tempo) => (
                <button
                  key={tempo.ad}
                  type="button"
                  onClick={() => { setMuzikHeader?.((h) => ({ ...h, tempo: tempo.ad })); setTempoDropdownPos(null); }}
                  className={[
                    'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-zinc-50',
                    muzikHeader?.tempo === tempo.ad ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-zinc-700',
                  ].join(' ')}
                >
                  <span className="font-semibold italic">{tempo.ad}</span>
                  {(tempo.bpmMin || tempo.bpmMax) && (
                    <span className="text-zinc-400 font-normal not-italic text-[10px]">
                      ({tempo.bpmMin}–{tempo.bpmMax})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {headerKsMenuPos && (
        <div
          className="fixed inset-0 z-50"
          role="presentation"
          onClick={() => setHeaderKsMenuPos(null)}
        >
          <div
            className="absolute w-72 rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2"
            style={{
              left: Math.min(headerKsMenuPos.x - 30, window.innerWidth - 300),
              top: Math.min(headerKsMenuPos.y + 10, window.innerHeight - 420),
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Donanımı değiştir"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-sm font-bold text-slate-800">Donanım</span>
              <button
                type="button"
                className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 text-base leading-none"
                onClick={() => setHeaderKsMenuPos(null)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 pb-0.5">
              Seçin
            </div>
            <div className="max-h-72 overflow-y-auto flex flex-col gap-1 pr-0.5">
              {(() => {
                const mevcutKs = muzikHeader?.keySignature?.ad || '';
                return (
                  <>
                    <button
                      type="button"
                      className={[
                        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors',
                        !mevcutKs
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-slate-200 bg-white hover:bg-amber-100 hover:border-amber-400 text-slate-700',
                      ].join(' ')}
                      onClick={() => {
                        donanimiDegistir?.(null);
                        setHeaderKsMenuPos(null);
                      }}
                    >
                      <span className="w-8 text-center text-base font-semibold text-slate-400">♮</span>
                      <span className="flex-1 font-medium">Donanımsız</span>
                    </button>
                    {DONANIM_LISTESI.map((d) => {
                      const aktif = mevcutKs === d.ad;
                      return (
                        <button
                          key={d.ad}
                          type="button"
                          className={[
                            'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors',
                            aktif
                              ? 'border-amber-400 bg-amber-50 text-amber-800'
                              : 'border-slate-200 bg-white hover:bg-amber-100 hover:border-amber-400 text-slate-700',
                          ].join(' ')}
                          onClick={() => {
                            donanimiDegistir?.(d);
                            setHeaderKsMenuPos(null);
                          }}
                        >
                          <span className="w-8 text-center text-base font-semibold text-slate-600">
                            {d.sembol || ''}
                          </span>
                          <span className="flex flex-col">
                            <span className="font-medium leading-tight">{d.ad}</span>
                            {d.aciklama && (
                              <span className="text-[11px] leading-tight text-slate-400">
                                {d.aciklama}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>
            <button
              type="button"
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => setHeaderKsMenuPos(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Volta düzenleme popup'ı — başlangıç/bitiş ölçü düzenle veya sil
// ─────────────────────────────────────────────────────────────────────────
function VoltaEditPopup({ menu, initialBas, initialBitis, maxOlcu, onClose, onSil, onGuncelle }) {
  const [bas, setBas] = useState(String(initialBas));
  const [bitis, setBitis] = useState(String(initialBitis));

  const basNo = parseInt(bas, 10);
  const bitisNo = parseInt(bitis, 10);
  const gecerli = Number.isFinite(basNo) && Number.isFinite(bitisNo)
    && basNo >= 1 && bitisNo >= basNo && bitisNo <= (maxOlcu || 999);
  const degisti = basNo !== initialBas || bitisNo !== initialBitis;
  const baslik = menu.voltaTip === 'volta1' ? '1. ev' : '2. ev';

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute w-64 rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2"
        style={{
          left: Math.min(menu.x, window.innerWidth - 280),
          top: Math.min(menu.y + 8, window.innerHeight - 260),
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`${baslik} düzenle`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-sm font-bold text-slate-800">📑 {baslik}</span>
          <button
            type="button"
            className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 text-base leading-none"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Başlangıç ölçüsü
          </label>
          <input
            type="number" min={1} max={maxOlcu || 999}
            value={bas}
            onChange={(e) => setBas(e.target.value)}
            className="h-8 rounded border border-slate-300 px-2 text-sm"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Bitiş ölçüsü
          </label>
          <input
            type="number" min={basNo || 1} max={maxOlcu || 999}
            value={bitis}
            onChange={(e) => setBitis(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && gecerli && degisti) {
                onGuncelle(basNo, bitisNo);
              }
            }}
            className="h-8 rounded border border-slate-300 px-2 text-sm"
          />
        </div>

        {menu.voltaTip === 'volta1' && (
          <p className="text-[10px] text-amber-700 leading-snug mt-1">
            ⚠️ Silinirse veya değiştirilirse, peşindeki 2. ev de silinir.
          </p>
        )}

        <div className="flex gap-1.5 mt-1">
          <button
            type="button"
            disabled={!gecerli || !degisti}
            onClick={() => onGuncelle(basNo, bitisNo)}
            className="flex-1 rounded-lg border border-emerald-500 bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Güncelle
          </button>
          <button
            type="button"
            onClick={onSil}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
