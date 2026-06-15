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
- `PerkinsYazimPaneli.jsx` — Perkins braille keyboard panel (collapsible, bottom of `/muzik-brf-yazim`)
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

### Braille Arama (`/arama`) — `src/pages/AramaSayfasi.jsx` + `src/utils/aramaIndeksi.js`

Nokta-numarasıyla braille sembol araması. Tüm öğrenme modüllerini (Modül 1,2,3,5,6,7,8,9) tek bir düz indekste tarar (~1213 kayıt). Müzik: 20 alt ders (MUZIK_BOLUMLER) **+ Dizi Okuma** (MUZIK_DIZILERI). **Kapsam dışı** (kasıtlı): Test/Sınav sayfaları + Hücreyi Tanı + Modül 4 Yazma (sabit sembol seti yok) + Modül 10 BRF araçları + menüden gizli Kur'an okuma sayfaları (heceler/kelimeler/sureler).

**`utils/aramaIndeksi.js`** — `data/`'daki tüm sembol dizilerini içe aktarıp tek bir `ARAMA_INDEKSI` listesi kurar (modül-yükleme anında, bir kez). Her giriş `{ etiket, altEtiket, hucreler, anahtarlar, yol, modulBaslik, kategori }`. Sayfaların **hücre türetme mantığı birebir taklit edilir** (rakamlarda `[3,4,5,6]` sayı işareti öneki; kelime kökü kısaltmasında `[5]` kök işareti; iki harfli/parça kısaltmada `[sol, sag]`). Hücreler `hucreleriCikar()` ile normalize edilir — **bazı veride hücreler düz yazılmış** (örn. `KURAN_TECVID[18].hucreler = [2,5,6]` yerine `[[2,5,6]]` olmalı; düz dizi tek hücreye sarılır, çökme olmaz).
- `sorguyuNormalle(girdi)` → "1 a2,3" gibi tek parçayı sıralı-tekil anahtar "123" yapar. `sorguHucreleri(girdi)` → boşluğa böler: "123 145" → `["123","145"]`.
- `aramaYap(girdi)` → **tek hücre** ("123"): hücrelerden BİRİ eşleşen tüm semboller. **Çok hücre** ("123 145"): sembolün hücre dizisi bu sırayı **bitişik** içerirse (subsequence) eşleşir. Her sonuç `eslesenIndeksler` (vurgulanacak hücre indeksleri) taşır.
- **Örnek/ifade girişlerinde keyfî sayı/HARF filtresi:** Gömülü örnek taşıyan girişler `ornek: true` — İfade Okuma (`/mat-ifadeler`, tüm dizi) **+** Özel İşaretler'de (`/ozel-isaretler`) **"Tarih Yazma"** ("3.3.2013") ve **"Rumuzlu İfadeler"** ("TBMM") (mapper'da `OZEL_ORNEK_ADLARI` ile per-giriş). Bunlardaki SAYI ve HARF'ler keyfîdir. Sorgunun TÜM hücreleri `KEYFI_ANAHTARLAR`'dansa (= `RAKAM_ANAHTARLARI` rakam işareti `3456`+üst/alt rakam **∪** `HARF_ANAHTARLARI` k-z, ç ğ ö ş ü) `ornek` girişler ATLANIR → rakam/harf araması tarihi/işlemi/rumuzu getirmez. Sorgu işaret/ayraç/gösterge içerirse (bağ `36`, büyük harf işareti `6`, `+`=`56 26`…) örnek yine bulunur. Sembol DERSLERİ (`/mat-rakamlar`,`/mat-semboller`,`/harfler`,`/ozel-isaretler` büyük harf işareti…) `ornek` değil → etkilenmez (eksik arama yok). ⚠ Harf/operatör desen çakışması (örn. ş=`146`=karekök): çakışınca örnek o aramada görünmeyebilir, ama sembolün KENDİ dersi her zaman bulunur. NOT: kimya alt-simgeleri benzer olabilir ama anlamlı sayıldığından kapsam dışı.
- `sozlukAra(girdi)` → **metin (sözlük) araması**: `etiket`+`altEtiket`+`esler`(eş anlamlı)'da arar. Tek harf ("a") → yalnız `etiket===q`/`esler` (A harfi/kısaltması); "aynı" → kelime eşleşmesi (A kısaltmasının anlamı); "çarpma" → 3+ harfte önek/alt-dizi de. **Eş anlamlılar** (`ARAMA_ES_ANLAMLILAR`, etiket→liste, `ekle`'de `esler` olarak takılır): veri işareti ADIYLA tanımlı ("+"→"artı") ama kullanıcı işlemle arayabilir → `artı`:[toplama,topla…], `eksi`:[çıkarma…], `çarpma`,`bölme`,`eşittir`. Anahtar tam-etiket (fen "artı (yük)" etkilenmez). Yalnız sözlük aramasında; braille'i etkilemez. `eslesenIndeksler: []` (hücre vurgusu yok). `ornek` keyfî-filtresi UYGULANMAZ.
- `noktaCumlesi([1,2,3])` → "1, 2 ve 3. noktalar" (erişilebilir okuma).
- Her girişte `modulKonu` (kartta gösterilen konu adı): `MODUL_KONU` map ("Modül 8"→"Müzik" …) **AMA** Modül 9 dilleri `ekle`'de `modulKonu` override ile DİL adını alır (İngilizce/Almanca/Fransızca), "Yabancı Dil" DEĞİL. Gruplama/filtre sırası `KONU_SIRASI` (diller ayrı kalemler; `KuranIsaret…` değil).

**`AramaSayfasi.jsx`** — `PageHeader baslik="Braille Arama"` + `input` + yanında **mod `<select>`** (`.arama-mod-secim`, `.arama-girdi-satir` flex; varsayılan **"Braille arama"**, diğeri **"Sözlük ile arama"**). `mod` state ('braille'|'sozluk'); mod değişince sorgu+filtre temizlenir, input'a odaklanılır. Braille modu: `inputMode=numeric`, 1-6+boşluk+Perkins süzme, `aramaYap`. Sözlük modu: `inputMode=text`, serbest metin (`.arama-girdi.metin` sola-yaslı), `sozlukAra`; yönerge (`YONERGE_SOZLUK`) "ad/anlam/yazılış yazın" der. + `#arama-ozet` (`role="status" aria-live="polite"` → "… için N sonuç bulundu"). Sonuçlar `<ul>` içinde buton; her butonun `aria-label`'i tam açıklama taşır ("L, ilgi. Modül 2, Bir Harfli Kısaltmalar. tek hücre, 1, 2 ve 3. noktalar. Eğitime gitmek için etkinleştirin."), mini braille hücreleri `aria-hidden` (eşleşen hücre `.vurgu`). **2'den fazla hücreli sonuç** `.cok-hucreli` sınıfı alır → kart dikey (`flex-direction: column`): braille üstte tek satır, bilgiler altta (yan-yana düzendeki kaymalar önlenir); hücre satırı `flex-wrap` ile taşmaz. Kartta üç etiket: `.arama-sonuc-modul` (konu adı — Müzik/Matematik, vurgulu) + `.arama-sonuc-modul-no` (Modül N, ikincil) + `.arama-sonuc-kategori`. Sonuç listesi `repeat(auto-fill, minmax(260px, 1fr))` + govde `max-width: 760px` → yer varsa **2 sütun**, dar ekranda tek sütun.

**Çok hücre arama (boşlukla):** Yönerge boşluk kuralını içerir ("Birden fazla hücre aramak isterseniz hücreler arasına boşluk koyarak devam edin. Örnek: 123 145."). Girdi süzgeci 1-6 rakamları **+ boşluk** kabul eder (çoklu boşluk teke, baş boşluk atılır). Özet "… ardından …" ile çoklu hücreyi okur; eşleşen tüm hücreler kartta `.vurgu`.

**Perkins tuşları:** Girdi süzgeci `PERKINS_TUS` ile **F D S J K L → 1 2 3 4 5 6** (BrailleKlavye.jsx ile aynı eşleme) çevirir; kullanıcı Perkins tuşuyla yazarken anında rakama döner (input rakam gösterir). Yönergede belirtilir.

**Filtre çipleri modern/kompakt:** `.arama-filtre-cip` `.btn`'i kullanır ama `min-height/min-width: 0`, `box-shadow: none`, küçük padding/font ile büyük erişilebilir-buton boyutunu ezer → tek-tip ~28px pill. Sayı `.arama-filtre-adet` rozet; aktif çipte rozet şeffaf.

**Bölüm filtresi + gruplama:** Üstte konu çipleri (`.arama-filtre-cip`, `aria-pressed`, tek-seçim; "Tümü" + sonuçta bulunan her konu, sayılarıyla) — tıklanınca o bölüme filtreler. `aktifFiltre = filtre && mevcutKonular.includes(filtre)` → sorgu değişip seçili konu sonuç vermezse otomatik "Tümü"ye düşer. Sonuçlar konu başlıkları (`<section><h3 class="arama-grup-baslik">{konu} {N} sonuç</h3>`) altında, `KONU_SIRASI` sırasıyla gruplanır; her grup kendi 2-sütun `<ul>`'u.

