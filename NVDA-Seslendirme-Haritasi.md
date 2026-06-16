# NVDA Seslendirme Haritası — Tüm Sayfalar (Modül 1–9)

Bu belge, ekran okuyucu (NVDA) açıkken **her sayfada** yönerge seslendirmelerinin
**nasıl ve hangi sırayla** okunduğunu, **sıralı** olup olmadığını, **araya başka ses
karışırsa** önceki yönergenin tekrar erişilebilir olup olmadığını, **yönergenin ekranda
(kalıcı bölgede) kalıp kalmadığını** ve **"sıradaki nokta" geri bildiriminin yönergeden
ayrı bir bölgede** yazılıp yazılmadığını gösterir.

> Senaryo: kullanıcı NVDA kullanırken **uygulama seslendirmesini (app TTS) KAPATIR**.
> Bu yüzden yönerge metni NVDA'ya **DOM'daki canlı (aria-live) bölgelerden** ulaşır.
> (App TTS açıkken metinler ayrıca `konus()` ile sesli okunur; tek TTS kanalı sıralıdır.)

Modül 10 (BRF araçları) kapsam dışıdır.

---

## 0. İki Seslendirme Mimarisi

Her sayfa iki mimariden birini kullanır. Tek tek sayfaların cevapları büyük ölçüde
mimarisinden gelir; sayfaya özgü farklar tablolarda not düşülür.

### MİMARİ A — `CokHucreOkuyucu` (tüm öğrenme dersleri: Modül 1,2,3,5,6,7,8,9)

İki **ayrı** `sr-only` (görünmez) canlı bölge + yönerge kilidi + giriş odağı.

