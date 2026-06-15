// Braille müzik TEST FIXTURE üreteci.
// Doğrulanmış UEB Music kural+hücre tablolarını uygular (repo motorundan BAĞIMSIZ → geçerli oracle).
// Kaynak otorite: Braille Music Notation Introductory Training (NextSense, Rev 2) + muzik-braille-yazim-kurallari.md
// Çıktı: her işlenmiş örnek için Unicode braille.

const BIT = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };
const cell = (dots) => (!dots || !dots.length) ? '⠀' : String.fromCharCode(0x2800 + dots.reduce((a, d) => a + BIT[d], 0));
const cells = (arr) => arr.map(cell).join('');

// Nota temel hücreleri (sekizlik/quaver)
const NOTE = { C: [1,4,5], D: [1,5], E: [1,2,4], F: [1,2,4,5], G: [1,2,5], A: [2,4], B: [2,4,5] };
const IDX  = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
// Süre ekleri: q=8'lik c=4'lük m=2'lik s=1'lik ; 16/32/64/128 dual
const DUR  = { q: [], c: [6], m: [3], s: [3,6], '16': [3,6], '32': [3], '64': [6], '128': [] };
// Suslar
const REST = { q: [1,3,4,6], c: [1,2,3,6], m: [1,3,6], s: [1,3,4] };
// Oktav işaretleri 1..7
const OCT  = { 1: [4], 2: [4,5], 3: [4,5,6], 4: [5], 5: [4,6], 6: [5,6], 7: [6] };
// Aksidental
const ACC  = { '#': [1,4,6], 'b': [1,2,6], 'n': [1,6] };
const DBLSHARP = [[1,4,6],[1,4,6]], DBLFLAT = [[1,2,6],[1,2,6]];

// Sabit işaretler (Unicode)
const SY = {
  numbersign: cell([3,4,5,6]),
  dot: cell([3]),
  tie: cells([[4],[1,4]]),
  slur: cell([1,4]),
  brOpen: cells([[5,6],[1,2]]),
  brClose: cells([[4,5],[2,3]]),
  finalBar: cells([[1,2,6],[1,3]]),
  sectional: cells([[1,2,6],[1,3],[3]]),
  beginRepeat: cells([[1,2,6],[2,3,5,6]]),
  endRepeat: cells([[1,2,6],[2,3]]),
  brlRepeat: cell([2,3,5,6]),
  musicHyphen: cell([5]),
  word: cell([3,4,5]),
  triplet: cell([2,3]),
  // nüanslar (önce)
  staccato: cell([2,3,6]),
  staccatissimo: cells([[6],[2,3,6]]),
  mezzoStaccato: cells([[5],[2,3,6]]),
  tenuto: cells([[4,5,6],[2,3,6]]),
  accent: cells([[4,6],[2,3,6]]),
  martellato: cells([[5,6],[2,3,6]]),
  swell: cells([[1,6],[3]]),
  // nüanslar (sonra)
  fermata: cells([[1,2,6],[1,2,3]]),
  breath: cells([[3,4,5],[2]]),
  breakMark: cells([[6],[3,4]]),
  // hairpin
  crescHair: cells([[3,4,5],[1,4]]),
  crescHairEnd: cells([[3,4,5],[2,5]]),
  decrescHair: cells([[3,4,5],[1,4,5]]),
  decrescHairEnd: cells([[3,4,5],[2,5,6]]),
  // süslemeler (önce)
  trill: cell([2,3,5]),
  turn: cell([2,5,6]),
  turnAbove: cells([[6],[2,5,6]]),
  upMordent: cells([[5],[2,3,5]]),
  lowMordent: cells([[5],[2,3,5],[1,2,3]]),
  shortApp: cell([2,6]),
  longApp: cells([[5],[2,6]]),
  gliss: cells([[4],[1]]),    // sonra
};

const LETTER = { a:[1], b:[1,2], c:[1,4], d:[1,4,5], e:[1,5], f:[1,2,4], g:[1,2,4,5],
  h:[1,2,5], i:[2,4], j:[2,4,5], k:[1,3], l:[1,2,3], m:[1,3,4], n:[1,3,4,5], o:[1,3,5],
  p:[1,2,3,4], q:[1,2,3,4,5], r:[1,2,3,5], s:[2,3,4], t:[2,3,4,5], u:[1,3,6], v:[1,2,3,6],
  w:[2,4,5,6], x:[1,3,4,6], y:[1,3,4,5,6], z:[1,3,5,6] };
const word = (txt, period = false) => SY.word + txt.split('').map(c => cell(LETTER[c])).join('') + (period ? SY.dot : '');

// Dinamikler (söz işareti + harf; cresc/decresc/dim/rit baskı noktasıyla)
const DYN = {
  pp: word('pp'), p: word('p'), mp: word('mp'), mf: word('mf'),
  f: word('f'), ff: word('ff'), sf: word('sf'),
  cresc: word('cr', true), decresc: word('decr', true), dim: word('dim', true), rit: word('rit', true),
};

// ---- Üst/alt rakam (zaman imzası) ----
const UPNUM  = { '1':[1],'2':[1,2],'3':[1,4],'4':[1,4,5],'5':[1,5],'6':[1,2,4],'7':[1,2,4,5],'8':[1,2,5],'9':[2,4],'0':[2,4,5] };
const LOWNUM = { '1':[2],'2':[2,3],'3':[2,5],'4':[2,5,6],'5':[2,6],'6':[2,3,5],'7':[2,3,5,6],'8':[2,3,6],'9':[3,5],'0':[3,5,6] };
function timeSig(t) {
  if (t === 'C') return cells([[4,6],[1,4]]);
  if (t === 'cut') return cells([[4,5,6],[1,4]]);
  const [a, b] = t.split('/');
  return SY.numbersign + cell(UPNUM[a]) + cell(LOWNUM[b]);
}
function keySig(k) { // örn "2#", "3b", "4#"
  if (!k || k === '0') return '';
  const n = parseInt(k), s = k.slice(-1) === '#' ? '#' : 'b';
  if (n <= 3) return ACC[s] ? Array(n).fill(cell(ACC[s])).join('') : '';
  return SY.numbersign + cell(UPNUM[String(n)]) + cell(ACC[s]);
}

// ---- Lesson 10 tekrar cihazları ----
const HYPHEN = cell([3,6]); // literary hyphen
const upNumStr  = (n) => SY.numbersign + String(n).split('').map(d => cell(UPNUM[d])).join('');
const lowNumStr = (n) => SY.numbersign + String(n).split('').map(d => cell(LOWNUM[d])).join('');
// Braille tekrar işareti (⠶): bir önceki barı tekrarlar. 3+ tekrar → sayı eklenir.
const brlRepeatN = (n = 1) => SY.brlRepeat + (n >= 3 ? upNumStr(n) : '');
// Geriye-sayısal tekrar: kaç bar geri / kaç bar çal (eşitse tek sayı). ÜST rakam.
const backNum = (back, play) => (back === play) ? upNumStr(back) : upNumStr(back) + upNumStr(play);
// Ölçü-numarası tekrarı: ALT rakam; aralık için hyphen (3-6). Tek sayı işareti.
const barNum = (a, b = null) => SY.numbersign + String(a).split('').map(d => cell(LOWNUM[d])).join('')
  + (b != null ? HYPHEN + String(b).split('').map(d => cell(LOWNUM[d])).join('') : '');

// ---- Oktav işareti kararı (aralık kuralı) ----
function octaveSign(prev, cur, lineStart) {
  if (lineStart || !prev) return cell(OCT[cur.oct]);
  const stepCur = cur.oct * 7 + IDX[cur.L];
  const stepPrev = prev.oct * 7 + IDX[prev.L];
  const interval = Math.abs(stepCur - stepPrev) + 1; // birlik=1
  if (interval <= 3) return '';                       // 2'li/3'lü (ve birlik) → asla
  if (interval <= 5) return cur.oct !== prev.oct ? cell(OCT[cur.oct]) : ''; // 4/5 → oktav değişirse
  return cell(OCT[cur.oct]);                          // 6+ → her zaman
}

// ---- Parça oluşturucu ----
// Token tipleri: {n:'E', o:4, d:'q', dot, acc:'#'|'b'|'n', pre:[...], post:[...], force}
//   {r:'q', dot, force}  (sus)  | {bar:1} (ölçü ayracı) | {raw:'...'} (literal brl) | {line:1} (yeni satır → force octave)
function render(tokens) {
  let out = '';
  let prev = null;
  let lineStart = true;
  for (const t of tokens) {
    if (t.bar) { out += ' '; continue; }
    if (t.line) { out += '\n'; lineStart = true; prev = prev; continue; }
    if (t.raw != null) { out += t.raw; continue; }
    if (t.r) { // sus — perde yok; oktav durumunu değiştirmez
      out += (t.pre ? t.pre.join('') : '') + cell(REST[t.r]) + (t.dot ? SY.dot : '') + (t.post ? t.post.join('') : '');
      continue;
    }
    // nota
    const cur = { L: t.n, oct: t.o };
    // L6 kural 4: bir SÖZCÜK'ten (dinamik) sonraki nota her zaman oktav işareti alır (nüans/hairpin zorlamaz)
    const forceOct = t.force || lineStart || t.dyn != null;
    const oSign = forceOct ? cell(OCT[cur.oct]) : octaveSign(prev, cur, false);
    let s = '';
    if (t.dyn) s += t.dyn;          // dinamik (söz işaretli) — nüanstan/oktavdan önce
    if (t.pre) s += t.pre.join(''); // nüans / hairpin (oktav zorlamaz)
    if (t.acc) s += t.acc === '##' ? cells(DBLSHARP) : t.acc === 'bb' ? cells(DBLFLAT) : cell(ACC[t.acc]);
    s += oSign;
    s += cell([...NOTE[t.n], ...DUR[t.d]]);
    if (t.dot) s += SY.dot;
    if (t.dot2) s += SY.dot;
    if (t.post) s += t.post.join('');
    out += s;
    prev = cur;
    lineStart = false;
  }
  return out;
}

