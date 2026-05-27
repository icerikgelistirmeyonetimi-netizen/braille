import React, { useState } from 'react';
import { DONANIM_LISTESI } from '../../utils/music-brf/musicConstants.js';

const TIME_SIGNATURE_OPTIONS = [
  '2/4',
  '3/4',
  '4/4',
  '3/8',
  '6/8',
  '7/8',
  '9/8',
  '10/8',
  '12/8',
  'common',
  'cut common',
];

export default function MuzikBarlineTimeSignatureModal({
  barlineMenu,
  setBarlineMenu,
  inlineTimeSignatureEkle,
  inlineKeySignatureEkle,
  olcuCizgisiniDegistir,
  olcuCizgisiniSil,
}) {
  const [mode, setMode] = useState('menu');

  if (!barlineMenu) return null;

  const close = () => {
    setMode('menu');
    setBarlineMenu(null);
  };

  const left = Math.min(
    Math.max(Number(barlineMenu.x) || 24, 12),
    window.innerWidth - 260,
  );

  const top = Math.min(
    Math.max(Number(barlineMenu.y) || 80, 12),
    window.innerHeight - 340,
  );

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      onClick={close}
    >
      <div
        className="absolute w-[240px] rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2"
        style={{ left, top }}
        role="dialog"
        aria-modal="true"
        aria-label="Ölçü çizgisi işlemleri"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-sm font-bold text-slate-800">
            Ölçü çizgisi işlemleri
          </span>
          <button
            type="button"
            className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={close}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        {mode === 'menu' && (
          <>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
              onClick={() => setMode('time')}
            >
              Zaman imzası ekle
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300"
              onClick={() => setMode('key')}
            >
              Donanım ekle / değiştir
            </button>

            <div className="my-1 h-px bg-slate-200" />

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => {
                olcuCizgisiniDegistir(barlineMenu, 'barline');
                close();
              }}
            >
              Normal ölçü çizgisi yap
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => {
                olcuCizgisiniDegistir(barlineMenu, 'sectionalBarline');
                close();
              }}
            >
              Bölüm sonu çizgisi yap
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => {
                olcuCizgisiniDegistir(barlineMenu, 'finalBarline');
                close();
              }}
            >
              Bitiş çizgisi yap
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => {
                olcuCizgisiniDegistir(barlineMenu, 'beginRepeat');
                close();
              }}
            >
              Tekrar başlangıcı yap
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => {
                olcuCizgisiniDegistir(barlineMenu, 'endRepeat');
                close();
              }}
            >
              Tekrar sonu yap
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300"
              onClick={() => {
                olcuCizgisiniSil(barlineMenu);
                close();
              }}
            >
              Ölçü çizgisini sil
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
              onClick={close}
            >
              İptal
            </button>
          </>
        )}

        {mode === 'time' && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Zaman imzası seç
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SIGNATURE_OPTIONS.map((sig) => (
                <button
                  key={sig}
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-amber-100 hover:border-amber-400"
                  onClick={() => {
                    inlineTimeSignatureEkle(barlineMenu, sig);
                    close();
                  }}
                >
                  {sig === 'common' ? 'C' : sig === 'cut common' ? '𝄵' : sig}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
              onClick={() => setMode('menu')}
            >
              Geri
            </button>
          </>
        )}

        {mode === 'key' && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Donanım seç
            </div>

            <div className="max-h-[260px] overflow-y-auto flex flex-col gap-1.5">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-100 hover:border-emerald-400"
                onClick={() => {
                  inlineKeySignatureEkle(barlineMenu, null);
                  close();
                }}
              >
                Donanımı kaldır / naturel
              </button>

              {DONANIM_LISTESI.map((donanim) => (
                <button
                  key={donanim.ad}
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-100 hover:border-emerald-400"
                  onClick={() => {
                    inlineKeySignatureEkle(barlineMenu, donanim);
                    close();
                  }}
                >
                  <span className="mr-2">{donanim.sembol || donanim.gorunum || ''}</span>
                  {donanim.ad}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
              onClick={() => setMode('menu')}
            >
              Geri
            </button>
          </>
        )}
      </div>
    </div>
  );
}
