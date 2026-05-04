import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import TanitimTuru, { turuSifirla } from '../components/TanitimTuru.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import {
  ayarlariAl,
  ayarGuncelle,
  ayarlariSifirla
} from '../utils/ayarlar.js';
import { tumIlerlemeyiAl, tumIlerlemeyiSifirla } from '../utils/ilerleme.js';
import { konus } from '../utils/ses.js';
import {
  durumuAl as arduinoDurumuAl,
  durumuDinle as arduinoDurumuDinle,
  seriBaglan,
  bleBaglan,
  baglantiyiKes as arduinoKes,
  deseniGonder,
  webSerialDestekleniyorMu,
  webBluetoothDestekleniyorMu
} from '../utils/arduino.js';

export default function Ayarlar() {
  const [a, setA] = useState(ayarlariAl());
  const [ilerleme, setIlerleme] = useState(tumIlerlemeyiAl());
  const [turAcik, setTurAcik] = useState(false);
  const [arduino, setArduino] = useState(arduinoDurumuAl());
  const [arduinoHata, setArduinoHata] = useState('');

  useEffect(() => {
    konus('Ayarlar sayfası.');
    const tekrar = () => konus('Ayarlar sayfası.', { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    const cikis = arduinoDurumuDinle(setArduino);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      cikis();
    };
  }, []);

  const arduinoSeriBaglan = async () => {
    setArduinoHata('');
    try {
      await seriBaglan();
      konus('Arduino bağlandı.');
    } catch (e) {
      setArduinoHata(e && e.message ? e.message : 'Bağlantı başarısız.');
    }
  };
  const arduinoBleBaglan = async () => {
    setArduinoHata('');
    try {
      await bleBaglan();
      konus('Arduino Bluetooth ile bağlandı.');
    } catch (e) {
      setArduinoHata(e && e.message ? e.message : 'Bağlantı başarısız.');
    }
  };
  const arduinoBaglantiyiKes = async () => {
    await arduinoKes();
    konus('Arduino bağlantısı kesildi.');
  };
  const arduinoTest = async () => {
    // 1, 2, 3, 4, 5, 6 noktalarını sırayla kaldır
    for (let n = 1; n <= 6; n++) {
      await deseniGonder([n]);
      await new Promise((r) => setTimeout(r, 500));
    }
    await deseniGonder([1, 2, 3, 4, 5, 6]);
    await new Promise((r) => setTimeout(r, 600));
    await deseniGonder([]);
  };

  const guncelle = (yama) => {
    ayarGuncelle(yama);
    setA(ayarlariAl());
  };

  return (
    <div className="page">
      {turAcik && <TanitimTuru zorunlu={false} onKapat={() => setTurAcik(false)} />}
      <PageHeader baslik="Ayarlar" />

      <div style={{ overflowY: 'auto', minHeight: 0, paddingRight: 6 }}>
        <section>
        <h2>Sesli Yönerge</h2>

        <label style={{ display: 'block', marginTop: 12 }}>
          <input
            type="checkbox"
            checked={a.sesAcik}
            onChange={(e) => guncelle({ sesAcik: e.target.checked })}
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          Sesli yönerge açık
        </label>

        <label style={{ display: 'block', marginTop: 16 }}>
          Konuşma hızı: <strong>{a.konusmaHizi.toFixed(2)}x</strong>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={a.konusmaHizi}
            onChange={(e) => guncelle({ konusmaHizi: parseFloat(e.target.value) })}
            style={{ width: '100%', marginTop: 8 }}
            aria-label="Konuşma hızı"
          />
        </label>

        <button
          type="button"
          onClick={() => konus('Bu, mevcut hızda örnek bir Türkçe konuşmadır.')}
          style={{ marginTop: 8 }}
        >
          Sesi Dene
        </button>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Görünüm</h2>

        <fieldset style={{ border: 'none', padding: 0, margin: '12px 0' }}>
          <legend style={{ fontWeight: 700, marginBottom: 8 }}>Görünüm Modu</legend>
          <label style={{ marginRight: 18 }}>
            <input
              type="radio"
              name="tema"
              value="normal"
              checked={a.tema === 'normal'}
              onChange={() => guncelle({ tema: 'normal' })}
              style={{ width: 22, height: 22, marginRight: 6 }}
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              name="tema"
              value="lowVision"
              checked={a.tema === 'lowVision'}
              onChange={() => guncelle({ tema: 'lowVision' })}
              style={{ width: 22, height: 22, marginRight: 6 }}
            />
            Az Görenler İçin (yüksek kontrast)
          </label>
        </fieldset>

        <label style={{ display: 'block', marginTop: 12 }}>
          Yazı boyutu: <strong>{a.yaziBoyutu}px</strong>
          <input
            type="range"
            min="16"
            max="32"
            step="1"
            value={a.yaziBoyutu}
            onChange={(e) => guncelle({ yaziBoyutu: parseInt(e.target.value, 10) })}
            style={{ width: '100%', marginTop: 8 }}
            aria-label="Yazı boyutu"
          />
        </label>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Geri Bildirim</h2>
        <label style={{ display: 'block', marginTop: 12 }}>
          <input
            type="checkbox"
            checked={a.titresimAcik}
            onChange={(e) => guncelle({ titresimAcik: e.target.checked })}
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          Titreşim (mobil cihazlarda) açık
        </label>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>İlerleme</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>Harfler: {(ilerleme.harfler || []).length} öğrenildi</li>
          <li>Rakamlar: {(ilerleme.rakamlar || []).length} öğrenildi</li>
          <li>Noktalama: {(ilerleme.noktalama || []).length} öğrenildi</li>
        </ul>
        <button
          type="button"
          onClick={() => {
            if (confirm('Tüm ilerleme silinsin mi?')) {
              tumIlerlemeyiSifirla();
              setIlerleme({});
              konus('İlerleme sıfırlandı.');
            }
          }}
        >
          İlerlemeyi Sıfırla
        </button>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Arduino (Fiziksel Hücre)</h2>
        <p style={{ marginTop: 4 }}>
          Cihaz bağlıyken ekrandaki braille deseni Arduino üzerindeki 6 noktayı da kaldırır;
          öğrenci dokunarak hissedebilir.
        </p>
        <div
          role="status"
          aria-live="polite"
          style={{ marginTop: 8, fontWeight: 700 }}
        >
          Durum:{' '}
          {arduino.bagli
            ? `Bağlı (${arduino.tasiyici === 'serial' ? 'USB' : 'Bluetooth'})`
            : 'Bağlı değil'}
        </div>
        {arduinoHata && (
          <div role="alert" style={{ color: '#c0392b', marginTop: 8 }}>
            {arduinoHata}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {!arduino.bagli && webSerialDestekleniyorMu() && (
            <button type="button" onClick={arduinoSeriBaglan}>
              USB ile Bağlan
            </button>
          )}
          {!arduino.bagli && webBluetoothDestekleniyorMu() && (
            <button type="button" onClick={arduinoBleBaglan}>
              Bluetooth ile Bağlan
            </button>
          )}
          {arduino.bagli && (
            <>
              <button type="button" onClick={arduinoTest}>
                Test Et (1–6 noktaları)
              </button>
              <button type="button" onClick={arduinoBaglantiyiKes}>
                Bağlantıyı Kes
              </button>
            </>
          )}
          {!arduino.bagli &&
            !webSerialDestekleniyorMu() &&
            !webBluetoothDestekleniyorMu() && (
              <div style={{ color: '#666' }}>
                Bu tarayıcı/cihaz Web Serial veya Web Bluetooth desteklemiyor.
                Masaüstünde Chrome/Edge, telefonda Chrome (Android) kullanın.
              </div>
            )}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Tanıtım Turu</h2>
        <button
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => { turuSifirla(); setTurAcik(true); }}
          aria-label="Tanıtım turunu yeniden göster"
        >
          Tanıtım Turunu Tekrar Göster
        </button>
      </section>

      <section style={{ marginTop: 28 }}>
        <button
          type="button"
          onClick={() => {
            ayarlariSifirla();
            setA(ayarlariAl());
            konus('Ayarlar varsayılana döndü.');
          }}
        >
          Ayarları Varsayılana Döndür
        </button>
      </section>
      </div>
    </div>
  );
}
