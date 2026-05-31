# Müzik BRF Legacy / Kullanılmayan Kod İndeksi

## A) Aktif kalacaklar
Bu fonksiyonlar/prosedürler hâlâ proje tarafından kullanılıyor ve taşınmayacak.
- `scoreToCanonicalBrf` (src/utils/music-brf/musicCanonicalPipeline.js)
- `scoreToReaderResult` (src/utils/music-brf/musicCanonicalPipeline.js)
- `muzikSkorunuBrailleyeCevir` (src/utils/music/musicBrfEngine.js)
- `brfMuzikOku` (src/utils/music-brf/brfMusicReader.js)
- `useBrailleOutput` (src/hooks/music-brf/useBrailleOutput.js)
- `useMuzikBrfEditor` (src/hooks/music-brf/useMuzikBrfEditor.jsx)
- `MUSIC_CANONICAL_BRF` feature flag (src/utils/music-brf/musicCanonicalFlags.js)
- `brailleRowsFromMeasures` / `brailleMeasureGroups` / `muzikBrfExportMetniOlustur` / `brfOlcuBazliSatirlaraBol` / `muzikOlcuGruplariniMetneCevir` — bunlar hâlâ fallback export/preview yolunda kullanılıyor.

## B) Legacy fallback olarak kalanlar
Bu fonksiyonlar aktif ana canonical pipeline'da yer almıyor, ancak şu anda fallback veya karşılaştırma amacıyla tutuluyor.
- `brailleRowsFromMeasures` (src/utils/music-brf/brailleMeasureHelpers.js)
  - Dosya: src/utils/music-brf/brailleMeasureHelpers.js
  - Neden legacy: Canonical BRF pipeline aktifken eski satır bazlı braille ölçü gruplama yolu kullanılıyor.
  - Hâlâ çağrılıyor: src/hooks/music-brf/useBrailleOutput.js
  - Taşınabilir mi: hayır (fallback olarak ihtiyaç duyuluyor)
- `brailleMeasureGroups` (src/utils/music-brf/brailleMeasureHelpers.js)
  - Dosya: src/utils/music-brf/brailleMeasureHelpers.js
  - Neden legacy: eski grup oluşturma yolunun bir parçası.
  - Hâlâ çağrılıyor: src/utils/music-brf/brailleMeasureHelpers.js
  - Taşınabilir mi: hayır
- `muzikBrfExportMetniOlustur` (src/utils/music-brf/musicBrfExportEngine.js)
  - Dosya: src/utils/music-brf/musicBrfExportEngine.js
  - Neden legacy: canonical export yoksa veya fallback gerektiriyorsa kullanılıyor.
  - Hâlâ çağrılıyor: src/hooks/music-brf/useBrailleOutput.js
  - Taşınabilir mi: hayır
- `brfOlcuBazliSatirlaraBol` (src/utils/music-brf/musicBrfExportEngine.js)
  - Dosya: src/utils/music-brf/musicBrfExportEngine.js
  - Neden legacy: eski BRF satır bölme yardımı.
  - Hâlâ çağrılıyor: src/utils/music-brf/musicBrfExportEngine.js
  - Taşınabilir mi: hayır
- `muzikOlcuGruplariniMetneCevir` (src/utils/music-brf/musicBrfExportEngine.js)
  - Dosya: src/utils/music-brf/musicBrfExportEngine.js
  - Neden legacy: eski BRF ölçü metin çevirisi.
  - Hâlâ çağrılıyor: src/utils/music-brf/musicBrfExportEngine.js
  - Taşınabilir mi: hayır

## C) Kesin kullanılmayanlar
Projede başka hiçbir yerde import edilmedi/çağrılmadı. Bunlar taşınabilir.
- `musicCanonicalPipelineDebug.js`
  - Dosya: src/utils/music-brf/musicCanonicalPipelineDebug.js
  - Son kullanım araması sonucu: proje genelinde hiçbir `musicCanonicalPipelineDebug` referansı yok.
  - Taşınacak yer: src/utils/music-brf/_legacy/musicCanonicalPipelineDebug.js
- `brailleLayoutHelpers.js`
  - Dosya: src/utils/music-brf/brailleLayoutHelpers.js
  - Son kullanım araması sonucu: proje genelinde hiçbir `brailleLayoutHelpers` referansı yok.
  - Taşınacak yer: src/utils/music-brf/_legacy/brailleLayoutHelpers.js
- `src/utils/music-brf/import/` klasörü içindeki tüm dosyalar
  - Taşınacak yer: src/utils/music-brf/_legacy/import/
  - Neden: import motoru fonksiyonları artık proje genelinde hiçbir yerde import edilmiyor.
- `brailleGlobalOlculeriOlustur`
  - Dosya: src/utils/music-brf/brailleMeasureHelpers.js
  - Son kullanım araması sonucu: sadece kendi tanımında referanslanıyor; dışarıdan hiçbir şekilde çağrılmıyor.
  - Taşınacak yer: src/utils/music-brf/_legacy/legacyUnusedFunctions.js

## D) Emin olunmayanlar
Bu kodların kullanım durumu belirsiz veya dikkatle korunmalı.
- `src/utils/music/musicBrfEngine.js` içindeki helper fonksiyonlar
  - Riskli dosya: aktif müzik BRF sistemi.
  - Dokunma: sadece indexle ve future onayla temizle.
- `src/utils/music/musicMeasureEngine.js`
  - Riskli dosya: aktif ölçü tamamlama.
- `src/utils/music/musicDuration.js`
  - Riskli dosya: süre/ölçü mantığı.
- `src/utils/music-brf/brfMuzikOku.js`
  - Riskli dosya: canonical reader/import yolu.
- `src/hooks/music-brf/useMuzikBrfEditor.jsx`
  - Riskli dosya: editör state ve canonical reader.
- `src/hooks/music-brf/useBrailleOutput.js`
  - Riskli dosya: preview/export kaynakları.
- `src/pages/MuzikBrfYazim.jsx`
  - Riskli dosya: BRF arayüzü.

## Taşınanlar için not
- Taşıma sonrası build çalışmazsa değişiklikler geri alınacak.
- Aktif rotaları veya şu anki canonical BRF yolunu bozmamak öncelikli.
