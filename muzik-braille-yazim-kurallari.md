# Braille Müzik Notasyonu — Tam Yazım Kuralları Referansı

> **Kaynak:** *Braille Music Notation: Introductory Training* (Leanne Newham, NextSense / UEB Online, Revision 2, 2026) — 131 sayfa, Lesson 1–11 + Appendix (Summary of Signs).
> **Amaç:** Modül 10 BRF editörünün ve `data/muzik.js` / `utils/music-brf` kodlamalarının bu kurallara göre **eksiksiz** doğrulanması.
> **Nokta gösterimi:** Hücreler `1-4-5` biçiminde (repodaki `hucreler` dash-key formatı ile birebir karşılaştırılabilir). `[boşluk]` = boş hücre (ölçü ayracı).

---

## 0. Hücre Mantığı (Lesson 1–2)

Müzik braille hücresi tek hücrede hem **perde (pitch)** hem **süre (duration)** taşır:
- **Perde** → noktalar **1, 2, 4, 5**.
- **Süre** → noktalar **3 ve/veya 6** eklenir.

### 0.1 Notalar (temel = 8'lik / quaver)
| Nota | Hücre | Nota | Hücre |
|---|---|---|---|
| C (do) | `1-4-5` | G (sol) | `1-2-5` |
| D (re) | `1-5` | A (la) | `2-4` |
| E (mi) | `1-2-4` | B (si) | `2-4-5` |
| F (fa) | `1-2-4-5` | | |

> Müzik oktavları **C**'de başlar (A'da değil). Müzik C'si literary C'den farklıdır.

