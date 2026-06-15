# Müzik BRF Yazım Modülü — Claude Session Guide

Auto-read at session start (this file + CLAUDE.md). Read before touching any music code.

---

## 1. Modül Genel Bakış

**Route:** `/#/muzik-brf-yazim`  
**Page component:** `src/pages/MuzikBrfYazim.jsx`  
**Ana editör:** `src/components/music/MuzikBrfScoreEditor.jsx`  
**Amaç:** Görme engelli kullanıcılar için Braille müzik notası (BRF) yazımı.  
NVDA + Web Speech API (Türkçe TTS) ile tam erişilebilir.

---

## 2. Dosya Haritası

```
src/
├── pages/
│   └── MuzikBrfYazim.jsx                   # Sayfa wrapper; uyarı TTS, prop drilling
│
├── components/music/
│   ├── MuzikBrfScoreEditor.jsx             # ★ Ana editör (toolbar + score + braille output)
│   ├── MuzikScoreSvg.jsx                   # ★ SVG parti + TÜM klavye handler'ları
│   ├── PerkinsYazimPaneli.jsx              # ★ Perkins braille klavye paneli (sayfanın altında)
│   ├── MuzikScoreToolbar.jsx               # Araç çubuğu (mod, ayarlar, dışa aktar)
│   ├── MuzikKlavyeYardim.jsx               # F1 kısayol yardım popup (erişilebilir dialog)
│   ├── MuzikBarlineTimeSignatureModal.jsx  # Ölçü çizgisi / Zaman imzası değiştir popup
│   ├── MuzikScoreBrailleOverlay.jsx        # SVG üstü braille hücreler
│   ├── MuzikBrailleOutput.jsx              # Alt BRF metin çıkışı
│   ├── MuzikScoreHeader.jsx                # Parti başlığı (anahtar, zaman imzası)
│   ├── MuzikKeySignatureModal.jsx          # Donanım / anahtar değiştir popup
│   ├── MuzikNotaEditModal.jsx              # Nota detay düzenleme popup
│   └── svg/                               # SVG glyph bileşenleri (nota, sus, beam, slur…)
│
├── hooks/music-brf/
│   ├── useMuzikBrfEditor.jsx              # ★ Tüm editör state + mutation fonksiyonları
│   ├── useMusicScoreLayout.js             # SVG yerleşim hesabı → svgYerlesimHaritasi
│   ├── useMusicScorePlayback.js           # ★ Playback (Space çal/duraklat, playFromOge)
│   ├── useBrailleOutput.js                # BRF metin üretimi
│   └── usePianoNotePreview.js             # Klavye öğrenme modu piyano önizleme
│
└── utils/music-brf/
    ├── musicMeasureHelpers.js             # ★ bosOlculeriTemizle() + ölçü yardımcıları
    ├── musicConstants.js                  # Nota adları, süre değerleri, semboller
    ├── musicScoreHelpers.jsx              # Skor yardımcıları
    ├── musicCanonicalPipeline.js          # Canonical form dönüşümleri
    ├── musicBrfExportEngine.js            # BRF dışa aktarma
    └── musicBrailleImportEngine.js        # BRF içe aktarma
```

---

## 3. Temel State (useMuzikBrfEditor)

```js
// useMuzikBrfEditor'dan dönen key değerler:
{
  ogeler,              // nota/sus/barline dizisi (canonical form)
  seciliOgeId,         // tek seçili öge ID'si
  setSeciliOgeId,
  cokluSecimIds,       // string[] — çoklu seçim ID listesi
  setCokluSecimIds,

  notaEkleKonuma,      // ({ notaAd, sureIndeksi, octave, dotted, insertAfterId, basaEkle })
  susEkleKonuma,       // ({ sureIdx, insertAfterId, dotted, basaEkle })
  seciliNotayiGuncelle,// ({ notaAd?, accidental?, sureIndeksi?, octave?, dotted? })
  seciliOgeyiSil,      // → bosOlculeriTemizle
  ogeleriSil,          // (ids: string[]) → bosOlculeriTemizle
  manuelOlcuCizgisiEkle, // (insertAfterId) → barline kind:'manual'

  slurUygulaSecim,     // (ids)
  tieUygulaSecim,      // (ids)
  uclemeUygulaSecim,   // (ids)
  dinamikNotayaUygula, // (sembol, notaId) — mevcut dinamiği replace eder

  bagAraclari,         // { slur, tie, ucleme, dinamik } — prop olarak geçilir

  muzikUyarilari,      // string[] — hata/uyarı mesajları
}
```

---

## 4. SVG Yerleşim Haritası

`svgYerlesimHaritasi`: `useMusicScoreLayout`'tan döner.  
`Map<ogeId, { x, y, measureIndex, rowIndex, ... }>`

**Kullanım yerleri:**
```js
// Ölçü numarası (barline aria-label'ında):
const m = svgYerlesimHaritasi?.get?.(oge.id)?.measureIndex;
const olcuNo = Number.isFinite(Number(m)) ? `${Number(m) + 1}. ölçü sonu — ` : '';

// Ctrl+arrow measure jumping:
const mOf = (i) => navEls[i]?.getAttribute('data-measure');
```

---

## 5. Klavye Navigasyon Sistemi (MuzikScoreSvg)

### 5.1 `data-nav` Attribute Kuralı

