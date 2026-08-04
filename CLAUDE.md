# Braille Education App — Claude Session Guide

Auto-read by Claude Code at session start. Read before touching any code.

---

## 1. Project Overview

React + Vite SPA. Braille education for visually impaired users.
- **Router:** HashRouter (`/#/route`)
- **A11y:** NVDA screen reader + Web Speech API (Turkish TTS)
- **Targets:** Desktop (NVDA), tablet (touch), Android APK (Capacitor)
- **Source:** `C:\Users\HP\braille\src`

### Obsidian vault (human navigation layer)
The repo root is an Obsidian vault (`.obsidian/`, `node_modules`/`dist`/`android` excluded). `docs/` holds a **thin navigation/relationship layer** (NOT a content copy — avoids drift) that links the 4 big docs ([CLAUDE.md](CLAUDE.md), [claude-music.md](claude-music.md), [muzik-braille-yazim-kurallari.md](muzik-braille-yazim-kurallari.md), [muzik-braille-test-ornekleri.md](muzik-braille-test-ornekleri.md)), the code, and the `qa:*`/`tool:*` scripts into one graph. Entry: [docs/Proje Haritası.md](docs/Proje%20Haritası.md). Notes: `Proje Haritası`, `Müzik BRF`, `Müzik Kod Haritası`, `QA Komutları`, `Kaynak Belgeler`. **Maintain it like CLAUDE.md without being asked:** when a music file moves/renames or a `qa:*` script is added, fix the affected `docs/*.md` link. Wikilinks (`[[claude-music]]`) resolve to root files; code uses repo-relative markdown links.

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

**Used by (teaching):** `HarfEgitimi`, `RakamEgitimi`, all 5 Kisaltma pages,
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
  ikiHucreYanYana             // DEFAULT true — 2-cell items shown SIDE-BY-SIDE (cell-row.fit), NOT stepped one at a time. Module 10 excluded automatically (doesn't use CokHucreOkuyucu). Active cell is the only clickable one; hucre-onizleme preview hidden. Hücre üstüne GÖRSEL "1"/"2" başlık (baslik prop) KONMAZ — braille noktaları da 1–6 olduğundan karışırdı (kullanıcı: "hücre başlarında 1 2 yazmasın"); ekran okuyucu ayrımı hucreAdi ("1. hücre") grup etiketiyle. Pass false for legacy step-through. (kullanıcı: "iki hücre varsa tek tek değil yan yana göstersin")
  yonergeFormati="standart"   // 'standart' | 'sirayla'
/>
```
`sesOncesiYonergeMetni` is read before `ogeSesiCal`; then item sound plays; then
`tamYonergeMetni`/generated instruction. Use for music pages where info must precede sound.

---

## 3. Narration Lock System (`CokHucreOkuyucu`)

**⚠⚠ ZORLA BEKLETME (KİLİT) KALDIRILDI — noktalar HER AN etkileşimli (kullanıcı: "yönerge bitmesini bekleyiniz ve zorla bekletmeyi kaldıralım tüm sayfalardan").** Aşağıdaki "kilit" alt-notları TARİHSEL — artık noktalar narration sırasında KİLİTLENMEZ. Kaldırılanlar: (1) `kilitli={yonergeOkunuyor}` + `onKilitliEtkilesim` BrailleCell prop'ları (noktalar hep `button`, hiç `div`/aria-hidden olmaz); (2) `yonergeBeklemeUyar` + **"Yönerge bitmesini bekleyiniz." toast'ı**; (3) narration-sırası klavye engelleme effect'i (Enter/Space/ok engeli + Tab-ile-kes). Enter/Space/ok/Tab artık DOĞAL çalışır (Tab yönerge bölgesinden DOM sırasıyla ilk noktaya). **`yonergeOkunuyor` KORUNDU ama artık YALNIZ ODAK AKIŞINI sürer** (narration "bitti" → giriş: yönerge bölgesi / öğe geçişi: ilk nokta). `yonergeyiKilitleyerekSeslendir` de kalır (ad tarihsel; kilitlemez — sadece `yonergeOkunuyor` true→false timer'ı ile narration-bitti odak sinyalini verir). **⚠ Dot-guard (odak effect'inde):** kilit kaldığından narration penceresinde noktalar canlı; kullanıcı zaten bir noktaya geçtiyse (`document.activeElement.classList.contains('dot')`) narration-bitti timer'ı odağı ÇALMAZ (early return) → dokunma akışı bozulmaz. **CokluTest/YazmaKarisik'teki `kilitli` AYRI bir kilit** (cevap işlenirken kısa geri-bildirim kilidi, "bitmesini bekleyiniz" DEĞİL) — DOKUNULMADI. (Tarayıcıda doğrulandı: /harfler açılışta 6 `button.dot` (0 kilitli div), erken preview_click → "dot correct" + "Sıradaki nokta: 2 numara.", toast YOK, konsol temiz.)

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
yonergeKilidiAc(nesil)                      // narration-bitti sinyali (ARTIK kilit AÇMAZ; yalnız yonergeOkunuyor=false → odak effect'i)
yonergeyiKilitleyerekSeslendir(metin, opt)  // ad tarihsel — KİLİTLEMEZ; yonergeOkunuyor true→timer→false ile narration-bitti ODAK sinyalini verir
// yonergeBeklemeUyar() — KALDIRILDI (toast + zorla bekletme silindi; bkz. üstteki not)
```

**⚠⚠ KRİTİK — KİLİT SÜRESİ App TTS'e GÖRE; NVDA'da onSon kilidi HEMEN AÇMAZ (kullanıcı: "yönerge okunurken yanlış tuş tıkladığımda direk sonrakine atlıyor — çok kritik"):** `konus`, app TTS KAPALIYKEN (NVDA kullanıcıları) `onSon`'u `setTimeout(0)` ile **ANINDA** tetikler ([ses.js](src/utils/ses.js) `if (!a.sesAcik)` dalı). ESKİDEN `yonergeyiKilitleyerekSeslendir` `onSon: () => yonergeKilidiAc(nesil)` veriyordu → NVDA'da kilit **hemen** açılıyor, NVDA yönergeyi aria-live bölgesinden hâlâ okurken noktalar CANLI (`button`) oluyor → erken/yanlış dokunuş `noktayaTikla`'ya kaydolup öğeyi ilerletiyordu (kilit fiilen HİÇ çalışmıyordu — öğrenme modunun EN kritik hatası). **Fix (`yonergeyiKilitleyerekSeslendir`):** `sesAcik = ayarlariAl().sesAcik` ile iki dal — **App TTS AÇIK:** `onSon` (gerçek utterance sonu) kilidi açar + güvenlik üst sınırı `Math.min(30000, 6000+len*200)`. **App TTS KAPALI (NVDA):** `onSon` **UNDEFINED** (kilidi AÇMAZ); kilit yalnız NVDA okuma süresi timer'ı `Math.min(12000, 2500+len*70)` VEYA **Tab** (ses/yönergeyi kes + ilk noktaya atla) ile açılır → erken dokunuş `yonergeBeklemeUyar` toast'ı alır, öğe ilerlemez. **Regresyon yok:** modülden girişte odağı `SayfaOdakYonetimi` bağımsız verir; kilit-bitişi effect'i (§3 giriş dot-odak) transition'da yine çalışır (yalnız gecikir); ses-kayıtlı sayfalar kendi audio-sonrası akışında bu fonksiyonu kullanır → onlar da tutarlı kilitlenir. (⚠ NVDA zamanlaması gerçek tarayıcı/NVDA'da doğrulanır; headless preview uygulamayı mount etmiyor.)

**⚠⚠ DEĞİŞMEZ STANDART — İLK TAB = HÜCRENİN 1. NOKTASI (kullanıcı: "ilk tab tuşumda braille hücresinde 1. nokta HER ZAMAN"; "asla ama asla bu standartı değiştirme; yanlış anlarsan sor"):** Öğrenme modunda SAYFA GİRİŞİNDE (ses kaydı YOK) odak YÖNERGE bölgesine (`.yonerge-sr`) gelir — bir dot'a/ilk HEDEF noktaya DEĞİL → NVDA önce yönergeyi okur; kullanıcının **İLK TAB'ı DOM sırasıyla braille hücresinin 1. (ilk) noktasına** konumlanır. Bu yüzden: (a) giriş dot-odak dalı `if (girisAni && !sesKaydiVar)` → `.yonerge-sr` odaklar (NVDA VE app TTS, **rAF-retry** ile — kilit-açma re-render'ında odak düşmesin), dot'a GEÇMEZ; (b) dot'a odaklanan TÜM yollar (sayfa-içi öğe geçişi, Tab-kes) `kok.querySelector('button.dot')` = **1. nokta** kullanır, `button.dot.target` (ilk hedef) DEĞİL. Ses kayıtlı sayfalar ayrı akış (region ses bitince dolar). **Bu standardı ASLA değiştirme; emin değilsen kullanıcıya sor.** (⚠ Headless preview programatik odağı sayfanın "aktif" döneminde tutmuyor → bu davranış yalnız gerçek tarayıcı/NVDA'da doğrulanır.)

