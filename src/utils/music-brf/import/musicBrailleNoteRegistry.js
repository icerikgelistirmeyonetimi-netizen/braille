import {
  NOTALAR,
  SURE_GOSTERGELERI,
} from '../../../data/muzik.js';

import {
  muzikNotaNoktalari,
} from '../../music/musicDuration.js';

import {
  muzikSusSkorOgesi,
} from '../../music/musicScoreFactory.js';

import { cellKey } from './musicBrailleCellUtils.js';

function adayEkle(map, key, aday) {
  if (!key) return;

  if (!map[key]) {
    map[key] = [];
  }

  map[key].push(aday);
}

export function buildNoteCellCandidateMap() {
  const map = {};

  (NOTALAR || []).forEach((nota) => {
    (SURE_GOSTERGELERI || []).forEach((sure, sureIndeksi) => {
      const hucre = muzikNotaNoktalari(nota.ad, sureIndeksi);

      if (!Array.isArray(hucre) || hucre.length === 0) return;

      adayEkle(map, cellKey(hucre), {
        notaAd: nota.ad,
        realValue: sure.realValue,
        sureIndeksi,
        sureAd: sure.ad,
        source: 'project-export-map',
      });
    });
  });

  return map;
}

export function buildRestCellCandidateMap() {
  const map = {};

  (SURE_GOSTERGELERI || []).forEach((sure, sureIndeksi) => {
    const sus = muzikSusSkorOgesi?.(`tmp-rest-${sureIndeksi}`, sureIndeksi);

    if (!sus || !Array.isArray(sus.hucreler)) return;

    sus.hucreler.forEach((hucre) => {
      adayEkle(map, cellKey(hucre), {
        realValue: sure.realValue,
        sureIndeksi,
        sureAd: sure.ad,
        source: 'project-export-map',
      });
    });
  });

  return map;
}
