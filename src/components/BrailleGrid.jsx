import React, { memo, useCallback, useMemo, useRef } from 'react';
import BrailleCell from './BrailleCell.jsx';
import { hucreParaBirimiKaynakBaglamiMi } from '../utils/paraBirimiKaynak.js';

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
    + (paraBirimiHucre ? ' para-birimi-hucre' : '');
  const sec = useCallback(() => {
    onSelect(globalIdx, anlam);
  }, [onSelect, globalIdx, anlam]);
  const tusla = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(globalIdx, anlam);
    }
  }, [onSelect, globalIdx, anlam]);

  return (
    <div
      className={sinif}
      data-hucre-index={globalIdx}
      style={style}
      role="button"
      tabIndex={0}
      title="Tıkla: anlam göster"
      onClick={sec}
      onKeyDown={tusla}
    >
      <div className="hucre-svg-sarici">
        <BrailleCell aktifNoktalar={noktalar} tiklanabilir={false} kesfedilebilir={false} />
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
