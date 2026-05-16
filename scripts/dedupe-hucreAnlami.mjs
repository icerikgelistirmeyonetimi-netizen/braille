import fs from 'fs';

const p = 'c:/Users/HP/braille/src/pages/Araclar.jsx';
let s = fs.readFileSync(p, 'utf8');

const fn = s.indexOf('export function hucreAnlami');
if (fn < 0) {
  console.error('hucreAnlami not found');
  process.exit(1);
}
const startReplace = s.indexOf('  const sayiModu = mod.sayiModu;', fn);
const endReplace = s.indexOf('\n\n/** Genişlet modu: yalnızca bu sayfadaki', startReplace);

if (startReplace < 0 || endReplace < 0) {
  console.error('markers', startReplace, endReplace);
  process.exit(1);
}

const mid = `  const ctx = {
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
  };
  return hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, ctx);
}`;

const out = s.slice(0, startReplace) + mid + s.slice(endReplace);
fs.writeFileSync(p, out);
console.log('ok removed', endReplace - startReplace, 'chars');
