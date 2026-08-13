import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// "Kullanım Kılavuzu" — Ayarlar → Kılavuz sekmesi VE F1 penceresi (KilavuzPenceresi)
// aynı bileşeni kullanır.
//
// ⚠ YALNIZ KISAYOLLAR: kısaltma tabloları (bir/iki harfli, hece, kök, parça) burada
// BULUNMAZ — kullanıcı iki kez açıkça istedi ("kısayol tuşları sadece olacaktı",
// "kılavuzda hâlâ bu bölüm neden var, bu bölüm çıkacaktı"). Kısaltmalar zaten Modül 2
// derslerinde öğretiliyor; müzik işaretleri de Müzik → BRF bölümünde. Tablo EKLEME.
// ⚠ Kısayollar UYDURULMAZ — hepsi koddan doğrulanmıştır:
//   Alt+ok            → components/BrailleCell.jsx `noktaKlavye`
//   F D S J K L       → components/BrailleKlavye.jsx `TUS_NOKTA`
//   Boşluk/Backspace/Enter → components/BrailleKlavye.jsx keydown
//   Sol/Sağ ok, Delete → pages/YazmaSerbest.jsx imleç keydown
//   "Hücreye dön"     → App.jsx #hucre-don-slot + CokHucreOkuyucu portalı
//   Sekme okları      → pages/Ayarlar.jsx tablist onKeyDown
//   Arama girdisi     → pages/AramaSayfasi.jsx (1-6 + Perkins süzme, boşluk)
//   Müzik editörü     → components/music/MuzikScoreSvg.jsx + MuzikKlavyeYardim.jsx
//   Shift+Ctrl+Alt, Alt+P, Alt+T → pages/Araclar.jsx mod kısayolları effect'i
//   Shift+Ctrl+Alt (kısaltma)    → pages/YazmaSerbest.jsx kısaltma kısayolu effect'i
// Kısayol eklenir/değişirse BURAYI da güncelle.
// ⚠ TEK İSTİSNA — "Ekran okuyucu — serbest gezinme" grubu: NVDA (Insert+Boşluk) ve JAWS
// (Insert+Z) kendi kısayollarıdır, uygulamada karşılığı YOKTUR (kullanıcı isteğiyle
// hatırlatma olarak eklendi). Bunları koddan doğrulamaya çalışma.
// ─────────────────────────────────────────────────────────────────────────────

const KISAYOL_GRUPLARI = [
  {
    baslik: 'Genel gezinme',
    satirlar: [
      ['Tab / Shift + Tab', 'Düğmeler ve içerik arasında ileri / geri gezinir.'],
      ['Enter veya Boşluk', 'Üzerinde bulunduğunuz düğmeyi çalıştırır.'],
      ['H', 'Ekran okuyucunun tarama kipinde başlıklar arasında atlar. Başlık düzeni: birinci düzey uygulama adı, ikinci düzey sayfa başlığı, üçüncü düzey o anda çalıştığınız öğe.'],
      ['Ctrl + Home', 'İçeriğin en başına döner. Oradaki ilk düğme "Hücreye dön"dür; Enter ile doğrudan Braille hücresinin 1. noktasına konumlanırsınız.'],
      ['Esc', 'Açık pencereyi, paneli veya tanıtım turunu kapatır.'],
    ],
  },
  {
    // ⚠ Bu gruptaki kısayollar UYGULAMANIN DEĞİL, ekran okuyucunun kendi kısayollarıdır
    // (kullanıcı: "yardıma serbest gezinme modu (sanal imleç) aç kapa için jaws programı ve
    // nvda için kısayollar eklenmeli. insert + z jaws için, insert + boşluk nvda için").
    // Uygulama bu tuşları YAKALAMAZ; kılavuzda yalnız hatırlatma olarak yer alır.
    baslik: 'Ekran okuyucu — serbest gezinme (sanal imleç)',
    satirlar: [
      ['NVDA: Insert + Boşluk', 'Tarama (serbest gezinme) kipi ile odak kipi arasında geçiş yapar. Tarama kipinde ok tuşlarıyla sayfada serbestçe dolaşır, H ile başlıklara atlarsınız; odak kipinde tuşlar doğrudan uygulamaya gider.'],
      ['JAWS: Insert + Z', 'Sanal imleci (serbest gezinme) açar ve kapatır. Kapalıyken tuşlar doğrudan uygulamaya gider.'],
      ['Ne zaman kapatmalı?', 'Braille noktalarına Enter veya Boşluk ile basarken, Perkins tuşlarıyla (F D S J K L) yazarken ve metin kutusuna yazarken serbest gezinme kapalı olmalıdır. Bu alanlara geçtiğinizde ekran okuyucu genellikle kipi kendisi değiştirir.'],
      ['Bu tuşlar uygulamaya ait değildir', 'NVDA ve JAWS kendi kısayollarıdır; uygulama bunları değiştirmez. Insert yerine Büyük Harf Kilidi (Caps Lock) tuşunu kullanacak şekilde ayarlanmış ekran okuyucularda o tuşla da çalışır.'],
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
      ['Yanlış işaretlediniz mi?', 'Serbest yazmada aynı noktaya bir kez daha basmak seçimi iptal eder. Sil düğmesi ise henüz tamamlanmamış hücrenin tamamını iptal eder. Test ve alıştırma sayfalarında yanlış noktaya zaten izin verilmez.'],
    ],
  },
  {
    // Kullanıcı: "kılavuzda serbest yazma yerine Modül 4'te Serbest Yazma bölümü … yaz"
    // → başlık dersin nerede olduğunu söylesin.
    baslik: 'Modül 4 — Serbest Yazma bölümü',
    satirlar: [
      ['Sol ok / Sağ ok', 'İmleci yazdığınız hücreler arasında geri ve ileri taşır; geçtiğiniz hücrenin anlamı okunur.'],
      ['Yukarı ok / Aşağı ok', 'Bir üst ya da alt satıra geçer ve o satırın metnini okur.'],
      ['Home / End', 'İmleci bulunduğunuz satırın başına ya da sonuna taşır.'],
      ['Yeni hücre', 'İmlecin bulunduğu yere eklenir, sonuna değil.'],
      ['Backspace / Delete', 'Backspace imlecin solundaki, Delete sağındaki hücreyi siler.'],
      ['Hücreye odaklanma', 'Tab ile yazdığınız bir hücreye geldiğinizde imleç oraya taşınır; hücrenin anlamı ve nokta bileşimi okunur.'],
      ['Shift + Ctrl + Alt', 'Kısaltmalı yazımı açar ve kapatır; alttaki Kısaltma düğmesine tıklamakla aynı işi yapar. Yazdığınız hücreler silinmez, yeni moda göre yeniden çözülür.'],
      ['Kısaltma düğmesi', 'Açıkken yazdıklarınız kısaltma kurallarına göre çözülür; hangi kısaltma sistemlerinin etkin olduğunu yanındaki liste düğmesinden seçebilirsiniz.'],
    ],
  },
  {
    // Kullanıcı isteğiyle eklendi: "shift+ctrl+alt … kısaltmayı aç kapa … alt+p perkins
    // … alt+t tablet modu". Kaynak: pages/Araclar.jsx mod kısayolları effect'i.
    baslik: 'Modül 10 — Metin → BRF aracı',
    satirlar: [
      ['Shift + Ctrl + Alt', 'Kısaltmalı yazımı açar ve kapatır; alttaki Kısaltma düğmesine tıklamakla aynı işi yapar.'],
      ['Alt + P', 'Perkins klavyeyi açar ve kapatır.'],
      ['Alt + T', 'Braille tablet modunu açar ve kapatır.'],
      ['Durum bildirimi', 'Üç kısayol da yeni durumu ("Kısaltma açık", "Perkins klavye kapalı" gibi) ekran okuyucuya bildirir.'],
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
      ['Alt', 'Seçili notanın Braille noktalarını okur.'],
    ],
  },
];