**⚠ SCROLL TUZAĞI:** `.page > .page-mid` (paylaşılan, specificity 0,2,0) `justify-content: center` uygular. Arama sonuçları taşınca **center** üstteki sonuçları kapsayıcının üst kenarının ÜSTÜNE iter → scroll ile ulaşılamaz (klasik flex+center+overflow hatası). Fix: `.page > .page-mid.arama-govde` (0,3,0) ile `justify-content: flex-start; align-items: stretch` — içerik yukarıdan başlar, normal scroll. Düşük-specificity `.arama-govde` yetmez (ezilirdi). Tıklayınca `navigate(yol)` → ilgili eğitim sayfası. Giriş noktaları: `DesktopShell` banner'ı + `AnaMenu` `header-aksiyon` (`.arama-btn`, `Ikon.arama`). Rota: `App.jsx` `/arama`.

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

#### Perkins Braille Keyboard Panel (`PerkinsYazimPaneli.jsx`)
A **writing mode** opened by **double Enter** (two Enters within 450ms). NO open button. Single Enter is the existing edit-shortcut mode. Provides simultaneous multi-key chord input (hold keys + release all → commit cell).

**Contextual placement:** the card is rendered via `createPortal` into the **active measure's row** (`.muzik-olcu-braille-blok` last child) — since each row is `flex-direction: column`, the card sits below the staff and pushes the next row down. As notes are added the active row changes and the panel **follows it** (shows a `{N}. ölçü` badge). No scrolling to the page bottom.

**Open/close wiring:** `acik` state lives in `MuzikBrfYazim` (`perkinsAcik`). Double-Enter is detected in `MuzikScoreSvg`'s global Enter handler (`sonEnterZamaniRef`) → calls `onPerkinsAc` (threaded `MuzikBrfYazim → MuzikBrfScoreEditor → MuzikScoreSvg → kbRef`) → `setPerkinsAcik(true)`. Escape / ✕ → `onKapat`. Panel stays mounted when closed (early `return null`), so history/tab state and textarea focus survive row relocations.

**Caret-based editor (cursor = `seciliOgeId`, synced via `caretIdRef`):**
- **F/D/S/J/K/L** chord → Ekleme mode: insert note/rest after caret (caret advances); Düzeltme mode: replace the note at caret via `seciliNotayiGuncelle`
- **Space** → insert barline after caret (`manuelOlcuCizgisiEkle`)
- **Backspace** → cancel pending chord if any, else delete caret element from the score (`ogeleriSil`) and step to neighbor
- **Delete** → delete caret element forward
- **← / →** → move caret to prev/next `[data-nav]` element (`setSeciliOgeId`)
- **F2** (or panel toggle) → Ekleme ↔ Düzeltme mode (`modRef`)
- **Escape** → exit mode

Insert fns (`notaEkleKonuma`/`susEkleKonuma`/`manuelOlcuCizgisiEkle`) **return the new oge** → `caretIdRef.current = oge.id`. Panel shows `İmleç: {caretEtiket}` (aria-label of selected element, rAF-refreshed).

**Two tabs (segmented control `.perkins-seg`):**
- `Notalar` (default) — Perkins chord input; on commit: TTS announces decoded name, mutates the score, plays piano preview via `usePianoNotePreview`. Has an Ekleme/Düzeltme mode toggle (`.perkins-mod`).
- `Başlık` — form fields for title, composer, tempo, time signature → bound to `setMuzikHeader` + `setTimeSignature`

**Conflict prevention:** Uses `<textarea>` as keyboard capture area — `MuzikScoreSvg`'s document capture handler already skips textarea targets (~line 755 tagName check), so F/D/S/J/K/L/Space/arrows never trigger the note editor while the panel is active.

**Decode — canonical reverse map (ALL rules):** uses `musicBrailleReverseMapsOlustur()` (the same reverse map the BRF reader uses) → notes, rests, octave markers, accidentals, special barlines, slur/tie, AND multi-cell modifiers (dynamics/nuances/ornaments). The old per-map approach (`NOT_HARITASI`/`TEK_SEMBOL_HARITASI`) and the legacy `muzikBrailleCellsToScore` engine were **removed** — they didn't cover dynamics and produced false "bilinmeyen hücre". A **maximal-munch tokenizer** (`hucreAlindi`+`zorlaCoz`) buffers cells and waits for multi-cell symbols: pure prefixes (e.g. dynamic word-sign `[3,4,5]`) wait `BEKLE_TAMAMLAYICI` (5s) for the completing cell so two-cell symbols can be typed at human pace; complete-but-extendable buffers (forte ⊂ çift forte) wait `BEKLE_UZATILABILIR` (1.2s). Prefix rules: octave/accidental/"öncesi" modifiers attach to the **next** note; "sonrası" nuances attach to the **last** note (`perkinsModifierEkle` hook fn). Cell `[1,4]` is the slur sign, NOT a note; `la` eighth = `[2,4]` (D+J); `forte` = `[3,4,5]`+`[1,2,4]`.

**`insertAfterRef`** tracks the last added note ID so sequential Perkins entries are inserted in order.

**BRF İndir/Yükle tek-merkez + standart:** Export (`scoreToCanonicalBrf`) ve Import (`brfMuzikOku`) AYRI motor, ikisi de `muzik.js`'ten türer. `npm run qa:brf-roundtrip` round-trip kılavuz testi (muzik.js değişince çalıştır). **Standart-uygunluk** testi ayrı: `node scripts/music-brf-standard-qa.mjs` — PDF-doğrulanmış fixture braille'iyle (`muzik-braille-test-ornekleri.md` oracle'ı) karşılaştırır; hem İNDİR (`scoreToCanonicalBrf`) hem EKRAN-ALTI overlay (`muzikSkorunuBrailleyeCevir` doğrudan) yolunu test eder. Otorite PDF: `Downloads\Braille-Music-Notation-Introductory-Training-Program...pdf` Appendix 1 (s.121-131). Reader `brfMusicReaderRules.js` tril `[2-3-5]`/turn `[2-5-6]` ölçü başında alt-rakam (6/4) ile çakışır → `CAKISAN_TEK_SUSLEME`+`notaGrubuBaslangici` ile çözülür. Okunur özet (`brfMusicReadableSummary.js`) `modifierliMetin` ile dinamik/nüans/süsleme adlarını da yazar. Nefes işareti = `['3-4-5','2']` (PDF s.128; break/sezür = `['6','3-4']`). Detay: claude-music.md §25.

**İki braille yolu AYNI motordan (`muzikSkorunuBrailleyeCevir`) türer ve TUTARLI olmalı:** (1) **İNDİR** = `scoreToCanonicalBrf` → engine → ölçü-join. (2) **EKRAN-ALTI overlay** (skor çiziminin altındaki braille) = `useBrailleOutput.js` `cevirSonuc.hucreler` → `olcuBrailleSonuclari` → `MuzikScoreSvg.jsx:2000`. İkisi de gruplama ayarını **`muzikHeader.useBrailleGrouping`**'den almalı (`strictDurationCells: !useBrailleGrouping`) — aksi halde gruplama açıkken ekranda tam-süre hücre, indirilende pitch-only grup oluşur (WYSIWYG kırılır). `canonicalMode` engine'de kullanılmaz (hücreyi değiştirmez).

**L6 Kural 4 — sözcük→oktav (engine'de):** Bir SÖZCÜK-dinamik (p/f/mf/cr/rit… — `sembol`'ü olan) kendisinden SONRAKİ ilk notaya, aralık ne olursa olsun, oktav işareti zorlar. Hairpin'ler (keskin kreşendo/dekreşendo — `sembol`'ü yok) grafik işaret olduğundan zorlamaz. `musicBrfEngine.js`: `muzikModifierSozcukMu(kayit)` + `sozcukSonrasiBayragi` (nota tükettikçe sıfırlanır) → `musicOctaveEngine.js` `ctx.sozcukSonrasi`. Bu hem İNDİR hem overlay'e otomatik yansır (tek motor).

**İMPORT — ilk satır müzik mi başlık mı (`brfMusicReaderRules.js` `detectHeaderLineType`):** Müzik gövde satırı DAİMA oktav işaretiyle başlar (ilk nota kuralı). Reader, `items` boşken ilk içerik satırına başlık-tespiti uygular; harf-oranı yüksekse başlık sayar. `⠐⠋⠋⠛⠓` braille harf olarak "ffgh" göründüğünden başlık sanılıyordu → header'sız/zaman-imzasız export edilen skor yüklenince TÜM notalar kaybolur (empty-parse). Fix: satır kesin bir oktav işaretiyle ('4'/'45'/'456'/'5'/'46'/'56' = oktav 1-6; **`dotsToKey` AYRAÇSIZ** — `[4,5]`→`"45"`) başlıyorsa harf-oranına bakmadan `type:'music'`. ('6'=⠠ büyük harf işaretiyle çakışır → dışarıda.) **AYRICA** `brfMusicReader.js` ana döngüsü: zaman imzası bir kez parse edildiyse sonraki satır GÖVDEdir (header bloğu atlanır) — `⠧⠐⠙…` gibi rest'le (harf "v") başlayan ölçüler başlık sanılmasın. Varsayılan header zaman imzası içerir; ama `Araclar.jsx` `timeSignature:null` yapabildiğinden erişilebilir. İmport-doğruluğu testi: `music-brf-standard-qa.mjs` IMPORT round-trip.

