import { buildReadableSummary } from './brfMusicReadableSummary.js';
import { MUZIK_GRUPLAMA_SECENEKLERI } from '../music/musicConstants.js';
import {
  normalizeBrfText,
  createReaderContext,
  tokenizeBrailleLine,
  detectHeaderLineType,
  setReaderTimeSignature,
  setReaderKeySignature,
  readMusicBrailleCell,
  readMusicBrailleGroup,
  handleLineEnd,
  buildMeasures,
  finalizeSlurMarkers,
} from './brfMusicReaderRules.js';

// Bir metre adını ('7/8', '2/2 (sebare)') sayısal anahtara indir.
function gruplamaMetreAnahtari(ad) {
  const f = String(ad || '').match(/(\d+)\s*\/\s*(\d+)/);
  return f ? `${f[1]}/${f[2]}` : null;
}

// Bir okuma sonucundaki gruplama-duyarlı uyarı sayısı (auto-çözüm skoru — az = iyi).
function gruplamaUyariSkoru(result) {
  return (result?.warnings || []).filter(
    (w) => w?.type === 'measure-duration-warning' || w?.type === 'measure-overflow',
  ).length;
}

// AKSAK METRE GRUPLAMA AUTO-ÇÖZÜMÜ (kullanıcının "otomatik çözümlemeliyiz" isteği):
// Düzensiz metrelerde (5/8, 7/8, 9/8, 10/8) vuruş gruplaması braille'de açıkça yazılmaz; grup
// liderleri (16'lık tam-hücre) + 8'lik-devamların DİZİLİŞİ bunu örtük belirler. Reader varsayılan
// desenle çözemezse (ölçü-süre/taşma uyarıları), o metrenin TÜM gruplama seçeneklerini dener ve EN AZ
// uyarı verenini seçer — yani veri kendi desenini "seçer". Hepsi eşit-iyiyse varsayılan (ilk) kalır.
export function brfMuzikOku(brfText, options = {}) {
  const ilk = brfMuzikOkuTekGecis(brfText, options);
  if (options?.forceGruplamaDeseni) return ilk; // zaten zorlanmış — tekrar deneme

  const metre = gruplamaMetreAnahtari(ilk?.header?.timeSignature?.ad || ilk?.header?.timeSignature?.gorunum);
  const secenekler = metre ? MUZIK_GRUPLAMA_SECENEKLERI[metre] : null;
  if (!secenekler || secenekler.length < 2) return ilk; // seçtirilebilir aksak metre değil

  let enIyi = ilk;
  let enIyiSkor = gruplamaUyariSkoru(ilk);
  if (enIyiSkor === 0) return ilk; // varsayılan zaten temiz

  for (const desen of secenekler) {
    const aday = brfMuzikOkuTekGecis(brfText, { ...options, forceGruplamaDeseni: desen });
    const skor = gruplamaUyariSkoru(aday);
    if (skor < enIyiSkor) {
      enIyi = aday;
      enIyiSkor = skor;
      if (skor === 0) break; // tam çözüm
    }
  }
  return enIyi;
}

