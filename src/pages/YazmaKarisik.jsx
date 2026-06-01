import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { kaynagiAl } from '../utils/karisikYazmaKaynaklari.js';
import { sonraOgrenTumunuAl } from '../utils/ilerleme.js';

// Aynı içerikteki dot dizilerini karşılaştır (sırasız küme eşitliği).
const noktaEsit = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
};

// Fisher-Yates karıştırma
const karistir = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const NOKTA_TUS = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };
const HUCRE_ETIKET = ['1.', '2.', '3.', '4.', '5.', '6.'];
// Sesli yönergede "5." gibi nokta-sıralı ifadeler yerine sözcük kullan.
const HUCRE_SIRA_SOZ = ['birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'altıncı'];

const SORU_SAYISI_VARSAYILAN = 10;

export default function YazmaKarisik() {
  const { kaynak } = useParams();
  const navigate = useNavigate();
  const kaynakNesne = useMemo(() => kaynagiAl(kaynak), [kaynak]);

  // Kaynak yoksa ana menüye dön
  if (!kaynakNesne) {
    return (
      <div className="page">
        <PageHeader baslik="Karışık Yazma" />
        <div className="page-mid" style={{ padding: 16 }}>
          <p>Bu ders için karışık yazma etkinliği tanımlı değil.</p>
          <button className="btn" type="button" onClick={() => navigate('/')}>Ana Menü</button>
        </div>
      </div>
    );
  }

  // Soru sayısı seçimi: 'tum' = tüm dersi karışık, 'kayitlilar' = sonra-öğren listesi, ya da 2/3/4 öğe
  const [grupBoyu, setGrupBoyu] = useState('tum');

  // Sonra-öğren listesiyle eşleştirme (kaynak şemasından bağımsız)
  const kayitlilarFiltrele = (items) => {
    const tumKayitli = sonraOgrenTumunuAl();
    const savedSet = new Set(Object.values(tumKayitli).flat().map(String));
    if (!savedSet.size) return [];
    return items.filter((item) => {
      if (!item) return false;
      const et = String(item.etiket ?? '');
      if (savedSet.has(et) || savedSet.has(et.toUpperCase()) || savedSet.has(et.toLowerCase())) return true;
      if (item.ariaAd && savedSet.has(String(item.ariaAd))) return true;
      if (item.ariaAd) {
        const ad = String(item.ariaAd);
        for (const s of savedSet) { if (s.length >= 2 && ad.includes(s)) return true; }
      }
      return false;
    });
  };

  // Kaynağı karıştır ve istenen kadar al
  const sorulariUret = (boyut) => {
    if (boyut === 'kayitlilar') {
      const filtrelenmis = kayitlilarFiltrele(kaynakNesne.items);
      return filtrelenmis.length ? karistir(filtrelenmis) : [];
    }
    const karisik = karistir(kaynakNesne.items);
    if (boyut === 'tum') return karisik;
    return karisik.slice(0, Math.min(boyut, karisik.length));
  };

  const [sorular, setSorular] = useState(() => sorulariUret('tum'));

  const [indeks, setIndeks] = useState(0);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [hataSayisi, setHataSayisi] = useState(0);
  const [soruDeneme, setSoruDeneme] = useState(0);
  const [ipucuGoster, setIpucuGoster] = useState(false);
  const [puan, setPuan] = useState(0);
  const [bittimi, setBittimi] = useState(false);
  // Tablet modu: klavye sütunları yatay çevrilir (tablette eller ters tarafa denk gelir)
  const [tabletModu, setTabletModu] = useState(
    () => localStorage.getItem('tabletModu') === '1'
  );
  const tabletModuToggle = () => setTabletModu((v) => {
    const yeni = !v;
    localStorage.setItem('tabletModu', yeni ? '1' : '0');
    konus(yeni ? 'Tablet modu açık.' : 'Tablet modu kapalı.', { kesintiyle: true });
    return yeni;
  });
  // Doğru cevap seslendirmesi sırasında girişleri kilitle
  const kilitliRef = useRef(false);
  // Klavyeye yansıtmak için kilit durumunu state olarak da tut
  const [kilitli, setKilitli] = useState(false);
  const kilitle = (deger) => {
    kilitliRef.current = deger;
    setKilitli(deger);
  };
  const sonDotRef = useRef(null);
  // Klavyedeki "tıklı" görseli, bir sonraki soruya/hücreye geçince temizlenir.
  // Bu anahtar her geçişte artırılır.
  const [sifirlaAnahtari, setSifirlaAnahtari] = useState(0);
  const sonrakineGec = () => setSifirlaAnahtari((s) => s + 1);

  const aktif = sorular[indeks];
  const beklenenHucre = aktif ? aktif.hucreler[hucreIndeksi] : null;
  const cokHucreli = aktif ? aktif.hucreler.length > 1 : false;

  const yardimMetni = () => {
    if (!beklenenHucre) return '';
    const nk = beklenenHucre.join(', ');
    const tuslar = beklenenHucre.map((n) => NOKTA_TUS[n]).join(' ve ');
    const sira = cokHucreli
      ? `${HUCRE_SIRA_SOZ[hucreIndeksi] || (hucreIndeksi + 1) + '.'} hücre için `
      : '';
    return `${sira}${nk} numaralı noktalara, klavyede ${tuslar} tuşlarına ` +
           `aynı anda parmaklarınızla basıp birlikte bırakın.`;
  };

  const yonergeMetin = () => {
    if (!aktif) return '';
    const baslangic = `Soru ${indeks + 1}, ${aktif.ariaAd} yazın.`;
    if (cokHucreli) {
      const sira = HUCRE_SIRA_SOZ[hucreIndeksi] || `${hucreIndeksi + 1}.`;
      return `${baslangic} ${sira} hücreyle başlayın.`;
    }
    return baslangic;
  };

  // Sayfa yüklendiğinde / soru değiştiğinde yönerge oku.
  // Yönerge okunup bitene kadar giriş kilidini açma.
  useEffect(() => {
    if (bittimi) return;
    konus(yonergeMetin(), { onSon: () => kilitle(false) });
    const tekrar = () => konus(yonergeMetin(), { kesintiyle: true, onSon: () => kilitle(false) });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, hucreIndeksi, bittimi]);

  useEffect(() => () => konusmayiDurdur(), []);

  // Yeni hücre/soruya geçince ipucu / deneme sıfırla
  useEffect(() => {
    setSoruDeneme(0);
    setIpucuGoster(false);
  }, [indeks]);

  const sonrakiSoruyaGec = () => {
    // Tıklı görseli temizle (yeni soruya geçiş)
    sonrakineGec();
    // Tamamen rastgele bir öğe seç (aynı öğe tekrar gelebilir)
    const yeni = Math.floor(Math.random() * sorular.length);
    if (yeni === indeks) {
      // State değişmezse useEffect tetiklenmez — eski değerlerle yeniden başlat
      setHucreIndeksi(0);
      setSoruDeneme(0);
      setIpucuGoster(false);
      // Yönerge okunana kadar kilit açılmaz
      konus(yonergeMetin(), { kesintiyle: true, onSon: () => kilitle(false) });
    } else {
      setIndeks(yeni);
      setHucreIndeksi(0);
    }
  };

  const dogruCevabiAcikla = () => {
    kilitle(true);
    const noktaMetin = aktif.hucreler
      .map((h, i) =>
        (aktif.hucreler.length > 1
          ? `${HUCRE_SIRA_SOZ[i] || (i + 1) + '.'} hücre `
          : '') + h.join(', '))
      .join('; ');
    konus(`Doğru cevap: ${aktif.ariaAd}. Noktalar: ${noktaMetin}.`, {
      kesintiyle: true,
      onSon: () => setTimeout(() => {
        sonrakiSoruyaGec();
      }, 700)
    });
  };

  const onTiklaDogrula = (n, mevcutSira) => {
    if (!beklenenHucre) return true;
    const siradaki = beklenenHucre[mevcutSira.length];
    if (n !== siradaki) {
      konus(`${n} yanlış`, { kesintiyle: true });
      return false;
    }
    // Son nokta mı? onHucre ile birleştirilecek, şimdi söyleme
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
        // Soru tamamlandı — onSon ile geç, fallback güvencesi ekle.
        // Kilit, yeni sorunun yönergesi okunana kadar açılmaz.
        setPuan((p) => p + 1);
        let gecildi = false;
        const gecis = () => {
          if (gecildi) return;
          gecildi = true;
          sonrakiSoruyaGec();
        };
        konus(`${onayMetin}. ${aktif.ariaAd} doğru.`, {
          kesintiyle: true,
          onSon: () => setTimeout(gecis, 300)
        });
        setTimeout(gecis, 4000); // fallback
      } else {
        // Sonraki hücreye geç — önce ses, sonra state değiştir.
        // Tıklı görsel, yeni hücreye geçince temizlenir; kilit yönergeyle açılır.
        let gecildi = false;
        const gecis = () => {
          if (gecildi) return;
          gecildi = true;
          sonrakineGec();
          setHucreIndeksi((h) => h + 1);
        };
        konus(onayMetin, {
          kesintiyle: true,
          onSon: () => setTimeout(gecis, 200)
        });
        setTimeout(gecis, 2500); // fallback
      }
      return;
    }
    // Yanlış — yan etkileri updater dışında işle
    const yeniDeneme = soruDeneme + 1;
    setHataSayisi((h) => h + 1);
    setSoruDeneme(yeniDeneme);
    const yanlisMetin = `Yanlış. Bastığınız noktalar ${noktalar.join(', ') || 'yok'}.`;
    hataBildir(yanlisMetin);
  };

  const onBosluk = () => {
    // Karışık yazmada boşluk kullanılmaz; hatırlatma sesi
    if (kilitliRef.current) return;
    konus('Boşluk gerekmiyor.', { kesintiyle: true });
  };

  const onSil = () => {
    if (kilitliRef.current) return;
    if (hucreIndeksi > 0) {
      setHucreIndeksi((h) => h - 1);
      konus('önceki hücre', { kesintiyle: true });
    } else {
      konus('hücre yok', { kesintiyle: true });
    }
  };

  const yenidenBasla = (yeniBoyut) => {
    konusmayiDurdur();
    kilitle(false);
    sonrakineGec();
    const boyut = yeniBoyut || grupBoyu;
    if (yeniBoyut) setGrupBoyu(yeniBoyut);
    setSorular(sorulariUret(boyut));
    setIndeks(0);
    setHucreIndeksi(0);
    setHataSayisi(0);
    setSoruDeneme(0);
    setIpucuGoster(false);
    setPuan(0);
    setBittimi(false);
  };

  // Kayıtlılar modu seçiliyken liste boşsa uyarı göster
  if (grupBoyu === 'kayitlilar' && sorular.length === 0) {
    return (
      <div className="page yazma-page">
        <div className="yazma-bolum yazma-bolum-ust">
          <PageHeader baslik={kaynakNesne.baslik} />
          <div className="progress banner-grup-secim" role="group" aria-label="Soru sayısı">
            <button className="btn" type="button" onClick={() => yenidenBasla('tum')}>Tümü</button>
            <button type="button" className="btn aktif" aria-pressed={true}>Kayıtlılar</button>
            {[2, 3, 4].map((n) => (
              <button className="btn" key={n} type="button" onClick={() => yenidenBasla(n)}>{n + "'li"}</button>
            ))}
          </div>
        </div>
        <div className="yazma-bolum yazma-bolum-orta">
          <div className="instruction" style={{ textAlign: 'center', padding: '32px 16px' }}>
            Bu ders için "Sonra öğren" listenizde kayıtlı öğe bulunmuyor.
            <br /><br />
            <span style={{ color: 'var(--muted)', fontSize: '0.9em' }}>
              Dersi çalışırken yer imi butonuna basarak öğeleri kaydedebilirsiniz.
            </span>
          </div>
        </div>
        <div className="yazma-bolum yazma-bolum-alt">
          <div className="controls">
            <button className="btn" type="button" onClick={() => yenidenBasla('tum')}>Tüm Listeyi Çalış</button>
          </div>
        </div>
      </div>
    );
  }

  if (bittimi) {
    const yuzde = Math.round((puan / sorular.length) * 100);
    return (
      <div className="page yazma-page">
        <div className="yazma-bolum yazma-bolum-ust">
          <PageHeader baslik={kaynakNesne.baslik} />
        </div>
        <div className="yazma-bolum yazma-bolum-orta">
          <div className="yazma-metin" style={{ textAlign: 'center' }}>
            <h2>Karışık yazma tamamlandı</h2>
            <p style={{ fontSize: '1.4em' }}>
              {sorular.length} soruda <b>{puan}</b> doğru &nbsp;•&nbsp; %{yuzde} başarı
            </p>
            {hataSayisi > 0 && (
              <p style={{ color: 'var(--muted)' }}>
                Toplam yanlış deneme: {hataSayisi}
              </p>
            )}
          </div>
        </div>
        <div className="yazma-bolum yazma-bolum-alt">
          <div className="controls">
            <button className="btn" type="button" onClick={() => yenidenBasla()}>Tekrar Başla</button>
            <button className="btn" type="button" onClick={() => navigate(-1)}>Derse Dön</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page yazma-page">
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik={kaynakNesne.baslik} />
        <div className="progress banner-grup-secim" role="group" aria-label="Soru sayısı">
          <button
            type="button"
            className={`btn ${grupBoyu === 'tum' ? 'aktif' : ''}`}
            aria-pressed={grupBoyu === 'tum'}
            onClick={() => yenidenBasla('tum')}
            title="Tüm derste karışık yazma"
          >Tümü</button>
          <button
            type="button"
            className={`btn ${grupBoyu === 'kayitlilar' ? 'aktif' : ''}`}
            aria-pressed={grupBoyu === 'kayitlilar'}
            onClick={() => yenidenBasla('kayitlilar')}
            title="Sonra öğren listesindeki öğeler"
          >Kayıtlılar</button>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              className={`btn ${grupBoyu === n ? 'aktif' : ''}`}
              aria-pressed={grupBoyu === n}
              onClick={() => yenidenBasla(n)}
              title={`Rastgele ${n} öğe ile karışık yazma`}
            >{n + "'li"}</button>
          ))}
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div
          className="yazma-metin"
          aria-label={`Yazılacak: ${aktif.ariaAd}`}
          style={{
            textAlign: 'center',
            fontSize: 'clamp(1.6em, 7vh, 3em)',
            lineHeight: 1,
            padding: '4px 8px',
            margin: 0
          }}
        >
          {aktif.etiket}
        </div>
        {cokHucreli && (
          <div style={{
            textAlign: 'center', color: 'var(--muted)',
            fontSize: '1.05em'
          }}>
            {HUCRE_ETIKET[hucreIndeksi] || (hucreIndeksi + 1) + '.'} hücreyi yazın
            ({aktif.hucreler.length} hücreli)
          </div>
        )}
        {ipucuGoster && (
          <div className="yazma-ipucu" role="status" aria-live="polite">
            <b>Yardım:</b> {yardimMetni()}
          </div>
        )}
        {/* Dikeyde inline klavye */}
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
          <button className="btn" type="button" onClick={() => yenidenBasla()}>Yeniden Karıştır</button>
          <button className="btn" type="button" onClick={() => {
            // Kullanıcı bu soruyu pas geçmek isterse: doğru cevabı seslendir,
            // ardından sıradaki soruya geç.
            if (kilitliRef.current) return;
            dogruCevabiAcikla();
          }}>Cevabı Söyle</button>
          <button
            type="button"
            className={`btn ${tabletModu ? 'aktif' : ''}`}
            aria-pressed={tabletModu}
            onClick={tabletModuToggle}
            title="Tablette yazarken sol/sağ noktaları çevir"
          >Tablet Modu</button>
        </div>
      </div>

      {/* Yatayda popup klavye */}
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
