import React, { useState } from 'react';
import {
  NOTALAR as MUZIK_TEMEL_NOTALAR,
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
} from '../../data/muzik.js';
import {
  MUSIC_EDITOR_TOOLBAR,
  SURE_KISA,
  SUS_KISA,
} from '../../utils/music-brf/musicConstants.js';
import { muzikSureKisaAdi } from '../../utils/music/index.js';
import { veriBolumAl, suslemeSmuflGlyph, nuansSmuflGlyph } from '../../utils/music-brf/musicConstants.js';
import { muzikBarNumberRepeatHucreleri, muzikBackwardNumeralRepeatHucreleri, muzikSayiGostergesi, muzikUstRakamHucreleri } from '../../utils/music/musicRepeatEngine.js';

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
  olcuSayisi = 0,
  // Volta ekleme modu
  voltaEkleModu = null,
  voltaEkleModuBaslat,
  voltaEkleModIptal,
  voltaMeasureEkle,
}) {
  const [dottedSus, setDottedSus] = useState(false);
  const [dottedNota, setDottedNota] = useState(false);
  const [tekrarSecili, setTekrarSecili] = useState(null);
  const [tekrarNo1, setTekrarNo1] = useState('');
  const [tekrarNo2, setTekrarNo2] = useState('');
  const [voltaBasOlcu, setVoltaBasOlcu] = useState('');
  const [voltaBitisOlcu, setVoltaBitisOlcu] = useState('');

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
    notalar: `Nota ekle · ${SURE_KISA[seciliSureIdx] || '♩'}${dottedNota ? ' · noktalı' : ''}`,
    sus: dottedSus ? 'Sus ekle — noktalı' : 'Sus ekle',
    'nuans-once': 'Nüans seç (nota öncesi)',
    'nuans-sonra': 'Nüans seç (nota sonrası)',
    dinamikler: 'Dinamik seç',
    expression: 'İfade / tempo ekle',
    suslemeler: 'Süsleme seç',
    'duzensiz-gruplar': 'Tuplet seç',
    tekrar: 'Braille Kısaltmaları',
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
    icerik = (
      <>
        {/* Noktalı toggle */}
        <Chip
          aktifMi={dottedNota}
          onClick={() => setDottedNota((d) => !d)}
          title={dottedNota ? 'Noktalı nota — tıkla: kapat' : 'Noktalı nota — tıkla: aç'}
        >
          <span className="text-base leading-none">·</span>
          <span className="ml-0.5 text-[10px]">Noktalı</span>
        </Chip>

        <span className="mx-1 h-5 w-px bg-zinc-200 self-center" aria-hidden="true" />

        {MUZIK_TEMEL_NOTALAR.map((nota) => (
          <Chip
            key={nota.ad}
            onClick={() => notaEkle(nota.ad, undefined, dottedNota)}
            title={`${nota.ad}${dottedNota ? ' (noktalı)' : ''} ekle`}
          >
            {nota.ad}
            {dottedNota && <span className="ml-0.5 text-[10px] text-amber-600">·</span>}
          </Chip>
        ))}
      </>
    );
  } else if (aktifArac === 'sus') {
    icerik = (
      <>
        {/* Noktalı toggle */}
        <Chip
          aktifMi={dottedSus}
          onClick={() => setDottedSus((d) => !d)}
          title={dottedSus ? 'Noktalı sus — tıkla: kapat' : 'Noktalı sus — tıkla: aç'}
        >
          <span className="text-base leading-none">·</span>
          <span className="ml-0.5 text-[10px]">Noktalı</span>
        </Chip>

        <span className="mx-1 h-5 w-px bg-zinc-200 self-center" aria-hidden="true" />

        {/* Tüm süre sınıfları */}
        {MUZIK_SURE_GOSTERGELERI.map((sure, idx) => (
          <Chip
            key={sure.ad}
            onClick={() => aracEkleHandler('sus', { sureIndeksi: idx, dotted: dottedSus })}
            title={`${muzikSureKisaAdi(sure)} sus${dottedSus ? ' (noktalı)' : ''} ekle`}
          >
            <span className="text-base leading-none">{SUS_KISA[idx] || sure.sembol}</span>
            {dottedSus && <span className="ml-0.5 text-[10px] text-amber-600">·</span>}
          </Chip>
        ))}
      </>
    );
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
  } else if (aktifArac === 'tekrar') {
    const liste = veriBolumAl('tekrar');
    const olcuNoMi = (oge) => /ölçü numarası tekrarı/i.test(oge.ad);
    const olcuAraMi = (oge) => /ölçü aralığı tekrarı/i.test(oge.ad);
    const geriSayimMi = (oge) => /geri sayım tekrarı/i.test(oge.ad);
    const esitGeriMi = (oge) => /eşit geri sayım/i.test(oge.ad);
    const repeatNMi = (oge) => /^repeat\s*×/i.test(oge.ad);

    const maxOlcu = olcuSayisi || 99;

    if (tekrarSecili) {
      const iptal = () => { setTekrarSecili(null); setTekrarNo1(''); setTekrarNo2(''); };
      const no1 = parseInt(tekrarNo1, 10);
      const no2 = parseInt(tekrarNo2, 10);

      let gecerli = false;
      let form = null;

      if (olcuNoMi(tekrarSecili)) {
        gecerli = Number.isFinite(no1) && no1 >= 1 && no1 <= maxOlcu;
        form = (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Ölçü no:</span>
            <input type="number" min={1} max={maxOlcu} value={tekrarNo1}
              onChange={(e) => setTekrarNo1(e.target.value)}
              className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs"
              placeholder={`1–${maxOlcu}`} />
          </div>
        );
      } else if (olcuAraMi(tekrarSecili)) {
        gecerli = Number.isFinite(no1) && Number.isFinite(no2) && no1 >= 1 && no2 > no1 && no2 <= maxOlcu;
        form = (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Başlangıç:</span>
            <input type="number" min={1} max={maxOlcu} value={tekrarNo1}
              onChange={(e) => setTekrarNo1(e.target.value)}
              className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs" placeholder="1" />
            <span className="text-xs text-zinc-600">–Bitiş:</span>
            <input type="number" min={2} max={maxOlcu} value={tekrarNo2}
              onChange={(e) => setTekrarNo2(e.target.value)}
              className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs" placeholder={`${maxOlcu}`} />
          </div>
        );
      } else if (geriSayimMi(tekrarSecili)) {
        gecerli = Number.isFinite(no1) && Number.isFinite(no2) && no1 >= 1 && no2 >= 1;
        form = (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Geri:</span>
            <input type="number" min={1} max={maxOlcu} value={tekrarNo1}
              onChange={(e) => setTekrarNo1(e.target.value)}
              className="w-14 h-6 rounded border border-zinc-300 px-1.5 text-xs" placeholder="8" />
            <span className="text-xs text-zinc-600">Çal:</span>
            <input type="number" min={1} max={maxOlcu} value={tekrarNo2}
              onChange={(e) => setTekrarNo2(e.target.value)}
              className="w-14 h-6 rounded border border-zinc-300 px-1.5 text-xs" placeholder="4" />
          </div>
        );
      } else if (esitGeriMi(tekrarSecili)) {
        gecerli = Number.isFinite(no1) && no1 >= 1 && no1 <= maxOlcu;
        form = (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Geri sayı:</span>
            <input type="number" min={1} max={maxOlcu} value={tekrarNo1}
              onChange={(e) => setTekrarNo1(e.target.value)}
              className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs" placeholder="4" />
          </div>
        );
      } else if (repeatNMi(tekrarSecili)) {
        gecerli = Number.isFinite(no1) && no1 >= 2 && no1 <= 99;
        form = (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Kaç tekrar:</span>
            <input type="number" min={2} max={99} value={tekrarNo1}
              onChange={(e) => setTekrarNo1(e.target.value)}
              className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs" placeholder="3"
              autoFocus />
            <span className="text-[10px] text-zinc-400">(önceki ölçü {no1 || '?'}× kopyalanır)</span>
          </div>
        );
      }

      const onayla = () => {
        if (!gecerli) return;
        let ozelHucreler = null;
        let extra = {};
        if (olcuNoMi(tekrarSecili)) {
          ozelHucreler = muzikBarNumberRepeatHucreleri(no1);
          extra = { _refStart: no1 };
        } else if (olcuAraMi(tekrarSecili)) {
          ozelHucreler = muzikBarNumberRepeatHucreleri(no1, no2);
          extra = { _refStart: no1, _refEnd: no2 };
        } else if (geriSayimMi(tekrarSecili)) {
          ozelHucreler = muzikBackwardNumeralRepeatHucreleri(no1, no2);
          extra = { _countBack: no1, _playBars: no2 };
        } else if (esitGeriMi(tekrarSecili)) {
          ozelHucreler = muzikBackwardNumeralRepeatHucreleri(no1);
          extra = { _countBack: no1, _playBars: no1 };
        } else if (repeatNMi(tekrarSecili)) {
          ozelHucreler = [[2, 3, 5, 6], muzikSayiGostergesi(), ...muzikUstRakamHucreleri(no1)];
          extra = { _repeatN: no1 };
        }
        aracEkleHandler('tekrar', { ...tekrarSecili, hucreler: ozelHucreler, ...extra });
        iptal();
      };

      icerik = (
        <div className="flex flex-wrap items-center gap-2 w-full">
          <span className="text-xs font-semibold text-zinc-700">{tekrarSecili.ad.split('(')[0].trim()}:</span>
          {form}
          <button type="button" onClick={onayla} disabled={!gecerli}
            className="h-6 rounded border border-emerald-500 bg-emerald-500 px-2.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Ekle
          </button>
          <button type="button" onClick={iptal}
            className="h-6 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-600 hover:bg-zinc-100">
            İptal
          </button>
        </div>
      );
    } else {
      icerik = liste.map((oge) => {
        const ozelItem = olcuNoMi(oge) || olcuAraMi(oge) || geriSayimMi(oge) || esitGeriMi(oge) || repeatNMi(oge);
        return (
          <Chip key={oge.ad}
            onClick={() => ozelItem ? setTekrarSecili(oge) : aracEkleHandler('tekrar', oge)}
            title={oge.aciklama || oge.ad}>
            <span className="mr-1">{oge.sembol || oge.gorunum || oge.ad.split('(')[0].trim()}</span>
            {ozelItem && <span className="ml-0.5 text-zinc-400 text-[9px]">✎</span>}
          </Chip>
        );
      });
    }
  } else {
    const slugHaritasi = {
      sus: 'sus',
      'nuans-once': 'nuans-once',
      'nuans-sonra': 'nuans-sonra',
      dinamikler: 'dinamikler',
      suslemeler: 'suslemeler',
      'duzensiz-gruplar': 'duzensiz-gruplar',
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
    if (aktifArac === 'nuans-once' || aktifArac === 'nuans-sonra') {
      icerik = liste.map((oge) => {
        const glif = nuansSmuflGlyph(oge.ad);
        const ikon = glif || oge.sembol || oge.gorunum || oge.ad.split(' ')[0].split('(')[0].trim();
        return (
          <Chip key={oge.ad} onClick={() => aracEkleHandler(aktifArac, oge)}
            title={oge.ad + (oge.aciklama ? '\n' + oge.aciklama : '')}>
            <span
              className="leading-none"
              style={glif ? { fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif", fontSize: '18px' } : undefined}
            >{ikon}</span>
          </Chip>
        );
      });
    } else if (aktifArac === 'suslemeler') {
      icerik = liste.map((oge) => {
        // Çizim yerine yüklü SMuFL (Bravura Text) glyph'i kullan.
        const glif = suslemeSmuflGlyph(oge.ad);
        const ikon = glif || oge.sembol || oge.gorunum || oge.ad.split(' ')[0];
        return (
          <Chip key={oge.ad} onClick={() => aracEkleHandler(aktifArac, oge)}
            title={oge.ad + (oge.aciklama ? '\n' + oge.aciklama : '')}>
            <span
              className="leading-none"
              style={glif
                ? { fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif", fontSize: '18px' }
                : undefined}
            >
              {ikon}
            </span>
          </Chip>
        );
      });
    } else if (aktifArac === 'olcu-cizgileri') {
      // Volta öğeleri için özel modal form
      const voltaOgesiMi = (oge) => /1\.\s*ev|2\.\s*ev|volta/i.test(String(oge.ad || ''));

      // Volta ekleme formu aktifse göster
      if (voltaEkleModu) {
        const tip = voltaEkleModu.tip;
        const etiket = tip === 'volta1' ? '1. ev' : '2. ev';
        const maxOlcu = olcuSayisi || 999;
        const bas = parseInt(voltaBasOlcu, 10);
        const bit = parseInt(voltaBitisOlcu, 10);
        const gecerli = Number.isFinite(bas) && bas >= 1 && bas <= maxOlcu
          && Number.isFinite(bit) && bit >= bas && bit <= maxOlcu;

        const iptal = () => {
          voltaEkleModIptal?.();
          setVoltaBasOlcu('');
          setVoltaBitisOlcu('');
        };

        const onayla = () => {
          if (!gecerli) return;
          voltaMeasureEkle?.(tip, bas, bit);
          setVoltaBasOlcu('');
          setVoltaBitisOlcu('');
        };

        icerik = (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <span className="text-xs font-semibold text-zinc-700">{etiket} aralığı:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Başlangıç ölçüsü:</span>
              <input
                type="number" min={1} max={maxOlcu} value={voltaBasOlcu}
                onChange={(e) => setVoltaBasOlcu(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && gecerli) onayla(); }}
                className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs"
                placeholder="1"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Bitiş ölçüsü:</span>
              <input
                type="number" min={bas || 1} max={maxOlcu} value={voltaBitisOlcu}
                onChange={(e) => setVoltaBitisOlcu(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && gecerli) onayla(); }}
                className="w-16 h-6 rounded border border-zinc-300 px-1.5 text-xs"
                placeholder={String(bas || maxOlcu)}
              />
            </div>
            <button type="button" onClick={onayla} disabled={!gecerli}
              className="h-6 rounded border border-emerald-500 bg-emerald-500 px-2.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed">
              Ekle
            </button>
            <span className="text-[10px] text-zinc-400">veya skorda ölçü çizgisine tıkla</span>
            <button type="button" onClick={iptal}
              className="h-6 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-600 hover:bg-zinc-100">
              İptal
            </button>
          </div>
        );
      } else {
        icerik = liste.map((oge) => {
          const isVolta = voltaOgesiMi(oge);
          return (
            <Chip
              key={oge.ad}
              onClick={() => {
                if (isVolta) {
                  const tip = /1\.\s*ev|volta\s*1/i.test(oge.ad) ? 'volta1' : 'volta2';
                  voltaEkleModuBaslat?.(tip);
                } else {
                  aracEkleHandler(aktifArac, oge);
                }
              }}
              title={oge.aciklama || oge.ad}
            >
              <span className="mr-1">{oge.sembol || oge.gorunum || oge.ad}</span>
              <span className="text-zinc-500">{String(oge.ad).slice(0, 18)}</span>
              {isVolta && <span className="ml-1 text-zinc-400 text-[9px]">✎</span>}
            </Chip>
          );
        });
      }
    } else {
      icerik = liste.map((oge) => (
        <Chip key={oge.ad} onClick={() => aracEkleHandler(aktifArac, oge)} title={oge.aciklama || oge.ad} italik={MUSIC_EDITOR_TOOLBAR.find((t) => t.id === aktifArac)?.italic}>
          <span className="mr-1">{oge.sembol || oge.gorunum || oge.ad}</span>
          <span className="text-zinc-500">{String(oge.ad).slice(0, 18)}</span>
        </Chip>
      ));
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-50/80 px-2 py-1.5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{baslik}</div>
      <div className="flex flex-wrap items-center gap-1">{icerik}</div>
    </div>
  );
}
