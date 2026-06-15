---
tags: [moc, muzik, brf]
---

# 🎵 Müzik BRF — Sistem Haritası

Braille müzik notasyonu: yazım editörü (`/muzik-brf-yazim`), BRF indir/yükle, skor çizimi, çalma. ← [[Proje Haritası]]

> **Tek otorite PDF:** `Downloads\Braille-Music-Notation-Introductory-Training-Program...pdf` Appendix 1 (s.121-131). Bkz. [[Kaynak Belgeler]].

## İki braille yolu TEK motordan türer (tutarlı olmalı)
1. **İNDİR** = `scoreToCanonicalBrf` → engine → ölçü-join
2. **EKRAN-ALTI overlay** = `useBrailleOutput.js` → `MuzikScoreSvg.jsx`

Her ikisi de `muzikSkorunuBrailleyeCevir`'den ve `muzikHeader.useBrailleGrouping`'den beslenir. Detay: [[claude-music#25. BRF İndir/Yükle Tek-Merkez Kontrol + Standart Doğrulama]] · [[CLAUDE]] (Music BRF Editor bölümü).

## Kural setleri (yazım standardı)
Kaynak: [[muzik-braille-yazim-kurallari]]

- **Order-of-signs (Bölüm 13)** — işaret yazım sırası → kalkan: `qa:brf-order` · `muzikModifierOncesiSira`/`muzikModifierSonrasiSira`
- **Boşluk kuralları (Bölüm 14)** — donanım↔zaman bitişik, değişimde iki yan boşluk → kalkan: `qa:brf-spacing`
- **Zorunlu oktav (L6 Kural 4)** — sözcük-dinamik sonrası ilk nota oktav alır; hairpin zorlamaz → kalkan: `qa:brf-octave`
- **Aksak metre gruplama** — `timeSignature.gruplamaDeseni`, import auto-çözüm → kalkan: `qa:brf-grouping`

## Tekrar cihazları (iki tür)
- **Geri-sayısal** (üst-rakam `⠼N` / `⠼N⠼M`) — "N ölçü geri say, M çal"
- **Bar-number** (alt-rakam `⠼<alt>N`) — mutlak ölçü no
- **Bar-repeat** `⠶` / `⠶⠼N` (kompakt ×N)

Kural: tekrarlar AÇIK işaretle yazılır, auto-tespit yok. Overlay = İNDİR aynen. Kalkan: `qa:brf-pieces` (48 parça). Detay: [[CLAUDE]] "SAYISAL TEKRAR" + "SKOR ALTI BRAILLE = BRF AYNEN".

## Özel notasyon
- **Grace (apejetür)** — 0 süre sayılır; ayrı çizim/playback/kirişleme. Bkz. [[CLAUDE]] "GRACE" bölümleri.
- **Tuplet / düzensiz gruplar** — `qa:brf-import` · [[claude-music#23. Tuplet (Düzensiz Gruplar) Sistemi]]
- **Süsleme (tril/turn/mordan)** — kiriş yönüne göre Y yerleşimi
- **Clef çıkarımı** — BRF clef kodlamaz; perdeden FA/SOL çıkarılır (yalnız görsel)
- **Hayalet ölçü numarası** — eski-editör parçalarında satır-içi ölçü-no (⠲=4/⠢=5/⠖=6/⠦=8) süsleme/grace okunur. **Kural:** eski (PDF olmayan) parçalarda HİÇ süsleme yok → görüleni sil; PDF süslemeleri gerçek, dokunma. 9 eski parça temiz (bekleyen yok). Bkz. [[CLAUDE]] "HAYALET ÖLÇÜ NUMARASI".
- **Satır başı ölçü numarası (Lesson 5, PDF s.40, zorunlu)** — her braille satırının 1. hücresinde, sayı işareti yok, **ÜST rakam (a–j: 1=⠁, 6=⠋)** + **BİR BOŞLUK** + müzik; anacrusis=0; ölçü bölünmez; 40 hücre/satır. Numara VERİYE gömülmez, anlık hesaplanır ([muzikOlcuNumarasi.js](../src/utils/music-brf/muzikOlcuNumarasi.js) `ustRakamYaz`). **Görünüm + indir + kopya üçü de** `numaraliBrfMetni`/`brfNumaraliGorunum` ile aynı; reader satır-başı üst-rakam grubunu (+ ayraç boşluğunu) atlayarak geri okur; round-trip güvenlik guard'ı (49 numaralı, 2 kenar parça orijinal). 11/11 qa:brf-* yeşil. Bkz. [[CLAUDE]] "SATIR BAŞI ÖLÇÜ NUMARASI".

## Editör (Perkins panel)
- [[claude-music#16. Perkins Braille Klavye Paneli (`PerkinsYazimPaneli.jsx`)]]
- Çift Enter ile açılır; chord input; maximal-munch decode (kanonik ters harita)
- Portal hedefi **yazımı** izler, imleci değil (kritik tuzak — [[CLAUDE]])

## İlgili notlar
- [[Müzik Kod Haritası]] — hangi dosya neyi yapar
- [[QA Komutları]] — testleri ne zaman çalıştırmalı
- [[Kaynak Belgeler]]

---
*Claude bakım görür; müzik kodu/kuralları değişince güncellenir.*
