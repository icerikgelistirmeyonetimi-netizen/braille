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

**Used by:** `HarfEgitimi`, `RakamEgitimi`, `NoktalamaEgitimi`, all 5 Kisaltma pages, `MatematikRakamEgitimi`, `FenSembolEgitimi`, `MuzikNotaEgitimi`, etc.

**Key props:**
```jsx
<DesenOgretici
  baslik="Page Title"
  ogeler={[{ ad, ariaAd?, noktalar, hucreler?, tamYonergeMetni?, altMetin?, yonergeDetay? }]}
  kategoriAdi="harfi"         // used in instruction: "A harfi, 1,2 numaralı noktalardan..."
  bolumAnahtari="harfler"     // localStorage progress key
  bittiMesaji="Congrats!"
  noktalariSeslendir          // kisaltma pages: appends "1,2 numaralı noktalardan oluşur."
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
  ogeler={[{ yazi, okunus?, anlam?, hucreler: number[][], sesId? }]}
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

---

## 3. Shared Narration Lock System (both templates)

Both files implement **identical** lock logic. Change one → change the other.

**Shared refs/state:**
```js
const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
const yonergeNesilRef = useRef(0);          // generation counter — invalidates old timers
const yonergeKilitTimerRef = useRef(null);  // safety timeout ref
const uyariResumeTimerRef = useRef(null);   // TTS pause/resume timer
const uyariRef = useRef(null);              // ref to warning toast DOM element
const uyariFocusIstek = useRef(false);      // "focus toast on next render" flag
const oncekiYonergeOkunuyorRef = useRef(false);
```

**Shared functions:**
```js
yonergeKilidiAc(nesil)                      // unlock dots (checks generation)
yonergeyiKilitleyerekSeslendir(metin, opt)  // speak + lock; safety: Math.min(30000, 6000+len*200)
yonergeBeklemeUyar()                        // show toast + set focus flag + TTS pause/resume
```

**Flow:**
1. New item → increment generation, `setYonergeOkunuyor(true)`, call `yonergeyiKilitleyerekSeslendir`
2. During narration: Tab/Arrow/Enter/Space → blocked by keydown capture → `yonergeBeklemeUyar()`
3. `yonergeBeklemeUyar` → `gosterToast(...)` + `uyariFocusIstek.current = true` + TTS pause/resume
4. `useEffect([toast])` → after React commits DOM → `rAF → uyariRef.current?.focus()` (NVDA reads it)
5. `onSon` fires → `yonergeKilidiAc(nesil)` → `setYonergeOkunuyor(false)`
6. `useEffect([yonergeOkunuyor])` detects `true→false` → focus first dot

**Toast JSX (always this exact pattern):**
```jsx
{toast && <div ref={uyariRef} className="toast" aria-live="assertive" tabIndex={-1}>{toast}</div>}
```

**Focus first dot after narration:**
- DesenOgretici: `document.querySelector('.page-mid .cell .dot')`
- CokHucreOkuyucu: `document.querySelector('.page-mid button.dot')`

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
konus(text, { kesintiyle?, hiz?, onSon?, dil? })
// dil: 'tr' (default), 'en', 'de', 'fr'
// onSon: called when utterance ends — used to unlock narration

konusmayiDurdur()    // cancels pending timer + speechSynthesis.cancel()
titret(pattern)      // haptic feedback
basariBildir(text)   // dogruSesi() + konus()
hataBildir(text)     // yanlisSesi() + konus()
ekranOkuyucuBildir(text)  // writes to aria-live region (works even when TTS is off)
```

**CRITICAL — Single TTS channel:** `konus()` cancels current utterance.
You cannot speak a warning AND resume narration from the same point.
For warnings during narration: `pause()` → NVDA focus (aria-live) → `resume()`. Never call `konus()` for the warning.

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
| `.toast` | Brief (2s) notification. Must have `ref`, `tabIndex={-1}`, `aria-live="assertive"` |
| `.modul-yan .modul-sekme.aktif` | Active module tab in sidebar — focus target on back-navigation |
| `.banner-baslik` | Page heading — focus target on forward-navigation |
| `.page-mid .cell .dot` | First dot in DesenOgretici — focus after narration ends |
| `.page-mid button.dot` | First dot in CokHucreOkuyucu — focus after narration ends |

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

---

## 10. NVDA A11y Patterns

**Programmatic focus template:**
```js
const id = window.requestAnimationFrame(() => el.focus());
return () => window.cancelAnimationFrame(id);
```

**Focus toast after React DOM commit (reliable pattern):**
```js
// in yonergeBeklemeUyar:
uyariFocusIstek.current = true;

// separate useEffect:
useEffect(() => {
  if (!toast || !uyariFocusIstek.current) return;
  uyariFocusIstek.current = false;
  const id = window.requestAnimationFrame(() => uyariRef.current?.focus());
  return () => window.cancelAnimationFrame(id);
}, [toast]);
```

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
| `konus()` for warning during narration | `pause()` + NVDA focus + `resume()` |
| Safety timer `90ms/char` — unlocks too early | `Math.min(30000, 6000 + len * 200)` |
| `rAF → focus()` right after `setState` — ref may be null | `useEffect([toast])` then rAF |
| StrictMode: boolean flag for first-load skip | Compare `oncekiYol.current === null` |
| `kilitli`: only block onClick | Render as `<div>`, `aria-hidden`, remove all handlers |

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
│   ├── DesenOgretici.jsx        # ★ Single/multi-cell teaching template
│   ├── DesktopShell.jsx         # ★ Page wrapper (banner + sidebar + ghost buttons)
│   ├── KarisikYazmaButonu.jsx   # Mixed writing exercise link button
│   ├── OkumaModu.jsx            # Reading mode list inside DesenOgretici
│   ├── PageHeader.jsx           # Page title (.banner-baslik)
│   └── SesIzinEkrani.jsx        # Audio permission screen (Kuran audio pages)
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
