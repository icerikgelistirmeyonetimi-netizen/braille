import React from 'react';
import BrfMusicCellDebugTable from './BrfMusicCellDebugTable.jsx';
import { MUSIC_CANONICAL_BRF } from '../../utils/music-brf/musicCanonicalFlags.js';

export default function MuzikBrailleOutput({
  hucreler,
  cevirSonuc,
  brfExportMetni,
  brfHamMetin,
  hamBrfMetni,
  exportBrfMetni,
  copyBrfMetni,
  tekBrfMetni,
  canonicalBrfText,
  aktifBrfKaynakMetni,
  brfImportKirli,
  brfOkunurOzet,
  brfOkumaDurumMesaji,
  brfOkumaSonucu,
}) {
  const brfReaderCells = Array.isArray(brfOkumaSonucu?.cells) ? brfOkumaSonucu.cells : [];
  const brfReaderWarnings = Array.isArray(brfOkumaSonucu?.warnings) ? brfOkumaSonucu.warnings : [];

  const gosterilecekBrfMetni =
    hamBrfMetni ||
    aktifBrfKaynakMetni ||
    canonicalBrfText ||
    tekBrfMetni ||
    exportBrfMetni ||
    brfExportMetni ||
    brfHamMetin ||
    '';

  const kopyalanacakBrfMetni =
    copyBrfMetni ||
    canonicalBrfText ||
    exportBrfMetni ||
    tekBrfMetni ||
    brfExportMetni ||
    aktifBrfKaynakMetni ||
    brfHamMetin ||
    '';

  if (MUSIC_CANONICAL_BRF?.debug) {
    console.log('BRF COPY DEBUG', {
      hamBrfMetni,
      tekBrfMetni,
      canonicalBrfText,
      brfExportMetni,
      exportBrfMetni,
      copyBrfMetni,
      kopyalanacakBrfMetni,
      sameAsHam: kopyalanacakBrfMetni === gosterilecekBrfMetni,
    });
  }

  return (
    <div className="w-full min-w-0 flex flex-col gap-3" role="tabpanel" aria-label="Braille çıktısı">
      <div className="text-sm font-semibold text-slate-700">
        Braille çıktısı — <span className="text-slate-900 font-bold">{hucreler.length}</span> hücre
      </div>

      {brfHamMetin && brfImportKirli && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Yüklenen BRF düzenlendi. İndirilecek dosya güncel skordan yeniden üretilecektir.
        </div>
      )}

      {brfOkunurOzet && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 min-w-0 overflow-hidden">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
            Çözümlenmiş Müzik Okuması
          </div>
          <div className="overflow-x-auto">
            <pre className="max-h-[320px] overflow-y-auto whitespace-pre font-mono text-sm leading-6 text-emerald-950">
              {brfOkunurOzet}
            </pre>
          </div>
        </div>
      )}

      {!brfOkunurOzet && brfOkumaDurumMesaji && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {brfOkumaDurumMesaji}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            navigator.clipboard?.writeText(kopyalanacakBrfMetni || '');
          }}
        >
          BRF metnini kopyala
        </button>

        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            const blob = new Blob([kopyalanacakBrfMetni || ''], {
              type: 'text/plain;charset=utf-8',
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'muzik.brf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          .brf indir
        </button>
      </div>

      {brfHamMetin && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0 overflow-hidden">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            Ham BRF
          </div>
          <div className="overflow-x-auto">
            <pre
              className="max-h-[220px] overflow-y-auto whitespace-pre font-mono text-base leading-7 text-slate-900"
              style={{ fontFamily: "'DejaVu Sans Mono', 'Consolas', monospace" }}
            >
              {brfHamMetin}
            </pre>
          </div>
        </div>
      )}

      {brfOkumaSonucu && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0 overflow-hidden">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            BRF Müzik Okuma Tanılama
          </div>
          <div className="mb-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              Tanınan hücre: <span className="font-bold text-slate-900">{brfReaderCells.length}</span>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              Ölçü: <span className="font-bold text-slate-900">{brfOkumaSonucu.measures?.length || 0}</span>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              Uyarı: <span className="font-bold text-slate-900">{brfReaderWarnings.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <BrfMusicCellDebugTable cells={brfReaderCells} />
          </div>
        </div>
      )}

      {brfExportMetni && !brfHamMetin && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-w-0 overflow-hidden">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Yeniden üretilen BRF export önizleme — 40 hücre / ölçü bazlı satır
          </div>
          <div className="overflow-x-auto">
            <pre
              className="max-h-[260px] overflow-y-auto whitespace-pre font-mono text-lg leading-7 text-slate-900"
              style={{ fontFamily: "'DejaVu Sans Mono', 'Consolas', monospace" }}
            >
              {brfExportMetni}
            </pre>
          </div>
        </div>
      )}

      {hucreler.length === 0 && (
        <div className="w-full p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
          Önce skor sekmesinde nota ekleyin.
        </div>
      )}

      {Array.isArray(cevirSonuc.repeatOnerileri) && cevirSonuc.repeatOnerileri.length > 0 && (
        <div className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50" role="status" aria-live="polite">
          <div className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Tekrar önerileri (Modül 8 Bölüm 10)</div>
          <ul className="list-disc pl-5 text-sm text-amber-900 space-y-0.5">
            {cevirSonuc.repeatOnerileri.map((o, i) => <li key={i}>{o.aciklama}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
