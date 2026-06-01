// Müzik → BRF Yazım Editörü (ayrı sayfa)
// Araclar.jsx içindeki müzik editöründen modüler olarak ayrılmış sürüm.
// İki sekme: 1) Skor görünümü (SVG), 2) Braille çıktısı (BrailleGrid).
import React, { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useMuzikBrfEditor } from '../hooks/music-brf/useMuzikBrfEditor.jsx';
import { anahtarYAl, anahtarFontClassAl, bagTipiTieMi, bagYonunuHesapla, bagCizimNoktalari, bagHitRectHesapla, ledgerCizgileri } from '../utils/music-brf/musicScoreHelpers.jsx';
import MuzikBrfViewTabs from '../components/music/MuzikBrfViewTabs.jsx';
import MuzikBrfScoreEditor from '../components/music/MuzikBrfScoreEditor.jsx';
import MuzikBrailleOutput from '../components/music/MuzikBrailleOutput.jsx';
import { brailleMetniOlustur } from '../utils/music-brf/brailleText.js';

// Aşama 1: sabitler ve saf Braille helper fonksiyonları utils/music-brf altına taşındı.

// Editör sabitleri ve data-derived palet listeleri utils/music-brf/musicConstants.js içindedir.

export default function MuzikBrfYazim() {
  const [aktifSekme, setAktifSekme] = useState('skor'); // 'skor' | 'braille'
  const [brailleKopyalandi, setBrailleKopyalandi] = useState(false);
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
    donanimiDegistir,
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
    brfDosyasiYukle,
    brfMetniYukle,
    aracEkleHandler,
    anahtariDegistir,
    slurTamamla,
    notaSuresiniCiftTiklaDegistir,
    slurCancel,
    modifierCancel,
    tupletCancel,
    ifadeEkle,
    tupletTamamla,
    tupletSil,
    notaTiklandi,
    seciliOge,
    seciliEditorOgeId,
    seciliNotayiGuncelle,
    seciliOgeyiGuncelle,
    seciliOgeyiSil,
    seciliNotaModifierSil,
    seciliNotaModifierGuncelle,
    seciliBagiSil,
    seciliNotayiSusaCevir,
    seciliSusuNotayaCevir,
    anahtarGlyphAl,
    setAktifArac,
    setBekleyenModifier,
    setAktifKategori,
    brfImportKirli,
    voltaEkleModu,
    voltaEkleBaslangicId,
    voltaEkleModuBaslat,
    voltaEkleModIptal,
    voltaBarlineEkle,
    voltaMeasureEkle,
    voltaSil,
    voltaGuncelle,
  } = useMuzikBrfEditor();

  const olcuSayisi = (muzikSatirOlculeri || []).reduce((sum, row) => sum + (row?.length || 0), 0);

  // Skor çizim alanını gerçek PDF olarak indir (yazdırma diyaloğu değil)
  const skorPdfIndir = async () => {
    const skorEl = document.querySelector('.muzik-skor-scroll');
    if (!skorEl) return;
    try {
      const { skorAlaniPdfIndir } = await import('../utils/music-brf/scorePdfExport.js');
      await skorAlaniPdfIndir(skorEl, { dosyaAdi: muzikHeader?.title || 'muzik-skor' });
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      alert('PDF oluşturulamadı: ' + (err?.message || err));
    }
  };

  const gosterilecekBrfMetni =
    brfImportKirli
      ? (canonicalBrfText || tekBrfMetni || brfExportMetni || '')
      : (brfHamMetin || canonicalBrfText || tekBrfMetni || brfExportMetni || '');

  const kopyalanacakBrfMetni =
    brfExportMetni ||
    tekBrfMetni ||
    copyBrfMetni ||
    canonicalBrfText ||
    brfHamMetin ||
    '';

  // İndirme, BRF okuma sekmesindeki export önizlemesi/Braille Kopyala ile AYNI
  // kaynağı kullanmalı (başlık/besteci/tempo canlı header'dan gelsin).
  // brfExportMetni == canonicalEditorBrfText (canlı muzikHeader ile üretilir);
  // canonicalBrfText (canonicalBrfResult) header'ı içermeyebilir.
  const indirilecekBrfMetni =
    brfExportMetni ||
    tekBrfMetni ||
    canonicalBrfText ||
    brfHamMetin ||
    '';

  // ─── Ölçü tamamlama, BRF çevirisi ve SVG skor layout sistemi ─────────────
  // Kural:
  // Bir zaman imzası varsa ölçü toplam süreyi doldurmalıdır.
  // Eksik kalan bölüm kullanıcıya ait gerçek nota/sus değilse otomatik sus ile tamamlanır.
  // Bu otomatik suslar state'e yazılmaz; SVG ve BRF çıktısı için hesaplanır.

  // Aşama 1: Braille metin/anlam/lejant saf helper'ları utils/music-brf altına taşındı.

  return (
    <div className="muzik-brf-sayfa w-full mx-auto max-w-[1600px] px-4 py-4 min-w-0 overflow-x-hidden">
      <PageHeader baslik="Müzik BRF Yazım" />
      <div className="space-y-4">
        <MuzikBrfViewTabs
          aktifSekme={aktifSekme}
          setAktifSekme={setAktifSekme}
          onHazirParcaSec={async (parca) => {
            await brfMetniYukle(parca.brf, parca.ad);
            setAktifSekme('skor');
          }}
        />

        {Array.isArray(muzikUyarilari) && muzikUyarilari.length > 0 && (
          <div
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Müzik uyarıları"
          >
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
            setMuzikHeader={setMuzikHeader}
            setTimeSignature={setTimeSignature}
            brfDosyasiYukle={async (file) => { await brfDosyasiYukle(file); setAktifSekme('braille'); }}
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
            muzikSatirOlculeri={muzikSatirOlculeri}
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
            seciliNotaModifierSil={seciliNotaModifierSil}
            seciliNotaModifierGuncelle={seciliNotaModifierGuncelle}
            seciliBagiSil={seciliBagiSil}
            muzikTupletler={muzikTupletler}
            tupletSil={tupletSil}
            seciliNotayiSusaCevir={seciliNotayiSusaCevir}
            seciliSusuNotayaCevir={seciliSusuNotayaCevir}
            sonEklenenOgeId={sonEklenenOgeId}
            anahtariDegistir={anahtariDegistir}
            setTimeSignature={setTimeSignature}
            donanimiDegistir={donanimiDegistir}
            olcuSayisi={olcuSayisi}
            voltaEkleModu={voltaEkleModu}
            voltaEkleBaslangicId={voltaEkleBaslangicId}
            voltaEkleModuBaslat={voltaEkleModuBaslat}
            voltaEkleModIptal={voltaEkleModIptal}
            voltaBarlineEkle={voltaBarlineEkle}
            voltaMeasureEkle={voltaMeasureEkle}
            voltaSil={voltaSil}
            voltaGuncelle={voltaGuncelle}
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

        {/* ── Alt eylem çubuğu (Araclar deseni: .controls + .btn) ── */}
        <div className="controls">
          {/* BRF İndir */}
          <button
            type="button"
            className="btn"
            onClick={() => {
              const metin = indirilecekBrfMetni;
              if (!metin) return;
              const blob = new Blob([metin], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const baslik = (muzikHeader?.title || 'muzik').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').trim() || 'muzik';
              a.download = `${baslik}.brf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
            aria-label="BRF İndir"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>
            <span className="btn-yazi">BRF İndir</span>
          </button>

          {/* BRF Oku — bilgisayardan .brf dosyası yükle */}
          <button
            type="button"
            className="btn"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.brf,.txt';
              input.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await brfDosyasiYukle(file);
                setAktifSekme('skor');
              };
              input.click();
            }}
            aria-label="BRF Yükle"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span className="btn-yazi">BRF Yükle</span>
          </button>

          {/* PDF İndir — tarayıcı yazdırma ile PDF */}
          <button
            type="button"
            className="btn"
            onClick={skorPdfIndir}
            aria-label="PDF İndir"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span className="btn-yazi">PDF İndir</span>
          </button>

          {/* Braille Kopyala — Unicode braille (⠿) olarak panoya kopyalar */}
          <button
            type="button"
            className="btn"
            onClick={async () => {
              // BRF okuma sekmesindeki "BRF export" ile aynı braille metin (Unicode ⠿, satır düzenli)
              const braille = brfExportMetni || canonicalBrfText || tekBrfMetni || brfHamMetin || brailleMetniOlustur(hucreler);
              try {
                await navigator.clipboard.writeText(braille);
              } catch {
                const ta = document.createElement('textarea');
                ta.value = braille;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch { /* yoksay */ }
                ta.remove();
              }
              setBrailleKopyalandi(true);
              setTimeout(() => setBrailleKopyalandi(false), 1600);
            }}
            aria-label={brailleKopyalandi ? 'Braille panoya kopyalandı' : 'Braille olarak kopyala'}
          >
            {brailleKopyalandi ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
            <span className="btn-yazi">{brailleKopyalandi ? 'Kopyalandı ✓' : 'Braille Kopyala'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
