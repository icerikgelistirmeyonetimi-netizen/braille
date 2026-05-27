import React from 'react';
import {
  NOTALAR as MUZIK_TEMEL_NOTALAR,
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
} from '../../data/muzik.js';
import {
  MUSIC_EDITOR_TOOLBAR,
  SURE_KISA,
} from '../../utils/music-brf/musicConstants.js';
import { muzikSureKisaAdi } from '../../utils/music/index.js';
import { veriBolumAl } from '../../utils/music-brf/musicConstants.js';

export default function MuzikToolOptions({
  aktifArac,
  bekleyenBag,
  ifadeGirisi,
  setIfadeGirisi,
  seciliSureIdx,
  sureSecildi,
  notaEkle,
  ifadeEkle,
  aracEkleHandler,
}) {
  if (!aktifArac || aktifArac === 'bag-slur' || aktifArac === 'bag-tie') {
    return null;
  }

  const chipPasif = 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950';
  const chipAktif = 'border-amber-500 bg-amber-100 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]';
  const Chip = ({ aktifMi, onClick, title, italik, children }) => (
    <button type="button" onClick={onClick} title={title}
      className={'h-7 min-w-7 rounded-md border px-2 text-xs font-semibold transition-all ' + (aktifMi ? chipAktif : chipPasif) + (italik ? ' italic' : '')}
    >{children}</button>
  );

  const baslik = ({
    sure: `Süre seç · seçili: ${SURE_KISA[seciliSureIdx] || '♩'}`,
    notalar: `Nota ekle · ${SURE_KISA[seciliSureIdx] || '♩'}`,
    sus: 'Sus ekle',
    dinamikler: 'Dinamik seç',
    expression: 'İfade / tempo ekle',
    suslemeler: 'Süsleme seç',
    'duzensiz-gruplar': 'Tuplet seç',
    tekrar: 'Tekrar işareti',
    'olcu-cizgileri': 'Bitiş / özel çizgi',
  })[aktifArac] || MUSIC_EDITOR_TOOLBAR.find((t) => t.id === aktifArac)?.label || '';

  let icerik = null;

  if (aktifArac === 'sure') {
    icerik = MUZIK_SURE_GOSTERGELERI.map((sure, idx) => (
      <Chip key={sure.ad} aktifMi={seciliSureIdx === idx} onClick={() => sureSecildi(idx)} title={muzikSureKisaAdi(sure)}>
        {SURE_KISA[idx] || sure.sembol}
      </Chip>
    ));
  } else if (aktifArac === 'notalar') {
    icerik = MUZIK_TEMEL_NOTALAR.map((nota) => (
      <Chip key={nota.ad} onClick={() => notaEkle(nota.ad)} title={`${nota.ad} ekle`}>
        {nota.ad}
      </Chip>
    ));
  } else if (aktifArac === 'expression') {
    icerik = (
      <div className="flex w-full items-center gap-1.5">
        <input
          value={ifadeGirisi}
          onChange={(e) => setIfadeGirisi(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ifadeEkle(); } }}
          placeholder="Moderato, poco rit., a tempo…"
          className="h-7 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-amber-400"
        />
        <button type="button" disabled={!ifadeGirisi.trim()}
          onClick={ifadeEkle}
          className="h-7 rounded-md border border-amber-500 bg-amber-100 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400">Ekle</button>
      </div>
    );
  } else {
    const slugHaritasi = {
      sus: 'sus',
      dinamikler: 'dinamikler',
      suslemeler: 'suslemeler',
      'duzensiz-gruplar': 'duzensiz-gruplar',
      tekrar: 'tekrar',
      'olcu-cizgileri': 'olcu-cizgileri',
    };
    const slug = slugHaritasi[aktifArac];
    let liste = veriBolumAl(slug);
    if (aktifArac === 'olcu-cizgileri') {
      const normalOlcuCizgisi = {
        ad: 'Normal ölçü çizgisi',
        sembol: '|',
        gorunum: '|',
        tip: 'barline',
        kind: 'normal',
        hucreler: [[]],
        aciklama: 'Normal ölçü çizgisi',
      };

      const normalVarMi = liste.some((o) => {
        const ad = String(o.ad || '').toLowerCase();
        return /normal.*ölçü|ölçü ayracı|barline/.test(ad);
      });

      if (!normalVarMi) {
        liste = [normalOlcuCizgisi, ...liste];
      }

      liste = liste.filter((o) => {
        const ad = String(o.ad || '').toLowerCase();

        return (
          /ölçü ayracı|normal.*ölçü|ölçü çizgisi|barline/.test(ad) ||
          /bitiş|bölüm|tekrar|begin.*repeat|end.*repeat|final|sectional|1\.\s*ev|2\.\s*ev|volta/i.test(ad)
        );
      });
    }
    icerik = liste.map((oge) => (
      <Chip key={oge.ad} onClick={() => aracEkleHandler(aktifArac, oge)} title={oge.aciklama || oge.ad} italik={MUSIC_EDITOR_TOOLBAR.find((t) => t.id === aktifArac)?.italic}>
        <span className="mr-1">{oge.sembol || oge.gorunum || oge.ad}</span>
        <span className="text-zinc-500">{String(oge.ad).slice(0, 18)}</span>
      </Chip>
    ));
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-50/80 px-2 py-1.5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{baslik}</div>
      <div className="flex flex-wrap items-center gap-1">{icerik}</div>
    </div>
  );
}
