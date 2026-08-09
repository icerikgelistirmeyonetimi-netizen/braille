import React from 'react';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
} from '../data/braille.js';

// ─────────────────────────────────────────────────────────────────────────────
// Ayarlar → "Kısaltmalar ve Kullanım Kılavuzu" sekmesinin içeriği.
//
// İKİ bölüm: (1) klavye kısayolları / kullanım, (2) kısaltma tabloları.
// ⚠ Kısayollar UYDURULMAZ — hepsi koddan doğrulanmıştır:
//   Alt+ok            → components/BrailleCell.jsx `noktaKlavye`
//   F D S J K L       → components/BrailleKlavye.jsx `TUS_NOKTA`
//   Boşluk/Backspace/Enter → components/BrailleKlavye.jsx keydown
//   Sol/Sağ ok, Delete → pages/YazmaSerbest.jsx imleç keydown
//   "Hücreye dön"     → App.jsx #hucre-don-slot + CokHucreOkuyucu portalı
//   Sekme okları      → pages/Ayarlar.jsx tablist onKeyDown
//   Arama girdisi     → pages/AramaSayfasi.jsx (1-6 + Perkins süzme, boşluk)
//   Müzik editörü     → components/music/MuzikScoreSvg.jsx + MuzikKlavyeYardim.jsx
// Kısayol eklenir/değişirse BURAYI da güncelle.
// ⚠ MÜZİK kısaltmaları bu listede YOK (kullanıcı isteği) — Müzik → BRF bölümünde verilir.
// ─────────────────────────────────────────────────────────────────────────────

const KISAYOL_GRUPLARI = [
  {
    baslik: 'Genel gezinme',
    satirlar: [
      ['Tab / Shift + Tab', 'Düğmeler ve içerik arasında ileri / geri gezinir.'],
      ['Enter veya Boşluk', 'Üzerinde bulunduğunuz düğmeyi çalıştırır.'],
      ['H', 'Ekran okuyucunun tarama kipinde başlıklar arasında atlar. Başlık düzeni: birinci düzey uygulama adı, ikinci düzey sayfa başlığı, üçüncü düzey o anda çalıştığınız öğe.'],
      ['Ctrl + Home', 'İçeriğin en başına döner. Oradaki ilk düğme "Hücreye dön"dür; Enter ile doğrudan braille hücresinin 1. noktasına konumlanırsınız.'],
      ['Esc', 'Açık pencereyi, paneli veya tanıtım turunu kapatır.'],
    ],
  },
  {
    baslik: 'Braille hücresi (öğrenme sayfaları)',
    satirlar: [
      ['Alt + Sağ ok / Alt + Sol ok', 'Hücrenin sütunları arasında geçer: 1 ile 4, 2 ile 5, 3 ile 6 arasında. Öğede birden çok hücre varsa kenardan komşu hücreye geçer; son hücrede durur, sayfa değişmez.'],
      ['Alt + Yukarı ok / Alt + Aşağı ok', 'Hücrenin satırları arasında geçer: 1-2-3 ve 4-5-6.'],
      ['Enter veya Boşluk', 'Üzerinde durduğunuz noktaya basar.'],
      ['Düz ok tuşları', 'Uygulama bunlara dokunmaz; ekran okuyucunun kendi tarama gezinmesi için serbest bırakılmıştır.'],
    ],
  },
  {
    baslik: 'Braille klavyesiyle yazma (Perkins)',
    satirlar: [
      ['F D S J K L', 'Sırasıyla 1, 2, 3, 4, 5 ve 6. noktalar. Bir hücre yazmak için gereken tuşlara aynı anda basıp hepsini birlikte bırakın.'],
      ['Boşluk', 'Kelimeler arasına boşluk bırakır.'],
      ['Backspace', 'Son hücreyi siler.'],
      ['Enter', 'Onaylar; serbest yazmada yazdığınız metnin tamamını okutur.'],
      ['Ekrandaki nokta düğmeleri', 'Tab ile bu düğmelere geldiğinizde Enter veya Boşluk o düğmeyi basar; noktayı fare veya dokunmatikle de işaretleyebilirsiniz.'],
    ],
  },
  {
    baslik: 'Serbest yazma',
    satirlar: [
      ['Sol ok / Sağ ok', 'İmleci yazdığınız hücreler arasında geri ve ileri taşır; geçtiğiniz hücrenin anlamı okunur.'],
      ['Yeni hücre', 'İmlecin bulunduğu yere eklenir, sonuna değil.'],
      ['Backspace / Delete', 'Backspace imlecin solundaki, Delete sağındaki hücreyi siler.'],
      ['Hücreye odaklanma', 'Tab ile yazdığınız bir hücreye geldiğinizde imleç oraya taşınır; hücrenin anlamı ve nokta bileşimi okunur.'],
      ['Kısaltma düğmesi', 'Açıkken yazdıklarınız kısaltma kurallarına göre çözülür; hangi kısaltma sistemlerinin etkin olduğunu yanındaki liste düğmesinden seçebilirsiniz.'],
    ],
  },
  {
    baslik: 'Braille arama',
    satirlar: [
      ['1 – 6 rakamları', 'Aradığınız hücrenin noktalarını yazar.'],
      ['F D S J K L', 'Perkins tuşlarıyla da yazabilirsiniz; rakama çevrilir.'],
      ['Boşluk', 'Birden çok hücre aramak için hücreler arasına boşluk koyun. Örnek: 123 145.'],
      ['Mod seçimi', 'Girdi kutusunun yanındaki listeden "Braille arama" ile nokta numarasına, "Sözlük ile arama" ile ad veya anlama göre arayabilirsiniz.'],
    ],
  },
  {
    baslik: 'Ayarlar ve menü',
    satirlar: [
      ['Sol ok / Sağ ok', 'Ayarlar sayfasındaki sekmeler arasında geçer.'],
      ['Modül görünürlüğü', 'Ayarlar → Modüller sekmesinden ana menüde görünecek modülleri seçebilirsiniz.'],
      ['Hızlı dolaşım modu', 'Ders sayfalarındaki bu düğme, öğeleri kart listesi hâlinde gösterir; bir kartı etkinleştirince o öğe öğrenme modunda açılır.'],
    ],
  },
  {
    baslik: 'Müzik BRF yazım aracı',
    satirlar: [
      ['F1', 'Müzik editörünün tüm kısayollarını gösteren pencereyi açar.'],
      ['Enter', 'Düzenleme modunu açar ve kapatır.'],
      ['Art arda iki Enter', 'Perkins yazım panelini açar.'],
      ['F2', 'Ekleme ve düzeltme modu arasında geçiş yapar.'],
      ['Alt', 'Seçili notanın braille noktalarını okur.'],
    ],
  },
];

