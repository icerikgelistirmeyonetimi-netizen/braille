// Telefon sağa-sola sallandığında 'yonergeTekrar' özel olayını fırlatır.
// X eksenindeki yön değişimlerini sayar (sallama = ileri-geri salınım).

let kuruldu = false;
let sonOlay = 0;
const ornekler = []; // {t, x}

const HIZ_ESIK = 4;        // m/s^2 hareket eşiği (gürültü filtresi)
const YON_DEGISIMI = 3;    // 1sn içinde gereken yön değişimi sayısı
const PENCERE = 1000;      // ms
const MIN_BEKLEME = 1500;  // ms

function dinleyici(e) {
  const a = e.acceleration || e.accelerationIncludingGravity;
  if (!a || a.x == null) return;
  const simdi = Date.now();
  // accelerationIncludingGravity geliyorsa yer çekimini kabaca çıkar
  let x = a.x || 0;
  if (!e.acceleration && e.accelerationIncludingGravity) {
    // basit yüksek geçiren filtre: ortalamayı çıkar
    if (ornekler.length) {
      let toplam = 0;
      for (const s of ornekler) toplam += s.ham;
      x = (a.x || 0) - toplam / ornekler.length;
    }
  }
  ornekler.push({ t: simdi, x, ham: a.x || 0 });
  while (ornekler.length && simdi - ornekler[0].t > PENCERE) ornekler.shift();
  if (ornekler.length < 4) return;

  // Yön değişimlerini say
  let degisim = 0;
  let oncekiYon = 0;
  for (const s of ornekler) {
    if (Math.abs(s.x) < HIZ_ESIK) continue;
    const yon = s.x > 0 ? 1 : -1;
    if (oncekiYon !== 0 && yon !== oncekiYon) degisim++;
    oncekiYon = yon;
  }

  if (degisim >= YON_DEGISIMI && simdi - sonOlay > MIN_BEKLEME) {
    sonOlay = simdi;
    ornekler.length = 0;
    window.dispatchEvent(new CustomEvent('yonergeTekrar'));
  }
}

function ekle() {
  if (!('DeviceMotionEvent' in window)) return;
  window.addEventListener('devicemotion', dinleyici, { passive: true });
}

export function sallamayiBaslat() {
  if (kuruldu) return;
  if (typeof window === 'undefined') return;
  kuruldu = true;

  // iOS 13+ izin ister
  if (typeof window.DeviceMotionEvent !== 'undefined' &&
      typeof window.DeviceMotionEvent.requestPermission === 'function') {
    const istek = () => {
      window.DeviceMotionEvent.requestPermission()
        .then((s) => { if (s === 'granted') ekle(); })
        .catch(() => {});
    };
    window.addEventListener('touchend', istek, { once: true });
    window.addEventListener('click', istek, { once: true });
    return;
  }

  ekle();
}
