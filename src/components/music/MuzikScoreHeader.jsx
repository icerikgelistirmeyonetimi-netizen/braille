import React, { useState, useRef, useEffect } from 'react';
import { DONANIM_LISTESI } from '../../utils/music-brf/musicConstants.js';
import { MUZIK_ZAMAN_IMZASI } from '../../data/muzik.js';
import { MUZIK_GRUPLAMA_SECENEKLERI } from '../../utils/music/musicConstants.js';

// Bir metre adından ('7/8', '2/2 (sebare)') aksak gruplama seçeneklerini al (yoksa null).
function gruplamaSecenekleriAl(ad) {
  const f = String(ad || '').match(/(\d+)\s*\/\s*(\d+)/);
  return f ? (MUZIK_GRUPLAMA_SECENEKLERI[`${f[1]}/${f[2]}`] || null) : null;
}

/**
 * Standart müzik tempo işaretleri ve temsili BPM değerleri.
 */
const TEMPO_ISARETLERI = [
  { ad: 'Larghissimo',  bpm: 24  },
  { ad: 'Grave',        bpm: 40  },
  { ad: 'Largo',        bpm: 50  },
  { ad: 'Larghetto',    bpm: 63  },
  { ad: 'Adagio',       bpm: 70  },
  { ad: 'Adagietto',    bpm: 74  },
  { ad: 'Andante',      bpm: 92  },
  { ad: 'Andantino',    bpm: 100 },
  { ad: 'Moderato',     bpm: 114 },
  { ad: 'Allegretto',   bpm: 116 },
  { ad: 'Allegro',      bpm: 132 },
  { ad: 'Vivace',       bpm: 168 },
  { ad: 'Vivacissimo',  bpm: 172 },
  { ad: 'Presto',       bpm: 184 },
  { ad: 'Prestissimo',  bpm: 208 },
];

// Ölçü sayıları TEK KAYNAK: data/muzik.js MUZIK_ZAMAN_IMZASI (Modül 8 dersleriyle aynı; Türk/aksak
// 5/8, 7/8, 9/8 dahil). 'ad' sayısal forma indirgenir ('2/2 (sebare)' → '2/2'). Motorun desteklediği
// ekstra bileşik metreler (10/8, 12/8) ve C/𝄵 sembol kısayolları korunur. Dedup ile tekrar engellenir.
const _zamanSayisalFormu = (ad = '') => {
  const m = String(ad).match(/(\d+)\s*\/\s*(\d+)/);
  return m ? `${m[1]}/${m[2]}` : null;
};
const TIME_SIGNATURE_LIST = [
  ...new Set([
    ...MUZIK_ZAMAN_IMZASI.map((z) => _zamanSayisalFormu(z.ad)).filter(Boolean),
    '10/8',
    '12/8',
  ]),
].map((value) => ({ value, label: value })).concat([
  { value: 'common',      label: '𝄴' },
  { value: 'cut common',  label: '𝄵' },
]);

function enYakinTempoAdi(bpm) {
  if (!Number.isFinite(bpm)) return '';
  const en = TEMPO_ISARETLERI.reduce((prev, curr) =>
    Math.abs(curr.bpm - bpm) < Math.abs(prev.bpm - bpm) ? curr : prev,
  );
  return Math.abs(en.bpm - bpm) <= 12 ? en.ad : '';
}

