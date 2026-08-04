import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { indeksKaydet } from '../utils/ilerleme.js';
import { HARFLER } from '../data/braille.js';
import { karakterHucreleri } from '../utils/brailleCevir.js';
import { YAZMA_CUMLELERI } from '../data/yazmaCumleleri.js';

// Yönergeli cümle yazma — ilkokul 1. ve 2. sınıf seviyesi.
// Akış, YazmaYonergeli ile aynıdır; tek farkı kaynak listesinin
// kelime değil, kısa cümlelerden oluşmasıdır.

const CUMLELER = YAZMA_CUMLELERI;

// Beklenen hücreler `karakterHucreleri` ile türetilir (YazmaYonergeli ile AYNI mantık —
// ikisini birlikte güncelle). ⚠ Şapkalı ünlü (â î û ô ê) ve yabancı harf (q w x) İKİ
// hücredir: düzeltme işareti [4] + temel harf; bu yüzden karakter içinde `hucreAdimi` tutulur.
const NOKTA_TUS = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };
const DUZELTME_ETIKETI = 'Düzeltme işareti';

const ayniHucre = (a, b) => a.length === b.length && a.every((n) => b.includes(n));

const noktalardanHarf = (noktalar) =>
  HARFLER.find((h) => ayniHucre(h.noktalar, noktalar))?.harf;

export default function YazmaYonergeliCumle() {
  const [cumleIdx, setCumleIdx] = useState(0);

  useEffect(() => { indeksKaydet('yazma-yonergeli-cumle', cumleIdx); }, [cumleIdx]);
  const [konum, setKonum] = useState(0);
  const [hucreAdimi, setHucreAdimi] = useState(0); // çok hücreli karakterde kaçıncı hücre
  const [hataSayisi, setHataSayisi] = useState(0);
  const [karakterDeneme, setKarakterDeneme] = useState(0);
  const [ipucuGoster, setIpucuGoster] = useState(false);
  const durumRef = useRef(yeniYazmaDurumu());

  const cumle = CUMLELER[cumleIdx];
  const yazilan = cumle.slice(0, konum);
  const beklenen = cumle[konum];
  const beklenenHucreler = karakterHucreleri(beklenen);
  const cokHucreli = beklenenHucreler.length > 1;
  const adim = Math.min(hucreAdimi, Math.max(0, beklenenHucreler.length - 1));
  const beklenenNoktalar = beklenenHucreler[adim] || [];

  const adimEtiketi = (i = adim) => {
    if (!beklenen) return '';
    if (!cokHucreli) return `${beklenen.toLocaleUpperCase('tr')} karakteri`;
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
      return `Tebrikler! "${cumle}" cümlesini tamamladınız. ` +
             (cumleIdx < CUMLELER.length - 1
               ? 'Sonraki cümleye geçmek için Onay düğmesine basın.'
               : 'Tüm cümleleri tamamladınız.');
    }
    if (konum === 0 && adim === 0) {
      return `Şu cümleyi yazın: ${cumle}. ` +
             `Lütfen "${beklenen === ' ' ? 'boşluk' : beklenen}" karakteriyle başlayın. ` +
             (cokHucreli
               ? cokHucreYonergesi()
               : 'Bir karakteri yazmak için, o karakterin nokta düğmelerine aynı anda parmaklarınızla basıp birlikte bırakın.');
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
  }, [cumleIdx, konum, hucreAdimi]); // hucreAdimi: çok hücreli karakterin 2. adımı da duyurulsun

  useEffect(() => {
    setKarakterDeneme(0);
    setIpucuGoster(false);
    setHucreAdimi(0);
  }, [konum, cumleIdx]);

  const ileriCumle = () => {
    if (cumleIdx < CUMLELER.length - 1) {
      setCumleIdx((i) => i + 1);
      setKonum(0);
      setHucreAdimi(0);
      setHataSayisi(0);
      durumRef.current = yeniYazmaDurumu();
    }
  };

  const yanlisKaydet = () => {
    setHataSayisi((s) => s + 1);
    setKarakterDeneme((d) => {
      const yeni = d + 1;
      if (yeni >= 3 && !ipucuGoster) {
        setIpucuGoster(true);
        setTimeout(() => konus(`Yardım: ${yardimMetni()}`, { kesintiyle: true }), 1400);
      }
      return yeni;
    });
  };

  const karakteriTamamla = (anons) => {
    konus(anons, { kesintiyle: true });
    setHucreAdimi(0);
    setKonum((k) => k + 1);
    if (konum + 1 >= cumle.length) {
      setTimeout(() => basariBildir('Cümleyi tamamladınız.'), 600);
    }
  };

  const onHucre = (noktalar) => {
    if (!beklenen) return;

    // ÇOK HÜCRELİ karakter (â/q/w…): hücreleri HAM karşılaştır — `hucreyiIsle` [4] gibi bir
    // işaret hücresini "bilinmeyen" sayar ve durumRef'i (sayı/büyük harf modu) kirletirdi.
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
        `Yanlış. ${yazilanCh.toLocaleUpperCase('tr')} karakterini yazdınız, ` +
        `beklenen ${beklenen === ' ' ? 'boşluk' : beklenen.toLocaleUpperCase('tr')} karakteri.`
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
        `Yanlış. Boşluk yazdınız, beklenen ${beklenen.toLocaleUpperCase('tr')} karakteri.`
      );
      yanlisKaydet();
    }
  };

  const onSil = () => {
    // Çok hücreli karakterin ortasındaysak önce o karakterin adımını geri al.
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
        <PageHeader baslik="Yönergeli Cümle Yazma" />
        <div className="progress" aria-hidden="true">
          Cümle {cumleIdx + 1} / {CUMLELER.length} &nbsp;•&nbsp; {konum} / {cumle.length} karakter
          {hataSayisi > 0 && <> &nbsp;•&nbsp; Hata: {hataSayisi}</>}
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div className="yazma-metin" aria-label={`Hedef cümle: ${cumle}`}>
          <span className="yazilan">{yazilan}</span>
          {beklenen && <span className="bekleyen">{beklenen}</span>}
          <span className="kalan">{cumle.slice(konum + 1)}</span>
        </div>
        {ipucuGoster && beklenen && (
          <div className="yazma-ipucu" role="status" aria-live="polite">
            <b>Yardım:</b> {yardimMetni()}
          </div>
        )}
        <div role="status" aria-live="polite" className="sr-only">
          {yonerge()}
        </div>
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={!beklenen ? ileriCumle : undefined}
            vurguNoktalar={ipucuGoster ? beklenenNoktalar : []}
            klavyeIpucu={ipucuGoster}
            siralikTiklama
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button className="btn" type="button" onClick={yenidenBasla}>Bu Cümleyi Tekrar Yaz</button>
          {!beklenen && cumleIdx < CUMLELER.length - 1 && (
            <button className="btn" type="button" onClick={ileriCumle}>Sonraki Cümle</button>
          )}
        </div>
      </div>

      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={!beklenen ? ileriCumle : undefined}
          vurguNoktalar={ipucuGoster ? beklenenNoktalar : []}
          klavyeIpucu={ipucuGoster}
          anindaDokunma
          // ⚠ Fiziksel klavyeyi yalnız inline klavye yakalasın — bkz. YazmaYonergeli.jsx
          klavyeAcik={false}
        />
      </div>
    </div>
  );
}
