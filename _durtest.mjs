import { brfMuzikOku } from './src/utils/music-brf/brfMusicReader.js';

const brf = `⠂⠜⠌⠇⠣⠶⠐⠳⠳⠳⠺⠀⠀⠪⠄⠩⠛⠱⠭⠑⠀⠀⠲⠨⠱⠄⠙⠺⠊⠄⠮⠀⠀⠷⠣⠆⠀⠣⠶⠨⠱⠱⠱⠳⠀⠀⠶⠩⠨⠻⠄⠋⠱⠭⠑⠀⠀⠐⠪⠄⠚⠹⠑⠽⠍⠀⠀⠾⠣⠆`;

const res = brfMuzikOku(brf, {});
const dump = (m) => (m || []).map((it) => ({
  notaAd: it.notaAd, oktav: it.oktav, sureAd: it.sureAd,
  realValue: it.realValue, duration16: it.duration16, dotted: it.dotted, tip: it.tip,
}));

import { writeFileSync } from 'node:fs';
const out = {
  measureCount: res.measures && res.measures.length,
  warnings: res.warnings,
  header: res.header,
  measures: (res.measures || []).map((m) => dump(m)),
};
writeFileSync('./_durtest.out.json', JSON.stringify(out, null, 1), 'utf8');
