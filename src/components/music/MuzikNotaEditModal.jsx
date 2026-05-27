import React from 'react';
import {
  NOTALAR as MUZIK_TEMEL_NOTALAR,
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
} from '../../data/muzik.js';
import { SURE_KISA } from '../../utils/music-brf/musicConstants.js';
import { muzikSureKisaAdi } from '../../utils/music/index.js';

export default function MuzikNotaEditModal({ popupAcik, seciliOge, seciliEditorOgeId, setPopupAcik, seciliNotayiGuncelle, seciliOgeyiGuncelle, seciliOgeyiSil, seciliNotayiSusaCevir, seciliSusuNotayaCevir, mevcutAnahtar }) {
  if (!popupAcik || !seciliOge) return null;

  const editEnabled = Boolean(seciliEditorOgeId);
  const guncelle = (patch) => {
    if (!editEnabled) return;
    return (seciliOgeyiGuncelle || seciliNotayiGuncelle)?.(patch);
  };
  const susMu = seciliOge.tip === 'sus';
  const notaMi = seciliOge.tip === 'nota';
  const modalTitle = notaMi
    ? 'Notayı düzenle'
    : susMu
      ? 'Susu düzenle'
      : seciliOge.tip === 'timeSignatureChange'
        ? 'Zaman imzasını düzenle'
        : seciliOge.tip === 'keySignatureChange'
          ? 'Anahtar imzasını düzenle'
          : ['barline', 'sectionalBarline', 'finalBarline', 'beginRepeat', 'endRepeat'].includes(seciliOge.tip)
            ? 'Ölçü çizgisini düzenle'
            : seciliOge.tip === 'wordExpression'
              ? 'İfadeyi düzenle'
              : 'Öğeyi düzenle';
  const anahtarAdi = mevcutAnahtar?.ad || 'Sol anahtarı';
  const notaAdi = seciliOge?.notaAd || '';
  const oktav = seciliOge?.oktav ?? 4;
  const mevcutOktav = oktav;

  const modalBtn = 'min-w-[2rem] h-8 px-2 rounded-md border text-xs transition-all flex items-center justify-center';
  const modalBtnPasif = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-400';
  const modalBtnAktif = 'bg-slate-900 border-slate-900 text-white font-semibold';

  return (
    <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-2" role="presentation" onClick={() => setPopupAcik(false)}>
      <div className="w-full max-w-xl rounded-xl bg-white shadow-lg border border-slate-200 p-3 flex flex-col gap-2 max-h-[80vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label={modalTitle} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-sm font-semibold text-slate-800">{modalTitle}</span>
          <button type="button" className="w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setPopupAcik(false)} aria-label="Kapat">×</button>
        </div>
        {!editEnabled && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            Seçili öğe yalnızca görüntüleme/okuma verisinden alındı; düzenleme gerçek editör öğesine bağlanamadı.
          </div>
        )}
        {(notaMi || susMu) ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Süre seç">
              <span className="w-16 text-xs font-medium text-slate-500 uppercase tracking-wide">Süre</span>
              {MUZIK_SURE_GOSTERGELERI.map((sure, idx) => (
                <button key={sure.ad} type="button"
                  className={`${modalBtn} ${seciliOge.sureIndeksi === idx ? modalBtnAktif : modalBtnPasif}`}
                  onClick={() => guncelle({ sureIndeksi: idx })}
                  disabled={!editEnabled}
                  title={muzikSureKisaAdi(sure)}>
                  <span className="text-base">{SURE_KISA[idx] || sure.sembol}</span>
                </button>
              ))}
            </div>
            {notaMi && (
              <>
                <div className="flex flex-wrap items-center gap-1.5" aria-label="Ses seç">
                  <span className="w-16 text-xs font-medium text-slate-500 uppercase tracking-wide">Ses</span>
                  {MUZIK_TEMEL_NOTALAR.map((nota) => (
                    <button key={nota.ad} type="button"
                      className={`${modalBtn} ${seciliOge.notaAd === nota.ad ? modalBtnAktif : modalBtnPasif}`}
                      onClick={() => guncelle({ notaAd: nota.ad })}
                      disabled={!editEnabled}>
                      {nota.ad}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5" aria-label="Oktav">
                  <span className="w-16 text-xs font-medium text-slate-500 uppercase tracking-wide">Oktav</span>
                  {[1, 2, 3, 4, 5, 6, 7].map((o) => (
                    <button key={`okt-${o}`} type="button"
                      className={`${modalBtn} ${(mevcutOktav) === o ? modalBtnAktif : modalBtnPasif}`}
                      onClick={() => guncelle({ oktav: o })}
                      disabled={!editEnabled}>{o}</button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5" aria-label="Aksidental">
                  <span className="w-16 text-xs font-medium text-slate-500 uppercase tracking-wide">Aks.</span>
                  {[
                    { id: null, label: '✗', title: 'yok' },
                    { id: 'sharp', label: '♯', title: 'Diyez' },
                    { id: 'flat', label: '♭', title: 'Bemol' },
                    { id: 'natural', label: '♮', title: 'Naturel' },
                    { id: 'doubleSharp', label: '𝄪', title: 'Çift diyez' },
                    { id: 'doubleFlat', label: '𝄫', title: 'Çift bemol' },
                  ].map((acc) => (
                    <button key={`acc-${acc.id || 'none'}`} type="button"
                      className={`${modalBtn} ${(seciliOge.accidental ?? null) === acc.id ? modalBtnAktif : modalBtnPasif}`}
                      onClick={() => guncelle({ accidental: acc.id })}
                      disabled={!editEnabled}
                      title={acc.title}>{acc.label}</button>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Noktalı">
              <span className="w-16 text-xs font-medium text-slate-500 uppercase tracking-wide">Nokta</span>
              <button type="button"
                className={`${modalBtn} px-2 text-xs ${seciliOge.dotted ? modalBtnAktif : modalBtnPasif}`}
                onClick={() => guncelle({ dotted: !seciliOge.dotted })}
                disabled={!editEnabled}>
                {seciliOge.dotted ? '· açık' : '· kapalı'}
              </button>
            </div>
            {notaMi && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                <span className="text-xs font-medium text-amber-900">Bu notayı susa çevir</span>
                <button
                  type="button"
                  className="h-8 px-3 rounded-md border border-amber-300 bg-amber-100 text-amber-900 text-xs font-medium hover:bg-amber-200"
                  onClick={seciliNotayiSusaCevir}
                  disabled={!editEnabled}
                >
                  Susa çevir
                </button>
              </div>
            )}
            {susMu && (
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-2">
                <span className="w-full text-xs font-medium text-slate-700">Notaya çevir</span>
                {MUZIK_TEMEL_NOTALAR.map((nota) => (
                  <button
                    key={`sus-to-${nota.ad}`}
                    type="button"
                    className={`${modalBtn} ${modalBtnPasif}`}
                    onClick={() => seciliSusuNotayaCevir(nota.ad)}
                    disabled={!editEnabled}
                  >
                    {nota.ad}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button type="button" className="h-8 px-3 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors" onClick={seciliOgeyiSil} disabled={!editEnabled}>Sil</button>
        </div>
      </div>
    </div>
  );
}
