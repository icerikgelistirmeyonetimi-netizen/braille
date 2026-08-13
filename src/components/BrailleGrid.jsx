import React, { memo, useCallback, useMemo, useRef } from 'react';
import BrailleCell from './BrailleCell.jsx';
import { hucreParaBirimiKaynakBaglamiMi } from '../utils/paraBirimiKaynak.js';
import { satirKonumMetni } from '../utils/noktaYardimci.js';

const VARSAYILAN_RENKLER = { noktaRenk: '#3b82f6', etiketRenk: '#000000' };
const NOKTALAMA_RENKLERI = { noktaRenk: '#10b981', etiketRenk: '#10b981' };
const KISALTMA_RENKLERI = { noktaRenk: '#ef4444', etiketRenk: '#ef4444' };
const ISLEM_RENKLERI = { noktaRenk: '#7c3aed', etiketRenk: '#7c3aed' };
const ISARET_RENKLERI = { noktaRenk: '#000000', etiketRenk: '#000000' };
const BIRIM_RENKLERI = {
  noktaRenk: 'var(--braille-noktalama-fill)',
  etiketRenk: 'var(--braille-noktalama-fill)',
};

function noktaAnahtari(noktalar) {
  return Array.isArray(noktalar) && noktalar.length ? noktalar.join(',') : '';
}

/**
 * Hücrenin ekran okuyucu etiketi: ANLAM + nokta listesi.
 * Görsel `noktaStr` " · " ile ayırır (ekran okuyucuda kötü okunur) → virgüle çevrilir.
 * Boşluk hücresinde nokta listesi ("—") anlamsız → yalnız "Boşluk" okunur.
 * ⚠ Araclar.jsx tablet görünümündeki BrailleHucreBileseni'nde AYNI mantık var; birini
 * değiştirince diğerini de güncelle.
 */
export function hucreAriaEtiketi(anlam) {
  if (!anlam) return undefined;
  const baslik = anlam.baslik || '';
  if (anlam.tip === 'bosluk') return baslik || 'Boşluk';
  const noktalar = typeof anlam.noktaStr === 'string' ? anlam.noktaStr.replace(/\s*·\s*/g, ', ') : '';
  return noktalar && noktalar !== '—' ? `${baslik}, nokta ${noktalar}` : baslik;
}

function anlamRenkleri(anlam, paraBirimiHucre) {
  const baslik = anlam && typeof anlam.baslik === 'string' ? anlam.baslik : '';
  if (paraBirimiHucre || baslik.includes('Birim')) return BIRIM_RENKLERI;
  if (!anlam) return VARSAYILAN_RENKLER;
  const kisaltma = anlam.tip === 'kisaltma'
    || (anlam.tip === 'isaret' && (baslik.includes('Kök') || baslik.includes('Parça') || baslik.includes('Ayırma')));
  if (kisaltma) return KISALTMA_RENKLERI;
  if (anlam.tip === 'noktalama') return NOKTALAMA_RENKLERI;
  if (anlam.tip === 'islem' || (anlam.tip === 'isaret' && baslik.includes('Bölük'))) return ISLEM_RENKLERI;
  if (anlam.tip === 'isaret') return ISARET_RENKLERI;
  return VARSAYILAN_RENKLER;
}

function anlamKarsilastirmaAnahtari(anlam) {
  if (!anlam) return '';
  return [
    anlam.tip,
    anlam.baslik,
    anlam.detay,
    anlam.noktaStr,
    anlam.etiket,
    anlam.harf,
    anlam.isaret,
  ].map((deger) => String(deger ?? '')).join('|');
}

