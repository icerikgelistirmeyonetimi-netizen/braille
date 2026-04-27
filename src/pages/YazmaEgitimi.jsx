import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { HARFLER } from '../data/braille.js';

// Perkins klavye eğitimi: tuş düzenini ve aynı anda basma mantığını öğretir.
// Adımlar:
//   0 - Tanıtım
//   1 - Tek nokta tanıtımı (1..6)
//   2 - İki nokta kombinasyonu (örn. B = 1+2)
//   3 - Bir harfi yazdırma (örn. L = 1,2,3)
//   4 - Boşluk / sil tanıtımı
//   5 - Tamamlandı

export default function YazmaEgitimi() {
  const [adim, setAdim] = useState(0);
  // Tek nokta turu için hedef
  const [tekHedef, setTekHedef] = useState(1);
  // Harf turu için hedef harf
  const HARF_HEDEFLERI = ['B', 'L', 'M']; // 1+2 / 1+2+3 / 1+3+4
  const [harfIdx, setHarfIdx] = useState(0);

  const durumRef = useRef(yeniYazmaDurumu());

  const harfNoktalari = (h) => {
    const x = HARFLER.find((k) => k.harf === h);
    return x ? x.noktalar : [];
  };

  // Yönerge metinleri
  const yonerge = () => {
    switch (adim) {
      case 0:
        return 'Perkins Braille klavyesine hoş geldiniz. Bu klavyede altı nokta vardır. ' +
               'Sol elin işaret, orta ve yüzük parmakları sırasıyla 1, 2 ve 3 numaralı noktalara; ' +
               'sağ elin işaret, orta ve yüzük parmakları ise 4, 5 ve 6 numaralı noktalara basar. ' +
               'Bilgisayarda F, D ve S tuşları sol noktaları; J, K ve L tuşları sağ noktaları temsil eder. ' +
               'Bir harfi oluşturmak için gerekli noktalara aynı anda basıp aynı anda bırakırsınız. ' +
               'Devam etmek için ekrana iki kez dokunun veya Onay düğmesine basın.';
      case 1:
        return `Önce tek tek noktaları tanıyalım. Lütfen sadece ${tekHedef} numaralı noktaya basıp bırakın. ` +
               (tekHedef <= 3
                 ? 'Bilgisayarda ' + ({1:'F',2:'D',3:'S'}[tekHedef]) + ' tuşu.'
                 : 'Bilgisayarda ' + ({4:'J',5:'K',6:'L'}[tekHedef]) + ' tuşu.');
      case 2:
        return 'Şimdi iki noktayı aynı anda basmayı deneyelim. ' +
               '1 ve 2 numaralı noktaları aynı anda basıp aynı anda bırakın. ' +
               'Bu, B harfini oluşturur. Bilgisayarda F ve D tuşlarına aynı anda basın.';
      case 3: {
        const harf = HARF_HEDEFLERI[harfIdx];
        const nk = harfNoktalari(harf).join(', ');
        return `Şimdi bir harf yazalım. ${harf} harfi için ${nk} numaralı noktalara aynı anda basıp bırakın.`;
      }
      case 4:
        return 'Son olarak boşluk ve sil düğmelerini tanıyalım. ' +
               'Boşluk için Boşluk düğmesine veya bilgisayarda boşluk tuşuna; ' +
               'silmek için Sil düğmesine veya Backspace tuşuna basın. ' +
               'Devam etmek için Onay düğmesine basın.';
      case 5:
        return 'Tebrikler! Perkins klavye eğitimini tamamladınız. ' +
               'Artık Yönergeli Yazma veya Serbest Yazma bölümlerine geçebilirsiniz.';
      default:
        return '';
    }
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
  }, [adim, tekHedef, harfIdx]);

  const onHucre = (noktalar) => {
    if (adim === 1) {
      if (noktalar.length === 1 && noktalar[0] === tekHedef) {
        basariBildir(`Doğru. ${tekHedef} numaralı nokta.`);
        if (tekHedef < 6) {
          setTimeout(() => setTekHedef((h) => h + 1), 1100);
        } else {
          setTimeout(() => { setAdim(2); }, 1300);
        }
      } else {
        hataBildir(`Sadece ${tekHedef} numaralı noktaya basmalısınız.`);
      }
      return;
    }
    if (adim === 2) {
      if (noktalar.length === 2 && noktalar.includes(1) && noktalar.includes(2)) {
        basariBildir('Harika! Bu B harfidir.');
        setTimeout(() => setAdim(3), 1300);
      } else {
        hataBildir('1 ve 2 numaralı noktalara aynı anda basın.');
      }
      return;
    }
    if (adim === 3) {
      const harf = HARF_HEDEFLERI[harfIdx];
      const hedef = harfNoktalari(harf);
      const ayni =
        noktalar.length === hedef.length &&
        hedef.every((n) => noktalar.includes(n));
      if (ayni) {
        basariBildir(`Doğru. ${harf} harfini yazdınız.`);
        if (harfIdx < HARF_HEDEFLERI.length - 1) {
          setTimeout(() => setHarfIdx((i) => i + 1), 1200);
        } else {
          setTimeout(() => setAdim(4), 1400);
        }
      } else {
        const r = hucreyiIsle(durumRef.current, noktalar);
        hataBildir(
          r.tip === 'karakter'
            ? `Bu ${r.anons} harfi. Hedef ${harf} harfi.`
            : `Yanlış kombinasyon. ${harf} için ${hedef.join(', ')} noktalarına basın.`
        );
      }
      return;
    }
    // Diğer adımlarda hücre işleme yok
  };

  const ileri = () => {
    if (adim === 0) setAdim(1);
    else if (adim === 4) setAdim(5);
  };

  const yenidenBasla = () => {
    setAdim(0);
    setTekHedef(1);
    setHarfIdx(0);
    durumRef.current = yeniYazmaDurumu();
  };

  // Vurgulanan noktalar (görsel ipucu)
  let vurgu = [];
  if (adim === 1) vurgu = [tekHedef];
  else if (adim === 2) vurgu = [1, 2];
  else if (adim === 3) vurgu = harfNoktalari(HARF_HEDEFLERI[harfIdx]);

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Perkins Klavye Eğitimi" />
        <div className="progress" aria-hidden="true">
          Adım {Math.min(adim + 1, 6)} / 6
        </div>
      </div>

      <div className="page-mid">
        <div role="status" aria-live="polite" className="sr-only">
          {yonerge()}
        </div>

        <div className="yazma-bilgi" aria-hidden="true">
          {adim === 1 && <p><b>Hedef:</b> Sadece <b>{tekHedef}</b> numaralı nokta</p>}
          {adim === 2 && <p><b>Hedef:</b> 1 + 2 noktaları (B harfi)</p>}
          {adim === 3 && (
            <p>
              <b>Hedef:</b> {HARF_HEDEFLERI[harfIdx]} harfi —{' '}
              noktalar: {harfNoktalari(HARF_HEDEFLERI[harfIdx]).join(', ')}
            </p>
          )}
          {adim === 0 && (
            <div>
              <p><b>Klavye düzeni:</b></p>
              <p>Sol el: <kbd>F</kbd>=1 &nbsp; <kbd>D</kbd>=2 &nbsp; <kbd>S</kbd>=3</p>
              <p>Sağ el: <kbd>J</kbd>=4 &nbsp; <kbd>K</kbd>=5 &nbsp; <kbd>L</kbd>=6</p>
              <p><kbd>Space</kbd>=boşluk &nbsp; <kbd>Backspace</kbd>=sil &nbsp; <kbd>Enter</kbd>=onay</p>
            </div>
          )}
          {adim === 4 && <p>Boşluk ve Sil düğmelerini deneyin, hazır olunca Onay'a basın.</p>}
          {adim === 5 && <p>Eğitim tamamlandı.</p>}
        </div>

        {adim < 5 && (
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={() => { if (adim === 4) konus('Boşluk'); }}
            onSil={() => { if (adim === 4) konus('Sil'); }}
            onEnter={ileri}
            vurguNoktalar={vurgu}
            klavyeIpucu
          />
        )}
      </div>

      <div className="controls">
        {(adim === 0 || adim === 4) && (
          <button type="button" onClick={ileri}>Devam Et</button>
        )}
        <button type="button" onClick={yenidenBasla}>Baştan Başla</button>
      </div>
    </div>
  );
}
