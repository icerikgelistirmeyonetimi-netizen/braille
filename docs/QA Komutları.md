---
tags: [qa, test, muzik, braille]
---

# ✅ QA Komutları

`package.json` script'leri. ← [[Müzik BRF]] · [[Proje Haritası]]

> **Ne zaman:** braille çevirici/çözücü (`brailleCevir.js`, `brfOkuyucu.js`, `perkinsYazma.js`) değişince → `qa:perkins` + `kapsamli_test`. Müzik motoru/reader/`muzik.js` değişince ilgili `qa:*`'ı çalıştır. `muzik.js` değişince → `qa:brf-roundtrip`. Standart davranış değişince → `qa:brf-standard`.

## Braille yazım/çeviri kalkanları
| Komut | Neyi korur |
|-------|-----------|
| `npm run qa:perkins` | Perkins yazımı: metin→brf blok çözücü (148/148) + `hucreyiIsle` durum makinesi ileri bakışlı 59/59 / ileri bakışsız 17/17. **Çözücü = encoder'ın tersi**; `=`/`×`/`÷`/`≤` gibi ÇOK HÜCRELİ semboller, `[3]` bölük↔kesme, `[2]` ondalık virgül, düz-yazı parantezi. **+ ÇAPRAZ DENETİM**: aynı hücre dizisini A (Perkins) / B (brf→metin) / C (durum makinesi) aynı okumalı (82/82) → bir çözücüyü düzeltip diğerini unutmayı yakalar. `brailleCevir.js` / `brfOkuyucu.js` / `perkinsYazma.js` değişince çalıştır. |
| `node _datasets/kapsamli_test.mjs` | round-trip kategori denetimi (%98.73) + çakışma taraması |
| `node _datasets/genistest.mjs` | 800 sözlük kelimesi + 78 cümle round-trip |
| `node _datasets/mattest.mjs` | matematik ifadeleri round-trip (19/20) |

## BRF yazım/okuma kalkanları
| Komut | Neyi korur |
|-------|-----------|
| `npm run qa:brf-roundtrip` | load→export→load özdeş (muzik.js değişince) |
| `npm run qa:brf-standard` | PDF-doğrulanmış fixture braille'iyle karşılaştırma (indir + overlay) |
| `npm run qa:brf-import` | import round-trip (tuplet dahil) |
| `npm run qa:brf-order` | order-of-signs / işaret yazım sırası (Bölüm 13) |
| `npm run qa:brf-spacing` | boşluk kuralları (Bölüm 14) |
| `npm run qa:brf-octave` | zorunlu oktav bağlamları |
| `npm run qa:brf-pdf-fixtures` | 39 PDF fixture import → 0 bilinmeyen hücre |
| `npm run qa:brf-reading` | okunur özet 39/39 |
| `npm run qa:brf-timesig-preserve` | eser-içi zaman imzası değişimi korunur |
| `npm run qa:brf-grouping` | aksak metre gruplama + import auto-çözüm (14/14) |
| `npm run qa:brf-pieces` | 48 parçanın tekrar cihazları desteklenir |

## Skor çizimi / çalma kalkanları
| Komut | Neyi korur |
|-------|-----------|
| `npm run qa:score-layout` | nota X yerleşimi / overflow clamp (notalar clef üzerine binmesin) |
| `npm run qa:score-clef` | clef nota Y pozisyonları (treble do4=124 / bass do4=52) |
| `npm run qa:score-beam` | kiriş (beam) gruplama |
| `npm run qa:score-barline` | ölçü çizgisi yerleşimi |
| `npm run qa:playback` | aksidental persist, cresc ramp, tuplet timing, grace perde |

## Üretim araçları (yazma — `--write`)
| Komut | İş |
|-------|-----|
| `npm run tool:fix-pieces` / `:write` | hazır parçaları (`muzikHazirParcalar.js`) standart-doğru yeniden üret |
| `npm run tool:add-pdf-pieces` / `:write` | PDF parçalarını besteci+tempo ile ekle |

## Dev
- `npm run dev` → localhost:5188 · `npm run build` · `npm run preview`

---
*Kaynak: [package.json](../package.json) `scripts`. Yeni script eklenince burası güncellenir.*
