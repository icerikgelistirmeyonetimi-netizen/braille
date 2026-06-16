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
  // Tablet (yazım yüzü) yerleşimi: dot 1-2-3 sağ sütun, 4-5-6 sol sütun
  // (fiziksel tabletteki punch konumlarına uyacak şekilde mirror)
  const noktaGridYerlesimiAyna = {
    1: { gridRow: 1, gridColumn: 2 },
    2: { gridRow: 2, gridColumn: 2 },
    3: { gridRow: 3, gridColumn: 2 },
    4: { gridRow: 1, gridColumn: 1 },
    5: { gridRow: 2, gridColumn: 1 },
    6: { gridRow: 3, gridColumn: 1 },
  };
  const noktaGridYerlesimi = aynaliEtiket ? noktaGridYerlesimiAyna : noktaGridYerlesimiStd;
  const AYNA_HARITASI = { 1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3 };
  const etiketGoster = (n) => (aynaliEtiket ? AYNA_HARITASI[n] : n);
  const sonOkunan = useRef(null);
  // Hücreyle herhangi bir parmak/fare etkileşimi (keşif veya tıklama).
  // Yönerge okunurken (kilitli) hiçbir etkileşim olmaz.
  const etkilesimli = (tiklanabilir || kesfedilebilir) && !kilitli;

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
        role={hucreAdi ? 'group' : undefined}
        aria-label={hucreAdi || undefined}
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
              aria-label={kilitli ? undefined : ariaLabel(n)}
              aria-hidden={kilitli ? true : undefined}
              data-nokta={n}
              style={yer}
              {...(kilitli
                ? {}
                : tiklanabilir
                  ? {
                      type: 'button',
                      onClick: () => onNoktaTikla && onNoktaTikla(n),
                      onMouseEnter: () => noktaUzerinde(n),
                      onFocus: () => noktaUzerinde(n)
                    }
                  : kesfedilebilir
                    ? {
                        'aria-hidden': false,
                        onMouseEnter: () => noktaUzerinde(n)
                      }
                    : { 'aria-hidden': false })}
            >
              {etiketGoster(n)}
            </Etiket>
          );
        })}
      </div>
    </div>
  );
}
