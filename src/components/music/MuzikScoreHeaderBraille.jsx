import React, { useMemo, useState } from 'react';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import BrailleDetayPanel from './BrailleDetayPanel.jsx';
import { BRAILLE_HUCRE_TEMA } from '../../utils/music-brf/musicConstants.js';

// Her bölüm (header satırı / başlangıç braille bölümü) ayrı bir renkle gösterilir.
const BOLUM_RENKLERI = [
  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }, // mavi
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }, // yeşil
  { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' }, // turuncu
  { bg: '#fdf4ff', border: '#f5d0fe', text: '#a21caf' }, // mor/magenta
  { bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490' }, // camgöbeği
  { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' }, // kırmızı
  { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' }, // menekşe
];

export default function MuzikScoreHeaderBraille({
  skorUstuHeaderSatirlari,
  baslangicBrailleBilgisi,
  // eslint-disable-next-line no-unused-vars
  gorunenSatirBrailleLejantMaplari,
  // eslint-disable-next-line no-unused-vars
  gorunenSatirBrailleLejantlari,
  // eslint-disable-next-line no-unused-vars
  baslangicBrailleLejantlari,
  // eslint-disable-next-line no-unused-vars
  baslangicBrailleLejantMapi,
  akordiyonsuz = false,
}) {
  const [acik, setAcik] = useState(false);
  const [hoverHeaderCellKey, setHoverHeaderCellKey] = useState(null);
  // Tıklanan hücrenin alt açıklama barı (BrailleDetayPanel) için.
  const [brailleDetay, setBrailleDetay] = useState(null);

  // akordiyonsuz modda içerik daima görünür (header butonu popup'ı için)
  const gosterilsin = akordiyonsuz || acik;

  const hasHeaderContent = useMemo(() => {
    return (
      Array.isArray(skorUstuHeaderSatirlari) && skorUstuHeaderSatirlari.length > 0
    ) || (baslangicBrailleBilgisi?.hucreOgeleri?.length > 0);
  }, [skorUstuHeaderSatirlari, baslangicBrailleBilgisi]);

  // Tüm bölümleri tek bir listede topla: her bölümün hücreleri birlikte,
  // açıklaması tek bir kez hücrelerin altında yazılır.
  const bolumGruplari = useMemo(() => {
    const gruplar = [];

    const etiketMap = {
      title: 'Başlık',
      composer: 'Besteci',
      tempo: 'Tempo',
      'key-signature': 'Donanım',
      'time-signature': 'Zaman',
    };

    // 1) Skor üstü header satırları (başlık, besteci, tempo, donanım, zaman)
    (Array.isArray(skorUstuHeaderSatirlari) ? skorUstuHeaderSatirlari : []).forEach((satir) => {
      const baslik = etiketMap[satir.kaynak] || 'Header';
      const aciklama = satir.etiket || '—';
      const displayText = ['tempo', 'key-signature', 'time-signature'].includes(satir.kaynak)
        ? aciklama
        : `${baslik}: ${aciklama}`;
      const hucreler = (Array.isArray(satir.hucreler) ? satir.hucreler : []).map((hucre) => ({
        hucre,
        anlam: {
          tip: satir.kaynak,
          kaynak: satir.kaynak,
          etiket: satir.etiket || baslik,
          baslik,
        },
      }));

      if (hucreler.length > 0) {
        gruplar.push({ etiket: displayText, hucreler });
      }
    });

    // 2) Başlangıç braille bölümleri — aynı bölüme (kaynak) ait ardışık hücreler
    //    birlikte gruplanır; açıklama bölümün ilk hücresinden tek sefer alınır.
    const ogeler = baslangicBrailleBilgisi?.hucreOgeleri || [];
    ogeler.forEach((item) => {
      const kaynak = String(item.anlam?.kaynak || item.anlam?.tip || '');
      const son = gruplar[gruplar.length - 1];
      if (son && son._baslangic && son._kaynak === kaynak) {
        son.hucreler.push(item);
      } else {
        // Bölümün hazır etiketi kullanılır ("Tempo: …", "Donanım: …", "Zaman: …",
        // "Sol anahtarı", "ölçü numarası"). Braille noktalarından kategori yeniden
        // türetilmez — aksi halde diyez/bemol hücresi yanlışlıkla "aksidental" olur.
        const etiket = item.anlam?.etiket || item.anlam?.ad || item.anlam?.baslik || '';
        gruplar.push({ etiket, hucreler: [item], _baslangic: true, _kaynak: kaynak });
      }
    });

    return gruplar;
  }, [skorUstuHeaderSatirlari, baslangicBrailleBilgisi]);

  if (!hasHeaderContent) {
    return null;
  }

  return (
    <div className="w-full mb-2">
      {!akordiyonsuz && (
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          className="w-full min-h-[40px] px-4 py-3 flex items-center justify-between gap-3 text-left text-sm font-semibold text-slate-900 transition duration-150 hover:bg-slate-50"
        >
          <span>Başlangıç / Header Braille Bilgileri</span>
          <span
            aria-hidden="true"
            className="text-lg leading-none transition-transform duration-150"
            style={{ transform: acik ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>
      )}

      {gosterilsin && (
        <div className="flex flex-wrap items-start gap-3 p-4">
          {bolumGruplari.map((grup, gi) => {
            const renk = BOLUM_RENKLERI[gi % BOLUM_RENKLERI.length];
            return (
              <div
                key={`header-bolum-${gi}`}
                className="flex flex-col items-center gap-1.5 max-w-full"
              >
                <div
                  className="flex flex-wrap items-center justify-center gap-0 rounded-lg px-2 py-1.5"
                  style={{ backgroundColor: renk.bg, border: `1px solid ${renk.border}` }}
                >
                  {grup.hucreler.map((item, ci) => {
                    const cellKey = `header:${gi}:${ci}`;
                    return (
                      <BrailleHucreMini
                        key={`header-cell-${gi}-${ci}`}
                        noktalar={item.hucre}
                        anlam={item.anlam}
                        etiketGizle
                        yerlesim={{
                          cfg: BRAILLE_HUCRE_TEMA.compact,
                          satirSayisi: 1,
                        }}
                        index={ci}
                        hoverAktif={hoverHeaderCellKey === cellKey}
                        seciliAktif={brailleDetay?.cellKey === cellKey}
                        onEnter={() => setHoverHeaderCellKey(cellKey)}
                        onLeave={() => setHoverHeaderCellKey(null)}
                        onClick={() => setBrailleDetay({
                          anlam: item.anlam,
                          hucre: item.hucre,
                          oge: null,
                          cellKey,
                        })}
                      />
                    );
                  })}
                </div>
                {grup.etiket && (
                  <span
                    className="text-[11px] leading-tight text-center font-medium max-w-[160px]"
                    style={{ color: renk.text }}
                  >
                    {grup.etiket}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tıklanan hücre açıklaması — popup'ların üstünde (z>200). */}
      <BrailleDetayPanel
        detay={brailleDetay}
        onKapat={() => setBrailleDetay(null)}
        style={{ zIndex: 260 }}
      />
    </div>
  );
}
