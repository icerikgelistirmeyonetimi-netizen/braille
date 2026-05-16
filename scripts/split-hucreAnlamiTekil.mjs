import fs from "fs";
const p = "src/pages/Araclar.jsx";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const start = lines.findIndex((l) => l.trim() === "const sayiModu = mod.sayiModu;");
const end = lines.findIndex(
  (l, i) => i > start && l.includes("tip: 'bilinmiyor'") && l.includes("Bilinmiyor"),
);
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`);
const body = lines.slice(start, end + 1).join("\n");
const header = `/**
 * idx hücresinin anlamı; mod durumu ctx.mod içinde (idx öncesi) hazır olmalıdır.
 */
export function hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, ctx) {
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
`;
const tekil = `${header}${body}\n}\n\n`;
fs.writeFileSync("scripts/hucreAnlamiTekil_snippet.txt", tekil);
const replacement = `  const ctx = {
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
    _matematikListeAyraçKaynağıMi,sayiIsaretiOncesiSinirMi,virgulListesiAyirMi,harfliSayiHarfIsaretiMi,harfliSayiHarfHucreMi,
    mod,
  };
  return hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, ctx);
`;
// fix formatting typo
const replacementFixed = `  const ctx = {
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
`;
fs.writeFileSync("scripts/hucreAnlami_replace.txt", replacementFixed);
console.log("lines", start + 1, end + 1);
