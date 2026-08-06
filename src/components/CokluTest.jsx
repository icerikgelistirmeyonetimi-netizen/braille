import React, { useEffect, useRef, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleKlavye from './BrailleKlavye.jsx';
import SesIzinEkrani from './SesIzinEkrani.jsx';
import { konus, konusmayiDurdur, hataBildir, dogruSesi } from '../utils/ses.js';
import { karistir, HUCRE_SIRA_SOZ as HUCRE_ETIKET } from '../utils/diziYardimci.js';

// Genel amaçlı çoklu kategori sınav bileşeni.
// GİRİŞ MODELİ = Karışık Yazma ile aynı: BrailleKlavye (Perkins fiziksel tuş + mobil yatay
// popup), akor (chord) girişi, ses efekti dönütleri, sesli yönerge. İsteğe bağlı ses kaydı
// (Kur'an harf sesi / Müzik nota sesi) soru başında çalınır + "Sesi Dinle" ile tekrar.
//
// kaynaklar şekli:
//   {
//     anahtar: {
//       etiket: 'Görünen ad',
//       kategori: 'sembol/işaret/...',
//       veri: [{ ad, ariaAd?, ipucu?, hucreler: number[][], ...sesAlanları }, ...]
//     }, ...
//   }
//
// Ses props (opsiyonel):
//   ogeSesiCal(item, { onEnded })  — öğenin ses kaydını çalar (Kur'an: dosya, Müzik: piyano)
//   ogeSesiDurdur()                — çalan kaydı durdurur
//   sesPrompt                      — true → soru gelince ses otomatik çalar (işitsel ipucu)
//   sesButonEtiketi                — "Sesi Dinle" butonunun etiketi
//   sesIzin: { aciklama, butonMetni, ilkSesUrl } — verilirse önce SesIzinEkrani gösterilir

const noktaEsit = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
};

const NOKTA_TUS = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };
const SORU_SAYISI = 10;

