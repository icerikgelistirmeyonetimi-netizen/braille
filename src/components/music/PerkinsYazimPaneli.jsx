// Perkins Klavye Braille Yazım Paneli — çift Enter ile açılan "yazım modu".
// Panel, aktif ölçü satırının altına React Portal ile basılır (.muzik-olcu-braille-blok
// son çocuğu). İmleç (caret) = seciliOgeId; yazma/silme/gezinme imleç üzerinden.
//
// DECODE: reader'ın kanonik ters haritası (musicBrailleReverseMapsOlustur) kullanılır →
// notalar, suslar, oktav/aksidental önekleri, özel ölçü çizgileri, slur/tie ve ÇOK HÜCRELİ
// modifier'lar (dinamik/nüans/süsleme) tanınır. Çözüm "maximal-munch": her hücre tampona
// eklenir; daha uzun bir token oluşabiliyorsa kısa süre beklenir (≈550ms), yoksa en uzun
// tam eşleşme uygulanır. Önek kuralları (oktav/aksidental/öncesi-modifier) bir sonraki
// notaya iliştirilir; "sonrası" nüanslar son notaya iliştirilir.
//
// F=1 D=2 S=3 / J=4 K=5 L=6 akor · Boşluk ölçü çizgisi · ←→ imleç · ⌫/Del sil · F2 mod · Esc çık
// Textarea hedefi: MuzikScoreSvg document capture handler'ı textarea'yı atlar (~satır 755).
import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cellToUnicodeBraille } from '../../utils/music-brf/import/musicBrailleCellUtils.js';
import { musicBrailleReverseMapsOlustur } from '../../utils/music-brf/musicBrailleReverseMaps.js';
import { muzikNotaSkorOgesi } from '../../utils/music/musicScoreFactory.js';
import { usePianoNotePreview } from '../../hooks/music-brf/usePianoNotePreview.js';
import { konus } from '../../utils/ses.js';

// ─── Perkins tuş → nokta eşlemesi ────────────────────────────────────────────
const PERKINS = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };

// Çok-hücreli işaret bekleme süreleri (ms):
// - SAF ÖNEK (tampon tek başına anlamsız; ör. dinamik söz işareti [3,4,5]): tamamlayıcı
//   hücre insan hızında yazılabilsin diye uzun beklenir.
// - UZATILABILIR (tampon TAM bir yorum taşır ama daha uzun token da mümkün; ör. forte ⊂
//   çift forte): kısa beklenir, devam gelmezse mevcut tam yorum uygulanır.
const BEKLE_TAMAMLAYICI = 5000;
const BEKLE_UZATILABILIR = 1200;

// ─── Kanonik ters harita (reader ile aynı kapsam; modül yüklenince bir kez) ──
const REVERSE = musicBrailleReverseMapsOlustur();

// dot dizisi ↔ "1-2-6" dash anahtarı
const dotsToDash = (dots) => (Array.isArray(dots) ? dots : []).slice().sort((a, b) => a - b).join('-');
const dashToDots = (dash) => (dash ? dash.split('-').map(Number).filter((n) => n >= 1 && n <= 6) : []);
const dashUnicode = (dash) => cellToUnicodeBraille(dashToDots(dash));

function sureKisa(sureAd) {
  return String(sureAd || '').replace(/ nota$/i, '').replace(/-/g, "'");
}

// ─── Tek hücre çözümü (nota/sus/oktav/aksidental/slur-tie/uzatma noktası) ────
function tekHucreCoz(dash) {
  const nota = REVERSE.noteByCellKey.get(dash);
  if (nota?.length) {
    return {
      tip: 'nota',
      notaAd: nota[0].notaAd,
      sureIdx: nota[0].sureIndeksi,
      sureler: [...new Set(nota.map((m) => sureKisa(m.sureAd)))],
    };
  }
  const sus = REVERSE.restByCellKey.get(dash);
  if (sus?.length) {
    return {
      tip: 'sus',
      sureIdx: sus[0].sureIndeksi,
      sureler: [...new Set(sus.map((m) => sureKisa(m.sureAd)))],
    };
  }
  const okt = REVERSE.octaveByCellKey.get(dash);
  if (okt !== undefined) return { tip: 'oktav', oktav: okt };

  const acc = REVERSE.accidentalByCellKey.get(dash);
  if (acc) return { tip: 'accidental', accidental: acc.accidental, label: acc.label };

  const st = REVERSE.slurTieByCellKey.get(dash);
  if (st) return { tip: 'bag', label: st.label };

  if (dash === '3') return { tip: 'dot', label: 'uzatma noktası' };

  return null;
}

// Modifier dizisi (dinamik/nüans/süsleme) — '|' ayraçlı anahtar
function modifierBak(dashDizi) {
  const seqKey = dashDizi.join('|');
  const tam = REVERSE.modifierByCellKey.get(seqKey) || null;
  let onek = false;
  if (dashDizi.length < (REVERSE.modifierMaxLen || 1)) {
    const prefix = seqKey + '|';
    for (const k of REVERSE.modifierByCellKey.keys()) {
      if (k.startsWith(prefix)) { onek = true; break; }
    }
  }
  return { tam, onek };
}

