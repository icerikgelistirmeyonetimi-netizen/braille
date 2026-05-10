import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import {
  buyukHarfIsaretiMi,
  hucreleriMetneCevirKisaltmali,
  noktalariAnahtara,
  sayiIsaretiMi,
} from '../utils/brailleCevir.js';
import { birHarfAra, kokIsaretiMi, ikiHarfBirinciMi, parcaBirinciMi } from '../utils/kisaltmaCevir.js';
import { NOKTALAMA, OZEL_ISARETLER } from '../data/braille.js';

const isaretAdiniOku = (ad) => ad.replace(/\s*\([^)]*\)\s*/g, ' ').trim().toLocaleLowerCase('tr');

const NOKTALAMA_ANONSLARI = new Map(
  NOKTALAMA.map((isaret) => [noktalariAnahtara(isaret.noktalar), isaret.isim])
);

const TEK_HUCRE_OZEL_ANONSLARI = new Map(
  OZEL_ISARETLER
    .filter((isaret) => isaret.hucreler?.length === 1)
    .map((isaret) => [noktalariAnahtara(isaret.hucreler[0]), isaretAdiniOku(isaret.ad)])
);

const COK_HUCRE_OZEL_ANONSLARI = OZEL_ISARETLER
  .filter((isaret) => isaret.hucreler?.length > 1)
  .map((isaret) => ({
    ad: isaretAdiniOku(isaret.ad),
    anahtarlar: isaret.hucreler.map((hucre) => noktalariAnahtara(hucre)),
  }))
  .sort((a, b) => b.anahtarlar.length - a.anahtarlar.length);