**İMPORT — donanım (key signature) parse (`detectHeaderLineType` + `setReaderKeySignature`):** Reader önceden donanım satırını (⠣/⠩) parse ETMİYORDU (`keySignature:null`) → `⠣⠀⠼⠙⠲` başlık sanılıp donanım kayboluyordu. Fix: `keySignatureOnEkiCozumle()` satır başı 1-3 tekrarlı diyez(⠩=146)/bemol(⠣=126) veya 4-7 (⠼N+işaret) çözer → `type:'key-signature'`/`'key+time-signature'` (boşluklu `⠣ ⠼⠙⠲` veya bitişik). Donanımdan sonra nota gelirse gövde accidental'ıdır (donanım değil). `{ad:'N bemollü'/'N diyezli', hucreler}`.

**EXPORT — işaret yazım sırası (order-of-signs, Bölüm 13) — `muzikModifierOncesiSira`/`muzikModifierSonrasiSira`:** Bir notaya çok işaret eklenince kesin sıra. ÖNCE: ileri-tekrar(1)→volta(2)→bracket-slur-açılış(3)→dinamik(4)→tuplet(5)→süsleme(7)→nüans(8)→aksidental(9)→oktav(10)→NOTA. SONRA: nokta(1)→fermata(2)→tekli-slur(3)→bracket-kapanış(4)→tie(5)→nefes(7)→geri-tekrar(8). **Nüans slot-8 iç-sıra** (`muzikNuansSlotSira`): arpej(8.1)→staccato/staccatissimo/mezzo(8.2)→accent/martellato(8.3)→tenuto(8.4)→swell(8.5) — birden çok nüans girdi sırasından bağımsız sıralanır. **Bag adları** veri'de 'cümle bağı **başlangıcı/bitişi**', tie 'uzatma bağı' — sıra regex'leri bunlara göre ('açılış/kapanış' DEĞİL). Bracket-slur açılışı dinamikten ÖNCE (PDF Lesson 11 sırası, slot 3<4). Test: `npm run qa:brf-order`.

**EXPORT — boşluk kuralları (Bölüm 14) — `musicHeaderEngine.js` + `musicBrfEngine.js`:** Müzik braillede boşluk anlam taşır (ölçü çizgisi = boşluk). Doğrulanan: **donanım↔zaman imzası BİTİŞİK** (`⠣⠼⠙⠲`, boşluk YOK — `musicHeaderEngine.js` key-sig `boslukSonrasi:false`; eskiden boşluk koyuyordu = bug), final barline öncesi bitişik, sectional öncesi bitişik+sonrası boşluk, bitir-tekrar öncesi bitişik+sonrası boşluk, başla-tekrar öncesi boşluk+sonrası notaya bitişik, ölçü çizgisi=1 boşluk, dinamik/nüans/süsleme/oktav/aksidental↔nota bitişik, **eser içi zaman/donanım DEĞİŞİMİ iki yanında boşluk** (`degisimOncesiBoslukEkle` + sonrası spacer; eskiden sonrası bitişikti = bug). Tempo↔donanım/zaman = 1 boşluk. Test: `npm run qa:brf-spacing`. **Zorunlu oktav bağlamları** (`qa:brf-octave`): ilk nota/satır başı/tekrar/volta/zaman-donanım değişimi/sektion/sözcük(Kural4) sonrası ilk nota — aralık ne olursa olsun — oktav alır (`timeKeyDegisimiBayragi`).

**İMPORT — eser-içi zaman imzası değişimi (`brfMusicReaderRules.js`):** Reader gövdedeki `⠼`+üst-rakam+alt-rakam'ı (örn. `⠼⠉⠲`=3/4) `timeSignatureChange` olarak parse eder (volta `⠼`+alt-rakam'dan ayrı). §14 trailing space barline DEĞİL → `context.zamanDegisimiSonrasiBoslukAtla` bayrağı ile atlanır (`brfMusicReader.js` ana döngü). `expectedMeasure16` güncellenir ama `activeMeasure` SIFIRLANMAZ. Zaman değişimli skorda ölçü-süre uyarısı baskılanır (global beklenti yanıltıcı). Round-trip temiz.

**PLAYBACK — aksidental ölçü-içi kalıcılığı (`musicPlaybackHelpers.js` + `musicPianoAudioHelpers.js`):** Bir aksidental aynı ölçüde aynı perde+oktava taşınır. `measureAccidentals` map'i (`noteKey="${notaAd}:${oktav}"`) explicit aksidentalde set, HER ölçü çizgisinde (barline/sectional/final/**begin/endRepeat** — repeat de sınır) + zaman/donanım değişiminde temizlenir. `muzikNotaMidiAl` önceliği: explicit > ölçü-persist > key-sig > natural. **`musicPianoAudioHelpers.js` satır 1 `import.meta.env` node-safe yapıldı** (`(import.meta.env && import.meta.env.BASE_URL)`) — yoksa `qa:playback` node'da çöküyordu. Test: `npm run qa:playback`.

**PLAYBACK — cresc/decresc velocity ramp + tuplet timing + ornament:** `dinamikGradyanModuAl` Türkçe ad/sembol eşler (kreşendo/dekreşendo/diminiendo + cr/decr/dim; eskiden sadece İngilizce → ramp çalışmıyordu); **DECRESC ÖNCE** kontrol ("dekreşendo"⊃"kreşendo"). Ramp `CRESC_ADIM=0.04`/nota. Tuplet timing: tuplet objesi `ratio:{played,inTimeOf}` taşırsa süre `*inTimeOf/played` (üçleme 3:2=0.667); editör `tupletOranTahmin` ile set eder. Ornament playback `ornamentEventleriGenislet` (trill çoklu, mordan 3, turn 4). Ornament playback `ornamentEventleriGenislet` (trill çoklu, mordan 3, turn 4); grace note timing (kısa 0.12/uzun 0.5 ana notadan). **EXPORT tuplet sırası** (`musicBrfEngine.js`): `tupletler` array yolu slot 5 (dinamik<tuplet<süsleme) — oncesi modifier'lar slot<5/≥5 bölünüp tuplet aralarına yazılır.

