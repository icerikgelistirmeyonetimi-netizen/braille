import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BrailleCell from './BrailleCell.jsx';
import PageHeader from './PageHeader.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir, ekranOkuyucuTemizle, dogruSesi } from '../utils/ses.js';
import { ogrenildiIsaretle, indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';
import { deseniGonder, deseniTemizle, satiriGonder } from '../utils/arduino.js';
import { mevcutSayfaIcinKaynakAnahtar } from '../utils/karisikYazmaKaynaklari.js';

// [1]      + 'dan','dan' → "1. noktadan"
// [1,2]    + 'dan','dan' → "1. ve 2. noktalardan"
// [1,2,4]  + 'dan','dan' → "1., 2. ve 4. noktalardan"
// tekEk: tek nokta eki ('dan','ya'); cogulEk: çoğul eki ('dan','a')
function noktaListesi(nArr, tekEk, cogulEk) {
  if (!nArr || nArr.length === 0) return '';
  if (nArr.length === 1) return `${nArr[0]}. nokta${tekEk}`;
  if (nArr.length === 2) return `${nArr[0]}. ve ${nArr[1]}. noktalar${cogulEk}`;
  const bas = nArr.slice(0, -1).map((n) => `${n}.`).join(', ');
  return `${bas} ve ${nArr[nArr.length - 1]}. noktalar${cogulEk}`;
}

function noktaKompozisyonMetni(oge) {
  const hucreler = Array.isArray(oge.hucreler) && oge.hucreler.length > 0
    ? oge.hucreler
    : [oge.noktalar || []];
  const cok = hucreler.length > 1;
  const parcalar = hucreler
    .map((noktalar, i) => {
      const nArr = noktalar || [];
      if (!nArr.length) return '';
      const liste = noktaListesi(nArr, 'dan', 'dan');
      return cok ? `${i + 1}. hücre ${liste}` : liste;
    })
    .filter(Boolean);
  return parcalar.length ? `${parcalar.join(', ')} oluşur.` : '';
}

/**
 * Bir Braille deseni (örn. bir harf) öğretmek için ortak ekran.
 *
 * Props:
 *  - baslik: string  (sayfa başlığı)
 *  - ogeler: { ad, ariaAd?, noktalar, hucreler?, hucreBasliklari?, hucreAriaEtiketleri?, hucreAdlari?, yonergeDetay? }[]
 *  - kategoriAdi: string
 *  - bolumAnahtari?: string
 *  - bittiMesaji?: string
 *  - noktalariSeslendir?: boolean  (tamYonergeMetni'ne nokta bileşimini ekler)
 */
export default function DesenOgretici({
  baslik,
  ogeler,
  kategoriAdi,
  bolumAnahtari,
  bittiMesaji,
  rtl,
  ogeSesiCal,
  ogeSesiDurdur,
  ogeSesiGecikmeMs = 2600,
  ogeSesiOnceCal = false,
  ogeSesiHerZaman = false,
  ogeSesiSonrasiKonusmaGecikmeMs = 900,
  ilkOgeSesiHariciCalindi = false,
  okumaModundaSadeceOgeSesi = false,
  sesKaydiButonuGoster = false,
  sesKaydiButonEtiketi = 'Ses Kaydını Dinle',
  ustSesKontrolleriGoster = false,
  ustSesButonEtiketi = 'Nota Sesi',
  ustSesButonAriaLabel = 'Nota sesini çal',
  otomatikOgeSesi = false,
  ogeyiSeslendir,
  yonergeyiTekrarla,
  noktalariSeslendir = false,
  seslendirmeDili = 'tr',
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Bu dersin karışık yazma kaynağı (varsa) — bitiş ekranında yazma etkinliğine yönlendirmek için.
  const yazmaKaynak = mevcutSayfaIcinKaynakAnahtar(pathname);
  const konusDil = useCallback((text, opts = {}) => konus(text, { dil: seslendirmeDili, ...opts }), [seslendirmeDili]);

  // Ders her açılışta baştan başlar (kaldığı yerden devam etmez).
  const [indeks, setIndeks] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]); // doğru basılmışlar
  const [yanlis, setYanlis] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const ogeSesiTimerRef = useRef(null);
  const tekrarSesiTimerRef = useRef(null);
  const tebriklerAktif = useRef(false);
  const [ogeSesiAktif, setOgeSesiAktif] = useState(Boolean(otomatikOgeSesi || ogeSesiHerZaman));
  const [okumaModu, setOkumaModu] = useState(false);
  // Yönerge seslendirilirken nokta etkileşimi kilitlenir (tıklama/hover/odak yok).
  const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
  const yonergeNesilRef = useRef(0);
  const yonergeKilitTimerRef = useRef(null);
  const uyariResumeTimerRef = useRef(null);
  const uyariRef = useRef(null);
  const uyariFocusIstek = useRef(false);
  const dotSentinelRef = useRef(null);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? ogeler.filter((o) => kayitliAdlar.includes(o.ad))
    : ogeler;

  const aktifOge = aktifListe[indeks];
  const bitti = indeks >= aktifListe.length;
  const aktifHucreler = useMemo(() => {
    if (!aktifOge) return [];
    if (Array.isArray(aktifOge.hucreler) && aktifOge.hucreler.length > 0) return aktifOge.hucreler;
    return [aktifOge.noktalar || []];
  }, [aktifOge]);
  const cokHucreli = aktifHucreler.length > 1;
  const aktifAdimlar = useMemo(() => aktifHucreler.flatMap((noktalar, hucreIndex) =>
    (noktalar || []).map((n) => ({
      hucreIndex,
      n,
      key: `${hucreIndex}:${n}`
    }))
  ), [aktifHucreler]);

  const hucreAdi = (hucreIndex) =>
    aktifOge?.hucreAdlari?.[hucreIndex] || (cokHucreli ? `${hucreIndex + 1}. hücre` : 'hücre');
  const adimMetni = (adim) => {
    if (!adim || adim.n === undefined || adim.n === null) return 'sıradaki nokta';
    return cokHucreli
      ? `${hucreAdi(adim.hucreIndex)} ${adim.n} numara`
      : `${adim.n} numara`;
  };

  // Menüdeki ilerleme göstergesi için yalnızca en uzak ulaşılan öğeyi kaydet
  // (ders baştan başlasa da ilerleme kaybolmasın). Kayıtlılar modunda kaydetme.
  useEffect(() => {
    if (bolumAnahtari && !kayitlilarModu && indeks > indeksAl(bolumAnahtari)) {
      indeksKaydet(bolumAnahtari, indeks);
    }
  }, [indeks, bolumAnahtari, kayitlilarModu]);

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
  const oncekiYonergeOkunuyorRef = useRef(false);
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
    // yonergeBeklemeUyar her render'da yeniden oluşur ama yalnızca kararlı
    // referanslar (setToast, speechSynthesis) kullandığından yakalanması güvenli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yonergeOkunuyor]);

  const gosterToast = (mesaj) => {
    clearTimeout(toastTimerRef.current);
    setToast(mesaj);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
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

  // Yönergeyi seslendirirken noktaları kilitler; seslendirme bitince açar.
  // onSon (utterance sonu) ana sinyaldir; güvenlik için bir zaman aşımı da var
  // (ses kapalı/kesinti durumunda kilit takılı kalmasın).
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
    konusDil(metin, { ...secenek, onSon: () => yonergeKilidiAc(nesil) });
  };

  const modDegistir = (kayitlilar) => {
    setKayitlilarModu(kayitlilar);
    setIndeks(0);
    setBasilanlar([]);
    setYanlis([]);
  };

  const kaydetSonra = () => {
    if (bitti || !aktifOge) return;
    const kaydedildi = sonraOgrenAl(anahtar).includes(aktifOge.ad);
    if (kaydedildi) {
      sonraOgrenKaldir(anahtar, aktifOge.ad);
      konusDil('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, aktifOge.ad);
      konusDil('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

  const okumaModunaGec = () => {
    tumSesleriDurdur();
    setOkumaModu(true);
  };

  const okumaOgesiSec = (orijinalIndeks) => {
    setKayitlilarModu(false);
    setIndeks(orijinalIndeks);
    setBasilanlar([]);
    setYanlis([]);
    setOkumaModu(false);
  };

  const yonergeMetni = useMemo(() => {
    if (bitti) return bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!';
    const kalan = aktifAdimlar.filter((adim) => !basilanlar.includes(adim.key));
    if (kalan.length === aktifAdimlar.length) {
      if (aktifOge.tamYonergeMetni) {
        const komp = noktalariSeslendir ? noktaKompozisyonMetni(aktifOge) : '';
        return komp
          ? `${aktifOge.tamYonergeMetni} ${komp} Lütfen bu noktalara sırayla dokunun.`
          : aktifOge.tamYonergeMetni;
      }

      const ad = aktifOge.ariaAd || aktifOge.ad;
      const adKategori = ad.trimEnd().endsWith(kategoriAdi) ? ad : `${ad} ${kategoriAdi}`;
      const ek = aktifOge.aciklama ? ` ${aktifOge.aciklama}` : '';
      const _nArr = aktifOge.noktalar || [];
      const detay = aktifOge.yonergeDetay || `${noktaListesi(_nArr, 'dan', 'dan')} oluşur.`;
      return `${adKategori}, ${detay}${ek} Lütfen bu noktalara sırayla dokunun.`;
    }
    if (kalan.length === 0) {
      return 'Tamamlandı. Bir sonraki öğeye geçiliyor.';
    }
    return `Sıradaki nokta: ${adimMetni(kalan[0])}.`;
  }, [aktifAdimlar, aktifOge, basilanlar, bitti, bittiMesaji, kategoriAdi, noktalariSeslendir]);

  console.log('DESEN OGRETICI PROPS', {
    baslik,
    bolumAnahtari,
    kategoriAdi,
    ogeSesiCalTipi: typeof ogeSesiCal,
  });

  useEffect(() => {
    // Yeni öğeye geçişte intro'yu seslendir.
    if (bitti) {
      yonergeNesilRef.current += 1; // bekleyen kilit açmalarını geçersiz kıl
      setYonergeOkunuyor(false);
      // JSX'teki <div role="status" aria-live="polite"> tebrikler metnini NVDA'ya duyuruyor.
      // _srBolge'yi temizle (basariBildir'in bıraktığı içerik) ve TTS için konuş ama
      // tekrar _srBolge'ye yazma — aksi hâlde "Ana sayfaya dön" sonrasında çift okunur.
      ekranOkuyucuTemizle();
      const tebrik = bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!';
      const yazmaDavet = (yazmaKaynak && !(kayitlilarModu && aktifListe.length === 0))
        ? ' Şimdi yazma zamanı! Öğrendiklerinizi karışık yazma etkinliğinde uygulayabilirsiniz.'
        : '';
      konusDil(tebrik + yazmaDavet, { srAtla: true });
      return;
    }
    const oge = aktifListe[indeks];
    if (!oge) return undefined;

    // Yeni öğe yüklendi: yönerge okunana kadar noktalar kilitli.
    // Nesli artır ki önceki öğenin bekleyen kilit-açma zamanlayıcıları
    // yeni öğeyi yanlışlıkla açmasın.
    yonergeNesilRef.current += 1;
    if (yonergeKilitTimerRef.current) {
      clearTimeout(yonergeKilitTimerRef.current);
      yonergeKilitTimerRef.current = null;
    }
    setYonergeOkunuyor(true);

    const ad = oge.ariaAd || oge.ad;
    const adKategori = ad.trimEnd().endsWith(kategoriAdi) ? ad : `${ad} ${kategoriAdi}`;
    const _nArr = oge.noktalar || [];
    const detay = oge.yonergeDetay || `${noktaListesi(_nArr, 'dan', 'dan')} oluşur.`;
    const ek = oge.aciklama ? ` ${oge.aciklama}` : '';

    const girisKomp = oge.tamYonergeMetni && noktalariSeslendir ? noktaKompozisyonMetni(oge) : '';
    const giris = oge.tamYonergeMetni
      ? (girisKomp
          ? `${oge.tamYonergeMetni} ${girisKomp} Lütfen bu noktalara sırayla dokunun.`
          : oge.tamYonergeMetni)
      : `${adKategori}, ${detay} Lütfen bu noktalara sırayla dokunun.${ek}`;
    const gecikme = tebriklerAktif.current ? 1100 : 250;
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
      if (!ilkSesZatenCalindi) {
        ogeSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(oge);
        }, gecikme);
      }

      konusmaTimer = window.setTimeout(() => {
        tebriklerAktif.current = false;
        yonergeyiKilitleyerekSeslendir(giris, { kesintiyle: false });
      }, gecikme + ogeSesiSonrasiKonusmaGecikmeMs);
    } else {
      konusmaTimer = window.setTimeout(() => {
        tebriklerAktif.current = false;
        yonergeyiKilitleyerekSeslendir(giris, { kesintiyle: false });
      }, gecikme);

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        ogeSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(oge);
          ogeSesiTimerRef.current = null;
        }, gecikme + ogeSesiGecikmeMs);
      }
    }

    const tekrar = () => {
      tebriklerAktif.current = false;

      if (tekrarSesiTimerRef.current) {
        clearTimeout(tekrarSesiTimerRef.current);
        tekrarSesiTimerRef.current = null;
      }

      if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function') {
        ogeSesiCal(oge);

        tekrarSesiTimerRef.current = window.setTimeout(() => {
          yonergeyiKilitleyerekSeslendir(giris, { kesintiyle: true });
          tekrarSesiTimerRef.current = null;
        }, ogeSesiSonrasiKonusmaGecikmeMs);
        return;
      }

      yonergeyiKilitleyerekSeslendir(giris, { kesintiyle: true });

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        tekrarSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(oge);
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
    kayitlilarModu,
    bitti,
    bittiMesaji,
    aktifListe,
    kategoriAdi,
    ogeSesiCal,
    ogeSesiAktif,
    ogeSesiHerZaman,
    ogeSesiOnceCal,
    ogeSesiGecikmeMs,
    ogeSesiSonrasiKonusmaGecikmeMs,    ilkOgeSesiHariciCalindi,    yazmaKaynak,    noktalariSeslendir,  ]);

  // Yeni öğe geldiğinde durumu sıfırla
  useEffect(() => {
    setBasilanlar([]);
    setYanlis([]);
  }, [indeks]);

  // Ekrandaki desen değiştikçe Arduino'ya gönder (bağlı değilse sessizce yok sayılır).
  useEffect(() => {
    if (bitti) {
      deseniTemizle();
      return;
    }
    if (aktifOge && aktifHucreler.length) {
      if (aktifHucreler.length > 1) satiriGonder(aktifHucreler);
      else deseniGonder(aktifHucreler[0]);
    }
    return () => { deseniTemizle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, bitti, aktifHucreler]);

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          {baslik && <PageHeader baslik={baslik} />}
          <div className="progress" aria-hidden="true">
            Okuma modu: {ogeler.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik={baslik || 'Öğrenme'}
            ogeler={ogeler}
            rtl={rtl}
            getEtiket={(oge) => oge.ad}
            getAltEtiket={(oge) => (oge.ariaAd && oge.ariaAd !== oge.ad ? oge.ariaAd : oge.aciklama)}
            getHucreler={(oge) => (Array.isArray(oge.hucreler) && oge.hucreler.length > 0 ? oge.hucreler : (oge.noktalar || []))}
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
    const bosKayitli = kayitlilarModu && aktifListe.length === 0;
    const yazmayaYonlendir = yazmaKaynak && !bosKayitli;
    return (
      <div className="page">
        {baslik && <PageHeader baslik={baslik} />}
        <div className="page-mid">
          <div className="instruction success" role="status" aria-live="polite">
            {bosKayitli
              ? 'Bu bölümde henüz kaydedilmiş öğe yok.'
              : (bittiMesaji || 'Tebrikler, tüm öğeleri tamamladınız!')}
          </div>
          {yazmayaYonlendir && (
            <div style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '1.1em', marginTop: 4 }}>
              Şimdi yazma zamanı! Öğrendiklerinizi karışık yazma etkinliğinde uygulayın.
            </div>
          )}
        </div>
        <div className="controls">
          {yazmayaYonlendir && (
            <button
              className="btn aktif"
              type="button"
              onClick={() => {
                konusmayiDurdur();
                konusDil('Karışık yazma etkinliği başlıyor.', { kesintiyle: true });
                navigate('/yazma-karisik/' + yazmaKaynak);
              }}
              aria-label="Karışık yazma etkinliğine geç"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><path d="M3 21l3-1 11-11-2-2L4 18l-1 3z"/><path d="M14 6l4 4"/></svg>
              <span className="btn-etiket">Karışık Yazma Etkinliği</span>
            </button>
          )}
          {kayitlilarModu
            ? <button className="btn" type="button" onClick={() => modDegistir(false)}>Tüm Listeye Dön</button>
            : <button className="btn" type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>}
        </div>
      </div>
    );
  }

  const noktayaTikla = (n, hucreIndex = 0) => {
    const tiklananKey = `${hucreIndex}:${n}`;
    if (basilanlar.includes(tiklananKey)) return;
    const beklenenSiradaki = aktifAdimlar[basilanlar.length];
    if (!beklenenSiradaki || n !== beklenenSiradaki.n || hucreIndex !== beklenenSiradaki.hucreIndex) {
      setYanlis([tiklananKey]);
      const hucredeVar = aktifHucreler[hucreIndex]?.includes(n);
      hataBildir(hucredeVar ? `Sıra yanlış. Önce ${adimMetni(beklenenSiradaki)}.` : `${adimMetni({ hucreIndex, n })} yanlış. Tekrar deneyin.`);
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, beklenenSiradaki.key];
    setBasilanlar(yeni);
    const tamamMi = yeni.length === aktifAdimlar.length;
    if (tamamMi) {
      if (bolumAnahtari) ogrenildiIsaretle(bolumAnahtari, aktifOge.ad);
      tumSesleriDurdur();
      tebriklerAktif.current = true;
      basariBildir('Tebrikler!');
      setTimeout(() => setIndeks((i) => i + 1), 800);
    } else {
      konusDil(`Doğru. Sıradaki nokta: ${adimMetni(aktifAdimlar[yeni.length])}.`);
    }
  };

  const hucreNoktalari = (anahtarlar, hucreIndex) => anahtarlar
    .filter((anahtar) => anahtar.startsWith(`${hucreIndex}:`))
    .map((anahtar) => Number(anahtar.split(':')[1]));

  return (
    <div className="page">
      {toast && <div ref={uyariRef} className="toast" aria-live="assertive" tabIndex={-1}>{toast}</div>}
      <div>
        {baslik && <PageHeader baslik={baslik} />}
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {aktifListe.length}
        </div>
        {sesKaydiButonuGoster && typeof ogeSesiCal === 'function' && aktifOge && (
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
                ogeSesiCal(aktifOge);
              }}
              aria-label={sesKaydiButonEtiketi}
            >
              🔊
              <span className="btn-etiket">{sesKaydiButonEtiketi}</span>
            </button>
          </div>
        )}
        {ustSesKontrolleriGoster && typeof ogeSesiCal === 'function' && aktifOge && (
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
                setOgeSesiAktif(true);
                if (aktifOge) {
                  ogeSesiCal(aktifOge);
                }
              }}
              aria-label={ustSesButonAriaLabel}
            >
              🔊
              <span className="btn-etiket">{ustSesButonEtiketi}</span>
            </button>

            <button