const BrailleGridHucre = memo(function BrailleGridHucre({
  globalIdx,
  noktalar,
  anlam,
  anlamKey,
  etiket,
  genisletAktif,
  paraBirimiHucre,
  isSecili,
  isVurgulu,
  onSelect,
  // ── Elle nokta düzenleme (Modül 10 metin→brf; bkz. Araclar.jsx `hucreNoktasiniDegistir`) ──
  // Verilince noktalar Alt+Shift+ok ile gezilebilir (programatik odak, Tab sırasına GİRMEZ)
  // ve Enter/Space ile aç/kapa yapılabilir. Verilmezse davranış AYNEN eskisi gibi (pasif özet).
  onNoktaDegistir,
  onHucreKenari,
  onHucreKlavye,
  elleDuzenli = false,
  // Ekran okuyucu etiketinin sonuna eklenen satır içi konum ("2. satırın 5. hücresi").
  // Boş string → eklenmez (davranış eskisi gibi).
  konumEtiketi = '',
}) {
  const { noktaRenk, etiketRenk } = useMemo(
    () => anlamRenkleri(anlam, paraBirimiHucre),
    [anlamKey, anlam, paraBirimiHucre],
  );
  const style = useMemo(() => ({
    '--dot-active-color': noktaRenk,
    '--hucre-etiket-rengi': etiketRenk,
  }), [noktaRenk, etiketRenk]);
  const boslukMu = anlam && anlam.tip === 'bosluk';
  const sinif = 'belge-braille-hucre'
    + (boslukMu ? ' belge-braille-hucre--bosluk' : '')
    + (isSecili ? ' secili' : '')
    + (isVurgulu ? ' metin-secim-vurgu' : '')
    + (paraBirimiHucre ? ' para-birimi-hucre' : '')
    + (elleDuzenli ? ' hucre-elle-duzenli' : '');
  const sec = useCallback(() => {
    onSelect(globalIdx, anlam);
  }, [onSelect, globalIdx, anlam]);
  const tusla = useCallback((e) => {
    // Alt+Shift+ok → hücrenin noktalarına gir (varsa); tüketilmezse Enter/Space seçime düşer.
    if (onHucreKlavye && onHucreKlavye(e, globalIdx)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(globalIdx, anlam);
    }
  }, [onSelect, onHucreKlavye, globalIdx, anlam]);
  const noktaDegistir = useCallback((n) => {
    if (onNoktaDegistir) onNoktaDegistir(globalIdx, n);
  }, [onNoktaDegistir, globalIdx]);
  const hucreKenari = useCallback((yon, satir) => {
    if (onHucreKenari) onHucreKenari(globalIdx, yon, satir);
  }, [onHucreKenari, globalIdx]);

  return (
    <div
      className={sinif}
      data-hucre-index={globalIdx}
      style={style}
      role="button"
      tabIndex={0}
      title="Tıkla: anlam göster"
      /* ⚠ Ekran okuyucu hücrenin ANLAMINI da duysun (kullanıcı: "metin→brf'te kısaltmalar
         açıkken kısaltmalı metne göre bir tepki alamadım ekran okuyucu ile"): ad yalnız
         içteki BrailleCell özetinden geliyordu ("1 ve 2 numaralı noktalar") → kısaltmanın
         uygulanıp uygulanmadığı duyulmuyordu. Artık anlam başlığı (ör. "İki Harfli
         Kısaltma: beden") + nokta özeti birlikte okunur. (Aynı düzeltme Araclar'ın tablet
         görünümündeki BrailleHucreBileseni'nde de var — ikisi birlikte gitmeli.) */
      /* ⚠ Konum eki (kullanıcı: "hücre numaraları okunduktan sonra … kaçıncı satırdaki
         kaçıncı hücre olduğu da seslendirilebilir"): nokta özetinden SONRA, "Tıkla: anlam
         göster" başlığından (NVDA açıklaması) ÖNCE okunur. */
      aria-label={anlam
        ? `${hucreAriaEtiketi(anlam)}${elleDuzenli ? ', elle düzenlendi' : ''}${konumEtiketi ? `, ${konumEtiketi}` : ''}`
        : undefined}
      onClick={sec}
      onKeyDown={tusla}
    >
      <div className="hucre-svg-sarici">
        <BrailleCell
          aktifNoktalar={noktalar}
          tiklanabilir={false}
          /* Nokta düzenleme AÇIKKEN noktalar keşfedilebilir olur (Alt+Shift+ok ile odak,
             Enter/Space ile aç/kapa); KAPALIYKEN eski pasif özet etiketi korunur. */
          kesfedilebilir={!!onNoktaDegistir}
          onNoktaDegistir={onNoktaDegistir ? noktaDegistir : undefined}
          onHucreKenari={onHucreKenari ? hucreKenari : undefined}
        />
      </div>
      {genisletAktif && anlam && (
        <div className="belge-hucre-etiket" aria-hidden="true">{etiket || '\u00A0'}</div>
      )}
    </div>
  );
}, (onceki, sonraki) => (
  onceki.globalIdx === sonraki.globalIdx
  && onceki.genisletAktif === sonraki.genisletAktif
  && onceki.paraBirimiHucre === sonraki.paraBirimiHucre
  && onceki.isSecili === sonraki.isSecili
  && onceki.isVurgulu === sonraki.isVurgulu
  && onceki.etiket === sonraki.etiket
  && onceki.anlamKey === sonraki.anlamKey
  && onceki.elleDuzenli === sonraki.elleDuzenli
  && onceki.konumEtiketi === sonraki.konumEtiketi
  && !!onceki.onNoktaDegistir === !!sonraki.onNoktaDegistir
  && onceki.onNoktaDegistir === sonraki.onNoktaDegistir
  && onceki.onHucreKenari === sonraki.onHucreKenari
  && onceki.onHucreKlavye === sonraki.onHucreKlavye
  && noktaAnahtari(onceki.noktalar) === noktaAnahtari(sonraki.noktalar)
));

