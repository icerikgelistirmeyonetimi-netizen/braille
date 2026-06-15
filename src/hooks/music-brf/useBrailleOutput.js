import { useMemo } from 'react';
import {
  muzikSkorunuBrailleyeCevir,
  muzikHucreAnlamiKayittan,
} from '../../utils/music/index.js';
import { scoreToCanonicalBrf } from '../../utils/music-brf/musicCanonicalPipeline.js';
import { MUSIC_CANONICAL_BRF } from '../../utils/music-brf/musicCanonicalFlags.js';
import {
  normalizeBrailleMeaning,
  brailleRowsFromMeasures,
  brailleLejantlariOlustur,
  brailleAnlamOlcuNumarasiMi,
  brailleAnlamOlcuIciIcerikMi,
  brailleLejantEtiketiAl,
  brailleAnlamBagIdAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import {
  brailleMetniOlustur,
  brailleHucreListesiNormalizeEt,
  brailleTemizMetin,
  brailleAnlamMetni,
} from '../../utils/music-brf/brailleText.js';
import { muzikBrfExportMetniOlustur } from '../../utils/music-brf/musicBrfExportEngine.js';

const BASLANGIC_HEADER_LEJANT_KATEGORILERI = new Set([
  'anahtar',
  'tempo',
  'donanim',
  'zaman-imzasi',
]);

function itemOgeIds(oge) {
  return [
    oge?.id,
    oge?.editorId,
    oge?.sourceId,
    oge?.kaynakOgeId,
    oge?.ogeId,
    oge?.meta?.ogeId,
    oge?.kaynakReaderItem?.id,
    oge?.kaynakReaderItem?.ogeId,
    oge?.kaynakReaderItem?.sourceId,
    oge?.kaynakReaderItem?.editorId,
  ].filter(Boolean);
}

function brailleItemOgeIdAl(item) {
  return (
    item?.anlam?.ogeId
    || item?.meta?.ogeId
    || item?.ogeId
    || item?.sourceId
    || item?.editorId
    || item?.kaynakOgeId
    || item?.kaynakReaderItem?.id
    || item?.kaynakReaderItem?.ogeId
    || item?.kaynakReaderItem?.sourceId
    || item?.kaynakReaderItem?.editorId
    || null
  );
}

function overlaydeGosterme(anlam) {
  const kaynak = String(anlam?.kaynak || '').toLowerCase();

  return [
    'bar-number',
    'header-meta',
    'title',
    'composer',
    'tempo',
    'key-signature',
    'time-signature',
  ].includes(kaynak);
}

function brailleHucreleriniSkorOlculerineDagit({
  hucreler = [],
  anlamlar = [],
  skorSatirlari = [],
}) {
  const hucreItems = hucreler.map((hucre, index) => ({
    index,
    hucre,
    anlam: anlamlar[index] || null,
  }));

  return (skorSatirlari || []).map((satirOlculeri, satirIdx) => {
    const measures = satirOlculeri || [];

    return measures.map((measure, measureIdx) => {
      const itemIds = new Set();

      (measure.itemIds || []).forEach((id) => {
        if (id) itemIds.add(id);
      });

      (measure.items || []).forEach((oge) => {
        itemOgeIds(oge).forEach((id) => itemIds.add(id));
      });

      // KOPYA ÖLÇÜ (geri-sayısal/bar tekrarın görsel kopyası): tüm nota/sus öğeleri `_repeatCopy`.
      // Bu ölçülerin braille'i SADECE tekrar işaretidir (⠶/⠼N); kopya notaların hücresi YAZILMAZ.
      // ⚠ SVG ölçü itemIds'i kopya notanın `_sourceId`'sini (orijinal nota id'si) DE içerdiğinden,
      // ogeId-eşlemesi orijinal ölçünün (bars 1-5) hücrelerini kopya ölçülere (bars 6-10) SIZDIRIR
      // (kullanıcı: "tekrardan sonra tekrar edilenin brailini yazmamalıydın"). Kopya ölçüde nota-eşlemesi kapatılır.
      const kopyaOlcuMu = Array.isArray(measure.items) && measure.items.length > 0
        && measure.items.some((o) => o?._repeatCopy)
        && measure.items.every((o) => o?._repeatCopy || /barline|çizgi|cizgi/i.test(String(o?.tip || '')));

      const measureCells = hucreItems.filter((item) => {
        if (overlaydeGosterme(item.anlam)) return false;

        // Bar-repeat cell (⠶) + onun sayı işareti/rakamları (⠶⠼N) + geri-sayısal tekrar (⠼N backward):
        // ogeId yok → olcuIdx ile eşleştir. Sayı hücreleri de işaretle AYNI ölçüye gitmeli
        // (indir ⠶⠼N/⠼N ⇔ overlay ⠶⠼N/⠼N — WYSIWYG; skor altı braille orijinal BRF'i aynalar).
        if (
          item.anlam?.kaynak === 'bar-repeat'
          || item.anlam?.kaynak === 'bar-repeat-sayi'
          || item.anlam?.kaynak === 'backward-repeat'
        ) {
          const thisMeasureIdx = measure?.measureIndex ?? measureIdx;
          return typeof item.anlam?.olcuIdx === 'number' && item.anlam.olcuIdx === thisMeasureIdx;
        }

        // Tekrar bloğundan SONRA yazılan bar-üstü tie/slur (örn. ⠶⠈⠉): kaynak notası collapsed
        // (_repeatCopy) olduğundan ogeId yerine olcuIdx ile eşlenir → kopya ölçüde de gösterilir
        // (kullanıcı: "tekrarlarda bağ brailleri görünmüyor, hepsi görünsün").
        if (item.anlam?.bagId && typeof item.anlam?.olcuIdx === 'number') {
          const thisMeasureIdx = measure?.measureIndex ?? measureIdx;
          return item.anlam.olcuIdx === thisMeasureIdx;
        }

        // Kopya ölçü: nota/sus hücreleri gösterilmez (yalnız yukarıdaki tekrar işareti).
        if (kopyaOlcuMu) return false;

        // brailleShorthand cell: match by olcuIdx (item is filtered out of SVG layout)
        if (item.anlam?.kaynak === 'braille-shorthand') {
          const thisMeasureIdx = measure?.measureIndex ?? measureIdx;
          return typeof item.anlam?.olcuIdx === 'number' && item.anlam.olcuIdx === thisMeasureIdx;
        }

        const ogeId = brailleItemOgeIdAl(item);
        if (!ogeId) return false;

        return itemIds.has(ogeId);
      });

      return {
        ...measure,
        rowIndex: satirIdx,
        measureIndex: measure?.measureIndex ?? measure?.index ?? measureIdx,
        startX: Number.isFinite(measure?.startX) ? measure.startX : measure?.measureStartX,
        endX: Number.isFinite(measure?.endX) ? measure.endX : measure?.measureEndX,
        cells: measureCells,
        hucreler: measureCells.map((item) => item.hucre),
        anlamlar: measureCells.map((item) => item.anlam),
      };
    });
  });
}

export function useBrailleOutput({
  muzikOgeleriOlcuTamamlanmis,
  muzikBaglar,
  muzikHeader,
  muzikTupletler,
  muzikSatirOlculeri,
  mevcutAnahtar,
  anahtarGlyphAl,
  includeBarNumbers,
  canonicalEditorBrfText = '',
  canonicalEditorBrfResult = null,
  canonicalEditorReaderResult = null,
}) {
  // Ekran-altı overlay braille, İNDİR (scoreToCanonicalBrf) ile birebir aynı motoru
  // ve aynı seçenekleri kullanmalı — gruplama ayarı dahil. Aksi halde gruplama açıkken
  // ekranda tam-süre hücreler görünüp indirilende pitch-only gruplar oluşur (WYSIWYG kırılır).
  const cevirSonuc = useMemo(() => {
    const useBrailleGrouping = Boolean(muzikHeader?.useBrailleGrouping);
    return muzikSkorunuBrailleyeCevir(
      muzikOgeleriOlcuTamamlanmis,
      muzikBaglar,
      muzikHeader,
      muzikTupletler,
      { includeBarNumbers, useBrailleGrouping, strictDurationCells: !useBrailleGrouping },
    );
  }, [muzikOgeleriOlcuTamamlanmis, muzikBaglar, muzikHeader, muzikTupletler, includeBarNumbers]);

  const hucreler = cevirSonuc.hucreler || [];

  const hucreAnlamlari = useMemo(() => {
    const ogeMap = new Map(
      muzikOgeleriOlcuTamamlanmis.map((oge) => [oge.id, oge]),
    );

    return hucreler.map((_, i) => {
      const meta = Array.isArray(cevirSonuc.hucreMeta)
        ? cevirSonuc.hucreMeta[i]
        : null;

      const kaynakOge = meta?.ogeId ? ogeMap.get(meta.ogeId) : null;
      const temelAnlam = (
        muzikHucreAnlamiKayittan(
          muzikOgeleriOlcuTamamlanmis,
          i,
          cevirSonuc.hucreMeta,
        )
        || { tip: 'isaret', baslik: 'Müzik hücresi', etiket: '', noktaStr: '' }
      );

      if (!meta && !kaynakOge) {
        return normalizeBrailleMeaning(temelAnlam);
      }

      const metaKaynak = meta?.kaynak || temelAnlam.kaynak || '';
      const anahtarMi = kaynakOge?.tip === 'anahtar';
      const notaMi = metaKaynak === 'note' || metaKaynak === 'note-pitch' || (!meta && kaynakOge?.tip === 'nota');
      const kaynakAd = kaynakOge?.ad || temelAnlam.ad || temelAnlam.etiket || '';
      const nord = {
        ...temelAnlam,
        ogeId: meta?.ogeId || kaynakOge?.id || temelAnlam.ogeId || null,
        sourceId: meta?.ogeId || kaynakOge?.id || temelAnlam.sourceId || null,
        hoverId:
          meta?.hoverId ||
          meta?.ogeId ||
          kaynakOge?.id ||
          temelAnlam.hoverId ||
          temelAnlam.ogeId ||
          null,
        bagId: brailleAnlamBagIdAl(meta) || brailleAnlamBagIdAl(temelAnlam) || null,
        kaynak: metaKaynak,
        ad: kaynakAd,
        tip: anahtarMi ? 'anahtar' : notaMi ? 'nota' : temelAnlam.tip,
        baslik: anahtarMi ? (kaynakAd || 'Anahtar') : notaMi ? (kaynakAd || temelAnlam.baslik) : temelAnlam.baslik,
        etiket: anahtarMi
          ? (kaynakAd || temelAnlam.etiket)
          : notaMi
            ? (kaynakOge?.notaAd || temelAnlam.etiket)
            : temelAnlam.etiket,
        ...(typeof meta?.olcuIdx === 'number' ? { olcuIdx: meta.olcuIdx } : {}),
        ...(meta?.tupletId ? { tupletId: meta.tupletId } : {}),
        // Bar-repeat ×N: legendde tekrar türü/sayısı ("braille tekrar ×8") göstermek için taşı.
        ...(meta?.tekrarSayisi ? { tekrarSayisi: meta.tekrarSayisi } : {}),
      };

      return normalizeBrailleMeaning(nord);
    });
  }, [hucreler, muzikOgeleriOlcuTamamlanmis, cevirSonuc.hucreMeta]);

  const brailleSatirlari = useMemo(() => (
    // LEGACY FALLBACK:
    // Canonical BRF pipeline aktifken export/preview için kullanılmaz.
    // Sadece geri dönüş için tutuluyor.
    brailleRowsFromMeasures(hucreler, hucreAnlamlari, 6)
  ), [hucreler, hucreAnlamlari]);

  const canonicalBrfResult = useMemo(() => {
    if (!MUSIC_CANONICAL_BRF.preview && !MUSIC_CANONICAL_BRF.export) return null;

    try {
      const useBrailleGrouping = Boolean(muzikHeader?.useBrailleGrouping);
      const canonical = scoreToCanonicalBrf({
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

      return canonical;
    } catch (err) {
      if (MUSIC_CANONICAL_BRF.debug) {
        console.warn('Canonical BRF export başarısız, eski export yolu kullanılacak:', err);
      }
      return null;
    }
  }, [muzikOgeleriOlcuTamamlanmis, muzikBaglar, muzikHeader, muzikTupletler, includeBarNumbers]);

  const canonicalReadableText = canonicalEditorReaderResult?.readableText || '';

  const brfExportMetni = useMemo(() => {
    if (canonicalEditorBrfText) {
      return canonicalEditorBrfText;
    }

    if ((MUSIC_CANONICAL_BRF.export || MUSIC_CANONICAL_BRF.preview) && canonicalBrfResult?.brfText) {
      return canonicalBrfResult.brfText;
    }

    return muzikBrfExportMetniOlustur({
      cevirSonuc,
      brailleSatirlari,
      satirUzunlugu: 40,
      olcuBazli: true,
    });
  }, [
    canonicalEditorBrfText,
    canonicalBrfResult,
    cevirSonuc,
    brailleSatirlari,
  ]);

  const tekBrfMetni = canonicalEditorBrfText || canonicalBrfResult?.brfText || brfExportMetni || '';

  const olcuBrailleSonuclari = useMemo(() => (
    brailleHucreleriniSkorOlculerineDagit({
      hucreler,
      anlamlar: hucreAnlamlari,
      skorSatirlari: muzikSatirOlculeri,
    }).map((satirOlculeri) => (
      satirOlculeri.map((olcu) => {
        const gorunumHucreleri = olcu.hucreler || [];
        const gorunumAnlamlari = olcu.anlamlar || [];

        return {
          ...olcu,
          metin: brailleMetniOlustur(gorunumHucreleri),
          anlam: gorunumAnlamlari
            .map((anlam) => brailleAnlamMetni(anlam))
            .join(' '),
        };
      })
    ))
  ), [
    muzikSatirOlculeri,
    hucreler,
    hucreAnlamlari,
  ]);

  const satirBrailleLejantlari = useMemo(() => {
    return olcuBrailleSonuclari.map((satirOlculeri) => {
      const items = [];

      satirOlculeri.forEach((olcu) => {
        (olcu.hucreler || []).forEach((hucre, i) => {
          items.push({
            hucre,
            anlam: olcu.anlamlar?.[i],
          });
        });
      });

      return brailleLejantlariOlustur(items);
    });
  }, [olcuBrailleSonuclari]);

  const satirBrailleLejantMaplari = useMemo(() => (
    satirBrailleLejantlari.map((items) => new Map(items.map((item) => [item.key, item])))
  ), [satirBrailleLejantlari]);

  const skorUstuHeaderSatirlari = useMemo(() => (
    (Array.isArray(cevirSonuc.headerSatirlari) ? cevirSonuc.headerSatirlari : [])
      .filter((satir) => satir?.kaynak !== 'header-meta')
  ), [cevirSonuc.headerSatirlari]);

  const baslangicBrailleBilgisi = useMemo(() => {
    const hucreOgeleri = [];
    const etiketler = [];
    const ilkSatirOlcuNumarasiHucreleri = [];

    for (let i = 0; i < hucreler.length; i += 1) {
      const anlam = hucreAnlamlari[i];

      if (brailleAnlamOlcuNumarasiMi(anlam)) {
        ilkSatirOlcuNumarasiHucreleri.push({
          hucre: Array.isArray(hucreler[i]) ? hucreler[i] : [],
          anlam: {
            ...anlam,
            tip: 'olcu',
            baslik: 'Satır başı',
            etiket: brailleLejantEtiketiAl(anlam) || 'ölçü numarası (satır başı)',
            kaynak: 'bar-number',
          },
        });
        continue;
      }

      if (brailleAnlamOlcuIciIcerikMi(anlam)) {
        break;
      }
    }

    if (ilkSatirOlcuNumarasiHucreleri.length > 0) {
      etiketler.push('ölçü numarası (satır başı)');
      hucreOgeleri.push(...ilkSatirOlcuNumarasiHucreleri);
    }

    if (mevcutAnahtar) {
      const anahtarEtiketi = mevcutAnahtar.ad || 'Sol anahtarı';
      const anahtarHucreleri = brailleHucreListesiNormalizeEt(mevcutAnahtar.hucreler);

      if (anahtarHucreleri.length > 0) {
        etiketler.push(anahtarEtiketi);
        anahtarHucreleri.forEach((hucre) => {
          hucreOgeleri.push({
            hucre,
            anlam: {
              tip: 'anahtar',
              ad: anahtarEtiketi,
              etiket: anahtarEtiketi,
              baslik: 'Anahtar',
              kaynak: 'clef',
              ogeId: mevcutAnahtar.id || null,
            },
          });
        });
      }
    }

    const headerMetaSatiri = (Array.isArray(cevirSonuc.headerSatirlari) ? cevirSonuc.headerSatirlari : [])
      .find((satir) => satir?.kaynak === 'header-meta');

    if (headerMetaSatiri && Array.isArray(headerMetaSatiri.hucreler) && headerMetaSatiri.hucreler.length > 0) {
      const headerEtiketi = headerMetaSatiri.etiket || 'Başlangıç bilgisi';
      etiketler.push(headerEtiketi);
      const kaynaklar = Array.isArray(headerMetaSatiri.hucreKaynaklari)
        ? headerMetaSatiri.hucreKaynaklari
        : [];
      const hucreEtiketleri = Array.isArray(headerMetaSatiri.hucreEtiketleri)
        ? headerMetaSatiri.hucreEtiketleri
        : [];

      headerMetaSatiri.hucreler.forEach((hucre, idx) => {
        const kaynak = kaynaklar[idx] || 'header-meta';
        const etiket = hucreEtiketleri[idx] || headerEtiketi;
        const baslik = kaynak === 'tempo'
          ? 'Tempo'
          : kaynak === 'key-signature'
            ? 'Donanım'
            : kaynak === 'time-signature'
              ? 'Zaman'
              : 'Başlangıç bilgisi';

        hucreOgeleri.push({
          hucre: Array.isArray(hucre) ? hucre : [],
          anlam: {
            tip: 'header',
            ad: headerEtiketi,
            etiket,
            baslik,
            kaynak,
          },
        });
      });
    }

    return {
      etiket: etiketler.filter(Boolean).join(' · '),
      hucreOgeleri,
    };
  }, [
    mevcutAnahtar,
    cevirSonuc.headerSatirlari,
    hucreler,
    hucreAnlamlari,
  ]);

  const baslangicBrailleLejantlari = useMemo(() => (
    brailleLejantlariOlustur(baslangicBrailleBilgisi.hucreOgeleri || [])
      .filter((item) => BASLANGIC_HEADER_LEJANT_KATEGORILERI.has(item.kategori))
  ), [baslangicBrailleBilgisi]);

  const baslangicBrailleLejantMapi = useMemo(() => (
    new Map(baslangicBrailleLejantlari.map((item) => [item.key, item]))
  ), [baslangicBrailleLejantlari]);

  const gorunenSatirBrailleLejantlari = useMemo(() => (
    satirBrailleLejantlari
  ), [satirBrailleLejantlari]);

  const gorunenSatirBrailleLejantMaplari = useMemo(() => {
    return gorunenSatirBrailleLejantlari.map((items) => {
      return new Map(items.map((item) => [item.key, item]));
    });
  }, [gorunenSatirBrailleLejantlari]);

  const headerGosterimKartlari = useMemo(() => {
    const kartlar = [];

    if (mevcutAnahtar) {
      kartlar.push({
        id: 'anahtar',
        baslik: 'Anahtar',
        metin: mevcutAnahtar.ad || '—',
        simge: anahtarGlyphAl(mevcutAnahtar),
        hucreler: brailleHucreListesiNormalizeEt(mevcutAnahtar.hucreler),
      });
    }

    if (muzikHeader.keySignature) {
      kartlar.push({
        id: 'donanim',
        baslik: 'Donanım',
        metin: muzikHeader.keySignature.ad || '—',
        hucreler: brailleHucreListesiNormalizeEt(muzikHeader.keySignature.hucreler),
      });
    }

    if (muzikHeader.timeSignature) {
      kartlar.push({
        id: 'zaman-imzasi',
        baslik: 'Zaman İmzası',
        metin: muzikHeader.timeSignature.gorunum || muzikHeader.timeSignature.ad || '—',
        hucreler: brailleHucreListesiNormalizeEt(muzikHeader.timeSignature.hucreler),
      });
    }

    if (brailleTemizMetin(muzikHeader.title)) {
      kartlar.push({
        id: 'baslik',
        baslik: 'Başlık',
        metin: brailleTemizMetin(muzikHeader.title),
        hucreler: [],
      });
    }

    if (brailleTemizMetin(muzikHeader.composer)) {
      kartlar.push({
        id: 'besteci',
        baslik: 'Besteci',
        metin: brailleTemizMetin(muzikHeader.composer),
        hucreler: [],
      });
    }

    if (brailleTemizMetin(muzikHeader.tempo)) {
      kartlar.push({
        id: 'tempo',
        baslik: 'Tempo',
        metin: brailleTemizMetin(muzikHeader.tempo),
        hucreler: [],
      });
    }

    return kartlar;
  }, [mevcutAnahtar, muzikHeader, anahtarGlyphAl]);

  return {
    cevirSonuc,
    hucreler,
    brfExportMetni,
    canonicalBrf: canonicalBrfResult,
    canonicalBrfText: canonicalBrfResult?.brfText,
    canonicalReadableText,
    tekBrfMetni,
    hamBrfMetni: tekBrfMetni,
    exportBrfMetni: tekBrfMetni,
    copyBrfMetni: tekBrfMetni,
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
  };
}
