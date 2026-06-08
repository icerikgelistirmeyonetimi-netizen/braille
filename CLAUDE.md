# Braille Eğitim Uygulaması — Claude Başlangıç Kılavuzu

Bu dosya proje köküne konmuştur. Claude Code her yeni oturumda bunu **otomatik** okur.
Yeni bir Claude oturumu açıldığında kodu okumadan önce buradaki bağlamı kullan.

---

## 1. Proje Özeti

React + Vite SPA. Görme engelli bireyler için Braille öğretim uygulaması.
- **Router:** HashRouter (`/#/rota`)
- **Erişilebilirlik:** NVDA ekran okuyucu + Web Speech API (Türkçe TTS)
- **Hedef cihazlar:** Masaüstü (NVDA ile), tablet (dokunmatik), Android APK (Capacitor)
- **Dil:** Türkçe (kod yorumları ve değişken isimleri dahil)
- **Kaynak dizini:** `C:\Users\HP\braille\src`

---

## 2. Temel Bileşen Şablonları

Aşağıdaki iki bileşen **neredeyse tüm öğrenme sayfalarında** kullanılan ana şablonlardır.
Herhangi birine değişiklik yapılacaksa **mutlaka ikisine birden** bakmak gerekir.

### 2.1 `src/components/DesenOgretici.jsx`

**Ne işe yarar:** Tek hücreli veya çok hücreli braille deseni öğretir.
Kullanıcı noktalara sırayla dokunarak deseni tamamlar.

**Kullanan sayfalar (örnek):**
- `HarfEgitimi`, `RakamEgitimi`, `NoktalamaEgitimi`
- `KisaltmaBirHarfli`, `KisaltmaIkiHarfli`, `KisaltmaHece`, `KisaltmaKelimeKoku`, `KisaltmaKelimeParcasi`
- `MatematikRakamEgitimi`, `FenSembolEgitimi`, `MuzikNotaEgitimi` vb.

**Önemli prop'lar:**
```jsx
<DesenOgretici
  baslik="Sayfa Başlığı"
  ogeler={[{ ad, ariaAd?, noktalar, hucreler?, tamYonergeMetni?, altMetin?, yonergeDetay? }]}
  kategoriAdi="harfi"          // yönerge metninde "A harfi, 1,2 numaralı noktalardan..."
  bolumAnahtari="harfler"      // localStorage ilerleme anahtarı
  bittiMesaji="Tebrikler!"
  noktalariSeslendir           // kısaltma sayfalarında: "1, 2 numaralı noktalardan oluşur." ekler
  rtl                          // Arapça vb. sağdan sola yazı
  ogeSesiCal={fn}              // ses kaydı çal (isteğe bağlı)
  ogeSesiOnceCal               // ses kaydını yönergeden önce çal
/>
```

**Yönerge kilit sistemi (kritik):**
- Yeni öğe geldiğinde `yonergeOkunuyor = true` → tüm nokta etkileşimi kilitlenir
- Yönerge bitince `onSon` → `setYonergeOkunuyor(false)` → ilk noktaya focus
- Yönerge okunurken Tab/Ok/Enter/Space → `yonergeBeklemeUyar()` → toast focus + TTS pause/resume
- Safety timer: `Math.min(30000, 6000 + metin.length * 200)` ms (onSon gelmezse aç)
- Nesil counter (`yonergeNesilRef`): eski timer'ların yeni öğeyi açmasını engeller

**Toast / uyarı erişilebilirliği:**
```jsx
// Toast her zaman ref + tabIndex ile render edilmeli:
{toast && <div ref={uyariRef} className="toast" aria-live="assertive" tabIndex={-1}>{toast}</div>}
// yonergeBeklemeUyar içinde:
uyariFocusIstek.current = true;
// useEffect(toast) içinde:
window.requestAnimationFrame(() => uyariRef.current?.focus());
```

---

