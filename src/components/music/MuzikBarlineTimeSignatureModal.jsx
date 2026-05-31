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
    window.innerWidth - 280,
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
        className="absolute w-[260px] rounded-xl border border-slate-200 bg-white shadow-xl p-3 flex flex-col gap-2"
        style={{ left, top }}
        role="dialog"
        aria-modal="true"
        aria-label="Ölçü çizgisi işlemleri"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-sm font-bold text-slate-800">
            {barlineMenu.inlineType === 'timeSignatureChange'
              ? 'Zaman imzası değişikliği'
              : barlineMenu.inlineType === 'keySignatureChange'
                ? 'Donanım değişikliği'
                : 'Ölçü çizgisi işlemleri'}
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
            {/* Inline change item tıklandığında: o item'i sil butonu */}
            {barlineMenu.inlineDeleteId && (
              <>
                <button
                  type="button"
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-100 hover:border-red-400"
                  onClick={() => {
                    olcuCizgisiniSil(barlineMenu.inlineDeleteId);
                    close();
                  }}
                >
                  {barlineMenu.inlineType === 'keySignatureChange'
                    ? '🗑 Donanım değişikliğini sil'
                    : '🗑 Zaman imzası değişikliğini sil'}
                </button>
                <div className="my-1 h-px bg-slate-200" />
              </>
            )}

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300"
              onClick={() => setMode('time')}
            >
              {barlineMenu.inlineType === 'timeSignatureChange'
                ? 'Zaman imzasını değiştir'
                : 'Zaman imzası ekle'}
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300"
              onClick={() => setMode('key')}
            >
              {barlineMenu.inlineType === 'keySignatureChange'
                ? 'Donanımı değiştir'
                : 'Donanım ekle / değiştir'}
            </button>

            {/* Ölçü çizgisi işlemleri — sadece doğrudan barline'a tıklandığında göster */}
            {!barlineMenu.inlineType && (
              <>
                <div className="my-1 h-px bg-slate-200" />
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 pb-0.5">Çizgi tipi</div>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Normal barline */}
                  <button
                    type="button"
                    title="Normal ölçü çizgisi"
                    aria-label="Normal ölçü çizgisi yap"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    onClick={() => { olcuCizgisiniDegistir(barlineMenu, 'barline'); close(); }}
                  >
                    <svg width="28" height="32" viewBox="0 0 28 32">
                      <line x1="14" y1="4" x2="14" y2="28" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="text-[10px] text-slate-500 leading-none">Normal</span>
                  </button>

                  {/* Sectional / double barline */}
                  <button
                    type="button"
                    title="Bölüm sonu çizgisi (çift)"
                    aria-label="Bölüm sonu çizgisi yap"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    onClick={() => { olcuCizgisiniDegistir(barlineMenu, 'sectionalBarline'); close(); }}
                  >
                    <svg width="28" height="32" viewBox="0 0 28 32">
                      <line x1="9"  y1="4" x2="9"  y2="28" stroke="currentColor" strokeWidth="2"/>
                      <line x1="17" y1="4" x2="17" y2="28" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="text-[10px] text-slate-500 leading-none">Çift</span>
                  </button>

                  {/* Final barline */}
                  <button
                    type="button"
                    title="Bitiş çizgisi (ince + kalın)"
                    aria-label="Bitiş çizgisi yap"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    onClick={() => { olcuCizgisiniDegistir(barlineMenu, 'finalBarline'); close(); }}
                  >
                    <svg width="28" height="32" viewBox="0 0 28 32">
                      <line x1="8"  y1="4" x2="8"  y2="28" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="17" y1="4" x2="17" y2="28" stroke="currentColor" strokeWidth="5"/>
                    </svg>
                    <span className="text-[10px] text-slate-500 leading-none">Bitiş</span>
                  </button>

                  {/* Begin repeat */}
                  <button
                    type="button"
                    title="Tekrar başlangıcı  |:"
                    aria-label="Tekrar başlangıcı yap"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    onClick={() => { olcuCizgisiniDegistir(barlineMenu, 'beginRepeat'); close(); }}
                  >
                    <svg width="28" height="32" viewBox="0 0 28 32">
                      <line x1="6"  y1="4" x2="6"  y2="28" stroke="currentColor" strokeWidth="5"/>
                      <line x1="13" y1="4" x2="13" y2="28" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="20" cy="11" r="2.2" fill="currentColor"/>
                      <circle cx="20" cy="21" r="2.2" fill="currentColor"/>
                    </svg>
                    <span className="text-[10px] text-slate-500 leading-none">|: Tekrar</span>
                  </button>

                  {/* End repeat */}
                  <button
                    type="button"
                    title="Tekrar sonu  :|"
                    aria-label="Tekrar sonu yap"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    onClick={() => { olcuCizgisiniDegistir(barlineMenu, 'endRepeat'); close(); }}
                  >
                    <svg width="28" height="32" viewBox="0 0 28 32">
                      <circle cx="8"  cy="11" r="2.2" fill="currentColor"/>
                      <circle cx="8"  cy="21" r="2.2" fill="currentColor"/>
                      <line x1="15" y1="4" x2="15" y2="28" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="22" y1="4" x2="22" y2="28" stroke="currentColor" strokeWidth="5"/>
                    </svg>
                    <span className="text-[10px] text-slate-500 leading-none">Tekrar :|</span>
                  </button>

                  {/* Delete barline */}
                  <button
                    type="button"
                    title="Ölçü çizgisini sil"
                    aria-label="Ölçü çizgisini sil"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-red-200 bg-white py-2 text-red-500 hover:bg-red-50 hover:border-red-400"
                    onClick={() => { olcuCizgisiniSil(barlineMenu); close(); }}
                  >
                    <svg width="28" height="32" viewBox="0 0 28 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="7,9 21,9"/>
                      <path d="M11,9V7h6v2"/>
                      <path d="M10,9l1,14h6l1-14"/>
                      <line x1="12" y1="13" x2="12" y2="20"/>
                      <line x1="16" y1="13" x2="16" y2="20"/>
                    </svg>
                    <span className="text-[10px] leading-none">Sil</span>
                  </button>
                </div>
              </>
            )}

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
