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
          <Route path="/ayarlar" element={<Ayarlar />} />
        </Routes>
      </main>
    </div>
  );
}
