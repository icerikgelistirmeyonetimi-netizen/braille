// Müzik → BRF Yazım Editörü (ayrı sayfa)
// Araclar.jsx içindeki müzik editöründen modüler olarak ayrılmış sürüm.
// İki sekme: 1) Skor görünümü (SVG), 2) Braille çıktısı (BrailleGrid).
import React, { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useMuzikBrfEditor } from '../hooks/music-brf/useMuzikBrfEditor.jsx';
import { anahtarYAl, anahtarFontClassAl, bagTipiTieMi, bagYonunuHesapla, bagCizimNoktalari, bagHitRectHesapla, ledgerCizgileri } from '../utils/music-brf/musicScoreHelpers.jsx';
import MuzikScoreHeader from '../components/music/MuzikScoreHeader.jsx';
import MuzikBrfViewTabs from '../components/music/MuzikBrfViewTabs.jsx';
import MuzikBrfScoreEditor from '../components/music/MuzikBrfScoreEditor.jsx';
import MuzikBrailleOutput from '../components/music/MuzikBrailleOutput.jsx';

// Aşama 1: sabitler ve saf Braille helper fonksiyonları utils/music-brf altına taşındı.

// Editör sabitleri ve data-derived palet listeleri utils/music-brf/musicConstants.js içindedir.