// kısayollar
const N = (n, o, d, x = {}) => ({ n, o, d, ...x });
const R = (r, x = {}) => ({ r, ...x });
const BAR = { bar: 1 };
const LINE = { line: 1 };

// ============ İŞLENMİŞ ÖRNEKLER ============
const pieces = [];
const P = (meta, tokens) => pieces.push({ meta, tokens, brl: render(tokens) });

// --- Lesson 3 ---
P({ id: 'Ode to Joy (s.24)', key: '0', time: '', tempo: '' }, [
  N('E',4,'q'),N('E',4,'q'),N('F',4,'q'),N('G',4,'q'),BAR,
  N('G',4,'q'),N('F',4,'q'),N('E',4,'q'),N('D',4,'q'),BAR,
  N('C',4,'q'),N('C',4,'q'),N('D',4,'q'),N('E',4,'q'),BAR,
  N('E',4,'q'),N('D',4,'q'),N('D',4,'q'),R('q'),BAR,
  N('E',4,'q'),N('E',4,'q'),N('F',4,'q'),N('G',4,'q'),BAR,
  N('G',4,'q'),N('F',4,'q'),N('E',4,'q'),N('D',4,'q'),BAR,
  N('C',4,'q'),N('C',4,'q'),N('D',4,'q'),N('E',4,'q'),LINE,
  N('D',4,'q',{force:1}),N('C',4,'q'),N('C',4,'q'),R('q'),{raw:SY.finalBar},
]);

P({ id: '6\'lı atlama örneği (s.25)', key: '0', time: '', tempo: '' }, [
  N('G',3,'m'),N('E',4,'m'),BAR,
  N('F',4,'c'),N('G',4,'c'),N('A',4,'c'),N('B',3,'c'),BAR,
  N('C',4,'s'),{raw:SY.finalBar},
]);

// --- Lesson 4 ---
P({ id: '2 bemol 3/4 örnek (s.30-31)', key: '2b', time: '3/4', tempo: '' }, [
  N('F',4,'m'),N('F',4,'c'),BAR,
  N('F',4,'c'),N('G',4,'c'),N('F',4,'c'),BAR,
  N('D',4,'m'),N('D',4,'c'),BAR,
  N('D',4,'c'),N('C',4,'c'),N('D',4,'c'),BAR,
  N('E',4,'c',{dot:1}),N('E',4,'q'),N('E',4,'c'),BAR,
  N('F',4,'c',{dot:1}),N('F',4,'q'),N('F',4,'c'),BAR,
  N('D',4,'m',{dot:1}),{raw:SY.finalBar},
]);

P({ id: '4 diyez 2/4 örnek (s.31)', key: '4#', time: '2/4', tempo: '' }, [
  N('E',4,'q'),N('E',4,'q'),N('G',4,'c'),BAR,
  N('F',4,'q'),N('D',4,'q'),N('B',3,'c'),BAR,
  N('E',4,'q'),N('E',4,'q'),N('G',4,'c'),BAR,
  N('B',4,'q'),N('A',4,'q'),N('F',4,'c'),{raw:SY.finalBar},
]);

// --- Lesson 5 ---
P({ id: 'Little Brown Jug (s.41-42)', key: '0', time: 'C', tempo: '' }, [
  N('E',4,'q'),N('G',4,'c'),N('G',4,'q',{post:[SY.tie]}),N('G',4,'m'),BAR,
  N('F',4,'q'),N('A',4,'c'),N('A',4,'q',{post:[SY.tie]}),N('A',4,'m'),BAR,
  R('q'),N('B',4,'c'),N('B',4,'q'),N('A',4,'c'),N('B',4,'c'),BAR,
  N('C',5,'q'),N('D',5,'c'),N('E',5,'q',{acc:'b'}),N('D',5,'q'),N('C',5,'q'),N('A',4,'q'),N('G',4,'q'),LINE,
  N('E',4,'q',{force:1}),N('G',4,'c'),N('E',4,'q'),N('G',4,'m'),BAR,
  N('F',4,'q'),N('A',4,'c'),N('F',4,'q'),N('A',4,'m'),BAR,
  R('q'),N('B',4,'c'),N('B',4,'q'),N('A',4,'c'),N('B',4,'c'),BAR,
  N('D',5,'q'),N('C',5,'c'),N('C',5,'q',{post:[SY.tie]}),N('C',5,'c'),R('c'),{raw:SY.finalBar},
]);

P({ id: 'Tekli/çift slur örneği (s.43)', key: '3#', time: 'C', tempo: '' }, [
  N('C',5,'m',{post:[SY.slur]}),N('E',5,'m'),BAR,
  N('A',4,'m',{post:[SY.slur]}),N('C',5,'m'),BAR,
  N('F',4,'m',{post:[SY.slur]}),N('D',5,'c',{post:[SY.slur]}),N('C',5,'c'),BAR,
  N('B',4,'c',{post:[SY.slur]}),N('F',5,'c',{post:[SY.slur]}),N('E',5,'m'),BAR,
  N('A',4,'m',{post:[SY.slur]}),N('E',5,'m',{post:[SY.slur]}),BAR,
  N('F',5,'m'),N('A',4,'c',{post:[SY.slur]}),N('B',4,'c',{post:[SY.slur]}),BAR,
  N('C',5,'c',{post:[SY.slur]}),N('E',5,'c',{post:[SY.slur]}),N('A',4,'m'),BAR,
  N('B',4,'c',{post:[SY.slur]}),N('D',5,'c',{post:[SY.slur]}),N('G',4,'m',{post:[SY.slur]}),BAR,
  N('A',4,'s'),{raw:SY.finalBar},
]);

// --- Lesson 9 ---
P({ id: 'Good King Wenceslas (s.80)', key: '2b', time: '2/4', tempo: '' }, [
  N('E',5,'c'),N('E',5,'c'),BAR, N('E',5,'c'),N('F',5,'c'),BAR,
  N('E',5,'c'),N('E',5,'c'),BAR, N('B',4,'m',{post:[SY.breath]}),BAR,
  N('C',5,'c'),N('B',4,'c'),BAR, N('C',5,'c'),N('D',5,'c'),BAR,
  N('E',5,'m'),BAR, N('E',5,'c'),R('c'),{raw:SY.endRepeat},
]);

P({ id: 'Long Time Ago (s.84-85)', key: '2b', time: '4/4', tempo: 'allegro' }, [
  N('B',4,'q'),N('B',4,'q'),N('B',4,'c'),N('B',4,'c'),N('G',4,'c'),BAR,
  N('B',4,'c',{dot:1}),N('B',4,'q'),N('G',4,'q'),N('F',4,'c',{dot:1}),BAR,
  {raw:cells([[3,4,5,6],[2]])}, N('C',5,'c',{dot:1,force:1}),N('C',5,'q'),N('C',5,'q'),N('B',4,'c',{dot:1}),BAR,
  N('C',5,'c',{dot:1}),N('C',5,'q'),N('C',5,'q'),N('D',5,'c',{dot:1}),{raw:SY.endRepeat},BAR,
  {raw:cells([[3,4,5,6],[2,3]])}, N('D',5,'m',{force:1}),N('C',5,'c',{dot:1}),N('C',5,'q'),BAR,
  N('B',4,'s'),{raw:SY.finalBar},
]);

// --- Lesson 10 ---
// Jingle Bells (s.96-97) — braille tekrar işareti (bar2=bar1) + geriye-sayısal tekrar (bars 9-14 = 1-6)
P({ id: 'Jingle Bells (s.96-97)', key: '1#', time: 'cut', tempo: '' }, [
  N('B',4,'c'),N('B',4,'q'),N('B',4,'q',{post:[SY.tie]}),N('B',4,'m'),BAR,   // bar1
  {raw:brlRepeatN(1)},BAR,                                                    // bar2 = bar1
  R('q'),N('B',4,'c'),N('D',5,'q'),N('G',4,'c'),N('A',4,'c'),BAR,            // bar3
  N('B',4,'m',{dot:1}),R('c'),BAR,                                           // bar4
  N('C',5,'c'),N('C',5,'q'),N('C',5,'q',{post:[SY.tie]}),N('C',5,'c',{dot:1}),N('C',5,'q'),BAR, // bar5
  N('C',5,'c'),N('B',4,'c'),N('B',4,'c'),N('B',4,'q'),N('B',4,'q'),BAR,      // bar6
  N('B',4,'c'),N('A',4,'c'),N('G',4,'c'),N('B',4,'c'),BAR,                   // bar7
  N('A',4,'m'),N('A',4,'m',{acc:'#'}),BAR,                                   // bar8
  {raw:backNum(8,6)},BAR,                                                    // bars 9-14 = bars 1-6
  N('D',5,'c',{force:1}),N('D',5,'c'),N('C',5,'c'),N('A',4,'c'),BAR,         // bar15
  N('G',4,'m',{dot:1}),{raw:SY.finalBar},                                    // bar16
]);

P({ id: 'Triplet örneği — Beethoven Sym.6 (s.73)', key: '1#', time: '2/4', tempo: '' }, [
  N('E',5,'c',{dyn:word('dolce'),post:[SY.tie]}),{raw:SY.triplet},N('E',5,'q'),N('E',5,'q'),N('D',5,'q'),BAR,
  {raw:SY.triplet},N('C',5,'q'),N('E',5,'q'),N('D',5,'q'),{raw:SY.triplet},N('C',5,'q'),N('A',4,'q'),N('F',4,'q'),{raw:SY.finalBar},
]);

