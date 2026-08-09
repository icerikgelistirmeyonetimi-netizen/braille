import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import AnaMenu from './pages/AnaMenu.jsx';
import HucreTanima from './pages/HucreTanima.jsx';
import HarfEgitimi from './pages/HarfEgitimi.jsx';
import RakamEgitimi from './pages/RakamEgitimi.jsx';
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
import KuranIsaretEgitimi from './pages/KuranIsaretEgitimi.jsx';
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
import MuzikBrailleMenu from './pages/MuzikBrailleMenu.jsx';
import MuzikBrailleSayfa from './pages/MuzikBrailleSayfa.jsx';
import MuzikBrfYazim from './pages/MuzikBrfYazim.jsx';
import TestMuzik from './pages/TestMuzik.jsx';
import IngilizceBrailleMenu from './pages/IngilizceBrailleMenu.jsx';
import AlmancaBrailleMenu from './pages/AlmancaBrailleMenu.jsx';
import FransizcaBrailleMenu from './pages/FransizcaBrailleMenu.jsx';
import YabanciBrailleSayfa from './pages/YabanciBrailleSayfa.jsx';
import TestYabanci from './pages/TestYabanci.jsx';
import AramaSayfasi from './pages/AramaSayfasi.jsx';
import Araclar from './pages/Araclar.jsx';
import BelgeBrf from './pages/BelgeBrf.jsx';
import BrfOku from './pages/BrfOku.jsx';
import TonePianoTest from './pages/TonePianoTest.jsx';
import { sallamayiBaslat } from './utils/sallama.js';
import DesktopShell from './components/DesktopShell.jsx';
import KilavuzPenceresi from './components/KilavuzPenceresi.jsx';
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
 * Rota deÄŸiÅŸtiÄŸinde ekran okuyucu odaÄŸÄ±nÄ± yÃ¶netir:
 *  - Bir modÃ¼l aÃ§Ä±ldÄ±ÄŸÄ±nda odak, aÃ§Ä±lan sayfanÄ±n baÅŸlÄ±ÄŸÄ±na taÅŸÄ±nÄ±r. Aksi
 *    halde NVDA, tÄ±klanan modÃ¼l butonunda kalÄ±r; kullanÄ±cÄ± aÃ§Ä±lan sayfaya
 *    ulaÅŸmak iÃ§in tÃ¼m modÃ¼l baÅŸlÄ±klarÄ±nÄ± ok tuÅŸlarÄ±yla geÃ§mek zorunda kalÄ±r.
 *  - Ana sayfaya dÃ¶nÃ¼ldÃ¼ÄŸÃ¼nde odak, geri gelinen (aktif) modÃ¼l sekmesine
 *    taÅŸÄ±nÄ±r. Aksi halde imleÃ§ sayfa sonundaki son satÄ±ra dÃ¼ÅŸer.
 */