### 2.2 `src/components/CokHucreOkuyucu.jsx`

**Ne işe yarar:** Çok hücreli kelimeleri hücre hücre adımlayarak okuma + dokunma alıştırması.
Bir kelime = birden fazla braille hücresi; kullanıcı her hücreyi sırayla tamamlar.

**Kullanan sayfalar:**
- `KuranHeceOkuma` → `KuranKelimeOkuma` → `CokHucreOkuyucu`
- `KuranKelimeTemelSayfa`, `KuranKelimeOkumaSayfa`, `KuranSureOkuma`
- `MuzikDiziOkuma`, `MatematikIfadeOkuma` vb.

**Önemli prop'lar:**
```jsx
<CokHucreOkuyucu
  baslik="Başlık"
  ogeler={[{ yazi, okunus?, anlam?, hucreler: number[][], sesId? }]}
  bolumAnahtari="kuran-heceler"
  rtl                          // Arapça
  ogeSesiCal={fn}              // ses kaydı çal
  ogeSesiOnceCal               // ses kaydını yönergeden önce çal
  ogeSesiHerZaman              // ses aktif/pasif toggle olmadan hep çal
  sadeceHucreYonergesiOku      // yazi/anlam okumadan sadece "X. hücre: N noktalarına dokun"
  ikiHucreYanYana              // 2 hücreli kelimeler yan yana göster
  yonergeFormati="standart"    // 'standart' | 'sirayla'
/>
```

**DesenOgretici ile paylaşılan sistem:**
Yönerge kilit, toast erişilebilirliği, safety timer, nesil counter → **ikisi tamamen aynı pattern**.
Birinde bir değişiklik yapılırsa **diğerinde de mutlaka yapılmalı**.

Aynı olan ref/state'ler:
```js
const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
const yonergeNesilRef = useRef(0);
const yonergeKilitTimerRef = useRef(null);
const uyariResumeTimerRef = useRef(null);
const uyariRef = useRef(null);
const uyariFocusIstek = useRef(false);
const oncekiYonergeOkunuyorRef = useRef(false);
```

Aynı olan fonksiyonlar:
```js
yonergeKilidiAc(nesil)
yonergeyiKilitleyerekSeslendir(metin, secenek)
yonergeBeklemeUyar()
```

---

## 3. Diğer Temel Bileşenler

### `src/components/BrailleCell.jsx`

**Ne işe yarar:** Tek bir braille hücresi (6 nokta). Tüm öğrenme sayfaları bu bileşeni kullanır.

**Kritik prop'lar:**
```jsx
<BrailleCell
  aktifNoktalar={[1,2]}         // dolu (kabarık) noktalar
  hedefNoktalar={[1,2,3]}       // beklenen/vurgulanan noktalar
  tiklanabilir                   // tıklama aktif → button render eder
  kilitli={yonergeOkunuyor}     // TRUE iken: div render (button değil), aria-hidden, etkileşim yok
  onKilitliEtkilesim={yonergeBeklemeUyar}  // kilitliyken tıklamada çağrılır
  hucreAdi="1. hücre"           // çok hücreli modda grup etiketi (NVDA duyurur)
/>
```

**Nokta etiket kuralı (değiştirildi):**
- Eski: "1 numaralı nokta" → Yeni: **"1. nokta"**
- `ariaLabel`: `${etiketGoster(n)}. nokta, ${durum}` (durum: dolu/boş)

### `src/components/BrailleKlavye.jsx`

**Ne işe yarar:** Yazma alıştırmalarında 6-tuş klavye (1–6 arası tuşlara eşlenmiş).
- Nokta etiketi: `${n}. nokta, klavye ${tusEtiket} tuşu`

### `src/components/DesktopShell.jsx`

**Ne işe yarar:** Her sayfanın sarmalayıcısı. Banner + sol sidebar (modül sekmeleri) + içerik.

