# Braille Education App — Claude Session Guide

Auto-read by Claude Code at session start. Read before touching any code.

---

## 1. Project Overview

React + Vite SPA. Braille education for visually impaired users.
- **Router:** HashRouter (`/#/route`)
- **A11y:** NVDA screen reader + Web Speech API (Turkish TTS)
- **Targets:** Desktop (NVDA), tablet (touch), Android APK (Capacitor)
- **Source:** `C:\Users\HP\braille\src`

---

## 2. Core Template Component

**Single template used across all learning pages (Modül 10 BRF tools excepted).**
`DesenOgretici` was deleted; every former DesenOgretici page now uses `CokHucreOkuyucu`.

### `src/components/CokHucreOkuyucu.jsx`

Universal braille cell teacher. Steps through each cell one at a time.
When `kategoriAdi` is set it generates DesenOgretici-style instructions ("A harfi, 1. ve 2. noktadan oluşur. Lütfen sırayla dokunun.").

**Data format:**
```js
// Simple single-cell (e.g. HarfEgitimi):
{ yazi: 'A', ttsYazi: 'A harfi', hucreler: [[1,2]] }

// Multi-cell with labels (e.g. RakamEgitimi):
{ yazi: '1', ttsYazi: 'bir rakamı', hucreler: [[3,4,5,6],[2]], hucreAdlari: ['sayı işareti hücresi','rakam hücresi'],
  yonergeDetay: '...' }

// With extra info panel (e.g. MatematikSembolEgitimi):
{ yazi: '+', hucreler: [[3,5]], yonergeDetay: '...', altMetin: '+',
  ekBilgi: { aciklama?, kurallar?, ornekler? } }

// Kisaltma pages:
{ yazi: 'a', ttsYazi: 'a harfi, anne kelimesi', hucreler: [[1]], tamYonergeMetni: '...',
  altMetin: '"anne"', altMetinAciklama: '...' }
```

**Used by (teaching):** `HarfEgitimi`, `RakamEgitimi`, `NoktalamaEgitimi`, all 5 Kisaltma pages,
`NoktalamaIsaretleri`, `OzelIsaretler`, `MatematikRakamEgitimi`, `MatematikSiraSayilari`,
`MatematikSembolEgitimi`, `MatematikOlcuEgitimi`, `MatematikGeometriEgitimi`,
`FenYunanHarfler`, `FenSembolEgitimi`, `MuzikNotaEgitimi`, `MuzikSembolEgitimi`,
`KuranHarfEgitimi`, `KuranHarekeEgitimi`, `AlmancaBrailleSayfa`, `FransizcaBrailleSayfa`, `IngilizceBrailleSayfa`

**Used by (reading):** `KuranHeceOkuma` → `KuranKelimeOkuma`, `KuranKelimeTemelSayfa`,
`KuranKelimeOkumaSayfa`, `KuranSureOkuma`, `KuranTecvidEgitimi`, `MuzikDiziOkuma`,
`MatematikIfadeOkuma`, `MuzikBrailleSayfa`

**Key props:**
```jsx
<CokHucreOkuyucu
  baslik="Title"
  ogeler={[{ yazi, ttsYazi?, okunus?, anlam?, aciklama?,
             hucreler: number[][], hucreAdlari?, hucreBasliklari?,
             tamYonergeMetni?, yonergeDetay?, sesOncesiYonergeMetni?,
             altMetin?, altMetinAciklama?, ekBilgi?: { aciklama?, kurallar?, ornekler? } }]}
  bolumAnahtari="harfler"
  // Teaching mode (eski DesenOgretici props):
  kategoriAdi="harfi"         // generates "A harfi, 1. ve 2. noktadan oluşur..." instruction
  noktalariSeslendir          // appends full dot composition (kisaltma pages)
  seslendirmeDili="tr"        // TTS language: 'tr'(default)|'de'|'fr'|'en'
  // Audio:
  ogeSesiCal={fn}
  ogeSesiOnceCal              // play audio before instruction
  ogeSesiHerZaman             // always play audio, no toggle
  otomatikOgeSesi             // start with audio enabled
  ustSesKontrolleriGoster     // show audio toggle in banner
  ustSesButonEtiketi="Nota Sesi"
  ustSesButonAriaLabel="Nota sesini çal"
  // Reading mode:
  rtl
  sadeceHucreYonergesiOku     // skip word/meaning, only read "cell X: tap dots N"
  ikiHucreYanYana
  yonergeFormati="standart"   // 'standart' | 'sirayla'
/>
```
`sesOncesiYonergeMetni` is read before `ogeSesiCal`; then item sound plays; then
`tamYonergeMetni`/generated instruction. Use for music pages where info must precede sound.

---

## 3. Narration Lock System (`CokHucreOkuyucu`)

**Shared dot-list helper (defined in both files):**
```js
// noktaListesi(nArr, tekEk, cogulEk)
// [1]     + 'dan','dan' → "1. noktadan"
// [1,2]   + 'dan','dan' → "1. ve 2. noktalardan"
// [1,2,4] + 'dan','dan' → "1., 2. ve 4. noktalardan"
// For "dokunun": noktaListesi(arr, 'ya', 'a')  → "1. noktaya" / "1. ve 2. noktalara"
```
Pages that hardcode `yonergeDetay` (e.g. `RakamEgitimi`, `MatematikRakamEgitimi`) define
a local `nl()` helper with the same logic — update them too when format changes.