function SayfaOdakYonetimi() {
  const { pathname } = useLocation();
  // Ã–nceki yolu izleriz: yalnÄ±zca gerÃ§ek bir rota deÄŸiÅŸiminde odak taÅŸÄ±rÄ±z.
  // (Boolean bayrak yerine yol karÅŸÄ±laÅŸtÄ±rmasÄ± â€” StrictMode'un mount'ta
  // effect'i iki kez Ã§aÄŸÄ±rmasÄ± ilk yÃ¼klemede odaÄŸÄ± Ã§almasÄ±n diye.)
  const oncekiYol = useRef(null);

  useEffect(() => {
    const onceki = oncekiYol.current;
    oncekiYol.current = pathname;

    // Ä°lk yÃ¼kleme veya yol deÄŸiÅŸmediyse odaÄŸÄ± taÅŸÄ±mayÄ±z; ana sayfanÄ±n
    // kendi sesli yÃ¶nergesi var ve gereksiz odak hÄ±rsÄ±zlÄ±ÄŸÄ±nÄ± Ã¶nleriz.
    if (onceki === null || onceki === pathname) return undefined;

    // Yeni iÃ§eriÄŸin DOM'u yerleÅŸtikten sonra odakla.
    const id = window.requestAnimationFrame(() => {
      if (pathname === '/') {
        // Ana sayfaya dÃ¶nÃ¼ÅŸte: geri gelinen (aktif) modÃ¼l sekmesine odaklan.
        const aktifSekme = document.querySelector('.modul-yan .modul-sekme.aktif')
          || document.querySelector('.modul-yan .modul-sekme');
        if (aktifSekme) aktifSekme.focus();
        return;
      }
      if (pathname.startsWith('/modul/')) {
        // ModÃ¼l route'u (AnaMenu, /modul/:modulId): seÃ§ilen modÃ¼lÃ¼n iÃ§erik baÅŸlÄ±ÄŸÄ±na odaklan
        // (modulSec'in odak niyetiyle aynÄ±) â†’ ekran okuyucu modÃ¼l adÄ±nÄ± ve derslerini okur.
        const baslik = document.querySelector('.modul-icerik-baslik')
          || document.querySelector('.modul-yan .modul-sekme.aktif');
        if (baslik) baslik.focus();
        return;
      }

      // Alt sayfalarda: aÃ§Ä±lan sayfanÄ±n baÅŸlÄ±ÄŸÄ±na odaklan.
      // DesktopShell banner'Ä± (.ds-header) da .banner-baslik taÅŸÄ±r; bu yÃ¼zden
      // yalnÄ±zca sayfa iÃ§eriÄŸi (.ds-content) iÃ§indeki baÅŸlÄ±ÄŸÄ± seÃ§eriz.
      const icerik = document.querySelector('#main .ds-content') || document.getElementById('main');
      if (!icerik) return;
      // Sayfa kendi giriÅŸ odaÄŸÄ±nÄ± belirtmiÅŸse (Ã¶r. CokHucreOkuyucu yÃ¶nerge bÃ¶lgesi) ona
      // odaklan â€” baÅŸlÄ±k yerine. Aksi halde ders sayfalarÄ±nda modÃ¼lden girince NVDA Ã¶nce
      // baÅŸlÄ±ÄŸÄ±/gereksiz detayÄ± okuyup yÃ¶nergeyi gÃ¶mÃ¼yordu (kullanÄ±cÄ±: "yÃ¶nerge ilk okumuyor").
      const hedef = icerik.querySelector('[data-sayfa-odak]')
        || icerik.querySelector('.banner-baslik')
        || icerik.querySelector('h1, h2');
      if (!hedef) return;
      // YerleÅŸik odaklanabilir Ã¶ÄŸelere (input/select/textarea/button/a) tabindex=-1 EKLEME â€”
      // aksi halde Tab sÄ±rasÄ±ndan Ã§Ä±karlar (Ã¶r. arama girdisi data-sayfa-odak ile odaklanÄ±r
      // ama klavye Tab eriÅŸimi korunmalÄ±). BaÅŸlÄ±k/div gibi Ã¶ÄŸelere -1 gerekir (focus alsÄ±n).
      const yerlesikOdaklanabilir = /^(input|select|textarea|button|a)$/i.test(hedef.tagName);
      if (!hedef.hasAttribute('tabindex') && !yerlesikOdaklanabilir) hedef.setAttribute('tabindex', '-1');
      hedef.focus();
    });

    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}

export default function App() {
  useEffect(() => { sallamayiBaslat(); }, []);

  // Mobilde fullscreen: yalnÄ±zca API destekleniyorsa (iOS Safari hariÃ§).
  // Ä°lk yÃ¼klemede Ã§oÄŸu tarayÄ±cÄ± izin vermez; ilk dokunuÅŸta yeniden dene.
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
      {/* HÃ¼cre yazma (Ã¶ÄŸrenme) modu aÃ§Ä±kken CokHucreOkuyucu buraya "HÃ¼creye dÃ¶n"
          hayalet butonunu portallar â†’ Ctrl+Home ile sayfa baÅŸÄ±na dÃ¶nen NVDA
          kullanÄ±cÄ±sÄ±nÄ±n bulduÄŸu Ä°LK Ã¶ÄŸe bu olur; etkinleÅŸtirince odak braille
          hÃ¼cresinin 1. noktasÄ±na gider. Slot DOM'un EN BAÅINDA kalmalÄ±. */}
      <div id="hucre-don-slot" />
      <SayfaOdakYonetimi />
      {/* F1: Kısaltmalar ve Kullanım Kılavuzu penceresi (müzik editörü hariç — orada
          F1 editörün kendi kısayol yardımını açar). */}
      <KilavuzPenceresi />
      <main id="main">
        <DesktopShell>
          <Routes>
          <Route path="/" element={<AnaMenu />} />
          <Route path="/modul/:modulId" element={<AnaMenu />} />
          <Route path="/arama" element={<AramaSayfasi />} />
          <Route path="/hucre" element={<HucreTanima />} />
          <Route path="/harfler" element={<HarfEgitimi />} />
          <Route path="/rakamlar" element={<RakamEgitimi />} />
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
          <Route path="/kuran-isaretler/:slug" element={<KuranIsaretEgitimi />} />
          <Route path="/kuran-uzatma" element={<KuranTecvidEgitimi />} />
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
          <Route path="/muzik" element={<MuzikBrailleMenu />} />
          <Route path="/muzik/grup/:grupId" element={<MuzikBrailleMenu />} />
          <Route path="/muzik/:slug" element={<MuzikBrailleSayfa />} />
          <Route path="/muzik-brf-yazim" element={<MuzikBrfYazim />} />
          <Route path="/test-muzik" element={<TestMuzik />} />
          <Route path="/yabanci-dil" element={<Navigate to="/ingilizce" replace />} />
          <Route path="/almanca-braille" element={<Navigate to="/almanca" replace />} />
          <Route path="/almanca-braille/:slug" element={<AlmancaBrailleEskiYol />} />
          <Route path="/almanca" element={<AlmancaBrailleMenu />} />
          <Route path="/almanca/test" element={<TestYabanci dil="de" />} />
          <Route path="/almanca/:slug" element={<YabanciBrailleSayfa dil="de" />} />
          <Route path="/fransizca-braille" element={<Navigate to="/fransizca" replace />} />
          <Route path="/fransizca-braille/:slug" element={<FransizcaBrailleEskiYol />} />
          <Route path="/fransizca" element={<FransizcaBrailleMenu />} />
          <Route path="/fransizca/test" element={<TestYabanci dil="fr" />} />
          <Route path="/fransizca/:slug" element={<YabanciBrailleSayfa dil="fr" />} />
          <Route path="/ingilizce-braille" element={<Navigate to="/ingilizce" replace />} />
          <Route path="/ingilizce-braille/:slug" element={<IngilizceBrailleEskiYol />} />
          <Route path="/ingilizce" element={<IngilizceBrailleMenu />} />
          <Route path="/ingilizce/test" element={<TestYabanci dil="en" />} />
          <Route path="/ingilizce/:slug" element={<YabanciBrailleSayfa dil="en" />} />
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
