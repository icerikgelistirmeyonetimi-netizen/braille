import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA,
} from '../data/braille.js';
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  hucreyiSiraSayisiRakaminaCevir,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
  tekKucukHarfIsaretiMi,
  tarihAyirmaIsaretiMi,
  tarihHucreAraligi,
  duzeltmeYabanciHarfIsaretiMi,
  duzeltmeliHucreyiMetneCevir,
  tekHarfIsaretiSonrasiHarfOkuma,
  ikiHarfliKisaltmaOkunusunuYumusat,
  kelimeKokuOkunusunuYorIcinDuzelt,
  matematikIsaretiSayiModunuKorurMu,
  matematikSembolHucreEslesmesi,
  noktalariAnahtara,
} from './brailleCevir.js';

// ─── BRF → nokta dizisi ────────────────────────────────────────────────────
function brfNoktalaradon(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0x20 || code > 0x5f) return null;
  const bits = code - 0x20;
  const noktalar = [];
  for (let i = 0; i < 6; i++) {
    if (bits & (1 << i)) noktalar.push(i + 1);
  }
  return noktalar;
}

// ─── Ters arama tabloları ──────────────────────────────────────────────────
const _KISALTMA_TEK = new Map(
  KELIME_KISALTMALARI.map((k) => [
    [...k.noktalar].sort((a, b) => a - b).join(','),
    k.kelime,
  ])
);
const _KISALTMA_IKI = (() => {
  const m = new Map();
  for (const k of IKI_HARFLI_KISALTMALAR) {
    const key =
      [...k.sol].sort((a, b) => a - b).join(',') +
      '|' +
      [...k.sag].sort((a, b) => a - b).join(',');
    m.set(key, k.kelime);
  }
  return m;
})();
const _HECE_TERS = new Map(
  HECE_KISALTMALARI.map((h) => [
    [...h.noktalar].sort((a, b) => a - b).join(','),
    h.hece,
  ])
);

const _KOK_SAG_MAP = new Map(
  KELIME_KOKU_KISALTMALARI.map((k) => [
    [...k.sag].sort((a, b) => a - b).join(','),
    k,
  ])
);

const _PARCA_MAP = new Map(
  KELIME_PARCASI_KISALTMALARI.map((p) => [
    [...p.sol].sort((a, b) => a - b).join(',') + '|' + [...p.sag].sort((a, b) => a - b).join(','),
    p,
  ])
);

const _NOKTA_TERS = new Map(
  NOKTALAMA.map((n) => [
    [...n.noktalar].sort((a, b) => a - b).join(','),
    n.isaret,
  ])
);

