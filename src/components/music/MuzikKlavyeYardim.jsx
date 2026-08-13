import { useEffect, useRef, useState } from 'react';
import { ayarlariAl, ayarlariDinle, ayarGuncelle } from '../../utils/ayarlar.js';

// Nota tuş düzenleri (ayardan seçilir) — yardım listesinde aktif olan gösterilir.
const NOTA_ALFABETIK = [['a', 'la'], ['b', 'si'], ['c', 'do'], ['d', 're'], ['e', 'mi'], ['f', 'fa'], ['g', 'sol']];
const NOTA_PIYANO = [['a', 'do'], ['s', 're'], ['d', 'mi'], ['f', 'fa'], ['g', 'sol'], ['h', 'la'], ['j', 'si']];

// Klavye kısayolları yardım penceresi (erişilebilir dialog).
// - Açılınca ekran okuyucu pencereye odaklanır (aria-modal, başlığı okunur).
// - Kapanınca odak, açılmadan önceki öğeye geri döner.
// - Esc ile kapanır; Tab odağı pencere içinde döngüye alır (focus trap).
const GRUPLAR = [
  {
    baslik: 'Genel',
    kisayollar: [
      ['Enter', 'Düzenleme modunu aç / kapat (sayfanın her yerinden)'],
      ['F2', 'Ekleme ↔ Düzeltme modu arası geçiş'],
      ['Alt', 'Seçili notanın Braille noktalarını oku'],
      ['F1', 'Bu kısayol penceresini aç'],
      ['Esc', 'Pencereyi kapat'],
    ],
  },
  {
    baslik: 'Ekleme / Düzeltme modu (F2 ile geçiş)',
    kisayollar: [
      ['Ekleme', 'harf = seçili notadan SONRA yeni nota ekler (araya)'],
      ['Düzeltme', 'harf = seçili notanın PERDESİNİ, 1-7 = SÜRESİNİ değiştirir'],
      ['End', 'son notaya git → ekleyince SONA eklenir'],
      ['Dize başı', 'sol anahtarına (← ile) git → ekleyince EN BAŞA eklenir'],
    ],
  },
  // Notalar grubu çalışma anında aktif düzene göre (alfabetik/piyano) eklenir.
  {
    baslik: 'Süre değerleri',
    kisayollar: [
      ['1', 'birlik (1lik)'], ['2', 'ikilik (2lik)'], ['3', 'dörtlük (4lük)'],
      ['4', 'sekizlik (8lik)'], ['5', 'onaltılık (16lık)'], ['6', 'otuzikilik (32lik)'],
      ['7', 'altmışdörtlük (64lük)'],
    ],
  },
  {
    baslik: 'Oktav ve arıza',
    kisayollar: [
      ['ğ', 'bir oktav aşağı'],
      ['ü', 'bir oktav yukarı'],
      ['Yukarı / Aşağı ok', 'diyez · naturel · arıza yok · bemol arası geçiş'],
    ],
  },
  {
    baslik: 'Gezinme ve seçim',
    kisayollar: [
      ['← / →', 'önceki / sonraki nota'],
      ['Home / End', 'ilk / son nota'],
      ['Ctrl + ← / →', 'önceki / sonraki ölçü'],
      ['Shift + ← / →', 'aralık (çoklu) seçim'],
      ['Shift + Home / End', 'başa / sona kadar seç'],
      ['Ctrl + A', 'tümünü seç'],
    ],
  },
  {
    baslik: 'Sus ve oynatma',
    kisayollar: [
      ['r', 'sus (es) ekle — seçili notadan sonra'],
      ['a – h', 'bir sus seçiliyken onu notaya çevirir'],
      ['Space', 'bulunulan notadan çal / duraklat'],
    ],
  },
  {
    baslik: 'Bağlar ve gruplar (seçiliyken)',
    kisayollar: [
      ['t', 'üçleme (triplet) uygula'],
      ['y', 'hece bağı (slur) uygula'],
      ['u', 'uzatma bağı (tie) uygula'],
    ],
  },
  {
    baslik: 'Dinamikler (seçili notaya)',
    kisayollar: [
      ['Shift + P', 'piano — tekrar: p ↔ pp'],
      ['Shift + F', 'forte — tekrar: f ↔ ff'],
      ['Shift + M', 'mezzo — tekrar: mf ↔ mp'],
    ],
  },
  {
    baslik: 'Ölçü çizgisi ve header (Enter ile açılır)',
    kisayollar: [
      ['l', 'seçili notadan sonra ölçü çizgisi ekler (dik çizgi | tuşu da çalışır)'],
      ['Enter (çizgide)', 'çizgiyi değiştir: çift · tekrar başlat/bitir · bitiş'],
      ['Enter (zaman imzası)', 'ölçü sayısını değiştir'],
      ['Enter (anahtar)', 'anahtar / donanım değiştir'],
    ],
  },
];

