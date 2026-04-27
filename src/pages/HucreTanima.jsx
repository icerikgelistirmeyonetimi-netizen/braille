import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { konus, basariBildir, hataBildir } from '../utils/ses.js';
import { deseniGonder, deseniTemizle } from '../utils/arduino.js';

// Hücre Tanıma: Sıralı olarak 1'den 6'ya kadar her noktayı tanıt ve dokunmasını iste.
export default function HucreTanima() {
  const [hedef, setHedef] = useState(1);
  const [dogru, setDogru] = useState([]);
  const [yanlis, setYanlis] = useState([]);

  useEffect(() => {
    if (hedef <= 6) {
      konus(
        `${hedef} numaralı noktayı tanıyalım. Lütfen ${hedef} numaralı noktaya dokunun.`
      );
    } else {
      konus(
        'Tebrikler! Altı noktanın tamamını öğrendiniz. Bu hücre Braille alfabesinin temelidir.'
      );
    }
    const tekrar = () => {
      if (hedef <= 6) konus(`Lütfen ${hedef} numaralı noktaya dokunun.`, { kesintiyle: true });
      else konus('Tüm noktaları tamamladınız.', { kesintiyle: true });
    };
    window.addEventListener('yonergeTekrar', tekrar);
    // Aktif noktayı Arduino'ya gönder
    if (hedef <= 6) deseniGonder([hedef]); else deseniTemizle();
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
    };
  }, [hedef]);

  // Sayfadan çıkarken hücreyi indir
  useEffect(() => () => { deseniTemizle(); }, []);

  const tikla = (n) => {
    if (hedef > 6) return;
    if (n === hedef) {
      basariBildir(`Doğru! ${n} numaralı nokta.`);
      setDogru((d) => [...d, n]);
      setYanlis([]);
      setTimeout(() => setHedef((h) => h + 1), 1100);
    } else {
      hataBildir(
        `Bu ${n} numaralı nokta. Aradığımız ${hedef} numaralı nokta. Tekrar deneyin.`
      );
      setYanlis([n]);
    }
  };

  const yenidenBasla = () => {
    setDogru([]);
    setYanlis([]);
    setHedef(1);
  };

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Hücreyi Tanı" />
        <div className="progress" aria-hidden="true">
          İlerleme: {Math.min(hedef - 1, 6)} / 6
        </div>
      </div>

      <div className="page-mid">
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
          {hedef <= 6
            ? `Yönerge: ${hedef} numaralı noktaya dokunun.`
            : 'Tebrikler! Tüm noktaları öğrendiniz.'}
        </div>
        <BrailleCell
          tiklanabilir
          onNoktaTikla={tikla}
          hedefNoktalar={hedef <= 6 ? [hedef] : []}
          dogruNoktalar={dogru}
          yanlisNoktalar={yanlis}
        />
      </div>

      <div className="controls">
        <button type="button" onClick={yenidenBasla}>Baştan Başla</button>
        {hedef <= 6 && (
          <button
            type="button"
            onClick={() =>
              konus(`Şu anda ${hedef} numaralı noktayı arıyorsunuz.`)
            }
          >
            Yönergeyi Tekrarla
          </button>
        )}
      </div>
    </div>
  );
}