**CRITICAL:** Navigation queries her zaman `[data-nav]` kullanır — `[data-oge-id]` KULLANMA  
(braille hücreleri de `data-oge-id` taşır, navigation'a karışır).

| Element | `data-nav` değeri | `data-oge-id` | `data-measure` |
|---------|------------------|---------------|----------------|
| Nota `<g>` | `"nota"` | oge.id | measureIndex |
| Sus `<g>` | `"sus"` | oge.id | measureIndex |
| Barline `<g>` hit-area | `"barline"` | oge.id | — |
| Sol anahtarı `<g>` | `"anahtar"` | `"ANAHTAR_BAS"` | — |
| Zaman imzası `<g>` | `"zaman"` | `"ZAMAN_IMZA"` | — |

### 5.2 Sentinel ID'ler

```js
'ANAHTAR_BAS'  // Sol anahtarı — nota eklerken basaEkle:true trigger
'ZAMAN_IMZA'   // Zaman imzası — zaman imzası modal açar
```

### 5.3 Navigasyon Klavye Kısayolları

| Tuş | Eylem |
|-----|-------|
| `←` / `→` | Önceki / sonraki [data-nav] öğesi |
| `Home` / `End` | İlk / son [data-nav] öğesi |
| `Ctrl+←` / `Ctrl+→` | Önceki / sonraki ölçüye atla (data-measure kullanır) |
| `Shift+←` / `Shift+→` | Aralık seçimi (secimAnchorRef) |
| `Shift+Home` / `Shift+End` | Başa / sona kadar seç |
| `Ctrl+A` | Tüm notaları seç |

### 5.4 Düzenleme Klavye Kısayolları

| Tuş | Eylem |
|-----|-------|
| `Enter` (tek) | Düzenleme modunu aç/kapat (her yerden; form öğeleri hariç) |
| `Enter Enter` (çift, <450ms) | **Perkins (Braille yazım) modunu aç** — bkz. §16 (`sonEnterZamaniRef`) |
| `F2` | Ekleme ↔ Düzeltme modu geçişi (`altModRef`) |
| `F1` | Kısayol yardım popupını aç |
| `Esc` | Düzenleme modunu kapat |
| `Space` | Seçili notadan çal / duraklat |
| `Alt` | Seçili notanın braille noktalarını oku + braille hücreye odaklan |
| harf (edit'te) | **Ekleme:** yeni nota ekle (SONRA) — **Düzeltme:** perdeyi değiştir |
| `1`–`7` | Süre değiştir (ekleme: yeni nota süresi; düzeltme: seçili notanın süresi) |
| `r` | Sus ekle (seçili konumdan sonra) |
| harf (sus seçiliyken) | Susu notaya çevir |
| `.` | Uzatma noktası ekle / kaldır |
| `Delete` | Seçili notayı sil |
| `ğ` / `ü` | Bir oktav aşağı / yukarı |
| `↑` / `↓` ok | Diyez · naturel · arıza yok · bemol arası geçiş |
| `l` (veya `|`) | Seçili notadan sonra ölçü çizgisi ekle |
| `t` | Üçleme (triplet) uygula (seçiliyken) |
| `y` | Hece bağı / slur uygula (seçiliyken) |
| `u` | Uzatma bağı / tie uygula (seçiliyken) |
| `Shift+P` | Piano dinamiği — tekrar: `p ↔ pp` |
| `Shift+F` | Forte dinamiği — tekrar: `f ↔ ff` |
| `Shift+M` | Mezzo dinamiği — tekrar: `mf ↔ mp` |
| `Enter` (ölçü çizgisinde) | Çizgi tipini değiştir popup |
| `Enter` (zaman imzasında) | Zaman imzası değiştir popup |
| `Enter` (anahtarda) | Anahtar / donanım değiştir popup |

### 5.5 altModRef (Ekleme / Düzeltme Modu)

```js
const altModRef = useRef('ekleme'); // 'ekleme' | 'duzeltme'
// F2 ile toggle; düzenleme modu kapanınca 'ekleme'ye reset
```

- **Ekleme modu:** harf → `notaEkleKonuma({..., insertAfterId: seciliOgeId})`  
- **Düzeltme modu:** harf → `seciliNotayiGuncelle({notaAd, accidental: null})`; `1-7` → `seciliNotayiGuncelle({sureIndeksi})`

---

## 6. Nota Tuş Düzenleri

`ayarlariAl().notaTusDuzeni`: `'alfabetik'` (varsayılan) | `'piyano'`  
Her `keydown`'da **taze** okunur (ayar değişince hemen etki eder).

```js
const NOTE_KEYS_ALFABETIK = { a:'la', b:'si', c:'do', d:'re', e:'mi', f:'fa', g:'sol' };
const NOTE_KEYS_PIYANO    = { a:'do', s:'re', d:'mi', f:'fa', g:'sol', h:'la', j:'si', k:'do' };

function noteKeysAl() {
  return ayarlariAl().notaTusDuzeni === 'piyano' ? NOTE_KEYS_PIYANO : NOTE_KEYS_ALFABETIK;
}
```

**Standart:** G = Sol uluslararası standart. H = Almanca sistemde Si (Türkçede kullanılmaz).  
Bu nedenle alfabetik düzen `g:'sol'` kullanır, `h:'sol'` YANLIŞTIR.

---

## 7. TTS / Erişilebilirlik Sistemi

### 7.1 `sesAcik` Ayarı

`ayarlariAl().sesAcik` — Global Ayarlar sayfasından açılır/kapanır.  
**MUZİK MODÜLÜNE AYRI BİR sesAcik BUTONU EKLEME** — kullanıcı bunu açıkça yasakladı.  
MuzikScoreToolbar'daki Ayarlar menüsünde varsa "Sesli yönerge" olarak göster (ayarGuncelle ile).

### 7.2 Duyurma Fonksiyonları (MuzikScoreSvg içinde)

```js
// sesAcik: true → konus(); false → aria-live RAF update
function duyur(metin) { ... }

// TTS bittikten sonra callback (sesAcik false ise setTimeout(900))
function duyurVeSonra(metin, sonra) { ... }
```

### 7.3 Global focusin Dinleyici

```js
document.addEventListener('focusin', (e) => {
  // sonProgramatikOdakRef.current eşleşiyorsa → skip (Alt braille odağı çift okumayı önler)
  const etiket = erisimAdi(e.target);
  if (etiket) duyur(etiket);
}, true);
```

### 7.4 `erisimAdi(el)` — Form Etiket Çözümleme

```
select  → "seçili: <value>, seçim kutusu"
checkbox → "işaretli / işaretsiz, onay kutusu"
radio   → "seçili / seçili değil, X/Y, seçenek düğmesi"  (X=index, Y=toplam)
diğer   → aria-label || aria-labelledby || label[for] || placeholder || title
```

### 7.5 Hata/Uyarı TTS

`MuzikBrfYazim.jsx` içinde:
```js
// muzikUyarilari dizisi büyüdüğünde yeni mesajı oku:
useEffect(() => {
  if (muzikUyarilari.length > oncekiUyariSayisiRef.current && ayarlariAl().sesAcik) {
    konus("Uyarı: " + muzikUyarilari[muzikUyarilari.length - 1]);
  }
  oncekiUyariSayisiRef.current = muzikUyarilari.length;
}, [muzikUyarilari]);
```

---

## 8. Çoklu Seçim Sistemi

```js
const [cokluSecimIds, setCokluSecimIds] = useState([]);
const cokluSecimSet = useMemo(() => new Set(cokluSecimIds), [cokluSecimIds]);
const secimAnchorRef = useRef(null); // Shift+arrow için başlangıç noktası

function secimSifirla() {
  setCokluSecimIds([]);
  secimAnchorRef.current = null;
}
```

**Seçim sıfırlama:** Her nota/sus/dinamik/nokta/arıza handler'ı sonunda `secimSifirla()` çağrılır.

**Toplu silme:** `ogeleriSil(cokluSecimIds)` → `bosOlculeriTemizle` de çalışır.

---

## 9. Boş Ölçü Temizleme

`musicMeasureHelpers.js` → `bosOlculeriTemizle(ogeler)`:
- Sil işleminden sonra çağrılır
- Normal barline'ları tarar; kapadığı ölçüde nota/sus yoksa barline'ı kaldırır
- Special barline'lar (final/repeat/volta) korunur
- `seciliOgeyiSil` ve `ogeleriSil`'in her ikisi de bu fonksiyonu kullanır

---

## 10. Ölçü Çizgisi Sistemi

### 10.1 Manuel Ekleme
```js
manuelOlcuCizgisiEkle(insertAfterId)
// → barline ögesi kind:'manual' olarak eklenir
// Kısayol: 'l' tuşu (veya '|' — AltGr gerektiren Türkçe klavyede zor)
```

### 10.2 Popup (MuzikBarlineTimeSignatureModal)

Erişilebilirlik özellikleri:
- `useEffect` + RAF ile açılışta focus
- `oncekiOdakRef` ile kapanışta focus geri yükleme  
- `Escape` ile kapanır
- `Tab` focus trap (içinde döngü)
- `onKeyDown`: `stopPropagation()` (global handler'a sızmasın)

### 10.3 Barline aria-label

```jsx
aria-label={(() => {
  const m = svgYerlesimHaritasi?.get?.(oge.id)?.measureIndex;
  const olcu = Number.isFinite(Number(m)) ? `${Number(m) + 1}. ölçü sonu — ` : '';
  return `${olcu}${oge.ad || 'Ölçü çizgisi'}, değiştirmek için Enter`;
})()}
```

---

## 11. Braille Overlay (MuzikScoreBrailleOverlay)

Hücre `<span>` özellikleri:
```jsx
data-oge-id={ogeId}
data-braille-dots={hucre.join('-')}
className="muzik-braille-hucre"
tabIndex={ogeId ? -1 : undefined}
aria-label={ogeId ? "Braille nokta X X..." : undefined}
role="img"
```

**Alt tuşu:** Seçili notanın braille hücresine odaklanır + TTS okur:  
`"nota adı. Braille: nokta X X X"`  
`sonProgramatikOdakRef.current` = o hücre (focusin double-read'i önler).

---

## 12. Playback (useMusicScorePlayback)

```js
// Space: seçili notadan başlayarak çal/duraklat
playFromOge(ogeId)
// → playbackListesi'nde ogeId'yi bulur, indexRef'i ayarlar, preloadRowUrls+onSon ile çalar
```

---

## 13. MuzikKlavyeYardim (F1 Popup)

### Yapı

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="klavye-yardim-baslik"`
- `tabIndex={-1}` + `onKeyDown` (stopPropagation, Esc kapat, Tab trap)
- Açılışta `oncekiOdakRef.current = document.activeElement` → kapatınca geri focus
- **2 sütun grid:** `sm:grid-cols-2`
- Her `<h3>` → `tabIndex={0}` (klavyeyle gezilebilir)
- Her kısayol satırı → `tabIndex={0}`, `aria-label={tusAriaMetni(tus) + ': ' + anlamAriaMetni(anlam)}`

### Nota Tuş Düzeni Geçişi

Popup içinde radiogroup: Alfabetik / Piyano  
→ `ayarGuncelle({ notaTusDuzeni: ... })` — canlı değişir, editörde de hemen etkili.

### Sembol → Kelime Dönüşümü

```js
tusAriaMetni(tus):
  OZEL_TUS_OKUNUS['|'] → 'dik çizgi tuşu — Türkçe klavyede AltGr ile...'
  '←' → 'sol ok tuşu', '→' → 'sağ ok tuşu'
  'Ctrl' → 'Kontrol', 'Shift' → 'Şift'
  '.' → 'nokta'
  ' / ' → ' ve ' (çoğul: 'tuşları')

anlamAriaMetni(anlam):
  '·' → ', ', '↔' → ', ', '/' → ' veya '
```

### Gruplar Sırası

```
Genel → Notalar (aktif düzene göre) → Ekleme/Düzeltme modu →
Süre değerleri → Oktav ve arıza → Gezinme ve seçim →
Sus ve oynatma → Bağlar ve gruplar → Dinamikler →
Ölçü çizgisi ve header
```

**Notalar grubuna dahil:** `.` (uzatma noktası) + `Delete` (sil)  
**"Diğer" grubu YOKTUR** — kaldırıldı.

---

## 14. MuzikScoreToolbar

- **Ayarlar menüsü içinde:** "Sesli yönerge (tarayıcı seslendirme)" checkbox → `ayarGuncelle({sesAcik})`
- **Nota tuş düzeni:** radio (Alfabetik / Piyano) → `ayarGuncelle({notaTusDuzeni})`
- Toolbar'da AYRI sesAcik toggle oluşturma — `sesAcik` global Ayarlar'da zaten var

---

## 15. Global Enter Handler'ı İstisnaları

Global `keydown` Enter handler şu öğelerde tetiklenmez:
```js
const istisnalar = [
  'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON',
  '.muzik-anahtar-grup',        // Sol anahtarı — kendi Enter handler'ı var
  '.muzik-zaman-imza-grup',     // Zaman imzası — kendi Enter handler'ı var
  '.muzik-barline-hit-area',    // Ölçü çizgisi — kendi Enter handler'ı var
];
```

---

## 16. Perkins Braille Klavye Paneli (`PerkinsYazimPaneli.jsx`)

### 16.1 Genel Bakış

Çift Enter ile açılan **yazım modu**. Buton YOK. Panel, o an yazılan **aktif ölçü
satırının hemen altına** React Portal ile basılır (`.muzik-olcu-braille-blok` son
çocuğu → satır flex-column olduğundan SVG'nin altında görünür, sonraki satır flex
gap ile aşağı itilir). Yeni nota eklendikçe aktif satır değişir → panel onu **takip
eder** (portal hedefi yeniden hesaplanır). Üst çubukta `{N}. ölçü` rozeti gösterir.

**Açma:** sayfanın HER YERİNDEN **çift Enter** (`MuzikScoreSvg` Enter handler, §16.10).
**Kapama:** Escape veya ✕ → `onKapat` → `setPerkinsAcik(false)`.

`acik` state sayfada (`MuzikBrfYazim`): panel kapalıyken bile **mount kalır** (erken
`return null`), böylece `gecmis`/`tab` state ve textarea focus satır değişimlerinde korunur.

### 16.2 Tuş Haritası — İmleç (caret) tabanlı editör

**İmleç = `seciliOgeId`** (`caretIdRef` ile senkron). Tüm işlemler imleç üzerinden:

```
F=1 D=2 S=3  /  J=4 K=5 L=6  → akor (hücre):
                                 Ekleme modu  → imleçten SONRA ekle (imleç ilerler)
                                 Düzeltme modu → imleçteki notayı değiştir (imleç durur)
Boşluk (Space)  → imleçten sonra ölçü çizgisi (manuelOlcuCizgisiEkle)
Backspace       → bekleyen akor varsa iptal; yoksa imleçteki öğeyi sil (geri komşuya geç)
Delete          → imleçteki öğeyi sil (ileri komşuya geç)
← / →           → imleci önceki / sonraki [data-nav] öğesine taşı (sınırda "ilk/son öğe")
F2              → Ekleme ↔ Düzeltme modu (panelde de toggle butonu var)
Escape          → Perkins modundan çık
```

**İmleç senkronu:** `notaEkleKonuma`/`susEkleKonuma`/`manuelOlcuCizgisiEkle` yeni `oge`'yi
**döndürür** → `caretIdRef.current = oge.id` (eager). Dış seçim (skorda tıklama) →
`useEffect([seciliOgeId])` ile `caretIdRef` güncellenir. Gezinme/silme `navOgeIdleri()`
(`.araclar-muzik-skor-svg [data-nav]` belge sırası) üzerinden komşu id'yi bulur.

**Düzeltme:** `seciliNotayiGuncelle({ notaAd, sureIndeksi, oktav? })` — imleçteki nota/susu
değiştirir (ekleme yapmaz). Mod `modRef` ile event handler'da taze okunur.

**İmleç okunuşu:** panelde `İmleç: {caretEtiket}` — `ogeEtiketiAl(seciliOgeId)` (aria-label),
`[acik, seciliOgeId, gecmis.length]` effect'inde rAF ile tazelenir (insert sonrası DOM otursun diye).

### 16.3 Chord (Akor) Input Mekanizması

```js
const PERKINS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };

// pressedRef  — o an basılı tuşlar (keyup'ta silinir)
// pendingRef  — basılı tuş birikimi (commit sonrası temizlenir)
// timerRef    — 15ms debounce (tüm tuşlar çekildi mi bekler)

// handleKeyDown → pressedRef + pendingRef'e ekle
// handleKeyUp  → pressedRef'ten çıkar, 15ms timer
//                timer dolarsa: pressedRef boşsa ve pendingRef doluysa → commit(dots)
```

**CRITICAL:** `pressedRef.size === 0 && pendingRef.size > 0` kontrolü yapılır — sadece tüm tuşlar bırakılınca commit gerçekleşir.

### 16.4 Çakışma Önleme (MuzikScoreSvg ile)

`<textarea>` olarak render edilir. `MuzikScoreSvg`'nin document capture handler'ı **textarea hedeflerini atlar** (satır ~755):
```js
if (ae && !muzikKlavyeYakalayiciMi && (/^(input|textarea|select)$/i.test(ae.tagName) || ae.isContentEditable)) return;
```
→ F/D/S/J/K/L tuşları Perkins paneli aktifken nota editörünü tetiklemez.

**Portal taşıma + focus:** Aktif satır değişince portal DOM yeni `.muzik-olcu-braille-blok`'a
taşınır (`appendChild` → textarea blur olur). `[acik, hedefNode, tab]` effect'i rAF ile
textarea'ya yeniden odaklanır. Satır değişimi yalnızca **commit'ten sonra** (tüm tuşlar
bırakılmışken) olduğu için akor ortasında taşıma/blur olmaz.

### 16.5 Decode — KANONIK ters harita + maximal-munch (TÜM kurallar)

**CRITICAL:** Perkins decode artık reader'ın kanonik ters haritasını kullanır → BRF import'unun
çözdüğü HER şeyi çözer (nota/sus/oktav/arıza/özel ölçü çizgisi/slur-tie + **çok hücreli
DİNAMİK/NÜANS/SÜSLEME**). Eski `buildNote/RestCellCandidateMap`+`MUSIC_BRAILLE_SYMBOLS` ve
legacy `muzikBrailleCellsToScore` **kaldırıldı** (dinamikleri kapsamıyor, "bilinmeyen hücre"
üretiyordu; `musicBrailleImportEngine.js` dosyası tamamen silindi).
```js
const REVERSE = musicBrailleReverseMapsOlustur();  // utils/music-brf/musicBrailleReverseMaps.js
// noteByCellKey, restByCellKey, octaveByCellKey, accidentalByCellKey, barlineByCellKey,
// slurTieByCellKey, modifierByCellKey (dinamik+nüans+süsleme, '|' ayraçlı), modifierMaxLen
```

**Maximal-munch tokenizer** (`hucreAlindi` + `zorlaCoz` + `tamponuDegerlendir`):
braille müzik bağlam-duyarlı (çok-hücreli işaretler, oktav/arıza önekleri). Her hücre
tampona eklenir; daha uzun token mümkünse beklenir:
```
hucreAlindi(dots):
  yeni = bekleyenDizi + dash
  uzatıyor mu? (modifierBak/barlineBak: .onek ya da .tam) → tampona al, tamponuDegerlendir
  uzatmıyor → ÖNCE eski tamponu zorlaCoz ile en uzun eşleşmeyle bitir, sonra dash'i taze değerlendir
tamponuDegerlendir():
  onek yok → zorlaCoz (hemen)
  onek var + tam yorum var (forte) → BEKLE_UZATILABILIR (1200ms; çift forte ihtimali)
  onek var + tam yorum YOK (saf önek, ör. söz işareti [3,4,5]) → BEKLE_TAMAMLAYICI (5000ms)
zorlaCoz(): en uzun çok-hücreli ön-ek eşleşmesi (modifier/barline) → uygula; yoksa ilk hücreyi
            tekil çöz (nota/sus/oktav/arıza/nokta → tek-hücreli modifier → bilinmeyen); kalanı sürdür
```
**TRAP — 550ms YANLIŞTI:** Eskiden 550ms timeout vardı; kullanıcı iki hücreyi insan hızında
(arada >550ms) yazınca ilk hücre (söz işareti) timeout'a takılıp "bilinmeyen" oluyordu. Saf
önek için 5000ms beklenir → `forte`=[3,4,5]+[1,2,4] rahatça yazılır. `forte` ⊂ `çift forte`
olduğu için forte sonrası 1200ms beklenip uzatılmazsa forte uygulanır.

### 16.6 Uygula (önek/iliştirme kuralları)

```
oktav     → pendingOktavRef = n                  (sonraki notaya)
arıza     → pendingAccidentalRef                 (sonraki notaya; düzeltme'de imleçteki notaya hemen)
nota      → ekleme: oge=notaEkleKonuma({notaAd,oktav:pendingOktav??son,sureIdx,insertAfterId:caret})
                    caret=oge.id; pendingAccidental→seciliNotayiGuncelle({accidental})
                    pendingMods→perkinsModifierEkle(oge.id,kayit,'oncesi'); pending'leri temizle
            düzeltme: seciliNotayiGuncelle({notaAd,sureIndeksi,oktav?,accidental?})
sus       → ekleme: susEkleKonuma; düzeltme: seciliNotayiGuncelle({sureIndeksi})
nokta [3] → seciliNotayiGuncelle({dotted:true})  (imleçteki nota)
modifier  → 'oncesi' (dinamik/öncesi-nüans/süsleme): pendingMods → sonraki notaya
            'sonrasi' (fermata vb.): perkinsModifierEkle(caret, kayit, 'sonrasi') → son notaya
özel ölçü → manuelOlcuCizgisiEkle (tip duyurulur);  slur/tie → şimdilik yalnız tanı+duyur
```
**Hook fn** `perkinsModifierEkle(notaId, kayit, yon)`: reader'ın `attachModifierToNote`'u ile
aynı `modifiers.oncesi/sonrasi` şeklini yazar → "f" glyph + braille hücresi + lejant çipi.
`caretIdRef.current`: imleç = ekleme/silme/düzeltme hedefi; insert fn'ler yeni `oge`'yi döndürür
→ eager güncellenir, `[seciliOgeId]` effect'i dış seçimle senkronlar.

### 16.7 Sekmeler (segmented kontrol — `.perkins-seg`)

| Sekme | id | İçerik |
|-------|----|--------|
| Notalar (varsayılan) | `perkins-tabbutton-notalar` | Mod toggle + imleç + decode satırı (`.perkins-decode-satir`) + textarea + geçmiş. (Görsel 6-nokta hücre ve tuş ipucu paneli KALDIRILDI — yer kaplıyordu; tuş bilgisi textarea placeholder'ında + sr-only rehberde.) |
| Başlık | `perkins-tabbutton-baslik` | Eser adı, besteci, tempo, zaman imzası form alanları |

**Başlık formu bağlantısı:**
```jsx
onChange={e => setMuzikHeader(prev => ({ ...prev, title: e.target.value }))}
// Zaman imzası: onBlur → setTimeSignature(e.target.value)
```

### 16.8 Props

```jsx
<PerkinsYazimPaneli
  acik={perkinsAcik}                       // sayfa state'i (çift Enter → true)
  onKapat={() => setPerkinsAcik(false)}    // Escape / ✕
  muzikHeader={muzikHeader}
  setMuzikHeader={setMuzikHeader}
  setTimeSignature={setTimeSignature}
  notaEkleKonuma={notaEkleKonuma}
  susEkleKonuma={susEkleKonuma}
  manuelOlcuCizgisiEkle={manuelOlcuCizgisiEkle}  // Space → ölçü çizgisi
  ogeleriSil={ogeleriSil}                        // Backspace/Delete → sil
  seciliNotayiGuncelle={seciliNotayiGuncelle}    // Düzeltme modu
  seciliOgeId={seciliOgeId}
  setSeciliOgeId={setSeciliOgeId}                // ← → imleç gezinme
  sonKullanilanOktav={sonKullanilanOktav}
  sonEklenenOgeId={sonEklenenOgeId}
  svgYerlesimHaritasi={svgYerlesimHaritasi}  // aktif satır + ölçü no için
  muzikSatirSayisi={muzikSatirlar.length}    // satır sayısı değişince portal hedefini tazele
/>
```
Çoğu prop `useMuzikBrfEditor` hook'undan gelir. `acik`/`onKapat` sayfada tanımlı.

**Aktif satır/ölçü tespiti:**
```js
const aktifId = seciliOgeId || sonEklenenOgeId;
// satirIdx → svgYerlesimHaritasi.get(aktifId).satirIdx (yoksa son satır)
// olcuNo   → svgYerlesimHaritasi.get(aktifId).measureIndex + 1
// hedefNode: useLayoutEffect ile document.querySelectorAll(
//   '.muzik-skor-scroll .muzik-olcu-braille-blok')[satirIdx]
```

### 16.9 Erişilebilirlik Notları

- Açılınca: TTS "Braille yazım modu açıldı…" (`acildiRef` ile bir kez), satır `scrollIntoView(center)`, textarea'ya odak.
- Notalar sekmesinde `perkinsRef` (textarea) otomatik odak alır (`[acik, hedefNode, tab]` effect).
- Escape / ✕ → TTS "Braille yazım modu kapatıldı" + `onKapat`. (Focus geri dönüşü editörün kendi handler'ında.)
- Tab tuşu: `handleKeyDown` içinde `if (key === 'tab') return` — geçişe izin verilir.
- Decode sonucu div: `aria-live="off"` — TTS `konus()` zaten bağımsız okur, çift okuma olmaz.
- Kart kökünde `onKeyDown` Escape → kapat (Başlık formundaki inputlardan da çalışsın diye).
- Her işlem (ekle/sil/gezin/düzelt/ölçü çizgisi) `konus(..., {kesintiyle})` ile duyurulur.
- `← →` gezinmede sınırda "ilk öğe"/"son öğe", silmede "{öğe} silindi" duyurulur.
- Panelde **Ekleme/Düzeltme** mod toggle (`.perkins-mod`) + `İmleç: {caretEtiket}` okunuşu.
- `data-perkins-panel="true"` attribute'u dışarıdan seçim için.

**TRAP — imleç okunuşu rAF gecikmesi:** `caretEtiket`, insert sonrası DOM otursun diye
tek rAF ile güncellenir. Çok hızlı ardışık testlerde 1 adım geride görünebilir; insan
hızında doğrudur. `seciliOgeId`'i doğrulamak için skordaki seçili `[data-nav]` öğesine bak.

### 16.10 Çift Enter Algılaması (`MuzikScoreSvg`)

Global Enter handler'da (tek capture-listener, `[]` deps, `kbRef`'ten okur):
```js
const sonEnterZamaniRef = useRef(0);
// Enter bloğunda (düzenleme toggle'ından ÖNCE):
const simdi = Date.now();
if (simdi - sonEnterZamaniRef.current < 450) {     // ÇİFT ENTER
  sonEnterZamaniRef.current = 0;
  if (duzenlemeModuRef.current) { /* ilk Enter'ın açtığı edit modunu geri al */ }
  k.onPerkinsAc?.();                                // Perkins modunu aç
  return;
}
sonEnterZamaniRef.current = simdi;                  // TEK ENTER → normal edit toggle
```
`onPerkinsAc` zinciri: `MuzikBrfYazim` (`setPerkinsAcik(true)`) → `MuzikBrfScoreEditor`
→ `MuzikScoreSvg` (prop) → `kbRef.current.onPerkinsAc`.

**Tradeoff:** İlk Enter edit modunu açar+duyurur; ikinci Enter (< 450ms) onu geri alıp
Perkins'i açar. İkinci `konus(kesintiyle)` ilkini iptal eder. Hızlı edit-aç/kapat double-tap
yerine Perkins açılır (kabul edilen standart double-press tradeoff'u).

---

## 17. MuzikScoreSvg — Otomatik Kaydırma (Auto Scroll)

`sonEklenenOgeId` + `sonEklenenOgeSatirIdx` değişince seçilen satıra scroll eder.

**TRAP:** Satır index karşılaştırması `sonEklenenScrollIdRef` ile tekrar etmeyi önler:
```js
if (sonEklenenScrollIdRef.current === sonEklenenOgeId) return;
```

**ÖNEMLİ:** Bu bloğun içine `console.warn('AUTO SCROLL DEBUG', ...)` bırakılmıştı — **kaldırıldı**. Gelecekte debug log ekleme; playback + Perkins yazımında yüzlerce warn üretir.

---

## 18. Sık Yapılan Hatalar

| Yanlış | Doğru |
|--------|-------|
| `[data-oge-id]` ile navigation query | `[data-nav]` kullan |
| `h:'sol'` alfabetik düzende | `g:'sol'` (uluslararası standart) |
| Yeni sesAcik toggle ekle | `ayarlariAl().sesAcik` kullan; Ayarlar'da zaten var |
| `|` tuşunu tek kısayol yap | `l` birincil, `|` alternatif (Türkçe klavyede zor) |
| Boş ölçü silmeden sonra kalmış | `bosOlculeriTemizle` çağrıldığından emin ol |
| Global Enter popup içinde tetiklendi | `.muzik-*-grup` class'ını istisna listesine ekle |
| Braille focus sonrası çift TTS okuma | `sonProgramatikOdakRef.current` ile focusin'i atla |
| Dinamik stacking (p + pp aynı notada) | `dinamikNotayaUygula` replace eder, stack etmez |
| `asdfghj` TTS tek kelime okur | `a-s-d-f-g-h-j` (tire ile) |
| Kısayol `Ctrl` → TTS "Ctrl" der | `tusAriaMetni()` → "Kontrol" |
| `Shift` → TTS "Shift" der | `tusAriaMetni()` → "Şift" |
| Perkins panel F/D/S/J/K/L nota editörünü de tetikliyor | `<textarea>` kullan — `MuzikScoreSvg` textarea'yı atlar (satır ~755) |
| Perkins commit `pressedRef` boş olmadan ateşleniyor | `pressedRef.size === 0 && pendingRef.size > 0` kontrolünü atlatma |
| Perkins `konus()` decode metnini `aria-live` ile de duyuruyor | `aria-live="off"` bırak; `konus()` zaten `_srBolge`'ye yazar, çift okuma olur |
| `AUTO SCROLL DEBUG` console.warn `MuzikScoreSvg`'de | Kaldırıldı — geri ekleme; Perkins yazımında 490+ uyarı üretir |
| Perkins'i butonla aç | Çift Enter ile aç (`onPerkinsAc`); tek Enter = düzenleme modu. Buton yok |
| Perkins paneli sayfa altında sabit | Aktif satır `.muzik-olcu-braille-blok` içine `createPortal` — ölçüyü takip eder |
| Perkins `acik` state'i panel içinde | Sayfada (`MuzikBrfYazim`) tut; kapalıyken `return null` ama mount kalır (state+focus korunur) |
| Çift Enter algılamada debounce ile tek Enter'ı geciktir | Tek Enter HEMEN toggle; ikinci Enter `<450ms` Perkins açar + ilk toggle'ı geri al |
| Perkins Backspace yalnız `gecmis`'ten siler | `ogeleriSil(caretIdRef.current)` ile SKORDAN sil; imleci komşuya taşı |
| Perkins'te insert noktası ayrı `insertAfterRef` | İmleç = `caretIdRef` = `seciliOgeId`; insert fonksiyonları yeni id döndürür → eager güncelle |
| Düzeltme modunda akor yeni nota ekliyor | `modRef.current==='duzeltme'` → `seciliNotayiGuncelle`, ekleme yapma |
| Space textarea'ya boşluk yazıyor / sayfa kaydırıyor | `handleKeyDown`'da `key===' '` → `preventDefault` + ölçü çizgisi |
| Perkins decode tek-hücre haritalarıyla → dinamik/nüans "bilinmeyen hücre" | `musicBrailleReverseMapsOlustur()` (reader ters haritası) + maximal-munch; çok-hücreli kapsanır |
| İki-hücreli işaret (forte) için kısa timeout (550ms) | Saf önek 5000ms (`BEKLE_TAMAMLAYICI`), tam-ama-uzayabilir 1200ms (`BEKLE_UZATILABILIR`) — insan hızında yazılabilsin |
| `forte` = [3,4,5]+[1,2,4] commit'i çift-forte önekinden bozuluyor | `zorlaCoz` en uzun ön-ek eşleşmesini bulur; yeni hücre uzatmazsa önce eski tamponu bitir |
| Dinamik/nüans modifier'ı el ile `note.modifiers`'a yaz | `perkinsModifierEkle(notaId, kayit, yon)` (reader'ın `attachModifierToNote` şekli) |
| `muzikBrailleCellsToScore` ile cells→skor | ÖLÜ (`NOTE_CELL_TO_NAME` boş); dosya silindi. Metin için `brfMuzikOku`, hücre için `REVERSE` |
| Süre adı "yarım"/"tam" | YENİ konvansiyon "ikilik"/"birlik". `SURE_GOSTERGELERI.ad` + `SUS_SURE_ADLARI` (editör) + `SURE_ADLARI` (BrailleDetayPanel) hepsi ikilik/birlik |
| `MusicNoteGlyph` içi-boş/sap `/yarım\|tam/` regex'i | `SURE_GOSTERGELERI.ad` ikilik/birlik olunca kırılır → `realValue` (1=birlik, 2=ikilik) birincil; ad yedek |
| Modül 10 hücreleri ayrı sabit | Notalar `muzikNotaNoktalari` (muzik.js `noktalar`+`noktalarEk`), oktav `musicConstants.MUZIK_OKTAV_HUCRELERI`, gerisi `REVERSE` → muzik.js braille düzeltmeleri OTOMATİK yansır |
| `REVERSE` etiketleri muzik.js'ten farklı (natürel/tekrar/bağ) | Hizalandı: 'naturel', 'ileriye/geriye doğru tekrar', 'bölüm sonu çift çubuk', 'hece/uzatma bağı' |
| Keskin kreşendo/dekreşendo italik metin olarak çiziliyor | `dinamikHairpinGlyph(ad)` → Bravura hairpin İKONU (U+E53E `<` / U+E53F `>`); sözcük temelli cr/decr/dim/rit metin kalır (baskı standardı). Sıra: `dinamikSmuflGlyph(sembol) \|\| dinamikHairpinGlyph(ad) \|\| dinamikEtiketAl` |
| 'keskin dekreşendo' adı 'kreşendo' regex'ine takılıyor | `dinamikHairpinGlyph` önce dekreşendo kontrol eder (ad alt-dize içerir) |
| Glyph haritaları / playback regex'leri ESKİ adlarla (staccato/tenuto/trill/turn/mordent/appoggiatura/caesura/swell) | muzik.js Türkçeleştirildi → `NUANS_AD_ALIAS`+`SUSLEME_AD_ALIAS` (musicConstants) ve playback regex'leri her İKİ adı da eşler (stakato/tonuto/aksent/tril/grupeto/mordan/apejetür/sezür/şişirme) |
| Ad eşleştirmede `toLowerCase()` — 'İfadeli' → 'i̇' (combining dot) | `trKucult` = `toLocaleLowerCase('tr')` kullan ('İ'→'i') |
| preview_eval'de `import('/src/...')` bayat modül döndürüyor | HMR sonrası test ederken cache-buster ekle: `import('/src/...js?t='+Date.now())` |
| Nüans glyph'ine tıklayınca popup "Noktalı uzatma" açılıyor | `modifierEditMenu` switch'lerine `type === 'nuans'` dalı eklendi: başlık `Nüans: {ad}`, aria `Nüans`, Sil `seciliNotaModifierSil`, Değiştir ızgarası (yon'a göre `MUZIK_NUANS_ONCE`/`SONRA`) |
| Nota-sonrası nüansta (fermata) yon hep 'oncesi' | `modifierAc(m,e,type,yon)` + `modifierEl(..., yon)`; sonrasiMods çağrısı `'sonrasi'` geçer — Sil/Değiştir doğru tarafı hedefler |
| Braille hücre altı etiketi metin ("forte", "keski…"; nüans/süslemede hiç yok) | `BrailleHucreMini` ikon hesaplar: dinamik → `dinamikSmuflGlyph(sembol)`/`dinamikHairpinGlyph`; nüans/süsleme → `nuansSmuflGlyph \|\| suslemeSmuflGlyph` — Bravura Text ile render; glyph'siz (cresc. vb.) metne düşer |
| Çok hücreli nüans/süsleme (fermata 2, sezür 2 hücre) ikonu her hücrede tekrar | Overlay `dinamikEtiketGizle` genişletildi: önceki hücre aynı kategori+etiket (+modId uyumu) ise devam hücresi → ikon yalnız ilkte |
| Glisando ikonu için U+E585 kullan | YANLIŞ — U+E585 barok süsleme PARÇA vuruşudur (iki ayrı çizgi görünür). SMuFL'de tekil glissando glyph'i YOK; `SUSLEME_SMUFL_GLYPH.glisando = '/'` (düz eğik çizgi, baskı standardı). NOT: 'uzun alt mordan' alt mordan ile aynı E56D — SMuFL'de ayrı glyph yok |
| Tuplet sayısı düz italik ASCII rakam | SMuFL Bravura tuplet glyph'i `TUPLET_RAKAM_GLYPH` (U+E880+rakam, ör. 3→U+E883); aria-label `${num}leme` → Türkçe ad (`tuplet.kayit.ad` ya da `TUPLET_TURKCE_AD[played]`) |
| Tuplet braille hücresine hover → bracket vurgulanmıyor (çapraz bağ kopuk) | Engine meta'sına `tupletId` (musicBrfEngine) + `nord`'a kopyala (useBrailleOutput — yoksa düşer!) + overlay `setHoverTupletId(anlam.tupletId)`; bracket `hoverTupletId` ile zaten reaktif (çift yön) |
| Tuplet braille hover kutusu kesik çizgili | `BrailleHucreMini` `solidHover` prop'u: tuplet aktifken kesik yerine solid standart seçim kutusu (overlay `solidHover={tupletMu}` geçer) |
| Engine meta'sına alan ekleyince overlay'de görünmüyor | `useBrailleOutput` `nord` nesnesi meta'dan SADECE belirli alanları (ogeId/hoverId/bagId/olcuIdx/tupletId) kopyalar — yeni alanları oraya da ekle |
| Aynı süsleme/nüans bir notaya iki kez ekleniyor (tril ×2) | `modifierUygula` (uyarı mesajıyla) + `perkinsModifierEkle` (sessiz) tekrar koruması. İSTİSNA: apejetür/grace — çoklu grace (çift apejetür/slide) müzikal olarak geçerli, serbest |
| Çoklu apejetür yalnız İLKİ çalınıyor | `ornamentEventleriGenislet`: ≥2 grace mod → zincir (kısa %12, uzun %30/grace; toplam ≤%60, aşarsa orantılı kısalt) + kalan ana nota |

---

## 19. ayarlar.js Eklentileri

```js
// VARSAYILAN içinde:
notaTusDuzeni: 'alfabetik',   // 'alfabetik' | 'piyano'
sesAcik: false,               // Global TTS açma/kapama
```

---

## 20. Test Notları

- **Dev server:** `npm run dev` → `localhost:5188`
- **Sayfa URL'i:** `http://localhost:5188/#/muzik-brf-yazim`
- `sesAcik` değişikliği ayarlardan yapılır; bazen sayfayı yenilemek gerekir
- Navigation test: `[data-nav]` elementleri doğrudan `document.querySelectorAll('[data-nav]')` ile sayılabilir
- Barline aria-label: `document.querySelector('[data-nav="barline"]')?.getAttribute('aria-label')`
- **preview_eval + HMR tuzağı:** modül import'u bayatlar → cache-buster: `import('/src/...js?t='+Date.now())`. React `onMouseEnter` native `mouseenter` ile tetiklenmez; **`mouseover`** dispatch et (bubbles). Hover state'i kalıcı görmek için `mouseout` gönderme, sonra screenshot al.
- **React prop'unu DOM'dan oku:** `el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))]` → `.child` zincirinde `memoizedProps` gez (anlam/tupletId vb. doğrulamak için).

---

## 21. Müzikal İkon/Glyph Sistemi (Bravura SMuFL + fallback)

Skor (dizek üstü), braille overlay (hücre altı) ve düzenleme popup'ları AYNI glyph dilini kullanır.
Tümü `musicConstants.js`'te (`utils/music-brf/`):

| Tür | Fonksiyon | Glyph kaynağı |
|-----|-----------|---------------|
| Harf dinamiği (p/m/f/r/s/z/n) | `dinamikSmuflGlyph(sembol)` | `DINAMIK_SMUFL_HARF` (SMuFL E520+) |
| Keskin kreşendo/dekreşendo | `dinamikHairpinGlyph(ad)` | hairpin U+E53E `<` / U+E53F `>` |
| Nüans/artikülasyon | `nuansSmuflGlyph(ad)` | `NUANS_SMUFL_GLYPH` (artic E4A0+, fermata E4C0+, breath E4CE…) |
| Süsleme/ornament | `suslemeSmuflGlyph(ad)` | `SUSLEME_SMUFL_GLYPH` (E560+ trill/turn/mordent/grace) |
| Tuplet rakamı | `TUPLET_RAKAM_GLYPH(n)` (MuzikScoreSvg) | SMuFL tuplet E880+rakam |

**KRİTİK — Türkçeleştirme alias'ı:** muzik.js'te adlar Türkçeleştirildiği için glyph haritaları
ESKİ İngilizce/yazım anahtarlarıyla kuruluydu → çoğu ikon sessizce kayboldu. Çözüm: `NUANS_AD_ALIAS`
+ `SUSLEME_AD_ALIAS` (yeni Türkçe ad → eski glyph anahtarı). `trKucult = toLocaleLowerCase('tr')`
(düz `toLowerCase()` 'İ'→'i̇' combining-dot üretir, eşleşmeyi bozar).

**Fallback zinciri:** glyph yoksa (cresc./dim./rit./glisando gibi sözcük/çizgi temelli) **metin**e düşer —
baskı standardı (glisando = düz `'/'`, cresc. = italik metin). `fontFamily: 'Bravura Text', 'Bravura', 'Cambria Math', 'Noto Music', serif`.

**TUZAK — yanlış kod noktası:** PUA codepoint'i tahmin etme; render edip kontrol et. U+E585'i glissando
sandım → barok süsleme PARÇA vuruşu (iki ayrı çizgi). Şüphede `node -e` ile codepoint'i yazdır.

## 22. Ses Efektleri / Playback Gerçekçiliği (`musicPlaybackHelpers.js`)

`muzikPlaybackEventListesiOlustur` zaten çok gelişmiş; modifier adlarının Türkçe+İngilizce eşlenmesi şart:
- **Dinamik velocity:** `dinamikGainHesapla` kare-yasası eğrisi (algısal doğru kademeler); cresc/decresc gradyanı, sf, aksan attack-boost.
- **Artikülasyon** (`notaArticulationBilgisiAl`/`articulationUygula`): stakato `_articulationCutOff` (%12–55), tonuto 1.05×, aksent 1.30×, martellato 1.45×, şişirme 1.15×, fermata ritim ×1.75, sezür/nefes `gap` event. Regex'ler HEM Türkçe (stakato/tonuto/aksent/şişirme/sezür) HEM eski (staccato/tenuto/accent/swell/caesura) eşler.
- **Süsleme genişletme** (`ornamentEventleriGenislet`): tril 8 çift, grupeto/turn 4 nota, mordan 3, apejetür grace+ana. Regex Türkçe (apejetür/tril/mordan/grupeto/glisando) + eski.
- **ÇOKLU apejetür** (grace zinciri): ≥2 grace → her kısa %12 / uzun %30, toplam ≤%60, kalan ana nota.
- **Önizleme süreleri** (`usePianoNotePreview` `sureMsAl`): sabit ~100 BPM; oranlar 2'şer kat (8li=300…64lük=38). Tam playback BPM'e göre `playbackEventDurationMsAl`.

## 23. Tuplet (Düzensiz Gruplar) Sistemi

- **Veri:** `MUZIK_DUZENSIZ_GRUPLAR` (muzik.js): üçleme(2 yazım, ilki tek-hücreli `[2-3]`), ikileme, dörtleme, beşleme, altılama, yedileme.
- **Oran** (`tupletOranTahmin`, hook): üçleme 3:2, ikileme 2:3, dörtleme 4:6, beşleme 5:4, altılama 6:4, yedileme 7:4. Regex Türkçe+İngilizce. `uclemeUygulaSecim` İLK (tek-hücreli) üçlemeyi seçer.
- **Playback çarpanı:** `inTimeOf/played` (üçleme → ×2/3; 3 nota 2 vuruşta). `tupletCarpanHaritasi`.
- **Render** (MuzikScoreSvg ~2440): SVG bracket (sol/sağ kanca+kol) + ortada `TUPLET_RAKAM_GLYPH` (Bravura E880+). aria-label `tuplet.kayit.ad` (Türkçe). Tıkla/Enter/Delete → `tupletSil`.
- **Braille:** `musicBrfEngine` ilk nota öncesi `tuplet.kayit.hucreler`; meta `{ ogeId, kaynak:'tuplet', tupletId, etiket }`.

## 24. Braille Hücre-altı İkonları + Çapraz Vurgu

- **Hücre-altı ikon** (`BrailleHucreMini`): dinamik/nüans/süsleme/**tuplet** hücrelerinde metin etiket yerine Bravura glyph (§21 fonksiyonları). Tuplet hücresi → `tupletRakamGlyph(tupletSayiAdtan(etiket))` (ör. "üçleme…" → U+E883 "3"). Çok-hücreli işarette (fermata 2, sezür 2, dinamik söz işareti+harf) ikon YALNIZ ilk hücrede — overlay `dinamikEtiketGizle` (önceki hücre aynı kategori+etiket+modId ise devam).
  - **TUZAK:** `kisaEtiketi` (brailleKisaCellLabelAl) yalnız oktav/arıza/nokta/dinamik için etiket üretir; tuplet/nüans/süsleme için BOŞ döner → bu kategoriler için ikon `BrailleHucreMini`'de ayrıca hesaplanır.
- **Çapraz vurgu (tuplet ↔ bracket):** tuplet braille hücresi `anlam.tupletId` taşır → overlay `setHoverTupletId(anlam.tupletId)`; bracket `hoverTupletId === tuplet.id` ile reaktif (çift yön). `BrailleHucreMini` `solidHover` prop'u tuplet aktifini kesik yerine **solid** seçim kutusu yapar.
- **TUZAK — meta alanı düşmesi:** `useBrailleOutput` `nord` nesnesi engine meta'sından SADECE `ogeId/hoverId/bagId/olcuIdx/tupletId` kopyalar. Engine meta'sına yeni alan eklersen `nord`'a da ekle, yoksa overlay'e ulaşmaz.

## 25. BRF İndir/Yükle Tek-Merkez Kontrol + Standart Doğrulama

**Otorite (kurallar):** `C:\Users\HP\Downloads\Braille-Music-Notation-Introductory-Training-Program-First-Edition-Revision-2.pdf` (NextSense/UEB, Rev 2). **Appendix 1 "Summary of Signs" (s.121–131)** tüm işaretlerin kanonik nokta kalıbı. Yeni/değişen müzik hücresi bu PDF'e uymalı ("referansımız her zaman kurallar olmalı").

**İki ayrı motor — sapma riski:** "BRF İndir" = `scoreToCanonicalBrf` (canonical pipeline) · "BRF Yükle" = `brfMuzikOku` (reader). İkisi de `data/muzik.js`'ten türer.

**Round-trip kılavuz testi:** `npm run qa:brf-roundtrip` (`scripts/music-brf-roundtrip-qa.mjs`). Factory ile zengin skor → export → import → tüm öğeleri (nota/süre/oktav/arıza/dinamik/nüans/süsleme/bağ/tuplet/ölçü/nefes/sezür) geri tanır mı doğrular. **muzik.js'i her değiştirdiğinde çalıştır.**
- **KRİTİK:** Bu test export↔import tutarlılığını test eder, **standarda uygunluğu DEĞİL** (ikisi de muzik.js'ten türer). Standart için yalnızca PDF doğrular.

**Reader collision fix (`brfMusicReaderRules.js`):** tril `[2-3-5]`(=alt-rakam 6) ve turn `[2-5-6]`(=alt-rakam 4) ölçü başında "ölçü numarası" sanılıyordu. `CAKISAN_TEK_SUSLEME` (muzik.js'ten türetilen çakışan tek-hücre süsleme kümesi) + `notaGrubuBaslangici(tokens, j)` → ardından nota grubu (oktav/arıza/nota) gelen çakışan hücre bar-number sayılmaz, süsleme eşleştiricisine düşer.

**Okunur özet modifier'ları (`brfMusicReadableSummary.js`):** `readableItem` artık `modifierliMetin(item, govde)` ile öncesi modifier'ları gövdenin önüne, sonrası modifier'ları sonuna ekler (ör. "forte 4. oktav do diyez dörtlük", "… sol bemol dörtlük fermata (durak)"). Eskiden modifier'lar özette görünmüyordu = görünür "brf okumada sorun".

**2026-06-13 standart doğrulaması:** muzik.js'in tamamı PDF'e karşı kontrol edildi; TEK hata **nefes işareti** idi: `['3-4']` → `['3-4-5','2']` (PDF s.128 breath = virgül, dots 3-4-5 + dot 2). `['3-4']` aslında break/caesura'nın 2. hücresiydi; sezür `['6','3-4']` zaten doğruydu. Diğer her şey (oktav/arıza/dinamik/nüans/fermata/süsleme/düzensiz grup/bağ/volta) PDF ile birebir.

**OKUMA DOĞRULUĞU testi (`npm run qa:brf-reading`, `scripts/music-brf-reading-qa.mjs`):** "0 bilinmeyen hücre" (`qa:brf-pdf-fixtures`) ≠ "doğru okundu". Bu test fixture token'larından INTENDED perde+oktav+süre dizisini import DECODE'uyla karşılaştırır → yanlış decode'u yakalar. 30/39 → **39/39 TAM DOĞRU (0 perde/süre hatası)**. 10 gerçek okuma bug'ı düzeltildi (hepsi `brfMusicReaderRules.js`, **canlı `readMusicBrailleGroup`** — `readMusicBrailleCell`@1841 sadece boşlukla çağrılır, gövdesi ölü kod):
1. **Cümle bağı oktav bozması**: `⠰⠃`/`⠘⠆` (MUZIK_BAGLAR'da, reverse map'te YOK) → ilk hücre ⠰/⠘ oktav sanılıp sonraki nota oktavını bozuyordu. Tek-hücre oktav çözümünden ÖNCE 2-hücreli braket-bağ tanıma eklendi.
2. **1.oktav ⠈[4] ↔ tie ⠈⠉ çakışması**: rawKey '4' yalnızca SONRAKİ hücre '14' ise tie; değilse 1.oktav işareti.
3. **Eser-içi donanım değişimi (yalın ⠣⠣⠣) accidental sızıntısı**: grubun TAMAMI donanımsa (`keySignatureOnEkiCozumle` tüm grubu tüketir) `keySignatureChange` item; bemol sonraki notaya sızmaz.
4. **Çok-sözcüklü ifade ⠜…⠜ (a tempo) nota kirliliği**: grup yalnız söz-işareti+harf içeriyorsa (nota yok) ve bilinen dinamik/nüans değilse (`matchModifierSequence`) → ifade, `context.ifadeIcinde` ile çok-gruba yayılır.
5. **Bağlamsız çift-anlamlı süre**: `selectCandidate` no-measure fallback'i dot3+6 → birlik(1) (eskiden 16'lık; diğer çiftlerle tutarsızdı). Bağlamsızda daima BÜYÜK değer.
6. **Sekstüplet lider notası**: `candidateScore` `aktifTuplet.kalan>1` ise +120 "tam doldurma" bonusu bastırılır (4/4'te 6-notalı tuplet'in ilk 16'lığı birlik sanılmasın).
7. **Tek-sözcüklü ifade "dolce" ↔ hairpin çakışması**: decrescHair=`⠜⠙`, "dolce"=`⠜⠙⠕⠇⠉⠑` aynı 2 hücreyle başlar; AYRICA nota hücreleri harf hücresidir (⠑=hem 'e' hem RE). modMatch'ten ÖNCE: ⠜'den sonra MÜZIK-ANLAMI-OLMAYAN saf-metin harfi (⠕/⠇/⠞ — nota/oktav/aksidental/slur DEĞİL) varsa ve bilinen dinamik tüm diziyi kapsamıyorsa → ifade, atla. Hairpin ⠜⠉ notaya (⠑) bağlanır → saf-metin yok → korunur.
8. **Tuplet süre-sıkıştırması (measureProgress)**: tuplet TAMAMLANINCA footprint = liderNotaSüresi × inTimeOf (sekstüplet 16'lık→1×4=4) ile face-value toplamı (1+5×2=11) düzeltilir → tuplet'TEN SONRAKİ çift-anlamlı notalar (Triplet/Weber son notası) doğru çözülür. `tupletInTimeOf` editör `tupletOranTahmin` ile birebir.
9. **Çarpma (apejetür/grace note) ölçü süresi**: bekleyen modifier'da apejetür varsa nota grace'tir → measureProgress'e SIFIR katkı (yazılı süresiyle gösterilir). Gigue 6/8'de uzun-apejetür notaları sayılmayınca dörtlük doğru (64'lük değil). Mordan/tril/grupeto grace DEĞİL (tam süre).
10. **Nota gruplama (Lesson 4) measureProgress**: 16'lık+ grup lideri ardından gelen 8'lik-hücreler ölçü süresinde LİDER değerinde sayılır (`context.grupDeger16`; sureIndeksi 8'lik kalır — kart yüzü). Grup, 8'lik-olmayan nota/sus/barline'da biter. Ölçü SONUNDAKİ çift-anlamlı nota (lookahead=0) doğru çözülür. AYRICA lookahead `remainingMinDuration16` → bir aday sonraki notalara yer bırakmıyorsa "tam doldurma" bastırılır (4/4 başında 16'lık-grup öncesi birlik-sus, birlik sanılmasın).

⚠ Çift-anlamlı SUS (birlik-sus hücresi = 16'lık-sus hücresi): fixture'da `R('s',{ri:4})` ile gerçek (bağlamsal) süre belirtilir; reader ölçüden çözer (Carmen 3/8 / Gruplama2 → 16'lık-sus). `ri` test override'ı, ürün davranışı değil.

**BAĞ (slur/tie) braille'i overlay'de GÖRÜNMÜYORDU (kullanıcı: "bağların brailleri skor altlarında neden yazmıyor"):** Skor altı overlay, çizilen HER şeyin braille'ini göstermeli (başlık hariç). 3 bug bulundu+düzeltildi:
1. **Engine bağ hücresini HİÇ üretmiyordu** (`musicBrfEngine.js` `bagHucrePaketleriAl`): `bagKayitBul` regex'leri ("slur (legato)"/"köşeli slur"/"çift slur") GERÇEK veri adlarına (MUZIK_BAGLAR: "hece bağı"/"cümle bağı başlangıcı/bitişi"/"çift hece bağı") UYMUYORDU → `startHucreleri:null` → çağıran döngü guard'ı (`hucrelerBag.length===0 → continue`) bağı ATLIYORDU. Fix: regex'ler gerçek adlara + standart hücreler hardcoded fallback (single `[[1,4]]`, tie `[[4],[1,4]]`, bracket `[[5,6],[1,2]]`/`[[4,5],[2,3]]`, double `[[1,4],[1,4]]`). Bağ hücresi ogeId=notaId taşır → overlay ölçüye eşler.
2. **Köşeli (bracket) slur modu slur dalında ele alınmıyordu**: `slurModeOtomatikAl` yalnız single/double-for-long döner → bracket'i yanlışlıkla double yapıyordu. Fix: slur dalında `bagModeAl==='bracket'` ayrı (açılış ⠰⠃ ilk notadan önce, kapanış ⠘⠆ son notadan sonra).
3. **İMPORT tüm slur'leri TEK deve-slur'e katlıyordu** (`brfMusicReaderRules.js` `finalizeSlurMarkers`): "bütün markerları tek uzun slur kabul ediyoruz" → 16 ayrı slur içeren parça braille'de 3 hücre (⠉⠉…⠉) görünüyordu. Fix: marker ZİNCİRLEME — ardışık nota markerları (afterNoteGlobalIndex art arda/aynı) tek slur, boşlukta yeni slur. 16⠉ → 7 ayrı slur (15 hücre). Tarayıcıda doğrulandı.

**REPEAT (tekrar) — kullanıcı "hiç çalışmıyor" + "doğru çalıştığına emin misin":** Playback expand DOĞRU — 6 senaryo test edildi: `|:AB:|C`→ABABC, begin'siz `AB:|C`→ABABC, `|:A:|`→AAB, volta `|:A[1.B][2.C]`→ABAC, iki ayrı blok→AABBC, tekrarsız→ABC. Hepsi geçti. Braille `⠣⠆`/`⠣⠶`, draw `:|`, volta hepsi görünür. Bulunan bug: editör-CREATE endRepeat YANLIŞ hücre (`useMuzikBrfEditor.jsx:~1704` `[[1,2,6],[2,3,5,6]]` = begin ⠣⠶ idi → `[[1,2,6],[2,3]]` = end ⠣⠆). İmport yolu (line ~2484) zaten doğruydu. + `musicBrfEngine.js` `barlineVarsayilanHucreleri(kaynak)` savunma fallback'i (hucreler'siz barline boş hücre yerine standart işaret yazar).

**DOUBLED tuplet (⠆⠆) — Weber ilk ölçü BOŞ'tu (kullanıcı: "weber … ilk ölçü neden boş"):** Weber bars 1-3 *doubled triplet* (`T2=⠆⠆`) kullanır: aynı tek-hücre tuplet işareti iki kez → bir PASAJ boyunca her grup o tuplet'tir; pasaj tek `⠆` (son grup) ile biter (PDF Lesson 8). Reader bunu bilmiyordu → ilk `⠆`[2,3] alt-rakam-2/BARLINE sanılıp SAHTE boş ölçü 0 oluşuyordu (8 ölçü, ilki boş). Fix (`brfMusicReaderRules.js`): `⠆⠆` (k0===k1, TUPLET_SIGN_MAP+lower-digit) → `context.doublingTuplet` modu; `readNoteCell` aktifTuplet yoksa her grup için otomatik `yeniTupletNesnesi` armalar; doubling sürerken tek `⠆`+nota → pasajı bitirir + son tuplet'i armar. Sonuç: 7 ölçü (boş ölçü gitti), bars 1-3 = 12 üçleme, 57/69 nota tuplet-üyesi. `yeniTupletNesnesi` ortak helper (tek/çok-hücre + doubling auto-arm).

**ÖLÇÜ-SÜRE UYARILARI (kullanıcı: Weber 20/8 vb. → "düzelt"):** `brfMusicReader.js` her ölçüyü `total16` (= Σ duration16 face-value) ile `expected`'a karşı kontrol eder; ≠ ise "ölçü süresi N/M, çözüm kesin değil" uyarısı. 45/48 parçada tetikleniyordu — çoğu YANLIŞ pozitif. 4 kök neden + fix:
1. **Tuplet face-value** (en kötü, Weber 20/8): tuplet notaları sıkıştırılmadan toplanıyordu. Fix: her nota/sus'a `measureDur16` (efektif katkı: grace=0, gruplama lider-değeri, tuplet × `inTimeOf/count`); `buildMeasures` `olcuKatkisi16(item)` ile bunu toplar (yoksa duration16). Weber bars 1-3: 20/8 → 8/8.
2. **Tuplet sonrası grup taşması** (Weber bar6 üçleme-sonrası quaver yanlış gruplanıyordu): tuplet TAMAMLANINCA `context.grupDeger16=null` (tuplet = beam-grup sınırı).
3. **Satır kırılması ölçü birleştirme** (Little Brown Jug 32/16): `handleLineEnd` açık ölçüyü kapatmıyordu → sonraki satırın notaları aynı ölçüye katlanıyordu. Fix: satır notayla/sus'la bitmişse `separatorBarlineOlustur` ile BARLINE öğesi ekle (buildMeasures barline-item'la böler; sadece measureNo ilerletmek yetmez). Müzikte ölçü satır sonunu aşmaz.
4. **Anakruz/transient false-positive**: ilk (pickup) + son (tamamlanmamış) KISA ölçü normaldir → uyarma (`idx===0||son && total<expected` atla). Tuplet AKTİFKEN `measure-overflow` (transient face-value taşma) verme (`!context.aktifTuplet`).
Sonuç: 45 → 20 uyarı (sadece GENUINE orta-ölçü uyumsuzlukları kalır — Ankara Marşı 6/8 vb. = bundled-data sorunu; Weber 9/8 ×2 = ⚠ fixture anomalisi). reading-qa 39/39 korundu.

**NOTA GRUPLAMA ÇİZİMİ — devam notaları 8'lik çiziliyordu (kullanıcı: "gruplamaları doğru çizmiyor", PDF Example 2):** Braille gruplama yazımında 16'lık grup İLK nota gerçek değeriyle, kalanı 8'LİK-HÜCRE yazılır ama MÜZİKAL değerleri 16'lıktır. Reader devamları 8'lik (sureIndeksi 0) okuyordu (reading-qa = braille yüzü) → editör skor modelinde 8'lik → ÇİZİM tek-kiriş 8'lik (çift-kiriş 16'lık değil), playback 8'lik. Fix (3 parça): (1) `brfMusicReaderRules.js` reader devam notasına `grupSureIndeksi` (liderin gerçek süre indeksi) ETİKETLER — `sureIndeksi` 8'lik KALIR (reading-qa bozulmaz); (2) `useMuzikBrfEditor.jsx` `brfReaderSureIndeksiAl` `grupSureIndeksi ?? sureIndeksi` kullanır → skor ogesi 16'lık → çizim çift-kiriş + playback 16'lık + export doğru; (3) `brfMetniYukle` import'ta `grupSureIndeksi`-etiketli nota varsa `header.useBrailleGrouping=true` → indir/overlay AYNI grup formunu üretir (16'lık model + grouping=tam-hücre yerine pitch-only devam). Yoksa skor 16'lık olduğundan tam-hücre yazılıp round-trip kırılırdı. Round-trip 37→37 özdeş. ⚠ Mimari: gruplama bir DISPLAY tercihidir (`useBrailleGrouping`), NOTA MODELİ daima müzikal değer (16'lık); reader yüzü (8'lik) ≠ skor modeli (16'lık) — `grupSureIndeksi` köprüsü.

**GRUPLAMA VURUŞ-FARKINDA (DEĞİŞKEN) olmalı (kullanıcı: "her ölçü için gruplama kurallarını araştır, sabit mi değişken mi"):** Gruplama SABİT DEĞİL — zaman imzasının VURUŞ (beat) yapısına bağlı; gruplama yalnız BİR VURUŞ içinde geçerlidir (her vuruş yeni lider/grup başlatır). İlk reconstruction heuristic'i ("8'lik-hücreler 16'lık-olmayana kadar devam") vuruş sınırını DİKKATE ALMIYORDU → bir vuruşun 16'lık grubu sonraki vuruşun GERÇEK 8'liklerine taşıp onları da 16'lık sanıyordu (Gruplama Örnek 2 ölçü3: beat3 `mi/si` 8'likleri yanlışlıkla 16'lık olmuştu → çift-kiriş çiziliyordu). **Vuruş deseni `musicVisualBeamHelpers.js` `gorselZamanImzasiVurusDeseniAl`'da (görsel beam zaten beat-farkında):** 4/4→[4,4,4,4], 2/2(cut)→[8,8], 6/8→[6,6], 3/8→[6], 9/8→[6,6,6], 5/8→[4,6], 7/8→[4,4,6], denom-16 vb. (16'lık-bazlı vuruş uzunlukları). **Fix:** reader `readNoteCell` gruplama mantığı `gorselVurusIndexAl(context.measureProgress16, context.header.timeSignature)` ile notanın vuruşunu bulur; `context.grupVurusIndex` ile karşılaştırır — vuruş DEĞİŞTİYSE grubu bitirir (lider yeniden başlar). measureProgress16 = bu notadan önceki konum. Sonuç: ölçü3 `do8 sol8 | la16 si16 do16 re16 | mi8 si8 | do4` doğru (karışık vuruş: 8'lik tek-kiriş, 16'lık çift-kiriş). reading-qa 39/39, 13 QA yeşil, tarayıcıda doğrulandı.

**NOTA SÜRESİ İMZADAN BAĞIMSIZ olmalı — gruplama geri-kurma süreyi BOZMAMALI (kullanıcı: "imza değiştiğinde nota süreleri korunmalı, garantiye al"):** İlk vuruş-farkında geri-kurma 6/8 gibi BİLEŞİK ölçülerde HATALI: bir vuruşta 16'lıklardan SONRA gerçek 8'likler gelince export gruplamayı İPTAL eder (16'lıklar TAM-hücre yazılır), ama geri-kurma "16'lık→8'lik-hücre" görüp 8'likleri 16'lık sanıyordu (round-trip'te 8'lik→16'lık). Düzeltme — bir 16'lık GRUP LİDERİ olma koşulu: **(a)** sonraki hücre 8'lik-NOTA hücresi (taban, dot 3&6 yok) — `groupState.sonrakiSekizlikNota` ana döngüde hesaplanır; **(b)** AYNI VURUŞTA önceki YAZILAN nota 16'lık-DEĞİL (`context.oncekiNotaYazilanRv<16`). Ardışık TAM 16'lık-hücreler = gruplanmamış bireysel 16'lık (lider değil). Vuruş değişince `oncekiNotaYazilanRv`+grup sıfırlanır (gruplama vuruş-içi). Lider hücreleri/sus/barline bu durumu sıfırlar. **GARANTİ testi `npm run qa:brf-timesig-preserve`** (`music-brf-timesig-preserve-qa.mjs`): her imza (4/4,2/4,3/4,6/8,9/8,3/8,cut) için DOLU ölçü kurup gruplama-açık export+import eder, sürelerin korunduğunu doğrular. **Editör-içi koruma YAPISAL:** `setTimeSignature` yalnız header'ı günceller (muzikOgeleri sürelerine dokunmaz), imza değişiminde `brfMetniYukle` (re-import) TETİKLENMEZ. Süre notanın içsel özelliği; çift-anlamlı çözüm ayrı mekanizma (ölçüye OTURAN parçada stabil).

**Gruplama reconstruction — 3 ek incelik (gruplama parçalarını derin kontrol, ölçü-süre uyarısı 45→6):**
1. **Tuplet ↔ gruplama etkileşimi**: tuplet İÇİNDE measureProgress16 sıkıştırılmamış değerle ilerler → vuruş sınırını grup ortasında geçip devam notalarını kırardı (Triplet+düzensiz `33.33/16`). Fix: vuruş-reseti `!context.aktifTuplet` ile atlanır (tuplet=tek beam grubu); tuplet tamamlanınca `oncekiNotaYazilanRv`/`oncekiNotaVurusIndex` sıfırlanır → 16/16.
2. **≥3-NOTA grup kuralı**: bir grup en az 3 nota olmalı (export `sayi<3→gruplamaz`). 16'lık + TEK 8'lik (2 nota, örn. Jolly Miller `F4-16 E4`) gruplanmamıştır → E4 gerçek 8'lik kalmalı. Lider koşulu (a): sonraki İKİ NOTA da 8'lik-hücre. Lookahead oktav/aksidental işaretlerini ATLAR (yoksa Beethoven Op.24 naturel-işaretli devam grubu `22/16` kırılır).
3. **Float gösterim/tolerans** (`brfMusicReader.js`): tuplet sıkıştırması 2/3, 4/6 devreden ondalık → toplamlar `7.9999998` gibi. Tolerans 0.01 (float hatasını yut) + mesajda `Math.round(×100)/100` (`33.33/16`).
Kalan 6 uyarı GENUINE: Weber ⚠ anomali, Jolly Miller orta-ölçü bitir-tekrar bölünmesi (10+2=12, özel durum), Ceddin/Yemen bundled-data (ölçü tam oturmuyor) — gruplama bug'ı DEĞİL.

**AKSAK METRE SEÇİLEBİLİR GRUPLAMA + IMPORT AUTO-ÇÖZÜMÜ (kullanıcı: "gruplama sayıları nasıl, araştır; seçtirelim; import'ta otomatik çözümle, kolaya kaçma"):** Araştırma (Music Braille Code 2015 + International Manual + nota teorisi): 5/8, 7/8, 9/8, 10/8 gibi aksak metrelerde vuruş bölünmesi SABİT DEĞİL — bestecinin kiriş (beam) seçimine göre değişir (7/8 = 2+2+3 / 3+2+2 / 2+3+2; hepsi geçerli). Braille gruplama "bir grup iki vuruşa ait olamaz" kuralıyla bunu izler → **seçtirilir + import'ta veriden çözülür.** Hocanın listesi `musicConstants.js` `MUZIK_GRUPLAMA_SECENEKLERI` (SEKİZLİK desen; her metrenin İLK seçeneği = eski sabit varsayılan, ×2 ile 16'lığa): 5/8[2+3,3+2] 7/8[2+2+3,3+2+2,2+3+2] 9/8[3+3+3,2+2+2+3,2+2+3+2,2+3+2+2,3+2+2+2] 10/8[3+3+2+2,2+3+2+3,3+2+3+2,2+2+3+3]. **(1) Seçilebilir desen:** `header.timeSignature.gruplamaDeseni` (sekizlik). `gorselZamanImzasiVurusDeseniAl` bu deseni varsayılan yerine kullanır (toplam=üst-rakam doğrulamasıyla, ×16/alt → 16'lık). **(2) TEK MOTOR — export de desen-tabanlı:** `musicGroupingEngine.js` artık `muzikTimeSigBeatUnit16` (uniform) yerine `gorselVurusIndexAl(pos, timeSignature)` ile vuruş eşitliği kontrol eder (`options.timeSignature` geçilir; Araclar legacy yolu uniform beatUnit fallback'i korur). Düzenli metrelerde özdeş (4/4 deseni [4,4,4,4] ⇔ beatUnit 4), aksakta DOĞRU. Böylece görsel kiriş + ekran-altı overlay + indir AYNI deseni kullanır (WYSIWYG). **(3) IMPORT auto-çözümü (`brfMusicReader.js`):** braille gruplama desenini açıkça yazmaz; grup liderleri (16'lık tam-hücre) + 8'lik-devamların DİZİLİŞİ örtük belirler. Reader varsayılan desenle ölçü-süre/taşma uyarısı verirse, o metrenin TÜM seçeneklerini dener (`forceGruplamaDeseni` → `setReaderTimeSignature` timeSignature'a ekler) ve EN AZ uyarı vereni seçer → veri kendi desenini "seçer"; çözülen desen `header.timeSignature.gruplamaDeseni`'ne yazılır, editör adaptörü (`brfReaderHeaderOlustur`) alır. **UI:** staff zaman-imzası glyph menüsü (`MuzikScoreSvg.jsx` `headerTsMenuPos` — REACHABLE yol; `MuzikScoreHeader.jsx` `headerPopupAcik` popup tetiksiz/unreachable) aksak metre seçilince "Vuruş gruplaması" bölümü gösterir → `setTimeSignature(ad, desen)`. **Test `npm run qa:brf-grouping`** (`music-brf-grouping-qa.mjs`): 4 metre × tüm seçenekler (14/14) — her desende export→import round-trip süreleri korur VE reader deseni doğru auto-çözer. ⚠ Üç TS-picker listesi de TEK KAYNAK `MUZIK_ZAMAN_IMZASI`'dan türer (5/8 dahil): `MuzikBarlineTimeSignatureModal` (inline), `MuzikScoreHeader` (form), `MuzikScoreSvg HEADER_TS_OPTIONS` (staff — reachable).

**BAR-REPEAT ×N KOMPAKT EXPORT (⠶⠼N) (kullanıcı: "n repeat okumuyor"):** Reader `⠶⠼N`'i `brailleRepeat tekrarSayisi=N` okur (`brfMusicReaderRules.js` grupBasi+sayı-işareti); adaptör N kopyaya açar. Export tarafı önceden 8 ardışık özdeş ölçüyü 8 AYRI `⠶` yazıyordu (geçerli ama standart-dışı). `musicBrfEngine.js`: ardışık özdeş-ölçü RUN'ı tespit edilir; 3+ ölçü `⠶⠼N` (kompakt, `MUZIK_UST_RAKAM` ile sayı), 1-2 ölçü ayrı `⠶`. `barRepeatKompaktBaslangic`/`barRepeatKompaktAtla`. 10 özdeş ölçü → `⠐⠹⠹⠹⠹ ⠶⠼⠊` (bar1 + ×9); round-trip temiz.

**EDİTÖRE TÜRK/AKSAK ZAMAN İMZALARI (kullanıcı: "muzik.js'e ekledim, editörde de olmalı"):** `MUZIK_ZAMAN_IMZASI`'ya eklenen 5/8, 7/8, 9/8 (+2/2 sebare) üç picker'a da yansıtıldı — listeler artık `MUZIK_ZAMAN_IMZASI.map(ad→sayısal-form)` ile TÜRER (hardcode kaldırıldı), motorun desteklediği ekstra 10/8,12/8 + C/𝄵 korunur. Tüm metreler `muzikTimeSigExpected16`/`muzikTimeSignatureHucreleri` ile çalışır (5/8 export `⠼⠑⠦`, import temiz).