**İMPORT — tuplet/düzensiz grup decode (`brfMusicReaderRules.js` + `brfMusicReader.js` + `useMuzikBrfEditor.jsx`):** Reader tuplet işaretlerini parse eder: tek-hücre ⠆(2-3, alt-rakam-2 ÇAKIŞIR → ardından nota grubu varsa tuplet) + çok-hücre ⠸…⠄ (`TUPLET_SIGN_MAP` MUZIK_DUZENSIZ_GRUPLAR'dan). İşaretten sonraki N nota (üçleme=3/ikileme=2…) `context.aktifTuplet` ile etiketlenir (`item.tupletId`); `context.tupletler`→reader result. `brfMetniYukle` reader.tupletler'i editör tupletler'e map'ler (reader-id→editör-id via `kaynakReaderItem`, `ratio`=`tupletOranTahmin(ad)`), `setMuzikTupletler` (eskiden `[]` → tuplet kaybı). Round-trip: tuplet işareti + playback timing korunur. Test: `qa:brf-import` tuplet bölümü.

**İMPORT — tek/çok-hücre nüans/süsleme ↔ ölçü-no çakışması (`detectHeaderLineType` değil, bar-number bloğu):** Gövde BAŞINDAKİ tek-hücre nüans (staccato ⠦=alt-8) / süsleme + çok-hücre modifier (ters grupeto ⠲⠇, ilk hücre alt-4) ölçü-no sanılıyordu. `CAKISAN_TEK_SUSLEME` 'nuans'ı da kapsar + `cokHucreModifier` (modifierByCellKey tam-dizi) eklendi → tüm semboller ilk notada bile decode.

**Editör MONOFONİK** (tasarım): akor/in-accord/aralık-notası YOK ("kırık akor" = ardışık dizi).

**39 PDF FIXTURE IMPORT testi (`npm run qa:brf-pdf-fixtures`):** `muzik-braille-test-ornekleri.md`'deki 39 PDF-doğrulanmış örneği editör import'una verir; **39/39 bilinmeyen hücre YOK**. Bu test sayesinde bulunan+düzeltilen: ilk-satır tespiti (ifade/rest-başı header'sız gövde), **`TIME_SIGNATURE_PATTERNS` hatalı+eksikti** (6/8 denominator lower-6 yazılmış→lower-8; 9/8,12/8,2/2 yoktu → üst/alt rakam tablosundan ÜRETİLİR artık, `brfMusicReaderConstants.js`), Lesson-10 tekrar-cihazı sayıları (⠶⠼N/⠼N⠼M/⠼⠤ → `repeatInstruction` item, `UPPER_DIGIT_BY_DASH`), volta↔ölçü-aralık çakışması (next2='3-6' ise volta değil). ⚠ Çok-sözcüklü ifade (a tempo) ⠜ atlanır (metin modellenmez = sınırlama).

**EXPORT — çok-hücreli barline canonical pipeline'da bölünmesin (`musicCanonicalPipeline.js`):** finalBarline (⠣⠅=2 hücre) / sectionalBarline (⠣⠅⠄=3 hücre) repeat DEĞİLDİR; `canonicalOlcuGruplariOlustur` her barline hücresinde `kapat()` çağırınca her hücre ayrı ölçüye düşüp `join('⠀')` araya boşluk koyuyordu → `⠣⠀⠅` (bozuk, reader düz barline sanır). Fix: `canonicalBarlineSonHucreMi(meta)` (hucreSira/hucreSayisi export meta'sı) — çok-hücreli barline SADECE son hücrede kapatır. (endRepeat zaten repeat-blok mantığıyla korunuyordu.)

**AKSAK METRE SEÇİLEBİLİR GRUPLAMA + IMPORT AUTO-ÇÖZÜMÜ (`npm run qa:brf-grouping`, 14/14):** 5/8,7/8,9/8,10/8 gibi aksak metrelerde vuruş bölünmesi SABİT DEĞİL (bestecinin kirişine göre 2+2+3/3+2+2/2+3+2…). `header.timeSignature.gruplamaDeseni` (sekizlik desen; `MUZIK_GRUPLAMA_SECENEKLERI` musicConstants.js, ilk seçenek=varsayılan). `gorselZamanImzasiVurusDeseniAl` deseni honor eder; **TEK MOTOR**: export grouping (`musicGroupingEngine.js`) artık uniform `muzikTimeSigBeatUnit16` yerine `gorselVurusIndexAl(pos, timeSignature)` ile vuruş eşitliği kullanır (düzenli metrede özdeş, aksakta doğru) → görsel kiriş + overlay + indir AYNI desen. **IMPORT auto-çözüm** (`brfMusicReader.js`): grup desenini braille açıkça yazmaz; reader varsayılanla ölçü-süre/taşma uyarısı verirse metrenin TÜM seçeneklerini dener (`forceGruplamaDeseni`→`setReaderTimeSignature`), EN AZ uyarı vereni seçer → veri kendi desenini seçer; çözülen desen header'a yazılır, adaptör alır. **UI:** staff zaman-imzası glyph menüsü (`MuzikScoreSvg.jsx` `headerTsMenuPos` — REACHABLE; `MuzikScoreHeader` `headerPopupAcik` tetiksiz) aksak metrede "Vuruş gruplaması" gösterir → `setTimeSignature(ad, desen)`. Üç TS-picker de TEK KAYNAK `MUZIK_ZAMAN_IMZASI`'dan türer (5/8 dahil).

**SAYISAL TEKRAR CİHAZLARI — İKİ TÜR, İKİSİ DE GENİŞLETİLİR (PDF s.95-98; kullanıcı: "tüm hazır parçaları baştan kontrol et, eksik bırakmıştın"):** (1) **Geri-sayısal** (ÜST-rakam): `⠼N⠼M` = "N ölçü geri say, M ölçü çal"; tek `⠼N` = N geri/N çal (ara müzik yoksa). Soon `⠼5`/`⠼2` (geri=çal=5/2); Jingle Bells `⠼8⠼6` (8 geri, 6 çal → bars 9-14 = 1-6). (2) **Bar-number** (ALT-rakam): `⠼<alt>N` / `⠼<alt>N⠤<alt>M` = MUTLAK ölçü no(ları). Let Me Call `⠼1-6` (bars 17-22 = bars 1-6). Reader (`brfMusicReaderRules.js`) `ilkRakamUst` ile sınıflar + `geriSayisi`/`calinanOlcu`/`mutlakBaslangic`/`mutlakBitis` hesaplar. Adaptör (`useMuzikBrfEditor.jsx`) İKİSİNİ DE genişletir: kaynak ölçü aralığını `olcuIcerikGecmisi`'nden alır (geri: `len-geri`'den `calinanOlcu`; bar-number: `mutlakBaslangic-1`'den `calinanOlcu`), kopyalar, blok başı ilk notayı `_geriTekrarSayisi`(blok ölçü) + `_tekrarHucreleri`(ORİJİNAL braille hücreleri) ile işaretler. Engine `_tekrarHucreleri`'ni AYNEN yazar (⠼N/⠼N⠼M/⠼<alt>N-M korunur). Legend "ölçü tekrarı (N ölçü)". **DENETİM: `npm run qa:brf-pieces`** (`music-brf-pieces-qa.mjs`) — 48 parçanın HER tekrar cihazının desteklenen türde olduğunu + bilinmeyen hücre yokluğunu doğrular (eski mini-adaptör import-QA tekrar genişletmediğinden eksikleri kaçırıyordu).

**SKOR ALTI BRAILLE = BRF AYNEN; TEKRARLAR AÇIK İŞARETLE, AUTO-TESPİT YOK (kullanıcı: "jingle'daki tekrar işareti nereden geldi, brf'deki yazımla aynı değil; direk ne ise o yazsın, sadece tekrar işaretine göre skorları çizecekti"):** ESKİ MİMARİ HATALIYDI: tekrarları kopyalara açıp engine `autoRepeatHaritasi` ile RE-TESPİT ediyordu → (a) blok-içi kopyalar FAZLADAN ⠶ üretiyordu (Jingle bars 9-14'teki bar10=bar9), (b) kopya bağı(tie) kaybedince re-tespit BAŞARISIZ olup ⠶ KAYBOLUYORDU (Jingle bar2), (c) EXPLICIT özdeş ölçüler (Let Me Call 3 G) yanlışlıkla ⠶'ye collapse oluyordu. YENİ: TÜM içe aktarılan tekrarlar (⠶, ⠶⠼N, ⠼N, ⠼N⠼M, bar-number) AÇIK İŞARETLE yazılır — adaptör blok başı ilk notaya `_geriTekrarSayisi`(blok ölçü)+`_tekrarHucreleri`(reader'ın ORİJİNAL hücreleri, `item.hucreler`) koyar; engine bunları AYNEN yazar, bloğu atlar. `autoRepeatHaritasi` artık SADECE `_repeatCopy` ölçülerde tetiklenir (explicit ölçüler verbatim) — ve onlar zaten geriTekrar bloğunda olduğundan auto-tespit fiilen kapalıdır. ⚠ KRİTİK: `olcuIcerikKlonla`/brailleRepeat klonu `_geriTekrarSayisi`/`_tekrarHucreleri`'ni KOPYAYA TAŞIMAMALI (`...kaynak` spread'inde `undefined`'la sil) — yoksa bir tekrar bloğu, tekrar-işaretli bir ölçüyü kopyalarken işareti çoğaltır. Jingle overlay artık BRF'in 11 grubuyla birebir (bar2 ⠶, ⠼8⠼6, fazladan işaret yok). NOT kalan: oktav işareti re-türetimi orijinalle ufak farklı olabilir (engine zorunlu-oktav kuralı; tam verbatim için reader hücreleri gerekir — ayrı/küçük konu). **OVERLAY HİZALAMA — boş (tekrar) ölçüler genişlik AYIRMALI (kullanıcı: "braille başka ölçüler altı boşsa o bölümü dolduruyor, asıl ölçü skor çizimin altına hizalanmıyor, kendi ölçüsü altında olsun"):** `MuzikScoreBrailleOverlay.jsx` flex-row her ölçüyü staff `startX/endX`'ten gelen `kutuWidth`+`gapBefore` ile yerleştirir. Tekrar collapse'inde boş ölçüler (kopya, braille'siz) `if (olcuCells.length<=0) return null` ile ATLANYORDU → genişlikleri kaybolup SONRAKİ ölçülerin braille'i SOLA kayıp staff ile hizasız kalıyordu (örn. Bar-repeat ×N satır [boş bar9, dolu bar10]: bar10 bar9'un altına kayıyordu). Fix: boş ölçüler için `null` yerine genişliği koruyan BOŞ SPACER `<div>` (minWidth+marginLeft) render edilir → her ölçünün braille'i KENDİ staff ölçüsünün altında hizalı kalır. Tarayıcıda doğrulandı (bar10 braille'i bar10 altında).