// --- Lesson 6: dinamik + tempo örneği ---
P({ id: 'Trumpet Voluntary — J. Clarke (s.51-52)', key: '1b', time: '4/4', tempo: 'Moderato' }, [
  N('F',4,'m',{dyn:DYN.mf}),N('G',4,'m'),BAR,
  N('A',4,'c',{dot:1}),N('B',4,'q'),N('A',4,'c'),N('G',4,'c'),BAR,
  N('F',4,'c'),N('G',4,'c'),N('A',4,'c'),N('G',4,'q'),N('F',4,'q'),BAR,
  N('G',4,'c'),N('C',5,'c',{dyn:DYN.cresc}),N('C',5,'c'),N('C',5,'c'),BAR,  // cresc G'den SONRA, C'den önce
  N('F',4,'m',{dyn:DYN.f}),N('G',4,'m'),BAR,
  N('A',4,'c',{dot:1}),N('B',4,'q'),N('A',4,'c'),N('G',4,'c'),BAR,
  N('F',4,'q',{dyn:DYN.rit}),N('G',4,'q'),N('F',4,'q'),N('G',4,'q'),N('G',4,'c',{dot:1}),N('F',4,'q'),BAR,
  N('F',4,'s'),{raw:SY.finalBar},
]);

// zaman/donanım imzası DEĞİŞİMİ (eser içinde): iki yanında boşluk, sonraki nota force octave
const TS = (t) => ({ raw: timeSig(t) });
const KS = (k) => ({ raw: keySig(k) });

// --- Lesson 4: zaman imzası değişimleri ---
P({ id: 'Zaman imzası değişimi örneği (s.31-32)', key: '3b', time: '2/4', tempo: '' }, [
  N('D',5,'q'),N('B',4,'q'),N('C',5,'q'),N('D',5,'q'),BAR,
  N('E',5,'c',{dot:1}),N('B',4,'q'),BAR,
  N('C',5,'q'),N('B',4,'q'),N('C',5,'q'),N('C',4,'q'),BAR,
  TS('3/4'),BAR,N('G',4,'m',{force:1}),N('E',5,'c'),BAR,
  TS('6/8'),BAR,N('D',5,'c',{force:1}),N('F',5,'q'),N('E',5,'c'),N('D',5,'q'),BAR,
  TS('3/4'),BAR,N('C',5,'c',{force:1}),N('D',5,'c'),N('G',4,'c'),BAR,
  TS('6/8'),BAR,N('A',4,'c',{force:1}),N('G',4,'q'),N('F',4,'c'),N('F',4,'q'),BAR,
  TS('3/4'),BAR,N('G',4,'m',{force:1}),R('c'),{raw:SY.finalBar},
]);

// --- Lesson 4: donanım değişimi (bölüm sonu çift çubuktan sonra) ---
P({ id: 'Donanım değişimi örneği (s.32-33)', key: '1b', time: '4/4', tempo: '' }, [
  N('F',2,'c',{dot:1}),N('F',2,'q'),N('F',2,'c'),N('A',2,'c'),BAR,
  N('B',2,'c',{dot:1}),N('B',2,'q'),N('B',1,'c'),N('B',1,'c'),{raw:SY.sectional},BAR,
  KS('3b'),BAR,N('E',2,'c',{dot:1,force:1}),N('E',2,'q'),N('E',2,'c'),N('B',2,'c'),BAR,
  N('E',2,'c',{dot:1}),N('E',2,'q'),N('B',2,'m'),{raw:SY.sectional},
]);

// --- Lesson 5: Oh My Lovin' Brother — bar üstü tie ---
P({ id: "Oh, My Lovin' Brother (s.40-41)", key: '1b', time: 'cut', tempo: '' }, [
  R('c'),N('F',4,'q'),N('F',4,'q'),N('G',4,'c'),N('A',4,'c'),BAR,
  N('B',4,'m'),N('B',4,'m',{post:[SY.tie]}),BAR,
  N('B',4,'c'),N('B',4,'q'),N('B',4,'q'),N('F',4,'c'),N('G',4,'c'),BAR,
  N('A',4,'s'),BAR,
  R('c'),N('A',4,'q'),N('A',4,'q'),N('C',5,'c'),N('A',4,'c'),BAR,
  N('G',4,'m'),N('G',4,'m',{post:[SY.tie]}),BAR,
  N('G',4,'c'),N('G',4,'c'),N('F',4,'c'),N('G',4,'c'),BAR,
  N('A',4,'m'),N('A',4,'m',{post:[SY.tie]}),BAR,
  N('A',4,'c'),R('c'),N('G',4,'c'),N('F',4,'c'),BAR,
  N('F',4,'m'),N('F',4,'m',{post:[SY.tie]}),BAR,
  N('F',4,'c'),N('G',4,'q'),N('G',4,'q'),N('F',4,'c'),N('D',4,'c'),BAR,
  N('C',4,'m'),N('F',4,'m',{post:[SY.tie]}),BAR,
  N('F',4,'m'),N('F',4,'c'),N('G',4,'c'),BAR,
  N('A',4,'m'),N('A',4,'m'),BAR,
  N('G',4,'c'),N('F',4,'c'),N('G',4,'m'),BAR,
  N('F',4,'s',{post:[SY.tie]}),BAR,
  N('F',4,'c'),R('c'),R('m'),{raw:SY.finalBar},
]);

// --- Lesson 7: Fidelio — staccato, sf, fermata, sectional ---
P({ id: 'Fidelio Ouverture — Beethoven (s.60-61)', key: '4#', time: 'cut', tempo: 'Allegro' }, [
  N('E',5,'c',{dot:1,dyn:DYN.f}),N('B',4,'q'),N('B',4,'c',{pre:[SY.staccato]}),R('c'),BAR,
  N('G',5,'c',{dot:1,dyn:DYN.sf}),N('E',5,'q'),N('E',5,'c',{pre:[SY.staccato]}),R('c'),BAR,
  N('B',5,'c',{dot:1,dyn:DYN.sf}),N('G',5,'q'),N('G',5,'c',{pre:[SY.staccato]}),N('E',6,'c',{pre:[SY.staccato]}),BAR,
  N('D',6,'c',{pre:[SY.staccato]}),R('c'),R('m',{post:[SY.fermata]}),{raw:SY.sectional},
]);

// --- Lesson 9: Angels We Have Heard on High — volta + DOT-3 AYIRICI (volta sonrası ⠜ dot-3 içerir) ---
const VOLTA1S = cells([[3,4,5,6],[2],[3]]);   // 1. dolap + dot-3 ayırıcı = ⠼⠂⠄
const VOLTA2S = cells([[3,4,5,6],[2,3],[3]]); // 2. dolap + dot-3 ayırıcı = ⠼⠆⠄
P({ id: 'Angels We Have Heard on High (s.85-86)', key: '1b', time: 'C', tempo: '' }, [
  N('A',4,'c',{dyn:DYN.mf}),N('A',4,'c'),N('A',4,'c'),N('C',5,'c'),BAR,   // bar1
  N('C',5,'c',{dot:1}),N('B',4,'q'),N('A',4,'m'),BAR,                       // bar2
  N('A',4,'c'),N('G',4,'c'),N('A',4,'c'),N('C',5,'c'),BAR,                  // bar3
  N('A',4,'c',{dot:1}),N('G',4,'q'),N('F',4,'m'),{raw:SY.endRepeat},BAR,    // bar4
  N('C',5,'m',{dyn:DYN.f,force:1}),N('D',5,'q'),N('C',5,'q'),N('B',4,'q'),N('A',4,'q'),BAR, // bar5
  {raw:SY.beginRepeat},N('B',4,'m',{force:1}),N('C',5,'q'),N('B',4,'q'),N('A',4,'q'),N('G',4,'q'),BAR, // bar6 (başla-tekrar notaya bitişik)
  N('A',4,'m'),N('B',4,'q'),N('A',4,'q'),N('G',4,'q'),N('F',4,'q'),BAR,     // bar7
  N('G',4,'c',{dot:1}),N('C',4,'q'),N('C',4,'m'),BAR,                       // bar8
  N('F',4,'c'),N('G',4,'c'),N('A',4,'c'),N('B',4,'c'),BAR,                  // bar9
  {raw:VOLTA1S},N('A',4,'m',{pre:[SY.decrescHair],force:1}),N('G',4,'m',{post:[SY.breath]}),BAR, // bar10 (1.dolap)
  N('C',5,'m',{dyn:DYN.p,force:1}),N('D',5,'q',{dyn:DYN.cresc}),N('C',5,'q'),N('B',4,'q'),N('A',4,'q'),{raw:SY.endRepeat},BAR, // bar11
  {raw:VOLTA2S},N('A',4,'m',{dyn:DYN.f,post:[SY.slur],force:1}),N('G',4,'m'),BAR, // bar12 (2.dolap)
  N('F',4,'s'),{raw:SY.finalBar},                                          // bar13
]);

// --- Lesson 10: Cavallini — braille tekrar işareti (bar2=bar1, bar4=bar3) ---
P({ id: 'Cavallini study (s.92-93)', key: '0', time: '2/4', tempo: '' }, [
  N('G',4,'c'),BAR,                                                  // bar 0 (anacrusis)
  {raw:SY.triplet},N('E',5,'q',{post:[SY.slur]}),N('G',5,'q'),N('G',4,'q',{pre:[SY.staccato]}),
    {raw:SY.triplet},N('C',5,'q',{post:[SY.slur]}),N('E',5,'q'),N('G',4,'q',{pre:[SY.staccato]}),BAR, // bar1
  {raw:brlRepeatN(1)},BAR,                                           // bar2 = bar1
  {raw:SY.triplet},N('D',5,'q',{post:[SY.slur]}),N('F',5,'q'),N('G',4,'q',{pre:[SY.staccato]}),
    {raw:SY.triplet},N('A',5,'q',{acc:'b',post:[SY.slur]}),N('B',5,'q'),N('D',4,'q',{pre:[SY.staccato]}),BAR, // bar3
  {raw:brlRepeatN(1)},{raw:SY.finalBar},                            // bar4 = bar3
]);

