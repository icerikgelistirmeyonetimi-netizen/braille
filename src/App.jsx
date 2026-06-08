import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import AnaMenu from './pages/AnaMenu.jsx';
import HucreTanima from './pages/HucreTanima.jsx';
import HarfEgitimi from './pages/HarfEgitimi.jsx';
import RakamEgitimi from './pages/RakamEgitimi.jsx';
import NoktalamaEgitimi from './pages/NoktalamaEgitimi.jsx';
import Test from './pages/Test.jsx';
import Ayarlar from './pages/Ayarlar.jsx';
import YazmaEgitimi from './pages/YazmaEgitimi.jsx';
import YazmaYonergeli from './pages/YazmaYonergeli.jsx';
import YazmaYonergeliCumle from './pages/YazmaYonergeliCumle.jsx';
import YazmaSerbest from './pages/YazmaSerbest.jsx';
import YazmaKarisik from './pages/YazmaKarisik.jsx';
import KisaltmaBirHarfli from './pages/KisaltmaBirHarfli.jsx';
import KisaltmaIkiHarfli from './pages/KisaltmaIkiHarfli.jsx';
import KisaltmaHece from './pages/KisaltmaHece.jsx';
import KisaltmaKelimeKoku from './pages/KisaltmaKelimeKoku.jsx';
import KisaltmaKelimeParcasi from './pages/KisaltmaKelimeParcasi.jsx';
import NoktalamaIsaretleri from './pages/NoktalamaIsaretleri.jsx';
import OzelIsaretler from './pages/OzelIsaretler.jsx';
import TestKisaltma from './pages/TestKisaltma.jsx';
import TestNoktalama from './pages/TestNoktalama.jsx';
import KuranHarfEgitimi from './pages/KuranHarfEgitimi.jsx';
import KuranHarekeEgitimi from './pages/KuranHarekeEgitimi.jsx';
import KuranTecvidEgitimi from './pages/KuranTecvidEgitimi.jsx';
import KuranHeceOkuma from './pages/KuranHeceOkuma.jsx';
import KuranKelimeOkumaSayfa from './pages/KuranKelimeOkumaSayfa.jsx';
import KuranKelimeTemelSayfa from './pages/KuranKelimeTemelSayfa.jsx';
import KuranSureOkuma from './pages/KuranSureOkuma.jsx';
import TestKuran from './pages/TestKuran.jsx';
import MatematikRakamEgitimi from './pages/MatematikRakamEgitimi.jsx';
import MatematikSembolEgitimi from './pages/MatematikSembolEgitimi.jsx';
import MatematikOlcuEgitimi from './pages/MatematikOlcuEgitimi.jsx';
import MatematikGeometriEgitimi from './pages/MatematikGeometriEgitimi.jsx';
import MatematikIfadeOkuma from './pages/MatematikIfadeOkuma.jsx';
import MatematikSiraSayilari from './pages/MatematikSiraSayilari.jsx';
import TestMatematik from './pages/TestMatematik.jsx';
import FenYunanHarfler from './pages/FenYunanHarfler.jsx';
import FenSembolEgitimi from './pages/FenSembolEgitimi.jsx';
import FenKimyaFormulleri from './pages/FenKimyaFormulleri.jsx';
import FenFizikFormulleri from './pages/FenFizikFormulleri.jsx';
import TestFen from './pages/TestFen.jsx';
import MuzikNotaEgitimi from './pages/MuzikNotaEgitimi.jsx';
import MuzikSembolEgitimi from './pages/MuzikSembolEgitimi.jsx';
import MuzikSureleri from './pages/MuzikSureleri.jsx';
import MuzikDiziOkuma from './pages/MuzikDiziOkuma.jsx';
import MuzikBrailleMenu from './pages/MuzikBrailleMenu.jsx';
import MuzikBrailleSayfa from './pages/MuzikBrailleSayfa.jsx';
import MuzikBrfYazim from './pages/MuzikBrfYazim.jsx';
import TestMuzik from './pages/TestMuzik.jsx';
import IngilizceBrailleMenu from './pages/IngilizceBrailleMenu.jsx';
import IngilizceBrailleSayfa from './pages/IngilizceBrailleSayfa.jsx';
import AlmancaBrailleMenu from './pages/AlmancaBrailleMenu.jsx';
import AlmancaBrailleSayfa from './pages/AlmancaBrailleSayfa.jsx';
import FransizcaBrailleMenu from './pages/FransizcaBrailleMenu.jsx';
import FransizcaBrailleSayfa from './pages/FransizcaBrailleSayfa.jsx';
import Araclar from './pages/Araclar.jsx';
import BelgeBrf from './pages/BelgeBrf.jsx';
import BrfOku from './pages/BrfOku.jsx';
import TonePianoTest from './pages/TonePianoTest.jsx';
import { sallamayiBaslat } from './utils/sallama.js';
import DesktopShell from './components/DesktopShell.jsx';
import { tamEkranApiDestekleniyorMu } from './utils/tamEkran.js';