**Kritik:** Ana sayfa (`/`) için shell render **edilmez** — AnaMenu kendi layout'unu yönetir.

**Hayalet butonlar** (sr-only, görsel alan kaplamaz, klavyede görünür):
```jsx
<KarisikYazmaButonu hayalet />  {/* etkinlik sayfalarında "Bu derste karışık yazma etkinliği başlat" */}
<button className="hayalet-btn" onClick={() => navigate('/')}>Ana sayfaya dön</button>
```

### `src/components/KarisikYazmaButonu.jsx`

**Ne işe yarar:** Mevcut derse ait karışık yazma etkinliğine yönlendirme butonu.
- Normal mod: banner sağında görünür buton (aktif sayfaya göre link üretir)
- `hayalet` prop: sr-only hayalet buton olarak render edilir
- `/yazma-karisik/...` sayfasındayken render edilmez (null döner)

### `src/components/PageHeader.jsx`

**Ne işe yarar:** Her alt sayfanın başlık bileşeni.
- `.banner-baslik` class'ı taşır → `SayfaOdakYonetimi` bu başlığı hedef alır

### `src/components/OkumaModu.jsx`

**Ne işe yarar:** DesenOgretici içindeki "Okuma Modu" — tüm öğelerin listesini gösterir,
her öğeye tıklayınca o öğeden başlar.

---

## 4. App.jsx — Rota ve Erişilebilirlik

### `SayfaOdakYonetimi` bileşeni

Rota değişince NVDA imlecini doğru yere taşır:
- **Yeni sayfaya girilince:** `.ds-content` içindeki `.banner-baslik` veya `h1/h2`'ye focus
- **Ana sayfaya dönünce:** `.modul-yan .modul-sekme.aktif` (aktif modül sekmesine) focus

**Önemli:** İlk yüklemede (`onceki === null`) focus taşımaz — StrictMode çift mount sorununu önler.

### HashRouter

URL'ler `/#/rota` formatındadır. Tüm `navigate()` çağrıları bu formatla çalışır.

---

## 5. Utility Dosyaları

### `src/utils/ses.js`

**Dışa aktarılan fonksiyonlar:**
```js
konus(metin, { kesintiyle?, hiz?, onSon?, dil? })
// dil: 'tr' (varsayılan), 'en', 'de', 'fr'
// onSon: utterance bitince çağrılır (yönerge kilit açmada kullanılır)

konusmayiDurdur()   // hem pending timer'ı hem speechSynthesis.cancel()

titret(desen)       // dokunsal geri bildirim (ms veya dizi)

basariBildir(metin) // dogruSesi() + konus()
hataBildir(metin)   // yanlisSesi() + konus()
ekranOkuyucuBildir(metin) // ses kapalıyken bile NVDA/JAWS için aria-live bölgesine yazar
tiklamaSesi()       // kısa nötr tık sesi
```

**Kritik:** Web Speech API **tek kanallı** (single channel).
`konus()` çağrısı mevcut utterance'ı keser (`kesintiyle: true` ile).
Yönerge okunurken ayrı bir "uyarı" sesi çalınamaz — bu yüzden uyarılar için
`pause()` + `resume()` yapılır; metin yalnızca NVDA focus/aria-live ile duyurulur.

### `src/utils/ilerleme.js`

```js
ogrenildiIsaretle(bolum, oge)  // o öğe tamamlandı diye işaretler
indeksKaydet(anahtar, indeks)  // kullanıcının en ileri gittiği indeksi kaydeder
indeksAl(anahtar)              // kaydedilmiş indeksi okur (yoksa 0)
sonraOgrenKaydet(anahtar, oge) // "sonra öğren" listesine ekler
sonraOgrenKaldir(anahtar, oge) // listeden çıkarır
sonraOgrenAl(anahtar)          // listeyi döner
```

