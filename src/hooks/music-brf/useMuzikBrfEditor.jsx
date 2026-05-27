import { useMemo, useRef, useState } from 'react';
import {
  NOTALAR as MUZIK_TEMEL_NOTALAR,
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
} from '../../data/muzik.js';
import {
  MUZIK_EDITOR_VARSAYILAN_ANAHTAR,
  MUZIK_VARSAYILAN_ZAMAN_IMZASI,
  veriBolumAl,
  anahtarEkliMi,
} from '../../utils/music-brf/musicConstants.js';
import {
  muzikBrailleCellsToScore,
  muzikBrailleTokensToScore,
} from '../../utils/music-brf/musicBrailleImportEngine.js';
import {
  muzikOgeleriOlcuOlcuOkunurMetinAl,
} from '../../utils/music-brf/musicReadableSummary.js';
import { brfMuzikOku } from '../../utils/music-brf/brfMusicReader.js';
import {
  scoreToReaderResult,
  scoreToCanonicalBrf,
} from '../../utils/music-brf/musicCanonicalPipeline.js';
import { MUSIC_CANONICAL_BRF } from '../../utils/music-brf/musicCanonicalFlags.js';
import {
  muzikSureKisaAdi,
  muzikTimeSigExpected16,
  muzikNotaSkorOgesi,
  muzikSusSkorOgesi,
  muzikRestSureFromName,
  muzikKeySignatureHucreleri,
  muzikTimeSignatureHucreleri,
  muzikKontraksiyonsuzMetinHucreleri,
} from '../../utils/music/index.js';
import { muzikOgeleriOlcuTamamla, normalOlcuCizgisiMi } from '../../utils/music-brf/musicMeasureHelpers.js';
import { varsayilanMuzikHeaderOlustur } from '../../utils/music-brf/musicHeaderHelpers.js';
import { varsayilanOktavAnahtaraGoreAl } from '../../utils/music-brf/musicScoreHelpers.jsx';
import { useMusicScoreLayout } from './useMusicScoreLayout.js';
import { useBrailleOutput } from './useBrailleOutput.js';

