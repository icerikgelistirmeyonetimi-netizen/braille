import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { indeksKaydet } from '../utils/ilerleme.js';
import { HARFLER, NOKTALAMA } from '../data/braille.js';
import { YAZMA_KELIMELERI } from '../data/yazmaKelimeleri.js';

// Yönergeli yazma: kullanıcıya bir cümle verilir, tek tek karakter yazması istenir.
// Hatalı karakterde anında uyarı; doğruda ilerle. Bittiğinde tebrik.

const CUMLELER = YAZMA_KELIMELERI;

// Karakteri nokta dizisine çevirir (yardım için)
const NOKTA_TUS = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };
function karakterinNoktalari(ch) {
  if (!ch) return [];
  if (ch === ' ') return [];
  const ust = ch.toLocaleUpperCase('tr');
  const h = HARFLER.find((x) => x.harf === ust);
  if (h) return h.noktalar;
  const n = NOKTALAMA.find((x) => x.isaret === ch);
  if (n) return n.noktalar;
  return [];
}

export default function YazmaYonergeli() {
  const [cumleIdx, setCumleIdx] = useState(0);

  useEffect(() => { indeksKaydet('yazma-yonergeli', cumleIdx); }, [cumleIdx]);
  const [konum, setKonum] = useState(0); // doğru yazılan karakter sayısı
  const [hataSayisi, setHataSayisi] = useState(0);
  // Aynı karakter için ardışık yanlış deneme sayısı
  const [karakterDeneme, setKarakterDeneme] = useState(0);
  const [ipucuGoster, setIpucuGoster] = useState(false);
  const durumRef = useRef(yeniYazmaDurumu());

  const cumle = CUMLELER[cumleIdx];
  const yazilan = cumle.slice(0, konum);
  const beklenen = cumle[konum]; // undefined ise tamam
  const beklenenNoktalar = karakterinNoktalari(beklenen);

  const yardimMetni = () => {
    if (!beklenen || beklenen === ' ') {
      return 'Boşluk düğmesine veya boşluk tuşuna basın.';
    }
    if (beklenenNoktalar.length === 0) return '';
    const nk = beklenenNoktalar.join(', ');
    const tuslar = beklenenNoktalar.map((n) => NOKTA_TUS[n]).join(' ve ');
    return `${beklenen.toLocaleUpperCase('tr')} harfi için ${nk} numaralı noktalara, ` +
           `klavyede ${tuslar} tuşlarına aynı anda parmaklarınızla basıp birlikte bırakın.`;
  };

  const yonerge = () => {
    if (!beklenen) {
      return `Tebrikler! "${cumle}" cümlesini tamamladınız. ` +
             (cumleIdx < CUMLELER.length - 1
               ? 'Sonraki cümleye geçmek için Onay düğmesine basın.'
               : 'Tüm cümleleri tamamladınız.');
    }
    if (konum === 0) {
      return `Şu metni yazın: ${cumle}. ` +
             `Lütfen "${beklenen === ' ' ? 'boşluk' : beklenen}" karakteriyle başlayın. ` +
             `Bir harfi yazmak için, o harfin nokta düğmelerine aynı anda parmaklarınızla basıp birlikte bırakın.`;
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
  }, [cumleIdx, konum]);

  // Karakter değiştiğinde deneme sayacını ve ipucunu sıfırla
  useEffect(() => {
    setKarakterDeneme(0);
    setIpucuGoster(false);
  }, [konum, cumleIdx]);

  const ileriCumle = () => {
    if (cumleIdx < CUMLELER.length - 1) {
      setCumleIdx((i) => i + 1);
      setKonum(0);
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

  const onHucre = (noktalar) => {
    if (!beklenen) return;
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
      konus(yazilanCh, { kesintiyle: true });
      setKonum((k) => k + 1);
      // Cümle bittiyse tebrik
      if (konum + 1 >= cumle.length) {
        setTimeout(() => basariBildir('Cümleyi tamamladınız.'), 600);
      }
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
    if (konum > 0) {
      setKonum((k) => k - 1);
      konus('silindi', { kesintiyle: true });
    }
  };

  const yenidenBasla = () => {
    setKonum(0);
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
          Cümle {cumleIdx + 1} / {CUMLELER.length} &nbsp;•&nbsp; {konum} / {cumle.length} karakter
          {hataSayisi > 0 && <> &nbsp;•&nbsp; Hata: {hataSayisi}</>}
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div className="yazma-metin" aria-label={`Hedef metin: ${cumle}`}>
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
        {/* Dikeyde klavye burada (orta bölmede) görünür. Yatayda CSS ile gizlenir. */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={!beklenen ? ileriCumle : undefined}
            vurguNoktalar={ipucuGoster ? beklenenNoktalar : []}
            klavyeIpucu={ipucuGoster}
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button type="button" onClick={yenidenBasla}>Bu Cümleyi Tekrar Yaz</button>
          {!beklenen && cumleIdx < CUMLELER.length - 1 && (
            <button type="button" onClick={ileriCumle}>Sonraki Cümle</button>
          )}
        </div>
      </div>

      {/* Yatayda ekranın altında popup klavye. Dikeyde CSS ile gizlenir. */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={!beklenen ? ileriCumle : undefined}
          vurguNoktalar={ipucuGoster ? beklenenNoktalar : []}
          klavyeIpucu={ipucuGoster}
        />
      </div>
    </div>
  );
}
