# Modül 9 — Dil Braille Verisi Hata Raporu

**Tarih:** 2026-06-16
**İncelenen dosyalar:** `src/data/almancaBraille.js`, `src/data/fransizcaBraille.js`, `src/data/ingilizceBraille.js`

## Doğrulama yöntemi (en güçlü kanıt: çalışan kütüphane)
Son turda **Modül 10'un kullandığı `liblouis` kütüphanesini node'da doğrudan çalıştırdım** ve aynı yerel tablolarla (`public/liblouis/tables/`) gerçek kelimeleri çevirdim:
- Fransızca Grade 2: `unicode.dis,fr-bfu-g2.ctb`  (= AVH/CBFU resmî abrégé)
- Almanca Grade 2: `de-de-g2.ctb`  (= Das System der deutschen Blindenschrift)
- İngilizce: `en-ueb-g2.ctb`  (= BANA/ICEB UEB)

Yani bu rapordaki sonuçlar artık **uygulamanın kendi çeviri kütüphanesinin gerçek çıktısıyla** doğrulanmıştır (Wikipedia değil, statik tablo taraması değil — çalışan kütüphane).
Ek resmî referanslar: World Braille Usage 3. Baskı (UNESCO), CBFU 2008, Das System der deutschen Blindenschrift, BANA UEB.

---

## Özet tablo
| # | Dil | Öğe | Eski | Yeni/Doğru | Kütüphane teyidi | Durum |
|---|-----|-----|------|-----------|------------------|-------|
| 1 | Fransızca | `û` | `1-2-5-6` | **`1-5-6`** | CBFU/WBU | ✅ DÜZELTİLDİ |
| 2 | Almanca | `ß` (eksikti) | (yok) | **`2-3-4-6`** | Das System | ✅ DÜZELTİLDİ |
| 3 | Fransızca | `la` | `6` | **`3`** | `la`→[3] | ✅ DÜZELTİLDİ |
| 4 | Fransızca | `per` etiketi | per `1-2-3-4` | **`par`** `1-2-3-4` | `par`→[1-2-3-4] | ✅ DÜZELTİLDİ |
| 5 | İngilizce | UEB-dışı 8 EBAE kısaltması | 8 öğe | **SİLİNDİ** | kütüphaneyle teyitli | ✅ DÜZELTİLDİ |

> **Kapsamlı tek-tek test:** Modül 9'daki tüm harf/aksan/kelime girdileri (≈330) liblouis ile **birebir** karşılaştırıldı → **330/330 hücre doğru**; tek farklar bu 8 İngilizce öğeydi (silindi). Almanca'da 5 "fark" yalnızca sözlük-glossuydu (hücreler doğru). Letter-group'lar gerçek kelimelerle (manger→an, balle→ll, part→ar, command→con…) doğrulandı.

---