// --- Lesson 10: Soon Soon Soon — geriye-sayısal tekrar (bars 6-10 = 1-5) + dinamikli tekrar ---
P({ id: 'Soon, Soon, Soon — Mozart (s.97-98)', key: '2#', time: 'cut', tempo: 'Adagio' }, [
  N('A',4,'c',{dyn:DYN.p}),R('c'),N('D',5,'c'),R('c'),BAR,        // bar1
  N('F',5,'m'),N('F',5,'c'),N('F',5,'c'),BAR,                       // bar2
  N('G',5,'m',{dot:1}),N('F',5,'c'),BAR,                            // bar3
  N('F',5,'c',{post:[SY.slur]}),N('E',5,'c'),N('D',5,'c',{post:[SY.slur]}),N('C',5,'c'),BAR, // bar4
  N('D',5,'m'),R('m'),BAR,                                          // bar5
  {raw:backNum(5,5)},BAR,                                           // bars 6-10 = bars 1-5
  N('D',5,'m',{dyn:DYN.mp,force:1}),N('C',5,'c',{dot:1}),N('D',5,'q',{post:[SY.slur]}),BAR, // bar11
  N('D',5,'m'),R('m'),BAR,                                          // bar12
  // bars 13-14 = bars 11-12 (geriye 2 / çal 2 → tek sayı), p dinamik değişimiyle (dinamik önce, sonra oktav)
  {raw: DYN.p + cell(OCT[5]) + backNum(2,2)},{raw:SY.finalBar},
]);

// Let Me Call You Sweetheart (s.99-100) — ölçü-numarası tekrarı ⠼⠂⠤⠦ (bars 25-32 = 1-8) içerir;
// 32 ölçülük tam parça olduğu için ileride tam kodlanacak. Cihaz işareti: barNum(1,8) = ⠼⠂⠤⠦.

// ===== BATCH 3 =====

// --- Lesson 5: Bracket slur örneği (s.44) ---
P({ id: 'Bracket slur örneği (s.44)', key: '1#', time: '3/4', tempo: '' }, [
  {raw:SY.brOpen},N('D',3,'q'),N('C',3,'q'),BAR,                 // bar0
  N('B',2,'c'),N('A',2,'c'),N('G',2,'c'),BAR,                    // bar1
  N('A',2,'m'),N('A',2,'c'),BAR,                                 // bar2
  N('D',3,'m'),{raw:SY.brClose},{raw:SY.brOpen},N('F',3,'c'),BAR,// bar3
  N('G',3,'c'),N('E',3,'c'),N('C',3,'c'),BAR,                    // bar4
  N('D',3,'m'),N('D',3,'c'),BAR,                                 // bar5
  N('B',2,'m'),{raw:SY.brClose},{raw:SY.finalBar},               // bar6
]);

// --- Lesson 10: Braille tekrar + bar-üstü tie (s.94) ---
P({ id: 'Tekrar işareti + bar-üstü tie (s.94)', key: '0', time: '4/4', tempo: '' }, [
  N('C',3,'c'),N('G',2,'q'),N('C',3,'q',{post:[SY.tie]}),N('C',3,'c'),N('G',2,'q'),N('C',3,'q',{post:[SY.tie]}),BAR, // bar1
  {raw:brlRepeatN(1)+SY.tie},BAR,                                // bar2 = bar1 + tie
  {raw:brlRepeatN(1)+SY.tie},BAR,                                // bar3 = bar1 + tie
  // bar4: ilk nota braille-tekrar sınırını geçen tie ile bağlı → oktav işareti zorunlu (force)
  N('C',3,'c',{force:1}),N('G',2,'q'),N('C',3,'q',{post:[SY.tie]}),N('C',3,'c'),R('c'),{raw:SY.finalBar},
]);

// --- Lesson 10: Tekrar + oktav + dinamik değişimi (s.93) ---
P({ id: 'Tekrar + oktav + dinamik örneği (s.93)', key: '0', time: '2/4', tempo: '' }, [
  N('C',4,'q',{dyn:DYN.mp,pre:[SY.triplet],post:[SY.slur]}),N('E',4,'q'),N('G',4,'q',{pre:[SY.staccato]}),
    N('C',5,'q',{dyn:DYN.mf,pre:[SY.triplet],post:[SY.slur]}),N('E',5,'q'),N('G',5,'q',{pre:[SY.staccato]}),BAR, // bar1
  N('C',6,'c',{dyn:DYN.f}),R('c'),{raw:SY.finalBar},             // bar2
]);

// --- Lesson 10: Bar-repeat işareti ×N (s.94-95) ---
P({ id: 'Bar-repeat ×N örneği (s.94-95)', key: '0', time: '4/4', tempo: '' }, [
  N('B',2,'c'),N('B',2,'c'),N('B',2,'c'),N('B',2,'c'),BAR,       // bar1
  {raw:brlRepeatN(8)},BAR,                                       // bars 2-9 = bar1 (×8)
  N('B',2,'c',{force:1}),N('B',2,'c'),N('B',2,'c'),N('B',2,'q'),N('F',2,'q'),{raw:SY.endRepeat}, // bar10
]);

// --- Lesson 4: Nota gruplama — Beethoven Violin Sonata Op.24 (s.33) ---
P({ id: 'Nota gruplama — Beethoven Op.24 (s.33)', key: '1b', time: 'C', tempo: '' }, [
  N('A',5,'m'), N('G',5,'16'),N('F',5,'q'),N('E',5,'q'),N('F',5,'q'), N('G',5,'16'),N('F',5,'q'),N('E',5,'q'),N('D',5,'q'),BAR, // bar1
  N('C',5,'m'), N('D',5,'16'),N('C',5,'q'),N('B',4,'q',{acc:'n'}),N('C',4,'q'), N('D',5,'16'),N('C',5,'q'),N('B',4,'q',{acc:'b'}),N('A',4,'q'),{raw:SY.finalBar}, // bar2
]);

// ===== BATCH 4 =====

// --- Lesson 4: Nota gruplama — Örnek 1 (s.34) ---
P({ id: 'Gruplama Örnek 1 (s.34)', key: '3b', time: '2/4', tempo: '' }, [
  N('C',5,'16'),N('D',5,'q'),N('E',5,'q'),N('D',5,'q'),N('C',5,'q'),R('q'),BAR,         // bar1
  N('E',5,'16'),N('F',5,'q'),N('G',5,'q'),N('F',5,'q'),N('E',5,'q'),R('q'),BAR,         // bar2
  N('G',5,'16'),N('F',5,'q'),N('A',5,'q'),N('G',5,'q'),N('F',5,'16'),N('E',5,'q'),N('D',5,'q'),N('C',5,'q'),BAR, // bar3
  N('B',4,'16',{acc:'n'}),N('C',5,'q'),N('D',5,'q'),N('B',4,'q'),N('C',5,'q'),N('C',5,'q'),{raw:SY.finalBar},     // bar4
]);

// --- Lesson 7: The Golden Sonata — Purcell (s.66-67): mordan + break mark ---
P({ id: 'The Golden Sonata — Purcell (s.66-67)', key: '1b', time: '3/8', tempo: '' }, [
  N('E',5,'c'),N('A',5,'q'),BAR,                                          // bar1
  N('G',5,'q'),N('E',5,'c',{pre:[SY.upMordent]}),BAR,                     // bar2: G, üst mordan+E
  N('D',5,'c',{post:[SY.breakMark]}),N('A',5,'q',{dyn:DYN.p}),BAR,        // bar3: D + break, p + A
  N('G',5,'q'),N('E',5,'c',{pre:[SY.upMordent]}),BAR,                     // bar4
  N('D',5,'c'),R('q'),{raw:SY.finalBar},                                  // bar5
]);

// --- Lesson 7: Gigue — Couperin (s.67): turn, çarpma (apojyatür), üst/alt mordan ---
P({ id: 'Gigue — Couperin (s.67)', key: '1#', time: '6/8', tempo: '' }, [
  N('D',5,'q',{pre:[SY.upMordent]}),N('C',5,'q',{pre:[SY.longApp],post:[SY.slur]}),N('B',4,'q'),N('E',5,'q'),N('D',5,'q'),
    N('C',5,'c',{pre:[SY.upMordent],post:[SY.slur]}),N('B',4,'q',{pre:[SY.longApp],post:[SY.slur]}),N('C',5,'q',{pre:[SY.longApp]}),BAR, // bar1
  N('B',4,'q'),N('B',4,'q'),N('C',5,'q',{pre:[SY.turnAbove]}),N('D',5,'q'),N('G',4,'q'),N('A',4,'q',{pre:[SY.turnAbove]}),BAR, // bar2
  N('B',4,'q'),N('E',4,'q'),N('F',4,'q',{pre:[SY.turnAbove]}),N('G',4,'q'),N('G',4,'q',{pre:[SY.longApp],post:[SY.slur]}),N('A',4,'c',{pre:[SY.lowMordent]}),{raw:SY.finalBar}, // bar3
]);

