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

## 2. Core Template Components

These two are the main learning templates used across nearly all pages.
**If you change one, always check the other — they share identical systems.**

### 2.1 `src/components/DesenOgretici.jsx`

Single or multi-cell braille pattern teacher. User taps dots in order.

**Used by:** `HarfEgitimi`, `RakamEgitimi`, `NoktalamaEgitimi`, all 5 Kisaltma pages, `MatematikRakamEgitimi`, `FenSembolEgitimi`, `MuzikNotaEgitimi`, `NoktalamaIsaretleri`, `OzelIsaretler`, `MatematikGeometriEgitimi`, `MatematikOlcuEgitimi`, `MatematikSembolEgitimi`, `MuzikSembolEgitimi`, `AlmancaBrailleSayfa`, `FransizcaBrailleSayfa`, `IngilizceBrailleSayfa`, etc.

**Key props:**
```jsx
<DesenOgretici
  baslik="Page Title"
  ogeler={[{ ad, ariaAd?, noktalar, hucreler?, tamYonergeMetni?, altMetin?, altMetinAciklama?,
             yonergeDetay?, ekBilgi?: { aciklama?, kurallar?, ornekler? } }]}
  kategoriAdi="harfi"         // used in instruction: "A harfi, 1,2 numaralı noktalardan..."
  bolumAnahtari="harfler"     // localStorage progress key
  bittiMesaji="Congrats!"
  noktalariSeslendir          // kisaltma pages: appends dot composition via noktaListesi()
  seslendirmeDili="tr"        // TTS language: 'tr'(default)|'de'|'fr'|'en'
  rtl                         // Arabic etc.
  ogeSesiCal={fn}             // audio recording playback (optional)
  ogeSesiOnceCal              // play audio before instruction
/>
```

### 2.2 `src/components/CokHucreOkuyucu.jsx`

Multi-cell word reader. Steps through each cell one at a time.

**Used by:** `KuranHeceOkuma` → `KuranKelimeOkuma`, `KuranKelimeTemelSayfa`, `KuranKelimeOkumaSayfa`, `KuranSureOkuma`, `MuzikDiziOkuma`, `MatematikIfadeOkuma`, etc.

**Key props:**
```jsx
<CokHucreOkuyucu
  baslik="Title"
  ogeler={[{ yazi, okunus?, anlam?, hucreler: number[][], sesId?,
             sesOncesiYonergeMetni?, tamYonergeMetni? }]}
  bolumAnahtari="kuran-heceler"
  rtl
  ogeSesiCal={fn}
  ogeSesiOnceCal
  ogeSesiHerZaman             // always play audio, no toggle
  sadeceHucreYonergesiOku     // skip word/meaning, only read "cell X: tap dots N"
  ikiHucreYanYana             // show 2-cell words side by side
  yonergeFormati="standart"   // 'standart' | 'sirayla'
/>
```
`sesOncesiYonergeMetni` is read before `ogeSesiCal`; then the item sound plays; then
`tamYonergeMetni` or the generated instruction is read. Use this for music pages where an
intro/info sentence must come before the piano/sample sound.

---

## 3. Shared Narration Lock System (both templates)

Both files implement **identical** lock logic. Change one → change the other.

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

### `src/utils/ayarlar.js`
```js
ayarlariAl()   // → { sesAcik, konusmaHizi, titresimAcik, sesEfektiAcik, gizliModuller }
ayarlariKaydet(obj)
ayarlariDinle(fn)   // subscribe to changes, returns unsubscribe fn
```

---

## 7. CSS — Critical Classes

| Class | Purpose |
|-------|---------|
| `.hayalet-btn` | sr-only ghost button; appears visually only on `:focus-visible` |
| `.toast` | Brief (2s) visual-only warning during narration. Use `aria-live="off"`; do not focus it. |
| `.modul-yan .modul-sekme.aktif` | Active module tab in sidebar — focus target on back-navigation |
| `.banner-baslik` | Page heading — focus target on forward-navigation |
| `.page-mid .cell .dot` | First dot in DesenOgretici — Tab from sentinel lands here |
| `.page-mid button.dot` | First dot in CokHucreOkuyucu — Tab from sentinel lands here |

---

## 8. Kisaltma Pages (DesenOgretici + `noktalariSeslendir`)

All five use `<DesenOgretici noktalariSeslendir ... />`:
```
KisaltmaBirHarfli    → bolumAnahtari="kisaltma-bir-harfli"
KisaltmaIkiHarfli    → bolumAnahtari="kisaltma-iki-harfli"
KisaltmaHece         → bolumAnahtari="kisaltma-hece"
KisaltmaKelimeKoku   → bolumAnahtari="kisaltma-kelime-koku"
KisaltmaKelimeParcasi → bolumAnahtari="kisaltma-kelime-parcasi"
```

---

## 9. Kuran Pages (CokHucreOkuyucu + audio)

