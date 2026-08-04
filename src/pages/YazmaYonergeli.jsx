import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { indeksKaydet } from '../utils/ilerleme.js';
import { HARFLER } from '../data/braille.js';
import { karakterHucreleri } from '../utils/brailleCevir.js';
import { YAZMA_KELIMELERI } from '../data/yazmaKelimeleri.js';

// Yönergeli yazma: kullanıcıya bir kelime verilir, tek tek karakter yazması istenir.
// Hatalı karakterde anında uyarı; doğruda ilerle. Bittiğinde tebrik.
// (Cümleler için ayrı sayfa: YazmaYonergeliCumle.jsx — burada veri YAZMA_KELIMELERI = kelimeler.)

const KELIMELER = YAZMA_KELIMELERI;

// Beklenen hücreler `karakterHucreleri` (brailleCevir.js) ile türetilir → ders, encoder'ın
// (`metniBrailleyeCevir`) yazımını BİREBİR ister. ⚠ Şapkalı ünlü (â î û ô ê) ve yabancı harf
// (q w x) İKİ hücredir: önce düzeltme işareti [4], sonra temel harf ('â' → [4] + [1]).
// Bu yüzden sayfa karakter içinde `hucreAdimi` tutar; tek hücreli karakterlerde adım hep 0.
const NOKTA_TUS = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };
const DUZELTME_ETIKETI = 'Düzeltme işareti';

const ayniHucre = (a, b) => a.length === b.length && a.every((n) => b.includes(n));

const noktalardanHarf = (noktalar) =>
  HARFLER.find((h) => ayniHucre(h.noktalar, noktalar))?.harf;

