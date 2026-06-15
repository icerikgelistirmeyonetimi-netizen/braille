import React from 'react';
import BrfMusicCellDebugTable from './BrfMusicCellDebugTable.jsx';
import { brfNumaraliGorunum, brfGorunumMetinden, altRakamYaz } from '../../utils/music-brf/muzikOlcuNumarasi.js';

// Ham BRF'yi basılı (embosser) görünümüne yaklaştır: her satır en çok 40 braille
// hücresi; satır sonları ölçü sınırlarında (boşluk) verilir, ölçü ortadan bölünmez.
const BRF_SATIR_HUCRE = 40;
const BRF_BOSLUK_MU = (ch) => ch === '⠀' || ch === ' ';

function brfSatirSar(satir, max = BRF_SATIR_HUCRE) {
  const s = String(satir || '');
  if (s.length <= max) return [s];
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s.length - i <= max) { out.push(s.slice(i)); break; }
    let cut = i + max;
    let sonBosluk = -1;
    for (let j = i; j < i + max && j < s.length; j += 1) {
      if (BRF_BOSLUK_MU(s[j])) sonBosluk = j;
    }
    if (sonBosluk > i) cut = sonBosluk; // ölçü ortasından bölme
    out.push(s.slice(i, cut).replace(/[⠀ ]+$/, ''));
    i = cut;
    while (i < s.length && BRF_BOSLUK_MU(s[i])) i += 1; // satır başı ayraçlarını at
  }
  return out;
}

function brfHam40(metin) {
  return String(metin || '')
    .split('\n')
    .flatMap((satir) => brfSatirSar(satir))
    .join('\n');
}

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

  // Satır başı ölçü numarası (Lesson 5) — SUNUM: kanonik BRF'i değiştirmez,
  // yalnızca gösterim için satırlara böler + her satırın ilk ölçü no'sunu hesaplar.
  // Yüklenen parça (Ham BRF) için reader sonucundan; yeni yazılan skorun export
  // önizlemesi için metinden (reader içeride çalışır).
  const numarali = brfHamMetin ? brfNumaraliGorunum(brfHamMetin, brfOkumaSonucu, { genislik: 40 }) : null;
  const numaraliExport = (brfExportMetni && !brfHamMetin)
    ? brfGorunumMetinden(brfExportMetni, { genislik: 40 })
    : null;

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

  return (
    <div className="w-full min-w-0 flex flex-col gap-3" role="tabpanel" id="muzik-panel-braille" aria-labelledby="muzik-tab-braille" tabIndex={0} aria-label="Braille çıktısı">
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

      {/* Kopyala / indir butonları KALDIRILDI — alt çubukta "BRF İndir" + "Braille Kopyala" var (kullanıcı isteği). */}

      {brfHamMetin && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0 overflow-hidden">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            Ham BRF — 40 hücre / satır, satır başı ölçü numaralı (basılı görünüm)
          </div>
          <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
            {numarali ? (
              <div
                className="font-mono text-base leading-7 text-slate-900"
                style={{ fontFamily: "'DejaVu Sans Mono', 'Consolas', monospace" }}
              >
                {numarali.basliklar.flatMap((b, bi) =>
                  brfSatirSar(b).map((sar, si) => (
                    <div key={`h-${bi}-${si}`} className="whitespace-pre text-slate-500">{sar || ' '}</div>
                  )))}
                {numarali.govde.map((s, i) => (
                  <div key={`g-${i}`} className="flex items-baseline gap-2 whitespace-pre">
                    <span
                      className="shrink-0 w-7 text-right text-[11px] font-sans tabular-nums text-slate-400 select-none"
                      aria-hidden="true"
                    >
                      {s.no}
                    </span>
                    <span><span className="text-sky-700" title={`${s.no}. ölçü`}>{altRakamYaz(s.no)}⠀</span>{s.metin}</span>
                  </div>
                ))}
              </div>
            ) : (
              <pre
                className="whitespace-pre font-mono text-base leading-7 text-slate-900"
                style={{ fontFamily: "'DejaVu Sans Mono', 'Consolas', monospace" }}
              >
                {brfHam40(brfHamMetin)}
              </pre>
            )}
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
            Yeniden üretilen BRF export önizleme — 40 hücre / satır, satır başı ölçü numaralı
          </div>
          <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
            {numaraliExport ? (
              <div
                className="font-mono text-lg leading-7 text-slate-900"
                style={{ fontFamily: "'DejaVu Sans Mono', 'Consolas', monospace" }}
              >
                {numaraliExport.basliklar.flatMap((b, bi) =>
                  brfSatirSar(b).map((sar, si) => (
                    <div key={`eh-${bi}-${si}`} className="whitespace-pre text-slate-500">{sar || ' '}</div>
                  )))}
                {numaraliExport.govde.map((s, i) => (
                  <div key={`eg-${i}`} className="flex items-baseline gap-2 whitespace-pre">
                    <span
                      className="shrink-0 w-7 text-right text-[11px] font-sans tabular-nums text-slate-400 select-none"
                      aria-hidden="true"
                    >
                      {s.no}
                    </span>
                    <span><span className="text-sky-700" title={`${s.no}. ölçü`}>{altRakamYaz(s.no)}⠀</span>{s.metin}</span>
                  </div>
                ))}
              </div>
            ) : (
              <pre
                className="whitespace-pre font-mono text-lg leading-7 text-slate-900"
                style={{ fontFamily: "'DejaVu Sans Mono', 'Consolas', monospace" }}
              >
                {brfExportMetni}
              </pre>
            )}
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