export default function CokluTest({
  baslik,
  kaynaklar,
  ogeSesiCal,
  ogeSesiDurdur,
  ogeSesiVarMi = null, // (item) => bool — yalnız sesi olan öğelerde ses çal/buton göster
  sesPrompt = false,
  sesButonEtiketi = 'Sesi Dinle',
  sesIzin = null,
}) {
  const sesli = typeof ogeSesiCal === 'function';

  const [sesIzniVar, setSesIzniVar] = useState(!sesIzin);
  const [kaynak, setKaynak] = useState(null);
  const [kaynakAnahtar, setKaynakAnahtar] = useState(null);
  const [sorular, setSorular] = useState([]);
  const [indeks, setIndeks] = useState(0);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [puan, setPuan] = useState(0);
  const [hataSayisi, setHataSayisi] = useState(0);
  const [soruDeneme, setSoruDeneme] = useState(0);
  const [ipucuGoster, setIpucuGoster] = useState(false);
  const [bittimi, setBittimi] = useState(false);
  const [tabletModu, setTabletModu] = useState(
    () => localStorage.getItem('tabletModu') === '1'
  );
  // Doğru/yanlış seslendirmesi sırasında girişleri kilitle.
  const kilitliRef = useRef(false);
  const [kilitli, setKilitli] = useState(false);
  const kilitle = (deger) => { kilitliRef.current = deger; setKilitli(deger); };
  const sonDotRef = useRef(null);
  // Klavyedeki "tıklı" görseli her geçişte temizlemek için.
  const [sifirlaAnahtari, setSifirlaAnahtari] = useState(0);
  const sonrakineGec = () => setSifirlaAnahtari((s) => s + 1);

  const aktif = sorular[indeks];
  // Soru olarak GÖSTERİLEN metin: açıklayıcı `ipucu` (varsa), yoksa glif `ad`.
  // Ayrı "İpucu:" satırı kaldırıldığından açıklama doğrudan h3'te görünür.
  const soruMetni = aktif ? (aktif.ipucu || aktif.ad) : '';
  const beklenenHucre = aktif ? aktif.hucreler[hucreIndeksi] : null;
  const cokHucreli = aktif ? aktif.hucreler.length > 1 : false;
  // Bu öğenin ses kaydı var mı? (Kur'an testinde harf/hece var, hareke/tecvid yok.)
  const aktifSesli = sesli && !!aktif
    && (typeof ogeSesiVarMi === 'function' ? ogeSesiVarMi(aktif) : true);

  const sesiDurdur = () => { if (typeof ogeSesiDurdur === 'function') ogeSesiDurdur(); };

  const tabletModuToggle = () => setTabletModu((v) => {
    const yeni = !v;
    localStorage.setItem('tabletModu', yeni ? '1' : '0');
    konus(yeni ? 'Tablet modu açık.' : 'Tablet modu kapalı.', { kesintiyle: true });
    return yeni;
  });

  const yardimMetni = () => {
    if (!beklenenHucre) return '';
    const nk = beklenenHucre.join(', ');
    const tuslar = beklenenHucre.map((n) => NOKTA_TUS[n]).join(' ve ');
    const sira = cokHucreli
      ? `${HUCRE_ETIKET[hucreIndeksi] || (hucreIndeksi + 1) + '.'} hücre için `
      : '';
    return `${sira}${nk} numaralı noktalara, klavyede ${tuslar} tuşlarına ` +
           `aynı anda parmaklarınızla basıp birlikte bırakın.`;
  };

  const yonergeMetin = (s = aktif, hi = hucreIndeksi) => {
    if (!s) return '';
    const adi = s.ariaAd || s.ad;
    const cok = s.hucreler.length > 1;
    if (cok) {
      const sira = HUCRE_ETIKET[hi] || `${hi + 1}.`;
      if (hi === 0) {
        return `Soru ${indeks + 1}: ${adi}. ${s.hucreler.length} hücreden oluşur. ${sira} hücreyi yazın.`;
      }
      return `Şimdi ${sira} hücreyi yazın.`;
    }
    return `Soru ${indeks + 1}: ${adi} yazın. ${kaynak ? 'Bu ' + kaynak.kategori + 'ni' : 'Bunu'} oluşturan noktalara aynı anda basıp birlikte bırakın.`;
  };

  // Soru/hücre değişiminde: (ses kaydı varsa çal →) yönergeyi oku → kilidi aç.
  useEffect(() => {
    if (!kaynak || bittimi || !aktif) return undefined;
    kilitle(true);
    const metin = yonergeMetin();
    const yonergeyiOku = () => konus(metin, { kesintiyle: true, onSon: () => kilitle(false) });

    let fallback = null;
    if (aktifSesli && sesPrompt && hucreIndeksi === 0) {
      // Ses kaydı işitsel ipucu olarak çalsın; bitince yönerge okunsun.
      sesiDurdur();
      let okundu = false;
      const oku = () => { if (okundu) return; okundu = true; yonergeyiOku(); };
      ogeSesiCal(aktif, { onEnded: oku });
      fallback = window.setTimeout(oku, 5000); // ses gelmezse en geç 5 sn sonra oku
    } else {
      yonergeyiOku();
    }

    const tekrar = () => {
      konusmayiDurdur();
      if (aktifSesli && sesPrompt && hucreIndeksi === 0) {
        sesiDurdur();
        let okundu = false;
        const oku = () => { if (okundu) return; okundu = true; konus(metin, { kesintiyle: true, onSon: () => kilitle(false) }); };
        ogeSesiCal(aktif, { onEnded: oku });
        window.setTimeout(oku, 5000);
      } else {
        konus(metin, { kesintiyle: true, onSon: () => kilitle(false) });
      }
    };
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      if (fallback) window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, hucreIndeksi, kaynak, bittimi]);

  useEffect(() => () => { konusmayiDurdur(); sesiDurdur(); }, []);

  // Yeni soruya geçince ipucu/deneme sıfırla
  useEffect(() => { setSoruDeneme(0); setIpucuGoster(false); }, [indeks]);

  const basla = (anahtar) => {
    const k = kaynaklar[anahtar];
    const veri = (k.veri || []).filter((s) => Array.isArray(s.hucreler) && s.hucreler.length > 0);
    const seri = karistir(veri).slice(0, Math.min(SORU_SAYISI, veri.length));
    konusmayiDurdur();
    sonrakineGec();
    kilitle(false);
    setKaynak(k);
    setKaynakAnahtar(anahtar);
    setSorular(seri);
    setIndeks(0);
    setHucreIndeksi(0);
    setPuan(0);
    setHataSayisi(0);
    setSoruDeneme(0);
    setIpucuGoster(false);
    setBittimi(false);
  };

  const sonrakiSoruyaGec = () => {
    sonrakineGec();
    if (indeks + 1 >= sorular.length) {
      setBittimi(true);
    } else {
      setIndeks((i) => i + 1);
      setHucreIndeksi(0);
    }
  };

  const dogruCevabiAcikla = () => {
    if (!aktif || kilitliRef.current) return;
    kilitle(true);
    sesiDurdur();
    const noktaMetin = aktif.hucreler
      .map((h, i) => (cokHucreli ? `${HUCRE_ETIKET[i] || (i + 1) + '.'} hücre ` : '') + h.join(', '))
      .join('; ');
    konus(`Doğru cevap: ${aktif.ariaAd || aktif.ad}. Noktalar: ${noktaMetin}.`, {
      kesintiyle: true,
      onSon: () => setTimeout(sonrakiSoruyaGec, 700),
    });
    setTimeout(sonrakiSoruyaGec, 6000); // fallback
  };

  // Sıralı tıklama doğrulama (her nokta basışında) — son noktayı onHucre birleştirir.
  const onTiklaDogrula = (n, mevcutSira) => {
    if (!beklenenHucre) return true;
    const siradaki = beklenenHucre[mevcutSira.length];
    if (n !== siradaki) {
      konus(`${n} yanlış`, { kesintiyle: true });
      return false;
    }
    if (mevcutSira.length + 1 >= beklenenHucre.length) {
      sonDotRef.current = n;
    } else {
      konus(`${n} doğru`, { kesintiyle: true });
    }
    return true;
  };

  const onHucre = (noktalar) => {
    if (kilitliRef.current || bittimi || !aktif) return;
    if (noktaEsit(noktalar, beklenenHucre)) {
      kilitle(true);
      const lastDot = sonDotRef.current;
      sonDotRef.current = null;
      const onayMetin = lastDot != null ? `${lastDot} doğru` : noktalar.join(', ');
      if (hucreIndeksi + 1 >= aktif.hucreler.length) {
        // Soru tamamlandı → ses efekti (ding) + tebrik, sonra sonraki soru.
        setPuan((p) => p + 1);
        let gecildi = false;
        const gecis = () => { if (gecildi) return; gecildi = true; sonrakiSoruyaGec(); };
        dogruSesi(); // ses efekti (ding)
        konus(`${onayMetin}. ${aktif.ariaAd || aktif.ad} doğru.`, {
          kesintiyle: true,
          onSon: () => setTimeout(gecis, 300),
        });
        setTimeout(gecis, 4000); // fallback
      } else {
        // Sonraki hücre
        let gecildi = false;
        const gecis = () => { if (gecildi) return; gecildi = true; sonrakineGec(); setHucreIndeksi((h) => h + 1); };
        konus(onayMetin, { kesintiyle: true, onSon: () => setTimeout(gecis, 200) });
        setTimeout(gecis, 2500); // fallback
      }
      return;
    }
    // Yanlış → ses efekti (buzz) + uyarı.
    setHataSayisi((h) => h + 1);
    const yeniDeneme = soruDeneme + 1;
    setSoruDeneme(yeniDeneme);
    hataBildir(`Yanlış. Bastığınız noktalar ${noktalar.join(', ') || 'yok'}.`);
    if (yeniDeneme >= 3 && !ipucuGoster) setIpucuGoster(true);
  };

  const onBosluk = () => {
    if (kilitliRef.current) return;
    konus('Boşluk gerekmiyor.', { kesintiyle: true });
  };

  const onSil = () => {
    if (kilitliRef.current) return;
    if (hucreIndeksi > 0) {
      sonrakineGec();
      setHucreIndeksi((h) => h - 1);
      konus('önceki hücre', { kesintiyle: true });
    } else {
      konus('hücre yok', { kesintiyle: true });
    }
  };

  // --- Ses izni ekranı (Kur'an gibi ses kayıtlı testlerde) ---
  if (sesIzin && !sesIzniVar) {
    return (
      <SesIzinEkrani
        baslik={baslik}
        aciklama={sesIzin.aciklama || 'Bu testte ses kayıtları kullanılacak. Başlamadan önce sesi başlatmanız gerekir.'}
        butonMetni={sesIzin.butonMetni || 'Sesi Başlat ve Teste Geç'}
        ilkSesUrl={sesIzin.ilkSesUrl}
        sessizBaslat
        onIzinVerildi={() => setSesIzniVar(true)}
      />
    );
  }

  // --- Kategori seçimi ---
  if (!kaynak) {
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <nav className="menu" aria-label="Test kategorileri" style={{ margin: 0, gap: 10 }}>
          {Object.entries(kaynaklar).map(([k, v]) => (
            <button
              className="btn"
              key={k}
              type="button"
              onClick={() => basla(k)}
              aria-label={`${v.etiket} testini başlat`}
            >
              {v.etiket} Testi
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // --- Sonuç ekranı ---
  if (bittimi) {
    const yuzde = sorular.length ? Math.round((puan / sorular.length) * 100) : 0;
    return (
      <div className="page yazma-page">
        <div className="yazma-bolum yazma-bolum-ust">
          <PageHeader baslik={`${baslik} — Sonuç`} />
        </div>
        <div className="yazma-bolum yazma-bolum-orta">
          <div className="instruction success" role="status" aria-live="polite" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3em', fontWeight: 800 }}>
              Puanınız: {puan} / {sorular.length} (%{yuzde})
            </div>
            <div>Toplam yanlış basma: {hataSayisi}</div>
          </div>
        </div>
        <div className="yazma-bolum yazma-bolum-alt">
          <div className="controls">
            <button className="btn" type="button" onClick={() => basla(kaynakAnahtar)}>Tekrar Dene</button>
            <button className="btn" type="button" onClick={() => { konusmayiDurdur(); sesiDurdur(); setKaynak(null); setKaynakAnahtar(null); }}>
              Kategori Değiştir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Soru ekranı (klavye tabanlı, karışık yazma modeli) ---
  return (
    <div className="page yazma-page">
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik={`Test: ${kaynak.etiket}`} />
        <div className="progress" aria-hidden="true">
          Soru {indeks + 1} / {sorular.length} • Doğru: {puan} • Yanlış: {hataSayisi}
          {cokHucreli && ` • Hücre ${hucreIndeksi + 1} / ${aktif.hucreler.length}`}
        </div>
      </div>

      {/* Ekran okuyucu için soru duyurusu */}
      <div role="status" aria-live="polite" className="sr-only">
        {yonergeMetin()}
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        {/* h3 = o anki öğe (h1 uygulama / h2 sayfa hiyerarşisi) — NVDA "h" kısayoluyla erişilir.
            ⚠ SORU METNİ = `ipucu` (varsa), `ad` DEĞİL (kullanıcı: "test bölümünde ipucu diye
            yazan ifadeler yazmalı sadece" → "ipucunu kaldır, ipuçlarında yazanları h3e yaz").
            ESKİDEN h3 glifi (`ad`: ".", "BD", "ا", "*") gösteriyor, ALTINDA ayrı bir
            "İpucu: <açıklama>" satırı duruyordu; sembolsüz öğelerde ikisi AYNI metni yazıyordu.
            Artık açıklayıcı metin doğrudan h3'te, ayrı ipucu satırı YOK.
            `ipucu` tanımsızsa (bazı kategoriler) eskisi gibi `ad` gösterilir. */}
        <h3
          className="yazma-metin"
          aria-label={`Yazılacak: ${aktif.ariaAd || soruMetni}`}
          style={{
            textAlign: 'center', fontSize: 'clamp(1.6em, 7vh, 3em)', lineHeight: 1, padding: '4px 8px', margin: 0,
            fontWeight: 400,
            // Arapça içerik (Kur'an testi) için Amasya fontu — GÖSTERİLEN metne bakılır.
            fontFamily: /[؀-ۿ]/.test(String(soruMetni)) ? "'Amasya', 'Segoe UI', sans-serif" : undefined,
          }}
        >
          {soruMetni}
        </h3>
        {cokHucreli && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '1.05em' }}>
            {HUCRE_ETIKET[hucreIndeksi] || (hucreIndeksi + 1) + '.'} hücreyi yazın ({aktif.hucreler.length} hücreli)
          </div>
        )}
        {/* Ayrı "İpucu:" satırı KALDIRILDI — içeriği artık h3'te (yukarı). Aşağıdaki
            `ipucuGoster` bloğu AYRIDIR: 3 yanlış denemeden sonra çıkan nokta/tuş yardımı. */}
        {ipucuGoster && (
          <div className="yazma-ipucu" role="status" aria-live="polite">
            <b>Yardım:</b> {yardimMetni()}
          </div>
        )}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            vurguNoktalar={ipucuGoster ? beklenenHucre || [] : []}
            klavyeIpucu={ipucuGoster}
            tabletModu={tabletModu}
            siralikTiklama
            onTikla={onTiklaDogrula}
            beklenenSayi={beklenenHucre?.length || 0}
            kilitli={kilitli}
            tikliyiKoru
            sifirlaAnahtari={sifirlaAnahtari}
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          {aktifSesli && (
            <button className="btn" type="button" onClick={() => { sesiDurdur(); ogeSesiCal(aktif); }} aria-label={sesButonEtiketi}>
              🔊 <span className="btn-etiket">{sesButonEtiketi}</span>
            </button>
          )}
          <button
            className="btn"
            type="button"
            onClick={() => window.dispatchEvent(new Event('yonergeTekrar'))}
          >
            Soruyu Tekrarla
          </button>
          <button className="btn" type="button" onClick={dogruCevabiAcikla} disabled={kilitli}>Cevabı Söyle</button>
          <button className="btn" type="button" onClick={() => { konusmayiDurdur(); sesiDurdur(); sonrakiSoruyaGec(); }}>Atla →</button>
          <button
            type="button"
            className={`btn ${tabletModu ? 'aktif' : ''}`}
            aria-pressed={tabletModu}
            onClick={tabletModuToggle}
            title="Tablette yazarken sol/sağ noktaları çevir"
          >Tablet Modu</button>
        </div>
      </div>

      {/* Yatayda (mobil) popup klavye */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          vurguNoktalar={ipucuGoster ? beklenenHucre || [] : []}
          klavyeIpucu={ipucuGoster}
          tabletModu={tabletModu}
          anindaDokunma
          onTikla={onTiklaDogrula}
          beklenenSayi={beklenenHucre?.length || 0}
          kilitli={kilitli}
          sifirlaAnahtari={sifirlaAnahtari}
        />
      </div>
    </div>
  );
}