className="btn"               type="button"
              onClick={() => {
                tumSesleriDurdur();
                setOgeSesiAktif(true);

                if (typeof yonergeyiTekrarla === 'function') {
                  yonergeyiTekrarla();

                  if (tekrarSesiTimerRef.current) {
                    clearTimeout(tekrarSesiTimerRef.current);
                  }

                  tekrarSesiTimerRef.current = window.setTimeout(() => {
                    if (aktifOge) ogeSesiCal(aktifOge);
                    tekrarSesiTimerRef.current = null;
                  }, ogeSesiGecikmeMs);

                  return;
                }

                if (typeof ogeyiSeslendir === 'function' && aktifOge) {
                  ogeyiSeslendir(aktifOge, { kesintiyle: true });
                  window.setTimeout(() => {
                    if (aktifOge) ogeSesiCal(aktifOge);
                  }, ogeSesiGecikmeMs);
                  return;
                }

                if (aktifOge) {
                  window.setTimeout(() => ogeSesiCal(aktifOge), ogeSesiGecikmeMs);
                }
              }}
              aria-label="Bu öğeyi dinle"
            >
              Dinle
            </button>
          </div>
        )}
        {kayitliSayisi > 0 && (
          <div className="banner-grup-secim" style={{ margin: '4px 0 0' }}>
            <button type="button" className={`btn ${!kayitlilarModu ? 'aktif' : ''}`} aria-pressed={!kayitlilarModu} onClick={() => modDegistir(false)}>Tümü</button>
            <button type="button" className={`btn ${kayitlilarModu ? 'aktif' : ''}`} aria-pressed={kayitlilarModu} onClick={() => modDegistir(true)}>Kayıtlılar ({kayitliSayisi})</button>
          </div>
        )}
      </div>

      <div className="page-mid">
        <div className="ders-eylem-satiri">
          <OkumaModuButonu onClick={okumaModunaGec} />
          <button
            type="button"
            className={`btn sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(aktifOge?.ad) ? ' kaydedildi' : ''}`}
            onClick={kaydetSonra}
            aria-label="Daha sonra öğren listesine kaydet"
            title="Daha sonra öğren"
          >
            <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0
          }}
        >
          {yonergeMetni}
        </div>
        <span ref={dotSentinelRef} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', outline: 'none', pointerEvents: 'none' }} />
        {cokHucreli ? (
          <div className="cell-row fit" style={{ '--hucre-sayisi': aktifHucreler.length }}>
            {aktifHucreler.map((noktalar, hucreIndex) => (
              <BrailleCell
                key={hucreIndex}
                baslik={aktifOge.hucreBasliklari?.[hucreIndex] || (hucreIndex + 1).toString()}
                baslikAriaLabel={aktifOge.hucreAriaEtiketleri?.[hucreIndex] || hucreAdi(hucreIndex)}
                hucreAdi={`${hucreIndex + 1}. hücre`}
                baslikStyle={rtl ? { fontFamily: "'Amasya', serif", direction: 'rtl' } : undefined}
                tiklanabilir
                kilitli={yonergeOkunuyor}
                onKilitliEtkilesim={yonergeBeklemeUyar}
                onNoktaTikla={(n) => noktayaTikla(n, hucreIndex)}
                hedefNoktalar={noktalar}
                dogruNoktalar={hucreNoktalari(basilanlar, hucreIndex)}
                yanlisNoktalar={hucreNoktalari(yanlis, hucreIndex)}
              />
            ))}
          </div>
        ) : (
          <BrailleCell
            baslik={aktifOge.ad}
            baslikAriaLabel={aktifOge.ariaAd || aktifOge.ad}
            baslikStyle={rtl ? { fontFamily: "'Amasya', serif", direction: 'rtl' } : undefined}
            tiklanabilir
            kilitli={yonergeOkunuyor}
            onKilitliEtkilesim={yonergeBeklemeUyar}
            onNoktaTikla={(n) => noktayaTikla(n, 0)}
            hedefNoktalar={aktifHucreler[0] || []}
            dogruNoktalar={hucreNoktalari(basilanlar, 0)}
            yanlisNoktalar={hucreNoktalari(yanlis, 0)}
          />
        )}
        {aktifOge.altMetin && (
          <div aria-hidden="true" style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
            {aktifOge.altMetin}
          </div>
        )}
        {aktifOge.altMetinAciklama && (
          <div aria-hidden="true" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 520 }}>
            {aktifOge.altMetinAciklama}
          </div>
        )}
        {aktifOge.ekBilgi && (
          <div className="isaret-metin-alti" aria-live="polite" style={{ width: '100%', maxWidth: 520 }}>
            {aktifOge.ekBilgi.aciklama && (
              <p style={{ margin: '0 0 0.75em 0' }}>{aktifOge.ekBilgi.aciklama}</p>
            )}
            {aktifOge.ekBilgi.kurallar?.length > 0 && (
              <>
                <strong>Kullanıldığı yerler:</strong>
                <ul style={{ margin: '0.3em 0 0.8em 1.2em', padding: 0 }}>
                  {aktifOge.ekBilgi.kurallar.map((kr, i) => (
                    <li key={i} style={{ marginBottom: '0.3em' }}>{kr}</li>
                  ))}
                </ul>
              </>
            )}
            {aktifOge.ekBilgi.ornekler?.length > 0 && (
              <>
                <strong>Örnek:</strong>
                <ul style={{ margin: '0.3em 0 0 1.2em', padding: 0 }}>
                  {aktifOge.ekBilgi.ornekler.map((o, i) => (
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
          onClick={() => {
            tumSesleriDurdur();

            const sesAktifMi = ogeSesiHerZaman || ogeSesiAktif;

            if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function' && aktifOge) {
              ogeSesiCal(aktifOge);

              if (tekrarSesiTimerRef.current) {
                clearTimeout(tekrarSesiTimerRef.current);
              }
              tekrarSesiTimerRef.current = window.setTimeout(() => {
                yonergeyiKilitleyerekSeslendir(yonergeMetni, { kesintiyle: true });
                tekrarSesiTimerRef.current = null;
              }, ogeSesiSonrasiKonusmaGecikmeMs);
              return;
            }

            yonergeyiKilitleyerekSeslendir(yonergeMetni, { kesintiyle: true });

            if (sesAktifMi && typeof ogeSesiCal === 'function' && aktifOge) {
              if (tekrarSesiTimerRef.current) {
                clearTimeout(tekrarSesiTimerRef.current);
              }
              tekrarSesiTimerRef.current = window.setTimeout(() => {
                ogeSesiCal(aktifOge);
                tekrarSesiTimerRef.current = null;
              }, ogeSesiGecikmeMs);
            }
          }}
          aria-label="Yönergeyi tekrar dinle"
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
            setBasilanlar([]);
            setYanlis([]);
            konusDil('En başa dönüldü.');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          <span className="btn-etiket">Sıfırla</span>
        </button>
        <button
          className="btn"
          type="button"
          aria-label="Önceki öğe"
          disabled={indeks === 0}
          onClick={() => {
            tumSesleriDurdur();
            setIndeks((i) => Math.max(i - 1, 0));
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
          <span className="btn-etiket">Önceki öğe</span>
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => {
            tumSesleriDurdur();
            setIndeks((i) => Math.min(i + 1, aktifListe.length));
          }}
          aria-label="Sonraki öğe"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          <span className="btn-etiket">Sonraki öğe</span>
        </button>
      </div>
    </div>
  );
}