**Monotonluk kuralı:** `indeks > indeksAl(bolumAnahtari)` ise kaydet — ders baştan başlasa
bile ana menüdeki ilerleme göstergesi gerilemesin.

### `src/utils/ayarlar.js`

```js
ayarlariAl()           // { sesAcik, konusmaHizi, titresimAcik, sesEfektiAcik, gizliModuller }
ayarlariKaydet(obj)
ayarlariDinle(fn)      // ayarlar değişince callback (unsubscribe döner)
```

---

## 6. CSS Sınıfları — Kritikler

### `.hayalet-btn`

Sr-only pattern: görsel alan kaplamaz, klavyede focus gelince görünür.
```css
/* Normal: 1×1 px, clip ile gizli */
/* :focus-visible: position:static, görünür border+outline */
```

### `.toast`

Ekranda kısa süre (2 sn) görünen bildirim. **Her zaman** şu niteliklerle render edilmeli:
```jsx
<div ref={uyariRef} className="toast" aria-live="assertive" tabIndex={-1}>{toast}</div>
```
`tabIndex={-1}` → programmatic focus alabilir; focus gelince NVDA okur.

### `.modul-yan .modul-sekme.aktif`

Sol sidebar'daki aktif modül sekmesi. Ana sayfaya dönüşte odak buraya taşınır.

---

## 7. Kısaltma Sayfaları

Beş sayfa `DesenOgretici`'yi `noktalariSeslendir` prop'u ile kullanır.
Bu prop: yönerge metnine "1, 2 numaralı noktalardan oluşur." cümlesini ekler.

```
KisaltmaBirHarfli   → bolumAnahtari="kisaltma-bir-harfli"
KisaltmaIkiHarfli   → bolumAnahtari="kisaltma-iki-harfli"
KisaltmaHece        → bolumAnahtari="kisaltma-hece"
KisaltmaKelimeKoku  → bolumAnahtari="kisaltma-kelime-koku"
KisaltmaKelimeParcasi → bolumAnahtari="kisaltma-kelime-parcasi"
```

---

## 8. Kuran Sayfaları (CokHucreOkuyucu Kullanan)

```
KuranHeceOkuma      → KuranKelimeOkuma(kaynakAnahtari="hece")
                       ogeSesiOnceCal, ogeSesiHerZaman, sadeceHucreYonergesiOku
KuranKelimeTemelSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime-temel")
KuranKelimeOkumaSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime")
KuranSureOkuma      → Doğrudan CokHucreOkuyucu
```

Ses dosyaları: `public/audio/kuran/` klasöründe. `SesIzinEkrani` bileşeni ilk ses iznini alır.

---

## 9. NVDA Erişilebilirlik Kuralları

### Focus yönetimi
- Rota değişimi → `SayfaOdakYonetimi` (App.jsx)
- Yönerge bitti → ilk braille noktasına focus (`document.querySelector('.page-mid .cell .dot')`)
- CokHucreOkuyucu'da → `document.querySelector('.page-mid button.dot')`
- Uyarı toast'u → `uyariRef.current?.focus()` (useEffect içinde rAF ile)

### Programmatic focus şablonu
```js
const id = window.requestAnimationFrame(() => {
  hedefEl.focus();
});
return () => window.cancelAnimationFrame(id);
```

### Ekran okuyucudan gizleme
```jsx
aria-hidden={true}        // BrailleCell kilitliyken dot'lar
aria-hidden="true"        // görsel öğeler (ilerleme çubuğu, ikon)
```

### Canlı bölge
```jsx
aria-live="assertive"     // acil duyurular (uyarı, hata)
aria-live="polite"        // bilgi duyuruları (ilerleme, yönerge)
```

### tabIndex=-1 kuralı
Başlık, toast, uyarı gibi normalde odaklanamayan elemanlara programmatic focus
için `tabIndex={-1}` eklenir. Klavye ile Tab sıralamasına **girmez**.

---

## 10. Yaygın Hatalar ve Kaçınılacaklar

