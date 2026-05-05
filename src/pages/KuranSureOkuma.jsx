import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KURAN_SURELERI } from '../data/kuranSureler.js';
import { konus, konusmayiDurdur } from '../utils/ses.js';

export default function KuranSureOkuma() {
  const [seciliSure, setSeciliSure] = useState(null);

  useEffect(() => {
    if (!seciliSure) {
      konus('Kısa sureler. Bir sure seç ve kelime kelime okumaya başla.');
    }
    return () => konusmayiDurdur();
  }, [seciliSure]);

  if (seciliSure) {
    return (
      <CokHucreOkuyucu
        baslik={`${seciliSure.ad} Sûresi`}
        ogeler={seciliSure.kelimeler}
        bittiMesaji={`Tebrikler! ${seciliSure.ad} sûresini tamamladın.`}
        rtl
        bolumAnahtari={`kuran-sure-${seciliSure.ad}`}
      />
    );
  }

  return (
    <div className="page">
      <PageHeader baslik="Kısa Sureler" />
      <div
        className="page-mid"
        style={{
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          gap: 12,
          paddingTop: 8,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: 540, margin: '0 auto', flex: '0 0 auto' }}>
          Bir sure seç. Kelime kelime, ayet bilgisiyle birlikte braille hücreleri olarak okunur.
        </div>
        <div
          className="sure-listesi"
          role="list"
          style={{ margin: '0 auto', flex: '1 1 auto', overflowY: 'auto', minHeight: 0, paddingBottom: 12 }}
        >
          {KURAN_SURELERI.map((s) => (
            <button
              key={s.no}
              type="button"
              role="listitem"
              className="sure-karti"
              onClick={() => {
                konusmayiDurdur();
                setSeciliSure(s);
              }}
              aria-label={`${s.ad} sûresi, ${s.ayetSayisi} ayet`}
            >
              <span className="sure-karti-no">{s.no}</span>
              <span className="sure-karti-ad">{s.ad}</span>
              <span className="sure-karti-ar" aria-hidden="true">{s.adAr}</span>
              <span className="sure-karti-ayet">{s.ayetSayisi} ayet</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
