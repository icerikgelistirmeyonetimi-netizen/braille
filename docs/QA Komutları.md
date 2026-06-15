---
tags: [qa, test, muzik]
---

# ✅ QA Komutları

`package.json` script'leri. ← [[Müzik BRF]] · [[Proje Haritası]]

> **Ne zaman:** müzik motoru/reader/`muzik.js` değişince ilgili `qa:*`'ı çalıştır. `muzik.js` değişince → `qa:brf-roundtrip`. Standart davranış değişince → `qa:brf-standard`.

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