| Soru | Cevap (Mimari A) |
|------|------------------|
| **Yönerge nasıl/hangi sırayla?** | Sayfaya girişte (modülden VEYA yenileme) **ses kaydı OLMAYAN** derslerde (A1/A2/A5) odak **yönerge bölgesine** gelir → NVDA **önce yönergeyi** okur; **ses kayıtlı** derslerde (A3/A4) odak başlığa düşer (yönerge yine kalıcı polite bölgede). Öğe sırası: ① (varsa) `sesOncesiYonergeMetni` → ② (varsa) **ses kaydı** (Kur'an/müzik audio) → ③ **ana yönerge** (ad + açıklama + "N. ve M. noktalardan oluşur" + "Lütfen sırayla dokunun"). |
| **Ses sıralı mı?** | **EVET.** Tek TTS kanalı; öğe içi sıra yukarıdaki ①→②→③. Dokunuş onayı **doğru sesi** (ding, kuyruğa girmez) + ayrı bölge. |
| **Araya ses karışırsa önceki tekrar okunur mu?** | **Yönerge KALICI bölgede durur, KAYBOLMAZ.** Yönerge okunurken dokunma **kilitli** → araya TTS karışmaz; yalnız **görsel toast** çıkar (NVDA sessiz, ses kesilmez). **"Tekrar" butonu** yönergeyi yeniden okutur (aynı metin bile nonce ile yeniden duyurulur). |
| **Yönerge ekranda (NVDA) kalır mı?** | **EVET.** Yönerge `sr-only aria-live="polite" aria-atomic` **kalıcı** bölgede (`srYonergeMetni`); ilk render'da hazır, öğe boyunca durur. |
| **Sıradaki nokta AYRI bölgede mi?** | **EVET.** "Sıradaki nokta / doğru / yanlış / sonraki hücre / tamamlandı" geri bildirimi **ayrı** bir `sr-only aria-live="assertive" aria-atomic` bölgeden (`srSiradakiNokta`) gelir — yönerge bölgesinden **bağımsız**. Yönerge durur; sıradaki nokta bu ayrı bölgede her dokunuşta yer değiştirir. |

**Nokta etiketi:** her braille noktası `"N. nokta, basılacak nokta / dolu / boş"` okur
(hedef = "basılacak nokta", basılı = "dolu", desen dışı = "boş").
**Bitiş ekranı:** odak "Tebrikler" mesajına gelir (NVDA okur) + butonlar
(Sonraki İçerik / Karışık Yazma / Baştan Başla).

**Mimari A alt-türleri (yalnız ①–③ sırasını/içeriğini değiştirir):**
- **A1 — Sembol dersi** (`kategoriAdi`, ses yok): yönerge = "{ad} {kategori}, {açıklama}
  {nokta kompozisyonu}. Lütfen bu noktalara sırayla dokunun."
- **A2 — Kısaltma** (`noktalariSeslendir`): yönerge = "{özel açıklama} {nokta kompozisyonu}.
  Lütfen bu noktalara sırayla dokunun."
- **A3 — Ses kaydı ÖNCE** (`ogeSesiOnceCal`): ses kaydı çalar → bitince yönerge. ✅ **Çakışma
  ÇÖZÜLDÜ:** yönerge bölgesi (`srYonergeMetni`) ses kaydı çalarken **BOŞ** tutulur, ses BİTİNCE
  (`onEnded` / güvenlik 5sn) doldurulur → NVDA yönergeyi ses kaydından SONRA okur (üst üste binmez).
  Ayrıca dot-odak'a geçiş bu sayfalarda yapılmaz (yönergeyi yarıda kesmesin). Bkz. CLAUDE.md §3 `sesKaydiOnce`.
- **A4 — Ses kaydı SONRA** (`otomatikOgeSesi`, gecikmeli): yönerge → (gecikme) ses.
- **A5 — Okuma modu** (`kategoriAdi` YOK): yönerge = "{ad}, okunuşu: {okunuş}. {anlam}
  {hücre yönergesi}". `sadeceHucreYonergesiOku` ise yalnız hücre yönergesi.

### MİMARİ B — Eski/özel sayfalar: **Hücreyi Tanı + tüm Testler + tüm Yazma sayfaları**

`konus()` tabanlı + **TEK** `role="status" aria-live="polite"` bölge; geri bildirim **ayrı
bölge DEĞİL**, `konus()`/`basariBildir()`/`hataBildir()` ile (app TTS + global `_srBolge`).

| Soru | Cevap (Mimari B) |
|------|------------------|
| **Yönerge nasıl/hangi sırayla?** | Adım/soru değişince `konus(yönerge)` + tek polite bölge güncellenir. Giriş odağı **başlıkta** (yönerge bölgesinde değil) → kullanıcı bölgeye/girdiye gitmeli. |
| **Ses sıralı mı?** | **EVET** (tek TTS kanalı, `konus` kesintiyle akar). |
| **Araya ses karışırsa önceki tekrar okunur mu?** | Yönerge tek polite bölgede durur (erişilebilir). **"Soruyu/Yönergeyi Tekrarla" butonu** yeniden okutur. ⚠ Geri bildirim ile yönerge **AYNI kanaldan** gittiğinden hızlı dokunuşta `konus` birbirini **KESER** (Mimari A'daki kilit + kuyruksuz ses + ayrı assertive bölge YOK). |
| **Yönerge ekranda (NVDA) kalır mı?** | **KISMEN.** Tek polite bölge güncel hedefi/soruyu tutar; ama **tam "dokunun" yönergesi** çoğunlukla yalnız `konus()`/`_srBolge` ile (kalıcı sayfa bölgesinde değil). |
| **Sıradaki nokta AYRI bölgede mi?** | **HAYIR.** Geri bildirim ("N doğru", "N yanlış", "Şimdi X hücreye geçin") `konus()`/`_srBolge` ile duyurulur; yönergeyle aynı kanal mantığını paylaşır. Ayrı assertive bölge yoktur. |

---

## Modül 1 — Braille Öğrenme (Harfler)

| Sayfa | Rota | Bileşen / Mimari | Yönerge sırası (NVDA) | Yönerge kalıcı? | Sıradaki nokta ayrı bölge? |
|-------|------|------------------|------------------------|-----------------|----------------------------|
| **Hücreyi Tanı** | `/hucre` | HucreTanima / **B (özel)** | `konus` + tek polite bölge "Yönerge: N numaralı noktaya dokunun." Tek nokta adımlar (1→6). | Kısmen (tek polite bölge, güncel hedef). ⚠ `konus` da `_srBolge`'ye yazar → **çift okuma riski**. | **Hayır** — doğru/yanlış `basariBildir`/`hataBildir` (`_srBolge`). |
| **Harf Eğitimi** | `/harfler` | CokHucreOkuyucu / **A1** | yönerge → (dokunma) sıradaki nokta. "A harfi, … 1. ve 2. noktalardan oluşur. Lütfen…" | **Evet** | **Evet** (assertive bölge) |
| **Rakam Eğitimi** | `/rakamlar` | CokHucreOkuyucu / **A1** | A1 ile aynı (kategori "rakamı"). Çok hücreli (sayı işareti + rakam) → "1. hücre…, 2. hücre…". | **Evet** | **Evet** |
| **Noktalama İşaretleri** | `/noktalama` | CokHucreOkuyucu / **A1** | A1 (kategori "işareti"). | **Evet** | **Evet** |
| **Test / Sınav** | `/test` | Test.jsx / **B (test)** | `konus("Soru N: {ad}. …noktalara dokunun")` + tek polite bölge (soru özeti). | Kısmen (soru özeti bölgede; tam yönerge `konus`). | **Hayır** ("N doğru/yanlış" `konus`). |

---

## Modül 2 — Kısaltmalar

Beş ders de **CokHucreOkuyucu / A2** (`noktalariSeslendir`): yönerge özel açıklama + **tam
nokta kompozisyonu** + "Lütfen bu noktalara sırayla dokunun". Hepsinde yönerge **kalıcı**
(polite), sıradaki nokta **ayrı** (assertive).

| Sayfa | Rota | Not |
|-------|------|-----|
| **Bir Harfli Kısaltmalar** | `/kisaltma-bir-harfli` | Tek hücre. |
| **İki Harfli Kısaltmalar** | `/kisaltma-iki-harfli` | İki hücre → "1. hücre…, 2. hücre…". |
| **Hece Kısaltmaları** | `/kisaltma-hece` | Tek/çok hücre. |
| **Kelime Kökü Kısaltmaları** | `/kisaltma-kelime-koku` | Kök işareti (5) + sembol → iki hücre. |
| **Kelime Parçası Kısaltmaları** | `/kisaltma-kelime-parcasi` | İki hücre. |
| **Test / Sınav** | `/test-kisaltma` | TestKisaltma / **B (test)** — yönerge `konus` + tek polite bölge; geri bildirim `konus`. |

---

## Modül 3 — Noktalama ve Özel İşaretler

| Sayfa | Rota | Bileşen / Mimari | Not |
|-------|------|------------------|-----|
| **Noktalama İşaretleri** | `/noktalama-isaretleri` | CokHucreOkuyucu / **A1** | Yönerge kalıcı, sıradaki nokta ayrı. |
| **Diğer Özel İşaretler** | `/ozel-isaretler` | CokHucreOkuyucu / **A1** | Aynı. |
| **Test / Sınav** | `/test-noktalama` | CokluTest / **B (test)** | Yönerge `konus` + tek polite bölge; geri bildirim `konus`. |

---

## Modül 4 — Yazma (Mimari B — yazma; CokHucreOkuyucu DEĞİL)

Bu sayfalar **6 tuşlu klavye (BrailleKlavye)** ile **yazma** alıştırmasıdır; nokta dokunma
+ yönerge kilidi yoktur. Yönerge `konus(yonerge())` + polite bölge; geri bildirim `konus`.

| Sayfa | Rota | Yönerge sırası (NVDA) | Yönerge kalıcı? | Sıradaki nokta ayrı bölge? |
|-------|------|------------------------|-----------------|----------------------------|
| **Perkins Klavye Eğitimi** | `/yazma-egitim` | Adım yönergesi `konus` (tek nokta → harf → boşluk/sil). | Tek polite/`_srBolge`. | **Hayır** (`basariBildir`/`hataBildir`). |
| **Yönergeli Yazma** | `/yazma-yonergeli` | `konus("Sıradaki karakter: X. …")` + görünür `.yazma-ipucu` (polite) + `sr-only` (polite). | **Evet** (iki polite bölge). | **Hayır** — yazılan harf/boşluk/sil `konus`. |
| **Yönergeli Cümle Yazma** | `/yazma-yonergeli-cumle` | Yönergeli Yazma ile aynı (cümle düzeyinde). | **Evet** | **Hayır** |
| **Serbest Yazma** | `/yazma-serbest` | Yönerge yok (serbest); yazılan metin `sr-only aria-live=polite` kutudan okunur, hücre `konus` ile. | Okuma kutusu (polite, kalıcı). | Yok (serbest; geri bildirim `konus`). |

---

## Modül 5 — Kur'an-ı Kerim

Harfler hariç hepsi **CokHucreOkuyucu / A1** (`rtl`). Harfler **A3** (ses kaydı önce).
Hepsinde yönerge **kalıcı** (polite), sıradaki nokta **ayrı** (assertive).

| Sayfa | Rota | Alt-tür | Yönerge sırası (NVDA) |
|-------|------|---------|------------------------|
| **Kur'an Harfleri** | `/kuran-harfler` | **A3** (`ogeSesiOnceCal` + `ogeSesiHerZaman`) | **Ses kaydı (harf telaffuzu) çalar → bitince yönerge** ("…Kur'an harfi, … noktalardan oluşur…"). ✅ Yönerge bölgesi ses bitene kadar boş → NVDA ses kaydından SONRA okur (çakışma yok). |
| **Harekeler** | `/kuran-harekeler` | **A1** (`rtl`) | yönerge → sıradaki nokta. |
| **Cezim ve Şedde** | `/kuran-isaretler/cezm-sedde` | **A1** | yönerge → sıradaki nokta. |
| **Tenvinler** | `/kuran-isaretler/tenvinler` | **A1** | Çok hücreli (örn. üstün tenvin) → "1. hücre…, 2. hücre…". |
| **Ta-i Merbûta** | `/kuran-isaretler/ta-i-merbuta` | **A1** | — |
| **Med Harfleri** | `/kuran-isaretler/med-harfleri` | **A1** | — |
| **Mukadder Medler** | `/kuran-isaretler/mukadder-medler` | **A1** | — |
| **Elif-i Zaid** | `/kuran-isaretler/elif-zaid` | **A1** | — |
| **Diğer Uzatma** | `/kuran-isaretler/diger-uzatma` | **A1** | — |
| **Hemzeler** | `/kuran-isaretler/hemzeler` | **A1** | — |
| **Hemze-i Vasl ve Kat** | `/kuran-isaretler/hemze-vasl` | **A1** | — |
| **Uzatma İşaretleri** | `/kuran-uzatma` | **A1** | — |
| **Test / Sınav** | `/test-kuran` | **B (test)** | Yönerge `konus` + tek polite bölge; geri bildirim `konus`. |

> ⚠ **Ses kayıtlı sayfalarda (Harfler) giriş odağı yönergeye verilmez** ("ses kaydı olanlar
> hariç" kuralı) → bu sayfalar girişte başlığa düşer; yönerge yine kalıcı polite bölgededir.

---

## Modül 6 — Matematik

| Sayfa | Rota | Bileşen / Mimari | Yönerge sırası (NVDA) |
|-------|------|------------------|------------------------|
| **Rakamlar** | `/mat-rakamlar` | CokHucreOkuyucu / **A1** | Çok hücreli (sayı işareti + rakam). yönerge kalıcı, sıradaki nokta ayrı. |
| **Sıra sayıları** | `/mat-sira-sayilari` | CokHucreOkuyucu / **A1** | 2 hücre (sayı işareti alta kaydırılmış). |
| **İşaretler** | `/mat-semboller` | CokHucreOkuyucu / **A1** | — |
| **Ölçüler** | `/mat-olculer` | CokHucreOkuyucu / **A1** | — |
| **Geometri** | `/mat-geometri` | CokHucreOkuyucu / **A1** | — |
| **İfade Okuma** | `/mat-ifadeler` | CokHucreOkuyucu / **A5** (`ikiHucreYanYana`) | Okuma modu: "{ifade}, okunuşu… {hücre yönergesi}". İki hücre yan yana. |
| **Test / Sınav** | `/test-matematik` | CokluTest / **B (test)** | Yönerge `konus` + tek polite bölge; geri bildirim `konus`. |

---

## Modül 7 — Fen Bilimleri

| Sayfa | Rota | Bileşen / Mimari | Yönerge sırası (NVDA) |
|-------|------|------------------|------------------------|
| **Yunan Harfleri** | `/fen-yunan` | CokHucreOkuyucu / **A1** | Çok hücreli (Yunan göstergesi 4-5-6 + harf). yönerge kalıcı, sıradaki nokta ayrı. |
| **Birim ve Semboller** | `/fen-semboller` | CokHucreOkuyucu / **A1** | — |
| **Kimyasal Formüller** | `/fen-kimya` | FenFormulOkuma / **A5** (okuma) | "{formül}, okunuşu… {hücre yönergesi}". |
| **Fizik Formülleri** | `/fen-fizik` | FenFormulOkuma / **A5** (okuma) | Aynı (fizik). |
| **Test / Sınav** | `/test-fen` | CokluTest / **B (test)** | Yönerge `konus` + tek polite bölge; geri bildirim `konus`. |

---

## Modül 8 — Müzik

Tüm konu dersleri **MuzikBrailleSayfa / A3** (`/muzik/:slug`): sesli sayfa ise
`ogeSesiOnceCal` + `ogeSesiHerZaman` + `yonergeFormati="sirayla"`; bazı öğelerde
`sesOncesiYonergeMetni` (bilgi önce). Yönerge **kalıcı** (polite), sıradaki nokta **ayrı**
(assertive).

**Öğe içi sıra (sesli):** (varsa) `sesOncesiYonergeMetni` → **piyano/ritim sesi** → yönerge
("sırayla" formatında, "1. hücre: … noktalara dokununuz"). ✅ Yönerge bölgesi ses bitene kadar
boş → NVDA piyano sesinden SONRA okur (çakışma yok; A3 ile aynı `sesKaydiOnce` mekanizması).

| Ders | Rota | | Ders | Rota |
|------|------|--|------|------|
| Notalar | `/muzik/notalar` | | Donanım | `/muzik/donanim` |
| Nota süreleri 1 | `/muzik/sureler-temel` | | Ölçü çizgisi ve tekrar | `/muzik/olcu-cizgileri` |
| Nota süreleri 2 | `/muzik/sureler-ileri` | | Bağlar | `/muzik/bag-slur` |
| Sus | `/muzik/sus` | | Çalma Teknikleri | `/muzik/dinamikler` |
| Sus 2 | `/muzik/sus-ileri` | | Nüans (önce) | `/muzik/nuans-once` |
| Uzatma noktası | `/muzik/uzatma-noktasi` | | Nüans (sonra) | `/muzik/nuans-sonra` |
| Oktav (4, 5, 3) | `/muzik/oktav-temel` | | Süslemeler | `/muzik/suslemeler` |
| Oktav (1, 2, 6, 7) | `/muzik/oktav-ileri` | | Düzensiz gruplar | `/muzik/duzensiz-gruplar` |
| Ölçü sayılarının yazımı | `/muzik/zaman-imzasi` | | Braille tekrar | `/muzik/tekrar` |
| Tempo İşaretleri | `/muzik/tempo` | | | |
| Değiştirici işaretler | `/muzik/degistirici` | | | |

> Slug'lar `MUZIK_BOLUMLER`'den türer; ders adları yukarıdaki `kisaBaslik`'lerdir.

| Diğer | Rota | Mimari | Not |
|-------|------|--------|-----|
| **Dizi Okuma** | `/muzik-diziler` | MuzikDiziOkuma / **A5** (okuma) | yönerge kalıcı, sıradaki nokta ayrı. |
| **Test / Sınav** | `/test-muzik` | CokluTest / **B (test)** | Yönerge `konus` + tek polite bölge; geri bildirim `konus`. |

---

## Modül 9 — Yabancı Dil Braille

Tüm dersler **YabanciBrailleSayfa / A1** (`kategoriAdi="işareti"`, `seslendirmeDili`).
Yönerge **kalıcı** (polite), sıradaki nokta **ayrı** (assertive). **NVDA otomatik dil
değiştirme:** yabancı harf/sözcük `lang` ile işaretli → NVDA o atomu o dilde okur, Türkçe
açıklamalar Türkçe kalır.

| Dil | Dersler (rota `/{dil}/{slug}`) |
|-----|--------------------------------|
| **İngilizce** (`/ingilizce/…`) | Alfabe `temel-alfabe`, Grup işaretleri, Tek hücreli kelimeler, Çoklu sembol, Kısaltmalar, Kelime sonu (6 ders) |
| **Almanca** (`/almanca/…`) | Alfabe `alfabe`, Kelime parçası, Bir harfli 1/2/3 (5 ders) |
| **Fransızca** (`/fransizca/…`) | Alfabe A–J / K–T / U–Z, Aksanlı harfler, Bir harfli 1/2/3, Kelime parçası (8 ders) |

---

## Özet — Soruların genel cevabı

| Soru | Mimari A (öğrenme dersleri) | Mimari B (Hücreyi Tanı, Testler, Yazma) |
|------|----------------------------|------------------------------------------|
| **Yönerge sıralı okunuyor mu?** | Evet — ①ses-öncesi-bilgi → ②ses-kaydı → ③yönerge. | Evet — `konus` tek kanal. |
| **Araya ses karışınca önceki tekrar okunur mu?** | Yönerge kilitli (kesilmez) + kalıcı bölge + "Tekrar" butonu. | Kalıcı bölge + "Tekrarla" butonu; ama geri bildirim yönergeyle aynı kanaldan kesebilir. |
| **Yönerge ekranda (NVDA) kalır mı?** | **Evet** — kalıcı `aria-live=polite` bölge. | Kısmen — tek polite bölge / `_srBolge`. |
| **Sıradaki nokta AYRI bölgede mi?** | **Evet** — ayrı `aria-live=assertive` bölge. | **Hayır** — `konus`/`_srBolge` ile. |

**Sonuç:** "Yönerge ekranda kalır + sıradaki nokta ayrı bölgede" şartı **yalnız Mimari A**
(tüm öğrenme dersleri) için tam karşılanır. **Hücreyi Tanı, tüm Test sayfaları ve tüm Yazma
sayfaları (Mimari B)** ayrı assertive bölge kullanmaz; geri bildirim `konus()`/`_srBolge`
ile yönergeyle aynı kanaldan akar.
