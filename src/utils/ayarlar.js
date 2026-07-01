// Kullanıcı ayarları (localStorage'da saklanır) ve global olay yayını.

const ANAHTAR = 'braille-ayarlar-v1';

const VARSAYILAN = {
  konusmaHizi: 0.95,   // 0.5 - 1.5
  yaziBoyutu: 17,      // px (16 - 32)
  sesAcik: false,      // ⚠ tarayıcı seslendirme (Web Speech TTS) KALDIRILDI — daima kapalı.
                       // İçeriği yalnız ekran okuyucu (NVDA) okur. Kur'an/Müzik SES KAYITLARI
                       // (ogeSesiCal — gerçek dosya/piyano) buna BAĞLI DEĞİL, çalışmaya devam eder.
  sesEfektiAcik: true, // tıklama / doğru / yanlış ses efektleri (TTS'ten ayrı, korunur)
  titresimAcik: true,
  tema: 'normal',      // 'normal' | 'lowVision'
  tonejsSes: false,    // müzik piyano sesini Tone.js motoruyla çal
  notaOdakPiyano: true, // notaya odaklanınca/tıklayınca piyanodan çal (erişilebilirlik)
  notaTusDuzeni: 'alfabetik', // müzik klavye: 'alfabetik' (a=la,b=si,c=do,d=re,e=mi,f=fa,g=sol) | 'piyano' (a=do,s=re,d=mi,f=fa,g=sol,h=la,j=si)
  muzikGruplama: true, // BRF müzik: nota gruplaması (kiriş) varsayılanı — yeni skorlar bunu alır; yazarken Ayarlar'dan kapatılabilir
  gizliModuller: []    // gizlenen modüllerin id listesi
};

// Eski tema isimlerini yeni şemaya çevir (geri uyumluluk).
function temayiNormalleştir(t) {
  if (t === 'lowVision' || t === 'normal') return t;
  if (t === 'dark') return 'lowVision';
  if (t === 'light') return 'normal';
  return 'normal';
}

let ayarlar = yukle();

function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return { ...VARSAYILAN };
    const okunan = { ...VARSAYILAN, ...JSON.parse(ham) };
    okunan.tema = temayiNormalleştir(okunan.tema);
    okunan.sesAcik = false; // tarayıcı seslendirme kaldırıldı — eski kayıtlı 'true' değerini yok say
    return okunan;
  } catch {
    return { ...VARSAYILAN };
  }
}

function kaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(ayarlar)); } catch {}
}

const dinleyiciler = new Set();

export function ayarlariAl() {
  return { ...ayarlar };
}

export function ayarGuncelle(yama) {
  const temiz = { ...yama };
  delete temiz.sesAcik; // tarayıcı seslendirme daima kapalı — dışarıdan açılamaz
  ayarlar = { ...ayarlar, ...temiz };
  kaydet();
  uygulaCss();
  dinleyiciler.forEach((fn) => fn(ayarlar));
}

export function ayarlariSifirla() {
  ayarlar = { ...VARSAYILAN };
  kaydet();
  uygulaCss();
  dinleyiciler.forEach((fn) => fn(ayarlar));
}

export function ayarlariDinle(fn) {
  dinleyiciler.add(fn);
  return () => dinleyiciler.delete(fn);
}

export function uygulaCss() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    '--font-base',
    `${ayarlar.yaziBoyutu}px`
  );
  document.documentElement.setAttribute('data-theme', ayarlar.tema || 'normal');
}

uygulaCss();