function brfMuzikOkuTekGecis(brfText, options = {}) {
  const normalized = normalizeBrfText(brfText);
  const lines = normalized.split(/\r?\n/).map((line) => line.trimEnd());
  const canonicalEditorSource = options?.source === 'editor-canonical-brf';

  const context = createReaderContext({
    ...options,
    canonicalEditorSource,
  });

  lines.forEach((line, lineIndex) => {
    const cells = tokenizeBrailleLine(line, lineIndex);

    // Header bloğu (başlık/besteci/tempo/zaman) gövdeden ÖNCE gelir ve zaman imzası
    // konvansiyonel olarak header'ın SON öğesidir. Zaman imzası bir kez parse edildiyse
    // sonraki içerik satırı GÖVDEdir → başlık-tespiti uygulama (harf gibi görünen nota/sus
    // dizileri — örn. rest'le başlayan ölçü `⠧⠐⠙…` — yanlışlıkla başlık sanılmasın).
    if (!context.items.length && !context.header.timeSignature) {
      const headerType = detectHeaderLineType(cells);
      // BRF header sırası: 1) başlık  2) besteci  3) tempo (+ donanım/zaman aynı satırda).
      // Metin satırları sırayla title → composer → tempo alanlarına atanır;
      // aksi halde besteci ve tempo header'a hiç yazılmıyordu.
      if (headerType.type === 'title' || headerType.type === 'title+time-signature') {
        const metin = headerType.value || '';
        if (metin) {
          if (!context.header.title) {
            context.header.title = metin;
          } else if (!context.header.composer && headerType.type === 'title') {
            context.header.composer = metin;
          } else if (!context.header.tempo) {
            context.header.tempo = metin;
          }
        }
      }
      if (headerType.type === 'time-signature' && !context.header.timeSignature) {
        setReaderTimeSignature(context, headerType.value);
      }
      if (headerType.type === 'title+time-signature' && !context.header.timeSignature) {
        setReaderTimeSignature(context, headerType.timeSignature);
      }
      // Donanım (key signature) — tek başına veya zaman imzasıyla aynı satırda.
      if ((headerType.type === 'key-signature' || headerType.type === 'key+time-signature') && !context.header.keySignature) {
        setReaderKeySignature(context, headerType.keySignature);
      }
      if (headerType.type === 'key+time-signature' && !context.header.timeSignature) {
        setReaderTimeSignature(context, headerType.timeSignature);
      }
      if (headerType.type !== 'music') {
        cells.forEach((cell) => {
          if (cell.type === 'space') {
            context.cells.push({
              seq: context.seq + 1,
              lineIndex: cell.lineIndex,
              cellIndex: cell.cellIndex,
              char: cell.char,
              dots: [],
              dotsText: 'boşluk',
              type: 'space',
              category: 'separator',
              meaning: 'header boşluk',
              effect: '',
              warning: '',
            });
            context.seq += 1;
            return;
          }

          context.cells.push({
            seq: context.seq + 1,
            lineIndex: cell.lineIndex,
            cellIndex: cell.cellIndex,
            char: cell.char,
            dots: cell.dots,
            dotsText: cell.dots.length ? cell.dots.join('-') : 'boşluk',
            type: 'braille',
            category: headerType.type === 'title' ? 'header-title' : 'header-time-signature',
            meaning: headerType.type === 'title' ? 'başlık hücresi' : `zaman imzası (${headerType.value})`,
            effect: 'header alanında işlendi',
            warning: '',
          });
          context.seq += 1;
        });

        handleLineEnd(context);
        return;
      }
    }

    let group = [];
    cells.forEach((cell) => {
      if (cell.type === 'space') {
        if (group.length) {
          readMusicBrailleGroup(group, context);
          group = [];
        }
        // §14: eser-içi zaman/donanım değişiminden SONRAKİ boşluk barline değildir
        // (formatlama ayracı) → bu boşluğu ölçü çizgisi yapma, atla.
        if (context.zamanDegisimiSonrasiBoslukAtla) {
          context.zamanDegisimiSonrasiBoslukAtla = false;
          return;
        }
        readMusicBrailleCell(cell, context);
        return;
      }

      group.push(cell);
    });

    if (group.length) {
      readMusicBrailleGroup(group, context);
    }

    handleLineEnd(context);
  });

  finalizeSlurMarkers(context);
  const measures = buildMeasures(context.items);

  // Eser içinde zaman imzası değişimi varsa ölçü-süre beklentisi ölçüden ölçüye değişir;
  // tek global `expectedMeasure16` ile karşılaştırma yanıltıcı olur → bu kontrolü atla.
  const zamanDegisimiVar = (context.items || []).some((it) => it?.tip === 'timeSignatureChange');
  const expected = Number(context.expectedMeasure16 || 0);
  if (expected > 0 && !zamanDegisimiVar) {
    measures.forEach((measure, idx) => {
      const total = Number(measure.total16 || 0);
      // Tolerans 0.01: tuplet sıkıştırması (× inTimeOf/count) 2/3, 4/6 gibi devreden ondalıklar üretir;
      // toplamları tam sayıya çok yakındır ama float hatası taşır (örn. 7.9999998). Bu hatayı yut.
      if (total <= 0 || Math.abs(total - expected) <= 0.01) return;
      // ANAKRUZ (pickup) ilk ölçü ve TAMAMLANMAMIŞ son ölçü kısa olabilir — bu normaldir (ikisi
      // birlikte bir tam ölçü eder), uyarma. Yalnızca ORTA ölçüler veya AŞIM gerçek hatadır.
      const ilk = idx === 0;
      const son = idx === measures.length - 1;
      const kisa = total < expected;
      if (kisa && (ilk || son)) return;
      // Görüntü: float ondalığını yuvarla (33.333.../16 yerine 33.33/16).
      const gosterilen = Math.round(total * 100) / 100;
      context.warnings.push({
        type: 'measure-duration-warning',
        measureNo: measure.no,
        message: `${measure.no}. ölçü süresi ${gosterilen}/${expected}. Çözüm kesin değil; hücre tablosunu kontrol edin.`,
      });
    });
  }

  if (!Array.isArray(context.items) || context.items.length === 0) {
    context.warnings.push({
      type: 'empty-parse',
      message: 'BRF ham olarak okundu ancak müzik notalarına çözümlenemedi.',
    });
  }

  const result = {
    header: context.header,
    items: context.items,
    tupletler: Array.isArray(context.tupletler) ? context.tupletler : [],
    measures,
    baglar: Array.isArray(context.baglar) ? context.baglar : [],
    cells: context.cells,
    warnings: context.warnings,
    raw: brfText,
    debug: {
      ...((context.debug && typeof context.debug === 'object') ? context.debug : {}),
      slurMarkers: context.slurMarkers,
      noteSequence: context.noteSequence,
      importOptions: options,
      source: options?.source || null,
      canonicalEditorSource,
    },
  };

  return {
    ...result,
    readableText: buildReadableSummary(result),
  };
}