export function useMuzikBrfEditor() {
  const idRef = useRef(0);
  const yeniId = () => `mb-${idRef.current++}`;

  const [muzikOgeleri, setMuzikOgeleri] = useState(() => {
    if (!MUZIK_EDITOR_VARSAYILAN_ANAHTAR) return [];
    const a = MUZIK_EDITOR_VARSAYILAN_ANAHTAR;
    return [{ id: 'mb-init-clef', tip: 'anahtar', ad: a.ad, gorunum: a.gorunum, hucreler: a.hucreler }];
  });
  const [muzikBaglar, setMuzikBaglar] = useState([]);
  const [muzikTupletler, setMuzikTupletler] = useState([]);
  const [aktifKategori, setAktifKategori] = useState('sure');
  const [aktifArac, setAktifArac] = useState('sure');
  const [bekleyenModifier, setBekleyenModifier] = useState(null);
  const [bekleyenBag, setBekleyenBag] = useState(null);
  const [popupAcik, setPopupAcik] = useState(false);
  const [anahtarPopupAcik, setAnahtarPopupAcik] = useState(false);
  const [barlineMenu, setBarlineMenu] = useState(null);
  const [ifadeGirisi, setIfadeGirisi] = useState('');
  const [bekleyenTuplet, setBekleyenTuplet] = useState(null);
  const [muzikHeader, setMuzikHeader] = useState(() => varsayilanMuzikHeaderOlustur());
  const [muzikUyarilari, setMuzikUyarilari] = useState([]);
  const [includeBarNumbers, setIncludeBarNumbers] = useState(false);
  const [seciliSureIdx, setSeciliSureIdx] = useState(1);
  const [seciliOgeId, setSeciliOgeId] = useState(null);
  const [sonEklenenOgeId, setSonEklenenOgeId] = useState(null);
  const [hoverBrailleOgeId, setHoverBrailleOgeId] = useState(null);
  const [seciliBagId, setSeciliBagId] = useState(null);
  const [hoverBrailleBagId, setHoverBrailleBagId] = useState(null);
  const [hoverCizgiBagId, setHoverCizgiBagId] = useState(null);
  const [adimSure, setAdimSure] = useState(true);
  const [sonKullanilanOktav, setSonKullanilanOktav] = useState(null);
  const [brfHamMetin, setBrfHamMetin] = useState('');
  const [brfImportKirli, setBrfImportKirli] = useState(false);
  const [brfOkunurOzet, setBrfOkunurOzet] = useState('');
  const [brfOkumaDurumMesaji, setBrfOkumaDurumMesaji] = useState('');
  const [brfOkumaSonucu, setBrfOkumaSonucu] = useState(null);

  const editorDegisti = () => {
    if (brfHamMetin) {
      setBrfImportKirli(true);
    }
  };

  const muzikOgeleriOlcuTamamlanmis = useMemo(() => (
    muzikOgeleriOlcuTamamla({
      muzikOgeleri,
      muzikHeader,
      muzikSusSkorOgesi,
      sureGostergeleri: MUZIK_SURE_GOSTERGELERI,
    })
  ), [
    muzikOgeleri,
    muzikHeader.timeSignature,
    muzikHeader.autoCompleteMeasures,
    muzikHeader.pickupMeasure,
  ]);

  // LEGACY / FALLBACK:
  // Eski doğrudan score → readerResult hattı.
  // Ana yol artık scoreToCanonicalBrf → brfMuzikOku şeklindedir.
  // Tam geçiş tamamlandıktan sonra kaldırılabilir.
  const canonicalReader = useMemo(() => {
    if (!MUSIC_CANONICAL_BRF.readerScore) return null;
    try {
      const useBrailleGrouping = Boolean(muzikHeader?.useBrailleGrouping);
      const result = scoreToReaderResult({
        ogeler: muzikOgeleri,
        baglar: muzikBaglar,
        header: muzikHeader,
        tupletler: muzikTupletler,
        options: {
          editorPreview: true,
          useBrailleGrouping,
          strictDurationCells: !useBrailleGrouping,
        },
      });

      return result;
    } catch (err) {
      if (MUSIC_CANONICAL_BRF.debug) {
        console.warn('Canonical reader score üretilemedi:', err);
      }
      return null;
    }
  }, [muzikOgeleri, muzikBaglar, muzikHeader, muzikTupletler]);

  const canonicalEditorBrfResult = useMemo(() => {
    try {
      const useBrailleGrouping = Boolean(muzikHeader?.useBrailleGrouping);
      const result = scoreToCanonicalBrf({
        ogeler: muzikOgeleriOlcuTamamlanmis,
        baglar: muzikBaglar,
        header: muzikHeader,
        tupletler: muzikTupletler,
        options: {
          includeBarNumbers,
          useBrailleGrouping,
          strictDurationCells: !useBrailleGrouping,
        },
      });

      return {
        ok: true,
        result,
        brfText: result?.brfText || '',
        error: null,
      };
    } catch (error) {
      if (MUSIC_CANONICAL_BRF.debug) {
        console.warn('Canonical editor BRF üretilemedi:', error);
      }

      return {
        ok: false,
        result: null,
        brfText: '',
        error,
      };
    }
  }, [
    muzikOgeleriOlcuTamamlanmis,
    muzikBaglar,
    muzikHeader,
    muzikTupletler,
    includeBarNumbers,
  ]);

  const canonicalEditorBrfText = canonicalEditorBrfResult.brfText || '';

  const canonicalEditorReaderResult = useMemo(() => {
    if (!canonicalEditorBrfText) {
      return {
        ok: false,
        result: null,
        error: null,
        items: [],
        measures: [],
        baglar: [],
        readableText: '',
      };
    }

    try {
      const result = brfMuzikOku(canonicalEditorBrfText, {
        source: 'editor-canonical-brf',
        useBrailleGrouping: Boolean(muzikHeader?.useBrailleGrouping),
      });

      return {
        ok: true,
        result,
        error: null,
        items: Array.isArray(result?.items) ? result.items : [],
        measures: Array.isArray(result?.measures) ? result.measures : [],
        baglar: Array.isArray(result?.baglar) ? result.baglar : [],
        readableText: result?.readableText || '',
      };
    } catch (error) {
      if (MUSIC_CANONICAL_BRF.debug) {
        console.warn('Canonical editor BRF reader okunamadı:', error);
      }

      return {
        ok: false,
        result: null,
        error,
        items: [],
        measures: [],
        baglar: [],
        readableText: '',
      };
    }
  }, [canonicalEditorBrfText]);

  const mevcutAnahtar = useMemo(() => (
    muzikOgeleri.find((oge) => oge.tip === 'anahtar') || MUZIK_EDITOR_VARSAYILAN_ANAHTAR || null
  ), [muzikOgeleri]);

  const guvenliOktavAl = (deger, fallback = 4) => {
    const n = Number(deger);
    return Number.isFinite(n) && n >= 1 && n <= 7 ? n : fallback;
  };

  const varsayilanGuvenliOktavAl = () => (
    guvenliOktavAl(varsayilanOktavAnahtaraGoreAl(mevcutAnahtar), 4)
  );

  const anahtarGlyphAl = (anahtar) => {
    if (!anahtar) return '𝄞';

    const ad = String(anahtar.ad || '').toLowerCase();
    if (/fa|bass/i.test(ad)) return '𝄢';
    if (/do|alto|tenor/i.test(ad)) return '𝄡';
    return anahtar.gorunum || '𝄞';
  };

  const onceAnahtarGarantiEt = (ogeler) => {
    if (anahtarEkliMi(ogeler) || !MUZIK_EDITOR_VARSAYILAN_ANAHTAR) return ogeler;
    const a = MUZIK_EDITOR_VARSAYILAN_ANAHTAR;
    return [{ id: yeniId(), tip: 'anahtar', ad: a.ad, gorunum: a.gorunum, hucreler: a.hucreler }, ...ogeler];
  };

  const otomatikOlcuCizgisiStateOgesiMi = (oge) => Boolean(
    oge?.auto === true ||
    oge?.autoBarline === true ||
    oge?.otomatikOlcuCizgisi === true,
  );

  const notaEkle = (notaAd, sureIdxOverride) => {
    const kullanilacakSure = (typeof sureIdxOverride === 'number') ? sureIdxOverride : seciliSureIdx;
    const kullanilacakOktav = Number.isFinite(Number(sonKullanilanOktav))
      ? guvenliOktavAl(sonKullanilanOktav, varsayilanGuvenliOktavAl())
      : varsayilanGuvenliOktavAl();

    const oge = muzikNotaSkorOgesi(yeniId(), notaAd, kullanilacakSure, {
      oktav: kullanilacakOktav,
    });

    setMuzikOgeleri((onceki) => [
      ...onceAnahtarGarantiEt(onceki),
      oge,
    ]);

    setSonKullanilanOktav(kullanilacakOktav);
    setSeciliOgeId(oge.id);
    setSonEklenenOgeId(oge.id);
    setAdimSure(true);
    editorDegisti();
  };

  const notaEkleKonuma = ({
    notaAd,
    oktav,
    sureIdx,
    insertAfterId,
  } = {}) => {
    const kullanilacakSure = Number.isInteger(sureIdx)
      ? sureIdx
      : seciliSureIdx;

    const kullanilacakOktav = guvenliOktavAl(
      oktav ?? sonKullanilanOktav,
      varsayilanGuvenliOktavAl(),
    );

    const oge = muzikNotaSkorOgesi(yeniId(), notaAd || 'do', kullanilacakSure, {
      oktav: kullanilacakOktav,
    });

    setMuzikOgeleri((onceki) => {
      const garantiListe = onceAnahtarGarantiEt(onceki);

      if (!insertAfterId) {
        return [...garantiListe, oge];
      }

      const insertIndex = garantiListe.findIndex((item) => item.id === insertAfterId);

      if (insertIndex < 0) {
        return [...garantiListe, oge];
      }

      return [
        ...garantiListe.slice(0, insertIndex + 1),
        oge,
        ...garantiListe.slice(insertIndex + 1),
      ];
    });

    setSonKullanilanOktav(kullanilacakOktav);
    setSeciliOgeId(oge.id);
    setSonEklenenOgeId(oge.id);
    setAdimSure(true);
    editorDegisti();

    return oge;
  };

  const sureSecildi = (sureIdx) => {
    setSeciliSureIdx(sureIdx);
    setAdimSure(false);
    setAktifKategori('notalar');
    setAktifArac('notalar');
  };

  const bagKayitlariniAl = () => veriBolumAl('bag-slur');

  const tieKaydiAl = () => {
    const bagKayitlari = bagKayitlariniAl();
    return bagKayitlari.find((o) => /^(tie|bağ)\b/i.test(String(o.ad || '')))
      || bagKayitlari[0]
      || { ad: 'Tie', hucreler: [] };
  };

  const slurKaydiAl = (mode = 'single') => {
    const bagKayitlari = bagKayitlariniAl();
    const modeLower = String(mode || 'single').toLowerCase();

    if (modeLower === 'double') {
      return bagKayitlari.find((o) => /çift\s*slur|double\s*slur/i.test(String(o.ad || '')))
        || bagKayitlari.find((o) => /slur/i.test(String(o.ad || '')))
        || bagKayitlari[0]
        || { ad: 'Double Slur', hucreler: [] };
    }

    if (modeLower === 'bracket') {
      return bagKayitlari.find((o) => /köşeli\s*slur|bracket\s*slur/i.test(String(o.ad || '')))
        || bagKayitlari.find((o) => /slur/i.test(String(o.ad || '')))
        || bagKayitlari[0]
        || { ad: 'Bracket Slur', hucreler: [] };
    }

    return bagKayitlari.find((o) => /slur/i.test(String(o.ad || '')))
      || bagKayitlari[1]
      || bagKayitlari[0]
      || { ad: 'Single Slur', hucreler: [] };
  };

  const tieBaslat = () => {
    setBekleyenBag({
      tipModu: 'tie',
      notaIdler: [],
      mode: 'single',
      kayit: tieKaydiAl(),
    });
    setAktifArac('bag-tie');
  };

  const slurBaslat = () => {
    setBekleyenBag({
      tipModu: 'slur',
      notaIdler: [],
      kayit: slurKaydiAl(),
    });
    setAktifArac('bag-slur');
  };

  const aracTikla = (toolId) => {
    if (toolId === 'bag-tie') {
      tieBaslat();
      return;
    }

    if (toolId === 'bag-slur') {
      slurBaslat();
      return;
    }

    setAktifArac((o) => o === toolId ? null : toolId);
  };

  const isaretEkle = (kayit) => {
    if (aktifKategori === 'donanim') {
      setMuzikHeader((h) => ({ ...h, keySignature: { ad: kayit.ad, hucreler: kayit.hucreler, gorunum: kayit.gorunum } }));
      editorDegisti();
      return;
    }
    if (aktifKategori === 'zaman-imzasi') {
      setTimeSignature(kayit.ad || kayit.gorunum);
      editorDegisti();
      return;
    }
    const restReal = muzikRestSureFromName(kayit.ad);
    if (restReal !== null) {
      const sureIdx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => s.realValue === restReal);
      const oge = muzikSusSkorOgesi(yeniId(), sureIdx >= 0 ? sureIdx : 0, {
        dotted: /noktalı/.test(String(kayit.ad || '').toLowerCase()),
      });

      setMuzikOgeleri((onceki) => [
        ...onceAnahtarGarantiEt(onceki),
        oge,
      ]);

      setSeciliOgeId(oge.id);
      setSonEklenenOgeId(oge.id);
      editorDegisti();
      return;
    }
    const adLower = String(kayit.ad || '').toLowerCase();
    let tipOverride = null;
    if (/tekrar başlangıcı|begin.*repeat|röpriz.*başla/.test(adLower)) tipOverride = 'beginRepeat';
    else if (/tekrar sonu|end.*repeat|röpriz.*bitir/.test(adLower)) tipOverride = 'endRepeat';
    else if (/1\.\s*ev|1\.\s*dolap|volta\s*1/.test(adLower)) tipOverride = 'volta1';
    else if (/2\.\s*ev|2\.\s*dolap|volta\s*2/.test(adLower)) tipOverride = 'volta2';
    else if (/bitiş çizgisi|final.*bar/.test(adLower)) tipOverride = 'finalBarline';
    else if (/bölüm sonu|sectional/.test(adLower)) tipOverride = 'sectionalBarline';
    else if (/ölçü ayracı|normal.*ölçü|ölçü çizgisi|barline|measure/.test(adLower)) {
      tipOverride = 'barline';
    }
    const oge = {
      id: yeniId(),
      tip: tipOverride || kayit.tip || 'isaret',
      kind: tipOverride === 'barline' ? 'manual' : kayit.kind,
      auto: false,
      autoBarline: false,
      otomatikOlcuCizgisi: false,
      ad: tipOverride === 'barline' ? 'Manuel ölçü çizgisi' : (kayit.ad || 'İşaret'),
      gorunum: tipOverride === 'barline' ? '|' : (kayit.gorunum || kayit.sembol || ''),
      hucreler: Array.isArray(kayit.hucreler)
        ? (tipOverride === 'barline' ? [[]] : kayit.hucreler)
        : (tipOverride === 'barline' ? [[]] : []),
      aciklama: tipOverride === 'barline' ? 'Manuel ölçü çizgisi' : kayit.aciklama,
    };
    setMuzikOgeleri((onceki) => [
      ...onceAnahtarGarantiEt(onceki),
      oge,
    ]);

    setSeciliOgeId(oge.id);
    setSonEklenenOgeId(oge.id);
    editorDegisti();
  };

  const bagBaslat = (kayit) => {
    const bagTipi = kayit?.tip || kayit?.kayit?.tip || kayit?.id || 'slur';
    const isTie = bagTipi === 'tie' || /^(tie|bağ)\b/i.test(String(kayit?.ad || ''));
    const mode = isTie
      ? 'single'
      : (/double|çift/i.test(String(kayit?.ad || '')) ? 'double'
        : (/bracket|köşeli/i.test(String(kayit?.ad || '')) ? 'bracket' : 'single'));

    setBekleyenBag({
      kayit,
      basId: null,
      notaIdler: [],
      tipModu: isTie ? 'tie' : 'slur',
      mode,
    });
    setAktifKategori(null);
  };

  const modifierBaslat = (kayit, yon) => {
    setBekleyenModifier({ kayit, yon });
    setAktifKategori(null);
  };

  const aracEkleHandler = (toolId, oge) => {
    if (toolId === 'olcu-cizgileri') {
      return isaretEkle({
        ...oge,
        tip: oge.tip || oge.type || 'barline',
        kind: oge.kind || 'normal',
        gorunum: oge.gorunum || oge.sembol || '|',
        hucreler: Array.isArray(oge.hucreler) ? oge.hucreler : [[]],
        auto: false,
        autoBarline: false,
        otomatikOlcuCizgisi: false,
      });
    }

    const k = { ...oge, tip: 'isaret', gorunum: oge.sembol || oge.ad };
    if (toolId === 'dinamikler') return modifierBaslat(k, 'oncesi');
    if (toolId === 'suslemeler') return modifierBaslat(k, 'oncesi');
    if (toolId === 'duzensiz-gruplar') return tupletBaslat(k);
    if (toolId === 'tekrar') return isaretEkle(k);
    if (toolId === 'sus') return isaretEkle({ ...oge, tip: 'sus' });
    return isaretEkle(k);
  };

  const anahtariDegistir = (anahtarKayit) => {
    const yeniAnahtar = {
      id: yeniId(),
      tip: 'anahtar',
      ad: anahtarKayit.ad,
      gorunum: anahtarKayit.gorunum || anahtarKayit.sembol || anahtarKayit.ad,
      hucreler: anahtarKayit.hucreler,
    };
    setMuzikOgeleri((onceki) => [yeniAnahtar, ...onceki.filter((o) => o.tip !== 'anahtar')]);
    setAnahtarPopupAcik(false);
    setSeciliOgeId(yeniAnahtar.id);
    setSonEklenenOgeId(yeniAnahtar.id);
    editorDegisti();
  };

  const modifierUygula = (notaOgesi) => {
    if (!bekleyenModifier) return;
    const { kayit, yon } = bekleyenModifier;
    const adLower = String(kayit.ad || '').toLowerCase();
    const oktavMatch = /(\d+)\s*\.\s*oktav/i.exec(adLower);
    if (oktavMatch) {
      const o = Math.min(7, Math.max(1, parseInt(oktavMatch[1], 10)));
      setMuzikOgeleri((onceki) => onceki.map((og) => og.id === notaOgesi.id ? { ...og, oktav: o } : og));
      setBekleyenModifier(null);
      editorDegisti();
      return;
    }
    let accId = null;
    if (/^çift\s*diyez/.test(adLower)) accId = 'doubleSharp';
    else if (/^çift\s*bemol/.test(adLower)) accId = 'doubleFlat';
    else if (/^diyez/.test(adLower)) accId = 'sharp';
    else if (/^bemol/.test(adLower)) accId = 'flat';
    else if (/^naturel|^bekar/.test(adLower)) accId = 'natural';
    if (accId) {
      setMuzikOgeleri((onceki) => onceki.map((og) => og.id === notaOgesi.id ? { ...og, accidental: accId } : og));
      setBekleyenModifier(null);
      editorDegisti();
      return;
    }
    setMuzikOgeleri((onceki) => onceki.map((og) => {
      if (og.id !== notaOgesi.id) return og;
      const mevcut = Array.isArray(og.modifiers?.[yon]) ? og.modifiers[yon] : [];
      return {
        ...og,
        modifiers: { ...(og.modifiers || {}), [yon]: [...mevcut, { id: `mod-${idRef.current++}`, kayit }] },
      };
    }));
    setBekleyenModifier(null);
    editorDegisti();
  };

  const muzikNotalariAl = () => (
    muzikOgeleri.filter((oge) => oge?.tip === 'nota')
  );

  const notaIndexAl = (notaId) => (
    muzikNotalariAl().findIndex((nota) => nota.id === notaId)
  );

  const notaAl = (notaId) => (
    muzikOgeleri.find((oge) => oge.id === notaId && oge.tip === 'nota')
  );

  const notaIdAraligiAl = (basId, sonId) => {
    const notalar = muzikOgeleri.filter((oge) => oge?.tip === 'nota');
    const basIdx = notalar.findIndex((nota) => nota.id === basId);
    const sonIdx = notalar.findIndex((nota) => nota.id === sonId);

    if (basIdx < 0 || sonIdx < 0) {
      return [basId, sonId].filter(Boolean);
    }

    const min = Math.min(basIdx, sonIdx);
    const max = Math.max(basIdx, sonIdx);

    return notalar.slice(min, max + 1).map((nota) => nota.id);
  };

  const ayniSesMi = (a, b) => (
    a?.tip === 'nota' &&
    b?.tip === 'nota' &&
    a.notaAd === b.notaAd &&
    (a.oktav ?? 4) === (b.oktav ?? 4) &&
    (a.accidental || null) === (b.accidental || null)
  );

  const ardisikNotaMi = (basId, sonId) => {
    const notalar = muzikOgeleri.filter((oge) => oge?.tip === 'nota');
    const basIdx = notalar.findIndex((nota) => nota.id === basId);
    const sonIdx = notalar.findIndex((nota) => nota.id === sonId);

    return basIdx >= 0 && sonIdx >= 0 && Math.abs(sonIdx - basIdx) === 1;
  };

  const uyariEkle = (type, message) => {
    setMuzikUyarilari((onceki) => [
      ...(Array.isArray(onceki) ? onceki : []),
      { type, message },
    ]);
  };

  const slurAyniSesOnerisiGerekliMi = (ids) => {
    if (!Array.isArray(ids) || ids.length < 2) return false;

    const notalar = ids
      .map((id) => notaAl(id))
      .filter(Boolean);

    if (notalar.length !== ids.length) return false;

    return notalar.every((nota) => ayniSesMi(notalar[0], nota));
  };

  const slurZinciriniBitir = (ids, kayit) => {
    if (!Array.isArray(ids) || ids.length < 2) return;

    const temizIds = ids.filter(Boolean);
    if (temizIds.length < 2) return;

    if (slurAyniSesOnerisiGerekliMi(temizIds)) {
      uyariEkle(
        'slur-same-pitch-warning',
        'Aynı sesleri süre olarak bağlamak için slur yerine tie kullanılması önerilir.',
      );
    }

    const aralikIds = notaIdAraligiAl(temizIds[0], temizIds[temizIds.length - 1]);

    const yeniBag = {
      id: `bag-${idRef.current++}`,
      tip: 'slur',
      basId: aralikIds[0],
      sonId: aralikIds[aralikIds.length - 1],
      notaIdler: aralikIds,
      kayit: {
        ...(kayit || {}),
        tip: 'slur',
        ad: kayit?.ad || 'Slur',
      },
    };

    setMuzikBaglar((onceki) => [...onceki, yeniBag]);
  };

  const slurTamamla = () => {
    if (!bekleyenBag || bekleyenBag.tipModu !== 'slur') return;

    const ids = Array.isArray(bekleyenBag.notaIdler)
      ? bekleyenBag.notaIdler
      : [];

    if (ids.length < 2) {
      uyariEkle('slur-error', 'Slur için en az iki nota seçilmelidir.');
      return;
    }

    slurZinciriniBitir(ids, bekleyenBag.kayit || {});

    setBekleyenBag(null);
    setAktifArac(null);
    editorDegisti();
  };

  const bagTamamla = (notaId) => {
    if (!bekleyenBag) return;

    if (bekleyenBag.tipModu === 'slur') {
      const ids = bekleyenBag.notaIdler || [];

      if (ids.length > 0 && ids[ids.length - 1] === notaId) {
        slurZinciriniBitir(ids, bekleyenBag.kayit || {});
        setBekleyenBag(null);
        setAktifArac(null);
        editorDegisti();
        return;
      }

      if (ids.includes(notaId)) {
        uyariEkle('slur-warning', 'Bu nota slur seçimine zaten eklenmiş.');
        return;
      }

      setBekleyenBag({
        ...bekleyenBag,
        notaIdler: [...ids, notaId],
      });
      return;
    }

    if (bekleyenBag.tipModu === 'tie') {
      if (!bekleyenBag.basId) {
        setBekleyenBag({
          ...bekleyenBag,
          basId: notaId,
          notaIdler: [notaId],
        });
        return;
      }

      if (bekleyenBag.basId === notaId) {
        setBekleyenBag(null);
        setAktifArac(null);
        return;
      }

      const basId = bekleyenBag.basId;
      const sonId = notaId;
      const bas = notaAl(basId);
      const son = notaAl(sonId);

      if (!bas || !son) {
        uyariEkle('tie-error', 'Tie için iki nota seçilmelidir.');
        setBekleyenBag(null);
        setAktifArac(null);
        return;
      }

      if (!ardisikNotaMi(basId, sonId)) {
        uyariEkle(
          'tie-error',
          'Tie yalnızca bitişik aynı sesler arasında kurulabilir. 1. notayı doğrudan 3. notaya bağlayamazsın.',
        );
        setBekleyenBag(null);
        setAktifArac(null);
        return;
      }

      if (!ayniSesMi(bas, son)) {
        uyariEkle(
          'tie-error',
          'Tie yalnızca aynı nota, aynı oktav ve aynı aksidental arasında kurulabilir.',
        );
        setBekleyenBag(null);
        setAktifArac(null);
        return;
      }

      const yeniBag = {
        id: `bag-${idRef.current++}`,
        tip: 'tie',
        mode: 'single',
        basId,
        sonId,
        notaIdler: [basId, sonId],
        kayit: {
          ...(bekleyenBag.kayit || {}),
          tip: 'tie',
          ad: bekleyenBag.kayit?.ad || 'Tie / uzatma bağı',
        },
      };

      setMuzikBaglar((onceki) => [...onceki, yeniBag]);
      editorDegisti();

      setBekleyenBag(null);
      setAktifArac(null);
      return;
    }
  };

  const ifadeEkle = () => {
    const t = String(ifadeGirisi || '').trim();
    if (!t) return;

    const hucreler = [
      [3, 4, 5],
      ...muzikKontraksiyonsuzMetinHucreleri(t),
    ];

    const oge = {
      id: yeniId(),
      tip: 'wordExpression',
      ad: `İfade: ${t}`,
      metin: t,
      gorunum: `>${t}`,
      hucreler,
      requiresNextNoteOctave: true,
      aciklama: 'Word-sign + kontraksiyonsuz braille. Sonraki nota oktav alır.',
    };
    setMuzikOgeleri((onceki) => [...onceki, oge]);
    setIfadeGirisi('');
    setSeciliOgeId(oge.id);
    setSonEklenenOgeId(oge.id);
    editorDegisti();
  };

  const tupletOranTahmin = (ad) => {
    const lower = String(ad || '').toLowerCase();
    if (/üçleme|triplet/.test(lower)) return { played: 3, inTimeOf: 2 };
    if (/ikileme|duplet/.test(lower)) return { played: 2, inTimeOf: 3 };
    if (/dörtleme|quadruplet/.test(lower)) return { played: 4, inTimeOf: 6 };
    if (/beşleme|quintuplet/.test(lower)) return { played: 5, inTimeOf: 4 };
    if (/altılama|sextuplet/.test(lower)) return { played: 6, inTimeOf: 4 };
    if (/yedileme|septuplet/.test(lower)) return { played: 7, inTimeOf: 4 };
    return { played: 3, inTimeOf: 2 };
  };

  const tupletBaslat = (kayit) => {
    setBekleyenTuplet({ kayit, ratio: tupletOranTahmin(kayit.ad), notaIdler: [] });
    setAktifKategori(null);
  };

  const tupletTamamla = () => {
    if (!bekleyenTuplet || (bekleyenTuplet.notaIdler?.length || 0) < 2) { setBekleyenTuplet(null); return; }
    setMuzikTupletler((onceki) => [...onceki, {
      id: `tuplet-${idRef.current++}`,
      ratio: bekleyenTuplet.ratio,
      kayit: bekleyenTuplet.kayit,
      notaIdler: [...bekleyenTuplet.notaIdler],
    }]);
    setBekleyenTuplet(null);
    editorDegisti();
  };

  const tupletEkle = (notaId) => {
    if (!bekleyenTuplet) return;
    const ids = bekleyenTuplet.notaIdler || [];
    if (ids.length > 0 && ids[ids.length - 1] === notaId) { tupletTamamla(); return; }
    setBekleyenTuplet({ ...bekleyenTuplet, notaIdler: [...ids, notaId] });
  };

  const barlineTiklandi = (oge, event, yerlesim = null) => {
    event?.stopPropagation?.();
    if (event?.preventDefault) event.preventDefault();
    if (!oge?.id) return;

    const gercekIdSet = new Set((muzikOgeleri || []).map((item) => item.id));

    let insertAfterId = gercekIdSet.has(oge.id) ? oge.id : null;

    if (!insertAfterId) {
      const tamamlanmisIndex = (muzikOgeleriOlcuTamamlanmis || [])
        .findIndex((item) => item.id === oge.id);

      if (tamamlanmisIndex >= 0) {
        for (let i = tamamlanmisIndex - 1; i >= 0; i -= 1) {
          const aday = muzikOgeleriOlcuTamamlanmis[i];
          if (!aday?.id) continue;
          if (aday.tip === 'anahtar') continue;
          if (aday.autoRest || aday.otomatik) continue;
          if (aday.autoBarline || aday.otomatikOlcuCizgisi) continue;
          if (gercekIdSet.has(aday.id)) {
            insertAfterId = aday.id;
            break;
          }
        }
      }
    }

    setBarlineMenu({
      ogeId: oge.id,
      insertAfterId,
      measureIndex: yerlesim?.measureIndex ?? null,
      x: event?.clientX || 120,
      y: event?.clientY || 120,
    });

    setSeciliOgeId(null);
    setPopupAcik(false);
  };

  const inlineDegisimleriNormalizeEt = (liste) => {
    const sonuc = [];
    const kullanildi = new Set();

    const inlineMi = (oge) => (
      oge?.tip === 'keySignatureChange' ||
      oge?.tip === 'timeSignatureChange'
    );

    const inlineSira = (oge) => {
      if (oge?.tip === 'keySignatureChange') return 1;
      if (oge?.tip === 'timeSignatureChange') return 2;
      return 99;
    };

    const ayniKaynakMi = (a, b) => {
      if (!a?.inlineSource || !b?.inlineSource) return false;

      return (
        a.inlineSource.insertAfterId === b.inlineSource.insertAfterId &&
        a.inlineSource.measureIndex === b.inlineSource.measureIndex
      );
    };

    for (let i = 0; i < liste.length; i += 1) {
      const oge = liste[i];

      if (kullanildi.has(oge?.id)) {
        continue;
      }

      sonuc.push(oge);

      if (!oge?.id) {
        continue;
      }

      const bagliInlineOgeler = liste
        .filter((aday) => (
          inlineMi(aday) &&
          !kullanildi.has(aday.id) &&
          aday.inlineSource?.insertAfterId === oge.id
        ))
        .sort((a, b) => inlineSira(a) - inlineSira(b));

      const tekil = [];

      for (const inlineOge of bagliInlineOgeler) {
        const ayniTipIndex = tekil.findIndex((x) => x.tip === inlineOge.tip);

        if (ayniTipIndex >= 0) {
          // Aynı ölçü çizgisi için aynı tipten birden fazla varsa sonuncusu geçerli olsun.
          tekil[ayniTipIndex] = inlineOge;
        } else {
          tekil.push(inlineOge);
        }

        kullanildi.add(inlineOge.id);
      }

      tekil
        .sort((a, b) => inlineSira(a) - inlineSira(b))
        .forEach((inlineOge) => sonuc.push(inlineOge));
    }

    return sonuc.filter((oge, index, arr) => {
      if (!inlineMi(oge)) return true;

      const oncekiAyniKaynakAyniTip = arr.findIndex((aday) => (
        aday !== oge &&
        aday?.tip === oge.tip &&
        ayniKaynakMi(aday, oge)
      ));

      return oncekiAyniKaynakAyniTip < 0 || arr[oncekiAyniKaynakAyniTip] === oge;
    });
  };

  const inlineTimeSignatureEkle = (barlineIdOrMenu, secilenZaman) => {
    const temizZaman = String(secilenZaman || '').trim();
    if (!temizZaman) return;

    const hedefMenu = typeof barlineIdOrMenu === 'object' && barlineIdOrMenu
      ? barlineIdOrMenu
      : barlineMenu;

    const insertAfterId = hedefMenu?.insertAfterId || null;
    const barlineId = typeof barlineIdOrMenu === 'string'
      ? barlineIdOrMenu
      : hedefMenu?.ogeId;

    const sourceMeasureIndex = Number.isFinite(hedefMenu?.measureIndex)
      ? hedefMenu.measureIndex
      : null;

    const hucreler = muzikTimeSignatureHucreleri(temizZaman);
    const expectedDuration16 = muzikTimeSigExpected16(temizZaman);

    const yeniTimeSignature = {
      ad: temizZaman,
      gorunum: temizZaman,
      expectedDuration16,
      hucreler,
    };

    setMuzikOgeleri((onceki) => {
      let idx = -1;
      if (insertAfterId) {
        idx = onceki.findIndex((oge) => oge.id === insertAfterId);
      }

      if (idx < 0 && barlineId) {
        idx = onceki.findIndex((oge) => oge.id === barlineId);
      }

      if (idx < 0) {
        idx = onceki.length - 1;
      }

      const sonraki = [...onceki];

      // Sadece aynı ölçü çizgisinden daha önce eklenmiş zaman imzasını güncelle.
      // Farklı ölçü çizgisine tıklanmışsa yeni zaman imzası eklenir.
      const mevcutAyniCizgiIndex = sonraki.findIndex((oge) => (
        oge?.tip === 'timeSignatureChange'
        && oge.inlineSource?.barlineId === barlineId
        && oge.inlineSource?.measureIndex === sourceMeasureIndex
      ));

      if (mevcutAyniCizgiIndex >= 0) {
        sonraki[mevcutAyniCizgiIndex] = {
          ...sonraki[mevcutAyniCizgiIndex],
          ad: temizZaman,
          gorunum: temizZaman,
          hucreler,
          timeSignature: yeniTimeSignature,
          inlineSource: {
            barlineId,
            insertAfterId,
            measureIndex: sourceMeasureIndex,
          },
        };
      } else {
        const yeniOge = {
          id: yeniId(),
          tip: 'timeSignatureChange',
          ad: temizZaman,
          gorunum: temizZaman,
          hucreler,
          timeSignature: yeniTimeSignature,
          inlineSource: {
            barlineId,
            insertAfterId,
            measureIndex: sourceMeasureIndex,
          },
          aciklama: 'Parça içi zaman imzası değişikliği',
        };

        sonraki.splice(idx + 1, 0, yeniOge);
      }

      const normalizeEdilmis = inlineDegisimleriNormalizeEt(sonraki);
      return normalizeEdilmis;
    });

    setBarlineMenu(null);
    editorDegisti();
  };

  const inlineKeySignatureEkle = (barlineIdOrMenu, secilenDonanim) => {
    const hedefMenu = typeof barlineIdOrMenu === 'object' && barlineIdOrMenu
      ? barlineIdOrMenu
      : barlineMenu;

    const insertAfterId = hedefMenu?.insertAfterId || null;
    const barlineId = typeof barlineIdOrMenu === 'string'
      ? barlineIdOrMenu
      : hedefMenu?.ogeId;

    const sourceMeasureIndex = Number.isFinite(hedefMenu?.measureIndex)
      ? hedefMenu.measureIndex
      : null;

    const donanimYok = !secilenDonanim;

    const ad = donanimYok ? 'Naturel donanım' : secilenDonanim.ad;
    const gorunum = donanimYok
      ? '♮'
      : (secilenDonanim.gorunum || secilenDonanim.sembol || secilenDonanim.ad);

    const hucreler = donanimYok
      ? []
      : muzikKeySignatureHucreleri(secilenDonanim);

    const yeniKeySignature = {
      ad,
      gorunum,
      hucreler,
    };

    setMuzikOgeleri((onceki) => {
      let idx = -1;

      if (insertAfterId) {
        idx = onceki.findIndex((oge) => oge.id === insertAfterId);
      }

      if (idx < 0 && barlineId) {
        idx = onceki.findIndex((oge) => oge.id === barlineId);
      }

      if (idx < 0) {
        idx = onceki.length - 1;
      }

      const sonraki = [...onceki];

      const mevcutAyniCizgiIndex = sonraki.findIndex((oge) => (
        oge?.tip === 'keySignatureChange'
        && oge.inlineSource?.barlineId === barlineId
        && oge.inlineSource?.measureIndex === sourceMeasureIndex
      ));

      if (mevcutAyniCizgiIndex >= 0) {
        sonraki[mevcutAyniCizgiIndex] = {
          ...sonraki[mevcutAyniCizgiIndex],
          ad,
          gorunum,
          hucreler,
          keySignature: yeniKeySignature,
          inlineSource: {
            barlineId,
            insertAfterId,
            measureIndex: sourceMeasureIndex,
          },
        };
      } else {
        const yeniOge = {
          id: yeniId(),
          tip: 'keySignatureChange',
          ad,
          gorunum,
          hucreler,
          keySignature: yeniKeySignature,
          inlineSource: {
            barlineId,
            insertAfterId,
            measureIndex: sourceMeasureIndex,
          },
        };

        sonraki.splice(idx + 1, 0, yeniOge);
      }

      const normalizeEdilmis = inlineDegisimleriNormalizeEt(sonraki);
      return normalizeEdilmis;
    });

    setBarlineMenu(null);
    editorDegisti();
  };

  const barlineOgesiOlustur = (tip, mevcut = null) => {
    const baseId = mevcut?.id || yeniId();

    const map = {
      barline: {
        tip: 'barline',
        ad: 'Normal ölçü çizgisi',
        gorunum: '|',
        hucreler: [[]],
      },
      sectionalBarline: {
        tip: 'sectionalBarline',
        ad: 'Bölüm sonu çizgisi',
        gorunum: '𝄁',
        hucreler: [[1, 2, 6], [1, 3]],
      },
      finalBarline: {
        tip: 'finalBarline',
        ad: 'Bitiş çizgisi',
        gorunum: '𝄂',
        hucreler: [[1, 2, 6], [1, 3]],
      },
      beginRepeat: {
        tip: 'beginRepeat',
        ad: 'Tekrar başlangıcı',
        gorunum: '𝄆',
        hucreler: [[1, 2, 6], [2, 3, 5, 6]],
      },
      endRepeat: {
        tip: 'endRepeat',
        ad: 'Tekrar sonu',
        gorunum: '𝄇',
        hucreler: [[1, 2, 6], [2, 3, 5, 6]],
      },
    };

    const secilen = map[tip] || map.barline;

    return {
      ...mevcut,
      ...secilen,
      id: baseId,
      autoBarline: false,
      otomatikOlcuCizgisi: false,
    };
  };

  const olcuCizgisiniDegistir = (barlineMenuOrId, yeniTip) => {
    const hedefMenu = typeof barlineMenuOrId === 'object' && barlineMenuOrId
      ? barlineMenuOrId
      : barlineMenu;

    const barlineId = typeof barlineMenuOrId === 'string'
      ? barlineMenuOrId
      : hedefMenu?.ogeId;

    const insertAfterId = hedefMenu?.insertAfterId || null;

    setMuzikOgeleri((onceki) => {
      let idx = -1;

      if (barlineId) {
        idx = onceki.findIndex((oge) => oge.id === barlineId);
      }

      if (idx >= 0) {
        const mevcut = onceki[idx];
        const sonraki = [...onceki];
        sonraki[idx] = barlineOgesiOlustur(yeniTip, mevcut);
        return sonraki;
      }

      // Tıklanan çizgi otomatik çizgiyse gerçek state içinde yoktur.
      // Bu durumda insertAfterId'den sonra manuel çizgi ekleriz.
      if (insertAfterId) {
        const afterIdx = onceki.findIndex((oge) => oge.id === insertAfterId);

        if (afterIdx >= 0) {
          const yeniBarline = barlineOgesiOlustur(yeniTip);

          const sonraki = [
            ...onceki.slice(0, afterIdx + 1),
            yeniBarline,
            ...onceki.slice(afterIdx + 1),
          ];

          return sonraki;
        }
      }

      return onceki;
    });

    setBarlineMenu(null);
    editorDegisti();
  };

  const olcuCizgisiniSil = (barlineMenuOrId) => {
    const hedefMenu = typeof barlineMenuOrId === 'object' && barlineMenuOrId
      ? barlineMenuOrId
      : barlineMenu;

    const barlineId = typeof barlineMenuOrId === 'string'
      ? barlineMenuOrId
      : hedefMenu?.ogeId;

    if (!barlineId) {
      setBarlineMenu(null);
      return;
    }

    setMuzikOgeleri((onceki) => onceki.filter((oge) => oge.id !== barlineId));

    setBarlineMenu(null);
    editorDegisti();
  };

  const ogeEditorIdAl = (oge) => (
    oge?.editorId ||
    oge?.sourceId ||
    oge?.kaynakOgeId ||
    oge?.ogeId ||
    oge?.meta?.ogeId ||
    oge?.kaynakToken?.ogeId ||
    oge?.kaynakReaderItem?.editorId ||
    oge?.kaynakReaderItem?.sourceId ||
    oge?.kaynakReaderItem?.ogeId ||
    oge?.kaynakReaderItem?.id ||
    oge?.id ||
    null
  );

  const editorEslesebilirOgeMi = (oge) => (
    oge &&
    oge.tip !== 'anahtar' &&
    !oge.autoRest &&
    !oge.otomatik &&
    !oge.autoBarline &&
    !oge.otomatikOlcuCizgisi
  );

  const ayniEditorTipGrubuMu = (readerOge, editorOge) => {
    if (!readerOge || !editorOge) return false;

    if (readerOge.tip === editorOge.tip) return true;

    const barlineTipleri = [
      'barline',
      'finalBarline',
      'sectionalBarline',
      'beginRepeat',
      'endRepeat',
    ];

    if (barlineTipleri.includes(readerOge.tip) && barlineTipleri.includes(editorOge.tip)) {
      return true;
    }

    if (
      readerOge.tip === 'wordExpression' &&
      ['wordExpression', 'expression', 'tempo', 'isaret'].includes(editorOge.tip)
    ) {
      return true;
    }

    return false;
  };

  const editorDegerleriniBindEt = (readerOge, editorOge) => {
    if (!readerOge || !editorOge) return readerOge;

    if (editorOge.tip === 'nota') {
      return {
        ...readerOge,
        id: readerOge.id,
        editorId: editorOge.id,
        sourceId: editorOge.id,
        kaynakOgeId: editorOge.id,
        sureIndeksi: editorOge.sureIndeksi,
        notaAd: editorOge.notaAd,
        oktav: guvenliOktavAl(editorOge.oktav, varsayilanGuvenliOktavAl()),
        accidental: editorOge.accidental,
        dotted: Boolean(editorOge.dotted),
        modifiers: editorOge.modifiers,
        importKaynak: readerOge.importKaynak,
        kaynakReaderItem: readerOge.kaynakReaderItem,
        readerSureIndeksi: readerOge.readerSureIndeksi,
        readerSureAd: readerOge.readerSureAd,
        readerRealValue: readerOge.readerRealValue,
      };
    }

    if (editorOge.tip === 'sus') {
      return {
        ...readerOge,
        id: readerOge.id,
        editorId: editorOge.id,
        sourceId: editorOge.id,
        kaynakOgeId: editorOge.id,
        sureIndeksi: editorOge.sureIndeksi,
        dotted: Boolean(editorOge.dotted),
        importKaynak: readerOge.importKaynak,
        kaynakReaderItem: readerOge.kaynakReaderItem,
        readerSureIndeksi: readerOge.readerSureIndeksi,
        readerSureAd: readerOge.readerSureAd,
        readerRealValue: readerOge.readerRealValue,
      };
    }

    return {
      ...readerOge,
      ...editorOge,
      id: readerOge.id,
      editorId: editorOge.id,
      sourceId: editorOge.id,
      kaynakOgeId: editorOge.id,
      kaynakReaderItem: readerOge.kaynakReaderItem,
    };
  };

  const readerSkorOgelerineEditorIdBagla = (readerOgeler = [], editorOgeler = []) => {
    const editorAdaylari = (editorOgeler || []).filter(editorEslesebilirOgeMi);
    const kullanilanEditorIdler = new Set();

    return (readerOgeler || []).map((readerOge) => {
      if (!readerOge) return readerOge;

      const mevcutEditorId =
        readerOge.editorId ||
        readerOge.sourceId ||
        readerOge.kaynakOgeId ||
        readerOge.ogeId ||
        readerOge.meta?.ogeId ||
        readerOge.kaynakReaderItem?.editorId ||
        readerOge.kaynakReaderItem?.sourceId ||
        readerOge.kaynakReaderItem?.ogeId ||
        null;

      if (mevcutEditorId) {
        const editorOge = editorOgeler.find((o) => o.id === mevcutEditorId);
        if (editorOge) {
          return editorDegerleriniBindEt(readerOge, editorOge);
        }
      }

      const eslesenEditor = editorAdaylari.find((editorOge) => (
        !kullanilanEditorIdler.has(editorOge.id) &&
        ayniEditorTipGrubuMu(readerOge, editorOge)
      ));

      if (!eslesenEditor) {
        return readerOge;
      }

      kullanilanEditorIdler.add(eslesenEditor.id);

      return editorDegerleriniBindEt(readerOge, eslesenEditor);
    });
  };

  const notaTiklandi = (oge, event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    if (!oge) return;

    const editId = ogeEditorIdAl(oge);
    const idToSelect = editId || oge.id;

    if (bekleyenModifier && oge.tip === 'nota') { modifierUygula({ ...oge, id: idToSelect }); return; }
    if (bekleyenBag && oge.tip === 'nota') { bagTamamla(idToSelect); return; }
    if (bekleyenTuplet && oge.tip === 'nota') { tupletEkle(idToSelect); return; }

    setSeciliOgeId(idToSelect);
    setSeciliBagId(null);
    setPopupAcik(true);
  };

  const seciliOgeyiGuncelle = (patch) => {
    const hedefId = seciliEditorOgeId || seciliOgeId;
    if (!patch || !hedefId) return;

    if (seciliOge?.tip === 'nota' || seciliOge?.tip === 'sus') {
      seciliNotayiGuncelle(patch);
      return;
    }

    setMuzikOgeleri((onceki) => onceki.map((og) => {
      if (og.id !== hedefId) return og;

      const patched = { ...og };
      if (patch.ad !== undefined) patched.ad = patch.ad;
      if (patch.gorunum !== undefined) patched.gorunum = patch.gorunum;

      if (og.tip === 'timeSignatureChange') {
        if (patch.timeSignature !== undefined) patched.timeSignature = patch.timeSignature;
      }

      if (og.tip === 'keySignatureChange') {
        if (patch.keySignature !== undefined) patched.keySignature = patch.keySignature;
      }

      return patched;
    }));
    editorDegisti();
  };

  const seciliNotayiGuncelle = (patch) => {
    const hedefId = seciliEditorOgeId || seciliOgeId;
    if (!hedefId) return;

    if (patch?.oktav !== undefined && Number.isFinite(Number(patch.oktav))) {
      setSonKullanilanOktav(Number(patch.oktav));
    }

    setMuzikOgeleri((onceki) => onceki.map((og) => {
      if (og.id !== hedefId) return og;

      if (og.tip === 'nota') {
        const notaAd = patch.notaAd ?? og.notaAd;
        const sureIndeksi = patch.sureIndeksi ?? og.sureIndeksi;
        const yeniOktav = guvenliOktavAl(
          patch.oktav ?? og.oktav,
          varsayilanGuvenliOktavAl(),
        );
        return muzikNotaSkorOgesi(og.id, notaAd, sureIndeksi, {
          oktav: yeniOktav,
          accidental: patch.accidental !== undefined ? patch.accidental : og.accidental,
          dotted: patch.dotted !== undefined ? patch.dotted : og.dotted,
          modifiers: og.modifiers,
        });
      }

      if (og.tip === 'sus') {
        const sureIndeksi = patch.sureIndeksi ?? og.sureIndeksi;
        return {
          ...muzikSusSkorOgesi(og.id, sureIndeksi, {
            dotted: patch.dotted !== undefined ? patch.dotted : og.dotted,
          }),
          importKaynak: og.importKaynak,
          kaynakReaderItem: og.kaynakReaderItem,
        };
      }

      return og;
    }));
    editorDegisti();
  };

  const seciliOgeyiSil = () => {
    const hedefId = seciliEditorOgeId || seciliOgeId;
    if (!hedefId) return;
    setMuzikOgeleri((onceki) => onceki.filter((og) => og.id !== hedefId));
    setMuzikBaglar((onceki) => onceki.filter((b) => (
      b.basId !== hedefId &&
      b.sonId !== hedefId &&
      !(Array.isArray(b.notaIdler) && b.notaIdler.includes(hedefId))
    )));
    setSeciliOgeId(null);
    setPopupAcik(false);
    editorDegisti();
  };

  const seciliNotayiSusaCevir = () => {
    const hedefId = seciliEditorOgeId || seciliOgeId;
    if (!hedefId) return;

    setMuzikOgeleri((onceki) => onceki.map((og) => {
      if (og.id !== hedefId || og.tip !== 'nota') return og;

      return {
        ...muzikSusSkorOgesi(og.id, og.sureIndeksi ?? seciliSureIdx, {
          dotted: Boolean(og.dotted),
        }),
        importKaynak: og.importKaynak,
        kaynakOncekiOge: og,
      };
    }));
    editorDegisti();

    setMuzikBaglar((onceki) => onceki.filter((bag) => (
      bag.basId !== hedefId &&
      bag.sonId !== hedefId &&
      !(Array.isArray(bag.notaIdler) && bag.notaIdler.includes(hedefId))
    )));
  };

  const seciliSusuNotayaCevir = (notaAd = 'do') => {
    const hedefId = seciliEditorOgeId || seciliOgeId;
    if (!hedefId) return;

    const varsayilanOktav = Number.isFinite(Number(sonKullanilanOktav))
      ? guvenliOktavAl(sonKullanilanOktav, varsayilanGuvenliOktavAl())
      : varsayilanGuvenliOktavAl();

    setMuzikOgeleri((onceki) => onceki.map((og) => {
      if (og.id !== hedefId || og.tip !== 'sus') return og;

      return {
        ...muzikNotaSkorOgesi(og.id, notaAd, og.sureIndeksi ?? seciliSureIdx, {
          oktav: varsayilanOktav,
          dotted: Boolean(og.dotted),
        }),
        importKaynak: og.importKaynak,
        kaynakOncekiOge: og,
      };
    }));
    editorDegisti();

    setSonKullanilanOktav(varsayilanOktav);
  };

  const susEkle = () => {
    const oge = muzikSusSkorOgesi(yeniId(), seciliSureIdx);

    setMuzikOgeleri((onceki) => [
      ...onceki,
      oge,
    ]);

    setSeciliOgeId(oge.id);
    setSonEklenenOgeId(oge.id);
    editorDegisti();
  };

  const notaSuresiniCiftTiklaDegistir = (oge, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!oge?.id || oge.tip !== 'nota') return;

    const mevcutIdx = Number.isInteger(oge.sureIndeksi) ? oge.sureIndeksi : 0;
    const sureSayisi = Array.isArray(MUZIK_SURE_GOSTERGELERI)
      ? MUZIK_SURE_GOSTERGELERI.length
      : 0;

    if (sureSayisi <= 0) return;

    const sonrakiIdx = (mevcutIdx + 1) % sureSayisi;

    setMuzikOgeleri((onceki) => onceki.map((og) => {
      if (og.id !== oge.id || og.tip !== 'nota') return og;

      return muzikNotaSkorOgesi(og.id, og.notaAd, sonrakiIdx, {
        oktav: guvenliOktavAl(og.oktav, varsayilanGuvenliOktavAl()),
        accidental: og.accidental || null,
        dotted: Boolean(og.dotted),
        modifiers: og.modifiers,
      });
    }));
    editorDegisti();

    setSeciliOgeId(oge.id);
    setPopupAcik(false);

    if (Number.isFinite(Number(oge.oktav))) {
      setSonKullanilanOktav(Number(oge.oktav));
    }

    setSeciliSureIdx(sonrakiIdx);
  };

  const sonOgeyiSil = () => {
    setMuzikOgeleri((onceki) => onceki.slice(0, -1));
    setSeciliOgeId(null);
    setSonEklenenOgeId(null);
    editorDegisti();
  };

  const temizle = () => {
    setMuzikOgeleri((onceki) => {
      const mevcutAnahtar = onceki.find((o) => o.tip === 'anahtar');
      if (mevcutAnahtar) return [mevcutAnahtar];
      return MUZIK_EDITOR_VARSAYILAN_ANAHTAR
        ? [{ id: yeniId(), tip: 'anahtar', ad: MUZIK_EDITOR_VARSAYILAN_ANAHTAR.ad, gorunum: MUZIK_EDITOR_VARSAYILAN_ANAHTAR.gorunum, hucreler: MUZIK_EDITOR_VARSAYILAN_ANAHTAR.hucreler }]
        : [];
    });
    setSeciliOgeId(null);
    setSonEklenenOgeId(null);
    setMuzikHeader(varsayilanMuzikHeaderOlustur());
    setBrfHamMetin('');
    setBrfImportKirli(false);
    setBrfOkunurOzet('');
    setBrfOkumaDurumMesaji('');
    setBrfOkumaSonucu(null);
  };


  const brfReaderHeaderOlustur = (readerHeader = {}, fileName = '') => {
    const timeSignatureAd = readerHeader.timeSignature?.gorunum
      || readerHeader.timeSignature?.ad
      || MUZIK_VARSAYILAN_ZAMAN_IMZASI;

    return {
      title: readerHeader.title || '',
      composer: readerHeader.composer || '',
      lyricist: readerHeader.lyricist || '',
      tempo: readerHeader.tempo || '',
      keySignature: readerHeader.keySignature || null,
      timeSignature: {
        ad: timeSignatureAd,
        gorunum: timeSignatureAd,
        expectedDuration16: muzikTimeSigExpected16(timeSignatureAd),
        hucreler: muzikTimeSignatureHucreleri(timeSignatureAd),
      },
      autoCompleteMeasures: false,
      pickupMeasure: false,
      importedFromBrf: true,
      sourceFileName: fileName || '',
    };
  };

  const brfReaderSureIndeksiAl = (item) => {
    if (Number.isInteger(item?.sureIndeksi)) return item.sureIndeksi;

    const realValue = Number(item?.realValue || item?.sureRealValue || item?.durationRealValue);
    if (Number.isFinite(realValue) && realValue > 0) {
      const idx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === realValue);
      if (idx >= 0) return idx;
    }

    const duration16 = Number(item?.duration16 || item?.sure16);
    if (Number.isFinite(duration16) && duration16 > 0) {
      const realFrom16 = 16 / duration16;
      const idx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === realFrom16);
      if (idx >= 0) return idx;
    }

    const sureText = String(item?.sureAd || item?.sure || '').toLocaleLowerCase('tr');
    if (sureText.includes('birlik')) {
      return MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === 1);
    }
    if (sureText.includes('ikilik') || sureText.includes('yarım') || sureText.includes('yarim')) {
      return MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === 2);
    }
    if (sureText.includes('dörtlük') || sureText.includes('dortluk')) {
      return MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === 4);
    }
    if (sureText.includes('sekizlik')) {
      return MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === 8);
    }
    if (sureText.includes('onaltılık') || sureText.includes('on alti') || sureText.includes('16')) {
      return MUZIK_SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === 16);
    }

    return 0;
  };

  const brfReaderBarlineOgesiOlustur = (item, index) => {
    const tip = item?.tip || 'barline';
    const barlineMap = {
      barline: {
        tip: 'barline',
        ad: 'BRF ölçü çizgisi',
        gorunum: '|',
        hucreler: [[]],
      },
      finalBarline: {
        tip: 'finalBarline',
        ad: 'Bitiş çizgisi',
        gorunum: '𝄂',
        hucreler: [[1, 2, 6], [1, 3]],
      },
      sectionalBarline: {
        tip: 'sectionalBarline',
        ad: 'Bölüm sonu çizgisi',
        gorunum: '𝄁',
        hucreler: [[1, 2, 6], [1, 3], [3]],
      },
      endRepeat: {
        tip: 'endRepeat',
        ad: 'Bitiş tekrarı',
        gorunum: '𝄇',
        hucreler: [[1, 2, 6], [2, 3]],
      },
      beginRepeat: {
        tip: 'beginRepeat',
        ad: 'Başlangıç tekrarı',
        gorunum: '𝄆',
        hucreler: [[1, 2, 6], [2, 3, 5, 6]],
      },
    };

    const base = barlineMap[tip] || barlineMap.barline;
    return {
      ...base,
      id: item?.id || `brf-reader-barline-${index}`,
      editorId: item?.editorId || item?.sourceId || item?.ogeId || item?.kaynakOgeId || item?.meta?.ogeId || null,
      sourceId: item?.sourceId || item?.editorId || item?.ogeId || item?.kaynakOgeId || item?.meta?.ogeId || null,
      kaynakOgeId: item?.kaynakOgeId || item?.ogeId || item?.editorId || item?.sourceId || item?.meta?.ogeId || null,
      kind: 'manual',
      auto: false,
      autoBarline: false,
      otomatikOlcuCizgisi: false,
      importKaynak: 'brf-reader',
    };
  };

  const brfReaderIteminiSkorOgesineCevir = (item, index) => {
    if (item?.tip === 'nota') {
      const sureIndeksi = brfReaderSureIndeksiAl(item);
      return {
        ...muzikNotaSkorOgesi(item.id || `brf-reader-note-${index}`, item.notaAd, sureIndeksi, {
          oktav: guvenliOktavAl(item.oktav, varsayilanGuvenliOktavAl()),
          accidental: item.accidental || null,
          dotted: Boolean(item.dotted),
        }),
        importKaynak: 'brf-reader',
        kaynakReaderItem: item,
        editorId: item.editorId || item.sourceId || item.ogeId || item.kaynakOgeId || item.meta?.ogeId || null,
        sourceId: item.sourceId || item.editorId || item.ogeId || item.kaynakOgeId || item.meta?.ogeId || null,
        kaynakOgeId: item.kaynakOgeId || item.ogeId || item.editorId || item.sourceId || item.meta?.ogeId || null,
        readerSureIndeksi: item.sureIndeksi,
        readerSureAd: item.sureAd,
        readerRealValue: item.realValue,
      };
    }

    if (item?.tip === 'sus') {
      const sureIndeksi = brfReaderSureIndeksiAl(item);
      return {
        ...muzikSusSkorOgesi(item.id || `brf-reader-rest-${index}`, sureIndeksi, {
          dotted: Boolean(item.dotted),
        }),
        importKaynak: 'brf-reader',
        kaynakReaderItem: item,
        editorId: item.editorId || item.sourceId || item.ogeId || item.kaynakOgeId || item.meta?.ogeId || null,
        sourceId: item.sourceId || item.editorId || item.ogeId || item.kaynakOgeId || item.meta?.ogeId || null,
        kaynakOgeId: item.kaynakOgeId || item.ogeId || item.editorId || item.sourceId || item.meta?.ogeId || null,
        readerSureIndeksi: item.sureIndeksi,
        readerSureAd: item.sureAd,
        readerRealValue: item.realValue,
      };
    }

    if (['barline', 'finalBarline', 'sectionalBarline', 'endRepeat', 'beginRepeat'].includes(item?.tip)) {
      return brfReaderBarlineOgesiOlustur(item, index);
    }

    return null;
  };

  const brfReaderSonucundanSkorOgeleriAl = (readerResult) => {
    const measures = Array.isArray(readerResult?.measures) ? readerResult.measures : [];
    const ogeler = [];

    measures.forEach((measure, measureIndex) => {
      const measureItems = Array.isArray(measure?.items) ? measure.items : [];

      measureItems.forEach((item) => {
        const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length);
        if (oge) ogeler.push(oge);
      });

      if (measureIndex < measures.length - 1) {
        const son = ogeler[ogeler.length - 1];
        const nextMeasureFirstOge = Array.isArray(measures[measureIndex + 1]?.items)
          ? measures[measureIndex + 1].items[0]
          : null;
        const nextMeasureBeginsWithRepeat = nextMeasureFirstOge?.tip === 'beginRepeat';

        if (
          !['barline', 'finalBarline', 'sectionalBarline', 'beginRepeat', 'endRepeat'].includes(son?.tip)
          && !nextMeasureBeginsWithRepeat
        ) {
          ogeler.push(brfReaderBarlineOgesiOlustur({ tip: 'barline' }, ogeler.length));
        }
      }
    });

    if (ogeler.length === 0) {
      (readerResult?.items || []).forEach((item) => {
        const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length);
        if (oge) ogeler.push(oge);
      });
    }

    return ogeler;
  };

  const canonicalReaderSkorOgeleri = useMemo(() => {
    if (!canonicalEditorReaderResult?.ok || !canonicalEditorReaderResult.result) {
      return [];
    }

    const readerOgeler = brfReaderSonucundanSkorOgeleriAl(canonicalEditorReaderResult.result);
    const editorIdBagliOgeler = readerSkorOgelerineEditorIdBagla(readerOgeler || [], muzikOgeleri);

    return onceAnahtarGarantiEt(editorIdBagliOgeler || []);
  }, [
    canonicalEditorReaderResult?.ok,
    canonicalEditorReaderResult?.result,
    muzikOgeleri,
  ]);

  const canonicalReaderSkorBaglar = useMemo(() => {
    if (!canonicalEditorReaderResult?.ok) return [];
    return Array.isArray(canonicalEditorReaderResult.baglar)
      ? canonicalEditorReaderResult.baglar
      : [];
  }, [
    canonicalEditorReaderResult?.ok,
    canonicalEditorReaderResult?.baglar,
  ]);

  const gorselOgeler = muzikOgeleri;

  const gorselOgeleriOlcuTamamlanmis = useMemo(() => (
    muzikOgeleriOlcuTamamla({
      muzikOgeleri: gorselOgeler,
      muzikHeader,
      muzikSusSkorOgesi,
      sureGostergeleri: MUZIK_SURE_GOSTERGELERI,
    })
  ), [
    gorselOgeler,
    muzikHeader.timeSignature,
    muzikHeader.autoCompleteMeasures,
    muzikHeader.pickupMeasure,
  ]);

  const seciliEditorOgeId = useMemo(() => {
    if (!seciliOgeId) return null;

    const editorDirect = muzikOgeleri.find((o) => o.id === seciliOgeId);
    if (editorDirect) return editorDirect.id;

    const gorselOge = gorselOgeler.find((o) => (
      o.id === seciliOgeId ||
      o.editorId === seciliOgeId ||
      o.sourceId === seciliOgeId ||
      o.kaynakOgeId === seciliOgeId ||
      o.ogeId === seciliOgeId ||
      o.kaynakReaderItem?.id === seciliOgeId ||
      o.kaynakReaderItem?.ogeId === seciliOgeId ||
      o.kaynakReaderItem?.sourceId === seciliOgeId ||
      o.kaynakReaderItem?.editorId === seciliOgeId
    ));

    const candidateId = ogeEditorIdAl(gorselOge);
    if (candidateId && muzikOgeleri.some((o) => o.id === candidateId)) {
      return candidateId;
    }

    return null;
  }, [seciliOgeId, muzikOgeleri, gorselOgeler]);

  const seciliOge = useMemo(() => {
    if (!seciliOgeId) return null;

    if (seciliEditorOgeId) {
      return muzikOgeleri.find((o) => o.id === seciliEditorOgeId) || null;
    }

    return gorselOgeler.find((o) => (
      o.id === seciliOgeId ||
      o.editorId === seciliOgeId ||
      o.sourceId === seciliOgeId ||
      o.kaynakOgeId === seciliOgeId ||
      o.ogeId === seciliOgeId ||
      o.kaynakReaderItem?.id === seciliOgeId ||
      o.kaynakReaderItem?.ogeId === seciliOgeId ||
      o.kaynakReaderItem?.sourceId === seciliOgeId ||
      o.kaynakReaderItem?.editorId === seciliOgeId
    )) || null;
  }, [seciliOgeId, seciliEditorOgeId, muzikOgeleri, gorselOgeler]);

  const gorselBaglar = canonicalReaderSkorBaglar.length > 0
    ? canonicalReaderSkorBaglar
    : muzikBaglar;

  const gorselKaynakReaderMi = canonicalReaderSkorOgeleri.length > 0;

  const brfDosyasiYukle = async (file) => {
    if (!file) return;

    const rawBrfText = await file.text();
    setBrfHamMetin(rawBrfText || '');
    setBrfImportKirli(false);

    try {
      const readerResult = brfMuzikOku(rawBrfText);
      const header = brfReaderHeaderOlustur(readerResult.header || {}, file.name || '');
      const skorOgeleri = brfReaderSonucundanSkorOgeleriAl(readerResult);
      const importedOgeler = onceAnahtarGarantiEt(skorOgeleri);
      const skorIdSet = new Set(importedOgeler.map((o) => o.id));
      const baglar = Array.isArray(readerResult.baglar) ? readerResult.baglar : [];
      const temizBaglar = baglar.filter((bag) => {
        const basOk = !bag?.basId || skorIdSet.has(bag.basId);
        const sonOk = !bag?.sonId || skorIdSet.has(bag.sonId);
        const notaIdsOk = !Array.isArray(bag?.notaIdler) || bag.notaIdler.every((id) => skorIdSet.has(id));
        return basOk && sonOk && notaIdsOk;
      });
      const eksikBaglar = baglar.filter((bag) => !temizBaglar.includes(bag));
      if (eksikBaglar.length) {
        console.warn('BRF reader imported bags were dropped due to missing score ids', eksikBaglar.map((bag) => ({
          id: bag.id,
          tip: bag.tip,
          basId: bag.basId,
          sonId: bag.sonId,
          notaIdler: bag.notaIdler,
        })));
      }
      const okunurMetin = readerResult.readableText || muzikOgeleriOlcuOlcuOkunurMetinAl(skorOgeleri, header);
      const parseBasarisiz = skorOgeleri.length === 0;

      setMuzikHeader((onceki) => ({
        ...onceki,
        ...header,
      }));

      setMuzikOgeleri(importedOgeler);
      setMuzikBaglar(temizBaglar);
      setMuzikTupletler([]);
      setBrfOkunurOzet(okunurMetin);
      setBrfOkumaSonucu(readerResult);
      setBrfOkumaDurumMesaji(parseBasarisiz
        ? 'BRF ham olarak okundu ancak müzik notalarına çözümlenemedi.'
        : '');
      setMuzikUyarilari((readerResult.warnings || []).map((warning) => ({
        type: warning.type || 'brf-reader-warning',
        message: warning.message || String(warning),
      })));

      setSeciliOgeId(null);
      setSonEklenenOgeId(null);
      setPopupAcik(false);
      setAnahtarPopupAcik(false);
      setBekleyenBag(null);
      setBekleyenModifier(null);
      setBekleyenTuplet(null);
      setAktifArac(null);
    } catch (error) {
      setBrfOkumaDurumMesaji('BRF ham olarak okundu ancak müzik notalarına çözümlenemedi.');
      setBrfOkunurOzet('');
      setBrfOkumaSonucu(null);
      setMuzikUyarilari((onceki) => [
        ...(Array.isArray(onceki) ? onceki : []),
        {
          type: 'brf-import-error',
          message: `BRF dosyasi okunamadi: ${error?.message || error}`,
        },
      ]);
    }
  };

  const setTimeSignature = (deger) => {
    const kullanilacakDeger = deger || MUZIK_VARSAYILAN_ZAMAN_IMZASI;
    const exp = muzikTimeSigExpected16(kullanilacakDeger);
    const hucreler = muzikTimeSignatureHucreleri(kullanilacakDeger);

    const yeniHeader = {
      ad: kullanilacakDeger,
      gorunum: kullanilacakDeger,
      expectedDuration16: exp,
      hucreler,
    };

    setMuzikHeader((h) => ({
      ...h,
      timeSignature: yeniHeader,
    }));

    setMuzikOgeleri((onceki) => onceki.filter((oge) => !otomatikOlcuCizgisiStateOgesiMi(oge)));
    editorDegisti();
  };

  const {
    svgCizilecekOgeler,
    svgBeamGruplari,
    svgBeamGrupHaritasi,
    muzikSatirlar,
    muzikSatirOlculeri,
    svgYerlesimHaritasi,
    svgGlobalIndexBul,
    ogeXHesapla,
    satirIcindeBeamliMi,
    ilkSatirHeaderBilgisi,
  } = useMusicScoreLayout({
    muzikOgeleriOlcuTamamlanmis,
    muzikHeader,
    sureGostergeleri: MUZIK_SURE_GOSTERGELERI,
  });

  const {
    cevirSonuc,
    hucreler,
    brfExportMetni,
    canonicalBrfText,
    tekBrfMetni,
    hamBrfMetni,
    exportBrfMetni,
    copyBrfMetni,
    hucreAnlamlari,
    brailleSatirlari,
    olcuBrailleSonuclari,
    satirBrailleLejantlari,
    satirBrailleLejantMaplari,
    skorUstuHeaderSatirlari,
    baslangicBrailleBilgisi,
    baslangicBrailleLejantlari,
    baslangicBrailleLejantMapi,
    gorunenSatirBrailleLejantlari,
    gorunenSatirBrailleLejantMaplari,
    canonicalReadableText,
    headerGosterimKartlari,
  } = useBrailleOutput({
    muzikOgeleriOlcuTamamlanmis,
    muzikBaglar,
    muzikHeader,
    muzikTupletler,
    muzikSatirOlculeri,
    mevcutAnahtar,
    anahtarGlyphAl,
    includeBarNumbers,
    canonicalEditorBrfText,
    canonicalEditorBrfResult,
    canonicalEditorReaderResult,
  });

  const brfOkunurOzetGosterim = useMemo(() => {
    if (brfOkunurOzet) return brfOkunurOzet;
    if (canonicalReadableText) return canonicalReadableText;
    if (!brfHamMetin) return '';

    return muzikOgeleriOlcuOlcuOkunurMetinAl(
      (muzikOgeleri || []).filter((oge) => oge?.tip !== 'anahtar'),
      muzikHeader || {},
    );
  }, [brfOkunurOzet, brfHamMetin, muzikOgeleri, muzikHeader]);

  const aktifBrfKaynakMetni = brfHamMetin && !brfImportKirli
    ? brfHamMetin
    : canonicalEditorBrfText || '';
  const aktifReaderResult = brfOkumaSonucu || canonicalEditorReaderResult.result || null;

  const indirilecekGuncelBrfMetni =
    canonicalEditorBrfText ||
    exportBrfMetni ||
    tekBrfMetni ||
    brfExportMetni ||
    brfHamMetin ||
    '';

  const gosterilecekHamBrfMetni = brfHamMetin || '';

  return {
    muzikOgeleri,
    muzikBaglar,
    muzikTupletler,
    aktifKategori,
    aktifArac,
    bekleyenModifier,
    bekleyenBag,
    popupAcik,
    anahtarPopupAcik,
    ifadeGirisi,
    bekleyenTuplet,
    muzikHeader,
    muzikUyarilari,
    seciliSureIdx,
    seciliOgeId,
    sonEklenenOgeId,
    hoverBrailleOgeId,
    seciliBagId,
    hoverBrailleBagId,
    hoverCizgiBagId,
    adimSure,
    muzikOgeleriOlcuTamamlanmis,
    mevcutAnahtar,
    anahtarGlyphAl,
    svgCizilecekOgeler,
    svgBeamGruplari,
    svgBeamGrupHaritasi,
    muzikSatirlar,
    muzikSatirOlculeri,
    svgYerlesimHaritasi,
    svgGlobalIndexBul,
    ogeXHesapla,
    satirIcindeBeamliMi,
    ilkSatirHeaderBilgisi,
    cevirSonuc,
    hucreler,
    brfExportMetni: exportBrfMetni || tekBrfMetni || brfExportMetni,
    canonicalBrfText,
    tekBrfMetni,
    hamBrfMetni: hamBrfMetni || tekBrfMetni || canonicalBrfText || brfExportMetni,
    exportBrfMetni: exportBrfMetni || tekBrfMetni || brfExportMetni,
    copyBrfMetni: copyBrfMetni || tekBrfMetni || canonicalBrfText || brfExportMetni,
    brfHamMetin,
    gosterilecekHamBrfMetni,
    brfImportKirli,
    aktifBrfKaynakMetni,
    indirilecekGuncelBrfMetni,
    brfOkunurOzet: brfOkunurOzetGosterim,
    editorCanonicalOkunurOzet: canonicalReadableText,
    brfOkumaDurumMesaji,
    brfOkumaSonucu,
    aktifReaderResult,
    canonicalEditorBrfResult,
    canonicalEditorBrfText,
    canonicalEditorReaderResult,
    canonicalEditorReader: canonicalEditorReaderResult.result,
    canonicalEditorReaderItems: canonicalEditorReaderResult.items,
    canonicalEditorReaderMeasures: canonicalEditorReaderResult.measures,
    canonicalEditorReaderBaglar: canonicalEditorReaderResult.baglar,
    canonicalEditorReadableText: canonicalEditorReaderResult.readableText,
    canonicalReaderSkorOgeleri,
    canonicalReaderSkorBaglar,
    canonicalReader,
    canonicalReadableText,
    gorselOgeler,
    gorselBaglar,
    hucreAnlamlari,
    brailleSatirlari,
    olcuBrailleSonuclari,
    satirBrailleLejantlari,
    satirBrailleLejantMaplari,
    skorUstuHeaderSatirlari,
    baslangicBrailleBilgisi,
    baslangicBrailleLejantlari,
    baslangicBrailleLejantMapi,
    gorunenSatirBrailleLejantlari,
    gorunenSatirBrailleLejantMaplari,
    headerGosterimKartlari,
    yeniId,
    notaEkle,
    notaEkleKonuma,
    sureSecildi,
    aracTikla,
    aracEkleHandler,
    setAktifKategori,
    setAktifArac,
    isaretEkle,
    anahtariDegistir,
    modifierBaslat,
    modifierUygula,
    bagBaslat,
    slurTamamla,
    bagTamamla,
    ifadeEkle,
    tupletBaslat,
    tupletTamamla,
    tupletEkle,
    notaTiklandi,
    seciliOge,
    seciliEditorOgeId,
    seciliNotayiGuncelle,
    seciliOgeyiGuncelle,
    seciliOgeyiSil,
    seciliNotayiSusaCevir,
    seciliSusuNotayaCevir,
    susEkle,
    sonOgeyiSil,
    temizle,
    brfDosyasiYukle,
    includeBarNumbers,
    setIncludeBarNumbers,
    setTimeSignature,
    setMuzikHeader,
    setMuzikOgeleri,
    setMuzikBaglar,
    setMuzikTupletler,
    setBekleyenModifier,
    setBekleyenBag,
    setPopupAcik,
    setAnahtarPopupAcik,
    barlineMenu,
    setBarlineMenu,
    barlineTiklandi,
    inlineTimeSignatureEkle,
    inlineKeySignatureEkle,
    olcuCizgisiniDegistir,
    olcuCizgisiniSil,
    setIfadeGirisi,
    setBekleyenTuplet,
    setSeciliSureIdx,
    setSeciliOgeId,
    setHoverBrailleOgeId,
    setSeciliBagId,
    setHoverBrailleBagId,
    setHoverCizgiBagId,
    setAdimSure,
    sonKullanilanOktav,
    setSonKullanilanOktav,
    notaSuresiniCiftTiklaDegistir,
  };
}