// ── Kısaltma tabloları ───────────────────────────────────────────────────────
const noktaMetni = (hucreler) => hucreler
  .map((h) => (Array.isArray(h) && h.length ? h.join(', ') : 'boş'))
  .join(' / ');

const KISALTMA_BOLUMLERI = [
  {
    baslik: 'Bir harfli kısaltmalar',
    aciklama: 'Harf tek başına yazıldığında bu kelime okunur. Kelimenin başında ek alırsa kısaltma ile ek arasına 3. nokta konur.',
    sutunlar: ['Yazılışı', 'Okunuşu', 'Noktalar'],
    satirlar: KELIME_KISALTMALARI.map((k) => [k.harf, k.kelime, noktaMetni([k.noktalar])]),
  },
  {
    baslik: 'İki harfli kısaltmalar',
    aciklama: 'İki hücre ile yazılır. Tek başına veya kelimenin başında ek alarak kullanılır.',
    sutunlar: ['Yazılışı', 'Okunuşu', 'Noktalar'],
    satirlar: IKI_HARFLI_KISALTMALAR.map((k) => [k.harf.toLocaleUpperCase('tr'), k.kelime, noktaMetni([k.sol, k.sag])]),
  },
  {
    baslik: 'Hece kısaltmaları',
    aciklama: 'Tek hücre ile yazılır; kelimenin başında, ortasında ve sonunda kullanılabilir. "ba", "be", "bu", "ka" ve "ha" heceleri kelimenin sonunda kullanılamaz. "ki" tek başına olup sonunda noktalama işareti varsa kısaltılmaz.',
    sutunlar: ['Hece', 'Noktalar'],
    satirlar: HECE_KISALTMALARI.map((k) => [k.hece, noktaMetni([k.noktalar])]),
  },
  {
    baslik: 'Kelime kökü kısaltmaları',
    aciklama: 'Önce 5. nokta (kök işareti), sonra sembol hücresi yazılır. Yalnız kelimenin başında ve ardından en az bir harf gelecek biçimde kullanılır.',
    sutunlar: ['Yazılışı', 'Kök', 'Noktalar'],
    satirlar: KELIME_KOKU_KISALTMALARI.map((k) => [k.etiket, k.kelime, noktaMetni([[5], k.sag])]),
  },
  {
    baslik: 'Kelime parçası kısaltmaları',
    aciklama: 'İki hücre ile yazılır. Kelimenin başında, tek başına veya sessiz harfle başlayan kelimenin ilk harfinden hemen sonra kullanılamaz.',
    sutunlar: ['Yazılışı', 'Ekler', 'Noktalar'],
    satirlar: KELIME_PARCASI_KISALTMALARI.map((k) => [k.etiket, k.ekler, noktaMetni([k.sol, k.sag])]),
  },
];

