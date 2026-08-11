import React, { useRef } from 'react';
import { konus, titret } from '../utils/ses.js';
import {
  BRAILLE_STATIK_HUCRE_OLCEK,
  brailleHucreStatikArkaPlani,
  noktaDizisindenBrailleBits,
} from '../utils/brailleStatikHucreGorseli.js';

/**
 * Braille hücresi bileşeni.
 *
 * Numaralandırma (görünüm):
 *   1 • • 4
 *   2 • • 5
 *   3 • • 6
 * Klavye / DOM sırası erişilebilirlik için 1→6’dır; yerleşim CSS grid ile korunur.
 *
 * Props:
 *  - aktifNoktalar: number[]  -> dolu (kabarık) noktalar
 *  - hedefNoktalar: number[]  -> beklenen / vurgulanan noktalar
 *  - dogruNoktalar: number[]  -> doğru cevaplanmış noktalar (yeşil)
 *  - yanlisNoktalar: number[] -> yanlış basılan noktalar (kırmızı)
 *  - tiklanabilir: boolean
 *  - onNoktaTikla: (noktaNo: number) => void
 *  - baslik: string  (büyük gösterilecek harf/sembol; ekran okuyucudan gizlenir)
 *  - baslikAriaLabel: string
 *  - baslikStyle: object
 *  - statikDesen: tek katmanlı gradient desen (nadiren; çoğu görünüm .dot ile)
 */