**Flow:**
1. New item → increment generation, `setYonergeOkunuyor(true)`, call `yonergeyiKilitleyerekSeslendir`
2. During narration: Arrow/Enter/Space → blocked by keydown capture → `yonergeBeklemeUyar()`. **⚠ Tab İSTİSNA — sesi/yönergeyi KESER + ilk noktaya atlar (kullanıcı: "tab ile ilerlersem ses kesilmeli ve sonradan devam etmemeli; geriden ses istemiyorum"):** keydown handler `Tab`'da `yonergeNesilRef++` (bekleyen `onEnded`/safety callback'lerini İPTAL — `yonergeyiOku`/`anaYonergeyiOku` başında `if (yonergeNesilRef.current !== buNesil) return` ile re-kilit/geriden-ses önlenir) + `tumSesleriDurdur()` (ses kaydı + TTS + timer'lar) + `setYonergeOkunuyor(false)`. İleri Tab: `preventDefault` + rAF ile ilk braille noktasına odak (noktalar kilitliyken div→Tab sırasında değil). Shift+Tab: preventDefault YOK → tarayıcı geriye götürür. Böylece ses kaydı uzun olsa da kullanıcı Tab ile atlayıp doğrudan noktalara geçer, ses tekrar başlamaz. (Tarayıcı /kuran-harfler: ses çalarken Tab → 6 nokta buton+ilk noktada odak; 4sn sonra hâlâ kilitsiz = re-kilit yok.)
3. `yonergeBeklemeUyar` → `gosterToast(...)` only (visual only, NVDA silent, TTS keeps playing)
4. `onSon` fires → `yonergeKilidiAc(nesil)` → `setYonergeOkunuyor(false)`
5. Narration ends → `konusDil('Başla', { srAtla: true })` (app TTS açıksa sesli; `_srBolge`'ye YAZMAZ → aria-live yönerge bölgesini EZMEZ) → odağı **İLK BRAILLE NOKTASINA** ver (`kok.querySelector('button.dot.target') || 'button.dot'`; yoksa sentinel'e düş). ⚠ ESKİDEN boş `dotSentinelRef` sentinel'e (aria-hidden, içeriksiz span) odaklanıyordu → NVDA bunu **"boş"** diye okuyordu (kullanıcı: "yönerge bitince boş diyor; orada braille noktalarını saymalı"). Artık basılacak nokta okunur ("1. nokta, **basılacak nokta**, buton" — hedef noktanın durumu `boş` DEĞİL `basılacak nokta`; bkz. §4 BrailleCell Dot label rule, kullanıcı: "boş düğme gibi okuyor, hatalı") + kullanıcı doğrudan noktaya konumlanır. Kelime (`{k.yazi}`) `tabIndex={0}` → Tab ile erişilir (üstüne gelince `lang` ile o dilde okunur). Sentinel hâlâ DOM'da (nokta yoksa yedek). **⚠ SAYFA GİRİŞİNDE (modülden VEYA refresh) + app TTS KAPALI (NVDA) + ses kaydı YOK → önce YÖNERGE okunsun, odağı yönerge bölgesine VER (dot'a DEĞİL) (kullanıcı: "tüm sayfalarda — ses kaydı olanlar hariç — sayfa yenilenince ya da modülden gelince ilk yönerge okunsun, sonra braille; dot direkt odaklanması hatalı"):** Effect'in başında `const girisAni = sayfaGirisiRef.current; sayfaGirisiRef.current = false` (ilk narration-bitti = sayfa girişi, sonrası öğe geçişi). `if (!ayarlariAl().sesAcik && typeof ogeSesiCal !== 'function' && girisAni)` → rAF ile `[data-sayfa-odak="yonerge"]` bölgesine odaklan + `return` (dot'a geçme, "Başla" deme). Sebep: app TTS kapalıyken `konus` `onSon`'u **anında** (`setTimeout 0`) tetikler → narration "biter" → bu effect HEMEN çalışıp dot'a odaklanır → NVDA'nın yönerge bölgesini okumasını YARIDA keser. **REFRESH de kapsanır:** `SayfaOdakYonetimi` ilk yüklemede (`oncekiYol===null`) odağı ATLAR → eskiden refresh'te dot odaklanıyordu; artık bu effect aktif odaklar (modülden gelişte `SayfaOdakYonetimi` de aynı bölgeye odaklar → idempotent). Kullanıcı yönergeyi dinleyip Tab ile ilk noktaya geçer (DOM sırası: yönerge bölgesi → BrailleCell). **Yalnız GİRİŞ (mount) bu yolu alır:** sayfa-içi öğe geçişinde `girisAni=false` → dot'a geçilir (eski davranış); app TTS AÇIKKEN narration gerçek süre alır, bittiğinde dot'a geçilir; **ses KAYITLI sayfalar (`ogeSesiCal` fonksiyon: KuranHarf/KuranKelime/MuzikNota/MuzikBraille) HARİÇ** (kullanıcı isteği) → onlarda `data-sayfa-odak` da konmaz (bkz. §5) + bu dal atlanır → eski davranış. (Tarayıcı: cezm-sedde refresh→odak yönerge bölgesinde; TTS açık region→14s narration→dot; TTS kapalı odak yönergede kalır; bitti→Tebrikler mesajına odak.) **Yönerge sr-only bölgesi İLK render'da hazır olmalı** (`{(() => { const metin = srYonergeMetni || kelimeYonergeMetniAl(k); … })()}`): `srYonergeMetni` state bir effect'le bir render GEÇ set edilir → `SayfaOdakYonetimi` rAF'ı o frame'de bölgeyi bulamayıp başlığa düşüyordu; state yoksa yönerge anlık hesaplanır (AYNI metin → çift-okuma yok, polite değişmez). **BİTTİ (Tebrikler) ekranı: mesaj `tabIndex=-1`+`ref`, ayrı effect (`[bitti]`) rAF ile mesaja odaklanır → ekran okuyucu "Tebrikler"i okur (kullanıcı: "tebrikler sahnesinde ekran okuyucu tebriklere odaklanamıyor"); bitti ekranına rota değişmeden (setIndeks) geçildiğinden `SayfaOdakYonetimi` devreye girmez. `aria-live` KALDIRILDI (odak-okuması ile çift olmasın; TTS açıksa bitti effect'i `konus` ile ayrıca söyler).**

**⚠ SES KAYDI ÖNCE çalan sayfalarda yönerge–ses ÇAKIŞMASI önlenir — yönerge bölgesi ses BİTİNCE doldurulur (kullanıcı: "kuranda ses kaydı ile çakışma"):** `sesKaydiOnce = ogeSesiOnceCal && (ogeSesiHerZaman||ogeSesiAktif) && typeof ogeSesiCal==='function'` (Kur'an Harfleri, sesli müzik, sesli Kur'an kelime). ESKİDEN `setSrYonergeMetni(metin)` öğe yüklenince HEMEN çağrılıyordu → NVDA yönergeyi **ses kaydı çalarken** okuyup çakışıyordu (NVDA ses kaydını bilmez, iki ayrı çıkış üst üste biner). Fix: (1) öğe yüklenince `setSrYonergeMetni(sesKaydiOnce ? '' : metin)` — ses-kayıtlıda bölge BOŞ; (2) `yonergeyiOku` (ses kaydının `onEnded`'i; güvenlik 5sn) içinde `setSrYonergeMetni(metin)` → bölge ses bitince dolar → polite duyuru o anda. (3) Bölge render'ı ses-kayıtlıda **DOM'da boş kalır** (`metin = srYonergeMetni || (sesKaydiOnce ? '' : kelimeYonergeMetniAl(k))`; `if (!metin && !sesKaydiOnce) return null` — boş→content değişimi polite duyuruyu tetikler; doluyken render-stable fallback yalnız ses-kayıtsızda). (4) **Tekrar** (effect + alt-çubuk buton): nonce bump'ı ses bitene KADAR ertelenir (audio-before dalında `tekrarOku`/setTimeout içinde `setSrYonergeMetni+nonce`). (5) **Dot-odak effect'i ses-kayıtlı + app TTS kapalıda `if (!sesAcik && sesKaydiVar) return` ile hiçbir şey yapmaz** → bölge dolunca dot'a geçip yönergeyi yarıda KESMEZ; odak başlıkta kalır, kullanıcı Tab ile noktaya. (App TTS açıkken aşağı düşer → narration sonrası dot.) Tarayıcı (/kuran-harfler, izin ekranı→Sesi Başlat): bölge t≈0.6sn BOŞ, ses bitince t≈2.4sn yönerge dolu; odak dot'a GİTMEZ; konsol temiz. Ses-kayıtsız sayfalar etkilenmez (sesKaydiOnce=false → eski yol).

**⚠ YÖNERGE ÇİFT OKUMASI önlenir — odaklı bölge aria-live KAPALI (kullanıcı: "yönergeleri bazen iki kere okuyor"):** Yönerge bölgesi HEM odak hedefi (`data-sayfa-odak`, `tabIndex=-1`) HEM canlı bölge (`aria-live=polite`) idi → **odaklı bir öğenin aynı zamanda canlı bölge olması anti-paterni**: NVDA bölgeyi (a) ODAK ile (b) polite duyuru ile İKİ kez okuyordu (NVDA zamanlamasına göre "bazen"). Fix: `yonergeOdakta` state + bölgede `onFocus→true`/`onBlur→false`; `aria-live={yonergeOdakta ? 'off' : 'polite'}`. **Odaklıyken (giriş/refresh — NVDA odakla okur) aria-live KAPALI** → canlı bölge çift duyuru eklemez. **Odak başkadayken (sayfa-içi öğe geçişi = odak dot'ta; Tekrar = odak butonda) polite** → değişiklik bir kez duyurulur. Ses-kayıtlı sayfalarda bölge hiç ODAKLANMAZ (dot-odak effect erken döner) → aria-live `polite` kalır → ses sonrası dolum bir kez duyurulur. Ayrıca **giriş dot-odak dalı** `if (yonergeEl && document.activeElement !== yonergeEl) focus()` ile zaten-odaklıyken yeniden odaklamaz (gereksiz ikinci olay yok). Tarayıcı: focusin→`aria-live=off`, focusout→`polite`; ses sayfası bölgesi `polite` + dolu; konsol temiz.

**⚠ OKUMA↔ÖĞRENME MODU GEÇİŞİNDE odak İLK İÇERİĞE (kullanıcı: "okuma modunda başlığa / öğrenme moduna dönünce sayfa altına odaklanıyor, ilk içerik kutusuna odaklanmalı"):** Geçiş yalnız query param'ı (`?gorunum=dolasim`, bkz. §5) değiştirir, **pathname SABİT kalır** → `SayfaOdakYonetimi` (yalnız pathname'e bakar) çalışmaz; geçiş butonu unmount olunca odak gövdeye düşüp ekran okuyucu en üstten (sayfa BAŞLIĞINDAN) okuyordu. Fix: `oncekiOkumaModuRef` + effect (`[okumaModu, bitti]`), İKİ yön:
  - **ÖĞRENMEYE dönüş** (true→false) → `#main .yonerge-sr` (yönerge bölgesi). ⚠ `data-sayfa-odak` DEĞİL **`yonerge-sr` SINIFI** ile erişilir: data-sayfa-odak ses-kayıtlı sayfalarda YOK → eski selector başlığa düşüyordu; `yonerge-sr` HER ZAMAN var.
  - **OKUMAYA giriş** (false→true) → `#main .okuma-modu-grid button.okuma-modu-kutu` (ilk kart = ilk içerik kutusu).
  ⚠ **Odak rAF-RETRY ile verilir** (`odakla` en çok 6 frame): `OkumaModuListesi` (çocuk) StrictMode mount churn'ünde kart yeniden oluşunca tek rAF'lık odak DÜŞÜYORDU (gövdede kalıyordu) → `document.activeElement !== el` ise yeniden dene. ⚠ Test TUZAĞI: okuma moduna girip `setInterval` ile yoklamak preview'i kilitliyor; tek `setTimeout` ile doğrula. **Kart odak ÇİFT-OKUMASI önlendi:** `OkumaModu.jsx` kart `onFocus`'unun `konus`'ları `srAtla:true` (app TTS söyler, `_srBolge`'ye yazmaz → NVDA yalnız kart aria-label'ini okur). Tarayıcı: cezm-sedde + kuran-harfler okuma moduna geç → ilk kart; Dön → `.yonerge-sr`; başlık/gövde değil.

**Toast JSX (always this exact pattern):**
```jsx
{toast && <div className="toast" aria-live="off">{toast}</div>}
```

**EKRAN OKUYUCU — yönerge KALICI + sıradaki nokta AYRI bölge (kullanıcı: "yönerge hep kalmalı, sıradaki nokta gelince kaybolmamalı; başka sıradaki nokta gelince eskisiyle yer değiştirmeli — yalnız ekran okuyucu için"):** İki `sr-only` bölge (görsel YOK):
- **Yönerge** `<div className="sr-only" aria-live="polite" aria-atomic="true">…</div>` — **aria-live AÇIK (polite)** ve yönergeyi DUYURAN bölge (kullanıcı: "ekran okuyucu başla/boş okuyor, yönergeyi/harfi okumuyor" — app TTS KAPALIYKEN). ⚠ ÖNCEDEN aria-live KAPALIYDI + yönerge `konus`→`_srBolge`'den duyuruluyordu; ama (a) `_srBolge` DÜZ METİN → `lang` taşıyamaz (yabancı harf Türkçe okunur), (b) app TTS kapalıyken `konus` `onSon`'u `setTimeout(0)` ile anında tetikler → kilit hemen açılır → `konusDil('Başla')` `_srBolge`'yi **anında EZER** → NVDA yönergeyi okuyamadan "Başla" okur. **Fix:** yönerge artık `_srBolge` yerine BU bileşen bölgesinden duyurulur — `yonergeyiKilitleyerekSeslendir` `konusDil(metin,{srAtla:true})` (`_srBolge`'ye YAZMAZ; app TTS açıksa yine sesli okur) + `'Başla'` da `srAtla:true` (NVDA için yönerge bölgesi yeterli cue). Bölge `<span lang={yabanciDil}>{token}</span>{kalan}` ile yabancı harfi o dilde, kalanı Türkçe okutur (bkz. §10 NVDA lang). Effect'te öğe/hücre değişince `setSrYonergeMetni(metin)` (= `kelimeYonergeMetniAl(k)`; metin değişir → polite bölge bir kez okur). **nonce (`yonergeNonce`)**: yeni öğede metin zaten değiştiğinden bump ETME (çift-okuma olur); SADECE **Tekrar**'da (`tekrar` handler, aynı metin) bump → sonu görünmez boşluk toggle → NVDA yeniden okur. Tarayıcı (app TTS kapalı): /almanca/alfabe yönerge polite bölgede `lang=de` span+Türkçe kalan, `_srBolge` BOŞ (Başla yok), Tekrar=1 mutasyon, ardışık öğeler tek-tek (çift yok), /harfler Türkçe lang'sız.
- **Durum (sıradaki nokta / doğru / yanlış / tamamlandı)** `<div className="sr-only" aria-live="assertive" aria-atomic="true">{srSiradakiNokta}</div>` — TÜM dokunuş geri-bildirimi bu TEK bölgeden geçer → ekran okuyucu **otomatik okur** (odak TAŞIMADAN — dokunma akışı bozulmaz; kullanıcı: "otomatik odaklanıp okusun" → assertive auto-read, focus-move YOK kasıtlı). Her dokunuşta atomic ile eskisiyle YER DEĞİŞTİRİR; öğe/hücre değişince effect `''` ile temizler. **⚠ `role="status"` KULLANMA (kullanıcı: "sonraki öğeye geçince önceki öğenin doğru tıklamasını sonradan doğru diye okuyor"):** `role="status"` örtük **polite**'tir; `aria-live="assertive"` ile ÇELİŞİR → NVDA polite sayıp güncellemeleri **KUYRUĞA alır (kesmez)** → önceki öğenin "Doğru. Sıradaki nokta…" (uzun cümle) sonraki öğe yüklenince bile sırada bekleyip **sonradan** okunur (sızıntı). DOM zaman çizelgesi temizdi (her mesaj öncekini değiştirir) → bug salt role/live çelişkisindeydi. Saf `aria-live="assertive"` (role YOK): en yeni mesaj öncekini **KESER** + boş div browse-mode'da "boş" okunmaz. (Bitti ekranındaki görünür `.instruction.success role="status"` AYRI, sorun değil.)
- **Ortak yardımcı `srDurumDuyur(mesaj, ses?)`:** `setSrSiradakiNokta(mesaj)` (bölge auto-okur) + `konusDil(mesaj,{srAtla:true})` (yalnız TTS, `_srBolge`'ye yazMAZ → çift duyuru yok) + opsiyonel `dogruSesi()`/`noktaSesi()`/`yanlisSesi()` (`ses` = `'dogru'`|`'nokta'`|`'yanlis'`). `noktayaTikla` 4 durumu bununla duyurur: **yanlış** ("Yanlış. N numara bu hücrede yok." + yanlış sesi), **doğru+kalan nokta** ("Sıradaki nokta: N numara." + **`'nokta'` = tek notalı blip**), **hücre tamam+başka hücre** ("Sonraki hücreye geçiliyor." + **`'dogru'` = ding**), **öğe tamam** ("Tebrikler…" + `'dogru'` = ding). **⚠⚠ İKİ AYRI SES EFEKTİ — nokta dokunuşu ≠ geçiş (kullanıcı: "noktalara tıkladığımızdaki doğru ses efekti ile sayfa/öğe geçiş sesi aynı kalmış; iki ayrı ses olsun — doğru tıklamalarda farklı, geçişte bu ses [ding] kalabilir; test modunda bitiş net duyuluyor, aynısı öğrenmede olsun"):** her DOĞRU NOKTA `noktaSesi()` (tek 700Hz nota, "blip") çalar; hücre/öğe GEÇİŞİ `dogruSesi()` (yükselen iki nota, "ding") çalar → kullanıcı "nokta doğru"yu "hücre/öğe geçiliyor"dan sesle ayırt eder. (Test modu = CokluTest zaten yalnız hücre/soru tamamlanınca `dogruSesi()` çalar — akor girişi olduğundan per-dot ses yok; DEĞİŞTİRİLMEDİ, referans doğru davranış.) Dosya-override: `public/audio/efekt/nokta.wav` (yoksa sentez). **⚠ "Doğru/doğru" SÖZCÜĞÜ HİÇBİR geri-bildirimde YOK (kullanıcı: "sıradaki nokta yönergesinden sonra bir önceki doğru cevap için doğru diyor"):** mesaj eskiden "**Doğru.** Sıradaki nokta: N" ile başlıyordu → her dokunuşta tekrarlanan "Doğru", hızlı dokununca NVDA kuyruğunda GECİKİP önceki dokunuşunki gibi okunuyordu (DOM temizdi; sorun salt NVDA konuşma kuyruğu + uzun/tekrarlı metin). Fix: olumlu onay = **ses efekti (blip/ding, kuyruksuz)**; metin kısa + "doğru" sözcüğü yok → gecikme/karışma yok.
- **ÖĞE TAMAMLANINCA (kullanıcı: "tebrikler desin hemen değişmesin, sonraki öğe desin sonra geçiş"):** `srDurumDuyur('Tebrikler! Öğeyi tamamladınız.','dogru')` (eski "Bu öğeyi **doğru** tamamladınız" → "doğru" sözcüğü çıkarıldı) → **1500ms bekle** → son öğe değilse `srDurumDuyur('Sonraki öğe.')` → **1200ms** → `setIndeks+1`; son öğeyse doğrudan `setIndeks+1` (→ bitti ekranı `bittiMesaji` okur). `ogrenildiIsaretle` öğe-tamam dalında. (Eski ani `basariBildir('Doğru!')`+`sonrakiHucre` değişti; manuel "Sonraki öğe" butonu hâlâ `sonrakiHucre`.) Tarayıcı doğrulaması (/harfler A→B): t≈0 "Tebrikler!…", t≈1.5s "Sonraki öğe.", t≈3s B narration; yanlış dokunuş "Yanlış. 2 numara…"; konsol temiz.

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
**⚠ Hücre grup etiketi YALNIZ çok hücrelide (kullanıcı: "noktaları sayıyor sonra '6. nokta braille hücresi' diyor"):** `.cell` div'i `role={hucreAdi ? 'group' : undefined}` + `aria-label={hucreAdi || undefined}`. ESKİDEN tek hücrede de `aria-label="Braille hücresi, altı nokta"` vardı → NVDA noktalardan sonra grup SINIRINDA bu etiketi okuyordu (gereksiz; yönerge + her noktanın `"N. nokta, durum"` etiketi bağlamı zaten veriyor). Artık tek hücrede grup/etiket YOK (yalnız noktalar okunur); çok hücrede `hucreAdi` ("1. hücre") grup etiketi KALIR (hücreleri ayırt eder).
**Dot label rule:** `"${n}. nokta, ${durum}"` — was "numaralı nokta", now just "X. nokta". **Durum ÜÇ DEĞER (kullanıcı: cezm-sedde ilk öğe [2,5] → yönerge bitince odak ilk hedef noktaya (dot 2) gelince "2. nokta, boş, düğme" okuyordu, NVDA'da "boş düğme" = etiketsiz/işlevsiz buton gibi duyuluyordu, hatalı):** `dolu` (aktif/doğru = basılı) → `basılacak nokta` (hedef ama henüz basılmamış = desene ait, basılacak) → `boş` (desene ait olmayan). ESKİDEN hedef noktalar da "boş" diyordu; artık hedef noktanın basılması gerektiği söylenir + kullanıcı `boş`/`basılacak nokta` farkıyla deseni de ayırt eder. (Mantık `hedefNoktalar.includes(n)` ile `BrailleCell.ariaLabel`'de; `tiklanabilir` öğrenme hücreleri + `HucreTanima` hedef noktayı bu şekilde duyurur; okuma-modu hücreleri `hedefNoktalar` geçmez → etkilenmez.)

**Nokta sesi (`noktaUzerinde` hover/focus) `srAtla`:** dot butonunun `onFocus`/`onMouseEnter`'ı `konus(numara, { srAtla: true })` → app TTS sayıyı sesli söyler ama `_srBolge`'ye YAZMAZ; ekran okuyucu zaten aria-label'i (`"N. nokta, durum"`) okur. Yönerge-bitince odak ilk noktaya gittiğinde (bkz. §3 adım 5) NVDA için **çift "1" / araya girme** olmaz.

**⚠ ALT + YÖN OKLARI — hücre İÇİNDE noktalar arası gezinme (kullanıcı: "tüm braille hücre sayfalarında alt + yön oklarıyla ileri geri gezinebilmeliyim; 1den 4e alt sağ ok ile gidebilmeliyim mesela"):** `BrailleCell` nokta butonlarına `onKeyDown={noktaKlavye}` — yerleşim `1 4 / 2 5 / 3 6` olduğundan Alt+Sağ/Sol **SÜTUN**, Alt+Yukarı/Aşağı **SATIR** değiştirir (1→4, 4→5, 5→2, 2→1 …). Komşu sabit tablo yerine **`noktaGridYerlesimi`'nden türetilir** (grid değişirse gezinme kendiliğinden uyar). **⚠ DÜZ ok tuşlarına DOKUNULMAZ** — NVDA tarama (browse) modunda okları kendi sanal imleci için tüketir; Alt+ok çakışmaz (doğrulandı: Alt'sız ok `defaultPrevented=false`). **⚠ `preventDefault` KENARDA DA ŞART:** Alt+Sol/Alt+Sağ tarayıcıda **GERİ/İLERİ**dir → kenardaki noktada (dot 1 + Alt+Sol) engellenmezse kullanıcı sayfadan çıkar; bu yüzden `preventDefault` hedef bulunmadan ÖNCE çağrılır, hedef yoksa odak yerinde kalır. Yalnız `tiklanabilir` (buton) noktalarda etkin — `kesfedilebilir` div'ler odak alamaz. **Odak taşımak yeterli:** dot'un `onFocus`'u numarayı söyler (app TTS) + ekran okuyucu `aria-label`'i okur; ek duyuru YOK. Hücre ATLAMAZ (çok hücrelide öteki hücrenin noktaları zaten div). Tarayıcı: /harfler 1→4→5→2→1 + kenar testleri, /rakamlar (2 hücre) hücre1'de kalır, /hucre tam grid turu, Alt+ok'la gezinip tıklama → "1. nokta, dolu" + "Tebrikler" (regresyon yok), konsol temiz.

**⚠⚠ `aynaliEtiket` (TABLET MODU) — YALNIZ ETİKET çevirir, GRID'i ASLA ÇEVİRMEZ (kullanıcı: "metin→brf sayfasında aynalama tablet modunda doğru yapılmıyor"):** Yazı tableti (slate) modunda hücre, kâğıdın ARKASINDAN delindiği için yatay aynalanmalıdır ('a' = nokta 1 → normalde sol üst, tablette **sağ üst** delik). Aynalama İKİ katmanda yapılıyordu: (1) çağıran `aktifNoktalar={tabletDelikAynala(noktalar)}` ile fill verisini çeviriyor ([1]→[4]), (2) `BrailleCell` `aynaliEtiket` ile `noktaGridYerlesimiAyna`'ya geçip sütunları DA çeviriyordu (dot 4 → sütun 1). **İkisi birbirini götürüyordu → tablet modu normal modla BİREBİR aynı görünüyordu** (tarayıcıda ölçüldü: 'a' iki modda da SOL sütun, etiket "1. nokta"). Bileşenin kendi yorumu zaten "bu bayrak yalnız görünür label numarasını değiştirir" diyordu — kod yorumla çelişiyordu. **Fix:** `noktaGridYerlesimiAyna` KALDIRILDI, `noktaGridYerlesimi = noktaGridYerlesimiStd` (daima standart). Aynalanmış `[4]` doğal olarak sağ sütunda çizilir = tabletteki delik konumu; `AYNA_HARITASI` ile etiket "1. nokta" kalır → kullanıcı sağdaki deliği mantıksal 1. nokta olarak okur. **Üç sayfayı birden düzeltir** (hepsi aynı kalıbı kullanıyordu): `Araclar.jsx` metin→brf (satır ~6381), `BelgeBrf.jsx` doc→brf (~764), `BrfOku.jsx` brf→metin (~635). Öğrenme sayfaları `aynaliEtiket` GEÇMEZ (varsayılan false) → etkilenmez (normal mod ölçümüyle doğrulandı). Hücrelerin sağdan-sola akışı AYRI katman (CSS `.araclar-tablet-grid { direction: rtl }`) — dokunulmadı. Tarayıcı (fix sonrası): tablet modunda 'a' **SAĞ** sütun + "1. nokta", 'l' (1,2,3) üçü de sağ; normal mod değişmedi; konsol temiz.

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

### Bitiş ekranı butonları — Karışık Yazma + Sonraki İçerik (CokHucreOkuyucu, TÜM modüllerde)
**Kullanıcı: "bütün etkinliklerde en sonda karışık yazma yönlendirmesi + bir sonraki içerik için tıklayınız butonları, tüm 9 modülde".** `CokHucreOkuyucu` bitti ekranı iki birincil eylem gösterir:
- **Sonraki İçerik** (accent, birincil): `sonrakiDers(pathname)` ([utils/dersAkisi.js](src/utils/dersAkisi.js)) AYNI modüldeki bir sonraki dersi döner → `navigate(yol)`. Son derste null → buton gizli. Akış: Modül 1-7 `MODULLER.ogeler` sırası (son adım = Test/Sınav); **Modül 8** `MUZIK_BOLUMLER`→`/muzik/:slug` + diziler + test; **Modül 9** İngilizce→Almanca→Fransızca `*_BOLUMLER`→`/{dil}/:slug` zinciri.
- ⚠ **Tebrikler mesajı ALTINDA açıklama metni YOK** (kullanıcı: "tebrikler altındaki yazılara gerek yok"): eski "Şimdi yazma zamanı! …" ve "Sırada: {başlık}" satırları KALDIRILDI — yalnız bitiş mesajı + butonlar kalır.
- **Karışık Yazma Etkinliği**: `mevcutSayfaIcinKaynakAnahtar(pathname)` varsa. (Sonraki İçerik varken `btn`, yoksa `btn aktif`.)

**Karışık yazma kaynakları artık İÇ İÇE rotaları da kapsar** ([utils/karisikYazmaKaynaklari.js](src/utils/karisikYazmaKaynaklari.js)): eskiden yalnız düz rotalar (eksikti: kuran-isaretler, mat-sira-sayilari, müzik grup dersleri, yabancı diller). Programatik `iceKayit(yol, …)` ile eklendi. **⚠ `/yazma-karisik/:kaynak` TEK segment kabul eder** → iç içe rotaların `kaynak`'ı EĞİK ÇİZGİSİZ (`/`→`--`; ör. `/kuran-isaretler/cezm-sedde`→`kuran-isaretler--cezm-sedde`, `/muzik/notalar`→`muzik--notalar`). `mevcutSayfaIcinKaynakAnahtar` entry'nin `kaynak` alanını döner (düz rotalarda yol'dan türetilir = geriye uyumlu); `kaynagiAl` önce düz eşleşme, sonra `kaynak` alanına göre arar. Yazılabilir öğesi 0 ise (gecerliItem filtresi) buton gizlenir.

### `src/components/PageHeader.jsx`
Page title component. Carries `.banner-baslik` class → targeted by `SayfaOdakYonetimi`.

**⚠ BAŞLIK HİYERARŞİSİ — h1 uygulama / h2 sayfa / h3 öğe (kullanıcı: "braille öğreniyorum h1, noktalama işaretleri h2, nokta h3 olması daha makbul olur"):** ESKİDEN hem `DesktopShell` banner'ı hem `PageHeader` **h1** kullanıyordu (ders sayfasında masaüstünde İKİ h1) ve o anki öğe (`CokHucreOkuyucu` `yazi`) düz `div` idi (NVDA "H" ile öğeye atlayamıyordu). Yeni düzen: **h1** = "Braille Öğreniyorum" (`DesktopShell` `.ds-header`), **h2** = sayfa başlığı (`PageHeader` `.banner-baslik`), **h3** = o anki öğe (`CokHucreOkuyucu` `yazi`). **⚠ MOBİL h1 BOŞLUĞU:** `.ds-header { display: none }` ile <900px'de shell banner'ı GİZLİ → sayfada h1 kalmazdı. `PageHeader` bu yüzden görsel-gizli bir `<h1 className="sayfa-uygulama-basligi">Braille Öğreniyorum</h1>` render eder; CSS `@media (min-width: 900px) { display: none }` ile masaüstünde tamamen kalkar → **her genişlikte TAM BİR h1** (tarayıcıda 478px ve 1280px'de doğrulandı: H1 → H2 → H3). **Odak akışı ETKİLENMEZ:** `SayfaOdakYonetimi` sırayla `[data-sayfa-odak]` → `.banner-baslik` (SINIF, etiket değil) → `h1, h2` fallback'ine bakar; `.banner-baslik` her PageHeader'da var → sr-only h1 fallback'i asla çalmaz. **Görünüm DEĞİŞMEZ:** `.banner-baslik` kendi font/renk kurallarını taşır (`h1,h2,h3 { color }` kuralını ezer); `yazi` h3'ünde `fontSize`/`fontWeight`/`margin` zaten inline (ölçüldü: 27.2px / 700 / margin 0, `tabIndex=0` odak korunur). AnaMenu (`/` ve `/modul/:id`) kendi layout'unda zaten h1 (uygulama adı) + h2 (modül başlığı) — dokunulmadı; oradaki üçüncü h2 "Hoş geldiniz" `TanitimTuru` **modalına** aittir (ayrı diyalog bağlamı, sorun değil).

### `src/components/BrailleGrid.jsx`
Colored grid of braille cells. Color-codes cells by semantic type:
- letter/default → blue (`#3b82f6`)
- kisaltma/kök/parça/ayırma → red (`#ef4444`)
- noktalama → green (`#10b981`)
- islem/bölük → purple (`#7c3aed`)
- isaret → black (`#000000`)
- birim → CSS var `--braille-noktalama-fill`

### `src/components/CokluTest.jsx` — TÜM modüllerin TEK test/sınav bileşeni
General-purpose multi-category quiz. Shuffles 10 random questions from a source.
**⚠ GİRİŞ MODELİ = Karışık Yazma (kullanıcı: "test perkins klavye + mobil yatay klavye desteklemeli, karışık yazmada vardı"):** `BrailleKlavye` (inline `.klavye-inline` + mobil yatay `.klavye-popup`), akor (chord) girişi, `siralikTiklama`+`onTikla`/`onHucre` doğrulama, **ses efekti dönütleri** (doğru tamamlama→`dogruSesi()` ding; yanlış→`hataBildir` buzz), sesli yönerge + kilit/`yonergeTekrar`, Tablet Modu. ESKİ "hücre noktalarına tek tek dokun" (BrailleCell) modeli KALDIRILDI — YazmaKarisik modeline taşındı.
```jsx
<CokluTest
  baslik="Modül N Test / Sınav"
  kaynaklar={{ anahtar: { etiket, kategori, veri: [{ ad, ariaAd?, ipucu?, hucreler: number[][], ...sesAlanları }] } }}
  ogeSesiCal={(item, { onEnded }) => …}  // opsiyonel ses kaydı (Kur'an harf/hece dosyası, Müzik piyano)
  ogeSesiDurdur={() => …}                 // opsiyonel
  ogeSesiVarMi={(item) => bool}           // yalnız sesi olan öğelerde ses çal/buton göster (Kur'an: harf/hece var, hareke/tecvid yok)
  sesPrompt                                // soru gelince ses otomatik çalar (işitsel ipucu)
  sesButonEtiketi="Sesi Dinle"            // "🔊 Sesi Dinle"/"Nota Sesi" butonu
  sesIzin={{ aciklama, butonMetni, ilkSesUrl }}  // verilirse önce SesIzinEkrani (Kur'an)
/>
```
**Arapça `ad`** (Kur'an testi) `yazma-metin`'de `/[؀-ۿ]/` ile Amasya fontu alır.
**TÜM 9 modül test sayfası bu bileşeni kullanır** (ortak, kopya YOK): Modül 1 `Test.jsx`, M2 `TestKisaltma`, M3 `TestNoktalama`, M5 `TestKuran` (ses kaydı+izin), M6 `TestMatematik`, M7 `TestFen`, M8 `TestMuzik` (piyano sesi), M9 her dil için `TestYabanci` (dil prop). Hepsi yalnız `kaynaklar` (+Kur'an/Müzik'te ses props) geçen ince sarmalayıcıdır. **Modül 9 testi DİL BAZLI** (kullanıcı: "İngilizce kendi içinde, diğer diller kendi içinde"): rota `/ingilizce|almanca|fransizca/test` (App.jsx, `:slug`'dan ÖNCE) + her dil menüsünde (`*BrailleMenu.jsx`) "Test / Sınav" kartı; `TestYabanci` kategorileri = dilin `*_BOLUMLER` bölümleri. **Modül 4 (Yazma) testi YOK** (yazma etkinliklerinin kendisi değerlendirme; kasıtlı). **Modül 10 (BRF araçları) test kapsamı dışı.**

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

**⚠ Kart `aria-label` ÖĞRENME MODU gibi okunur — `hucreYonergeMetni` (kullanıcı: "okuma modunda kutu üzerine gelince öğrenme modundaki gibi yönerge okumalı"):** Kart `aria-label` eskiden `"{ad}. Braille noktaları: 2, 5. ..."` (ham rakam) idi → NVDA "iki, beş" okuyordu. Artık `hucreYonergeMetni(hucreler)` (= `nlDan` ile "2. ve 5. **noktalardan oluşur**"; çok hücrede "1. hücre …, 2. hücre …") → `"{ad}. 2. ve 5. noktalardan oluşur. Öğrenme modunda açmak için etkinleştirin."`. Aynı metin `okumaOgesiniSeslendirVeCal` `konus`'una da (app TTS, `srAtla`) verilir → görsel/işitsel tutarlı. **Kart `onFocus`→`konus` `srAtla:true`** (app TTS söyler, `_srBolge`'ye yazmaz) → NVDA yalnız `aria-label`'i okur, çift değil. (Okuma moduna girince odak ilk karta — bkz. §3 okumaModu effect.)

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
- **Keyfî hücre filtresi — HÜCRE BAZLI (`aranamaz` Set'i):** Bazı girişlerde bir kısım hücre KEYFÎdir (örnekteki sayı/harf, geometrideki nokta adı); arama yalnız **aranabilir** (keyfî-olmayan) hücreyi içeren pencerelerde geçerli sayılır (`ilkAranabilirIndeks`/`aranabilirPencere`; pencere TAMAMEN keyfî ise — ör. yalnız nokta adları — eşleşmez). `ekle`'de `aranamaz` Set'i kurulur:
  - **`ornek: true`** (İfade Okuma `/mat-ifadeler` tüm dizi; Özel İşaretler `Tarih Yazma`/`Rumuzlu İfadeler` = `OZEL_ORNEK_ADLARI`) → aranamaz = `KEYFI_ANAHTARLAR`'daki hücreler (= `RAKAM_ANAHTARLARI` `3456`+üst/alt rakam **∪** `HARF_ANAHTARLARI` k-z,çğöşü). Rakam/harf araması tarihi/işlemi/rumuzu getirmez; işaret/ayraç/gösterge (bağ `36`, büyük harf `6`, `+`=`56 26`) örneği yine bulur.
  - **`ornek: 'geometri'`** (`/mat-geometri`, `/[A-Z]{2}/.test(sembol)` → doğru AB/açı ABC/üçgen ABC/diklik…) → aranamaz = SADECE keyfî NOKTA ADI harfleri (`geometriNoktaAdiIndeksleri`: harf/büyük-harf işaretinden ⠰`56`/⠠`6` SONRAKİ harf hücreleri). **Şekil sembolleri ARANABİLİR kalır** → açı `246`, üçgen `1256 1245`, diklik `236` ile bulunur (kullanıcı: "açı üçgen diklik ile de bulmalı, çakışma sorun değil"). çap R/yarıçap r gibi tek-harfli semboller `ornek` DEĞİL.
  - Sembol DERSLERİ (`/mat-rakamlar`,`/mat-semboller`,`/harfler`…) `aranamaz` yok → etkilenmez (eksik arama yok). NOT: kimya alt-simgeleri anlamlı sayıldığından kapsam dışı.
- `sozlukAra(girdi)` → **metin (sözlük) araması**: `etiket`+`altEtiket`+`esler`(eş anlamlı)'da arar. Tek harf ("a") → yalnız `etiket===q`/`esler` (A harfi/kısaltması); **2+ harf → tam-kelime VEYA önek (`startsWith`) eşleşmesi** (kullanıcı: "au yazınca auc/auch da çıksın"; kısa sorgu uzun sorgunun ÜST KÜMESİ — "au"→au/auf/aus/auch); 3+ harfte ayrıca geniş alt-dizi (`birlesik.includes(q)`, ör. "arp"→çarpma). (Önek 2+ harfte açık; geniş alt-dizi gürültüyü önlemek için 3+ harfte kalır.) **Eş anlamlılar** (`ARAMA_ES_ANLAMLILAR`, etiket→liste, `ekle`'de `esler` olarak takılır): veri işareti ADIYLA tanımlı ("+"→"artı") ama kullanıcı işlemle arayabilir → `artı`:[toplama,topla…], `eksi`:[çıkarma…], `çarpma`,`bölme`,`eşittir`. Anahtar tam-etiket (fen "artı (yük)" etkilenmez). Yalnız sözlük aramasında; braille'i etkilemez. `eslesenIndeksler: []` (hücre vurgusu yok). `ornek` keyfî-filtresi UYGULANMAZ. **Sembol sorgusu (kullanıcı: "> < + = ? gibi semboller sözcük aramada çıkmıyor"):** `q` harf/rakam dışı bir karakter içeriyorsa (`/[^\p{L}\p{N}\s]/u`) → sembolün KENDİSİ "yazılış" olarak **yalnız `altEtiket`'te** ham alt-dizi aranır (`metinNormalle(altEtiket).includes(q)`). Sebep: sembol-derslerinde sembol karakteri `altEtiket=s.sembol`'de; `etiket` ise ADI ("büyüktür"/"artı"). ESKİDEN bulunamıyordu çünkü (a) `etiket===q` ada bakar, (b) `q.length>=2/>=3` eşikleri tek-karakterli sorguyu eler, (c) `KELIME_AYIRAC` sembol karakterini söker. **Neden `etiket`'te DEĞİL yalnız `altEtiket`'te:** kök kısaltma etiketi gösterim amaçlı "+" içerir ("5+ba") → `+` araması 58 kısaltmayı getiriyordu; ifade etiketindeki "/"/"=" de notasyon. `etiket`'teki tek-karakterli gerçek semboller (`?`/`:`/`;` — braille.js NOKTALAMA `etiket:n.isaret`) zaten `etiket===q` ile bulunur. Sonuç temiz: `+`→artı(Mat)+artı yük(Fen), `>`→büyüktür+aksent(müzik), `=`→eşittir(Mat+Fen). (Sınırlama: glifi etikette çizili müzik nüansı "Şişirme nüansı (<>)" `<`/`>` ile gelmez — adıyla/«swell» ile bulunur.)
- `noktaCumlesi([1,2,3])` → "1, 2 ve 3. noktalar" (erişilebilir okuma).
- Her girişte `modulKonu` (kartta gösterilen konu adı): `MODUL_KONU` map ("Modül 8"→"Müzik" …) **AMA** Modül 9 dilleri `ekle`'de `modulKonu` override ile DİL adını alır (İngilizce/Almanca/Fransızca), "Yabancı Dil" DEĞİL. Gruplama/filtre sırası `KONU_SIRASI` (diller ayrı kalemler; `KuranIsaret…` değil).

**`AramaSayfasi.jsx`** — `PageHeader baslik="Braille Arama"` + `input` + yanında **mod `<select>`** (`.arama-mod-secim`, `.arama-girdi-satir` flex; varsayılan **"Braille arama"**, diğeri **"Sözlük ile arama"**). `mod` state ('braille'|'sozluk'); mod değişince sorgu+filtre temizlenir, input'a odaklanılır. Braille modu: `inputMode=numeric`, 1-6+boşluk+Perkins süzme, `aramaYap`. Sözlük modu: `inputMode=text`, serbest metin (`.arama-girdi.metin` sola-yaslı), `sozlukAra`; yönerge (`YONERGE_SOZLUK`) "ad/anlam/yazılış yazın" der. + `#arama-ozet` (`role="status" aria-live="polite"` → "… için N sonuç bulundu"). Sonuçlar `<ul>` içinde buton; her butonun `aria-label`'i tam açıklama taşır ("L, ilgi. Modül 2, Bir Harfli Kısaltmalar. tek hücre, 1, 2 ve 3. noktalar. Eğitime gitmek için etkinleştirin."), mini braille hücreleri `aria-hidden` (eşleşen hücre `.vurgu`). **2'den fazla hücreli sonuç** `.cok-hucreli` sınıfı alır → kart dikey (`flex-direction: column`): braille üstte tek satır, bilgiler altta (yan-yana düzendeki kaymalar önlenir); hücre satırı `flex-wrap` ile taşmaz. Kartta üç etiket: `.arama-sonuc-modul` (konu adı — Müzik/Matematik, vurgulu) + `.arama-sonuc-modul-no` (Modül N, ikincil) + `.arama-sonuc-kategori`. Sonuç listesi `repeat(auto-fill, minmax(260px, 1fr))` + govde `max-width: 760px` → yer varsa **2 sütun**, dar ekranda tek sütun.

**Çok hücre arama (boşlukla):** Yönerge boşluk kuralını içerir ("Birden fazla hücre aramak isterseniz hücreler arasına boşluk koyarak devam edin. Örnek: 123 145."). Girdi süzgeci 1-6 rakamları **+ boşluk** kabul eder (çoklu boşluk teke, baş boşluk atılır). Özet "… ardından …" ile çoklu hücreyi okur; eşleşen tüm hücreler kartta `.vurgu`.

**Perkins tuşları:** Girdi süzgeci `PERKINS_TUS` ile **F D S J K L → 1 2 3 4 5 6** (BrailleKlavye.jsx ile aynı eşleme) çevirir; kullanıcı Perkins tuşuyla yazarken anında rakama döner (input rakam gösterir). Yönergede belirtilir.

**Filtre çipleri modern/kompakt:** `.arama-filtre-cip` `.btn`'i kullanır ama `min-height/min-width: 0`, `box-shadow: none`, küçük padding/font ile büyük erişilebilir-buton boyutunu ezer → tek-tip ~28px pill. Sayı `.arama-filtre-adet` rozet; aktif çipte rozet şeffaf.

**Bölüm filtresi + gruplama:** Üstte konu çipleri (`.arama-filtre-cip`, `aria-pressed`, tek-seçim; "Tümü" + sonuçta bulunan her konu, sayılarıyla) — tıklanınca o bölüme filtreler. `aktifFiltre = filtre && mevcutKonular.includes(filtre)` → sorgu değişip seçili konu sonuç vermezse otomatik "Tümü"ye düşer. Sonuçlar konu başlıkları (`<section><h3 class="arama-grup-baslik">{konu} {N} sonuç</h3>`) altında, `KONU_SIRASI` sırasıyla gruplanır; her grup kendi 2-sütun `<ul>`'u.

**⚠ SCROLL TUZAĞI:** `.page > .page-mid` (paylaşılan, specificity 0,2,0) `justify-content: center` uygular. Arama sonuçları taşınca **center** üstteki sonuçları kapsayıcının üst kenarının ÜSTÜNE iter → scroll ile ulaşılamaz (klasik flex+center+overflow hatası). Fix: `.page > .page-mid.arama-govde` (0,3,0) ile `justify-content: flex-start; align-items: stretch` — içerik yukarıdan başlar, normal scroll. Düşük-specificity `.arama-govde` yetmez (ezilirdi). Tıklayınca `navigate(yol)` → ilgili eğitim sayfası. Giriş noktaları: `DesktopShell` banner'ı (yalnız ≥900px görünür) + `AnaMenu` `header-aksiyon` + **`PageHeader` `header-aksiyon`** (`.arama-btn`, `Ikon.arama`). Rota: `App.jsx` `/arama`. **⚠ MOBİL (kullanıcı: "mobil görünümde arama butonu görünmüyor, arama mobilde de olacak"):** DesktopShell banner'ı `<900px`'de `display:none` → ders sayfalarında (DesktopShell) mobilde arama butonu YOKtu (AnaMenu kendi `header-bar`'ı ile mobilde gösteriyordu). Fix: arama butonu `PageHeader`'a (27 ders sayfasının `header-bar`'ı, mobilde görünür tek header) eklendi; masaüstünde banner'da zaten olduğundan `.ds-wrapper .header-bar .arama-btn { display:none }` ile gizlenir (gorunum-btn paterni) → masaüstünde tek arama butonu. ≤420px'de 36px'e küçülür (diğer header butonlarıyla aynı). Tarayıcı: mobil ders sayfasında görünür+tıklanır (→/arama), masaüstünde tek buton. **+ Mobilde başlık SOLA yaslı (kullanıcı: "mobilde başlıklar bannerda sola yaslı olsun, görünmüyor çünkü"):** `PageHeader` başlığı (`.banner-baslik`) inline `textAlign:center` ile ortalıydı → ≤420px'de sağdaki absolute aksiyon butonlarının (arama eklenince daha dar) altında kalıp görünmüyordu. Fix: `@media (max-width:420px) .header-bar .banner-baslik { text-align:left !important }` (inline center'ı ezmek için `!important`) → başlık başı geri-butonundan sonra görünür, sağ uç aksiyon gradyanı altında solar.

---

## 5. App.jsx — Routing & Focus Management

### `SayfaOdakYonetimi` component
Manages NVDA focus on route change:
- **Entering any page:** focus `[data-sayfa-odak]` **if present**, else `.banner-baslik` or `h1/h2` inside `#main .ds-content`. ⚠ **Sayfa kendi giriş odağını belirtebilir (`data-sayfa-odak`):** `CokHucreOkuyucu` yönerge sr-only bölgesine `data-sayfa-odak="yonerge"` koyar → modülden derse girince NVDA **önce yönergeyi** okur (başlık/gereksiz detay DEĞİL). Kullanıcı: "modülden butona tıklayıp açınca yönerge ilk okumuyor, başlık vs gereksiz detaya odaklanıyor". ESKİDEN hep başlık (`.banner-baslik`) odaklanıyordu → NVDA başlığı okuyup +266ms sonra dot'a atlıyor, yönerge (polite bölge) iki odak olayı arasında **gömülüyordu**. (data-sayfa-odak bölgesi İLK render'da hazır olmalı — bkz. §3.) ⚠ **Ses KAYITLI sayfalarda (`ogeSesiCal` fonksiyon) `data-sayfa-odak` KONMAZ** (`CokHucreOkuyucu`: `typeof ogeSesiCal === 'function' ? undefined : 'yonerge'`) → o sayfalar başlığa düşer (kullanıcı: "ses kaydı olanlar hariç"). ⚠ **REFRESH (ilk yükleme) `SayfaOdakYonetimi`'nde ATLANIR** → giriş odağını orada VEREMEZ; `CokHucreOkuyucu` kendi dot-odak effect'inde aktif odaklar (bkz. §3 `girisAni`).
- **Returning to `/`:** focus `.modul-yan .modul-sekme.aktif`
- **Modül route (`/modul/:modulId`):** `pathname.startsWith('/modul/')` → focus `.modul-icerik-baslik` (seçilen modülün içerik başlığı; modulSec'in odak niyetiyle aynı).
- **First load** (`oncekiYol.current === null`): skip — prevents StrictMode double-fire
- ⚠ **Yerleşik odaklanabilir hedeflere (`input/select/textarea/button/a`) `tabindex="-1"` EKLENMEZ** (`!yerlesikOdaklanabilir` guard) — aksi halde Tab sırasından çıkarlar. Başlık/`div` gibi öğelere -1 hâlâ eklenir (focus alabilsinler). Gerekçe: **Arama girdisi** `data-sayfa-odak="arama"` ile giriş odağı olur (aşağı) ama klavye Tab erişimi korunmalı.
- ⚠ **Arama (`/arama`) girdiye odaklanır (kullanıcı: "aramada ekran okuyucu açıkken yazamıyorum"):** `AramaSayfasi` input'una `data-sayfa-odak="arama"` + mount effect'i (`requestAnimationFrame(() => girdiRef.current.focus())`) → sayfaya girince **VE yenilemede** (refresh: SayfaOdakYonetimi atlar → mount effect kapsar) odak girdiye gelir → NVDA **form/odak moduna** geçer, kullanıcı hemen yazar. ESKİDEN odak gövde/başlıktaydı → NVDA tarama (browse) modunda kalıyor, rakam tuşları (1-6) sonuç başlıklarına (`<h3>`) atlama yapıp girdiye YAZMIYORDU.

### Modül seçimi ve Hızlı Dolaşım Modu ARTIK ROUTE'lu — geri tuşu çalışır (kullanıcı: "hızlı dolaşım moduna route ekle, modüllerde de route olsun, alt geri tuşuyla geri gidilemiyor")
**⚠ MODÜL ROUTE'u `/modul/:modulId`:** ESKİDEN modül seçimi yalnız `aktifModul` state (+ sessionStorage) idi → adres çubuğu değişmiyor, geri tuşu çalışmıyordu. Artık **`<Route path="/modul/:modulId" element={<AnaMenu />} />`** (App.jsx). İKİ giriş noktası da bu route'a gider: (1) `AnaMenu.modulSec(id)` → `navigate('/modul/'+id)` (+state+sessionStorage+konus korunur); (2) `DesktopShell` sidebar modül sekmesi `onClick` → `navigate('/modul/'+m.id)` (eski `navigate('/')` değil). `AnaMenu` `useParams().modulId` okur, state ile senkronlar (`useEffect([modulId])`); `/` → `modulId` undefined → varsayılan (sessionStorage/modul1). ⚠ **Karşılama TTS'i guard'lı:** welcome effect başında `if (modulId) return` → `/`↔`/modul/x` remount'unda "Ana menü…" tekrar okunmaz (yalnız `/`'da). ⚠ **id'ler görünen numarayla EŞLEŞMEZ** (`modul3`=görünen "Modül 2" vb.) — route dahili id kullanır (`/modul/modul3` → "Modül 2"). SayfaOdakYonetimi `/modul/` dalı `.modul-icerik-baslik`'e odaklar (yukarı). `/`↔`/modul/x` farklı route → AnaMenu remount; `/modul/a`↔`/modul/b` aynı route → remount YOK. **⚠⚠ DesktopShell SHELL'İ `/modul/`'de DE ATLAMALI (kullanıcı: "ders içine tıklayıp farklı modüle tıklandığında sayfa içinde sayfa açılıyor, yanda iki menü"):** DesktopShell TÜM route'ları sarar (App.jsx:175) ve ana sayfada shell'i atlar. Guard `if (location.pathname === '/')` idi → `/modul/x` AnaMenu'yü (kendi layout+sidebar) render ederken DesktopShell shell'i (banner+sidebar) DE sarıyor → İKİ menü / sayfa-içinde-sayfa. Fix (DesktopShell.jsx:102): `if (pathname === '/' || pathname.startsWith('/modul/')) return <>{children}</>`. AnaMenu render eden HER route bu istisnada olmalı. (Tarayıcıda: /modul/modul3 → `.modul-yan` 1, `.ds-header`/`.ds-sidebar-shell` 0; ders→modül sekmesi→/modul/modul1 tek menü.)

**⚠ HIZLI DOLAŞIM (OKUMA) MODU = URL QUERY PARAM `?gorunum=dolasim`:** ESKİDEN `okumaModu` state idi. Artık `CokHucreOkuyucu` `useSearchParams` ile türetir: `const okumaModu = searchParams.get('gorunum') === 'dolasim'` (state DEĞİL) → **20+ sayfa otomatik kapsanır**, adres çubuğunda görünür, tarayıcı/Alt geri tuşu moddan çıkar. **Aç:** `okumaModunaGec` → `setSearchParams(...set('gorunum','dolasim'))` **push** + `okumaPushladikRef=true`. **Kapat (`okumaModundanCik`):** biz push'ladıysak `navigate(-1)` (temiz pop, Alt-geri ile aynı), değilse (deep-link/refresh) `setSearchParams(...delete,{replace:true})`. 4 çıkış noktası bunu kullanır: `okumaOgesiSec` (kart seç → setIndeks + çık), `onKapat` prop, "Öğrenme Moduna Dön" butonu, tarayıcı geri. `okumaModu`'ya bağlı effect'ler/render türetilmiş boolean ile aynen çalışır. ⚠ **`SayfaOdakYonetimi` yalnız `pathname`'e bakar** (query'ye DEĞİL) → okuma modu param'ı odak akışını bozmaz; §3'teki okuma↔öğrenme odak effect'i (`[okumaModu,bitti]`) sahibidir (yani §3'teki "Geçiş rota DEĞİŞTİRMEZ" notu artık "query değişir ama pathname sabit → SayfaOdakYonetimi yine çalışmaz" olarak geçerli). Yeni derse `navigate(yol)` ile geçişte search taşınmaz → param düşer. (Tarayıcıda doğrulandı: modül sekmesi→`/modul/modul1`; harfler→okuma butonu→`?gorunum=dolasim`+29 kart; geri tuşu ve "Öğrenmeye Dön"→öğrenme modu; konsol temiz.)

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
dogruSesi()                // rising two-note "ding" — ÖĞE/HÜCRE GEÇİŞİ (transition); gated by sesEfektiAcik
noktaSesi()                // single-note "blip" — TEK DOĞRU NOKTA dokunuşu (dingden AYRI); gated by sesEfektiAcik
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
konus(bittiMesaji, { srAtla: true }); // TTS only (app TTS açıksa); NVDA için → bitti mesajına ODAK
```
Without this pattern, the tebrikler text stays in `_srBolge` and NVDA reads it after the ghost
"Ana sayfaya dön" button at the end of the virtual buffer (duplicate).
**⚠ Bitti mesajı NVDA için ODAKLA okutulur (`aria-live` DEĞİL — kullanıcı: "tebrikler sahnesinde ekran okuyucu tebriklere odaklanamıyor"):** `.instruction.success` div'i `ref={bittiMesajRef}` + `tabIndex={-1}`; ayrı bir effect (`[bitti, okumaModu]`) rAF ile `bittiMesajRef.current.focus()` → ekran okuyucu mesajı okur. Bitti ekranına rota değişmeden (`setIndeks`) geçildiğinden `SayfaOdakYonetimi` devreye girmez → odak burada verilir. **`role="status" aria-live="assertive"` KALDIRILDI**: odak-okuması ile çift duyuru olmasın (yeni mount edilen assertive bölge bazı NVDA'larda okunur → odak + live = çift). TTS açıksa bitti effect'i `konus(bittiMesaji)` ile ayrıca söyler.

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
dokunmaKapanisi(hucreler)            // yönergenin KAPANIŞ cümlesi, TEKİL/ÇOĞUL uyumlu
```
Imported by `CokHucreOkuyucu` and any page that builds dot-description strings
(`RakamEgitimi`, `MatematikRakamEgitimi`, `MatematikSiraSayilari` — they import `nlDan as nl`).

**⚠ `dokunmaKapanisi` — TEK NOKTADA TEKİL + "sırayla" DÜŞER (kullanıcı: "tek nokta ise noktalarına değil noktasına tıklayınız gibi bir ifade olmalı"):** Kapanış cümlesi HER YERDE sabit `"Lütfen bu noktalara sırayla dokunun."` idi → tek noktalı öğelerde ("A" `[1]`, kısaltma "a" `[1]`, Kur'an "elif" `[1]`, virgül `[2]`…) hem ÇOĞUL hem de anlamsız "sırayla" okunuyordu. `dokunmaKapanisi(hucreler)` **TÜM hücrelerin nokta sayısını TOPLAR**: `1` → `"Lütfen bu noktaya dokunun."`, `>1` → `"Lütfen bu noktalara sırayla dokunun."`, `0` (hücresiz öğe) → `''`. `number[][]` (çok hücreli) VE `number[]` (düz) girdiyi kabul eder. ⚠ Toplam ÖNEMLİ: `[[3],[3],[3]]` (Sıra Noktalar) 3 ayrı dokunuş = ÇOĞUL, hücre başına 1 nokta olması TEKİL yapmaz. **Kullananlar:** `CokHucreOkuyucu` (3 dal: `tamYonergeMetni`+`noktalariSeslendir`, `kategoriAdi`+`noktalariSeslendir`, `kategoriAdi` düz) + sayfa içi sabit `tamYonergeMetni`'ler (`KuranHarfEgitimi`, `RakamEgitimi`, `MatematikSiraSayilari`). **AYRICA `yonergeFormati="sirayla"` dalı** (`MuzikBrailleSayfa`) tek noktada `"Lütfen sırayla …"` yerine `"Lütfen …"` der (`noktaListesi` tekil/çoğul uyumunu zaten kendisi kurar). ⚠ **Yeni kapanış cümlesi yazma — bu yardımcıyı çağır.** Denetim: `muzik.js` sabit metinlerinde tek-noktalı-çoğul uyumsuzluğu YOK (0 bulgu). Tarayıcı: /harfler "A harfi, 1. noktadan oluşur. Lütfen bu **noktaya** dokunun." / "C harfi, 1. ve 4. noktalardan… **noktalara sırayla**"; /kisaltma-bir-harfli "a" TEKİL; /kuran-harfler "elif" TEKİL; /rakamlar (4+1 nokta) ÇOĞUL; /noktalama-isaretleri "Sıra Noktalar" (3×1) ÇOĞUL.

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
**⚠⚠ TARAYICI SESLENDİRME (Web Speech TTS / `sesAcik`) KALDIRILDI — daima `false` (kullanıcı: "tarayıcı seslendirme iptal edilecek, ayarlardan da kaldır, sadece içerik ekran okuyucu okuyacak"):** İçeriği artık YALNIZ ekran okuyucu (NVDA) okur. `sesAcik` şu üç yerde zorla kapalı tutulur: (1) `VARSAYILAN.sesAcik: false`; (2) `yukle()` sonunda `okunan.sesAcik = false` (eski kayıtlı `true`'yu yok sayar); (3) `ayarGuncelle` `yama`'dan `sesAcik`'ı siler (dışarıdan açılamaz). Böylece HER `ayarlariAl().sesAcik` `false` → `konus()` (ses.js) daima "TTS kapalı" dalını alır (Web Speech konuşmaz, yalnız `_srBolge` aria-live'a yazar → NVDA okur). **UI kaldırıldı:** Ayarlar sayfasındaki "Sesli yönerge" toggle + "Konuşma hızı" slider + "Sesi Dene" (kart artık "Ses Efektleri") ve müzik editörü toolbar'ındaki "Tarayıcı seslendirme" toggle. **⚠ KUR'AN/MÜZİK SES KAYITLARI ETKİLENMEZ** (kullanıcı: "kuran ve müzik modüllerinde ses kayıtları çalışmaya devam edecek"): ses kayıtları `ogeSesiCal` (gerçek dosya/piyano) ile çalar, `sesAcik`'a DEĞİL `ogeSesiOnceCal && (ogeSesiHerZaman||ogeSesiAktif) && typeof ogeSesiCal==='function'`'a bağlıdır (CokHucreOkuyucu ~373); piyano da `notaOdakPiyano`/`tonejsSes` ile ayrı. `sesEfektiAcik` (ding/buzz) da TTS'ten ayrı, korunur. **⚠ Kod NOTU:** §3'teki tüm "App TTS AÇIK" dalları (narration lock `onSon`, giriş dot-odak, srAtla) kodda DURUYOR ama `sesAcik` daima false olduğundan yalnız "App TTS KAPALI (NVDA)" yolu ÇALIŞIR. `konusmaHizi` alanı ayarlarda kalır (artık kullanılmaz, zararsız).

**⚠ "Okuma Modu" → "Hızlı Dolaşım Modu" (kullanıcıya görünen + ekran okuyucu; kullanıcı: "okuma modu butonu hızlı dolaşım modu olarak; ekran okuyucu 'hızlı dolaşım moduna geç' desin"):** `OkumaModuButonu` `aria-label="Hızlı dolaşım moduna geç"` + `title="Hızlı dolaşım modu"`; OkumaModu paneli kicker "Hızlı dolaşım modu"; giriş `konus` "…hızlı dolaşım modu. N öğe…" (NVDA `_srBolge`'den okur); CokHucreOkuyucu üst etiket "Hızlı dolaşım modu: N öğe". **İç tanımlayıcılar DEĞİŞMEDİ** (state `okumaModu`, CSS `.okuma-modu-*`, bileşen `OkumaModuButonu`/`OkumaModuListesi`, fonksiyon `okumaModunaGec` — kullanıcıya görünmez). Dönüş butonu "Öğrenmeye Dön" aynı.

**Settings fields:**
- `konusmaHizi` 0.5–1.5 (default 0.95) — ⚠ artık kullanılmıyor (Web Speech TTS kaldırıldı); ayarlar objesinde zararsız kalır
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

**⚠ İFRAME/KISA YÜKSEKLİK KIRPMA — `.page > .page-mid` + `.cell-row` (kullanıcı: "sayfamı iframe ile yerleştirince iki harfli kısaltmalarda hücreler kesiliyor, bazılarında olmuyor"):** İki ayrı hata birlikte üst-kırpmaya yol açıyordu (yalnız içerik iframe'e SIĞMAYINCA — daha uzun sayfalarda; sığanlarda olmuyordu). (1) **`.page > .page-mid` `justify-content: center` + `overflow-y:auto`** → içerik taşınca `center` bloğu ortalayıp ÜSTÜ görünür alanın üstüne itiyor, scroll ile ulaşılamıyordu → **`justify-content: safe center`** (sığınca ortalar, TAŞINCA flex-start gibi üstten hizalar → üst kırpılmaz, scroll edilir). (2) **`.cell-row.fit` `overflow-x:auto`**, flex item'ın `min-height:auto`'sunu **0** yapıyor → kısa flex-kolonunda cell-row 0 yüksekliğe ÇÖKÜP `align-items:flex-end` ile hücreler yukarı taşıp kırpılıyordu (cell 249px ama cell-row 0) → **`.cell-row { flex-shrink: 0 }`** (doğal yükseklik korunur, page-mid scroll eder). İKİSİ birlikte gerekli. Sığan yükseklikte davranış değişmez. (Tarayıcı: 420px'de cell-row 0→249, ilk nokta kırpık değil scroll'lu; 700px'de içerik sığar, kırpma yok.)

**⚠ NOKTA BOYUTU TUTARLILIĞI — `.cell-row.fit` vs `:root --dot-size` (kullanıcı: "iki farklı sayfa tasarımı; RakamEgitimi noktaları büyük, HucreTanima küçük; boyutlar aynı olmalı"):** İki farklı boyut kaynağı ayrışıyordu: **HucreTanima** BrailleCell'i **`.cell-row` sarmalayıcısı OLMADAN** render eder → `:root --dot-size` kullanır → `@media (max-height: 760/640/540px)` ile **kısa ekranda 56/48/40px'e düşer**. **CokHucreOkuyucu** (RakamEgitimi vb.) `.cell-row.fit` kullanır → kendi **genişlik-tabanlı** clamp'i (`--dot-size: clamp(18px, (100vw-64)/(hucre*2.6), MAX)`) `:root`'u ezer ve **yükseklikten etkilenmez** → kısa iframe'de 64px kalıp HucreTanima'dan büyük görünürdü. Fix: `.cell-row.fit` clamp max'ı **`var(--dot-max)`** (varsayılan 64px, lowVision 90px) yapıldı ve **aynı `max-height` media query'lerinde** `--dot-max` `:root --dot-size` ile eşit değerlere düşürüldü (56/48/40; lowVision 78/64/52). Böylece her yükseklikte iki yol AYNI boyutu verir. (Tarayıcı: h=600 ikisi de 48px, h=720 ikisi de 56px, h≥761 64px.) Yeni sayfa eklerken tek hücre BrailleCell'i mümkünse `.cell-row.fit` içine sar ki tutarlı kalsın (HucreTanima tarihsel olarak sarmıyor; media query eşitlemesi bu yüzden gerekli).

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

**⚠ `tamYonergeMetni` + `noktalariSeslendir` → nokta kompozisyonu SONA EKLENİR (kullanıcı: "kısaltmalarda yönergede sadece ilk hücre söylenip bırakılıyor"):** 5 kısaltma sayfasının HEPSİ her öğeye `tamYonergeMetni` (özel açıklama, ör. `'"ba" hecesi.'` / `'A harfi tek başına… "aynı" okunur.'`) koyar. ESKİDEN `kelimeYonergeMetniAl` `if (oge.tamYonergeMetni) return ...` ile **erken dönüp** `noktalariSeslendir` nokta üretimini ATLIYORDU → yönerge noktaları söylemeden bırakıyordu (harfler/rakamlar noktaları söylerken kısaltmalar söylemiyordu). Fix: `tamYonergeMetni` varsa → `noktalariSeslendir` İSE `${tamYonergeMetni} ${noktaKompozisyonMetni()} Lütfen bu noktalara sırayla dokunun.` (tek/çok hücre `noktaKompozisyonMetni` helper'ı; çok hücrede "1. hücre …, 2. hücre …"), DEĞİLSE eski gibi düz `tamYonergeMetni` (rakamlar/müzik gibi noktalariSeslendir'siz sayfalar ETKİLENMEZ — kendi metni zaten noktalı). Tarayıcı: hece "…kullanılamaz. 2., 3. ve 5. noktalardan oluşur. Lütfen…", iki-harfli "…beden… 1. hücre 1. ve 2. noktalardan, 2. hücre 1., 4. ve 5. noktalardan oluşur…"; harfler/rakamlar değişmedi.

**⚠ `kategoriAdi` dalı (noktalariSeslendir'siz sembol sayfaları) da SÖZLÜ nokta GARANTİ EDER (kullanıcı: "başka sayfalarda da var, tüm modüllerde kontrol et"):** `isarettenOgeye` kullanan sembol sayfaları (`NoktalamaIsaretleri`/`OzelIsaretler`/`MatematikSembolEgitimi`/`MatematikOlcuEgitimi`/`MatematikGeometriEgitimi`/`FenSembolEgitimi`/`MuzikSembolEgitimi`/`YabanciBrailleSayfa`/`KuranHarekeEgitimi`…) yönerge `detay`'ını `yonergeDetay` (= veri `aciklama`/`okumaOzeti`) ile kurar. Çoğu açıklama ya HİÇ nokta demiyor (mat-ölçü "mm harfleriyle yazılır") ya da **KISA ÇİZGİ** gösterimi ("4-5", "3-4-5", "Noktaları: 3-4-5-6") kullanıyor — ekran okuyucu için belirsiz. Fix (`kelimeYonergeMetniAl` kategoriAdi non-noktalariSeslendir dalı): `detay = yonergeDetay` + DAİMA `noktaKompozisyonMetni()` (sözlü "N. ve M. noktalardan oluşur"), **yalnız açıklama zaten `/nokta(dan|lardan)\s+oluşur/` içeriyorsa eklenmez** (fen-yunan/özel-işaret/müzik-nota — dup önlenir; çizgi gösterimi "3-4-5" sözlü SAYILMAZ → eklenir). `yonergeDetay` boşsa eski tek-hücre fallback yerine TAM çok-hücre kompozisyonu kullanılır. Tarayıcı denetimi (tüm modüller): **DÜZELEN** mat-ölçü/fen-sembol/mat-geometri/müzik-sembol/mat-sembol/kuran-hareke (sözlü nokta eklendi, 0 dup); **değişmeyen** harfler/noktalama/özel-işaret/fen-yunan/müzik-nota/yabancı-dil/sıra-sayıları/rakamlar/kuran-harf (kendi metni zaten sözlü-noktalı). `tamYonergeMetni` sayfaları (rakamlar/sıra-sayıları/kuran-harf) ayrı dal, kendi noktalı metnini korur. **⚠ HÜCRESİZ öğe (`hucreler:[]`, ör. Diğer Özel İşaretler'de "Sayfa Numaralama" — braille'de özel hücre yazımı yok, bilgi amaçlı; kullanıcı: "braille için özel bir hücre yazımı yoktur, devam için sonraki öğeye tıklayınız gibi bir ifade olmalı, ekran okuyucu okusun"):** kategoriAdi dalında `hucresiz = hucreler.length === 0` → nokta kompozisyonu EKLENMEZ **ve** kapanış "Lütfen bu noktalara sırayla dokunun." de EKLENMEZ (dokunulacak nokta yok → çelişki olurdu). Yönlendirme veri `aciklama`'sında taşınır (ör. "…Braille için özel bir hücre yazımı yoktur. Devam için sonraki öğeye tıklayınız."); ekran okuyucu bunu yönerge olarak okur, kullanıcı "Sonraki öğe" butonuyla ilerler. (OzelIsaretler `isarettenOgeye`'yi `ekBilgi` OLMADAN çağırır → yalnız `aciklama`/`yonergeDetay` okunur; `kurallar` gösterilmez.)

**⚠⚠ `kategoriAdi` TEKRARI ARTIK KÖK (İYELİK EKİ SOYULARAK) KARŞILAŞTIRILIR — "hemze hemzesi" sınıfı dil hataları (kullanıcı: "hemze hemzesi gibi polite bölümünde yazımlar var, ekran okuyucu için metinlerdeki bu mantıksal dil hatalarını çözmemiz lazım"):** Aşağıdaki (TARİHSEL) `endsWith` guard'ı yalnız **TAM SONEK** eşleşmesini yakalıyordu; Türkçe **3. tekil iyelik eki** yüzünden kök aynı olsa bile eşleşmiyor ve kategori ikinci kez ekleniyordu. Yakalanan 4 kalıp: (a) **başlık köksüz, kategori ekli** — "Vavlı hemze"+"hemzesi"→*"Vavlı hemze hemzesi"*, "üstün tenvin"+"tenvini"; (b) **TERS yön — başlık ekli, kategori köksüz** — "do notası"+"nota"→*"do notası nota"*; (c) **çok sözcüklü kategori** — "alfa harfi"+"Yunan harfi"→*"alfa harfi Yunan harfi"*, "elif harfi"+"Kur'an harfi"; (d) **kategori sözcüğü ORTADA** — "BD kısaltması, beden kelimesi"+"kısaltması". **Fix — modül düzeyi `kategoriTekrariVarMi(baslikMetni, kategoriAdi)` ([CokHucreOkuyucu.jsx](src/components/CokHucreOkuyucu.jsx), export'lu):** her iki tarafın 3. tekil iyelik eki (`/(s[ıiuü]|[ıiuü])$/`) soyulur → **kök** karşılaştırılır; başlığın **HERHANGİ bir sözcüğünün** kökü kategori köküyle aynıysa EKLEME YAPILMAZ. Son sözcük değil "herhangi bir sözcük" olması (d) için şart. Çok sözcüklü kategoride belirleyici **SON sözcüktür** ("Yunan harfi"→kök `harf`, "sıra sayısı"→kök `sayı`). Denetim (`node` ile tüm veri setleri): **222/507 öğe metni düzeldi, 285 öğe AYNI kaldı** (regresyon yok) — düzelen 8 sayfa: KisaltmaIkiHarfli (87), KisaltmaKelimeKoku (46), KisaltmaKelimeParcasi (39), KuranHarfEgitimi (29), FenYunanHarfler (11), hemzeler (4), tenvinler (3), med-harfleri (3). Tarayıcı: /kuran-isaretler/hemzeler "Hemze-elif, 3. ve 4. noktalardan…"; değişmeyenler doğrulandı (/harfler "A harfi", /noktalama-isaretleri "Nokta işareti", /ozel-isaretler "Büyük Harf İşareti", /kuran-harekeler "üstün harekesi").

**⚠ `bittiMesaji` (bitiş "Tebrikler" cümleleri) DİL DENETİMİ (kullanıcı: "eğitim sonlarında yazan bu tebrikler cümlesinde de cümleler bozuk"):** 30+ sayfanın `bittiMesaji`'si tarandı; 4'ü düzeltildi, kalanlar doğru bulundu. (1) **`KuranHarfEgitimi`** *"Kur'an-ı Kerim **braillesi harflerini** tamamladınız"* → **ZİNCİRLİ İYELİK** hatası (iki ardışık iyelik eki, tamlayan belirsiz) → *"Kur'an-ı Kerim **braille harflerini** tamamladınız"* (sıfat tamlaması + tek iyelik). (2) **`KuranHarekeEgitimi`** *"braillesindeki harekeleri"* → *"braille harekelerini"* (aynı kalıp). (3) **`KuranSureOkuma`** *"…sûresini **tamamladın**"* → **tamamladınız** (uygulamanın tamamı NEZAKET/çoğul 2. kişi kullanır; tek istisnaydı). (4) **`YabanciBrailleSayfa`** *"Tüm öğeleri tamamladınız"* → `` `${bolum.kisaBaslik} bölümünü tamamladınız` `` — paylaşımlı sayfa 19 farklı derse (de/fr/en) hizmet ettiğinden genel mesaj bağlamı kaybediyordu; kardeş paylaşımlı sayfalarla (`MuzikBrailleSayfa`, `KuranIsaretEgitimi`) aynı kalıp. ⚠ `kisaBaslik` üç dilin 19 bölümünde + müziğin 20 bölümünde TANIMLI olduğu doğrulandı (undefined riski yok). Tarayıcı: /almanca/alfabe → "Tebrikler! Alfabe bölümünü tamamladınız."; /kuran-harekeler → "Tebrikler! Kur'an-ı Kerim braille harekelerini öğrendiniz." ⚠ **JSX TUZAĞI:** öznitelik listesinin ORTASINA `{/* yorum */}` yazma — Babel bunu geçersiz öznitelik ifadesi sayıp modülü kırar (HMR "Failed to reload" verir); yorumu `return`'ün ÜSTÜNE `//` ile koy.

**⚠ AYRI DÜZELTME — `KuranHarfEgitimi` yönergesinde HARF ADI yoktu + yasak nokta biçimi:** `tamYonergeMetni` `` `${h.noktalar.join(', ')} numaralı noktalardan oluşur. Lütfen numaralara sırayla dokunun.` `` idi → (1) `tamYonergeMetni` verilince `kategoriAdi` dalı ÇALIŞMAZ, ad ELLE yazılmalıydı; kullanıcı hangi harfi yazdığını duymuyordu ("1 numaralı noktalardan oluşur…"), (2) "1, 2 numaralı noktalardan" §11'de **YASAK** biçim. Fix: `` `${h.ad} harfi, ${nlDan(h.noktalar)} oluşur. Lütfen bu noktalara sırayla dokunun.` `` → "elif harfi, 1. noktadan oluşur…" (tarayıcıda doğrulandı). ⚠ Diğer dosyalardaki "N numaralı noktaya dokunun" (HucreTanima/YazmaEgitimi/CokluTest/YazmaKarisik/YazmaYonergeli) **HEDEF gösterimidir, doğrudur** — yasak olan yalnız KOMPOZİSYON cümlesindeki "N, M numaralı noktalardan oluşur" biçimidir.

**⚠ `kategoriAdi` SUFFIX TEKRARI — adı zaten kategoriyle biten öğede çift okuma önlenir (kullanıcı: "Diğer Özel İşaretler'de 'Büyük harf işareti işareti' diye tekrarlıyor; işaret ifadesi bir kez yeterli"):** `kelimeYonergeMetniAl` kategoriAdi dalı, başlık zaten `kategoriAdi` ile bitmiyorsa suffix ekler (`ttsBaşlık.endsWith(kategoriAdi) ? ttsBaşlık : '${ttsBaşlık} ${kategoriAdi}'`). ESKİDEN `endsWith` **büyük/küçük harfe DUYARLI** idi → veri adı "Büyük Harf **İşareti**" (büyük İ) ile `kategoriAdi="işareti"` (küçük i) EŞLEŞMEYİP " işareti" ekliyordu → "Büyük Harf İşareti **işareti**". Fix: karşılaştırma **Türkçe locale ile küçük harfe çevrilir** (`ttsBaşlık.trimEnd().toLocaleLowerCase('tr').endsWith(kategoriAdi.toLocaleLowerCase('tr'))`) — düz `toLowerCase()` Türkçe "İ"yi `i̇` (combining dot) yapıp eşleştiremezdi. Görünen/sesli metin yine orijinal büyük/küçük (`ttsBaşlık`). Merkezî → TÜM kategoriler ("işareti"/"sembolü"/"harfi"/"harekesi"…) için adı o kelimeyle biten her öğeyi (Noktalama İşaretleri, Tecvid, Yabancı dil, Fen sembol…) kapsar. Tarayıcı: /ozel-isaretler yönerge "Büyük Harf İşareti, Yalnız 6. noktadan…" (tek "İşareti").

### Noktalama TEK derste — Modül 1 kopyası KALDIRILDI, konu Modül 3'te

**⚠⚠ `/noktalama` (Modül 1) ARTIK YOK — noktalama YALNIZ Modül 3'te `/noktalama-isaretleri` (kullanıcı: "modül 1deki noktalama başlığı kaldırılsın"):** Modül 1'in ince noktalama dersi (`NOKTALAMA` verisinden düz üretim, kural/örnek yok) Modül 3'ün tam dersinin (`NOKTALAMA_ISARETLERI` — `kurallar` + `ornekler` + `ekBilgi`) kopyasıydı. Kaldırılan **6 yüzey** (hepsi birlikte gitmeli — biri kalırsa ölü rotaya götürür): (1) `moduller.jsx` modul1 `ogeler` menü kaydı; (2) `App.jsx` `<Route path="/noktalama">` + import; (3) `Test.jsx` `kaynaklar.noktalama` kategorisi (Modül 1 testi artık harfler+rakamlar — öğretilmeyen öğe sorulmasın; noktalama kendi testinde: `TestNoktalama`); (4) `karisikYazmaKaynaklari.js` `'/noktalama'` kaydı; (5) `aramaIndeksi.js` Modül 1 noktalama `kaynakEkle`'si (arama noktalamayı Modül 3 kaydından karşılar); (6) `pages/NoktalamaEgitimi.jsx` **SİLİNDİ**. Geçici `NOKTALAMA_OGRETIM` export'u da kalktı (tüketicisi kalmadı).

**⚠ `NOKTALAMA` (braille.js) SİLİNMEZ — artık SALT ÇEVİRİCİ tablosudur:** Ders gitti ama veri gitmez. Kullananlar: `brailleCevir.js` (`NOKTA_TABLO` encoder + ters harita), `brfOkuyucu.js` / `Araclar.jsx` (`_NOKTA_TERS`), `YazmaSerbest.jsx`, `YazmaYonergeli(.Cumle).jsx`. Özellikle düz tırnak `"` (U+0022): encoder tokenizer'ı `NOKTA_TABLO.has(ch)` ile (`brailleCevir.js` ~1871, kısaltmalı yol) tanır, sonra `tirnakAcik` toggle'ı açılış `[2,3,6]` / kapanış `[3,5,6]` seçer (bkz. §11 (9)); `Araclar.jsx` `_kaynakNoktalamaMi` (~1408) de kaynak karakteri buradan sorar → listeden silinirse Modül 10 metin→brf / doc→brf bozulur. (Düz tırnağın önce öğretimden çıkarılma gerekçesi hâlâ geçerli: açılış+kapanış AYNI karakter, TEK hücresi yok; kıvrık `“`/`”` ayrı öğe olarak Modül 3'te öğretilir.)

**Modül 3 noktalamaya `Sıra Noktalar` eklendi — 3 × `[3]` (kullanıcı: "modül 3e noktalamaya sıra noktalar eklenecek, 3 tane 3. noktadan oluyor"):** `NOKTALAMA_ISARETLERI`'ye **Üç Nokta'dan hemen SONRA** (kontrast kurulsun diye) `{ ad:'Sıra Noktalar', sembol:'...', hucreler:[[3],[3],[3]] }`. **⚠ Üç Nokta ile KARIŞTIRMA:** üç nokta `…` = `[2,5,6]` ×3, sıra noktalar = `[3]` ×3 (kesme işareti hücresi ×3). `aciklama:'3. nokta üç defa arka arkaya yazılır.'` — bu metin `/nokta(dan|lardan)\s+oluşur/` kalıbına UYMAZ, dolayısıyla §8'deki `kategoriAdi` dalı sözlü hücre kompozisyonunu yönergeye EKLER (Üç Nokta ile aynı davranış, dup yok). Dizi 15→**16**; `moduller.jsx` modul4 `toplam: 15` → **16** (öğe eklerken bu sayacı güncellemeyi unutma). **⚠ SIRA kullanıcı isteğiyle değişti (kullanıcı: "modül 3te noktadan sonra 3 nokta gelsin"):** nokta ailesi arka arkaya → **Nokta → Üç Nokta → Sıra Noktalar → Virgül → Noktalı Virgül → İki Nokta → Soru İşareti → …** (Üç Nokta 5.→2., Sıra Noktalar onunla birlikte 3. sıraya taşındı; ayrılsalardı `[2,5,6]`×3 ile `[3]`×3 karşılaştırması kaybolurdu). Sıra `NOKTALAMA_ISARETLERI` dizi sırasıdır → ders/okuma modu/karışık yazma/arama hepsi aynı sırayı alır. `karisikYazmaKaynaklari` + `aramaIndeksi` + `TestNoktalama` aynı diziden türediğinden otomatik kapsar. ⚠ **Çeviricilere EKLENMEDİ:** `NOKTALAMA` (encoder tablosu) sıra noktaları içermez — metin→brf'te `...` hâlâ üç ayrı nokta `[2,5,6]` olarak yazılır; istenirse ayrı iş.

**Doğrulama:** `node _datasets/kapsamli_test.mjs` %98.70 + cümleler 78/78 (baseline ile AYNI — çevirici dokunulmadı), `npx vite build` temiz (kaldırılan import/rota dangling bırakmadı).

---

## 9. Kuran Pages (`CokHucreOkuyucu` + audio)

```
KuranHeceOkuma       → KuranKelimeOkuma(kaynakAnahtari="hece")      ogeSesiOnceCal + ogeSesiHerZaman
KuranKelimeTemelSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime-temel")
KuranKelimeOkumaSayfa → KuranKelimeOkuma(kaynakAnahtari="kelime")
KuranSureOkuma       → CokHucreOkuyucu directly
KuranTecvidEgitimi   → route: /kuran-uzatma  bolumAnahtari="kuran-tecvid" (localStorage key — do NOT change)
KuranIsaretEgitimi   → route: /kuran-isaretler/:slug (cezm-sedde, tenvinler, ta-i-merbuta, med-harfleri, mukadder-medler, elif-zaid, diger-uzatma, hemzeler, hemze-vasl)
```
**⚠ SES DOSYALARI: `public/Kuran_i_Kerim/` (`harfler/`, `heceler/`, `kelimeler/` — 168 wav). YOL ASCII KALMALI:** klasör eskiden `public/Kur'an-ı Kerim tüm sesler/` idi; apostrof + Türkçe karakter + boşluk URL kodlamasında ve bazı sunucularda (EBA dağıtımı) 404 veriyordu → ASCII-güvenli ada taşındı. Yol TEK yerden türer: [kuranSesHelpers.js](src/utils/kuranSesHelpers.js) `KURAN_AUDIO_BASE = \`${_base}/Kuran_i_Kerim\`` + `kuranAudioUrl(path)`; sayfalar URL'i elle kurmaz → klasör yeniden adlandırılırsa YALNIZ bu sabit güncellenir. Bu yola apostrof/Türkçe karakter/boşluk GERİ EKLEME. (`public/audio/` AYRI: `efekt/nokta.wav` ses efektleri + `metronom.mp3`.) `SesIzinEkrani` bileşeni ilk-dokunuş kilidini açar.

**⚠ ARAPÇA AMASYA FONTU — Arapça `yazi` taşıyan TÜM Kur'an sayfaları `rtl` GEÇMELİ (kullanıcı: "Kur'an modülünde bazı sayfalarda Arapça Amasya fontu yok, okuma modlarını da kontrol et"):** `CokHucreOkuyucu` `yazi` div'i Amasya'yı YALNIZ `rtl` true iken uygular (`rtl ? "'Amasya',…" : "'Segoe UI',…"`); okuma modu kartları da Amasya'yı `.okuma-modu-panel.rtl .okuma-modu-etiket` CSS'i ile (panel `rtl` sınıfı = `rtl` prop'u) alır → `rtl` YOKSA hem öğrenme hem okuma modunda Arapça Segoe UI ile çıkar. **`KuranIsaretEgitimi` `rtl` GEÇMİYORDU** (`yazi: h.isaret` = Arapça diakritik/harf ör. `'ْ'`/`'ا'`) → 9 alt-sayfanın hepsinde Amasya eksikti; `rtl` eklendi (KuranHarf/Hareke/KelimeOkuma/Sure zaten geçiyordu). **AYRIM — `KuranTecvidEgitimi` `rtl` ALMAZ:** `yazi: t.ad` = TÜRKÇE (rtl+Amasya Latin'i bozar — bkz. §11 Amasya kuralı), Arapça yalnız `altMetin: t.sembol`'de → `altMetin` zaten `/[؀-ۿ]/.test(k.altMetin)` ile Amasya alır (rtl gerekmez). **Kural: Arapça içerik `yazi`'da ise → sayfa `rtl`; yalnız `altMetin`'de ise → rtl YOK (altMetin kendi Arapça-tespitiyle Amasya alır).** Tarayıcı: /kuran-isaretler/cezm-sedde öğrenme `yazi` (ْ) = Amasya+rtl, okuma modu kartları (◌ْ ◌ّ) = Amasya, panel.rtl.

**Module 5 menu notes:**
- **Ders sırası kullanıcı isteğiyle düzenlendi** (`moduller.jsx` modul5 ogeler; başlıklar/anahtarlar AYNI, yalnız sıra): Harfler → Harekeler → Cezim/Şedde → Med (Uzatma) Harfleri → Mukadder Medler → Elif-i Zaid → Hemzeler → Tenvinler → Ta-i Merbûta → Diğer Uzatma İşaretleri → Hemze-i Vasl/Kat → Durak İşaretleri → Test. (`/kuran-uzatma` = KURAN_TECVID; kullanıcı isteğiyle "Uzatma İşaretleri"→"Durak İşaretleri", "Diğer Uzatma"→"Diğer Uzatma İşaretleri" olarak yeniden adlandırıldı; route/anahtar AYNI. Hurufu mukatta hücresi [2,6]→[3,6] düzeltildi.) **Veri düzeltmesi — `HEMZELER[0]` Hemze-elif (أ) `[4]`→`[3,4]`** (kullanıcı: "hemzeler başlığında elif hemze 4 değil 3-4 olacak"); `/kuran-isaretler/hemzeler` yönergesi "Hemze-elif hemzesi, 3. ve 4. noktalardan oluşur" olur, hedef noktalar 3+4. Diğer üç hemze (vavlı [1,2,5,6], ya'lı [1,3,4,5,6], kıvrık [3]) DEĞİŞMEDİ. `sonrakiDers` (dersAkisi.js) bu ogeler sırasını okur → "Sonraki İçerik" akışı otomatik bu sıradadır. Tüm Modül 5 dersleri (kuran-harfler/harekeler/uzatma + her `/kuran-isaretler/:slug`) **karışık yazma (klavye yazma) etkinliği** içerir (karisikYazmaKaynaklari.js'te kayıtlı; bitiş ekranında "Karışık Yazma Etkinliği" butonu görünür).
- Hece Okuma ve Kelime Okuma items are **hidden from menu** (removed from `moduller.jsx` ogeler). Data still exists in `kuran.js` — do not delete it.
- Route was renamed `/kuran-tecvid` → `/kuran-uzatma`. `bolumAnahtari` stays `"kuran-tecvid"` for localStorage compatibility.
- User-facing strings in Module 5 use **â → a** (e.g. "Ta-i Merbuta", "Elif-i Zaid"). Audio slug files (`kuranSesHelpers.js`) are **excluded** — they contain `hı: 'hâ'` and a `.replace(/â/g, 'a')` regex that must stay intact.

### Music BRF Editor (`MuzikBrfYazim.jsx`)
Route `/muzik-brf-yazim`. Full score editor backed by `components/music/MuzikBrfScoreEditor.jsx` and the `utils/music-brf/` pipeline. Uses Bravura SMuFL font for glyphs. Separate from the lesson pages — no `CokHucreOkuyucu`, no learning flow.

#### Perkins Braille Keyboard Panel (`PerkinsYazimPaneli.jsx`)
A **writing mode** opened by **double Enter** (two Enters within 450ms). NO open button. Single Enter is the existing edit-shortcut mode. Provides simultaneous multi-key chord input (hold keys + release all → commit cell).

**Contextual placement:** the card is rendered via `createPortal` into the **active measure's row** (`.muzik-olcu-braille-blok` last child) — since each row is `flex-direction: column`, the card sits below the staff and pushes the next row down. As notes are added the active row changes and the panel **follows it** (shows a `{N}. ölçü` badge). No scrolling to the page bottom.

**⚠ KRİTİK — portal hedefi YAZIMI izler, İMLECİ DEĞİL (kullanıcı: "silme ve brailler üzerinde gezinme efektif çalışmıyor"):** Panel konumu (`aktifSatirIdx` → `hedefNode` → `createPortal`) `sonEklenenOgeId` (yazım) izler; `seciliOgeId` (imleç) DEĞİL. ESKİDEN `aktifId = seciliOgeId || sonEklenenOgeId` ile imleci izliyordu → her ok/Backspace SATIR değiştirdiğinde `setHedefNode` farklı konteyner verir → `createPortal` **textarea'yı unmount/remount eder** → o anki tuş DÜŞER + odak gövdeye kayar → skorun document keydown handler'ı (textarea'yı atlar ama gövde odakta değil) devreye girip ÇİFT işler → gezinme/silme atlama+tekrarla "efektif çalışmaz". Fix: `aktifSatirIdx` yalnız `sonEklenenOgeId`'den türer → gezinme/silme paneli oynatmaz (remount yok), yazınca panel yine ilgili satıra gelir. Silme yine de `bosOlculeriTemizle`/`muzikSatirSayisi` değiştirip re-portal edebilir → textarea remount; bunu **`yazimAlaniRef` REF-CALLBACK'i** çözer: yeni textarea node mount olunca (callback tam o anda çalışır) `odakIstendiRef` (kullanıcı keydown/onFocus'ta set) doğruysa rAF ile odağı geri verir — rAF/effect tabanlı geri-alma remount anını kaçırıyordu, ref-callback kaçırmaz. `imlecSil` ayrıca klef/zaman sentinel'lerini (`ANAHTAR_BAS`/`ZAMAN_IMZA`) silmeye çalışmaz ("başlangıç işareti silinemez"). Tarayıcı (in-code sayaç doğrulaması): 8 sağ `ANAHTAR_BAS→ZAMAN_IMZA→0→1→…` kesintisiz tek-adım, 4 sol temiz ters, odak korunur, silme nota sayısını düşürür. ⚠ TEST TUZAĞI: bu oturumdaki yoğun HMR fiber `memoizedProps` okumalarını yalancı "tekrar"la kirletir + preview konsolu her log'u ~8× çoğaltır → DOĞRULAMAYI in-code sayaç/`window.__navLog` ile yap, fiber-read/console ile DEĞİL; kesin ölçüm için tam reload.

**YAZIM ALANI = İMLECİN BULUNDUĞU ÖLÇÜNÜN CANLI BRAILLE'İ (kullanıcı: "sildiğimde yazım alanında da braille silinmeli, hangi ölçüdeysem o ölçünün brailleri yazmalı, yeni ölçüye geçince temizlenmeli; ileri/geri ile son brailde sonraki ölçü, ilk brailde önceki ölçü"):** Panelin eski "Son yazılanlar" yazım-geçmişi (skordan KOPUK; silince kalkmıyor, ölçü-bazlı değil) → **imlecin ölçüsünün canlı braille görünümü** ile değiştirildi. `olcuHucreleri` state'i bir effect'le doldurulur: `seciliOgeId`'nin `measureIndex`'i (svgYerlesimHaritasi'ndan) bulunur, skor overlay'inden (`.muzik-braille-hucre[data-oge-id]`) AYNI measureIndex'li hücreler okunur (`data-braille-dots`→`dashUnicode` ile braille karakteri; `el.textContent` nota ADI verir, kullanma), imleç hücreleri vurgulanır (`.caret` CSS). Böylece: silince hücre buradan da kalkar (görünüm türetilmiş), hangi ölçüdeysen onun braille'i görünür, gezinme ölçü değiştirince görünüm yenilenir/temizlenir. Gezinme (`imleceTasi`) DOĞRUSAL (tüm nav öğeleri) → ilk/son brailde komşu ölçüye geçiş otomatik. **⚠ SONSUZ DÖNGÜ TUZAĞI:** effect `svgYerlesimHaritasi`'na (HER render yeni Map referansı) bağlı + `setOlcuHucreleri(yeni dizi)` → render→effect→setState→render LOOP, TÜM rAF'ları (caret-etiketi dahil) iptal eder → panel hiç güncellenmez. Fix: `setOlcuHucreleri((prev)=> aynıysa prev döndür)` (hücre dizisini ogeId/unicode/caretMi ile karşılaştır) → değişmedikçe state set ETME → döngü yok. View `caretIdRef.current` yerine `seciliOgeId` (commit'lenmiş prop) kullanır → caret etiketiyle TUTARLI (caretIdRef hızlı gezinmede ileride). Sentinel'de (klef/zaman) görünüm "Bu ölçüde henüz braille yok". Tarayıcı: "1. ölçü braille (4)" hücreler + caret vurgusu görünür (screenshot), gezinme 1→2→3 ölçü geçişi, silme nota+hücre düşürür.

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

**Yapısal çok-hücreli işaretler (volta / cümle-bağı / tuplet) de TANINIR — `REVERSE.yapiByCellKey` (kullanıcı: "tüm brailleri tanıması lazım"):** Decode'un kapsadığı nota/sus/oktav/aksidental/barline/tekli-slur-tie/modifier dışında, voltalar (1./2. dolap `⠼⠂`/`⠼⠆`), cümle (bracket) bağları (`⠰⠃`/`⠨⠆`) ve düzensiz gruplar (üçleme→yedileme) eksikti → "bilinmeyen". `musicBrailleReverseMaps.js` `buildYapiSequences()` bunları MUZIK_OLCU_CIZGILERI(dolap)/MUZIK_BAGLAR(cümle bağı)/MUZIK_DUZENSIZ_GRUPLAR'dan türetir (anahtar barlineByCellKey biçimi: hücre dash'leri `-` ile birleşik). `yapiByCellKey` **reader'da KULLANILMAZ** (reader bunları kendi mantığıyla çözer; reader yalnız note/rest/octave/accidental/modifier maps kullanır) → reader regresyonsuz; yalnız Perkins decode'una `yapiBak` (PerkinsYazimPaneli.jsx, barlineBak ikizi) olarak bağlanır (hucreAlindi prefix + tamponuDegerlendir + zorlaCoz çok/tek-hücre). `uygulaYapi` tanır+duyurur (tekli slur gibi — tam yerleştirme editörden: volta ölçü-aralığı, tuplet grubu). ⚠ Oktav-çakışması REGRESYON YOK: bracket/tuplet'in baş hücreleri (`[5-6]`=okt6, `[4-5]`=okt2, `[4-5-6]`=okt3) ZATEN modifier ön-eki (martellato/ifadeli-aksent/tonuto) olduğundan halihazırda tamponlanıyordu — oktav+nota yazımı doğru çözülmeye devam eder (faithful-replica test: 115 sembol tanındı/0 bilinmeyen, oktav6/2/3+nota regresyonsuz; BRF QA yeşil). 4 süre TEMEL-hücre kavram kartı (`ad` "… süre", eklenen nokta `[3-6]` vb.) tek başına YAZILMAZ (tam nota — Birlik Do — yazılır) → kapsam dışı.

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

**HAYALET ÖLÇÜ NUMARASI — eski-editör parçalarında temizlik (kullanıcı: "çanakkale 6. ölçüde trill algılıyor oysa ölçü numarasıydı… eskilerin hepsinde var" → "eskilerin hiçbirinde trill apajur süsleme yoktu, pdften olmayanlarda görürsen hemen sil"):** Eski editör ölçü numarasını satır içine GÖMÜYORDU; düzleştirilince bu alt-rakam hücresi notadan önce kalıp SÜSLEME okunuyor (alt-rakam = tek-hücreli süsleme/grace ile AYNI şekil): **⠲ (2-5-6) = grupeto/turn = alt-rakam 4**, **⠢ (2-6) = kısa apajür/grace = 5**, **⠖ (2-3-5) = trill = 6**, **⠦ (2-3-6) = stakato = 8**. Reader doğru davranır (ölçü başında nota İZLEYEN çakışan hücre → süsleme; bkz. `CAKISAN_TEK_SUSLEME`) ama hücre orada OLMAMALI. **KURAL (kullanıcı onayı): eski (PDF OLMAYAN, `ad` "PDF:" ile başlamayan) parçalarda HİÇ süsleme/apajür yoktur → eski parçada görülen HER süsleme silinir** (value==measureNo testine gerek yok; o test yalnız emin olmak içindi — eski parçalarda hepsi phantom çıktı). **PDF parçalarındaki süslemeler GERÇEKTİR, DOKUNMA** (Fidelio ⠦ m4, Carmen ⠦ m1, Rondo ⠖ m4 vb.). Tespit: `r.cells`'te `category==='susleme'` hücreleri (eski parçalarda); konumdan (lineIndex/cellIndex) raw BRF satırından çıkar. **Grace silmek notayı 0-süreden TAM süreye çevirir → ölçü-süre uyarısını DÜZELTİR** (Ceddin Deden, Yemen Türküsü `measure-duration-warning` 1→0). Doğrulama: nota+sus sayısı DEĞİŞMEZ, uyarı ARTMAZ, `qa:brf-pieces` yeşil. **9 eski parçanın tümü temizlendi** (Çanakkale, Neşeye Övgü, Ceddin Deden m5+m6, Yine Bir Gülnihal, Ankara Marşı, Ateş Böceği m4+m6, Harbiye Marşı, Yemen Türküsü, Ali Babanın Çiftliği) — bekleyen yok. ⚠ CLAUDE.md/claude-music'in eski "Ceddin Deden (1), Yemen Türküsü (1) grace" notları YANLIŞTI (o grace'ler phantom'du); grace yalnız PDF parçalarında (Gigue, Peer Gynt) gerçektir.

**SATIR BAŞI ÖLÇÜ NUMARASI — SUNUM (Lesson 5, zorunlu; kullanıcı: "her satır için ölçü no zorunlu değil mi, en güvenli yoldan ekle"):** Standart (Lesson 5, PDF s.40): enstrümantal müzikte her braille satırının 1. hücresine, **sayı işareti OLMADAN, ÜST rakam (a–j: 1=⠁…6=⠋…0=⠚) ile** — ardından **BİR BOŞLUK** — o satırın ilk ölçü numarası yazılır (PDF örneği: bar 1=⠁, 8=⠓, 16=⠁⠋); **internet teyit**: National Braille Press "Each segment begins with the measure number in cell 1, **a blank space**, then the first note", UEB Online aynı PDF, Music Theory Online (dot-1 hücresi = "a" veya "1"); **anacrusis = 0. ölçü**; ölçü satır ortasından bölünmez (sığmazsa bütün olarak alt satıra). Satır genişliği = **40 hücre** (standart braille satırı). **Tasarım: numara VERİYE GÖMÜLMEZ, anlık hesaplanır** (hayalet sorununun tekrarını önler — bkz. üstteki "HAYALET ÖLÇÜ NUMARASI"). Yardımcı: [muzikOlcuNumarasi.js](src/utils/music-brf/muzikOlcuNumarasi.js) — `ustRakamYaz(n)` (üst-rakam a–j: 1→⠁, 6→⠋; eski `altRakamYaz` artık buna ALIAS), `muzikGovdesiniNumarali(govde,{genislik,ilkNo})` (40'ta ölçü sınırından sarar, ölçü bütün kalır), `anakruzisVarMi(measures)` (ilk ölçü baskın süreden kısaysa → 0), `brfNumaraliGorunum(metin, brfOkumaSonucu)` (reader cells'inden başlık/gövde sınırı + anacrusis → `{basliklar, govde:[{no,metin}]}`). **Faz 1 (DONE, salt sunum, round-trip etkilenmez):** (a) "BRF okuma" görünümü ([MuzikBrailleOutput.jsx](src/components/music/MuzikBrailleOutput.jsx)) gövde satırlarını numaralı basar (sol gutter'da ondalık + braille alt-rakam öneki; başlık satırları numarasız gri) — **İKİ blok**: yüklenen "Ham BRF" (`brfNumaraliGorunum`+hazır `brfOkumaSonucu`) VE **yeni yazılan skorun "export önizleme"si** (`numaraliExport=brfGorunumMetinden(brfExportMetni)` — reader'ı İÇERİDE çalıştırır; yeni skorda `brfOkumaSonucu` yok/`brfHamMetin` boş, eskiden numarasız tek `<pre>` satırdı = kullanıcı şikâyeti); (b) **skor çizimi ZATEN** sistem başlarında ölçü no çiziyor (MuzikScoreSvg SVG `<text>`) → ekleme gerekmedi. Tarayıcıda doğrulandı (Çanakkale: satırlar 1, 6; Uyarı 0; `qa:brf-roundtrip` 18/18). **Faz 2 (DONE — indirilen .brf numaralı + geri okunur):** `numaraliBrfMetni(metin)` (muzikOlcuNumarasi.js) kanonik BRF'i satır başı numaralı + 40-hücre satırlı biçime çevirir; **alt çubuk "BRF İndir"** butonu (MuzikBrfYazim → ASCII) bunu kullanır. **⚠ İNDİR/KOPYA KAYNAĞI = GÖRÜNÜMÜN KAYNAĞI (kullanıcı: "brf indirde hala eski mantık, ölçü/oktav farklı; brf okumadaki kesin doğruysa o gibi olmalı"):** İndir + alt-çubuk Kopya artık `numaraliBrfMetni(brfHamMetin || brfExportMetni || canonicalBrfText)` — görünümün "Ham BRF" bloğu da `brfHamMetin`'i numaralar → **üçü AYNI kaynak, byte-byte eş**. Eskiden indir hep `brfExportMetni`'yi (skordan YENİDEN-ÜRETİLEN; motor oktav/ölçüyü re-türetir) alıyordu → görünümden (yüklenen orijinal `brfHamMetin`) farklı oktav/ölçü = şikâyet. Tarayıcı: Çanakkale indir(ASCII) ↔ görünüm(Unicode) eş (`⠁⠀⠧⠐⠙…`=`A V"DE…`). **ÇİFT-NUMARALAMA FIX (kullanıcı: "indirileni okuturken çift numara; asla EKLEME, dosyadan OKU" — Gigue.brf `⠁⠀⠁⠀`):** ZATEN numaralı bir .brf (indirilmiş dosya) tekrar görüntülenirken `brfNumaraliGorunum` gövdeyi ham METİNDEN çıkarıyor → dosyanın mevcut `⠁⠀` numarası gövdeye giriyor, üstüne yeni numara ekleniyordu = **çift** (+ mevcut numara bir "ölçü" gibi sayılıp sonraki satır 3 yerine 4 numaralanıyordu = yanlış). Fix: `satirBasiNumarasiniSil(satir)` — gövde satırlarındaki satır-başı üst-rakam+ayraç önekini numaralamadan ÖNCE siler (müzik satırı oktav işaretiyle başlar, üst-rakamla değil → güvenli). Artık **gerçekten idempotent**: reload→görünüm tek numara + doğru no (Gigue: 1, 3). Node: 51/51 idempotent, 0 çift; tarayıcı Çanakkale 1/6 çift yok.

**SATIR BÖLME = ÖLÇÜ SINIRI + RUN-OVER + view==indir GARANTİSİ (kullanıcı: "2 uzun parça [Cavallini/Soon] nasıl yazılmalı, ilk standardı araştır; view==indir HER ZAMAN"):** Otorite (BANA Music Braille Code 2015 + NFB Intro Part 2): **birincil — ölçü sınırından böl** (ölçü bölünmez, sığmazsa alt satıra; her satır 1. hücrede ölçü no); **run-over yalnız TEK ölçü tek satıra sığmazsa** ("tam vuruşlar arası" böl, taşma satırı **girintili**). 3 düzeltme: **(1)** `olculeriNumarali` paketleyici run-over destekli (ölçü > genislik → `runOverBol` iç boşlukta böler, devam satırı 2-hücre girintili `{devam:true}`); şu an hiçbir parçada tek ölçü >40 değil (en uzun: Cavallini 17, Soon 9) → run-over tetiklenmez. **(2) GUARD `brfNumaraliGorunum` İÇİNE alındı** → görünüm+indir+kopya AYNI guard'lı çıktıdan; round-trip güvenli değilse İKİSİ DE ham (numarasız) gösterir → **asla biri sarılı biri ham olmaz** (view==indir garantisi). **(3) Reader fix — satır başı ölçü no = ölçü SINIRI:** `handleLineEnd` satır sonunu yalnız nota/sus ise kapatıyordu; önceki satır `⠶` (bar-repeat) / özel işaretle bittiğinde kapatmıyordu → sarılmış numaralı dosyada 2 ölçü birleşiyor (Cavallini/Soon round-trip kırılıyordu). `readMusicBrailleGroup` satır-başı üst-rakam grubunu tüketirken `separatorBarlineOlustur` ile önceki ölçüyü kapatır (idempotent; ilk ölçüde/zaten-kapalıysa null). **YALNIZ satır-başı numaralı (sarılmış) dosyaları etkiler** → mevcut veri/fixture'larda satır-başı numara yok, 11/11 qa:brf-* yeşil. **Sonuç:** 51/51 numaralı (0 fallback — Cavallini/Soon dahil), tüm satırlar ≤40 (numara+boşluk dahil), idempotent, round-trip skoru korunur, **view==indir 0 sapma** (node + tarayıcı: Soon 50→ölçü1/ölçü7 iki satır ≤40). **Kağıt genişliği 40 sabit** (BANA standardı, 11.5″×11″); 42–44 (geniş) / 32 (dar/A4) varyasyonları var ama müzik indirmesi hep 40 (genel BRF aracındaki preset'leri izlemez — istenirse eklenebilir). (⚠ "BRF okuma" sekmesindeki eski in-panel ".brf indir" + "BRF metnini kopyala" butonları KALDIRILDI — kullanıcı: "orada gerek yok"; indir/kopya yalnız alt çubukta.) **Biçim: numara + BOŞLUK + müzik** (`⠁⠀⠧…`; numara kendi space-ayrık grubu, PDF s.40). **Reader satır-başı bağlamı:** `brfMusicReader.js` her müzik satırında `context.satirBasiBekliyor=true`; `readMusicBrailleGroup` ilk grupta tüketir (`satirBasi`). Satırın İLK grubu **TÜMÜYLE üst-rakam (a–j)** ise → ölçü numarası sayılıp atlanır + `context.barNoSonrasiBoslukAtla=true` ile ardından gelen ayraç boşluğu **barline SAYILMAZ** (sahte ölçü yok; `zamanDegisimiSonrasiBoslukAtla` ikizi). Müzik satırının ilk notası oktav işaretiyle başladığından üst-rakam-only ilk grup yalnız bar-no olabilir → çakışma yok. (Eski alt-rakam-bitişik girdiler için bar-number bloğundaki `satirBasiNumara` defensif kalır.) Değişiklik SADECE üst-rakamla başlayan ilk grupları etkiler (mevcut veri oktav/sus/repeat ile başlar → 11/11 qa:brf-* yeşil, regresyon yok). **Round-trip GÜVENLİK guard'ı:** `numaraliBrfMetni` çıktısı reader'da orijinalle aynı nota dizisi + ölçü sayısı vermezse ORİJİNALİ döndürür → indirilen dosya DAİMA aynen geri okunur. 49/51 numaralanır; 2 kenar parça (zaman-imza değişimi, tuplet-içi boşluk gibi özel §14 boşluğu taşıyanlar) güvenle orijinal iner. Node: 51/51 numaralı-İNDİR→ASCII→YÜKLE round-trip temiz; tarayıcı: Çanakkale satır başları ⠁(1)/⠋(6) + boşluk, konsol temiz. **KOPYALA da numaralı (kullanıcı: "braille kopyala brf okumadakini kopyalamadı, ölçü numarası görünmedi"):** alt çubuk "Braille olarak kopyala" butonu da `numaraliBrfMetni(brfHamMetin || brfExportMetni || canonicalBrfText)` — indir + görünümle **AYNI kaynak + AYNI dönüşüm** (Çanakkale: `⠁⠀⠧…` / `⠋⠀⠐⠳…`). ⚠ **DERS: numara VERİYE gömülü DEĞİL; her çıktı noktası (indir/kopya/görünüm) numaralamayı AYRI uygular** → yeni çıktı eklerken `numaraliBrfMetni` çağrısını unutma ve daima **görünümün kaynağıyla (`brfHamMetin || brfExportMetni`)** türet ki üçü byte-byte tutarlı kalsın.

**BRF İNDİR/YÜKLE ENCODING — ASCII↔Unicode (kullanıcı: "brf yüklediğimde Ham BRF'de bozuk karakterler" + "braille yazıcı tanıyacağı formatta mı"):** İNDİR embosser-uyumlu **North American Braille ASCII (SimBraille)** üretir (`unicodeBrailleToBrfAscii`, [brailleAscii.js](src/utils/brailleAscii.js) 64-karakter tablosu; embosser ASCII baytını kabartır) → ✅ yazıcı formatı. YÜKLE'de sorun: dosya Braille ASCII (harf/sembol) gelir; `brfMetniYukle` ham metni `brfHamMetin`e koyunca "Ham BRF" görünümü ASCII harfleri **dots yerine "bozuk"** gösteriyordu. Fix: `brfMetniYukle` ([useMuzikBrfEditor.jsx](src/hooks/music-brf/useMuzikBrfEditor.jsx)) yüklenen metni **`brfAsciiToUnicodeBraille`** ile Unicode braille'e çevirip hem `setBrfHamMetin` hem `brfMuzikOku`'ya verir → görünüm dots gösterir. `brfAsciiToUnicodeBraille` (brailleAscii.js): ASCII braille hücrelerini ⠿'ye çevirir, zaten Unicode olanları + `\n` korur (Unicode .brf de güvenle geçer); regular space `" "` → ⠀ (braille blank, reader ikisini de ayraç sayar). Node: 51/51 İNDİR(ASCII)→YÜKLE(Unicode) score korunur + sonuç tamamı-braille (ASCII harf kalmaz). Reader `normalizeBrfText` zaten ASCII'yi içeride çözer ama GÖRÜNÜM ham metni gösterdiğinden ön-çevirim şart.

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

### Yönergeli Yazma (Modül 4) — ÇOK HÜCRELİ karakter: düzeltme işareti + temel harf

**⚠⚠ Şapkalı ünlü / yabancı harf İKİ hücredir; sayfa karakter içinde `hucreAdimi` tutar (kullanıcı: "şapkalı a düzeltme işareti sonra a harfi yazılmalı", "başka düzeltme harfi gerekenler varsa düzelt"):** `YazmaYonergeli.jsx` (kelime) ve `YazmaYonergeliCumle.jsx` (cümle) ESKİDEN karakter başına TEK hücre varsayıyordu (`karakterinNoktalari` → `HARFLER`/`NOKTALAMA` araması). `HARFLER` yalnız 29 Türkçe harfi tuttuğundan `â` için `[]` dönüyordu; dahası klavye çözücüsü `hucreyiKarakteryap` **hiçbir hücre kombinasyonunda `â` üretemiyor** (64 hücre tarandı) → `yazilanCh === beklenen` ASLA doğru olamıyordu. Sonuç: **`hâkim` (kelime 96), `rüzgâr` (kelime 248) ve "rüzgâr yaprakları savurdu." (cümle 38) tamamlanamıyordu** — "Sonraki Kelime" butonu yalnız kelime bitince göründüğünden ATLANAMIYORDU da; 3 hatadan sonraki yardım da boştu (`yardimMetni` boş string).

**Tek kaynak — `karakterHucreleri(ch)` ([brailleCevir.js](src/utils/brailleCevir.js)):** Sayfalar artık hücre DİZİSİ alır, böylece ders encoder ile (`metniBrailleyeCevir`) BİREBİR aynı yazımı ister (node ile doğrulandı: `hâkim` → `[1,2,5] [4] [1] [1,3] [2,4] [1,3,4]`, iki yol da özdeş). Kapsam `duzeltmeliHarfBilgisi`'nden türer → **şapkalı ünlüler `â î û ô ê`** (`DUZELTMELI_UNLU_TABLO`) **+ yabancı harfler `q w x`** (`YABANCI_HARF_TABLO`) hepsi `[4]` + temel harf. Normal harf/noktalama tek hücre; boşluk/tanınmayan `[]`. ⚠ Büyük harf işareti EKLENMEZ (yönergeli yazma büyük/küçük harfe duyarsız karşılaştırır). **Veri taraması: `â` dışında düzeltme gerektiren karakter YOK** (500 kelime + 78 cümle tarandı) — ama fix genel, yeni veri `î`/`û`/`q`/`w`/`x` içerirse otomatik çalışır.

**Sayfa tarafı (İKİ dosyada AYNI — birini değiştirince diğerini de):** `hucreAdimi` state (karakter içinde kaçıncı hücre) + `adim` (taşmaya karşı clamp'li) + `cokHucreli`. **⚠ `onHucre` çok hücreli dalda `hucreyiIsle`'yi ÇAĞIRMAZ, hücreyi HAM karşılaştırır** (`ayniHucre`): `hucreyiIsle` tek hücreyi tek karaktere çözdüğünden `[4]` gibi bir İŞARET hücresini "bilinmeyen" sayardı; ayrıca `durumRef`'i (sayı/büyük harf modu) kirletirdi. Yönerge iki adımı anlatır ("â harfi iki hücreyle yazılır: önce düzeltme işareti, sonra A harfi" → "Düzeltme işareti yazıldı. Şimdi A harfi için noktalara basın"); yardım/`vurguNoktalar` o anki ADIMIN hücresini gösterir; `onSil` karakter ortasındaysa önce adımı geri alır (yazılmış düzeltme işareti sessizce kaybolmasın). Yönerge effect'ine **`hucreAdimi` deps'e eklendi** (2. adım da duyurulsun); `hucreAdimi` karakter/kelime değişiminde + `yenidenBasla`/`ileriKelime`'de sıfırlanır.

**⚠ AYRI HATA — ÇİFT KLAVYE (aynı iki sayfada):** Her iki sayfa da İKİ `BrailleKlavye` mount eder (inline + yatay popup) ve `klavyeAcik` varsayılan `true` olduğundan **ikisi de `window` keydown/keyup dinliyordu → her fiziksel hücre İKİ kez commit ediliyor** (tek hücreli karakterde iki karakter birden ilerler). `YazmaSerbest`'te bu hata `klavyeAcik={false}` ile çözülmüştü (§9'daki "Double-keyboard fix"), bu iki sayfaya uygulanmamıştı. Fix: popup örneğine `klavyeAcik={false}` (fiziksel klavyeyi yalnız inline yakalar; popup `anindaDokunma` ile dokunmatik çalışır).

**Tarayıcı doğrulaması (sentetik Perkins tuşlarıyla 96 kelime yazdırılarak):** `hâkim` → h ✓ → yanlış `[1]` denemesi REDDEDİLDİ (Hata: 1, konum ilerlemedi) → `[4]` "Düzeltme işareti yazıldı. Şimdi A harfi için noktalara basın." (konum SABİT) → `[1]` karakter tamam (2/5) → k, i, m → "Tebrikler! hâkim kelimesini tamamladınız." Cümle 38'de `rüzgâr` aynı akış (4/26 → [4] → [1] → 5/26). Her kelime tam bir adım ilerledi (çift-commit yok). Konsol temiz, `npx vite build` temiz.

### Serbest Yazma (`/yazma-serbest` — `src/pages/YazmaSerbest.jsx`)
Free-writing pad. **No Metin/Braille tabs** — one combined view whose layout depends on the mode:
- **NORMAL mode** → `birlesikEtiketler(hucreler)`: a **flat** per-cell list (empty cell → `.yazma-birlesik-bosluk` separator). Each `BrailleCell` shows its meaning underneath (`.yazma-hucre-etiket`): letter/digit, or compact sign label via `ISARET_GORSEL_ETIKET` (sayı işareti → `#`, büyük harf işareti → `⇧`). Decoded with a single `hucreyiIsle` state machine so number/capital mode spans cells.
- **KISALTMA mode** → `kisaltmaSegmentler(hucreler, sistemler)`: cells grouped into **word blocks** (`.yazma-grup`), each block's cells in a row with the **recognized contraction/word** below (`.yazma-grup-etiket`), decoded by `hucreleriMetneCevirKisaltmali` (same algorithm Module 10's `_brfMetinedon`/`bloklariIsle` uses — confirmed identical block-decode; the earlier "kısaltmaları tanımıyor" was a *display* bug: the flat per-cell view showed literal letters "b","d" instead of the word "beden", while the decoder/SR text was already correct). Last (in-progress) word uses `sonTekHarfBeklet:true` so a lone one-letter abbreviation stays a letter until a space resolves it.
- **Single source of truth:** `hucrelerRef` (synced mirror of `brailleHucreleri` state). Both the visible text and the combined view derive from it via `metniYenile` (`kisaltmaModu ? hucreleriMetneCevirKisaltmali(...) : normalModMetni(...)`). Dropped the old `durumRef`/`kisaltmaHucreleriRef`/`kisaltmaBasMetinRef`. Kısaltma toggle no longer resets text — it re-interprets the SAME cells in the new mode (effect on `[kisaltmaModu, kisaltmaSistemler]`). `tumunuOku` (Onay/Tümünü Oku) ALSO re-derives from `hucrelerRef` (not the `metin` state) — the keyboard's Onay commits a pending sequential-click cell synchronously via `aksiyonOncesiTiklamayiCommitEt`, so reading stale `metin` from the closure wrongly said "Henüz hiçbir şey yazmadınız".
- **Reading box is `.sr-only`** (visually hidden, `aria-live="polite"` + `aria-label`) so NVDA / browser TTS still read the full text; the combined braille view is `aria-hidden` (per-cell announcements come from `konus()` in `onHucre`).
- **⚠ TANINMAYAN HÜCREDE ETİKET BOŞ — `?` YAZMA (kullanıcı: "serbest yazmada bilmediği yazımlara ? ekliyor, ? gelmesin"):** `birlesikEtiketler` `r.tip === 'bilinmeyen' || r.deger === null` dalında `etiket: '?'` veriyordu → kullanıcı çok hücreli bir dizi yazarken ARA hücrelerde hata yapmış gibi görünüyordu. Artık `etiket: ''` (boşluk hücresiyle aynı davranış); hücre yine ÇİZİLİR (kullanıcı yazdığını görür), yalnız altındaki anlam etiketi boş kalır. Render `{e.etiket || ' '}` olduğundan kutu yüksekliği/hizalama korunur. ⚠ **GERÇEK soru işareti ETKİLENMEZ:** `?` = `[2,3,6]` tanınan bir karakterdir (`tip:'karakter'`) → etiketi `?` olarak görünmeye devam eder; değişen yalnız `bilinmeyen` dalı. Metin çıktısı (`normalModMetni`) tanınmayan hücreyi ZATEN atlıyordu, sesli anons da "tanımsız hücre" diyor → `?` sadece bu görsel etikette kalmıştı. **Kısaltma modu etkilenmez:** 63 hücrenin tamamı `hucreleriMetneCevirKisaltmali`'dan geçirildi, `?` üreten TEK hücre `[2,3,6]` (gerçek soru işareti) — sahte `?` yok. Tarayıcı: `[1]`→"a", `[1..6]`→boş, `[1,2]`→"b", metin "ab"; `[2,3,6]`→"?" korunur.
- **Max 2 lines.** `.yazma-birlesik` is a fixed-height (`min/max-height`, `align-content:center` so a single row sits lower — "hücreler bir alta kaysın"), `overflow:hidden` flex-wrap box with `ref={birlesikRef}`. A `useLayoutEffect` on `[brailleHucreleri]` counts distinct child `offsetTop`; if a new cell pushes to a 3rd row it reverts the last cell (`hucrelerRef.slice(0,-1)` + re-derive), sets `dolu=true`, and announces "İki satır doldu". `onHucre`/`onBosluk` are blocked while `dolu`; `onSil` clears it.
- **Double-keyboard fix:** the page mounts two `BrailleKlavye` (inline + landscape popup). Both used to attach `window` keydown listeners → every physical-keyboard cell committed **twice** ("5"→"55"). The popup now gets `klavyeAcik={false}` (it's pointer/touch only via `anindaDokunma`), so only the inline keyboard captures physical keys.
- The "Braille tuşlarına tıklayarak yazınız." instruction is the **empty-state placeholder** inside the combined view (`.yazma-baslangic-yonerge`, shown when no cells written) — there is no separate instruction line above the panel.
- The **Kısaltma** toggle button is grey when off (`.kisaltma-mod-btn:not(.aktif)` → `--panel-border` bg + `--muted` text), blue (`.btn` accent) only when on (`.aktif`).

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

**NVDA OTOMATİK DİL DEĞİŞTİRME — Modül 9 (de/fr/en) yabancı içerik `lang` ile işaretli (kullanıcı: "ekran okuyucu bu dilleri otomatik algılayıp o dilde seslendirsin, Türkçe bölümler hariç"):** NVDA varsayılan "automatic language switching" ile bir öğenin `lang` niteliğine göre sesi değiştirir → biz yabancı ATOM'ları işaretleriz, NVDA dili değiştirir (uygulama "algılamaz"). `CokHucreOkuyucu`: `yabanciDil = seslendirmeDili !== 'tr' ? seslendirmeDili : null` (Türkçe sayfalar `tr` → lang YOK, etkilenmez). İki yer: (1) büyük harf gösterimi `lang={rtl ? 'ar' : (yabanciDil || undefined)}`; (2) **sr-only yönerge bölgesi** — yönerge "ä işareti, … dokunun" gibi yabancı harfle BAŞLADIĞINDAN (kategoriAdi modu `${ttsBaşlık}${kategoriAdi}`, ttsBaşlık = `oge.ttsYazi||oge.yazi` = yabancı harf), baştaki token `<span lang={yabanciDil}>{token}</span>` ile sarılır + kalanı Türkçe düz (lang YOK → tr): `srYonergeMetni.startsWith(token)` guard'ı ile (eşleşmezse düz string). Türkçe açıklamalar/yönergeler/nokta-numaraları lang taşımaz → NVDA Türkçe okur. `OkumaModuListesi`'ne `seslendirmeDili` geçilir; kart etiketi (`OkumaModu.jsx`) `lang={rtl ? 'ar' : (seslendirmeDili !== 'tr' ? seslendirmeDili : undefined)}` — ⚠ ama kart butonunun erişilebilir adı `aria-label` (Türkçe + harf) olduğundan span `lang`'i kart adında SINIRLI etkili (görünür içerikte etkili). **Uygulamanın KENDİ Web Speech TTS'i (`konus`+`seslendirmeDili`) AYRI sistem** — tek anonsta tek dil; bu işle DEĞİŞTİRİLMEDİ (kullanıcı NVDA kullanırken uygulama seslendirmesini kapatıyor). Tarayıcı doğrulaması: `/almanca/alfabe` + `/fransizca/alfabe-a-j` büyük harf+yönerge-span `lang=de`/`fr`, kalanı Türkçe; `/harfler` (tr) lang YOK; konsol temiz.

---

## 11. Common Mistakes

| Wrong | Correct |
|-------|---------|
| `useState(indeksAl(...))` — resumes from saved | `useState(0)` — always start from beginning |
| Change only DesenOgretici | **Always update CokHucreOkuyucu too** |
| `konus()`, `pause()`/`resume()`, or `aria-live` on warning toast | `gosterToast()` only, `aria-live="off"` — visual only, NVDA silent, TTS uninterrupted |
| Safety timer `90ms/char` — unlocks too early | `Math.min(30000, 6000 + len * 200)` (App TTS açık) |
| `yonergeyiKilitleyerekSeslendir` hep `onSon: yonergeKilidiAc` → NVDA'da (TTS kapalı) `konus` onSon'u anında tetikler, kilit hemen açılır, erken dokunuş öğeyi ilerletir | App TTS kapalıysa `onSon: undefined`; kilit `Math.min(12000, 2500+len*70)` timer'ı VEYA Tab ile açılır (bkz. §3 KRİTİK) |
| Focusing/announcing warning toast after `setState` | Do not focus warning toast; keep it `aria-live="off"` and visual-only |
| StrictMode: boolean flag for first-load skip | Compare `oncekiYol.current === null` |
| `kilitli`: only block onClick | Render as `<div>`, `aria-hidden`, remove all handlers |
| Narration bitince boş `dotSentinelRef` sentinel'e odaklan (NVDA "boş" der) | Focus **ilk braille noktası** `button.dot.target` (NVDA "1. nokta…" okur); sentinel yalnız nokta yoksa yedek (kullanıcı isteği — eski sentinel kuralı tersine çevrildi) |
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
| Edit ONE BRF→text decoder copy and assume the other matches | ⚠⚠ **GÜNCELLEME (bkz. aşağıda (8)): brf→metin artık TEK decoder — `brfOkuyucu.js` `brfMetinedonSistemi`. Araclar kendi `_brfMetinedon` kopyasını KULLANMIYOR (ölü kod); tüm decode fix'leri yalnız `brfOkuyucu.js`'e yapılır.** (Aşağıdaki "iki kopya senkron" notu TARİHSEL — Araclar'ın obje-map'li kopyası noktalamayı "[object Object]" yapıyordu, ortak decoder'a geçildi.) ⚠ **İKİ ÖZDEŞ DECODER KOPYASI VAR — birini düzeltince DİĞERİNİ de senkronla (TARİHSEL):** `Araclar.jsx` `_brfMetinedon` (satır ~1761, Modül 10 "metin→brf" aracı) **VE** `brfOkuyucu.js` `brfMetinedonSistemi` (BrfOku sayfası worker'ı + ML labellama `decode_cells.mjs`). Gövdeleri **byte-byte aynı tutulmalı** (helper'lar ortak `brailleCevir.js`'ten import; sabitler `_KISALTMA_TEK`/`_NOKTA_TERS`… iki dosyada da var). Sync: bir gövdeyi diğerine (imza hariç) kopyala; `diff` yalnız imza satırı (1c1) vermeli. **DECODER, ENCODER'IN (`metniBrailleyeCevirKisaltmali`) TERSİ OLMALI** (kullanıcı: "metin→brf doğru, labellama onun tersi olacak"). İki KRİTİK doğruluk değişmezi (yoksa round-trip kırılır): **(1)** tek-hücreli matematik sembolü harfle çakışır (√=[1,4,6]=ş, +=[3,4,6]) → `isAmbiguousMath` koruması: `if (islemIsareti && (!isAmbiguousMath(islemIsareti) || sM))` (sayı/satır yolu için iki yerde) → metin bağlamında harfe düşür, yoksa ş→√. **(2)** tek-harfli kısaltma (`_KISALTMA_TEK`, ör. v=var) ardından SADECE noktalama gelirse hâlâ kısaltmadır ("var."→"var.", yoksa "v.") → birHarf kontrolü `b.length===1` DEĞİL, "ilk hücre kısaltma + kalan hepsi `_NOKTA_TERS`" olmalı. **(3) MATEMATİK OKUMA — tek-hücreli matematik sembolü "SAYI YANINDA" matematik, yoksa harf (kullanıcı: "sayı yanında matematik kabul et, yoksa harf"):** √=(1,4,6)=ş, %=(1,3,4,5,6)=y, (=(1,2,6)=ğ, \|=(1,2,3)=l Türk harfleriyle çakışır. `isAmbiguousMath` koruyusu = matematik say EĞER `sM`/`sayiModu` (sayı ÖNCE) VEYA hemen ardından **GERÇEK sayı** (`[3,4,5,6]` rakam işareti + a–j rakam hücresi) geliyorsa. ⚠ Yalnız "[3,4,5,6] var mı" YETMEZ — kısaltmalarda (kök/çift-rakam) [3,4,5,6] kelime içinde görünür (belkili=…l,[3,4,5,6],l…) → **ardından gerçek rakam (a–j) şartı** yanlış-pozitifi önler. Sonuç: matematik decode 15→18/20 (√25/%50/(3+5) düzeldi), düz yazı regresyonsuz (793/800, cümle %100). Kalan: `a≤b` (değişken "a"→"aynı" kısaltması — encoder kaynaklı), `\|−7\|` (mutlak \| ardından operatör, doğrudan sayı yok → kuralın "sayı yanında" tanımı dışı). **(4) KESME İŞARETİ ('=[3]) vs KÜME İŞLEMİ + EK PARÇASI — "1922'de"→"1922∩", "Ahmet'e"→"Ahmet'leri" (kullanıcı: "kesme işaretinden sonra mat gelmez", "Ahmet'e hatalı"):** İki ayrı çakışma: **(a) [3]+ek küme işlemiyle çakışır:** `[3][2,4,5,6]`=∩ ("'de"), `[3][1,5]`=∈ ("'e"). Fix: **küme işlemleri** (`_KUME_ISLEMLERI`={alt küme,kapsar,birleşim,kesişim,fark,**elemanıdır**}) yalnız ardından **SET ADI** gelirse geçerli = büyük harf işareti `[6]` (tek harfli A,B) VEYA küme-adı öneki `[5,6]` (N,Z,Q); aksi halde `[3]`=kesme işareti → "5∈A"/"x∈N" korunur, "5'e"/"1922'de"/"Ahmet'e" düzelir. **(b) tek-harf-işareti [5,6]+harf ek-PARÇASIYLA çakışır:** `[5,6][1,5]` hem tek-harf "e" hem "leri" parça (data: `5,6+e`=ları,leri). "Ahmet'e" encoder'da kesme+[5,6]+e → "leri" okunuyordu. Fix: **`kesmeBayrak`** — [3] gerçekten APOSTROF olarak yazıldığında (np push, hA==='3') set; sonraki [5,6]+harf hücresi parça/math'ten ÖNCE **LİTERAL** okunur. ⚠ "vardır"/"gündür" KORUNUR: orada [3] apostrof DEĞİL (sessiz, "dır"/"dür" ekinin parçası) → bayrak set olmaz → parça çalışır. Sonuç: tüm ' + ek (kelime/sayı, [5,6]'lı veya çıplak) doğru; math 18/20, prose 793/100%. **(c) küme açma `{`=(1,2,3,5,6)(3)** — "ye" hecesi [1,2,3,5,6]+apostrof [3] ile çakışır ("Türkiye'nin"→"{nin"). `'küme açma'` da `_KUME_ISLEMLERI`'ne eklendi; `_setAdiSonra` ardından **[6]/[5,6]/[3,4,5,6]** (set elemanı: büyük harf/küme-adı/SAYI — {1,2} için) ister, yoksa reddet → "ye'nin". **(5) SORU İŞARETİ (?) = [2,3,6] — Modül 1 veri düzeltmesi (kullanıcı: "modül 1 noktalama ? 2,3,6 olmalı, 2,6 verilmiş"):** `braille.js` NOKTALAMA `?` eskiden `[2,6]` (YANLIŞ) → **`[2,3,6]`** (Modül 3 `NOKTALAMA_ISARETLERI` + standart Türkçe braille ile tutarlı; `[2,3,6]` hem soru işareti hem tırnak açma — konumdan ayırt edilir). ⚠ İKİ DECODER YAN ETKİSİ + fix (üç `_NOKTA_TERS` haritasında: `brailleCevir.js`/`brfOkuyucu.js`/`Araclar.jsx`): **(a)** `[2,3,6]` "son yazan kazanır" ile tırnağa (`"`) çözülüyordu → `_NOKTA_TERS.set('2,3,6','?')` (Türkçe'de ? baskın, düz çift-tırnak yok denecek kadar az) → `?` round-trip düzelir (cümle 78/78). **(b)** `?` [2,6]'dan çıkınca matematik `+` operatörü bozuldu (18→15): `+`=`[5,6][2,6]` (`ISLEM.arti`); `+`'dan sonra `sayiIsaretiOncesiSinirMi([2,6])` sayı moduna geçmek için `noktalamaHucreMi` (=`_NOKTA_TERS.has([2,6])`, eski `?`=[2,6] iken TRUE) kontrolüne dayanıyordu → `[2,6]` haritadan düşünce "+5"→"+kie". ⚠ **NAİF FIX `_NOKTA_TERS.set('2,6','?')` YANLIŞ — 've' kelimesini bozar** (`ve`=[2,6] kısaltma → "elma ve"→"elma ?"; kapsamli bunu yakalamadı, açıkça test et). **DOĞRU FIX:** `'2,6'`'yı **`matematikSayiSinirAnahtarlari`** set'ine ekle (üç kopya: `brfOkuyucu.js` + `Araclar.jsx` ×2 — biri `_brfMetinedon` biri cell-detay analizör; senkron). `[2,6]` = `+` operatörünün SON hücresi, sette zaten olan `'2,3,6'`(=×) ile tutarlı; `_NOKTA_TERS` DOKUNULMAZ → `ve`=[2,6] prose'da kısaltma kalır (boşlukla ayrık → sayı-sınırı tetiklenmez). **(c) Modül 10 kapsamı (kullanıcı: "metin→brf, brf→metin, doc→brf sayfalarında da giderilsin"):** üç araç da AYNI çeviricileri kullanır → tek fix hepsini kapsar. metin→brf (`Araclar`) + doc→brf (`BelgeBrf`) ENCODER = `metniBrailleyeCevir(Kisaltmali)` → `NOKTA_TABLO`=`braille.js` verisi → `?`=[2,3,6] üretir; brf→metin (`Araclar._brfMetinedon` + `BrfOku`→`brfOkuyucu`) DECODER = `_NOKTA_TERS`+sınır set. Sonuç: `?`/`ve`/`+rakam` hepsi doğru, `kapsamli_test.mjs` %98.70 (baseline %98.67 ÜSTÜ). **(6) TIRNAK AÇ/KAPA vs SORU İŞARETİ — brf→metin okuma (kullanıcı: "tırnak açılıp kapanması lazım; tek başına geldiğinde ? olarak algılanmalı"):** `[2,3,6]` hem `?` hem açılış tırnağı (`“`); kapanış tırnağı `[3,5,6]`=`”`. İki mekanizma (yalnız `brfOkuyucu.js` `brfMetinedonSistemi` — BrfOku sayfası): **(a) `acilisTirnagiMi(b,ci)`** ana döngüde: `[2,3,6]` açılış tırnağıdır ANCAK önceki hücre BOŞLUK/başlangıç (bir karaktere bitişik DEĞİL) + ardında içerik + ileride eşleşen `[3,5,6]` varsa → `“`; aksi halde `?` (soru işareti kelimeye yapışır, açılış tırnağı boşluktan sonra gelir). **(b) `bloklariIsle` BLOK-PEELING**: yapışık öndeki açılış `[2,3,6]` + sondaki kapanış `[3,5,6]` kelimeden AYRILIR (`onEk`/`sonEk`) → çekirdek kelime TEMİZ çözülür. ⚠ Gerekçe: `soru`=iki-harfli kısaltma `sr`=`[2,3,4]|[1,2,3,5]` ve tanıma `b.length===2` şartlı → yapışık tırnak olunca blok 4 hücre olup kısaltma tanınmıyor, `[2,3,4]`/`[1,2,3,5]` `_HECE_TERS`'te olmadığından tek harf `s`/`r`'ye düşüp "soru"→"sr" oluyordu. Peeling çekirdeği `[2,3,4]|[1,2,3,5]`=2 hücreye indirir → kısaltma tanınır. **Çok kelimeli tırnak** (`“çok iyi biri”`): açılış `“çok` bloğunda, kapanış `biri”` bloğunda → `kapanisIlerideArr[bi]` (her bloktan SONRA `[3,5,6]` var mı, tumBloklar üzerinde suffix-tarama) leading-peel'e `||` ile verilir. `cikis.push` noktaları (tek-harf/iki-harf kısaltma + son `buf.join`) `onEk+…+sonEk` ile sarılır. Test: 15/15 tırnak (tek/çok kelimeli/karışık/çoklu/büyük harf), regresyon YOK (%98.70). **(7) PARANTEZ — düz-yazı paren `[2,3,5,6]`'ya taşındı (kullanıcı: "hata varsa düzelt"):** ESKİDEN encoder `(`=`[1,2,6]` (matematik paren, `ğ` ile çakışır) + `)`=`[3,4,5]` (`se` hecesiyle çakışır) → "(soru)"→"ğsrse". Fix: `brailleCevir.js` `MATEMATIK_GENEL_SEMBOL_ADLARI`'ndan `'parantez açma'`/`'parantez kapama'` ÇIKARILDI → düz-yazı encoder NOKTALAMA parenini (`[2,3,5,6]`, harf/hece ile ÇAKIŞMAZ) üretir. Decoder peel (yukarıdaki bloklariIsle) genişletildi: blok-başı `[2,3,5,6]`→`(`, blok-sonu→`)` (çakışmasız olduğundan konum yeterli, eşleşme/pairing GEREKMEZ — tırnaktan farklı). Matematik ders verisi (`matematik.js`) hâlâ `[1,2,6]`/`[3,4,5]` (encoder'dan geçmez, decode `isAmbiguousMath` yolu korunur). Test: 12/12 paren (`(soru)`/`(çok iyi)`/`(3+5)` matematik korundu/`gitse`,`güzelse` "se"-sonlu bozulmaz/`ne (yani)?`), 8/8 tırnak+paren birlikte, regresyon YOK (%98.70). ⚠ Köşeli paren `[`/`]` (matematik `[2,4,6]`/`[1,3,5]`, `ö`/`o` ile çakışır) HÂLÂ math-set'te — nadir, dokunulmadı. **(8) ARACLAR DECODER KONSOLİDE — kendi kopyası yerine ortak `brfMetinedonSistemi` (kullanıcı: "hata varsa düzelt"):** `Araclar.jsx` BRF-dosyası okuma (satır ~5425) eski yerel `_brfMetinedon`'u çağırıyordu; o `_NOKTA_TERS`'i **OBJE-değerli** tutuyordu (cell-detay analizörü `np.isaret`/`np.isim` için) → text decode'da `buf.push(np)` OBJE basıp noktalamayı **"[object Object]"** yapıyordu + tırnak/`?`/paren fix'lerini almıyordu. Fix: `brfMetinedon(icerik)`→`brfMetinedonSistemi(icerik,false)`, `brfMetinedonKisaltmali(icerik,sis)`→`brfMetinedonSistemi(icerik,true,sis)` (`brfOkuyucu.js`'ten import). Eski `_brfMetinedon`+2 sarmalayıcı ÖLÜ KOD (yalnız cell-detay analizörü ayrı yaşar; obje-map ONA lazım). **⚠ Bu yüzden "iki özdeş decoder" notu ARTIK GEÇERSİZ — brf→metin TEK decoder (`brfMetinedonSistemi`); Araclar kendi kopyasını kullanmıyor.** Tüm tırnak/paren/`?` fix'leri yalnız `brfOkuyucu.js`'te; Araclar+BrfOku ikisi de oraya gider. **(9) METİN→BRF DÜZ TIRNAK aç/kapa (kullanıcı: "Sen ve ben? \"bu\" — tırnaklar yanlış çevriliyor"):** Düz tırnak `"` (U+0022) açılış+kapanış AYNI karakter → `NOKTA_TABLO.get('"')`=[2,3,6] ikisini de veriyordu (kapanış [3,5,6] olmalı). Fix: `metniBrailleyeCevirKisaltmali` token-encode döngüsünde `tirnakAcik` TOGGLE — noktalama dalında `tok.deger==='"'` ise açılış [2,3,6]/kapanış [3,5,6] (kıvrık `“`/`”` U+201C/U+201D encoder'da zaten NOKTA_TABLO ile doğru). `metniBrailleyeCevir` (kısaltmasız) toggle'ı ZATEN vardı (satır ~1136); kısaltmalı encoder'a eklendi. **+ Araclar cell-detay analizörü etiketi:** [2,3,6]→np='?' (override) yüzünden açılış tırnağı "soru işareti" etiketleniyordu → kaynak karakter `"`/`“`/`”` ise etiket HÜCREYE göre "tırnak açma" ([2,3,6]) / "tırnak kapama" ([3,5,6]) verilir (parenSwap'ın `paren24356Count` toggle'ının tırnak karşılığı; tırnakta hücre zaten aç/kapa ayırdığından sayaç gerekmez). `?` kaynağı (tırnak değil) generic np='soru işareti' yolunu alır. **⚠ HER İKİ FİX DE PAYLAŞIMLI → üç araca da otomatik uyar (kullanıcı: "diğer güncellemelerinde burada uyarla"):** encoder (`metniBrailleyeCevir(Kisaltmali)`) metin→brf (`Araclar`) + doc→brf (`BelgeBrf`) tarafından; etiket fix'i `hucreAnlamiTekil` (EXPORT, paylaşımlı) içinde → `Araclar`+`BelgeBrf`(satır ~412)+`BrfOku`(satır ~203) üçü de `hucreAnlami`'yı `kaynak`+`esleme` ile çağırdığından (threading `hucreAnlamiBaglamVeModSifir` opts.kaynak→_kaynak) fix üçünde de tetiklenir. Ayrı uyarlama GEREKMEZ. (`metniLatinBrailleyeCevir` = ÖLÜ KOD, çağıranı yok.) Regresyonsuz (%98.70). **Kapsamlı doğrulama: `node _datasets/kapsamli_test.mjs`** (round-trip kategori kategori %98.67 + encoder kılavuz-uygunluğu + çakışma taraması 10/10; çakışanlar √/ş %/y (/ğ [/ö \|/l + parça/tek-harf [5,6]+harf hepsi bağlamla çözülür). NOT: Unicode üst-simge `²` encoder'da DESTEKLENMEZ (`3^2` yazılmalı); `-`(tire)→bağ(3,6), `−`(U+2212)→math minus(5,6)(3,6) — ikisi de doğru. İşlemler (+−×÷=, (5,6) önekli) zaten sorunsuz. Regresyon testi: `node _datasets/mattest.mjs` (matematik) + `node _datasets/genistest.mjs` (düz yazı). Resmî kaynak: [braille-matematik-yazim-kurallari.md](braille-matematik-yazim-kurallari.md) (MEB 2017 kılavuzu özeti). **Regresyon testi:** `node _datasets/genistest.mjs` (800 sözlük kelimesi + cümleler encode→decode round-trip; hedef ≥%99 kelime / %100 cümle; kalan kelime hataları yabancı-kökenli ünlü-uyumu, kabul). |

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
│   # ✗ NoktalamaEgitimi.jsx — DELETED (Modül 1 noktalama dersi kaldırıldı; konu Modül 3'te)
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
    ├── noktaYardimci.js         # noktaListesi(), nlDan(), dokunmaKapanisi() — dot description helpers
    ├── isaretCevir.js           # isarettenOgeye() — symbol data → CokHucreOkuyucu oge
    ├── diziYardimci.js          # karistir(), HUCRE_SIRA_SOZ — shuffle + ordinal words
    ├── dersAkisi.js             # sonrakiDers(pathname) — bitti ekranı "Sonraki İçerik" akışı (modül içi)
    ├── karisikYazmaKaynaklari.js # URL → mixed writing source mapping (düz + iç içe rotalar)
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
