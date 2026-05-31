import React from 'react';

function dotsText(dots) {
  if (!Array.isArray(dots) || dots.length === 0) return 'boş';
  return dots.join('-');
}

export default function BrfMusicCellDebugTable({ cells = [] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-sm font-bold text-slate-800">Hücre Çözümleme Tablosu</div>
      <div className="max-h-[360px] overflow-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100 text-slate-700">
            <tr>
              <th className="border border-slate-200 px-2 py-1 text-left">Sıra</th>
              <th className="border border-slate-200 px-2 py-1 text-left">Karakter</th>
              <th className="border border-slate-200 px-2 py-1 text-left">Nokta</th>
              <th className="border border-slate-200 px-2 py-1 text-left">Kategori</th>
              <th className="border border-slate-200 px-2 py-1 text-left">Anlam</th>
              <th className="border border-slate-200 px-2 py-1 text-left">Etki</th>
              <th className="border border-slate-200 px-2 py-1 text-left">Uyarı</th>
            </tr>
          </thead>
          <tbody>
            {cells.map((row) => (
              <tr key={`${row.seq}-${row.lineIndex}-${row.cellIndex}`} className="odd:bg-white even:bg-slate-50">
                <td className="border border-slate-200 px-2 py-1">{row.seq}</td>
                <td className="border border-slate-200 px-2 py-1 font-mono text-base">{row.char || ' '}</td>
                <td className="border border-slate-200 px-2 py-1">{dotsText(row.dots)}</td>
                <td className="border border-slate-200 px-2 py-1">{row.category || '-'}</td>
                <td className="border border-slate-200 px-2 py-1">{row.meaning || '-'}</td>
                <td className="border border-slate-200 px-2 py-1">{row.effect || '-'}</td>
                <td className="border border-slate-200 px-2 py-1 text-amber-800">{row.warning || '-'}</td>
              </tr>
            ))}
            {cells.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-slate-200 px-2 py-6 text-center text-slate-500">
                  Henüz çözümleme yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