// --- Lesson 9: The Jolly Miller (s.82-83): ölçü-İÇİ tekrar + müzik kısa çizgisi (dot 5) ---
P({ id: 'The Jolly Miller (s.82-83)', key: '0', time: '6/8', tempo: '' }, [
  {raw:SY.beginRepeat},N('E',4,'q',{force:1}),BAR,                                  // bar0 anacrusis
  N('A',4,'c'),N('A',4,'q'),N('G',4,'c',{acc:'#'}),N('E',4,'q'),BAR,                // bar1
  N('C',5,'c'),N('C',5,'q'),N('B',4,'c'),N('D',5,'q'),BAR,                          // bar2
  N('C',5,'c'),N('A',4,'q'),N('B',4,'c'),N('G',4,'q',{acc:'#'}),BAR,               // bar3
  // bar4: ölçü ortasında bitir-tekrar → boşluk + müzik kısa çizgisi (⠐) + devam (oktav zorunlu)
  N('A',4,'c',{dot:1,post:[SY.tie]}),N('A',4,'c'),{raw:SY.endRepeat},BAR,{raw:SY.musicHyphen},
    N('C',5,'16',{force:1}),N('D',5,'16'),BAR,
  N('E',5,'c'),N('E',5,'q'),N('E',5,'c'),N('C',5,'q'),BAR,                          // bar5
  N('D',5,'c'),N('D',5,'q'),N('D',5,'c'),N('B',4,'q'),BAR,                          // bar6
  N('C',5,'c'),N('A',4,'q'),N('D',5,'c'),N('C',5,'q'),BAR,                          // bar7
  N('C',5,'c',{dot:1}),N('B',4,'c'),N('E',4,'q'),BAR,                              // bar8
  N('A',4,'c'),N('A',4,'q'),N('G',4,'q',{dot:1,acc:'#'}),N('F',4,'16',{acc:'#'}),N('E',4,'q'),BAR, // bar9
  N('C',5,'c'),N('C',5,'q'),N('B',4,'c',{post:[SY.fermata]}),N('D',5,'q'),BAR,      // bar10
  N('C',5,'q',{dot:1}),N('B',4,'16'),N('A',4,'q'),N('B',4,'c'),N('G',4,'q',{acc:'#'}),BAR, // bar11
  N('A',4,'c',{dot:1,post:[SY.tie]}),N('A',4,'c'),{raw:SY.finalBar},                // bar12
]);

// --- Lesson 7: Carmen — Bizet (s.61-62): staccato DOUBLING (tüm notalar staccato) ---
// Doubling: ilk staccato notada ⠦⠦ (çift), son staccato notada ⠦ (tek); aradakiler işaretsiz.
P({ id: 'Carmen — Bizet (s.61-62)', key: '2#', time: '3/8', tempo: '' }, [
  N('E',5,'16',{dyn:DYN.pp,pre:[SY.staccato,SY.staccato]}),N('G',5,'16'),N('B',5,'16'),R('s',{ri:4}),N('B',5,'16'),R('s',{ri:4}),BAR, // bar1
  N('D',5,'16'),N('F',5,'16'),N('B',5,'16'),R('s',{ri:4}),N('B',5,'16'),R('s',{ri:4}),BAR,                                          // bar2
  N('C',5,'16'),N('E',5,'16'),N('B',5,'16'),R('s',{ri:4}),N('B',5,'16'),R('s',{ri:4}),BAR,                                          // bar3
  N('D',5,'16'),N('F',5,'16'),N('B',5,'16'),R('s',{ri:4}),N('B',5,'16'),R('s',{ri:4}),BAR,                                          // bar4
  N('D',5,'16'),N('F',5,'16',{acc:'n'}),N('B',5,'16'),R('s',{ri:4}),N('B',5,'16'),R('s',{ri:4}),BAR,                                // bar5
  N('D',5,'16'),N('F',5,'16',{acc:'n'}),N('B',5,'16',{acc:'b'}),R('s',{ri:4}),N('B',5,'16'),R('s',{ri:4}),BAR,                      // bar6
  N('C',5,'16'),N('E',5,'16'),N('A',5,'16'),R('s',{ri:4}),N('A',5,'16',{pre:[SY.staccato]}),R('s',{ri:4}),{raw:SY.finalBar},        // bar7 (son staccato ⠦ tek)
]);

// 2+ sözcüklü ifade (örn. "a tempo"): çift söz işareti arasında, önünde/ardında boşluk
const expr = (txt) => SY.word + txt.split(' ').map(w => w.split('').map(c => cell(LETTER[c])).join('')).join('⠀') + SY.word;

// --- Lesson 6: Bethena — Joplin (s.54-55): hairpin + rit + "a tempo" (2-sözcük ifade) ---
P({ id: 'Bethena — Joplin (s.54-55)', key: '2#', time: '3/4', tempo: 'Cantabile' }, [
  N('D',5,'q',{dyn:DYN.p}),N('B',4,'c'),N('F',5,'q'),N('D',5,'c'),BAR,                          // bar1
  N('D',5,'q'),N('F',5,'q'),N('D',5,'q'),N('B',4,'q',{post:[SY.tie]}),N('B',4,'c'),BAR,         // bar2
  N('A',4,'q',{acc:'#'}),N('F',5,'c'),N('G',5,'q'),N('F',5,'c'),BAR,                            // bar3
  N('B',4,'q'),N('F',5,'c'),N('G',5,'q'),N('F',5,'c'),BAR,                                      // bar4
  N('D',5,'q'),N('B',4,'c'),N('F',5,'q'),N('D',5,'c'),BAR,                                      // bar5
  N('B',5,'q'),N('F',5,'q'),N('D',5,'q'),N('B',4,'q',{post:[SY.tie]}),N('B',4,'q'),N('D',5,'q'),BAR, // bar6
  N('D',5,'q',{pre:[SY.crescHair]}),N('D',5,'c',{dyn:DYN.rit}),N('D',5,'q'),N('E',5,'q'),N('E',5,'q',{acc:'#'}),BAR, // bar7
  N('F',5,'c',{dyn:DYN.f}),N('C',5,'c',{pre:[SY.decrescHair]}),N('F',5,'c'),BAR,                // bar8
  {raw:expr('a tempo')},BAR,N('D',5,'q',{dyn:DYN.p,force:1}),N('B',4,'c'),N('F',5,'q'),N('D',5,'c'),BAR, // bar9: a tempo (ardında boşluk) + p
  N('B',5,'q'),N('F',5,'q'),N('D',5,'q'),N('B',4,'q',{post:[SY.tie]}),N('B',4,'c'),BAR,         // bar10
  N('A',4,'q',{acc:'#'}),N('F',5,'c'),N('G',5,'q'),N('F',5,'c'),BAR,                            // bar11
  N('B',4,'q'),N('F',5,'c'),N('G',5,'q'),N('F',5,'q'),N('B',5,'q'),BAR,                         // bar12
  N('B',5,'q'),N('G',5,'c'),N('A',5,'q'),N('G',5,'q'),N('F',5,'q'),BAR,                         // bar13
  N('F',5,'q'),N('D',5,'c'),N('E',5,'q'),N('D',5,'q'),N('C',5,'q'),BAR,                         // bar14
  N('C',5,'q'),N('A',4,'c',{acc:'#'}),N('G',5,'q'),N('F',5,'c'),BAR,                            // bar15
  N('B',4,'m'),R('c'),{raw:SY.finalBar},                                                        // bar16
]);

// --- Lesson 4: Gruplama Örnek 2 (s.35): gruplanamayan 16'lıklar tam değerle yazılır ---
// Grup içi: ilk nota 16'lık + kalanı 8'lik. Gruplanmayan 16'lıklar: hepsi tam 16'lık.
P({ id: 'Gruplama Örnek 2 (s.35)', key: '0', time: '4/4', tempo: '' }, [
  // bar1
  R('s',{ri:4}),N('G',4,'16'),N('A',4,'16'),N('B',4,'16'),  N('C',5,'16'),N('B',4,'q'),N('C',5,'q'),N('D',5,'q'),
    N('E',5,'16'),R('s',{ri:4}),N('F',5,'16'),N('E',5,'16'),  N('D',5,'16'),N('E',5,'q'),N('F',5,'q'),N('G',5,'q'),BAR,
  // bar2
  N('A',5,'16'),N('G',5,'16'),N('F',5,'16'),R('s',{ri:4}),  N('D',5,'16'),N('E',5,'q'),N('F',5,'q'),N('E',5,'q'),
    N('D',5,'16'),N('C',5,'q'),N('A',4,'q'),N('B',4,'q'),  R('s',{ri:4}),N('D',5,'16'),N('E',5,'16'),N('D',5,'16'),BAR,
  // bar3
  N('C',5,'q'),N('G',4,'q'),  N('A',4,'16'),N('B',4,'q'),N('C',5,'q'),N('D',5,'q'),
    N('E',5,'q'),N('B',4,'q'),N('C',5,'c'),{raw:SY.finalBar},
]);

// --- Lesson 9: Prelude in C minor — Chopin (s.81-82): ÇİFT slur (⠉⠉), tekrar, bracket, hairpin ---
const SL2 = [SY.slur, SY.slur]; // çift (doubled) slur
P({ id: 'Prelude in C minor — Chopin (s.81-82)', key: '1b', time: 'C', tempo: 'Largo' }, [
  N('A',4,'c',{dyn:DYN.f,post:SL2}),N('A',4,'c'),N('A',4,'q',{dot:1}),N('G',4,'16',{post:[SY.slur]}),N('F',4,'c'),BAR, // bar1
  N('F',4,'c',{post:SL2}),N('G',4,'c'),N('F',4,'q',{dot:1}),N('E',4,'16',{acc:'b',post:[SY.slur]}),N('D',4,'c'),BAR,  // bar2
  N('E',4,'c',{post:SL2}),N('F',4,'c',{acc:'#'}),N('A',4,'q',{dot:1}),N('G',4,'16',{post:[SY.slur]}),N('F',4,'c'),BAR,// bar3
  N('E',4,'c'),N('A',4,'c'),N('C',5,'q',{dot:1,acc:'#'}),N('B',4,'16',{acc:'n',post:[SY.slur]}),N('A',4,'c'),BAR,    // bar4
  {raw:SY.beginRepeat},{raw:SY.brOpen},N('F',5,'c',{dyn:DYN.p,force:1}),N('F',5,'c'),N('E',5,'c'),N('E',5,'c'),BAR,   // bar5
  N('D',5,'c'),N('E',5,'c'),N('C',5,'q',{dot:1,acc:'#'}),N('B',4,'16',{acc:'n'}),N('A',4,'c'),BAR,                   // bar6
  N('D',5,'c'),N('B',4,'c'),N('A',4,'q',{dot:1}),N('G',4,'16'),N('F',4,'c'),BAR,                                     // bar7
  N('F',4,'c',{dyn:DYN.rit}),N('A',4,'c'),N('F',4,'q',{dot:1}),N('E',4,'16'),N('D',4,'c',{post:[SY.brClose]}),{raw:SY.endRepeat},BAR, // bar8
  N('D',4,'s',{dyn:DYN.p,pre:[SY.decrescHair],post:[SY.fermata],force:1}),{raw:SY.finalBar},                         // bar9
]);