export default function BrailleGrid({
  hucreler,
  indices,
  baseIndex = 0,
  kisaltmaAktif = true,
  genisletAktif = false,
  seciliIndex = -1,
  onSelect,
  className = '',
  getAnlam, // (idx) => anlam
  anlamlar,
  buildEtiket, // (anlam, globalIdx) => string
  cellTransform,
  isHighlighted,
  kaynak = undefined,
  esleme = undefined,
  paraBirimiKaynakAraliklari = undefined,
  // Elle nokta düzenleme (opsiyonel; yalnız Modül 10 metin→brf kullanır).
  onNoktaDegistir = undefined,
  onHucreKenari = undefined,
  onHucreKlavye = undefined,
  elleDuzenliIndeksler = undefined, // Map<globalIdx, number[]> | null
  // Satır içi konum duyurusu: verilirse (kabartma satırında kaç hücre var) her hücrenin
  // ekran okuyucu etiketine "N. satırın M. hücresi" eklenir. Satır numarası SAYFA İÇİ
  // yereldir (erisilebilirSatirlar ile aynı hesap). Verilmezse etiket AYNEN eskisi gibi.
  satirGenisligi = 0,
}) {
  const renderIndices = useMemo(() => (
    Array.isArray(indices)
      ? indices
      : Array.from({ length: hucreler.length }, (_, i) => i)
  ), [indices, hucreler.length]);
  const transform = typeof cellTransform === 'function' ? cellTransform : (x) => x;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectCell = useCallback((globalIdx, anlam) => {
    if (typeof onSelectRef.current === 'function') onSelectRef.current(globalIdx, anlam);
  }, []);

  const hucrelerIcerigi = renderIndices.map((localIdx) => {
        const globalIdx = baseIndex + localIdx;
        const noktalar = transform(hucreler[globalIdx] || []);
        const anlam = Array.isArray(anlamlar)
          ? (anlamlar[localIdx] || null)
          : (typeof getAnlam === 'function' ? getAnlam(globalIdx) : null);
        const paraBirimiHucre = paraBirimiKaynakAraliklari && esleme
          ? hucreParaBirimiKaynakBaglamiMi(esleme, globalIdx, paraBirimiKaynakAraliklari)
          : false;
        const etiket = genisletAktif && typeof buildEtiket === 'function'
          ? buildEtiket(anlam, globalIdx)
          : '';
        const konumEtiketi = satirGenisligi > 0
          ? satirKonumMetni(Math.floor(localIdx / satirGenisligi) + 1, (localIdx % satirGenisligi) + 1)
          : '';
        return (
          <BrailleGridHucre
            key={globalIdx}
            globalIdx={globalIdx}
            noktalar={noktalar}
            anlam={anlam}
            anlamKey={anlamKarsilastirmaAnahtari(anlam)}
            etiket={etiket}
            genisletAktif={genisletAktif}
            paraBirimiHucre={paraBirimiHucre}
            isSecili={seciliIndex === globalIdx}
            isVurgulu={typeof isHighlighted === 'function' && isHighlighted(globalIdx)}
            onSelect={selectCell}
            onNoktaDegistir={onNoktaDegistir}
            onHucreKenari={onHucreKenari}
            onHucreKlavye={onHucreKlavye}
            elleDuzenli={!!(elleDuzenliIndeksler && elleDuzenliIndeksler.has(globalIdx))}
            konumEtiketi={konumEtiketi}
          />
        );
      });

  if (!className) return <>{hucrelerIcerigi}</>;

  return (
    <div className={className} aria-label="Braille nokta görünümü">
      {hucrelerIcerigi}
    </div>
  );
}
