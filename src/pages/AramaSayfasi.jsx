import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { aramaYap, sozlukAra, sorguHucreleri, noktaCumlesi, KONU_SIRASI } from '../utils/aramaIndeksi.js';
import { konusmayiDurdur } from '../utils/ses.js';

const YONERGE =
  'Lütfen Braille noktalarının numaralarını aralarında boşluk, virgül olmadan yan yana yazınız. Örnek: 123. Birden fazla hücre aramak isterseniz hücreler arasına boşluk koyarak devam edin. Örnek: 123 145. Dilerseniz Perkins klavye tuşlarını (F D S J K L) da kullanabilirsiniz; otomatik olarak nokta numaralarına çevrilir.';
const YONERGE_SOZLUK =
  'Aramak istediğiniz sembolün adını, anlamını ya da yazılışını yazın. Örnek: çarpma işaretini bulmak için çarpma; "aynı" kısaltmasını bulmak için aynı; A harfini bulmak için a.';

// Perkins klavye tuşları → nokta numarası (BrailleKlavye ile aynı: F D S = 1 2 3, J K L = 4 5 6)
const PERKINS_TUS = { f: '1', d: '2', s: '3', j: '4', k: '5', l: '6' };

// Görsel mini braille hücresi (ekran okuyucudan gizli — açıklama buton etiketinde).
const NOKTA_YERI = {
  1: { gridRow: 1, gridColumn: 1 }, 2: { gridRow: 2, gridColumn: 1 }, 3: { gridRow: 3, gridColumn: 1 },
  4: { gridRow: 1, gridColumn: 2 }, 5: { gridRow: 2, gridColumn: 2 }, 6: { gridRow: 3, gridColumn: 2 },
};
function MiniHucre({ noktalar, vurgu }) {
  const dolu = new Set(noktalar);
  return (
    <span className={'arama-mini-hucre' + (vurgu ? ' vurgu' : '')} aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span
          key={n}
          className={'arama-mini-nokta' + (dolu.has(n) ? ' on' : '')}
          style={NOKTA_YERI[n]}
        />
      ))}
    </span>
  );
}

// Ekran okuyucu sırası: 1) anlam, 2) modüldeki ders, 3) braille noktaları.
// eslesenIndeksler boşsa (sözlük araması) tüm hücreler okunur (vurgu yok).
function sonucAriaEtiketi(s) {
  const anlam = s.altEtiket ? `${s.etiket}, ${s.altEtiket}` : s.etiket;
  const ders = `${s.modulBaslik} ${s.modulKonu}, ${s.kategori} dersi`;
  const idxs = (s.eslesenIndeksler && s.eslesenIndeksler.length)
    ? s.eslesenIndeksler
    : s.hucreler.map((_, i) => i);
  const cellsSoz = idxs.map((i) => noktaCumlesi(s.hucreler[i] || [])).join('; ');
  const tumMu = idxs.length === s.hucreler.length;
  const braille = s.hucreler.length > 1
    ? (tumMu
        ? `Braille: ${s.hucreler.length} hücre, ${cellsSoz}`
        : `Braille: ${s.hucreler.length} hücreli, eşleşen ${idxs.length > 1 ? 'hücreler' : 'hücre'} ${cellsSoz}`)
    : `Braille: tek hücre, ${cellsSoz}`;
  return `${anlam}. ${ders}. ${braille}. Açmak için etkinleştirin.`;
}

function SonucButonu({ s, onGit }) {
  return (
    <button
      type="button"
      className={'btn arama-sonuc' + (s.hucreler.length > 2 ? ' cok-hucreli' : '')}
      onClick={() => onGit(s.yol)}
      aria-label={sonucAriaEtiketi(s)}
    >
      <span className="arama-sonuc-hucreler" aria-hidden="true">
        {s.hucreler.map((h, hi) => (
          <MiniHucre key={hi} noktalar={h} vurgu={(s.eslesenIndeksler || []).includes(hi)} />
        ))}
      </span>
      <span className="arama-sonuc-metin" aria-hidden="true">
        <span className="arama-sonuc-ad">{s.etiket}</span>
        {s.altEtiket && <span className="arama-sonuc-alt">{s.altEtiket}</span>}
        <span className="arama-sonuc-etiketler">
          <span className="arama-sonuc-modul">{s.modulKonu}</span>
          <span className="arama-sonuc-modul-no">{s.modulBaslik}</span>
          <span className="arama-sonuc-kategori">{s.kategori}</span>
        </span>
      </span>
    </button>
  );
}