export default function MuzikBrfYazim() {
  const [aktifSekme, setAktifSekme] = useState('skor'); // 'skor' | 'braille'
  const {
    muzikHeader,
    muzikOgeleri,
    muzikBaglar,
    muzikTupletler,
    aktifKategori,
    aktifArac,
    bekleyenModifier,
    bekleyenBag,
    popupAcik,
    anahtarPopupAcik,
    barlineMenu,
    setBarlineMenu,
    barlineTiklandi,
    inlineTimeSignatureEkle,
    inlineKeySignatureEkle,
    olcuCizgisiniDegistir,
    olcuCizgisiniSil,
    ifadeGirisi,
    bekleyenTuplet,
    seciliSureIdx,
    seciliOgeId,
    hoverBrailleOgeId,
    seciliBagId,
    hoverBrailleBagId,
    hoverCizgiBagId,
    muzikUyarilari,
    muzikOgeleriOlcuTamamlanmis,
    mevcutAnahtar,
    svgCizilecekOgeler,
    svgBeamGruplari,
    svgBeamGrupHaritasi,
    muzikSatirlar,
    muzikSatirOlculeri,
    svgYerlesimHaritasi,
    svgGlobalIndexBul,
    ogeXHesapla,
    satirIcindeBeamliMi,
    ilkSatirHeaderBilgisi,
    cevirSonuc,
    hucreler,
    brfExportMetni,
    brfHamMetin,
    brfOkunurOzet,
    brfOkumaDurumMesaji,
    brfOkumaSonucu,
    brailleSatirlari,
    olcuBrailleSonuclari,
    satirBrailleLejantlari,
    satirBrailleLejantMaplari,
    skorUstuHeaderSatirlari,
    baslangicBrailleBilgisi,
    baslangicBrailleLejantlari,
    baslangicBrailleLejantMapi,
    gorunenSatirBrailleLejantlari,
    gorunenSatirBrailleLejantMaplari,
    headerGosterimKartlari,
    canonicalBrfText,
    tekBrfMetni,
    hamBrfMetni,
    exportBrfMetni,
    copyBrfMetni,
    gorselOgeler,
    gorselBaglar,
    aktifBrfKaynakMetni,
    setMuzikHeader,
    setTimeSignature,
    setMuzikOgeleri,
    setMuzikTupletler,
    setPopupAcik,
    setAnahtarPopupAcik,
    setBekleyenBag,
    setIfadeGirisi,
    setBekleyenTuplet,
    setSeciliSureIdx,
    setSeciliOgeId,
    sonEklenenOgeId,
    sonKullanilanOktav,
    setSonKullanilanOktav,
    setHoverBrailleOgeId,
    setSeciliBagId,
    setHoverBrailleBagId,
    setHoverCizgiBagId,
    setAdimSure,
    notaEkle,
    notaEkleKonuma,
    sureSecildi,
    aracTikla,
    includeBarNumbers,
    setIncludeBarNumbers,
    brfDosyasiYukle,
    aracEkleHandler,
    anahtariDegistir,
    slurTamamla,
    notaSuresiniCiftTiklaDegistir,
    slurCancel,
    modifierCancel,
    tupletCancel,
    ifadeEkle,
    tupletTamamla,
    notaTiklandi,
    seciliOge,
    seciliEditorOgeId,
    seciliNotayiGuncelle,
    seciliOgeyiGuncelle,
    seciliOgeyiSil,
    seciliNotayiSusaCevir,
    seciliSusuNotayaCevir,
    anahtarGlyphAl,
    setAktifArac,
    setBekleyenModifier,
    setAktifKategori,
    brfImportKirli,
  } = useMuzikBrfEditor();

  const gosterilecekBrfMetni =
    brfImportKirli
      ? (canonicalBrfText || tekBrfMetni || brfExportMetni || '')
      : (brfHamMetin || canonicalBrfText || tekBrfMetni || brfExportMetni || '');

  const kopyalanacakBrfMetni =
    canonicalBrfText ||
    copyBrfMetni ||
    tekBrfMetni ||
    brfExportMetni ||
    brfHamMetin ||
    '';

  const indirilecekBrfMetni =
    canonicalBrfText ||
    exportBrfMetni ||
    tekBrfMetni ||
    brfExportMetni ||
    brfHamMetin ||
    '';

  // ─── Ölçü tamamlama, BRF çevirisi ve SVG skor layout sistemi ─────────────
  // Kural:
  // Bir zaman imzası varsa ölçü toplam süreyi doldurmalıdır.
  // Eksik kalan bölüm kullanıcıya ait gerçek nota/sus değilse otomatik sus ile tamamlanır.
  // Bu otomatik suslar state'e yazılmaz; SVG ve BRF çıktısı için hesaplanır.

  // Aşama 1: Braille metin/anlam/lejant saf helper'ları utils/music-brf altına taşındı.

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4">
      <PageHeader baslik="Müzik BRF Yazım" />
      <div className="space-y-4">
        <MuzikScoreHeader
          muzikHeader={muzikHeader}
          setMuzikHeader={setMuzikHeader}
          setTimeSignature={setTimeSignature}
          brfDosyasiYukle={async (file) => {
            await brfDosyasiYukle(file);
            setAktifSekme('braille');
          }}
          includeBarNumbers={includeBarNumbers}
          setIncludeBarNumbers={setIncludeBarNumbers}
        />

        <MuzikBrfViewTabs aktifSekme={aktifSekme} setAktifSekme={setAktifSekme} />

        {Array.isArray(muzikUyarilari) && muzikUyarilari.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {muzikUyarilari.slice(-12).map((uyari, idx) => (
              <div key={`muzik-uyari-${idx}`}>
                {uyari.message || String(uyari)}
              </div>
            ))}
          </div>
        )}

        {/* ── Skor sekmesi ── */}
        {aktifSekme === 'skor' && (
          <MuzikBrfScoreEditor
            aktifArac={aktifArac}
            bekleyenBag={bekleyenBag}
            bekleyenModifier={bekleyenModifier}
            bekleyenTuplet={bekleyenTuplet}
            ifadeGirisi={ifadeGirisi}
            setIfadeGirisi={setIfadeGirisi}
            sureSecildi={sureSecildi}
            notaEkle={notaEkle}
            notaEkleKonuma={notaEkleKonuma}
            ifadeEkle={ifadeEkle}
            aracEkleHandler={aracEkleHandler}
            tupletTamamla={tupletTamamla}
            aracTikla={aracTikla}
            slurTamamla={slurTamamla}
            slurCancel={() => { setBekleyenBag(null); setAktifArac(null); }}
            modifierCancel={() => setBekleyenModifier(null)}
            tupletCancel={() => setBekleyenTuplet(null)}
            setAktifArac={setAktifArac}
            setBekleyenBag={setBekleyenBag}
            muzikSatirlar={muzikSatirlar}
            olcuBrailleSonuclari={olcuBrailleSonuclari}
            skorUstuHeaderSatirlari={skorUstuHeaderSatirlari}
            svgGlobalIndexBul={svgGlobalIndexBul}
            svgYerlesimHaritasi={svgYerlesimHaritasi}
            svgCizilecekOgeler={svgCizilecekOgeler}
            svgBeamGruplari={svgBeamGruplari}
            ogeXHesapla={ogeXHesapla}
            satirIcindeBeamliMi={satirIcindeBeamliMi}
            ilkSatirHeaderBilgisi={ilkSatirHeaderBilgisi}
            muzikHeader={muzikHeader}
            muzikBaglar={gorselBaglar}
            hoverBrailleOgeId={hoverBrailleOgeId}
            setHoverBrailleOgeId={setHoverBrailleOgeId}
            seciliOgeId={seciliOgeId}
            setSeciliOgeId={setSeciliOgeId}
            hoverBrailleBagId={hoverBrailleBagId}
            setHoverBrailleBagId={setHoverBrailleBagId}
            hoverCizgiBagId={hoverCizgiBagId}
            setHoverCizgiBagId={setHoverCizgiBagId}
            seciliBagId={seciliBagId}
            setSeciliBagId={setSeciliBagId}
            sonKullanilanOktav={sonKullanilanOktav}
            setSonKullanilanOktav={setSonKullanilanOktav}
            seciliSureIdx={seciliSureIdx}
            setSeciliSureIdx={setSeciliSureIdx}
            popupAcik={popupAcik}
            setPopupAcik={setPopupAcik}
            anahtarPopupAcik={anahtarPopupAcik}
            setAnahtarPopupAcik={setAnahtarPopupAcik}
            barlineMenu={barlineMenu}
            setBarlineMenu={setBarlineMenu}
            barlineTiklandi={barlineTiklandi}
            inlineTimeSignatureEkle={inlineTimeSignatureEkle}
            inlineKeySignatureEkle={inlineKeySignatureEkle}
            olcuCizgisiniDegistir={olcuCizgisiniDegistir}
            olcuCizgisiniSil={olcuCizgisiniSil}
            seciliOge={seciliOge}
            seciliEditorOgeId={seciliEditorOgeId}
            seciliNotayiGuncelle={seciliNotayiGuncelle}
            seciliOgeyiGuncelle={seciliOgeyiGuncelle}
            mevcutAnahtar={mevcutAnahtar}
            anahtarGlyphAl={anahtarGlyphAl}
            anahtarYAl={anahtarYAl}
            anahtarFontClassAl={anahtarFontClassAl}
            muzikOgeleri={gorselOgeler}
            notaTiklandi={notaTiklandi}
            notaSuresiniCiftTiklaDegistir={notaSuresiniCiftTiklaDegistir}
            bagTipiTieMi={bagTipiTieMi}
            bagYonunuHesapla={bagYonunuHesapla}
            bagCizimNoktalari={bagCizimNoktalari}
            bagHitRectHesapla={bagHitRectHesapla}
            ledgerCizgileri={ledgerCizgileri}
            gorunenSatirBrailleLejantMaplari={gorunenSatirBrailleLejantMaplari}
            gorunenSatirBrailleLejantlari={gorunenSatirBrailleLejantlari}
            baslangicBrailleBilgisi={baslangicBrailleBilgisi}
            baslangicBrailleLejantlari={baslangicBrailleLejantlari}
            baslangicBrailleLejantMapi={baslangicBrailleLejantMapi}
            seciliOgeyiSil={seciliOgeyiSil}
            seciliNotayiSusaCevir={seciliNotayiSusaCevir}
            seciliSusuNotayaCevir={seciliSusuNotayaCevir}
            sonEklenenOgeId={sonEklenenOgeId}
            anahtariDegistir={anahtariDegistir}
          />
        )}


        {aktifSekme === 'braille' && (
          <MuzikBrailleOutput
            hucreler={hucreler}
            cevirSonuc={cevirSonuc}
            brfExportMetni={brfExportMetni}
            brfHamMetin={brfHamMetin}
            hamBrfMetni={gosterilecekBrfMetni}
            exportBrfMetni={indirilecekBrfMetni}
            copyBrfMetni={kopyalanacakBrfMetni}
            tekBrfMetni={tekBrfMetni}
            canonicalBrfText={canonicalBrfText}
            aktifBrfKaynakMetni={aktifBrfKaynakMetni}
            brfImportKirli={brfImportKirli}
            brfOkunurOzet={brfOkunurOzet}
            brfOkumaDurumMesaji={brfOkumaDurumMesaji}
            brfOkumaSonucu={brfOkumaSonucu}
            brailleSatirlari={brailleSatirlari}
            gorunenSatirBrailleLejantlari={gorunenSatirBrailleLejantlari}
            setHoverBrailleOgeId={setHoverBrailleOgeId}
          />
        )}
      </div>
    </div>
  );
}
