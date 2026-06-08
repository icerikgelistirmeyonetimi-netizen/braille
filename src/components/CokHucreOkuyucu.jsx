import React, { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, basariBildir, hataBildir, konusmayiDurdur, ekranOkuyucuTemizle, dogruSesi } from '../utils/ses.js';
import { indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';

// [1]      + 'ya','a' → "1. noktaya"
// [1,2]    + 'ya','a' → "1. ve 2. noktalara"
// [1,2,4]  + 'ya','a' → "1., 2. ve 4. noktalara"
function noktaListesi(nArr, tekEk, cogulEk) {
  if (!nArr || nArr.length === 0) return '';
  if (nArr.length === 1) return `${nArr[0]}. nokta${tekEk}`;
  if (nArr.length === 2) return `${nArr[0]}. ve ${nArr[1]}. noktalar${cogulEk}`;
  const bas = nArr.slice(0, -1).map((n) => `${n}.`).join(', ');
  return `${bas} ve ${nArr[nArr.length - 1]}. noktalar${cogulEk}`;
}

// Genel amaçlı çok hücreli sıralı okuma bileşeni.
// Her öge bir kelime/ifadedir; içindeki hücreler "hücre adımlama" modunda
// gösterilir: bir hücre büyük, altta tüm hücrelerin küçük önizlemesi.
// Bu sayede 6+ hücreli kelimeler mobilde de net okunur.
//
// ogeler: [{ yazi, okunus, anlam, hucreler: number[][] }]
// rtl: Arapça vb. sağdan sola yazı için.
export default function CokHucreOkuyucu({
  baslik,
  ogeler,
  bittiMesaji = 'Tebrikler! Tamamladınız.',
  rtl = false,
  bolumAnahtari,
  ikiHucreYanYana = false,
  ogeSesiCal,
  ogeSesiDurdur,
  ogeSesiGecikmeMs = 2600,
  ogeSesiOnceCal = false,
  ogeSesiHerZaman = false,
  okumaModundaSadeceOgeSesi = false,
  sadeceHucreYonergesiOku = false,
  ogeSesiSonrasiKonusmaGecikmeMs = 900,
  ilkOgeSesiHariciCalindi = false,
  sesKaydiButonuGoster = false,
  sesKaydiButonEtiketi = 'Ses Kaydını Dinle',
  yonergeFormati = 'standart', // 'standart' | 'sirayla'
}) {
  // Ders her açılışta baştan başlar (kaldığı yerden devam etmez).
  const [indeks, setIndeks] = useState(0);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]);
  const [yanlis, setYanlis] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const ogeSesiTimerRef = useRef(null);
  const tekrarSesiTimerRef = useRef(null);
  const sonHucreOgeRef = useRef(0); // hücre-noktası effect'inde öğe değişimini tespit için
  const [ogeSesiAktif, setOgeSesiAktif] = useState(Boolean(ogeSesiHerZaman));
  const [okumaModu, setOkumaModu] = useState(false);
  // Yönerge seslendirilirken nokta etkileşimi kilitlenir (tıklama/hover/odak/klavye yok).
  const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
  const yonergeNesilRef = useRef(0);
  const yonergeKilitTimerRef = useRef(null);
  const uyariResumeTimerRef = useRef(null);
  const uyariRef = useRef(null);
  const uyariFocusIstek = useRef(false);
  const dotSentinelRef = useRef(null);
  const oncekiYonergeOkunuyorRef = useRef(false);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? ogeler.filter((o) => kayitliAdlar.includes(o.yazi))
    : ogeler;

  const bitti = indeks >= aktifListe.length;
  const aktif = aktifListe[indeks];
  const hucreSayisi = aktif ? aktif.hucreler.length : 0;

  const kelimeYonergeMetniAl = useCallback((oge) => {
    if (!oge) return '';

    const hucreler = Array.isArray(oge.hucreler) ? oge.hucreler : [];
    const cokHucre = hucreler.length > 1;
    const ilkHucre = Array.isArray(hucreler[0]) ? hucreler[0] : (hucreler[0] != null ? [hucreler[0]] : []);
    let hucreYonergesi;
    if (yonergeFormati === 'sirayla') {
      const dokunYonergesi = ilkHucre.length
        ? `Lütfen sırayla ${noktaListesi(ilkHucre, 'ya', 'a')} dokununuz.`
        : 'Lütfen noktalarına dokununuz.';
      hucreYonergesi = cokHucre
        ? `${hucreler.length} braille hücresinden oluşur. 1. hücre: ${dokunYonergesi}`
        : dokunYonergesi;
    } else {
      const ilkHucreNoktalar = ilkHucre.length ? noktaListesi(ilkHucre, 'ya', 'a') : 'boş hücre';
      hucreYonergesi = cokHucre
        ? `${hucreler.length} braille hücresinden oluşur. 1. hücre: ${ilkHucreNoktalar} dokunun.`
        : `${ilkHucreNoktalar} dokunun.`;
    }

    if (sadeceHucreYonergesiOku) {
      return hucreYonergesi;
    }

    const ttsBaşlık = oge.ttsYazi || oge.yazi;
    const okunusKismi = oge.okunus ? `, okunuşu: ${oge.okunus}` : '';
    return `${ttsBaşlık}${okunusKismi}. ${oge.anlam || ''} ${hucreYonergesi}`;
  }, [sadeceHucreYonergesiOku, yonergeFormati]);

  // Menüdeki ilerleme göstergesi için yalnızca en uzak ulaşılan öğeyi kaydet
  // (ders baştan başlasa da ilerleme kaybolmasın). Kayıtlılar modunda kaydetme.
  useEffect(() => {
    if (bolumAnahtari && !kayitlilarModu && indeks > indeksAl(bolumAnahtari)) {
      indeksKaydet(bolumAnahtari, indeks);
    }
  }, [indeks, bolumAnahtari, kayitlilarModu]);

  const gosterToast = (mesaj) => {
    clearTimeout(toastTimerRef.current);
    setToast(mesaj);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  // Yönergeyi seslendirirken noktaları kilitler; seslendirme bitince açar.
  // onSon (utterance sonu) ana sinyaldir; güvenlik için bir zaman aşımı da var.
  const yonergeKilidiAc = (nesil) => {
    if (yonergeNesilRef.current !== nesil) return;
    if (yonergeKilitTimerRef.current) {
      clearTimeout(yonergeKilitTimerRef.current);
      yonergeKilitTimerRef.current = null;
    }
    setYonergeOkunuyor(false);
  };

  const yonergeyiKilitleyerekSeslendir = (metin, secenek = {}) => {
    const nesil = ++yonergeNesilRef.current;
    setYonergeOkunuyor(true);
    if (yonergeKilitTimerRef.current) clearTimeout(yonergeKilitTimerRef.current);
    // Asıl kilit açma sinyali konuşma sonu (onSon). Bu yalnızca onSon hiç
    // gelmezse devreye girecek CÖMERT bir emniyet: gerçek konuşmadan önce
    // ateşlenip yönergeyi erken açmasın (Türkçe TTS yavaş olabilir).
    const maxMs = Math.min(30000, 6000 + (metin ? metin.length : 0) * 200);
    yonergeKilitTimerRef.current = setTimeout(() => yonergeKilidiAc(nesil), maxMs);
    konus(metin, { ...secenek, onSon: () => yonergeKilidiAc(nesil) });
  };

  // Yönerge okunurken kullanıcı bir noktaya dokunmaya çalışırsa: uyar ve
  // yönergeyi kısa süre duraklatıp kaldığı yerden sürdür (üst üste binmesin).
  const yonergeBeklemeUyar = () => {
    gosterToast('Yönerge bitmesini bekleyiniz.');
    uyariFocusIstek.current = true;
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        if (uyariResumeTimerRef.current) clearTimeout(uyariResumeTimerRef.current);
        uyariResumeTimerRef.current = setTimeout(() => {
          try { window.speechSynthesis.resume(); } catch { /* yok say */ }
          uyariResumeTimerRef.current = null;
        }, 1800);
      }
    } catch { /* yok say */ }
  };

  const tumSesleriDurdur = () => {
    konusmayiDurdur();
    // Çalmakta olan ses kaydını da durdur (navigasyonda kayıt + TTS çakışmasın).
    ogeSesiDurdur?.();

    if (ogeSesiTimerRef.current) {
      clearTimeout(ogeSesiTimerRef.current);
      ogeSesiTimerRef.current = null;
    }

    if (tekrarSesiTimerRef.current) {
      clearTimeout(tekrarSesiTimerRef.current);
      tekrarSesiTimerRef.current = null;
    }
  };

  const kaydetSonra = () => {
    if (bitti || !aktif) return;
    const kaydedildi = sonraOgrenAl(anahtar).includes(aktif.yazi);
    if (kaydedildi) {
      sonraOgrenKaldir(anahtar, aktif.yazi);
      konus('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, aktif.yazi);
      konus('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

  const okumaModunaGec = () => {
    konusmayiDurdur();
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

  // Yeni kelimeye geçince ilk hücreden başla
  useEffect(() => { setHucreIndeksi(0); }, [indeks]);
  useEffect(() => { setBasilanlar([]); setYanlis([]); }, [indeks, hucreIndeksi]);

  // Yeni kelime tanıtımı (kelime adı + okunuş + hücre sayısı)
  useEffect(() => {
    // Öğe değişiminde önceki TTS ve ses kaydını durdur (üst üste binmesin).
    konusmayiDurdur();
    ogeSesiDurdur?.();

    if (bitti) {
      yonergeNesilRef.current += 1; // bekleyen kilit açmalarını geçersiz kıl
      setYonergeOkunuyor(false);
      // JSX'teki aria-live bölgesi tebrikler metnini duyuruyor; _srBolge'yi temizle.
      ekranOkuyucuTemizle();
      konus(bittiMesaji, { srAtla: true });
      return;
    }
    const k = ogeler[indeks];
    if (!k) return undefined;

    // Yeni öğe yüklendi: yönerge okunana kadar noktalar kilitli.
    // Nesli artır ki önceki öğenin bekleyen kilit-açma zamanlayıcıları
    // yeni öğeyi yanlışlıkla açmasın.
    yonergeNesilRef.current += 1;
    if (yonergeKilitTimerRef.current) {
      clearTimeout(yonergeKilitTimerRef.current);
      yonergeKilitTimerRef.current = null;
    }
    setYonergeOkunuyor(true);

    const metin = kelimeYonergeMetniAl(k);
    const gecikme = ogeSesiOnceCal ? 250 : 250;
    const sesAktifMi = ogeSesiHerZaman || ogeSesiAktif;

    if (ogeSesiTimerRef.current) {
      clearTimeout(ogeSesiTimerRef.current);
      ogeSesiTimerRef.current = null;
    }
    if (tekrarSesiTimerRef.current) {
      clearTimeout(tekrarSesiTimerRef.current);
      tekrarSesiTimerRef.current = null;
    }

    let konusmaTimer = null;

    const ilkOgeMi = indeks === 0 && !kayitlilarModu;
    const ilkSesZatenCalindi = ilkOgeMi && ilkOgeSesiHariciCalindi;

    if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function') {
      // Ses ile yönergenin EŞ ZAMANLI olmaması için: yönerge, kayıt BİTİNCE
      // (onEnded) okunur; sabit gecikme yerine kaydın gerçek süresi beklenir.
      let konustu = false;
      const yonergeyiOku = () => {
        if (konustu) return;
        konustu = true;
        yonergeyiKilitleyerekSeslendir(metin);
      };

      if (!ilkSesZatenCalindi) {
        ogeSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(k, { onEnded: yonergeyiOku });
          // Güvenlik: onEnded gelmezse (ör. ses çalınamazsa) en geç ~5 sn sonra oku.
          konusmaTimer = window.setTimeout(yonergeyiOku, 5000);
        }, gecikme);
      } else {
        // İlk öğe sesi haricen çalındı: yönergeyi kısa gecikmeyle oku.
        konusmaTimer = window.setTimeout(yonergeyiOku, gecikme + ogeSesiSonrasiKonusmaGecikmeMs);
      }
    } else {
      konusmaTimer = window.setTimeout(() => {
        yonergeyiKilitleyerekSeslendir(metin);
      }, gecikme);

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        ogeSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(k);
          ogeSesiTimerRef.current = null;
        }, gecikme + ogeSesiGecikmeMs);
      }
    }

    const tekrar = () => {
      if (tekrarSesiTimerRef.current) {
        clearTimeout(tekrarSesiTimerRef.current);
        tekrarSesiTimerRef.current = null;
      }

      if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function') {
        let tekrarKonustu = false;
        const tekrarOku = () => {
          if (tekrarKonustu) return;
          tekrarKonustu = true;
          yonergeyiKilitleyerekSeslendir(metin, { kesintiyle: true });
        };
        ogeSesiCal(k, { onEnded: tekrarOku });
        // Güvenlik: onEnded gelmezse en geç ~5 sn sonra oku.
        tekrarSesiTimerRef.current = window.setTimeout(tekrarOku, 5000);
        return;
      }

      yonergeyiKilitleyerekSeslendir(metin, { kesintiyle: true });

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        tekrarSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(k);
          tekrarSesiTimerRef.current = null;
        }, ogeSesiGecikmeMs);
      }
    };
    window.addEventListener('yonergeTekrar', tekrar);

    return () => {
      if (konusmaTimer) clearTimeout(konusmaTimer);
      if (ogeSesiTimerRef.current) {
        clearTimeout(ogeSesiTimerRef.current);
        ogeSesiTimerRef.current = null;
      }
      if (tekrarSesiTimerRef.current) {
        clearTimeout(tekrarSesiTimerRef.current);
        tekrarSesiTimerRef.current = null;
      }
      window.removeEventListener('yonergeTekrar', tekrar);
    };
  }, [
    indeks,
    bitti,
    ogeler,
    bittiMesaji,
    ogeSesiCal,
    ogeSesiGecikmeMs,
    ogeSesiOnceCal,
    ogeSesiHerZaman,
    ogeSesiAktif,
    ogeSesiSonrasiKonusmaGecikmeMs,
    ilkOgeSesiHariciCalindi,
    kelimeYonergeMetniAl,
    ogeSesiDurdur,
  ]);

  // Hücre değişince o hücrenin noktalarını seslendir (ilk hücre hariç)
  useEffect(() => {
    // ÖĞE (hece) değiştiyse bu effect, hucreIndeksi henüz sıfırlanmadan eski
    // değerle (ör. 1) çalışabilir → yeni hecenin kaydıyla çakışan "2. hücre"
    // seslendirmesi tetiklenirdi. Öğe değişiminde hiç konuşma: ana effect
    // (kayıt + yönerge) yeni öğeyi zaten tanıtıyor.
    const ogeDegisti = sonHucreOgeRef.current !== indeks;
    sonHucreOgeRef.current = indeks;
    if (ogeDegisti) return;

    if (bitti || !aktif || hucreIndeksi === 0) return;
    // Çalan ses kaydını durdur ki hücre noktası seslendirmesiyle üst üste binmesin.
    ogeSesiDurdur?.();
    const noktalar = aktif.hucreler[hucreIndeksi];
    if (!noktalar) return; // kelime değişmiş, indeks henüz sıfırlanmamış olabilir
    yonergeyiKilitleyerekSeslendir(
      `${hucreIndeksi + 1}. hücre: ${noktaListesi(noktalar, 'ya', 'a')} dokunun.`,
      { kesintiyle: true }
    );
  }, [hucreIndeksi, indeks, aktif, bitti, ogeSesiDurdur]);

  useEffect(() => () => konusmayiDurdur(), []);

  // Bileşen kaldırılırken yönerge kilit/sürdürme zamanlayıcılarını temizle.
  useEffect(() => () => {
    if (yonergeKilitTimerRef.current) clearTimeout(yonergeKilitTimerRef.current);
    if (uyariResumeTimerRef.current) clearTimeout(uyariResumeTimerRef.current);
  }, []);

  // Uyarı toast'u ekrana gelince ekran okuyucu imlecini oraya taşı.
  // useEffect: React DOM güncellemesinden sonra çalışır → ref kesinlikle set olmuştur.
  useEffect(() => {
    if (!toast || !uyariFocusIstek.current) return undefined;
    uyariFocusIstek.current = false;
    const id = window.requestAnimationFrame(() => uyariRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [toast]);


  // Narrasyon bitince görünmez sentinel'e odaklan; Tab → ilk nokta.
  useEffect(() => {
    const onceki = oncekiYonergeOkunuyorRef.current;
    oncekiYonergeOkunuyorRef.current = yonergeOkunuyor;
    if (!(onceki && !yonergeOkunuyor)) return undefined;
    if (okumaModu || bitti) return undefined;
    dogruSesi();
    const id = window.requestAnimationFrame(() => dotSentinelRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [yonergeOkunuyor, okumaModu, bitti]);

  // Yönerge okunurken klavyeyle gezinme/etkileşim de kapalı: Tab, Shift+Tab,
  // ok tuşları, Enter ve Space engellenir; denenirse "bekleyiniz" uyarısı verir.
  useEffect(() => {
    if (!yonergeOkunuyor) return undefined;
    const engellenen = new Set([
      'Tab', 'Enter', ' ', 'Spacebar',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown'
    ]);
    const onKey = (e) => {
      if (!engellenen.has(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      yonergeBeklemeUyar();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yonergeOkunuyor]);

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            Okuma modu: {ogeler.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik={baslik}
            ogeler={ogeler}
            rtl={rtl}
            getEtiket={(oge) => oge.yazi}
            getTtsEtiket={(oge) => oge.ttsYazi || oge.yazi}
            getAltEtiket={(oge) => oge.okunus || oge.anlam}
            getHucreler={(oge) => oge.hucreler || []}
            onSec={okumaOgesiSec}
            onKapat={() => setOkumaModu(false)}
            ogeSesiCal={ogeSesiCal}
            ogeSesiGecikmeMs={ogeSesiGecikmeMs}
            okumaModuOgeSesiGecikmeMs={900}
            okumaModuOgeSesiAktif={typeof ogeSesiCal === 'function'}
            okumaModundaSadeceOgeSesi={okumaModundaSadeceOgeSesi}
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
          <div className="instruction success" role="status" aria-live="assertive" style={{ margin: 0 }}>
            {kayitlilarModu && aktifListe.length === 0
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : bittiMesaji}
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

  const k = aktif;
  // hucreIndeksi yeni kelime daha az hücreliyse taşmış olabilir; render için sınırla
  const guvenliHucreIndeksi = Math.min(hucreIndeksi, hucreSayisi - 1);
  const aktifNoktalar = k.hucreler[guvenliHucreIndeksi] || [];
  const sonHucre = guvenliHucreIndeksi >= hucreSayisi - 1;
  const ilkKelime = indeks === 0;
  const ikiHucreTekSatir = ikiHucreYanYana && hucreSayisi === 2;

  const oncekiHucre = () => {
    tumSesleriDurdur();

    if (hucreIndeksi > 0) {
      setHucreIndeksi((i) => i - 1);
    } else if (!ilkKelime) {
      // Önceki kelimenin son hücresine git
      const oncekiUz = aktifListe[indeks - 1].hucreler.length;
      setIndeks((i) => i - 1);
      setTimeout(() => setHucreIndeksi(oncekiUz - 1), 0);
    }
  };
  const sonrakiHucre = () => {
    tumSesleriDurdur();

    if (sonHucre) {
      basariBildir('Sıradaki kelime.');
      setTimeout(() => setIndeks((i) => i + 1), 500);
    } else {
      setHucreIndeksi((i) => i + 1);
    }
  };

  const noktayaTikla = (n) => {
    if (basilanlar.includes(n)) return;
    if (n !== aktifNoktalar[basilanlar.length]) {
      setYanlis([n]);
      hataBildir(aktifNoktalar.includes(n) ? `Sıra yanlış. Önce ${aktifNoktalar[basilanlar.length]} numaraya basın.` : `${n} numara yanlış.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    if (yeni.length === aktifNoktalar.length) {
      basariBildir('Doğru!');
      setTimeout(() => sonrakiHucre(), 600);
    } else {
      konus(`Doğru. Sıradaki nokta: ${aktifNoktalar[yeni.length]} numara.`);
    }
  };

    return (
      <div className="page">
        {toast && <div ref={uyariRef} className="toast" aria-live="assertive" tabIndex={-1}>{toast}</div>}
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            İlerleme: {indeks + 1} / {aktifListe.length}
          {hucreSayisi > 1 && ` • Hücre ${guvenliHucreIndeksi + 1} / ${hucreSayisi}`}
        </div>
        {sesKaydiButonuGoster && typeof ogeSesiCal === 'function' && aktif && (
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
                ogeSesiCal(aktif);
              }}
              aria-label={sesKaydiButonEtiketi}
            >
              🔊
              <span className="btn-etiket">{sesKaydiButonEtiketi}</span>
            </button>
          </div>
        )}
        {kayitliSayisi > 0 && (
          <div className="banner-grup-secim" style={{ margin: '4px 0 0' }}>
            <button type="button" className={`btn ${!kayitlilarModu ? 'aktif' : ''}`} aria-pressed={!kayitlilarModu} onClick={() => { setKayitlilarModu(false); setIndeks(0); }}>Tümü</button>
            <button type="button" className={`btn ${kayitlilarModu ? 'aktif' : ''}`} aria-pressed={kayitlilarModu} onClick={() => { setKayitlilarModu(true); setIndeks(0); }}>Kayıtlılar ({kayitliSayisi})</button>
          </div>
        )}
      </div>

      <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
        {!bitti && (
          <div className="ders-eylem-satiri">
            <OkumaModuButonu onClick={okumaModunaGec} />
            <button
              type="button"
              className={`btn sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(aktif?.yazi) ? ' kaydedildi' : ''}`}
              onClick={kaydetSonra}
              aria-label="Daha sonra öğren listesine kaydet"
              title="Daha sonra öğren"
            >
              <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        )}
        {/* Kelime/ifade yazısı */}
        <div
          lang={rtl ? 'ar' : undefined}
          style={{
            textAlign: 'center',
            fontSize: rtl ? '1.8em' : '1.6em',
            lineHeight: rtl ? 1.5 : 1.2,
            fontWeight: 700,
            fontFamily: rtl ? "'Amasya', serif" : undefined,
            color: 'var(--accent)',
            direction: rtl ? 'rtl' : 'ltr',
            margin: 0,
            padding: rtl ? '4px 0 0' : 0,
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}
        >
          {k.yazi}
        </div>

        <span ref={dotSentinelRef} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', outline: 'none', pointerEvents: 'none' }} />
        {/* Aktif hücre gösterimi */}
        {ikiHucreTekSatir ? (
          <div className="cell-row fit" style={{ '--hucre-sayisi': 2 }}>
            {k.hucreler.map((noktalar, hucreIndex) => (
              <BrailleCell
                key={hucreIndex}
                baslik={`${hucreIndex + 1}`}
                hucreAdi={`${hucreIndex + 1}. hücre`}
                hedefNoktalar={noktalar}
                dogruNoktalar={hucreIndex < guvenliHucreIndeksi ? noktalar : hucreIndex === guvenliHucreIndeksi ? basilanlar : []}
                yanlisNoktalar={hucreIndex === guvenliHucreIndeksi ? yanlis : []}
                tiklanabilir={hucreIndex === guvenliHucreIndeksi}
                kilitli={yonergeOkunuyor}
                onKilitliEtkilesim={yonergeBeklemeUyar}
                onNoktaTikla={noktayaTikla}
                baslikAriaLabel={`${hucreIndex + 1}. hücre, toplam ${hucreSayisi} hücreden`}
              />
            ))}
          </div>
        ) : (
          <div className="aktif-hucre-wrap">
            <BrailleCell
              hedefNoktalar={aktifNoktalar}
              dogruNoktalar={basilanlar}
              yanlisNoktalar={yanlis}
              tiklanabilir
              kilitli={yonergeOkunuyor}
              onKilitliEtkilesim={yonergeBeklemeUyar}
              hucreAdi={hucreSayisi > 1 ? `${guvenliHucreIndeksi + 1}. hücre` : undefined}
              onNoktaTikla={noktayaTikla}
              baslikAriaLabel={hucreSayisi > 1
                ? `${guvenliHucreIndeksi + 1}. hücre, toplam ${hucreSayisi} hücreden`
                : k.yazi}
            />
          </div>
        )}

        {/* Tüm hücrelerin küçük önizlemesi — aktif olan vurgulanır */}
        {hucreSayisi > 1 && !ikiHucreTekSatir && (
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
                    <span
                      key={n}
                      className={`hucre-onizleme-nokta ${noktalar.includes(n) ? 'on' : ''}`}
                    />
                  ))}
                </span>
                <span className="hucre-onizleme-no" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
          </div>
        )}

        {/* Okunuş + anlam */}
        {k.okunus && (
          <div role="status" aria-live="polite"
               style={{ textAlign: 'center', fontSize: '1.15em', color: 'var(--accent)', fontWeight: 700 }}>
            “{k.okunus}”
          </div>
        )}
        {k.anlam && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9em', maxWidth: 560, margin: '0 auto' }}>
            {k.anlam}
          </div>
        )}
      </div>

      <div className="controls">
        <button
className="btn"           type="button"
          aria-label="Tekrar dinle"
          onClick={() => {
            tumSesleriDurdur();

            const sesAktifMi = ogeSesiHerZaman || ogeSesiAktif;
            const tekrarMetni = kelimeYonergeMetniAl(aktif || k);

            if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function' && aktif) {
              ogeSesiCal(aktif);

              if (tekrarSesiTimerRef.current) {
                clearTimeout(tekrarSesiTimerRef.current);
              }

              tekrarSesiTimerRef.current = window.setTimeout(() => {
                yonergeyiKilitleyerekSeslendir(tekrarMetni, { kesintiyle: true });
                tekrarSesiTimerRef.current = null;
              }, ogeSesiSonrasiKonusmaGecikmeMs);

              return;
            }

            yonergeyiKilitleyerekSeslendir(tekrarMetni, { kesintiyle: true });

            if (sesAktifMi && typeof ogeSesiCal === 'function' && aktif) {
              if (tekrarSesiTimerRef.current) {
                clearTimeout(tekrarSesiTimerRef.current);
              }

              tekrarSesiTimerRef.current = window.setTimeout(() => {
                ogeSesiCal(aktif);
                tekrarSesiTimerRef.current = null;
              }, ogeSesiGecikmeMs);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button
          className="btn"
          type="button"
          aria-label="Sıfırla — en başa dön"
          onClick={() => {
            tumSesleriDurdur();
            setIndeks(0);
            setHucreIndeksi(0);
            setBasilanlar([]);
            setYanlis([]);
            konus('En başa dönüldü.');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          <span className="btn-etiket">Sıfırla</span>
        </button>
        {hucreSayisi > 1 ? (
          <>
            <button className="btn" type="button" aria-label="Önceki hücre" disabled={ilkKelime && hucreIndeksi === 0} onClick={oncekiHucre}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
              <span className="btn-etiket">Önceki</span>
            </button>
            <button className="btn" type="button" aria-label={sonHucre ? 'Sıradaki kelimeyi atla' : 'Hücreyi atla'} onClick={sonrakiHucre}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="btn-etiket">Atla</span>
            </button>
          </>
        ) : (
          <>
            <button className="btn" type="button" aria-label="Önceki" disabled={ilkKelime}
                    onClick={() => { tumSesleriDurdur(); setIndeks((i) => Math.max(0, i - 1)); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>
              <span className="btn-etiket">Önceki</span>
            </button>
            <button
              className="btn"
              type="button"
              aria-label="Atla, sonraki"
              onClick={() => {
                tumSesleriDurdur();
                basariBildir('Sıradaki.');
                setTimeout(() => setIndeks((i) => i + 1), 500);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="btn-etiket">Atla</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

