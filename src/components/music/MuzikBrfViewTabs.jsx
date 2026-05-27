import React from 'react';

const TAB_ITEMS = [
  { id: 'skor', label: 'Skor' },
  { id: 'braille', label: 'BRF okuma' },
];

export default function MuzikBrfViewTabs({ aktifSekme, setAktifSekme }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
      role="tablist"
      aria-label="Görünüm sekmeleri"
    >
      {TAB_ITEMS.map((sek) => {
        const aktif = aktifSekme === sek.id;
        return (
          <button
            key={sek.id}
            type="button"
            role="tab"
            aria-selected={aktif}
            onClick={() => setAktifSekme(sek.id)}
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
  );
}
