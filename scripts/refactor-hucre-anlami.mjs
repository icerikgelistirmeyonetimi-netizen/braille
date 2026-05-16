import fs from 'fs';

const path = 'c:/Users/HP/braille/src/pages/Araclar.jsx';
const src = fs.readFileSync(path, 'utf8');

const fnStartNeedle = 'export function hucreAnlami(hucreler, idx, kisaltmaAktif, opts) {';
const jsStartNeedle = 'Tıklanan braille hücresinin anlamını döndürür.';
const fnStart = src.indexOf(fnStartNeedle);
if (fnStart < 0) {
  console.error('hucreAnlami signature not found');
  process.exit(1);
}
const jsStart = src.indexOf(jsStartNeedle);
if (jsStart < 0 || jsStart > fnStart) {
  console.error('JSDoc not found');
  process.exit(1);
}
const jsBlockStart = src.lastIndexOf('/**', jsStart);
const jsdoc = src.slice(jsBlockStart, fnStart);
const bodyStart = fnStart + fnStartNeedle.length;
const rel = src.slice(fnStart).search(/\r?\n}\r?\n\r?\nfunction _brfMetinedon/);
if (rel < 0) {
  console.error('end marker not found');
  process.exit(1);
}
const bodyEnd = fnStart + rel;
const delimMatch = src.slice(bodyEnd).match(/^\r?\n}\r?\n\r?\nfunction _brfMetinedon/);
if (!delimMatch) {
  console.error('delimiter parse');
  process.exit(1);
}
const tailStart = bodyEnd + delimMatch[0].indexOf('function _brfMetinedon');
const body = src.slice(bodyStart, bodyEnd);

const loopNeedle = '  for (let i = 0; i < idx; i++) {\r\n';
const tekilNeedle = '  const noktalar = hucreler[idx];\r\n';
const loopStart = body.indexOf(loopNeedle);
const tekilStart = body.indexOf(tekilNeedle);
if (loopStart < 0 || tekilStart < 0 || tekilStart <= loopStart) {
  console.error('loop/tekil markers', loopStart, tekilStart);
  process.exit(1);
}

const baglamInner = body.slice(0, loopStart).trimEnd();
let loopBlock = body.slice(loopStart + loopNeedle.length, tekilStart).trimEnd();
while (loopBlock.endsWith('\r\n')) loopBlock = loopBlock.slice(0, -2);
if (!/\r\n  }$/.test(loopBlock) && !/\n  }$/.test(loopBlock)) {
  console.error('unexpected loop end', JSON.stringify(loopBlock.slice(-40)));
  process.exit(1);
}
loopBlock = loopBlock.replace(/\r\n  }$/m, '').replace(/\n  }$/m, '');
const loopLines = loopBlock.split(/\r?\n/);
if (!loopLines[0].trim().startsWith('const h = hucreler[i]')) {
  console.error('expected first loop line const h');
  process.exit(1);
}
const loopRest = loopLines.slice(1).join('\r\n');

const modVars = [
  'sayiModu',
  'siraSayiModu',
  'buyukHarfBekle',
  'tumKelimeBuyuk',
  'ciftListeVirgulle',
  'cListeSonTekIsaretSonrasi',
];
let modLoop = loopRest;
for (const v of modVars) {
  const re = new RegExp(`\\b${v}\\b`, 'g');
  modLoop = modLoop.replace(re, `mod.${v}`);
}

const modTekIndeksFn = `  const mod = {
    sayiModu: false,
    siraSayiModu: false,
    buyukHarfBekle: false,
    tumKelimeBuyuk: false,
    ciftListeVirgulle: false,
    cListeSonTekIsaretSonrasi: false,
    paren24356Count: 0,
  };
  const modTekIndeks = (i) => {
    const h = hucreler[i];
    if (h.length && dotKey(h) === '2,3,5,6') mod.paren24356Count++;
${modLoop}
  };
  return {
    dotKey,
    _kaynak,
    _esleme,
    _yorumTercihleri,
    _kaynakKelime,
    _kaynakKelimeBaslar,
    _kaynakKelimeSonEki,
    _kaynakTarihIcindeMi,
    _tarihHucreBaglamiMi,
    _saatKaynakAraliklari,
    _saatKaynakIcindeMi,
    _saatHucreBaglamiMi,
    _matematikListeAyraçKaynağıMi,
    sayiIsaretiOncesiSinirMi,
    virgulListesiAyirMi,
    harfliSayiHarfIsaretiMi,
    harfliSayiHarfHucreMi,
    mod,
    modTekIndeks,
  };
}`;

const baglamFn = `function hucreAnlamiBaglamVeModSifir(hucreler, opts) {
${baglamInner}

${modTekIndeksFn}
`;