**TEKRAR KOPYALARINA TIE/SLUR YANSITMA (kullanıcı: "tekrarlarda tie böyle bağlanmalı" — piece#28 bar-üstü tie):** Reader bağları KAYNAK nota id'lerini taşır; bar-repeat (⠶) kopyaları yeni id alınca bağsız kalıyordu, ölçü-üstü tie (⠶⠈⠉) ise reader tarafından kaynak-son→hedef-ilk TEK DEV YAY yapılıyordu (kopyaları atlayıp bar1.son→bar4.ilk dev yay; bars 2-3 bağsız). Fix: `useMuzikBrfEditor.jsx` `tekrarKopyaBaglariUret(ogeler, baglar)` — kopya id'si `-rpt-${m}-${k}`/`-bwd-${m}-${ki}` kaynak+ölçü kodlar; (a) İÇ bağ (iki uç aynı kaynak ölçüde, kopyalı) her kopya ölçüye remap'le kopyalanır, (b) ÖLÇÜ-ÜSTÜ bağ (bas kopyalı, son hedef) kopya ölçüler üzerinden ZİNCİRLENİR (bar1.son→bar2.ilk, bar2.son→bar3.ilk, bar3.son→bar4.ilk) ve orijinal dev yay `kaldir` ile silinir. `brfMetniYukle`: `sonBaglar = temiz∖kaldir + kopyaBaglari`. Tarayıcıda doğrulandı (her ölçüde iç tie + zincirli ölçü-üstü tie, dev yay yok). **⚠ ZİNCİR ATLAMASI — `_sourceId` GEÇİŞLİ olmalı (kullanıcı: "3.ölçü bağlantısını yapmıyor 4.ölçüye bağlanıyor direkt"):** ardışık `⠶ ⠶`'de bar3 = bar2'nin (zaten bar1'in kopyası) kopyasıdır; klon `_sourceId`'yi `kaynak.id`'den alırsa bar3 bar2'nin KOPYA id'sini gösterir → zincir bar2'yi bulup bar2→bar4 yapar, bar3 atlanır. Fix: `olcuIcerikKlonla` + brailleRepeat klonu İKİSİ DE `_sourceId: kaynak._sourceId || kaynak.id` (geçişli — kopyanın kopyası hep ORİJİNALE çözülür). Node+tarayıcı doğrulandı (3 zincir segmenti bar1→bar2→bar3→bar4, atlama yok).

**CLEF (ANAHTAR) PERDEDEN ÇIKARIM — düşük parçalar FA anahtarı (kullanıcı: "fa anahtarı pdfte ama sen sol anahtarı kullanıyorsun, başkalarında da aynı hata"):** BRF formatı anahtar KODLAMAZ → editör hep varsayılan SOL (treble) ekliyordu, düşük perdeli parçalar (PDF bass clef) yanlış görünüyordu. Fix: `useMuzikBrfEditor.jsx` modül-düzeyi `anahtarPerdeyeGoreCikar(ogeler)` — notaların ortalama perdesini (`oktav*7 + diatonik(notaAd)`, diatonik do=0…si=6) hesaplar; orta do (do4=28) ALTINDAysa `ANAHTAR_FA` (fa anahtarı/bass), değilse `MUZIK_EDITOR_VARSAYILAN_ANAHTAR` (sol). `brfMetniYukle` import'ta `onceAnahtarGarantiEt` yerine bu çıkarımlı anahtarı prepend eder (`anahtarEkliMi` false olduğunda). 48 parçada temiz bölünme: 4 düşük parça (ort 17-21, oktav 2-3) → FA [Donanım değişimi s.32-33, Bracket slur s.44, **Tekrar+bar-üstü tie s.94 = piece#28**, Bar-repeat ×N s.94-95]; treble parçalar ≥29.4 (boşluk net, yanlış-pozitif yok). BRF'e yansımaz (anahtar yazılmaz) → round-trip korunur; re-import bass'i yeniden çıkarır. Manuel ekleme/yeni skor hâlâ SOL varsayılan (sadece import çıkarır). Tarayıcıda doğrulandı (#28 bass 𝄢, Neşeye Övgü treble 𝄞).

**TEKRARDA BAR-ÜSTÜ TIE BRAILLE'İ GÖRÜNÜR — overlay+indir AYNEN orijinal (kullanıcı: "tekrarlarda bağ brailleri neden görünmüyor, hepsi görünsün"):** `⠶⠈⠉` (bar-repeat + bar-üstü tie) ölçülerinde tie hücresi (⠈⠉) skor-altı overlay'de VE indirilen BRF'te kaybolyordu — tekrar ölçüsü collapse edildiğinde (kopya notalar `_repeatCopy` ile atlanır) ties'ın KAYNAK notası (collapsed kopya) da atlanınca normal nota-sonrası emisyon tie hücresini yazmıyordu (yalnız ⠶ kalıyordu). Fix (engine-only): `musicBrfEngine.js` geriTekrarBlok emisyonunda, tekrar işaretinden SONRA bloğun SON ölçüsünün son notasının `notaSonrasiBagHaritasi` trailing tie/slur hücrelerini yaz — `kaynak:bagInfo.kaynak`+`olcuIdx`+`bagId` ile (zincirli kopya ties'ı `tekrarKopyaBaglariUret`'ten zaten haritada). Overlay dağıtımı (`useBrailleOutput.js`): `bagId`+`olcuIdx` taşıyan bağ hücresi (normal ties yalnız ogeId taşır, olcuIdx YOK) kopya ölçüye `olcuIdx`-eşlenir (`kopyaOlcuMu` return-false'undan ÖNCE). Sonuç: M2/M3 overlay `⠶`(kırmızı)+`⠈⠉`(mavi, "uzatma bağı"); indir `⠶⠈⠉` orijinal BRF ile BYTE-AYNEN (`⠸⠹⠘⠓⠸⠙⠈⠉⠹⠘⠓⠸⠙⠈⠉ ⠶⠈⠉ ⠶⠈⠉ …`). M1 (collapse değil) tie'ı normal yolla bir kez alır (çift yok). Tarayıcı+18 QA doğrulandı.

**BASS CLEF NOTA Y POZİSYONU DÜZELTİLDİ — orta do 76→52 (kullanıcı: "fa anahtarını çözdün ama notalar değişmiş oldu"):** Bass anahtara geçince notalar PORTENİN ALTINA düşüyordu (PDF'te porte İÇİNDE olmalı). Porte çizgileri SABİT [64,76,88,100,112] (`StaffLines.jsx`), bass anahtar glifi F3'ü 76'ya oturtur (`bravuraMetrics.js CLEF_STAFF_Y.bass=76`) AMA `musicConstants.js MUZIK_CLEF_MIDDLE_C_Y.bass=76` ile `notaYHesapla` C4'ü 76'ya (F3 çizgisi) koyuyordu → C3=118 (porte altı), G2=136; glif F3 çapasıyla 24px (4 diyatonik adım) TUTARSIZ (`MUZIK_CLEF_VISUAL_Y_OFFSETS.bass=-24` nota Y'sine hiç uygulanmıyordu). Fix: `MUZIK_CLEF_MIDDLE_C_Y.bass=52` (=76−24) → C4 üst çizgi A3(64)'ün 1 ek-çizgi üstü; C3=94 (2. boşluk), G2=112 (alt çizgi) — PDF #28 ile birebir. tenor 88→76 de düzeltildi (kullanılmaz); alto=88 zaten doğru. `qa:score-clef` BUGLI değerleri (do4=76/do3=118) codify ediyordu → doğru değerlere güncellendi (do4=52/do3=94). treble (124) değişmedi. Anahtar BRF'e yazılmaz → round-trip etkilenmez (yalnız görsel Y).

**ANAHTAR DEĞİŞİMİ SES'İ DEĞİŞTİRMEZ (kullanıcı: "sol→fa geçişinde ses değerlerini değiştirmemek üzere çalışıyordu, bozmadın değil mi"):** Doğrulandı — anahtar SADECE görsel. Ses `muzikNotaMidiAl` = `(oktav+1)*12 + NOTA_SEMITONE[notaAd] + aksidental` (anahtar terimi YOK); `anahtariDegistir` = `[yeniAnahtar, ...onceki.filter(o=>o.tip!=='anahtar')]` (notaların oktav/notaAd'ı hiç ellenmez). Tarayıcı: #28 fa→sol geçişinde nota oktavları birebir aynı (do3/sol2→do3/sol2, `pitchPreserved:true`). Clef inference + bass-Y fix bu fonksiyonların hiçbirine dokunmaz.

**TEKRAR HÜCRELERİNE TIKLAYINCA DETAY PANELİ (kullanıcı: "tekrar ölçülerine tıkladığımda detaylı açıklamalar gelmeli, diğer brailler gibi"):** `BrailleDetayPanel.jsx` `getKuralKey` + `KURAL_DB` bar-repeat (⠶→"Ölçü Tekrarı") için detay veriyordu ama **backward/sayısal tekrar (⠼N, `kaynak:'backward-repeat'`)** eşlenmemişti → generic "Braille Müzik Sembolü" fallback'i gösteriyordu. Fix: yeni `backwardRepeat` kuralı ("Sayısal Tekrar" — Anlamı/İki Türü(geri-sayısal üst-rakam vs ölçü-no alt-rakam)/Braille gösterim/Konum, mor) + `getKuralKey`'e `kaynak==='backward-repeat'`/`kat==='backward-repeat'`→'backwardRepeat' ve `kaynak==='bar-repeat-sayi'`→'barRepeat' (kompakt ⠶⠼N sayı hücreleri). Tarayıcı: ⠶→"Ölçü Tekrarı", ⠼N(Soon)→"Sayısal Tekrar (5 ölçü)", ⠶⠼8→"Ölçü Tekrarı ×8", tekrar-içi ⠈⠉→"Bağ-Uzatma(Tie)" — hepsi detaylı panel açıyor. **DİNAMİK DETAY PANELİ — HAİRPİN OKTAV ZORLAMAZ (kullanıcı: "keskin kreşendodan sonra oktav zorunlu mu, tıklandığındaki açıklamada öyle yazıyor"):** `dinamikKuralBilgisiAl` "Braille'de Yazım" kuralını HER dinamiğe "ardından gelen ilk nota mutlaka oktav alır" diye yazıyordu — hairpin'lerde YANLIŞ (L6 Kural 4: yalnız SÖZCÜK-dinamik oktav zorlar, hairpin grafik işaret). Fix: `hairpin = /keskin|hairpin|çatal|kama/.test(ad) || !kayit.sembol` (engine `muzikModifierSozcukMu` ile birebir) → hairpin'de "oktav ZORLAMAZ, yalnız olağan kurallar gerektiriyorsa" metni; sözcük-dinamikte eski (doğru) zorunlu-oktav metni. Hücre kodları + kalan KURAL_DB girdileri (sus 1-3-4…, tie 4+1-4, beginRepeat 1-2-6+2-3-5-6, ikili-anlam vb.) muzik.js + kılavuzla tek tek doğrulandı, tutarlı. **YERLEŞİM SIRASI KARTI — order-of-signs Bölüm 13 (kullanıcı: "tüm açıklamalarda en son kutuda yerleşim sırası bilgisi olsa… sadece ilgililerde"):** Detay panelinin SON kutusuna "Yerleşim Sırası" kartı eklenir — yalnız nota işaret-yığınına katılan işaretlerde (`yerlesimSirasiKarti(kuralKey, anlam)` slot döndüren keyler: nota/oktav/accidental/dynamic/susleme/tuplet/tie/dot/volta1-2/beginRepeat/endRepeat/slur/nuans). Bağımsız/başlık-seviyesi işaretlerde GÖSTERİLMEZ (barline/final/sectional/timeSignature/keySignature/sus/barRepeat/backwardRepeat → slot null; tempo `kaynak/tip==='tempo'` ile elenir). Kart ÖNCE (ileri-tekrar→volta→cümle bağı açılışı→dinamik→tuplet→süsleme→nüans→aksidental→oktav→NOTA) + SONRA (nokta→fermata→tekli slur→cümle bağı kapanışı→tie→nefes→geri-tekrar) sıralamasını ve "➤ Bu işaret: …" slot satırını yazar (slot no'ları engine `muzikModifierOncesiSira`/`muzikModifierSonrasiSira` ile birebir; nüans önce/sonra `NUANS_ONCE_ADLARI_SET`+fermata regex ile ayrılır). ⚠ KURAL_DB shared → mutasyon YOK: `gosterilenKurallar = yerlesimKarti ? [...kurallar, yerlesimKarti] : kurallar` (yeni dizi). Tarayıcı: piyano hücresi → 7 kart, sonuncusu "Yerleşim Sırası" + "dinamik nota ÖNCESİ 4. sırada".

**NOTALAR ANAHTAR/ZAMAN İMZASI ÜZERİNE BİNMİYOR — overflow sola-kaydırma clamp'i (kullanıcı: "gigue'de notalar anahtarın/zaman imzasının üzerine geliyor, alt dizeklerde de"):** `useMusicScoreLayout.js` `xleriDuzelt` ölçü-içi nota X dağıtımı: aşırı dolu/yoğun ölçüde (Gigue 6/8 ölçüsü 9 sekizlik içeriyor → `ratio=center64/logical64` 1'e clamp → birden çok nota innerEndX'te → cascade `max(prev+itemGap)` son notayı safeEnd'in sağına itiyor → **sola-kaydırma (overflow) İLK notayı safeStart'ın (clef+donanım+zaman imzası sınırı) SOLUNA itip başlığın üzerine bindiriyordu**). `adjusted` dalında geri-clamp vardı ama `blended` dalında YOKTU. Fix: blended overflow sola-kaydırmasından SONRA `if (blended[0].x < safeStart) tümünü geri sağa kaydır` (adjusted ile aynı) → son nota yine taşarsa eşit-dağıtım yedeği (note0=safeStart). Notalar artık ASLA anahtar/zaman imzası üzerine binmez (tüm satırlarda; Gigue ilk nota x=60→159, header sonu 116). Nüans/dinamik-nota binmesi de çoğunlukla bu yatay sıkışmadandı (nüans Y formülü `min(noteY-18, staffTop-8)` zaten sağlam, dinamik staffBottom+16). Tarayıcı: Gigue/Carmen/Bethena/Little Brown Jug ilk nota clef'ten sonra (gap≥9px); 7 QA yeşil.

**GRACE (APEJETÜR/APPOGGIATURA) NOTA DESTEĞİ — Gigue 9 sekizlik bilmecesi ÇÖZÜLDÜ (kullanıcı: "gigue skor çizimi epeyce hatalı"; PDF s.67 görsel açıklaması ile doğrulandı):** Gigue Bar1 PDF'e göre: mordent D5, **[uzun apejetür C5]**, B4, E5, D5, mordent C5(crotchet), **[uzun apejetür B4]**, **[uzun apejetür C5]** — ASIL notalar 6 sekizlik (=6/8), 3'ü GRACE. Editör apejetürleri TAM nota çiziyordu → ölçü 9 sekizlik (taşma → yanlış kirişleme/yerleşim). Kök neden: reader apejetür işaretini (`⠐⠢`=uzun, `⠢`=kısa apejetür) notanın `modifiers.oncesi`'ne ekliyor ama nota TAM süreli kalıyordu. Fix 3 parça: (1) **`musicMeasureHelpers.js notaGraceMi(oge)`** (oncesi modifier'da apejetür var mı) + `ogeSure64Al` grace'te 0 döner → ölçü süresine SAYILMAZ (6/8 doğru, taşma yok). (2) **`musicVisualBeamHelpers.js`** `gorselBeamGruplariOlustur` grace notayı ATLAR (kirişe dahil etmez, aktif grubu bölmez → asıl notalar grace üzerinden kirişlenir). (3) **`MuzikScoreSvg.jsx`** grace nota `scale(0.6)` ile küçük çizilir (anchor x,noteY) + apejetür `oncesi` modifier AYRI glyph çizilmez (çift önlenir). Grace nota `sureIndeksi`'ni KORUR (yalnız ölçü-katkısı 0) → `qa:brf-reading` 39/39 bozulmaz. 4 parça faydalanır: **Gigue (4 grace), Peer Gynt (4), Ceddin Deden (1), Yemen Türküsü (1)**.

**GRACE TRAILING-PLACEMENT + AUTO-BARLINE (kullanıcı: "apajürleri 2. ölçüye almış neden"):** Bar sonu trailing apejetürler (Gigue Bar1: C5-crotchet ölçüyü 6/8 doldurur, ardından B4+C5 grace) yanlış ölçüye düşüyordu. Kök: `musicMeasureHelpers.js` auto-complete (satır ~504) ölçü dolunca AUTO-barline ekliyor; graceler (0 süre) dolum noktasından SONRA geldiğinden auto-barline'ın ÖTESİNE (ölçü 2) düşüyordu. Fix: ölçü dolduğunda **ardından gelen ilk müzikal nota GRACE ise ölçüyü KAPATMA** (olcuSure64 dolu kalır; sonraki gerçek nota split-before-overflow ile, veya gerçek BRF çizgisi kapatır) → graceler bu ölçünün sonunda (gerçek çizgiden önce) kalır. Tarayıcı: Gigue Bar1'in 2 trailing grace'i artık barline'dan ÖNCE (ölçü 1), PDF s.67 ile birebir.

**GRACE OLUŞTURMA — apejetür için perde belirleme (kullanıcı: "apajür için nota belirlemek gerekiyor ama araç çubuğundan yapamıyoruz, nota sormuyor"):** Apejetür modeli = nota + `modifiers.oncesi` apejetür kaydı (grace pitch = notanın kendisi). Toolbar apejetür seçilince `bekleyenModifier` set; ESKİDEN yalnız VAR OLAN notaya tıklanınca uygulanıyordu (yeni grace perdesi yazılamıyordu). Fix: `notaEkle` + `notaEkleKonuma` bekleyen apejetür varsa YAZILAN YENİ notaya apejetür modifier'ı ekler → nota grace olur (perde nota tuşuyla/oktav seçiciyle belirlenir). Hint (`MuzikScoreToolbar.jsx`): "grace (süsleme) notası: perdesini yazmak için bir nota tuşuna basın (ya da var olan notaya tıklayın)". İki yol da çalışır (yeni nota yaz = grace; var olan notaya uygula = grace). Tarayıcıda hint + pending-state doğrulandı; nota-yazma harness'ta sentetik klavye olayıyla sürülemedi (manuel test önerilir) — render yolu import'larla aynı (doğrulanmış).

**GRACE PLAYBACK PERDESİ — kendi perdesinden çalmalı (kullanıcı: "apajur sesleri doğru veriliyor mu"):** `ornamentEventleriGenislet` (`musicPlaybackHelpers.js`) apejetür modifier'ında grace'i `ustMidi` (notanın bir ÜSTÜndeki perde) sanıp `[ustMidi-grace, ana-nota]` çalıyordu — ORNAMENT modeli. İmport grace AYRI bir nota (perde=kendisi), ana nota SONRAKİ öğe. Fix: `if (notaGraceMi(oge))` → grace KENDİ perdesinden (`baseEvent.oge`) KISA çalınır (uzun ~%55, kısa ~%35 süre), ornament-above mantığı atlanır. Node testi: [D5, grace-C5, B4] → `re5(0.5), do5(0.275), si4(0.5)` (eskiden grace=re5 yanlış; şimdi do5 doğru). `qa:playback` yeşil.

**SÜSLEME (TRIL/TURN/MORDAN) KİRİŞ/NOTA YERLEŞİMİ (kullanıcı: "grupedo ikincisi grup çizgisi üzerine gelmiş" → sonra "abartılı yukarıda kaldılar"):** Süsleme glyph'i `MuzikScoreSvg.jsx` sabit `gy=52`'ydi → kirişe biniyordu. İLK fix (grubun min noteY − 42 − 8) ABARTILI yukarı itti çünkü SAP-AŞAĞI (kiriş ALTTA) grupları da yukarı kaldırıyordu. DOĞRU fix — `grupSusGy` **kiriş YÖNÜne göre** (BeamGroup'un yön mantığı birebir, orta çizgi 88): üstte çoğunluk → sap-AŞAĞI (kiriş altta) → süsleme `enYuksek−16` (nota kafasının üstünde); altta çoğunluk → sap-YUKARI (kiriş üstte ≈enYuksek−34) → süsleme `enYuksek−40` (kirişin ~6px üstü). `gy=min(52, grupSusGy)`; kirişsizde `min(52, noteY−16)`. Tarayıcı: down-stem turn'ler ~52 (nota üstü), up-stem turn ~36 (kiriş üstü) — NE biner NE abartılı; 0 çakışma, 0 hata.

**GRACE KİRİŞLEME + SIKIŞTIRMA + SÜSLEME LEGEND RENGİ + TIE ALTTAN (kullanıcı: "apajur notalar birleştirilmiyor ayrık duruyor / grupladığında yakın çizsin / süsleme legend renk oktav ile karışmasın / tie çizimi kesmesin kesecekse alttan"):** (1) **Grace kirişleme** — `gorselBeamGruplari` grace'i asıl kirişten dışlar; ardışık 2+ grace `MuzikScoreSvg.jsx` `graceRunBilgi` ile tespit edilir, bayraksız (grouped) çizilir, ilk grace ELLE küçük sap+ince kiriş (0.6×) çizer (BeamGroup tam-ölçek olduğundan kullanılmaz; x'ler kaydırılmaz). (2) **Sıkıştırma** — `useMusicScoreLayout.js` fixedMap sonrası grace run'ı önceki↔hedef(sonraki nota/measureEndX) ARASINA `GRACE_LEAN=0.62` ile ORANSAL konumlar (ne aşırı yakın ne aşırı uzak — tutarlı, ölçü genişliğinden bağımsız); run içi `GRACE_GAP=13`. (3) **Legend rengi** — `brailleColors.js` susleme `#7c3aed`(violet, oktav `#8b5cf6` ile karışıyordu) → `#d946ef`(fuchsia, NET ayrı). (4) **Tie/slur altan** — `MuzikScoreSvg.jsx` slur `direction='above'` iken aradaki nota uçlardan yüksek/eşit VEYA grace ise (kiriş yukarıda) `direction='below'` (üstten yay çizimi/grace-kirişi keserdi). Tarayıcı: Gigue 2 grace 13px+kirişli, büyük slur ALTTAN (aşağı yay y~94→108; küçük apejetür slur'u üstte kalır), süsleme fuchsia, grace'ler önceki↔hedef arası dengeli; 8 QA yeşil.

