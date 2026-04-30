import React, { useEffect, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// Genel amaçlı çok hücreli sıralı okuma bileşeni.
// Her öge bir kelime/ifadedir; içindeki hücreler "hücre adımlama" modunda
// gösterilir: bir hücre büyük, altta tüm hücrelerin küçük önizlemesi.
// Bu sayede 6+ hücreli kelimeler mobilde de net okunur.
//
// ogeler: [{ yazi, okunus, anlam, hucreler: number[][] }]
// rtl: Arapça vb. sağdan sola yazı için.
export default function CokHucreOkuyucu({
  baslik,
  ogeler,
  bittiMesaji = 'Tebrikler! Tamamladınız.',
  rtl = false
}) {
  const [indeks, setIndeks] = useState(0);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const bitti = indeks >= ogeler.length;
  const aktif = ogeler[indeks];
  const hucreSayisi = aktif ? aktif.hucreler.length : 0;

  // Yeni kelimeye geçince ilk hücreden başla
  useEffect(() => { setHucreIndeksi(0); }, [indeks]);

  // Yeni kelime tanıtımı (kelime adı + okunuş + hücre sayısı)
  useEffect(() => {
    if (bitti) {
      konus(bittiMesaji);
      return;
    }
    const k = ogeler[indeks];
    const metin = `${k.yazi}, okunuşu: ${k.okunus}. ${k.anlam || ''} ` +
                  `${k.hucreler.length} braille hücresinden oluşur.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti, ogeler, bittiMesaji]);

  // Hücre değişince o hücrenin noktalarını seslendir (ilk hücre hariç)
  useEffect(() => {
    if (bitti || !aktif || hucreIndeksi === 0) return;
    const noktalar = aktif.hucreler[hucreIndeksi];
    konus(`${hucreIndeksi + 1}. hücre: ${noktalar.join(', ')} numaralı noktalar.`,
          { kesintiyle: true });
  }, [hucreIndeksi, indeks, aktif, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            {bittiMesaji}
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = aktif;
  const aktifNoktalar = k.hucreler[hucreIndeksi] || [];
  const sonHucre = hucreIndeksi >= hucreSayisi - 1;
  const ilkKelime = indeks === 0;

  const oncekiHucre = () => {
    if (hucreIndeksi > 0) {
      setHucreIndeksi((i) => i - 1);
    } else if (!ilkKelime) {
      // Önceki kelimenin son hücresine git
      const oncekiUz = ogeler[indeks - 1].hucreler.length;
      setIndeks((i) => i - 1);
      setTimeout(() => setHucreIndeksi(oncekiUz - 1), 0);
    }
  };
  const sonrakiHucre = () => {
    if (sonHucre) {
      basariBildir('Sıradaki kelime.');
      setTimeout(() => setIndeks((i) => i + 1), 500);
    } else {
      setHucreIndeksi((i) => i + 1);
    }
  };

  return (
    <div className="page">
      <div>
        <PageHeader baslik={baslik} />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {ogeler.length}
          {hucreSayisi > 1 && ` • Hücre ${hucreIndeksi + 1} / ${hucreSayisi}`}
        </div>
      </div>

      <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
        {/* Kelime/ifade yazısı */}
        <div
          lang={rtl ? 'ar' : undefined}
          style={{
            textAlign: 'center',
            fontSize: rtl ? '1.8em' : '1.6em',
            lineHeight: rtl ? 1.5 : 1.2,
            fontWeight: 700,
            color: 'var(--accent)',
            direction: rtl ? 'rtl' : 'ltr',
            margin: 0,
            padding: rtl ? '4px 0 0' : 0,
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}
        >
          {k.yazi}
        </div>

        {/* Aktif tek hücre — büyük */}
        <BrailleCell
          aktifNoktalar={aktifNoktalar}
          baslikAriaLabel={hucreSayisi > 1
            ? `${hucreIndeksi + 1}. hücre, toplam ${hucreSayisi} hücreden`
            : k.yazi}
        />

        {/* Tüm hücrelerin küçük önizlemesi — aktif olan vurgulanır */}
        {hucreSayisi > 1 && (
          <div className="hucre-onizleme" role="tablist" aria-label="Hücre listesi">
            {k.hucreler.map((noktalar, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === hucreIndeksi}
                className={`hucre-onizleme-oge ${i === hucreIndeksi ? 'aktif' : ''}`}
                onClick={() => setHucreIndeksi(i)}
                aria-label={`${i + 1}. hücreye git`}
              >
                <span className="hucre-onizleme-grid" aria-hidden="true">
                  {[1, 4, 2, 5, 3, 6].map((n) => (
                    <span
                      key={n}
                      className={`hucre-onizleme-nokta ${noktalar.includes(n) ? 'on' : ''}`}
                    />
                  ))}
                </span>
                <span className="hucre-onizleme-no" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
          </div>
        )}

        {/* Okunuş + anlam */}
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.15em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.okunus}”
        </div>
        {k.anlam && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9em', maxWidth: 560, margin: '0 auto' }}>
            {k.anlam}
          </div>
        )}
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${k.yazi}, okunuşu ${k.okunus}. ${k.anlam || ''}`, { kesintiyle: true })}
        >
          Tekrar Dinle
        </button>
        {hucreSayisi > 1 ? (
          <>
            <button type="button" disabled={ilkKelime && hucreIndeksi === 0} onClick={oncekiHucre}>
              ← Önceki Hücre
            </button>
            <button type="button" onClick={sonrakiHucre}>
              {sonHucre ? 'Sıradaki Kelime →' : 'Sonraki Hücre →'}
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={ilkKelime}
                    onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
              ← Önceki
            </button>
            <button
              type="button"
              onClick={() => {
                basariBildir('Sıradaki.');
                setTimeout(() => setIndeks((i) => i + 1), 500);
              }}
            >
              Anladım →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