export default function KullanimKilavuzu({ kartStil, kartBaslikStil }) {
  const tabloStil = { width: '100%', borderCollapse: 'collapse', fontSize: '0.92em' };
  const hucreStil = {
    textAlign: 'left', padding: '6px 8px',
    borderBottom: '1px solid var(--panel-border, #e8eaf0)', verticalAlign: 'top',
  };
  const basHucreStil = { ...hucreStil, fontWeight: 700, color: 'var(--muted)' };
  const ozetStil = {
    cursor: 'pointer', fontWeight: 700, padding: '10px 4px',
    color: 'var(--accent, #5465ff)',
  };

  return (
    <>
      <div style={kartStil}>
        <div style={kartBaslikStil}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
          </svg>
          Kullanım Kılavuzu
        </div>
        <p style={{ margin: 0, fontSize: '0.88em', color: 'var(--muted)', lineHeight: 1.5 }}>
          Uygulamayı klavye ve ekran okuyucu ile kullanmak için kısayollar.
        </p>
        {KISAYOL_GRUPLARI.map((grup) => (
          <section key={grup.baslik} aria-labelledby={`kisayol-${grup.baslik}`} style={{ marginTop: 4 }}>
            <h3 id={`kisayol-${grup.baslik}`} style={{ fontSize: '1em', margin: '10px 0 4px' }}>{grup.baslik}</h3>
            <dl style={{ margin: 0 }}>
              {grup.satirlar.map(([tus, aciklama]) => (
                <div key={tus} style={{ padding: '6px 0', borderBottom: '1px solid var(--panel-border, #e8eaf0)' }}>
                  <dt style={{ fontWeight: 700 }}>{tus}</dt>
                  <dd style={{ margin: '2px 0 0', color: 'var(--muted)', lineHeight: 1.5 }}>{aciklama}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div style={kartStil}>
        <div style={kartBaslikStil}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Kısaltmalar
        </div>
        <p style={{ margin: 0, fontSize: '0.88em', color: 'var(--muted)', lineHeight: 1.5 }}>
          MEB Türkçe Braille Yazı Kılavuzu&apos;ndaki kısaltma sistemleri. Bir bölümü açmak için
          başlığını etkinleştirin. Noktalar sütununda eğik çizgi hücreleri ayırır.
          Müzik braille işaretleri bu listede yer almaz; onlar Müzik → BRF bölümünde verilmiştir.
        </p>
        {KISALTMA_BOLUMLERI.map((bolum) => (
          <details key={bolum.baslik} style={{ borderTop: '1px solid var(--panel-border, #e8eaf0)' }}>
            <summary style={ozetStil}>{bolum.baslik} ({bolum.satirlar.length})</summary>
            <p style={{ margin: '0 0 8px', fontSize: '0.86em', color: 'var(--muted)', lineHeight: 1.5 }}>
              {bolum.aciklama}
            </p>
            <table style={tabloStil}>
              <caption className="sr-only">{bolum.baslik}</caption>
              <thead>
                <tr>
                  {bolum.sutunlar.map((s) => (
                    <th key={s} scope="col" style={basHucreStil}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bolum.satirlar.map((satir) => (
                  <tr key={satir.join('|')}>
                    {satir.map((deger, i) => (
                      <td key={i} style={hucreStil}>{deger}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </>
  );
}
