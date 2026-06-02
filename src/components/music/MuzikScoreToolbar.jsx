import React, { useState, useRef, useEffect } from 'react';
import MuzikToolOptions from './MuzikToolOptions.jsx';
import { MUSIC_EDITOR_TOOLBAR, SURE_KISA, SURE_KARTLARI } from '../../utils/music-brf/musicConstants.js';
import { ayarlariAl, ayarGuncelle, ayarlariDinle } from '../../utils/ayarlar.js';
import { toneSesAyarlariAl, toneSesAyariGuncelle, toneSesAyarlariDinle } from '../../utils/toneSesAyarlari.js';

// "Diğer" açılır menüsüne taşınan araçlar — araç çubuğu kalabalık olmasın.
const DIGER_ARAC_IDLERI = ['nuans-once', 'nuans-sonra', 'dinamikler', 'expression', 'suslemeler', 'duzensiz-gruplar'];

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
  setAktifArac,
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
  muzikHeader,
  setMuzikHeader,
}) {
  // Mobil drill-down: bir araç aktifken (ör. "Süre") ana araç çubuğu gizlenir,
  // o aracın alt seçenekleri + geri butonu görünür. Geri ile ana araçlara dönülür.
  const aktifAracEtiketi =
    (MUSIC_EDITOR_TOOLBAR.find((t) => t.id === aktifArac) || {}).label || '';
  const mobilGeriDon = () => {
    setBekleyenBag?.(null);
    modifierCancel?.();
    tupletCancel?.();
    setAktifArac?.(null);
  };

  // "Diğer" açılır menüsü
  const [digerAcik, setDigerAcik] = useState(false);
  const digerRef = useRef(null);

  // "Ayarlar" açılır menüsü
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  const ayarlarRef = useRef(null);

  // Tone.js piyano motoru (global ayar) — menüden açılıp kapanır.
  const [toneSes, setToneSes] = useState(() => {
    try { return !!ayarlariAl().tonejsSes; } catch { return false; }
  });
  useEffect(() => ayarlariDinle((a) => setToneSes(!!a.tonejsSes)), []);

  // Tone.js detay ayarları (release/volume/reverb) + "Detay" popup'ı.
  const [detayAcik, setDetayAcik] = useState(false);
  const [toneAyar, setToneAyar] = useState(() => toneSesAyarlariAl());
  useEffect(() => toneSesAyarlariDinle((s) => setToneAyar({ ...s })), []);
  const toneAyarYama = (yama) => toneSesAyariGuncelle(yama);

  // Ayarlar menüsü dışarı tıklama / Esc ile kapat
  useEffect(() => {
    if (!ayarlarAcik) return undefined;
    const disariTikla = (e) => {
      if (ayarlarRef.current && !ayarlarRef.current.contains(e.target)) setAyarlarAcik(false);
    };
    const escKapat = (e) => { if (e.key === 'Escape') setAyarlarAcik(false); };
    document.addEventListener('mousedown', disariTikla);
    document.addEventListener('keydown', escKapat);
    return () => {
      document.removeEventListener('mousedown', disariTikla);
      document.removeEventListener('keydown', escKapat);
    };
  }, [ayarlarAcik]);
  const digerAraclar = MUSIC_EDITOR_TOOLBAR.filter((t) => DIGER_ARAC_IDLERI.includes(t.id));
  const digerAktifMi = DIGER_ARAC_IDLERI.includes(aktifArac);

  // Dışarı tıklayınca / Esc ile menüyü kapat
  useEffect(() => {
    if (!digerAcik) return undefined;
    const disariTikla = (e) => {
      if (digerRef.current && !digerRef.current.contains(e.target)) setDigerAcik(false);
    };
    const escKapat = (e) => { if (e.key === 'Escape') setDigerAcik(false); };
    document.addEventListener('mousedown', disariTikla);
    document.addEventListener('keydown', escKapat);
    return () => {
      document.removeEventListener('mousedown', disariTikla);
      document.removeEventListener('keydown', escKapat);
    };
  }, [digerAcik]);

  const digerAracSec = (id) => {
    aracTikla(id);
    setDigerAcik(false);
  };

  return (
    <div className={'muzik-toolbar-kok w-full min-w-0 max-w-full rounded-t-xl border border-zinc-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]' + (aktifArac ? ' mobil-arac-acik' : '')}>
      {/* Mobil drill-down geri butonu — yalnızca mobilde bir araç aktifken görünür */}
      <button
        type="button"
        className="mobil-arac-geri"
        onClick={mobilGeriDon}
        aria-label="Araçlara geri dön"
      >
        <span aria-hidden="true">‹</span> Araçlar{aktifAracEtiketi ? ` · ${aktifAracEtiketi}` : ''}
      </button>
      <div className="muzik-arac-cubugu flex h-11 items-center gap-1 overflow-x-visible px-1.5" role="toolbar" aria-label="Müzik araç çubuğu">
        {MUSIC_EDITOR_TOOLBAR
          .filter((tool) => tool.id !== 'tekrar' && !DIGER_ARAC_IDLERI.includes(tool.id))
          .map((tool) => {
          const aktif = aktifArac === tool.id
            || (tool.id === 'bag-slur' && bekleyenBag?.tipModu === 'slur')
            || (tool.id === 'bag-tie' && bekleyenBag?.tipModu === 'tie');
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => aracTikla(tool.id)}
              aria-pressed={aktif}
              aria-label={tool.label}
              title={tool.label}
              className={['group relative inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2 text-sm transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
                aktif
                  ? 'border-amber-500 bg-amber-100 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]'
                  : 'border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950',
              ].join(' ')}
            >
              <span aria-hidden="true" className={(tool.italic ? 'italic ' : '') + 'leading-none ' + (aktif ? 'font-black' : 'font-semibold')}>{tool.icon}</span>
              {aktif && (
                <span className="absolute -bottom-[5px] left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}

        {/* ── "Diğer" açılır menüsü: Nüans, Dinamik, İfade, Süsleme, Tuplet ── */}
        <div className="muzik-diger-sarmal relative" ref={digerRef}>
          <button
            type="button"
            onClick={() => setDigerAcik((a) => !a)}
            aria-haspopup="menu"
            aria-expanded={digerAcik}
            aria-label="Diğer araçlar"
            title="Diğer araçlar"
            className={['group relative inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2 text-sm transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
              (digerAktifMi || digerAcik)
                ? 'border-amber-500 bg-amber-100 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]'
                : 'border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950',
            ].join(' ')}
          >
            <span aria-hidden="true" className="leading-none font-semibold">⋯</span>
            <span className="muzik-diger-etiket text-xs font-semibold whitespace-nowrap">Diğer</span>
            <span aria-hidden="true" className="text-[10px] leading-none">▾</span>
          </button>

          {digerAcik && (
            <div
              className="muzik-diger-menu absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
              role="menu"
              aria-label="Diğer araçlar"
            >
              {digerAraclar.map((tool) => {
                const aktif = aktifArac === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    role="menuitem"
                    onClick={() => digerAracSec(tool.id)}
                    aria-pressed={aktif}
                    className={['flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                      aktif ? 'bg-amber-100 text-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
                    ].join(' ')}
                  >
                    <span aria-hidden="true" className={(tool.italic ? 'italic ' : '') + 'inline-flex w-5 justify-center leading-none text-base font-semibold'}>{tool.icon}</span>
                    <span className="whitespace-nowrap">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── "Ayarlar" açılır menüsü ── */}
        <div className="relative" ref={ayarlarRef}>
          <button
            type="button"
            onClick={() => setAyarlarAcik((a) => !a)}
            aria-haspopup="menu"
            aria-expanded={ayarlarAcik}
            aria-label="Ayarlar"
            title="Ayarlar"
            className={['group relative inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-2 text-sm transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
              ayarlarAcik
                ? 'border-amber-500 bg-amber-100 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]'
                : 'border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950',
            ].join(' ')}
          >
            <span aria-hidden="true" className="leading-none font-semibold text-base">⚙</span>
            <span className="muzik-diger-etiket text-xs font-semibold whitespace-nowrap hidden sm:inline">Ayarlar</span>
          </button>

          {ayarlarAcik && muzikHeader && setMuzikHeader && (
            <div
              className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-zinc-200 bg-white py-2 px-3 shadow-lg"
              role="menu"
              aria-label="Ayarlar"
            >
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Skor Ayarları</div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer rounded-md px-1 py-0.5 hover:bg-zinc-50 transition text-xs text-zinc-700" title="Ölçüyü otomatik tamamla">
                  <input
                    type="checkbox"
                    checked={muzikHeader.autoCompleteMeasures !== false}
                    onChange={(e) => setMuzikHeader((h) => ({ ...h, autoCompleteMeasures: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  Otomatik ölçü tamamla
                </label>
                <label className="flex items-center gap-2 cursor-pointer rounded-md px-1 py-0.5 hover:bg-zinc-50 transition text-xs text-zinc-700" title="Gruplama / pitch-only braille okuma">
                  <input
                    type="checkbox"
                    checked={Boolean(muzikHeader.useBrailleGrouping)}
                    onChange={(e) => setMuzikHeader((h) => ({ ...h, useBrailleGrouping: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  Braille gruplama
                </label>
                <label className="flex items-center gap-2 cursor-pointer rounded-md px-1 py-0.5 hover:bg-zinc-50 transition text-xs text-zinc-700" title="İlk ölçü pickup (anacrusis)">
                  <input
                    type="checkbox"
                    checked={Boolean(muzikHeader.pickupMeasure)}
                    onChange={(e) => setMuzikHeader((h) => ({ ...h, pickupMeasure: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  Pickup ölçü (anacrusis)
                </label>
              </div>

              <div className="mt-2 mb-1.5 border-t border-zinc-100 pt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Ses</div>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer rounded-md px-1 py-0.5 hover:bg-zinc-50 transition text-xs text-zinc-700" title="Notaları Tone.js piyano motoruyla çal (deneysel)">
                  <input
                    type="checkbox"
                    checked={toneSes}
                    onChange={(e) => ayarGuncelle({ tonejsSes: e.target.checked })}
                    className="accent-amber-500"
                  />
                  Tone.js piyano motoru
                </label>
                <button
                  type="button"
                  onClick={() => { setDetayAcik(true); setAyarlarAcik(false); }}
                  disabled={!toneSes}
                  className="shrink-0 rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Tone.js detay ayarları"
                >
                  Detay…
                </button>
              </div>
            </div>
          )}
        </div>

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
              aria-label={tool.label}
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

      {/* Tone.js Detay Ayarları popup'ı */}
      {detayAcik && (
        <div
          role="presentation"
          onClick={() => setDetayAcik(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tone.js detay ayarları"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900">Tone.js Ses Ayarları</h2>
              <button type="button" onClick={() => setDetayAcik(false)}
                className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100">
                Kapat
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-xs text-zinc-700">
                <span className="flex justify-between">
                  <span className="font-semibold">Kuyruk (release)</span>
                  <span className="text-amber-600 font-semibold">{Number(toneAyar.release).toFixed(1)} sn</span>
                </span>
                <input type="range" min={0.1} max={6} step={0.1}
                  value={toneAyar.release}
                  onChange={(e) => toneAyarYama({ release: Number(e.target.value) })}
                  className="accent-amber-500" />
                <span className="text-[10px] text-zinc-400">Notanin bitiste ne kadar surede sonecegi</span>
              </label>

              <label className="flex flex-col gap-1 text-xs text-zinc-700">
                <span className="flex justify-between">
                  <span className="font-semibold">Ses seviyesi</span>
                  <span className="text-amber-600 font-semibold">{Math.round(toneAyar.volume * 100)}%</span>
                </span>
                <input type="range" min={0} max={1} step={0.05}
                  value={toneAyar.volume}
                  onChange={(e) => toneAyarYama({ volume: Number(e.target.value) })}
                  className="accent-amber-500" />
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700">
                <input type="checkbox"
                  checked={toneAyar.reverbAcik}
                  onChange={(e) => toneAyarYama({ reverbAcik: e.target.checked })}
                  className="accent-amber-500" />
                <span className="font-semibold">Reverb (oda yankisi)</span>
              </label>

              <label className="flex flex-col gap-1 text-xs text-zinc-700" style={{ opacity: toneAyar.reverbAcik ? 1 : 0.4 }}>
                <span className="flex justify-between">
                  <span className="font-semibold">Yanki miktari</span>
                  <span className="text-amber-600 font-semibold">{Math.round(toneAyar.reverbWet * 100)}%</span>
                </span>
                <input type="range" min={0} max={0.6} step={0.05}
                  value={toneAyar.reverbWet}
                  disabled={!toneAyar.reverbAcik}
                  onChange={(e) => toneAyarYama({ reverbWet: Number(e.target.value) })}
                  className="accent-amber-500" />
              </label>
            </div>

            <p className="mt-4 text-[10px] text-zinc-400">
              Ayarlar otomatik kaydedilir ve aninda uygulanir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