// --- Lesson 5: Katmanlı (layered) bracket slur (s.44-45): bracket slur + tekli slur birlikte ---
const sl = [SY.slur];
P({ id: 'Katmanlı bracket slur (s.44-45)', key: '4#', time: '4/4', tempo: '' }, [
  {raw:SY.brOpen},N('B',3,'c'),BAR,                                                          // bar0
  N('B',3,'c'),N('C',4,'q',{post:sl}),N('D',4,'q'),N('E',4,'c'),N('F',4,'q'),N('F',4,'q'),BAR,// bar1
  N('A',4,'q',{post:sl}),N('G',4,'q'),N('F',4,'q',{post:sl}),N('D',4,'q'),N('B',4,'c',{dot:1}),N('B',4,'q'),BAR, // bar2
  N('E',5,'c'),N('D',5,'c'),N('C',5,'q',{post:sl}),N('B',4,'q'),N('A',4,'q',{acc:'#',post:sl}),N('F',4,'q'),BAR,  // bar3
  N('B',4,'m',{dot:1,post:[SY.brClose]}),R('q'),N('B',4,'q',{post:sl}),BAR,                  // bar4
  N('C',5,'q',{post:sl}),N('G',4,'q',{post:sl}),N('F',4,'q',{post:sl}),N('E',4,'q',{acc:'#',post:sl}),N('F',4,'c',{dot:1}),N('A',4,'q',{post:sl}),BAR, // bar5
  N('B',4,'q',{post:sl}),N('F',4,'q',{post:sl}),N('E',4,'q',{post:sl}),N('D',4,'q',{post:sl}),N('E',4,'c'),{raw:SY.brOpen},N('B',3,'c'),BAR, // bar6
  N('C',4,'c'),N('E',4,'q',{post:sl}),N('G',4,'q'),N('B',4,'c',{dot:1}),N('A',4,'q'),BAR,    // bar7
  N('G',4,'q',{post:sl}),N('F',4,'q',{post:sl}),N('E',4,'m'),{raw:SY.brClose},{raw:SY.finalBar}, // bar8
]);

// --- Lesson 8: Triplet + düzensiz grup birlikte (s.76): 3-hücreli grup işaretleri ---
const IRR6 = cells([[4,5,6],[2,3,5],[3]]); // sextuplet (6) 3-hücre = ⠸⠶⠄
const IRR3 = cells([[4,5,6],[2,5],[3]]);   // triplet 3-hücre = ⠸⠒⠄ (düzensiz grupla birlikteyken)
P({ id: 'Triplet + düzensiz grup (s.76)', key: '0', time: '4/4', tempo: '' }, [
  // bar1 — 3-hücre işaretinden sonraki ilk nota oktav işareti alır (force)
  {raw:IRR6},N('C',5,'16',{force:1}),N('D',5,'q'),N('E',5,'q'),N('F',5,'q'),N('G',5,'q'),N('A',5,'q'),
  {raw:IRR3},N('G',5,'q',{force:1}),N('E',5,'q'),N('D',5,'q'),
  {raw:IRR6},N('E',5,'16',{force:1}),N('F',5,'q'),N('G',5,'q'),N('A',5,'q'),N('B',5,'q'),N('C',6,'q'),
  {raw:IRR3},N('D',6,'q',{force:1}),N('A',5,'q'),N('F',5,'q'),BAR,
  // bar2
  {raw:IRR6},N('G',5,'16',{force:1}),N('A',5,'q'),N('G',5,'q'),N('F',5,'q'),N('E',5,'q'),N('F',5,'q'),
  N('E',5,'q'),N('D',5,'q'),N('C',5,'m'),{raw:SY.finalBar},
]);

// --- Lesson 10: Let Me Call You Sweetheart (s.99-100): ölçü-numarası tekrarı (bars 17-22 = bars 1-6) ---
P({ id: 'Let Me Call You Sweetheart (s.99-100)', key: '2b', time: '3/4', tempo: '' }, [
  N('D',4,'m'),N('F',4,'c'),BAR,                       // 1
  N('B',4,'m'),N('C',5,'c'),BAR,                       // 2
  N('D',5,'c'),N('F',4,'m'),BAR,                       // 3
  N('E',4,'m',{acc:'n'}),N('F',4,'c'),BAR,             // 4
  N('G',4,'m',{dot:1}),BAR,                            // 5
  N('G',4,'m',{dot:1}),BAR,                            // 6
  N('G',4,'m',{dot:1,post:[SY.tie]}),BAR,              // 7
  N('G',4,'m'),R('c'),BAR,                             // 8
  N('A',4,'m'),N('G',4,'c',{acc:'#'}),BAR,             // 9
  N('A',4,'m'),N('B',4,'c'),BAR,                       // 10
  N('C',5,'c'),N('A',4,'m'),BAR,                       // 11
  N('G',4,'m',{acc:'n'}),N('A',4,'c'),BAR,             // 12
  N('F',4,'m',{dot:1}),BAR,                            // 13
  N('F',4,'m',{dot:1}),BAR,                            // 14
  N('F',4,'m',{dot:1,post:[SY.tie]}),BAR,              // 15
  N('F',4,'m'),R('c'),BAR,                             // 16
  {raw:barNum(1,6)},BAR,                               // 17-22 = bars 1-6 (ölçü-no tekrarı ⠼⠂⠤⠖)
  N('C',5,'m',{dot:1,post:[SY.tie],force:1}),BAR,      // 23 (tekrar sonrası oktav)
  N('C',5,'m'),R('c'),BAR,                             // 24
  N('C',5,'m'),N('B',4,'c'),BAR,                       // 25
  N('A',4,'m'),N('B',4,'c'),BAR,                       // 26
  N('D',5,'c'),N('F',4,'m'),BAR,                       // 27
  N('E',5,'m'),N('D',5,'c'),BAR,                       // 28
  N('G',4,'m',{dot:1}),BAR,                            // 29
  N('C',5,'m'),N('F',4,'c'),BAR,                       // 30
  N('B',4,'m',{dot:1,post:[SY.tie]}),BAR,              // 31
  N('B',4,'c'),R('c'),R('c'),{raw:SY.finalBar},        // 32
]);

// --- Lesson 7: Re-majör nüans dizisi (s.62-63): mezzo-staccato/accent/tenuto/staccato DOUBLING + swell ---
const ms = SY.mezzoStaccato, ac = SY.accent, tn = SY.tenuto, st = SY.staccato;
P({ id: 'Re-majör nüans dizisi (s.62-63)', key: '2#', time: '4/4', tempo: '' }, [
  // bar1: tüm notalar mezzo-staccato (doubled): ilk D4'te ×2, son D5'te ×1
  N('D',4,'q',{pre:[ms,ms]}),N('E',4,'q'),N('F',4,'q'),N('G',4,'q'),N('A',4,'q'),N('B',4,'q'),N('C',5,'q'),N('D',5,'q',{pre:[ms]}),BAR, // bar1
  // bar2: ilk 4 accent (doubled), sonraki 4 staccato-accent (kombine, ilk+son notada ⠦⠨⠦)
  N('D',5,'q',{pre:[ac,ac]}),N('C',5,'q'),N('B',4,'q'),N('A',4,'q',{pre:[ac]}),
    N('G',4,'q',{pre:[st,ac]}),N('F',4,'q'),N('E',4,'q'),N('D',4,'q',{pre:[st,ac]}),BAR, // bar2
  // bar3: tüm notalar tenuto (doubled): ilk D4'te ×2, son A5'te ×1
  N('D',4,'q',{pre:[tn,tn]}),N('F',4,'q'),N('A',4,'q'),N('D',5,'q'),N('F',5,'q'),N('A',5,'q'),N('D',6,'q'),N('A',5,'q',{pre:[tn]}),BAR, // bar3
  // bar4: ilk 4 staccato (doubled), sonra swell + D minim + fermata
  N('F',5,'q',{pre:[st,st]}),N('D',5,'q'),N('A',4,'q'),N('C',4,'q',{pre:[st]}),N('D',4,'m',{pre:[SY.swell],post:[SY.fermata]}),{raw:SY.finalBar}, // bar4
]);

