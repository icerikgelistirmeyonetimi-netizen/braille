import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import BrailleKlavye from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur, basariBildir, hataBildir } from '../utils/ses.js';
import { kaynagiAl } from '../utils/karisikYazmaKaynaklari.js';

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
          <button type="button" onClick={() => navigate('/')}>Ana Menü</button>
        </div>
      </div>
    );
  }

  // Soru sayısı seçimi: 'tum' = tüm dersi karışık, ya da 2/3/4 öğe
  const [grupBoyu, setGrupBoyu] = useState('tum');

  // Kaynağı karıştır ve istenen kadar al
  const sorulariUret = (boyut) => {
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
  // Doğru cevap seslendirmesi sırasında girişleri kilitle
  const kilitliRef = useRef(false);

  const aktif = sorular[indeks];
  const beklenenHucre = aktif ? aktif.hucreler[hucreIndeksi] : null;
  const cokHucreli = aktif ? aktif.hucreler.length > 1 : false;

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

  const yonergeMetin = () => {
    if (!aktif) return '';
    const baslangic = `Soru ${indeks + 1} / ${sorular.length}. ${aktif.ariaAd} yazın.`;
    if (cokHucreli) {
      const sira = HUCRE_ETIKET[hucreIndeksi] || (hucreIndeksi + 1) + '.';
      return `${baslangic} ${sira} hücreyle başlayın.`;
    }
    return baslangic;
  };

  // Sayfa yüklendiğinde / soru değiştiğinde yönerge oku
  useEffect(() => {
    if (bittimi) return;
    konus(yonergeMetin());
    const tekrar = () => konus(yonergeMetin(), { kesintiyle: true });
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
    // Tamamen rastgele bir öğe seç (aynı öğe tekrar gelebilir)
    const yeni = Math.floor(Math.random() * sorular.length);
    if (yeni === indeks) {
      // State değişmezse useEffect tetiklenmez — eski değerlerle yeniden başlat
      setHucreIndeksi(0);
      setSoruDeneme(0);
      setIpucuGoster(false);
      konus(yonergeMetin(), { kesintiyle: true });
    } else {
      setIndeks(yeni);
      setHucreIndeksi(0);
    }
  };

  const dogruCevabiAcikla = () => {
    kilitliRef.current = true;
    const noktaMetin = aktif.hucreler
      .map((h, i) =>
        (aktif.hucreler.length > 1
          ? `${HUCRE_ETIKET[i] || (i + 1) + '.'} hücre `
          : '') + h.join(', '))
      .join('; ');
    konus(`Doğru cevap: ${aktif.ariaAd}. Noktalar: ${noktaMetin}.`, {
      kesintiyle: true,
      onSon: () => setTimeout(() => {
        kilitliRef.current = false;
        sonrakiSoruyaGec();
      }, 700)
    });
  };

  const onHucre = (noktalar) => {
    if (kilitliRef.current || bittimi || !aktif) return;
    if (noktaEsit(noktalar, beklenenHucre)) {
      // Doğru hücre — aynı frame içinde 2. tetiklemeyi engellemek için kilitle
      kilitliRef.current = true;
      konus(noktalar.join(', '), { kesintiyle: true });
      if (hucreIndeksi + 1 >= aktif.hucreler.length) {
        // Soru tamamlandı
        setPuan((p) => p + 1);
        konus(`${aktif.ariaAd} doğru.`, {
          kesintiyle: true,
          onSon: () => setTimeout(() => {
            kilitliRef.current = false;
            sonrakiSoruyaGec();
          }, 400)
        });
      } else {
        setHucreIndeksi((h) => h + 1);
        // Kısa süre sonra kilidi aç (aynı olay tekrar işlenmesin)
        setTimeout(() => { kilitliRef.current = false; }, 250);
      }
      return;
    }
    // Yanlış — yan etkileri updater dışında işle
    const yeniDeneme = soruDeneme + 1;
    setHataSayisi((h) => h + 1);
    setSoruDeneme(yeniDeneme);
    if (yeniDeneme >= 3) {
      dogruCevabiAcikla();
    } else if (yeniDeneme === 2 && !ipucuGoster) {
      setIpucuGoster(true);
      kilitliRef.current = true;
      konus(`Yanlış. Yardım: ${yardimMetni()}`, {
        kesintiyle: true,
        onSon: () => { kilitliRef.current = false; }
      });
    } else {
      hataBildir(
        `Yanlış. Bastığınız noktalar ${noktalar.join(', ') || 'yok'}.`
      );
    }
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
    kilitliRef.current = false;
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
            <button type="button" onClick={() => yenidenBasla()}>Tekrar Başla</button>
            <button type="button" onClick={() => navigate(-1)}>Derse Dön</button>
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
            className={grupBoyu === 'tum' ? 'aktif' : ''}
            aria-pressed={grupBoyu === 'tum'}
            onClick={() => yenidenBasla('tum')}
            title="Tüm derste karışık yazma"
          >Tümü</button>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              className={grupBoyu === n ? 'aktif' : ''}
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
        <div role="status" aria-live="polite" className="sr-only">
          {yonergeMetin()}
        </div>
        {/* Dikeyde inline klavye */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            vurguNoktalar={ipucuGoster ? beklenenHucre || [] : []}
            klavyeIpucu={ipucuGoster}
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button type="button" onClick={() => yenidenBasla()}>Yeniden Karıştır</button>
          <button type="button" onClick={() => {
            // Kullanıcı bu soruyu pas geçmek isterse: doğru cevabı seslendir,
            // ardından sıradaki soruya geç.
            if (kilitliRef.current) return;
            dogruCevabiAcikla();
          }}>Cevabı Söyle</button>
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
        />
      </div>
    </div>
  );
}
