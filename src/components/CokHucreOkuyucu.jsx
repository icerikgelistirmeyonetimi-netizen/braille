import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, basariBildir, hataBildir, konusmayiDurdur, ekranOkuyucuTemizle, dogruSesi, yanlisSesi } from '../utils/ses.js';
import { ogrenildiIsaretle, indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';
import { deseniGonder, deseniTemizle, satiriGonder } from '../utils/arduino.js';
import { mevcutSayfaIcinKaynakAnahtar } from '../utils/karisikYazmaKaynaklari.js';
import { noktaListesi } from '../utils/noktaYardimci.js';

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
  // DesenOgretici-style props
  noktalariSeslendir = false,
  kategoriAdi = '',
  seslendirmeDili = 'tr',
  otomatikOgeSesi = false,
  ustSesKontrolleriGoster = false,
  ustSesButonEtiketi = 'Ses',
  ustSesButonAriaLabel = 'Sesi çal',
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const yazmaKaynak = mevcutSayfaIcinKaynakAnahtar(pathname);
  const konusDil = useCallback((text, opts = {}) => konus(text, { dil: seslendirmeDili, ...opts }), [seslendirmeDili]);
  // Ekran okuyucu (NVDA) otomatik dil değiştirme: yabancı dil sayfalarında (Modül 9 de/fr/en)
  // yabancı içerik (harf/sözcük) lang ile işaretlenir → NVDA o kısmı o dilin sesiyle okur;
  // Türkçe yönergeler lang taşımaz, tr (sayfa varsayılanı) kalır. Türkçe sayfalar (tr) etkilenmez.
  const yabanciDil = seslendirmeDili !== 'tr' ? seslendirmeDili : null;

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
  const [ogeSesiAktif, setOgeSesiAktif] = useState(Boolean(otomatikOgeSesi || ogeSesiHerZaman));
  const [okumaModu, setOkumaModu] = useState(false);
  // Yönerge seslendirilirken nokta etkileşimi kilitlenir (tıklama/hover/odak/klavye yok).
  const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
  // Ekran okuyucu için: yönerge KALICI bölgede durur (kaybolmaz); "sıradaki nokta"
  // AYRI canlı bölgede güncellenir (her dokunuşta eskisiyle yer değiştirir). Görsel YOK.
  const [srYonergeMetni, setSrYonergeMetni] = useState('');
  // Yönerge aria-live bölgesini her seslendirmede (yeni öğe VE "Tekrar") yeniden
  // duyurmak için nonce: aynı metinde bile içerik değişsin → NVDA tekrar okur.
  const [yonergeNonce, setYonergeNonce] = useState(0);
  const [srSiradakiNokta, setSrSiradakiNokta] = useState('');
  const yonergeNesilRef = useRef(0);
  const yonergeKilitTimerRef = useRef(null);
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
    if (oge.tamYonergeMetni) return oge.tamYonergeMetni;

    const hucreler = Array.isArray(oge.hucreler) ? oge.hucreler : [];
    const cokHucre = hucreler.length > 1;
    const ilkHucre = Array.isArray(hucreler[0]) ? hucreler[0] : (hucreler[0] != null ? [hucreler[0]] : []);

    // Sembol öğretme modu (kategoriAdi verilmişse — eski DesenOgretici davranışı)
    if (kategoriAdi) {
      const ttsBaşlık = oge.ttsYazi || oge.yazi || '';
      const adKategori = ttsBaşlık.trimEnd().endsWith(kategoriAdi)
        ? ttsBaşlık
        : `${ttsBaşlık} ${kategoriAdi}`;
      const anlamKismi = oge.anlam ? ` ${oge.anlam}` : '';
      const aciklamaKismi = oge.aciklama ? ` ${oge.aciklama}` : '';
      if (noktalariSeslendir) {
        const kompozisyon = hucreler.map((noktalar, i) => {
          const nArr = noktalar || [];
          if (!nArr.length) return '';
          const liste = noktaListesi(nArr, 'dan', 'dan');
          return cokHucre ? `${i + 1}. hücre ${liste}` : liste;
        }).filter(Boolean).join(', ');
        const komp = kompozisyon ? `${kompozisyon} oluşur.` : '';
        return `${adKategori},${anlamKismi}${aciklamaKismi} ${komp} Lütfen bu noktalara sırayla dokunun.`.replace(/\s+/g, ' ').trim();
      }
      const detay = oge.yonergeDetay
        || (ilkHucre.length ? `${noktaListesi(ilkHucre, 'dan', 'dan')} oluşur.` : '');
      return `${adKategori},${anlamKismi}${aciklamaKismi} ${detay} Lütfen bu noktalara sırayla dokunun.`.replace(/\s+/g, ' ').trim();
    }

    // Kelime okuma modu (eski CokHucreOkuyucu davranışı)
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
  }, [sadeceHucreYonergesiOku, yonergeFormati, kategoriAdi, noktalariSeslendir]);

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
    const maxMs = Math.min(30000, 6000 + (metin ? metin.length : 0) * 200);
    yonergeKilitTimerRef.current = setTimeout(() => yonergeKilidiAc(nesil), maxMs);
    // Ekran okuyucu: yönergeyi _srBolge'ye YAZMA (srAtla) — düz metin lang taşıyamaz +
    // "Başla" anında üzerine yazardı. Bunun yerine bileşenin aria-live yönerge bölgesi
    // (lang span'li) duyurur. Yeni öğede metin zaten değiştiği için bölge bir kez okur;
    // nonce SADECE "Tekrar"da (aynı metin) bump edilir → çift-okuma olmaz.
    konusDil(metin, { srAtla: true, ...secenek, onSon: () => yonergeKilidiAc(nesil) });
  };

  // Yönerge okunurken kullanıcı bir noktaya dokunmaya çalışırsa: sadece uyar,
  // TTS kesintisiz devam eder.
  const yonergeBeklemeUyar = () => {
    gosterToast('Yönerge bitmesini bekleyiniz.');
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
      konusDil('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, aktif.yazi);
      konusDil('Sonra öğren listesine kaydedildi.');
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
      ekranOkuyucuTemizle();
      const yazmaDavet = yazmaKaynak
        ? ' Şimdi yazma zamanı! Öğrendiklerinizi karışık yazma etkinliğinde uygulayabilirsiniz.'
        : '';
      konusDil(bittiMesaji + yazmaDavet, { srAtla: true });
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
    // Ekran okuyucu: yönergeyi KALICI bölgeye yaz (hep okunabilir kalır) + yeni öğe/hücreye
    // geçince "sıradaki nokta" bölgesini temizle (eski yönlendirme kalmasın).
    setSrYonergeMetni(metin);
    setSrSiradakiNokta('');
    const sesOncesiYonergeMetni = typeof k.sesOncesiYonergeMetni === 'string'
      ? k.sesOncesiYonergeMetni.trim()
      : '';
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

      const sesiCalSonraYonergeyiOku = () => {
        if (!ilkSesZatenCalindi) {
          ogeSesiCal(k, { onEnded: yonergeyiOku });
          // Güvenlik: onEnded gelmezse (ör. ses çalınamazsa) en geç ~5 sn sonra oku.
          konusmaTimer = window.setTimeout(yonergeyiOku, 5000);
          return;
        }
        // İlk öğe sesi haricen çalındı: yönergeyi kısa gecikmeyle oku.
        konusmaTimer = window.setTimeout(yonergeyiOku, gecikme + ogeSesiSonrasiKonusmaGecikmeMs);
      };

      if (sesOncesiYonergeMetni) {
        konusmaTimer = window.setTimeout(() => {
          konus(sesOncesiYonergeMetni, {
            kesintiyle: true,
            onSon: sesiCalSonraYonergeyiOku
          });
        }, gecikme);
      } else if (!ilkSesZatenCalindi) {
        ogeSesiTimerRef.current = window.setTimeout(sesiCalSonraYonergeyiOku, gecikme);
      } else {
        sesiCalSonraYonergeyiOku();
      }
    } else {
      const anaYonergeyiOku = () => {
        yonergeyiKilitleyerekSeslendir(metin);
      };

      konusmaTimer = window.setTimeout(() => {
        if (sesOncesiYonergeMetni) {
          konus(sesOncesiYonergeMetni, {
            kesintiyle: true,
            onSon: anaYonergeyiOku
          });
          return;
        }
        anaYonergeyiOku();
      }, gecikme);

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        ogeSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(k);
          ogeSesiTimerRef.current = null;
        }, gecikme + ogeSesiGecikmeMs);
      }
    }

    const tekrar = () => {
      // Tekrar: yönerge metni AYNI kaldığından aria-live bölgesi kendiliğinden
      // yeniden okumaz; nonce'u değiştirerek NVDA'nın tekrar okumasını sağla.
      setYonergeNonce((n) => n + 1);
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
        const sesiCalSonraTekrarOku = () => {
          ogeSesiCal(k, { onEnded: tekrarOku });
          // Güvenlik: onEnded gelmezse en geç ~5 sn sonra oku.
          tekrarSesiTimerRef.current = window.setTimeout(tekrarOku, 5000);
        };
        if (sesOncesiYonergeMetni) {
          konus(sesOncesiYonergeMetni, {
            kesintiyle: true,
            onSon: sesiCalSonraTekrarOku
          });
        } else {
          sesiCalSonraTekrarOku();
        }
        return;
      }

      const anaYonergeyiTekrarOku = () => {
        yonergeyiKilitleyerekSeslendir(metin, { kesintiyle: true });
      };

      if (sesOncesiYonergeMetni) {
        konus(sesOncesiYonergeMetni, {
          kesintiyle: true,
          onSon: anaYonergeyiTekrarOku
        });
      } else {
        anaYonergeyiTekrarOku();
      }

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
    const hucreEtiketi = aktif?.hucreAdlari?.[hucreIndeksi] || `${hucreIndeksi + 1}. hücre`;
    yonergeyiKilitleyerekSeslendir(
      `${hucreEtiketi}: ${noktaListesi(noktalar, 'ya', 'a')} dokunun.`,
      { kesintiyle: true, dil: seslendirmeDili }
    );
  }, [hucreIndeksi, indeks, aktif, bitti, ogeSesiDurdur]);

  useEffect(() => () => konusmayiDurdur(), []);

  // Bileşen kaldırılırken yönerge kilit zamanlayıcısını temizle.
  useEffect(() => () => {
    if (yonergeKilitTimerRef.current) clearTimeout(yonergeKilitTimerRef.current);
  }, []);



  // Arduino: ekrandaki desen değiştikçe gönder (bağlı değilse sessizce yoksayılır).
  useEffect(() => {
    if (bitti) { deseniTemizle(); return; }
    if (aktif?.hucreler?.length) {
      if (aktif.hucreler.length > 1) satiriGonder(aktif.hucreler);
      else deseniGonder(aktif.hucreler[0] || []);
    }
    return () => { deseniTemizle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, bitti]);

  // Narrasyon bitince görünmez sentinel'e odaklan; Tab → ilk nokta.
  useEffect(() => {
    const onceki = oncekiYonergeOkunuyorRef.current;
    oncekiYonergeOkunuyorRef.current = yonergeOkunuyor;
    if (!(onceki && !yonergeOkunuyor)) return undefined;
    if (okumaModu || bitti) return undefined;
    // "Başla" _srBolge'ye YAZILMAZ (srAtla) — yoksa aria-live yönerge bölgesini ezerdi.
    // App TTS açıkken yine sesli söylenir; NVDA için yönerge bölgesi yeterli cue'dur.
    konusDil('Başla', { srAtla: true });
    // Yönerge bitince odağı BOŞ sentinel yerine İLK BRAILLE NOKTASINA ver (kullanıcı:
    // "yönerge bitince boş diyor; orada braille noktalarını saymalı"): NVDA boş gizli
    // span'i "boş" diye okuyordu → artık basılacak nokta ("1. nokta…") okunur, kullanıcı
    // doğrudan noktanın üzerine konumlanır. Nokta yoksa sentinel'e düş (eski davranış).
    const id = window.requestAnimationFrame(() => {
      const kok = dotSentinelRef.current?.parentElement;
      const ilkNokta = kok?.querySelector('button.dot.target') || kok?.querySelector('button.dot');
      (ilkNokta || dotSentinelRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [yonergeOkunuyor, okumaModu, bitti, konusDil]);

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
            seslendirmeDili={seslendirmeDili}
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
    const bosKayitli = kayitlilarModu && aktifListe.length === 0;
    const yazmayaYonlendir = yazmaKaynak && !bosKayitli;
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="assertive" style={{ margin: 0 }}>
            {bosKayitli ? 'Bu bölümde henüz kaydedilmiş öğe yok.' : bittiMesaji}
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
      if (bolumAnahtari && aktif) ogrenildiIsaretle(bolumAnahtari, aktif.yazi);
      basariBildir('Sıradaki kelime.');
      setTimeout(() => setIndeks((i) => i + 1), 500);
    } else {
      setHucreIndeksi((i) => i + 1);
    }
  };

  // Tüm dokunuş geri-bildirimleri (doğru/yanlış/sıradaki nokta/tamamlandı) TEK assertive
  // durum bölgesinden geçer → ekran okuyucu OTOMATİK okur (odak taşımadan, dokunma akışı
  // bozulmadan). TTS srAtla ile (çift duyuru yok — bölge _srBolge'ye yazmaz). Opsiyonel ses.
  const srDurumDuyur = (mesaj, ses) => {
    if (ses === 'dogru') dogruSesi();
    else if (ses === 'yanlis') yanlisSesi();
    setSrSiradakiNokta(mesaj);
    konusDil(mesaj, { srAtla: true });
  };

  const noktayaTikla = (n) => {
    if (basilanlar.includes(n)) return;
    if (n !== aktifNoktalar[basilanlar.length]) {
      // YANLIŞ → otomatik okunan durum bölgesi + yanlış sesi.
      setYanlis([n]);
      srDurumDuyur(
        aktifNoktalar.includes(n)
          ? `Yanlış. Sıra yanlış, önce ${aktifNoktalar[basilanlar.length]} numaraya basın.`
          : `Yanlış. ${n} numara bu hücrede yok.`,
        'yanlis',
      );
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    if (yeni.length < aktifNoktalar.length) {
      // DOĞRU ama hücrede başka nokta var → DOĞRU SESİ (ding) + yalnız "sıradaki nokta".
      // ⚠ "Doğru" SÖZCÜĞÜ KALDIRILDI (kullanıcı: "sıradaki nokta yönergesinden sonra bir
      // önceki doğru cevap için doğru diyor"): mesaj "Doğru" ile başlayıp her dokunuşta
      // tekrarlanıyordu; hızlı dokununca NVDA kuyruğu önceki dokunuşun "Doğru"sunu GEÇ
      // okuyup karıştırıyordu. Ses olumlu onayı verir (kuyruksuz), metin kısalır → gecikme yok.
      srDurumDuyur(`Sıradaki nokta: ${aktifNoktalar[yeni.length]} numara.`, 'dogru');
      return;
    }
    // Hücre tamamlandı.
    if (!sonHucre) {
      // Öğede başka hücre var → ses + kısa duyuru (yine "Doğru" sözcüğü yok) + sonraki hücre.
      srDurumDuyur('Sonraki hücreye geçiliyor.', 'dogru');
      setTimeout(() => setHucreIndeksi((i) => i + 1), 900);
      return;
    }
    // ÖĞE tamamlandı → "Tebrikler" (HEMEN değişme) → "Sonraki öğe" → SONRA geçiş (kullanıcı isteği).
    if (bolumAnahtari && aktif) ogrenildiIsaretle(bolumAnahtari, aktif.yazi);
    const sonOge = indeks >= aktifListe.length - 1;
    // "doğru" sözcüğü çıkarıldı (kullanıcı şikâyeti: gecikmeli "doğru"); ses + "Tebrikler" yeterli.
    srDurumDuyur('Tebrikler! Öğeyi tamamladınız.', 'dogru');
    setTimeout(() => {
      if (sonOge) {
        setIndeks((i) => i + 1); // son öğe → bitti ekranı (bittiMesaji okunur)
      } else {
        srDurumDuyur('Sonraki öğe.');
        setTimeout(() => setIndeks((i) => i + 1), 1200);
      }
    }, 1500);
  };

    return (
      <div className="page">
        {toast && <div className="toast" aria-live="off">{toast}</div>}
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            İlerleme: {indeks + 1} / {aktifListe.length}
          {hucreSayisi > 1 && ` • Hücre ${guvenliHucreIndeksi + 1} / ${hucreSayisi}`}
        </div>
        {sesKaydiButonuGoster && typeof ogeSesiCal === 'function' && aktif && (
          <div className="controls" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8, marginBottom: 8 }}>
            <button
              className="btn"
              type="button"
              onClick={() => { tumSesleriDurdur(); ogeSesiCal(aktif); }}
              aria-label={sesKaydiButonEtiketi}
            >
              🔊
              <span className="btn-etiket">{sesKaydiButonEtiketi}</span>
            </button>
          </div>
        )}
        {ustSesKontrolleriGoster && typeof ogeSesiCal === 'function' && aktif && (
          <div className="controls" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8, marginBottom: 8 }}>
            <button
              className="btn"
              type="button"
              onClick={() => { tumSesleriDurdur(); setOgeSesiAktif(true); if (aktif) ogeSesiCal(aktif); }}
              aria-label={ustSesButonAriaLabel}
            >
              🔊
              <span className="btn-etiket">{ustSesButonEtiketi}</span>
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

      <div className="page-mid">
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
        {/* Kelime/ifade yazısı — Tab ile odaklanabilir (kullanıcı: "tab bu bölümlere de
            odaklanabilmeli"): ekran okuyucu kelimenin üstüne gelince o dilde (lang) okur. */}
        <div
          tabIndex={0}
          lang={rtl ? 'ar' : (yabanciDil || undefined)}
          style={{
            textAlign: 'center',
            fontSize: rtl ? '1.8em' : '1.6em',
            lineHeight: rtl ? 1.5 : 1.2,
            fontWeight: 700,
            fontFamily: rtl ? "'Amasya', 'Segoe UI', sans-serif" : "'Segoe UI', sans-serif",
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

        {/* Ekran okuyucu için (görsel YOK): yönerge CANLI bölge (aria-live=polite + atomic) —
            yönerge artık _srBolge yerine BURADAN duyurulur (lang span yabancı harfi o dilde
            okutur, kalan Türkçe tr kalır). nonce sonu görünmez karakter ile değişir → aynı
            metinde (Tekrar) bile NVDA yeniden okur. ALTINDA sıradaki nokta/dönüt AYRI canlı bölge. */}
        {srYonergeMetni && (() => {
          // Yabancı dil sayfasında yönerge "ä işareti, …" gibi yabancı harfle BAŞLAR;
          // o token <span lang> ile sarılır → NVDA harfi o dilde okur, kalan Türkçe tr kalır.
          const token = k.ttsYazi || k.yazi || '';
          const nonceEk = yonergeNonce % 2 ? ' ' : '';
          const govde = (yabanciDil && token && srYonergeMetni.startsWith(token))
            ? (<><span lang={yabanciDil}>{token}</span>{srYonergeMetni.slice(token.length)}{nonceEk}</>)
            : (<>{srYonergeMetni}{nonceEk}</>);
          return <div className="sr-only" aria-live="polite" aria-atomic="true">{govde}</div>;
        })()}
        {/* ⚠ role="status" KULLANMA: role=status örtük POLITE'tir; aria-live=assertive ile
            çelişir → NVDA polite sayıp güncellemeleri KUYRUĞA alır (kesmez) → önceki öğenin
            "Doğru. Sıradaki nokta…" duyurusu sonraki öğe yüklenince sonradan okunur (sızıntı).
            Saf aria-live=assertive: en yeni mesaj öncekini KESER + boş div "boş" okunmaz. */}
        <div className="sr-only" aria-live="assertive" aria-atomic="true">{srSiradakiNokta}</div>

        {/* Aktif hücre gösterimi */}
        {ikiHucreTekSatir ? (
          <div className="cell-row fit" style={{ '--hucre-sayisi': k.hucreler.length }}>
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
          <BrailleCell
            hedefNoktalar={aktifNoktalar}
            dogruNoktalar={basilanlar}
            yanlisNoktalar={yanlis}
            tiklanabilir
            kilitli={yonergeOkunuyor}
            onKilitliEtkilesim={yonergeBeklemeUyar}
            hucreAdi={hucreSayisi > 1 ? (k.hucreAdlari?.[guvenliHucreIndeksi] || `${guvenliHucreIndeksi + 1}. hücre`) : undefined}
            onNoktaTikla={noktayaTikla}
            baslikAriaLabel={hucreSayisi > 1
              ? `${guvenliHucreIndeksi + 1}. hücre, toplam ${hucreSayisi} hücreden`
              : k.yazi}
          />
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
            &ldquo;{k.okunus}&rdquo;
          </div>
        )}
        {k.altMetin && (
          <div aria-hidden="true" style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700, fontFamily: /[؀-ۿ]/.test(k.altMetin) ? "'Amasya', 'Segoe UI', sans-serif" : "'Segoe UI', sans-serif" }}>
            {k.altMetin}
          </div>
        )}
        {k.anlam && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9em', maxWidth: 560, margin: '0 auto' }}>
            {k.anlam}
          </div>
        )}
        {k.altMetinAciklama && (
          <div aria-hidden="true" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 520 }}>
            {k.altMetinAciklama}
          </div>
        )}
        {k.ekBilgi && (
          <div className="isaret-metin-alti" aria-live="polite" style={{ width: '100%', maxWidth: 520 }}>
            {k.ekBilgi.aciklama && <p style={{ margin: '0 0 0.75em 0' }}>{k.ekBilgi.aciklama}</p>}
            {k.ekBilgi.kurallar?.length > 0 && (
              <>
                <strong>Kullanıldığı yerler:</strong>
                <ul style={{ margin: '0.3em 0 0.8em 1.2em', padding: 0 }}>
                  {k.ekBilgi.kurallar.map((kr, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{kr}</li>)}
                </ul>
              </>
            )}
            {k.ekBilgi.ornekler?.length > 0 && (
              <>
                <strong>Örnek:</strong>
                <ul style={{ margin: '0.3em 0 0 1.2em', padding: 0 }}>
                  {k.ekBilgi.ornekler.map((o, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{o}</li>)}
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

            const sesAktifMi = ogeSesiHerZaman || ogeSesiAktif;
            const tekrarMetni = kelimeYonergeMetniAl(aktif || k);
            const sesOncesiTekrarMetni = typeof aktif?.sesOncesiYonergeMetni === 'string'
              ? aktif.sesOncesiYonergeMetni.trim()
              : '';

            if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function' && aktif) {
              const sesiCalSonraTekrarOku = () => {
                ogeSesiCal(aktif);

                if (tekrarSesiTimerRef.current) {
                  clearTimeout(tekrarSesiTimerRef.current);
                }

                tekrarSesiTimerRef.current = window.setTimeout(() => {
                  yonergeyiKilitleyerekSeslendir(tekrarMetni, { kesintiyle: true });
                  tekrarSesiTimerRef.current = null;
                }, ogeSesiSonrasiKonusmaGecikmeMs);
              };

              if (sesOncesiTekrarMetni) {
                konus(sesOncesiTekrarMetni, {
                  kesintiyle: true,
                  onSon: sesiCalSonraTekrarOku
                });
              } else {
                sesiCalSonraTekrarOku();
              }

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
            konusDil('En başa dönüldü.');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          <span className="btn-etiket">Sıfırla</span>
        </button>
        {hucreSayisi > 1 ? (
          <>
            <button className="btn" type="button" aria-label="Önceki öğe" disabled={ilkKelime && hucreIndeksi === 0} onClick={oncekiHucre}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              <span className="btn-etiket">Önceki öğe</span>
            </button>
            <button className="btn" type="button" aria-label={sonHucre ? 'Sonraki öğe' : 'Sonraki öğe'} onClick={sonrakiHucre}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              <span className="btn-etiket">Sonraki öğe</span>
            </button>
          </>
        ) : (
          <>
            <button className="btn" type="button" aria-label="Önceki öğe" disabled={ilkKelime}
                    onClick={() => { tumSesleriDurdur(); setIndeks((i) => Math.max(0, i - 1)); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              <span className="btn-etiket">Önceki öğe</span>
            </button>
            <button
              className="btn"
              type="button"
              aria-label="Sonraki öğe"
              onClick={() => {
                tumSesleriDurdur();
                basariBildir('Sıradaki.');
                setTimeout(() => setIndeks((i) => i + 1), 500);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              <span className="btn-etiket">Sonraki öğe</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

