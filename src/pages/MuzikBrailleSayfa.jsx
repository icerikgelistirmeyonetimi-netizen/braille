import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import SesIzinEkrani from '../components/SesIzinEkrani.jsx';
import { MUZIK_BOLUMLER } from '../data/muzik.js';
import { usePianoNotePreview } from '../hooks/music-brf/usePianoNotePreview.js';
import { muzikNotaPiyanoSesUrlAl } from '../utils/music-brf/musicPianoAudioHelpers.js';

const NOTA_ADLARI = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const _appBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
const METRONOM_URL = `${_appBase}/audio/metronom.mp3`;
let _metronomAudio = null;

function metronomTikCal(volume = 0.85) {
  try {
    if (!_metronomAudio) {
      _metronomAudio = new Audio(METRONOM_URL);
      _metronomAudio.preload = 'auto';
    }
    const tik = _metronomAudio.cloneNode(true);
    tik.volume = Math.max(0, Math.min(1, volume));
    tik.currentTime = 0;
    const r = tik.play();
    if (r?.catch) r.catch(() => {});
  } catch {}
}

// "(4 vuruş sessizlik)" → 4, "(yarım vuruş sessizlik)" → 0.5, "(1,5 vuruş…)" → 1.5
function vurusSayisiAl(aciklama = '') {
  if (/yarım vuruş/i.test(aciklama)) return 0.5;
  const m = aciklama.match(/\(([0-9,\.]+)\s*vuruş/);
  if (m) return parseFloat(m[1].replace(',', '.'));
  return null;
}

function notaAdiniCikar(ad = '') {
  const kucuk = ad.toLocaleLowerCase('tr');
  return NOTA_ADLARI.find((n) =>
    kucuk === n ||
    kucuk.endsWith(` ${n}`) ||
    kucuk.startsWith(`${n} `) ||
    kucuk.startsWith(`${n}(`)
  ) || null;
}

export default function MuzikBrailleSayfa() {
  const { slug } = useParams();
  const bolum = MUZIK_BOLUMLER.find((b) => b.slug === slug);
  const [sesIzniVar, setSesIzniVar] = useState(false);
  const susSesiTimerlarRef = React.useRef([]);

  const { playNote, stopAll, preloadUrls } = usePianoNotePreview({
    enabled: true,
    volume: 0.7,
    extension: 'mp3',
  });

  useEffect(() => {
    const urls = [];
    // Tüm notaları 4. oktavda preload et (notalar, sureler, diğer bölümler)
    NOTA_ADLARI.forEach((ad) => {
      [0, 1, 2, 3].forEach((sureIndeksi) => {
        urls.push(muzikNotaPiyanoSesUrlAl({ tip: 'nota', notaAd: ad, oktav: 4, sureIndeksi }, { extension: 'mp3' }));
      });
    });
    // Oktav sayfası: 1–7. oktavlarda do notasını preload et
    for (let o = 1; o <= 7; o++) {
      urls.push(muzikNotaPiyanoSesUrlAl({ tip: 'nota', notaAd: 'do', oktav: o, sureIndeksi: 1 }, { extension: 'mp3' }));
    }
    preloadUrls?.(urls.filter(Boolean));
  }, [preloadUrls]);

  const ogeSesiCal = useCallback((oge, opts = {}) => {
    // Önceki sus timerlarını temizle
    susSesiTimerlarRef.current.forEach(clearTimeout);
    susSesiTimerlarRef.current = [];

    const zamanla = (fn, gecikmeMs) => {
      const t = setTimeout(fn, Math.max(0, gecikmeMs));
      susSesiTimerlarRef.current.push(t);
      return t;
    };

    const ritimOrnegi = oge?.ritimOrnegi;
    if (ritimOrnegi) {
      const beatMs = ritimOrnegi.beatMs || 500;
      const vurusSayisi = ritimOrnegi.vurusSayisi || 4;
      const notaAd = oge?.notaAd && oge.notaAd !== 'sus' ? oge.notaAd : 'do';
      const oktav = oge?.oktav ?? 4;
      const piyanoCal = (durationMs = beatMs * 0.85) => {
        playNote(
          { tip: 'nota', notaAd, oktav, sureIndeksi: 1 },
          { cutOff: true, durationMs },
        );
      };

      for (let i = 0; i < vurusSayisi; i += 1) {
        zamanla(() => metronomTikCal(), i * beatMs);
      }
      (ritimOrnegi.piyanoOlaylari || []).forEach((olay) => {
        const baslangicMs = Number.isFinite(Number(olay.yarimVurus))
          ? (Number(olay.yarimVurus) - 1) * (beatMs / 2)
          : (Number(olay.vurus || 1) - 1) * beatMs;
        const sureMs = Number.isFinite(Number(olay.sureMs))
          ? Number(olay.sureMs)
          : Number.isFinite(Number(olay.sureYarimVurus))
            ? Number(olay.sureYarimVurus) * (beatMs / 2)
            : Number.isFinite(Number(olay.sureVurus))
              ? Number(olay.sureVurus) * beatMs
              : beatMs * 0.85;
        zamanla(() => piyanoCal(sureMs), baslangicMs);
      });
      (ritimOrnegi.piyanoVuruslari || []).forEach((vurus) => {
        zamanla(piyanoCal, (vurus - 1) * beatMs);
      });
      (ritimOrnegi.piyanoYarimVuruslari || []).forEach((yarimVurus) => {
        zamanla(() => piyanoCal((beatMs / 2) * 0.82), (yarimVurus - 1) * (beatMs / 2));
      });
      zamanla(() => {
        if (typeof opts.onEnded === 'function') opts.onEnded();
      }, (vurusSayisi * beatMs) + 450);
      return;
    }

    const vurusSayisi = oge?.vurusSayisi;

    // Sus sesi: önce do, ortada metronom tikleri, sonra do
    if (vurusSayisi !== null && vurusSayisi !== undefined) {
      const beatMs = 500;
      const toplamMs = Math.round(vurusSayisi * beatMs);
      playNote({ tip: 'nota', notaAd: 'do', oktav: 4, sureIndeksi: 1 });
      const araVurus = Math.floor(vurusSayisi);
      for (let i = 1; i < araVurus; i++) {
        const t = setTimeout(() => metronomTikCal(), 650 + i * beatMs);
        susSesiTimerlarRef.current.push(t);
      }
      const bitisT = setTimeout(() => {
        playNote({ tip: 'nota', notaAd: 'do', oktav: 4, sureIndeksi: 1 });
        if (typeof opts.onEnded === 'function') opts.onEnded();
      }, 650 + toplamMs);
      susSesiTimerlarRef.current.push(bitisT);
      return;
    }

    const notaAd = oge?.notaAd || notaAdiniCikar(oge?.yazi || '');
    if (!notaAd || notaAd === 'sus') {
      if (typeof opts.onEnded === 'function') opts.onEnded();
      return;
    }
    const oktav = oge?.oktav ?? 4;
    playNote({ tip: 'nota', notaAd, oktav, sureIndeksi: 1 });
    if (typeof opts.onEnded === 'function') {
      setTimeout(opts.onEnded, 650);
    }
  }, [playNote]);

  const ogeSesiDurdur = useCallback(() => {
    susSesiTimerlarRef.current.forEach(clearTimeout);
    susSesiTimerlarRef.current = [];
    stopAll?.();
  }, [stopAll]);

  if (!bolum) return <Navigate to="/muzik" replace />;

  const ogeler = (bolum.veri || []).map((s) => {
    const temizAd = s.ad.replace(/\s*\([^)]*\)/g, '').trim();
    const baseYazi = temizAd.charAt(0).toUpperCase() + temizAd.slice(1);
    const tekNotaMi = NOTA_ADLARI.includes(temizAd.toLocaleLowerCase('tr'));
    const yazi = tekNotaMi ? `${baseYazi} notası` : baseYazi;
    const ttsYazi = yazi;
    // Oktav sayfası: "1. oktav …" → do notasını o oktavda çal.
    // Diğer derslerde "1. dolap" gibi numaralı terimler oktav sanılmamalı.
    const oktavSayfasi = bolum.slug?.startsWith('oktav');
    const oktavEslesmesi = oktavSayfasi ? s.ad.match(/^(\d+)\./) : null;
    const notaAd = notaAdiniCikar(s.ad) || (oktavEslesmesi ? 'do' : null);
    const oktav = oktavEslesmesi ? parseInt(oktavEslesmesi[1]) : null;
    // Sus sayfası: aciklama'dan vuruş sayısını çıkar
    const vurusSayisi = vurusSayisiAl(s.aciklama || '');
    return {
      yazi,
      ttsYazi,
      notaAd: notaAd || (vurusSayisi !== null ? 'sus' : null),
      oktav,
      vurusSayisi,
      ritimOrnegi: s.ritimOrnegi,
      okunus: '',
      anlam: '',
      hucreler: s.hucreler || [],
      ...(s.sesOncesiYonergeMetni ? { sesOncesiYonergeMetni: s.sesOncesiYonergeMetni } : {}),
      ...(s.tamYonergeMetni ? { tamYonergeMetni: s.tamYonergeMetni } : {}),
    };
  });

  // Nota veya sus sesi olan sayfalarda popup göster
  const sesliSayfa = ogeler.some((o) => o.ritimOrnegi || o.notaAd || o.vurusSayisi !== null && o.vurusSayisi !== undefined);

  if (sesliSayfa && !sesIzniVar) {
    return (
      <SesIzinEkrani
        baslik={bolum.pageBaslik}
        aciklama="Bu etkinlikte piyano ve/veya baget sesleri kullanılacak. Başlamadan önce sesi etkinleştirin."
        butonMetni="Sesi Başlat ve Etkinliğe Geç"
        sessizBaslat
        onIzinVerildi={() => setSesIzniVar(true)}
      />
    );
  }

  return (
    <CokHucreOkuyucu
      // ⚠ key ŞART: tüm müzik dersleri aynı route'ta (/muzik/:slug) — slug değişince remount
      // olmazsa indeks önceki dersin "bitti" değerinde kalır (bkz. KuranIsaretEgitimi notu).
      key={slug}
      baslik={bolum.pageBaslik}
      ogeler={ogeler}
      bittiMesaji={`Tebrikler! ${bolum.kisaBaslik} bölümünü tamamladınız.`}
      bolumAnahtari={bolum.ilerlemeAnahtari}
      ogeSesiCal={sesliSayfa ? ogeSesiCal : undefined}
      ogeSesiDurdur={sesliSayfa ? ogeSesiDurdur : undefined}
      ogeSesiOnceCal={sesliSayfa}
      ogeSesiHerZaman={sesliSayfa}
      ogeSesiSonrasiKonusmaGecikmeMs={900}
      yonergeFormati="sirayla"
    />
  );
}
