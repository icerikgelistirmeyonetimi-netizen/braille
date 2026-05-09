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
import { MODULLER } from '../data/moduller.jsx';

export default function Ayarlar() {
  const [a, setA] = useState(ayarlariAl());
  const [ilerleme, setIlerleme] = useState(tumIlerlemeyiAl());
  const [turAcik, setTurAcik] = useState(false);
  const [arduino, setArduino] = useState(arduinoDurumuAl());
  const [arduinoHata, setArduinoHata] = useState('');
  const [aktifSekme, setAktifSekme] = useState('ayarlar');

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

  const sekmeBtnStyle = (sekme) => ({
    padding: '8px 20px',
    fontWeight: 700,
    fontSize: '1em',
    border: 'none',
    borderBottom: aktifSekme === sekme ? '3px solid var(--renk-vurgu, #5465ff)' : '3px solid transparent',
    background: 'none',
    color: aktifSekme === sekme ? 'var(--renk-vurgu, #5465ff)' : 'inherit',
    cursor: 'pointer',
    borderRadius: 0,
  });

  const kartStil = {
    background: 'var(--renk-kart-bg, #fff)',
    border: '1px solid var(--renk-kenar, #e8eaf0)',
    borderRadius: 14,
    padding: '16px 18px',
    marginBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  };
  const kartBaslikStil = {
    display: 'flex', alignItems: 'center', gap: 8,
    fontWeight: 800, fontSize: '1em',
    color: 'var(--renk-vurgu, #5465ff)',
  };
  const satirStil = {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  };
  const aciklamaStil = { fontSize: '0.82em', color: '#888', marginTop: 2 };
  const rozetStil = {
    background: 'var(--renk-vurgu-acik, #eef2ff)',
    color: 'var(--renk-vurgu, #5465ff)',
    fontWeight: 700, fontSize: '0.85em',
    padding: '2px 10px', borderRadius: 20,
  };
  const toggleKapStil = { position: 'relative', flexShrink: 0, cursor: 'pointer' };
  const toggleTrackStil = {
    position: 'relative', display: 'block', width: 46, height: 26, borderRadius: 13,
    transition: 'background .2s',
  };
  const toggleThumbStil = {
    position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.25)',
    transition: 'transform .2s',
  };
  const ikincilButonStil = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 8, border: '1.5px solid var(--renk-kenar, #ddd)',
    background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9em',
    color: 'var(--renk-metin, #333)',
  };

  return (
    <div className="page">
      {turAcik && <TanitimTuru zorunlu={false} onKapat={() => setTurAcik(false)} />}
      <PageHeader baslik="Ayarlar" />

      {/* ── Sekme çubuğu ── */}
      <div
        role="tablist"
        aria-label="Ayarlar sekmeleri"
        onKeyDown={(e) => {
          const list = ['ayarlar', 'moduller'];
          const idx = list.indexOf(aktifSekme);
          if (e.key === 'ArrowRight') { e.preventDefault(); setAktifSekme(list[(idx + 1) % list.length]); }
          if (e.key === 'ArrowLeft')  { e.preventDefault(); setAktifSekme(list[(idx - 1 + list.length) % list.length]); }
        }}
        style={{ display: 'flex', borderBottom: '1px solid var(--renk-kenar, #ddd)', marginBottom: 8, flexShrink: 0 }}
      >
        <button
          role="tab"
          id="tab-ayarlar"
          aria-selected={aktifSekme === 'ayarlar'}
          aria-controls="panel-ayarlar"
          tabIndex={aktifSekme === 'ayarlar' ? 0 : -1}
          style={sekmeBtnStyle('ayarlar')}
          onClick={() => setAktifSekme('ayarlar')}
        >
          Ayarlar
        </button>
        <button
          role="tab"
          id="tab-moduller"
          aria-selected={aktifSekme === 'moduller'}
          aria-controls="panel-moduller"
          tabIndex={aktifSekme === 'moduller' ? 0 : -1}
          style={sekmeBtnStyle('moduller')}
          onClick={() => setAktifSekme('moduller')}
        >
          Modüller
        </button>
      </div>

      {aktifSekme === 'moduller' ? (
        <div role="tabpanel" id="panel-moduller" aria-labelledby="tab-moduller" tabIndex={0} style={{ overflowY: 'auto', minHeight: 0, paddingRight: 6 }}>
          <div style={kartStil}>
            <div style={kartBaslikStil}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Modül Görünürlüğü
            </div>
            <p style={{ margin: 0, fontSize: '0.88em', color: '#777', lineHeight: 1.5 }}>
              Ana menüde gösterilmesini istediğiniz modülleri seçin.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MODULLER.map((m) => {
                const gizli = (a.gizliModuller || []).includes(m.id);
                return (
                  <label
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                      background: gizli ? 'var(--renk-kart-bg, #f8f9ff)' : 'var(--renk-vurgu-acik, #eef2ff)',
                      border: `2px solid ${gizli ? 'var(--renk-kenar, #e8eaf0)' : 'var(--renk-vurgu, #5465ff)'}`,
                      transition: 'all .15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: 36, height: 36, flexShrink: 0,
                        color: gizli ? '#bbb' : 'var(--renk-vurgu, #5465ff)',
                        transition: 'color .15s'
                      }} aria-hidden="true">
                        {m.ikon}
                      </span>
                      <span>
                        <span style={{ fontWeight: 700, display: 'block', color: gizli ? '#aaa' : 'inherit' }}>{m.baslik}</span>
                        <span style={{ fontSize: '0.82em', color: gizli ? '#bbb' : '#777' }}>{m.altBaslik}</span>
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!gizli}
                      onChange={(e) => {
                        const mevcutGizli = a.gizliModuller || [];
                        const yeniGizli = e.target.checked
                          ? mevcutGizli.filter((id) => id !== m.id)
                          : [...mevcutGizli, m.id];
                        guncelle({ gizliModuller: yeniGizli });
                        konus(e.target.checked ? `${m.baslik} açıldı.` : `${m.baslik} gizlendi.`);
                      }}
                      style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }}
                      aria-label={`${m.baslik} – ${gizli ? 'gizli' : 'görünür'}`}
                    />
                    {/* Toggle */}
                    <span style={{ ...toggleTrackStil, flexShrink: 0, background: gizli ? '#ccc' : 'var(--renk-vurgu, #5465ff)' }}>
                      <span style={{ ...toggleThumbStil, transform: gizli ? 'translateX(2px)' : 'translateX(22px)' }} />
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
      <div role="tabpanel" id="panel-ayarlar" aria-labelledby="tab-ayarlar" tabIndex={0} style={{ overflowY: 'auto', minHeight: 0, paddingRight: 6 }}>

        {/* ── Kart: Sesli Yönerge ── */}
        <div style={kartStil}>
          <div style={kartBaslikStil}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            Sesli Yönerge
          </div>
          <div style={satirStil}>
            <div>
              <div style={{ fontWeight: 600 }}>Sesli yönerge</div>
              <div style={aciklamaStil}>Sayfa değişimlerinde otomatik okuma</div>
            </div>
            <label style={toggleKapStil}>
              <input type="checkbox" checked={a.sesAcik} onChange={(e) => guncelle({ sesAcik: e.target.checked })} aria-label={`Sesli yönerge ${a.sesAcik ? 'açık' : 'kapalı'}`} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <span style={{ ...toggleTrackStil, background: a.sesAcik ? 'var(--renk-vurgu, #5465ff)' : '#ccc' }}>
                <span style={{ ...toggleThumbStil, transform: a.sesAcik ? 'translateX(22px)' : 'translateX(2px)' }} />
              </span>
            </label>
          </div>
          <div style={{ ...satirStil, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Konuşma hızı</span>
              <span style={{ ...rozetStil }}>{a.konusmaHizi.toFixed(2)}×</span>
            </div>
            <input type="range" min="0.5" max="1.5" step="0.05" value={a.konusmaHizi}
              onChange={(e) => guncelle({ konusmaHizi: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--renk-vurgu, #5465ff)' }} aria-label="Konuşma hızı" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', color: '#999' }}>
              <span>Yavaş</span><span>Hızlı</span>
            </div>
          </div>
          <button type="button" onClick={() => konus('Bu, mevcut hızda örnek bir Türkçe konuşmadır.')} style={ikincilButonStil}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Sesi Dene
          </button>
        </div>

        {/* ── Kart: Görünüm ── */}
        <div style={kartStil}>
          <div style={kartBaslikStil}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            Görünüm
          </div>
          <div style={{ ...satirStil, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span id="gorunum-modu-baslik" style={{ fontWeight: 600 }}>Görünüm Modu</span>
            <div role="radiogroup" aria-labelledby="gorunum-modu-baslik" style={{ display: 'flex', gap: 10 }}>
              {[{ val: 'normal', label: 'Normal', aciklama: 'Standart renkler' }, { val: 'lowVision', label: 'Az Görenler', aciklama: 'Yüksek kontrast' }].map(({ val, label, aciklama }) => (
                <label key={val} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 14px',
                  borderRadius: 10, cursor: 'pointer', border: `2px solid ${a.tema === val ? 'var(--renk-vurgu, #5465ff)' : 'var(--renk-kenar, #ddd)'}`,
                  background: a.tema === val ? 'var(--renk-vurgu-acik, #eef2ff)' : 'var(--renk-kart-bg, #f8f9ff)',
                  transition: 'all .15s'
                }}>
                  <input type="radio" name="tema" value={val} checked={a.tema === val} onChange={() => guncelle({ tema: val })} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                  <span style={{ fontWeight: 700, color: a.tema === val ? 'var(--renk-vurgu, #5465ff)' : 'inherit' }}>{label}</span>
                  <span style={{ fontSize: '0.78em', color: '#777' }}>{aciklama}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ ...satirStil, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Yazı boyutu</span>
              <span style={rozetStil}>{a.yaziBoyutu}px</span>
            </div>
            <input type="range" min="16" max="32" step="1" value={a.yaziBoyutu}
              onChange={(e) => guncelle({ yaziBoyutu: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--renk-vurgu, #5465ff)' }} aria-label="Yazı boyutu" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78em', color: '#999' }}>
              <span>16px</span><span>32px</span>
            </div>
          </div>
        </div>

        {/* ── Kart: Geri Bildirim ── */}
        <div style={kartStil}>
          <div style={kartBaslikStil}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            Geri Bildirim
          </div>
          <div style={satirStil}>
            <div>
              <div style={{ fontWeight: 600 }}>Titreşim</div>
              <div style={aciklamaStil}>Mobil cihazlarda dokunsal geri bildirim</div>
            </div>
            <label style={toggleKapStil}>
              <input type="checkbox" checked={a.titresimAcik} onChange={(e) => guncelle({ titresimAcik: e.target.checked })} aria-label={`Titreşim ${a.titresimAcik ? 'açık' : 'kapalı'}`} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <span style={{ ...toggleTrackStil, background: a.titresimAcik ? 'var(--renk-vurgu, #5465ff)' : '#ccc' }}>
                <span style={{ ...toggleThumbStil, transform: a.titresimAcik ? 'translateX(22px)' : 'translateX(2px)' }} />
              </span>
            </label>
          </div>
        </div>

        {/* ── Kart: İlerleme ── */}
        <div style={kartStil}>
          <div style={kartBaslikStil}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            İlerleme
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { baslik: 'Harfler', deger: (ilerleme.harfler || []).length, toplam: 29 },
              { baslik: 'Rakamlar', deger: (ilerleme.rakamlar || []).length, toplam: 10 },
              { baslik: 'Noktalama', deger: (ilerleme.noktalama || []).length, toplam: 8 },
            ].map(({ baslik, deger, toplam }) => (
              <div key={baslik} style={{ flex: 1, minWidth: 90, background: 'var(--renk-kart-bg, #f8f9ff)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5em', fontWeight: 800, color: 'var(--renk-vurgu, #5465ff)' }}>{deger}</div>
                <div style={{ fontSize: '0.75em', color: '#888', marginTop: 2 }}>{baslik}</div>
                <div role="progressbar" aria-valuenow={deger} aria-valuemin={0} aria-valuemax={toplam} aria-label={`${baslik}: ${deger} / ${toplam}`} style={{ marginTop: 6, height: 4, borderRadius: 2, background: '#e0e0e0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, deger / toplam * 100)}%`, background: 'var(--renk-vurgu, #5465ff)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" style={{ ...ikincilButonStil, marginTop: 4, color: '#e53e3e', borderColor: '#e53e3e' }}
            onClick={() => { if (confirm('Tüm ilerleme silinsin mi?')) { tumIlerlemeyiSifirla(); setIlerleme({}); konus('İlerleme sıfırlandı.'); } }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
            İlerlemeyi Sıfırla
          </button>
        </div>

        {/* ── Kart: Arduino ── */}
        <div style={kartStil}>
          <div style={kartBaslikStil}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="9" y1="11" x2="9" y2="13"/><line x1="15" y1="11" x2="15" y2="13"/>
            </svg>
            Arduino (Fiziksel Hücre)
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '0.9em', color: '#666', lineHeight: 1.5 }}>
            Cihaz bağlıyken ekrandaki braille deseni Arduino üzerindeki 6 noktayı da kaldırır.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: arduino.bagli ? '#38a169' : '#cbd5e0', flexShrink: 0
            }} />
            <span role="status" aria-live="polite" style={{ fontWeight: 600, fontSize: '0.9em' }}>
              {arduino.bagli ? `Bağlı — ${arduino.tasiyici === 'serial' ? 'USB' : 'Bluetooth'}` : 'Bağlı değil'}
            </span>
          </div>
          {arduinoHata && <div role="alert" style={{ color: '#c0392b', fontSize: '0.88em', marginBottom: 10 }}>{arduinoHata}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {!arduino.bagli && webSerialDestekleniyorMu() && (
              <button type="button" onClick={arduinoSeriBaglan} style={ikincilButonStil}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                USB ile Bağlan
              </button>
            )}
            {!arduino.bagli && webBluetoothDestekleniyorMu() && (
              <button type="button" onClick={arduinoBleBaglan} style={ikincilButonStil}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/></svg>
                Bluetooth ile Bağlan
              </button>
            )}
            {arduino.bagli && (
              <>
                <button type="button" onClick={arduinoTest} style={ikincilButonStil}>Test Et (1–6)</button>
                <button type="button" onClick={arduinoBaglantiyiKes} style={{ ...ikincilButonStil, color: '#e53e3e', borderColor: '#e53e3e' }}>Bağlantıyı Kes</button>
              </>
            )}
            {!arduino.bagli && !webSerialDestekleniyorMu() && !webBluetoothDestekleniyorMu() && (
              <div style={{ fontSize: '0.85em', color: '#888' }}>Bu tarayıcı/cihaz desteklemiyor. Chrome/Edge kullanın.</div>
            )}
          </div>
        </div>

        {/* ── Kart: Tanıtım Turu ── */}
        <div style={kartStil}>
          <div style={kartBaslikStil}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
            Tanıtım Turu
          </div>
          <button type="button" onClick={() => { turuSifirla(); setTurAcik(true); }} style={ikincilButonStil} aria-label="Tanıtım turunu yeniden göster">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Tanıtım Turunu Tekrar Göster
          </button>
        </div>

        {/* ── Sıfırla ── */}
        <div style={{ padding: '0 4px 24px' }}>
          <button type="button" style={{ ...ikincilButonStil, width: '100%', justifyContent: 'center', color: '#e53e3e', borderColor: '#e53e3e' }}
            onClick={() => { ayarlariSifirla(); setA(ayarlariAl()); konus('Ayarlar varsayılana döndü.'); }}>
            Ayarları Varsayılana Döndür
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