| Hata | Doğrusu |
|------|---------|
| `useState(indeksAl(...))` ile başlatma — devam eder | `useState(0)` — her oturum baştan |
| Yönerge kilit sadece DesenOgretici'de güncellendi | CokHucreOkuyucu'da da **mutlaka** aynısı |
| `konus()` ile uyarı + `resume()` — tek kanal | `pause()` → NVDA focus → `resume()` |
| Safety timer çok kısa (ör. `90ms/char`) — kilit erken açılır | `Math.min(30000, 6000 + len * 200)` |
| `requestAnimationFrame` → ref null (React henüz render etmedi) | `useEffect([toast])` içinde rAF kullan |
| StrictMode çift mount: ilk yüklemede odak çalınır | `oncekiYol.current === null` ise taşıma |
| BrailleCell: kilitliyken sadece `onClick` engellendi | `kilitli` prop → div render, tüm handler'lar kaldırılır |

---

## 11. Git / Geliştirme

```bash
# Geliştirme sunucusu
cd C:\Users\HP\braille
npm run dev      # localhost:5188 (veya 5173)

# Build
npm run build

# Git
git add src/...
git commit -m "feat(a11y): açıklama"
git push
```

**Branch:** `main`
**Remote:** `https://github.com/icerikgelistirmeyonetimi-netizen/braille.git`

---

## 12. Kısa Dosya Haritası

```
src/
├── App.jsx                    # Router + SayfaOdakYonetimi + route tanımları
├── styles.css                 # Global stiller (.hayalet-btn, .toast, .cell, .dot vb.)
├── components/
│   ├── BrailleCell.jsx        # ★ Tek hücre bileşeni — her öğrenme sayfasında var
│   ├── BrailleKlavye.jsx      # Yazma sayfaları için 6-tuş klavye
│   ├── CokHucreOkuyucu.jsx    # ★ Çok hücreli okuma şablonu
│   ├── DesenOgretici.jsx      # ★ Tek/çok hücreli öğretim şablonu
│   ├── DesktopShell.jsx       # ★ Tüm sayfaların sarmalayıcısı (banner + sidebar)
│   ├── KarisikYazmaButonu.jsx # Karışık yazma etkinliği yönlendirme butonu
│   ├── OkumaModu.jsx          # DesenOgretici'nin okuma modu listesi
│   ├── PageHeader.jsx         # Alt sayfa başlık bileşeni
│   └── SesIzinEkrani.jsx      # Ses izni alma ekranı (Kuran ses sayfaları)
├── pages/
│   ├── AnaMenu.jsx            # Ana sayfa / modül listesi
│   ├── HarfEgitimi.jsx        # Türkçe harfler → DesenOgretici
│   ├── KisaltmaBirHarfli.jsx  # } Kısaltma sayfaları → DesenOgretici + noktalariSeslendir
│   ├── KisaltmaHece.jsx       # }
│   ├── KisaltmaIkiHarfli.jsx  # }
│   ├── KisaltmaKelimeKoku.jsx # }
│   ├── KisaltmaKelimeParcasi.jsx # }
│   ├── KuranHeceOkuma.jsx     # } Kuran sayfaları → CokHucreOkuyucu + ses kaydı
│   ├── KuranKelimeOkuma.jsx   # }
│   └── YazmaKarisik.jsx       # Karışık yazma etkinliği
└── utils/
    ├── ses.js                 # ★ konus(), konusmayiDurdur(), titret(), basariBildir()
    ├── ilerleme.js            # ★ localStorage ilerleme/indeks/sonraOgren yönetimi
    ├── ayarlar.js             # Kullanıcı ayarları (ses, titreşim, gizli modüller)
    └── karisikYazmaKaynaklari.js  # URL → karışık yazma kaynağı eşleme
```

`★` işaretli dosyalar en sık düzenlenen/etkilenen dosyalardır.
