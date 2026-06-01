import React from 'react';
import { MUZIK_EDITOR_ANAHTARLAR, DONANIM_LISTESI } from '../../utils/music-brf/musicConstants.js';

export default function MuzikKeySignatureModal({ anahtarPopupAcik, setAnahtarPopupAcik, muzikOgeleri, anahtariDegistir, donanimiDegistir, mevcutDonanimAd }) {
  if (!anahtarPopupAcik) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="presentation" onClick={() => setAnahtarPopupAcik(false)}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5 flex flex-col gap-3 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Anahtar ve donanım seç" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-base font-semibold text-slate-800">Anahtar ve Donanım</span>
          <button type="button" className="w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setAnahtarPopupAcik(false)} aria-label="Kapat">×</button>
        </div>

        {/* ── Anahtar ── */}
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Anahtar</div>
        <div className="flex gap-2" aria-label="Anahtar">
          {MUZIK_EDITOR_ANAHTARLAR.map((a) => {
            const aktifAnahtar = muzikOgeleri.find((o) => o.tip === 'anahtar');
            const aktifMi = aktifAnahtar?.ad === a.ad;
            return (
              <button key={a.ad} type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg border transition-colors ${aktifMi ? 'bg-slate-800 border-slate-800 text-white shadow' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-400'}`}
                onClick={() => anahtariDegistir(a)}
                title={a.ad}>
                <span className="text-2xl" style={{ fontFamily: "'Cambria Math', 'Bravura Text', 'Noto Music', 'Segoe UI Symbol', serif" }}>{a.sembol}</span>
                <span className="text-sm">{a.ad}</span>
              </button>
            );
          })}
        </div>

        {/* ── Donanım ── */}
        {typeof donanimiDegistir === 'function' && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 border-t border-slate-200 pt-2 mt-1">Donanım</div>
            <div className="flex flex-col gap-1 max-h-[34vh] overflow-y-auto pr-1" aria-label="Donanım">
              <button type="button"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors ${!mevcutDonanimAd ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-amber-100 hover:border-amber-400'}`}
                onClick={() => donanimiDegistir(null)}>
                <span className="w-6 text-center text-base font-semibold text-slate-400">♮</span>
                <span className="text-sm font-medium">Donanımsız</span>
              </button>
              {DONANIM_LISTESI.map((d) => {
                const aktif = mevcutDonanimAd === d.ad;
                return (
                  <button key={d.ad} type="button"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors ${aktif ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-amber-100 hover:border-amber-400'}`}
                    onClick={() => donanimiDegistir(d)}
                    title={d.aciklama || d.ad}>
                    <span className="w-6 text-center text-base font-semibold text-slate-600">{d.sembol || ''}</span>
                    <span className="text-sm font-medium leading-tight">{d.ad}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