```
KuranHeceOkuma       → KuranKelimeOkuma(kaynakAnahtari="hece")      ogeSesiOnceCal + ogeSesiHerZaman
KuranKelimeTemelSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime-temel")
KuranKelimeOkumaSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime")
KuranSureOkuma       → CokHucreOkuyucu directly
```
Audio files: `public/audio/kuran/`. `SesIzinEkrani` component handles first-tap unlock.

### Module 8 Music Pages (`MuzikBrailleSayfa` + `CokHucreOkuyucu`)

- `/muzik/notalar`, `/muzik/sureler`, and sibling music lessons are backed by `src/data/muzik.js` and mapped through `src/pages/MuzikBrailleSayfa.jsx`.
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
| Update `noktaListesi` format only in templates | Also update `nl()` in `RakamEgitimi`, `MatematikRakamEgitimi`, `MatematikSiraSayilari` |
| `sesEfektiAcikMi()` gates on both `sesAcik` and `sesEfektiAcik` | Only gate on `sesEfektiAcik` |
| `konus(bittiMesaji)` in bitti useEffect — writes to `_srBolge`, NVDA reads it after "Ana sayfaya dön" | `ekranOkuyucuTemizle()` then `konus(bittiMesaji, { srAtla: true })` |
| Music intro before piano/sample sound placed inside `tamYonergeMetni` | Use `sesOncesiYonergeMetni` so order is info → sound → main instruction |
| Page-specific intro only on first item — complex `tamYonergeMetni` | Use `i === 0 ? { tamYonergeMetni: \`${INTRO} ${ad}, ${detay} Lütfen...\` } : { yonergeDetay: detay }` |
| `hucreBasliklari` hardcoded as `['1','2']` for multi-cell items | Set `hucreBasliklari` in data item (e.g. `['harf işareti','büyük harf']`); pass through converter with `hucreBasliklari: s.hucreBasliklari` |
| Former `IsaretSayfasi` pages — use `ekBilgi` for kurallar/ornekler display | `isarettenOgeye(s)` converter: `{ hucreler, noktalar: hucreler[0], yonergeDetay: s.aciklama, ekBilgi: { aciklama, kurallar, ornekler } }` |
| `sessizBaslat=true` in `SesIzinEkrani` + passing `ilkOgeSesiHariciCalindi={true}` → first item audio skipped | `sessizBaslat=true` only silently unlocks browser; user never heard audio → do NOT pass `ilkOgeSesiHariciCalindi` (leave default `false`) |
| `AnaMenu` module tab click: focus stays on tab button | `modulSec()` calls `rAF → icerikBaslikRef.current?.focus()`; `h2.modul-icerik-baslik` has `tabIndex={-1}` |

---

## 12. File Map

```
src/
├── App.jsx                      # Router + SayfaOdakYonetimi + all route definitions
├── styles.css                   # Global styles (.hayalet-btn, .toast, .cell, .dot, etc.)
├── components/
│   ├── BrailleCell.jsx          # ★ Single cell — used on every learning page
│   ├── BrailleKlavye.jsx        # 6-key keyboard for writing exercises
│   ├── CokHucreOkuyucu.jsx      # ★ Multi-cell reading template
│   ├── DesenOgretici.jsx        # ★ Single/multi-cell teaching template (+ ekBilgi panel, seslendirmeDili)
│   ├── DesktopShell.jsx         # ★ Page wrapper (banner + sidebar + ghost buttons)
│   ├── KarisikYazmaButonu.jsx   # Mixed writing exercise link button
│   ├── OkumaModu.jsx            # Reading mode list inside DesenOgretici
│   ├── PageHeader.jsx           # Page title (.banner-baslik)
│   └── SesIzinEkrani.jsx        # Audio permission screen (Kuran audio pages)
│   # ✗ IsaretSayfasi.jsx — DELETED (migrated to DesenOgretici + ekBilgi)
├── pages/
│   ├── AnaMenu.jsx              # Home / module list
│   ├── HarfEgitimi.jsx          # Turkish letters → DesenOgretici
│   ├── KisaltmaBirHarfli.jsx    # ┐
│   ├── KisaltmaHece.jsx         # │ Kisaltma pages → DesenOgretici + noktalariSeslendir
│   ├── KisaltmaIkiHarfli.jsx    # │
│   ├── KisaltmaKelimeKoku.jsx   # │
│   ├── KisaltmaKelimeParcasi.jsx # ┘
│   ├── KuranHeceOkuma.jsx       # ┐
│   ├── KuranKelimeOkuma.jsx     # │ Kuran pages → CokHucreOkuyucu + audio
│   ├── KuranSureOkuma.jsx       # ┘
│   └── YazmaKarisik.jsx         # Mixed writing exercise
└── utils/
    ├── ses.js                   # ★ konus(), konusmayiDurdur(), titret(), basariBildir()
    ├── ilerleme.js              # ★ localStorage: progress / index / learn-later
    ├── ayarlar.js               # User settings (TTS, haptics, hidden modules)
    └── karisikYazmaKaynaklari.js # URL → mixed writing source mapping
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
