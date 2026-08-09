import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import {
  buyukHarfIsaretiMi,
  hucreleriMetneCevirKisaltmali,
  noktalariAnahtara,
  sayiIsaretiMi,
} from '../utils/brailleCevir.js';
import {
  birHarfAra, kokIsaretiMi, ikiHarfBirinciMi, parcaBirinciMi,
  heceAra, ikiHarfAra, kokAra, parcaAra,
} from '../utils/kisaltmaCevir.js';
import { NOKTALAMA, OZEL_ISARETLER } from '../data/braille.js';

const isaretAdiniOku = (ad) => ad.replace(/\s*\([^)]*\)\s*/g, ' ').trim().toLocaleLowerCase('tr');

const NOKTALAMA_ANONSLARI = new Map(
  NOKTALAMA.map((isaret) => [noktalariAnahtara(isaret.noktalar), isaret.isim])
);

const TEK_HUCRE_OZEL_ANONSLARI = new Map(
  OZEL_ISARETLER
    .filter((isaret) => isaret.hucreler?.length === 1)
    .map((isaret) => [noktalariAnahtara(isaret.hucreler[0]), isaretAdiniOku(isaret.ad)])
);

const COK_HUCRE_OZEL_ANONSLARI = OZEL_ISARETLER
  .filter((isaret) => isaret.hucreler?.length > 1)
  .map((isaret) => ({
    ad: isaretAdiniOku(isaret.ad),
    anahtarlar: isaret.hucreler.map((hucre) => noktalariAnahtara(hucre)),
  }))
  .sort((a, b) => b.anahtarlar.length - a.anahtarlar.length);

// Hücre işaret anonsunu, harfin/rakamın yanında gösterilecek kompakt görsel etikete çevirir.
const ISARET_GORSEL_ETIKET = {
  'sayı işareti': '#',
  'büyük harf işareti': '⇧',
};

// Normal modda tüm hücre dizisini metne çevirir (sayı/büyük harf modu boyunca takip edilir).
function normalModMetni(hucreler) {
  const durum = yeniYazmaDurumu();
  let out = '';
  for (const noktalar of hucreler) {
    const r = hucreyiIsle(durum, noktalar);
    if (r.tip === 'karakter' && r.deger !== null) out += r.deger;
  }
  return out;
}

// Normal modda son eklenen hücrenin bağlam içindeki çözümü (seslendirme için).
function normalSonHucreBilgisi(hucreler) {
  const durum = yeniYazmaDurumu();
  let son = null;
  for (const noktalar of hucreler) son = hucreyiIsle(durum, noktalar);
  return son;
}

// NORMAL mod: her hücreyi tek tek etiketler — boşluk hücreleri ayıraç, dolu hücreler
// ise altında anlamı (harf / rakam / işaret). Tek liste → hücreler doğal olarak alt satıra kayar.
function birlesikEtiketler(hucreler) {
  const durum = yeniYazmaDurumu();
  return hucreler.map((noktalar) => {
    const r = hucreyiIsle(durum, noktalar); // boşlukta da çağrılır → sayı/büyük harf modunu sıfırlar
    if (!noktalar || noktalar.length === 0) return { tip: 'bosluk' };
    if (r.tip === 'isaret') return { tip: 'hucre', hucre: noktalar, etiket: ISARET_GORSEL_ETIKET[r.anons] || r.anons, isaret: true };
    // ⚠ Tanınmayan hücrede etiket BOŞ (kullanıcı: "bilmediği yazımlara ? ekliyor, ? gelmesin").
    // Eskiden '?' yazılıyordu; kullanıcı henüz yazmakta olduğu bir dizinin ara hücresinde bile
    // hata yapmış gibi görünüyordu. Hücre yine çizilir (yazdığını görür), yalnız altındaki
    // anlam etiketi boş kalır — boşluk hücresiyle aynı davranış (satır 69). Render'daki
    // `{e.etiket || ' '}` sayesinde kutu yüksekliği korunur, hizalama bozulmaz.
    // NOT: metin çıktısı (`normalModMetni`) tanınmayan hücreyi zaten ATLIYOR; sesli anons da
    // "tanımsız hücre" diyor → '?' yalnız bu görsel etikette kalmıştı.
    if (r.tip === 'bilinmeyen' || r.deger === null) return { tip: 'hucre', hucre: noktalar, etiket: '', isaret: false };
    return { tip: 'hucre', hucre: noktalar, etiket: r.deger === ' ' ? '' : r.deger, isaret: false };
  });
}