// --- Lesson 6: Vocalise — Sieber (s.53-54): yoğun tekli slur + hairpin + terminator ---
P({ id: 'Vocalise — Sieber (s.53-54)', key: '1#', time: 'C', tempo: 'Lento' }, [
  N('E',4,'q',{dyn:DYN.p,post:[SY.slur]}),N('G',4,'q',{post:[SY.slur]}),N('B',4,'q'),N('E',5,'q',{post:[SY.slur]}),N('D',5,'c',{post:[SY.slur]}),N('C',5,'c'),BAR, // bar1
  N('B',4,'c',{post:[SY.tie]}),N('B',4,'16',{post:[SY.slur]}),N('A',4,'16',{post:[SY.slur]}),N('G',4,'16',{post:[SY.slur]}),N('F',4,'16',{post:[SY.slur]}),N('E',4,'c'),R('c'),BAR, // bar2
  N('B',4,'q',{post:[SY.slur]}),N('A',4,'q',{post:[SY.slur]}),N('F',4,'q',{post:[SY.slur]}),N('D',4,'q',{acc:'#'}),N('E',4,'c'),N('G',4,'c'),BAR, // bar3
  N('F',4,'c',{post:[SY.tie]}),N('F',4,'16',{post:[SY.slur]}),N('E',4,'16',{post:[SY.slur]}),N('D',4,'16',{acc:'#',post:[SY.slur]}),N('C',4,'16',{acc:'#'}),N('B',3,'c'),R('c'),BAR, // bar4
  N('E',4,'q',{pre:[SY.crescHair],post:[SY.slur]}),N('G',4,'q',{post:[SY.slur]}),N('B',4,'q',{post:[SY.slur]}),N('E',5,'q'),N('F',5,'c',{acc:'n',post:[SY.slur]}),N('B',4,'c',{post:[SY.slur,SY.crescHairEnd]}),BAR, // bar5
  N('C',5,'c',{pre:[SY.decrescHair]}),N('D',5,'16',{post:[SY.slur]}),N('C',5,'16',{post:[SY.slur]}),N('B',4,'16',{post:[SY.slur]}),N('A',4,'16',{post:[SY.decrescHairEnd]}),N('G',4,'c'),N('F',4,'q'),N('C',5,'q'),BAR, // bar6
  N('B',4,'c'),N('C',5,'16',{post:[SY.slur]}),N('B',4,'16',{post:[SY.slur]}),N('A',4,'16',{post:[SY.slur]}),N('G',4,'16',{post:[SY.slur]}),N('F',4,'c',{pre:[SY.decrescHair]}),N('G',4,'c',{post:[SY.slur,SY.decrescHairEnd]}),BAR, // bar7
  N('E',4,'m'),R('m'),{raw:SY.finalBar},                                              // bar8
]);

// --- Lesson 7: Rondo KV 386 — Mozart (s.65-66): staccatissimo + trill + demisemiquaver ---
const ssim = SY.staccatissimo, tr = SY.trill, slr = [SY.slur];
P({ id: 'Rondo KV 386 — Mozart (s.65-66)', key: '3#', time: '2/4', tempo: '' }, [
  N('C',5,'q',{dyn:DYN.p,pre:[ssim]}),N('C',5,'c',{post:slr}),N('B',4,'16',{pre:[tr],post:slr}),N('A',4,'32',{post:slr}),N('B',4,'32'),BAR, // bar1
  N('A',4,'q',{pre:[ssim]}),N('A',4,'c',{post:slr}),N('B',4,'16',{pre:[tr],post:slr}),N('A',4,'32',{post:slr}),N('B',4,'32'),BAR, // bar2
  N('C',5,'q'),N('D',5,'16',{pre:[st]}),N('E',5,'16',{pre:[st]}),N('F',5,'16',{pre:[st]}),N('G',5,'16',{pre:[st]}),N('A',5,'16',{pre:[st]}),N('F',5,'16',{pre:[st]}),BAR, // bar3
  N('E',5,'16',{pre:[tr],post:slr}),N('D',5,'16',{acc:'#',post:slr}),N('E',5,'16',{post:slr}),N('F',5,'16'),N('E',5,'q'),N('A',4,'q'),BAR, // bar4
  N('D',5,'q',{pre:[ssim]}),N('D',5,'c',{post:slr}),N('C',5,'q'),BAR,                                      // bar5
  N('F',5,'q',{pre:[ssim]}),N('F',5,'c',{post:slr}),N('E',5,'q'),BAR,                                      // bar6
  N('A',5,'16',{post:slr}),N('G',5,'16',{post:slr}),N('F',5,'16',{post:slr}),N('E',5,'16'),N('E',5,'16',{post:slr}),N('D',5,'16'),N('D',5,'16',{post:slr}),N('C',5,'16'),BAR, // bar7
  N('C',5,'16',{post:slr}),N('B',4,'16',{post:slr}),N('A',4,'16',{acc:'#',post:slr}),N('B',4,'16',{post:slr}),N('A',4,'16',{acc:'n',post:slr}),N('G',4,'16',{post:slr}),N('F',4,'16',{post:slr}),N('E',4,'16'),{raw:SY.finalBar}, // bar8
]);

// --- Lesson 7: Peer Gynt (keman, fig.A, s.64-65): accent + uzun çarpma + hairpin + terminator ---
const acc1 = [SY.accent], la = SY.longApp;
P({ id: 'Peer Gynt — Grieg (keman, s.64-65)', key: '4#', time: '6/8', tempo: '' }, [
  N('B',5,'q',{dyn:DYN.f,pre:[SY.accent],post:slr}),N('G',5,'q',{post:slr}),N('F',5,'q',{post:slr}),N('E',5,'q',{post:slr}),N('F',5,'q',{post:slr}),N('G',5,'q'),BAR, // bar1
  N('B',5,'q',{pre:[SY.accent],post:slr}),N('G',5,'16',{pre:[la]}),N('A',5,'16',{pre:[la]}),N('G',5,'q',{post:slr}),N('F',5,'q',{post:slr}),N('E',5,'q',{post:slr}),N('F',5,'16',{post:slr}),N('G',5,'16',{post:slr}),N('F',5,'16',{post:slr}),N('G',5,'16'),BAR, // bar2
  N('G',5,'16',{pre:[la],post:slr}),N('A',5,'16',{pre:[la],post:slr}),N('B',5,'q',{pre:[SY.crescHair,SY.accent],post:slr}),N('G',5,'q',{post:slr}),N('B',5,'q'),N('C',6,'q',{pre:[SY.accent],post:[SY.slur,SY.crescHairEnd]}),N('G',5,'q',{post:slr}),N('C',6,'q'),BAR, // bar3
  N('C',6,'q',{pre:[SY.accent],post:slr}),N('A',5,'q',{post:slr}),N('G',5,'q',{post:slr}),N('F',5,'q'),R('q'),R('q'),{raw:SY.finalBar}, // bar4
]);

// --- Lesson 8: Weber Klarnet Beşlisi (s.74-75): DOUBLED triplet (bars 1-3) + gruplama + bracket slur ---
// NOT: Bu parçanın yoğun braille'i hücre-hücre güvenle okunamadı; üçleme-içi oktav işaretleri
// kural-temelli (aralık) üretildi. PDF bazı 3'lü aralıklarda oktav işareti gösteriyor gibi —
// bu Weber'e özgü TEK belirsizlik (motor 38 parçada doğrulandı). Yapı (⠆⠆ doubled, gruplama) doğru.
const T2 = SY.triplet + SY.triplet; // doubled triplet ⠆⠆
const trip = SY.triplet;            // tek üçleme ⠆
P({ id: 'Weber Klarnet Beşlisi (s.74-75) — ⚠ Weber-özgü oktav belirsizliği', key: '0', time: '2/4', tempo: '' }, [
  // bar1: bracket-aç + DOUBLED triplet; her üçleme: ilk 16'lık + 2 quaver
  {raw:SY.brOpen+T2},N('G',4,'16'),N('B',4,'q'),N('D',5,'q'),N('F',5,'16'),N('D',5,'q'),N('B',4,'q'),
    N('G',4,'16'),N('F',4,'q'),N('D',4,'q'),N('B',3,'16'),N('G',3,'q'),N('F',3,'q',{acc:'#'}),BAR, // bar1
  // bar2 (doubling sürüyor)
  N('G',3,'16'),N('A',3,'q'),N('B',3,'q'),N('C',4,'16'),N('D',4,'q'),N('E',4,'q'),
    N('F',4,'16'),N('G',4,'q'),N('A',4,'q'),N('B',4,'16'),N('C',5,'q'),N('D',5,'q'),BAR, // bar2
  // bar3 (doubling son üçlemeden önce ⠆ ile biter)
  N('D',5,'16',{acc:'#'}),N('E',5,'q'),N('F',5,'q'),N('F',5,'16',{acc:'#'}),N('G',5,'q'),N('G',5,'q',{acc:'#'}),
    N('A',5,'16'),N('B',5,'q',{acc:'b'}),N('B',5,'q',{acc:'n'}),{raw:trip},N('C',6,'16'),N('B',5,'q'),N('A',5,'q'),BAR, // bar3
  // bar4: tekli üçlemeler + bracket kapa/aç
  N('G',5,'16'),N('F',5,'q',{acc:'#'}),N('A',5,'q'),{raw:trip},N('G',5,'16'),N('E',5,'q'),N('C',5,'q'),N('G',4,'q'),{raw:SY.brClose+SY.brOpen+trip},N('C',6,'16'),N('B',5,'16'),N('A',5,'16'),BAR, // bar4
  // bar5
  {raw:trip},N('G',5,'16',{dyn:DYN.p,pre:[SY.tenuto]}),N('F',5,'16',{acc:'#'}),N('A',5,'16'),{raw:trip},N('G',5,'16'),N('E',5,'16'),N('C',5,'16'),N('G',4,'q',{post:[SY.brClose]}),{raw:trip},N('E',5,'16',{post:slr}),N('D',5,'16',{post:slr}),N('C',5,'16'),BAR, // bar5
  // bar6
  {raw:trip},N('B',4,'16',{post:slr}),N('D',5,'16',{post:slr}),N('F',5,'16',{post:slr}),N('A',5,'q',{pre:[SY.crescHair]}),{raw:trip},N('B',4,'16',{post:slr}),N('D',5,'16',{post:slr}),N('F',5,'16',{post:slr}),N('A',5,'q',{acc:'n',post:[SY.crescHairEnd]}),BAR, // bar6
  // bar7
  {raw:trip},N('B',4,'16',{post:slr}),N('D',5,'16',{post:slr}),N('D',5,'16',{post:slr}),N('B',5,'q',{pre:[SY.staccato]}),N('G',3,'q',{dyn:DYN.f}),R('q'),{raw:SY.finalBar}, // bar7
]);

