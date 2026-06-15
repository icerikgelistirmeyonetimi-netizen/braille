---
tags: [moc, anasayfa]
---

# 🗺️ Proje Haritası

Braille eğitim uygulaması (React + Vite). Bu not, projenin **giriş kapısıdır** — Obsidian'da sol üstte aç, grafik görünümüyle (Ctrl+G) ilişkileri gez.

> Bu vault tüm repoyu kapsar. `node_modules`, `dist`, `android` hariç tutuldu (`.obsidian/app.json`). Kod dosyaları da grafikte görünür ve tıklanabilir.

## 🎵 En yoğun alan: Müzik BRF
- [[Müzik BRF]] — müzik notasyonu sistemi haritası (en karmaşık modül)
- [[Müzik Kod Haritası]] — motor / reader / editör dosyaları
- [[QA Komutları]] — `npm run qa:*` test kalkanları
- [[Kaynak Belgeler]] — PDF otoritesi + kural/örnek dosyaları

## 📚 Ana belgeler
- [[CLAUDE]] — oturum kılavuzu (tüm modüller, tek dosya)
- [[claude-music]] — müzik BRF detay kılavuzu (25 bölüm)
- [[muzik-braille-yazim-kurallari]] — braille müzik yazım kuralları
- [[muzik-braille-test-ornekleri]] — PDF-doğrulanmış örnek oracle'ı
- [[AGENTS]]

## 🧩 Öğrenme modülleri (kod)
Her modül `CokHucreOkuyucu` şablonunu kullanır. Bkz. [[CLAUDE#2. Core Template Component]].

| Modül | Konu | Giriş |
|-------|------|-------|
| 1 | Harfler / Rakamlar | [HarfEgitimi.jsx](../src/pages/HarfEgitimi.jsx) · [RakamEgitimi.jsx](../src/pages/RakamEgitimi.jsx) |
| 2 | Kısaltmalar | [KisaltmaBirHarfli.jsx](../src/pages/KisaltmaBirHarfli.jsx) |
| 3 | Noktalama / Özel işaretler | [NoktalamaIsaretleri.jsx](../src/pages/NoktalamaIsaretleri.jsx) |
| 5 | Kur'an | [KuranHarfEgitimi.jsx](../src/pages/KuranHarfEgitimi.jsx) |
| 6 | Matematik | [MatematikSembolEgitimi.jsx](../src/pages/MatematikSembolEgitimi.jsx) |
| 7 | Fen | [FenSembolEgitimi.jsx](../src/pages/FenSembolEgitimi.jsx) |
| 8 | Müzik | [[Müzik BRF]] |
| 9 | Yabancı dil | [YabanciBrailleSayfa.jsx](../src/pages/YabanciBrailleSayfa.jsx) |
| 10 | BRF araçları | [MuzikBrfYazim.jsx](../src/pages/MuzikBrfYazim.jsx) |
| — | Braille Arama (/arama) | [AramaSayfasi.jsx](../src/pages/AramaSayfasi.jsx) · [aramaIndeksi.js](../src/utils/aramaIndeksi.js) |

## 🔧 Çekirdek bileşenler
- [CokHucreOkuyucu.jsx](../src/components/CokHucreOkuyucu.jsx) — evrensel öğretim şablonu
- [BrailleCell.jsx](../src/components/BrailleCell.jsx) — tek hücre
- [DesktopShell.jsx](../src/components/DesktopShell.jsx) — sayfa kabuğu
- [App.jsx](../src/App.jsx) — router + odak yönetimi
- [ses.js](../src/utils/ses.js) — TTS + ses efektleri
- [ayarlar.js](../src/utils/ayarlar.js) — kullanıcı ayarları

---
*Bu not Claude tarafından bakım görür; kod/doküman değişince güncellenir.*
