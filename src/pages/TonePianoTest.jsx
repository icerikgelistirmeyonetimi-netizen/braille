import React, { useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import PageHeader from '../components/PageHeader.jsx';
import { MUZIK_HAZIR_PARCALAR } from '../data/muzikHazirParcalar.js';
import { brfMuzikOku } from '../utils/music-brf/brfMusicReader.js';
import {
  muzikNotaMidiAl,
  keySignatureAccidentalsAl,
  PIANO_AUDIO_FOLDER,
} from '../utils/music-brf/musicPianoAudioHelpers.js';

// ─────────────────────────────────────────────────────────────────────────
// Tone.js Sampler DENEME SAYFASI (geçici).
// Amaç: Yemen Türküsü'nü Tone.Sampler ile çalıp "pıt/klik" sesi olmadan
// çalıp çalmadığını değerlendirmek. Mevcut piyano ses motoruna dokunmaz.
// Örnekler: public/piano ses/<tuşNo>.mp3  (tuşNo = midi - 20, 1..88)
// ─────────────────────────────────────────────────────────────────────────

const PARCA_ADI = 'Yemen Türküsü';

function midiNotaAdi(midi) {
  // Tone, "C#4" gibi bilimsel perde notasyonu bekler.
  return Tone.Frequency(midi, 'midi').toNote();
}

export default function TonePianoTest() {
  const [durum, setDurum] = useState('hazır');
  const [callogu, setCallogu] = useState([]);
  // true = nota kuyruğu doğal sönene kadar çalsın (dolu/gerçekçi his),
  // false = nota kendi müzikal süresinde kesilsin (kuru).
  const [kuyrukBiraksin, setKuyrukBiraksin] = useState(true);
  const samplerRef = useRef(null);

  // Yemen Türküsü BRF → nota/olay listesi
  const veri = useMemo(() => {
    const parca = MUZIK_HAZIR_PARCALAR.find((p) => p.ad === PARCA_ADI);
    if (!parca) return { items: [], keySig: {}, header: {} };
    const sonuc = brfMuzikOku(parca.brf, { source: 'editor-canonical-brf' });
    const keySig = keySignatureAccidentalsAl(sonuc.header?.keySignature);
    return { items: sonuc.items || [], keySig, header: sonuc.header || {} };
  }, []);

  // Çalınacak notalardan kullanılan benzersiz midi → örnek url haritası
  const samplerUrls = useMemo(() => {
    const urls = {};
    veri.items.forEach((item) => {
      if (item.tip !== 'nota') return;
      const midi = muzikNotaMidiAl(item, { keySignatureAccidentals: veri.keySig });
      if (!Number.isFinite(midi)) return;
      const tusNo = midi - 20; // public/piano ses/<tusNo>.mp3
      if (tusNo < 1 || tusNo > 88) return;
      const nota = midiNotaAdi(midi);
      if (!urls[nota]) urls[nota] = `${PIANO_AUDIO_FOLDER}/${tusNo}.mp3`;
    });
    return urls;
  }, [veri]);

  const cal = async () => {
    try {
      setCallogu([]);
      setDurum('ses bağlamı başlatılıyor…');
      await Tone.start(); // kullanıcı jesti: AudioContext resume

      // Sampler'ı (varsa) yeniden kurma
      if (!samplerRef.current) {
        setDurum('örnekler yükleniyor…');
        await new Promise((resolve, reject) => {
          const s = new Tone.Sampler({
            urls: samplerUrls,
            release: 1,         // kuyruk (saniye) — dolu/gerçekçi his
            curve: 'exponential',
            onload: resolve,
            onerror: reject,
          }).toDestination();
          samplerRef.current = s;
        });
      }

      const sampler = samplerRef.current;
      const bpm = 100;
      const secPerSixteenth = (60 / bpm) / 4;

      setDurum('çalınıyor…');
      const t0 = Tone.now() + 0.15;
      let cursor = t0;
      const log = [];

      veri.items.forEach((item) => {
        const dur16 = Number(item.duration16) || 0;
        const durSec = dur16 * secPerSixteenth;

        if (item.tip === 'nota') {
          const midi = muzikNotaMidiAl(item, { keySignatureAccidentals: veri.keySig });
          if (Number.isFinite(midi)) {
            const nota = midiNotaAdi(midi);
            if (kuyrukBiraksin) {
              // Hafif kuyruk: nota kendi süresi kadar tutulur, sonra sampler'ın
              // release'i (0.5 sn) kadar söner → bir sonraki notaya hafifçe taşar,
              // dolu/gerçekçi his verir ama bulanıklaşmaz.
              const tutSec = Math.max(0.12, durSec || 0.3);
              sampler.triggerAttackRelease(nota, tutSec, cursor);
            } else {
              // Kuru: nota kendi müzikal süresinde kesilsin (kısa release ile).
              const tutSec = Math.max(0.08, (durSec || 0.3) * 0.95);
              sampler.triggerAttackRelease(nota, tutSec, cursor);
            }
            log.push(`${item.notaAd}${item.oktav} (${nota}) — ${durSec.toFixed(2)}s`);
          }
        }

        if (dur16 > 0) cursor += durSec;
      });

      setCallogu(log);

      const toplamMs = (cursor - t0) * 1000 + 1200;
      window.setTimeout(() => setDurum('bitti'), toplamMs);
    } catch (err) {
      console.error(err);
      setDurum('HATA: ' + (err?.message || String(err)));
    }
  };

  const durdur = () => {
    try {
      samplerRef.current?.releaseAll();
    } catch { /* yoksay */ }
    setDurum('durduruldu');
  };

  const notaSayisi = veri.items.filter((i) => i.tip === 'nota').length;

  return (
    <div className="page">
      <PageHeader baslik="Tone.js Piyano Denemesi" />
      <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 16, paddingTop: 12 }}>
        <div style={{ fontSize: '1.05em', color: 'var(--muted)', maxWidth: 560, textAlign: 'center' }}>
          <b>{PARCA_ADI}</b> — Tone.Sampler ile çalınır. Klik/pıt sesi olup
          olmadığını değerlendirmek için kullanılır. Mevcut ses motoruna dokunmaz.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" type="button" onClick={cal}>▶ Çal</button>
          <button className="btn" type="button" onClick={durdur}>■ Durdur</button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.95em' }}>
          <input
            type="checkbox"
            checked={kuyrukBiraksin}
            onChange={(e) => setKuyrukBiraksin(e.target.checked)}
          />
          Kuyruk bıraksın (notalar doğal sönümle çalıp birbirine karışsın — daha dolu/gerçekçi)
        </label>

        <div role="status" aria-live="polite" style={{ fontWeight: 700, color: 'var(--accent)' }}>
          Durum: {durum}
        </div>

        <div style={{ fontSize: '0.9em', color: 'var(--muted)' }}>
          {notaSayisi} nota · {Object.keys(samplerUrls).length} benzersiz örnek yüklenecek
        </div>

        {callogu.length > 0 && (
          <details style={{ maxWidth: 560, width: '100%' }}>
            <summary style={{ cursor: 'pointer' }}>Çalınan notalar ({callogu.length})</summary>
            <ol style={{ fontSize: '0.82em', columns: 2, marginTop: 8 }}>
              {callogu.map((satir, i) => <li key={i}>{satir}</li>)}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}