**GRACE KİRİŞLEME + SIKIŞTIRMA + SÜSLEME LEGEND RENGİ + TIE ALTTAN (kullanıcı: "apajur notalar birleştirilmiyor ayrık duruyor / grupladığında yakın çizsin / süsleme legend renk oktav ile karışmasın / tie çizimi kesmesin kesecekse alttan"):** (1) **Grace kirişleme** — `gorselBeamGruplari` grace'i asıl kirişten dışlar; ardışık 2+ grace `MuzikScoreSvg.jsx` `graceRunBilgi` ile tespit edilir, bayraksız (grouped) çizilir, ilk grace ELLE küçük sap+ince kiriş (0.6×) çizer (BeamGroup tam-ölçek olduğundan kullanılmaz; x'ler kaydırılmaz). (2) **Sıkıştırma** — `useMusicScoreLayout.js` fixedMap sonrası 2+ grace run'ı SON grace'e çapalanıp sola `GRACE_GAP=13` ile paketlenir (eskiden itemGap ~66px ayrıktı). (3) **Legend rengi** — `brailleColors.js` susleme `#7c3aed`(violet, oktav `#8b5cf6` ile karışıyordu) → `#d946ef`(fuchsia, NET ayrı). (4) **Tie/slur altan** — `MuzikScoreSvg.jsx` slur `direction='above'` iken aradaki nota uçlardan yüksek/eşit VEYA grace ise (kiriş yukarıda) `direction='below'` (üstten yay çizimi/grace-kirişi keserdi). Tarayıcı: Gigue 2 grace 13px+kirişli, büyük slur ALTTAN (aşağı yay y~94→108; küçük apejetür slur'u üstte kalır), süsleme fuchsia, grace'ler önceki↔hedef arası dengeli; 8 QA yeşil. ✅ İki ardışık apejetür ARTIK KİRİŞLENİR: `gorselBeamGruplari` grace'i ASIL kirişten dışlar ama `graceRunBilgi` (MuzikScoreSvg) ardışık 2+ grace'i tespit edip ilk grace ELLE küçük sap+ince kiriş çizer (0.6× ölçek; BeamGroup tam-ölçekli olduğundan kullanılmaz). 8 QA yeşil (reading/score-layout/beam/barline/roundtrip/pieces/pdf-fixtures/playback). ⚠ DERS (kullanıcı: "pdfteki notasyonlara bakarak tüm örnekleri alabilirdin"): mevcut testler braille round-trip + per-nota perde/süre doğruluyordu ama **ÖLÇÜ-süresinin zaman imzasına eşitliğini** (grace/tuplet/grouping sonrası) doğrulamıyordu — Gigue bu yüzden kaçtı. PDF görsel açıklamaları (her örnekte) asıl otorite; ileride per-ölçü süre + grace/süsleme sınıflaması bu açıklamalarla karşılaştırılmalı.

**NOTA GRUPLAMASI AÇ/KAPA TUŞU (kullanıcı: "yazarken gruplama aç kapa tuşu, ayarlarda listelensin"):** Editör toolbar `MuzikScoreToolbar.jsx` "Ayarlar" (⚙) açılır menüsü → "Nota gruplaması (kiriş)" checkbox → `muzikHeader.useBrailleGrouping` toggle + global `ayarGuncelle({muzikGruplama})` ile KALICI. Global ayar `ayarlar.js` `muzikGruplama:true`. Yeni skorlar `varsayilanMuzikHeaderOlustur` ile bu ayardan `useBrailleGrouping` varsayılanını alır (`musicHeaderHelpers.js` → `ayarlariAl().muzikGruplama`). Yazarken istenmezse kapatılır → braille tam-süre hücre (gruplama yok).

**GERİ-SAYISAL TEKRAR (backward-numeral, ⠼N üst-rakam — PDF s.97-98 "Soon Soon Soon") IMPORT GENİŞLETME (kullanıcı: "Soon Soon Soon eksik okuyor, repeatlerde sorun"):** `⠼N` (ÜST-rakam, aralıksız) = "önceki N ölçüyü tekrarla" (Soon: 14 ölçü = bars 1-5 + `⠼5`→6-10 + 11-12 + `⠼2`→13-14). Reader (`brfMusicReaderRules.js`) artık `repeatInstruction`'a `repeatTuru:'backward-numeral'` + `geriOlcuSayisi:N` ekler (üst-rakam ⇒ geri-sayısal; ALT-rakam/⠤-aralık ⇒ 'bar-number', genişletilmez). Editör adaptörü (`useMuzikBrfEditor.jsx` `brfReaderSonucundanSkorOgeleriAl`) `olcuIcerikGecmisi` (tüm çıktı ölçüleri) tutar; geri-tekrar ölçüsünde son N ölçüyü kopyalar (`olcuIcerikKlonla`, `_repeatCopy`). ⚠ Erken `return` ETME — ölçüdeki tekrar-yönergesi DIŞI öğeler (finalBarline `⠼⠃⠣⠅`) son kopyadan sonra eklenmeli (yoksa bitiş çizgisi kaybolur). Skor: 16→32 nota (tam 14 ölçü GÖRSEL portede çizilir; `_repeatCopy`). Okunur özet (`brfMusicReadableSummary.js`) tekrarı GENİŞLETMEZ, TARİF eder: "6. ölçü: önceki 5 ölçünün tekrarı" (braille'i aynalar; eskiden boş "ölçü çizgisi"). **BRAILLE (skor altı overlay + İNDİR) AYNEN orijinal BRF (kullanıcı: "brailleri aynen yaz, tekrarlarda özellikle"):** kopyalar braille'de YAZILMAZ; tek `⠼N` işareti yazılır (tıpkı bar-repeat ⠶⠼N). Adaptör blok başı ilk notayı `_geriTekrarSayisi=N` ile işaretler; engine (`musicBrfEngine.js`) `geriTekrarBlokBaslangic`/`geriTekrarBlokOlculeri` ile blok ölçülerini `atlananIndeksler`'e atar, blok başında `⠼N` (sayı işareti + üst-rakam, `kaynak:'backward-repeat'`, olcuIdx) yazar + ölçü sonu boşluğu. Overlay dağıtımı (`useBrailleOutput.js`) `backward-repeat` kaynağını da olcuIdx ile eşler. Legend ayrı kategori "geri tekrar (önceki N ölçü)" (mor, `brailleColors.js`+`brailleLegendRegistry.js`). Round-trip: İNDİR `⠼5`/`⠼2` üretir, re-import [5,2] → 32 nota. Tarayıcıda doğrulandı (skor 14 ölçü çizer, braille `⠼5`/`⠼2`). **⚠ OVERLAY DAĞITIM SIZINTISI (kullanıcı: "tekrardan sonra tekrar edilenin brailini yazmamalıydın"):** Engine `cevirSonuc.hucreler`'i DOĞRU kolaps eder (kopya notalar yok) AMA `useBrailleOutput.js` `brailleHucreleriniSkorOlculerineDagit` kopya ölçünün `measure.itemIds`'inde kopyanın `_sourceId`'sini (ORİJİNAL nota id'si) DE bulduğundan, orijinal ölçülerin (bars 1-5) hücrelerini kopya ölçülere (bars 6-10) ogeId-eşlemesiyle SIZDIRIYORDU → overlay 14 ölçü dolu görünüyordu (72 hücre, 54 yerine). Fix: `kopyaOlcuMu` (ölçünün tüm nota/sus öğeleri `_repeatCopy`) ise nota-hücresi eşlemesi KAPATILIR — yalnız tekrar işareti (⠶/⠼N, olcuIdx ile) gösterilir. Bar-repeat de aynı koddan geçer (zaten kolapslıydı, regresyon yok). Sonuç: Soon overlay 9 kutu (bars 1-5, ⠼5, 11-12, ⠼2), bar-repeat 3 kutu (bar1, ⠶⠼8, bar10).