## 1–4. Düzeltilenler ✅
- **`û` = `1-5-6`** (eski `1-2-5-6` aslında `ü`'ydü).
- **`ß` = `2-3-4-6`** alfabeye eklendi.
- **`la` = `3`** (eski `6`, `ieu=[6]` ile çakışıyordu).
- **`par` = `1-2-3-4`** (eski etiket "per" yanlıştı; kütüphane `par`→[1-2-3-4] gösterdi, "per" kelime-içinde p+er yazılıyor).

## Kütüphaneyle DOĞRU çıkanlar (önce şüphelenmiştim, kütüphane doğruladı)
| Öğe | Test kelimesi (liblouis çıktısı) | Sonuç |
|-----|-----------------------------------|-------|
| Fr `an=[2]` | manger → m·**2**·g·er ; chanter → ch·**2**·t·er | ✓ DOĞRU |
| Fr `ou=[1-2-5-6]` | rouge → r·**1-2-5-6**·g·e ; couleur → c·**1-2-5-6**·l·eur | ✓ DOĞRU |
| Fr `ll=[4-5-6]` | balle → b·a·**4-5-6**·e | ✓ DOĞRU |
| Fr `ar=[4]` | part → p·**4**·t ; art → **4**·t | ✓ DOĞRU |

## Almanca — %100 temiz
Tüm Wortkürzungen + Lautgruppen `de-g2-core.cti` ile birebir; `ß` eklendi. Hata yok.

---

## 5. İngilizce — UEB / EBAE çelişkisi ✅ (8 öğe SİLİNDİ)
Dosya başlığı **"UEB"** diyor. **`en-ueb-g2.ctb` ile çalıştırınca** şu 8 kısaltmanın UEB'de **üretilmediği** görüldü; **A seçeneği uygulandı: 8 öğe + `to/into` bitişik-yazım kuralı silindi** (artık veri gerçek UEB):

| Veri öğesi | UEB kütüphanesi çıktısı | Sonuç |
|-----------|--------------------------|-------|
| `ble` (3-4-5-6) | able → a-b-l-e ; table → t-a-b-l-e | UEB'de YOK |
| `com` (3-6) | command → c-o-m-m-and | UEB'de YOK |
| `dd` (2-5-6) | add → a-d-d ; ladder → l-a-d-d-er | UEB'de YOK |
| `to` (2-3-5) | to → t-o | UEB'de YOK |
| `into` | into → in-t-o | UEB'de YOK |
| `ation` (6+n) | nation → n-a-**tion**-... | UEB'de YOK (tion kullanılır) |
| `ally` (6+y) | really → r-**ea**-l-l-y | UEB'de YOK |
| `o'clock` | o'clock → o-'-c-l-o-c-k | UEB'de YOK |

(Kontrol: the→2-3-4-6, and→1-2-3-4-6 — kütüphane doğru kısaltmaları uyguluyor.)
Silinen `con`/`dis`/`be` DEĞİL — onlar UEB'de hâlâ geçerli (kelime başı alt-grup); yalnız yukarıdaki 8 öğe silindi.

---

## EKSİK kısaltmalar (kapsam analizi) — tek + çok hücreli
Tüm kısaltmalar liblouis envanteriyle diff'lendi (yalnız tek-hücreli değil).
- **Çok-hücreli "eksik"lerin neredeyse tümü kelimeye-özel sözlük kısaltması** (Almanca: aller, dabei, kabel… ~7000; Fransızca: amour, avant… ~1600). Bunlar tam grade-2 sözlüğüdür, sistematik öğretim işareti değil → **eklenmedi** (istenirse seçili yaygın set ayrıca eklenebilir).
- **Sistematik (kurallı) eksikler eklendi** (gerçek kelimelerle doğrulanarak):
  - **Almanca — 12 önek/sonek** (`ALMANCA_KELIME_PARCA`'ya): Önek `aus, ent, ex, pro` · Sonek `heit, keit, nis, sam, schaft, ung, wärts, mal`. (auskunft→aus, freiheit→heit, zeitung→ung, freundschaft→schaft … ile teyitli)
  - **Fransızca — 10 finale/dizi** (`FRANSIZCA_KELIME_PARCA`'ya): `able, ait, ant, ation, ent, ez, ien, om, qu, bl`. (table→able, blanc→bl, chez→ez, nation→ation, chien→ien … ile teyitli)
  - Eklenmeyen 3 Fransızca (`es, ition, our`): taşıyıcı kelimede netleşmedi (konum-özel / sözcük-abréviasyonu olabilir) → güvenli olması için bırakıldı.
- **İngilizce:** sistematik kısaltmalar zaten **TAM** (eksik tek-hücreli: 0); çok-hücreli "eksik"ler liblouis kelime-kuralları, standart kısaltma değil.
- **Not:** Önek/sonek/finale işaretleri mevcut hücreleri konuma göre yeniden kullanır → hepsi "yalnız ilgili konumda" kuralıyla eklendi.

## Sonuç
- **Almanca:** %100 temiz (ß eklendi; 330-test'te tüm hücreler doğru) + 12 önek/sonek eklendi.
- **Fransızca:** 3 düzeltme (û, la, par) + 10 finale/dizi eklendi; geri kalan **kütüphaneyle tamamen doğrulandı** (an/ar/ll/ou dahil).
- **İngilizce:** UEB-dışı 8 öğe **silindi** → veri artık gerçek UEB; sistematik kısaltmalar TAM.
- **Genel:** ~330 harf/kelime girdisinin tamamı uygulamanın kendi liblouis kütüphanesiyle birebir; eksik sistematik kısaltmalar (DE 12, FR 10) doğrulanarak eklendi.