// KISALTMA mod: hücreleri kelime bloklarına böler; her bloğun altında TANINAN kısaltma/
// kelime gösterilir (per-cell harf değil — Modül 10 ile aynı çözücü: hucreleriMetneCevirKisaltmali).
function kisaltmaSegmentler(hucreler, sistemler) {
  const segmentler = [];
  let i = 0;
  while (i < hucreler.length) {
    if ((hucreler[i] || []).length === 0) { segmentler.push({ tip: 'bosluk', baslangic: i }); i++; continue; }
    const baslangic = i; // imleç çizimi için grubun global hücre indeksi
    const grup = [];
    while (i < hucreler.length && (hucreler[i] || []).length > 0) { grup.push(hucreler[i]); i++; }
    const sonGrup = i >= hucreler.length; // hâlâ yazılmakta olan son kelime
    const kelime = hucreleriMetneCevirKisaltmali(grup, sistemler, sonGrup ? { sonTekHarfBeklet: true } : {});
    segmentler.push({ tip: 'grup', hucreler: grup, kelime, baslangic });
  }
  return segmentler;
}

// Serbest yazma: kullanıcı istediğini yazar; her karakter anında seslendirilir.
// Kısaltma modunda hece, bir harfli, iki harfli, kök ve parça kısaltmaları da tanınır.
export default function YazmaSerbest() {
  const [metin, setMetin] = useState('');
  const [brailleHucreleri, setBrailleHucreleri] = useState([]);
  // Tek doğruluk kaynağı: yazılan tüm hücreler. Metin de, birleşik görünüm de
  // bundan türer; böylece 2 satır sınırında son hücre temiz geri alınabilir.
  const hucrelerRef = useRef([]);
  const birlesikRef = useRef(null);
  const [dolu, setDolu] = useState(false); // iki satır doldu — yeni girişi engelle
  // İmleç: 0..N arası EKLEME NOKTASI (soldaki hücre sayısı). Yeni hücre imlecin
  // konumuna eklenir; Sil imlecin SOLUNDAKİ hücreyi siler; ok tuşları gezdirir.
  const [imlec, setImlec] = useState(0);
  const imlecRef = useRef(0);
  const imleciAyarla = (n) => {
    const deger = Math.max(0, Math.min(n, hucrelerRef.current.length));
    imlecRef.current = deger;
    setImlec(deger);
  };

  // Kısaltma modu: localStorage'a kaydedilir
  const [kisaltmaModu, setKisaltmaModu] = useState(
    () => localStorage.getItem('serbestKisaltmaModu') === '1'
  );

  // Hangi kısaltma sistemleri aktif (localStorage'a kaydedilir)
  const SISTEM_VARSAYILAN = { hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true };
  const [kisaltmaSistemler, setKisaltmaSistemler] = useState(() => {
    const saved = localStorage.getItem('serbestKisaltmaSistemler');
    if (!saved) return { ...SISTEM_VARSAYILAN };
    try { return { ...SISTEM_VARSAYILAN, ...JSON.parse(saved) }; } catch { return { ...SISTEM_VARSAYILAN }; }
  });
  const [sistemPaneli, setSistemPaneli] = useState(false);
  const sistemPaneliRef = useRef(null);
  const gorunumPanelStyle = { width: '100%', maxWidth: 'none', alignSelf: 'stretch' };

  const sistemToggle = (key) => setKisaltmaSistemler((prev) => {
    const yeni = { ...prev, [key]: !prev[key] };
    localStorage.setItem('serbestKisaltmaSistemler', JSON.stringify(yeni));
    return yeni;
  });

  const sonHucreBekliyorMu = (hucreler, sistemler) => {
    const son = hucreler[hucreler.length - 1];
    if (!son || son.length === 0) return false;
    return (
      (sistemler.kok && kokIsaretiMi(son)) ||
      (sistemler.ikiHarf && ikiHarfBirinciMi(son)) ||
      (sistemler.parca && parcaBirinciMi(son))
    );
  };

  const kisaltmaIsaretiAnonsu = (noktalar, hucreler = hucrelerRef.current, kisaltmali = kisaltmaModu) => {
    const anahtar = noktalariAnahtara(noktalar);
    if (anahtar === '5') return 'kelime kökü kısaltma işareti';
    if (anahtar === '4,5' || anahtar === '5,6') return 'kelime parçası kısaltma işareti';
    if (kisaltmali && anahtar === '3' && hucreler.length >= 2) {
      const onceki = hucreler[hucreler.length - 2];
      if (onceki && birHarfAra(onceki)) return 'kısaltma ek ayırma işareti';
    }
    if (kisaltmali && ikiHarfBirinciMi(noktalar)) return 'iki harfli kısaltma başlangıcı';
    return null;
  };

  const cokHucreliOzelAnonsu = (hucreler) => {
    for (const isaret of COK_HUCRE_OZEL_ANONSLARI) {
      if (hucreler.length < isaret.anahtarlar.length) continue;
      const sonHucreler = hucreler.slice(-isaret.anahtarlar.length);
      const eslesti = sonHucreler.every(
        (hucre, index) => noktalariAnahtara(hucre) === isaret.anahtarlar[index]
      );
      if (eslesti) return isaret.ad;
    }
    return null;
  };

  const hucreAnlamAnonsu = (noktalar, hucreler = hucrelerRef.current, kisaltmali = kisaltmaModu) => {
    const cokHucreliAnons = cokHucreliOzelAnonsu(hucreler);
    if (cokHucreliAnons) return cokHucreliAnons;
    const kisaltmaAnonsu = kisaltmaIsaretiAnonsu(noktalar, hucreler, kisaltmali);
    if (kisaltmaAnonsu) return kisaltmaAnonsu;
    if (sayiIsaretiMi(noktalar)) return 'sayı işareti';
    if (buyukHarfIsaretiMi(noktalar)) return 'büyük harf işareti';
    const anahtar = noktalariAnahtara(noktalar);
    return NOKTALAMA_ANONSLARI.get(anahtar) || TEK_HUCRE_OZEL_ANONSLARI.get(anahtar) || null;
  };

  // Metni mevcut hücrelerden (tek kaynak) yeniden türetir; mod ve sistemlere göre.
  const metniYenile = (hucreler = hucrelerRef.current, mod = kisaltmaModu, sistemler = kisaltmaSistemler) => {
    const yeniMetin = mod
      ? hucreleriMetneCevirKisaltmali(hucreler, sistemler, { sonTekHarfBeklet: true })
      : normalModMetni(hucreler);
    setMetin(yeniMetin);
    return yeniMetin;
  };

  const sinirdaKisaltmaAnonsu = (hucreler = hucrelerRef.current) => {
    if (!kisaltmaSistemler.birHarf) return null;
    const sonBosluk = hucreler.map((hucre) => hucre.length === 0).lastIndexOf(true);
    const sonKelimeHucreleri = hucreler.slice(sonBosluk + 1).filter((hucre) => hucre.length > 0);
    if (sonKelimeHucreleri.length !== 1) return null;
    const kelime = birHarfAra(sonKelimeHucreleri[0]);
    return kelime ? `${kelime} kelimesi kısaltma olarak algılandı.` : null;
  };

  // Mod / kısaltma sistemleri değişince, AYNI hücreler yeni moda göre yeniden yorumlanır.
  useEffect(() => {
    metniYenile(hucrelerRef.current, kisaltmaModu, kisaltmaSistemler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kisaltmaSistemler, kisaltmaModu]);

  // Panel dışına tıklandığında kapat
  useEffect(() => {
    if (!sistemPaneli) return;
    const handle = (e) => {
      if (sistemPaneliRef.current && !sistemPaneliRef.current.contains(e.target))
        setSistemPaneli(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [sistemPaneli]);

  const kisaltmaModuToggle = () => {
    const yeni = !kisaltmaModu;
    localStorage.setItem('serbestKisaltmaModu', yeni ? '1' : '0');
    konus(yeni ? 'Kısaltma modu açık.' : 'Kısaltma modu kapalı.', { kesintiyle: true });
    // Yazılan hücreler korunur; mod değişince effect onları yeni moda göre çözer.
    setKisaltmaModu(yeni);
  };

  useEffect(() => {
    konus(
      'Serbest yazma. İstediğiniz harfleri yazabilirsiniz. ' +
      'Bir harfi yazmak için, o harfin nokta düğmelerine ' +
      'aynı anda parmaklarınızla basıp birlikte bırakın. ' +
      'Her hücre okunacaktır. Tüm metni dinlemek için Onay düğmesine basın. ' +
      'Boşluk için Boşluk, silmek için Sil düğmesini kullanın. ' +
      'Sol ve sağ ok tuşlarıyla yazdıklarınız içinde gezinebilirsiniz; ' +
      'yazılan hücrelere dokunarak da imleci o hücrenin üzerine götürebilirsiniz. ' +
      'Sil imlecin solundaki, Delete sağındaki hücreyi siler. ' +
      'Yeni hücre imlecin bulunduğu yere eklenir.'
    );
    const tekrar = () => konus(
      'Serbest yazma modu. Bir harfin tüm noktalarına aynı anda basıp birlikte bırakın. ' +
      'Onay düğmesi tüm metni okur.',
      { kesintiyle: true }
    );
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      konusmayiDurdur();
    };
  }, []);

  const doluUyar = () => konus('İki satır doldu, silerek devam edin.', { kesintiyle: true });

  // İmlecin geçtiği/sildiği hücrenin sesli karşılığı — bağlam (sayı/büyük harf modu)
  // hücre dizisinin başından o hücreye kadar yürütülerek çözülür.
  // Kısaltma modunda hücrenin KISALTMA karşılığı (hece / iki harfli / kök / parça).
  // Normal-mod çözücüsü (hucreyiIsle) bu hücreleri bilmez → "tanımsız hücre" kalıyordu
  // (kullanıcı: "kısaltma aktifken hâlâ tanımsız diye etiketliyor" — [3,4] = ma hecesi).
  const kisaltmaHucreAnonsu = (hucreler, idx) => {
    const noktalar = hucreler[idx];
    const onceki = idx > 0 && (hucreler[idx - 1] || []).length > 0 ? hucreler[idx - 1] : null;
    if (onceki) {
      if (kisaltmaSistemler.kok && kokIsaretiMi(onceki)) {
        const kok = kokAra(noktalar);
        if (kok) return `${kok} kelime kökü kısaltması`;
      }
      if (kisaltmaSistemler.ikiHarf) {
        const iki = ikiHarfAra(onceki, noktalar);
        if (iki) return `${iki} kısaltması`;
      }
      if (kisaltmaSistemler.parca) {
        // parcaAra ünlü uyumu varyantlarını virgülle döndürür ("ları, leri") —
        // etikette ilk varyant yeter (kesin karşılık kelime etiketinde görünür).
        const parca = parcaAra(onceki, noktalar);
        if (parca) return `${parca.split(',')[0].trim()} eki kısaltması`;
      }
    }
    if (kisaltmaSistemler.hece) {
      const hece = heceAra(noktalar);
      if (hece) return `${hece} hece kısaltması`;
    }
    return null;
  };

  // Tek harfli kısaltma: hücre normal modda HARF olarak çözülür ("a") ama kısaltma
  // modunda metne KELİME olarak girer ("aynı") → etiket de kısaltmayı söylemeli.
  // Decoder kuralının aynısı: kelime BAŞINDA + kelimenin kalanı yok / yalnız noktalama
  // ("var.") / [3] ek ayırma işareti ("v" + [3] + ek).
  const birHarfKisaltmaAnonsu = (hucreler, idx) => {
    if (!kisaltmaSistemler.birHarf) return null;
    const kelime = birHarfAra(hucreler[idx]);
    if (!kelime) return null;
    if (idx > 0 && (hucreler[idx - 1] || []).length > 0) return null; // kelime başı değil
    const kalan = [];
    for (let i = idx + 1; i < hucreler.length && (hucreler[i] || []).length > 0; i++) {
      kalan.push(hucreler[i]);
    }
    if (kalan.length === 0) return `${kelime} kısaltması`;
    if (noktalariAnahtara(kalan[0]) === '3') return `${kelime} kısaltması`; // + ek
    const hepsiNoktalama = kalan.every((h) => NOKTALAMA_ANONSLARI.has(noktalariAnahtara(h)));
    return hepsiNoktalama ? `${kelime} kısaltması` : null;
  };

  const hucreAnonsuAt = (hucreler, idx) => {
    const noktalar = hucreler[idx];
    if (!noktalar || noktalar.length === 0) return 'boşluk';
    const durum = yeniYazmaDurumu();
    let r = null;
    for (let i = 0; i <= idx; i++) r = hucreyiIsle(durum, hucreler[i]);
    const ozel = hucreAnlamAnonsu(noktalar, hucreler.slice(0, idx + 1), kisaltmaModu);
    if (r && r.tip === 'isaret') return ozel || r.anons;
    if (!r || r.tip === 'bilinmeyen' || r.deger === null) {
      return ozel
        || (kisaltmaModu && kisaltmaHucreAnonsu(hucreler, idx))
        || 'tanımsız hücre';
    }
    // Harf/rakam çözüldü — ama kısaltma modunda bu hücre tek harfli kısaltma olabilir.
    if (kisaltmaModu) {
      const birHarf = birHarfKisaltmaAnonsu(hucreler, idx);
      if (birHarf) return birHarf;
    }
    return r.anons;
  };

  const imlecSol = () => {
    const h = hucrelerRef.current;
    const i = imlecRef.current;
    if (i <= 0) { konus('metnin başındasınız', { kesintiyle: true }); return; }
    imleciAyarla(i - 1);
    konus(hucreAnonsuAt(h, i - 1), { kesintiyle: true });
  };

  const imlecSag = () => {
    const h = hucrelerRef.current;
    const i = imlecRef.current;
    if (i >= h.length) { konus('metnin sonundasınız', { kesintiyle: true }); return; }
    imleciAyarla(i + 1);
    konus(hucreAnonsuAt(h, i), { kesintiyle: true });
  };

  // Dolu noktaların özeti: "1 ve 2 numaralı noktalar" (BrailleCell pasifOzet ile aynı biçim).
  const noktaOzeti = (noktalar) => {
    const s = [...(noktalar || [])].sort((a, b) => a - b);
    if (s.length === 0) return '';
    const liste = s.length === 1 ? String(s[0]) : `${s.slice(0, -1).join(', ')} ve ${s[s.length - 1]}`;
    return `${liste} numaralı ${s.length === 1 ? 'nokta' : 'noktalar'}`;
  };

  // Görünümdeki hücre butonunun erişilebilir adı: "2. hücre: b, 1 ve 2 numaralı noktalar".
  // ⚠ İçerideki .cell role=img etiketi BUTONUN adına EKLENMEZ (aria-label içeriği ezer)
  // → nokta bileşimi butonun kendi etiketinde taşınmalı (kullanıcı beklentisi).
  const hucreSecimEtiketi = (index) => {
    const noktalar = hucrelerRef.current[index];
    const anlam = hucreAnonsuAt(hucrelerRef.current, index);
    if (!noktalar || noktalar.length === 0) return `${index + 1}. hücre: boşluk`;
    return `${index + 1}. hücre: ${anlam}, ${noktaOzeti(noktalar)}`;
  };

  // Hücreye ODAKLANMAK/dokunmak yeter: imleç o hücrenin ARKASINA gelir → Sil o hücreyi
  // siler. Enter/Space hücrede ÖZEL işlem YAPMAZ — BrailleKlavye'nin global kısayolları
  // (Space=boşluk, Enter=Onay/tümünü oku) hücre odaktayken de aynen çalışır (kullanıcı:
  // "space ve enter çalışmalı; imleç braille alanına geçtiğimde aktif olmalı").
  const hucreSec = (index) => {
    imleciAyarla(index + 1);
  };

  const onHucre = (noktalar) => {
    if (dolu) { doluUyar(); return; }
    const i = imlecRef.current;
    const hucreler = [...hucrelerRef.current.slice(0, i), noktalar, ...hucrelerRef.current.slice(i)];
    hucrelerRef.current = hucreler;
    imleciAyarla(i + 1);
    setBrailleHucreleri(hucreler);
    metniYenile(hucreler);
    // Anonslar "son yazılan" bağlamına bakar → imlece kadarki ÖNEK verilir
    // (araya eklemede eklenen hücre önekin sonuncusudur).
    const onek = hucreler.slice(0, i + 1);

    if (kisaltmaModu) {
      const anlamAnonsu = hucreAnlamAnonsu(noktalar, onek, true);
      if (sonHucreBekliyorMu(onek, kisaltmaSistemler)) {
        konus(anlamAnonsu || 'ikinci hücreyi bekliyor', { kesintiyle: true });
      } else if (anlamAnonsu) {
        konus(anlamAnonsu, { kesintiyle: true });
      } else {
        const cozum = hucreleriMetneCevirKisaltmali(onek, kisaltmaSistemler, { sonTekHarfBeklet: true });
        const sonKelime = cozum.trim().split(/\s+/).filter(Boolean).at(-1);
        konus(sonKelime || 'hücre işlendi', { kesintiyle: true });
      }
      return;
    }

    // Normal mod: eklenen hücrenin bağlam içindeki çözümünü seslendir
    const r = normalSonHucreBilgisi(onek);
    const anlamAnonsu = hucreAnlamAnonsu(noktalar, [noktalar], false);
    if (r && r.tip === 'isaret') {
      konus(anlamAnonsu || r.anons, { kesintiyle: true });
    } else if (!r || r.tip === 'bilinmeyen' || r.deger === null) {
      konus(anlamAnonsu || 'tanımsız hücre', { kesintiyle: true });
    } else {
      konus(anlamAnonsu || r.anons, { kesintiyle: true });
    }
  };

  const onBosluk = () => {
    if (dolu) { doluUyar(); return; }
    const i = imlecRef.current;
    const kisaltmaAnonsu = kisaltmaModu ? sinirdaKisaltmaAnonsu(hucrelerRef.current.slice(0, i)) : null;
    const hucreler = [...hucrelerRef.current.slice(0, i), [], ...hucrelerRef.current.slice(i)];
    hucrelerRef.current = hucreler;
    imleciAyarla(i + 1);
    setBrailleHucreleri(hucreler);
    metniYenile(hucreler);
    konus((kisaltmaModu && kisaltmaAnonsu) || 'boşluk', { kesintiyle: true });
  };

  // Sil (Backspace): imlecin SOLUNDAKİ hücreyi siler; imleç sonda ise eski davranışla aynı.
  const onSil = () => {
    const h = hucrelerRef.current;
    if (h.length === 0) {
      konus('metin boş', { kesintiyle: true });
      return;
    }
    const i = imlecRef.current;
    if (i === 0) {
      konus('metnin başındasınız', { kesintiyle: true });
      return;
    }
    const silinen = hucreAnonsuAt(h, i - 1);
    const hucreler = [...h.slice(0, i - 1), ...h.slice(i)];
    hucrelerRef.current = hucreler;
    imleciAyarla(i - 1);
    setBrailleHucreleri(hucreler);
    metniYenile(hucreler);
    setDolu(false); // bir hücre silindi: yeniden yer açıldı
    konus(`${silinen} silindi`, { kesintiyle: true });
  };

  // Delete: imlecin SAĞINDAKİ hücreyi siler (ileri silme).
  const onSilIleri = () => {
    const h = hucrelerRef.current;
    const i = imlecRef.current;
    if (i >= h.length) {
      konus(h.length === 0 ? 'metin boş' : 'metnin sonundasınız', { kesintiyle: true });
      return;
    }
    const silinen = hucreAnonsuAt(h, i);
    const hucreler = [...h.slice(0, i), ...h.slice(i + 1)];
    hucrelerRef.current = hucreler;
    imleciAyarla(i);
    setBrailleHucreleri(hucreler);
    metniYenile(hucreler);
    setDolu(false);
    konus(`${silinen} silindi`, { kesintiyle: true });
  };

  // Ok tuşları: imleci gezdir; Delete: ileri sil. Braille nokta tuşlarını
  // BrailleKlavye yakalar (oklara dokunmaz) → çakışma yok.
  useEffect(() => {
    const keydown = (e) => {
      const hedef = e.target;
      if (hedef && (hedef.tagName === 'INPUT' || hedef.tagName === 'TEXTAREA' || hedef.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.code === 'ArrowLeft') { e.preventDefault(); imlecSol(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); imlecSag(); }
      else if (e.code === 'Delete') { if (e.repeat) return; e.preventDefault(); onSilIleri(); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kisaltmaModu, kisaltmaSistemler]);

  // Ekran okuyucu satırı: metin boşsa "boş"; SONDA boşluk hücresi varsa (kullanıcı bir
  // sonraki kelimeye başlamadan boşluk bıraktıysa) "boşluk" sözcüğüyle bitir — ekran
  // okuyucular sondaki boşluk karakterini yutuyor, kullanıcı boşluk bırakıp bırakmadığını
  // anlayamıyordu. Ortadaki boşluklar zaten kelime ayrımı olarak duyuluyor.
  const sonHucreBosluk = brailleHucreleri.length > 0
    && (brailleHucreleri[brailleHucreleri.length - 1] || []).length === 0;
  const srMetin = metin.trim().length === 0
    ? (sonHucreBosluk ? 'boşluk' : 'boş')
    : `${metin.replace(/\s+$/, '')}${sonHucreBosluk ? ' boşluk' : ''}`;

  const tumunuOku = () => {
    // metin state'i değil, senkron hucrelerRef'ten türet: Onay'a basıldığında bekleyen
    // tıklama hücresi yeni commit edildiyse (setMetin henüz uygulanmadan) güncel metin okunsun.
    const guncelMetin = kisaltmaModu
      ? hucreleriMetneCevirKisaltmali(hucrelerRef.current, kisaltmaSistemler, { sonTekHarfBeklet: true })
      : normalModMetni(hucrelerRef.current);
    if (guncelMetin.trim().length === 0) {
      konus('Henüz hiçbir şey yazmadınız.', { kesintiyle: true });
      return;
    }
    konus(guncelMetin, { kesintiyle: true });
  };

  const temizle = () => {
    hucrelerRef.current = [];
    imleciAyarla(0);
    setBrailleHucreleri([]);
    setMetin('');
    setDolu(false);
    konus('Metin temizlendi.', { kesintiyle: true });
  };

  // İki satır sınırı: yeni hücre üçüncü satıra taşarsa SON EKLENEN girişi (imlecin
  // solundaki hücreyi) geri al ve kilitle. Taşma yalnız ekleme sonrası oluşabilir.
  useLayoutEffect(() => {
    const el = birlesikRef.current;
    if (!el) return;
    const cocuklar = [...el.children].filter(
      (c) => c.offsetParent !== null && !c.classList.contains('kalan')
    );
    if (cocuklar.length === 0) return;
    const satirSayisi = new Set(cocuklar.map((c) => Math.round(c.offsetTop))).size;
    if (satirSayisi > 2 && hucrelerRef.current.length > 0) {
      const i = Math.max(1, imlecRef.current);
      const hucreler = [...hucrelerRef.current.slice(0, i - 1), ...hucrelerRef.current.slice(i)];
      hucrelerRef.current = hucreler;
      imleciAyarla(i - 1);
      setBrailleHucreleri(hucreler);
      metniYenile(hucreler);
      setDolu(true);
      doluUyar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brailleHucreleri]);

  return (
    <div className="page yazma-page serbest-yazma-page">
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Serbest Yazma" />
        <div className="progress" aria-hidden="true">
          {metin.length} karakter
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <div className="yazma-gorunum-panel" style={gorunumPanelStyle}>
          {/* Okuma kutusu görünmez; ekran okuyucu / tarayıcı seslendirmesi için canlı metin.
              ⚠ SONDAKİ BOŞLUK sözcükle bildirilir (kullanıcı: "boşluk bıraktık ve bir sonraki
              kelimeyi yazmaya başlamadık, okunabildiğimiz satırda boşluk karakteri görünmüyor,
              bir sonraki kelimeden önce boşluk bıraktık mı diye tereddüt oluşuyor"): ekran
              okuyucular metin sonundaki boşluğu YUTAR → sonda boşluk hücresi varsa metnin
              sonuna "boşluk" sözcüğü eklenir. Kelime ARASINDAKİ boşluklar zaten duyuluyor. */}
          <div
            className="sr-only"
            aria-live="polite"
            aria-label={`Yazılan metin: ${srMetin}`}
          >
            {srMetin}
          </div>

          {/* Braille hücreleri + anlamı. NORMAL mod: her hücrenin altında harf/rakam/işaret.
              KISALTMA mod: her kelime bloğunun altında TANINAN kısaltma/kelime.
              Görsel; ekran okuyucu yukarıdaki canlı metni okur. En fazla iki satır. */}
          <div className="yazma-braille-gorunum yazma-birlesik" ref={birlesikRef}>
            {brailleHucreleri.length === 0 ? (
              <span className="kalan yazma-baslangic-yonerge">Braille tuşlarına tıklayarak yazınız.</span>
            ) : kisaltmaModu ? (
              kisaltmaSegmentler(brailleHucreleri, kisaltmaSistemler).map((seg, index) =>
                seg.tip === 'bosluk' ? (
                  <React.Fragment key={index}>
                    {imlec === seg.baslangic && <span className="kalan yazma-imlec" />}
                    <button
                      type="button"
                      className="yazma-birlesik-bosluk yazma-hucre-secim"
                      onClick={() => hucreSec(seg.baslangic)}
                      onFocus={() => hucreSec(seg.baslangic)}
                      aria-label={hucreSecimEtiketi(seg.baslangic)}
                    />
                  </React.Fragment>
                ) : (
                  <div key={index} className="yazma-grup">
                    <div className="yazma-grup-satir">
                      {seg.hucreler.map((hucre, j) => (
                        <React.Fragment key={j}>
                          {imlec === seg.baslangic + j && <span className="yazma-imlec" />}
                          <button
                            type="button"
                            className="yazma-hucre-secim"
                            onClick={() => hucreSec(seg.baslangic + j)}
                            onFocus={() => hucreSec(seg.baslangic + j)}
                            aria-label={hucreSecimEtiketi(seg.baslangic + j)}
                          >
                            <BrailleCell
                              aktifNoktalar={hucre}
                              tiklanabilir={false}
                              kesfedilebilir={false}
                            />
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="yazma-grup-etiket">{seg.kelime || ' '}</span>
                  </div>
                )
              )
            ) : (
              birlesikEtiketler(brailleHucreleri).map((e, index) => (
                <React.Fragment key={index}>
                  {imlec === index && <span className="kalan yazma-imlec" />}
                  {e.tip === 'bosluk' ? (
                  <button
                    type="button"
                    className="yazma-birlesik-bosluk yazma-hucre-secim"
                    onClick={() => hucreSec(index)}
                    onFocus={() => hucreSec(index)}
                    aria-label={hucreSecimEtiketi(index)}
                  />
                ) : (
                  <button
                    type="button"
                    className="yazma-hucre-kutu yazma-hucre-secim"
                    onClick={() => hucreSec(index)}
                    onFocus={() => hucreSec(index)}
                    aria-label={hucreSecimEtiketi(index)}
                  >
                    <BrailleCell
                      aktifNoktalar={e.hucre}
                      tiklanabilir={false}
                      kesfedilebilir={false}
                    />
                    <span
                      className={`yazma-hucre-etiket${e.isaret ? ' yazma-hucre-etiket-isaret' : ''}`}
                    >
                      {e.etiket || ' '}
                    </span>
                  </button>
                )}
                </React.Fragment>
              ))
            )}
            {brailleHucreleri.length > 0 && imlec >= brailleHucreleri.length && (
              <span className="kalan yazma-imlec" />
            )}
          </div>
        </div>

        {/* Dikeyde klavye burada inline; yatayda CSS ile gizlenir */}
        <div className="klavye-inline">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={tumunuOku}
            siralikTiklama
            aksiyonOncesiTiklamayiCommitEt
          />
        </div>
      </div>

      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
          <button className="btn" type="button" onClick={tumunuOku}>Tümünü Oku</button>
          <button className="btn" type="button" onClick={temizle}>Temizle</button>
          <div className="kisaltma-btn-grup" ref={sistemPaneliRef}>
            <button
              type="button"
              className={`btn kisaltma-mod-btn ${kisaltmaModu ? 'aktif' : ''}`}
              aria-pressed={kisaltmaModu}
              onClick={kisaltmaModuToggle}
              title="Kısaltmaları tanı ve kısaltma kullanarak yaz"
            >Kısaltma</button>
            <button
              type="button"
              className={`btn ${'kisaltma-sistem-acilis-btn' + (kisaltmaModu && sistemPaneli ? ' aktif' : '') + (kisaltmaModu ? '' : ' disabled')}`}
              onClick={() => kisaltmaModu && setSistemPaneli((v) => !v)}
              title="Hangi kısaltma sistemleri aktif?"
              aria-expanded={sistemPaneli}
              aria-label="Kısaltma sistemleri"
            >▾</button>
            {kisaltmaModu && sistemPaneli && (
              <div className="kisaltma-sistem-panel" role="menu">
                <p className="kisaltma-sistem-panel-baslik">Kısaltma Sistemleri</p>
                {[
                  { key: 'hece',     label: 'Hece Kısaltmaları' },
                  { key: 'birHarf',  label: 'Bir Harfli Kısaltmalar' },
                  { key: 'ikiHarf',  label: 'İki Harfli Kısaltmalar' },
                  { key: 'kok',      label: 'Kelime Kökü Kısaltmaları' },
                  { key: 'parca',    label: 'Kelime Parçası Kısaltmaları' },
                ].map(({ key, label }) => (
                  <label key={key} className="kisaltma-sistem-satir">
                    <input
                      type="checkbox"
                      checked={kisaltmaSistemler[key]}
                      onChange={() => sistemToggle(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yatayda tam ekran şeffaf popup klavye (dokunmatik).
          klavyeAcik={false}: fiziksel klavye olaylarını yalnız inline klavye yakalasın
          (iki klavye de window dinlerse her tuş iki kez işlenip metin ikileniyordu). */}
      <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
        <BrailleKlavye
          onHucre={onHucre}
          onBosluk={onBosluk}
          onSil={onSil}
          onEnter={tumunuOku}
          anindaDokunma
          klavyeAcik={false}
        />
      </div>
    </div>
  );
}