export default function BrailleCell({
  aktifNoktalar = [],
  hedefNoktalar = [],
  dogruNoktalar = [],
  yanlisNoktalar = [],
  tiklanabilir = false,
  // Pasif (okuma) hücrelerde de parmakla noktanın üzerine gelince
  // numarayı seslendirip titreşim verir. Cevap girilmez.
  kesfedilebilir = true,
  onNoktaTikla,
  baslik,
  baslikAriaLabel,
  baslikStyle,
  // Çok hücreli alıştırmalarda hücrenin sıralı adı (ör. "1. hücre").
  // Verilince: hücreye gelindiğinde ekran okuyucu (grup etiketi) ve
  // uygulama sesi (konus) önce bu adı, sonra noktaları söyler.
  hucreAdi,
  // Yönerge okunurken kilit: tüm nokta etkileşimi kapanır (tıklama, parmak/fare
  // ile üzerine gelme/seslendirme ve odak yok; ekran okuyucudan da gizlenir).
  kilitli = false,
  // Kilitliyken kullanıcı yine de etkileşmeye çalışırsa (tıklama) çağrılır.
  onKilitliEtkilesim,
  // Alt+ok YATAY kenarında DOM'da komşu .cell yoksa çağrılır: (yon, satir) —
  // yon: +1 sağ / -1 sol, satir: gridRow (1-3). Tek-tek (step-through) çok hücreli
  // görünümde CokHucreOkuyucu bununla AKTİF HÜCREYİ değiştirir (bkz. /fen-kimya).
  onHucreKenari,
  // Serbest Yazma: yazılmış hücrede noktayı AÇ/KAPA (düzeltme). Verilince `kesfedilebilir`
  // noktalar role="switch" + aria-checked alır; tıklama/Enter/Space noktayı değiştirir.
  onNoktaDegistir,
  statikDesen = false,
  // Tablet/yazı tableti modu: nokta NUMARA ETİKETLERİ aynalanır (1↔4, 2↔5, 3↔6).
  // Fiziksel braille tabletinin yazım yüzü için. Dot fillleri zaten dış kullanıcıdan
  // mirror edilmiş gelir; bu bayrak yalnız görünür label numarasını değiştirir.
  aynaliEtiket = false,
}) {
  /** Klavye odağı ve okuyucu sırası 1–6; iki sütunlu Braille düzeni grid ile */
  const NOKTA_DOM_SIRA = [1, 2, 3, 4, 5, 6];
  // Standart yerleşim: dot 1-2-3 sol sütun, 4-5-6 sağ sütun
  const noktaGridYerlesimiStd = {
    1: { gridRow: 1, gridColumn: 1 },
    2: { gridRow: 2, gridColumn: 1 },
    3: { gridRow: 3, gridColumn: 1 },
    4: { gridRow: 1, gridColumn: 2 },
    5: { gridRow: 2, gridColumn: 2 },
    6: { gridRow: 3, gridColumn: 2 },
  };
  // ⚠⚠ YERLEŞİM AYNALAMASI YOK — `aynaliEtiket` grid sütunlarını DEĞİŞTİRMEZ (kullanıcı:
  // "metin→brf sayfasında aynalama tablet modunda doğru yapılmıyor"). Çağıranlar dot
  // fill'ini ZATEN `tabletDelikAynala` ile aynalayıp verir ([1] → [4]); burada grid'i de
  // çevirmek İKİNCİ bir aynalama olur ve ikisi birbirini götürürdü → tablet modu normal
  // modla birebir aynı görünüyordu (tarayıcıda ölçüldü: 'a' iki modda da SOL sütun).
  // Yerleşim daima standart: aynalanmış [4] doğal olarak SAĞ sütunda çizilir = tabletteki
  // delik konumu. Bayrak YALNIZ görünür/duyulur ETİKET numarasını çevirir (dot 4 → "1"),
  // böylece kullanıcı sağdaki deliği mantıksal "1. nokta" olarak okur.
  const noktaGridYerlesimi = noktaGridYerlesimiStd;
  const AYNA_HARITASI = { 1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3 };
  const etiketGoster = (n) => (aynaliEtiket ? AYNA_HARITASI[n] : n);
  const sonOkunan = useRef(null);
  // Hücreyle herhangi bir parmak/fare etkileşimi (keşif veya tıklama).
  // Yönerge okunurken (kilitli) hiçbir etkileşim olmaz.
  const etkilesimli = (tiklanabilir || kesfedilebilir) && !kilitli;

  // ── PASİF GÖSTERİM (tiklanabilir=false, kesfedilebilir=false) — tek etiket ──
  // Ekran okuyucu nokta nokta "1. nokta, dolu / 3. nokta, boş" OKUMASIN (kullanıcı:
  // "sadece dolu noktaları okusun, o dolu bu boş demesin; ana div'ine aria-label ekle").
  // Noktalar gizlenir; .cell role="img" + tek özet etiket taşır: "1, 2 ve 3 numaralı noktalar".
  const pasifGosterim = !tiklanabilir && !kesfedilebilir;
  const pasifOzet = (() => {
    if (!pasifGosterim) return null;
    const dolular = NOKTA_DOM_SIRA
      .filter((n) => aktifNoktalar.includes(n) || dogruNoktalar.includes(n))
      .map((n) => etiketGoster(n));
    if (dolular.length === 0) return 'boş braille hücresi';
    const liste = dolular.length === 1
      ? String(dolular[0])
      : `${dolular.slice(0, -1).join(', ')} ve ${dolular[dolular.length - 1]}`;
    return `${liste} numaralı ${dolular.length === 1 ? 'nokta' : 'noktalar'}`;
  })();

  const noktaDurumu = (n) => {
    const siniflar = ['dot'];
    if (aktifNoktalar.includes(n)) siniflar.push('on');
    if (dogruNoktalar.includes(n)) siniflar.push('correct');
    if (yanlisNoktalar.includes(n)) siniflar.push('wrong');
    if (hedefNoktalar.includes(n) && !aktifNoktalar.includes(n) && !dogruNoktalar.includes(n)) {
      siniflar.push('target');
    }
    return siniflar.join(' ');
  };

  const ariaLabel = (n) => {
    if (aktifNoktalar.includes(n) || dogruNoktalar.includes(n)) {
      return `${etiketGoster(n)}. nokta, dolu`;
    }
    // Hedef (basılması beklenen) nokta: "boş" yerine "basılacak nokta". Yönerge bitince odak
    // ilk hedef noktaya gelir; "N. nokta, boş, düğme" NVDA'da "boş düğme" (etiketsiz/işlevsiz
    // buton) gibi duyuluyordu (kullanıcı: cezm-sedde ilk öğe [2,5] → odak dot 2'ye gelince
    // "2. nokta, boş" okuyordu, hatalı). Hedef nokta artık basılması gerektiğini söyler;
    // desene ait olmayan boş noktalar yine "boş" kalır → kullanıcı deseni de ayırt eder.
    if (hedefNoktalar.includes(n)) {
      return `${etiketGoster(n)}. nokta, basılacak nokta`;
    }
    return `${etiketGoster(n)}. nokta, boş`;
  };

  // Üzerine gelindiğinde / parmak gezdirildiğinde numarayı seslendir + kısa titreşim
  const noktaUzerinde = (n) => {
    if (!etkilesimli) return;
    if (sonOkunan.current === n) return;
    // Hücreye taze giriş (mouse/odak yeni girdi): önce hücre adını söyle.
    const ilkGiris = sonOkunan.current === null;
    sonOkunan.current = n;
    titret(25); // parmak yeni noktaya girdi
    // srAtla: _srBolge'ye YAZMA — ekran okuyucu nokta butonunun aria-label'ini
    // ("N. nokta, durum") zaten odakta/dokunuşta okur; konus yalnız app TTS için
    // sayıyı sesli söyler (çift duyuru/araya girme olmaz).
    if (hucreAdi && ilkGiris) {
      konus(`${hucreAdi}, ${etiketGoster(n)}`, { kesintiyle: true, srAtla: true });
    } else {
      konus(String(etiketGoster(n)), { kesintiyle: true, srAtla: true });
    }
  };

  const noktayiBirak = () => {
    sonOkunan.current = null;
  };

  // ── Alt + Shift + yön okları: hücre İÇİNDE noktalar arası gezinme ─────────────
  // (kullanıcı: "tüm braille hücre sayfalarında alt + yön oklarıyla ileri geri
  //  gezinebilmeliyim" → sonra: "alt sol ok kısayolu değiştirelim, alt shift ok
  //  tuşu ile gezinmeyi ayarlayalım" — Alt+ok tarayıcıda GERİ/İLERİ olduğundan)
  // Yerleşim 1 4 / 2 5 / 3 6 → sağ/sol SÜTUN, yukarı/aşağı SATIR değiştirir.
  // ⚠ DÜZ ok tuşları KULLANILMAZ: NVDA tarama (browse) modunda okları kendi sanal
  //   imleci için tüketir; Alt+ok o gezinmeyle çakışmaz.
  // ⚠ Alt+Sol / Alt+Sağ tarayıcıda GERİ / İLERİ demektir → `preventDefault` ŞART
  //   (kenardayken bile), yoksa kullanıcı noktalar arasında gezinirken sayfadan çıkar.
  // Komşu, sabit tablo yerine YERLEŞİMDEN türetilir → grid değişirse gezinme de uyar.
  const YON_ADIMI = {
    ArrowRight: { satir: 0, sutun: 1 },
    ArrowLeft: { satir: 0, sutun: -1 },
    ArrowDown: { satir: 1, sutun: 0 },
    ArrowUp: { satir: -1, sutun: 0 },
  };

  const noktaKlavye = (e, n) => {
    const adim = YON_ADIMI[e.key];
    // ⚠ KISAYOL: Alt + Shift + ok (kullanıcı: "alt sol ok kısayolunu değiştirelim,
    // alt shift ok tuşu ile gezinmeyi ayarlayalım"). Yalnız Alt+ok tarayıcının
    // GERİ/İLERİ kısayoludur; Shift eklenince çakışma kalmaz. Düz ok tuşlarına yine
    // DOKUNULMAZ (ekran okuyucunun tarama gezinmesi serbest kalsın).
    if (!e.altKey || !e.shiftKey || !adim) return;
    e.preventDefault();
    const su = noktaGridYerlesimi[n];
    if (!su) return;
    const hedef = NOKTA_DOM_SIRA.find((m) => {
      const y = noktaGridYerlesimi[m];
      return y && y.gridRow === su.gridRow + adim.satir
        && y.gridColumn === su.gridColumn + adim.sutun;
    });
    if (hedef) {
      const el = e.currentTarget.closest('.cell')?.querySelector(`[data-nokta="${hedef}"]`);
      // Odak taşımak yeterli: dot'un onFocus'u numarayı söyler (app TTS),
      // ekran okuyucu da aria-label'i ("N. nokta, durum") okur.
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }
    // ── Hücre kenarı: YATAY adımda KOMŞU HÜCREYE geç (kullanıcı: "çok hücrelilerde
    //    2'den 5'e geçtim, tekrar alt sağ ok yaparsam sonraki hücreye geçebilmeliyim;
    //    tersi yönde de hücre varsa geçebilmeliyim; ama son hücreden sonra sonraki
    //    sayfaya geçmemeli — bu SADECE çok hücreler arası geçiş olmalı").
    // Yan yana dizilim (.cell-row) içindeki kardeş .cell aranır; sağa geçişte komşunun
    // SOL sütununa (aynı satır), sola geçişte SAĞ sütununa odaklanılır. En dış kenarda
    // komşu yoksa odak yerinde kalır (preventDefault zaten çağrıldı → tarayıcı
    // GERİ/İLERİ'ye de gitmez, sayfa değişmez). Dikey kenarda hücre atlanmaz.
    if (adim.sutun === 0) return;
    const suHucre = e.currentTarget.closest('.cell');
    const satirKapsayici = suHucre?.closest('.cell-row');
    const hucreler = satirKapsayici ? [...satirKapsayici.querySelectorAll('.cell')] : [];
    const komsu = satirKapsayici ? hucreler[hucreler.indexOf(suHucre) + adim.sutun] : null;
    if (!komsu) {
      // DOM'da komşu hücre yok: tek-tek (step-through) çok hücreli görünümde sayfa
      // AKTİF hücreyi state ile değiştirir (onHucreKenari — /fen-kimya gibi 3+ hücreli
      // öğeler yan yana ÇİZİLMEZ, tek büyük hücre gösterilir). Callback verilmemişse
      // (tek hücreli sayfa / yan yana dizilimin en dış kenarı) odak yerinde kalır.
      if (onHucreKenari) onHucreKenari(adim.sutun, su.gridRow);
      return;
    }
    const hedefSutun = adim.sutun === 1 ? 1 : 2;
    const komsuNokta = NOKTA_DOM_SIRA.find((m) => {
      const y = noktaGridYerlesimi[m];
      return y && y.gridRow === su.gridRow && y.gridColumn === hedefSutun;
    });
    const komsuEl = komsu.querySelector(`[data-nokta="${komsuNokta}"]`);
    // Pasif hücrenin noktaları div'dir ama tabIndex={-1} taşır (aşağıda) →
    // programatik odak alır; ekran okuyucu aria-label'ini okur, Alt+ok ile devam edilir.
    if (komsuEl && typeof komsuEl.focus === 'function') komsuEl.focus();
  };

  // Odak hücre dışına çıkınca sıfırla: tekrar girişte hücre adı yeniden söylensin.
  const hucreOdakAyrildi = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      sonOkunan.current = null;
    }
  };

  const statikKullan = statikDesen
    && !tiklanabilir
    && !kesfedilebilir
    && !baslik
    && dogruNoktalar.length === 0
    && yanlisNoktalar.length === 0
    && hedefNoktalar.length === 0;

  // Dokunmatikte parmak hareket ettikçe altındaki noktayı bul
  const dokunusHareket = (e) => {
    if (!etkilesimli) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (!el) return;
    const noktaEl = el.closest('[data-nokta]');
    if (!noktaEl) {
      sonOkunan.current = null;
      return;
    }
    const n = Number(noktaEl.getAttribute('data-nokta'));
    if (n) noktaUzerinde(n);
  };

  // Dokunma bittiğinde parmağın bulunduğu noktayı tıkla
  const dokunusBitti = (e) => {
    if (!etkilesimli) return;
    sonOkunan.current = null;
    if (!tiklanabilir) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const noktaEl = el && el.closest('[data-nokta]');
    if (!noktaEl) return;
    const n = Number(noktaEl.getAttribute('data-nokta'));
    if (n && onNoktaTikla) {
      e.preventDefault(); // sentetik click'i engelle (çift tetiklemeyi önler)
      onNoktaTikla(n);
    }
  };

  return (
    <div className="cell-wrapper">
      <div
        className="cell-title"
        aria-label={baslik ? (baslikAriaLabel || baslik) : undefined}
        /* \u00C7ok h\u00FCcreli modda (hucreAdi verilince) ba\u015Fl\u0131k g\u00F6rsel kal\u0131r ama
           ekran okuyucudan gizlenir; h\u00FCcre ad\u0131n\u0131 grup etiketi duyurur. */
        aria-hidden={(baslik && !hucreAdi) ? undefined : true}
        style={baslik ? baslikStyle : { display: 'none' }}
      >
        {baslik || '\u00A0'}
      </div>
      <div
        className={'cell' + (statikKullan ? ' braille-cell-statik' : '')}
        /* Çok hücreli alıştırmada hücreyi adıyla grupla ("1. hücre"). TEK hücrede grup
           etiketi KOYMA: NVDA noktalardan sonra grup sınırında "Braille hücresi, altı nokta"
           okuyordu (kullanıcı: "noktaları sayıyor sonra braille hücresi diyor") — gereksiz;
           yönerge + her noktanın kendi etiketi zaten bağlamı veriyor. */
        role={hucreAdi ? 'group' : (pasifGosterim ? 'img' : undefined)}
        aria-label={hucreAdi
          ? (pasifGosterim ? `${hucreAdi}, ${pasifOzet}` : hucreAdi)
          : (pasifGosterim ? pasifOzet : undefined)}
        onTouchStart={dokunusHareket}
        onTouchMove={dokunusHareket}
        onTouchEnd={dokunusBitti}
        onMouseLeave={noktayiBirak}
        onBlur={hucreOdakAyrildi}
        onClick={kilitli && onKilitliEtkilesim ? () => onKilitliEtkilesim() : undefined}
        {...(statikKullan
          ? {
              style: {
                width: BRAILLE_STATIK_HUCRE_OLCEK.genislik,
                height: BRAILLE_STATIK_HUCRE_OLCEK.yukseklik,
                background: brailleHucreStatikArkaPlani(noktaDizisindenBrailleBits(aktifNoktalar)),
                backgroundColor: 'transparent',
              },
            }
          : {})}
      >
        {statikKullan ? null : NOKTA_DOM_SIRA.map((n) => {
          // Kilitliyken: tıklanamaz/odaklanamaz div + ekran okuyucudan gizli.
          const Etiket = (tiklanabilir && !kilitli) ? 'button' : 'div';
          const yer = noktaGridYerlesimi[n];
          return (
            <Etiket
              key={n}
              className={noktaDurumu(n)}
              aria-label={(kilitli || pasifGosterim) ? undefined : ariaLabel(n)}
              aria-hidden={(kilitli || pasifGosterim) ? true : undefined}
              data-nokta={n}
              style={yer}
              {...(kilitli
                ? {}
                : tiklanabilir
                  ? {
                      type: 'button',
                      onClick: () => onNoktaTikla && onNoktaTikla(n),
                      onMouseEnter: () => noktaUzerinde(n),
                      onFocus: () => noktaUzerinde(n),
                      onKeyDown: (e) => noktaKlavye(e, n)
                    }
                  : kesfedilebilir
                    ? {
                        'aria-hidden': false,
                        onMouseEnter: () => noktaUzerinde(n),
                        // Çok hücreli yan yana dizilimde Alt+Shift+ok ile KOMŞU hücreye
                        // geçilebilsin: pasif hücrenin div noktası tabIndex={-1} ile
                        // PROGRAMATİK odak alır (Tab sırasına GİRMEZ → "ilk Tab = 1. nokta"
                        // standardı bozulmaz), odaklanınca aria-label okunur.
                        tabIndex: -1,
                        onFocus: () => noktaUzerinde(n),
                        // ⚠ DÜZENLENEBİLİR HÜCRE (Serbest Yazma; kullanıcı: "hücrelerde
                        // düzeltme yapabilmeli, noktanın tıklığını kaldırabilmeliyim, boş
                        // noktaya tıklayabilmeliyim"): `onNoktaDegistir` verilirse nokta
                        // AÇ/KAPA olur. Sarmalayıcı bir <button> olabildiğinden (nested
                        // button geçersiz) nokta yine <div> kalır; tıklama/Enter/Space
                        // burada yakalanır ve stopPropagation ile sarmalayıcıya SIZMAZ.
                        ...(onNoktaDegistir
                          ? {
                              role: 'switch',
                              'aria-checked': aktifNoktalar.includes(n),
                              onClick: (e) => { e.preventDefault(); e.stopPropagation(); onNoktaDegistir(n); },
                            }
                          : {}),
                        onKeyDown: (e) => {
                          if (onNoktaDegistir && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            e.stopPropagation();
                            onNoktaDegistir(n);
                            return;
                          }
                          noktaKlavye(e, n);
                        }
                      }
                    // Pasif gösterim: nokta ekran okuyucudan GİZLİ — özet .cell etiketinde.
                    : { 'aria-hidden': true })}
            >
              {etiketGoster(n)}
            </Etiket>
          );
        })}
      </div>
    </div>
  );
}
