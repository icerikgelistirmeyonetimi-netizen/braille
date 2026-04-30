import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import TestKuran from './pages/TestKuran.jsx';
import MatematikRakamEgitimi from './pages/MatematikRakamEgitimi.jsx';
import MatematikSembolEgitimi from './pages/MatematikSembolEgitimi.jsx';
import MatematikGeometriEgitimi from './pages/MatematikGeometriEgitimi.jsx';
import MatematikIfadeOkuma from './pages/MatematikIfadeOkuma.jsx';
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
import TestMuzik from './pages/TestMuzik.jsx';
import { sallamayiBaslat } from './utils/sallama.js';

export default function App() {
  useEffect(() => { sallamayiBaslat(); }, []);
  return (
    <div className="app">
      <a href="#main" className="skip-link">İçeriğe atla</a>
      <main id="main">
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
          <Route path="/kuran-kelimeler" element={<KuranKelimeOkumaSayfa />} />
          <Route path="/test-kuran" element={<TestKuran />} />
          <Route path="/mat-rakamlar" element={<MatematikRakamEgitimi />} />
          <Route path="/mat-semboller" element={<MatematikSembolEgitimi />} />
          <Route path="/mat-geometri" element={<MatematikGeometriEgitimi />} />
          <Route path="/mat-ifadeler" element={<MatematikIfadeOkuma />} />
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
          <Route path="/test-muzik" element={<TestMuzik />} />
          <Route path="/ayarlar" element={<Ayarlar />} />
        </Routes>
      </main>
    </div>
  );
}
