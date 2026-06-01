import React, { useRef } from 'react';
import { MUZIK_HAZIR_PARCALAR } from '../../data/muzikHazirParcalar.js';

const TAB_ITEMS = [
  { id: 'skor', label: 'Skor', panelId: 'muzik-panel-skor' },
  { id: 'braille', label: 'BRF okuma', panelId: 'muzik-panel-braille' },
];

export default function MuzikBrfViewTabs({ aktifSekme, setAktifSekme, onHazirParcaSec }) {
  const tabRefs = useRef([]);

  // WAI-ARIA Tabs klavye deseni: Ok tuşlari, Home/End ile gezinme + otomatik secim.
  const handleKeyDown = (e, idx) => {
    let hedef = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      hedef = (idx + 1) % TAB_ITEMS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      hedef = (idx - 1 + TAB_ITEMS.length) % TAB_ITEMS.length;
    } else if (e.key === 'Home') {
      hedef = 0;
    } else if (e.key === 'End') {
      hedef = TAB_ITEMS.length - 1;
    }
    if (hedef === null) return;
    e.preventDefault();
    setAktifSekme(TAB_ITEMS[hedef].id);
    tabRefs.current[hedef]?.focus();
  };

  return (
    <div
      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <div className="flex items-center gap-2" role="tablist" aria-label="Görünüm sekmeleri">
        {TAB_ITEMS.map((sek, idx) => {
          const aktif = aktifSekme === sek.id;
          return (
            <button
              key={sek.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              type="button"
              role="tab"
              id={`muzik-tab-${sek.id}`}
              aria-selected={aktif}
              aria-controls={sek.panelId}
              tabIndex={aktif ? 0 : -1}
              onClick={() => setAktifSekme(sek.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ' +
                (aktif
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300')
              }
            >
              {sek.label}
            </button>
          );
        })}
      </div>

      {/* Hazır parçalar — sağa yaslı select kutusu */}
      <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
        <span className="hidden sm:inline">Hazır parça:</span>
        <select
          aria-label="Hazır parça seç"
          defaultValue=""
          onChange={(e) => {
            const idx = e.target.value;
            if (idx === '') return;
            const parca = MUZIK_HAZIR_PARCALAR[Number(idx)];
            if (parca) onHazirParcaSec?.(parca);
            e.target.value = ''; // tekrar seçilebilsin
          }}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 max-w-[180px]"
        >
          <option value="">Seç…</option>
          {MUZIK_HAZIR_PARCALAR.map((p, i) => (
            <option key={p.ad} value={i}>{p.ad}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