**Shared refs/state:**
```js
const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
const yonergeNesilRef = useRef(0);          // generation counter — invalidates old timers
const yonergeKilitTimerRef = useRef(null);  // safety timeout ref
```

**Shared functions:**
```js
yonergeKilidiAc(nesil)                      // unlock dots (checks generation)
yonergeyiKilitleyerekSeslendir(metin, opt)  // speak + lock; safety: Math.min(30000, 6000+len*200)
yonergeBeklemeUyar()                        // show toast only — no focus, no NVDA announcement, TTS uninterrupted
```

**Flow:**
1. New item → increment generation, `setYonergeOkunuyor(true)`, call `yonergeyiKilitleyerekSeslendir`
2. During narration: Tab/Arrow/Enter/Space → blocked by keydown capture → `yonergeBeklemeUyar()`
3. `yonergeBeklemeUyar` → `gosterToast(...)` only (visual only, NVDA silent, TTS keeps playing)
4. `onSon` fires → `yonergeKilidiAc(nesil)` → `setYonergeOkunuyor(false)`
5. Narration ends → `konus('Başla')` (TTS + NVDA aria-live, no `srAtla`) → focus invisible `dotSentinelRef` sentinel (tabIndex={-1}, aria-hidden); Tab → first dot

**Toast JSX (always this exact pattern):**
```jsx
{toast && <div className="toast" aria-live="off">{toast}</div>}
```

---

## 4. Other Key Components

### `src/components/BrailleCell.jsx`
Single braille cell (6 dots). Used on every learning page.

**Critical props:**
```jsx
<BrailleCell
  tiklanabilir                     // interactive → renders as <button>
  kilitli={yonergeOkunuyor}        // TRUE: renders dots as <div>, aria-hidden, no events
  onKilitliEtkilesim={yonergeBeklemeUyar}
  hucreAdi="1. hücre"              // multi-cell: group label announced by NVDA
/>
```
**Dot label rule:** `"${n}. nokta, ${durum}"` — was "numaralı nokta", now just "X. nokta"

### `src/components/BrailleKlavye.jsx`
6-key keyboard for writing exercises. Dot label: `"${n}. nokta, klavye ${key} tuşu"`

### `src/components/DesktopShell.jsx`
Wraps every page: banner + left sidebar (module tabs) + content area.
- Homepage (`/`) → shell NOT rendered; AnaMenu manages its own layout
- Ghost buttons at bottom of every page:
```jsx
<KarisikYazmaButonu hayalet />   {/* sr-only: "Bu derste karışık yazma etkinliği başlat" */}
<button className="hayalet-btn" onClick={() => navigate('/')}>Ana sayfaya dön</button>
```

### `src/components/KarisikYazmaButonu.jsx`
Links to the mixed writing exercise for the current lesson.
- Normal: visible button in banner
- `hayalet` prop: sr-only ghost button
- Returns `null` when already on `/yazma-karisik/...`

### `src/components/PageHeader.jsx`
Page title component. Carries `.banner-baslik` class → targeted by `SayfaOdakYonetimi`.

### `src/components/BrailleGrid.jsx`
Colored grid of braille cells. Color-codes cells by semantic type:
- letter/default → blue (`#3b82f6`)
- kisaltma/kök/parça/ayırma → red (`#ef4444`)
- noktalama → green (`#10b981`)
- islem/bölük → purple (`#7c3aed`)
- isaret → black (`#000000`)
- birim → CSS var `--braille-noktalama-fill`

### `src/components/CokluTest.jsx`
General-purpose multi-category quiz. Shuffles 10 random questions from a source.
```jsx
<CokluTest
  baslik="Test Başlığı"
  kaynaklar={{
    anahtar: {
      etiket: 'Görünen ad',
      kategori: 'sembol/işaret/...',
      veri: [{ ad, ariaAd?, ipucu?, hucreler: number[][] }]
    }
  }}
/>
```

### `src/components/FullscreenButonu.jsx`
Fullscreen API toggle button. Uses `tamEkranApiDestekleniyorMu()` from `utils/tamEkran.js`; shows iOS tip if API not supported.

### `src/components/GorunumGecisi.jsx`
Normal/lowVision theme toggle for low-vision users. Calls `ayarGuncelle({ tema })` and announces via TTS.

### `src/components/TanitimTuru.jsx`
Multi-step onboarding tour dialog (6 steps). Shown once via `localStorage` key `braille-tur-tamam-v1`. Props: `zorunlu` (default `true`), `onKapat`.

### `src/components/OkumaModu.jsx`
Reading mode grid of cards (used inside `CokHucreOkuyucu`). Contains three card-label helper functions:

```js
// Karakter sayısına göre font küçültme sınıfı — uzun metinler karta sığsın
etiketFontSinifi(metin)
// metin.length > 22 → 'etiket-kucuk'
// metin.length > 14 → 'etiket-orta'
// else             → '' (default size)

// Parantez içi ifadeyi alt açıklama olarak ayır: "A (B)" → { ana:"A", alt:"B" }
// Regex: /^(.*?)\s*\(([^)]+)\)\s*$/ — SON parantezi ayırır
// "Lam-elif (Vakfı La) (Ayet sonunda)" → { ana:"Lam-elif (Vakfı La)", alt:"Ayet sonunda" }
etiketiAyristir(etiket)

// Tek başına görünmeyen Arapça birleşen diyakritikler için ◌ (U+25CC) önekle
// ARAPC_DIAKRITIK = /^[ً-ٰٟ]+$/
// "َ" → "◌َ"  — Harf kullanma, SADECE kesik çizgili daire (◌)
okumaEtiketiHazirla(etiket)
```

**Font sınıfı CSS kuralları** (styles.css'te):
```css
/* Amasya SADECE RTL panelde (Modül 5 Arapça) — Latin/rakam kartlarında kullanma */
.okuma-modu-etiket              { font-family: 'Segoe UI', sans-serif; }
.okuma-modu-panel.rtl .okuma-modu-etiket { font-family: 'Amasya', 'Segoe UI', sans-serif; }
.okuma-modu-etiket.etiket-orta  { font-size: clamp(0.68rem, 1.7vw, 0.88rem); }
.okuma-modu-etiket.etiket-kucuk { font-size: clamp(0.56rem, 1.4vw, 0.72rem); }
```
`.okuma-modu-kutu` has `overflow: hidden` to prevent card overflow.

**CRITICAL:** Never set Amasya as primary font on `.okuma-modu-etiket` — it replaces Western digits with Eastern Arabic-Indic numerals (١٢٣ instead of 123), breaking Module 1 and Module 6 reading mode cards.

### `src/components/music/` — Music Editor Components
Editor UI for the BRF music notation system:
- `MuzikBrfScoreEditor.jsx` — main score editor
- `MuzikScoreSvg.jsx` — SVG rendering of the score
- `MuzikScoreToolbar.jsx` — editor toolbar
- `MuzikBrailleOutput.jsx` — braille output panel
- `MuzikBrfViewTabs.jsx` — view tab switcher
- `MuzikKeySignatureModal.jsx` — key signature dialog
- `MuzikBarlineTimeSignatureModal.jsx` — barline/time signature dialog
- `MuzikNotaEditModal.jsx` — note edit dialog
- `MuzikScoreHeader.jsx` / `MuzikScoreHeaderBraille.jsx` — score header display
- `MuzikScoreBrailleOverlay.jsx` — braille overlay on score
- `MuzikTimeSignatureGlyph.jsx` — time signature glyph
- `MuzikKlavyeYardim.jsx` — keyboard shortcut help panel
- `MuzikToolOptions.jsx` — tool options panel
- `ScoreBarlineGlyph.jsx` — barline glyph
- `BrailleDetayPanel.jsx` / `BrailleHucreMini.jsx` — braille detail panels
- `BrfMusicCellDebugTable.jsx` — debug table (dev only)
- `BeamGroup.jsx` — beam grouping component
- `svg/` — low-level SVG glyphs: `AccidentalGlyph`, `BeamGroup`, `BeamLine`, `Flag`, `GraceNoteGlyph`, `MusicNoteGlyph`, `NoteHead`, `RestGlyph`, `SlurTiePath`, `StaffLines`, `Stem`

---

## 5. App.jsx — Routing & Focus Management

### `SayfaOdakYonetimi` component
Manages NVDA focus on route change:
- **Entering any page:** focus `.banner-baslik` or `h1/h2` inside `#main .ds-content`
- **Returning to `/`:** focus `.modul-yan .modul-sekme.aktif`
- **First load** (`oncekiYol.current === null`): skip — prevents StrictMode double-fire

---

## 6. Utility Files

### `src/utils/ses.js`
```js
konus(text, { kesintiyle?, hiz?, onSon?, dil?, srAtla? })
// dil: 'tr' (default), 'en', 'de', 'fr'
// srAtla: true → TTS speaks but does NOT write to _srBolge (use when JSX aria-live already announces)
// onSon: called when utterance ends — used to unlock narration

konusmayiDurdur()          // cancels pending timer + speechSynthesis.cancel()
titret(pattern)            // haptic feedback
dogruSesi()                // rising two-note sound (positive); gated by sesEfektiAcik
yanlisSesi()               // falling two-note sound (negative); gated by sesEfektiAcik
tiklamaSesi()              // short neutral click; gated by sesEfektiAcik
basariBildir(text)         // dogruSesi() + konus()
hataBildir(text)           // yanlisSesi() + konus()
ekranOkuyucuBildir(text)   // writes to aria-live region (works even when TTS is off)
ekranOkuyucuTemizle()      // immediately clears _srBolge (cancel pending clear timer too)
```

**Sound effects independence:** `sesEfektiAcikMi()` checks only `sesEfektiAcik`.
Click/correct/wrong sounds play even when `sesAcik` (TTS narration) is off.

**CRITICAL — Single TTS channel:** `konus()` cancels current utterance.
You cannot speak a warning AND resume narration from the same point.
For warnings during narration: show a visual-only toast (`aria-live="off"`) — TTS keeps playing uninterrupted. Never call `konus()`, `pause()`/`resume()`, or focus the toast for the warning.

**Completion screen pattern (bitti useEffect):**
```js
ekranOkuyucuTemizle();               // clear _srBolge left by basariBildir('Tebrikler!')
konus(bittiMesaji, { srAtla: true }); // TTS only; JSX <div role="status" aria-live> handles NVDA
```
Without this pattern, the tebrikler text stays in `_srBolge` and NVDA reads it after the ghost
"Ana sayfaya dön" button at the end of the virtual buffer (duplicate).

### `src/utils/ilerleme.js`
```js
ogrenildiIsaretle(bolum, oge)   // mark item as learned
indeksKaydet(anahtar, indeks)   // save furthest-reached index
indeksAl(anahtar)               // read saved index (returns 0 if none)
sonraOgrenKaydet(anahtar, oge)  // add to "learn later" list
sonraOgrenKaldir(anahtar, oge)
sonraOgrenAl(anahtar)
```

**Monotonic rule:** only save when `indeks > indeksAl(bolumAnahtari)` — so progress bar
in main menu never goes backward even though lessons always restart from 0.

### `src/utils/noktaYardimci.js`
```js
noktaListesi(nArr, tekEk, cogulEk)  // "1. noktaya" / "1. ve 2. noktalara" etc.
nlDan(nArr)                          // shorthand: noktaListesi(nArr, 'dan', 'dan')
```
Imported by `CokHucreOkuyucu` and any page that builds dot-description strings
(`RakamEgitimi`, `MatematikRakamEgitimi`, `MatematikSiraSayilari` — they import `nlDan as nl`).

### `src/utils/isaretCevir.js`
```js
isarettenOgeye(s, { ekBilgi?, okumaOzeti? } = {})
// Converts a braille data symbol object to a CokHucreOkuyucu oge.
// ekBilgi: true  → populate ekBilgi panel from s.aciklama/s.kurallar/s.ornekler
// okumaOzeti: true → fall back to s.okumaOzeti when s.aciklama is empty (language pages)
// Always passes s.hucreBasliklari through when present.
```
Used by: `NoktalamaIsaretleri`, `OzelIsaretler`, `MatematikSembolEgitimi`, `MatematikOlcuEgitimi`,
`MatematikGeometriEgitimi`, `FenSembolEgitimi`, `MuzikSembolEgitimi`, `YabanciBrailleSayfa`.

### `src/utils/diziYardimci.js`
```js
karistir(dizi)     // Fisher-Yates shuffle — returns new array, does not mutate
HUCRE_SIRA_SOZ     // ['birinci','ikinci','üçüncü','dördüncü','beşinci','altıncı']
```
`HUCRE_SIRA_SOZ` is imported as `HUCRE_ETIKET` alias in test pages; as-is in `YazmaKarisik`.

### `src/utils/ayarlar.js`
```js
ayarlariAl()            // → { sesAcik, konusmaHizi, sesEfektiAcik, titresimAcik,
                        //     yaziBoyutu, tema, tonejsSes, notaOdakPiyano,
                        //     notaTusDuzeni, gizliModuller }
ayarGuncelle(yama)      // partial update, fires listeners, applies CSS
ayarlariSifirla()       // reset to defaults
ayarlariDinle(fn)       // subscribe to changes, returns unsubscribe fn
uygulaCss()             // sync --font-base + data-theme to document (called automatically)
```
**Settings fields:**
- `konusmaHizi` 0.5–1.5 (default 0.95)
- `yaziBoyutu` 16–32 px (default 17)
- `tema` `'normal'` | `'lowVision'` (default `'normal'`; old `'dark'`→`'lowVision'`, `'light'`→`'normal'` migrated automatically)
- `tonejsSes` bool — play piano via Tone.js engine
- `notaOdakPiyano` bool — play piano on note focus/click (accessibility)
- `notaTusDuzeni` `'alfabetik'` | `'piyano'` — music keyboard layout
- `gizliModuller` string[] — hidden module ids

---

## 7. CSS — Critical Classes

| Class | Purpose |
|-------|---------|
| `.hayalet-btn` | sr-only ghost button; appears visually only on `:focus-visible` |
| `.toast` | Brief (2s) visual-only warning during narration. Use `aria-live="off"`; do not focus it. |
| `.modul-yan .modul-sekme.aktif` | Active module tab in sidebar — focus target on back-navigation |
| `.banner-baslik` | Page heading — focus target on forward-navigation |
| `.page-mid button.dot` | First dot — Tab from sentinel lands here |
| `.okuma-modu-etiket` | Reading mode card label — Amasya font; responsive font-size |
| `.okuma-modu-etiket.etiket-orta` | Reading mode: medium reduction for 15–22 char labels |
| `.okuma-modu-etiket.etiket-kucuk` | Reading mode: large reduction for 23+ char labels |
| `.okuma-modu-kutu` | Reading mode card — `overflow: hidden` prevents long-text overflow |
| `.okuma-modu-alt` | Grey sub-description below card label (parenthetical or altEtiket) |

---

## 8. Kisaltma Pages (`CokHucreOkuyucu` + `noktalariSeslendir`)

All five use `<CokHucreOkuyucu noktalariSeslendir ... />`:
```
KisaltmaBirHarfli    → bolumAnahtari="kisaltma-bir-harfli"
KisaltmaIkiHarfli    → bolumAnahtari="kisaltma-iki-harfli"
KisaltmaHece         → bolumAnahtari="kisaltma-hece"
KisaltmaKelimeKoku   → bolumAnahtari="kisaltma-kelime-koku"
KisaltmaKelimeParcasi → bolumAnahtari="kisaltma-kelime-parcasi"
```

---

## 9. Kuran Pages (`CokHucreOkuyucu` + audio)

```
KuranHeceOkuma       → KuranKelimeOkuma(kaynakAnahtari="hece")      ogeSesiOnceCal + ogeSesiHerZaman
KuranKelimeTemelSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime-temel")
KuranKelimeOkumaSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime")
KuranSureOkuma       → CokHucreOkuyucu directly
KuranTecvidEgitimi   → route: /kuran-uzatma  bolumAnahtari="kuran-tecvid" (localStorage key — do NOT change)
```
Audio files: `public/audio/kuran/`. `SesIzinEkrani` component handles first-tap unlock.

**Module 5 menu notes:**
- Hece Okuma ve Kelime Okuma items are **hidden from menu** (removed from `moduller.jsx` ogeler). Data still exists in `kuran.js` — do not delete it.
- Route was renamed `/kuran-tecvid` → `/kuran-uzatma`. `bolumAnahtari` stays `"kuran-tecvid"` for localStorage compatibility.
- User-facing strings in Module 5 use **â → a** (e.g. "Ta-i Merbuta", "Elif-i Zaid"). Audio slug files (`kuranSesHelpers.js`) are **excluded** — they contain `hı: 'hâ'` and a `.replace(/â/g, 'a')` regex that must stay intact.

### Music BRF Editor (`MuzikBrfYazim.jsx`)
Route `/muzik-brf-yazim`. Full score editor backed by `components/music/MuzikBrfScoreEditor.jsx` and the `utils/music-brf/` pipeline. Uses Bravura SMuFL font for glyphs. Separate from the lesson pages — no `CokHucreOkuyucu`, no learning flow.

### Module 8 Music Lesson Pages (`MuzikBrailleSayfa` + `CokHucreOkuyucu`)

- `/muzik/notalar`, `/muzik/sureler`, and sibling music lessons are backed by `src/data/muzik.js` and mapped through `src/pages/MuzikBrailleSayfa.jsx`.
- `/muzik/grup/:grupId` is rendered by `src/pages/MuzikBrailleMenu.jsx`; group card labels should strip the leading `Müzik ·`/`Müzik:` prefix with `muzikMenuBasligi()` while lesson page headers may keep their full `pageBaslik`.
- Current user-facing music lesson labels: `zaman-imzasi` is `Ölçü sayılarının yazımı`; `degistirici` is `Değiştirici işaretler`.
- `olcu-cizgileri` terms use: blank measure separator as `[[]]` with a skip-style `tamYonergeMetni`, `ileriye doğru tekrar`, `geriye doğru tekrar`, `1. dolap`, `2. dolap`.
- `dinamikler` is user-facing `Nüanslar`; entries should be read by meaning, not letters: `çift piyano`, `piyano`, `mezo piyano`, `mezo forte`, `forte`, `çift forte`, `sforzando`, `kreşendo`, `dekreşendo`, `diminiendo`, `riterdando`.
- `Andante` in `MUZIK_TEMPO_ISARETLERI` has explicit cells; both `n` letters must be `[1, 3, 4, 5]`.
- Tempo cells are in `src/data/muzik.js`: edit `tempoHucreleri(...)` callers or override a term with explicit `hucreler: [[...], ...]` inside `MUZIK_TEMPO_ISARETLERI` (for example `A tempo` currently sits there).
- `sus` lesson uses `birlik sus`, `ikilik sus`, `dörtlük sus`, `sekizlik sus`; do not label the first two as `tam`/`yarım`. `sus-ileri` is a separate advanced lesson for `16'lık`, `32'lik`, `64'lük`, `128'lik` rests.
- The first `sus` item has a `sesOncesiYonergeMetni` explaining that piano marks sounding notes and baget/metronome marks rests in 4/4.
- Rest and 8th-note audio examples use explicit `ritimOrnegi` metadata in `src/data/muzik.js`, played by `MuzikBrailleSayfa`. Use `piyanoOlaylari` for sustained examples: birlik sus = 1 measure sustained piano + 1 measure rest; ikilik sus = beats 1-2 piano, beats 3-4 rest; dörtlük sus = beats 1-2 short piano, beats 3-4 rest; sekizlik notes = piano on every `1-ve, 2-ve, 3-ve, 4-ve`; sekizlik sus = piano on numbered beats, rest on `ve`.
- Dotted rests/notes belong in the separate `uzatma-noktasi` lesson. The rule is: dot 3 follows the note/rest cell and extends the previous value by half.
- If an intro/info sentence must be read before the piano/sample sound, put it in `sesOncesiYonergeMetni`; the order is info → item sound → `tamYonergeMetni`/generated instruction.
- For clickless first-step info items, keep the whole message in `tamYonergeMetni`; prefix user-facing intro text with `Bilgilendirme:` when that is the desired narration.

---

## 10. NVDA A11y Patterns

**Programmatic focus template:**
```js
const id = window.requestAnimationFrame(() => el.focus());
return () => window.cancelAnimationFrame(id);
```

**Warning toast pattern:**
```jsx
{toast && <div className="toast" aria-live="off">{toast}</div>}
```
Warning toasts during narration are visual only. Do not focus them and do not announce them
through NVDA; the active TTS instruction must remain uninterrupted.

**aria rules:**
- `aria-live="assertive"` — urgent: warnings, errors
- `aria-live="polite"` — non-urgent: progress, instructions
- `tabIndex={-1}` — programmatic focus only (not in Tab order)
- `aria-hidden={true}` — locked dots, decorative icons

---

## 11. Common Mistakes

| Wrong | Correct |
|-------|---------|
| `useState(indeksAl(...))` — resumes from saved | `useState(0)` — always start from beginning |
| Change only DesenOgretici | **Always update CokHucreOkuyucu too** |
| `konus()`, `pause()`/`resume()`, or `aria-live` on warning toast | `gosterToast()` only, `aria-live="off"` — visual only, NVDA silent, TTS uninterrupted |
| Safety timer `90ms/char` — unlocks too early | `Math.min(30000, 6000 + len * 200)` |
| Focusing/announcing warning toast after `setState` | Do not focus warning toast; keep it `aria-live="off"` and visual-only |
| StrictMode: boolean flag for first-load skip | Compare `oncekiYol.current === null` |
| `kilitli`: only block onClick | Render as `<div>`, `aria-hidden`, remove all handlers |
| Auto-focus first dot after narration ends | Focus `dotSentinelRef` sentinel → Tab goes to first dot |
| Dot format: "1, 2 numaralı noktalardan" | `noktaListesi()`: "1. ve 2. noktalardan" |
| `noktaListesi(arr, 'dan')` — 2 args, cogulEk undefined → "noktalarundefined" in TTS | Always pass all 3 args: `noktaListesi(arr, 'dan', 'dan')` |
| Update `noktaListesi` in `noktaYardimci.js` | Also update `nlDan` alias usages: `RakamEgitimi`, `MatematikRakamEgitimi`, `MatematikSiraSayilari` all import `nlDan as nl` |
| `sesEfektiAcikMi()` gates on both `sesAcik` and `sesEfektiAcik` | Only gate on `sesEfektiAcik` |
| `konus(bittiMesaji)` in bitti useEffect — writes to `_srBolge`, NVDA reads it after "Ana sayfaya dön" | `ekranOkuyucuTemizle()` then `konus(bittiMesaji, { srAtla: true })` |
| Music intro before piano/sample sound placed inside `tamYonergeMetni` | Use `sesOncesiYonergeMetni` so order is info → sound → main instruction |
| Page-specific intro only on first item — complex `tamYonergeMetni` | Use `i === 0 ? { tamYonergeMetni: \`${INTRO} ${ad}, ${detay} Lütfen...\` } : { yonergeDetay: detay }` |
| `hucreBasliklari` hardcoded as `['1','2']` for multi-cell items | Set `hucreBasliklari` in data item (e.g. `['harf işareti','büyük harf']`); pass through converter with `hucreBasliklari: s.hucreBasliklari` |
| `isarettenOgeye` still outputs `noktalar` field | `CokHucreOkuyucu` ignores `noktalar`; correct converter: `{ yazi, hucreler, yonergeDetay, ekBilgi }` (no `noktalar`) |
| `ad`/`ariaAd`/`noktalar` data format (old `DesenOgretici`) | Use `yazi`/`ttsYazi`/`hucreler: [[...]]` for `CokHucreOkuyucu` |
| `sessizBaslat=true` in `SesIzinEkrani` + passing `ilkOgeSesiHariciCalindi={true}` → first item audio skipped | `sessizBaslat=true` only silently unlocks browser; user never heard audio → do NOT pass `ilkOgeSesiHariciCalindi` (leave default `false`) |
| `AnaMenu` module tab click: focus stays on tab button | `modulSec()` calls `rAF → icerikBaslikRef.current?.focus()`; `h2.modul-icerik-baslik` has `tabIndex={-1}` |
| Reading mode: use a letter (e.g. `ب`) as base for standalone Arabic diacritics | Use `◌` (U+25CC, DOTTED CIRCLE) — standard linguistic base; never a real letter |
| `CokHucreOkuyucu`: `fontFamily: "'Amasya',..."` on `yazi` div — renders digits as Eastern Arabic (١٢٣) in non-Arabic pages | Use `rtl ? "'Amasya',..." : "'Segoe UI',..."` so Amasya only activates for RTL (Arabic) content |
| `CokHucreOkuyucu`: `altMetin` always uses Amasya — breaks Latin symbols/text | Use `/[؀-ۿ]/.test(k.altMetin)` to apply Amasya only when altMetin contains Arabic characters |
| â→a replacement touches audio slug files (`kuranSesHelpers.js`) | Only replace in user-facing strings (kuran.js `ad` fields, moduller.jsx, page titles). `kuranSesHelpers.js` has `hâ` audio key and regex — leave untouched |
| `etiketiAyristir` splits the first parenthetical — "Lam-elif (Vakfı La) (Ayet sonunda)" → ana:"Lam-elif", alt:"Vakfı La" | Regex `^(.*?)\s*\(([^)]+)\)\s*$` splits the LAST group — intermediate parens stay in `ana` |
| Bulk search-replace â→a across entire repo | Use per-file targeted replacement; `kuranSesHelpers.js` and regex strings must be excluded |

---

## 12. File Map

```
src/
├── App.jsx                      # Router + SayfaOdakYonetimi + all route definitions
├── styles.css                   # Global styles (.hayalet-btn, .toast, .cell, .dot, etc.)
├── components/
│   ├── BrailleCell.jsx          # ★ Single cell — used on every learning page
│   ├── BrailleGrid.jsx          # Colored braille cell grid (color by semantic type)
│   ├── BrailleKlavye.jsx        # 6-key keyboard for writing exercises
│   ├── CokHucreOkuyucu.jsx      # ★ Universal braille teaching template (all lesson pages)
│   ├── CokluTest.jsx            # General-purpose multi-category quiz component
│   ├── DesktopShell.jsx         # ★ Page wrapper (banner + sidebar + ghost buttons)
│   ├── FullscreenButonu.jsx     # Fullscreen API toggle button
│   ├── GorunumGecisi.jsx        # Normal/lowVision theme toggle (low-vision accessibility)
│   ├── KarisikYazmaButonu.jsx   # Mixed writing exercise link button
│   ├── OkumaModu.jsx            # Reading mode list inside CokHucreOkuyucu
│   ├── PageHeader.jsx           # Page title (.banner-baslik)
│   ├── SesIzinEkrani.jsx        # Audio permission screen (Kuran/music audio pages)
│   ├── TanitimTuru.jsx          # Multi-step onboarding tour (shown once via localStorage)
│   ├── music/                   # ★ Music editor components (MuzikBrfScoreEditor, MuzikScoreSvg, etc.)
│   │   └── svg/                 # SVG glyphs (AccidentalGlyph, Flag, NoteHead, RestGlyph, Stem, etc.)
│   # ✗ IsaretSayfasi.jsx — DELETED
│   # ✗ DesenOgretici.jsx — DELETED (consolidated into CokHucreOkuyucu)
├── data/
│   ├── braille.js               # Core braille alphabet data
│   ├── fen.js                   # Science symbols
│   ├── kuran.js                 # Quran letter/word data
│   ├── kuranSureler.js          # Quran suras
│   ├── matematik.js             # Math symbols
│   ├── moduller.jsx             # Module list definitions
│   ├── musicBrailleExamples.js  # Music braille example data
│   ├── muzik.js                 # ★ Music lesson data (notes, rhythms, symbols)
│   ├── muzikHazirParcalar.js    # Ready-made music pieces
│   ├── turkceSozluk.js          # Turkish word list
│   ├── yazmaCumleleri.js        # Writing exercise sentences
│   ├── yazmaKelimeleri.js       # Writing exercise words
│   ├── almancaBraille.js        # German braille data
│   ├── fransizcaBraille.js      # French braille data
│   └── ingilizceBraille.js      # English braille data
├── pages/
│   ├── AnaMenu.jsx              # Home / module list
│   ├── Ayarlar.jsx              # Settings page
│   ├── Araclar.jsx              # Tools page
│   ├── BelgeBrf.jsx             # BRF document page
│   ├── BrfOku.jsx               # BRF reader page
│   ├── HarfEgitimi.jsx          # Turkish letters
│   ├── HucreTanima.jsx          # Cell recognition exercise
│   ├── KisaltmaBirHarfli.jsx    # ┐
│   ├── KisaltmaHece.jsx         # │ Kisaltma pages → CokHucreOkuyucu
│   ├── KisaltmaIkiHarfli.jsx    # │
│   ├── KisaltmaKelimeKoku.jsx   # │
│   ├── KisaltmaKelimeParcasi.jsx # ┘
│   ├── KuranHarfEgitimi.jsx     # ┐
│   ├── KuranHarekeEgitimi.jsx   # │
│   ├── KuranHeceOkuma.jsx       # │ Kuran pages → CokHucreOkuyucu + audio
│   ├── KuranKelimeOkuma.jsx     # │
│   ├── KuranKelimeOkumaSayfa.jsx # │
│   ├── KuranKelimeTemelSayfa.jsx # │
│   ├── KuranSureOkuma.jsx       # │
│   ├── KuranTecvidEgitimi.jsx   # ┘
│   ├── MatematikGeometriEgitimi.jsx # ┐
│   ├── MatematikIfadeOkuma.jsx      # │ Math pages
│   ├── MatematikOlcuEgitimi.jsx     # │
│   ├── MatematikRakamEgitimi.jsx    # │
│   ├── MatematikSembolEgitimi.jsx   # │
│   ├── MatematikSiraSayilari.jsx    # ┘
│   ├── FenFizikFormulleri.jsx   # ┐
│   ├── FenFormulOkuma.jsx       # │ Science pages
│   ├── FenKimyaFormulleri.jsx   # │
│   ├── FenSembolEgitimi.jsx     # │
│   ├── FenYunanHarfler.jsx      # ┘
│   ├── MuzikBrailleMenu.jsx     # Music module group menu
│   ├── MuzikBrailleSayfa.jsx    # Music lesson page (CokHucreOkuyucu + audio)
│   ├── MuzikBrfYazim.jsx        # Music BRF writing editor page
│   ├── MuzikDiziOkuma.jsx       # Music scale reading
│   ├── MuzikNotaEgitimi.jsx     # Music note teaching
│   ├── MuzikSembolEgitimi.jsx   # Music symbol teaching
│   ├── MuzikSureleri.jsx        # Music durations
│   ├── NoktalamaEgitimi.jsx     # Punctuation teaching
│   ├── NoktalamaIsaretleri.jsx  # Punctuation marks
│   ├── OzelIsaretler.jsx        # Special marks
│   ├── RakamEgitimi.jsx         # Numbers
│   ├── AlmancaBrailleMenu.jsx / FransizcaBrailleMenu.jsx / IngilizceBrailleMenu.jsx  # Language menus
│   ├── YabanciBrailleSayfa.jsx  # Shared lesson page for DE/FR/EN (prop: dil="de"|"fr"|"en")
│   ├── Test.jsx / TestFen.jsx / TestKisaltma.jsx / TestKuran.jsx
│   ├── TestMatematik.jsx / TestMuzik.jsx / TestNoktalama.jsx
│   ├── TonePianoTest.jsx        # Piano/Tone.js test page (dev)
│   ├── YazmaEgitimi.jsx         # Writing exercise
│   ├── YazmaKarisik.jsx         # Mixed writing exercise
│   ├── YazmaSerbest.jsx         # Free writing
│   ├── YazmaYonergeli.jsx       # Guided writing
│   └── YazmaYonergeliCumle.jsx  # Guided sentence writing
└── utils/
    ├── ses.js                   # ★ konus(), konusmayiDurdur(), titret(), basariBildir()
    ├── ilerleme.js              # ★ localStorage: progress / index / learn-later
    ├── ayarlar.js               # User settings (TTS, haptics, theme, music options)
    ├── noktaYardimci.js         # noktaListesi(), nlDan() — dot description helpers
    ├── isaretCevir.js           # isarettenOgeye() — symbol data → CokHucreOkuyucu oge
    ├── diziYardimci.js          # karistir(), HUCRE_SIRA_SOZ — shuffle + ordinal words
    ├── karisikYazmaKaynaklari.js # URL → mixed writing source mapping
    ├── arduino.js               # Arduino hardware integration
    ├── brailleAscii.js          # Braille ASCII encoding
    ├── brailleCevir.js          # Braille conversion utilities
    ├── brailleStatikHucreGorseli.js # Static cell image generator
    ├── brfOkuyucu.js            # BRF file reader
    ├── kisaltmaCevir.js         # Abbreviation converter
    ├── kuranSesHelpers.js       # Quran audio helpers
    ├── latinBrailleCevir.js     # Latin-to-braille converter
    ├── okumaModuMetni.js        # Reading mode text helper
    ├── paraBirimiKaynak.js      # Currency unit resource
    ├── sallama.js               # Device shake detection
    ├── tamEkran.js              # Fullscreen API utilities
    ├── titresimDestek.js        # Haptic/vibration support
    ├── toneSesAyarlari.js       # Tone.js audio settings
    ├── music/                   # Music score engine
    │   ├── index.js             # Public API re-exports
    │   ├── musicBrfEngine.js    # BRF encode/decode
    │   ├── musicConstants.js    # Note/duration constants
    │   ├── musicDuration.js     # Duration calculations
    │   ├── musicGroupingEngine.js # Beam grouping
    │   ├── musicHeaderEngine.js # Score header parsing
    │   ├── musicKeySignatureEngine.js # Key signature
    │   ├── musicMeasureEngine.js # Measure handling
    │   ├── musicOctaveEngine.js  # Octave logic
    │   ├── musicRepeatEngine.js  # Repeat signs
    │   └── musicScoreFactory.js  # Score object factory
    └── music-brf/               # ★ Braille music notation system
        ├── brailleColors.js     # Cell color mappings
        ├── brailleLegendRegistry.js # Symbol legend
        ├── brailleMeasureHelpers.js
        ├── brailleText.js       # Braille text encoding
        ├── bravuraMetrics.js    # Bravura SMuFL font metrics
        ├── brfMusicReader.js    # BRF → score reader
        ├── brfMusicReaderConstants.js
        ├── brfMusicReaderRules.js
        ├── musicBrailleImportEngine.js # Import pipeline
        ├── musicBrailleReverseMaps.js
        ├── musicBrfExportEngine.js # Export pipeline
        ├── musicCanonicalFlags.js
        ├── musicCanonicalPipeline.js
        ├── musicHeaderHelpers.js
        ├── musicMeasureHelpers.js
        ├── musicPianoAudioHelpers.js
        ├── musicPlaybackHelpers.js
        ├── musicReadableSummary.js
        ├── musicScoreHelpers.jsx
        ├── musicScoreMathHelpers.js
        ├── musicVisualBarlineHelpers.js
        ├── musicVisualBeamHelpers.js
        ├── musicVisualLayoutHelpers.js
        ├── scorePdfExport.js
        └── import/              # Symbol registries
            ├── musicBrailleCellUtils.js
            ├── musicBrailleNoteRegistry.js
            └── musicBrailleSymbolRegistry.js
```

`★` = most frequently edited files.

---

## 13. Git

```bash
cd C:\Users\HP\braille
npm run dev      # dev server: localhost:5188
git add src/...
git commit -m "feat(a11y): description"
git push
```

Branch: `main` | Remote: `https://github.com/icerikgelistirmeyonetimi-netizen/braille.git`
