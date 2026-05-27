import { SURE_GOSTERGELERI } from '../../data/muzik.js';

function sureAdAl(index) {
  const sure = SURE_GOSTERGELERI[index];
  return sure?.ad || sure?.label || '';
}

function accidentalMetniAl(oge) {
  const raw = String(
    oge?.accidental ||
    oge?.ariza ||
    oge?.degisim ||
    oge?.alteration ||
    '',
  ).toLowerCase();

  if (raw === 'sharp' || raw === 'diyez' || raw.includes('#')) return ' diyez';
  if (raw === 'flat' || raw === 'bemol') return ' bemol';
  if (raw === 'natural' || raw === 'natürel' || raw === 'naturel' || raw === 'bekar') return ' natürel';
  if (raw === 'doublesharp' || raw === 'ciftdiyez') return ' çift diyez';
  if (raw === 'doubleflat' || raw === 'ciftbemol') return ' çift bemol';
  return '';
}

function notayiBicimle(oge) {
  const nota = oge.notaAd || oge.ad || '';
  const oktav = oge.oktav ? `${oge.oktav}. oktav ` : '';
  const accidental = accidentalMetniAl(oge);
  const sure = oge.sureAd || oge.sure || sureAdAl(oge.sureIndeksi);

  if (!nota) return '';
  return `${oktav}${nota}${accidental}${sure ? ` ${sure}` : ''}`.trim();
}

export function muzikOgeOkunurAdAl(oge) {
  if (!oge) return '';

  if (oge.tip === 'nota') {
    return notayiBicimle(oge);
  }

  if (oge.tip === 'sus') {
    const sure = oge.sureAd || oge.sure || sureAdAl(oge.sureIndeksi);
    return `${sure || ''} sus`.trim();
  }

  if (oge.tip === 'barline') return '|';
  if (oge.tip === 'finalBarline') return 'bitiş çizgisi';
  if (oge.tip === 'beginRepeat') return 'baslangic tekrari';
  if (oge.tip === 'endRepeat') return 'bitis tekrari';

  return '';
}

export function muzikOgeleriOkunurMetinAl(ogeler = []) {
  return ogeler
    .map(muzikOgeOkunurAdAl)
    .filter(Boolean)
    .join(' ');
}

export function muzikOgeleriOlcuOlcuOkunurMetinAl(ogeler = [], header = {}) {
  const lines = [];

  if (header?.title) {
    lines.push(`Başlık: ${header.title}`);
  }

  if (header?.timeSignature?.ad || header?.timeSignature?.gorunum) {
    lines.push(`Zaman imzası: ${header.timeSignature.gorunum || header.timeSignature.ad}`);
  }

  if (header?.keySignature?.ad) {
    lines.push(`Donanım: ${header.keySignature.ad}`);
  }

  if (header?.tempo) {
    lines.push(`Tempo: ${header.tempo}`);
  }

  let aktif = [];
  let no = 1;

  for (const oge of ogeler) {
    if (oge.tip === 'barline' || oge.tip === 'finalBarline') {
      if (aktif.length) {
        lines.push(`${no}. ölçü: ${aktif.join(', ')}`);
        aktif = [];
        no += 1;
      }

      if (oge.tip === 'finalBarline') {
        lines.push('Bitiş çizgisi');
      }

      continue;
    }

    const text = muzikOgeOkunurAdAl(oge);
    if (text) aktif.push(text);
  }

  if (aktif.length) {
    lines.push(`${no}. ölçü: ${aktif.join(', ')}`);
  }

  return lines.join('\n');
}