export default function YazmaYonergeli() {
  const [kelimeIdx, setKelimeIdx] = useState(0);

  useEffect(() => { indeksKaydet('yazma-yonergeli', kelimeIdx); }, [kelimeIdx]);
  const [konum, setKonum] = useState(0); // doğru yazılan karakter sayısı
  const [hucreAdimi, setHucreAdimi] = useState(0); // çok hücreli karakterde kaçıncı hücredeyiz
  const [hataSayisi, setHataSayisi] = useState(0);
  // Aynı karakter için ardışık yanlış deneme sayısı
  const [karakterDeneme, setKarakterDeneme] = useState(0);
  const [ipucuGoster, setIpucuGoster] = useState(false);
  const durumRef = useRef(yeniYazmaDurumu());

  const kelime = KELIMELER[kelimeIdx];
  const yazilan = kelime.slice(0, konum);
  const beklenen = kelime[konum]; // undefined ise tamam
  const beklenenHucreler = karakterHucreleri(beklenen);
  const cokHucreli = beklenenHucreler.length > 1;
  // Adım taşmasına karşı güvenlik (karakter değişiminde state bir render geç sıfırlanabilir)
  const adim = Math.min(hucreAdimi, Math.max(0, beklenenHucreler.length - 1));
  const beklenenNoktalar = beklenenHucreler[adim] || [];

  // Çok hücreli karakterde her adımın kendi adı olur: "Düzeltme işareti" / "A harfi".
  const adimEtiketi = (i = adim) => {
    if (!beklenen) return '';
    if (!cokHucreli) return `${beklenen.toLocaleUpperCase('tr')} harfi`;
    if (i === 0) return DUZELTME_ETIKETI;
    const h = noktalardanHarf(beklenenHucreler[i] || []);
    return h ? `${h} harfi` : 'temel harf';
  };

  const yardimMetni = () => {
    if (!beklenen || beklenen === ' ') {
      return 'Boşluk düğmesine veya boşluk tuşuna basın.';
    }
    if (beklenenNoktalar.length === 0) return '';
    const nk = beklenenNoktalar.join(', ');
    const tuslar = beklenenNoktalar.map((n) => NOKTA_TUS[n]).join(' ve ');
    return `${adimEtiketi()} için ${nk} numaralı noktalara, ` +
           `klavyede ${tuslar} tuşlarına aynı anda parmaklarınızla basıp birlikte bırakın.`;
  };

  // Çok hücreli karakterin (â, q, w…) iki adımını açıkla; ilk adımdayken tam kural,
  // ikinci adımdayken yalnız kalan hücre söylenir.
  const cokHucreYonergesi = () => {
    const sonAdimEtiketi = adimEtiketi(beklenenHucreler.length - 1);
    if (adim === 0) {
      return `"${beklenen}" harfi iki hücreyle yazılır: önce ${DUZELTME_ETIKETI.toLocaleLowerCase('tr')}, ` +
             `sonra ${sonAdimEtiketi}. Şimdi ${DUZELTME_ETIKETI.toLocaleLowerCase('tr')}ni yazın.`;
    }
    return `${DUZELTME_ETIKETI} yazıldı. Şimdi ${sonAdimEtiketi} için noktalara basın.`;
  };

  const yonerge = () => {
    if (!beklenen) {
      return `Tebrikler! "${kelime}" kelimesini tamamladınız. ` +
             (kelimeIdx < KELIMELER.length - 1
               ? 'Sonraki kelimeye geçmek için Onay düğmesine basın.'
               : 'Tüm kelimeleri tamamladınız.');
    }
    if (konum === 0 && adim === 0) {
      return `Şu kelimeyi yazın: ${kelime}. ` +
             `Lütfen "${beklenen === ' ' ? 'boşluk' : beklenen}" karakteriyle başlayın. ` +
             (cokHucreli
               ? cokHucreYonergesi()
               : 'Bir harfi yazmak için, o harfin nokta düğmelerine aynı anda parmaklarınızla basıp birlikte bırakın.');
    }
    if (cokHucreli) {
      return (adim === 0 ? `Sıradaki karakter: ${beklenen}. ` : '') + cokHucreYonergesi();
    }
    return `Sıradaki karakter: ${beklenen === ' ' ? 'boşluk' : beklenen}. ` +
           `Noktalara aynı anda basıp birlikte bırakın.`;
  };

  useEffect(() => {
    konus(yonerge());
    const tekrar = () => konus(yonerge(), { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      konusmayiDurdur();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelimeIdx, konum, hucreAdimi]); // hucreAdimi: çok hücreli karakterde 2. adım da duyurulsun

  // Karakter değiştiğinde deneme sayacını, ipucunu ve hücre adımını sıfırla
  useEffect(() => {
    setKarakterDeneme(0);
    setIpucuGoster(false);
    setHucreAdimi(0);
  }, [konum, kelimeIdx]);

  const ileriKelime = () => {
    if (kelimeIdx < KELIMELER.length - 1) {
      setKelimeIdx((i) => i + 1);
      setKonum(0);
      setHucreAdimi(0);
      setHataSayisi(0);
      durumRef.current = yeniYazmaDurumu();
    }
  };

  // Yanlış denemeyi say; 3'e ulaşınca yardım ver
  const yanlisKaydet = () => {
    setHataSayisi((s) => s + 1);
    setKarakterDeneme((d) => {
      const yeni = d + 1;
      if (yeni >= 3 && !ipucuGoster) {
        setIpucuGoster(true);
        // Sesli yardım: hangi noktalar/tuşlar
        setTimeout(() => konus(`Yardım: ${yardimMetni()}`, { kesintiyle: true }), 1400);
      }
      return yeni;
    });
  };

  // Karakter tamamlandı: ilerle, kelime bittiyse tebrik et.
  const karakteriTamamla = (anons) => {
    konus(anons, { kesintiyle: true });
    setHucreAdimi(0);
    setKonum((k) => k + 1);
    if (konum + 1 >= kelime.length) {
      setTimeout(() => basariBildir('Kelimeyi tamamladınız.'), 600);
    }
  };

  const onHucre = (noktalar) => {
    if (!beklenen) return;

    // ÇOK HÜCRELİ karakter (â/q/w… → düzeltme işareti + temel harf): hücreleri HAM olarak
    // karşılaştır. `hucreyiIsle` tek hücreyi tek karaktere çözdüğünden [4] gibi bir işaret
    // hücresini "bilinmeyen" sayardı; ayrıca durumRef'i (sayı/büyük harf modu) kirletirdi.
    if (cokHucreli) {
      const hedef = beklenenHucreler[adim] || [];
      if (ayniHucre(hedef, noktalar)) {
        if (adim + 1 < beklenenHucreler.length) {
          konus(adimEtiketi(adim), { kesintiyle: true });
          setHucreAdimi(adim + 1);
        } else {
          karakteriTamamla(beklenen);
        }
      } else {
        hataBildir(
          `Yanlış. ${adimEtiketi()} için ${hedef.join(', ')} numaralı noktalar gerekiyor, ` +
          `siz ${noktalar.length ? noktalar.join(', ') : 'hiçbir'} noktaya bastınız.`
        );
        yanlisKaydet();
      }
      return;
    }

    const r = hucreyiIsle(durumRef.current, noktalar);
    if (r.tip === 'isaret') {
      konus(r.anons);
      return;
    }
    if (r.tip === 'bilinmeyen' || r.deger === null) {
      hataBildir(
        `Yanlış. Bastığınız noktalar ${noktalar.join(', ')} hiçbir karaktere karşılık gelmiyor. ` +
        `Beklenen ${beklenen === ' ' ? 'boşluk' : beklenen}.`
      );
      yanlisKaydet();
      return;
    }
    const yazilanCh = r.deger;
    const eslesti = yazilanCh.toLocaleLowerCase('tr') === beklenen.toLocaleLowerCase('tr');
    if (eslesti) {
      karakteriTamamla(yazilanCh);
    } else {
      hataBildir(
        `Yanlış. ${yazilanCh.toLocaleUpperCase('tr')} harfini yazdınız, ` +
        `beklenen ${beklenen === ' ' ? 'boşluk' : beklenen.toLocaleUpperCase('tr')} harfi.`
      );
      yanlisKaydet();
    }
  };

  const onBosluk = () => {
    if (!beklenen) return;
    if (beklenen === ' ') {
      konus('boşluk', { kesintiyle: true });
      setKonum((k) => k + 1);
    } else {
      hataBildir(
        `Yanlış. Boşluk yazdınız, beklenen ${beklenen.toLocaleUpperCase('tr')} harfi.`
      );
      yanlisKaydet();
    }
  };

  const onSil = () => {
    // Çok hücreli karakterin ortasındaysak önce O karakterin adımını geri al
    // (yoksa yazılmış düzeltme işareti sessizce kaybolur).
    if (adim > 0) {
      setHucreAdimi(adim - 1);
      konus('silindi', { kesintiyle: true });
      return;
    }
    if (konum > 0) {
      setKonum((k) => k - 1);
      konus('silindi', { kesintiyle: true });
    }
  };

  const yenidenBasla = () => {
    setKonum(0);
    setHucreAdimi(0);
    setHataSayisi(0);
    setKarakterDeneme(0);
    setIpucuGoster(false);
    durumRef.current = yeniYazmaDurumu();
  };

  return (
    <div className="page yazma-page">
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Yönergeli Yazma" />
        <div className="progress" aria-hidden="true">
          Kelime {kelimeIdx + 1} / {KELIMELER.length} &nbsp;•&nbsp; {konum} / {kelime.length} karakter
          {hataSayisi > 0 && <> &nbsp;•&nbsp; Hata: {hataSayisi}</>}
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div className="yazma-metin" aria-label={`Hedef kelime: ${kelime}`}>
          <span className="yazilan">{yazilan}</span>
          {beklenen && <span className="bekleyen">{beklenen}</span>}
          <span className="kalan">{kelime.slice(konum + 1)}</span>
        </div>
        {ipucuGoster && beklenen && (
          <div className="yazma-ipucu" role="status" aria-live="polite">
            <b>Yardım:</b> {yardimMetni()}
          </div>
        )}
        <div role="status" aria-live="polite" className="sr-only">
          {yonerge()}
        </div>
        {/* Dikeyde klavye burada (orta bölmede) görünür. Yatayda CSS ile gizlenir. */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={!beklenen ? ileriKelime : undefined}
            vurguNoktalar={ipucuGoster ? beklenenNoktalar : []}
            klavyeIpucu={ipucuGoster}
            siralikTiklama
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button className="btn" type="button" onClick={yenidenBasla}>Bu Kelimeyi Tekrar Yaz</button>
          {!beklenen && kelimeIdx < KELIMELER.length - 1 && (
            <button className="btn" type="button" onClick={ileriKelime}>Sonraki Kelime</button>
          )}
        </div>
      </div>

      {/* Yatayda ekranın altında popup klavye. Dikeyde CSS ile gizlenir. */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={!beklenen ? ileriKelime : undefined}
          vurguNoktalar={ipucuGoster ? beklenenNoktalar : []}
          klavyeIpucu={ipucuGoster}
          anindaDokunma
          // ⚠ klavyeAcik={false}: sayfa İKİ klavye mount eder (inline + yatay popup); ikisi de
          // window keydown/keyup dinlerse her fiziksel hücre İKİ kez commit edilir (tek hücreli
          // karakterde iki karakter birden ilerler). Fiziksel klavyeyi yalnız inline klavye
          // yakalasın; popup dokunmatik (anindaDokunma) ile çalışır. (YazmaSerbest ile aynı fix.)
          klavyeAcik={false}
        />
      </div>
    </div>
  );
}
