import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';

// Serbest yazma: kullanıcı istediğini yazar; her karakter anında seslendirilir.
// Onay (Enter) düğmesine basınca yazılan tüm metin baştan okunur.
export default function YazmaSerbest() {
  const [metin, setMetin] = useState('');
  const durumRef = useRef(yeniYazmaDurumu());

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

  const onBosluk = () => {
    setMetin((m) => m + ' ');
    konus('boşluk', { kesintiyle: true });
  };

  const onSil = () => {
    setMetin((m) => {
      if (m.length === 0) {
        konus('metin boş', { kesintiyle: true });
        return m;
      }
      const yeni = m.slice(0, -1);
      konus('silindi', { kesintiyle: true });
      return yeni;
    });
  };

  const tumunuOku = () => {
    if (metin.trim().length === 0) {
      konus('Henüz hiçbir şey yazmadınız.', { kesintiyle: true });
      return;
    }
    konus(metin, { kesintiyle: true });
  };

  const temizle = () => {
    setMetin('');
    durumRef.current = yeniYazmaDurumu();
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
        </div>

        {/* Dikeyde klavye burada inline; yatayda CSS ile gizlenir */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={tumunuOku}
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button type="button" onClick={tumunuOku}>Tümünü Oku</button>
          <button type="button" onClick={temizle}>Temizle</button>
        </div>
      </div>

      {/* Yatayda tam ekran şeffaf popup klavye */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={tumunuOku}
        />
      </div>
    </div>
  );
}
