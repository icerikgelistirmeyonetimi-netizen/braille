import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, basariBildir, hataBildir, konusmayiDurdur } from '../utils/ses.js';
import { indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';
import { okumaModuIkinciSatir } from '../utils/okumaModuMetni.js';
import { usePianoNotePreview } from '../hooks/music-brf/usePianoNotePreview.js';
import { muzikNotaPiyanoSesUrlAl } from '../utils/music-brf/musicPianoAudioHelpers.js';

const DIYEZ_SIRASI = ['fa', 'do', 'sol', 're', 'la', 'mi', 'si'];
const BEMOL_SIRASI = ['si', 'mi', 'la', 're', 'sol', 'do', 'fa'];
const METRONOM_CLICK_URL = '/audio/metronom.mp3';

// İlk hücrenin noktalarını içeren dokunma yönergesi.
// Çok hücrelilerde "1. hücre:" ön eki; tek hücrelide doğrudan noktalar.
// (Hücre-noktası effect'i ilk hücreyi atladığından, ilk hücre burada okunur.)
function ilkHucreTapMesajiAl(oge) {
  const hucreler = Array.isArray(oge?.hucreler) ? oge.hucreler : [];
  if (hucreler.length === 0) return '';
  const ilk = Array.isArray(hucreler[0]) ? hucreler[0] : (hucreler[0] != null ? [hucreler[0]] : []);
  if (!ilk.length) return ' Lütfen noktalarına dokunun.';
  const cokHucre = hucreler.length > 1;
  return cokHucre
    ? ` 1. hücre: ${ilk.join(', ')} numaralı noktalara dokunun.`
    : ` ${ilk.join(', ')} numaralı noktalara dokunun.`;
}

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Noktalama ve özel işaret sayfası.
// Listedeki her madde için: hücre(ler), açıklama, kullanım kuralları ve örnekleri sıralı olarak gösterir.
export default function IsaretSayfasi({ baslik, isaretler, bolumAnahtari, matematikHucreGorunumu = false, seslendirmeDili = 'tr' }) {
  const [indeks, setIndeks] = useState(() => {
    const k = indeksAl(bolumAnahtari);
    return k < isaretler.length ? k : 0;
  });
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]);
  const [yanlis, setYanlis] = useState([]);
  const [okumaModu, setOkumaModu] = useState(false);
  const [notaSesiAktif, setNotaSesiAktif] = useState(false);
  const notaSesiTimerRef = useRef(null);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const { playNote, preloadUrls } = usePianoNotePreview({
    enabled: true,
    volume: 0.7,
    extension: 'mp3',
  });
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const kayitliImza = kayitliAdlar.join('|');
  const aktifListe = useMemo(() => {
    const adlar = sonraOgrenAl(anahtar);
    if (!kayitlilarModu) return isaretler;
    return isaretler.filter((s) => adlar.includes(s.ad));
  }, [kayitlilarModu, isaretler, kayitliImza, anahtar]);

  const bitti = indeks >= aktifListe.length;
  const k = aktifListe[indeks];
  const isMuzikSureleri = bolumAnahtari === 'muzik-sureler';
  const isMuzikOktav = bolumAnahtari === 'muzik-oktav';
  const isMuzikAksidental = bolumAnahtari === 'muzik-degistirici';
  const isMuzikDonanim = bolumAnahtari === 'muzik-donanim';
  const isMuzikSus = bolumAnahtari === 'muzik-sus';
  const isMuzikDinamik =
    bolumAnahtari === 'muzik-dinamik' ||
    bolumAnahtari === 'muzik-hairpin';
  const isMuzikBag = bolumAnahtari === 'muzik-bag' || bolumAnahtari === 'muzik-baglar';
  const isMuzikSusleme =
    bolumAnahtari === 'muzik-susleme' ||
    bolumAnahtari === 'muzik-suslemeler';
  const isMuzikZaman =
    bolumAnahtari === 'muzik-zaman' ||
    bolumAnahtari === 'muzik-zaman-imzasi' ||
    bolumAnahtari === 'muzik-zaman-imzası';
  const isMuzikTuplet =
    bolumAnahtari === 'muzik-tuplet' ||
    bolumAnahtari === 'muzik-duzensiz-grup' ||
    bolumAnahtari === 'muzik-duzensiz-gruplar' ||
    bolumAnahtari === 'muzik-duzensiz' ||
    bolumAnahtari === 'muzik-ritmik-grup';
  const isMuzikTempo =
    bolumAnahtari === 'muzik-tempo' ||
    bolumAnahtari === 'muzik-tempo-isaretleri' ||
    bolumAnahtari === 'muzik-hiz' ||
    bolumAnahtari === 'muzik-hız';
  const isMuzikTekrar =
    bolumAnahtari === 'muzik-tekrar' ||
    bolumAnahtari === 'muzik-repeat' ||
    bolumAnahtari === 'muzik-braille-repeat';
  const isMuzikArtikulasyon =
    bolumAnahtari === 'muzik-artikulasyon' ||
    bolumAnahtari === 'muzik-artikülasyon' ||
    bolumAnahtari === 'muzik-artikulasyonlar' ||
    bolumAnahtari === 'muzik-artikülasyonlar' ||
    bolumAnahtari === 'muzik-nuans' ||
    bolumAnahtari === 'muzik-nüans' ||
    bolumAnahtari === 'muzik-nuanslar' ||
    bolumAnahtari === 'muzik-nüanslar' ||
    bolumAnahtari === 'muzik-nuans-once' ||
    bolumAnahtari === 'muzik-nüans-önce' ||
    bolumAnahtari === 'muzik-nuans-onceki' ||
    bolumAnahtari === 'muzik-nüans-önceki' ||
    bolumAnahtari === 'muzik-nuans-sonra' ||
    bolumAnahtari === 'muzik-nüans-sonra' ||
    bolumAnahtari === 'muzik-nuans-sonrasi' ||
    bolumAnahtari === 'muzik-nüans-sonrası' ||
    bolumAnahtari === 'muzik-ifade' ||
    bolumAnahtari === 'muzik-ifade-isaretleri' ||
    bolumAnahtari === 'muzik-ifade-işaretleri';

  const isHerhangiBirMuzikSesliBolum =
    isMuzikSureleri ||
    isMuzikOktav ||
    isMuzikAksidental ||
    isMuzikDonanim ||
    isMuzikSus ||
    isMuzikDinamik ||
    isMuzikBag ||
    isMuzikSusleme ||
    isMuzikZaman ||
    isMuzikTuplet ||
    isMuzikTempo ||
    isMuzikTekrar ||
    isMuzikArtikulasyon;

  const notaDizisiTimerlariRef = useRef([]);
  const notaDizisiTimerlariniTemizle = useCallback(() => {
    notaDizisiTimerlariRef.current.forEach((timerId) => clearTimeout(timerId));
    notaDizisiTimerlariRef.current = [];
  }, []);

  const tumSesleriDurdur = useCallback(() => {
    konusmayiDurdur();
    notaDizisiTimerlariniTemizle();
    if (notaSesiTimerRef.current) {
      clearTimeout(notaSesiTimerRef.current);
      notaSesiTimerRef.current = null;
    }
  }, [notaDizisiTimerlariniTemizle]);

  const sureliNotaBilgisi = useMemo(() => {
    if (!isMuzikSureleri || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const noteMatch = ad.match(/\b(do|re|mi|fa|sol|la|si)\b/i);
    if (!noteMatch) return null;

    let sureIndeksi = null;
    if (ad.includes('sekizlik')) sureIndeksi = 0;
    else if (ad.includes('dörtlük') || ad.includes('dortluk')) sureIndeksi = 1;
    else if (ad.includes('yarım') || ad.includes('yarim')) sureIndeksi = 2;
    else if (ad.includes('tam')) sureIndeksi = 3;
    else if (ad.includes('16')) sureIndeksi = 4;
    else if (ad.includes('32')) sureIndeksi = 5;
    else if (ad.includes('64')) sureIndeksi = 6;

    if (sureIndeksi == null) return null;

    return {
      notaAd: noteMatch[1].toLocaleLowerCase('tr'),
      sureIndeksi,
    };
  }, [isMuzikSureleri, k]);

  const muzikNotaSesiCal = useCallback((notaAd, oktav = 4, sureIndeksi = 1) => {
    if (!notaAd) return;

    playNote({
      tip: 'nota',
      notaAd,
      oktav,
      sureIndeksi,
    });
  }, [playNote]);

  const sureliNotaSesiCal = useCallback((notaAd, sureIndeksi) => {
    muzikNotaSesiCal(notaAd, 4, sureIndeksi);
  }, [muzikNotaSesiCal]);

  const oktavNotaBilgisi = useMemo(() => {
    if (!isMuzikOktav || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');

    const match = ad.match(/([1-7])\.\s*oktav/);
    if (!match) return null;

    const oktav = Number(match[1]);

    if (!Number.isFinite(oktav) || oktav < 1 || oktav > 7) {
      return null;
    }

    return {
      notaAd: 'do',
      oktav,
      sureIndeksi: 1,
    };
  }, [isMuzikOktav, k]);

  const oktavNotaSesiCal = useCallback((bilgi = oktavNotaBilgisi) => {
    if (!bilgi?.notaAd || !Number.isFinite(Number(bilgi.oktav))) return;

    muzikNotaSesiCal(
      bilgi.notaAd,
      Number(bilgi.oktav),
      bilgi.sureIndeksi ?? 1
    );
  }, [muzikNotaSesiCal, oktavNotaBilgisi]);

  const susBilgisi = useMemo(() => {
    if (!isMuzikSus || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const beatMs = 500; // 120 BPM: 1 vuruş = 500 ms

    let sureIndeksi = null;
    let beatCount = null;

    if (ad.includes('64')) {
      sureIndeksi = 6;
      beatCount = 0.0625;
    } else if (ad.includes('32')) {
      sureIndeksi = 5;
      beatCount = 0.125;
    } else if (ad.includes('16')) {
      sureIndeksi = 4;
      beatCount = 0.25;
    } else if (ad.includes('sekizlik')) {
      sureIndeksi = 0;
      beatCount = 0.5;
    } else if (ad.includes('dörtlük') || ad.includes('dortluk')) {
      sureIndeksi = 1;
      beatCount = 1;
    } else if (ad.includes('yarım') || ad.includes('yarim') || ad.includes('ikilik')) {
      sureIndeksi = 2;
      beatCount = 2;
    } else if (ad.includes('tam') || ad.includes('birlik')) {
      sureIndeksi = 3;
      beatCount = 4;
    }

    if (beatCount == null || sureIndeksi == null) return null;

    if (ad.includes('çift noktalı') || ad.includes('cift noktali')) {
      beatCount *= 1.75;
    } else if (ad.includes('noktalı') || ad.includes('noktali')) {
      beatCount *= 1.5;
    }

    return {
      notaAd: 'do',
      oktav: 4,
      sureIndeksi,
      beatCount,
      beatMs,
      beklemeMs: Math.round(beatCount * beatMs),
    };
  }, [isMuzikSus, k]);

  const artikulasyonBilgisi = useMemo(() => {
    if (!isMuzikArtikulasyon || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    if (metin.includes('staccatissimo')) {
      return { type: 'staccatissimo', etiket: 'çok kısa ve keskin çalınır' };
    }

    if (
      metin.includes('mezzo-staccato') ||
      metin.includes('mezzo staccato') ||
      metin.includes('yarı kısa') ||
      metin.includes('yari kisa')
    ) {
      return { type: 'mezzo-staccato', etiket: 'yarı kısa çalınır' };
    }

    if (metin.includes('staccato') || metin.includes('kesik')) {
      return { type: 'staccato', etiket: 'kısa ve kesik çalınır' };
    }

    if (metin.includes('tenuto') || metin.includes('tutulu') || metin.includes('uzatarak') || metin.includes('tam süre') || metin.includes('tam sure')) {
      return { type: 'tenuto', etiket: 'tam süreye yakın tutulur' };
    }

    if (metin.includes('martellato') || metin.includes('çekiç') || metin.includes('cekic') || metin.includes('sert vurgu')) {
      return { type: 'martellato', etiket: 'çekiç gibi sert vurgu' };
    }

    if (metin.includes('expressive accent') || metin.includes('ifadeli vurgu')) {
      return { type: 'expressive-accent', etiket: 'ifadeli vurgu' };
    }

    if (metin.includes('reversed accent') || metin.includes('ters vurgu')) {
      return { type: 'reversed-accent', etiket: 'ters vurgu' };
    }

    if (
      metin.includes('accent') ||
      metin.includes('aksan') ||
      metin.includes('vurgu') ||
      metin.includes('vurgulu')
    ) {
      return { type: 'accent', etiket: 'vurgulu çalınır' };
    }

    if (metin.includes('swell') || metin.includes('şişen') || metin.includes('sisen')) {
      return { type: 'swell', etiket: 'güçlenip hafifler' };
    }

    if (
      metin.includes('fermata') ||
      metin.includes('puandorg') ||
      metin.includes('durak') ||
      metin.includes('uzun tut') ||
      metin.includes('uzatma')
    ) {
      return { type: 'fermata', etiket: 'normalden uzun tutulur' };
    }

    if (
      metin.includes('nefes') ||
      metin.includes('breath')
    ) {
      return { type: 'breath', etiket: 'kısa nefes boşluğu' };
    }

    if (
      metin.includes('caesura') ||
      metin.includes('break') ||
      metin.includes('kesme') ||
      metin.includes('ara verme') ||
      metin.includes('duraksama') ||
      metin.includes('mola')
    ) {
      return { type: 'caesura', etiket: 'belirgin duraklama' };
    }

    return {
      type: 'generic',
      etiket: 'nüans örneği',
    };
  }, [isMuzikArtikulasyon, k]);

  const tekrarBilgisi = useMemo(() => {
    if (!isMuzikTekrar || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    let tekrarSayisi = 2;
    let type = 'repeat';
    let etiket = 'tekrar';

    if (
      metin.includes('×3') ||
      metin.includes('x3') ||
      metin.includes('3 kez') ||
      metin.includes('üç kez') ||
      metin.includes('uc kez')
    ) {
      tekrarSayisi = 3;
      type = 'repeat-x3';
      etiket = 'üç kez tekrar';
    } else if (
      metin.includes('geri sayım') ||
      metin.includes('geri sayim')
    ) {
      tekrarSayisi = 2;
      type = 'countback-repeat';
      etiket = 'geri sayım tekrarı';
    } else if (
      metin.includes('ölçü numarası') ||
      metin.includes('olcu numarasi') ||
      metin.includes('ölçü aralığı') ||
      metin.includes('olcu araligi')
    ) {
      tekrarSayisi = 2;
      type = 'measure-number-repeat';
      etiket = 'ölçü numarası tekrarı';
    }

    return {
      type,
      tekrarSayisi,
      etiket,
    };
  }, [isMuzikTekrar, k]);

  const metronomAudioRef = useRef(null);

  const metronomTikCal = useCallback((volume = 0.85) => {
    try {
      let audio = metronomAudioRef.current;

      if (!audio) {
        audio = new Audio(METRONOM_CLICK_URL);
        audio.preload = 'auto';
        metronomAudioRef.current = audio;

        try {
          audio.load();
        } catch {}
      }

      const tik = audio.cloneNode(true);
      tik.volume = Math.max(0, Math.min(1, Number(volume) || 0.85));
      tik.currentTime = 0;

      const result = tik.play();

      if (result && typeof result.catch === 'function') {
        result.catch((err) => {
          console.warn('Metronom sesi çalınamadı:', err);
        });
      }
    } catch (err) {
      console.warn('Metronom sesi başlatılamadı:', err);
    }
  }, []);

  const susSesiCal = useCallback((bilgi = susBilgisi) => {
    if (!bilgi) return;

    notaDizisiTimerlariniTemizle();

    const beatMs = Number(bilgi.beatMs) || 500;
    const beatCount = Number(bilgi.beatCount) || 1;
    const toplamSusMs = Math.round(beatCount * beatMs);

    // Başta do: sus öncesi ses
    playNote({
      tip: 'nota',
      notaAd: 'do',
      oktav: 4,
      sureIndeksi: 1,
    });

    const baslangicGecikmesi = 650;

    // Sadece susun içindeki ara vuruşları metronomla duyur.
    // 1 vuruş sus: ara vuruş yok.
    // 1.5 vuruş sus: 1. vuruşta metronom.
    // 2 vuruş sus: 1. vuruşta metronom.
    // 4 vuruş sus: 1, 2, 3. vuruşlarda metronom.
    const araVurusSayisi = Math.floor(beatCount);

    for (let i = 1; i <= araVurusSayisi; i += 1) {
      if (i >= beatCount) break;

      const timerId = window.setTimeout(() => {
        metronomTikCal();
      }, baslangicGecikmesi + (i * beatMs));

      notaDizisiTimerlariRef.current.push(timerId);
    }

    // Sonda do: sus bitti, ses geri geldi
    const bitisNotaTimer = window.setTimeout(() => {
      playNote({
        tip: 'nota',
        notaAd: 'do',
        oktav: 4,
        sureIndeksi: 1,
      });
    }, baslangicGecikmesi + toplamSusMs);

    notaDizisiTimerlariRef.current.push(bitisNotaTimer);
  }, [
    susBilgisi,
    playNote,
    metronomTikCal,
    notaDizisiTimerlariniTemizle,
  ]);

  const artikulasyonSesiCal = useCallback((bilgi = artikulasyonBilgisi) => {
    if (!bilgi) return;

    notaDizisiTimerlariniTemizle();

    const notaCal = (delayMs, notaAd, durationMs = null, volume = 0.75) => {
      const timerId = window.setTimeout(() => {
        const context = { volume };

        if (durationMs != null) {
          context.cutOff = true;
          context.durationMs = durationMs;
        }

        playNote({
          tip: 'nota',
          notaAd,
          oktav: 4,
          sureIndeksi: 1,
        }, context);
      }, delayMs);

      notaDizisiTimerlariRef.current.push(timerId);
    };

    if (bilgi.type === 'staccatissimo') {
      notaCal(0, 'do', 70, 0.8);
      notaCal(260, 're', 70, 0.8);
      notaCal(520, 'mi', 70, 0.8);
      return;
    }

    if (bilgi.type === 'mezzo-staccato') {
      notaCal(0, 'do', 230, 0.72);
      notaCal(360, 're', 230, 0.72);
      notaCal(720, 'mi', 230, 0.72);
      return;
    }

    if (bilgi.type === 'staccato') {
      notaCal(0, 'do', 130, 0.75);
      notaCal(320, 're', 130, 0.75);
      notaCal(640, 'mi', 130, 0.75);
      return;
    }

    if (bilgi.type === 'tenuto') {
      notaCal(0, 'do', 950, 0.75);
      return;
    }

    if (bilgi.type === 'accent') {
      notaCal(0, 'do', 260, 0.45);
      notaCal(500, 'do', 360, 1);
      return;
    }

    if (bilgi.type === 'expressive-accent') {
      notaCal(0, 'do', 520, 0.9);
      notaCal(600, 're', 520, 0.72);
      return;
    }

    if (bilgi.type === 'reversed-accent') {
      notaCal(0, 'do', 420, 0.85);
      notaCal(540, 're', 240, 0.55);
      return;
    }

    if (bilgi.type === 'martellato') {
      notaCal(0, 'do', 160, 1);
      notaCal(360, 're', 160, 1);
      return;
    }

    if (bilgi.type === 'swell') {
      notaCal(0, 'do', 260, 0.35);
      notaCal(300, 'do', 260, 0.65);
      notaCal(600, 'do', 260, 0.95);
      notaCal(900, 'do', 260, 0.55);
      return;
    }

    if (bilgi.type === 'fermata') {
      notaCal(0, 'do', 1800, 0.78);
      return;
    }

    if (bilgi.type === 'breath') {
      notaCal(0, 'do', 350, 0.72);
      notaCal(850, 'do', 350, 0.72);
      return;
    }

    if (bilgi.type === 'caesura') {
      notaCal(0, 'do', 350, 0.72);
      notaCal(1300, 'do', 350, 0.72);
      return;
    }

    notaCal(0, 'do', 300, 0.75);
    notaCal(420, 're', 300, 0.75);
  }, [
    artikulasyonBilgisi,
    playNote,
    notaDizisiTimerlariniTemizle,
  ]);

  const tekrarSesiCal = useCallback((bilgi = tekrarBilgisi) => {
    if (!bilgi) return;

    notaDizisiTimerlariniTemizle();

    const motif = ['do', 're', 'mi'];
    const notaAraligiMs = 280;
    const motifArasiMs = 520;
    const notaSuresiMs = 180;

    const motifSuresi = motif.length * notaAraligiMs;
    const tekrarSayisi = Math.max(2, Math.min(4, Number(bilgi.tekrarSayisi) || 2));

    for (let tekrarIndex = 0; tekrarIndex < tekrarSayisi; tekrarIndex += 1) {
      const motifBaslangic = tekrarIndex * (motifSuresi + motifArasiMs);

      motif.forEach((notaAd, notaIndex) => {
        const timerId = window.setTimeout(() => {
          playNote({
            tip: 'nota',
            notaAd,
            oktav: 4,
            sureIndeksi: 1,
          }, {
            volume: tekrarIndex === 0 ? 0.65 : 0.85,
            cutOff: true,
            durationMs: notaSuresiMs,
          });
        }, motifBaslangic + (notaIndex * notaAraligiMs));

        notaDizisiTimerlariRef.current.push(timerId);
      });
    }
  }, [
    tekrarBilgisi,
    playNote,
    notaDizisiTimerlariniTemizle,
  ]);

  const dinamikBilgisi = useMemo(() => {
    if (!isMuzikDinamik || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    let volume = null;
    let etiket = '';
    let accent = false;
    let effectType = null;

    if (
      bolumAnahtari === 'muzik-hairpin' &&
      (
        metin.includes('bitir') ||
        metin.includes('sonlandır') ||
        metin.includes('sonlandir') ||
        metin.includes('terminator')
      )
    ) {
      volume = 0.65;
      etiket = 'hairpin bitişi';
      effectType = 'hairpin-end';
    } else if (
      metin.includes('decrescendo') ||
      metin.includes('decresc') ||
      metin.includes('diminuendo') ||
      metin.includes('dim')
    ) {
      volume = 0.85;
      etiket = 'gittikçe hafifler';
      effectType = 'decrescendo';
    } else if (
      metin.includes('crescendo') ||
      metin.includes('cresc')
    ) {
      volume = 0.45;
      etiket = 'gittikçe güçlenir';
      effectType = 'crescendo';
    } else if (
      metin.includes('ritardando') ||
      metin.includes('rit.') ||
      /\brit\b/.test(metin)
    ) {
      volume = 0.7;
      etiket = 'gittikçe yavaşlar';
      effectType = 'ritardando';
    } else if (
      metin.includes('sforzando') ||
      metin.includes('sforzato') ||
      metin.includes('sfz') ||
      /\bsf\b/.test(metin)
    ) {
      volume = 1;
      etiket = 'ani güçlü vurgu';
      accent = true;
    } else if (metin.includes('pianissimo') || metin.includes('pp')) {
      volume = 0.25;
      etiket = 'çok hafif';
    } else if (metin.includes('mezzo piano') || metin.includes('mp')) {
      volume = 0.5;
      etiket = 'orta hafif';
    } else if (metin.includes('mezzo forte') || metin.includes('mf')) {
      volume = 0.65;
      etiket = 'orta güçlü';
    } else if (metin.includes('fortissimo') || metin.includes('ff')) {
      volume = 1;
      etiket = 'çok güçlü';
    } else if (metin.includes('piano') || /\bp\b/.test(metin)) {
      volume = 0.38;
      etiket = 'hafif';
    } else if (metin.includes('forte') || /\bf\b/.test(metin)) {
      volume = 0.85;
      etiket = 'güçlü';
    }

    if (volume == null) return null;

    return {
      notaAd: 'do',
      oktav: 4,
      sureIndeksi: 1,
      volume,
      etiket,
      accent,
      effectType,
    };
  }, [isMuzikDinamik, k]);

  const dinamikSesiCal = useCallback((bilgi = dinamikBilgisi) => {
    if (!bilgi?.notaAd) return;

    notaDizisiTimerlariniTemizle();

    const notaCal = (delayMs, notaAd, volume, durationMs = 380) => {
      const timerId = window.setTimeout(() => {
        playNote({
          tip: 'nota',
          notaAd,
          oktav: bilgi.oktav ?? 4,
          sureIndeksi: bilgi.sureIndeksi ?? 1,
        }, {
          volume,
          cutOff: true,
          durationMs,
        });
      }, delayMs);

      notaDizisiTimerlariRef.current.push(timerId);
    };

    if (bilgi.effectType === 'hairpin-end') {
      notaCal(0, 'do', 0.65, 320);
      notaCal(420, 'do', 0.65, 320);
      return;
    }

    if (bilgi.effectType === 'crescendo') {
      // do-re-mi-fa: gittikçe güçlenir
      notaCal(0, 'do', 0.3);
      notaCal(450, 're', 0.45);
      notaCal(900, 'mi', 0.65);
      notaCal(1350, 'fa', 0.9);
      return;
    }

    if (bilgi.effectType === 'decrescendo') {
      // fa-mi-re-do: gittikçe hafifler
      notaCal(0, 'fa', 0.9);
      notaCal(450, 'mi', 0.65);
      notaCal(900, 're', 0.45);
      notaCal(1350, 'do', 0.3);
      return;
    }

    if (bilgi.effectType === 'ritardando') {
      // aynı sesler arası süre artar: yavaşlama
      notaCal(0, 'do', 0.75, 260);
      notaCal(330, 'do', 0.75, 260);
      notaCal(760, 'do', 0.75, 260);
      notaCal(1320, 'do', 0.75, 260);
      return;
    }

    if (bilgi.accent) {
      playNote({
        tip: 'nota',
        notaAd: bilgi.notaAd,
        oktav: bilgi.oktav ?? 4,
        sureIndeksi: bilgi.sureIndeksi ?? 1,
      }, {
        volume: 0.45,
        cutOff: true,
        durationMs: 220,
      });

      const timerId = window.setTimeout(() => {
        playNote({
          tip: 'nota',
          notaAd: bilgi.notaAd,
          oktav: bilgi.oktav ?? 4,
          sureIndeksi: bilgi.sureIndeksi ?? 1,
        }, {
          volume: 1,
          cutOff: true,
          durationMs: 380,
        });
      }, 500);

      notaDizisiTimerlariRef.current.push(timerId);
      return;
    }

    playNote({
      tip: 'nota',
      notaAd: bilgi.notaAd,
      oktav: bilgi.oktav ?? 4,
      sureIndeksi: bilgi.sureIndeksi ?? 1,
    }, {
      volume: bilgi.volume,
    });
  }, [dinamikBilgisi, playNote, notaDizisiTimerlariniTemizle]);

  const bagBilgisi = useMemo(() => {
    if (!isMuzikBag || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    if (
      metin.includes('tie') ||
      metin.includes('uzatma') ||
      metin.includes('değer bağı') ||
      metin.includes('deger bagi') ||
      metin.includes('aynı nota') ||
      metin.includes('ayni nota')
    ) {
      return {
        type: 'tie',
        etiket: 'aynı ses uzar',
      };
    }

    if (
      metin.includes('staccato') ||
      metin.includes('kesik')
    ) {
      return {
        type: 'staccato',
        etiket: 'kesik çalınır',
      };
    }

    if (
      metin.includes('slur') ||
      metin.includes('legato') ||
      metin.includes('ifade bağı') ||
      metin.includes('ifade bagi') ||
      metin.includes('bağlı') ||
      metin.includes('bagli')
    ) {
      return {
        type: 'slur',
        etiket: 'bağlı çalınır',
      };
    }

    return {
      type: 'slur',
      etiket: 'bağlı çalınır',
    };
  }, [isMuzikBag, k]);

  const bagSesiCal = useCallback((bilgi = bagBilgisi) => {
    if (!bilgi) return;

    notaDizisiTimerlariniTemizle();

    const notaCal = (delayMs, notaAd, volume = 0.75, durationMs = null) => {
      const timerId = window.setTimeout(() => {
        const context = { volume };
        if (durationMs != null) {
          context.cutOff = true;
          context.durationMs = durationMs;
        }

        playNote({
          tip: 'nota',
          notaAd,
          oktav: 4,
          sureIndeksi: 1,
        }, context);
      }, delayMs);

      notaDizisiTimerlariRef.current.push(timerId);
    };

    if (bilgi.type === 'tie') {
      notaCal(0, 'do', 0.75, 1400);
      return;
    }

    if (bilgi.type === 'staccato') {
      notaCal(0, 'do', 0.75, 140);
      notaCal(360, 're', 0.75, 140);
      notaCal(720, 'mi', 0.75, 140);
      return;
    }

    notaCal(0, 'do', 0.72, 520);
    notaCal(420, 're', 0.72, 520);
    notaCal(840, 'mi', 0.72, 620);
  }, [bagBilgisi, playNote, notaDizisiTimerlariniTemizle]);

  const suslemeBilgisi = useMemo(() => {
    if (!isMuzikSusleme || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    if (
      metin.includes('trill') ||
      metin.includes('tril') ||
      metin.includes('titreşim') ||
      metin.includes('titresim')
    ) {
      return {
        type: 'trill',
        etiket: 'tril',
      };
    }

    if (
      metin.includes('alt mordent') ||
      metin.includes('lower mordent') ||
      metin.includes('ters mordent')
    ) {
      return {
        type: 'lower-mordent',
        etiket: 'alt mordent',
      };
    }

    if (
      metin.includes('mordent') ||
      metin.includes('mordan')
    ) {
      return {
        type: 'mordent',
        etiket: 'mordent',
      };
    }

    if (
      metin.includes('turn') ||
      metin.includes('grupetto') ||
      metin.includes('grup') ||
      metin.includes('dönüş') ||
      metin.includes('donus')
    ) {
      return {
        type: 'turn',
        etiket: 'grupetto',
      };
    }

    if (
      metin.includes('appoggiatura') ||
      metin.includes('acciaccatura') ||
      metin.includes('çarpma') ||
      metin.includes('carpma') ||
      metin.includes('grace')
    ) {
      return {
        type: 'grace',
        etiket: 'çarpma nota',
      };
    }

    return {
      type: 'generic',
      etiket: 'süsleme',
    };
  }, [isMuzikSusleme, k]);

  const suslemeSesiCal = useCallback((bilgi = suslemeBilgisi) => {
    if (!bilgi) return;

    notaDizisiTimerlariniTemizle();

    const notaCal = (delayMs, notaAd, durationMs = 170, volume = 0.75) => {
      const timerId = window.setTimeout(() => {
        playNote({
          tip: 'nota',
          notaAd,
          oktav: 4,
          sureIndeksi: 1,
        }, {
          volume,
          cutOff: true,
          durationMs,
        });
      }, delayMs);

      notaDizisiTimerlariRef.current.push(timerId);
    };

    if (bilgi.type === 'trill') {
      notaCal(0, 'do', 130);
      notaCal(150, 're', 130);
      notaCal(300, 'do', 130);
      notaCal(450, 're', 130);
      notaCal(600, 'do', 180);
      return;
    }

    if (bilgi.type === 'mordent') {
      notaCal(0, 'do', 150);
      notaCal(170, 're', 130);
      notaCal(320, 'do', 220);
      return;
    }

    if (bilgi.type === 'lower-mordent') {
      notaCal(0, 'do', 150);
      notaCal(170, 'si', 130);
      notaCal(320, 'do', 220);
      return;
    }

    if (bilgi.type === 'turn') {
      notaCal(0, 're', 140);
      notaCal(160, 'do', 140);
      notaCal(320, 'si', 140);
      notaCal(480, 'do', 220);
      return;
    }

    if (bilgi.type === 'grace') {
      notaCal(0, 're', 90, 0.65);
      notaCal(120, 'do', 320, 0.78);
      return;
    }

    notaCal(0, 'do', 150);
    notaCal(170, 're', 130);
    notaCal(320, 'do', 220);
  }, [suslemeBilgisi, playNote, notaDizisiTimerlariniTemizle]);

  const tupletBilgisi = useMemo(() => {
    if (!isMuzikTuplet || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    let count = null;
    let etiket = '';

    if (
      metin.includes('duplet') ||
      metin.includes('ikileme') ||
      metin.includes('2’li') ||
      metin.includes('2li') ||
      metin.includes('iki eşit') ||
      metin.includes('iki esit')
    ) {
      count = 2;
      etiket = 'ikileme';
    } else if (
      metin.includes('triplet') ||
      metin.includes('üçleme') ||
      metin.includes('ucleme') ||
      metin.includes('3’lü') ||
      metin.includes('3lü') ||
      metin.includes('üç eşit') ||
      metin.includes('uc esit')
    ) {
      count = 3;
      etiket = 'üçleme';
    } else if (
      metin.includes('quadruplet') ||
      metin.includes('dörtleme') ||
      metin.includes('dortleme') ||
      metin.includes('4’lü') ||
      metin.includes('4lü')
    ) {
      count = 4;
      etiket = 'dörtleme';
    } else if (
      metin.includes('quintuplet') ||
      metin.includes('beşleme') ||
      metin.includes('besleme') ||
      metin.includes('5’li') ||
      metin.includes('5li')
    ) {
      count = 5;
      etiket = 'beşleme';
    } else if (
      metin.includes('sextuplet') ||
      metin.includes('altılama') ||
      metin.includes('altilama') ||
      metin.includes('6’lı') ||
      metin.includes('6li')
    ) {
      count = 6;
      etiket = 'altılama';
    }

    if (count == null) {
      const sayiMatch = metin.match(/\b([2-6])\b/);
      if (sayiMatch) {
        count = Number(sayiMatch[1]);
        etiket = `${count}li düzensiz grup`;
      }
    }

    if (count == null) {
      count = 3;
      etiket = 'üçleme';
    }

    return {
      count,
      etiket,
      beatMs: 500,
      totalBeats: 2,
    };
  }, [isMuzikTuplet, k]);

  const tupletSesiCal = useCallback((bilgi = tupletBilgisi) => {
    if (!bilgi?.count) return;

    notaDizisiTimerlariniTemizle();

    const count = Math.max(2, Math.min(6, Number(bilgi.count) || 3));
    const beatMs = Number(bilgi.beatMs) || 500;
    const totalBeats = Number(bilgi.totalBeats) || 2;
    const totalMs = beatMs * totalBeats;
    const noteGapMs = totalMs / count;

    [0, beatMs, totalMs].forEach((delayMs, index) => {
      const timerId = window.setTimeout(() => {
        metronomTikCal(index === 0 ? 1 : 0.72);
      }, delayMs);

      notaDizisiTimerlariRef.current.push(timerId);
    });

    const baslangic = totalMs + 650;
    const notaDizisi = ['do', 're', 'mi', 'fa', 'sol', 'la'];

    for (let i = 0; i < count; i += 1) {
      const timerId = window.setTimeout(() => {
        playNote({
          tip: 'nota',
          notaAd: notaDizisi[i] || 'do',
          oktav: 4,
          sureIndeksi: 1,
        }, {
          volume: 0.75,
          cutOff: true,
          durationMs: Math.max(90, Math.min(220, noteGapMs * 0.75)),
        });
      }, baslangic + Math.round(i * noteGapMs));

      notaDizisiTimerlariRef.current.push(timerId);
    }
  }, [tupletBilgisi, playNote, metronomTikCal, notaDizisiTimerlariniTemizle]);

  const tempoBilgisi = useMemo(() => {
    if (!isMuzikTempo || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    let bpm = null;
    let etiket = '';
    let effectType = null;

    const bpmMatch = metin.match(/(\d{2,3})\s*(bpm|vuruş|vurus)?/);
    if (bpmMatch) {
      bpm = Number(bpmMatch[1]);
      etiket = `${bpm} BPM`;
    }

    if (
      metin.includes('ritardando') ||
      metin.includes('rit.') ||
      /\brit\b/.test(metin)
    ) {
      bpm = 110;
      etiket = 'gittikçe yavaşlar';
      effectType = 'ritardando';
    } else if (
      metin.includes('accelerando') ||
      metin.includes('accel') ||
      metin.includes('hızlan') ||
      metin.includes('hizlan')
    ) {
      bpm = 70;
      etiket = 'gittikçe hızlanır';
      effectType = 'accelerando';
    } else if (bpm == null) {
      if (metin.includes('largo')) {
        bpm = 50;
        etiket = 'çok yavaş';
      } else if (metin.includes('adagio')) {
        bpm = 60;
        etiket = 'yavaş';
      } else if (metin.includes('andante')) {
        bpm = 80;
        etiket = 'yürür gibi';
      } else if (metin.includes('moderato')) {
        bpm = 100;
        etiket = 'orta hız';
      } else if (metin.includes('allegro')) {
        bpm = 130;
        etiket = 'hızlı';
      } else if (metin.includes('vivace')) {
        bpm = 150;
        etiket = 'canlı hızlı';
      } else if (metin.includes('presto')) {
        bpm = 180;
        etiket = 'çok hızlı';
      }
    }

    if (!Number.isFinite(bpm) || bpm <= 0) return null;

    return {
      bpm,
      beatMs: Math.round(60000 / bpm),
      etiket,
      effectType,
    };
  }, [isMuzikTempo, k]);

  const tempoSesiCal = useCallback((bilgi = tempoBilgisi) => {
    if (!bilgi?.beatMs) return;

    notaDizisiTimerlariniTemizle();

    if (bilgi.effectType === 'ritardando') {
      const araliklar = [360, 460, 580, 740, 940, 1180];
      let zaman = 0;

      araliklar.forEach((aralik, index) => {
        const timerId = window.setTimeout(() => {
          metronomTikCal(index === 0 ? 1 : 0.72);
        }, zaman);

        notaDizisiTimerlariRef.current.push(timerId);
        zaman += aralik;
      });

      return;
    }

    if (bilgi.effectType === 'accelerando') {
      const araliklar = [950, 760, 610, 490, 390, 310];
      let zaman = 0;

      araliklar.forEach((aralik, index) => {
        const timerId = window.setTimeout(() => {
          metronomTikCal(index === 0 ? 1 : 0.72);
        }, zaman);

        notaDizisiTimerlariRef.current.push(timerId);
        zaman += aralik;
      });

      return;
    }

    for (let i = 0; i < 6; i += 1) {
      const timerId = window.setTimeout(() => {
        metronomTikCal(i === 0 ? 1 : 0.72);
      }, i * bilgi.beatMs);

      notaDizisiTimerlariRef.current.push(timerId);
    }
  }, [tempoBilgisi, metronomTikCal, notaDizisiTimerlariniTemizle]);

  const zamanBilgisi = useMemo(() => {
    if (!isMuzikZaman || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(k.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(k.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`;

    let ust = null;
    let alt = null;

    const kesirMatch = metin.match(/(\d+)\s*\/\s*(\d+)/);
    if (kesirMatch) {
      ust = Number(kesirMatch[1]);
      alt = Number(kesirMatch[2]);
    }

    if (!ust || !alt) {
      if (metin.includes('2/4') || metin.includes('iki dörtlük') || metin.includes('iki dortluk')) {
        ust = 2;
        alt = 4;
      } else if (metin.includes('3/4') || metin.includes('üç dörtlük') || metin.includes('uc dortluk')) {
        ust = 3;
        alt = 4;
      } else if (metin.includes('4/4') || metin.includes('dört dörtlük') || metin.includes('dort dortluk')) {
        ust = 4;
        alt = 4;
      } else if (metin.includes('6/8') || metin.includes('altı sekizlik') || metin.includes('alti sekizlik')) {
        ust = 6;
        alt = 8;
      } else if (metin.includes('9/8') || metin.includes('dokuz sekizlik')) {
        ust = 9;
        alt = 8;
      } else if (metin.includes('12/8') || metin.includes('on iki sekizlik') || metin.includes('oniki sekizlik')) {
        ust = 12;
        alt = 8;
      }
    }

    if (!ust || !alt) {
      if (
        metin.includes('common time') ||
        metin.includes('ortak zaman') ||
        metin.includes('c ')
      ) {
        ust = 4;
        alt = 4;
      } else if (
        metin.includes('alla breve') ||
        metin.includes('cut time') ||
        metin.includes('kesik zaman')
      ) {
        ust = 2;
        alt = 2;
      }
    }

    if (!Number.isFinite(ust) || !Number.isFinite(alt) || ust <= 0 || alt <= 0) {
      return null;
    }

    const beatMs = 500;

    return {
      ust,
      alt,
      beatMs,
    };
  }, [isMuzikZaman, k]);

  const zamanVuruslari = useMemo(() => {
    if (!zamanBilgisi) return null;

    const { ust, alt, beatMs } = zamanBilgisi;
    let ticks = [];

    if (alt === 8 && ust % 3 === 0 && ust >= 6) {
      ticks = Array.from({ length: ust }, (_, i) => {
        const pos = i + 1;
        let volume = 0.72;

        if (pos === 1) volume = 1;
        else if ((pos - 1) % 3 === 0) volume = 0.88;

        return {
          delayMs: i * Math.round(beatMs / 2),
          volume,
        };
      });

      return {
        ticks,
        toplamMs: (ust - 1) * Math.round(beatMs / 2),
      };
    }

    ticks = Array.from({ length: ust }, (_, i) => ({
      delayMs: i * beatMs,
      volume: i === 0 ? 1 : 0.72,
    }));

    return {
      ticks,
      toplamMs: (ust - 1) * beatMs,
    };
  }, [zamanBilgisi]);

  const zamanSesiCal = useCallback((vuruslar = zamanVuruslari) => {
    if (!vuruslar?.ticks?.length) return;

    notaDizisiTimerlariniTemizle();

    vuruslar.ticks.forEach((tick) => {
      const timerId = window.setTimeout(() => {
        metronomTikCal(tick.volume);
      }, tick.delayMs);

      notaDizisiTimerlariRef.current.push(timerId);
    });
  }, [zamanVuruslari, metronomTikCal, notaDizisiTimerlariniTemizle]);

  const aksidentalSesDizisi = useMemo(() => {
    if (!isMuzikAksidental || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');

    if (ad.includes('çift diyez') || ad.includes('cift diyez')) {
      return [
        { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
        { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
      ];
    }

    if (ad.includes('çift bemol') || ad.includes('cift bemol')) {
      return [
        { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
        { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
      ];
    }

    if (ad.includes('diyez')) {
      return [
        { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
        { notaAd: 'do', oktav: 4, accidental: 'sharp', sureIndeksi: 1 },
      ];
    }

    if (ad.includes('bemol')) {
      return [
        { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
        { notaAd: 're', oktav: 4, accidental: 'flat', sureIndeksi: 1 },
      ];
    }

    if (ad.includes('naturel') || ad.includes('bekar')) {
      return [
        { notaAd: 'do', oktav: 4, accidental: 'sharp', sureIndeksi: 1 },
        { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
      ];
    }

    return null;
  }, [isMuzikAksidental, k]);

  const donanimSesDizisi = useMemo(() => {
    if (!isMuzikDonanim || !k) return null;

    const ad = String(k.ad || '').toLocaleLowerCase('tr');
    const sayiMatch = ad.match(/([1-7])/);
    const sayi = sayiMatch ? Number(sayiMatch[1]) : 0;

    if (!Number.isFinite(sayi) || sayi < 1 || sayi > 7) return null;

    const diyezMi = ad.includes('diyez');
    const bemolMu = ad.includes('bemol');
    if (!diyezMi && !bemolMu) return null;

    const siralama = diyezMi ? DIYEZ_SIRASI : BEMOL_SIRASI;
    const accidental = diyezMi ? 'sharp' : 'flat';

    return siralama.slice(0, sayi).flatMap((notaAd) => ([
      {
        notaAd,
        oktav: 4,
        accidental: null,
        sureIndeksi: 1,
      },
      {
        notaAd,
        oktav: 4,
        accidental,
        sureIndeksi: 1,
      },
    ]));
  }, [isMuzikDonanim, k]);

  const notaDizisiCal = useCallback((dizi = [], aralikMs = 700) => {
    notaDizisiTimerlariniTemizle();

    if (!Array.isArray(dizi) || dizi.length === 0) return;

    dizi.forEach((nota, index) => {
      const timerId = window.setTimeout(() => {
        playNote({
          tip: 'nota',
          notaAd: nota.notaAd,
          oktav: nota.oktav ?? 4,
          accidental: nota.accidental ?? null,
          sureIndeksi: nota.sureIndeksi ?? 1,
        });
      }, index * aralikMs);

      notaDizisiTimerlariRef.current.push(timerId);
    });
  }, [playNote, notaDizisiTimerlariniTemizle]);

  const konusVeNotaCal = useCallback((metin, notaAd, sureIndeksi, gecikmeMs = 1200) => {
    tumSesleriDurdur();

    konus(metin, { kesintiyle: true });

    if (!notaSesiAktif || !notaAd || sureIndeksi == null) return;

    notaSesiTimerRef.current = window.setTimeout(() => {
      sureliNotaSesiCal(notaAd, sureIndeksi);
      notaSesiTimerRef.current = null;
    }, gecikmeMs);
  }, [notaSesiAktif, sureliNotaSesiCal, tumSesleriDurdur]);

  const okumaModuMuzikOgeSesiCal = useCallback((oge) => {
    if (!isHerhangiBirMuzikSesliBolum || !oge) return;

    const ad = String(oge.ad || '').toLocaleLowerCase('tr');
    const aciklama = String(oge.aciklama || '').toLocaleLowerCase('tr');
    const sembol = String(oge.sembol || '').toLocaleLowerCase('tr');
    const metin = `${ad} ${aciklama} ${sembol}`.trim();

    if (isMuzikSureleri) {
      const noteMatch = ad.match(/\b(do|re|mi|fa|sol|la|si)\b/i);
      if (!noteMatch) return;

      let sureIndeksi = null;
      if (ad.includes('sekizlik')) sureIndeksi = 0;
      else if (ad.includes('dörtlük') || ad.includes('dortluk')) sureIndeksi = 1;
      else if (ad.includes('yarım') || ad.includes('yarim')) sureIndeksi = 2;
      else if (ad.includes('tam')) sureIndeksi = 3;
      else if (ad.includes('16')) sureIndeksi = 4;
      else if (ad.includes('32')) sureIndeksi = 5;
      else if (ad.includes('64')) sureIndeksi = 6;

      if (sureIndeksi != null) {
        sureliNotaSesiCal(noteMatch[1].toLocaleLowerCase('tr'), sureIndeksi);
      }
      return;
    }

    if (isMuzikOktav) {
      const match = ad.match(/([1-7])\.\s*oktav/);
      if (!match) return;
      oktavNotaSesiCal({ notaAd: 'do', oktav: Number(match[1]), sureIndeksi: 1 });
      return;
    }

    if (isMuzikAksidental) {
      let dizi = null;
      if (ad.includes('çift diyez') || ad.includes('cift diyez')) {
        dizi = [
          { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
          { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
        ];
      } else if (ad.includes('çift bemol') || ad.includes('cift bemol')) {
        dizi = [
          { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
          { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
        ];
      } else if (ad.includes('diyez')) {
        dizi = [
          { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
          { notaAd: 'do', oktav: 4, accidental: 'sharp', sureIndeksi: 1 },
        ];
      } else if (ad.includes('bemol')) {
        dizi = [
          { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
          { notaAd: 're', oktav: 4, accidental: 'flat', sureIndeksi: 1 },
        ];
      } else if (ad.includes('naturel') || ad.includes('bekar')) {
        dizi = [
          { notaAd: 'do', oktav: 4, accidental: 'sharp', sureIndeksi: 1 },
          { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
        ];
      }

      if (dizi) notaDizisiCal(dizi, 700);
      return;
    }

    if (isMuzikDonanim) {
      const sayiMatch = ad.match(/([1-7])/);
      const sayi = sayiMatch ? Number(sayiMatch[1]) : 0;
      if (!Number.isFinite(sayi) || sayi < 1 || sayi > 7) return;

      const diyezMi = ad.includes('diyez');
      const bemolMu = ad.includes('bemol');
      if (!diyezMi && !bemolMu) return;

      const siralama = diyezMi ? DIYEZ_SIRASI : BEMOL_SIRASI;
      const accidental = diyezMi ? 'sharp' : 'flat';

      const dizi = siralama.slice(0, sayi).flatMap((notaAd) => ([
        { notaAd, oktav: 4, accidental: null, sureIndeksi: 1 },
        { notaAd, oktav: 4, accidental, sureIndeksi: 1 },
      ]));

      notaDizisiCal(dizi, 650);
      return;
    }

    if (isMuzikSus) {
      let sureIndeksi = null;
      let beatCount = null;
      const beatMs = 500;

      if (ad.includes('64')) {
        sureIndeksi = 6;
        beatCount = 0.0625;
      } else if (ad.includes('32')) {
        sureIndeksi = 5;
        beatCount = 0.125;
      } else if (ad.includes('16')) {
        sureIndeksi = 4;
        beatCount = 0.25;
      } else if (ad.includes('sekizlik')) {
        sureIndeksi = 0;
        beatCount = 0.5;
      } else if (ad.includes('dörtlük') || ad.includes('dortluk')) {
        sureIndeksi = 1;
        beatCount = 1;
      } else if (ad.includes('yarım') || ad.includes('yarim') || ad.includes('ikilik')) {
        sureIndeksi = 2;
        beatCount = 2;
      } else if (ad.includes('tam') || ad.includes('birlik')) {
        sureIndeksi = 3;
        beatCount = 4;
      }

      if (beatCount == null || sureIndeksi == null) return;
      if (ad.includes('çift noktalı') || ad.includes('cift noktali')) {
        beatCount *= 1.75;
      } else if (ad.includes('noktalı') || ad.includes('noktali')) {
        beatCount *= 1.5;
      }

      susSesiCal({
        notaAd: 'do',
        oktav: 4,
        sureIndeksi,
        beatCount,
        beatMs,
        beklemeMs: Math.round(beatCount * beatMs),
      });
      return;
    }

    if (isMuzikDinamik) {
      let volume = null;
      let etiket = '';
      let accent = false;
      let effectType = null;

      if (
        bolumAnahtari === 'muzik-hairpin' &&
        (
          metin.includes('bitir') ||
          metin.includes('bitiş') ||
          metin.includes('biter') ||
          metin.includes('bitecek')
        )
      ) {
        volume = 0.55;
        etiket = 'cresc. kapanış';
      } else if (
        bolumAnahtari === 'muzik-hairpin' &&
        (
          metin.includes('başla') ||
          metin.includes('başlat') ||
          metin.includes('başlangıç') ||
          metin.includes('basla')
        )
      ) {
        volume = 0.8;
        etiket = 'dim. başlangıç';
      } else if (
        metin.includes('mezzo') || metin.includes('mf')
      ) {
        volume = 0.65;
        etiket = 'mezzo';
      } else if (
        metin.includes('forte') || metin.includes('f')
      ) {
        volume = 0.9;
        etiket = 'forte';
      } else if (
        metin.includes('piano') || metin.includes('p')
      ) {
        volume = 0.45;
        etiket = 'piano';
      }

      if (volume != null) {
        dinamikSesiCal({
          volume,
          accent,
          effectType,
          etiket,
        });
      }
      return;
    }

    if (isMuzikArtikulasyon) {
      let type = 'normal';

      if (
        metin.includes('staccatissimo') ||
        metin.includes('staccatissimo')
      ) {
        type = 'staccatissimo';
      } else if (
        metin.includes('mezzo-staccato') ||
        metin.includes('mezzo staccato')
      ) {
        type = 'mezzo-staccato';
      } else if (
        metin.includes('staccato') && !metin.includes('staccatissimo')
      ) {
        type = 'staccato';
      } else if (metin.includes('tenuto')) {
        type = 'tenuto';
      } else if (metin.includes('accent')) {
        type = 'accent';
      } else if (metin.includes('expressive-accent')) {
        type = 'expressive-accent';
      } else if (metin.includes('reversed-accent')) {
        type = 'reversed-accent';
      } else if (metin.includes('martellato')) {
        type = 'martellato';
      } else if (metin.includes('swell')) {
        type = 'swell';
      } else if (metin.includes('fermata')) {
        type = 'fermata';
      } else if (metin.includes('breath')) {
        type = 'breath';
      } else if (metin.includes('caesura')) {
        type = 'caesura';
      }

      artikulasyonSesiCal({ type, metin, etiket: type });
      return;
    }

    if (isMuzikSusleme) {
      let type = null;
      if (metin.includes('mordent') && !metin.includes('lower')) type = 'mordent';
      else if (metin.includes('lower-mordent')) type = 'lower-mordent';
      else if (metin.includes('turn')) type = 'turn';
      else if (metin.includes('grace')) type = 'grace';
      
      if (type) {
        suslemeSesiCal({ type, metin });
      } else {
        suslemeSesiCal({ type: 'normal', metin });
      }
      return;
    }

    if (isMuzikTuplet) {
      let count = null;
      let etiket = '';
      if (
        metin.includes('duplet') ||
        metin.includes('ikileme') ||
        metin.includes("2’li") ||
        metin.includes('2li') ||
        metin.includes('iki eşit') ||
        metin.includes('iki esit')
      ) {
        count = 2;
        etiket = 'ikileme';
      } else if (
        metin.includes('triplet') ||
        metin.includes('üçleme') ||
        metin.includes('ucleme') ||
        metin.includes("3’lü") ||
        metin.includes('3lü') ||
        metin.includes('üç eşit') ||
        metin.includes('uc esit')
      ) {
        count = 3;
        etiket = 'üçleme';
      } else if (
        metin.includes('quadruplet') ||
        metin.includes('dörtleme') ||
        metin.includes('dortleme') ||
        metin.includes("4’lü") ||
        metin.includes('4lü')
      ) {
        count = 4;
        etiket = 'dörtleme';
      } else if (
        metin.includes('quintuplet') ||
        metin.includes('beşleme') ||
        metin.includes('besleme') ||
        metin.includes("5’li") ||
        metin.includes('5li')
      ) {
        count = 5;
        etiket = 'beşleme';
      } else if (
        metin.includes('sextuplet') ||
        metin.includes('altılama') ||
        metin.includes('altilama') ||
        metin.includes("6’lı") ||
        metin.includes('6li')
      ) {
        count = 6;
        etiket = 'altılama';
      }
      if (count == null) {
        const sayiMatch = metin.match(/\b([2-6])\b/);
        if (sayiMatch) {
          count = Number(sayiMatch[1]);
          etiket = `${count}li düzensiz grup`;
        }
      }
      if (count == null) {
        count = 3;
        etiket = 'üçleme';
      }
      tupletSesiCal({ count, etiket, beatMs: 500, totalBeats: 2 });
      return;
    }

    if (isMuzikTempo) {
      let bpm = null;
      let etiket = '';
      let effectType = null;
      const bpmMatch = metin.match(/(\d{2,3})\s*(bpm|vuruş|vurus)?/);
      if (bpmMatch) {
        bpm = Number(bpmMatch[1]);
        etiket = `${bpm} BPM`;
      }
      if (
        metin.includes('ritardando') ||
        metin.includes('rit.') ||
        /\brit\b/.test(metin)
      ) {
        bpm = 110;
        etiket = 'gittikçe yavaşlar';
        effectType = 'ritardando';
      } else if (
        metin.includes('accelerando') ||
        metin.includes('accel')
      ) {
        bpm = 160;
        etiket = 'hızlanır';
        effectType = 'accelerando';
      }
      if (!Number.isFinite(bpm) || bpm <= 0) return;
      tempoSesiCal({ bpm, beatMs: Math.round(60000 / bpm), etiket, effectType });
      return;
    }

    if (isMuzikTekrar) {
      let tekrarSayisi = 2;
      let type = 'repeat';
      let etiket = 'tekrar';
      if (
        metin.includes('×3') ||
        metin.includes('x3') ||
        metin.includes('3 kez') ||
        metin.includes('üç kez') ||
        metin.includes('uc kez')
      ) {
        tekrarSayisi = 3;
        type = 'repeat-x3';
        etiket = 'üç kez tekrar';
      } else if (
        metin.includes('geri sayım') ||
        metin.includes('geri sayim')
      ) {
        tekrarSayisi = 2;
        type = 'countback-repeat';
        etiket = 'geri sayım tekrarı';
      } else if (
        metin.includes('ölçü numarası') ||
        metin.includes('olcu numarasi') ||
        metin.includes('ölçü aralığı') ||
        metin.includes('olcu araligi')
      ) {
        tekrarSayisi = 2;
        type = 'measure-number-repeat';
        etiket = 'ölçü numarası tekrarı';
      }
      tekrarSesiCal({ type, tekrarSayisi, etiket });
      return;
    }

    if (isMuzikZaman) {
      let ust = null;
      let alt = null;
      const kesirMatch = metin.match(/(\d+)\s*\/\s*(\d+)/);
      if (kesirMatch) {
        ust = Number(kesirMatch[1]);
        alt = Number(kesirMatch[2]);
      }
      if (!ust || !alt) {
        if (metin.includes('2/4') || metin.includes('iki dörtlük') || metin.includes('iki dortluk')) {
          ust = 2; alt = 4;
        } else if (metin.includes('3/4') || metin.includes('üç dörtlük') || metin.includes('uc dortluk')) {
          ust = 3; alt = 4;
        } else if (metin.includes('4/4') || metin.includes('dört dörtlük') || metin.includes('dort dortluk')) {
          ust = 4; alt = 4;
        } else if (metin.includes('6/8') || metin.includes('altı sekizlik') || metin.includes('alti sekizlik')) {
          ust = 6; alt = 8;
        } else if (metin.includes('9/8') || metin.includes('dokuz sekizlik')) {
          ust = 9; alt = 8;
        } else if (metin.includes('12/8') || metin.includes('on iki sekizlik') || metin.includes('oniki sekizlik')) {
          ust = 12; alt = 8;
        }
      }
      if (!ust || !alt) {
        if (
          metin.includes('common time') ||
          metin.includes('ortak zaman') ||
          metin.includes('c ')
        ) {
          ust = 4;
          alt = 4;
        } else if (
          metin.includes('alla breve') ||
          metin.includes('cut time') ||
          metin.includes('kesik zaman')
        ) {
          ust = 2;
          alt = 2;
        }
      }
      if (!Number.isFinite(ust) || !Number.isFinite(alt) || ust <= 0 || alt <= 0) return;
      zamanSesiCal({
        ticks: Array.from({ length: ust }, (_, i) => ({
          delayMs: i * 500,
          volume: i === 0 ? 1 : 0.72,
        })),
        toplamMs: (ust - 1) * 500,
      });
      return;
    }

    if (isMuzikBag) {
      bagSesiCal();
      return;
    }
  }, [
    isHerhangiBirMuzikSesliBolum,
    isMuzikSureleri,
    isMuzikOktav,
    isMuzikAksidental,
    isMuzikDonanim,
    isMuzikSus,
    isMuzikDinamik,
    isMuzikArtikulasyon,
    isMuzikSusleme,
    isMuzikTuplet,
    isMuzikTempo,
    isMuzikTekrar,
    isMuzikZaman,
    isMuzikBag,
    bolumAnahtari,
    sureliNotaSesiCal,
    oktavNotaSesiCal,
    notaDizisiCal,
    susSesiCal,
    dinamikSesiCal,
    artikulasyonSesiCal,
    suslemeSesiCal,
    tupletSesiCal,
    tempoSesiCal,
    tekrarSesiCal,
    zamanSesiCal,
    bagSesiCal,
  ]);

  const ogeyiSeslendir = useCallback((oge, { kesintiyle = true, kurallariDahilEt = false } = {}) => {
    if (!oge) return;
    const aktifSesDili = oge.dil || seslendirmeDili;
    const yabanciKod =
      aktifSesDili === 'en'
        ? 'en'
        : aktifSesDili === 'de'
          ? 'de'
          : aktifSesDili === 'fr'
            ? 'fr'
            : aktifSesDili === 'it'
              ? 'it'
              : null;
    if (!yabanciKod) {
      const tapMesaj = ilkHucreTapMesajiAl(oge);
      let m = `${oge.ad}. ${oge.aciklama || ''}${tapMesaj}`.trim();
      if (kurallariDahilEt && oge.kurallar?.length > 0) m += ` ${oge.kurallar.join(' ')}`;
      konus(m, { kesintiyle });
      return;
    }
    if (!oge.hucreler || oge.hucreler.length === 0) {
      let m = `${oge.ad}.${oge.aciklama ? ` ${oge.aciklama}` : ''}`.trim();
      if (kurallariDahilEt && oge.kurallar?.length > 0) m += ` ${oge.kurallar.join(' ')}`;
      konus(m, { dil: 'tr', kesintiyle });
      return;
    }
    const tapMesaj = ilkHucreTapMesajiAl(oge).trim() || 'Lütfen noktalarına dokunun.';
    const aciklama = (oge.aciklama || '').trim();
    const kuralParca =
      kurallariDahilEt && oge.kurallar?.length > 0 ? oge.kurallar.join(' ') : '';
    const turkceKisim = [aciklama, kuralParca, tapMesaj].filter(Boolean).join(' ');
    konus(oge.ad, {
      dil: yabanciKod,
      kesintiyle,
      onSon: turkceKisim
        ? () => konus(turkceKisim, { dil: 'tr', kesintiyle: false })
        : undefined,
    });
  }, [seslendirmeDili]);

  // Nerede kaldıysa kaydet (kayıtlılar modunda kaydetme)
  useEffect(() => {
    if (bolumAnahtari && !kayitlilarModu) indeksKaydet(bolumAnahtari, indeks);
  }, [indeks, bolumAnahtari, kayitlilarModu]);

  useEffect(() => {
    if (!isMuzikSureleri) return undefined;
    const urls = aktifListe
      .map((oge) => {
        const ad = String(oge.ad || '').toLocaleLowerCase('tr');
        const noteMatch = ad.match(/\b(do|re|mi|fa|sol|la|si)\b/i);
        if (!noteMatch) return null;

        let sureIndeksi = null;
        if (ad.includes('sekizlik')) sureIndeksi = 0;
        else if (ad.includes('dörtlük') || ad.includes('dortluk')) sureIndeksi = 1;
        else if (ad.includes('yarım') || ad.includes('yarim')) sureIndeksi = 2;
        else if (ad.includes('tam')) sureIndeksi = 3;
        else if (ad.includes('16')) sureIndeksi = 4;
        else if (ad.includes('32')) sureIndeksi = 5;
        else if (ad.includes('64')) sureIndeksi = 6;

        if (sureIndeksi == null) return null;

        return muzikNotaPiyanoSesUrlAl({
          tip: 'nota',
          notaAd: noteMatch[1].toLocaleLowerCase('tr'),
          oktav: 4,
          sureIndeksi,
        }, { extension: 'mp3' });
      })
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [aktifListe, isMuzikSureleri, preloadUrls]);

  useEffect(() => {
    if (!isMuzikOktav) return undefined;

    const urls = aktifListe
      .map((oge) => {
        const ad = String(oge.ad || '').toLocaleLowerCase('tr');
        const match = ad.match(/([1-7])\.\s*oktav/);
        if (!match) return null;
        const oktav = Number(match[1]);
        if (!Number.isFinite(oktav) || oktav < 1 || oktav > 7) return null;

        return muzikNotaPiyanoSesUrlAl({
          tip: 'nota',
          notaAd: 'do',
          oktav,
          sureIndeksi: 1,
        }, { extension: 'mp3' });
      })
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [aktifListe, isMuzikOktav, preloadUrls]);

  useEffect(() => {
    if (!isMuzikArtikulasyon) return undefined;

    const urls = ['do', 're', 'mi']
      .map((notaAd) => muzikNotaPiyanoSesUrlAl({
        tip: 'nota',
        notaAd,
        oktav: 4,
        sureIndeksi: 1,
      }, { extension: 'mp3' }))
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [isMuzikArtikulasyon, preloadUrls]);

  useEffect(() => {
    if (!isMuzikTekrar) return undefined;

    const urls = ['do', 're', 'mi']
      .map((notaAd) => muzikNotaPiyanoSesUrlAl({
        tip: 'nota',
        notaAd,
        oktav: 4,
        sureIndeksi: 1,
      }, { extension: 'mp3' }))
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [isMuzikTekrar, preloadUrls]);

  useEffect(() => {
    if (!isMuzikAksidental) return undefined;

    const urls = (aktifListe || [])
      .flatMap((oge) => {
        const ad = String(oge.ad || '').toLocaleLowerCase('tr');

        let dizi = null;

        if (ad.includes('çift diyez') || ad.includes('cift diyez')) {
          dizi = [
            { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
            { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
          ];
        } else if (ad.includes('çift bemol') || ad.includes('cift bemol')) {
          dizi = [
            { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
            { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
          ];
        } else if (ad.includes('diyez')) {
          dizi = [
            { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
            { notaAd: 'do', oktav: 4, accidental: 'sharp', sureIndeksi: 1 },
          ];
        } else if (ad.includes('bemol')) {
          dizi = [
            { notaAd: 're', oktav: 4, accidental: null, sureIndeksi: 1 },
            { notaAd: 're', oktav: 4, accidental: 'flat', sureIndeksi: 1 },
          ];
        } else if (ad.includes('naturel') || ad.includes('bekar')) {
          dizi = [
            { notaAd: 'do', oktav: 4, accidental: 'sharp', sureIndeksi: 1 },
            { notaAd: 'do', oktav: 4, accidental: null, sureIndeksi: 1 },
          ];
        }

        if (!Array.isArray(dizi)) return [];

        return dizi.map((nota) => (
          muzikNotaPiyanoSesUrlAl({
            tip: 'nota',
            notaAd: nota.notaAd,
            oktav: nota.oktav ?? 4,
            accidental: nota.accidental ?? null,
            sureIndeksi: nota.sureIndeksi ?? 1,
          }, { extension: 'mp3' })
        ));
      })
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [aktifListe, isMuzikAksidental, preloadUrls]);

  useEffect(() => {
    if (!isMuzikDonanim) return undefined;

    const urls = (aktifListe || [])
      .flatMap((oge) => {
        const ad = String(oge.ad || '').toLocaleLowerCase('tr');
        const sayiMatch = ad.match(/([1-7])/);
        const sayi = sayiMatch ? Number(sayiMatch[1]) : 0;

        if (!Number.isFinite(sayi) || sayi < 1 || sayi > 7) return [];

        const diyezMi = ad.includes('diyez');
        const bemolMu = ad.includes('bemol');
        if (!diyezMi && !bemolMu) return [];

        const siralama = diyezMi ? DIYEZ_SIRASI : BEMOL_SIRASI;
        const accidental = diyezMi ? 'sharp' : 'flat';

        return siralama.slice(0, sayi).flatMap((notaAd) => ([
          muzikNotaPiyanoSesUrlAl({
            tip: 'nota',
            notaAd,
            oktav: 4,
            accidental: null,
            sureIndeksi: 1,
          }, { extension: 'mp3' }),
          muzikNotaPiyanoSesUrlAl({
            tip: 'nota',
            notaAd,
            oktav: 4,
            accidental,
            sureIndeksi: 1,
          }, { extension: 'mp3' }),
        ]));
      })
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [aktifListe, isMuzikDonanim, preloadUrls]);

  useEffect(() => {
    if (!isMuzikSus && !isMuzikZaman && !isMuzikTuplet && !isMuzikTempo) return undefined;

    const audio = new Audio(METRONOM_CLICK_URL);
    audio.preload = 'auto';
    metronomAudioRef.current = audio;

    try {
      audio.load();
    } catch {}

    return undefined;
  }, [isMuzikSus, isMuzikZaman, isMuzikTuplet, isMuzikTempo]);

  useEffect(() => {
    if (!isMuzikDinamik) return undefined;

    const url = muzikNotaPiyanoSesUrlAl({
      tip: 'nota',
      notaAd: 'do',
      oktav: 4,
      sureIndeksi: 1,
    }, { extension: 'mp3' });

    preloadUrls?.([url].filter(Boolean));
    return undefined;
  }, [isMuzikDinamik, preloadUrls]);

  useEffect(() => {
    if (!isMuzikBag) return undefined;

    const urls = ['do', 're', 'mi']
      .map((notaAd) => muzikNotaPiyanoSesUrlAl({
        tip: 'nota',
        notaAd,
        oktav: 4,
        sureIndeksi: 1,
      }, { extension: 'mp3' }))
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [isMuzikBag, preloadUrls]);

  useEffect(() => {
    if (!isMuzikSusleme) return undefined;

    const urls = ['si', 'do', 're']
      .map((notaAd) => muzikNotaPiyanoSesUrlAl({
        tip: 'nota',
        notaAd,
        oktav: 4,
        sureIndeksi: 1,
      }, { extension: 'mp3' }))
      .filter(Boolean);

    preloadUrls?.(urls);
    return undefined;
  }, [isMuzikSusleme, preloadUrls]);

  useEffect(() => {
    if (!isMuzikTuplet) return undefined;

    const urls = ['do', 're', 'mi', 'fa', 'sol', 'la']
      .map((notaAd) => muzikNotaPiyanoSesUrlAl({
        tip: 'nota',
        notaAd,
        oktav: 4,
        sureIndeksi: 1,
      }, { extension: 'mp3' }))
      .filter(Boolean);

    preloadUrls?.(urls);

    const audio = new Audio(METRONOM_CLICK_URL);
    audio.preload = 'auto';
    metronomAudioRef.current = audio;

    try {
      audio.load();
    } catch {}

    return undefined;
  }, [isMuzikTuplet, preloadUrls]);

  const gosterToast = (mesaj) => {
    clearTimeout(toastTimerRef.current);
    setToast(mesaj);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    if (bitti) {
      konus(`Tebrikler! ${baslik} bölümünü tamamladınız.`);
      return;
    }
    ogeyiSeslendir(k, { kesintiyle: true, kurallariDahilEt: true });

    if (isMuzikSureleri && notaSesiAktif && sureliNotaBilgisi?.notaAd) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        sureliNotaSesiCal(sureliNotaBilgisi.notaAd, sureliNotaBilgisi.sureIndeksi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikOktav && notaSesiAktif && oktavNotaBilgisi?.notaAd) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        oktavNotaSesiCal(oktavNotaBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikAksidental && notaSesiAktif && aksidentalSesDizisi?.length) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        notaDizisiCal(aksidentalSesDizisi, 700);
        notaSesiTimerRef.current = null;
      }, 1400);
    }

    if (isMuzikSus && notaSesiAktif && susBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        susSesiCal(susBilgisi);
        notaSesiTimerRef.current = null;
      }, 1400);
    }

    if (isMuzikDinamik && notaSesiAktif && dinamikBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        dinamikSesiCal(dinamikBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikArtikulasyon && notaSesiAktif && artikulasyonBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        artikulasyonSesiCal(artikulasyonBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikSusleme && notaSesiAktif && suslemeBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        suslemeSesiCal(suslemeBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikTuplet && notaSesiAktif && tupletBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        tupletSesiCal(tupletBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikTempo && notaSesiAktif && tempoBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        tempoSesiCal(tempoBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikTekrar && notaSesiAktif && tekrarBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        tekrarSesiCal(tekrarBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikZaman && notaSesiAktif && zamanVuruslari?.ticks?.length) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        zamanSesiCal(zamanVuruslari);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikBag && notaSesiAktif && bagBilgisi) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        bagSesiCal(bagBilgisi);
        notaSesiTimerRef.current = null;
      }, 1200);
    }

    if (isMuzikDonanim && notaSesiAktif && donanimSesDizisi?.length) {
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
      }
      notaSesiTimerRef.current = window.setTimeout(() => {
        notaDizisiCal(donanimSesDizisi, 650);
        notaSesiTimerRef.current = null;
      }, 1500);
    }

    const tekrar = () => {
      tumSesleriDurdur();
      ogeyiSeslendir(k, { kesintiyle: true, kurallariDahilEt: true });
    };
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
        notaSesiTimerRef.current = null;
      }
    };
  }, [
    indeks,
    bitti,
    baslik,
    aktifListe,
    ogeyiSeslendir,
    isMuzikSureleri,
    isMuzikOktav,
    isMuzikAksidental,
    isMuzikDonanim,
    isMuzikSus,
    isMuzikArtikulasyon,
    isMuzikDinamik,
    isMuzikBag,
    isMuzikSusleme,
    isMuzikZaman,
    isMuzikTuplet,
    isMuzikTempo,
    isMuzikTekrar,
    notaSesiAktif,
    sureliNotaBilgisi,
    sureliNotaSesiCal,
    oktavNotaBilgisi,
    oktavNotaSesiCal,
    aksidentalSesDizisi,
    donanimSesDizisi,
    susBilgisi,
    susSesiCal,
    dinamikBilgisi,
    dinamikSesiCal,
    bagBilgisi,
    bagSesiCal,
    suslemeBilgisi,
    suslemeSesiCal,
    tupletBilgisi,
    tupletSesiCal,
    tempoBilgisi,
    tempoSesiCal,
    tekrarBilgisi,
    tekrarSesiCal,
    zamanVuruslari,
    zamanSesiCal,
    notaDizisiCal,
    tumSesleriDurdur,
  ]);

  // Yeni işarete geçince sıfırla
  useEffect(() => { setHucreIndeksi(0); }, [indeks]);
  useEffect(() => { setBasilanlar([]); setYanlis([]); }, [indeks, hucreIndeksi]);

  // Yeni hücreye geçince seslendir
  useEffect(() => {
    if (bitti || hucreIndeksi === 0) return;
    const k = aktifListe[indeks];
    if (!k || !k.hucreler[hucreIndeksi]) return;
    konus(`${hucreIndeksi + 1}. hücre: ${k.hucreler[hucreIndeksi].join(', ')} numaralı noktalara dokunun.`, { kesintiyle: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hucreIndeksi, indeks, bitti]);

  useEffect(() => {
    return () => {
      konusmayiDurdur();
      if (notaSesiTimerRef.current) {
        clearTimeout(notaSesiTimerRef.current);
        notaSesiTimerRef.current = null;
      }
      notaDizisiTimerlariniTemizle();
    };
  }, [notaDizisiTimerlariniTemizle]);

  const okumaModunaGec = () => {
    tumSesleriDurdur();
    setOkumaModu(true);
  };

  const okumaOgesiSec = (orijinalIndeks) => {
    setKayitlilarModu(false);
    setIndeks(orijinalIndeks);
    setHucreIndeksi(0);
    setBasilanlar([]);
    setYanlis([]);
    setOkumaModu(false);
  };

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            Okuma modu: {isaretler.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik={baslik}
            ogeler={isaretler}
            getEtiket={(isaret) => (isaret.sembol && isaret.sembol !== '—' ? isaret.sembol : isaret.ad)}
            getAltEtiket={(isaret) => {
              if (isaret.sembol && isaret.sembol !== '—') return isaret.ad;
              const oz = okumaModuIkinciSatir(isaret);
              return oz || undefined;
            }}
            getHucreler={(isaret) => isaret.hucreler || []}
            onSec={okumaOgesiSec}
            onKapat={() => setOkumaModu(false)}
            seslendirmeDili={seslendirmeDili}
            ogeSesiCal={isHerhangiBirMuzikSesliBolum ? okumaModuMuzikOgeSesiCal : undefined}
            okumaModuOgeSesiAktif={isHerhangiBirMuzikSesliBolum}
          />
        </div>
        <div className="controls">
          <button className="btn" type="button" onClick={() => setOkumaModu(false)}>Öğrenme Moduna Dön</button>
        </div>
      </div>
    );
  }

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            {kayitlilarModu && aktifListe.length === 0
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : 'Tebrikler! Tüm işaretleri öğrendiniz.'}
          </div>
        </div>
        <div className="controls">
          {kayitlilarModu
            ? <button className="btn" type="button" onClick={() => { setKayitlilarModu(false); setIndeks(0); }}>Tüm Listeye Dön</button>
            : <button className="btn" type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>}
        </div>
      </div>
    );
  }

  const hucreSayisi = k.hucreler.length;
  const guvenliHucreIndeksi = hucreSayisi > 0 ? Math.min(hucreIndeksi, hucreSayisi - 1) : 0;
  const ikiHucreYanYana = matematikHucreGorunumu && hucreSayisi === 2;
  const onizlemeliCokHucre = matematikHucreGorunumu && hucreSayisi > 2;
  const noktaMetni = k.hucreler.length > 0
    ? k.hucreler.map((h) => h.join('-')).join('  /  ')
    : 'Bu konu bir kuraldır, hücre sembolü yoktur.';
  const altPaneldeMetinVar =
    Boolean((k.aciklama || '').trim()) ||
    (Array.isArray(k.kurallar) && k.kurallar.length > 0) ||
    (Array.isArray(k.ornekler) && k.ornekler.length > 0);

  const modDegistir = (kayitlilar) => {
    setKayitlilarModu(kayitlilar);
    setIndeks(0);
  };

  const kaydetSonra = () => {
    if (bitti || !k) return;
    const kaydedildi = sonraOgrenAl(anahtar).includes(k.ad);
    if (kaydedildi) {
      sonraOgrenKaldir(anahtar, k.ad);
      konus('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, k.ad);
      konus('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

  const noktayaTikla = (n) => {
    const aktifHucreNoktalar = k.hucreler[guvenliHucreIndeksi] || [];
    if (basilanlar.includes(n)) return;
    const beklenenSiradaki = aktifHucreNoktalar[basilanlar.length];
    if (n !== beklenenSiradaki) {
      setYanlis([n]);
      hataBildir(aktifHucreNoktalar.includes(n) ? `Sıra yanlış. Önce ${beklenenSiradaki} numaraya basın.` : `${n} numara yanlış.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    const tamamMi = yeni.length === aktifHucreNoktalar.length;
    if (tamamMi) {
      const sonHucreDir = guvenliHucreIndeksi >= k.hucreler.length - 1;
      if (sonHucreDir) {
        basariBildir('Tebrikler!');
        setTimeout(() => setIndeks((i) => i + 1), 800);
      } else {
        basariBildir('Doğru!');
        setTimeout(() => setHucreIndeksi((i) => i + 1), 500);
      }
    } else {
      konus(`Doğru. Sıradaki nokta: ${aktifHucreNoktalar[yeni.length]} numara.`);
    }
  };

  return (
    <div className="page">
      {toast && <div className="toast" aria-live="assertive">{toast}</div>}
      <div>
        <PageHeader baslik={baslik} />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {aktifListe.length}
        </div>
        {kayitliSayisi > 0 && (
          <div className="banner-grup-secim" style={{ margin: '4px 0 0' }}>
            <button type="button" className={`btn ${!kayitlilarModu ? 'aktif' : ''}`} aria-pressed={!kayitlilarModu} onClick={() => modDegistir(false)}>Tümü</button>
            <button type="button" className={`btn ${kayitlilarModu ? 'aktif' : ''}`} aria-pressed={kayitlilarModu} onClick={() => modDegistir(true)}>Kayıtlılar ({kayitliSayisi})</button>
          </div>
        )}

        {isMuzikSureleri && sureliNotaBilgisi?.notaAd && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                sureliNotaSesiCal(sureliNotaBilgisi.notaAd, sureliNotaBilgisi.sureIndeksi);
              }}
              aria-label="Nota seslerini aç"
            >
              🔊
              <span className="btn-etiket">Nota Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                konusVeNotaCal(
                  `${k.ad}. ${k.aciklama || ''}`,
                  sureliNotaBilgisi.notaAd,
                  sureliNotaBilgisi.sureIndeksi,
                  1200
                );
              }}
              aria-label="Bu öğeyi dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikOktav && oktavNotaBilgisi?.notaAd && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                oktavNotaSesiCal(oktavNotaBilgisi);
              }}
              aria-label={`${oktavNotaBilgisi.oktav}. oktav do sesini çal`}
            >
              🔊
              <span className="btn-etiket">Oktav Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                const metin = `${k.ad}. ${k.aciklama || ''}`;
                konus(metin, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  oktavNotaSesiCal(oktavNotaBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu oktavı dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikAksidental && aksidentalSesDizisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                notaDizisiCal(aksidentalSesDizisi);
              }}
              aria-label="Aksidental sesini çal"
            >
              🔊
              <span className="btn-etiket">Aksidental Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  notaDizisiCal(aksidentalSesDizisi, 700);
                  notaSesiTimerRef.current = null;
                }, 1400);
              }}
              aria-label="Bu aksidentali dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikDinamik && dinamikBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                dinamikSesiCal(dinamikBilgisi);
              }}
              aria-label="Dinamik sesini çal"
            >
              🔊
              <span className="btn-etiket">
                {bolumAnahtari === 'muzik-hairpin' ? 'Hairpin Sesi' : 'Dinamik Sesi'}
              </span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  dinamikSesiCal(dinamikBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu dinamiği dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikTekrar && tekrarBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                tekrarSesiCal(tekrarBilgisi);
              }}
              aria-label="Tekrar sesini çal"
            >
              🔁
              <span className="btn-etiket">Tekrar Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });

                notaSesiTimerRef.current = window.setTimeout(() => {
                  tekrarSesiCal(tekrarBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu tekrar işaretini dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikArtikulasyon && artikulasyonBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                artikulasyonSesiCal(artikulasyonBilgisi);
              }}
              aria-label="Artikülasyon sesini çal"
            >
              🔊
              <span className="btn-etiket">Artikülasyon Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  artikulasyonSesiCal(artikulasyonBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu artikülasyonu dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikBag && bagBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                bagSesiCal(bagBilgisi);
              }}
              aria-label="Bağ sesini çal"
            >
              🔊
              <span className="btn-etiket">Bağ Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  bagSesiCal(bagBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu bağı dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikSusleme && suslemeBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                suslemeSesiCal(suslemeBilgisi);
              }}
              aria-label="Süsleme sesini çal"
            >
              🔊
              <span className="btn-etiket">Süsleme Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  suslemeSesiCal(suslemeBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu süslemeyi dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikTuplet && tupletBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                tupletSesiCal(tupletBilgisi);
              }}
              aria-label="Tuplet sesini çal"
            >
              🔊
              <span className="btn-etiket">Tuplet Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  tupletSesiCal(tupletBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu düzensiz grubu dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikTempo && tempoBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                tempoSesiCal(tempoBilgisi);
              }}
              aria-label="Tempo sesini çal"
            >
              🕒
              <span className="btn-etiket">Tempo Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  tempoSesiCal(tempoBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu tempoyu dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikZaman && zamanVuruslari?.ticks?.length > 0 && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                zamanSesiCal(zamanVuruslari);
              }}
              aria-label="Zaman imzası ölçü sesini çal"
            >
              🕒
              <span className="btn-etiket">Ölçü Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  zamanSesiCal(zamanVuruslari);
                  notaSesiTimerRef.current = null;
                }, 1200);
              }}
              aria-label="Bu zaman imzasını dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikSus && susBilgisi && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                susSesiCal(susBilgisi);
              }}
              aria-label="Sus süresini sesle göster"
            >
              🔇
              <span className="btn-etiket">Sus Örneği</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  susSesiCal(susBilgisi);
                  notaSesiTimerRef.current = null;
                }, 1400);
              }}
              aria-label="Bu susu dinle"
            >
              Dinle
            </button>
          </div>
        )}

        {isMuzikDonanim && donanimSesDizisi?.length > 0 && (
          <div
            className="controls"
            style={{
              justifyContent: 'flex-start',
              padding: 0,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setNotaSesiAktif(true);
                notaDizisiCal(donanimSesDizisi, 650);
              }}
              aria-label="Donanım sesini çal"
            >
              🔊
              <span className="btn-etiket">Donanım Sesi</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                konus(`${k.ad}. ${k.aciklama || ''}`, { kesintiyle: true });
                notaSesiTimerRef.current = window.setTimeout(() => {
                  notaDizisiCal(donanimSesDizisi, 650);
                  notaSesiTimerRef.current = null;
                }, 1500);
              }}
              aria-label="Bu donanımı dinle"
            >
              Dinle
            </button>
          </div>
        )}
      </div>

      <div
        className="isaret-icerik"
        style={{
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div className="ders-eylem-satiri">
          <OkumaModuButonu onClick={okumaModunaGec} />
          <button
            type="button"
            className={`btn sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(k?.ad) ? ' kaydedildi' : ''}`}
            onClick={kaydetSonra}
            aria-label="Daha sonra öğren listesine kaydet"
            title="Daha sonra öğren"
          >
            <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '1.5em', fontWeight: 700, color: 'var(--accent)' }}>
          {k.ad}
          {k.sembol && k.sembol !== '—' && (
            <span style={{ marginLeft: '0.5em', color: 'var(--muted)', fontSize: '0.7em' }}>
              ({k.sembol})
            </span>
          )}
        </div>

        {k.hucreler.length > 0 && (
          <>
            {ikiHucreYanYana ? (
              <div className="cell-row fit" style={{ '--hucre-sayisi': 2 }}>
                {k.hucreler.map((noktalar, hucreIndex) => (
                  <BrailleCell
                    key={hucreIndex}
                    baslik={`${hucreIndex + 1}`}
                    baslikAriaLabel={`${k.ad} sembolü ${hucreIndex + 1}. hücre`}
                    hedefNoktalar={noktalar}
                    dogruNoktalar={hucreIndex < guvenliHucreIndeksi ? noktalar : hucreIndex === guvenliHucreIndeksi ? basilanlar : []}
                    yanlisNoktalar={hucreIndex === guvenliHucreIndeksi ? yanlis : []}
                    tiklanabilir={hucreIndex === guvenliHucreIndeksi}
                    onNoktaTikla={noktayaTikla}
                  />
                ))}
              </div>
            ) : onizlemeliCokHucre ? (
              <>
                <div className="aktif-hucre-wrap">
                  <BrailleCell
                    hedefNoktalar={k.hucreler[guvenliHucreIndeksi]}
                    dogruNoktalar={basilanlar}
                    yanlisNoktalar={yanlis}
                    tiklanabilir
                    onNoktaTikla={noktayaTikla}
                    baslikAriaLabel={`${k.ad} sembolü ${guvenliHucreIndeksi + 1}. hücre`}
                  />
                </div>
                <div className="hucre-onizleme" role="tablist" aria-label="Hücre listesi">
                  {k.hucreler.map((noktalar, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === guvenliHucreIndeksi}
                      className={`btn hucre-onizleme-oge ${i === guvenliHucreIndeksi ? 'aktif' : ''}`}
                      onClick={() => setHucreIndeksi(i)}
                      aria-label={`${i + 1}. hücreye git`}
                    >
                      <span className="hucre-onizleme-grid" aria-hidden="true">
                        {[1, 4, 2, 5, 3, 6].map((n) => (
                          <span key={n} className={`hucre-onizleme-nokta ${noktalar.includes(n) ? 'on' : ''}`} />
                        ))}
                      </span>
                      <span className="hucre-onizleme-no" aria-hidden="true">{i + 1}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <BrailleCell
                hedefNoktalar={k.hucreler[guvenliHucreIndeksi]}
                dogruNoktalar={basilanlar}
                yanlisNoktalar={yanlis}
                tiklanabilir
                onNoktaTikla={noktayaTikla}
                baslikAriaLabel={k.hucreler.length > 1 ? `${k.ad} sembolü ${guvenliHucreIndeksi + 1}. hücre` : `${k.ad} sembolü`}
              />
            )}
            {k.hucreler.length > 1 && (
              <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>
                Hücre {guvenliHucreIndeksi + 1} / {k.hucreler.length}
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em' }}>
          <strong>Noktalar:</strong> {noktaMetni}
        </div>

        {altPaneldeMetinVar && (
          <div className="isaret-metin-alti" aria-live="polite">
            {(k.aciklama || '').trim() !== '' && (
              <p style={{ margin: '0 0 0.75em 0' }}>{k.aciklama}</p>
            )}
            {k.kurallar?.length > 0 && (
              <>
                <strong>Kullanıldığı yerler:</strong>
                <ul style={{ margin: '0.3em 0 0.8em 1.2em', padding: 0 }}>
                  {k.kurallar.map((kr, i) => (
                    <li key={i} style={{ marginBottom: '0.3em' }}>{kr}</li>
                  ))}
                </ul>
              </>
            )}
            {k.ornekler?.length > 0 && (
              <>
                <strong>Örnek:</strong>
                <ul style={{ margin: '0.3em 0 0 1.2em', padding: 0 }}>
                  {k.ornekler.map((o, i) => (
                    <li key={i} style={{ marginBottom: '0.3em' }}>{o}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="controls">
        <button
className="btn"           type="button"
          aria-label="Tekrar dinle"
          onClick={() => {
            tumSesleriDurdur();
            ogeyiSeslendir(k, { kesintiyle: true, kurallariDahilEt: true });

            if (isMuzikOktav && notaSesiAktif && oktavNotaBilgisi?.notaAd) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                oktavNotaSesiCal(oktavNotaBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikSureleri && notaSesiAktif && sureliNotaBilgisi?.notaAd) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                sureliNotaSesiCal(
                  sureliNotaBilgisi.notaAd,
                  sureliNotaBilgisi.sureIndeksi
                );
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikDonanim && notaSesiAktif && donanimSesDizisi?.length) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                notaDizisiCal(donanimSesDizisi, 650);
                notaSesiTimerRef.current = null;
              }, 1500);
            }

            if (isMuzikAksidental && notaSesiAktif && aksidentalSesDizisi?.length) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                notaDizisiCal(aksidentalSesDizisi, 700);
                notaSesiTimerRef.current = null;
              }, 1400);
            }

            if (isMuzikSus && notaSesiAktif && susBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                susSesiCal(susBilgisi);
                notaSesiTimerRef.current = null;
              }, 1400);
            }

            if (isMuzikDinamik && notaSesiAktif && dinamikBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                dinamikSesiCal(dinamikBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikArtikulasyon && notaSesiAktif && artikulasyonBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                artikulasyonSesiCal(artikulasyonBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikTekrar && notaSesiAktif && tekrarBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                tekrarSesiCal(tekrarBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikBag && notaSesiAktif && bagBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                bagSesiCal(bagBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikSusleme && notaSesiAktif && suslemeBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                suslemeSesiCal(suslemeBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikTuplet && notaSesiAktif && tupletBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                tupletSesiCal(tupletBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikTempo && notaSesiAktif && tempoBilgisi) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                tempoSesiCal(tempoBilgisi);
                notaSesiTimerRef.current = null;
              }, 1200);
            }

            if (isMuzikZaman && notaSesiAktif && zamanVuruslari?.ticks?.length) {
              notaSesiTimerRef.current = window.setTimeout(() => {
                zamanSesiCal(zamanVuruslari);
                notaSesiTimerRef.current = null;
              }, 1200);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button className="btn" type="button" aria-label="Önceki" disabled={indeks === 0} onClick={() => { tumSesleriDurdur(); setIndeks((i) => Math.max(0, i - 1)); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="btn-etiket">Önceki</span>
        </button>
        <button
className="btn"           type="button"
          aria-label={k.hucreler.length > 0 ? 'Atla, sonraki' : 'Anladım, sonraki'}
          onClick={() => {
            tumSesleriDurdur();
            if (k.hucreler.length > 0 && hucreIndeksi < k.hucreler.length - 1) {
              setHucreIndeksi((i) => i + 1);
            } else {
              basariBildir('Sıradaki işaret.');
              setTimeout(() => setIndeks((i) => i + 1), 400);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="btn-etiket">{k.hucreler.length > 0 ? 'Atla' : 'Anladım'}</span>
        </button>
      </div>
    </div>
  );
}