// ⚠ İKİ AYRI BİLEŞEN (kullanıcı: "kullanım kılavuzuna kısaltmalar başlığını neden ekledim,
// kısayol tuşları sadece olacaktı"): `KullanimKilavuzu` YALNIZ kısayolları gösterir (F1
// penceresi bunu kullanır), kısaltma tabloları ayrı `KisaltmaTablolari` bileşenindedir ve
// yalnız Ayarlar sekmesinde gösterilir.
// `baslikGizle`: F1 penceresinde diyaloğun kendi h2'si zaten "Kullanım Kılavuzu" diyor →
// kart başlığı tekrar edilmesin (aynı metin iki kez okunmasın).
export default function KullanimKilavuzu({ kartStil, kartBaslikStil, baslikEtiketi = 'h2', baslikGizle = false }) {
  return (
    <>
      <div style={kartStil}>
        {/* ⚠ Başlık İÇERİĞİN İÇİNDE (kullanıcı: "h2 içeriğe taşı"): Ayarlar panelinde
            kartın üstünde ayrı bir h2 satırı vardı; kaldırıldı, kartın kendi başlığı
            gerçek <h2> yapıldı → hem görsel tekrar yok hem başlık düzeni korunuyor.
            `baslikEtiketi` ile F1 penceresi kendi h2'sini (pencere başlığı) kullanabilir. */}
        {!baslikGizle && React.createElement(baslikEtiketi, { style: { ...kartBaslikStil, margin: 0, fontSize: '1.05em' } },
          <svg key="ikon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
          </svg>,
          'Kullanım Kılavuzu',
        )}
        <p style={{ margin: 0, fontSize: '0.88em', color: 'var(--muted)', lineHeight: 1.5 }}>
          Uygulamayı klavye ve ekran okuyucu ile kullanmak için kısayollar.
        </p>
        {KISAYOL_GRUPLARI.map((grup, gi) => (
          <section key={grup.baslik} aria-labelledby={`kisayol-${gi}`} className="kilavuz-grup">
            {/* Alt başlıklar belirgin olmalı (kullanıcı: "genel gezinme gibi alt
                başlıkların stil tasarımı çok sade ve ayırt edici değil"): numaralı
                rozet + vurgu rengi + bant zemin. */}
            <h3 id={`kisayol-${gi}`} className="kilavuz-grup-baslik">
              <span className="kilavuz-grup-no" aria-hidden="true">{gi + 1}</span>
              {grup.baslik}
            </h3>
            <dl className="kilavuz-liste">
              {grup.satirlar.map(([tus, aciklama]) => (
                <div key={tus} className="kilavuz-satir">
                  <dt className="kilavuz-tus">{tus}</dt>
                  <dd className="kilavuz-aciklama">{aciklama}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