// Özel ölçü çizgisi (final/tekrar/bölüm) — '-' ile birleşik anahtar
function barlineBak(dashDizi) {
  const key = dashDizi.join('-');
  const tam = REVERSE.barlineByCellKey.get(key) || null;
  let onek = false;
  const prefix = key + '-';
  for (const k of REVERSE.barlineByCellKey.keys()) {
    if (k.length > key.length && k.startsWith(prefix)) { onek = true; break; }
  }
  return { tam, onek };
}

// Yapısal çok-hücreli işaret (volta / cümle bağı / tuplet) — barlineBak ile aynı anahtar biçimi
function yapiBak(dashDizi) {
  const map = REVERSE.yapiByCellKey;
  if (!map) return { tam: null, onek: false };
  const key = dashDizi.join('-');
  const tam = map.get(key) || null;
  let onek = false;
  const prefix = key + '-';
  for (const k of map.keys()) {
    if (k.length > key.length && k.startsWith(prefix)) { onek = true; break; }
  }
  return { tam, onek };
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────
export default function PerkinsYazimPaneli({
  acik,
  onKapat,
  muzikHeader,
  setMuzikHeader,
  setTimeSignature,
  notaEkleKonuma,
  susEkleKonuma,
  manuelOlcuCizgisiEkle,
  ogeleriSil,
  seciliNotayiGuncelle,
  perkinsModifierEkle,
  seciliOgeId,
  setSeciliOgeId,
  sonKullanilanOktav,
  sonEklenenOgeId,
  svgYerlesimHaritasi,
  muzikSatirSayisi,
}) {
  const [tab, setTab]               = useState('notalar'); // 'notalar' | 'baslik'
  const [mod, setMod]               = useState('ekleme');  // 'ekleme' | 'duzeltme'
  const [aktifDotlar, setAktifDotlar] = useState(new Set());
  const [sonDecodeMetni, setSonDecodeMetni] = useState('');
  const [pendingBilgi, setPendingBilgi] = useState('');   // "diyez", "4. oktav", "forte → sonraki nota"
  const [gecmis, setGecmis]         = useState([]);
  const [hedefNode, setHedefNode]   = useState(null);
  const [caretEtiket, setCaretEtiket] = useState('');
  const [olcuHucreleri, setOlcuHucreleri]   = useState([]); // imlecin bulunduğu ölçünün canlı braille hücreleri
  const [gosterilenOlcuNo, setGosterilenOlcuNo] = useState(null);

  const pressedRef     = useRef(new Set());
  const pendingRef     = useRef(new Set());
  const timerRef       = useRef(null);
  const caretIdRef     = useRef(null);   // imleç
  const modRef         = useRef('ekleme');
  const perkinsRef     = useRef(null);
  const acildiRef      = useRef(false);
  const odakIstendiRef = useRef(false); // kullanıcı yazım alanıyla etkileşimde mi (remount sonrası odak için)

  // Yazım alanı ref-callback'i: portal yeniden hedeflenince (silme/yazım satır değiştirir →
  // createPortal konteyneri değişir) textarea YENİDEN MOUNT olur ve odak gövdeye kayar. Bu
  // callback yeni node mount olunca tam o anda çalışır → kullanıcı yazım alanındaysa odağı
  // geri verir (rAF/effect tabanlı geri-alma remount'ı kaçırabiliyordu). Tarayıcıda doğrulandı.
  const yazimAlaniRef = useCallback((el) => {
    perkinsRef.current = el;
    if (el && odakIstendiRef.current && document.activeElement !== el) {
      requestAnimationFrame(() => {
        if (perkinsRef.current === el && odakIstendiRef.current && document.activeElement !== el) {
          try { el.focus(); } catch { /* */ }
        }
      });
    }
  }, []);

  // Maximal-munch çözücü durumu
  const bekleyenDiziRef     = useRef([]);   // dash[]
  const cozTimerRef         = useRef(null);
  const pendingOktavRef     = useRef(null); // sonraki notanın oktavı
  const pendingAccidentalRef = useRef(null); // sonraki notanın arızası
  const pendingModsRef      = useRef([]);   // sonraki notaya "öncesi" modifier kayıtları

  const { playNote } = usePianoNotePreview({ enabled: true });

  useEffect(() => { modRef.current = mod; }, [mod]);
  useEffect(() => { if (seciliOgeId) caretIdRef.current = seciliOgeId; }, [seciliOgeId]);

  // ── Aktif öğe → satır indeksi + ölçü numarası ──────────────────────────────
  const aktifId = seciliOgeId || sonEklenenOgeId;
  // KRİTİK: Panel KONUMU (portal hedefi) yalnız YAZIM konumunu (sonEklenenOgeId) izler —
  // imleç (seciliOgeId) gezinme/silme ile değişince DEĞİL. Aksi halde her ok/silme satır
  // değiştirdiğinde createPortal hedef konteyneri değişir → textarea unmount/remount olur →
  // o anki ok/Backspace tuşu DÜŞER, odak gövdeye kayıp skorun kendi handler'ına gider →
  // gezinme/silme "efektif çalışmaz" (atlama/tekrar). Yazınca panel yine ilgili satıra gelir.
  const aktifSatirIdx = useMemo(() => {
    if (sonEklenenOgeId && svgYerlesimHaritasi?.get) {
      const yer = svgYerlesimHaritasi.get(sonEklenenOgeId);
      if (Number.isFinite(Number(yer?.satirIdx))) return Number(yer.satirIdx);
    }
    return null;
  }, [sonEklenenOgeId, svgYerlesimHaritasi]);
  const aktifOlcuNo = useMemo(() => {
    if (aktifId && svgYerlesimHaritasi?.get) {
      const m = svgYerlesimHaritasi.get(aktifId)?.measureIndex;
      if (Number.isFinite(Number(m))) return Number(m) + 1;
    }
    return null;
  }, [aktifId, svgYerlesimHaritasi]);

  // ── Portal hedefi ───────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!acik) { setHedefNode(null); return; }
    const bloklar = document.querySelectorAll('.muzik-skor-scroll .muzik-olcu-braille-blok');
    if (!bloklar.length) { setHedefNode(null); return; }
    const idx = aktifSatirIdx == null
      ? bloklar.length - 1
      : Math.min(Math.max(aktifSatirIdx, 0), bloklar.length - 1);
    setHedefNode(bloklar[idx] || null);
  }, [acik, aktifSatirIdx, muzikSatirSayisi]);

  useEffect(() => {
    if (!acik) return undefined;
    const id = requestAnimationFrame(() => setCaretEtiket(ogeEtiketiAl(seciliOgeId)));
    return () => cancelAnimationFrame(id);
  }, [acik, seciliOgeId, gecmis.length]);

  // İmlecin BULUNDUĞU ölçünün braille hücrelerini skor overlay'inden CANLI oku → yazım alanında
  // göster. Böylece: (a) silince hücre buradan da kalkar, (b) hangi ölçüdeysem onun braille'i
  // görünür, (c) yeni ölçüye geçince temizlenip yeni ölçünün hücreleri gelir. Skor değişimi
  // (svgYerlesimHaritasi/muzikSatirSayisi/gecmis) ve imleç (seciliOgeId) tetikler; rAF ile DOM güncel.
  useEffect(() => {
    if (!acik) { setOlcuHucreleri([]); setGosterilenOlcuNo(null); return undefined; }
    const id = requestAnimationFrame(() => {
      const harita = svgYerlesimHaritasi;
      // İmleç olarak seciliOgeId (commit'lenmiş prop) — caret etiketiyle TUTARLI (caretIdRef
      // hızlı gezinmede ileride olabilir). İnsan hızında ikisi özdeş.
      const caretId = seciliOgeId || sonEklenenOgeId;
      const mi = (caretId && harita?.get) ? harita.get(caretId)?.measureIndex : null;
      if (mi == null) { setOlcuHucreleri([]); setGosterilenOlcuNo(null); return; }
      const cells = [];
      document.querySelectorAll('.muzik-braille-hucre[data-oge-id]').forEach((el) => {
        const oid = el.getAttribute('data-oge-id');
        if (oid && harita.get(oid)?.measureIndex === mi) {
          cells.push({ ogeId: oid, unicode: dashUnicode(el.getAttribute('data-braille-dots') || ''), label: el.getAttribute('aria-label') || '', caretMi: oid === caretId });
        }
      });
      // Hücreler AYNIYSA state'i değiştirme → svgYerlesimHaritasi her render yeni referans
      // olduğundan setOlcuHucreleri(yeni dizi) sonsuz render döngüsü + tüm rAF iptaline yol açıyordu.
      setOlcuHucreleri((prev) => (prev.length === cells.length
        && prev.every((p, i) => p.ogeId === cells[i].ogeId && p.unicode === cells[i].unicode && p.caretMi === cells[i].caretMi)
        ? prev : cells));
      setGosterilenOlcuNo(mi + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [acik, seciliOgeId, sonEklenenOgeId, svgYerlesimHaritasi, muzikSatirSayisi, gecmis.length]);

  useEffect(() => {
    if (acik && !acildiRef.current) {
      acildiRef.current = true;
      konus('Braille yazım modu açıldı. F D S, J K L ile nota yazın. Dinamik, nüans ve süslemeler de tanınır. Boşluk ölçü çizgisi, ok tuşları imleç, F2 düzeltme, Escape çıkış.', { kesintiyle: true });
    }
    if (!acik) {
      acildiRef.current = false;
      // temizle
      bekleyenDiziRef.current = [];
      pendingOktavRef.current = null;
      pendingAccidentalRef.current = null;
      pendingModsRef.current = [];
      clearTimeout(cozTimerRef.current);
    }
  }, [acik]);

  useEffect(() => {
    if (!acik || !hedefNode) return undefined;
    hedefNode.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    if (tab === 'notalar') {
      const id = requestAnimationFrame(() => perkinsRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [acik, hedefNode, tab]);

  const kapat = useCallback(() => {
    konus('Braille yazım modu kapatıldı', { kesintiyle: true });
    onKapat?.();
  }, [onKapat]);

  // ── Duyur + geçmişe ekle ────────────────────────────────────────────────────
  const duyurVeGecmis = useCallback((metni, unicode, tip) => {
    setSonDecodeMetni(metni);
    konus(metni, { kesintiyle: true });
    setGecmis((prev) => [...prev.slice(-29), { unicode, metni, tip }]);
  }, []);

  const pendingOzet = useCallback(() => {
    const parcalar = [];
    if (pendingOktavRef.current != null) parcalar.push(`${pendingOktavRef.current}. oktav`);
    if (pendingAccidentalRef.current) {
      const ad = { sharp: 'diyez', flat: 'bemol', natural: 'natürel' }[pendingAccidentalRef.current] || pendingAccidentalRef.current;
      parcalar.push(ad);
    }
    pendingModsRef.current.forEach((k) => parcalar.push(k?.ad || 'işaret'));
    setPendingBilgi(parcalar.length ? `${parcalar.join(' + ')} → sonraki nota` : '');
  }, []);

  // ── Uygula: tek hücre token ─────────────────────────────────────────────────
  const uygulaTekil = useCallback((tok, dash) => {
    const unicode = dashUnicode(dash);
    const duzeltme = modRef.current === 'duzeltme';

    if (tok.tip === 'oktav') {
      pendingOktavRef.current = tok.oktav;
      duyurVeGecmis(`${tok.oktav}. oktav işareti`, unicode, 'oktav');
      pendingOzet();
      return;
    }
    if (tok.tip === 'accidental') {
      if (duzeltme && caretIdRef.current) {
        seciliNotayiGuncelle?.({ accidental: tok.accidental });
        duyurVeGecmis(`${tok.label} (düzeltme)`, unicode, 'accidental');
      } else {
        pendingAccidentalRef.current = tok.accidental;
        duyurVeGecmis(tok.label, unicode, 'accidental');
        pendingOzet();
      }
      return;
    }
    if (tok.tip === 'nota') {
      const metni = `${tok.notaAd}, ${tok.sureler.join(' veya ')}`;
      const oktav = pendingOktavRef.current ?? sonKullanilanOktav ?? 4;
      if (duzeltme && caretIdRef.current) {
        seciliNotayiGuncelle?.({
          notaAd: tok.notaAd,
          sureIndeksi: tok.sureIdx,
          ...(pendingOktavRef.current != null ? { oktav } : {}),
          ...(pendingAccidentalRef.current ? { accidental: pendingAccidentalRef.current } : {}),
        });
        duyurVeGecmis(`düzeltildi: ${metni}`, unicode, 'nota');
      } else {
        const oge = notaEkleKonuma?.({ notaAd: tok.notaAd, oktav, sureIdx: tok.sureIdx, insertAfterId: caretIdRef.current });
        if (oge?.id) {
          caretIdRef.current = oge.id;
          if (pendingAccidentalRef.current) seciliNotayiGuncelle?.({ accidental: pendingAccidentalRef.current });
          pendingModsRef.current.forEach((k) => perkinsModifierEkle?.(oge.id, k, 'oncesi'));
        }
        duyurVeGecmis(metni, unicode, 'nota');
      }
      try { playNote(muzikNotaSkorOgesi('perkins-tmp', tok.notaAd, tok.sureIdx, { oktav })); } catch { /* */ }
      pendingOktavRef.current = null;
      pendingAccidentalRef.current = null;
      pendingModsRef.current = [];
      setPendingBilgi('');
      return;
    }
    if (tok.tip === 'sus') {
      const metni = `${tok.sureler.join(' veya ')} sus`;
      if (duzeltme && caretIdRef.current) {
        seciliNotayiGuncelle?.({ sureIndeksi: tok.sureIdx });
        duyurVeGecmis(`düzeltildi: ${metni}`, unicode, 'sus');
      } else {
        const oge = susEkleKonuma?.({ sureIdx: tok.sureIdx, insertAfterId: caretIdRef.current });
        if (oge?.id) caretIdRef.current = oge.id;
        duyurVeGecmis(metni, unicode, 'sus');
      }
      pendingOktavRef.current = null;
      pendingAccidentalRef.current = null;
      pendingModsRef.current = [];
      setPendingBilgi('');
      return;
    }
    if (tok.tip === 'dot') {
      if (caretIdRef.current) seciliNotayiGuncelle?.({ dotted: true });
      duyurVeGecmis('uzatma noktası', unicode, 'dot');
      return;
    }
    if (tok.tip === 'bag') {
      // slur/tie — iki nota gerektirir; şimdilik tanı + duyur (uygulama editörden).
      duyurVeGecmis(tok.label, unicode, 'bag');
      return;
    }
  }, [duyurVeGecmis, pendingOzet, sonKullanilanOktav, notaEkleKonuma, susEkleKonuma, seciliNotayiGuncelle, perkinsModifierEkle, playNote]);

  // ── Uygula: modifier (dinamik/nüans/süsleme) ────────────────────────────────
  const uygulaModifier = useCallback((entry, dashDizi) => {
    const unicode = dashDizi.map(dashUnicode).join('');
    const ad = entry.ad || entry.kayit?.ad || 'işaret';
    if (entry.yon === 'sonrasi') {
      if (caretIdRef.current) perkinsModifierEkle?.(caretIdRef.current, entry.kayit, 'sonrasi');
      duyurVeGecmis(ad, unicode, 'modifier');
    } else if (modRef.current === 'duzeltme' && caretIdRef.current) {
      perkinsModifierEkle?.(caretIdRef.current, entry.kayit, 'oncesi');
      duyurVeGecmis(`${ad} (düzeltme)`, unicode, 'modifier');
    } else {
      pendingModsRef.current.push(entry.kayit);
      duyurVeGecmis(`${ad} → sonraki nota`, unicode, 'modifier');
      pendingOzet();
    }
  }, [duyurVeGecmis, pendingOzet, perkinsModifierEkle]);

  // ── Uygula: özel ölçü çizgisi ───────────────────────────────────────────────
  const uygulaBarline = useCallback((entry, dashDizi) => {
    const unicode = dashDizi.map(dashUnicode).join('');
    const oge = manuelOlcuCizgisiEkle?.(caretIdRef.current);
    if (oge?.id) caretIdRef.current = oge.id;
    duyurVeGecmis(entry.label || 'ölçü çizgisi', unicode, 'barline');
  }, [duyurVeGecmis, manuelOlcuCizgisiEkle]);

  // ── Uygula: yapısal işaret (volta / cümle bağı / tuplet) — tanı + duyur ──────
  // (Tam yerleştirme editörden yapılır: volta ölçü-aralığı, bağ iki nota, tuplet grubu.)
  const uygulaYapi = useCallback((entry, dashDizi) => {
    const unicode = dashDizi.map(dashUnicode).join('');
    const tipClass = /volta/.test(entry.tip || '') ? 'barline' : 'modifier';
    duyurVeGecmis(entry.label || 'işaret', unicode, tipClass);
  }, [duyurVeGecmis]);

  const bilinmeyen = useCallback((dash) => {
    duyurVeGecmis(`bilinmeyen hücre: ${dash || 'boş'}`, dashUnicode(dash), 'bilinmeyen');
  }, [duyurVeGecmis]);

  // ── Maximal-munch: bekleyen diziyi en uzun ön-ek eşleşmeleriyle tüketir ─────
  const zorlaCoz = useCallback(() => {
    clearTimeout(cozTimerRef.current);
    let dizi = bekleyenDiziRef.current.slice();
    const maxLen = Math.min(Math.max(REVERSE.modifierMaxLen || 1, REVERSE.yapiMaxLen || 1, 3), 8);
    while (dizi.length) {
      // En uzun çok-hücreli (modifier/barline/yapı) ön-ek eşleşmesi
      let uygulandi = false;
      for (let len = Math.min(dizi.length, maxLen); len >= 2; len -= 1) {
        const parca = dizi.slice(0, len);
        const mdf = modifierBak(parca);
        if (mdf.tam) { uygulaModifier(mdf.tam, parca); dizi = dizi.slice(len); uygulandi = true; break; }
        const bar = barlineBak(parca);
        if (bar.tam) { uygulaBarline(bar.tam, parca); dizi = dizi.slice(len); uygulandi = true; break; }
        const yap = yapiBak(parca);
        if (yap.tam) { uygulaYapi(yap.tam, parca); dizi = dizi.slice(len); uygulandi = true; break; }
      }
      if (uygulandi) { bekleyenDiziRef.current = dizi; continue; }
      // Çok-hücreli yok → ilk hücreyi tekil çöz (nota/sus/oktav/arıza/nokta), olmazsa
      // tek-hücreli modifier (stakato/tril/grupeto) ya da yapı (tek-hücre üçleme), o da olmazsa bilinmeyen.
      const ilk = dizi[0];
      const tok = tekHucreCoz(ilk);
      if (tok) {
        uygulaTekil(tok, ilk);
      } else {
        const md = REVERSE.modifierByCellKey.get(ilk);
        const yp = REVERSE.yapiByCellKey?.get(ilk);
        if (md) uygulaModifier(md, [ilk]);
        else if (yp) uygulaYapi(yp, [ilk]);
        else bilinmeyen(ilk);
      }
      dizi = dizi.slice(1);
      bekleyenDiziRef.current = dizi;
    }
  }, [uygulaModifier, uygulaBarline, uygulaYapi, uygulaTekil, bilinmeyen]);

  // Bekleyen tamponu değerlendir: daha uzun token mümkünse bekle, değilse çöz.
  const tamponuDegerlendir = useCallback(() => {
    const dizi = bekleyenDiziRef.current;
    if (!dizi.length) return;
    const mdf = modifierBak(dizi);
    const bar = barlineBak(dizi);
    const yap = yapiBak(dizi);
    if (!(mdf.onek || bar.onek || yap.onek)) { zorlaCoz(); return; }

    // Daha uzun token mümkün. Tampon ŞU AN tam bir yorum taşıyor mu?
    const tamYorum = Boolean(mdf.tam) || Boolean(bar.tam) || Boolean(yap.tam)
      || (dizi.length === 1 && (tekHucreCoz(dizi[0]) != null || REVERSE.modifierByCellKey.has(dizi[0]) || REVERSE.yapiByCellKey?.has(dizi[0])));

    setSonDecodeMetni(tamYorum
      ? 'işaret tanındı — sonraki hücreyle uzatabilirsiniz…'
      : 'çok hücreli işaret: tamamlayıcı hücreyi yazın…');
    clearTimeout(cozTimerRef.current);
    cozTimerRef.current = setTimeout(zorlaCoz, tamYorum ? BEKLE_UZATILABILIR : BEKLE_TAMAMLAYICI);
  }, [zorlaCoz]);

  const hucreAlindi = useCallback((dots) => {
    const dash = dotsToDash(dots);
    const yeni = [...bekleyenDiziRef.current, dash];
    const mdf = modifierBak(yeni);
    const bar = barlineBak(yeni);
    const yap = yapiBak(yeni);

    // Yeni hücre mevcut diziyi uzatıyor (ön-ek ya da tam) → tampona al, değerlendir.
    if (mdf.onek || bar.onek || yap.onek || mdf.tam || bar.tam || yap.tam) {
      bekleyenDiziRef.current = yeni;
      tamponuDegerlendir();
      return;
    }
    // Uzatmıyor → önce eski tamponu en uzun eşleşmeyle bitir, sonra yeni hücreyi taze değerlendir.
    if (bekleyenDiziRef.current.length) { clearTimeout(cozTimerRef.current); zorlaCoz(); }
    bekleyenDiziRef.current = [dash];
    tamponuDegerlendir();
  }, [zorlaCoz, tamponuDegerlendir]);

  // ── İmleç gezinme / silme ───────────────────────────────────────────────────
  const imleceTasi = useCallback((yon) => {
    const ids = navOgeIdleri();
    if (!ids.length) { konus('öğe yok', { kesintiyle: true }); return; }
    const cur = caretIdRef.current;
    const idx = cur ? ids.indexOf(cur) : -1;
    let yeni;
    if (idx < 0) yeni = yon === 'ileri' ? ids[0] : ids[ids.length - 1];
    else if (yon === 'ileri') {
      if (idx >= ids.length - 1) { konus('son öğe', { kesintiyle: true }); return; }
      yeni = ids[idx + 1];
    } else {
      if (idx <= 0) { konus('ilk öğe', { kesintiyle: true }); return; }
      yeni = ids[idx - 1];
    }
    caretIdRef.current = yeni;
    setSeciliOgeId?.(yeni);
    konus(ogeEtiketiAl(yeni) || 'öğe', { kesintiyle: true });
  }, [setSeciliOgeId]);

  const imlecSil = useCallback((yon) => {
    const ids = navOgeIdleri();
    const cur = caretIdRef.current;
    if (!cur || !ids.length) { konus('silinecek öğe yok', { kesintiyle: true }); return; }
    // Klef / zaman imzası başlangıç işaretleri gerçek öğe değildir → silinemez (yanıltıcı
    // "silindi" duyurusu yapma; imleci sonraki gerçek öğeye taşı).
    if (cur === 'ANAHTAR_BAS' || cur === 'ZAMAN_IMZA') {
      const hedef = ids.find((id) => id !== 'ANAHTAR_BAS' && id !== 'ZAMAN_IMZA') || null;
      if (hedef) { caretIdRef.current = hedef; setSeciliOgeId?.(hedef); }
      konus('başlangıç işareti silinemez', { kesintiyle: true });
      return;
    }
    const idx = ids.indexOf(cur);
    if (idx < 0) { konus('silinecek öğe yok', { kesintiyle: true }); return; }
    // Komşu imleci GERÇEK öğeler (klef/zaman sentinel'leri hariç) arasından seç → silince imleç
    // "başlangıç işaretine" düşüp ölçü braille görünümünü boşaltmasın; gerçek nota/sus'ta kalsın.
    const gercekMi = (id) => id && id !== 'ANAHTAR_BAS' && id !== 'ZAMAN_IMZA';
    const onceki = ids.slice(0, idx).reverse().find(gercekMi);
    const sonraki = ids.slice(idx + 1).find(gercekMi);
    const komsu = yon === 'geri' ? (onceki ?? sonraki ?? null) : (sonraki ?? onceki ?? null);
    konus(`${ogeEtiketiAl(cur) || 'öğe'} silindi`, { kesintiyle: true });
    ogeleriSil?.(cur);
    caretIdRef.current = komsu;
    setSeciliOgeId?.(komsu);
    // Silme satır sayısını değiştirip paneli yeniden-portallayabilir (textarea remount).
    // Odağı `yazimAlaniRef` callback'i (yeni node mount olunca) geri verir; ek olarak anlık dene.
    odakIstendiRef.current = true;
    window.requestAnimationFrame(() => { if (document.activeElement !== perkinsRef.current) perkinsRef.current?.focus(); });
  }, [ogeleriSil, setSeciliOgeId]);

  const olcuCizgisiEkle = useCallback(() => {
    const oge = manuelOlcuCizgisiEkle?.(caretIdRef.current);
    if (oge?.id) caretIdRef.current = oge.id;
    duyurVeGecmis('ölçü çizgisi', '│', 'barline');
  }, [manuelOlcuCizgisiEkle, duyurVeGecmis]);

  const modDegistir = useCallback((yeni) => {
    const m = yeni || (modRef.current === 'ekleme' ? 'duzeltme' : 'ekleme');
    setMod(m);
    konus(m === 'duzeltme'
      ? 'Düzeltme modu: akor imleçteki notayı değiştirir'
      : 'Ekleme modu: akor imleçten sonra yeni öğe ekler',
      { kesintiyle: true });
  }, []);

  // ── Klavye ──────────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase();
    odakIstendiRef.current = true; // kullanıcı yazım alanında — remount sonrası odağı koru
    if (key === 'escape')    { e.preventDefault(); odakIstendiRef.current = false; kapat(); return; }
    if (key === 'tab')       return;
    if (key === 'f2')        { e.preventDefault(); modDegistir(); return; }
    if (key === 'arrowleft')  { e.preventDefault(); imleceTasi('geri');  return; }
    if (key === 'arrowright') { e.preventDefault(); imleceTasi('ileri'); return; }
    if (key === ' ' || e.code === 'Space') { e.preventDefault(); olcuCizgisiEkle(); return; }
    if (key === 'delete')    { e.preventDefault(); imlecSil('ileri'); return; }
    if (key === 'backspace') {
      e.preventDefault();
      if (pendingRef.current.size > 0 || bekleyenDiziRef.current.length > 0) {
        pendingRef.current.clear();
        pressedRef.current.clear();
        bekleyenDiziRef.current = [];
        clearTimeout(cozTimerRef.current);
        setAktifDotlar(new Set());
        setSonDecodeMetni('');
      } else {
        imlecSil('geri');
      }
      return;
    }
    const dot = PERKINS[key];
    if (dot !== undefined) {
      e.preventDefault();
      if (!e.repeat) {
        pressedRef.current.add(dot);
        pendingRef.current.add(dot);
        setAktifDotlar(new Set(pressedRef.current));
      }
      return;
    }
    e.preventDefault();
  }, [kapat, modDegistir, imleceTasi, imlecSil, olcuCizgisiEkle]);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    const dot = PERKINS[key];
    if (dot !== undefined) {
      pressedRef.current.delete(dot);
      setAktifDotlar(new Set(pressedRef.current));
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (pressedRef.current.size === 0 && pendingRef.current.size > 0) {
        const dots = [...pendingRef.current].sort((a, b) => a - b);
        pendingRef.current.clear();
        hucreAlindi(dots);
      }
    }, 15);
  }, [hucreAlindi]);

  const aktifDotSirali = [...aktifDotlar].sort((a, b) => a - b);
  const olcuEtiketi = aktifOlcuNo ? `${aktifOlcuNo}. ölçü` : null;

  if (!acik || !hedefNode) return null;

  const SEKMELER = [
    { id: 'notalar', label: 'Notalar' },
    { id: 'baslik',  label: 'Başlık' },
  ];

  const kart = (
    <div
      className="perkins-kart"
      data-perkins-panel="true"
      role="group"
      aria-label="Braille yazım paneli"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); kapat(); } }}
    >
      {/* Üst çubuk */}
      <div className="perkins-kart-bar">
        <span className="perkins-kart-baslik">
          <span className="perkins-kart-ikon" aria-hidden="true">⠿</span>
          <span>Braille Yazım</span>
          {olcuEtiketi && <span className="perkins-kart-olcu">{olcuEtiketi}</span>}
        </span>
        <div className="perkins-seg" role="tablist" aria-label="Yazım bölümü">
          {SEKMELER.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`perkins-tab-${id}`}
              id={`perkins-tabbutton-${id}`}
              className={`perkins-seg-btn${tab === id ? ' aktif' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="perkins-kart-kapat"
          onClick={kapat}
          aria-label="Braille yazım modunu kapat (Escape)"
          title="Kapat (Escape)"
        >✕</button>
      </div>

      {/* Notalar sekmesi */}
      {tab === 'notalar' && (
        <div
          id="perkins-tab-notalar"
          role="tabpanel"
          aria-labelledby="perkins-tabbutton-notalar"
          className="perkins-notalar"
        >
          <div className="perkins-durum">
            <div className="perkins-mod" role="group" aria-label="Yazım modu">
              <button
                type="button"
                className={`perkins-mod-btn${mod === 'ekleme' ? ' aktif' : ''}`}
                aria-pressed={mod === 'ekleme'}
                onClick={() => modDegistir('ekleme')}
              >Ekleme</button>
              <button
                type="button"
                className={`perkins-mod-btn${mod === 'duzeltme' ? ' aktif' : ''}`}
                aria-pressed={mod === 'duzeltme'}
                onClick={() => modDegistir('duzeltme')}
              >Düzeltme</button>
            </div>
            <span className="perkins-imlec" aria-hidden="true">
              İmleç: <b>{caretEtiket || '—'}</b>
            </span>
          </div>

          <div className="perkins-decode-satir">
            <span
              id="perkins-decode-bolge"
              className={`perkins-decode${sonDecodeMetni ? ' dolu' : ''}`}
              aria-live="off"
            >
              {sonDecodeMetni || 'Hücre bekleniyor…'}
            </span>
            {aktifDotSirali.length > 0 && (
              <span className="perkins-aktif-nokta" aria-hidden="true">{aktifDotSirali.join('-')}</span>
            )}
            {pendingBilgi && <span className="perkins-oktav-rozet">{pendingBilgi}</span>}
          </div>

          <textarea
            ref={yazimAlaniRef}
            className="perkins-klavye-alan"
            rows={1}
            value=""
            onChange={() => {}}
            onFocus={() => { odakIstendiRef.current = true; }}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            aria-label="Braille Perkins klavye giriş alanı"
            aria-describedby="perkins-decode-bolge perkins-sr-rehber"
            placeholder="F D S / J K L birlikte basıp bırakın · Boşluk ölçü çizgisi · ← → imleç · ⌫ sil"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <span id="perkins-sr-rehber" className="sr-only">
            Sol el: F birinci nokta, D ikinci nokta, S üçüncü nokta.
            Sağ el: J dördüncü nokta, K beşinci nokta, L altıncı nokta.
            Tuşları aynı anda basılı tutup bırakınca hücre eklenir; dinamik, nüans ve süslemeler için
            birden çok hücre arka arkaya yazılır. Boşluk ölçü çizgisi ekler, ok tuşları imleci taşır,
            Backspace siler, F2 düzeltme moduna geçer, Escape çıkar.
          </span>

          {/* İmlecin bulunduğu ölçünün CANLI braille'i — skorla senkron (silince kalkar,
              ölçü değişince yenilenir). İmleçteki hücreler vurgulanır. */}
          {olcuHucreleri.length > 0 ? (
            <div className="perkins-gecmis">
              <p className="perkins-gecmis-baslik">
                {gosterilenOlcuNo ? `${gosterilenOlcuNo}. ölçü Braille` : 'Ölçü Braille'} ({olcuHucreleri.length})
              </p>
              <div className="perkins-gecmis-liste" aria-label={`${gosterilenOlcuNo || ''}. ölçü Braille hücreleri`}>
                {olcuHucreleri.map((h, i) => (
                  <span
                    key={`${h.ogeId}-${i}`}
                    className={`perkins-gecmis-hucre${h.caretMi ? ' caret' : ''}`}
                    title={h.label}
                    aria-label={h.caretMi ? `${h.label}, imleç` : h.label}
                  >
                    {h.unicode}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="perkins-gecmis-baslik" aria-live="polite">
              {gosterilenOlcuNo ? `${gosterilenOlcuNo}. ölçü boş` : 'Bu ölçüde henüz Braille yok'}
            </p>
          )}
        </div>
      )}

      {/* Başlık sekmesi */}
      {tab === 'baslik' && (
        <div
          id="perkins-tab-baslik"
          role="tabpanel"
          aria-labelledby="perkins-tabbutton-baslik"
          className="perkins-form"
        >
          <div className="perkins-alan">
            <label htmlFor="pk-title">Eser Adı</label>
            <input
              id="pk-title"
              type="text"
              value={muzikHeader?.title || ''}
              onChange={e => setMuzikHeader?.(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Eser adını giriniz"
            />
          </div>
          <div className="perkins-alan">
            <label htmlFor="pk-composer">Besteci</label>
            <input
              id="pk-composer"
              type="text"
              value={muzikHeader?.composer || ''}
              onChange={e => setMuzikHeader?.(prev => ({ ...prev, composer: e.target.value }))}
              placeholder="Besteci adı"
            />
          </div>
          <div className="perkins-alan">
            <label htmlFor="pk-tempo">Tempo</label>
            <input
              id="pk-tempo"
              type="text"
              value={muzikHeader?.tempo || ''}
              onChange={e => setMuzikHeader?.(prev => ({ ...prev, tempo: e.target.value }))}
              placeholder="Örn: Andante, Allegro"
            />
          </div>
          <div className="perkins-alan">
            <label htmlFor="pk-zaman">Zaman İmzası</label>
            <input
              id="pk-zaman"
              type="text"
              defaultValue={muzikHeader?.timeSignature?.ad || '4/4'}
              onBlur={e => setTimeSignature?.(e.target.value)}
              placeholder="Örn: 4/4, 3/4, 6/8"
            />
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(kart, hedefNode);
}

// ── Skor yardımcıları (modül seviyesi) ───────────────────────────────────────
function navOgeIdleri() {
  return [...document.querySelectorAll('.araclar-muzik-skor-svg [data-nav]')]
    .map((el) => el.getAttribute('data-oge-id'))
    .filter(Boolean);
}

function ogeEtiketiAl(id) {
  if (!id) return '';
  let esc;
  try { esc = (window.CSS && CSS.escape) ? CSS.escape(id) : id; } catch { esc = id; }
  const el = document.querySelector(`.araclar-muzik-skor-svg [data-oge-id="${esc}"][data-nav]`);
  return (el?.getAttribute('aria-label') || '')
    .replace(/^Nota:\s*/, '')
    .replace(/^Sus:\s*/, 'sus ');
}