// Ünlü uyumuna göre doğru ek varyantını seç
const _ARKA_UNLU = new Set(['a', 'ı', 'o', 'u']);
const _ON_UNLU   = new Set(['e', 'i', 'ö', 'ü']);
const _DUZ_UNLU  = new Set(['a', 'e', 'ı', 'i']);
const _YUV_UNLU  = new Set(['o', 'ö', 'u', 'ü']);
const _TUM_UNLU  = new Set([..._ARKA_UNLU, ..._ON_UNLU]);
function _unluUyumuSec(ekler, oncekiMetin) {
  const variants = ekler.split(',').map((s) => s.trim());
  if (variants.length <= 1) return variants[0] || '';
  const oncekiKucuk = (oncekiMetin || '').toLocaleLowerCase('tr');
  if (oncekiKucuk.endsWith('bu') && variants.includes('gün')) return 'gün';
  let sonUnlu = null;
  for (let k = oncekiMetin.length - 1; k >= 0; k--) {
    if (_TUM_UNLU.has(oncekiMetin[k])) { sonUnlu = oncekiMetin[k]; break; }
  }
  if (!sonUnlu) return variants[0];
  const arkaVar = _ARKA_UNLU.has(sonUnlu);
  const yuvVar  = _YUV_UNLU.has(sonUnlu);
  for (const v of variants) {
    const ilkUnlu = [...v].find((c) => _TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    const ilkArka = _ARKA_UNLU.has(ilkUnlu);
    const ilkYuv  = _YUV_UNLU.has(ilkUnlu);
    if (ilkArka === arkaVar && ilkYuv === yuvVar) return v;
  }
  for (const v of variants) {
    const ilkUnlu = [...v].find((c) => _TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    if (_ARKA_UNLU.has(ilkUnlu) === arkaVar) return v;
  }
  return variants[0];
}

export function brfMetinedonSistemi(icerik, kisaltmali, sistemler = {}) {
  const {
    hece: heceAktif = true,
    birHarf: birHarfAktif = true,
    ikiHarf: ikiHarfAktif = true,
    kok: kokAktif = true,
    parca: parcaAktif = true,
  } = sistemler;
  const satirlar = icerik.split(/[\r\n\f]+/);
  let metin = '';
  let sayiModu = false;
  let siraSayiModu = false;
  let ciftListeVirgulle = false;
  let cListeSonTekIsaretSonrasi = false;
  let buyukHarfBekle = false;
  const noktalamaHucreMi = (hucre) => !!hucre && _NOKTA_TERS.has(noktalariAnahtara(hucre));
  const matematikSayiSinirAnahtarlari = new Set([
    '1,2', '3,4,6', '3,5,6', '1,4,6', '2,3,6', '1,2,4', '1,5', '2,3,4,6', '2,4,5,6',
    '1,2,6', '3,4,5', '3,4', '1,3,4,5,6', '1,3,5', '2,4,6', '2,3,5,6',
  ]);
  const sayiIsaretiOncesiSinirMi = (hucre) => (
    !hucre
    || hucre.length === 0
    || buyukHarfIsaretiMi(hucre)
    || noktalamaHucreMi(hucre)
    || matematikSayiSinirAnahtarlari.has(noktalariAnahtara(hucre))
  );
  const harfliSayiHarfOku = tekHarfIsaretiSonrasiHarfOkuma;
  
  if (kisaltmali) {
    const sayfalar = icerik.split(/\f/);
    const sayfaCiktilari = [];
    for (const sayfa of sayfalar) {
      const duzMetin = sayfa.replace(/[\r\n]+/g, '');
      if (!duzMetin.trim()) continue;
      const hucreleri = [];
      for (const ch of duzMetin) {
        const n = brfNoktalaradon(ch);
        if (n !== null) hucreleri.push(n);
      }
      const cikis = [];
      const tumBloklar = [];
      let blok = [];
      for (const n of hucreleri) {
        if (n.length === 0) { tumBloklar.push(blok); blok = []; }
        else blok.push(n);
      }
      if (blok.length) tumBloklar.push(blok);

      const bloklariIsle = (bRaw, sonrakiIlkHucre) => {
        if (bRaw.length === 0) return;
        let bashCase = 'normal';
        let b = bRaw;
        if (b.length >= 2 && buyukHarfIsaretiMi(b[0]) && buyukHarfIsaretiMi(b[1])) {
          bashCase = 'tumu'; b = b.slice(2);
        } else if (b.length >= 1 && buyukHarfIsaretiMi(b[0])) {
          bashCase = 'ilk'; b = b.slice(1);
        }
        if (b.length === 0) return;
        const kasala = (s) => {
          if (!s) return s;
          if (bashCase === 'tumu') return s.toLocaleUpperCase('tr');
          if (bashCase === 'ilk') return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
          return s;
        };

        const ilkKey = [...b[0]].sort((x, y) => x - y).join(',');
        if (birHarfAktif && b.length === 1) {
          if (_KISALTMA_TEK.has(ilkKey)) { cikis.push(kasala(_KISALTMA_TEK.get(ilkKey))); return; }
        }
        if (ikiHarfAktif && b.length === 2 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const a = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(kasala(_KISALTMA_IKI.get(a))); return; }
        }
        const buf = [];
        let ci = 0;
        let sM = false, siraSM = false, bH = (bashCase === 'ilk'), bHTumu = (bashCase === 'tumu');
        let ciftListeVirgulle = false;
        let cListeSonTekIsaretSonrasi = false;
        let duzeltmeBekle = false;
        let ikiHarfPrefixIndex = -1;
        let kokPrefixIndex = -1;
        if (ikiHarfAktif && b.length >= 3 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const ikiKey = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(ikiKey)) {
            let ikiKelime = _KISALTMA_IKI.get(ikiKey);
            if (bHTumu) ikiKelime = ikiKelime.toLocaleUpperCase('tr');
            else if (bH) ikiKelime = ikiKelime.charAt(0).toLocaleUpperCase('tr') + ikiKelime.slice(1).toLocaleLowerCase('tr');
            buf.push(ikiKelime);
            ikiHarfPrefixIndex = buf.length - 1;
            bH = false;
            ci = 2;
          }
        }
        if (birHarfAktif && b.length >= 3 && ci === 0 && _KISALTMA_TEK.has(ilkKey)) {
          const ikinciKey = [...b[1]].sort((x, y) => x - y).join(',');
          if (ikinciKey === '3') {
            let tekKelime = _KISALTMA_TEK.get(ilkKey);
            if (bHTumu) tekKelime = tekKelime.toLocaleUpperCase('tr');
            else if (bH) tekKelime = tekKelime.charAt(0).toLocaleUpperCase('tr') + tekKelime.slice(1).toLocaleLowerCase('tr');
            buf.push(tekKelime);
            bH = false;
            ci = 2;
          }
        }
        if (kokAktif && b.length >= 2 && ilkKey === '5') {
          const sagKey = [...b[1]].sort((x, y) => x - y).join(',');
          const kok = _KOK_SAG_MAP.get(sagKey);
          if (kok) {
            let kk = kok.kelime;
            if (bashCase === 'tumu') kk = kk.toLocaleUpperCase('tr');
            else if (bashCase === 'ilk') kk = kk.charAt(0).toLocaleUpperCase('tr') + kk.slice(1);
            buf.push(kk);
            kokPrefixIndex = buf.length - 1;
            if (bashCase === 'ilk') { bashCase = 'normal'; bH = false; }
            ci = 2;
          }
        }
        const harfYaz = (h) => {
          if (!h) return;
          if (bHTumu) buf.push(h.toLocaleUpperCase('tr'));
          else if (bH) {
            buf.push(h.charAt(0).toLocaleUpperCase('tr') + h.slice(1).toLocaleLowerCase('tr'));
            bH = false;
          }
          else buf.push(h.toLocaleLowerCase('tr'));
        };
        const tekHarfIsaretliOku = (cellIndex) => {
          if (cellIndex !== 0 || !tekKucukHarfIsaretiMi(b[cellIndex])) return null;
          let harfIndex = cellIndex + 1;
          let buyuk = false;
          if (harfIndex < b.length && buyukHarfIsaretiMi(b[harfIndex])) {
            buyuk = true;
            harfIndex++;
          }
          if (harfIndex >= b.length) return null;
          const harf = hucreyiKarakteryap(b[harfIndex]);
          if (!harf || harf === ' ') return null;
          const sonraki = harfIndex + 1 < b.length ? b[harfIndex + 1] : null;
          if (sonraki && !_NOKTA_TERS.has([...sonraki].sort((x, y) => x - y).join(','))) return null;
          return {
            metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
            sonrakiIndex: harfIndex + 1,
          };
        };
        while (ci < b.length) {
          const noktalar = b[ci];
          const islemIsareti = matematikSembolHucreEslesmesi(b, ci);
          if (islemIsareti) {
            buf.push(islemIsareti.sembol);
            sM = sM && matematikIsaretiSayiModunuKorurMu(islemIsareti);
            siraSM = false;
            bH = false;
            bHTumu = false;
            if (!sM) {
              ciftListeVirgulle = false;
              cListeSonTekIsaretSonrasi = false;
            }
            ci += islemIsareti.hucreler.length;
            continue;
          }
          const tekHarf = !sM ? tekHarfIsaretliOku(ci) : null;
          if (tekHarf) {
            buf.push(tekHarf.metin);
            ci = tekHarf.sonrakiIndex;
            continue;
          }
          if (duzeltmeBekle) {
            harfYaz(duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar));
            duzeltmeBekle = false;
            ci++;
            continue;
          }
          if (duzeltmeYabanciHarfIsaretiMi(noktalar)) {
            duzeltmeBekle = true;
            ci++;
            continue;
          }
          if (noktalar.length === 0) {
            buf.push(' ');
            sM = false;
            siraSM = false;
            bH = false;
            bHTumu = false;
            ciftListeVirgulle = false;
            cListeSonTekIsaretSonrasi = false;
            ci++;
            continue;
          }
          if (sayiIsaretiMi(noktalar)) {
            const sonraki = ci + 1 < b.length ? b[ci + 1] : null;
            if (sonraki && sayiIsaretiMi(sonraki)) {
              ci += 2;
              sM = true;
              siraSM = false;
              ciftListeVirgulle = true;
              cListeSonTekIsaretSonrasi = false;
              continue;
            }
            const sonrakDigit = sonraki && hucreyiRakamayap(sonraki);
            const sonrakSira = sonraki && hucreyiSiraSayisiRakaminaCevir(sonraki);
            const sonrakHarfliSayi = harfliSayiHarfOku(b, ci + 1);
            const onceki = ci > 0 ? b[ci - 1] : null;
            if ((sayiIsaretiOncesiSinirMi(onceki) || ciftListeVirgulle) && (sonrakDigit || sonrakSira || sonrakHarfliSayi)) {
              if (ciftListeVirgulle) {
                ciftListeVirgulle = false;
                cListeSonTekIsaretSonrasi = true;
              }
              sM = true;
              siraSM = !!sonrakSira && !sonrakDigit;
              ci++;
              continue;
            }
          }
          if (buyukHarfIsaretiMi(noktalar)) {
            if (ci + 1 < b.length && buyukHarfIsaretiMi(b[ci + 1])) {
              bHTumu = true; ci += 2;
            } else {
              bH = true; ci++;
            }
            continue;
          }
          if (sM) {
            const harfliSayiHarf = !siraSM ? harfliSayiHarfOku(b, ci) : null;
            if (harfliSayiHarf) {
              buf.push(harfliSayiHarf.metin);
              ci = harfliSayiHarf.sonrakiIndex;
              continue;
            }
            const r = hucreyiRakamayap(noktalar);
            if (!siraSM && r) { buf.push(r); ci++; continue; }
            const kVirgulMu = [...noktalar].sort((x, y) => x - y).join(',') === '2';
            if (!siraSM && kVirgulMu && ciftListeVirgulle) {
              buf.push(',');
              ci++;
              continue;
            }
            if (!siraSM && kVirgulMu && !ciftListeVirgulle && ci + 1 < b.length && hucreyiRakamayap(b[ci + 1])) {
              buf.push(',');
              ci++;
              continue;
            }
            let sia = ci;
            let siraTxt = '';
            while (siraSM && sia < b.length) {
              const sr = hucreyiSiraSayisiRakaminaCevir(b[sia]);
              if (!sr) break;
              siraTxt += sr;
              sia++;
            }
            if (siraTxt.length > 0) {
              buf.push(siraTxt);
              const sn = sia < b.length ? b[sia] : null;
              const kesmeMi = sn && noktalariAnahtara(sn) === '3';
              if (!kesmeMi) buf.push('.');
              sM = false;
              siraSM = false;
              ci = sia;
              continue;
            }
            if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(b, ci)) { buf.push('.'); ci++; continue; }
            if (!siraSM && tarihAyirmaIsaretiMi(noktalar) && ci + 1 < b.length && hucreyiRakamayap(b[ci + 1])) {
              buf.push('-');
              ci++;
              continue;
            }
            const nA = noktalariAnahtara(noktalar);
            if (!siraSM && nA === '3') {
              if (ci + 1 < b.length && hucreyiRakamayap(b[ci + 1])) {
                buf.push('.');
                ci++;
                continue;
              } else {
                buf.push("'");
                ci++;
                continue;
              }
            }
            const sayiIciNoktalama = !siraSM ? _NOKTA_TERS.get(nA) : null;
            if (sayiIciNoktalama) {
              buf.push(sayiIciNoktalama);
              ci++;
              continue;
            }
            sM = false;
            siraSM = false;
            if (cListeSonTekIsaretSonrasi) {
              cListeSonTekIsaretSonrasi = false;
              ciftListeVirgulle = false;
            }
          }
          if (parcaAktif && ci > 0 && ci + 1 < b.length) {
            const nKey = [...noktalar].sort((x, y) => x - y).join(',');
            if (nKey === '4,5' || nKey === '5,6') {
              const sagKey = [...b[ci + 1]].sort((x, y) => x - y).join(',');
              const parca = _PARCA_MAP.get(nKey + '|' + sagKey);
              if (parca) { buf.push(_unluUyumuSec(parca.ekler, buf.join(''))); ci += 2; continue; }
            }
          }
          const hA = [...noktalar].sort((a, b) => a - b).join(',');
          const np = _NOKTA_TERS.get(hA);
          const heceKarsiligi = heceAktif && !sM ? _HECE_TERS.get(hA) : undefined;
          if (np && heceKarsiligi) {
            const ilkHucre = ci === 0;
            const sonHucre = ci === b.length - 1;
            let kalanHepsiNoktalama = true;
            for (let kk = ci + 1; kk < b.length; kk++) {
              const kkA = [...b[kk]].sort((a, b) => a - b).join(',');
              if (!_NOKTA_TERS.has(kkA)) { kalanHepsiNoktalama = false; break; }
            }
            let noktalamaKullan = false;
            if (ilkHucre && hA === '2,3,6') noktalamaKullan = true;
            else if (sonHucre || kalanHepsiNoktalama) {
              if (hA === '2,6' && sonHucre) {
                noktalamaKullan = sonrakiIlkHucre == null || buyukHarfIsaretiMi(sonrakiIlkHucre);
              } else {
                noktalamaKullan = true;
              }
            }
            if (noktalamaKullan) buf.push(np);
            else harfYaz(heceKarsiligi);
          } else if (np) {
            buf.push(np);
          } else if (heceKarsiligi) {
            harfYaz(heceKarsiligi);
          } else {
            const h = hucreyiKarakteryap(noktalar);
            harfYaz(h);
          }
          ci++;
        }
        if (ikiHarfPrefixIndex >= 0) {
          const sonrakiMetin = buf.slice(ikiHarfPrefixIndex + 1).join('');
          buf[ikiHarfPrefixIndex] = ikiHarfliKisaltmaOkunusunuYumusat(buf[ikiHarfPrefixIndex], sonrakiMetin);
        }
        if (kokPrefixIndex >= 0) {
          const sonrakiMetin = buf.slice(kokPrefixIndex + 1).join('');
          buf[kokPrefixIndex] = kelimeKokuOkunusunuYorIcinDuzelt(buf[kokPrefixIndex], sonrakiMetin);
        }
        cikis.push(buf.join(''));
      };

      for (let bi = 0; bi < tumBloklar.length; bi++) {
        if (bi > 0) cikis.push(' ');
        const sonrakiIlkHucre = bi + 1 < tumBloklar.length ? (tumBloklar[bi + 1][0] ?? null) : null;
        bloklariIsle(tumBloklar[bi], sonrakiIlkHucre);
      }
      sayfaCiktilari.push(cikis.join(''));
    }
    return sayfaCiktilari.join('\n').trim();
  }

  for (const satir of satirlar) {
    if (!satir.trim()) {
      metin += '\n';
      sayiModu = false;
      siraSayiModu = false;
      ciftListeVirgulle = false;
      cListeSonTekIsaretSonrasi = false;
      continue;
    }
    let tumKelimeBuyuk = false;
    let duzeltmeBekle = false;
    const satirHucreleri = Array.from(satir)
      .map((ch) => brfNoktalaradon(ch))
      .filter((noktalar) => noktalar !== null);
    const tekHarfIsaretliOku = (cellIndex) => {
      if (!tekKucukHarfIsaretiMi(satirHucreleri[cellIndex])) return null;
      let harfIndex = cellIndex + 1;
      let buyuk = false;
      if (harfIndex < satirHucreleri.length && buyukHarfIsaretiMi(satirHucreleri[harfIndex])) {
        buyuk = true;
        harfIndex++;
      }
      if (harfIndex >= satirHucreleri.length) return null;
      const harf = hucreyiKarakteryap(satirHucreleri[harfIndex]);
      if (!harf || harf === ' ') return null;
      return {
        metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
        sonrakiIndex: harfIndex,
      };
    };
    for (let hi = 0; hi < satirHucreleri.length; hi++) {
      const noktalar = satirHucreleri[hi];
      if (noktalar.length === 0) {
        metin += ' '; sayiModu = false; siraSayiModu = false;
        ciftListeVirgulle = false;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false; tumKelimeBuyuk = false; duzeltmeBekle = false; continue;
      }
      const islemIsareti = matematikSembolHucreEslesmesi(satirHucreleri, hi);
      if (islemIsareti) {
        metin += islemIsareti.sembol;
        hi += islemIsareti.hucreler.length - 1;
        sayiModu = sayiModu && matematikIsaretiSayiModunuKorurMu(islemIsareti);
        siraSayiModu = false;
        if (!sayiModu) {
          ciftListeVirgulle = false;
          cListeSonTekIsaretSonrasi = false;
        }
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        duzeltmeBekle = false;
        continue;
      }
      const tekHarf = !sayiModu ? tekHarfIsaretliOku(hi) : null;
      if (tekHarf) {
        metin += tekHarf.metin;
        hi = tekHarf.sonrakiIndex;
        sayiModu = false;
        siraSayiModu = false;
        ciftListeVirgulle = false;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false;
        continue;
      }
      if (duzeltmeBekle) {
        const harf = duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar);
        if (harf) {
          const buyuk = buyukHarfBekle || tumKelimeBuyuk;
          metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        }
        duzeltmeBekle = false;
        buyukHarfBekle = false;
        continue;
      }
      if (duzeltmeYabanciHarfIsaretiMi(noktalar)) { duzeltmeBekle = true; continue; }
      if (sayiIsaretiMi(noktalar)) {
        const sonra3456 = hi + 1 < satirHucreleri.length && sayiIsaretiMi(satirHucreleri[hi + 1]);
        if (sonra3456) {
          hi++;
          ciftListeVirgulle = true;
          cListeSonTekIsaretSonrasi = false;
          sayiModu = true;
          siraSayiModu = false;
          tumKelimeBuyuk = false;
          continue;
        }
        const sonrakiHucre = hi + 1 < satirHucreleri.length ? satirHucreleri[hi + 1] : null;
        const sonrakRakam = sonrakiHucre && hucreyiRakamayap(sonrakiHucre);
        const sonrakSira = sonrakiHucre && hucreyiSiraSayisiRakaminaCevir(sonrakiHucre);
        const sonrakHarfliSayi = harfliSayiHarfOku(satirHucreleri, hi + 1);
        const oncekiHucre = hi > 0 ? satirHucreleri[hi - 1] : null;
        if (!sayiIsaretiOncesiSinirMi(oncekiHucre) && !ciftListeVirgulle) {
          const harf = hucreyiKarakteryap(noktalar);
          if (harf) metin += harf;
          continue;
        }
        if (ciftListeVirgulle) {
          cListeSonTekIsaretSonrasi = true;
        }
        sayiModu = true;
        siraSayiModu = !!sonrakSira && !sonrakRakam && !sonrakHarfliSayi;
        tumKelimeBuyuk = false;
        continue;
      }
      if (buyukHarfIsaretiMi(noktalar)) {
        if (buyukHarfBekle) { tumKelimeBuyuk = true; buyukHarfBekle = false; }
        else { buyukHarfBekle = true; }
        continue;
      }
      if (sayiModu) {
        const harfliSayiHarf = !siraSayiModu ? harfliSayiHarfOku(satirHucreleri, hi) : null;
        if (harfliSayiHarf) {
          metin += harfliSayiHarf.metin;
          hi = harfliSayiHarf.sonrakiIndex - 1;
          continue;
        }
        const rakam = hucreyiRakamayap(noktalar);
        if (!siraSayiModu && rakam) { metin += rakam; continue; }
        const kVirgulMu = [...noktalar].sort((a, b) => a - b).join(',') === '2';
        if (!siraSayiModu && kVirgulMu && ciftListeVirgulle) {
          metin += ',';
          continue;
        }
        if (!siraSayiModu && kVirgulMu && !ciftListeVirgulle && hi + 1 < satirHucreleri.length && hucreyiRakamayap(satirHucreleri[hi + 1])) {
          metin += ',';
          continue;
        }
        let siraI = hi;
        let siraMetin = '';
        while (siraSayiModu && siraI < satirHucreleri.length) {
          const sr = hucreyiSiraSayisiRakaminaCevir(satirHucreleri[siraI]);
          if (!sr) break;
          siraMetin += sr;
          siraI++;
        }
        if (siraMetin.length > 0) {
          metin += siraMetin;
          const sono = siraI < satirHucreleri.length ? satirHucreleri[siraI] : null;
          const kesmeMi = sono && noktalariAnahtara(sono) === '3';
          if (!kesmeMi) metin += '.';
          sayiModu = false;
          siraSayiModu = false;
          hi = siraI - 1;
          continue;
        }
        if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(satirHucreleri, hi)) { metin += '.'; continue; }
        if (!siraSayiModu && tarihAyirmaIsaretiMi(noktalar) && hi + 1 < satirHucreleri.length && hucreyiRakamayap(satirHucreleri[hi + 1])) {
          metin += '-';
          continue;
        }
        const nA = noktalariAnahtara(noktalar);
        if (!siraSayiModu && nA === '3') {
          if (hi + 1 < satirHucreleri.length && hucreyiRakamayap(satirHucreleri[hi + 1])) {
            metin += '.';
            continue;
          } else {
            metin += "'";
            continue;
          }
        }
        const sayiIciNoktalama = !siraSayiModu ? _NOKTA_TERS.get(nA) : null;
        if (sayiIciNoktalama) {
          metin += sayiIciNoktalama;
          continue;
        }
        sayiModu = false;
        siraSayiModu = false;
        if (cListeSonTekIsaretSonrasi) {
          cListeSonTekIsaretSonrasi = false;
          ciftListeVirgulle = false;
        }
      }
      const harf = hucreyiKarakteryap(noktalar);
      if (harf) {
        const buyuk = buyukHarfBekle || tumKelimeBuyuk;
        metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        buyukHarfBekle = false;
      } else {
        tumKelimeBuyuk = false;
        buyukHarfBekle = false;
      }
    }
    metin += '\n';
  }
  return metin.trim();
}
