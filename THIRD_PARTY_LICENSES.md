# Third-Party Licenses

Bu proje aşağıdaki üçüncü taraf varlıkları içerir. Her birinin lisans
metni `public/fonts/...` veya proje deposunda saklanır.

---

## Bravura Text Font

- **Telif sahibi:** © 2015–present Steinberg Media Technologies GmbH
- **Lisans:** SIL Open Font License, Version 1.1 (OFL-1.1)
- **Konum:** `public/fonts/bravura/BravuraText.woff` ve `BravuraText.woff2`
- **Lisans metni:** `public/fonts/bravura/OFL.txt`
- **Font değişiklik geçmişi:** `public/fonts/bravura/FONTLOG.txt`
- **Kaynak:** https://github.com/steinbergmedia/bravura
- **Kullanım amacı:** SMuFL (Standard Music Font Layout) uyumlu müzik
  notasyon glyph'lerinin (sol/fa/do anahtarları, rest, accidental, vb.)
  doğru gösterimi.

### Kullanım hakları (OFL 1.1 özeti)

| | |
|---|---|
| Ticari kullanım | ✅ Serbest |
| Modifikasyon | ✅ Serbest (yeni isimle) |
| Dağıtım | ✅ Serbest (OFL ile birlikte) |
| Yazılıma gömme | ✅ Serbest |
| Resmi/kamu kurum kullanımı | ✅ Serbest |
| Geri alınabilirlik | ❌ Hayır (lisans irrevocable) |
| Fontu tek başına satma | ❌ Yasak |

Tam lisans metni için: `public/fonts/bravura/OFL.txt`

---

## Amasya Font (Arapça karakter yelpazesi için)

- **Konum:** `public/Amasya-Regular.ttf`
- Lisans bilgisi font dosyasının kendisinde / dağıtım kaynağında belirtilmiştir.

---

## liblouis (İngilizce / Almanca / Fransızca Grade 2 Braille çevirisi)

- **Telif sahibi:** © 1999–present The liblouis Contributors
- **Lisans:** Kütüphane (LGPL-3.0-or-later); çeviri tabloları (LGPL-2.1 ve
  serbest lisanslar). JavaScript/Emscripten bağlamaları (liblouis-js) GPL-3.0.
- **Konum:**
  - `public/liblouis/build-no-tables-utf32.js` (Emscripten C-API derlemesi)
  - `public/liblouis/easy-api.js` (JS bağlama API'si)
  - `public/liblouis/tables/` (çeviri tabloları; ör. `en-ueb-g2.ctb`,
    `de-de-g2.ctb`, `fr-bfu-g2.ctb`, `unicode.dis`)
  - `public/liblouis/louis-worker.js` (bu projede yazılan worker sarmalayıcı)
- **Lisans metni:** `node_modules/liblouis/LICENSE` ve tablo dosyalarının
  başlıklarındaki lisans bildirimleri.
- **Kaynak:** https://github.com/liblouis/liblouis ve
  https://github.com/liblouis/liblouis-js
- **Kullanım amacı:** İngilizce (UEB), Almanca ve Fransızca metinlerin
  standart 2. derece (Grade 2 / kısaltmalı) Braille'e hatasız çevrilmesi.
  Tüm varlıklar uygulama ile aynı kaynaktan (yerel) servis edilir; çalışma
  anında hiçbir dış adrese istek yapılmaz.

### Kullanım hakları (LGPL/GPL özeti)

| | |
|---|---|
| Ticari kullanım | ✅ Serbest |
| Resmi/kamu kurum kullanımı | ✅ Serbest |
| Dağıtım | ✅ Serbest (lisans bildirimleri korunarak) |
| Yazılıma gömme / web'de sunma | ✅ Serbest |
| Lisans bedeli | ❌ Yok (ücretsiz) |
| Tek yükümlülük | Lisans metni ve atfın korunması |

