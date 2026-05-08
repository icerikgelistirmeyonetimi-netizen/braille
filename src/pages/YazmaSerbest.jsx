import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import {
  heceAra, birHarfAra, kokIsaretiMi, kokAra,
  ikiHarfBirinciMi, ikiHarfAra,
  parcaBirinciMi, parcaAra
} from '../utils/kisaltmaCevir.js';

// Serbest yazma: kullanıcı istediğini yazar; her karakter anında seslendirilir.
// Kısaltma modunda hece, bir harfli, iki harfli, kök ve parça kısaltmaları da tanınır.
export default function YazmaSerbest() {
  const [metin, setMetin] = useState('');
  const durumRef = useRef(yeniYazmaDurumu());

  // Kısaltma modu: localStorage'a kaydedilir
  const [kisaltmaModu, setKisaltmaModu] = useState(
    () => localStorage.getItem('serbestKisaltmaModu') === '1'
  );
  // İki hücreli kısaltmalar için buffer: ilk hücre bekleniyor
  const bekleyenRef = useRef(null); // number[] | null
  const [bekleyenGoster, setBekleyenGoster] = useState(false);

  const kisaltmaModuToggle = () => setKisaltmaModu((v) => {
    const yeni = !v;
    localStorage.setItem('serbestKisaltmaModu', yeni ? '1' : '0');
    konus(yeni ? 'Kısaltma modu açık.' : 'Kısaltma modu kapalı.', { kesintiyle: true });
    // Bekleyeni temizle
    bekleyenRef.current = null;
    setBekleyenGoster(false);
    return yeni;
  });

  // Mevcut bekleyeni normal harf/kısaltma olarak metne ekle
  const bekleyeniBitir = () => {
    const bek = bekleyenRef.current;
    bekleyenRef.current = null;
    setBekleyenGoster(false);
    if (!bek) return;
    const birHarf = birHarfAra(bek);
    if (birHarf) {
      setMetin((m) => m + birHarf + ' ');
      return;
    }
    // Normal karakter olarak işle
    const r = hucreyiIsle(durumRef.current, bek);
    if (r.tip !== 'bilinmeyen' && r.deger) setMetin((m) => m + r.deger);
  };

  // Kısaltma modunda tek bir hücreyi işle (bekleyen yokken çağırılır)
  const kisaltmaTekHucresi = (noktalar) => {
    // 1. Hece kısaltması (önce çünkü benzersiz desenler)
    const hece = heceAra(noktalar);
    if (hece) {
      setMetin((m) => m + hece);
      konus(hece, { kesintiyle: true });
      return;
    }
    // 2. Kök işareti ([5]) → buffer'la
    if (kokIsaretiMi(noktalar)) {
      bekleyenRef.current = noktalar;
      setBekleyenGoster(true);
      konus('kök işareti, ikinci hücreyi bekliyor', { kesintiyle: true });
      return;
    }
    // 3. İki harfli / parça kısaltmasının ilk hücresi → buffer'la
    if (ikiHarfBirinciMi(noktalar) || parcaBirinciMi(noktalar)) {
      bekleyenRef.current = noktalar;
      setBekleyenGoster(true);
      // Kısa titreme gibi geri bildirim; sesli oku
      const birHarfAnlam = birHarfAra(noktalar);
      konus(birHarfAnlam ? `${birHarfAnlam}?` : '...', { kesintiyle: true });
      return;
    }
    // 4. Bir harfli kısaltma
    const birHarf = birHarfAra(noktalar);
    if (birHarf) {
      setMetin((m) => m + birHarf + ' ');
      konus(birHarf, { kesintiyle: true });
      return;
    }
    // 5. Normal karakter
    normalIsle(noktalar);
  };

  // Normal (kısaltmasız) hücre işleme
  const normalIsle = (noktalar) => {
    const r = hucreyiIsle(durumRef.current, noktalar);
    if (r.tip === 'isaret') {
      konus(r.anons, { kesintiyle: true });
      return;
    }
    if (r.tip === 'bilinmeyen' || r.deger === null) {
      konus('tanımsız hücre', { kesintiyle: true });
      return;
    }
    setMetin((m) => m + r.deger);
    konus(r.anons, { kesintiyle: true });
  };

  useEffect(() => {
    konus(
      'Serbest yazma. İstediğiniz harfleri yazabilirsiniz. ' +
      'Bir harfi yazmak için, o harfin nokta düğmelerine ' +
      'aynı anda parmaklarınızla basıp birlikte bırakın. ' +
      'Her hücre okunacaktır. Tüm metni dinlemek için Onay düğmesine basın. ' +
      'Boşluk için Boşluk, silmek için Sil düğmesini kullanın.'
    );
    const tekrar = () => konus(
      'Serbest yazma modu. Bir harfin tüm noktalarına aynı anda basıp birlikte bırakın. ' +
      'Onay düğmesi tüm metni okur.',
      { kesintiyle: true }
    );
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      konusmayiDurdur();
    };
  }, []);

  const onHucre = (noktalar) => {
    if (kisaltmaModu) {
      // Bekleyen hücre varken yeni hücre geldi
      if (bekleyenRef.current !== null) {
        const bek = bekleyenRef.current;
        bekleyenRef.current = null;
        setBekleyenGoster(false);

        // Kök işareti + sağ hücre
        if (kokIsaretiMi(bek)) {
          const kelime = kokAra(noktalar);
          if (kelime) {
            setMetin((m) => m + kelime + ' ');
            konus(kelime, { kesintiyle: true });
            return;
          }
          // Kök tamamlanamadı; bekleyeni sil, yeni hücreyi tekrar değerlendir
          konus('kök tamamlanamadı', { kesintiyle: true });
          kisaltmaTekHucresi(noktalar);
          return;
        }

        // İki harfli kısaltma
        const ikiHarf = ikiHarfAra(bek, noktalar);
        if (ikiHarf) {
          setMetin((m) => m + ikiHarf + ' ');
          konus(ikiHarf, { kesintiyle: true });
          return;
        }

        // Kelime parçası kısaltma
        const parca = parcaAra(bek, noktalar);
        if (parca) {
          setMetin((m) => m + '-' + parca);
          konus(parca, { kesintiyle: true });
          return;
        }

        // Bekleyen çözülmedi: bekleyeni commit et, yeni hücreyi baştan işle
        const birHarfBek = birHarfAra(bek);
        if (birHarfBek) {
          setMetin((m) => m + birHarfBek + ' ');
          konus(birHarfBek, { kesintiyle: false });
        } else {
          const r = hucreyiIsle(durumRef.current, bek);
          if (r.tip !== 'bilinmeyen' && r.deger) setMetin((m) => m + r.deger);
        }
        kisaltmaTekHucresi(noktalar);
        return;
      }

      // Bekleyen yok → tek hücre işle
      kisaltmaTekHucresi(noktalar);
      return;
    }

    // Normal mod
    normalIsle(noktalar);
  };

  const onBosluk = () => {
    // Bekleyen varsa önce commit et
    bekleyeniBitir();
    setMetin((m) => m + ' ');
    konus('boşluk', { kesintiyle: true });
  };

  const onSil = () => {
    // Bekleyen varsa iptal et (silme gibi davran)
    if (bekleyenRef.current !== null) {
      bekleyenRef.current = null;
      setBekleyenGoster(false);
      konus('iptal edildi', { kesintiyle: true });
      return;
    }
    setMetin((m) => {
      if (m.length === 0) {
        konus('metin boş', { kesintiyle: true });
        return m;
      }
      konus('silindi', { kesintiyle: true });
      return m.slice(0, -1);
    });
  };

  const tumunuOku = () => {
    bekleyeniBitir();
    if (metin.trim().length === 0) {
      konus('Henüz hiçbir şey yazmadınız.', { kesintiyle: true });
      return;
    }
    konus(metin, { kesintiyle: true });
  };

  const temizle = () => {
    setMetin('');
    durumRef.current = yeniYazmaDurumu();
    bekleyenRef.current = null;
    setBekleyenGoster(false);
    konus('Metin temizlendi.', { kesintiyle: true });
  };

  return (
    <div className="page yazma-page">
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Serbest Yazma" />
        <div className="progress" aria-hidden="true">
          {metin.length} karakter
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div
          className="yazma-metin yazma-serbest-cikti"
          aria-live="polite"
          aria-label={`Yazılan metin: ${metin || 'boş'}`}
        >
          {metin || <span className="kalan">(yazmaya başlayın)</span>}
          {bekleyenGoster && <span className="kisaltma-bekleyen">&#8230;</span>}
        </div>

        {/* Dikeyde klavye burada inline; yatayda CSS ile gizlenir */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={tumunuOku}
            siralikTiklama
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button type="button" onClick={tumunuOku}>Tümünü Oku</button>
          <button type="button" onClick={temizle}>Temizle</button>
          <button
            type="button"
            className={kisaltmaModu ? 'aktif' : ''}
            aria-pressed={kisaltmaModu}
            onClick={kisaltmaModuToggle}
            title="Kısaltmaları tanı ve kısaltma kullanarak yaz"
          >Kısaltma Modu</button>
        </div>
      </div>

      {/* Yatayda tam ekran şeffaf popup klavye */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={tumunuOku}
          siralikTiklama
        />
      </div>
    </div>
  );
}
