import React from 'react';
import MuzikToolOptions from './MuzikToolOptions.jsx';
import { MUSIC_EDITOR_TOOLBAR, SURE_KISA, SURE_KARTLARI } from '../../utils/music-brf/musicConstants.js';

export default function MuzikScoreToolbar({
  aktifArac,
  bekleyenBag,
  setBekleyenBag,
  bekleyenModifier,
  bekleyenTuplet,
  ifadeGirisi,
  setIfadeGirisi,
  seciliSureIdx,
  sureSecildi,
  notaEkle,
  ifadeEkle,
  aracEkleHandler,
  tupletTamamla,
  aracTikla,
  slurTamamla,
  slurCancel,
  modifierCancel,
  tupletCancel,
  olcuSayisi,
  voltaEkleModu,
  voltaEkleBaslangicId,
  voltaEkleModuBaslat,
  voltaEkleModIptal,
  voltaMeasureEkle,
}) {
  return (
    <div className="w-full min-w-0 max-w-full rounded-t-xl border border-zinc-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex h-11 items-center gap-1 overflow-x-auto px-1.5" role="toolbar" aria-label="Müzik araç çubuğu">
        {MUSIC_EDITOR_TOOLBAR.filter((tool) => tool.id !== 'tekrar').map((tool) => {
          const aktif = aktifArac === tool.id
            || (tool.id === 'bag-slur' && bekleyenBag?.tipModu === 'slur')
            || (tool.id === 'bag-tie' && bekleyenBag?.tipModu === 'tie');
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => aracTikla(tool.id)}
              aria-pressed={aktif}
              title={tool.label}
              className={['group relative inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2 text-sm transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
                aktif
                  ? 'border-amber-500 bg-amber-100 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]'
                  : 'border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950',
              ].join(' ')}
            >
              <span className={(tool.italic ? 'italic ' : '') + 'leading-none ' + (aktif ? 'font-black' : 'font-semibold')}>{tool.icon}</span>
              {aktif && (
                <span className="absolute -bottom-[5px] left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}

        {/* Tekrar (braille kısaltmaları) — en sağ köşede, braille ikonlu.
            Etiket yalnızca geniş ekranda görünür; mobilde sadece ikon. */}
        {(() => {
          const tool = MUSIC_EDITOR_TOOLBAR.find((t) => t.id === 'tekrar');
          if (!tool) return null;
          const aktif = aktifArac === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => aracTikla(tool.id)}
              aria-pressed={aktif}
              title={tool.label}
              className={['group relative ml-auto shrink-0 inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
                aktif
                  ? 'border-amber-500 bg-amber-100 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]'
                  : 'border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950',
              ].join(' ')}
            >
              <span className={'leading-none text-base ' + (aktif ? 'font-black' : 'font-semibold')} aria-hidden="true">{tool.icon}</span>
              <span className="hidden lg:inline whitespace-nowrap text-xs font-semibold">Tekrar kısaltmaları</span>
              {aktif && (
                <span className="absolute -bottom-[5px] left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })()}
      </div>

      {bekleyenBag && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
              {bekleyenBag?.tipModu === 'tie' ? '⌒' : '︵'}
            </span>
            <span className="text-xs text-zinc-700">
              <strong className="text-zinc-900">{bekleyenBag?.tipModu === 'tie' ? 'Tie' : 'Slur'}</strong>
              {' '}— seçili nota: <strong>{bekleyenBag?.notaIdler?.length || 0}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" disabled={(bekleyenBag?.notaIdler?.length || 0) < 2}
              onClick={slurTamamla}
              className="h-7 rounded-md border border-emerald-500 bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-400">
              ✓ Tamamla
            </button>
            <button type="button"
              onClick={slurCancel}
              className="h-7 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">
              İptal
            </button>
          </div>
        </div>
      )}

      {bekleyenModifier && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold select-none" aria-hidden="true">
              {bekleyenModifier.plasiyasyon === 'nota-arasi' ? '↕' : bekleyenModifier.plasiyasyon === 'olcu-cizgisi' ? '𝄀' : '♪'}
            </span>
            <span className="text-xs text-zinc-700">
              <strong className="text-zinc-900">{bekleyenModifier.kayit.ad}</strong>
              {bekleyenModifier.plasiyasyon === 'nota-arasi' && ' — fermatayı yerleştirmek istediğiniz yerin ÖNCESİNDEKİ notaya tıklayın'}
              {bekleyenModifier.plasiyasyon === 'olcu-cizgisi' && ' — fermatayı eklemek istediğiniz ölçü çizgisine tıklayın'}
              {!bekleyenModifier.plasiyasyon && ' — uygulanacak notayı seçin'}
            </span>
          </div>
          <button type="button" onClick={modifierCancel} className="h-7 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">İptal</button>
        </div>
      )}

      {bekleyenTuplet && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-700"><strong className="text-zinc-900">{bekleyenTuplet.kayit.ad}</strong> — seçili: {bekleyenTuplet.notaIdler.length}</span>
          <div className="flex items-center gap-1">
            {(bekleyenTuplet.notaIdler?.length || 0) >= 2 && (
              <button type="button" onClick={tupletTamamla} className="h-7 rounded-md border border-emerald-500 bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-600">✓ Tamamla</button>
            )}
            <button type="button" onClick={tupletCancel} className="h-7 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">İptal</button>
          </div>
        </div>
      )}

      {voltaEkleModu && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-3 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
              {voltaEkleModu.tip === 'volta1' ? '1.' : '2.'}
            </span>
            <span className="text-xs text-zinc-700">
              <strong className="text-zinc-900">{voltaEkleModu.tip === 'volta1' ? '1. ev' : '2. ev'}</strong>
              {voltaEkleBaslangicId
                ? <> — <span className="text-emerald-700 font-semibold">Başlangıç ölçüsü seçildi</span> · son ölçünün ortasındaki + butonuna tıkla</>
                : ' — başlangıç ölçünün ortasındaki + butonuna tıkla veya ölçü no gir'
              }
            </span>
          </div>
          <button type="button" onClick={voltaEkleModIptal}
            className="h-6 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-600 hover:bg-zinc-100">
            İptal
          </button>
        </div>
      )}

      <MuzikToolOptions
        aktifArac={aktifArac}
        bekleyenBag={bekleyenBag}
        ifadeGirisi={ifadeGirisi}
        setIfadeGirisi={setIfadeGirisi}
        seciliSureIdx={seciliSureIdx}
        sureSecildi={sureSecildi}
        notaEkle={notaEkle}
        ifadeEkle={ifadeEkle}
        aracEkleHandler={aracEkleHandler}
        olcuSayisi={olcuSayisi}
        voltaEkleModu={voltaEkleModu}
        voltaEkleBaslangicId={voltaEkleBaslangicId}
        voltaEkleModuBaslat={voltaEkleModuBaslat}
        voltaEkleModIptal={voltaEkleModIptal}
        voltaMeasureEkle={voltaMeasureEkle}
      />

      <div className="flex items-center gap-2 border-t border-zinc-200 px-3 py-1.5 text-[11px] text-zinc-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" aria-hidden="true" />
        <span>
          {bekleyenBag?.tipModu === 'slur' ? 'Slur — notaları seçin'
            : bekleyenBag?.tipModu === 'tie' ? 'Tie — iki aynı notayı seçin'
            : bekleyenModifier ? `${bekleyenModifier.kayit.ad} — ${bekleyenModifier.plasiyasyon === 'nota-arasi' ? 'önceki notayı' : bekleyenModifier.plasiyasyon === 'olcu-cizgisi' ? 'ölçü çizgisini' : 'notayı'} seçin`
            : bekleyenTuplet ? `Tuplet — notaları seçin (${bekleyenTuplet.notaIdler.length})`
            : aktifArac ? `${(MUSIC_EDITOR_TOOLBAR.find((t) => t.id === aktifArac) || {}).label} açık · seçili süre: ${SURE_KISA[seciliSureIdx] || '♩'}`
            : `Seçili süre: ${SURE_KISA[seciliSureIdx] || '♩'} (${SURE_KARTLARI[seciliSureIdx]?.etiket || 'Dörtlük'})`}
        </span>
      </div>
    </div>
  );
}
