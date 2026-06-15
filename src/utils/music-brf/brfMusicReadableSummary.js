import { sureAdiAl } from './brfMusicReaderConstants.js';

function sureMetniTemizle(value = '') {
  return String(value || '')
    .replace(/\s*nota$/iu, '')
    .replace(/16-lık/iu, 'onaltılık')
    .trim();
}

// Notaya/susa bağlı modifier (dinamik/nüans/süsleme) adlarını sırayla döndürür.
function modAdlari(liste) {
  return (Array.isArray(liste) ? liste : [])
    .map((m) => String(m?.kayit?.ad || m?.ad || '').trim())
    .filter(Boolean);
}

// öncesi modifier'ları gövdenin ÖNÜNE, sonrası modifier'ları SONUNA ekler:
//   forte 4. oktav do diyez dörtlük  /  4. oktav sol bemol dörtlük fermata (durak)
function modifierliMetin(item, govde) {
  const once = modAdlari(item?.modifiers?.oncesi);
  const sonra = modAdlari(item?.modifiers?.sonrasi);
  return [once.join(' '), govde, sonra.join(' ')].filter(Boolean).join(' ').trim();
}

function readableItem(item) {
  if (!item) return '';

  if (item.tip === 'nota') {
    const oktav = Number.isFinite(Number(item.oktav)) ? `${item.oktav}. oktav ` : '';
    const accRaw = String(item.accidental || '').toLowerCase();
    const acc = accRaw === 'sharp' ? ' diyez' : accRaw === 'flat' ? ' bemol' : accRaw === 'natural' ? ' natürel' : '';
    const sure = sureMetniTemizle(item.sureAd || sureAdiAl(item.sureIndeksi));
    const dotted = item.dotted ? ' noktalı' : '';
    const govde = `${oktav}${item.notaAd || item.ad || ''}${acc}${sure ? `${dotted} ${sure}` : dotted}`.trim();
    return modifierliMetin(item, govde);
  }

  if (item.tip === 'sus') {
    const sure = sureMetniTemizle(item.sureAd || sureAdiAl(item.sureIndeksi));
    const dotted = item.dotted ? 'noktalı ' : '';
    const govde = `${dotted}${sure || ''} sus`.trim();
    return modifierliMetin(item, govde);
  }

  if (item.tip === 'beginRepeat') return 'başlangıç tekrarı';
  if (item.tip === 'endRepeat') return 'bitiş tekrarı';
  // Lesson 10 tekrar yönergesi — okunur özet braille'i AYNADIĞINDAN tekrarı GENİŞLETMEZ, TARİF eder
  // (örn. ⠼5 = "önceki 5 ölçünün tekrarı"). Aksi halde ölçü boş ("ölçü çizgisi") görünürdü.
  if (item.tip === 'repeatInstruction') {
    if (item.repeatTuru === 'backward-numeral') {
      const geri = Number(item.geriSayisi || item.geriOlcuSayisi);
      const cal = Number(item.calinanOlcu);
      if (geri > 0 && cal > 0 && cal !== geri) return `${geri} ölçü geri, ${cal} ölçü tekrar`;
      if (geri > 0) return `önceki ${geri} ölçünün tekrarı`;
    }
    if (item.repeatTuru === 'bar-number') {
      const b = Number(item.mutlakBaslangic); const s = Number(item.mutlakBitis);
      if (b > 0 && s > 0 && s !== b) return `${b}–${s}. ölçülerin tekrarı`;
      if (b > 0) return `${b}. ölçünün tekrarı`;
    }
    return `ölçü-numarası tekrarı (${item.gorunum || ''})`.trim();
  }
  if (item.tip === 'sectionalBarline') return 'bölüm sonu çizgisi';
  if (item.tip === 'finalBarline') return 'bitiş çizgisi';
  if (item.tip === 'barline') return 'ölçü çizgisi';
  if (item.tip === 'unknown') return `bilinmeyen hücre ${item.char || ''}`.trim();

  return '';
}

export function buildReadableSummary(result = {}) {
  const header = result.header || {};
  const measures = Array.isArray(result.measures) ? result.measures : [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];

  const lines = [];
  lines.push(`Başlık: ${header.title || '—'}`);

  if (header.composer) lines.push(`Besteci: ${header.composer}`);

  const tempo = header?.tempo || header?.bpm;
  if (tempo) lines.push(`Tempo: ${tempo}`);

  const ts = header?.timeSignature?.gorunum || header?.timeSignature?.ad || header?.timeSignature || '—';
  lines.push(`Zaman imzası: ${ts}`);

  const key = header?.keySignature?.ad || header?.keySignature?.label || header?.keySignature;
  if (key) lines.push(`Donanım: ${key}`);

  measures.forEach((measure, idx) => {
    const metin = (measure.items || [])
      .map(readableItem)
      .filter(Boolean)
      .join(', ');

    lines.push(`${idx + 1}. ölçü: ${metin || '—'}`);
  });

  if (Array.isArray(result.baglar) && result.baglar.length > 0) {
    lines.push('Bağlar:');
    result.baglar.forEach((bag) => {
      const tip = bag.tip === 'tie' ? 'Tie' : bag.tip === 'slur' ? 'Slur' : bag.tip;
      const ids = Array.isArray(bag.notaIdler) ? bag.notaIdler.join(' → ') : `${bag.basId || ''} → ${bag.sonId || ''}`;
      lines.push(`- ${tip}: ${bag.kayit?.ad || bag.ad || bag.tip} (${ids})`);
    });
  }

  if (warnings.length > 0) {
    lines.push('Uyarılar:');
    warnings.slice(0, 20).forEach((w) => {
      lines.push(`- ${w.message || String(w)}`);
    });
  }

  return lines.join('\n');
}