### 0.2 Süreler — 3/6 noktası ekleme (DUAL anlam)
Her hücre **iki** süre değeri taşır; hangisi olduğu ölçüdeki vuruş sayısından anlaşılır:
| Değer | Ekleme | Çift anlam |
|---|---|---|
| Quaver (8'lik) | ekleme yok | = 128'lik |
| Crotchet (4'lük) | **+6** | = 64'lük |
| Minim (2'lik) | **+3** | = 32'lik |
| Semibreve (1'lik) | **+3-6** | = 16'lık |

Örn. G crotchet = `1-2-5-6`; B minim = `2-3-4-5`; C semibreve = `1-3-4-5-6`.

### 0.3 Suslar (Rests)
| Değer | Hücre | Çift anlam |
|---|---|---|
| Semibreve sus (birlik) | `1-3-4` | = 16'lık sus |
| Minim sus (ikilik) | `1-3-6` | = 32'lik sus |
| Crotchet sus (dörtlük) | `1-2-3-6` | = 64'lük sus |
| Quaver sus (sekizlik) | `1-3-4-6` | = 128'lik sus |

### 0.4 Uzatma noktası (dotted)
- Nota/sus hücresinden **hemen sonra** `3` (dot 3) yazılır; değeri yarısı kadar uzatır.
- **Çift nokta** (double dotted): ikinci bir `3` daha eklenir (Lesson 11.3, bar 6). Tek noktalı nota ile aynı mantık.

### 0.5 Ölçü ayracı (barline)
- Normal ölçü çizgisi = **boş hücre** `[boşluk]` (iki ölçü arasında bir boşluk).

---

## 1. Oktav İşaretleri (Lesson 3) — KULLANIM KURALLARI ⚑ kritik

### 1.1 İşaretler
| Oktav | Hücre | Oktav | Hücre |
|---|---|---|---|
| 1. oktav (en pes C) | `4` | 5. oktav | `4-6` |
| 2. oktav | `4-5` | 6. oktav | `5-6` |
| 3. oktav | `4-5-6` | 7. oktav (en tiz) | `6` |
| 4. oktav (orta C) | `5` | | |

### 1.2 NE ZAMAN oktav işareti konur (aralık kuralı)
İki nota arası "aralık" = satır+aralık adımı sayılır, **bulunduğun nota 1 sayılır**.

1. **Bir eserin ilk notası VE her yeni braille satırının ilk notası** mutlaka oktav işareti alır.
   - Yeni satırın ilk vuruşunda **sus** varsa, oktav işareti susa değil, o satırdaki **ilk notaya** konur (susun perdesi yoktur).
2. **2'li veya 3'lü aralık** → **asla** oktav işareti almaz (farklı oktavda olsa bile).
3. **4'lü veya 5'li aralık** → **sadece oktav değişiyorsa** alır.
4. **6'lı, 7'li ve oktav (8'li) aralık** → **her zaman** alır.

**Özet:** 2/3 → asla · 4/5 → bazen (oktav değişirse) · 6+ → her zaman.

### 1.2.b ZORUNLU oktav işareti (aralık kuralının ÜSTÜNDE) ⚑⚑
Aralık ne olursa olsun, şu durumlarda nota **mutlaka** oktav işareti alır:

| Durum | Kaynak |
|---|---|
| Eserin ilk notası | Lesson 3 |
| Her yeni braille satırının ilk notası | Lesson 3 |
| **Bir SÖZCÜK'ten (dinamik/tempo/ifade: p, f, mf, cresc, rit, dolce…) sonraki ilk nota** | **Lesson 6, kural 4** |
| Başla-tekrar (`\|:`) / bitir-tekrar (`:\|`) sonraki ilk nota | Lesson 9 |
| **Sayısal/geriye tekrardan** sonraki ilk nota | Lesson 10 |
| **Braille tekrar `⠶`+sayı (çoklu)** sonrası ilk nota | Lesson 10, s.95 (PDF doğrulandı) |
| **Tek `⠶`** sonrası: yalnızca **tie sınırı geçiyorsa** devam eden nota (tie yoksa normal aralık kuralı) | PDF s.94 (ties-across bar4 vs Jingle bar3) |
| Volta (1./2. dolap) işaretinden sonraki ilk nota | Lesson 9 |
| Zaman/donanım imzası DEĞİŞİMİNDEN sonraki ilk nota | Lesson 4 |
| In-accord / ölçü-bölme işaretinden sonraki ilk nota *(çok sesli — kapsam dışı)* | MBC/NIM |

> ⚠️ **AYRIM (çok önemli):** Bir **dinamik/tempo SÖZcüğü** sonraki notada oktav işaretini **zorlar** (Lesson 6 k.4). Ama bir **nüans veya süsleme SEMBOLÜ** (staccato, accent, tenuto, trill, mordan…) oktav işaretini **zorlamaz** — onlardan sonraki nota normal aralık kuralına tabidir (Lesson 7: "The note following these signs does not require an octave sign"). Hairpin (yelpaze) çizgileri de sembol sayılır; sözcük değildir.

### 1.3 Bitişiklik kuralı
- Oktav işareti ile notası arasına **hiçbir şey giremez**; işaret notanın hemen önündedir.
- (Sıra: aksidental → oktav → nota; bkz. Bölüm 13.)

---

## 2. Zaman İmzaları (Lesson 4 + Appendix)

Yapı = **sayı işareti `3-4-5-6`** + **üst rakam** (hücrenin üst kısmı) + **alt rakam** (hücrenin alt kısmı). Standart = 3 hücre. Kendi satırında, **ortalanmış**, müziğin üstünde.

**Üst rakam:** 1=`1` 2=`1-2` 3=`1-4` 4=`1-4-5` 5=`1-5` 6=`1-2-4` 7=`1-2-4-5` 8=`1-2-5` 9=`2-4` 0=`2-4-5`
**Alt rakam:** 1=`2` 2=`2-3` 3=`2-5` 4=`2-5-6` 5=`2-6` 6=`2-3-5` 7=`2-3-5-6` 8=`2-3-6` 9=`3-5` 0=`3-5-6`

| İmza | Hücreler |
|---|---|
| 4/4 | `3-4-5-6` · `1-4-5` · `2-5-6` |
| 3/4 | `3-4-5-6` · `1-4` · `2-5-6` |
| 6/8 | `3-4-5-6` · `1-2-4` · `2-3-6` |
| 3/2 | `3-4-5-6` · `1-4` · `2-3` |
| **Common time** (C) | `4-6` · `1-4` |
| **Cut common** (¢) | `4-5-6` · `1-4` |

---

## 3. Değiştiriciler / Donanım (Lesson 4 + Appendix)

### 3.1 Aksidentaller
| İşaret | Hücre |
|---|---|
| Diyez (sharp) | `1-4-6` |
| Çift diyez | `1-4-6` `1-4-6` |
| Bemol (flat) | `1-2-6` |
| Çift bemol | `1-2-6` `1-2-6` |
| Naturel | `1-6` |

### 3.2 Donanım (Key signature)
- Kendi satırında, **ortalanmış**, **zaman imzasından ÖNCE**. Donanım ile zaman imzası arasında **boşluk yok**, ama ikisi de kendi (ortak) satırında.
- **1–3 diyez/bemol:** işaret o kadar tekrar edilir.
- **4+ diyez/bemol:** sayı işareti `3-4-5-6` + **sayı** (üst rakam) + diyez/bemol işareti.

| Örnek | Hücreler |
|---|---|
| 2 diyez | `1-4-6` `1-4-6` |
| 3 bemol | `1-2-6` `1-2-6` `1-2-6` |
| 4 diyez | `3-4-5-6` · `1-4-5` · `1-4-6` |
| 5 diyez | `3-4-5-6` · `1-5` · `1-4-6` |
| 4 bemol | `3-4-5-6` · `1-4-5` · `1-2-6` |

### 3.3 İmza/donanım değişiklikleri (eser içinde)
- Değişiklik, baskıda olduğu yere konur; **iki yanında da boşluk** olur. Tercihen etkilediği ölçü ile aynı satırda.
- Değişiklikten **sonraki ilk nota mutlaka oktav işareti** alır.
- Donanım değişikliği genelde **bölüm sonu çift çubuktan** sonra gelir.

---

## 4. Ölçü Çizgileri ve Tekrar Çubukları (Lesson 3, 4, 9 + Appendix)

| İşaret | Hücreler | Not |
|---|---|---|
| Normal ölçü çizgisi | `[boşluk]` | bir boş hücre |
| Bitiş çizgisi (final double) | `1-2-6` · `1-3` | eser sonu |
| Bölüm sonu çift çubuk (sectional) | `1-2-6` · `1-3` · `3` | son notaya bitişik, ardından boşluk |
| İleriye doğru tekrar (begin repeat) | `1-2-6` · `2-3-5-6` | tekrarlanacak pasaj başı |
| Geriye doğru tekrar (end repeat) | `1-2-6` · `2-3` | tekrarlanacak pasaj sonu |

**Tekrar çubuğu kuralları (Lesson 9):**
- Tekrar işareti ölçünün parçasıdır → bağlı olduğu ölçü ile arasında **boşluk yok**.
- Ama tekrar işaretinden **sonra mutlaka boşluk** gelir.
- Tekrar işaretinden sonraki ilk nota **oktav işareti** alır.
- Tekrar işareti **ölçü ortasında** ise: işaret ile ölçünün kalanı arasına **müzik kısa çizgisi (dot 5)** konur (boşluk gerektiği için).

---

## 5. Ölçü Numaralandırma (Lesson 5) ⚑ kullanıcı sordu

- Enstrümantal müzikte ölçüler, baskıda numara görünsün/görünmesin **numaralandırılır**.
- Numara, braille satırının **1. hücresine**, **sayı işareti OLMADAN** yazılır.
- **Anacrusis / es-vuruş (upbeat)** → **0. ölçü** olarak numaralanır.
- Her **yeni braille satırının başında** o satırın ilk ölçü numarası yazılır.
- (Foreword notu: ölçü numarasının baskıdaki **konumu** ülkeye göre değişir — bu kurs onu öğretmez; braillede satır başına yazım esastır.)
- Ölçü numaraları **alt-hücre (düşük) rakamlarla** yazılır. *(Repo: `line-start-bar-number-marker` = `2`; satır başı numara hücreleri alt rakamlarla teyit edilmeli.)*

---

## 6. Nota Gruplama (Lesson 4) ⚑ kullanıcı sordu

Baskıda kirişle (beam) gruplanan notalar braillede gruplanabilir:

### 6.1 Gruplama kuralı
- **8'likten küçük** notalar (16'lık, 32'lik, 64'lük, 128'lik), **aynı vuruşta 3 veya daha fazla** olduğunda gruplanır.
- Grubun **ilk notası gerçek değeriyle** yazılır; **kalan notalar 8'lik (quaver) gibi** yazılır.

### 6.2 Gruplama YAPILAMAZ:
1. Notalar **aynı vuruşta değilse**.
2. Grup, **başladığı satırda tamamlanamıyorsa**.
3. Grup, aynı ölçüde **8'lik / noktalı 8'lik / 8'lik sus** tarafından izleniyorsa (Örnek 1).
4. Grubun **başlangıcı dışında** bir yerde **eşit değerde sus** varsa (Örnek 2).
5. Grup, **müzik kısa çizgisi (dot 5)** ile kesiliyorsa.

### 6.3 Grup başında sus istisnası (Exercise 4.5)
- Bir 16'lık grup **16'lık sus** ile başlıyorsa, sus grubun değerini belirler ve **takip eden 16'lık notalar 8'lik gibi** gösterilebilir. (Gruba sadece **başta** sus girebilir.)

---

## 7. Bağlar ve Slur'lar (Lesson 5 + Appendix)

| İşaret | Hücreler | Açıklama |
|---|---|---|
| Uzatma bağı (tie) | `4` · `1-4` | aynı perdeden iki notayı tek nota gibi çalar |
| Hece bağı (single slur) | `1-4` | 2–4 farklı notayı bağlar; **son hariç her notadan sonra** |
| Çift hece bağı (doubled slur) | `1-4` `1-4` | 4+ nota için: ilk notadan sonra **iki** slur; sonu **son notadan önce tek** slur ile biter |
| Cümle bağı başı (bracket slur açık) | `5-6` · `1-2` | katmanlı/uzun cümleler; klavye/enstrüman müziği |
| Cümle bağı bitiş (bracket slur kapalı) | `4-5` · `2-3` | |

> **tie ≠ slur**: tie = `4·1-4` (aynı perde), slur = `1-4` (farklı perdeler). Editörde ayrılmalı.

---

## 8. Dinamikler ve İfade İşaretleri (Lesson 6 + Appendix)

- Müzik satırındaki **tüm sözcükler** önüne **söz işareti `3-4-5`** alır.
- Sözcükler **kontraksiyonsuz** (Grade 1, harf harf) yazılır; **büyük harf kullanılmaz**.
- `cresc.`→ daima **cr**; `decrescendo`→ **decr**; `diminuendo`→ **dim** (baskıda nasıl kısaltılmış olursa olsun).

| İşaret | Hücreler |
|---|---|
| Söz işareti | `3-4-5` |
| pp (pianissimo) | `3-4-5` · `1-2-3-4` · `1-2-3-4` |
| p (piano) | `3-4-5` · `1-2-3-4` |
| mp | `3-4-5` · `1-3-4` · `1-2-3-4` |
| mf | `3-4-5` · `1-3-4` · `1-2-4` |
| f (forte) | `3-4-5` · `1-2-4` |
| ff | `3-4-5` · `1-2-4` · `1-2-4` |
| cresc. | `3-4-5` · `1-4` · `1-2-3-5` · `3` |
| decresc. | `3-4-5` · `1-4-5` · `1-5` · `1-4` · `1-2-3-5` · `3` |
| Hairpin kreşendo (aç) | `3-4-5` · `1-4` |
| Hairpin kreşendo terminator | `3-4-5` · `2-5` |
| Hairpin dekreşendo (aç) | `3-4-5` · `1-4-5` |
| Hairpin dekreşendo terminator | `3-4-5` · `2-5-6` |

> Not: `cresc.`/`decresc.`/`dim`/`rit` gibi **kısaltmaların sonuna daima `dot 3`** gelir — bu "abbreviation" işaretidir; hem kısaltma noktası hem de (sonraki hücre 1/2/3 içeriyorsa) ayırıcı işlevi görür. Kaynaklar: PDF Appendix s.125, **Music Braille Code 2015**, NFB Music Cert. Ch.14, National Braille, RNIB. sforzando (sf) = `3-4-5`·`2-3-4`·`1-2-4`.

### 8.1 Sözcük/ifade yazım kuralları (stave içinde)
1. Uygulanabilir literary kodda, kontraksiyonsuz.
2. Büyük harf yok.
3. Literary noktalama kullanılabilir; **istisna:** nokta (dot 3 = period) ve özel parantez `2-3-5-6`.
4. Sözcükten sonraki **ilk nota oktav işareti** alır.
5. **Sözcükten sonra `3` (dot 3) gerekir** eğer bir sonraki hücre **1, 2 veya 3** noktası içeriyorsa. *İstisna:* ölçünün son işareti ise, sonraki işaret bir söz işareti ise, ya da zaten bir dot 3 (period) varsa.
6. Baskıda nokta varsa dot 3 yazılır; yoksa (kural 5 gerektirmedikçe) yazılmaz.

### 8.2 Hairpin (yelpaze) kuralları
- Hairpin'i **takiben başka dinamik, uzun sus veya eseri bitiren çift çubuk yoksa** → **terminator** gerekir.
- Terminator, **etkilenen notadan sonra** yazılır. O notada slur/tie varsa → terminator **onlardan sonra**.

### 8.3 Tempo / dinamik sırası ve başlık bloğu
- **Tempo işareti** önce, **dinamik** sonra (dinamik doğrudan notayı etkiler). Tempo bir **sus** önüne gelebilir; dinamik **nota** önüne gelmeli (sus loud/soft olamaz, ama fast/slow olabilir).
- **Başlık ve besteci** kendi satırlarında, **ortalanmış**, müziğin üstünde.
- İlk ölçünün üstündeki **tempo işareti**, anahtar/zaman imzası **ile aynı satırda ama onlardan önce**, ardından **nokta `2-5-6` (full stop)** ile yazılır.
- Uzun tempo (örn. *larghetto e piano*) kendi **ortalanmış satırına**, altına anahtar+zaman imzası gelir (Exercise 9.1).
- **2+ sözcüklü ifade** (örn. *a tempo*) bir **çift söz işareti** arasına alınır: **`⠜⠁⠀⠞⠑⠍⠏⠕⠜`** (söz-işareti + "a" + **boşluk** + "tempo" + söz-işareti). Üç boşluk noktası vardır: (1) sözcükler arasında, (2) ifadeden **önce**, (3) ifadeden **sonra** (Bethena bar 9). ✅ **İnternette teyit:** National Braille (Intro Part 2) `>A TEMPO>`, NFB (Intro to Braille Music Transcription) `>a tempo>` — `>` = söz işareti ⠜. ⚠️ Not: **New International Manual** 1-2 sözcük için farklı kural kullanır (her sözcüğün önüne ayrı söz işareti: `⠜⠁⠀⠜⠞⠑⠍⠏⠕`); bu eğitim programı + MBC/National Braille/NFB ise "çift söz işareti arasına alma" kullanır.

---

## 9. Nüanslar (Lesson 7 + Appendix)

### 9.1 Notadan ÖNCE gelen nüanslar
| İşaret | Hücreler |
|---|---|
| Staccato | `2-3-6` |
| Staccatissimo | `6` · `2-3-6` |
| Mezzo-staccato | `5` · `2-3-6` |
| Tenuto (agogic accent) | `4-5-6` · `2-3-6` |
| Accent | `4-6` · `2-3-6` |
| Expressive accent (ifadeli vurgu) | `4-5` · `2-3-6` |
| Reversed accent (ters vurgu) | `4` · `2-3-6` |
| Martellato | `5-6` · `2-3-6` |
| Swell / şişirme `<>` | `1-6` · `3` |

**Kurallar:**
- Bu işaretler **etkilenen notadan önce** konur; işaretten sonraki nota ek bir oktav işareti **gerektirmez** (oktav kuralı normal şekilde işler).
- Aynı notada birden çok nüans varsa **sıra: arpeggio → staccato/staccatissimo → accent → tenuto**.
- **Swell hariç**, bu nüanslar **4+ ardışık** notada **ikilenebilir (doubling)**. Sayfa sonu/başında ikileme yeniden belirtilir (önünde/ardında 4+ etkilenen nota varsa).

### 9.2 Notadan SONRA gelen nüanslar — Fermata + nefes/break
| İşaret | Hücreler |
|---|---|
| Fermata (nota üstü/altı) | `1-2-6` · `1-2-3` |
| Notalar arası fermata | `5` · `1-2-6` · `1-2-3` |
| Ölçü çizgisi üstü fermata | `4-5-6` · `1-2-6` · `1-2-3` |
| Bölüm sonu çift çubuk üstü fermata | `1-2-6` · `1-3` · `3` · `1-2-6` · `1-2-3` |
| Çift çubuk üstü fermata | `1-2-6` · `1-3` · `1-2-6` · `1-2-3` |
| Kare fermata | `5-6` · `1-2-6` · `1-2-3` |
| Üçgen (çadır) fermata | `4-5` · `1-2-6` · `1-2-3` |
| **Nefes işareti (breath)** | **`3-4-5` · `2`** |
| Break / kesinti işareti | `6` · `3-4` |

> ✅ Repoda doğru: `nefes işareti = 3-4-5, 2` ve `sezür/break = 6, 3-4` (Appendix s.128 ile uyumlu). *(Not: `3-4` tek başına break'in 2. hücresidir; nefes ile karıştırılmamalı.)*

---

## 10. Süslemeler / Ornaments (Lesson 7 + Appendix)

### 10.1 Apojyatür (çarpma)
| İşaret | Hücreler |
|---|---|
| Kısa apojyatür (saplı) | `2-6` |
| Uzun apojyatür (sapsız) | `5` · `2-6` |

- Apojyatür işareti küçük notadan **ve** varsa aksidental/oktav işaretinden **önce** yazılır.
- Apojyatür 16'lık grup ise **gruplama kullanılmaz**; ama apojyatür ölçü vuruşu sayılmadığından çevresindeki 16'lık gruplama yapılabilir.
- 4+ ardışık apojyatür → ikilenebilir.

### 10.2 Tril
| İşaret | Hücreler |
|---|---|
| Tril | `2-3-5` |
| Bemollü tril | `1-2-6` · `2-3-5` |
| Diyezli tril | `1-4-6` · `2-3-5` |

- Tril, etkilenen nota/aksidental/oktav işaretinden **hemen önce** konur.
- Aksidentalli trilde **önce aksidental, sonra tril**.
- 4+ tril serisi → tril işareti ikilenebilir. Aksidentalli tril, seriyi **böler** (interruption).
- Dalgalı çizgi 2+ bağlı notayı kaplarsa: **iki dot 3** ile devam çizgisi; son etkilenen notadan sonra `3-4-5` · `3` ile sonlandırılır.

### 10.3 Turn (Grupetto)
| İşaret | Hücreler |
|---|---|
| Turn (notalar arası) | `2-5-6` |
| Turn (nota üstünde/altında) | `6` · `2-5-6` |
| Ters turn (notalar arası) | `2-5-6` · `1-2-3` |
| Ters turn (nota üstünde/altında) | `6` · `2-5-6` · `1-2-3` |
| Turn — üst nota diyezli | `1-4-6` · `2-5-6` |
| Turn — üst nota bemollü | `1-2-6` · `2-5-6` |
| Turn — alt nota diyezli | `6` · `1-4-6` · `2-5-6` |
| Turn — alt nota bemollü | `6` · `1-2-6` · `2-5-6` |
| Turn — her iki nota değişik | `1-2-6` · `6` · `1-4-6` · `2-5-6` |

- Turn, baskıdaki konumdan bağımsız olarak notadan **önce** yazılır. Tam nota üstünde/altında ise önüne **dot 6** eklenir.
- Aksidental kuralı: üstteki aksidental turn'den önce; alttaki aksidental **dot 6** ile önce + sonra turn. İkisi varsa: önce üst aksidental, sonra dot 6 + alt aksidental, sonra turn.

### 10.4 Mordan (Mordent)
| İşaret | Hücreler |
|---|---|
| Üst mordan | `5` · `2-3-5` |
| Uzun (extended) üst mordan | `5-6` · `2-3-5` |
| Alt mordan | `5` · `2-3-5` · `1-2-3` |
| Uzun alt mordan | `5-6` · `2-3-5` · `1-2-3` |
| Bemollü üst mordan | `1-2-6` · `5` · `2-3-5` |
| Diyezli üst mordan | `1-4-6` · `5` · `2-3-5` |
| Diyezli alt mordan | `1-4-6` · `5` · `2-3-5` · `1-2-3` |
| Bemollü alt mordan | `1-2-6` · `5-6` · `2-3-5` · `1-2-3` |

- Mordan, turn ile aynı kuralları izler; notadan **önce** yazılır.

### 10.5 Glissando
| İşaret | Hücreler |
|---|---|
| Glissando | `4` · `1` |

- İlk notadan **sonra** konur. Baskıda "gliss." sözcüğü varsa braillede yazmak gerekmez (faksimile değilse).

---

## 11. Düzensiz Nota Grupları (Lesson 8 + Appendix)

### 11.1 Üçleme (Triplet)
- Tek hücreli işaret = **`2-3`**, üçlemenin **ilk notasından önce**.
- 4+ ardışık aynı değerde üçleme → ikilenebilir; ikilemeyi sonlandırmak için **son üçlemeden önce** bir üçleme işareti konur.
- Baskıda üçleme rakamı olmasa da braille değişmez.

### 11.2 Üç/Dört hücreli işaret (3 dışındaki gruplar)
Yapı = **`4-5-6`** + **alt rakam** + **`3`** (grup 9'dan büyükse 4 hücre).
| Grup | Hücreler |
|---|---|
| ikileme (2) | `4-5-6` · `2-3` · `3` |
| üçleme (3 hücreli biçim) | `4-5-6` · `2-5` · `3` |
| dörtleme (4) | `4-5-6` · `2-5-6` · `3` |
| beşleme (5) | `4-5-6` · `2-6` · `3` |
| altılama (6) | `4-5-6` · `2-3-5` · `3` |
| yedileme (7) | `4-5-6` · `2-3-5-6` · `3` |

**Kurallar:**
- İşaretten **sonraki ilk nota oktav işareti alır**.
- 4+ ardışık grupta ikilenebilir; ikileme sonu son notadan önce üç hücreli işaretle biter.
  Örn. ikilenmiş altılama: `4-5-6`·`2-3-5`·`4-5-6`·`2-3-5`·`3`.
- Diğer düzensiz gruplarla birlikte **üçleme de olursa**, üçleme **tek hücreli değil ÜÇ hücreli** işaretle gösterilir.
- Baskıda rakam yoksa ve üç hücreli işaretle rakam gerekiyorsa, grup işaretinden **önce dot 5** konur (üçlemede bu gerekmez).

---

## 12. Tekrar Cihazları

### 12.1 Voltalar (Lesson 9 + Appendix)
| İşaret | Hücreler |
|---|---|
| 1. dolap (first time ending) | `3-4-5-6` · `2` |
| 2. dolap (second time ending) | `3-4-5-6` · `2-3` |

**Kurallar:**
1. Volta = ölçü başında **sayı işareti + alt rakam**.
2. Volta numarası ile ölçü arasında **boşluk yok**.
3. Voltadan **sonraki ilk nota oktav işareti** alır.
4. Voltadan hemen sonraki işaret **1,2,3** noktası içeriyorsa → volta numarasından sonra **dot 3 ayırıcı**.
5. Baskıdaki noktalama (nokta, virgül) **yazılmaz**.
6. Üstteki köşeli parantez **yazılmaz**.
7. Baskıda 2+ numara varsa (örn. "1.–4."), her numara **sayı işareti** alır; **istisna:** numara bir **hyphen (`3-6`)** sonrasında geliyorsa sayı işareti almaz ve numaralar arasına boşluk girmez.

### 12.2 Braille Tekrarları (Lesson 10) — ⚑ repoda yok gibi
| Cihaz | Hücreler | Not |
|---|---|---|
| **Braille tekrar işareti** | `2-3-5-6` | bir ölçünün (veya parçasının) **anlık** tekrarı; **1 ölçüden uzun** için kullanılmaz |
| **Geriye sayısal tekrar** (backward-numeral) | iki sayı (her biri sayı işareti + üst rakam), aralarında boşluk | 1. sayı: kaç ölçü geri sayılacağı; 2. sayı: kaç ölçü çalınacağı. Aradaki müzik yoksa **tek sayı** |
| **Ölçü-numarası tekrarı** (bar-number) | sayı işareti + **alt rakam(lar)** | örn. ölçü 5–8: `3-4-5-6`·`2-6`·`3-6`·`2-3-6` (hyphen = `3-6`) |

**Braille tekrar işareti `2-3-5-6` kuralları:**
- Sadece **nüanslar/işaretler aynıysa** kullanılır.
- Aynı ölçü ama **farklı oktav** ise → oktav işareti tekrar işaretinin **önüne**.
- Dinamik/söz işareti değişiyor ve tüm tekrara uygulanıyorsa → işaret tekrar işaretinin **önüne**.
- Son notada **tie** varsa → tie tekrar işaretinin **arkasına** (`⠶⠈⠉`).
- **Bir tie braille-tekrar sınırını geçiyorsa** (örn. `⠶⠈⠉` sonraki ölçüye bağlanıyorsa), devam eden notaya **oktav işareti** konur (PDF s.94 ties-across bar4: `⠸⠹`). *(Not: tie YOKsa, tekrardan sonraki ölçünün ilk notası normal aralık kuralına tabidir — Jingle bar3'te işaret yok.)*
- Eklenen işaretler (çift çubuk, bitiş çubuğu, geri tekrar, nefes/break) tekrar işaretini **boşluksuz** izler.
- Aynı ölçünün **3+ tekrarı** → tekrar işaretinden sonra **boşluksuz sayı işareti** (tekrar sayısı, üst rakam: `⠶⠼⠓`). **Bu çoklu tekrardan sonraki ilk nota MUTLAKA oktav işareti alır** (PDF s.95 bar10: `⠘⠺`).

> ⚠️ **Editör notu:** repodaki `MUZIK_OLCU_CIZGILERI`/`tekrar` yalnızca baskı tekrarlarını (begin/end repeat, volta, dolap) içeriyor. **Braille tekrar işareti `2-3-5-6`, geriye-sayısal tekrar ve ölçü-numarası tekrarı yok.** Editörde bu cihazlar gerekiyorsa eklenmeli.

---

## 13. ⭐ NOTAYA GÖRE İŞARET YAZIM SIRASI (Lesson 11, s.108) — EN KRİTİK

> Bu, editörün bir notaya birden çok işaret eklerken kullanması gereken **kesin sıralamadır**.

> **Bu tabloyu kendi editör/veri kategorilerinle eşleştir.** Örn. **staccato AYRI bir kategori değildir — 8. slottaki NÜANS'tır**; accent ve tenuto da öyle. Bir işaret yanlış kategorideyse yazım sırası bozulur.

### 13.1 Notadan ÖNCE (soldan sağa kesin sıra)

| # | İşaret grubu | Bu slota GİREN somut işaretler | Örnek hücre |
|---|---|---|---|
| 1 | **İleriye (başla) tekrar** | ileriye doğru tekrar `|:` | `1-2-6 · 2-3-5-6` |
| 2 | **Volta (1./2. dolap)** | 1. dolap, 2. dolap | `3-4-5-6 · 2` / `· 2-3` |
| 3 | **Cümle bağı AÇILIŞI** (bracket slur açık) | cümle bağı başlangıcı | `5-6 · 1-2` |
| 4 | **Dinamik / söz-ifadesi** | p, pp, mp, mf, f, ff, sf, cresc, decresc, dim, rit, tempo sözcükleri **+ hairpin başlangıçları** (keskin kreşendo/dekreşendo başı) | `3-4-5 · …` |
| 5 | **Üçleme / düzensiz grup** | üçleme `2-3`; ikileme…yedileme | `4-5-6 · altRakam · 3` |
| 6 | **Süslemeye ait aksidental** | süslemenin diyez/bemol/naturel'i | `1-4-6` / `1-2-6` / `1-6` |
| 7 | **Süsleme (ornament)** | tril, bemollü/diyezli tril, turn (grupetto), ters grupeto, üst/alt mordan (+uzun), kısa/uzun apojyatür | `2-3-5`, `2-5-6`, `5 · 2-3-5`, `2-6` |
| 8 | **NÜANS (ifade işaretleri)** ⚑ — slot içi sıra: **① arpej → ② staccato / staccatissimo / mezzo-staccato → ③ accent (ve ifadeli/ters accent, martellato) → ④ tenuto → swell** | **staccato `2-3-6`**, staccatissimo `6 · 2-3-6`, mezzo-staccato `5 · 2-3-6`, accent `4-6 · 2-3-6`, ifadeli accent `4-5 · 2-3-6`, ters accent `4 · 2-3-6`, martellato `5-6 · 2-3-6`, tenuto `4-5-6 · 2-3-6`, swell `1-6 · 3` | — |
| 9 | **Notanın KENDİ aksidentali** | diyez, bemol, naturel, çift diyez/bemol | `1-4-6` / `1-2-6` / `1-6` |
| 10 | **Oktav işareti** | 1.–7. oktav | `4` … `6` |
| 11 | → **NOTA** | (perde+süre hücresi) | |

### 13.2 Notadan SONRA (soldan sağa kesin sıra)

| # | İşaret grubu | Bu slota GİREN somut işaretler | Örnek hücre |
|---|---|---|---|
| 1 | **Uzatma noktası** | noktalı nota/sus | `3` |
| 2 | **Fermata** | fermata + türevleri (notalar arası, ölçü/çubuk üstü, kare, üçgen) | `1-2-6 · 1-2-3` |
| 3 | **Tekli slur / çift slur AÇILIŞI** | hece bağı, çift hece bağı | `1-4` (· `1-4`) |
| 4 | **Cümle bağı KAPANIŞI** (bracket slur kapalı) | cümle bağı bitişi | `4-5 · 2-3` |
| 5 | **Tie (uzatma bağı)** | uzatma bağı | `4 · 1-4` |
| 6 | **Hairpin terminator** | keskin kreşendo/dekreşendo bitir | `3-4-5 · 2-5` / `· 2-5-6` |
| 7 | **Nefes / break işareti** | nefes `3-4-5·2`, break (sezür) `6·3-4` | — |
| 8 | **Geriye (bitir) tekrar** | geriye doğru tekrar `:|` | `1-2-6 · 2-3` |

- **Glissando** (`4 · 1`): ilk notadan **sonra** konur (yukarıdaki listede ayrı; tek nota-arası işaret).
- **Hairpin terminator** kuralı: notada slur/tie de varsa terminator **onlardan sonra** gelir (yani 3-4-5. slotlardan sonra, 6. slotta).

### 13.3 Birden çok NÜANS aynı notada (slot 8 iç-sırası)
PDF (Lesson 7): **arpej → staccato/staccatissimo → accent → tenuto**. Örn. notada hem staccato hem accent varsa: önce staccato `2-3-6`, sonra accent `4-6 · 2-3-6`.

### 13.4 Kapsamlı STANDART sıra (MBC 2015 / NIM / NFB) — internetten çapraz kontrol
Bu giriş programının kapsadığından daha fazla işaret içeren tam "Order of Signs" tablosu. Editörü ileride genişletirsen tam sıra budur (★ = bu programın kapsamı):

**Notadan ÖNCE (tam sıra):**
marjinal el işareti → anahtar(clef) → **★ileriye tekrar** → **★1./2. dolap** → hatırlatma tie → pedal-aşağı → **★dinamik/söz-ifadesi/kısaltma** → **★dot-3 ayırıcı / devam çizgisi** → örtüşen bracket slur → **★cümle bağı açılışı** → slur → müzik virgülü → **★üçleme/düzensiz grup** → büyük/küçük değer işareti → yay(bowing) → mute → **★süslemeye ait aksidental** → **★süsleme + nüans (staccato/staccatissimo, accent, tenuto)** → **★notanın aksidentali** → **★oktav işareti** → NOTA

**Notadan SONRA (tam sıra):**
**★uzatma noktası** → parmak(fingering) → unmute → fractioning/tremolo → **★fermata** → **★tekli slur** → bracket slur açılışı → **★bracket slur kapanışı** → **★tie** → terminal virgül / **★hairpin terminator** → **★nefes/break** → **★çift çubuk / bitir-tekrar** → ölçü bölme / in-accord / müzik kısa çizgisi

> ⚠️ **GERÇEK FARK (önemli — editör kararı gerektirir):** Bu PDF'in Lesson 11 tablosu (13.1) **cümle bağı açılışını dinamikten ÖNCE** koyar (slot 3 < slot 4). Kapsamlı standart ise **dinamiği (söz-ifadesi) cümle bağı açılışından ÖNCE** koyar. Aynı notada **hem dinamik hem bracket-slur açılışı** varsa sıra ters olur:
> - PDF: `[bracket-aç][dinamik][nota]`
> - Standart (MBC/NIM/NFB): `[dinamik][bracket-aç][nota]`
>
> Hedef bu eğitim programıysa PDF sırasını, uluslararası uyum istiyorsan standart sırayı uygula. *(Pratikte nadir bir kesişim.)*

> 📌 **Değer işareti (larger/smaller value sign):** Bir hücrenin iki süre anlamı (örn. birlik=16'lık) vuruş sayımıyla çözülemezse, "büyük/küçük değer" işaretiyle ayrılır. Bu giriş programı bunu KAPSAMAZ (bağlamla çözer); gerçek transkripsiyonda gerekebilir — editörü genişletirken aklında olsun.

> 📌 **"dot-3 ayırıcı / devam çizgisi" ayrı bir slottur** (dinamikten hemen sonra): kısaltma noktası + sonraki hücre 1/2/3 içeriyorsa ayırıcı (bkz. Bölüm 8.1 k.5).

---

## 14. ⭐ BOŞLUK KURALLARI (nereye boşluk gelir) — ⚑ kritik

> Müzik braillede boşluk **anlam taşır** (ölçü çizgisi = boşluk). Yanlış boşluk = yanlış okuma. Editör bunları bire bir uygulamalı.

| Konum | Boşluk? |
|---|---|
| İki ölçü arası (normal ölçü çizgisi) | **1 boş hücre** — boşluğun KENDİSİ ölçü çizgisidir |
| Donanım ↔ zaman imzası | **YOK** (bitişik) |
| Tempo (+ nokta `2-5-6`) ↔ donanım/zaman imzası | **1 boşluk** |
| Eser İÇİ zaman/donanım imzası DEĞİŞİMİ | **iki yanında da boşluk** |
| Bölüm sonu çift çubuk (sectional) | öncesi **bitişik** (boşluk yok) · **sonrası boşluk** |
| Bitiş çizgisi (final) | öncesi **bitişik** (eser sonu) |
| Dinamik / tek sözcük ↔ sonraki nota | **YOK** (bitişik); gerekirse araya dot-3 ayırıcı (bkz. Bölüm 8.1 kural 5) |
| 2+ sözcüklü ifade (örn. *a tempo*) | çift söz işareti arasında; **önünde ve ardında boşluk** |
| **Başla-tekrar `|:`** | **öncesi boşluk** (önceki ölçüden) · **sonrası boşluk YOK** → notaya bitişik (`⠣⠶⠐...`) |
| **Bitir-tekrar `:|`** | **öncesi boşluk YOK** → son notaya bitişik · **sonrası boşluk** |
| Bitir-tekrar ölçü ORTASINDA ise | tekrardan sonra boşluk şart → ölçünün kalanı **müzik kısa çizgisi `5`** ile ayrılır (Jolly Miller) |
| Volta (dolap) numarası ↔ ölçü | **YOK** (bitişik) · öncesi boşluk (ölçü çizgisi) |
| Braille tekrar `⠶` + eklenen işaret (çift çubuk / tie / nefes / tekrar sayısı) | **boşluksuz** izler |
| Geriye-sayısal & ölçü-no tekrarı | **iki yanında boşluk** · eklenen işaretler (çift çubuk/volta/baskı-tekrar) **boşluksuz** hemen sonra |
| Nüans / süsleme / oktav / aksidental ↔ kendi notası | **YOK** (hepsi notaya bitişik zincir) |

---

## 15. ⭐ SATIR KIRILMASI KURALLARI — ⚑ kritik (Modül 10 editöründe MUTLAKA olmalı)

> Bu konu çok önemli: braille satırının nerede biteceği, oktav işaretlerini ve ölçü numaralarını **değiştirir**.

1. **Müzik braille, baskının satır başına ölçü sayısını TAKİP ETMEZ.** Satır, braille genişliğine göre kırılır.
2. **Bir ölçü satıra sığmıyorsa ölçünün TAMAMI yeni satıra taşınır** — ölçü asla satır ortasından bölünmez (Lesson 3, *Aloha ʻOe*).
3. **Her yeni braille satırının ilk notası MUTLAKA oktav işareti alır** — aralık kuralının üstünde (Bölüm 1.2.b). Satırın ilk vuruşunda sus varsa → oktav işareti o satırdaki **ilk notaya**.
4. **Her yeni braille satırı 1. hücrede o satırın ilk ölçüsünün NUMARASI ile başlar** (sayı işaretsiz, alt-hücre rakamlarıyla). Anacrusis/es-vuruş = **0. ölçü** (Bölüm 5).
5. **Düzensiz nota grubu**, başladığı satırda tamamlanamıyorsa **gruplanamaz** (Bölüm 6).
6. **Doubling** (nüans/slur ikilemesi): yeni braille **SAYFASININ** başında, 4+ etkilenen nota varsa **yeniden belirtilir** (Bölüm 9.1, 10.x).
7. **Sayısal/geriye tekrar**: orijinal pasaj ile geri-sayım noktası **aynı braille sayfasında** olmalı (Lesson 10).

### 15.1 Editör notu (Modül 10) ⚑
BRF çıktısı üretilirken editör şunları uygulamalı:
- **(a)** Ölçü-ölçü satır doldurma + sığmayan ölçüyü **tam** alt satıra taşıma (ölçü bölme yok).
- **(b)** Her satır başı ilk notaya **zorunlu oktav işareti** (yeni satır → ilk nota interval'den bağımsız oktav alır).
- **(c)** Her satır başına **ölçü numarası** (1. hücre, sayı işaretsiz).
- **(d)** Satır-sonu **grup kısıtı** (sığmayan grup gruplanmaz).
- **(e)** Sayfa başı **doubling** yeniden-belirtme.

> **Fixture ilişkisi:** `muzik-braille-test-ornekleri.md` dosyasındaki braille **tek mantıksal satırdır** (ölçü no + satır kırılması YOK). Gerçek BRF = o içerik + bu bölümdeki kırılma/numara kuralları. Editör testinde önce **içerik** (notalar/işaretler/oktav-interval) karşılaştırılır; sonra ayrıca **kırılma+numara** doğrulanır.

---

## 16. Genel Format / Düzen Kuralları (özet)

- **Sayfa düzeni başlık bloğu (yukarıdan aşağı, ortalanmış):** Başlık → Alt başlık → Besteci → (Tempo + anahtar + zaman imzası satırı).
- **Tempo (kısa, ilk ölçü üstü):** anahtar/zaman imzası ile aynı satırda, onlardan **önce**, ardından nokta `2-5-6`.
- **Tempo (uzun):** kendi ortalanmış satırı; altında anahtar+zaman imzası ortalanmış.
- **Anahtar (donanım) + zaman imzası:** ortak, ortalanmış satır; aralarında **boşluk yok**.
- **Ölçü sonu (satır):** her yeni braille satırı kendi ölçü numarası ile başlar; her satırın ilk notası oktav işareti alır.
- **Sözcükler:** kontraksiyonsuz, büyük harfsiz, önünde söz işareti `3-4-5`.

---

## 17. Repo Doğrulama Özeti (bu belgeye göre)

**✅ Birebir doğru (PDF'in nokta verdiği TÜM işaretler):** notalar (C=`1-4-5`…B=`2-4-5`, Lesson 1 s.10 metni ile teyitli), süreler, suslar, uzatma noktası, oktav işaretleri, zaman/donanım imzaları, aksidentaller, ölçü çizgileri, baskı tekrarları, voltalar, tie/slur/bracket slur, tüm dinamikler, **hairpin'ler (Appendix ile kesinleşti)**, tüm nüanslar (önce), fermatalar, **nefes `3-4-5·2` ve break `6·3-4`**, apojyatür, tril, **turn/grupetto**, **mordan**, glissando, üçleme ve düzensiz gruplar. → **Tek nokta hatası yok.**

**⚠️ Eklenebilecek (eksik cihazlar — muhtemelen mevcut kapsam dışı):**
1. **Lesson 10 braille tekrar cihazları** veri olarak yok: braille tekrar işareti `2-3-5-6`, geriye-sayısal tekrar, ölçü-numarası tekrarı. (Bunlar çok-ölçülü transkripsiyon kısaltmalarıdır; editörde gerekirse eklenir.)
2. **Etiket/yazım** (nokta hataları değil, isim): "Simo" → staccatissimo, "tonuto" → tenuto, "aksent"/"aksan" → accent gibi Türkçe etiketler gözden geçirilebilir.

**🔎 Editör için kritik uygulama noktaları (Modül 10 kontrol listesi):**
- Bölüm **13'teki yazım sırası** (önce/sonra, detaylı tablo) — birden çok işaret eklenirken bire bir. Kategorilerini tabloyla eşleştir (örn. staccato = nüans/slot-8).
- **Oktav işareti** (Bölüm 1.2 + **1.2.b zorunlu hâller**): aralık kuralı + dinamik-sözcük/tekrar/volta/imza-değişimi/satır-başı **zorlamaları**.
- **Boşluk kuralları** (Bölüm **14**): tekrar işaretleri, imza değişimi, dinamik-nota bitişikliği, müzik kısa çizgisi.
- **Satır kırılması** (Bölüm **15**): ölçü-tam-taşıma, satır-başı zorunlu oktav, satır-başı ölçü numarası, grup kısıtı.
- **Gruplama** (Bölüm 6) ve **ölçü numarası** (Bölüm 5).

---

## 18. ⭐ PDF KARŞILAŞTIRMASIYLA KEŞFEDİLEN / DOĞRULANAN EK KURALLAR

> Bu kurallar, üretilen braille'i PDF'in basılı braille'iyle **hücre-hücre kıyaslarken** ortaya çıktı. Editörde kolayca gözden kaçan ince noktalar — tek yerde topluyorum. (Detaylar parantezdeki bölümlerde.)

1. **SÖZcük → zorunlu oktav (Lesson 6 k.4):** Bir dinamik/tempo/ifade sözcüğünden (p, f, mf, cresc, rit, dolce…) **sonraki ilk nota, aralık ne olursa olsun oktav işareti alır.** Nüans/süsleme/hairpin **sembolü** bunu yapmaz. *(Trumpet bar4/bar7, Fidelio bar3, Angels bar11 ile doğrulandı.)* ✅ **İnternette teyit:** NFB Ch.14 — *"The first note after a word-sign expression must always have an octave mark"* (oktav işareti, sözcüğün etkisini **sonlandırır**). → Bölüm 1.2.b, 13.

2. **Kısaltma → dot 3:** `cresc`, `rit`, `decr`, `dim` gibi kısaltmaların sonuna daima **dot 3** ("abbreviation" işareti) gelir; bu hem nokta hem ayırıcıdır. *(MBC 2015 / RNIB / NFB ile doğrulandı.)* → Bölüm 8.

3. **Tie + braille-tekrar:** Bir **tie**, braille-tekrar işareti `⠶` sınırını geçiyorsa, devam eden nota **oktav işareti** alır (`⠶⠈⠉` sonrası `⠸⠹`). Tie yoksa, tekrardan sonraki ilk nota **normal aralık kuralına** tabidir. *(s.94 ties-across bar4 vs Jingle bar3.)* → Bölüm 12.2.

4. **Çoklu braille-tekrar → zorunlu oktav:** `⠶`+sayı (3+ tekrar) işaretinden **sonraki ilk nota** oktav işareti alır (`⠶⠼⠓` sonrası `⠘⠺`). *(s.95 bar-repeat bar10.)* → Bölüm 12.2.

5. **Başla-tekrar `⠣⠶` notaya BİTİŞİK:** Başla-tekrar işaretinden sonra **boşluk yoktur**, doğrudan notaya bitişir (`⠣⠶⠐⠞`). Sadece **öncesinde** boşluk vardır. *(Angels bar6.)* → Bölüm 14.

6. **Dinamik notaya BİTİŞİK (boşluksuz):** Tek sözcüklü dinamik (mf, cresc, rit…) sonraki notaya boşluksuz bitişir; arada yalnızca oktav işareti (ve gerekirse dot-3 ayırıcı) olur (`⠜⠍⠋⠐⠟`). 2+ sözcüklü ifade ise boşlukla ayrılır. → Bölüm 14, 8.1.

7. **Yazım sırası farkı (PDF ↔ uluslararası standart):** PDF cümle-bağı-açılışını dinamikten önce; MBC/NIM dinamiği bracket-slur'dan önce koyar. Aynı notada ikisi varsa sıra değişir. → Bölüm 13.4.

8. **Anacrusis sonrası 1. ölçü — ÇÖZÜLDÜ (kural yok):** Bracket slur örneği (s.44) bar1'de B2'nin oktav işaretli görünmesi araştırıldı. **Sonuç:** standart kaynaklarda (MBC 2015, NIM, NFB, National Braille) "anacrusis sonrası downbeat oktav alır" diye **bir kural YOK**; aksine **2'li/3'lü aralık → işaret yok** kuralı internette doğrulandı (Music Braille Interval Indication; National Braille Part 1: *"Read the interval to determine if an indicator is needed before the 2nd note"*). C3→B2 = 2'li → **işaretsiz** `⠺` doğrudur. PDF görselindeki `⠘⠺` izlenimi muhtemelen düşük çözünürlük okuma hatası/dizgi anomalisi. → Fixture'da `⠺` (kural-doğru) tutuluyor.
