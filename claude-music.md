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
| `Enter` | Düzenleme modunu aç/kapat (her yerden; form öğeleri hariç) |
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

## 16. Sık Yapılan Hatalar

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

---

## 17. ayarlar.js Eklentileri

```js
// VARSAYILAN içinde:
notaTusDuzeni: 'alfabetik',   // 'alfabetik' | 'piyano'
sesAcik: false,               // Global TTS açma/kapama
```

---

## 18. Test Notları

- **Dev server:** `npm run dev` → `localhost:5188`
- **Sayfa URL'i:** `http://localhost:5188/#/muzik-brf-yazim`
- `sesAcik` değişikliği ayarlardan yapılır; bazen sayfayı yenilemek gerekir
- Navigation test: `[data-nav]` elementleri doğrudan `document.querySelectorAll('[data-nav]')` ile sayılabilir
- Barline aria-label: `document.querySelector('[data-nav="barline"]')?.getAttribute('aria-label')`
