---
tags: [muzik, kod]
---

# 🧱 Müzik Kod Haritası

Hangi dosya neyi yapar. ← [[Müzik BRF]]. Tam liste: [[claude-music#2. Dosya Haritası]].

## Editör sayfası + state
- [MuzikBrfYazim.jsx](../src/pages/MuzikBrfYazim.jsx) — editör sayfası (`/muzik-brf-yazim`)
- [useMuzikBrfEditor.jsx](../src/hooks/music-brf/useMuzikBrfEditor.jsx) — ana state (oge/bağ/tuplet, import adaptörü)
- [MuzikBrfScoreEditor.jsx](../src/components/music/MuzikBrfScoreEditor.jsx) — skor editörü
- [PerkinsYazimPaneli.jsx](../src/components/music/PerkinsYazimPaneli.jsx) — Perkins klavye paneli (çift Enter)
- [MuzikScoreSvg.jsx](../src/components/music/MuzikScoreSvg.jsx) — SVG skor çizimi + klavye nav

## BRF motoru (encode/decode)
- [musicBrfEngine.js](../src/utils/music/musicBrfEngine.js) — BRF encode/decode çekirdeği
- [musicOctaveEngine.js](../src/utils/music/musicOctaveEngine.js) — oktav mantığı (L6 Kural 4)
- [musicGroupingEngine.js](../src/utils/music/musicGroupingEngine.js) — kiriş gruplama
- [musicHeaderEngine.js](../src/utils/music/musicHeaderEngine.js) — başlık/donanım/zaman (boşluk kuralları)
- [musicRepeatEngine.js](../src/utils/music/musicRepeatEngine.js) — tekrar işaretleri

## music-brf (üst seviye boru hattı)
- [musicCanonicalPipeline.js](../src/utils/music-brf/musicCanonicalPipeline.js) — kanonik ölçü-join (çok-hücreli barline)
- [brfMusicReader.js](../src/utils/music-brf/brfMusicReader.js) — BRF → skor (ana döngü)
- [brfMusicReaderRules.js](../src/utils/music-brf/brfMusicReaderRules.js) — satır türü, tekrar, zaman değişimi, donanım
- [musicBrailleReverseMaps.js](../src/utils/music-brf/musicBrailleReverseMaps.js) — kanonik ters harita (Perkins decode)
- [useBrailleOutput.js](../src/hooks/music-brf/useBrailleOutput.js) — overlay hücre dağıtımı
- [brailleColors.js](../src/utils/music-brf/brailleColors.js) · [brailleLegendRegistry.js](../src/utils/music-brf/brailleLegendRegistry.js) — renk + legend
- [muzikOlcuNumarasi.js](../src/utils/music-brf/muzikOlcuNumarasi.js) — satır başı ölçü numarası (sunum; veriye gömmez) — Lesson 5

## Çizim yardımcıları
- [useMusicScoreLayout.js](../src/hooks/music-brf/useMusicScoreLayout.js) — X dağıtımı / overflow clamp
- [musicVisualBeamHelpers.js](../src/utils/music-brf/musicVisualBeamHelpers.js) — grace dışla, görsel kiriş
- [musicMeasureHelpers.js](../src/utils/music-brf/musicMeasureHelpers.js) — grace 0-süre, auto-barline
- [bravuraMetrics.js](../src/utils/music-brf/bravuraMetrics.js) — Bravura SMuFL metrikleri

## Çalma
- [musicPlaybackHelpers.js](../src/utils/music-brf/musicPlaybackHelpers.js) — ornament/grace/cresc/tuplet timing
- [musicPianoAudioHelpers.js](../src/utils/music-brf/musicPianoAudioHelpers.js) — MIDI/aksidental persist

## Veri
- [muzik.js](../src/data/muzik.js) — ders verisi (nota/süre/sembol) — **BRF motorunun kaynağı**
- [muzikHazirParcalar.js](../src/data/muzikHazirParcalar.js) — hazır parçalar

---
*İlgili: [[QA Komutları]] · [[Kaynak Belgeler]]. Dosya taşınınca/eklenince güncellenir.*