**BAR-REPEAT ×N KOMPAKT EXPORT (⠶⠼N):** Reader `⠶⠼N`'i `brailleRepeat tekrarSayisi=N` okur, adaptör N kopyaya açar. Export `musicBrfEngine.js`: 3+ ardışık özdeş ölçü RUN'ı → `⠶⠼N` (kompakt, `barRepeatKompaktBaslangic`/`barRepeatKompaktAtla`, sayı `MUZIK_UST_RAKAM`); 1-2 ölçü ayrı `⠶`. 10 özdeş → `⠐⠹⠹⠹⠹ ⠶⠼⠊`. **EKRAN-ALTI OVERLAY = İNDİR (kullanıcı: "brf'de nasıl geçiyorsa overlay'de de öyle, N tekrarda 1 kez yazsın"):** İkisi de `muzikSkorunuBrailleyeCevir`'den türer → overlay de `⠶⠼N`'i İLK tekrar ölçüsünde 1 kez gösterir (N kez DEĞİL — kompakt run devam ölçüleri atlanır). Gotcha: `⠼N` sayı hücrelerine `metaEkle({olcuIdx})` ZORUNLU (yoksa ogeId'siz hücre overlay dağıtımında düşer → overlay `⠶`, indir `⠶⠼N` = tutarsız); `useBrailleOutput.js` dağıtım `bar-repeat-sayi` kaynağını da `olcuIdx` ile eşler. Gruplama da aynı motordan → overlay↔indir tutarlı (notalar ogeId taşıdığından zaten doğru dağılır). **LEGENDDE TEKRAR TÜRÜ (kullanıcı: "legendde tekrar türü de yazmalıydı"):** bar-repeat legend etiketi artık `braille tekrar ×N` (önceden hep "braille tekrar"). `⠶` + sayı hücreleri `metaEkle({tekrarSayisi:kompaktN})`; `useBrailleOutput` anlam'a `tekrarSayisi` taşır; `brailleLegendRegistry.js` `brailleLejantEtiketiAl` 'bar-repeat' için `n>1 ? \`braille tekrar ×${n}\``. ⚠ Legend key = `${kategori}:${etiket}` → `⠶` ("×8") ile sayı hücreleri ("") FARKLI etiket alırsa ÇİFT girdi olur; bu yüzden sayı hücrelerine de AYNI `tekrarSayisi` verilir (tek girdi).

**Hazır parçalar (`muzikHazirParcalar.js`) yeniden üretildi:** `npm run tool:fix-pieces:write` (script `music-brf-fix-pieces.mjs`) — her parçayı import → editör-oge adaptörü (hook'tan faithful kopya) → `scoreToCanonicalBrf` (standart-doğru) → yeni BRF. Oktav(Kural4)/boşluk/gruplama düzelir, **müzikal içerik + header (zaman+donanım+başlık+besteci) korunur** (içerik-imza karşılaştırmasıyla doğrulanır). Bare nota ile biten parçalara standart final barline (⠣⠅) eklenir; endRepeat ile bitenler korunur. 9/9 kanonik/stabil (load→export→load özdeş). Ölçü numarası GÖMÜLMEZ (süsleme hücreleriyle çakışır; sunum/satır-kırılması özelliği). Çalıştırınca diff için `--diff --only=<ad>`.

**PDF HAZIR PARÇALARDA BESTECİ + TEMPO (kullanıcı: "tempolar ve besteci bölümleri neden hep eksik, eklediklerinin tamamında"):** `scripts/music-brf-add-pdf-pieces.mjs` `tamBrfKur` ESKİDEN yalnız başlık+donanım/zaman+gövde yazıyordu (`meta.tempo` yok sayılıyor, `baslikTemiz` `—`-sonrası besteci'yi siliyordu) → 42 PDF parçasının HEPSİ besteci/tempo'suz. Fix: `parcaMeta(meta)` `_pdf_descriptions.json`'dan sayfa eşlemesiyle Title/Composer/Subtitle/Tempo çıkarır (besteci yoksa subtitle, ör. "American Folk Song"; id `—`-besteci fallback); başlık=tempo / başlık=besteci tekrarını eler. `tamBrfKur` AYRI satırlar yazar: **başlık / besteci / tempo / donanım+zaman / gövde** — reader metin satırlarını sırayla title→composer→tempo'ya atar (`brfMusicReader.js`:78). Tempo'yu key/time ile AYNI satıra koyma (editör `muzikHeaderSatirlariUret` öyle yapar ama reader dot-3 ayırıcı+keysig'i tempo metnine sızdırır). Script header round-trip'i de doğrular (42/42). **Header metni artık RAKAM+kesme/nokta/virgül/tire destekler** (Rondo KV 386, Op. 93, Lovin'): `muzikKontraksiyonsuzMetinHucreleri` (musicHeaderEngine.js) rakam→sayı işareti⠼+a–j (sayı modu)+kesme→[3]; reader `detectHeaderLineType` (brfMusicReaderRules.js ~2100) `TEXT_ISARET`+`DIGIT_BY_KEY` ile geri çözer (müzik gövdesi oktav-önekiyle daha önce yakalandığından title-decoder'a yalnız metin gelir → güvenli). Tüm BRF QA yeşil.

**Props:** `acik, onKapat, muzikHeader, setMuzikHeader, setTimeSignature, notaEkleKonuma, susEkleKonuma, manuelOlcuCizgisiEkle, ogeleriSil, seciliNotayiGuncelle, seciliOgeId, setSeciliOgeId, sonKullanilanOktav, sonEklenenOgeId, svgYerlesimHaritasi, muzikSatirSayisi` — most from `useMuzikBrfEditor`; `acik`/`onKapat` defined in `MuzikBrfYazim`. Active row/measure derived from `svgYerlesimHaritasi.get(seciliOgeId||sonEklenenOgeId)`.

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
│   ├── AramaSayfasi.jsx         # ★ Braille search (/arama) — dot-number search across modules
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
    ├── aramaIndeksi.js          # Braille search index (all module symbols) + aramaYap()/sorguyuNormalle()
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
