import { sureAdiAl } from './brfMusicReaderConstants.js';

function sureMetniTemizle(value = '') {
  return String(value || '')
    .replace(/\s*nota$/iu, '')
    .replace(/16-lık/iu, 'onaltılık')
    .trim();
}

function readableItem(item) {
  if (!item) return '';

  if (item.tip === 'nota') {
    const oktav = Number.isFinite(Number(item.oktav)) ? `${item.oktav}. oktav ` : '';
    const accRaw = String(item.accidental || '').toLowerCase();
    const acc = accRaw === 'sharp' ? ' diyez' : accRaw === 'flat' ? ' bemol' : accRaw === 'natural' ? ' natürel' : '';
    const sure = sureMetniTemizle(item.sureAd || sureAdiAl(item.sureIndeksi));
    const dotted = item.dotted ? ' noktalı' : '';
    return `${oktav}${item.notaAd || item.ad || ''}${acc}${sure ? `${dotted} ${sure}` : dotted}`.trim();
  }

  if (item.tip === 'sus') {
    const sure = sureMetniTemizle(item.sureAd || sureAdiAl(item.sureIndeksi));
    const dotted = item.dotted ? 'noktalı ' : '';
    return `${dotted}${sure || ''} sus`.trim();
  }

  if (item.tip === 'beginRepeat') return 'başlangıç tekrarı';
  if (item.tip === 'endRepeat') return 'bitiş tekrarı';
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