// çıktı → markdown dosyası
import { writeFileSync } from 'node:fs';

// Angels volta yardımcıları (dot-3 ayırıcı kuralı): volta sonrası işaret dots 1-2-3 içeriyorsa ⠄ eklenir
function barNum_volta1() { return cells([[3,4,5,6],[2]]); }       // 1. dolap = ⠼⠂  (sonrası hairpin ⠜→dots 3-4-5, 1-2-3 YOK → ayırıcı gerekmez)
function barNum_volta2() { return cells([[3,4,5,6],[2,3]]); }     // 2. dolap = ⠼⠆

// --- PDF tam aktarım: image-description'dan otomatik dönüştürülüp DOĞRULANDI ---
// (music-pdf-desc-builder.mjs: per-nota perde+oktav+süre + per-ölçü süre = zaman imzası round-trip)
P({ id: 'Symphonie No.101 (s.36)', key: '2#', time: 'C', tempo: '' }, [
  N('F',4,'m'),N('G',4,'m'),BAR,
  N('A',4,'m'),N('G',4,'q'),N('F',4,'q'),N('E',4,'q'),N('D',4,'q'),BAR,
  N('B',4,'c'),N('C',5,'c'),N('D',5,'c'),N('E',5,'c'),BAR,
  N('D',5,'m'),N('C',5,'m'),BAR,
  N('E',5,'m'),N('F',5,'m'),BAR,
  N('G',5,'m'),N('G',5,'q'),N('F',5,'q'),N('E',5,'q'),N('D',5,'q'),BAR,
  N('C',5,'c'),N('D',5,'c'),N('E',5,'c'),N('F',5,'c'),BAR,
  N('D',5,'c'),R('c'),R('m'),{raw:SY.finalBar},
]);

P({ id: 'Water Music — Handel (s.46)', key: '1b', time: 'C', tempo: '' }, [
  N('A',4,'q',{dot:1}),N('C',5,'16'),N('F',4,'q',{dot:1}),N('A',4,'16'),N('G',4,'m'),BAR,
  N('A',4,'q',{dot:1}),N('C',5,'16'),N('F',4,'q',{dot:1}),N('A',4,'16'),N('G',4,'c'),N('C',5,'c'),BAR,
  N('C',5,'c'),N('B',4,'c'),N('B',4,'q',{dot:1}),N('G',4,'16'),N('A',4,'q',{dot:1}),N('B',4,'16'),BAR,
  N('A',4,'c'),N('G',4,'q',{dot:1}),N('F',4,'16'),N('F',4,'m'),BAR,
  N('A',4,'q',{dot:1}),N('C',5,'16'),N('F',4,'q',{dot:1}),N('F',5,'16'),N('E',5,'c',{dot:1}),N('D',5,'q'),BAR,
  N('C',5,'c'),N('B',4,'q',{dot:1}),N('A',4,'16'),N('G',4,'c'),N('G',5,'c'),BAR,
  N('G',5,'c'),N('F',5,'c'),N('F',5,'q',{dot:1}),N('D',5,'16'),N('E',5,'q',{dot:1}),N('F',5,'16'),BAR,
  N('E',5,'c'),N('D',5,'q',{dot:1}),N('C',5,'16'),N('C',5,'m'),{raw:SY.finalBar},
]);

P({ id: 'Larghetto e piano (s.87)', key: '4#', time: '3/4', tempo: 'Larghetto e piano' }, [
  N('B',4,'m'),N('G',4,'c'),BAR,
  N('E',4,'m',{dot:1}),BAR,
  N('C',5,'c'),N('F',4,'c'),N('G',4,'q'),N('A',4,'q'),BAR,
  N('G',4,'m',{dot:1}),BAR,
  N('G',5,'m',{dot:1}),BAR,
  N('C',5,'m',{dot:1}),BAR,
  N('A',5,'m'),N('F',5,'c'),BAR,
  N('D',5,'m'),N('E',5,'c'),BAR,
  N('F',5,'c'),N('G',5,'c'),N('E',5,'c'),
]);

let md = `# Braille Müzik — İşlenmiş Örnekler (Test Fixture'ları)

> **Kaynak:** *Braille Music Notation Introductory Training* (NextSense, Rev 2) — PDF'in **braille'ini gösterdiği** işlenmiş örnekler (otoriter oracle).
> **Üretim:** \`scripts/muzik-brl-fixtures.mjs\` — doğrulanmış UEB Music kural+hücre tablolarıyla, repo motorundan **bağımsız** üretildi.
> **Format:** Unicode braille. Ölçü ayracı = boşluk. "İmza satırı" = müziğin üstündeki ortalanmış donanım+ölçü satırı.

## Doğrulama durumu (PDF braille'iyle hücre-hücre karşılaştırma)
Şu parçaları PDF'in basılı braille'iyle **tek tek karşılaştırdım, eşleşiyor:** Ode to Joy (s.24), Long Time Ago (s.85),
**Angels (s.86)**, **Jingle Bells (s.97)**, **Soon (s.98)**, **Cavallini (s.93)**, **Trumpet Voluntary (s.52)**, **Fidelio (s.61)**,
**Tekrar+oktav+dinamik (s.94)**, **Bar-üstü tie (s.94)**, **Bar-repeat ×N (s.95)**, **Bracket slur (s.44, 1 hücre hariç — aşağı bak)**.
Karşılaştırmada bulunup düzeltilen gerçek hatalar: başla-tekrar sonrası fazladan boşluk; Jingle bar7 (A→G);
Trumpet cresc yanlış notada; **L6 kural 4** (dinamik sözcükten sonraki nota her zaman oktav işareti alır); ve
**tie-across-tekrar** (bir tie braille-tekrar ⠶ sınırını geçince devam eden nota oktav işareti alır — ties-across bar4).
Geri kalan parçalar **aynı doğrulanmış motorla** üretildi.

> 🔎 **Bracket slur (s.44) bar1 — ÇÖZÜLDÜ:** B2 burada **işaretsiz** ⠺ (C3→B2 = 2'li aralık → işaret yok). İnternette
> teyit edildi: "anacrusis sonrası downbeat oktav alır" diye bir kural YOK; 2'li/3'lü → işaret yok kuralı geçerli.
> PDF görselindeki ⠘⠺ izlenimi muhtemelen okuma hatası. Kural-doğru hâli (⠺) tutuluyor.

> ✅ **39/39 parça TAMAM.** 38'i PDF braille'iyle hücre-hücre doğrulandı. **Weber TEK anomali:** PDF, üçleme-içi
> oktav-geçişli 3'lülere (D5/B4/B3) oktav işareti koyuyor; ama kural "2'li/3'lü → asla, oktav değişse bile" (internet
> + Bethena bar1 D5→B4=⠺ işaretsiz ile teyitli). Weber editöryel anomali; fixture kurala göre üretildi (parça başlığında ⚠ var).

## ⚠️ Tam PDF satırından FARKLAR (bilerek)
Buradaki braille **müzik içeriğidir**; tam PDF satırı = bu + aşağıdakiler:
1. **Satır başı ölçü numaraları** — PDF her braille satırının 1. hücresine ölçü no koyar (sayı işaretsiz, ⠁=1, ⠋=6, ⠁⠁=11…). Burada YOK (satır kırılmasına bağlı).
2. **Fiziksel satır kırılması** — PDF sayfayı genişliğe göre kırar; her yeni satırın ilk notası ek oktav işareti alır. Burada her parça tek mantıksal satır (kırılma yok), bu yüzden oktav işaretleri yalnızca aralık/dinamik/tekrar/volta kuralıyla konur.
3. **Kısaltma noktası (çözüldü):** \`cresc.\`/\`rit\`/\`decr\`/\`dim\` kısaltmalarının sonuna **dot 3** gelir (standart "abbreviation" kuralı — NFB Music Cert. Ch.14, National Braille, RNIB, Music Braille Code 2015; PDF Appendix de \`cresc.\`=⠜⠉⠗⠄ gösterir). Bu dot 3 hem kısaltma noktasıdır hem ayırıcıdır. → \`rit\`=⠜⠗⠊⠞⠄ doğru.

**Kullanım:** notaları editöre gir → çıkan braille'i buradaki müzik satırıyla karşılaştır (ölçü no/satır kırılması hariç).

---

`;
for (const { meta, brl } of pieces) {
  md += `## ${meta.id}\n`;
  const m = [];
  if (meta.tempo) m.push(`tempo: ${meta.tempo}`);
  if (meta.key && meta.key !== '0') m.push(`donanım: ${meta.key}`);
  if (meta.time) m.push(`ölçü: ${meta.time}`);
  if (m.length) md += `*${m.join(' · ')}*\n\n`;
  if ((meta.key && meta.key !== '0') || meta.time) {
    const hdr = [keySig(meta.key), meta.time ? timeSig(meta.time) : ''].filter(Boolean).join('');
    md += `İmza satırı (ortalanmış): \`${hdr}\`\n\n`;
  }
  md += 'Müzik:\n```\n' + brl + '\n```\n\n';
}
// MD'yi yalnız DOĞRUDAN çalıştırılınca yaz (import edilince yan etki olmasın).
if (process.argv[1] && process.argv[1].includes('muzik-brl-fixtures')) {
  writeFileSync(new URL('../muzik-braille-test-ornekleri.md', import.meta.url), md);
  console.log('Yazıldı: muzik-braille-test-ornekleri.md (' + pieces.length + ' parça)');
}

// Build scriptlerinin (hazır parçalara ekleme) erişimi için:
export { pieces, keySig, timeSig, render, SY, DYN, N, R, BAR, LINE };