// Ekran okuyucu / tarayıcı TTS için konuşma-dostu metin: ok sembolleri, /, +, –
// gibi işaretleri sözcüğe çevirir ("← / →" → "sol ok ve sağ ok tuşları").
const OK_SOZCUK = { '←': 'sol ok', '→': 'sağ ok', '↑': 'yukarı ok', '↓': 'aşağı ok' };
const oklariCevir = (s) => String(s || '').replace(/[←→↑↓]/g, (m) => OK_SOZCUK[m] || m);

// Ekran okuyucunun düzgün okuyamadığı sembol tuşların ADI + nasıl yazıldığı.
const OZEL_TUS_OKUNUS = {
  '|': 'dik çizgi tuşu — Türkçe klavyede AltGr ile küçüktür işareti (<) tuşundan, İngilizce klavyede Shift ile ters bölü (\\) tuşundan yazılır',
};

function tusAriaMetni(tus) {
  if (OZEL_TUS_OKUNUS[tus]) return OZEL_TUS_OKUNUS[tus];
  let s = oklariCevir(tus)
    .replace(/\s*\/\s*/g, ' ve ')
    .replace(/\s*\+\s*/g, ' artı ')
    .replace(/\s*–\s*/g, ' ile ')
    .replace(/\bCtrl\b/g, 'Kontrol')
    .replace(/\bShift\b/g, 'Şift')
    .trim();
  if (s === '.') s = 'nokta';
  const cogul = / ve /.test(s);
  return `${s} ${cogul ? 'tuşları' : 'tuşu'}`;
}

function anlamAriaMetni(anlam) {
  return oklariCevir(anlam)
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*↔\s*/g, ', ')
    .replace(/\s*\/\s*/g, ' veya ')
    .trim();
}