function IngilizceBrailleEskiYol() {
  const { slug } = useParams();
  return <Navigate to={`/ingilizce/${slug}`} replace />;
}

function AlmancaBrailleEskiYol() {
  const { slug } = useParams();
  return slug ? <Navigate to={`/almanca/${slug}`} replace /> : <Navigate to="/almanca" replace />;
}

function FransizcaBrailleEskiYol() {
  const { slug } = useParams();
  return slug ? <Navigate to={`/fransizca/${slug}`} replace /> : <Navigate to="/fransizca" replace />;
}

/**
 * Rota değiştiğinde ekran okuyucu odağını yönetir:
 *  - Bir modül açıldığında odak, açılan sayfanın başlığına taşınır. Aksi
 *    halde NVDA, tıklanan modül butonunda kalır; kullanıcı açılan sayfaya
 *    ulaşmak için tüm modül başlıklarını ok tuşlarıyla geçmek zorunda kalır.
 *  - Ana sayfaya dönüldüğünde odak, geri gelinen (aktif) modül sekmesine
 *    taşınır. Aksi halde imleç sayfa sonundaki son satıra düşer.
 */
function SayfaOdakYonetimi() {
  const { pathname } = useLocation();
  // Önceki yolu izleriz: yalnızca gerçek bir rota değişiminde odak taşırız.
  // (Boolean bayrak yerine yol karşılaştırması — StrictMode'un mount'ta
  // effect'i iki kez çağırması ilk yüklemede odağı çalmasın diye.)
  const oncekiYol = useRef(null);

  useEffect(() => {
    const onceki = oncekiYol.current;
    oncekiYol.current = pathname;

    // İlk yükleme veya yol değişmediyse odağı taşımayız; ana sayfanın
    // kendi sesli yönergesi var ve gereksiz odak hırsızlığını önleriz.
    if (onceki === null || onceki === pathname) return undefined;

    // Yeni içeriğin DOM'u yerleştikten sonra odakla.
    const id = window.requestAnimationFrame(() => {
      if (pathname === '/') {
        // Ana sayfaya dönüşte: geri gelinen (aktif) modül sekmesine odaklan.
        const aktifSekme = document.querySelector('.modul-yan .modul-sekme.aktif')
          || document.querySelector('.modul-yan .modul-sekme');
        if (aktifSekme) aktifSekme.focus();
        return;
      }

      // Alt sayfalarda: açılan sayfanın başlığına odaklan.
      // DesktopShell banner'ı (.ds-header) da .banner-baslik taşır; bu yüzden
      // yalnızca sayfa içeriği (.ds-content) içindeki başlığı seçeriz.
      const icerik = document.querySelector('#main .ds-content') || document.getElementById('main');
      if (!icerik) return;
      const baslik = icerik.querySelector('.banner-baslik') || icerik.querySelector('h1, h2');
      if (!baslik) return;
      if (!baslik.hasAttribute('tabindex')) baslik.setAttribute('tabindex', '-1');
      baslik.focus();
    });

    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}

export default function App() {
  useEffect(() => { sallamayiBaslat(); }, []);

  // Mobilde fullscreen: yalnızca API destekleniyorsa (iOS Safari hariç).
  // İlk yüklemede çoğu tarayıcı izin vermez; ilk dokunuşta yeniden dene.
  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (!isMobile || !tamEkranApiDestekleniyorMu()) return;

    const giris = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) fn.call(el).catch(() => {});
    };

    giris();
    document.addEventListener('touchstart', giris, { passive: true });
    return () => document.removeEventListener('touchstart', giris);
  }, []);

  return (
    <div className="app">
      <a href="#main" className="skip-link">İçeriğe atla</a>
      <SayfaOdakYonetimi />
      <main id="main">
        <DesktopShell>
          <Routes>
          <Route path="/" element={<AnaMenu />} />
          <Route path="/hucre" element={<HucreTanima />} />
          <Route path="/harfler" element={<HarfEgitimi />} />
          <Route path="/rakamlar" element={<RakamEgitimi />} />
          <Route path="/noktalama" element={<NoktalamaEgitimi />} />
          <Route path="/test" element={<Test />} />
          <Route path="/yazma-egitim" element={<YazmaEgitimi />} />
          <Route path="/yazma-yonergeli" element={<YazmaYonergeli />} />
          <Route path="/yazma-yonergeli-cumle" element={<YazmaYonergeliCumle />} />
          <Route path="/yazma-serbest" element={<YazmaSerbest />} />
          <Route path="/yazma-karisik/:kaynak" element={<YazmaKarisik />} />
          <Route path="/kisaltma-bir-harfli" element={<KisaltmaBirHarfli />} />
          <Route path="/kisaltma-iki-harfli" element={<KisaltmaIkiHarfli />} />
          <Route path="/kisaltma-hece" element={<KisaltmaHece />} />
          <Route path="/kisaltma-kelime-koku" element={<KisaltmaKelimeKoku />} />
          <Route path="/kisaltma-kelime-parcasi" element={<KisaltmaKelimeParcasi />} />
          <Route path="/noktalama-isaretleri" element={<NoktalamaIsaretleri />} />
          <Route path="/ozel-isaretler" element={<OzelIsaretler />} />
          <Route path="/test-kisaltma" element={<TestKisaltma />} />
          <Route path="/test-noktalama" element={<TestNoktalama />} />
          <Route path="/kuran-harfler" element={<KuranHarfEgitimi />} />
          <Route path="/kuran-harekeler" element={<KuranHarekeEgitimi />} />
          <Route path="/kuran-tecvid" element={<KuranTecvidEgitimi />} />
          <Route path="/kuran-heceler" element={<KuranHeceOkuma />} />
          <Route path="/kuran-kelimeler-temel" element={<KuranKelimeTemelSayfa />} />
          <Route path="/kuran-kelimeler" element={<KuranKelimeOkumaSayfa />} />
          <Route path="/kuran-sureler" element={<KuranSureOkuma />} />
          <Route path="/test-kuran" element={<TestKuran />} />
          <Route path="/mat-rakamlar" element={<MatematikRakamEgitimi />} />
          <Route path="/mat-semboller" element={<MatematikSembolEgitimi />} />
          <Route path="/mat-olculer" element={<MatematikOlcuEgitimi />} />
          <Route path="/mat-geometri" element={<MatematikGeometriEgitimi />} />
          <Route path="/mat-ifadeler" element={<MatematikIfadeOkuma />} />
          <Route path="/mat-sira-sayilari" element={<MatematikSiraSayilari />} />
          <Route path="/test-matematik" element={<TestMatematik />} />
          <Route path="/fen-yunan" element={<FenYunanHarfler />} />
          <Route path="/fen-semboller" element={<FenSembolEgitimi />} />
          <Route path="/fen-kimya" element={<FenKimyaFormulleri />} />
          <Route path="/fen-fizik" element={<FenFizikFormulleri />} />
          <Route path="/test-fen" element={<TestFen />} />
          <Route path="/muzik-notalar" element={<MuzikNotaEgitimi />} />
          <Route path="/muzik-sureler" element={<MuzikSureleri />} />
          <Route path="/muzik-semboller" element={<MuzikSembolEgitimi />} />
          <Route path="/muzik-diziler" element={<MuzikDiziOkuma />} />
          <Route path="/muzik" element={<MuzikBrailleMenu />} />
          <Route path="/muzik/:slug" element={<MuzikBrailleSayfa />} />
          <Route path="/muzik-brf-yazim" element={<MuzikBrfYazim />} />
          <Route path="/test-muzik" element={<TestMuzik />} />
          <Route path="/yabanci-dil" element={<Navigate to="/ingilizce" replace />} />
          <Route path="/almanca-braille" element={<Navigate to="/almanca" replace />} />
          <Route path="/almanca-braille/:slug" element={<AlmancaBrailleEskiYol />} />
          <Route path="/almanca" element={<AlmancaBrailleMenu />} />
          <Route path="/almanca/:slug" element={<AlmancaBrailleSayfa />} />
          <Route path="/fransizca-braille" element={<Navigate to="/fransizca" replace />} />
          <Route path="/fransizca-braille/:slug" element={<FransizcaBrailleEskiYol />} />
          <Route path="/fransizca" element={<FransizcaBrailleMenu />} />
          <Route path="/fransizca/:slug" element={<FransizcaBrailleSayfa />} />
          <Route path="/ingilizce-braille" element={<Navigate to="/ingilizce" replace />} />
          <Route path="/ingilizce-braille/:slug" element={<IngilizceBrailleEskiYol />} />
          <Route path="/ingilizce" element={<IngilizceBrailleMenu />} />
          <Route path="/ingilizce/:slug" element={<IngilizceBrailleSayfa />} />
          <Route path="/araclar" element={<Araclar />} />
          <Route path="/belge-brf" element={<BelgeBrf />} />
          <Route path="/brf-oku" element={<BrfOku />} />
          <Route path="/tone-test" element={<TonePianoTest />} />
          <Route path="/ayarlar" element={<Ayarlar />} />
          </Routes>
        </DesktopShell>
      </main>
    </div>
  );
}
