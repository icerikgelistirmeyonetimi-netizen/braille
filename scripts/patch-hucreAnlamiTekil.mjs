import fs from "fs";
const arac = "src/pages/Araclar.jsx";
const tekil = fs.readFileSync("scripts/hucreAnlamiTekil_snippet.txt", "utf8");
const rep = fs.readFileSync("scripts/hucreAnlami_replace.txt", "utf8");
let s = fs.readFileSync(arac, "utf8");

const insMark = "/**\n * Tıklanan braille hücresinin anlamını döndürür.";
if (!s.includes(insMark)) throw new Error("insert mark");
s = s.replace(insMark, tekil.trimEnd() + "\n\n" + insMark);

const lines = s.split(/\r?\n/);
const start = lines.findIndex((l) => l.trim() === "const sayiModu = mod.sayiModu;");
const end = lines.findIndex(
  (l, i) => i > start && l.includes("tip: 'bilinmiyor'") && l.includes("Bilinmiyor"),
);
if (start < 0 || end < 0) throw new Error("range2");
const before = lines.slice(0, start).join("\n");
const after = lines.slice(end + 1).join("\n");
s = before + "\n" + rep.trim() + "\n" + after;

fs.writeFileSync(arac, s);
console.log("patched");