export default function MuzikKlavyeYardim({ acik, onKapat }) {
  const dialogRef = useRef(null);
  const oncekiOdakRef = useRef(null);
  // Aktif nota tuş düzeni (ayardan) — Notalar grubu buna göre gösterilir.
  const [tusDuzeni, setTusDuzeni] = useState(() => {
    try { return ayarlariAl().notaTusDuzeni === 'piyano' ? 'piyano' : 'alfabetik'; } catch { return 'alfabetik'; }
  });
  useEffect(() => ayarlariDinle((a) => setTusDuzeni(a.notaTusDuzeni === 'piyano' ? 'piyano' : 'alfabetik')), []);

  const piyanoMu = tusDuzeni === 'piyano';
  const notaGrubu = {
    baslik: piyanoMu ? 'Notalar — Piyano düzeni (düzenleme modunda)' : 'Notalar — Alfabetik düzen (düzenleme modunda)',
    kisayollar: [
      ...(piyanoMu ? NOTA_PIYANO : NOTA_ALFABETIK),
      ['.', 'uzatma noktası ekle / kaldır'],
      ['Delete', 'seçili notayı sil'],
    ],
  };
  // Notalar grubunu Genel'den hemen sonra ekle.
  const gruplar = [GRUPLAR[0], notaGrubu, ...GRUPLAR.slice(1)];

  useEffect(() => {
    if (acik) {
      // Açılış: mevcut odağı sakla, pencereye odaklan (ekran okuyucu başlığı okur).
      oncekiOdakRef.current = document.activeElement;
      const id = requestAnimationFrame(() => dialogRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    // Kapanış: önceki odağa geri dön.
    const el = oncekiOdakRef.current;
    oncekiOdakRef.current = null;
    if (el && typeof el.focus === 'function') {
      const id = requestAnimationFrame(() => { try { el.focus(); } catch { /* yoksay */ } });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [acik]);

  if (!acik) return null;

  const onKeyDown = (e) => {
    e.stopPropagation(); // global skor klavye handler'ına sızmasın
    if (e.key === 'Escape') { e.preventDefault(); onKapat?.(); return; }
    if (e.key === 'Tab') {
      const odaklananlar = dialogRef.current?.querySelectorAll(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!odaklananlar || !odaklananlar.length) return;
      const ilk = odaklananlar[0];
      const son = odaklananlar[odaklananlar.length - 1];
      if (e.shiftKey && (document.activeElement === ilk || document.activeElement === dialogRef.current)) {
        e.preventDefault(); son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault(); ilk.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={onKapat}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="klavye-yardim-baslik"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="klavye-yardim-baslik" className="text-lg font-bold text-slate-800">
            Klavye Kısayolları
          </h2>
          <button
            type="button"
            onClick={onKapat}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        {/* Nota tuş düzeni geçişi — popup içinden iki form arasında geçilebilir. */}
        <div
          role="radiogroup"
          aria-label="Nota tuş düzeni"
          className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Nota tuş düzeni:</span>
          <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-slate-700 outline-none focus-within:ring-2 focus-within:ring-blue-400 hover:bg-white">
            <input
              type="radio"
              name="klavye-yardim-tus-duzeni"
              checked={tusDuzeni === 'alfabetik'}
              onChange={() => ayarGuncelle({ notaTusDuzeni: 'alfabetik' })}
              className="accent-blue-500"
            />
            Alfabetik nota kısayol düzeni (a&apos;dan g&apos;ye)
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-slate-700 outline-none focus-within:ring-2 focus-within:ring-blue-400 hover:bg-white">
            <input
              type="radio"
              name="klavye-yardim-tus-duzeni"
              checked={tusDuzeni === 'piyano'}
              onChange={() => ayarGuncelle({ notaTusDuzeni: 'piyano' })}
              className="accent-blue-500"
            />
            Piyano nota kısayol düzeni (a-s-d-f-g-h-j)
          </label>
        </div>

        {/* İki sütun (grid): her grup bir hücre, satır satır yerleşir. DOM sırası
            korunur; ekran okuyucu grupları sırayla okur (Genel → Notalar → ...).
            Her satır Tab ile odaklanabilir (tabIndex=0) → klavye kullanıcısı
            kısayollar arasında sırayla ilerleyip her birini dinleyebilir.
            Her bölüm role="group" + aria-labelledby ile başlığına bağlı, böylece
            odak gruba girince grup adı da seslendirilir. */}
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {gruplar.map((grup, gi) => {
            const basId = `klavye-yardim-grup-${gi}`;
            return (
              <section
                key={grup.baslik}
                role="group"
                aria-labelledby={basId}
                className="mb-4"
              >
                <h3
                  id={basId}
                  tabIndex={0}
                  className="mb-1 rounded px-1 text-xs font-bold uppercase tracking-wide text-slate-500 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-400"
                >
                  {grup.baslik}
                </h3>
                <dl className="divide-y divide-slate-100">
                  {grup.kisayollar.map(([tus, anlam]) => (
                    <div
                      key={tus + anlam}
                      tabIndex={0}
                      aria-label={`${tusAriaMetni(tus)}: ${anlamAriaMetni(anlam)}`}
                      className="flex items-baseline gap-3 rounded px-1 py-1 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-400"
                    >
                      <dt className="min-w-[7rem] shrink-0" aria-hidden="true">
                        <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-800">
                          {tus}
                        </kbd>
                      </dt>
                      <dd className="text-sm text-slate-700" aria-hidden="true">{anlam}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