// Serbest yazma: kullanıcı istediğini yazar; her karakter anında seslendirilir.
// Kısaltma modunda hece, bir harfli, iki harfli, kök ve parça kısaltmaları da tanınır.
export default function YazmaSerbest() {
  const [metin, setMetin] = useState('');
  const [aktifGorunum, setAktifGorunum] = useState('metin');
  const [brailleHucreleri, setBrailleHucreleri] = useState([]);
  const durumRef = useRef(yeniYazmaDurumu());
  const kisaltmaHucreleriRef = useRef([]);
  const kisaltmaBasMetinRef = useRef('');

  // Kısaltma modu: localStorage'a kaydedilir
  const [kisaltmaModu, setKisaltmaModu] = useState(
    () => localStorage.getItem('serbestKisaltmaModu') === '1'
  );
  const [bekleyenGoster, setBekleyenGoster] = useState(false);

  // Hangi kısaltma sistemleri aktif (localStorage'a kaydedilir)
  const SISTEM_VARSAYILAN = { hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true };
  const [kisaltmaSistemler, setKisaltmaSistemler] = useState(() => {
    const saved = localStorage.getItem('serbestKisaltmaSistemler');
    if (!saved) return { ...SISTEM_VARSAYILAN };
    try { return { ...SISTEM_VARSAYILAN, ...JSON.parse(saved) }; } catch { return { ...SISTEM_VARSAYILAN }; }
  });
  const [sistemPaneli, setSistemPaneli] = useState(false);
  const sistemPaneliRef = useRef(null);
  const gorunumPanelStyle = { width: '100%', maxWidth: 'none', alignSelf: 'stretch' };

  const sistemToggle = (key) => setKisaltmaSistemler((prev) => {
    const yeni = { ...prev, [key]: !prev[key] };
    localStorage.setItem('serbestKisaltmaSistemler', JSON.stringify(yeni));
    return yeni;
  });

  const sonHucreBekliyorMu = (hucreler, sistemler) => {
    const son = hucreler[hucreler.length - 1];
    if (!son || son.length === 0) return false;
    return (
      (sistemler.kok && kokIsaretiMi(son)) ||
      (sistemler.ikiHarf && ikiHarfBirinciMi(son)) ||
      (sistemler.parca && parcaBirinciMi(son))
    );
  };

  const kisaltmaIsaretiAnonsu = (noktalar, hucreler = kisaltmaHucreleriRef.current, kisaltmali = kisaltmaModu) => {
    const anahtar = noktalariAnahtara(noktalar);
    if (anahtar === '5') return 'kelime kökü kısaltma işareti';
    if (anahtar === '4,5' || anahtar === '5,6') return 'kelime parçası kısaltma işareti';
    if (kisaltmali && anahtar === '3' && hucreler.length >= 2) {
      const onceki = hucreler[hucreler.length - 2];
      if (onceki && birHarfAra(onceki)) return 'kısaltma ek ayırma işareti';
    }
    if (kisaltmali && ikiHarfBirinciMi(noktalar)) return 'iki harfli kısaltma başlangıcı';
    return null;
  };

  const cokHucreliOzelAnonsu = (hucreler) => {
    for (const isaret of COK_HUCRE_OZEL_ANONSLARI) {
      if (hucreler.length < isaret.anahtarlar.length) continue;
      const sonHucreler = hucreler.slice(-isaret.anahtarlar.length);
      const eslesti = sonHucreler.every(
        (hucre, index) => noktalariAnahtara(hucre) === isaret.anahtarlar[index]
      );
      if (eslesti) return isaret.ad;
    }
    return null;
  };

  const hucreAnlamAnonsu = (noktalar, hucreler = kisaltmaHucreleriRef.current, kisaltmali = kisaltmaModu) => {
    const cokHucreliAnons = cokHucreliOzelAnonsu(hucreler);
    if (cokHucreliAnons) return cokHucreliAnons;
    const kisaltmaAnonsu = kisaltmaIsaretiAnonsu(noktalar, hucreler, kisaltmali);
    if (kisaltmaAnonsu) return kisaltmaAnonsu;
    if (sayiIsaretiMi(noktalar)) return 'sayı işareti';
    if (buyukHarfIsaretiMi(noktalar)) return 'büyük harf işareti';
    const anahtar = noktalariAnahtara(noktalar);
    return NOKTALAMA_ANONSLARI.get(anahtar) || TEK_HUCRE_OZEL_ANONSLARI.get(anahtar) || null;
  };

  const kisaltmaMetniniGuncelle = (hucreler = kisaltmaHucreleriRef.current, sistemler = kisaltmaSistemler) => {
    const cozum = hucreleriMetneCevirKisaltmali(hucreler, sistemler, { sonTekHarfBeklet: true });
    const yeniMetin = kisaltmaBasMetinRef.current + cozum;
    setMetin(yeniMetin);
    setBekleyenGoster(sonHucreBekliyorMu(hucreler, sistemler));
    return { cozum, yeniMetin };
  };

  const sinirdaKisaltmaAnonsu = (hucreler = kisaltmaHucreleriRef.current) => {
    if (!kisaltmaSistemler.birHarf) return null;
    const sonBosluk = hucreler.map((hucre) => hucre.length === 0).lastIndexOf(true);
    const sonKelimeHucreleri = hucreler.slice(sonBosluk + 1).filter((hucre) => hucre.length > 0);
    if (sonKelimeHucreleri.length !== 1) return null;
    const kelime = birHarfAra(sonKelimeHucreleri[0]);
    return kelime ? `${kelime} kelimesi kısaltma olarak algılandı.` : null;
  };

  useEffect(() => {
    if (!kisaltmaModu) return;
    kisaltmaMetniniGuncelle(kisaltmaHucreleriRef.current, kisaltmaSistemler);
  }, [kisaltmaSistemler, kisaltmaModu]);

  // Panel dışına tıklandığında kapat
  useEffect(() => {
    if (!sistemPaneli) return;
    const handle = (e) => {
      if (sistemPaneliRef.current && !sistemPaneliRef.current.contains(e.target))
        setSistemPaneli(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [sistemPaneli]);

  const kisaltmaModuToggle = () => {
    const yeni = !kisaltmaModu;
    localStorage.setItem('serbestKisaltmaModu', yeni ? '1' : '0');
    konus(yeni ? 'Kısaltma modu açık.' : 'Kısaltma modu kapalı.', { kesintiyle: true });
    kisaltmaHucreleriRef.current = [];
    kisaltmaBasMetinRef.current = yeni ? metin : '';
    durumRef.current = yeniYazmaDurumu();
    setBekleyenGoster(false);
    setKisaltmaModu(yeni);
  };

  // Normal (kısaltmasız) hücre işleme
  const normalIsle = (noktalar) => {
    const anlamAnonsu = hucreAnlamAnonsu(noktalar, [noktalar], false);
    const r = hucreyiIsle(durumRef.current, noktalar);
    if (r.tip === 'isaret') {
      konus(anlamAnonsu || r.anons, { kesintiyle: true });
      return;
    }
    if (r.tip === 'bilinmeyen' || r.deger === null) {
      konus(anlamAnonsu || 'tanımsız hücre', { kesintiyle: true });
      return;
    }
    setMetin((m) => m + r.deger);
    konus(anlamAnonsu || r.anons, { kesintiyle: true });
  };

  useEffect(() => {
    konus(
      'Serbest yazma. İstediğiniz harfleri yazabilirsiniz. ' +
      'Bir harfi yazmak için, o harfin nokta düğmelerine ' +
      'aynı anda parmaklarınızla basıp birlikte bırakın. ' +
      'Her hücre okunacaktır. Tüm metni dinlemek için Onay düğmesine basın. ' +
      'Boşluk için Boşluk, silmek için Sil düğmesini kullanın.'
    );
    const tekrar = () => konus(
      'Serbest yazma modu. Bir harfin tüm noktalarına aynı anda basıp birlikte bırakın. ' +
      'Onay düğmesi tüm metni okur.',
      { kesintiyle: true }
    );
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      konusmayiDurdur();
    };
  }, []);

  const onHucre = (noktalar) => {
    setBrailleHucreleri((hucreler) => [...hucreler, noktalar]);
    if (kisaltmaModu) {
      const hucreler = [...kisaltmaHucreleriRef.current, noktalar];
      kisaltmaHucreleriRef.current = hucreler;
      const { cozum } = kisaltmaMetniniGuncelle(hucreler);
      const anlamAnonsu = hucreAnlamAnonsu(noktalar, hucreler, true);
      if (sonHucreBekliyorMu(hucreler, kisaltmaSistemler)) {
        konus(anlamAnonsu || 'ikinci hücreyi bekliyor', { kesintiyle: true });
      } else if (anlamAnonsu) {
        konus(anlamAnonsu, { kesintiyle: true });
      } else {
        const sonKelime = cozum.trim().split(/\s+/).filter(Boolean).at(-1);
        konus(sonKelime || 'hücre işlendi', { kesintiyle: true });
      }
      return;
    }

    // Normal mod
    normalIsle(noktalar);
  };

  const onBosluk = () => {
    setBrailleHucreleri((hucreler) => [...hucreler, []]);
    if (kisaltmaModu) {
      const kisaltmaAnonsu = sinirdaKisaltmaAnonsu(kisaltmaHucreleriRef.current);
      const hucreler = [...kisaltmaHucreleriRef.current, []];
      kisaltmaHucreleriRef.current = hucreler;
      kisaltmaMetniniGuncelle(hucreler);
      konus(kisaltmaAnonsu || 'boşluk', { kesintiyle: true });
      return;
    }
    setMetin((m) => m + ' ');
    konus('boşluk', { kesintiyle: true });
  };

  const onSil = () => {
    setBrailleHucreleri((hucreler) => hucreler.slice(0, -1));
    if (kisaltmaModu) {
      if (kisaltmaHucreleriRef.current.length > 0) {
        const hucreler = kisaltmaHucreleriRef.current.slice(0, -1);
        kisaltmaHucreleriRef.current = hucreler;
        kisaltmaMetniniGuncelle(hucreler);
        konus('silindi', { kesintiyle: true });
        return;
      }
      if (kisaltmaBasMetinRef.current.length > 0) {
        kisaltmaBasMetinRef.current = kisaltmaBasMetinRef.current.slice(0, -1);
        setMetin(kisaltmaBasMetinRef.current);
        konus('silindi', { kesintiyle: true });
        return;
      }
      konus('metin boş', { kesintiyle: true });
      return;
    }
    setMetin((m) => {
      if (m.length === 0) {
        konus('metin boş', { kesintiyle: true });
        return m;
      }
      konus('silindi', { kesintiyle: true });
      return m.slice(0, -1);
    });
  };

  const tumunuOku = () => {
    if (metin.trim().length === 0) {
      konus('Henüz hiçbir şey yazmadınız.', { kesintiyle: true });
      return;
    }
    konus(metin, { kesintiyle: true });
  };

  const temizle = () => {
    setMetin('');
    setBrailleHucreleri([]);
    durumRef.current = yeniYazmaDurumu();
    kisaltmaHucreleriRef.current = [];
    kisaltmaBasMetinRef.current = '';
    setBekleyenGoster(false);
    konus('Metin temizlendi.', { kesintiyle: true });
  };

  return (
    <div className="page yazma-page serbest-yazma-page">
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Serbest Yazma" />
        <div className="progress" aria-hidden="true">
          {metin.length} karakter
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div className="yazma-gorunum-panel" style={gorunumPanelStyle}>
          <div className="belge-tab-bar yazma-tab-bar" role="tablist" aria-label="Yazma görünümü">
            <button
              type="button"
              role="tab"
              aria-selected={aktifGorunum === 'metin'}
              className={'belge-tab' + (aktifGorunum === 'metin' ? ' aktif' : '')}
              onClick={() => setAktifGorunum('metin')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/>
              </svg>
              Metin
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aktifGorunum === 'braille'}
              className={'belge-tab' + (aktifGorunum === 'braille' ? ' aktif' : '')}
              onClick={() => setAktifGorunum('braille')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="15" height="15" aria-hidden="true">
                <circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>
                <circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
              </svg>
              Braille
            </button>
          </div>

          {aktifGorunum === 'metin' ? (
            <div
              className="yazma-metin yazma-serbest-cikti"
              aria-live="polite"
              aria-label={`Yazılan metin: ${metin || 'boş'}`}
            >
              {metin || <span className="kalan">(yazmaya başlayın)</span>}
              {bekleyenGoster && <span className="kisaltma-bekleyen">&#8230;</span>}
            </div>
          ) : (
            <div
              className="yazma-braille-gorunum"
              aria-live="polite"
              aria-label="Yazılan braille hücreleri"
            >
              {brailleHucreleri.length === 0 ? (
                <span className="kalan">(braille hücresi yok)</span>
              ) : brailleHucreleri.map((hucre, index) => (
                hucre.length === 0 ? (
                  <span key={index} className="yazma-braille-bosluk" aria-label="boşluk">boşluk</span>
                ) : (
                  <BrailleCell
                    key={index}
                    aktifNoktalar={hucre}
                    baslik={noktalariAnahtara(hucre).replace(/,/g, '')}
                    baslikAriaLabel={`Hücre ${index + 1}, nokta ${hucre.join(' ')}`}
                    tiklanabilir={false}
                    kesfedilebilir={false}
                  />
                )
              ))}
            </div>
          )}
        </div>

        {/* Dikeyde klavye burada inline; yatayda CSS ile gizlenir */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={tumunuOku}
            siralikTiklama
            aksiyonOncesiTiklamayiCommitEt
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button type="button" onClick={tumunuOku}>Tümünü Oku</button>
          <button type="button" onClick={temizle}>Temizle</button>
          <div className="kisaltma-btn-grup" ref={sistemPaneliRef}>
            <button
              type="button"
              className={kisaltmaModu ? 'aktif' : ''}
              aria-pressed={kisaltmaModu}
              onClick={kisaltmaModuToggle}
              title="Kısaltmaları tanı ve kısaltma kullanarak yaz"
            >Kısaltma</button>
            <button
              type="button"
              className={'kisaltma-sistem-acilis-btn' + (kisaltmaModu && sistemPaneli ? ' aktif' : '') + (kisaltmaModu ? '' : ' disabled')}
              onClick={() => kisaltmaModu && setSistemPaneli((v) => !v)}
              title="Hangi kısaltma sistemleri aktif?"
              aria-expanded={sistemPaneli}
              aria-label="Kısaltma sistemleri"
            >▾</button>
            {kisaltmaModu && sistemPaneli && (
              <div className="kisaltma-sistem-panel" role="menu">
                <p className="kisaltma-sistem-panel-baslik">Kısaltma Sistemleri</p>
                {[
                  { key: 'hece',     label: 'Hece Kısaltmaları' },
                  { key: 'birHarf',  label: 'Bir Harfli Kısaltmalar' },
                  { key: 'ikiHarf',  label: 'İki Harfli Kısaltmalar' },
                  { key: 'kok',      label: 'Kelime Kökü Kısaltmaları' },
                  { key: 'parca',    label: 'Kelime Parçası Kısaltmaları' },
                ].map(({ key, label }) => (
                  <label key={key} className="kisaltma-sistem-satir">
                    <input
                      type="checkbox"
                      checked={kisaltmaSistemler[key]}
                      onChange={() => sistemToggle(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yatayda tam ekran şeffaf popup klavye */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={tumunuOku}
          anindaDokunma
        />
      </div>
    </div>
  );
}