export default function AramaSayfasi() {
  const navigate = useNavigate();
  const [sorgu, setSorgu] = useState('');
  const [mod, setMod] = useState('braille'); // 'braille' | 'sozluk'
  const [filtre, setFiltre] = useState(null); // null = tüm bölümler
  const girdiRef = useRef(null);

  // Sayfaya girişte (özellikle SAYFA YENİLEME — SayfaOdakYonetimi ilk yüklemede odağı atlar)
  // girdiye odaklan → NVDA form moduna geçsin, kullanıcı hemen yazabilsin.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => girdiRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, []);

  const sozlukModu = mod === 'sozluk';
  const qHucreler = sozlukModu ? [] : sorguHucreleri(sorgu);
  const aramaAktif = sozlukModu ? sorgu.trim().length > 0 : qHucreler.length > 0;
  const tumSonuc = useMemo(
    () => (sozlukModu ? sozlukAra(sorgu) : aramaYap(sorgu)),
    [sorgu, sozlukModu]
  );

  // Sonuçlarda bulunan konular (modül sırasına göre).
  const mevcutKonular = useMemo(
    () => KONU_SIRASI.filter((k) => tumSonuc.some((s) => s.modulKonu === k)),
    [tumSonuc]
  );
  // Aktif filtre yalnız sonuçlarda varsa geçerli (sorgu değişince kendini düzeltir).
  const aktifFiltre = filtre && mevcutKonular.includes(filtre) ? filtre : null;
  const gosterilenKonular = aktifFiltre ? [aktifFiltre] : mevcutKonular;
  const gruplar = gosterilenKonular.map((k) => ({
    konu: k,
    items: tumSonuc.filter((s) => s.modulKonu === k),
  }));
  const gosterilenSayi = gruplar.reduce((t, g) => t + g.items.length, 0);

  const sorguSozu = sozlukModu
    ? `"${sorgu.trim()}"`
    : qHucreler.map((k) => noktaCumlesi(k.split('').map(Number))).join(' ardından ');
  const ozet = !aramaAktif
    ? (sozlukModu
        ? 'Aramak için bir sözcük yazın.'
        : 'Aramak için bir Braille hücresinin nokta numaralarını yazın.')
    : tumSonuc.length === 0
      ? `${sorguSozu} için sonuç bulunamadı.`
      : aktifFiltre
        ? `${sorguSozu} için ${aktifFiltre} bölümünde ${gosterilenSayi} sonuç bulundu.`
        : `${sorguSozu} için ${tumSonuc.length} sonuç bulundu.`;

  const girdiDegisti = (e) => {
    if (sozlukModu) { setSorgu(e.target.value.slice(0, 40)); return; }
    // Braille modu: Perkins tuşu (f/d/s/j/k/l) → rakam; 1-6 rakamı ve hücre ayıracı
    // boşluk korunur; çoklu boşluk teke iner, baş boşluk atılır.
    const temiz = e.target.value
      .split('')
      .map((c) => PERKINS_TUS[c.toLowerCase()] || c)
      .filter((c) => (c >= '1' && c <= '6') || c === ' ')
      .join('')
      .replace(/ {2,}/g, ' ')
      .replace(/^ /, '')
      .slice(0, 29);
    setSorgu(temiz);
  };

  const modDegisti = (e) => {
    setMod(e.target.value);
    setSorgu('');
    setFiltre(null);
    // Native select seçimden sonra odağı geri alabilir; önce bırak, sonra bir sonraki
    // makrotaskta (dropdown kapanıp odak yerleştikten sonra) input'a odaklan.
    e.target.blur();
    setTimeout(() => girdiRef.current?.focus(), 0);
  };

  const sonucaGit = (yol) => {
    konusmayiDurdur();
    navigate(yol);
  };

  return (
    <div className="page arama-sayfa">
      <PageHeader baslik="Braille Arama" />

      <div className="page-mid arama-govde">
        <div className="arama-form">
          <label htmlFor="arama-girdi" className="arama-yonerge">{sozlukModu ? YONERGE_SOZLUK : YONERGE}</label>
          <div className="arama-girdi-satir">
            <input
              ref={girdiRef}
              id="arama-girdi"
              // Sayfaya girince odak girdiye gelir → ekran okuyucu (NVDA) FORM/odak moduna geçer
              // ve kullanıcı hemen yazabilir. Eskiden odak başlık/gövdedeydi → NVDA tarama
              // (browse) modunda kalıyor, rakam tuşları (1-6) başlığa atlama yapıp girdiye
              // YAZMIYORDU (kullanıcı: "aramada ekran okuyucu açıkken yazamıyorum").
              data-sayfa-odak="arama"
              className={'arama-girdi' + (sozlukModu ? ' metin' : '')}
              type="text"
              inputMode={sozlukModu ? 'text' : 'numeric'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={sorgu}
              onChange={girdiDegisti}
              aria-describedby="arama-ozet"
              placeholder={sozlukModu ? 'çarpma' : '123'}
            />
            <select
              className="arama-mod-secim"
              value={mod}
              onChange={modDegisti}
              aria-label="Arama türü"
            >
              <option value="braille">Braille arama</option>
              <option value="sozluk">Sözlük ile arama</option>
            </select>
          </div>
          <p id="arama-ozet" className="arama-ozet" role="status" aria-live="polite">{ozet}</p>

          {mevcutKonular.length > 0 && (
            <div className="arama-filtre" role="group" aria-label="Bölüme göre filtrele">
              <button
                type="button"
                className={'btn arama-filtre-cip' + (!aktifFiltre ? ' aktif' : '')}
                aria-pressed={!aktifFiltre}
                onClick={() => setFiltre(null)}
              >
                Tümü <span className="arama-filtre-adet">{tumSonuc.length}</span>
              </button>
              {mevcutKonular.map((k) => {
                const adet = tumSonuc.filter((s) => s.modulKonu === k).length;
                const secili = aktifFiltre === k;
                return (
                  <button
                    key={k}
                    type="button"
                    className={'btn arama-filtre-cip' + (secili ? ' aktif' : '')}
                    aria-pressed={secili}
                    aria-label={`${k}, ${adet} sonuç`}
                    onClick={() => setFiltre(secili ? null : k)}
                  >
                    {k} <span className="arama-filtre-adet">{adet}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {gruplar.map((g) => (
          <section key={g.konu} className="arama-grup" aria-label={`${g.konu}, ${g.items.length} sonuç`}>
            <h3 className="arama-grup-baslik">
              {g.konu} <span className="arama-grup-adet">{g.items.length} sonuç</span>
            </h3>
            <ul className="arama-sonuc-liste">
              {g.items.map((s, i) => (
                <li key={`${s.yol}-${s.etiket}-${i}`} className="arama-sonuc-li">
                  <SonucButonu s={s} onGit={sonucaGit} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