// Donanım açılır listesi — anahtar ismi yerine görsel ♯/♭ chip'leri
function DonanimDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const aktif = DONANIM_LISTESI.find((d) => d.ad === value);
  const aktifGorunum = aktif?.sembol || aktif?.ad?.match(/[♯♭]+/)?.[0] || '';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-8 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 hover:border-amber-400 hover:bg-amber-50/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label="Donanım seçimi"
      >
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide">Donanım</span>
        {aktif ? (
          <span className="inline-flex items-center gap-1">
            <span
              className="text-lg leading-none text-zinc-900"
              style={{ fontFamily: "'Bravura Text', 'Cambria Math', serif" }}
            >{aktifGorunum || '♮'}</span>
            <span className="text-zinc-500 text-[11px]">{aktif.ad.replace(/donanım$/i, '').trim()}</span>
          </span>
        ) : (
          <span className="text-zinc-400">Seç…</span>
        )}
        <svg viewBox="0 0 20 20" className="h-3 w-3 text-zinc-400" fill="currentColor" aria-hidden="true">
          <path d="M5 8l5 5 5-5H5z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-64 max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl p-1"
          role="listbox"
        >
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded text-left transition ${!aktif ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <span className="w-7 text-center text-zinc-400">♮</span>
            <span>Donanım yok</span>
          </button>
          {DONANIM_LISTESI.map((d) => {
            const aktifMi = d.ad === value;
            const sembol = d.sembol || (d.ad.match(/[♯♭]+/)?.[0] || '');
            return (
              <button
                key={d.ad}
                type="button"
                onClick={() => { onChange(d.ad); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded text-left transition ${aktifMi ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'}`}
              >
                <span
                  className="w-12 text-center text-base text-zinc-900"
                  style={{ fontFamily: "'Bravura Text', 'Cambria Math', serif" }}
                >{sembol || '·'}</span>
                <span className="flex-1">{d.ad}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Zaman imzası — kompakt grid (chip layout)
function ZamanImzasiSecici({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const aktif = TIME_SIGNATURE_LIST.find((t) => t.value === value);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-8 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 hover:border-amber-400 hover:bg-amber-50/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label="Ölçü sayısı seçimi"
      >
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide">Ölçü</span>
        <span
          className="text-zinc-900 font-semibold text-sm"
          style={{ fontFamily: "'Bravura Text', 'Cambria Math', serif" }}
        >{aktif ? aktif.label : '—'}</span>
        <svg viewBox="0 0 20 20" className="h-3 w-3 text-zinc-400" fill="currentColor" aria-hidden="true">
          <path d="M5 8l5 5 5-5H5z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-zinc-200 bg-white shadow-xl p-2"
          role="listbox"
        >
          <div className="grid grid-cols-3 gap-1">
            {TIME_SIGNATURE_LIST.map((t) => {
              const aktifMi = t.value === value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { onChange(t.value); setOpen(false); }}
                  className={`h-12 rounded-md border text-sm font-bold transition ${aktifMi
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:bg-amber-50/30'}`}
                  style={{ fontFamily: "'Bravura Text', 'Cambria Math', serif" }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Aksak/düzensiz metrede VURUŞ GRUPLAMASI seçici — yalnız 5/8, 7/8, 9/8, 10/8 gibi metrelerde görünür.
// Seçim görsel kiriş + ekran-altı braille + indirileni belirler (gruplamaDeseni timeSignature'a yazılır).
function GruplamaSecici({ timeSignature, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const ad = timeSignature?.ad || timeSignature?.gorunum || '';
  const secenekler = gruplamaSecenekleriAl(ad);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!secenekler) return null; // düzenli metre → gruplama seçtirme

  const aktifAnahtar = Array.isArray(timeSignature?.gruplamaDeseni)
    ? timeSignature.gruplamaDeseni.join('+')
    : secenekler[0].join('+'); // desen yoksa varsayılan = ilk seçenek

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-8 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 hover:border-amber-400 hover:bg-amber-50/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label="Vuruş gruplaması seçimi"
        title="Aksak ölçüde vuruş gruplaması (kiriş + braille gruplama)"
      >
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide">Gruplama</span>
        <span className="text-zinc-900 font-semibold text-sm tabular-nums">{aktifAnahtar}</span>
        <svg viewBox="0 0 20 20" className="h-3 w-3 text-zinc-400" fill="currentColor" aria-hidden="true">
          <path d="M5 8l5 5 5-5H5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-lg border border-zinc-200 bg-white shadow-xl p-2" role="listbox">
          <div className="grid grid-cols-1 gap-1">
            {secenekler.map((desen) => {
              const anahtar = desen.join('+');
              const aktifMi = anahtar === aktifAnahtar;
              return (
                <button
                  key={anahtar}
                  type="button"
                  onClick={() => { onChange(ad, desen); setOpen(false); }}
                  className={`h-9 rounded-md border text-sm font-bold tabular-nums transition ${aktifMi
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:bg-amber-50/30'}`}
                >
                  {anahtar}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MuzikScoreHeader({
  muzikHeader,
  setMuzikHeader,
  setTimeSignature,
  brfDosyasiYukle,
}) {
  const mevcutBpm = Number.isFinite(Number(muzikHeader.bpm))
    ? Number(muzikHeader.bpm)
    : 120;

  const mevcutTempoAd = TEMPO_ISARETLERI.find((t) => t.ad === muzikHeader.tempo)?.ad ?? '';

  const handleTempoSecim = (e) => {
    const ad = e.target.value;
    if (!ad) {
      setMuzikHeader((h) => ({ ...h, tempo: '', bpm: undefined }));
      return;
    }
    const t = TEMPO_ISARETLERI.find((ti) => ti.ad === ad);
    if (t) setMuzikHeader((h) => ({ ...h, tempo: t.ad, bpm: t.bpm }));
  };

  const handleBpmDegistir = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setMuzikHeader((h) => ({ ...h, bpm: undefined, tempo: '' }));
      return;
    }
    const val = parseInt(raw, 10);
    if (!Number.isFinite(val)) return;
    const clamped = Math.max(20, Math.min(300, val));
    const adAday = enYakinTempoAdi(clamped);
    setMuzikHeader((h) => ({
      ...h,
      bpm: clamped,
      tempo: adAday || h.tempo || `♩=${clamped}`,
    }));
  };

  const handleDonanimChange = (ad) => {
    if (!ad) {
      setMuzikHeader((h) => ({ ...h, keySignature: null }));
      return;
    }
    const k = DONANIM_LISTESI.find((d) => d.ad === ad);
    if (k) setMuzikHeader((h) => ({ ...h, keySignature: { ad: k.ad, gorunum: k.sembol || k.ad, hucreler: k.hucreler } }));
  };

  return (
    <div
      className="w-full flex flex-wrap items-center gap-2 px-3 py-2 rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/40 shadow-sm"
      role="region"
      aria-label="Eser bilgileri"
    >
      {/* Eser adı */}
      <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide whitespace-nowrap">Eser</span>
        <input
          type="text"
          className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:bg-amber-50/30 transition"
          placeholder="başlık…"
          value={muzikHeader.title}
          onChange={(e) => setMuzikHeader((h) => ({ ...h, title: e.target.value }))}
          aria-label="Eser adı"
        />
      </div>

      {/* Besteci */}
      <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide whitespace-nowrap">Besteci</span>
        <input
          type="text"
          className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:bg-amber-50/30 transition"
          placeholder="isim…"
          value={muzikHeader.composer}
          onChange={(e) => setMuzikHeader((h) => ({ ...h, composer: e.target.value }))}
          aria-label="Besteci"
        />
      </div>

      {/* Tempo */}
      <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 h-8" title="Tempo">
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide">Tempo</span>
        <select
          className="h-6 rounded border-0 bg-transparent text-xs font-medium text-zinc-800 outline-none focus:ring-0 max-w-[110px]"
          value={mevcutTempoAd}
          onChange={handleTempoSecim}
          aria-label="Tempo işareti"
        >
          <option value="">—</option>
          {TEMPO_ISARETLERI.map((t) => (
            <option key={t.ad} value={t.ad}>{t.ad} ({t.bpm})</option>
          ))}
        </select>
        <span className="text-[10px] text-zinc-400 select-none font-mono">♩=</span>
        <input
          type="number"
          min={20}
          max={300}
          step={1}
          className="w-12 h-6 rounded border border-zinc-200 bg-white px-1 text-xs text-zinc-800 outline-none focus:border-amber-400 text-center font-mono"
          value={Number.isFinite(Number(muzikHeader.bpm)) ? muzikHeader.bpm : ''}
          onChange={handleBpmDegistir}
          aria-label="BPM"
          placeholder="120"
        />
      </div>

      {/* Donanım — özel chip dropdown */}
      <DonanimDropdown
        value={muzikHeader.keySignature?.ad || ''}
        onChange={handleDonanimChange}
      />

      {/* Zaman imzası — grid seçici */}
      <ZamanImzasiSecici
        value={muzikHeader.timeSignature?.ad || ''}
        onChange={setTimeSignature}
      />

      {/* Aksak metre vuruş gruplaması — yalnız 5/8, 7/8, 9/8, 10/8 gibi metrelerde görünür */}
      <GruplamaSecici
        timeSignature={muzikHeader.timeSignature}
        onChange={setTimeSignature}
      />

      {/* BRF oku */}
      <label className="h-8 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-amber-300 transition">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-500" fill="currentColor" aria-hidden="true">
          <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm8 1.5V10h4.5L13 5.5z" />
        </svg>
        BRF oku
        <input
          type="file"
          accept=".brf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) brfDosyasiYukle?.(file);
            e.target.value = '';
          }}
        />
      </label>

      {/* Toggles — kompakt grup */}
      <div className="inline-flex items-center gap-0 rounded-md border border-zinc-200 bg-white overflow-hidden h-8 text-[11px]">
        <label
          className="h-full flex items-center gap-1.5 px-2 cursor-pointer hover:bg-zinc-50 transition"
          title="Ölçüyü otomatik tamamla"
        >
          <input
            type="checkbox"
            checked={muzikHeader.autoCompleteMeasures !== false}
            onChange={(e) => setMuzikHeader((h) => ({ ...h, autoCompleteMeasures: e.target.checked }))}
            className="accent-amber-500"
          />
          <span className="text-zinc-700">Otomatik</span>
        </label>
        <div className="w-px h-4 bg-zinc-200" />
        <label
          className="h-full flex items-center gap-1.5 px-2 cursor-pointer hover:bg-zinc-50 transition"
          title="Gruplama / pitch-only braille okuma"
        >
          <input
            type="checkbox"
            checked={Boolean(muzikHeader.useBrailleGrouping)}
            onChange={(e) => setMuzikHeader((h) => ({ ...h, useBrailleGrouping: e.target.checked }))}
            className="accent-amber-500"
          />
          <span className="text-zinc-700">Grup</span>
        </label>
        <div className="w-px h-4 bg-zinc-200" />
        <label
          className="h-full flex items-center gap-1.5 px-2 cursor-pointer hover:bg-zinc-50 transition"
          title="İlk ölçü pickup (anacrusis)"
        >
          <input
            type="checkbox"
            checked={Boolean(muzikHeader.pickupMeasure)}
            onChange={(e) => setMuzikHeader((h) => ({ ...h, pickupMeasure: e.target.checked }))}
            className="accent-amber-500"
          />
          <span className="text-zinc-700">Pickup</span>
        </label>
      </div>
    </div>
  );
}
