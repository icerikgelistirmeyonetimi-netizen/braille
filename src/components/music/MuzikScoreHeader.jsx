import React from 'react';
import { DONANIM_LISTESI } from '../../utils/music-brf/musicConstants.js';

export default function MuzikScoreHeader({
  muzikHeader,
  setMuzikHeader,
  setTimeSignature,
  brfDosyasiYukle,
  includeBarNumbers,
  setIncludeBarNumbers,
}) {
  return (
    <div className="w-full flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-xl border border-zinc-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]" role="region" aria-label="Eser bilgileri">
      <input
        type="text"
        className="h-8 flex-1 min-w-[120px] rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:bg-amber-50/30"
        placeholder="Eser adı"
        value={muzikHeader.title}
        onChange={(e) => setMuzikHeader((h) => ({ ...h, title: e.target.value }))}
        aria-label="Eser adı"
      />
      <input
        type="text"
        className="h-8 flex-1 min-w-[120px] rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:bg-amber-50/30"
        placeholder="Besteci"
        value={muzikHeader.composer}
        onChange={(e) => setMuzikHeader((h) => ({ ...h, composer: e.target.value }))}
        aria-label="Besteci"
      />
      <input
        type="text"
        className="h-8 flex-1 min-w-[120px] rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:bg-amber-50/30"
        placeholder="Tempo"
        value={muzikHeader.tempo}
        onChange={(e) => setMuzikHeader((h) => ({ ...h, tempo: e.target.value }))}
        aria-label="Tempo"
      />
      <select
        className="h-8 min-w-[180px] rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 outline-none focus:border-amber-400"
        value={muzikHeader.keySignature?.ad || ''}
        onChange={(e) => {
          const ad = e.target.value;
          if (!ad) {
            setMuzikHeader((h) => ({ ...h, keySignature: null }));
            return;
          }
          const k = DONANIM_LISTESI.find((d) => d.ad === ad);
          if (k) setMuzikHeader((h) => ({ ...h, keySignature: { ad: k.ad, gorunum: k.sembol || k.ad, hucreler: k.hucreler } }));
        }}
        aria-label="Donanım"
      >
        <option value="">Donanım…</option>
        {DONANIM_LISTESI.map((k) => (
          <option key={k.ad} value={k.ad}>{k.ad}</option>
        ))}
      </select>
      <select
        className="h-8 w-[100px] rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 outline-none focus:border-amber-400"
        value={muzikHeader.timeSignature?.ad || ''}
        onChange={(e) => setTimeSignature(e.target.value)}
        aria-label="Zaman imzası"
      >
        <option value="">Zaman…</option>
        <option value="4/4">4/4</option>
        <option value="3/4">3/4</option>
        <option value="2/4">2/4</option>
        <option value="3/8">3/8</option>
        <option value="6/8">6/8</option>
        <option value="7/8">7/8</option>
        <option value="9/8">9/8</option>
        <option value="10/8">10/8</option>
        <option value="12/8">12/8</option>
        <option value="common">C</option>
        <option value="cut common">𝄵</option>
      </select>

      <label className="h-8 inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
        BRF oku
        <input
          type="file"
          accept=".brf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              brfDosyasiYukle?.(file);
            }

            e.target.value = '';
          }}
        />
      </label>

      <label className="h-8 flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={muzikHeader.autoCompleteMeasures !== false}
          onChange={(e) => {
            setMuzikHeader((h) => ({
              ...h,
              autoCompleteMeasures: e.target.checked,
            }));
          }}
        />
        Ölçü tamamla
      </label>

      <label className="h-8 flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700" title="Yeni Braille satırı başlarında ölçü numarası ekler.">
        <input
          type="checkbox"
          checked={Boolean(includeBarNumbers)}
          onChange={(e) => {
            setIncludeBarNumbers(e.target.checked);
          }}
        />
        Ölçü numarası göster
      </label>

      <label className="h-8 flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700" title="Kapalıyken BRF her notanın süresini açık yazar ve okur. Açıkken Braille grup/pitch-only yorumuna izin verilir.">
        <input
          type="checkbox"
          checked={Boolean(muzikHeader.useBrailleGrouping)}
          onChange={(e) => {
            setMuzikHeader((h) => ({
              ...h,
              useBrailleGrouping: e.target.checked,
            }));
          }}
        />
        Gruplama ile oku
      </label>

      <label className="h-8 flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={Boolean(muzikHeader.pickupMeasure)}
          onChange={(e) => {
            setMuzikHeader((h) => ({
              ...h,
              pickupMeasure: e.target.checked,
            }));
          }}
        />
        Pickup
      </label>
    </div>
  );
}