let tekilBody = body.slice(tekilStart);
const parenOld =
  /\r?\n  \/\/ Parantez açma\/kapama ayrımı:[\s\S]*?const parenAcmaMi = \(\) => \{[\s\S]*?\};\r?\n/;
if (!parenOld.test(tekilBody)) {
  console.error('parenAcmaMi block not found');
  process.exit(1);
}
tekilBody = tekilBody.replace(
  parenOld,
  `\r\n  // Parantez açma/kapama: tek geçişte mod.paren24356Count ile\r\n  const parenAcmaMi = () => (mod.paren24356Count % 2 === 0);\r\n`,
);

const modLets = `
  const sayiModu = mod.sayiModu;
  const siraSayiModu = mod.siraSayiModu;
  const buyukHarfBekle = mod.buyukHarfBekle;
  const tumKelimeBuyuk = mod.tumKelimeBuyuk;
  const ciftListeVirgulle = mod.ciftListeVirgulle;
  const cListeSonTekIsaretSonrasi = mod.cListeSonTekIsaretSonrasi;
`;

tekilBody = tekilBody.replace(
  /  const noktalar = hucreler\[idx\];\r?\n  const noktaStr =/,
  `  const noktalar = hucreler[idx];${modLets}\r\n  const noktaStr =`,
);

const tekilFn = `export function hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, ctx) {
  const {
    dotKey,
    _kaynak,
    _esleme,
    _yorumTercihleri,
    _kaynakKelime,
    _kaynakKelimeBaslar,
    _kaynakKelimeSonEki,
    _kaynakTarihIcindeMi,
    _tarihHucreBaglamiMi,
    _saatKaynakAraliklari,
    _saatKaynakIcindeMi,
    _saatHucreBaglamiMi,
    _matematikListeAyraçKaynağıMi,
    sayiIsaretiOncesiSinirMi,
    virgulListesiAyirMi,
    harfliSayiHarfIsaretiMi,
    harfliSayiHarfHucreMi,
    mod,
  } = ctx;
${tekilBody}`;

const sayfaTopluFn = `
/** Sayfa aralığındaki hücre anlamlarını tek doğrusal geçişte üretir (O sayfa başına). */
export function sayfaAnlamlariniTopluHesapla(hucreler, sayfaBas, sayfaSon, kisaltmaAktif, opts) {
  const sonuclar = [];
  const bg = hucreAnlamiBaglamVeModSifir(hucreler, opts);
  const { mod, modTekIndeks } = bg;
  const bd = opts && opts.baslangicDurumu;
  if (bd) {
    Object.assign(mod, bd);
  } else {
    for (let i = 0; i < sayfaBas; i++) modTekIndeks(i);
  }
  for (let i = sayfaBas; i < sayfaSon; i++) {
    const anlam = hucreAnlamiTekil(hucreler, i, kisaltmaAktif, bg);
    sonuclar.push(anlam);
    modTekIndeks(i);
  }
  return sonuclar;
}
`;

const hucreAnlamiThin = `export function hucreAnlami(hucreler, idx, kisaltmaAktif, opts) {
  const bg = hucreAnlamiBaglamVeModSifir(hucreler, opts);
  const { mod, modTekIndeks } = bg;
  const baslangicHucre = opts && typeof opts.baslangicHucre === 'number' ? opts.baslangicHucre : 0;
  const bd = opts && opts.baslangicDurumu;
  const checkpointKullan = bd != null && baslangicHucre >= 0 && baslangicHucre <= idx;
  if (checkpointKullan) {
    mod.sayiModu = !!bd.sayiModu;
    mod.siraSayiModu = !!bd.siraSayiModu;
    mod.buyukHarfBekle = !!bd.buyukHarfBekle;
    mod.tumKelimeBuyuk = !!bd.tumKelimeBuyuk;
    mod.ciftListeVirgulle = !!bd.ciftListeVirgulle;
    mod.cListeSonTekIsaretSonrasi = !!bd.cListeSonTekIsaretSonrasi;
    mod.paren24356Count = typeof bd.paren24356Count === 'number' ? bd.paren24356Count : 0;
    for (let i = baslangicHucre; i < idx; i++) modTekIndeks(i);
  } else {
    for (let i = 0; i < idx; i++) modTekIndeks(i);
  }
  return hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, bg);
}`;

const newMiddle = `${baglamFn}\n\n${tekilFn}\n\n${sayfaTopluFn}\n\n${jsdoc}${hucreAnlamiThin}\n\n`;
const out = src.slice(0, jsBlockStart) + newMiddle + src.slice(tailStart);

fs.writeFileSync(path, out);
console.log('refactor ok');
